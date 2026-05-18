import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import our "Unique Function" Micro-Modules
import * as itineraryService from './services/itineraryService.js';
import { fetchEvents } from './services/eventService.js';
import * as paymentService from './services/paymentService.js';
import * as userService from './services/userService.js';
import * as generationService from './services/generationService.js';
import * as emailService from './services/emailService.js';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Services (Inject Dependencies)
itineraryService.initItineraryService({ 
    GOOGLE_API_KEY: process.env.VITE_GOOGLE_MAPS_API_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY
});
paymentService.initPaymentService(process.env.STRIPE_SECRET_KEY);

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

app.use(cors());
app.use(express.json({
    verify: (req, res, buf) => {
        if (req.originalUrl.startsWith('/api/webhook')) {
            req.rawBody = buf;
        }
    }
}));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

/**
 * ─── API GATEWAY ROUTES ───
 */

// 1. ITINERARY & DISCOVERY
app.post('/api/generate-date', async (req, res) => {
    try {
        const { userId, type = 'guided' } = req.body;
        const savedPlan = await generationService.generatePlanFlow(supabase, userId, req.body, type);
        res.json({ success: true, plan: savedPlan });
    } catch (err) { 
        console.error('[GENERATE_ERROR]', err);
        const status = err.status || 500;
        res.status(status).json({ error: err.message, code: err.code }); 
    }
});

app.post('/api/generate-custom-date', async (req, res) => {
    try {
        const { userId, type = 'classic' } = req.body;
        const savedPlan = await generationService.generatePlanFlow(supabase, userId, req.body, type);
        res.json({ success: true, plan: savedPlan });
    } catch (err) { 
        console.error('[GENERATE_CUSTOM_ERROR]', err);
        const status = err.status || 500;
        res.status(status).json({ error: err.message, code: err.code }); 
    }
});

app.post('/api/recreate-date', async (req, res) => {
    try {
        const { planId, userId, type = null } = req.body;
        const newPlan = await generationService.recreatePlanFlow(supabase, userId, planId, type);
        res.json({ success: true, plan: newPlan });
    } catch (err) { 
        console.error('[RECREATE_ERROR]', err);
        const status = err.status || 500;
        res.status(status).json({ error: err.message, code: err.code }); 
    }
});

app.post('/api/nearby-alternatives', async (req, res) => {
    try {
        const alternatives = await itineraryService.getNearbyAlternatives(req.body);
        res.json({ success: true, alternatives });
    } catch (err) {
        console.error('[NEARBY_ERROR]', err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/trending-plans', async (req, res) => {
    try {
        const plans = await itineraryService.getTrendingPlans(supabase);
        res.json(plans);
    } catch (err) {
        console.error('[TRENDING_ERROR]', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/feedback', async (req, res) => {
    try {
        const { message, userId, userEmail, type } = req.body;
        
        // 1. Send the email FIRST (Guaranteed to work if Resend key is valid)
        const emailResult = await emailService.sendFeedbackEmail({ 
            userEmail, 
            message, 
            userId,
            type: type || 'feedback'
        });

        if (!emailResult.success) {
            console.warn('[Feedback] Email failed but continuing:', emailResult.error);
        }

        // 2. Attempt to save to Database (Non-blocking)
        try {
            const { error: dbError } = await supabaseAdmin
                .from('feedback')
                .insert([{ 
                    user_id: userId, 
                    email: userEmail, 
                    text: message 
                }]);
            
            if (dbError) {
                console.error('[Feedback] DB Error:', dbError.message);
            }
        } catch (dbErr) {
            console.error('[Feedback] Database insertion failed:', dbErr.message);
        }

        console.log(`[Feedback] Processed message from ${userEmail || 'Anonymous'}`);
        res.json({ success: true, emailSent: emailResult.success });
    } catch (err) {
        console.error('[FEEDBACK_ERROR_CRITICAL]', err);
        res.status(500).json({ error: 'System error', details: err.message });
    }
});

app.get('/api/search', async (req, res) => {
    const results = await itineraryService.searchPlans(supabase, req.query.q);
    res.json(results);
});

app.get('/api/user-plans', async (req, res) => {
    try {
        const plans = await itineraryService.getUserPlans(supabase, req.query.userId);
        res.json(plans);
    } catch (err) {
        console.error('[USER_PLANS_ERROR]', err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/plans/:id', async (req, res) => {
    const plan = await itineraryService.getPlanById(supabase, req.params.id);
    res.json(plan);
});

app.post('/api/plans/:id/boost', async (req, res) => {
    const result = await itineraryService.boostPlan(supabase, req.params.id, req.body.userId);
    res.json(result);
});

app.post('/api/plans/:id/try', async (req, res) => {
    const tries = await itineraryService.tryPlan(supabase, req.params.id);
    res.json({ total_tries: tries });
});

app.post('/api/swap-venue', async (req, res) => {
    const alternatives = await itineraryService.swapVenue(req.body);
    res.json({ alternatives });
});

app.get('/api/place-ratings', async (req, res) => {
    try {
        const ratings = await itineraryService.getPlaceRatings(supabase, req.query.planId);
        res.json(ratings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/place-ratings', async (req, res) => {
    try {
        const rating = await itineraryService.addPlaceRating(supabase, req.body);
        res.json(rating);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.patch('/api/update-plan', async (req, res) => {
    try {
        const { planId, updateData } = req.body;
        const updated = await itineraryService.updatePlan(supabase, planId, updateData);
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/delete-plan', async (req, res) => {
    try {
        const { planId } = req.body;
        const result = await itineraryService.deletePlan(supabase, planId);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/recommendations/:userId', async (req, res) => {
    try {
        const recommendations = await itineraryService.getRecommendations(supabase, req.params.userId);
        res.json(recommendations);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

import { GoogleGenerativeAI } from '@google/generative-ai';
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

app.post('/api/architect-stream', async (req, res) => {
    try {
        if (!genAI) throw new Error('Gemini API is not configured.');

        const { messages, location, lat, lng, budget, goal } = req.body;
        
        const systemPrompt = `You are Sparky, an expert AI Date Architect for DateSpark. 
        Your job is to help users plan amazing dates by asking clarifying questions or generating concepts.
        Current Context:
        - Location: ${location || 'Unknown'}
        - Lat/Lng: ${lat}, ${lng}
        - Budget: ${budget || 'Flexible'}
        - Goal: ${goal || 'Flexible'}
        
        CRITICAL INSTRUCTIONS:
        1. Keep your responses conversational, concise, and helpful. Ask ONE clarifying question at a time.
        2. You may ask a MAXIMUM of 3 clarifying questions total throughout the conversation. 
        3. Once you have asked 3 questions, OR if the user has provided enough information to build a plan earlier, you MUST stop asking questions and generate the concepts.
        4. When generating concepts, your final output MUST end with the word READY followed by ONLY valid JSON format matching this schema:
        READY
        {"concepts": [{"title": "Name of plan", "description": "Short description", "budgetStrategy": "How to save", "routeLogic": "Why it makes sense", "partnerFit": "Why it works"}]}
        
        Provide up to 2 concepts when READY.`;

        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
        
        const history = [
            { role: 'user', parts: [{ text: systemPrompt }] },
            { role: 'model', parts: [{ text: 'Understood.' }] }
        ];

        for (let i = 0; i < messages.length - 1; i++) {
            const msg = messages[i];
            history.push({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }]
            });
        }

        const chat = model.startChat({ history });
        const lastMessage = messages[messages.length - 1].content;

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const result = await chat.sendMessageStream(lastMessage);

        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
        }
        
        res.write('data: [DONE]\n\n');
        res.end();
    } catch (err) {
        console.error('[ARCHITECT_STREAM_ERROR]', err);
        res.status(500).json({ error: 'Failed to generate response' });
    }
});

app.post('/api/suggest-date-concepts', async (req, res) => {
    try {
        if (!genAI) throw new Error('Gemini API is not configured.');
        const { conversationHistory, location, lat, lng, budget, goal } = req.body;
        
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
        
        const prompt = `Based on the following conversation, location (${location}), budget (${budget}), and goal (${goal}), suggest 2 creative date plan concepts.
        
        Return ONLY valid JSON matching this schema:
        {"concepts": [{"title": "Name of plan", "description": "Short description", "budgetStrategy": "How to save", "routeLogic": "Why it makes sense", "partnerFit": "Why it works"}]}
        
        Conversation:
        ${JSON.stringify(conversationHistory)}
        `;

        const result = await model.generateContent(prompt);
        let rawText = result.response.text();
        
        const match = rawText.match(/\{[\s\S]*\}/);
        const json = match ? match[0] : rawText;

        res.json(JSON.parse(json));
    } catch (err) {
        console.error('[SUGGEST_CONCEPTS_ERROR]', err);
        res.status(500).json({ error: 'Failed to suggest concepts' });
    }
});

// 2. WISHLIST
app.post('/api/wishlist-parse', async (req, res) => {
    try {
        if (!genAI) throw new Error('Gemini API is not configured.');
        const { wishlistPrompt, partnerName, relationType } = req.body;
        
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
        
        const prompt = `You are a creative Date Planner and Wishlist Architect.
        The user has provided a wishlist of activities they want to experience with their partner/friend/date.
        
        Wishlist input: "${wishlistPrompt}"
        Relation Type: ${relationType || 'partner'}
        Partner/Friend Name: ${partnerName || 'Companion'}

        Parse and expand this wishlist into a beautifully structured, highly inspiring JSON array.
        Be creative, enrich each activity with a description, vibe tags, estimated cost category ($, $$, $$$), and an appropriate emoji.
        Also suggest 2 ADDITIONAL unique activities that perfectly complement their wishlist and vibe!

        Return ONLY a valid JSON object matching this schema exactly, with NO additional text, code blocks, or explanations:
        {
          "companionName": "${partnerName || 'Companion'}",
          "relationType": "${relationType || 'partner'}",
          "items": [
            {
              "id": "item-1",
              "title": "Title of the activity",
              "description": "Short, beautiful, romantic or fun description of how to experience this activity",
              "cost": "$",
              "vibe": "Cozy / Romantic / Adventure / Creative",
              "emoji": "🌟",
              "type": "requested"
            }
          ]
        }`;

        const result = await model.generateContent(prompt);
        let rawText = result.response.text();
        
        // Ensure clean JSON parsing
        const match = rawText.match(/\{[\s\S]*\}/);
        const jsonString = match ? match[0] : rawText;
        const parsed = JSON.parse(jsonString);

        res.json({ success: true, wishlist: parsed });
    } catch (err) {
        console.error('[WISHLIST_PARSE_ERROR]', err);
        res.status(500).json({ error: 'Failed to generate wishlist JSON', details: err.message });
    }
});

// 3. PAYMENTS
app.post('/api/create-checkout-session', async (req, res) => {
    try {
        const { planType, userId, email } = req.body;
        
        if (!userId || !email) {
            console.error('[Payment] Missing userId or email in request');
            return res.status(400).json({ error: 'Please sign in again. Missing user identification.' });
        }

        // Map planType to Price ID and Mode
        let priceId = process.env.STRIPE_PRICE_PASS; 
        let mode = 'payment'; // 24H Pass is a one-time payment

        if (planType === 'ELITE' || planType === 'PLUS') {
            priceId = process.env.STRIPE_PRICE_ELITE;
            mode = 'subscription';
        }

        console.log(`[Payment] Creating ${mode} session for ${email} (${planType}) -> ${priceId}`);

        // Use the request's origin for redirects to support mobile/network testing
        const origin = req.get('origin') || process.env.VITE_APP_URL;

        const session = await paymentService.createCheckoutSession({
            userId,
            priceId,
            mode,
            customerEmail: email,
            successUrl: `${origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
            cancelUrl: `${origin}/dashboard`
        });
        res.json({ url: session.url });
    } catch (err) { 
        console.error('[CHECKOUT_SESSION_ERROR]', err);
        res.status(500).json({ error: 'Payment failed', details: err.message }); 
    }
});

app.post('/api/create-portal-session', async (req, res) => {
    try {
        const { email } = req.body;
        const url = await paymentService.createPortalSession(email, `${process.env.VITE_APP_URL}/dashboard`);
        res.json({ url });
    } catch (err) {
        console.error('[PORTAL_SESSION_ERROR]', err);
        res.status(500).json({ error: 'Portal failed', details: err.message });
    }
});

// 4. STRIPE WEBHOOK
app.post('/api/webhook', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = await paymentService.handleWebhook(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error(`[Webhook] Verification failed: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const userId = session.metadata.userId;
        const customerEmail = session.customer_details.email;

        console.log(`[Webhook] Payment successful for User: ${userId} (${customerEmail})`);

        // Upgrade user to Premium in Supabase
        const { error } = await supabaseAdmin
            .from('profiles')
            .update({ 
                is_premium: true,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId);

        if (error) {
            console.error('[Webhook] DB Update Failed:', error.message);
        } else {
            console.log(`[Webhook] User ${userId} upgraded to Premium! 🚀`);
        }
    }

    res.json({ received: true });
});

// 5. USERS & ACCOUNT
app.post('/api/increment-save-usage', async (req, res) => {
    try {
        const { userId } = req.body;
        const result = await userService.checkUsageLimits(supabase, userId, 'save_weekly');
        if (!result.allowed) {
            return res.status(403).json({ allowed: false, code: 'LIMIT_REACHED' });
        }
        res.json({ success: true, allowed: true });
    } catch (err) {
        console.error('[SAVE_USAGE_ERROR]', err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/user-premium/:userId', async (req, res) => {
    try {
        const status = await userService.getUserPremiumStatus(supabase, req.params.userId);
        res.json(status);
    } catch (err) {
        console.error('[USER_PREMIUM_ERROR]', err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/user-usage/:userId', async (req, res) => {
    try {
        const usage = await userService.getUserUsage(supabase, req.params.userId);
        res.json(usage);
    } catch (err) {
        console.error('[USER_USAGE_ERROR]', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/forgot-username', async (req, res) => {
    try {
        const { email } = req.body;
        await emailService.sendForgotUsernameEmail({ userEmail: email });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/send-welcome', async (req, res) => {
    try {
        const { email, firstName } = req.body;
        await emailService.sendWelcomeEmail({ userEmail: email, firstName });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/upload-avatar', express.raw({ type: 'image/*', limit: '5mb' }), async (req, res) => {
    try {
        const url = await userService.updateAvatar(supabaseAdmin, req.headers['x-user-id'], req.body, req.headers['content-type']);
        res.json({ success: true, publicUrl: url });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

/**
 * Google Places Photo Proxy
 * 
 * The browser cannot load Google Places photo URLs directly — Google restricts
 * cross-origin requests to these media endpoints. This proxy fetches the image
 * server-side (where the API key works without referrer restrictions) and streams
 * the raw image bytes to the browser.
 * 
 * Frontend usage:
 *   /api/photo-proxy?url=<encoded_google_photo_url>
 */
const { pipeline } = await import('stream/promises');

app.get('/api/photo-proxy', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'Missing url parameter' });

    try {
        let googleUrl = url;
        const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;
        
        // Security: Only proxy requests to Google APIs
        if (!googleUrl.includes('places.googleapis.com') && !googleUrl.includes('maps.googleapis.com')) {
            return res.status(403).json({ error: 'Forbidden: Only Google API URLs are allowed.' });
        }

        // AUTO-FIX: Inject API key if missing (common for legacy database entries)
        if (!googleUrl.includes('key=') && apiKey) {
            const separator = googleUrl.includes('?') ? '&' : '?';
            googleUrl = `${googleUrl}${separator}key=${apiKey}`;
            console.log('[PhotoProxy] 🔑 Auto-injected API Key into legacy URL');
        }
        
        const axios = (await import('axios')).default;
        console.log(`[PhotoProxy] Fetching: ${googleUrl.split('?')[0]}...`);
        
        const response = await axios.get(googleUrl, {
            responseType: 'stream',
            timeout: 20000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'image/*'
            }
        });

        const contentType = response.headers['content-type'] || 'image/jpeg';
        res.set('Content-Type', contentType);
        res.set('Cache-Control', 'public, max-age=86400');
        
        // Use pipeline for safe streaming (prevents crashes on connection drop)
        await pipeline(response.data, res);
        console.log('[PhotoProxy] ✅ Successfully streamed image.');
        
    } catch (err) {
        console.error('[PHOTO_PROXY_ERROR]', err.message);
        
        // --- SMART FALLBACK ---
        // If Google fails (expired photo, 400, 403), serve a premium brand fallback
        // instead of letting the UI break.
        try {
            console.log('[PhotoProxy] 🔄 Serving premium fallback image...');
            const fallbackUrls = [
                'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=1000&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=1000&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1470337458703-46ad1756a187?q=80&w=1000&auto=format&fit=crop'
            ];
            const fallbackUrl = fallbackUrls[Math.floor(Math.random() * fallbackUrls.length)];
            
            const axios = (await import('axios')).default;
            const fallbackRes = await axios.get(fallbackUrl, { responseType: 'stream', timeout: 10000 });
            
            res.set('Content-Type', 'image/jpeg');
            res.set('X-Proxy-Fallback', 'true');
            return fallbackRes.data.pipe(res);
        } catch (fallbackErr) {
            console.error('[CRITICAL_FALLBACK_FAIL]', fallbackErr.message);
            if (!res.headersSent) {
                res.status(502).json({ error: 'All image sources failed' });
            }
        }
    }
});

app.get('/api/health', (req, res) => res.json({ status: 'running', timestamp: new Date() }));


// 5. SERVE FRONTEND (Production)
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// Catch-all middleware to serve index.html for SPA routing
// Using app.use() instead of app.get('*') to avoid path-to-regexp syntax issues in Express 5
app.use((req, res, next) => {
    // If it's an API route that didn't match, return 404
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'Not Found' });
    }
    // For everything else, serve index.html
    res.sendFile(path.join(distPath, 'index.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('[SERVER_CRITICAL_ERROR]', err);
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
});

// Keep the event loop alive explicitly (safety for nodemon + Windows)
setInterval(() => {}, 1000 * 60 * 60);

app.listen(PORT, () => console.log(`🚀 Gateway API running on port ${PORT}`));
