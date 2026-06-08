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
import cron from 'node-cron';

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

// Run every hour to archive or delete expired and incomplete plans
cron.schedule('0 * * * *', async () => {
    console.log('[Cron] Running plan expiration sweep...');
    try {
        const { error } = await supabaseAdmin
            .from('plans')
            .delete()
            .lt('expires_at', new Date().toISOString())
            .eq('is_completed', false);
            
        if (error) console.error('[Cron Error]', error.message);
    } catch (err) {
        console.error('[Cron System Error]', err);
    }
});

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

app.post('/api/save-draft-plan', async (req, res) => {
    try {
        const { userId, planData } = req.body;
        const savedPlan = await generationService.saveDraftPlan(supabase, userId, planData);
        res.json({ success: true, plan: savedPlan });
    } catch (err) {
        console.error('[SAVE_DRAFT_ERROR]', err);
        res.status(500).json({ error: err.message });
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
        const userId = req.headers['x-user-id'] || req.query.userId;
        const requestedLocation = req.query.location;
        const plans = await itineraryService.getTrendingPlans(supabase, userId, requestedLocation);
        res.json(plans);
    } catch (err) {
        console.error('[TRENDING_ERROR]', err);
        const status = err.status || 500;
        res.status(status).json({ error: err.message });
    }
});

app.post('/api/feedback', async (req, res) => {
    try {
        const userId = req.body.userId;
        const message = req.body.message || req.body.text || req.body.messageText;
        const userEmail = req.body.userEmail || req.body.email;
        const type = req.body.type || 'feedback';
        
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

// Middleware to verify admin authorization
const verifyAdmin = async (req, res, next) => {
    try {
        const adminId = req.headers['x-user-id'] || req.query.adminId || req.body.adminId;
        if (!adminId) {
            return res.status(401).json({ error: 'Unauthorized: User ID not provided' });
        }
        const { data: profile, error } = await supabaseAdmin
            .from('profiles')
            .select('is_admin')
            .eq('id', adminId)
            .single();

        if (error || !profile || !profile.is_admin) {
            return res.status(403).json({ error: 'Access denied: Admin role required' });
        }
        next();
    } catch (err) {
        res.status(500).json({ error: 'Auth system error', details: err.message });
    }
};

// 1. Get Admin Dashboard General Stats
app.get('/api/admin/stats', verifyAdmin, async (req, res) => {
    try {
        const { count: usersCount } = await supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true });
        const { count: premiumCount } = await supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('is_premium', true);
        const { count: feedbackCount } = await supabaseAdmin.from('feedback').select('*', { count: 'exact', head: true });
        const { count: plansCount } = await supabaseAdmin.from('plans').select('*', { count: 'exact', head: true });

        res.json({
            success: true,
            stats: {
                totalUsers: usersCount || 0,
                premiumUsers: premiumCount || 0,
                totalFeedbacks: feedbackCount || 0,
                totalPlans: plansCount || 0
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Get All Users and Profiles details
app.get('/api/admin/users', verifyAdmin, async (req, res) => {
    try {
        const { data: users, error } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .order('updated_at', { ascending: false });

        if (error) throw error;
        res.json({ success: true, users });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Toggle Premium Status
app.post('/api/admin/toggle-premium', verifyAdmin, async (req, res) => {
    try {
        const { targetUserId, isPremium } = req.body;
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .update({ is_premium: isPremium, updated_at: new Date().toISOString() })
            .eq('id', targetUserId)
            .select()
            .single();

        if (error) throw error;
        res.json({ success: true, profile: data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Toggle Admin Status
app.post('/api/admin/toggle-admin', verifyAdmin, async (req, res) => {
    try {
        const { targetUserId, isAdmin } = req.body;
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .update({ is_admin: isAdmin, updated_at: new Date().toISOString() })
            .eq('id', targetUserId)
            .select()
            .single();

        if (error) throw error;
        res.json({ success: true, profile: data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. Reset Usage Limits for a User
app.post('/api/admin/reset-usage', verifyAdmin, async (req, res) => {
    try {
        const { targetUserId } = req.body;
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .update({
                classic_usage_today: 0,
                guided_usage_today: 0,
                swap_usage_today: 0,
                updated_at: new Date().toISOString()
            })
            .eq('id', targetUserId)
            .select()
            .single();

        if (error) throw error;
        res.json({ success: true, profile: data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 6. Get All User Feedbacks / Tickets
app.get('/api/admin/feedbacks', verifyAdmin, async (req, res) => {
    try {
        const { data: feedbacks, error } = await supabaseAdmin
            .from('feedback')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ success: true, feedbacks });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 7. Delete/Resolve a Feedback
app.delete('/api/admin/feedbacks/:id', verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabaseAdmin
            .from('feedback')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
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

        const { messages, location, lat, lng, budget, goal, numActivities, radius, planDate, planTime } = req.body;
        
        const radiusStr = radius ? `${(radius / 1609.34).toFixed(1)} miles` : 'standard';
        
        const systemPrompt = `You are Sparky, an expert AI Date Architect for DateSpark. 
        Your job is to help users plan amazing dates by asking clarifying questions or generating concepts.
        Current Context:
        - Location: ${location || 'Unknown'}
        - Lat/Lng: ${lat}, ${lng}
        - Budget: ${budget || 'Flexible'}
        - Goal: ${goal || 'Flexible'}
        - Stops Count: ${numActivities || 3} stops
        - Search Radius: ${radiusStr}
        - Date: ${planDate || 'Any day'}
        - Time: ${planTime || 'Any time'}
        
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
        const { conversationHistory, location, lat, lng, budget, goal, numActivities, radius, planDate, planTime } = req.body;
        
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
        
        const radiusStr = radius ? `${(radius / 1609.34).toFixed(1)} miles` : 'standard';
        const prompt = `Based on the following conversation, location (${location}), budget (${budget}), and goal (${goal}), suggest 2 creative date plan concepts.
        
        The plan should target exactly ${numActivities || 3} sequential activities/stops, within a search radius of ${radiusStr}, planned for ${planDate || 'any day'} at ${planTime || 'any time'}.
        
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

app.post('/api/spark-concierge', async (req, res) => {
    try {
        if (!genAI) throw new Error('Gemini API is not configured.');
        
        const { messages, currentSettings } = req.body;
        const settings = currentSettings || {};

        const systemPrompt = `You are Sparky, an elite, ultra-premium AI Date & Trip Concierge for DateSpark.
Your role is to help users design magical plans, custom dates, neighborhood getaways, and full single-day or multi-day travel trips.
You must be welcoming, conversational, highly intuitive, and act like a high-end luxury hospitality concierge.

CURRENT PLAN PARAMETERS DETECTED SO FAR:
- Location/Destination: ${settings.location || 'Not set yet'}
- Budget Level: ${settings.budget || 'Not set yet'}
- Vibe/Style: ${settings.vibe || 'Not set yet'}
- Number of Stops: ${settings.numActivities || 'Not set yet'}
- Plan Date: ${settings.planDate || 'Not set yet'}
- Plan Time: ${settings.planTime || 'Not set yet'}
- Is it a Trip? ${settings.isTrip ? 'Yes' : 'No'}

CRITICAL RULES:
1. SEMANTIC MATCHING & RESONANCE: When the user describes their idea (even a simple one like "I was thinking of a chill night out in NYC" or "planning a trip to Paris"), validate their desire with luxury concierge flair. Provide a brief, premium advice/insider thought about that idea (e.g. "Montmartre at dusk has a magical quality," or "Brooklyn speakeasies are the best kept secret..."). Keep it high-end and inspiring.
2. HELP WITH PLANS, DATES, AND TRIPS: Pivot smoothly if the user mentions a "trip", "travel", "vacation", or "weekend getaway" rather than a local date night.
3. INFER PARAMETERS: From the user's input, infer or update the parameters. For example:
   - If they mention "trip to Paris", set location to "Paris" and isTrip to true.
   - If they mention "chill", set vibe to "chill".
   - If they mention "celebrating our anniversary", set vibe to "romantic".
4. CLICKABLE CHOICE OPTIONS: Always suggest 3 highly engaging, tailored clickable option pills (strings) that match the state of the conversation (e.g. ["Romantic dinner 🍷", "Museum & cafes 🎨", "Adventure parks 🧗"] or ["Classic & Elegant 💖", "Off-the-beaten-path 🗺️", "Foodie tour 🥐"]). They should feel premium, contextual, and fun.
5. TRANSITION TO READY: You are READY to present concepts when:
   - You have identified the location (destination/city) AND the general vibe/style, or
   - The user asks you to generate the plan/concepts.
   When isReady is true, suggest exactly 2 distinct, creative concepts.
6. JSON FORMAT: You MUST return a single, valid JSON object with the following schema:
{
  "reply": "Warm conversational response with premium advice, thoughts, and a gentle question if not ready.",
  "options": ["Option 1", "Option 2", "Option 3"],
  "isReady": boolean,
  "inferredParams": {
    "location": string or null,
    "budget": string or null,
    "vibe": string or null,
    "numActivities": number or null,
    "planDate": string or null,
    "planTime": string or null,
    "isTrip": boolean
  },
  "concepts": [
    {
      "title": "Creative Concept Title (max 5 words)",
      "description": "Inspiring description of what this concept entails (max 20 words)",
      "tagline": "A high-end catchy tagline (max 6 words)"
    }
  ] (only include 2 concepts when isReady is true, otherwise empty array)
}`;

        // Format history nicely as a readable text transcript to guarantee zero alternating roles errors
        let transcriptText = "";
        if (messages && messages.length > 0) {
            transcriptText = messages.map(msg => {
                const roleName = msg.role === 'user' ? 'User' : 'Sparky';
                const text = typeof msg === 'object' && msg !== null ? (msg.content || '') : String(msg);
                return `${roleName}: ${text}`;
            }).join('\n');
        }

        const prompt = `${systemPrompt}

Below is the conversation transcript:
${transcriptText || "User: Hello!"}

Produce the next response in the requested JSON structure. Return ONLY a single valid JSON object.`;

        let responseText = "";
        let success = false;
        let lastError = null;

        const modelsToTry = [
            "gemini-2.5-pro",
            "gemini-2.5-flash-lite",
            "gemini-2.5-flash",
            "gemini-1.5-flash",
            "gemini-1.5-pro"
        ];

        for (const modelName of modelsToTry) {
            try {
                console.log(`[Spark Concierge] Attempting generation with ${modelName}...`);
                const model = genAI.getGenerativeModel({ 
                    model: modelName,
                    generationConfig: {
                        responseMimeType: "application/json"
                    }
                });
                const result = await model.generateContent(prompt);
                responseText = result.response.text();
                success = true;
                console.log(`[Spark Concierge] Success with ${modelName}`);
                break;
            } catch (err) {
                console.warn(`[Spark Concierge] Model ${modelName} failed:`, err.message || err);
                lastError = err;
            }
        }

        if (!success) {
            throw lastError || new Error("All generative fallback models failed");
        }

        // Extract JSON block safely
        const match = responseText.match(/\{[\s\S]*\}/);
        const jsonStr = match ? match[0] : responseText;
        const responseData = JSON.parse(jsonStr);

        res.json(responseData);
    } catch (err) {
        console.error('[SPARK_CONCIERGE_ERROR]', err);
        res.status(500).json({ error: 'Failed to generate response' });
    }
});

// 2. EVENTS
app.get('/api/events', async (req, res) => {
    const keys = {
        ticketmaster: process.env.TICKETMASTER_API_KEY,
        serpapi: process.env.SERP_API_KEY,
        seatgeek: process.env.SEATGEEK_CLIENT_ID
    };
    const events = await fetchEvents(supabase, req.query.city, req.query.category, 15, keys);
    res.json(events);
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
        
        // Security: Only proxy requests to Google APIs / content servers
        if (!googleUrl.includes('places.googleapis.com') && 
            !googleUrl.includes('maps.googleapis.com') && 
            !googleUrl.includes('googleusercontent.com')) {
            return res.status(403).json({ error: 'Forbidden: Only Google API URLs are allowed.' });
        }

        // AUTO-FIX: Inject API key if missing (common for legacy database entries)
        if (!googleUrl.includes('key=') && apiKey && !googleUrl.includes('googleusercontent.com')) {
            const separator = googleUrl.includes('?') ? '&' : '?';
            googleUrl = `${googleUrl}${separator}key=${apiKey}`;
            console.log('[PhotoProxy] 🔑 Auto-injected API Key into legacy URL');
        }
        
        console.log(`[PhotoProxy] Redirecting to: ${googleUrl.split('?')[0]}...`);
        // Instead of proxying the stream (which fails CORS/Referer checks and consumes server bandwidth),
        // we just issue a 302 redirect so the browser fetches it natively with the correct referer.
        return res.redirect(302, googleUrl);
        
    } catch (err) {
        console.error('[PHOTO_PROXY_ERROR]', err.message);
        
        // --- SMART FALLBACK ---
        try {
            console.log('[PhotoProxy] 🔄 Serving premium fallback image...');
            const fallbackUrls = [
                'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=1000&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=1000&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1470337458703-46ad1756a187?q=80&w=1000&auto=format&fit=crop'
            ];
            const fallbackUrl = fallbackUrls[Math.floor(Math.random() * fallbackUrls.length)];
            return res.redirect(302, fallbackUrl);
        } catch (fallbackErr) {
            console.error('[CRITICAL_FALLBACK_FAIL]', fallbackErr.message);
            if (!res.headersSent) {
                res.status(502).json({ error: 'All image sources failed' });
            }
        }
    }
});

// 6. WISHLIST ROUTES
app.get('/api/wishlist', async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) return res.status(400).json({ error: 'Missing userId parameter' });
        
        const { data, error } = await supabaseAdmin
            .from('plans_wishlist')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error('[GET_WISHLIST_ERROR]', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/wishlist', async (req, res) => {
    try {
        const { userId, title, category, notes, budget, priority } = req.body;
        if (!userId || !title) return res.status(400).json({ error: 'Missing required fields' });
        
        const { data, error } = await supabaseAdmin
            .from('plans_wishlist')
            .insert([{
                user_id: userId,
                title,
                category: category || 'Other',
                notes,
                budget: budget || '$$',
                priority: priority || 3,
                is_completed: false
            }])
            .select()
            .single();
            
        if (error) throw error;
        res.json({ success: true, item: data });
    } catch (err) {
        console.error('[POST_WISHLIST_ERROR]', err);
        res.status(500).json({ error: err.message });
    }
});

app.patch('/api/wishlist/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        const { data, error } = await supabaseAdmin
            .from('plans_wishlist')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
            
        if (error) throw error;
        res.json({ success: true, item: data });
    } catch (err) {
        console.error('[PATCH_WISHLIST_ERROR]', err);
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/wishlist/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabaseAdmin
            .from('plans_wishlist')
            .delete()
            .eq('id', id);
            
        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        console.error('[DELETE_WISHLIST_ERROR]', err);
        res.status(500).json({ error: err.message });
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
