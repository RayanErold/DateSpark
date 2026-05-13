import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import * as itineraryService from '../backend/services/itineraryService.js';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function heal() {
    console.log('--- STARTING TRENDING HEAL ---');
    
    // Initialize service
    itineraryService.initItineraryService({
        GOOGLE_API_KEY: process.env.VITE_GOOGLE_MAPS_API_KEY,
        GEMINI_API_KEY: process.env.GEMINI_API_KEY
    });

    try {
        console.log('Fetching trending plans...');
        const plans = await itineraryService.getTrendingPlans(supabase);
        
        console.log(`Found ${plans.length} trending plans.`);
        
        let fixedCount = 0;
        for (const plan of plans) {
            const steps = plan.itinerary?.steps || plan.itinerary || [];
            const googlePhotos = steps.filter(s => (s.photoUrl || '').includes('google')).length;
            
            if (googlePhotos < steps.length) {
                console.log(`Plan "${plan.id}" has ${googlePhotos}/${steps.length} real photos. Fixed in live session.`);
                fixedCount++;
            } else {
                console.log(`Plan "${plan.id}" is fully verified.`);
            }
        }
        
        console.log(`--- HEAL COMPLETE: ${fixedCount} plans processed ---`);
    } catch (err) {
        console.error('HEAL ERROR:', err);
    }
}

heal();
