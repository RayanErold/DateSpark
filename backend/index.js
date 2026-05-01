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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Services (Inject Dependencies)
itineraryService.initItineraryService({ 
    GOOGLE_API_KEY: process.env.VITE_GOOGLE_MAPS_API_KEY 
});
paymentService.initPaymentService(process.env.STRIPE_SECRET_KEY);

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

app.use(cors());
app.use(express.json());

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
        const { userId } = req.body;
        const savedPlan = await generationService.generatePlanFlow(supabase, userId, req.body, 'classic');
        res.json({ success: true, plan: savedPlan });
    } catch (err) { 
        console.error('[GENERATE_ERROR]', err);
        const status = err.status || 500;
        res.status(status).json({ error: err.message, code: err.code }); 
    }
});

app.post('/api/generate-custom-date', async (req, res) => {
    try {
        const { userId } = req.body;
        const savedPlan = await generationService.generatePlanFlow(supabase, userId, req.body, 'guided');
        res.json({ success: true, plan: savedPlan });
    } catch (err) { 
        console.error('[GENERATE_CUSTOM_ERROR]', err);
        const status = err.status || 500;
        res.status(status).json({ error: err.message, code: err.code }); 
    }
});

app.post('/api/recreate-date', async (req, res) => {
    try {
        const { planId, userId } = req.body;
        const newPlan = await generationService.recreatePlanFlow(supabase, userId, planId, 'classic');
        res.json({ success: true, plan: newPlan });
    } catch (err) { 
        console.error('[RECREATE_ERROR]', err);
        const status = err.status || 500;
        res.status(status).json({ error: err.message, code: err.code }); 
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

// 2. EVENTS
app.get('/api/events', async (req, res) => {
    const events = await fetchEvents(req.query.city, req.query.category, 15, process.env.TICKETMASTER_API_KEY);
    res.json(events);
});

// 3. PAYMENTS
app.post('/api/create-checkout-session', async (req, res) => {
    try {
        const session = await paymentService.createCheckoutSession({
            ...req.body,
            successUrl: `${process.env.VITE_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
            cancelUrl: `${process.env.VITE_APP_URL}/pricing`
        });
        res.json({ url: session.url });
    } catch (err) { res.status(500).json({ error: 'Payment failed' }); }
});

// 4. USERS & ACCOUNT
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

app.post('/api/upload-avatar', express.raw({ type: 'image/*', limit: '5mb' }), async (req, res) => {
    try {
        const url = await userService.updateAvatar(supabaseAdmin, req.headers['x-user-id'], req.body, req.headers['content-type']);
        res.json({ success: true, publicUrl: url });
    } catch (err) { res.status(500).json({ error: err.message }); }
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

app.listen(PORT, () => console.log(`🚀 Gateway API running on port ${PORT}`));
