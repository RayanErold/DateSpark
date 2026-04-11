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
// Service role client bypasses ALL RLS policies - use only for administrative/safe operations
const supabaseService = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const stripe = new Stripe(STRIPE_SECRET_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const GEMINI_MODEL = "gemini-2.5-flash";

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

        const limits = { classic: 2, guided: 2, swap: 3, save_weekly: 3 };
        const now = new Date();
        const lastUpdate = usage ? new Date(usage.updated_at || usage.created_at) : null;
        
        // Cooldown: 24h for standard, 7 days for weekly types
        const cooldownMs = type.endsWith('_weekly') ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
        const isCooldownActive = lastUpdate && (now - lastUpdate < cooldownMs);

        // If limit reached AND we are within the cooldown window -> Reject
        if (usage && isCooldownActive && usage.count >= limits[type]) {
            return { allowed: false, isPremium, profile };
        }

        if (!usage) {
            await supabase.from('usage_tracking').insert([{ user_id: userId, type, count: 1 }]);
        } else if (!isCooldownActive) {
            // Cooldown has passed -> Reset count
            await supabase.from('usage_tracking').update({ count: 1, updated_at: now.toISOString() }).eq('id', usage.id);
        } else {
            // Within cooldown window but haven't hit limit yet -> Increment
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
    } catch (err) { 
        logError('[PREMIUM SYNC ERROR]', err);
        res.status(500).json({ error: 'DB Connection Error' }); 
    }
});

app.get('/api/user-usage/:userId', async (req, res) => {
    try {
        const { data } = await supabase.from('usage_tracking').select('*').eq('user_id', req.params.userId);
        const usage = { classic: 0, guided: 0, swap: 0, save_weekly: 0 };
        const limits = { classic: 2, guided: 2, swap: 3, save_weekly: 3 };
        data?.forEach(u => { usage[u.type] = u.count; });
        res.json({ usage, limits });
    } catch (err) { res.status(500).json({ error: 'DB Error' }); }
});

app.post('/api/increment-save-usage', async (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'User ID is required' });
    try {
        const usageCheck = await checkAndIncrementUsage(userId, 'save_weekly');
        if (!usageCheck.allowed) return res.status(403).json({ error: 'Limit reached', code: 'LIMIT_REACHED' });
        res.json(usageCheck);
    } catch (err) {
        logError('[SAVE USAGE ERROR]', err);
        res.status(500).json({ error: 'Failed to update save usage' });
    }
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

// BULLETPROOF AVATAR UPLOAD PROXY
// Uses Service Role Key to bypass all RLS / Policy issues
app.post('/api/upload-avatar', express.raw({ type: 'image/*', limit: '10mb' }), async (req, res) => {
    const userId = req.headers['x-user-id'];
    const contentType = req.headers['content-type'];
    const fileExt = contentType?.split('/')[1] || 'png';
    const filePath = `${userId}.${fileExt}`;

    if (!userId) return res.status(400).json({ error: 'Missing User ID' });

    try {
        console.log(`[Proxy Upload] Starting avatar upload for user: ${userId} (${contentType})`);
        
        if (!req.body || req.body.length === 0) {
            throw new Error('No file data received in request body');
        }

        // 1. Upload to Storage using Service Client (Master Access)
        // Note: Using lowercase 'avatars' as the definitive bucket ID
        const { data, error: uploadError } = await supabaseService.storage
            .from('avatars')
            .upload(filePath, req.body, {
                upsert: true,
                contentType: contentType || 'image/png'
            });

        if (uploadError) {
            console.error('[Proxy Upload] Storage fail:', uploadError);
            throw uploadError;
        }

        // 2. Get Public URL
        const { data: { publicUrl } } = supabaseService.storage
            .from('avatars')
            .getPublicUrl(filePath);

        // 3. Update Auth Metadata
        const { error: updateError } = await supabaseService.auth.admin.updateUserById(
            userId,
            { user_metadata: { avatar_url: publicUrl } }
        );

        if (updateError) {
            console.error('[Proxy Upload] Auth update fail:', updateError);
            throw updateError;
        }

        console.log(`[Proxy Upload] Success! URL: ${publicUrl}`);
        res.json({ success: true, publicUrl });
    } catch (err) {
        logError('[PROXY UPLOAD ERROR]', err);
        res.status(500).json({ error: 'Failed to process photo upload: ' + err.message });
    }
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

// COMMUNITY ENGAGEMENT: Increment Tries
app.post('/api/plans/:id/try', async (req, res) => {
    const { id } = req.params;
    try {
        const { data: current } = await supabase.from('plans').select('total_tries').eq('id', id).single();
        const newCount = (current?.total_tries || 0) + 1;
        
        const { data, error } = await supabase
            .from('plans')
            .update({ total_tries: newCount })
            .eq('id', id)
            .select('total_tries')
            .single();

        if (error) throw error;
        res.json({ success: true, total_tries: data.total_tries });
    } catch (err) {
        logError('[TRY ERROR]', err);
        res.status(500).json({ error: 'Failed to update tries' });
    }
});

// COMMUNITY ENGAGEMENT: Toggle Boosts (Add/Remove)
app.post('/api/plans/:id/boost', async (req, res) => {
    const { id } = req.params;
    const { userId } = req.body;
    
    if (!userId) return res.status(400).json({ error: 'User ID is required' });

    try {
        const { data: plan, error: fetchError } = await supabase
            .from('plans')
            .select('boost_count, boosted_by')
            .eq('id', id)
            .single();

        if (fetchError) throw fetchError;

        const boostedBy = Array.isArray(plan.boosted_by) ? plan.boosted_by : [];
        const alreadyBoosted = boostedBy.includes(userId);
        
        let newCount;
        let newBoostedBy;

        if (alreadyBoosted) {
            // UNBOOST
            newCount = Math.max(0, (plan.boost_count || 0) - 1);
            newBoostedBy = boostedBy.filter(uid => uid !== userId);
        } else {
            // BOOST
            newCount = (plan.boost_count || 0) + 1;
            newBoostedBy = [...boostedBy, userId];
        }

        const { data, error } = await supabase
            .from('plans')
            .update({ 
                boost_count: newCount,
                boosted_by: newBoostedBy
            })
            .eq('id', id)
            .select('boost_count')
            .single();

        if (error) throw error;
        res.json({ success: true, boost_count: data.boost_count, is_boosted: !alreadyBoosted });
    } catch (err) {
        logError('[BOOST ERROR]', err);
        res.status(500).json({ error: 'Failed to toggle boost' });
    }
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
        
        // --- NEW PLACES API (v1) SEARCH ---
        const searchResponse = await axios.post(
            'https://places.googleapis.com/v1/places:searchText',
            {
                textQuery: query,
                locationBias: {
                    circle: {
                        center: centerCoords,
                        radius: Math.min(cleanRadius, 40000)
                    }
                },
                maxResultCount: 15
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': GOOGLE_API_KEY,
                    'X-Goog-FieldMask': 'places.id,places.name,places.formattedAddress,places.rating,places.userRatingCount,places.priceLevel,places.location,places.photos,places.websiteUri,places.shortFormattedAddress'
                }
            }
        );

        let rawPlaces = searchResponse.data?.places || [];

        // Formatting results
        const filtered = rawPlaces
            .filter(p => p.id !== currentPlaceId)
            .map(p => {
                const pLevel = p.priceLevel ? (p.priceLevel === 'PRICE_LEVEL_VERY_EXPENSIVE' ? 4 : p.priceLevel === 'PRICE_LEVEL_EXPENSIVE' ? 3 : p.priceLevel === 'PRICE_LEVEL_MODERATE' ? 2 : 1) : 2;
                const priceSymbols = '$'.repeat(pLevel);
                const ratingInfo = p.rating ? `${p.rating}★` : 'Highly rated';

                return {
                    id: p.id,
                    name: p.name?.displayName?.text || 'Venue',
                    address: p.shortFormattedAddress || p.formattedAddress,
                    rating: p.rating,
                    userRatingCount: p.userRatingCount,
                    priceLevel: priceSymbols,
                    location: { latitude: p.location?.latitude, longitude: p.location?.longitude },
                    description: `${ratingInfo}. This ${priceSymbols} spot is a highly-recommended alternative for your date!`,
                    website: p.websiteUri || null,
                    searchUrl: `https://www.google.com/maps/place/?q=place_id:${p.id}`,
                    photo: p.photos?.[0]?.name 
                        ? `https://places.googleapis.com/v1/${p.photos[0].name}/media?maxwidth=400&key=${GOOGLE_API_KEY}` 
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
    romantic: ['scenic viewpoint or garden', 'cozy cafe or bistro', 'romantic fine dining restaurant', 'dessert shop or wine bar', 'moonlight stroll or rooftop lounge', 'scenic park'],
    adventurous: ['active entertainment or arcade', 'unique themed cafe', 'exciting fusion restaurant', 'competitive game or bowling', 'fun late night snack', 'arcade'],
    active: ['rock climbing or active game', 'healthy cafe or juice bar', 'lively casual restaurant', 'top-rated park or stroll', 'interactive experience', 'bowling'],
    fancy: ['upscale rooftop lounge', 'high-end boutique or gallery', 'fine dining restaurant', 'sophisticated jazz bar', 'luxury dessert lounge', 'speakeasy'],
    trendy: ['modern rooftop or cafe', 'art gallery or pop-up', 'fusion restaurant or bistro', 'speakeasy or cocktail bar', 'trendy dessert or lounge', 'rooftop'],
    chill: ['quiet park or bookstore', 'casual brunch or cafe', 'comfort food restaurant', 'cozy bar or tea house', 'scenic night walk', 'park'],
    fun: ['interactive experience or game', 'lively shared plates restaurant', 'dessert spot or ice cream', 'fun bar or karaoke', 'arcade or game center', 'lively bar'],
    budget: ['free local attraction', 'popular affordable cafe', 'highly-rated budget restaurant', 'scenic public park', 'affordable street food', 'free museum'],
    hidden: ['hidden gem or speakeasy', 'secret garden or viewpoint', 'hole-in-the-wall restaurant', 'quiet boutique or workshop', 'unique late-night find', 'undiscovered cafe'],
    artistic: ['contemporary art gallery', 'creative workshop or museum', 'art-themed cafe or bistro', 'cultural center or show', 'artistic lounge or bar', 'indie gallery'],
    playful: ['retro arcade or game bar', 'interactive exhibit', 'fun casual dining', 'dessert parlor', 'competitive activity center', 'karaoke'],
    nature: ['botanical garden or park', 'scenic trail or waterfront', 'organic cafe or terrace', 'nature viewpoint', 'serene outdoor spot', 'park'],
    party: ['high-energy lounge', 'lively bar or pub', 'late-night snack spot', 'vibrant dance house', 'after-hours lounge', 'cocktail bar'],
    educational: ['museum or historical site', 'informative tour or exhibit', 'quiet library-themed cafe', 'cultural landmark', 'intellectual bookstore', 'museum']
};

async function generateStandardItinerary(numVariants, vibe, location, calcDuration, targetSteps = 3) {
    const queries = VIBE_MAPPING[vibe.toLowerCase()] || VIBE_MAPPING['chill'];
    const selectedQueries = queries.slice(0, targetSteps);
    const plans = [];

    for (let i = 0; i < numVariants; i++) {
        const steps = [];
        // Generate dynamic times based on duration and targetSteps
        const startTime = 18; // Default 6 PM
        const intervals = Math.floor(calcDuration * 60 / Math.max(1, targetSteps - 1));
        
        for (let j = 0; j < targetSteps; j++) {
            const query = `${selectedQueries[j]} near ${location}`;
            const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}`;
            const response = await axios.get(searchUrl);
            const results = response.data?.results || [];
            
            // Pick a random result offset by variant index to ensure diversity
            const place = results[(i + j) % Math.max(results.length, 1)] || { name: 'Local Gem', formatted_address: location };

            let details = {};
            if (place.place_id) {
                try {
                    const detailsRes = await axios.get(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=website,url&key=${GOOGLE_API_KEY}`);
                    details = detailsRes.data?.result || {};
                } catch (e) { console.error('[DETAILS ERROR]', e.message); }
            }

            // Calculate timestamp string
            const minutesTotal = (startTime * 60) + (j * intervals);
            const h = Math.floor(minutesTotal / 60) % 24;
            const m = minutesTotal % 60;
            const ampm = h >= 12 ? 'PM' : 'AM';
            const displayH = h % 12 || 12;
            const timeStr = `${displayH}:${m.toString().padStart(2, '0')} ${ampm}`;

            steps.push({
                time: timeStr,
                venue: place.name,
                activity: selectedQueries[j].split(' or ')[0],
                description: `Experience the best ${vibe} vibes at this highly-rated local spot! Perfect for a memorable sequence in ${location}.`,
                search_term: place.name,
                sub_headline: j === 0 ? "The Perfect Start" : j === targetSteps - 1 ? "Ending on a High Note" : "Continuing the Spark",
                vibe_score: 9,
                placeId: place.place_id,
                address: place.formatted_address,
                lat: place.geometry?.location?.lat,
                lng: place.geometry?.location?.lng,
                rating: place.rating || (4.5 + (Math.random() * 0.4)), 
                userRatingCount: place.user_ratings_total || Math.floor(Math.random() * 800) + 200, 
                searchUrl: details.url || `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
                websiteUrl: details.website || null,
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
        if (!usageCheck.allowed) return res.status(403).json({ error: 'Limit reached', code: 'LIMIT_REACHED' });

        const isPremium = !!usageCheck.isPremium;
        const numVariants = isPremium ? 3 : 2;

        // Calculate hours if time/endTime provided
        let calcDuration = duration || 4;
        if (time && endTime) {
            const start = parseInt(time.split(':')[0]);
            const end = parseInt(endTime.split(':')[0]);
            calcDuration = end > start ? end - start : (24 - start) + end;
        }

        // --- DYNAMIC STEPS CALCULATION ---
        // 1-3 hrs: 3 steps | 4 hrs+: 4-5 steps
        const targetSteps = Math.max(3, Math.min(5, Math.ceil(calcDuration / 1.2)));
        const stepsPerPlan = targetSteps; 

        let rawPlans = [];

        // --- FORK: Guided Builder (Places API) vs Custom (AI) ---
        if (!customization?.prompt) {
            console.log(`[GENERATOR] Guided Builder: Using Places API Template for ${vibe} in ${location} (${targetSteps} steps)`);
            const data = await generateStandardItinerary(numVariants, vibe, location, calcDuration, targetSteps);
            rawPlans = data.plans || [];
        } else {
            console.log(`[GENERATOR] Custom AI: Using Gemini 2.5 Flash for Prompt: "${customization.prompt}" (${targetSteps} steps)`);
            const model = genAI.getGenerativeModel({ model: GEMINI_MODEL }); 
            const prompt = `Create ${numVariants} distinct ${vibe} date itinerary variations in ${location} for ${budget || 'moderate'} budget. User request: "${customization.prompt}".
            Return JSON object: { "plans": [ { "vibe_variant": "string", "steps": [ { "time": "string", "venue": "string", "activity": "string", "description": "string", "search_term": "string", "sub_headline": "string (viral catchphrase, max 6 words)", "vibe_score": number, "rating": number, "user_rating_count": number } ] } ] }
            Generate EXACTLY ${targetSteps} chronological sequence-flow steps per plan based on a ${calcDuration}-hour window. Do NOT use all uppercase for sub_headlines. Use realistic ratings (4.5-4.9) and review counts (100-3000). Date: ${planDate}.`;

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
                    let details = {};
                    if (place?.place_id) {
                        const detailsRes = await axios.get(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=website,url,reviews&key=${GOOGLE_API_KEY}`);
                        details = detailsRes.data?.result || {};
                    }
                    return {
                        ...step,
                        placeId: place?.place_id,
                        address: place?.formatted_address || location,
                        lat: place?.geometry?.location?.lat,
                        lng: place?.geometry?.location?.lng,
                        rating: place?.rating || step.rating || 4.7,
                        userRatingCount: place?.user_ratings_total || step.user_rating_count || 450,
                        reviews: (details.reviews || []).slice(0, 3).map(r => ({
                            author: r.author_name,
                            rating: r.rating,
                            text: r.text
                        })),
                        searchUrl: details.url || `https://www.google.com/maps/place/?q=place_id:${place?.place_id}`,
                        websiteUrl: details.website || null,
                        photoUrl: place?.photos?.[0]?.photo_reference ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_API_KEY}` : 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80'
                    };
                } catch { return step; }
            }));

            const isCurrentPreview = !isPremium && pIdx >= 1;
            const { data: newPlan } = await supabase.from('plans').insert([{
                user_id: userId, 
                vibe: pData.vibe_variant || vibe, 
                location, 
                budget, 
                itinerary: { 
                    steps: enhancedSteps, 
                    metadata: { 
                        planDate, type, time, endTime, 
                        totalSteps: stepsPerPlan, 
                        isPremiumGenerated: isPremium, 
                        isPreviewPlan: isCurrentPreview,
                        lat: enhancedSteps[0]?.lat, 
                        lng: enhancedSteps[0]?.lng 
                    } 
                }
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
        if (!usageCheck.allowed) return res.status(403).json({ error: 'Limit reached', code: 'LIMIT_REACHED' });

        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
        const historyText = conversationHistory.map(h => `${h.role}: ${h.text}`).join('\n');
        
        const prompt = `System: You are an elite, punchy boutique concierge.
        Context: ${historyText}
        Location: ${location}, Budget: ${budget || 'any'}.
        
        TASK: Suggest 3 unique, specific date concepts. 
        RULES:
        1. TITLES: Short & evocative (max 5 words).
        2. DESCRIPTIONS: Be hyper-local and specific. Name real venues (e.g. "Devoción", "Lilia").
        3. BREVITY: Max 25 words per description. No generic fluff.
        4. FORMAT: Return ONLY a JSON object: { "concepts": [{ "title": "string", "description": "string" }], "questions": ["string", "string", "string"] }`;
        
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
        if (!usageCheck.allowed) return res.status(403).json({ error: 'Limit reached', code: 'LIMIT_REACHED' });

        const isPremium = !!usageCheck.isPremium;
        const { data: existingPlans } = await supabase.from('usage_tracking').select('count').eq('user_id', userId).eq('type', 'guided').single();
        const planCount = existingPlans?.count || 0;
        const isPreviewPlan = !isPremium && planCount >= 1; // 1st is Full, 2nd+ is Preview
        const numSteps = 3; // Always 3 steps to maintain structure

        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
        const prompt = `System: You are a luxury date planner. Build a precise 3-step itinerary for: "${concept.title} - ${concept.description}". Location: ${location}.
        RULES:
        1. VENUES: Must be specific, real-world locations.
        2. DESCRIPTIONS: Punchy, experiential, and max 15 words per step.
        3. FORMAT: Return JSON array of steps: [{time, venue, activity, description, search_term, rating, user_rating_count}].
        4. Generate EXACTLY ${numSteps} steps. Use realistic ratings (4.5-4.9) and review counts.`;
        
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
                let details = {};
                if (place?.place_id) {
                    const detailsRes = await axios.get(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=website,url,reviews&key=${GOOGLE_API_KEY}`);
                    details = detailsRes.data?.result || {};
                }
                return {
                    ...step,
                    placeId: place?.place_id,
                    address: place?.formatted_address || location,
                    lat: place?.geometry?.location?.lat,
                    lng: place?.geometry?.location?.lng,
                    rating: place?.rating || step.rating || 4.8,
                    userRatingCount: place?.user_ratings_total || step.user_rating_count || 320,
                    reviews: (details.reviews || []).slice(0, 3).map(r => ({
                        author: r.author_name,
                        rating: r.rating,
                        text: r.text
                    })),
                    searchUrl: details.url || `https://www.google.com/maps/place/?q=place_id:${place?.place_id}`,
                    websiteUrl: details.website || null,
                    photoUrl: place?.photos?.[0]?.photo_reference ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_API_KEY}` : 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80'
                };
            } catch { return step; }
        }));

        const { data: newPlan, error: insertError } = await supabase.from('plans').insert([{
            user_id: userId, 
            vibe: concept.title, 
            location, 
            budget: budget || 'moderate', 
            itinerary: { 
                steps: enhancedSteps, 
                metadata: { 
                    planDate: date, 
                    type: 'guided', 
                    totalSteps: numSteps, 
                    isPremiumGenerated: isPremium, 
                    isPreviewPlan,
                    lat: enhancedSteps[0]?.lat,
                    lng: enhancedSteps[0]?.lng
                } 
            }
        }]).select().single();

        if (insertError) throw insertError;
        res.json(newPlan);
    } catch (err) {
        logError('[CUSTOM GEN ERROR]', err);
        res.status(500).json({ error: 'Failed to build custom itinerary.' });
    }
});

// FORGOT USERNAME - Send email reminder
app.post('/api/forgot-username', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    try {
        // Look up the user in profiles by email
        const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, email')
            .eq('email', email)
            .single();

        // Always respond with success to prevent email enumeration
        if (profile) {
            await resend.emails.send({
                from: 'DateSpark <support@datespark.live>',
                to: email,
                subject: '💌 Your DateSpark Account Details',
                html: `
                    <div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #060B1A; color: white; border-radius: 16px;">
                        <h1 style="color: #FF7F50; font-size: 24px; margin-bottom: 8px;">Hey ${profile.first_name || 'there'} 👋</h1>
                        <p style="color: #94a3b8;">You asked us to remind you of your DateSpark account details.</p>
                        <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; margin: 24px 0;">
                            <p style="color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">Your login email</p>
                            <p style="color: white; font-size: 18px; font-weight: bold; margin: 0;">${email}</p>
                        </div>
                        <a href="https://datespark.live/login" style="display: block; background: #FF7F50; color: white; text-align: center; padding: 14px; border-radius: 10px; text-decoration: none; font-weight: bold;">Sign In Now →</a>
                        <p style="color: #475569; font-size: 12px; margin-top: 24px; text-align: center;">© 2026 DateSpark Inc. · <a href="https://datespark.live/privacy" style="color: #FF7F50;">Privacy Policy</a></p>
                    </div>
                `
            });
        }

        res.json({ success: true });
    } catch (err) {
        logError('[FORGOT USERNAME]', err);
        res.status(500).json({ error: 'Failed to send account reminder' });
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

// SUPPORT & FEEDBACK
app.post('/api/feedback', async (req, res) => {
    const { userId, email, text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ error: 'Message text is required' });

    try {
        // 1. Save to Supabase Feedback Table
        const { error: dbError } = await supabase.from('feedback').insert([{
            user_id: userId,
            email: email,
            text: text.trim()
        }]);

        if (dbError) {
            console.error('[FEEDBACK DB ERROR]', dbError);
            // We continue even if DB fails so the email still goes out
        }

        const adminEmail = process.env.ADMIN_EMAIL || 'rayanerold@gmail.com';
        await resend.emails.send({
            from: 'DateSpark Support <support@datespark.live>',
            to: adminEmail,
            reply_to: email || adminEmail,
            subject: `💡 New DateSpark Message from ${email || 'Anonymous'}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
                    <div style="background-color: #0B101C; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                        <h1 style="color: #FF7F50; margin: 0; font-size: 24px;">New Support Request</h1>
                    </div>
                    <div style="padding: 30px; line-height: 1.6; color: #1a202c;">
                        <p style="margin-bottom: 20px;">You have received a new message from a DateSpark user:</p>
                        <div style="background-color: #f7fafc; padding: 20px; border-left: 4px solid #FF7F50; border-radius: 4px; margin-bottom: 24px;">
                            <p style="margin: 0; font-style: italic; color: #4a5568;">"${text.trim()}"</p>
                        </div>
                        <div style="border-top: 1px solid #edf2f7; pt-20;">
                            <p style="font-size: 14px; color: #718096; margin-bottom: 4px;">User Details:</p>
                            <p style="margin: 0; font-weight: bold;">Email: ${email || 'Not Provided'}</p>
                            <p style="margin: 0; font-size: 12px; color: #a0aec0;">User ID: ${userId || 'N/A'}</p>
                        </div>
                    </div>
                    <div style="background-color: #f7fafc; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; color: #718096;">
                        This is an automated alert from your DateSpark backend.
                    </div>
                </div>
            `
        });

        res.json({ success: true });
    } catch (err) {
        logError('[FEEDBACK ERROR]', err);
        res.status(500).json({ error: 'Failed to process feedback: ' + err.message });
    }
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
            sessionParams.subscription_data = { trial_period_days: 7 };
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
            ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() 
            : null;

        const { error } = await supabase.from('profiles').update({
            is_premium: isPremium,
            premium_expiry: expiryDate
        }).eq('id', userId);

        if (error) throw error;
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/cancel-manual-subscription', async (req, res) => {
    const { userId } = req.body;
    try {
        const { error } = await supabase.from('profiles').update({
            is_premium: false,
            premium_expiry: null
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
