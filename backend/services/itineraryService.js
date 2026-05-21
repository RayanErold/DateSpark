import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * ItineraryService — The Bridge Module.
 * Now acts as a proxy to the Python AI Microservice and handles Plan discovery.
 */

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8001';
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
// We no longer use static Unsplash mappings to ensure 100% authenticity.
const VIBE_IMAGE_MAPPING = {};

/**
 * Semantic Bridge: Takes AI search queries and fetches REAL venues from Google Places.
 * Ensures the date plan is actionable and physically real.
 */
/**
 * Semantic Bridge: Takes AI search queries and fetches REAL venues from Google Places.
 * Ensures the date plan is actionable and physically real.
 */
export const enrichWithRealPlaces = async (steps, location, coords = null, radius = 15000) => {
    const city = location || 'NYC';
    
    // --- LOCATION BIAS CONFIG ---
    // If exact coordinates are provided, bias the search to the specified radius.
    const locationBias = (coords && coords.lat && coords.lng) ? {
        circle: {
            center: { latitude: coords.lat, longitude: coords.lng },
            radius: radius // e.g., 800m for neighborhood lock, 15000m default
        }
    } : null;

    const enrichedSteps = await Promise.all(steps.map(async (step) => {
        // Skip enrichment if already verified with a Google photo or place ID
        if (step.googlePlaceId || (step.photoUrl || '').includes('places.googleapis.com')) {
            return step;
        }

        try {
            // --- STEP 1: Determine the best Search Query ---
            const isPlaceholder = !step.venue || 
                                 step.venue.includes('TBD') || 
                                 step.venue.includes('REAL PLACE') || 
                                 step.venue.includes('Search for');
            
            // STEP 1: Formulate a precise search query
            const searchContext = location || city || 'NYC';
            const query = step.search_query || (isPlaceholder 
                ? `${step.activity} in ${searchContext}`
                : `${step.venue} in ${searchContext}`);
            
            console.log(`[Google Search] Query: "${query}"`);

            let response = await axios.post(
                'https://places.googleapis.com/v1/places:searchText',
                { 
                    textQuery: query, 
                    maxResultCount: 1,
                    ...(locationBias && { locationBias }) // Real-time GPS Biasing
                },
                { headers: { 'X-Goog-Api-Key': GOOGLE_API_KEY, 'X-Goog-FieldMask': 'places.displayName,places.shortFormattedAddress,places.rating,places.location,places.photos,places.userRatingCount,places.name,places.reviews,places.websiteUri' } }
            );

            let place = response.data.places?.[0];

            // Fallback A: If we searched by venue name and failed, try the search_query directly if it exists
            if (!place && !isPlaceholder && step.search_query) {
                response = await axios.post(
                    'https://places.googleapis.com/v1/places:searchText',
                    { 
                        textQuery: step.search_query, 
                        maxResultCount: 1,
                        ...(locationBias && { locationBias }) 
                    },
                    { headers: { 'X-Goog-Api-Key': GOOGLE_API_KEY, 'X-Goog-FieldMask': 'places.displayName,places.shortFormattedAddress,places.rating,places.location,places.photos,places.userRatingCount,places.name,places.reviews,places.websiteUri' } }
                );
                place = response.data.places?.[0];
            }

            // Fallback B: Search by activity and city
            if (!place) {
                const activityQuery = `${step.activity} near ${city}`;
                response = await axios.post(
                    'https://places.googleapis.com/v1/places:searchText',
                    { 
                        textQuery: activityQuery, 
                        maxResultCount: 1,
                        ...(locationBias && { locationBias })
                    },
                    { headers: { 'X-Goog-Api-Key': GOOGLE_API_KEY, 'X-Goog-FieldMask': 'places.displayName,places.shortFormattedAddress,places.rating,places.location,places.photos,places.userRatingCount,places.name,places.reviews,places.websiteUri' } }
                );
                place = response.data.places?.[0];
            }

            // Final Fallback C: Generic high-level search for the activity in that city
            if (!place) {
                const genericQuery = `${step.activity} in ${city}`;
                try {
                    response = await axios.post(
                        'https://places.googleapis.com/v1/places:searchText',
                        { 
                            textQuery: genericQuery, 
                            maxResultCount: 1 
                        },
                        { headers: { 'X-Goog-Api-Key': GOOGLE_API_KEY, 'X-Goog-FieldMask': 'places.photos,places.displayName,places.name' } }
                    );
                    place = response.data.places?.[0];
                } catch (err) {
                    console.warn(`[Final Fallback Error] ${genericQuery}:`, err.message);
                }
            }

            if (!place) {
                // IMPORTANT: Keep the old photo if search fails entirely
                return { ...step, verified: false };
            }

            // --- STEP 3: Normalization ---
            let googlePhotoUrl = null;
            if (place.photos && place.photos.length > 0) {
                const photoName = place.photos[0].name;
                if (photoName && photoName.startsWith('places/')) {
                    googlePhotoUrl = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=800&key=${GOOGLE_API_KEY}`;
                }
            }

            const reviews = (place.reviews || []).map(r => ({
                text: r.text?.text || '',
                author: r.authorAttribution?.displayName || 'Guest',
                rating: r.rating
            }));

            return {
                ...step,
                venue: place.displayName?.text || step.venue,
                address: place.shortFormattedAddress || step.address,
                rating: place.rating || 4.5,
                userRatingCount: place.userRatingCount || 100,
                lat: place.location?.latitude,
                lng: place.location?.longitude,
                // AUTHENTICITY LOGIC: Prefer new photo, otherwise keep the OLD photo
                photoUrl: googlePhotoUrl || step.photoUrl,
                googlePlaceId: place.name?.split('/').pop(),
                websiteUrl: place.websiteUri,
                reviews: reviews.length > 0 ? reviews : (step.reviews || []),
                verified: true
            };
        } catch (err) {
            console.warn(`[Enrichment Error] ${step.activity}:`, err.message);
            return { ...step, verified: false };
        }
    }));

    return enrichedSteps;
};

/**
 * Enriches plan steps with high-quality images based on vibe keywords or activity names.
 * Used only as a FINAL safety fallback when Google Places enrichment fails completely.
 */
const enrichStepsWithImages = (steps) => {
    return steps.map((step, index) => {
        // If it already has a photo (real or already enriched), keep it
        if (step.photoUrl || step.image || step.photo) {
            return step;
        }

        const activity = (step.activity || '').toLowerCase();
        const vibe = (step.vibe_keyword || step.vibe || '').toLowerCase();
        
        // Find best match in mapping
        let matchedImage = null; // Don't default to chill anymore, let it be null so we know it's empty
        
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
        // --- 1. AI GENERATION (Call Python Microservice) ---
        // This is now our primary "Brain". It handles prompts, coordinates, and fallbacks.
        console.log(`[ItineraryService] Delegating generation to AI Microservice: ${AI_SERVICE_URL}`);
        
        const response = await axios.post(`${AI_SERVICE_URL}/generate-itinerary`, {
            city: params.city || params.location,
            vibe: params.vibe,
            budget: params.budget,
            preferences: params.preferences || params.prompt || '',
            lat: params.lat,
            lng: params.lng,
            neighborhoodLock: params.neighborhoodLock || false,
            // Include customizable options
            numActivities: params.numActivities,
            radius: params.radius,
            planDate: params.planDate,
            planTime: params.planTime
        }, { timeout: 30000 });

        if (response.data && response.data.raw_itinerary) {
            let itineraryData;
            try {
                // The Python service returns raw string/json, we need to parse it
                const raw = response.data.raw_itinerary;
                const jsonMatch = raw.match(/\{[\s\S]*\}/);
                itineraryData = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
            } catch (e) {
                console.error('[Microservice Parse Error]', e);
                throw new Error("Invalid format from AI Microservice");
            }

            // --- 2. ENRICHMENT & PERSISTENCE ---
            const rawSteps = itineraryData.steps || itineraryData.itinerary || [];
            
            if (rawSteps.length > 0) {
                const city = params.city || params.location || 'NYC';
                const coords = (params.lat && params.lng) ? { lat: params.lat, lng: params.lng } : null;
                
                // Still use the JS side for Google Places enrichment (it's faster here)
                const radius = params.neighborhoodLock ? 800 : (params.radius || 15000);
                const enrichedSteps = await enrichWithRealPlaces(rawSteps, city, coords, radius);
                itineraryData.steps = enrichedSteps; 

                return { 
                    source: `AI_MICROSERVICE_${response.data.provider || 'UNKNOWN'}`, 
                    data: itineraryData, 
                    enriched: true 
                };
            }
        }

        throw new Error("Empty response from AI Microservice");

    } catch (err) {
        console.warn(`[AI Microservice Failed] falling back to Native Gemini: ${err.message}`);
        
        // --- EMERGENCY FALLBACK: Native Gemini (If Microservice is down) ---
        if (!genAI) {
            return await generateGoogleDate(params);
        }

        const numStops = params.numActivities || 3;
        const radiusVal = params.radius ? `${(params.radius / 1609.34).toFixed(1)} miles` : 'standard';
        const fallbackPrompt = `Generate a ${numStops}-step date plan for ${params.city || 'NYC'}.
        Vibe: ${params.vibe || 'chill'}.
        Budget: ${params.budget || 'moderate'}.
        Distance/Radius: ${radiusVal}.
        Time of day: ${params.planTime || 'Evening'}.
        Date: ${params.planDate || 'Anytime'}.
        Preferences: ${params.preferences || params.prompt || 'None'}.
        
        The plan MUST have exactly ${numStops} sequential activity stops/steps.
        
        Return ONLY valid JSON matching this exact schema:
        {
          "title": "Catchy name for the date",
          "description": "A romantic or fun summary",
          "steps": [
            {
              "time": "e.g. 6:30 PM",
              "activity": "A concise category of the activity (max 3 words)",
              "venue": "A real popular matching venue name in the target city",
              "description": "A short, concise (max 20-30 words) unique description tailored exactly to this venue and vibe, explaining why it's a stellar choice. It must be specific, distinct, and not repeated across other steps."
            }
          ]
        }
        
        Do not return anything else except the JSON.`;
        
        const fallbackModels = [
            "gemini-2.5-pro",
            "gemini-flash-latest",
            "gemini-2.5-flash-lite",
            "gemini-pro-latest"
        ];
        
        let lastError = null;
        for (const modelName of fallbackModels) {
            try {
                console.log(`[ItineraryService Fallback] Attempting native generation with ${modelName}...`);
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent(fallbackPrompt);
                const data = JSON.parse(result.response.text().match(/\{[\s\S]*\}/)[0]);
                console.log(`[ItineraryService Fallback] Success with ${modelName}`);
                return { 
                    source: `NATIVE_GEMINI_FALLBACK_${modelName.toUpperCase().replace(/-/g, '_')}`, 
                    data, 
                    enriched: false 
                };
            } catch (err) {
                console.warn(`[ItineraryService Fallback] Model ${modelName} failed:`, err.message);
                lastError = err;
            }
        }
        
        throw lastError || new Error("All native fallback models failed");
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
        
        const radius = params.neighborhoodLock ? 800 : 15000;
        const locationBias = (params.lat && params.lng) ? {
            circle: {
                center: { latitude: params.lat, longitude: params.lng },
                radius: radius
            }
        } : null;

        // 1. Find a Restaurant
        const restResponse = await axios.post(
            'https://places.googleapis.com/v1/places:searchText',
            {
                textQuery: `top rated ${vibe} restaurant in ${city}`,
                maxResultCount: 1,
                ...(locationBias && { locationBias })
            },
            { headers: { 'X-Goog-Api-Key': GOOGLE_API_KEY, 'X-Goog-FieldMask': 'places.displayName,places.location,places.shortFormattedAddress,places.rating' } }
        );

        // 2. Find an Activity
        const actResponse = await axios.post(
            'https://places.googleapis.com/v1/places:searchText',
            {
                textQuery: `${vibe} activity or attraction in ${city}`,
                maxResultCount: 1,
                ...(locationBias && { locationBias })
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
                    description: `Enjoy a delicious dinner at ${rest?.displayName?.text || "Local Favorite"}, offering an excellent menu and a perfect ${vibe} dining experience in ${city}.`,
                    vibe: vibe
                },
                {
                    time: "Late Night",
                    activity: "Shared Experience",
                    venue: act?.displayName?.text || "City Landmark",
                    address: act?.shortFormattedAddress || "Nearby",
                    rating: act?.rating,
                    description: `Cap off your date night with an incredible experience at ${act?.displayName?.text || "City Landmark"}, a stellar location highlighting the unique local culture of ${city}.`,
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
        // Fetch a pool of plans, prioritizing boosted ones but allowing others if needed
        const { data, error } = await supabase
            .from('plans')
            .select('*')
            .is('deleted_at', null)
            .not('itinerary', 'is', null)
            .order('boost_count', { ascending: false })
            .limit(60);

        if (error || !data || data.length === 0) {
            console.warn('[Trending] No plans found in database.');
            return [];
        }

        // Shuffle and pick a display batch (20 to match Dashboard UI)
        const selectedPlans = data.sort(() => Math.random() - 0.5).slice(0, 20);

        // --- REAL PHOTO ENFORCEMENT ---
        // We use a sequential loop here to avoid hitting Google API rate limits with 20 parallel plans.
        const enrichedPlans = [];
        for (const plan of selectedPlans) {
            let itinerary = plan.itinerary;
            let steps = Array.isArray(itinerary) ? itinerary : (itinerary?.steps || []);
            
            // Force enrichment if:
            // 1. Missing Place ID
            // 2. Not a Google URL (e.g. Unsplash or null)
            // 3. Is a Legacy URL (maps.googleapis.com)
            const needsEnrichment = steps.some(s => 
                !s.googlePlaceId || 
                !(s.photoUrl || '').includes('places.googleapis.com') ||
                (s.photoUrl || '').includes('maps.googleapis.com') ||
                (s.photoUrl || '').includes('unsplash')
            );
            
            if (needsEnrichment && steps.length > 0) {
                console.log(`[Trending] Found unverified steps in "${plan.title || plan.id}". Enriching...`);
                try {
                    const rawEnrichedSteps = await enrichWithRealPlaces(steps, plan.location, { lat: plan.lat, lng: plan.lng });
                    const enrichedSteps = enrichStepsWithImages(rawEnrichedSteps);
                    
                    let updatedItinerary = Array.isArray(itinerary) ? enrichedSteps : { ...itinerary, steps: enrichedSteps };
                    
                    // Await the DB update to ensure persistence
                    const { error } = await supabase.from('plans')
                        .update({ itinerary: updatedItinerary })
                        .eq('id', plan.id);

                    if (!error) console.log(`[Trending Sync] Persisted real photos for ${plan.id}`);
                    else console.error(`[Trending Sync Error] for ${plan.id}:`, error.message);

                    enrichedPlans.push({ ...plan, itinerary: updatedItinerary });
                } catch (enrichErr) {
                    console.error(`[Trending Enrich Failed] for ${plan.id}:`, enrichErr.message);
                    enrichedPlans.push(plan);
                }
            } else {
                enrichedPlans.push(plan);
            }
        }

        return enrichedPlans;
    } catch (err) {
        console.error('[Trending Error]', err);
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
