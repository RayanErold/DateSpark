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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const cache = new NodeCache({ stdTTL: 3600 }); // Cache for 1 hour

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null; // Initialize Resend conditionally

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
    const { conversationHistory, ideaCount = 3 } = req.body;

    if (!conversationHistory || !Array.isArray(conversationHistory) || conversationHistory.length === 0) {
        return res.status(400).json({ error: 'conversationHistory array is required' });
    }

    const validHistory = conversationHistory.filter(msg => msg && msg.text && msg.text.trim().length > 0);
    if (validHistory.length === 0) {
        return res.status(400).json({ error: 'Please enter a prompt to get started.' });
    }

    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'Gemini API key is not configured in the server.' });
        }

        const genAI = new GoogleGenerativeAI(apiKey);

        const systemInstruction = `You are a premium date concierge in New York City. The user wants you to help them "Create their own date".
Generate EXACTLY ${ideaCount} distinct, high-level date concepts that fit their request and chat history.
CRITICAL INSTRUCTION: Even if the user's request is very short, vague, or just a few words, you MUST still generate exactly ${ideaCount} complete, creative concepts based on whatever clues they provided. NEVER complain about the input. NEVER ask for a longer prompt. NEVER use the word "prompt" or say more information is required to generate ideas.
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

        const getFallback = (i) => ({
            name: `Surprise Spot ${i + 1}`,
            description: `A fantastic local venue fitting your vibe.`,
            lat: 40.7128 + (i * 0.005), lng: -74.0060 + (i * 0.005),
            address: 'New York City, NY',
            photoUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=80',
            url: null
        });

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
                venueLower.includes('restaur') || venueLower.includes('cafe') || venueLower.includes('bistro') || venueLower.includes('kitchen')) {
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
                if (cache.has(pCacheKey)) return cache.get(pCacheKey);

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
                    const res = await axios.post('https://places.googleapis.com/v1/places:searchText', {
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

            const fetchPromises = [
                fetchPlaces('events', `${interestQuery}live event theater or comedy club or concert ${vibe}`),
                fetchPlaces('food', `${dietaryQuery}${interestQuery}highly rated romantic restaurant ${budget || ''}`),
                fetchPlaces('entertainment', `${interestQuery}bowling alley or interactive entertainment or arcade`),
                fetchPlaces('sightseeing', `${interestQuery}scenic pier or hudson river park or museum`),
                fetchPlaces('dessert', `${dietaryQuery}${interestQuery}famous bakery or dessert or ice cream`)
            ];

            if (activities && activities.trim() !== '') {
                fetchPromises.push(fetchPlaces('custom', `${activities} in New York City`));
            }

            const results = await Promise.all(fetchPromises);
            [events, restaurants, entertainment, sightseeing, desserts] = results;

            if (results.length > 5) {
                customPlaces = results[5];
            }
        }

        const getFallback = (type, i) => ({
            name: `NYC ${type} Spot ${i + 1}`,
            description: `A fantastic local ${type} venue in the heart of New York City.`,
            lat: 40.7128 + (i * 0.005), lng: -74.0060 + (i * 0.005),
            address: 'New York City, NY',
            photoUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=80',
            url: null
        });
        if (!events.length) events = Array(7).fill().map((_, i) => getFallback('Event', i));
        if (!restaurants.length) restaurants = Array(7).fill().map((_, i) => getFallback('Restaurant', i));
        if (!entertainment.length) entertainment = Array(7).fill().map((_, i) => getFallback('Entertainment', i));
        if (!sightseeing.length) sightseeing = Array(7).fill().map((_, i) => getFallback('Sightseeing', i));
        if (!desserts.length) desserts = Array(7).fill().map((_, i) => getFallback('Dessert', i));

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
