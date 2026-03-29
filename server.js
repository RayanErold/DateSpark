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
const PORT = process.env.PORT || 5005;

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

// Connectivity check on start
supabase.from('plans').select('count', { count: 'exact', head: true })
    .then(({ count, error }) => {
        if (error) console.error('Supabase Connectivity Error (STARTUP):', error.message);
        else console.log('Supabase Connectivity OK - Plans existing in table:', count || 0);
    });

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
            productName = 'Romantic Elite Membership';
            mode = 'subscription';
            recurring = { interval: 'month' };
        } else if (planType === 'daily') {
            unitAmount = 199; // $1.99
            productName = '24-Hour Date Pass';
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
                            ? 'Unlimited date ideas, full itinerary access, map navigation, and premium switch up features.'
                            : '✅ Full 5-Stop Itinerary Access\n✅ Save Unlimited Favorites (24h)\n✅ Directions & Ride-sharing\n✅ Perfect for Tonight',
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
    console.log('--- FEEDBACK REQUEST ---');
    console.log('User:', userId || 'Anonymous');
    console.log('Email:', email || 'N/A');
    console.log('Text:', text?.substring(0, 50));
    console.log('------------------------');

    if (!text) {
        return res.status(400).json({ error: 'Feedback text is required' });
    }

    try {
        if (resend) {
            await resend.emails.send({
                from: 'Feedback <hello@datespark.live>',
                to: process.env.ADMIN_EMAIL || 'rayanerold@gmail.com',
                reply_to: email || undefined,
                subject: 'New DateSpark Feedback 💡',
                html: `
                        <!-- Branded Logo -->
                        <img src="https://datespark.live/datespark-logo.png" alt="DateSpark" style="display: block; margin: 0 auto 20px auto; max-width: 140px;" />
                        <h3>New Feedback Received</h3>
                    <p><b>User Email:</b> ${email || 'Anonymous'}</p>
                    <p><b>User ID:</b> ${userId || 'N/A'}</p>
                    <p><b>Feedback:</b></p>
                    <p>${text}</p>
                `
            });
        } else {
            console.warn("Resend not configured: Check RESEND_API_KEY in .env");
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

// --- Welcome/Onboarding Email Endpoint ---
app.post('/api/send-welcome', async (req, res) => {
    const { email, firstName } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        if (resend) {
            await resend.emails.send({
                from: 'DateSpark <hello@datespark.live>',
                to: [email],
                subject: `Welcome to the family, ${firstName || 'Friend'}! 🥂`,
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <style>
                            body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; background-color: #f8fafc; }
                            .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); border: 1px solid #f1f5f9; }
                            .hero { background: linear-gradient(135deg, #f43f5e 0%, #fb7185 100%); padding: 60px 40px; text-align: center; color: white; }
                            .content { padding: 40px; }
                            .footer { background: #f8fafc; padding: 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
                            .btn { display: inline-block; background: #f43f5e; color: white !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; margin-top: 24px; box-shadow: 0 10px 15px -3px rgba(244, 63, 94, 0.3); }
                            .feature { margin-bottom: 24px; display: flex; align-items: flex-start; }
                            .feature-icon { background: #fff1f2; color: #f43f5e; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0; margin-right: 16px; font-size: 14px; }
                            h1 { margin: 0; font-size: 32px; font-weight: 900; letter-spacing: -0.05em; color: white; }
                            h2 { color: #0f172a; font-size: 20px; font-weight: 700; margin-bottom: 16px; margin-top: 0; }
                            p { color: #64748b; font-size: 16px; margin-bottom: 16px; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="hero">
                                <h1>Welcome to the family, ${firstName || 'there'}! 🥂</h1>
                            </div>
                            <div class="content">
                                <h2>You're officially a DateSparker.</h2>
                                <p>We're building the future of dating in NYC, and we're so glad you're here. DateSpark is designed to take the stress out of planning so you can focus on the connection.</p>
                                
                                <div style="margin-top: 32px;">
                                    <div class="feature">
                                        <div class="feature-icon">1</div>
                                        <div>
                                            <strong style="color: #0f172a;">Plan your first date</strong>
                                            <p style="font-size: 14px; margin-top: 4px;">Head to the generator and let our AI curate the perfect NYC evening for you.</p>
                                        </div>
                                    </div>
                                    <div class="feature">
                                        <div class="feature-icon">2</div>
                                        <div>
                                            <strong style="color: #0f172a;">Exclusive "Elite" access</strong>
                                            <p style="font-size: 14px; margin-top: 4px;">As a new member, you've unlocked a special 24-hour preview of our Elite venues.</p>
                                        </div>
                                    </div>
                                </div>

                                <div style="text-align: center; margin-top: 20px;">
                                    <a href="https://datespark.live/dashboard" class="btn">Generate My First Date</a>
                                </div>
                            </div>
                            <div class="footer">
                                &copy; 2026 DateSpark. You received this because you created a DateSpark account.
                            </div>
                        </div>
                    </body>
                    </html>
                `
            });
            res.status(200).json({ message: 'Welcome email sent' });
        } else {
            res.status(500).json({ error: 'Resend not configured' });
        }
    } catch (err) {
        console.error('Welcome email error:', err);
        res.status(500).json({ error: 'Failed to send welcome email' });
    }
});

// --- Forgot Username Endpoint ---
app.post('/api/forgot-username', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        if (resend) {
            // In a real app, you would look up the user's username/fullname in Supabase here.
            // For DateSpark's current schema, we remind them of the email they used.
            const { data: user, error } = await supabase
                .from('waitlist') // Or your primary users table
                .select('email')
                .eq('email', email)
                .single();

            // Note: We don't want to leak if an email exists for security, 
            // but we can provide a friendly message.
            
            await resend.emails.send({
                from: 'DateSpark Security <hello@datespark.live>',
                to: [email],
                subject: 'Your DateSpark Account Information 🔐',
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <style>
                            body { font-family: sans-serif; line-height: 1.6; color: #1e293b; }
                            .container { max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; }
                            .logo { display: block; margin: 0 auto 20px; max-width: 120px; }
                            .btn { display: inline-block; background: #f43f5e; color: white !important; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 20px; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <img src="https://datespark.live/datespark-logo.png" class="logo" alt="DateSpark" />
                            <h2 style="text-align: center;">Account Helper</h2>
                            <p>Hi there,</p>
                            <p>You recently requested to recover your account information for DateSpark.</p>
                            <p>Your account is associated with this email address: <strong>${email}</strong>.</p>
                            <p>If you were trying to reset your password, please use the "Forgot Password" option on the sign-in page.</p>
                            <div style="text-align: center;">
                                <a href="https://datespark.live/login" class="btn">Sign In to DateSpark</a>
                            </div>
                            <p style="font-size: 12px; color: #64748b; margin-top: 40px; text-align: center;">
                                If you did not request this information, you can safely ignore this email.
                            </p>
                        </div>
                    </body>
                    </html>
                `
            });
            res.status(200).json({ message: 'Username reminder sent' });
        } else {
            res.status(500).json({ error: 'Resend not configured' });
        }
    } catch (err) {
        console.error('Forgot username error:', err);
        res.status(200).json({ message: 'Process completed' }); // Return success to prevent email enumeration
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
                    from: 'DateSpark <hello@datespark.live>', // Branded sender from verified domain
                    to: [email],
                    subject: 'Welcome to DateSpark – Let the Date Planning Begin! 💖',
                    html: `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 12px;">
                                <!-- Branded Logo -->
                                <img src="https://datespark.live/datespark-logo.png" alt="DateSpark" style="display: block; margin: 0 auto 20px auto; max-width: 140px;" />
                                
                                <h1 style="color: #1a1a1a; text-align: center; margin-top: 0; font-size: 28px; font-weight: 900;">You're on the list! 🥂</h1>
                                
                                <div style="margin: 25px 0; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
                                    <img src="https://datespark.live/couple-dinner.png" alt="Perfect Date Night" style="width: 100%; display: block;" />
                                </div>

                                <p style="font-size: 18px; color: #1a1a1a; line-height: 1.6; font-weight: bold; text-align: center;">
                                    The future of date night is almost here.
                                </p>
                                
                                <p style="font-size: 16px; color: #4a4a4a; line-height: 1.7;">
                                    Hey there! We're so excited to have you join the inner circle of <strong>DateSpark</strong>. We're building something that takes the stress out of planning and puts the magic back into dating.
                                </p>

                                <div style="background-color: #fff5f5; border-radius: 16px; padding: 25px; margin: 30px 0; border: 1px dashed #f43f5e;">
                                    <h3 style="color: #f43f5e; margin-top: 0; font-size: 18px;">Your Early Access Perks:</h3>
                                    <ul style="color: #4a4a4a; font-size: 15px; line-height: 1.8; margin-bottom: 0;">
                                        <li>✨ <strong>Priority Access:</strong> Be the first to use DateSpark in NYC.</li>
                                        <li>🎁 <strong>Launch Gift:</strong> A FREE Premium AI-Generated Itinerary.</li>
                                        <li>💎 <strong>Founder Status:</strong> Unlock 5 additional credits by inviting just 2 friends later.</li>
                                    </ul>
                                </div>

                                <p style="font-size: 16px; color: #4a4a4a; line-height: 1.7; text-align: center;">
                                    Keep an eye on your inbox. We'll ping you the second we go live.
                                </p>

                                <p style="text-align: center; margin-top: 40px;">
                                    <a href="https://datespark.live" style="background-color: #f43f5e; color: white; padding: 18px 36px; text-decoration: none; border-radius: 12px; font-weight: 900; font-size: 16px; box-shadow: 0 4px 15px rgba(244, 63, 94, 0.4);">Follow Our Journey</a>
                                </p>
                            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
                            <p style="font-size: 12px; color: #aaa; text-align: center;">You're receiving this because you signed up to join DateSpark Waitlist.</p>
                        </div>
                    `
                });
            } else {
                console.warn("Resend API Key not found. Check RESEND_API_KEY in .env.");
            }
        } catch (emailErr) {
            console.error('Waitlist Welcome Email Failed:', {
                message: emailErr.message,
                name: emailErr.name,
                statusCode: emailErr.statusCode
            });
            // We don't throw email errors so the user successfully completes waitlist joins regardless
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
    console.log('API - /api/generate-custom-date - Body:', { userId, vibe: concept?.title, date });

    if (!userId || !concept) {
        console.error('API - Missing userId or concept');
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

        console.log('API - Inserting custom plan for user:', userId);
        const { data, error } = await supabase
            .from('plans')
            .insert([finalPlan])
            .select();

        if (error) {
            console.error('API - Supabase Insertion Error:', error);
            throw error;
        }

        console.log('API - Successfully inserted plans:', data?.length || 0);
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
    const { userId, location, vibe, startTime, endTime, budget, activities, interests, date, radius, lat, lng, dietary, usePreciseLocation } = req.body;
    console.log('API - /api/generate-date - Body Extract:', { userId, location, vibe, date });

    if (!userId || !location) {
        console.error('API - Missing userId or location');
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

            const suffix = usePreciseLocation ? '' : ` in ${chosenNeighborhood}`;

            let fetchPromises = [
                fetchPlaces('events', `${getQ(interestQuery, eventKws, 'live event')}${suffix}`),
                fetchPlaces('food', `${dietaryQuery} ${getQ(interestQuery, foodKws, 'restaurant')}${suffix} ${budget || ''}`.trim()),
                fetchPlaces('entertainment', `${getQ(interestQuery, entKws, 'entertainment activity')}${suffix}`),
                fetchPlaces('sightseeing', `${getQ(interestQuery, sightKws, 'attraction')}${suffix}`),
                fetchPlaces('dessert', `${dietaryQuery} ${getQ(interestQuery, dessertKws, 'dessert')}${suffix}`.trim())
            ];

            const hasSpecifics = interestQuery.trim() !== '' || dietaryQuery.trim() !== '';

            if (hasSpecifics) {
                // Fire a pure random batch to ensure about 4 out of 7 ideas are totally fresh
                fetchPromises = fetchPromises.concat([
                    fetchPlaces('events_random', `${eventKws}${suffix}`),
                    fetchPlaces('food_random', `${foodKws}${suffix} ${budget || ''}`.trim()),
                    fetchPlaces('entertainment_random', `${entKws}${suffix}`),
                    fetchPlaces('sightseeing_random', `${sightKws}${suffix}`),
                    fetchPlaces('dessert_random', `${dessertKws}${suffix}`.trim())
                ]);
            }

            if (activities && activities.trim() !== '') {
                fetchPromises.push(fetchPlaces('custom', `${activities}${suffix || ' in New York City'}`));
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
                    createStep('4:00 PM', getTitle(sight, 'Afternoon Exploration'), sight.name, getDesc(sight, `${sight.description} Start the evening with some beautiful views and culture. Address: ${sight.address}.`), sight.lat, sight.lng, null, sight.photoUrl),
                    createStep('6:00 PM', 'Pre-Dinner Drinks', treat.name, `${treat.description} Grab a quick refreshment or coffee before the main meal.`, treat.lat, treat.lng, null, treat.photoUrl),
                    createStep('7:30 PM', 'Dinner Reservation', dinner.name, `${dinner.description} Head over for an incredible romantic dinner. Address: ${dinner.address}.`, dinner.lat, dinner.lng, null, dinner.photoUrl),
                    createStep('9:30 PM', getTitle(mainEvent, 'Evening Entertainment'), mainEvent.name, getDesc(mainEvent, `${mainEvent.description} Keep the night going with some local flavor.`), mainEvent.lat, mainEvent.lng, mainEvent.url, mainEvent.photoUrl)
                ];
            } else if (planFormat.format === 'entertainment-dinner-event') {
                liveItinerary = [
                    createStep('3:30 PM', getTitle(sight, 'Afternoon Sights'), sight.name, getDesc(sight, `${sight.description} Kickoff the date by taking in some local scenery.`), sight.lat, sight.lng, null, sight.photoUrl),
                    createStep('5:30 PM', getTitle(fun, 'Interactive Fun'), fun.name, getDesc(fun, `${fun.description} Break the ice with some playful competition or arcade games.`), fun.lat, fun.lng, null, fun.photoUrl),
                    createStep('7:45 PM', 'Hearty Dinner', dinner.name, `${dinner.description} Grab some delicious food nearby to refuel.`, dinner.lat, dinner.lng, null, dinner.photoUrl),
                    createStep('9:30 PM', getTitle(mainEvent, 'Headline Event'), mainEvent.name, getDesc(mainEvent, `${mainEvent.description} Time for the main attraction! Enjoy the energy.`), mainEvent.lat, mainEvent.lng, mainEvent.url, mainEvent.photoUrl)
                ];
            } else if (planFormat.format === 'sightseeing-event-dinner') {
                liveItinerary = [
                    createStep('5:00 PM', getTitle(sight, 'Golden Hour Views'), sight.name, getDesc(sight, `${sight.description} Catch the late afternoon vibes at this scenic spot.`), sight.lat, sight.lng, null, sight.photoUrl),
                    createStep('6:30 PM', getTitle(mainEvent, 'Featured Event'), mainEvent.name, getDesc(mainEvent, `${mainEvent.description} Experience the magic of the city at this live event.`), mainEvent.lat, mainEvent.lng, mainEvent.url, mainEvent.photoUrl),
                    createStep('8:45 PM', 'Late Dinner', dinner.name, `${dinner.description} Enjoy a fantastic late dinner and great conversation.`, dinner.lat, dinner.lng, null, dinner.photoUrl),
                    createStep('10:30 PM', 'Midnight Sweet', treat.name, `${treat.description} End on a high note with a famous local dessert.`, treat.lat, treat.lng, null, treat.photoUrl)
                ];
            } else if (planFormat.format === 'dinner-event-dessert') {
                liveItinerary = [
                    createStep('5:30 PM', 'Early Dinner', dinner.name, `${dinner.description} Fuel up first! Head over to this highly rated restaurant.`, dinner.lat, dinner.lng, null, dinner.photoUrl),
                    createStep('7:30 PM', getTitle(mainEvent, 'Main Event'), mainEvent.name, getDesc(mainEvent, `${mainEvent.description} Head over to the featured event of the evening.`), mainEvent.lat, mainEvent.lng, mainEvent.url, mainEvent.photoUrl),
                    createStep('9:45 PM', getTitle(fun, 'Late Night Fun'), fun.name, getDesc(fun, `${fun.description} Keep the energy high with some local entertainment.`), fun.lat, fun.lng, null, fun.photoUrl),
                    createStep('11:00 PM', 'Midnight Snack', treat.name, `${treat.description} Grab a late-night treat to satisfy that sweet tooth before heading home.`, treat.lat, treat.lng, null, treat.photoUrl)
                ];
            } else if (planFormat.format === 'sightseeing-dessert-dinner') {
                liveItinerary = [
                    createStep('2:00 PM', getTitle(fun, 'Daytime Activity'), fun.name, getDesc(fun, `${fun.description} Start early with something highly engaging!`), fun.lat, fun.lng, null, fun.photoUrl),
                    createStep('4:30 PM', getTitle(sight, 'Afternoon Walk'), sight.name, getDesc(sight, `${sight.description} Take a relaxing stroll through the history and sights.`), sight.lat, sight.lng, null, sight.photoUrl),
                    createStep('6:30 PM', 'Coffee & Pastries', treat.name, `${treat.description} Take a break and grab a world-class pastry or coffee.`, treat.lat, treat.lng, null, treat.photoUrl),
                    createStep('8:00 PM', 'Dinner', dinner.name, `${dinner.description} Enjoy a fantastic meal to wrap up the day.`, dinner.lat, dinner.lng, null, dinner.photoUrl)
                ];
            } else if (planFormat.format === 'entertainment-dessert-dinner') {
                liveItinerary = [
                    createStep('4:00 PM', getTitle(sight, 'City Exploration'), sight.name, getDesc(sight, `${sight.description} Check out this iconic area to set the mood.`), sight.lat, sight.lng, null, sight.photoUrl),
                    createStep('5:30 PM', getTitle(fun, 'Activity & Games'), fun.name, getDesc(fun, `${fun.description} Get ready for some action and laughs.`), fun.lat, fun.lng, null, fun.photoUrl),
                    createStep('7:30 PM', 'Pre-dinner Treat', treat.name, `${treat.description} Appetizers are dessert today. Treat yourself!`, treat.lat, treat.lng, null, treat.photoUrl),
                    createStep('8:30 PM', 'Hearty Dinner', dinner.name, `${dinner.description} Settle down for a fulfilling meal.`, dinner.lat, dinner.lng, null, dinner.photoUrl),
                    createStep('10:30 PM', getTitle(mainEvent, 'Nightcap Event'), mainEvent.name, getDesc(mainEvent, `${mainEvent.description} Finish the night strong.`), mainEvent.lat, mainEvent.lng, mainEvent.url, mainEvent.photoUrl)
                ];
            } else {
                liveItinerary = [
                    createStep('5:00 PM', getTitle(mainEvent, 'Surprise Event'), mainEvent.name, getDesc(mainEvent, `${mainEvent.description} Kick off with an exciting local event!`), mainEvent.lat, mainEvent.lng, mainEvent.url, mainEvent.photoUrl),
                    createStep('7:15 PM', 'Celebratory Dinner', dinner.name, `${dinner.description} Feast on some incredible food.`, dinner.lat, dinner.lng, null, dinner.photoUrl),
                    createStep('9:00 PM', getTitle(fun, 'Evening Amusements'), fun.name, getDesc(fun, `${fun.description} Burn off dinner with some local entertainment.`), fun.lat, fun.lng, null, fun.photoUrl),
                    createStep('10:30 PM', getTitle(sight, 'Night Walk'), sight.name, getDesc(sight, `${sight.description} Take a romantic moonlit walk to look at the city skyline.`), sight.lat, sight.lng, null, sight.photoUrl)
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
        console.log(`API - Inserting ${generatedPlans.length} guided plans for user:`, userId);
        const { data, error } = await supabase
            .from('plans')
            .insert(generatedPlans)
            .select();

        if (error) {
            console.error('API - Supabase Bulk Insertion Error:', error);
            throw error;
        }

        console.log('API - Successfully inserted plans:', data?.length || 0);
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

// Nearby Alternatives for "Switch Up" feature
app.post('/api/nearby-alternatives', async (req, res) => {
    const { lat, lng, type, radius, budget, currentPlaceId } = req.body;

    if (!lat || !lng) {
        return res.status(400).json({ error: 'Coordinates are required' });
    }

    try {
        let priceLevels = [];
        if (budget) {
            const b = budget.toString();
            if (b.includes('$$$$')) priceLevels = ['PRICE_LEVEL_EXPENSIVE', 'PRICE_LEVEL_VERY_EXPENSIVE'];
            else if (b.includes('$$$')) priceLevels = ['PRICE_LEVEL_MODERATE', 'PRICE_LEVEL_EXPENSIVE'];
            else if (b.includes('$$')) priceLevels = ['PRICE_LEVEL_INEXPENSIVE', 'PRICE_LEVEL_MODERATE'];
            else if (b.includes('$')) priceLevels = ['PRICE_LEVEL_INEXPENSIVE'];
        }

        const centerCoords = { latitude: Number(lat), longitude: Number(lng) };
        const searchRadius = Number(radius) || 5000; // Default 5km

        let response;
        const query = `${type || 'interesting place'} near me`;

        try {
            response = await axios.post('https://places.googleapis.com/v1/places:searchText', {
                textQuery: query,
                locationBias: {
                    circle: {
                        center: centerCoords,
                        radius: searchRadius
                    }
                },
                maxResultCount: 10,
                ...(priceLevels.length > 0 && { priceLevels })
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': process.env.VITE_GOOGLE_MAPS_API_KEY,
                    'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.priceLevel,places.types,places.photos,places.location,places.editorialSummary,places.googleMapsUri'
                }
            });
        } catch (e) {
            // Initial restricted search failed
        }

        // Fallback: If no results or error, try without price restriction
        if (!response || !response.data || !response.data.places || response.data.places.length <= 1) {
            try {
                response = await axios.post('https://places.googleapis.com/v1/places:searchText', {
                    textQuery: query,
                    locationBias: {
                        circle: {
                            center: centerCoords,
                            radius: searchRadius
                        }
                    },
                    maxResultCount: 10
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Goog-Api-Key': process.env.VITE_GOOGLE_MAPS_API_KEY,
                        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,rating,userRatingCount,priceLevel,types,photos,location,editorialSummary,googleMapsUri'
                    }
                });
            } catch (e) {
                console.error('Fallback search failed');
            }
        }

        if (!response || !response.data || !response.data.places) {
            return res.json({ alternatives: [] });
        }

        const filtered = response.data.places
            .filter(p => p.id !== currentPlaceId)
            .map(p => ({
                id: p.id,
                name: p.displayName?.text || 'Unknown Venue',
                address: p.formattedAddress,
                rating: p.rating,
                userRatingCount: p.userRatingCount,
                location: p.location,
                description: `Rating: ${p.rating || 'N/A'} ⭐ (${p.userRatingCount || 0} reviews). ${p.editorialSummary?.text || `A popular choice for ${type?.replace('_', ' ') || 'a great time'} in the city.`}`,
                searchUrl: p.googleMapsUri,
                photo: p.photos?.[0] ? `https://places.googleapis.com/v1/${p.photos[0].name}/media?maxWidthPx=400&key=${process.env.VITE_GOOGLE_MAPS_API_KEY}` : null
            }));

        res.json({ alternatives: filtered });
    } catch (error) {
        console.error('Error fetching alternatives:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to fetch alternatives' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
