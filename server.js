import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import NodeCache from 'node-cache';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Resend } from 'resend'; // Import Resend
import Stripe from 'stripe';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const cache = new NodeCache({ stdTTL: 3600 }); // Cache for 1 hour

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null; // Initialize Resend conditionally
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Supabase Setup
const supabaseUrl = process.env.SUPABASE_URL;
// Use the Service Role Key for backend operations to bypass RLS when inserting plans
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// --- Stripe Checkout Endpoint ---
app.post('/api/create-checkout-session', async (req, res) => {
    try {
        const { planType } = req.body;

        let unitAmount = 99; // Default $0.99
        let productName = 'One-Night Pass';
        let mode = 'payment';
        let recurring = undefined;

        if (planType === 'premium') {
            unitAmount = 999; // $9.99
            productName = 'Premium Membership';
            mode = 'subscription';
            recurring = { interval: 'month' };
        } else if (planType === 'lifetime') {
            unitAmount = 2999; // $29.99
            productName = 'Lifetime Access';
            mode = 'payment';
        } else if (planType === 'elite') {
            unitAmount = 9900; // $99.00
            productName = 'Elite Couples';
            mode = 'subscription';
            recurring = { interval: 'year' };
        } else if (planType === 'daily') {
            unitAmount = 199; // $1.99
            productName = 'Daily Date Pass';
            mode = 'payment';
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: productName,
                        description: planType === 'premium'
                            ? '✅ Plan unlimited dates\n✅ Unlock all venues & restaurants\n✅ Unlimited AI Date Customizer\n✅ Save unlimited favorites\n✅ Access to all cities\n✅ Early access to new features'
                            : '✅ Unlock full access to 1 premium date itinerary immediately on DateSpark.',
                    },
                    unit_amount: unitAmount,
                    ...(recurring && { recurring })
                },
                quantity: 1,
            }],
            mode: mode,
            success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?stripe_payment=success`,
            cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?stripe_payment=canceled`,
        });

        // Return session id for redirect
        res.json({ id: session.id, url: session.url });
    } catch (error) {
        console.error('Stripe Session Error:', error);
        res.status(500).json({ error: 'Failed to create checkout session' });
    }
});

// --- Feedback Endpoint ---
app.post('/api/feedback', async (req, res) => {
    const { text, userId, email } = req.body;

    if (!text) {
        return res.status(400).json({ error: 'Feedback text is required' });
    }

    try {
        if (resend) {
            await resend.emails.send({
                from: 'Feedback <onboarding@resend.dev>',
                to: process.env.ADMIN_EMAIL || 'eroldrayan@gmail.com', // fallback to eroldrayan if not set
                subject: 'New DateSpark Feedback 💡',
                html: `
                    <h3>New Feedback Received</h3>
                    <p><b>User Email:</b> ${email || 'Anonymous'}</p>
                    <p><b>User ID:</b> ${userId || 'N/A'}</p>
                    <p><b>Feedback:</b></p>
                    <p>${text}</p>
                `
            });
        } else {
            console.log("Resend not configured. Feedback Log:", text);
        }

        const { error } = await supabase
            .from('feedback')
            .insert({
                user_id: userId || null,
                email: email || null,
                text: text
            });

        if (error) {
            console.warn('Supabase feedback insert error (might not have table created):', error.message);
        }

        res.status(200).json({ message: 'Feedback sent successfully' });
    } catch (err) {
        console.error('Feedback route error:', err);
        res.status(200).json({ message: 'Feedback processed' }); // return 200 so UI succeeds if logged
    }
});

// --- Booking Link Helpers ---
const convertTo24Hour = (timeStr) => {
    if (!timeStr) return "19:00"; // Default 7 PM
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':');
    if (hours === '12') hours = '00';
    if (modifier === 'PM' || modifier === 'pm') hours = parseInt(hours, 10) + 12;
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
};

const createBookingUrl = (type, name, date, time) => {
    const d = date || new Date().toISOString().split('T')[0];
    const t = convertTo24Hour(time);
    const dateFormatted = d.replace(/\//g, '-'); // ensure YYYY-MM-DD

    if (type === 'restaurant' || type === 'dessert') {
        const params = new URLSearchParams({
            dateTime: `${dateFormatted}T${t}`,
            covers: '2',
            term: name
        });
        return { url: `https://www.opentable.com/s?${params.toString()}`, type: 'opentable' };
    } else if (type === 'event' || type === 'entertainment') {
        // Fallback to safe google query targeting tickets direct to seatgeek/ticketmaster
        const query = `${name} tickets ${dateFormatted}`;
        return { url: `https://www.google.com/search?q=${encodeURIComponent(query)}`, type: 'tickets' };
    }
    return { url: null, type: null };
};

// Routes
app.post('/api/waitlist', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        // 1. Check if email already exists
        const { data: existingUser, error: fetchError } = await supabase
            .from('waitlist')
            .select('email')
            .eq('email', email)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
            throw fetchError;
        }

        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // 2. Insert new email
        const { data, error } = await supabase
            .from('waitlist')
            .insert([{ email }])
            .select();

        if (error) throw error;

        // --- SEND WELCOME EMAIL ---
        try {
            if (resend) {
                await resend.emails.send({
                    from: 'DateSpark <onboarding@resend.dev>', // Must use approved domain or onboarding@resend.dev for testing
                    to: [email],
                    subject: 'Welcome to DateSpark – Let the Date Planning Begin! 💖',
                    html: `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 12px;">
                                <!-- REPLACE SRC WITH YOUR PUBLIC LOGO URL -->
                                <img src="https://via.placeholder.com/150x50?text=DateSpark" alt="DateSpark Logo" style="display: block; margin: 0 auto 20px auto; max-width: 140px;" />
                                
                                <h1 style="color: #1a1a1a; text-align: center; margin-top: 0;">Welcome to the Waitlist!</h1>
                            <p style="font-size: 16px; color: #4a4a4a; line-height: 1.6;">
                                Hey there! Thanks so much for signing up for <strong>DateSpark</strong>. We are thrilled to have you!
                            </p>
                            <p style="font-size: 16px; color: #4a4a4a; line-height: 1.6;">
                                We are currently grinding behind the scenes to roll out inside selected cities. To keep things moving for early testers:
                            </p>
                            <ul style="color: #4a4a4a; font-size: 15px;">
                                <li><strong>Follow us</strong> for absolute launch dates.</li>
                                <li>You'll get a <strong>FREE Custom AI Mode Plan</strong> as soon as access goes live.</li>
                                <li>Unlock 5 additional credits to test with absolute premium limits if you invite 2 friends later.</li>
                            </ul>
                            <p style="font-size: 16px; color: #4a4a4a;">
                                We'll let you know as soon as you're in!
                            </p>
                            <p style="text-align: center; margin-top: 30px;">
                                <a href="#" style="background-color: #f43f5e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Follow Updates</a>
                            </p>
                            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
                            <p style="font-size: 12px; color: #aaa; text-align: center;">You're receiving this because you signed up to join DateSpark Waitlist.</p>
                        </div>
                    `
                });
            } else {
                console.warn("Resend API Key not found. Skipping welcome email.");
            }
        } catch (emailErr) {
            console.error('Failed to send email due to Resend restriction:', emailErr.message);
            // We don't throw email errors so the user successfully completes waitlist joins regardless!
        }

        res.status(201).json({
            message: 'Successfully joined the waitlist!',
            position: Math.floor(Math.random() * 50) + 1 // Placeholder for position logic
        });
    } catch (error) {
        console.error('Supabase error:', error);
        res.status(500).json({ error: 'Failed to join waitlist. Please try again later.' });
    }
});

// AI Idea Generation (Gemini)
app.post('/api/suggest-date-concepts', async (req, res) => {
    const { conversationHistory, ideaCount = 3, userId } = req.body;

    if (!conversationHistory || !Array.isArray(conversationHistory) || conversationHistory.length === 0) {
        return res.status(400).json({ error: 'conversationHistory array is required' });
    }

    const validHistory = conversationHistory.filter(msg => msg && msg.text && msg.text.trim().length > 0);
    if (validHistory.length === 0) {
        return res.status(400).json({ error: 'Please enter a prompt to get started.' });
    }

    const cacheKey = `ai_concepts_${JSON.stringify(validHistory)}`;
    const cachedData = cache.get(cacheKey);
    let savedTitles = [];

    if (cachedData && userId) {
        try {
            // Check if user already saved any of the cached titles
            const { data: savedPlans } = await supabase
                .from('plans')
                .select('title')
                .eq('user_id', userId);

            savedTitles = savedPlans?.map(p => p.title.toLowerCase()) || [];
            const collision = cachedData.concepts.some(c => savedTitles.includes(c.title.toLowerCase()));

            if (!collision) {
                return res.status(200).json(cachedData); // No collision, serve cache
            }
        } catch (err) {
            console.error('Cache filter error:', err);
        }
    } else if (cachedData) {
        return res.status(200).json(cachedData);
    }

    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'Gemini API key is not configured in the server.' });
        }

        const genAI = new GoogleGenerativeAI(apiKey);

        let systemInstruction = `You are a premium date concierge in New York City. The user wants you to help them "Create their own date".
Generate EXACTLY ${ideaCount} distinct, high-level date concepts that fit their request and chat history.`;

        if (savedTitles.length > 0) {
            systemInstruction += `\nCRITICAL: DO NOT generate any ideas with titles that match these already saved titles: [${savedTitles.join(', ')}]. Give them completely fresh concepts.`;
        }

        systemInstruction += `\nCRITICAL INSTRUCTION: Even if the user's request is very short, vague, or just a few words, you MUST still generate exactly ${ideaCount} complete, creative concepts based on whatever clues they provided. NEVER complain about the input. NEVER ask for a longer prompt. NEVER use the word "prompt" or say more information is required to generate ideas.
Additionally, you MUST ask 1 or 2 friendly clarifying questions (e.g. "Do you prefer indoor or outdoor?", "What's your typical budget?") to help narrow down their exact preferences for the next iteration.

Return ONLY a valid JSON object formatted EXACTLY like this:
{
  "concepts": [
    {
      "title": "A short catchy title (e.g., 'Sushi & Jazz')",
      "description": "A 1-2 sentence description pitch.",
      "budgetStr": "Expected budget (e.g., '$150' or '$$')",
      "vibeCategory": "A short category (e.g., 'Romantic', 'Active')",
      "searchTerms": [
         "Term 1 (e.g., Dinner) MUST Apply Geographic Clustering (e.g., 'in West Village, NYC') AND Add Smart Fallbacks by adding OR (e.g. 'Anita Gelato OR dessert in West Village, NYC')",
         "Term 2 (e.g., Event)",
         "Term 3 (e.g., Dessert)"
      ],
      "durations": ["1.5 hours", "2 hours", "45 mins"]
    }
  ],
  "questions": [
    "Your first friendly clarifying question here?",
    "Your optional second friendly clarifying question here?"
  ]
}`;

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: { responseMimeType: "application/json" },
            systemInstruction
        });

        // Map frontend simple history to Gemini SDK format
        const contents = validHistory.map(msg => ({
            role: msg.role === 'ai' ? 'model' : 'user',
            parts: [{ text: msg.text }]
        }));

        const result = await model.generateContent({ contents });
        const text = result.response.text();

        // Try parsing JSON or return full text error if generation failed
        let parsedResponse;
        try {
            parsedResponse = JSON.parse(text);
        } catch (parseErr) {
            console.error('Gemini Parse Error:', text);
            throw new Error('AI returned an invalid format: ' + text);
        }

        cache.set(cacheKey, parsedResponse);
        res.status(200).json(parsedResponse);
    } catch (error) {
        console.error('Gemini Suggest Error (Full):', JSON.stringify(error, Object.getOwnPropertyNames(error)));

        // If it's a known Gemini error that we can safely send to the frontend
        if (error.message && error.message.includes('contents is not specified')) {
            return res.status(400).json({ error: 'Please enter a valid prompt.' });
        }

        const errorMessage = error?.response?.text() || error.message || 'Unknown AI Error';
        res.status(500).json({ error: 'Failed to generate concepts.', details: errorMessage });
    }
});

// Build Custom Itinerary from AI Concept
app.post('/api/generate-custom-date', async (req, res) => {
    const { userId, concept, date, radius, location, lat, lng } = req.body;

    if (!userId || !concept) {
        return res.status(400).json({ error: 'User ID and Concept are required.' });
    }

    try {
        const GOOGLE_API_KEY = process.env.VITE_GOOGLE_MAPS_API_KEY;

        let centerCoords = { latitude: 40.7128, longitude: -74.0060 }; // Default to NYC

        if (lat && lng) {
            centerCoords = { latitude: Number(lat), longitude: Number(lng) };
        } else if (GOOGLE_API_KEY && location) {
            try {
                const geoRes = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
                    params: { address: location, key: GOOGLE_API_KEY }
                });
                if (geoRes.data?.results?.[0]) {
                    const locData = geoRes.data.results[0].geometry.location;
                    centerCoords = { latitude: locData.lat, longitude: locData.lng };
                }
            } catch (err) {
                console.error('Geocoding failed inside custom:', err.message);
            }
        }

        const fetchPlaces = async (searchString) => {
            const parsedRadius = radius ? Number(radius) : 8046; // Default to 5 miles
            const pCacheKey = `custom_${parsedRadius}_${Buffer.from(searchString).toString('base64')}`;
            if (cache.has(pCacheKey)) return cache.get(pCacheKey);
            if (!GOOGLE_API_KEY) return null;

            try {
                const res = await axios.post('https://places.googleapis.com/v1/places:searchText', {
                    textQuery: searchString,
                    locationBias: {
                        circle: {
                            center: centerCoords,
                            radius: parsedRadius
                        }
                    }
                }, {
                    headers: {
                        'X-Goog-Api-Key': GOOGLE_API_KEY,
                        'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.priceLevel,places.websiteUri,places.photos',
                        'Content-Type': 'application/json'
                    }
                });

                if (res.data && res.data.places && res.data.places.length > 0) {
                    const place = res.data.places[0]; // Take the best match
                    let photoUrl = null;
                    if (place.photos && place.photos.length > 0) {
                        photoUrl = `https://places.googleapis.com/v1/${place.photos[0].name}/media?maxHeightPx=400&maxWidthPx=400&key=${GOOGLE_API_KEY}`;
                    }

                    const getPriceStr = (level) => {
                        if (level === 'PRICE_LEVEL_INEXPENSIVE') return '$';
                        if (level === 'PRICE_LEVEL_MODERATE') return '$$';
                        if (level === 'PRICE_LEVEL_EXPENSIVE') return '$$$';
                        if (level === 'PRICE_LEVEL_VERY_EXPENSIVE') return '$$$$';
                        return 'N/A';
                    };

                    const result = {
                        name: place.displayName?.text || 'Venue',
                        description: `Rating: ${place.rating || 'N/A'} ⭐ (${place.userRatingCount || 0} reviews). Price: ${getPriceStr(place.priceLevel)}.`,
                        lat: place.location?.latitude,
                        lng: place.location?.longitude,
                        address: place.formattedAddress || 'New York City, NY',
                        photoUrl: photoUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=80',
                        url: place.websiteUri || null
                    };
                    cache.set(pCacheKey, result);
                    return result;
                }
            } catch (err) { console.error(`Failed Google Places custom fetch for ${searchString}:`, err.response?.data || err.message); }
            return null;
        };

        const terms = concept.searchTerms || [];
        const durationStrs = concept.durations || ["1.5 hrs", "2 hrs", "1.5 hrs"];

        const placePromises = terms.map(term => fetchPlaces(term));
        const placesResults = await Promise.all(placePromises);

        const genericRealPlaces = [
            { name: "Central Park", address: "New York, NY", lat: 40.7826, lng: -73.9656, description: "Iconic park in the center of Manhattan." },
            { name: "The High Line", address: "Gansevoort St, NY", lat: 40.7480, lng: -74.0048, description: "Beautiful elevated park with scenic Hudson river views." },
            { name: "Chelsea Market", address: "75 9th Ave, NY", lat: 40.7420, lng: -74.0048, description: "Famous food hall and shopping mall." },
            { name: "Washington Square Park", address: "Washington Square, NY", lat: 40.7308, lng: -73.9973, description: "Vibrant park in Greenwich Village." },
            { name: "Brooklyn Bridge Park", address: "334 Furman St, Brooklyn", lat: 40.7011, lng: -73.9958, description: "Unmatched skyline views." }
        ];

        const getFallback = (i) => {
            const fallback = genericRealPlaces[i % genericRealPlaces.length];
            return {
                name: fallback.name,
                description: fallback.description,
                lat: fallback.lat, lng: fallback.lng,
                address: fallback.address,
                photoUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=80',
                url: null
            };
        };

        const startTimes = ['5:00 PM', '7:00 PM', '9:30 PM'];

        let liveItinerary = [];

        for (let i = 0; i < terms.length; i++) {
            const place = placesResults[i] || getFallback(i);
            const timeStr = startTimes[i] || `${5 + i * 2}:00 PM`;
            const duration = durationStrs[i] || "2 hours";

            // Guess category type based on venue or search term keyword
            let stepType = 'event';
            const termLower = (terms[i] || '').toLowerCase();
            const venueLower = place.name.toLowerCase();
            if (termLower.includes('food') || termLower.includes('restaurant') || termLower.includes('dinner') ||
                venueLower.includes('restaurant') || venueLower.includes('cafe') || venueLower.includes('bistro') || venueLower.includes('kitchen')) {
                stepType = 'restaurant';
            } else if (termLower.includes('dessert') || termLower.includes('ice cream') || termLower.includes('bakery') || venueLower.includes('bakery') || venueLower.includes('dessert')) {
                stepType = 'dessert';
            }

            const booking = createBookingUrl(stepType, place.name, date, timeStr);

            liveItinerary.push({
                time: timeStr,
                activity: `Stop ${i + 1} (${duration})`,
                venue: place.name,
                description: `${place.description} Address: ${place.address}. Expected duration: ${duration}.`,
                url: place.url || null,
                searchUrl: `https://www.google.com/search?q=${encodeURIComponent(place.name + ' New York City')}`,
                directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`,
                lat: place.lat,
                lng: place.lng,
                photoUrl: place.photoUrl,
                bookingUrl: booking.url,
                bookingType: booking.type
            });
        }

        const planPayload = {
            metadata: { planDate: date || new Date().toISOString().split('T')[0], isCustomAI: true },
            steps: liveItinerary
        };

        const finalPlan = {
            user_id: userId,
            vibe: concept.title,
            budget: concept.budgetStr || 'moderate',
            location: 'New York City, NY',
            itinerary: planPayload
        };

        const { data, error } = await supabase
            .from('plans')
            .insert([finalPlan])
            .select();

        if (error) throw error;

        res.status(201).json({ plans: data });
    } catch (err) {
        console.error('Custom Generate Plan Error:', err);
        res.status(500).json({ error: 'Failed to build custom plan.', details: err.message });
    }
});

// Get a single public plan by ID
app.get('/api/plans/:id', async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ error: 'Plan ID is required' });
    }

    try {
        const { data: plan, error } = await supabase
            .from('plans')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Plan not found' });
            }
            throw error;
        }

        // Only return non-sensitive fields to the public
        const publicPlan = {
            id: plan.id,
            vibe: plan.vibe,
            budget: plan.budget,
            location: plan.location,
            itinerary: plan.itinerary,
            created_at: plan.created_at
        };

        res.status(200).json(publicPlan);
    } catch (error) {
        console.error('Error fetching plan:', error);
        res.status(500).json({ error: 'Failed to fetch plan. Please try again later.' });
    }
});

// Classical Generation Flow
app.post('/api/generate-date', async (req, res) => {
    const { userId, location, vibe, startTime, endTime, budget, activities, interests, date, radius, lat, lng, dietary } = req.body;

    if (!userId || !location) {
        return res.status(400).json({ error: 'User ID and Location are required' });
    }

    try {
        const GOOGLE_API_KEY = process.env.VITE_GOOGLE_MAPS_API_KEY;

        const nycNeighborhoods = [
            "West Village", "Soho", "Lower East Side", "Greenwich Village", "East Village",
            "Chelsea", "Tribeca", "Gramercy", "Upper West Side", "Upper East Side",
            "Williamsburg", "Dumbo", "Greenpoint", "Astoria", "Long Island City",
            "Financial District", "Battery Park City", "Murray Hill", "Hell's Kitchen"
        ];
        const { neighborhoods } = req.body;
        const pool = neighborhoods && Array.isArray(neighborhoods) && neighborhoods.length > 0 ? neighborhoods : nycNeighborhoods;
        const chosenNeighborhood = pool[Math.floor(Math.random() * pool.length)];

        let centerCoords = { latitude: 40.7128, longitude: -74.0060 }; // Default to NYC

        if (lat && lng) {
            centerCoords = { latitude: Number(lat), longitude: Number(lng) };
        } else if (GOOGLE_API_KEY) {
            try {
                // Geocode the specific neighborhood for exact location bias Node triggers
                const geocodeAddress = `${chosenNeighborhood}, New York City`;
                const geoRes = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
                    params: { address: geocodeAddress, key: GOOGLE_API_KEY }
                });
                if (geoRes.data?.results?.[0]) {
                    const locData = geoRes.data.results[0].geometry.location;
                    centerCoords = { latitude: locData.lat, longitude: locData.lng };
                }
            } catch (err) {
                console.error('Geocoding failed inside classic:', err.message);
            }
        }

        let events = [];
        let restaurants = [];
        let entertainment = [];
        let sightseeing = [];
        let desserts = [];
        let customPlaces = [];

        if (GOOGLE_API_KEY) {
            const fetchPlaces = async (queryType, searchString) => {
                const parsedRadius = radius ? Number(radius) : 8046; // Default to 5 miles
                const pCacheKey = `goog_nyc_${queryType}_${budget || 'moderate'}_${parsedRadius}_${searchString}`;
                // Bypassing cache lookup to force live Places API queries every time Node triggers triggers
                // if (cache.has(pCacheKey)) return cache.get(pCacheKey);

                let priceLevels = [];

                // Parse numerical budget (e.g., "$100")
                let budgetNum = null;
                if (budget && budget.startsWith('$')) {
                    budgetNum = parseInt(budget.replace('$', ''), 10);
                }

                if (budgetNum !== null) {
                    if (budgetNum <= 50) {
                        priceLevels = ['PRICE_LEVEL_INEXPENSIVE']; // Max $50: Strictly index 1
                    } else if (budgetNum <= 110) {
                        priceLevels = ['PRICE_LEVEL_INEXPENSIVE', 'PRICE_LEVEL_MODERATE']; // Max $110: Index 1 & 2
                    } else if (budgetNum <= 200) {
                        priceLevels = ['PRICE_LEVEL_MODERATE', 'PRICE_LEVEL_EXPENSIVE']; // Max $200: Index 2 & 3
                    } else {
                        priceLevels = ['PRICE_LEVEL_EXPENSIVE', 'PRICE_LEVEL_VERY_EXPENSIVE']; // $200+: Index 3 & 4
                    }
                } else {
                    // Fallback to legacy triggers
                    if (budget === 'low') priceLevels = ['PRICE_LEVEL_INEXPENSIVE', 'PRICE_LEVEL_MODERATE'];
                    else if (budget === 'moderate') priceLevels = ['PRICE_LEVEL_MODERATE', 'PRICE_LEVEL_EXPENSIVE'];
                    else if (budget === 'high') priceLevels = ['PRICE_LEVEL_EXPENSIVE', 'PRICE_LEVEL_VERY_EXPENSIVE'];
                }

                try {
                    let res = await axios.post('https://places.googleapis.com/v1/places:searchText', {
                        textQuery: searchString,
                        priceLevels: priceLevels.length > 0 ? priceLevels : undefined,
                        locationBias: {
                            circle: {
                                center: centerCoords,
                                radius: parsedRadius
                            }
                        }
                    }, {
                        headers: {
                            'X-Goog-Api-Key': GOOGLE_API_KEY,
                            'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.priceLevel,places.websiteUri,places.photos',
                            'Content-Type': 'application/json'
                        }
                    });

                    // Retrying with No Price Constraint if zero results returned Node triggers
                    if ((!res.data || !res.data.places) && priceLevels.length > 0) {
                        res = await axios.post('https://places.googleapis.com/v1/places:searchText', {
                            textQuery: searchString,
                            locationBias: {
                                circle: {
                                    center: centerCoords,
                                    radius: parsedRadius
                                }
                            }
                        }, {
                            headers: {
                                'X-Goog-Api-Key': GOOGLE_API_KEY,
                                'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.priceLevel,places.websiteUri,places.photos',
                                'Content-Type': 'application/json'
                            }
                        });
                    }

                    // Final safety retry: Unbind all radius and budget locks for broad lookup Node triggers layout fixes
                    if (!res.data || !res.data.places) {
                        res = await axios.post('https://places.googleapis.com/v1/places:searchText', {
                            textQuery: `${queryType} in New York City`
                        }, {
                            headers: {
                                'X-Goog-Api-Key': GOOGLE_API_KEY,
                                'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.priceLevel,places.websiteUri,places.photos',
                                'Content-Type': 'application/json'
                            }
                        });
                    }

                    if (res.data && res.data.places) {
                        const results = res.data.places.slice(0, 20).map(place => {
                            let photoUrl = null;
                            if (place.photos && place.photos.length > 0) {
                                photoUrl = `https://places.googleapis.com/v1/${place.photos[0].name}/media?maxHeightPx=400&maxWidthPx=400&key=${GOOGLE_API_KEY}`;
                            }
                            const getPriceStr = (level) => {
                                if (level === 'PRICE_LEVEL_INEXPENSIVE') return '$';
                                if (level === 'PRICE_LEVEL_MODERATE') return '$$';
                                if (level === 'PRICE_LEVEL_EXPENSIVE') return '$$$';
                                if (level === 'PRICE_LEVEL_VERY_EXPENSIVE') return '$$$$';
                                return 'N/A';
                            };
                            return {
                                name: place.displayName?.text || 'Venue',
                                description: `Rating: ${place.rating || 'N/A'} ⭐ (${place.userRatingCount || 0} reviews). Price: ${getPriceStr(place.priceLevel)}. A top-rated spot.`,
                                lat: place.location?.latitude,
                                lng: place.location?.longitude,
                                address: place.formattedAddress || 'New York City, NY',
                                photoUrl: photoUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=80',
                                url: place.websiteUri || null
                            };
                        });
                        cache.set(pCacheKey, results);
                        return results;
                    }
                } catch (err) { console.error(`Failed ${queryType} fetch:`, err.response?.data || err.message); }
                return [];
            };

            const interestQuery = (interests && interests !== 'Any') ? `${interests} ` : '';
            const dietaryQuery = (dietary && Array.isArray(dietary) && dietary.length > 0) ? `${dietary.join(' ')} ` : '';

            const shuffleKws = (array) => [...array].sort(() => 0.5 - Math.random());
            const eventKws = shuffleKws(['live music', 'theater', 'comedy club', 'concert', 'gallery', 'speakeasy', 'nightlife']).slice(0, 3).join(' OR ');
            const foodKws = shuffleKws(['romantic restaurant', 'bistro', 'upscale dining', 'tapas', 'wine bar', 'hidden gem kitchen']).slice(0, 3).join(' OR ');
            const entKws = shuffleKws(['bowling', 'arcade', 'interactive experience', 'mini golf', 'escape room', 'lounge']).slice(0, 3).join(' OR ');
            const sightKws = shuffleKws(['scenic pier', 'park', 'museum', 'botanical garden', 'landmark', 'observation deck']).slice(0, 3).join(' OR ');
            const dessertKws = shuffleKws(['famous bakery', 'artisan dessert', 'gelato', 'patisserie', 'creperie', 'chocolate shop']).slice(0, 3).join(' OR ');

            // Only inject the heavy randomized OR clusters if the user didn't specify distinct interests
            const getQ = (specificReq, randomFb, baseType) => {
                const s = specificReq.trim();
                return s ? `${s} ${baseType}` : `${randomFb}`;
            };

            let fetchPromises = [
                fetchPlaces('events', `${getQ(interestQuery, eventKws, 'live event')} in ${chosenNeighborhood}`),
                fetchPlaces('food', `${dietaryQuery} ${getQ(interestQuery, foodKws, 'restaurant')} in ${chosenNeighborhood} ${budget || ''}`.trim()),
                fetchPlaces('entertainment', `${getQ(interestQuery, entKws, 'entertainment activity')} in ${chosenNeighborhood}`),
                fetchPlaces('sightseeing', `${getQ(interestQuery, sightKws, 'attraction')} in ${chosenNeighborhood}`),
                fetchPlaces('dessert', `${dietaryQuery} ${getQ(interestQuery, dessertKws, 'dessert')} in ${chosenNeighborhood}`.trim())
            ];

            const hasSpecifics = interestQuery.trim() !== '' || dietaryQuery.trim() !== '';

            if (hasSpecifics) {
                // Fire a pure random batch to ensure about 4 out of 7 ideas are totally fresh
                fetchPromises = fetchPromises.concat([
                    fetchPlaces('events_random', `${eventKws} in ${chosenNeighborhood}`),
                    fetchPlaces('food_random', `${foodKws} in ${chosenNeighborhood} ${budget || ''}`.trim()),
                    fetchPlaces('entertainment_random', `${entKws} in ${chosenNeighborhood}`),
                    fetchPlaces('sightseeing_random', `${sightKws} in ${chosenNeighborhood}`),
                    fetchPlaces('dessert_random', `${dessertKws} in ${chosenNeighborhood}`.trim())
                ]);
            }

            if (activities && activities.trim() !== '') {
                fetchPromises.push(fetchPlaces('custom', `${activities} in New York City`));
            }

            const results = await Promise.all(fetchPromises);

            const getMixedResults = (primaryIdx) => {
                if (hasSpecifics && results.length >= 10) { 
                    // merge the user's specific request query with the purely randomized AI queries
                    return [...results[primaryIdx], ...results[primaryIdx + 5]];
                }
                return results[primaryIdx];
            };

            events = getMixedResults(0);
            restaurants = getMixedResults(1);
            entertainment = getMixedResults(2);
            sightseeing = getMixedResults(3);
            desserts = getMixedResults(4);

            if (activities && activities.trim() !== '') {
                customPlaces = results[results.length - 1]; // the custom query is always the last promise
            }
        }

        const fallbackMap = {
            Sightseeing: [
                { name: "The High Line", address: "Gansevoort St, NY", lat: 40.7480, lng: -74.0048, description: "Beautiful elevated park with scenic Hudson river views Node triggers." },
                { name: "Brooklyn Bridge Park", address: "334 Furman St, Brooklyn", lat: 40.7011, lng: -73.9958, description: "Unmatched views of lower manhattan and bridges triggers." },
                { name: "The Vessel", address: "20 Hudson Yards, NY", lat: 40.7538, lng: -74.0017, description: "Interactive matrix architectural landmark triggers Node." },
                { name: "Grand Central Terminal", address: "89 E 42nd St, NY", lat: 40.7527, lng: -73.9772, description: "Historic celestial ceiling and historic romantic layout Node." },
                { name: "Governor's Island", address: "Governors Island, NY", lat: 40.6892, lng: -74.0169, description: "Island oasis with panoramic skyline viewpoints Node triggers." },
                { name: "Radio City Music Hall", address: "1260 6th Ave, NY", lat: 40.7599, lng: -73.9799, description: "Classic landmark inside rockefeller center Node triggers." },
                { name: "Flatiron Building", address: "175 5th Ave, NY", lat: 40.7411, lng: -73.9897, description: "Iconic wedge triangular view node layout fixes." }
            ],
            Entertainment: [
                { name: "Bowlmor Lanes Times Square", address: "222 W 44th St, NY", lat: 40.7585, lng: -73.9884, description: "Iconic luxury glowing arena Node triggers." },
                { name: "Barcade Chelsea", address: "148 W 24th St, NY", lat: 40.7441, lng: -73.9950, description: "Vintage arcade cabinet retro classic Node triggers." },
                { name: "Nitehawk Cinema", address: "136 Metropolitan Ave, Brooklyn", lat: 40.7159, lng: -73.9622, description: "Dine-in theater loop Node triggers layout fixes." },
                { name: "Standard Shuffleboard Club", address: "Brooklyn, NY", lat: 40.6781, lng: -73.9866, description: "Vintage board gaming setups triggers Absolute layout." }
            ],
            Restaurant: [
                { name: "Balthazar", address: "80 Spring St, NY", lat: 40.7226, lng: -73.9981, description: "Famous Parisian romantic brasserie triggers layout fits." },
                { name: "Carbone", address: "181 Thompson St, NY", lat: 40.7285, lng: -73.9996, description: "Iconic retro Italian dining room layout fixes." },
                { name: "Katz's Delicatessen", address: "205 E Houston St, NY", lat: 40.7222, lng: -73.9875, description: "World famous pastrami layout fixes index fits setup Node." }
            ],
            Dessert: [
                { name: "Magnolia Bakery", address: "401 Bleecker St, NY", lat: 40.7356, lng: -74.0041, description: "Famous banana pudding Node triggers absolute layout fixes." },
                { name: "Dominique Ansel Bakery", address: "189 Spring St, NY", lat: 40.7252, lng: -74.0029, description: "Award-winning cronut pastry triggers layout fits Node triggers." },
                { name: "Levain Bakery", address: "167 W 74th St, NY", lat: 40.7799, lng: -73.9803, description: "Giant gooey cookies that are highly romantic Node triggers." }
            ],
            Event: [
                { name: "Comedy Cellar", address: "117 MacDougal St, NY", lat: 40.7303, lng: -74.0006, description: "Underground historic comedy club Node triggers absolute layout." },
                { name: "Stardust Diner", address: "1650 Broadway, NY", lat: 40.7618, lng: -73.9839, description: "Singing servers classic diner vibes Node layout triggers." }
            ]
        };

        const getFallback = (type, i) => {
            const list = fallbackMap[type] || fallbackMap['Sightseeing'];
            const item = list[i % list.length];
            return {
                ...item,
                photoUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=80',
                url: null
            };
        };

        const mergeWithFallsbacks = (apiResults, type) => {
            let list = [...apiResults];
            let fbIdx = 0;
            const fbList = fallbackMap[type] || fallbackMap['Sightseeing'];
            while (list.length < 7) {
                const item = fbList[fbIdx % fbList.length];
                list.push({
                    ...item,
                    photoUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=80',
                    url: null
                });
                fbIdx++;
            }
            return list;
        };

        events = mergeWithFallsbacks(events, 'Event');
        restaurants = mergeWithFallsbacks(restaurants, 'Restaurant');
        entertainment = mergeWithFallsbacks(entertainment, 'Entertainment');
        sightseeing = mergeWithFallsbacks(sightseeing, 'Sightseeing');
        desserts = mergeWithFallsbacks(desserts, 'Dessert');

        const shuffle = (array) => [...array].sort(() => 0.5 - Math.random());
        const shuffledEvents = shuffle(events);
        const shuffledRestaurants = shuffle(restaurants);
        const shuffledEntertainment = shuffle(entertainment);
        const shuffledSightseeing = shuffle(sightseeing);
        const shuffledDesserts = shuffle(desserts);
        const shuffledCustom = shuffle(customPlaces);

        const generatedPlans = [];
        const planTypes = [
            { vibeLabel: 'Classic Romance', format: 'sightseeing-dinner-dessert' },
            { vibeLabel: 'Fun & Active', format: 'entertainment-dinner-event' },
            { vibeLabel: 'Culture & Cocktails', format: 'sightseeing-event-dinner' },
            { vibeLabel: 'The Big Night Out', format: 'dinner-event-dessert' },
            { vibeLabel: 'Chill & Scenic', format: 'sightseeing-dessert-dinner' },
            { vibeLabel: 'Playful Competition', format: 'entertainment-dessert-dinner' },
            { vibeLabel: 'Ultimate Surprise', format: 'event-dinner-sightseeing' }
        ];

        const requestedCount = Number(req.body.ideaCount) || 7;
        const countToGenerate = Math.min(Math.max(1, requestedCount), 7); // Clamp between 1 and 7

        for (let i = 0; i < countToGenerate; i++) {
            const custom = shuffledCustom.length > 0 ? shuffledCustom[i % shuffledCustom.length] : null;

            const dinner = shuffledRestaurants[i % shuffledRestaurants.length];
            const treat = shuffledDesserts[i % shuffledDesserts.length];

            const planFormat = planTypes[i];

            const mainEvent = custom && planFormat.format.includes('event') ? custom : shuffledEvents[i % shuffledEvents.length];
            const sight = custom && !planFormat.format.includes('event') && planFormat.format.includes('sightseeing') ? custom : shuffledSightseeing[i % shuffledSightseeing.length];
            const fun = custom && !planFormat.format.includes('event') && !planFormat.format.includes('sightseeing') ? custom : shuffledEntertainment[i % shuffledEntertainment.length];

            const isCustom = (venueObj) => custom && venueObj.name === custom.name;
            const getTitle = (venueObj, defaultTitle) => isCustom(venueObj) ? 'Your Custom Request' : defaultTitle;
            const getDesc = (venueObj, defaultDesc) => isCustom(venueObj) ? `Exactly what you asked for! ${venueObj.description}` : defaultDesc;

            let liveItinerary = [];

            const createStep = (time, activity, venue, description, lat, lng, url = null, photoUrl = null) => {
                let stepType = 'event';
                const venueLower = (venue || '').toLowerCase();
                const activityLower = (activity || '').toLowerCase();

                if (activityLower.includes('dinner') || activityLower.includes('drinks') ||
                    venueLower.includes('restaur') || venueLower.includes('kitchen') || venueLower.includes('cafe')) {
                    stepType = 'restaurant';
                } else if (activityLower.includes('treat') || activityLower.includes('pastries') || activityLower.includes('dessert') || activityLower.includes('sweet') ||
                    venueLower.includes('bakery') || venueLower.includes('ice cream')) {
                    stepType = 'dessert';
                } else if (activityLower.includes('sport') || activityLower.includes('game') || activityLower.includes('arcade')) {
                    stepType = 'entertainment';
                }

                const booking = createBookingUrl(stepType, venue, date, time);

                return {
                    time, activity, venue,
                    description: `${description} Location: ${venue}. Make sure to take pictures!`,
                    url: url || null,
                    searchUrl: `https://www.google.com/search?q=${encodeURIComponent(venue + ' New York City')}`,
                    directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
                    lat, lng, photoUrl,
                    bookingUrl: booking.url,
                    bookingType: booking.type
                };
            };

            // Dynamically construct based on plan format with 4-5 steps
            if (planFormat.format === 'sightseeing-dinner-dessert') {
                liveItinerary = [
                    createStep('4:00 PM', getTitle(sight, 'Afternoon Exploration'), sight.name, getDesc(sight, `Start the evening with some beautiful views and culture. ${sight.description}. Address: ${sight.address}.`), sight.lat, sight.lng, null, sight.photoUrl),
                    createStep('6:00 PM', 'Pre-Dinner Drinks', treat.name, `Grab a quick refreshment or coffee before the main meal. ${treat.description}.`, treat.lat, treat.lng, null, treat.photoUrl),
                    createStep('7:30 PM', 'Dinner Reservation', dinner.name, `Head over for an incredible romantic dinner. ${dinner.description}. Address: ${dinner.address}.`, dinner.lat, dinner.lng, null, dinner.photoUrl),
                    createStep('9:30 PM', getTitle(mainEvent, 'Evening Entertainment'), mainEvent.name, getDesc(mainEvent, `Keep the night going with some local flavor. ${mainEvent.description}.`), mainEvent.lat, mainEvent.lng, mainEvent.url, mainEvent.photoUrl)
                ];
            } else if (planFormat.format === 'entertainment-dinner-event') {
                liveItinerary = [
                    createStep('3:30 PM', getTitle(sight, 'Afternoon Sights'), sight.name, getDesc(sight, `Kickoff the date by taking in some local scenery. ${sight.description}.`), sight.lat, sight.lng, null, sight.photoUrl),
                    createStep('5:30 PM', getTitle(fun, 'Interactive Fun'), fun.name, getDesc(fun, `Break the ice with some playful competition or arcade games. ${fun.description}.`), fun.lat, fun.lng, null, fun.photoUrl),
                    createStep('7:45 PM', 'Hearty Dinner', dinner.name, `Grab some delicious food nearby to refuel. ${dinner.description}.`, dinner.lat, dinner.lng, null, dinner.photoUrl),
                    createStep('9:30 PM', getTitle(mainEvent, 'Headline Event'), mainEvent.name, getDesc(mainEvent, `Time for the main attraction! ${mainEvent.description}. Enjoy the energy.`), mainEvent.lat, mainEvent.lng, mainEvent.url, mainEvent.photoUrl)
                ];
            } else if (planFormat.format === 'sightseeing-event-dinner') {
                liveItinerary = [
                    createStep('5:00 PM', getTitle(sight, 'Golden Hour Views'), sight.name, getDesc(sight, `Catch the late afternoon vibes at this scenic spot. ${sight.description}.`), sight.lat, sight.lng, null, sight.photoUrl),
                    createStep('6:30 PM', getTitle(mainEvent, 'Featured Event'), mainEvent.name, getDesc(mainEvent, `Experience the magic of the city at this live event. ${mainEvent.description}.`), mainEvent.lat, mainEvent.lng, mainEvent.url, mainEvent.photoUrl),
                    createStep('8:45 PM', 'Late Dinner', dinner.name, `Enjoy a fantastic late dinner and great conversation. ${dinner.description}.`, dinner.lat, dinner.lng, null, dinner.photoUrl),
                    createStep('10:30 PM', 'Midnight Sweet', treat.name, `End on a high note with a famous local dessert. ${treat.description}.`, treat.lat, treat.lng, null, treat.photoUrl)
                ];
            } else if (planFormat.format === 'dinner-event-dessert') {
                liveItinerary = [
                    createStep('5:30 PM', 'Early Dinner', dinner.name, `Fuel up first! Head over to this highly rated restaurant. ${dinner.description}.`, dinner.lat, dinner.lng, null, dinner.photoUrl),
                    createStep('7:30 PM', getTitle(mainEvent, 'Main Event'), mainEvent.name, getDesc(mainEvent, `Head over to the featured event of the evening: ${mainEvent.description}.`), mainEvent.lat, mainEvent.lng, mainEvent.url, mainEvent.photoUrl),
                    createStep('9:45 PM', getTitle(fun, 'Late Night Fun'), fun.name, getDesc(fun, `Keep the energy high with some local entertainment. ${fun.description}.`), fun.lat, fun.lng, null, fun.photoUrl),
                    createStep('11:00 PM', 'Midnight Snack', treat.name, `Grab a late-night treat to satisfy that sweet tooth before heading home. ${treat.description}.`, treat.lat, treat.lng, null, treat.photoUrl)
                ];
            } else if (planFormat.format === 'sightseeing-dessert-dinner') {
                liveItinerary = [
                    createStep('2:00 PM', getTitle(fun, 'Daytime Activity'), fun.name, getDesc(fun, `Start early with something highly engaging! ${fun.description}.`), fun.lat, fun.lng, null, fun.photoUrl),
                    createStep('4:30 PM', getTitle(sight, 'Afternoon Walk'), sight.name, getDesc(sight, `Take a relaxing stroll through the history and sights. ${sight.description}.`), sight.lat, sight.lng, null, sight.photoUrl),
                    createStep('6:30 PM', 'Coffee & Pastries', treat.name, `Take a break and grab a world-class pastry or coffee. ${treat.description}.`, treat.lat, treat.lng, null, treat.photoUrl),
                    createStep('8:00 PM', 'Dinner', dinner.name, `Enjoy a fantastic meal to wrap up the day. ${dinner.description}.`, dinner.lat, dinner.lng, null, dinner.photoUrl)
                ];
            } else if (planFormat.format === 'entertainment-dessert-dinner') {
                liveItinerary = [
                    createStep('4:00 PM', getTitle(sight, 'City Exploration'), sight.name, getDesc(sight, `Check out this iconic area to set the mood. ${sight.description}.`), sight.lat, sight.lng, null, sight.photoUrl),
                    createStep('5:30 PM', getTitle(fun, 'Activity & Games'), fun.name, getDesc(fun, `Get ready for some action and laughs. ${fun.description}.`), fun.lat, fun.lng, null, fun.photoUrl),
                    createStep('7:30 PM', 'Pre-dinner Treat', treat.name, `Appetizers are dessert today. Treat yourself! ${treat.description}.`, treat.lat, treat.lng, null, treat.photoUrl),
                    createStep('8:30 PM', 'Hearty Dinner', dinner.name, `Settle down for a fulfilling meal. ${dinner.description}.`, dinner.lat, dinner.lng, null, dinner.photoUrl),
                    createStep('10:30 PM', getTitle(mainEvent, 'Nightcap Event'), mainEvent.name, getDesc(mainEvent, `Finish the night strong. ${mainEvent.description}.`), mainEvent.lat, mainEvent.lng, mainEvent.url, mainEvent.photoUrl)
                ];
            } else {
                liveItinerary = [
                    createStep('5:00 PM', getTitle(mainEvent, 'Surprise Event'), mainEvent.name, getDesc(mainEvent, `Kick off with an exciting local event! ${mainEvent.description}.`), mainEvent.lat, mainEvent.lng, mainEvent.url, mainEvent.photoUrl),
                    createStep('7:15 PM', 'Celebratory Dinner', dinner.name, `Feast on some incredible food. ${dinner.description}.`, dinner.lat, dinner.lng, null, dinner.photoUrl),
                    createStep('9:00 PM', getTitle(fun, 'Evening Amusements'), fun.name, getDesc(fun, `Burn off dinner with some local entertainment. ${fun.description}.`), fun.lat, fun.lng, null, fun.photoUrl),
                    createStep('10:30 PM', getTitle(sight, 'Night Walk'), sight.name, getDesc(sight, `Take a romantic moonlit walk to look at the city skyline. ${sight.description}.`), sight.lat, sight.lng, null, sight.photoUrl)
                ];
            }

            // Embed the chosen date into the JSON payload safely without altering the DB schema
            const planPayload = {
                metadata: { planDate: date || new Date().toISOString().split('T')[0] },
                steps: liveItinerary
            };

            generatedPlans.push({
                user_id: userId,
                vibe: planFormat.vibeLabel,
                budget: budget || 'moderate',
                location: 'New York City, NY', // Strictly enforce NYC
                itinerary: planPayload
            });
        }

        // Save generated plans to Supabase (bulk insert)
        const { data, error } = await supabase
            .from('plans')
            .insert(generatedPlans)
            .select();

        if (error) throw error;

        // Return the array of created plans (should be 3)
        res.status(201).json({ plans: data });
    } catch (err) {
        console.error('Generate Plan Error FULL:', err);
        console.error('Stack:', err.stack);
        res.status(500).json({ error: 'Failed to generate plan.', details: err.message });
    }
});

// Serve frontend static files in production
const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));

// Catch-all route to serve index.html for React Router
// We use a regex but ensure we don't handle API or file-like (asset) requests
app.get(/.*/, (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.includes('.')) {
        return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
