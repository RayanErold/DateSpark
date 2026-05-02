import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * ItineraryService — The Bridge Module.
 * Now acts as a proxy to the Python AI Microservice and handles Plan discovery.
 */

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
let GOOGLE_API_KEY;
let genAI;

export const initItineraryService = (config) => {
    GOOGLE_API_KEY = config.GOOGLE_API_KEY;
    if (config.GEMINI_API_KEY) {
        console.log('[ItineraryService] Initializing with Gemini API Key');
        genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
    } else {
        console.warn('[ItineraryService] No GEMINI_API_KEY provided in config');
    }
};

// --- ASSET ENRICHMENT CONFIG ---
const VIBE_IMAGE_MAPPING = {
    'rooftop': 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&q=80&w=800',
    'jazz': 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=800',
    'picnic': 'https://images.unsplash.com/photo-1550586678-f7225f03c44b?auto=format&fit=crop&q=80&w=800',
    'museum': 'https://images.unsplash.com/photo-1518998053502-517e239eeef0?auto=format&fit=crop&q=80&w=800',
    'romantic': 'https://images.unsplash.com/photo-1516062423079-7ca13cdc7f5a?auto=format&fit=crop&q=80&w=800',
    'chill': 'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&q=80&w=800',
    'adventure': 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&q=80&w=800',
    'dinner': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=800',
    'drinks': 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=800',
    'park': 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&q=80&w=800',
    'walk': 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?auto=format&fit=crop&q=80&w=800',
    'movie': 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=800',
    'speakeasy': 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&q=80&w=800'
};

/**
 * Semantic Bridge: Takes AI search queries and fetches REAL venues from Google Places.
 * Ensures the date plan is actionable and physically real.
 */
const enrichWithRealPlaces = async (steps, location = 'NYC') => {
    if (!Array.isArray(steps)) return steps;

    const enrichedSteps = await Promise.all(steps.map(async (step) => {
        let query = step.search_query || `${step.activity} ${step.venue || ''}`.trim();
        if (!query) return step;

        // Ensure location is in the query for better accuracy
        const locationLower = location.toLowerCase();
        if (!query.toLowerCase().includes(locationLower)) {
            query = `${query} in ${location}`;
        }

        try {
            let response = await axios.post(
                'https://places.googleapis.com/v1/places:searchText',
                {
                    textQuery: query,
                    maxResultCount: 1
                },
                { 
                    headers: { 
                        'X-Goog-Api-Key': GOOGLE_API_KEY, 
                        'X-Goog-FieldMask': 'places.displayName,places.shortFormattedAddress,places.rating,places.location,places.photos,places.userRatingCount,places.name,places.reviews,places.websiteUri' 
                    } 
                }
            );

            let place = response.data.places?.[0];

            // --- FALLBACK STRATEGY ---
            if (!place) {
                // Clean activity for fallback: take only first 3 words to avoid "search pollution"
                const cleanActivity = (step.activity || 'interesting place').split(' ').slice(0, 3).join(' ');
                const fallbackQuery = `top rated ${cleanActivity} in ${location}`;
                
                response = await axios.post(
                    'https://places.googleapis.com/v1/places:searchText',
                    {
                        textQuery: fallbackQuery,
                        maxResultCount: 1
                    },
                    { 
                        headers: { 
                            'X-Goog-Api-Key': GOOGLE_API_KEY, 
                            'X-Goog-FieldMask': 'places.displayName,places.shortFormattedAddress,places.rating,places.location,places.photos,places.userRatingCount,places.name,places.reviews,places.websiteUri' 
                        } 
                    }
                );
                place = response.data.places?.[0];
            }

            if (!place) {
                return step;
            }

            // Construct Google Photo URL if available
            let googlePhotoUrl = null;
            if (place.photos && place.photos.length > 0) {
                const photoName = place.photos[0].name;
                googlePhotoUrl = `https://places.googleapis.com/v1/${photoName}/media?key=${GOOGLE_API_KEY}&maxWidthPx=800`;
            }

            // Map Google Reviews
            const reviews = (place.reviews || []).map(r => ({
                text: r.text?.text || '',
                author: r.authorAttribution?.displayName || 'Guest',
                rating: r.rating
            }));

            // Merge real data into the AI step
            return {
                ...step,
                venue: place.displayName?.text || step.venue,
                address: place.shortFormattedAddress || step.address,
                rating: place.rating || 4.5,
                userRatingCount: place.userRatingCount || 100,
                lat: place.location?.latitude,
                lng: place.location?.longitude,
                photoUrl: googlePhotoUrl || step.photoUrl,
                googlePlaceId: place.name?.split('/').pop(), // Extract just the ID
                websiteUrl: place.websiteUri,
                reviews: reviews.length > 0 ? reviews : (step.reviews || []),
                verified: true
            };
        } catch (err) {
            return step;
        }
    }));

    return enrichedSteps;
};

/**
 * Enriches plan steps with high-quality images based on vibe keywords or activity names.
 */
const enrichStepsWithImages = (steps) => {
    return steps.map((step, index) => {
        if (step.photoUrl) {
            return step;
        }

        const activity = (step.activity || '').toLowerCase();
        const vibe = (step.vibe_keyword || step.vibe || '').toLowerCase();
        
        // Find best match in mapping
        let matchedImage = VIBE_IMAGE_MAPPING['chill']; // Default
        
        for (const [key, url] of Object.entries(VIBE_IMAGE_MAPPING)) {
            if (vibe.includes(key) || activity.includes(key)) {
                matchedImage = url;
                break;
            }
        }

        return { ...step, photoUrl: matchedImage };
    });
};

// --- CORE AI GENERATION ---

export const generateAIDate = async (params) => {
    try {
        // --- 1. AI GENERATION (Native Gemini Integration) ---
        if (!genAI) {
            console.warn('[AI Service] Gemini not configured, falling back to Google Places');
            return await generateGoogleDate(params);
        }

        const context = params.prompt 
            ? `User Request: "${params.prompt}". If location is missing, assume ${params.city || 'NYC'}.`
            : `City: ${params.city || 'NYC'}, Vibe: ${params.vibe || 'chill'}, Budget: ${params.budget || 'flexible'}, Preferences: ${params.preferences || 'None'}`;

        const finalPrompt = `
            You are the 'Date Architect' for DateSpark. 
            ${context}
            
            CRITICAL INSTRUCTIONS:
            1. DO NOT make up venue names (e.g., don't say 'The Romantic Bistro'). Use 'REAL PLACE TBD' as the venue.
            2. Your 'search_query' MUST be a high-intent string that Google Maps can use to find a REAL, highly-rated business.
               Example: 'Best romantic rooftop bar with Empire State views in ${params.city || 'NYC'}'
            3. Ensure the 'activity' is descriptive but concise.
            
            Return ONLY a valid JSON object with:
            - title: Catchy name for the date (max 5 words)
            - description: A romantic/fun summary (max 20 words)
            - steps: Array of 3 activities. Each step MUST include:
                * 'time': e.g., '7:00 PM'
                * 'activity': A CONCISE category (e.g., 'Dinner', 'Cocktails', 'Stroll'). Max 3 words.
                * 'venue': 'REAL PLACE TBD'
                * 'description': A short, enticing blurb.
                * 'search_query': A high-intent, short Google Maps search string.
        `;

        let result;
        const modelsToTry = [
            "gemini-2.5-pro",
            "gemini-2.5-flash",
            "gemini-2.5-flash-lite",
            "gemini-2.0-flash", 
            "gemini-2.0-flash-exp", 
            "gemini-1.5-flash", 
            "gemini-1.5-flash-latest",
            "gemini-1.5-pro"
        ];

        let lastError;
        for (const modelName of modelsToTry) {
            try {
                console.log(`[AI Service] Attempting ${modelName}...`);
                const model = genAI.getGenerativeModel({ model: modelName });
                result = await model.generateContent(finalPrompt);
                console.log(`[AI Service] Success with ${modelName}`);
                break; // Exit loop on success
            } catch (err) {
                lastError = err;
                console.warn(`[AI Service] ${modelName} failed: ${err.message}`);
            }
        }

        if (!result) {
            throw new Error(`All Gemini models failed. Last error: ${lastError?.message}`);
        }
        
        const response = await result.response;
        let itineraryDataRaw = response.text();
        
        // Clean JSON formatting
        let itineraryData;
        try {
            const jsonMatch = itineraryDataRaw.match(/\{[\s\S]*\}/);
            itineraryData = JSON.parse(jsonMatch ? jsonMatch[0] : itineraryDataRaw);
        } catch (e) {
            console.error('[AI_PARSE_ERROR]', e);
            throw new Error("Failed to parse AI response");
        }

        // --- 2. ENRICHMENT & PERSISTENCE ---
        let foundKey = null;
        const findStepsArray = (obj) => {
            if (Array.isArray(obj)) return obj;
            if (!obj || typeof obj !== 'object') return null;
            const keys = ['steps', 'itinerary', 'activities', 'plan', 'items'];
            for (const key of keys) {
                if (Array.isArray(obj[key])) { foundKey = key; return obj[key]; }
            }
            return null;
        };

        const rawSteps = findStepsArray(itineraryData);

        if (rawSteps) {
            const city = params.city || params.location || 'NYC';
            const enrichedSteps = await enrichWithRealPlaces(rawSteps, city);
            const finalSteps = enrichStepsWithImages(enrichedSteps);
            
            if (foundKey) itineraryData[foundKey] = finalSteps;
            itineraryData.steps = finalSteps; 

            return { 
                source: 'NATIVE_AI', 
                data: itineraryData, 
                enriched: true 
            };
        }

        return { source: 'NATIVE_AI', data: itineraryData, enriched: false };
    } catch (err) {
        console.warn(`[Native AI] Failed, falling back to Google Places: ${err.message}`);
        return await generateGoogleDate(params);
    }
};

/**
 * --- GOOGLE PLACES GENERATION (NON-AI) ---
 * Used by Guided Builder to find real venues without LLM orchestration.
 */
export const generateGoogleDate = async (params) => {
    try {
        const city = params.city || params.location || 'NYC';
        const vibe = params.vibe || 'romantic';
        
        // 1. Find a Restaurant
        const restResponse = await axios.post(
            'https://places.googleapis.com/v1/places:searchText',
            {
                textQuery: `top rated ${vibe} restaurant in ${city}`,
                maxResultCount: 1
            },
            { headers: { 'X-Goog-Api-Key': GOOGLE_API_KEY, 'X-Goog-FieldMask': 'places.displayName,places.location,places.shortFormattedAddress,places.rating' } }
        );

        // 2. Find an Activity
        const actResponse = await axios.post(
            'https://places.googleapis.com/v1/places:searchText',
            {
                textQuery: `${vibe} activity or attraction in ${city}`,
                maxResultCount: 1
            },
            { headers: { 'X-Goog-Api-Key': GOOGLE_API_KEY, 'X-Goog-FieldMask': 'places.displayName,places.location,places.shortFormattedAddress,places.rating' } }
        );

        const rest = restResponse.data.places?.[0];
        const act = actResponse.data.places?.[0];

        const itinerary = {
            title: `${vibe.charAt(0).toUpperCase() + vibe.slice(1)} Date in ${city}`,
            description: `A hand-picked ${vibe} experience discovered via Google Places.`,
            steps: enrichStepsWithImages([
                {
                    time: "Evening",
                    activity: "Dinner",
                    venue: rest?.displayName?.text || "Local Favorite",
                    address: rest?.shortFormattedAddress || "In the heart of the city",
                    rating: rest?.rating,
                    vibe: vibe
                },
                {
                    time: "Late Night",
                    activity: "Shared Experience",
                    venue: act?.displayName?.text || "City Landmark",
                    address: act?.shortFormattedAddress || "Nearby",
                    rating: act?.rating,
                    vibe: vibe
                }
            ])
        };

        return { 
            source: 'GOOGLE_PLACES', 
            data: itinerary, 
            enriched: true 
        };
    } catch (err) {
        throw new Error('Failed to generate plan via Google Places');
    }
};

/**
 * Persists a generated plan to Supabase.
 */
export const savePlan = async (supabase, userId, planData, aiResult) => {
    // Normalization logic: always ensure we have a 'steps' array
    let steps = [];
    let title = 'Your Date Plan';
    let description = 'A curated experience by Spark AI';

    if (Array.isArray(aiResult.data)) {
        steps = aiResult.data;
    } else if (typeof aiResult.data === 'object' && aiResult.data !== null) {
        // Look for any common keys that might contain the list of steps
        steps = aiResult.data.steps || 
                aiResult.data.itinerary || 
                aiResult.data.schedule || 
                aiResult.data.plan || 
                aiResult.data.date || 
                aiResult.data.timeline || 
                [];
        title = aiResult.data.title || title;
        description = aiResult.data.description || description;
    } else if (typeof aiResult.data === 'string' && aiResult.data.trim().length > 0) {
        // Fallback: If it's a string, treat it as a single raw step
        steps = [{
            time: "Today",
            activity: "Date Experience",
            venue: "See Details Below",
            location: planData.location || "Nearby",
            description: aiResult.data,
            vibe: planData.vibe || 'classic'
        }];
        description = "Raw plan generated by Spark AI";
    }

    const { data, error } = await supabase
        .from('plans')
        .insert([{
            user_id: userId,
            location: planData.location || planData.city || 'NYC',
            vibe: planData.vibe || 'chill',
            budget: planData.budget || 'smart',
            itinerary: {
                steps: steps, // Already enriched by generateAIDate or generateGoogleDate
                metadata: {
                    user_input: planData.prompt || planData.preferences || planData.interests || '',
                    location: planData.location || planData.city,
                    vibe: planData.vibe,
                    budget: planData.budget,
                    planDate: planData.planDate || new Date().toISOString().split('T')[0]
                }
            },
            title: title,
            description: description,
            lat: planData.lat,
            lng: planData.lng,
            is_favorite: planData.is_favorite || false,
            generation_type: aiResult.source === 'GOOGLE_PLACES' ? 'guided' : 'classic',
            created_at: new Date().toISOString()
        }])
        .select()
        .single();

    if (error) throw error;
    return data;
};

/**
 * Recreates a plan based on the last session's parameters.
 */
export const recreatePlan = async (supabase, planId) => {
    const { data: original } = await supabase
        .from('plans')
        .select('*')
        .eq('id', planId)
        .single();
    
    if (!original) throw new Error('Original plan not found');

    let aiResult;
    // Respect the original generation type
    if (original.generation_type === 'guided') {
        aiResult = await generateGoogleDate({
            location: original.location,
            vibe: original.vibe,
            budget: original.budget
        });
    } else {
        aiResult = await generateAIDate({
            city: original.location,
            vibe: original.vibe,
            budget: original.budget,
            preferences: original.itinerary?.metadata?.user_input || original.description
        });
    }

    return await savePlan(supabase, original.user_id, original, aiResult);
};

// --- PLAN DISCOVERY & MANAGEMENT ---

export const getTrendingPlans = async (supabase) => {
    try {
        // Fetch the top 50 highly-boosted plans to create a healthy rotation pool
        const { data } = await supabase
            .from('plans')
            .select('*')
            .is('deleted_at', null)
            .not('itinerary', 'is', null)
            .order('boost_count', { ascending: false })
            .limit(50);

        if (!data || data.length === 0) return [];

        // Dynamic Rotation: Shuffle the results so the feed feels fresh on every refresh
        const rotated = [...data].sort(() => Math.random() - 0.5);
        
        // Return a fresh batch of 20 (or fewer if pool is small)
        return rotated.slice(0, 20);
    } catch (err) {
        console.error('[Trending Rotation Error]', err);
        return [];
    }
};

export const searchPlans = async (supabase, query) => {
    const { data } = await supabase
        .from('plans')
        .select('*')
        .is('deleted_at', null)
        .not('itinerary', 'is', null)
        .or(`location.ilike.%${query}%,vibe.ilike.%${query}%`)
        .order('boost_count', { ascending: false })
        .limit(20);
    return data || [];
};

export const getUserPlans = async (supabase, userId) => {
    const { data } = await supabase
        .from('plans')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
    return data || [];
};

export const getPlanById = async (supabase, planId) => {
    const { data } = await supabase.from('plans').select('*').eq('id', planId).single();
    return data;
};

// --- ENGAGEMENT LOGIC ---

export const boostPlan = async (supabase, planId, userId) => {
    const { data: plan } = await supabase.from('plans').select('boost_count, boosted_by').eq('id', planId).single();
    const boostedBy = Array.isArray(plan.boosted_by) ? plan.boosted_by : [];
    const alreadyBoosted = boostedBy.includes(userId);

    const newCount = alreadyBoosted ? Math.max(0, plan.boost_count - 1) : plan.boost_count + 1;
    const newBoostedBy = alreadyBoosted ? boostedBy.filter(uid => uid !== userId) : [...boostedBy, userId];

    const { data } = await supabase
        .from('plans')
        .update({ boost_count: newCount, boosted_by: newBoostedBy })
        .eq('id', planId)
        .select('boost_count')
        .single();
    
    return { boost_count: data.boost_count, is_boosted: !alreadyBoosted };
};

export const tryPlan = async (supabase, planId) => {
    const { data: current } = await supabase.from('plans').select('total_tries').eq('id', planId).single();
    const { data } = await supabase
        .from('plans')
        .update({ total_tries: (current?.total_tries || 0) + 1 })
        .eq('id', planId)
        .select('total_tries')
        .single();
    return data.total_tries;
};

// --- VENUE UTILITIES ---

export const getNearbyAlternatives = async (params) => {
    const { lat, lng, type, radius = 10000, budget = '$$' } = params;
    
    try {
        console.log(`[ItineraryService] Fetching alternatives for "${type}" near (${lat}, ${lng})`);
        
        const response = await axios.post(
            'https://places.googleapis.com/v1/places:searchText',
            {
                textQuery: `${type} near here`,
                locationBias: { 
                    circle: { 
                        center: { latitude: lat, longitude: lng }, 
                        radius: radius 
                    } 
                },
                maxResultCount: 10
            },
            { 
                headers: { 
                    'X-Goog-Api-Key': GOOGLE_API_KEY, 
                    'X-Goog-FieldMask': 'places.id,places.displayName,places.location,places.shortFormattedAddress,places.rating,places.editorialSummary,places.photos,places.googleMapsUri,places.websiteUri' 
                } 
            }
        );

        if (!response.data.places) return [];

        // Map to frontend-friendly format
        return response.data.places.map(place => ({
            id: place.id,
            name: place.displayName?.text || 'Unknown Venue',
            address: place.shortFormattedAddress,
            rating: place.rating,
            description: place.editorialSummary?.text || 'A top-rated local destination.',
            photo: place.photos?.[0] ? `https://places.googleapis.com/v1/${place.photos[0].name}/media?key=${GOOGLE_API_KEY}&maxWidthPx=800` : null,
            location: place.location,
            searchUrl: place.googleMapsUri,
            website: place.websiteUri
        }));
    } catch (err) {
        console.error('[ItineraryService] Google Places Search Error:', err.response?.data || err.message);
        throw err;
    }
};
// --- RATINGS & FEEDBACK ---

export const getPlaceRatings = async (supabase, planId) => {
    const { data, error } = await supabase
        .from('place_ratings')
        .select('*')
        .eq('plan_id', planId)
        .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
};

export const addPlaceRating = async (supabase, ratingData) => {
    const { data, error } = await supabase
        .from('place_ratings')
        .insert([{
            plan_id: ratingData.planId,
            user_id: ratingData.userId,
            place_name: ratingData.placeName,
            place_id: ratingData.placeId,
            rating: ratingData.rating,
            comment: ratingData.comment,
            quick_tag: ratingData.quickTag
        }])
        .select()
        .single();
    
    if (error) throw error;
    return data;
};

export const updatePlan = async (supabase, planId, updateData) => {
    const { data, error } = await supabase
        .from('plans')
        .update(updateData)
        .eq('id', planId)
        .select()
        .single();
    if (error) throw error;
    return data;
};

export const deletePlan = async (supabase, planId) => {
    const { error } = await supabase
        .from('plans')
        .delete()
        .eq('id', planId);
    if (error) throw error;
    return { success: true };
};
export const getRecommendations = async (supabase, userId) => {
    try {
        // 1. Get user's recent favorite plans to learn "taste"
        const { data: favorites } = await supabase
            .from('plans')
            .select('vibe, itinerary')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(10);

        // Extract most frequent vibes
        const vibes = favorites ? favorites.map(f => f.vibe).filter(Boolean) : [];
        const topVibe = vibes.length > 0 ? vibes[0] : null;

        // 2. Query for similar plans from the community
        let query = supabase
            .from('plans')
            .select('*')
            .eq('is_public', true)
            .neq('user_id', userId); // Don't recommend their own plans

        if (topVibe) {
            query = query.ilike('vibe', `%${topVibe}%`);
        }

        const { data: recommendations, error } = await query
            .order('boost_count', { ascending: false })
            .limit(15);

        if (error) throw error;

        // 3. Fallback: If no vibe-specific plans, get general trending
        if (!recommendations || recommendations.length < 5) {
            const { data: trending } = await supabase
                .from('plans')
                .select('*')
                .eq('is_public', true)
                .neq('user_id', userId)
                .order('boost_count', { ascending: false })
                .limit(15);
            return trending || [];
        }

        return recommendations;
    } catch (err) {
        console.error('[RECOMMENDATIONS_ERROR]', err.message);
        return [];
    }
};
