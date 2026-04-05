import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Resend } from 'resend';
import Stripe from 'stripe';
import nodeCron from 'node-cron';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// API Keys
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const GOOGLE_API_KEY = process.env.VITE_GOOGLE_MAPS_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const NEXT_PUBLIC_BASE_URL = process.env.VITE_APP_URL || 'http://localhost:5173';

// Clients
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const stripe = new Stripe(STRIPE_SECRET_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const GEMINI_MODEL = "gemini-1.5-flash-latest";

app.use(cors());
app.use(express.json());

// Diagnostic Startup Log - Pointed to organized /logs folder
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

const startupLogPath = path.join(logsDir, 'startup_diag.txt');
const errorLogPath = path.join(logsDir, 'error_log.txt');
fs.writeFileSync(startupLogPath, `[STARTUP] Server booting at ${new Date().toISOString()}\n`);

function logError(tag, err) {
    const errorMsg = err.response?.data 
        ? JSON.stringify(err.response.data) 
        : (err.raw?.message || err.message || 'Unknown error');
    const msg = `[${new Date().toISOString()}] ${tag}: ${errorMsg}\n`;
    fs.appendFileSync(errorLogPath, msg);
    console.error(tag, errorMsg);
}

// Helper: Usage Tracking & Limits
async function checkAndIncrementUsage(userId, type) {
    try {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
        if (!profile) return { allowed: true, isPremium: false }; 

        const isPremium = !!profile.is_premium;
        if (isPremium) return { allowed: true, isPremium, profile };

        const { data: usage } = await supabase
            .from('usage_tracking')
            .select('*')
            .eq('user_id', userId)
            .eq('type', type)
            .single();

        const limits = { classic: 3, guided: 2, swap: 10 };
        const now = new Date();
        const lastUpdate = usage ? new Date(usage.updated_at || usage.created_at) : null;
        const isCooldownActive = lastUpdate && (now - lastUpdate < 24 * 60 * 60 * 1000);

        // If limit reached AND we are within 24h of the last generation -> Reject
        if (usage && isCooldownActive && usage.count >= limits[type]) {
            return { allowed: false, isPremium, profile };
        }

        if (!usage) {
            await supabase.from('usage_tracking').insert([{ user_id: userId, type, count: 1 }]);
        } else if (!isCooldownActive) {
            // 24 hours have passed since the last tracked activity -> Reset count
            await supabase.from('usage_tracking').update({ count: 1, updated_at: now.toISOString() }).eq('id', usage.id);
        } else {
            // Still within 24h but haven't hit limit yet -> Increment
            await supabase.from('usage_tracking').update({ count: usage.count + 1, updated_at: now.toISOString() }).eq('id', usage.id);
        }
        return { allowed: true, isPremium, profile };
    } catch (err) {
        console.error('[Usage Error]', err);
        return { allowed: true, isPremium: false }; 
    }
}

// RESTORED ENDPOINTS
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// User Profile & Premium Sync
app.get('/api/user-premium/:userId', async (req, res) => {
    try {
        const { data } = await supabase.from('profiles').select('*').eq('id', req.params.userId).single();
        res.json({ 
            isPremium: !!data?.is_premium, 
            premium_expiry: data?.premium_expiry, 
            referral_code: data?.referral_code, 
            referral_count: data?.referral_count 
        });
    } catch (err) { res.status(500).json({ error: 'DB Error' }); }
});

app.get('/api/user-usage/:userId', async (req, res) => {
    try {
        const { data } = await supabase.from('usage_tracking').select('*').eq('user_id', req.params.userId);
        const usage = { classic: 0, guided: 0, swap: 0 };
        const limits = { classic: 3, guided: 2, swap: 10 };
        data?.forEach(u => { usage[u.type] = u.count; });
        res.json({ usage, limits });
    } catch (err) { res.status(500).json({ error: 'DB Error' }); }
});

// POPULAR DISCOVERY & TRENDING
app.get('/api/trending-plans', async (req, res) => {
    try {
        const { data } = await supabase
            .from('plans')
            .select('*')
            .is('deleted_at', null)
            .order('boost_count', { ascending: false })
            .limit(20);
        
        // High Quality venues only (Frontend further filters as needed)
        res.json(data);
    } catch (err) { res.status(500).json({ error: 'DB Error fetching trending' }); }
});

app.get('/api/place-ratings', async (req, res) => {
    const { planId } = req.query;
    if (!planId) return res.status(400).json({ error: 'Plan ID required' });
    try {
        const { data: plan } = await supabase.from('plans').select('itinerary').eq('id', planId).single();
        if (!plan?.itinerary?.steps) return res.json([]);

        const ratings = await Promise.all(plan.itinerary.steps.map(async (step) => {
            if (!step.placeId) return { id: step.id, rating: null, userRatingCount: 0 };
            try {
                // Standard Places API (Old)
                const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${step.placeId}&fields=rating,user_ratings_total&key=${GOOGLE_API_KEY}`;
                const placeRes = await axios.get(url);
                const p = placeRes.data?.result;
                return { id: step.id, placeId: step.placeId, rating: p?.rating, userRatingCount: p?.user_ratings_total };
            } catch { return { id: step.id, rating: null, userRatingCount: 0 }; }
        }));
        res.json(ratings);
    } catch (err) { res.status(500).json({ error: 'Fetch Failed' }); }
});

app.get('/api/plans/:id', async (req, res) => {
    try {
        const { data, error } = await supabase.from('plans').select('*').eq('id', req.params.id).single();
        if (error) throw error;
        res.json(data);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// USER PLANS (Active only)
app.get('/api/user-plans', async (req, res) => {
    const { userId } = req.query;
    try {
        const { data } = await supabase
            .from('plans')
            .select('*')
            .eq('user_id', userId)
            .is('deleted_at', null)
            .order('created_at', { ascending: false });
        res.json(data);
    } catch (err) { res.status(500).json({ error: 'DB Error fetching user plans' }); }
});

// SWAP LOGIC
app.post('/api/nearby-alternatives', async (req, res) => {
    let { lat, lng, type, radius, budget, currentPlaceId, userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'User ID is required' });
    
    try {
        const usageCheck = await checkAndIncrementUsage(userId, 'swap');
        if (!usageCheck.allowed) return res.status(403).json({ error: 'Limit reached', type: 'LIMIT_REACHED' });

        // Sanitize radius: ensure it's a number (strip "km", "m", etc.)
        let cleanRadius = 10000;
        if (typeof radius === 'string') {
            const match = radius.match(/\d+/);
            if (match) {
                cleanRadius = parseInt(match[0]);
                if (radius.toLowerCase().includes('km')) cleanRadius *= 1000;
            }
        } else if (typeof radius === 'number') {
            cleanRadius = radius;
        }

        const centerCoords = { latitude: Number(lat), longitude: Number(lng) };
        const salts = ['trending', 'top rated', 'hidden gem', 'popular', 'best'];
        const salt = salts[Math.floor(Math.random() * salts.length)];
        
        const query = `${type?.replace('_', ' ') || 'place'} ${salt} near this location`;
        
        // Standard Places API (Old) - Text Search
        const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${lat},${lng}&radius=${Math.min(cleanRadius, 40000)}&key=${GOOGLE_API_KEY}`;
        const response = await axios.get(searchUrl);
        let places = response.data?.results || [];

        // Fallback Stage 2
        if (places.length < 3) {
            const fallbackUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(`${type?.replace('_', ' ') || 'place'} in this area`)}&location=${lat},${lng}&radius=15000&key=${GOOGLE_API_KEY}`;
            const fallbackResponse = await axios.get(fallbackUrl);
            const fallbackPlaces = fallbackResponse.data?.results || [];
            places = [...places, ...fallbackPlaces.filter(fp => !places.find(p => p.place_id === fp.place_id))];
        }

        const filtered = places
            .filter(p => p.place_id !== currentPlaceId)
            .map(p => {
                const priceSymbols = p.price_level ? '$'.repeat(p.price_level) : '$$';
                const ratingInfo = p.rating ? `${p.rating} ⭐ (${(p.user_ratings_total || 0).toLocaleString()} reviews)` : 'Newly discovered gem';
                
                return {
                    id: p.place_id,
                    name: p.name || 'Venue',
                    address: p.formatted_address,
                    rating: p.rating,
                    userRatingCount: p.user_ratings_total,
                    priceLevel: priceSymbols,
                    location: { latitude: p.geometry?.location?.lat, longitude: p.geometry?.location?.lng },
                    description: `${ratingInfo}. This ${priceSymbols} spot is a highly-recommended alternative for your date!`,
                    searchUrl: `https://www.google.com/maps/place/?q=place_id:${p.place_id}`,
                    photo: p.photos?.[0]?.photo_reference 
                        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${p.photos[0].photo_reference}&key=${GOOGLE_API_KEY}` 
                        : 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=80'
                };
            });

        res.json({ alternatives: filtered.sort(() => 0.5 - Math.random()).slice(0, 5) });
    } catch (err) {
        logError('[SWAP ERROR]', err);
        res.status(500).json({ error: 'Failed to fetch alternatives.' });
    }
});

// --- GOOGLE PLACES OPTIMIZED GENERATOR (No AI Tokens) ---
const VIBE_MAPPING = {
    romantic: ['cozy cafe or viewpoint', 'romantic fine dining restaurant', 'dessert shop or wine bar'],
    adventurous: ['active entertainment or park', 'unique themed restaurant', 'fun activity or arcade'],
    trendy: ['modern rooftop or cafe', 'fusion restaurant or bistro', 'speakeasy or cocktail bar'],
    chill: ['quiet park or bookstore', 'casual comfort food restaurant', 'cozy cafe or scenic spot'],
    fun: ['interactive experience or game', 'lively shared plates restaurant', 'dessert spot or fun bar'],
    budget: ['free local attraction', 'popular affordable restaurant', 'scenic public park']
};

async function generateStandardItinerary(numVariants, vibe, location, calcDuration) {
    const queries = VIBE_MAPPING[vibe.toLowerCase()] || VIBE_MAPPING['chill'];
    const plans = [];

    for (let i = 0; i < numVariants; i++) {
        const steps = [];
        const times = ['7:00 PM', '8:30 PM', '10:00 PM'];
        
        for (let j = 0; j < queries.length; j++) {
            const query = `${queries[j]} near ${location}`;
            const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}`;
            const response = await axios.get(searchUrl);
            const results = response.data?.results || [];
            
            // Pick a random result offset by variant index to ensure diversity
            const place = results[(i + j) % Math.max(results.length, 1)] || { name: 'Local Gem', formatted_address: location };
            
            steps.push({
                time: times[j],
                venue: place.name,
                activity: queries[j].split(' or ')[0],
                description: `Experience the best ${vibe} vibes at this highly-rated local spot! Perfect for a memorable ${j === 1 ? 'dinner' : 'evening'} in ${location}.`,
                search_term: place.name,
                sub_headline: j === 0 ? "The Perfect Start" : j === 1 ? "A Taste of Magic" : "Ending on a High Note",
                vibe_score: 9,
                placeId: place.place_id,
                address: place.formatted_address,
                lat: place.geometry?.location?.lat,
                lng: place.geometry?.location?.lng,
                rating: place.rating || (4.5 + (Math.random() * 0.4)), // Realistic fallback
                userRatingCount: place.user_ratings_total || Math.floor(Math.random() * 800) + 200, // Realistic fallback
                searchUrl: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
                websiteUrl: place.website || `https://www.google.com/search?q=${encodeURIComponent(place.name + ' ' + place.formatted_address)}`, // Direct fallback
                photoUrl: place.photos?.[0]?.photo_reference 
                    ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_API_KEY}` 
                    : 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80'
            });
        }
        const capitalizedVibe = vibe.charAt(0).toUpperCase() + vibe.slice(1).toLowerCase();
        plans.push({ 
            vibe_variant: i === 0 ? `The Ultimate ${capitalizedVibe} Experience` : `A Curated ${capitalizedVibe} Evening`, 
            steps 
        });
    }
    return { plans };
}

// GENERATOR
// GENERATOR (Classic & Aliases)
app.post(['/api/generate-date', '/api/itinerary-generator'], async (req, res) => {
    const { userId, vibe, location, duration, time, endTime, budget, planDate, customization } = req.body;
    if (!userId) return res.status(400).json({ error: 'User ID is required' });

    try {
        const type = customization?.type || 'classic';
        const usageCheck = await checkAndIncrementUsage(userId, type);
        if (!usageCheck.allowed) return res.status(403).json({ error: 'Limit reached', type: 'LIMIT_REACHED' });

        const isPremium = !!usageCheck.isPremium;
        const numVariants = isPremium ? 3 : 2;
        const stepsPerPlan = 3; // Standardized to 3 steps for all (Gating blurs 3rd for free)

        // Calculate hours if time/endTime provided
        let calcDuration = duration || 4;
        if (time && endTime) {
            const start = parseInt(time.split(':')[0]);
            const end = parseInt(endTime.split(':')[0]);
            calcDuration = end > start ? end - start : (24 - start) + end;
        }

        let rawPlans = [];

        // --- FORK: Guided Builder (Places API) vs Custom (AI) ---
        if (!customization?.prompt) {
            console.log(`[GENERATOR] Guided Builder: Using Places API Template for ${vibe} in ${location}`);
            const data = await generateStandardItinerary(numVariants, vibe, location, calcDuration);
            rawPlans = data.plans || [];
        } else {
            console.log(`[GENERATOR] Custom AI: Using Gemini 2.0 Flash for Prompt: "${customization.prompt}"`);
            const model = genAI.getGenerativeModel({ model: GEMINI_MODEL }); 
            const prompt = `Create ${numVariants} distinct ${vibe} date itinerary variations in ${location} for ${budget || 'moderate'} budget. User request: "${customization.prompt}".
            Return JSON object: { "plans": [ { "vibe_variant": "string", "steps": [ { "time": "string", "venue": "string", "activity": "string", "description": "string", "search_term": "string", "sub_headline": "string (viral catchphrase, max 6 words)", "vibe_score": number, "rating": number, "user_rating_count": number } ] } ] }
            Generate EXACTLY ${stepsPerPlan} steps per plan. Do NOT use all uppercase for sub_headlines. Use realistic ratings (4.5-4.9) and review counts (100-3000). Date: ${planDate}.`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const data = JSON.parse(response.text().match(/\{.*\}/s)?.[0] || '{ "plans": [] }');
            rawPlans = data.plans || [];
        }

        const createdPlans = await Promise.all(rawPlans.map(async (pData, pIdx) => {
            // Enhanced Steps (Only needed for AI results as Guided Builder already hydrated)
            const enhancedSteps = !customization?.prompt ? pData.steps : await Promise.all(pData.steps.map(async (step) => {
                try {
                    const searchRes = await axios.get(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent((step.venue || step.activity) + ' near ' + location)}&key=${GOOGLE_API_KEY}`);
                    const place = searchRes.data?.results?.[0];
                    return {
                        ...step,
                        placeId: place?.place_id,
                        address: place?.formatted_address || location,
                        lat: place?.geometry?.location?.lat,
                        lng: place?.geometry?.location?.lng,
                        rating: place?.rating || step.rating || 4.7,
                        userRatingCount: place?.user_ratings_total || step.user_rating_count || 450,
                        searchUrl: `https://www.google.com/maps/place/?q=place_id:${place?.place_id}`,
                        websiteUrl: place?.website || `https://www.google.com/search?q=${encodeURIComponent(step.venue || step.activity)}`,
                        photoUrl: place?.photos?.[0]?.photo_reference ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_API_KEY}` : 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80'
                    };
                } catch { return step; }
            }));

            const isCurrentPreview = !isPremium && pIdx === 1;
            const { data: newPlan } = await supabase.from('plans').insert([{
                user_id: userId, vibe: pData.vibe_variant || vibe, location, budget, 
                itinerary: { steps: enhancedSteps, metadata: { planDate, type, time, endTime, totalSteps: stepsPerPlan, isPremiumGenerated: isPremium, isPreviewPlan: isCurrentPreview } }
            }]).select().single();
            return newPlan;
        }));

        res.json(createdPlans);
    } catch (err) {
        logError('[GEN ERROR]', err);
        res.status(500).json({ error: 'Failed to generate itinerary.' });
    }
});

// AI GUIDED BUILDER: SUGGEST CONCEPTS
app.post('/api/suggest-date-concepts', async (req, res) => {
    const { conversationHistory, location, userId, budget } = req.body;
    if (!userId) return res.status(400).json({ error: 'User ID is required' });

    try {
        const usageCheck = await checkAndIncrementUsage(userId, 'guided');
        if (!usageCheck.allowed) return res.status(403).json({ error: 'Limit reached', type: 'LIMIT_REACHED' });

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
        const historyText = conversationHistory.map(h => `${h.role}: ${h.text}`).join('\n');
        
        const prompt = `Based on this conversation:\n${historyText}\nLocation: ${location}, Budget: ${budget || 'any'}.\nSuggest 3 unique date concepts. Format: { concepts: [{title, description}], questions: [3 related questions] }. Use pure JSON.`;
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const jsonMatch = text.match(/\{.*\}/s);
        const data = JSON.parse(jsonMatch ? jsonMatch[0] : '{"concepts":[], "questions":[]}');
        
        res.json(data);
    } catch (err) {
        logError('[SUGGEST ERROR]', err);
        res.status(500).json({ error: 'Failed to brainstorm ideas.' });
    }
});

// AI GUIDED BUILDER: GENERATE CUSTOM DATE
app.post('/api/generate-custom-date', async (req, res) => {
    const { userId, concept, date, budget, location } = req.body;
    if (!userId) return res.status(400).json({ error: 'User ID is required' });

    try {
        const usageCheck = await checkAndIncrementUsage(userId, 'guided');
        if (!usageCheck.allowed) return res.status(403).json({ error: 'Limit reached', type: 'LIMIT_REACHED' });

        const isPremium = !!usageCheck.isPremium;
        const { data: existingPlans } = await supabase.from('usage_tracking').select('count').eq('user_id', userId).eq('type', 'guided').single();
        const planCount = existingPlans?.count || 0;
        const isPreviewPlan = !isPremium && planCount >= 1; // 1st is Full, 2nd+ is Preview
        const numSteps = 3; // Always 3 steps to maintain structure

        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
        const prompt = `Build a full itinerary for this concept: "${concept.title} - ${concept.description}". Location: ${location}. Format as JSON array of steps: [{time, venue, activity, description, search_term, rating, user_rating_count}]. Use specific real-world places. Generate EXACTLY ${numSteps} steps. Use realistic ratings (4.5-4.9) and review counts (100-3000).`;
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const jsonMatch = text.match(/\[.*\]/s);
        const rawSteps = JSON.parse(jsonMatch ? jsonMatch[0] : '[]');

        const enhancedSteps = await Promise.all(rawSteps.map(async (step) => {
            try {
                const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent((step.venue || step.activity) + ' in ' + location)}&key=${GOOGLE_API_KEY}`;
                const searchRes = await axios.get(searchUrl);
                const place = searchRes.data?.results?.[0];
                return {
                    ...step,
                    placeId: place?.place_id,
                    address: place?.formatted_address || location,
                    lat: place?.geometry?.location?.lat,
                    lng: place?.geometry?.location?.lng,
                    rating: place?.rating || step.rating || 4.8,
                    userRatingCount: place?.user_ratings_total || step.user_rating_count || 320,
                    searchUrl: `https://www.google.com/maps/place/?q=place_id:${place?.place_id}`,
                    websiteUrl: place?.website || `https://www.google.com/search?q=${encodeURIComponent((step.venue || step.activity) + ' in ' + location)}`,
                    photoUrl: place?.photos?.[0]?.photo_reference ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_API_KEY}` : 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80'
                };
            } catch { return step; }
        }));

        const { data: newPlan, error: insertError } = await supabase.from('plans').insert([{
            user_id: userId, vibe: concept.title, location, budget: budget || 'moderate', 
            itinerary: { steps: enhancedSteps, metadata: { planDate: date, type: 'guided', totalSteps: numSteps, isPremiumGenerated: isPremium, isPreviewPlan } }
        }]).select().single();

        if (insertError) throw insertError;
        res.json(newPlan);
    } catch (err) {
        logError('[CUSTOM GEN ERROR]', err);
        res.status(500).json({ error: 'Failed to build custom itinerary.' });
    }
});

// WAITLIST
app.post('/api/waitlist', async (req, res) => {
    const { email } = req.body;
    try {
        const { error } = await supabase.from('waitlist').insert([{ email }]);
        if (error) throw error;
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Failed to join waitlist' }); }
});

// UPDATE/BATCH TRASH/FAVORITE
app.patch('/api/update-plan', async (req, res) => {
    const { planId, updateData, isBatch } = req.body;
    try {
        if (isBatch) {
            const ids = planId.split(',');
            const { data, error } = await supabase.from('plans').update(updateData).in('id', ids).select();
            if (error) throw error;
            res.json(data);
        } else {
            const { data, error } = await supabase.from('plans').update(updateData).eq('id', planId).select().single();
            if (error) throw error;
            res.json(data);
        }
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// PERMANENT DELETE
app.post('/api/delete-plan', async (req, res) => {
    const { planId, isBatch } = req.body;
    try {
        let error;
        if (isBatch) {
            const ids = planId.split(',');
            ({ error } = await supabase.from('plans').delete().in('id', ids));
        } else {
            ({ error } = await supabase.from('plans').delete().eq('id', planId));
        }
        if (error) throw error;
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// SOCIAL
app.patch('/api/boost-plan', async (req, res) => {
    const { planId, userId } = req.body;
    try {
        const { data: plan } = await supabase.from('plans').select('boosted_by, boost_count').eq('id', planId).single();
        let boostedBy = Array.isArray(plan.boosted_by) ? plan.boosted_by : [];
        let count = Number(plan.boost_count || 0);

        if (boostedBy.includes(userId)) {
            boostedBy = boostedBy.filter(id => id !== userId);
            count = Math.max(0, count - 1);
        } else {
            boostedBy.push(userId);
            count += 1;
        }

        const { data } = await supabase.from('plans').update({ boosted_by: boostedBy, boost_count: count }).eq('id', planId).select().single();
        res.json(data);
    } catch (err) { res.status(500).json({ error: 'Boost Failed' }); }
});

app.post('/api/rate-place', async (req, res) => {
    const { planId, placeName, placeId, rating, quickTag, userId } = req.body;
    try {
        // Just log for now, or insert into a separate 'venue_ratings' table if it exists
        // For simplicity, we just return success as the frontend 'fire-and-forgets' this
        console.log(`[Rate Place] User ${userId} rated ${placeName} (${placeId}): ${rating} stars, ${quickTag}`);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Rate Place Failed' }); }
});

// STRIPE
app.post('/api/create-checkout-session', async (req, res) => {
    const { planType, userId, email } = req.body;
    
    if (!STRIPE_SECRET_KEY) {
        logError('[STRIPE ERROR]', new Error('STRIPE_SECRET_KEY is missing in .env'));
        return res.status(500).json({ error: 'Server configuration error: Stripe key missing.' });
    }

    try {
        const priceIds = { 
            '24H': process.env.STRIPE_PRICE_PASS, 
            'ELITE': process.env.STRIPE_PRICE_ELITE 
        };
        const priceId = priceIds[planType];
        
        if (!priceId) {
            return res.status(400).json({ error: `Invalid plan type: ${planType}. Ensure STRIPE_PRICE_PASS/ELITE are set in .env` });
        }

        const isSubscription = planType === 'ELITE';
        
        const sessionParams = {
            customer_email: email || undefined,
            line_items: [{ price: priceId, quantity: 1 }],
            mode: isSubscription ? 'subscription' : 'payment',
            success_url: `${NEXT_PUBLIC_BASE_URL}/dashboard?stripe_payment=success`,
            cancel_url: `${NEXT_PUBLIC_BASE_URL}/dashboard?stripe_payment=canceled`,
            metadata: { userId: userId || 'anonymous', planType }
        };

        if (isSubscription) {
            sessionParams.subscription_data = { trial_period_days: 30 };
        }

        const session = await stripe.checkout.sessions.create(sessionParams);
        res.json({ id: session.id, url: session.url });
    } catch (err) { 
        logError('[STRIPE ERROR]', err);
        const userMsg = err.type === 'StripeInvalidRequestError' 
            ? `Stripe Error: ${err.message}` 
            : 'Payment initialization failed. Please check your Stripe dashboard prices.';
        res.status(500).json({ error: userMsg }); 
    }
});

app.post('/api/update-premium-status', async (req, res) => {
    const { userId, isPremium } = req.body;
    try {
        const expiryDate = isPremium 
            ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() 
            : null;

        const { error } = await supabase.from('profiles').update({
            is_premium: isPremium,
            premium_expiry: expiryDate
        }).eq('id', userId);

        if (error) throw error;
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/create-portal-session', async (req, res) => {
    const { userId, email } = req.body;
    try {
        const customers = await stripe.customers.list({ email: email, limit: 1 });
        let customerId;
        if (customers.data.length > 0) {
            customerId = customers.data[0].id;
        } else {
            const customer = await stripe.customers.create({ email: email, metadata: { userId } });
            customerId = customer.id;
        }

        const session = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: `${NEXT_PUBLIC_BASE_URL}/dashboard`,
        });
        res.json({ url: session.url });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- PRODUCTION SERVING ---
// Serve static files from the 'dist' directory
app.use(express.static(path.join(__dirname, 'dist')));

// Handle SPA routing - deliver index.html for all non-API routes
// Using app.use() as a fallback because Express 5 dropped wildcard '*' support
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => console.log(`[SERVER] DateSpark live on ${PORT}`));
