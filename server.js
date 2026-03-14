import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import NodeCache from 'node-cache';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const cache = new NodeCache({ stdTTL: 3600 }); // Cache for 1 hour

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
    const { userId, concept, date } = req.body;

    if (!userId || !concept) {
        return res.status(400).json({ error: 'User ID and Concept are required.' });
    }

    try {
        const YELP_API_KEY = process.env.YELP_API_KEY;

        const fetchPlaces = async (searchString) => {
            const pCacheKey = `custom_${Buffer.from(searchString).toString('base64')}`;
            if (cache.has(pCacheKey)) return cache.get(pCacheKey);
            if (!YELP_API_KEY) return null;

            try {
                const res = await axios.get('https://api.yelp.com/v3/businesses/search', {
                    headers: {
                        Authorization: `Bearer ${YELP_API_KEY}`,
                        accept: 'application/json'
                    },
                    params: { term: searchString, location: 'New York City', limit: 3, sort_by: 'rating' }
                });

                if (res.data && res.data.businesses && res.data.businesses.length > 0) {
                    const place = res.data.businesses[0]; // Take the best match
                    const result = {
                        name: place.name,
                        description: `Rating: ${place.rating} ⭐ (${place.review_count} reviews). Price: ${place.price || 'N/A'}.`,
                        lat: place.coordinates.latitude,
                        lng: place.coordinates.longitude,
                        address: place.location.display_address ? place.location.display_address.join(', ') : 'New York City, NY',
                        photoUrl: place.image_url || null,
                        url: place.url
                    };
                    cache.set(pCacheKey, result);
                    return result;
                }
            } catch (err) { console.error(`Failed Yelp custom fetch for ${searchString}:`, err.message); }
            return null;
        };

        const terms = concept.searchTerms || [];
        const durationStrs = concept.durations || ["1.5 hrs", "2 hrs", "1.5 hrs"];

        // Execute Google Places searches in parallel for the 3 distinct terms
        const placePromises = terms.map(term => fetchPlaces(term));
        const placesResults = await Promise.all(placePromises);

        // Fallbacks
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

            liveItinerary.push({
                time: timeStr,
                activity: `Stop ${i + 1} (${duration})`,
                venue: place.name,
                description: `${place.description} Address: ${place.address}. Expected duration: ${duration}.`,
                url: place.url || `https://www.google.com/search?q=${encodeURIComponent(place.name + ' New York City')}`,
                directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`,
                lat: place.lat,
                lng: place.lng,
                photoUrl: place.photoUrl
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
    const { userId, location, vibe, startTime, endTime, budget, activities, interests, date } = req.body;

    if (!userId || !location) {
        return res.status(400).json({ error: 'User ID and Location are required' });
    }

    try {
        const YELP_API_KEY = process.env.YELP_API_KEY;

        let events = [];
        let restaurants = [];
        let entertainment = [];
        let sightseeing = [];
        let desserts = [];
        let customPlaces = [];

        if (YELP_API_KEY) {
            const fetchPlaces = async (queryType, searchString) => {
                const pCacheKey = `yelp_nyc_${queryType}_${budget || 'moderate'}_${searchString}`;
                if (cache.has(pCacheKey)) return cache.get(pCacheKey);

                // Map frontend budget strings to Yelp price tiers (1=$, 2=$$, 3=$$$, 4=$$$$)
                // Yelp fusion accepts a comma separated list e.g. "1,2"
                let priceFilter = '1,2,3,4';
                if (budget === 'low') priceFilter = '1,2';
                else if (budget === 'moderate') priceFilter = '2,3';
                else if (budget === 'high') priceFilter = '3,4';

                try {
                    const res = await axios.get('https://api.yelp.com/v3/businesses/search', {
                        headers: {
                            Authorization: `Bearer ${YELP_API_KEY}`,
                            accept: 'application/json'
                        },
                        params: {
                            term: searchString,
                            location: 'New York City',
                            limit: 20,
                            sort_by: 'rating',
                            price: priceFilter,
                            // Categories to help narrow down search
                            categories: queryType === 'events' || queryType === 'entertainment' ? 'arts,active,localflavor'
                                : queryType === 'food' ? 'restaurants'
                                    : queryType === 'dessert' ? 'desserts,bakeries,icecream'
                                        : ''
                        }
                    });

                    if (res.data && res.data.businesses) {
                        const results = res.data.businesses.slice(0, 20).map(place => ({
                            name: place.name,
                            description: `Rating: ${place.rating} ⭐ (${place.review_count} reviews). Price: ${place.price || 'N/A'}. A top-rated spot.`,
                            lat: place.coordinates.latitude,
                            lng: place.coordinates.longitude,
                            address: place.location.display_address ? place.location.display_address.join(', ') : 'New York City, NY',
                            photoUrl: place.image_url || null,
                            url: place.url
                        }));
                        cache.set(pCacheKey, results);
                        return results;
                    }
                } catch (err) { console.error(`Failed ${queryType} fetch:`, err.message); }
                return [];
            };

            // Process the interests filter
            const interestQuery = (interests && interests !== 'Any') ? `${interests} ` : '';

            // Run requests in parallel, injecting the interest query
            const fetchPromises = [
                fetchPlaces('events', `${interestQuery}live event theater or comedy club or concert ${vibe}`),
                fetchPlaces('food', `${interestQuery}highly rated romantic restaurant ${budget || ''}`),
                fetchPlaces('entertainment', `${interestQuery}bowling alley or interactive entertainment or arcade`),
                fetchPlaces('sightseeing', `${interestQuery}scenic pier or hudson river park or museum`),
                fetchPlaces('dessert', `${interestQuery}famous bakery or dessert or ice cream`)
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

        // Fallbacks if APIs are exhausted
        const getFallback = (type, i) => ({
            name: `NYC ${type} Spot ${i + 1}`,
            description: `A fantastic local ${type} venue in the heart of New York City.`,
            lat: 40.7128 + (i * 0.005), lng: -74.0060 + (i * 0.005),
            address: 'New York City, NY',
            photoUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=80',
            url: type === 'Event' ? 'https://www.google.com' : null
        });
        if (!events.length) events = Array(7).fill().map((_, i) => getFallback('Event', i));
        if (!restaurants.length) restaurants = Array(7).fill().map((_, i) => getFallback('Restaurant', i));
        if (!entertainment.length) entertainment = Array(7).fill().map((_, i) => getFallback('Entertainment', i));
        if (!sightseeing.length) sightseeing = Array(7).fill().map((_, i) => getFallback('Sightseeing', i));
        if (!desserts.length) desserts = Array(7).fill().map((_, i) => getFallback('Dessert', i));

        // Shuffle arrays to ensure variety every time user clicks generate
        const shuffle = (array) => [...array].sort(() => 0.5 - Math.random());
        const shuffledEvents = shuffle(events);
        const shuffledRestaurants = shuffle(restaurants);
        const shuffledEntertainment = shuffle(entertainment);
        const shuffledSightseeing = shuffle(sightseeing);
        const shuffledDesserts = shuffle(desserts);
        const shuffledCustom = shuffle(customPlaces);

        // 3. Assemble 7 cohesive, highly descriptive itinerary variations
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

        for (let i = 0; i < 7; i++) {
            const custom = shuffledCustom.length > 0 ? shuffledCustom[i % shuffledCustom.length] : null;

            const dinner = shuffledRestaurants[i % shuffledRestaurants.length];
            const treat = shuffledDesserts[i % shuffledDesserts.length];

            const planFormat = planTypes[i];

            // Override one of the standard slots with the custom requested activity if present
            const mainEvent = custom && planFormat.format.includes('event') ? custom : shuffledEvents[i % shuffledEvents.length];
            const sight = custom && !planFormat.format.includes('event') && planFormat.format.includes('sightseeing') ? custom : shuffledSightseeing[i % shuffledSightseeing.length];
            const fun = custom && !planFormat.format.includes('event') && !planFormat.format.includes('sightseeing') ? custom : shuffledEntertainment[i % shuffledEntertainment.length];

            const isCustom = (venueObj) => custom && venueObj.name === custom.name;
            const getTitle = (venueObj, defaultTitle) => isCustom(venueObj) ? 'Your Custom Request' : defaultTitle;
            const getDesc = (venueObj, defaultDesc) => isCustom(venueObj) ? `Exactly what you asked for! ${venueObj.description}` : defaultDesc;

            let liveItinerary = [];

            const createStep = (time, activity, venue, description, lat, lng, url = null, photoUrl = null) => ({
                time, activity, venue,
                description: `${description} Location: ${venue}. Make sure to take pictures!`,
                url: url || `https://www.google.com/search?q=${encodeURIComponent(venue + ' New York City')}`,
                directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, lat, lng, photoUrl
            });

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
app.use(express.static(path.join(__dirname, 'dist')));

// Catch-all route to serve index.html for React Router
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
