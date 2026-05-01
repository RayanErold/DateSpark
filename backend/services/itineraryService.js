import axios from 'axios';

/**
 * ItineraryService — The Bridge Module.
 * Now acts as a proxy to the Python AI Microservice and handles Plan discovery.
 */

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
let GOOGLE_API_KEY;

export const initItineraryService = (config) => {
    GOOGLE_API_KEY = config.GOOGLE_API_KEY;
};

// --- CORE AI GENERATION ---

export const generateAIDate = async (params) => {
    try {
        const aiResponse = await axios.post(`${AI_SERVICE_URL}/generate-itinerary`, {
            city: params.city || params.location,
            vibe: params.vibe,
            budget: params.budget,
            preferences: params.preferences || params.interests,
            prompt: params.prompt // Natural language prompt from Copilot
        });
        
        // The Python service returns { raw_itinerary: "..." }
        // We might need to parse it if it's a string, or just pass it through
        let itineraryData = aiResponse.data.raw_itinerary;
        try {
            if (typeof itineraryData === 'string') {
                // Find the first { and last } to extract JSON if there's conversational text
                const firstBrace = itineraryData.indexOf('{');
                const lastBrace = itineraryData.lastIndexOf('}');
                
                if (firstBrace !== -1 && lastBrace !== -1) {
                    const jsonCandidate = itineraryData.substring(firstBrace, lastBrace + 1);
                    itineraryData = JSON.parse(jsonCandidate);
                } else {
                    // Fallback to old method if braces not found (though unlikely for valid JSON)
                    const cleanJson = itineraryData.replace(/```json\n?|\n?```/g, '').trim();
                    itineraryData = JSON.parse(cleanJson);
                }
            }
        } catch (e) {
            console.warn('[PARSING_FAILED] Using raw string instead of JSON. Error:', e.message);
        }

        return { 
            source: 'AI_SERVICE', 
            data: itineraryData, 
            enriched: true 
        };
    } catch (err) {
        console.error('[ITINERARY_BRIDGE_ERROR]', err.message);
        if (err.response && err.response.data && err.response.data.detail) {
            throw new Error(`AI Service Error: ${err.response.data.detail}`);
        }
        throw new Error('AI Service Unavailable (Is the Python service running?)');
    }
};

/**
 * Persists a generated plan to Supabase.
 */
export const savePlan = async (supabase, userId, planData, aiResult) => {
    const { data, error } = await supabase
        .from('plans')
        .insert([{
            user_id: userId,
            location: planData.location || planData.city || 'NYC',
            vibe: planData.vibe || 'chill',
            budget: planData.budget || 'smart',
            itinerary: typeof aiResult.data === 'object' ? aiResult.data : { raw: aiResult.data },
            title: (typeof aiResult.data === 'object' ? aiResult.data.title : null) || 'Your Date Plan',
            description: (typeof aiResult.data === 'object' ? aiResult.data.description : null) || 'A curated experience by Spark AI',
            lat: planData.lat,
            lng: planData.lng,
            is_favorite: planData.is_favorite || false,
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

    // We use the same parameters to generate a fresh itinerary
    const aiResult = await generateAIDate({
        city: original.location,
        vibe: original.vibe,
        budget: original.budget,
        preferences: original.description // using description as proxy for preferences if needed
    });

    return await savePlan(supabase, original.user_id, original, aiResult);
};

// --- PLAN DISCOVERY & MANAGEMENT ---

export const getTrendingPlans = async (supabase) => {
    const { data } = await supabase
        .from('plans')
        .select('*')
        .is('deleted_at', null)
        .not('itinerary', 'is', null)
        .order('boost_count', { ascending: false })
        .limit(20);
    return data || [];
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

export const swapVenue = async (params) => {
    const { lat, lng, type } = params;
    const response = await axios.post(
        'https://places.googleapis.com/v1/places:searchText',
        {
            textQuery: `${type} near this location`,
            locationBias: { circle: { center: { latitude: lat, longitude: lng }, radius: 5000 } }
        },
        { headers: { 'X-Goog-Api-Key': GOOGLE_API_KEY, 'X-Goog-FieldMask': 'places.id,places.displayName,places.location,places.shortFormattedAddress,places.rating' } }
    );
    return response.data.places;
};
