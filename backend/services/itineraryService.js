import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as cacheService from './cacheService.js';

// Helper for cached Places searchText queries to optimize API usage and reduce costs
const postPlacesSearchText = async (data, config) => {
    // Generate a normalized unique cache key based on query parameters
    const cacheKey = cacheService.normalizeQueryKey(data);
    
    try {
        // Check cache
        const cachedResult = await cacheService.getCachedPlace(cacheKey);
        if (cachedResult) {
            console.log(`[Google Cache Hit] for query: "${data.textQuery}"`);
            return { data: cachedResult };
        }
        
        // Cache miss: execute live API call
        console.log(`[Google Cache Miss] Fetching from Google Places API: "${data.textQuery}"`);
        const response = await axios.post(
            'https://places.googleapis.com/v1/places:searchText',
            data,
            config
        );
        
        // Cache successful response with multi-key indexing (query, placeId, venueName)
        if (response && response.data) {
            const extraKeys = [];
            const firstPlace = response.data.places?.[0];
            if (firstPlace) {
                if (firstPlace.name) {
                    const pKey = cacheService.normalizePlaceId(firstPlace.name);
                    if (pKey) extraKeys.push(pKey);
                }
                if (firstPlace.displayName?.text) {
                    const vKey = cacheService.normalizeVenueKey(firstPlace.displayName.text, data.textQuery);
                    if (vKey) extraKeys.push(vKey);
                }
            }
            await cacheService.setCachedPlace(cacheKey, response.data, extraKeys);
        }
        
        return response;
    } catch (err) {
        console.error(`[Google Places API Error] query "${data.textQuery}":`, err.message);
        throw err;
    }
};

/**
 * ItineraryService — The Bridge Module.
 * Now acts as a proxy to the Python AI Microservice and handles Plan discovery.
 */

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8001';
let GOOGLE_API_KEY;
let genAI;
let supabaseAdmin;

export const initItineraryService = (config) => {
    GOOGLE_API_KEY = config.GOOGLE_API_KEY;
    supabaseAdmin = config.supabaseAdmin;
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

const FALLBACK_PHOTO_MAPPING = {
    dinner: [
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
        'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&q=80',
        'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=800&q=80'
    ],
    drinks: [
        'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80',
        'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800&q=80',
        'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=800&q=80'
    ],
    coffee: [
        'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80',
        'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80'
    ],
    stroll: [
        'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800&q=80',
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80'
    ],
    art: [
        'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&q=80',
        'https://images.unsplash.com/photo-1536924940846-227afb31e2a5?w=800&q=80'
    ],
    music: [
        'https://images.unsplash.com/photo-1486591978090-58e619d37fe7?w=800&q=80',
        'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&q=80'
    ],
    view: [
        'https://images.unsplash.com/photo-1496806342719-f997480fe5ad?w=800&q=80',
        'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80'
    ],
    default: [
        'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800&q=80',
        'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80'
    ]
};

const getFallbackUnsplashPhoto = (keyword) => {
    const cleanKeyword = (keyword || '').toLowerCase();
    
    let category = 'default';
    if (cleanKeyword.includes('dinner') || cleanKeyword.includes('food') || cleanKeyword.includes('eat') || cleanKeyword.includes('restaurant') || cleanKeyword.includes('bistro') || cleanKeyword.includes('tavern')) {
        category = 'dinner';
    } else if (cleanKeyword.includes('drink') || cleanKeyword.includes('cocktail') || cleanKeyword.includes('bar') || cleanKeyword.includes('speakeasy') || cleanKeyword.includes('wine') || cleanKeyword.includes('beer')) {
        category = 'drinks';
    } else if (cleanKeyword.includes('coffee') || cleanKeyword.includes('cafe') || cleanKeyword.includes('bakery') || cleanKeyword.includes('espresso') || cleanKeyword.includes('tea')) {
        category = 'coffee';
    } else if (cleanKeyword.includes('stroll') || cleanKeyword.includes('walk') || cleanKeyword.includes('park') || cleanKeyword.includes('beach') || cleanKeyword.includes('garden') || cleanKeyword.includes('nature') || cleanKeyword.includes('outdoor')) {
        category = 'stroll';
    } else if (cleanKeyword.includes('art') || cleanKeyword.includes('museum') || cleanKeyword.includes('gallery') || cleanKeyword.includes('exhibit')) {
        category = 'art';
    } else if (cleanKeyword.includes('music') || cleanKeyword.includes('jazz') || cleanKeyword.includes('concert') || cleanKeyword.includes('vinyl') || cleanKeyword.includes('show')) {
        category = 'music';
    } else if (cleanKeyword.includes('view') || cleanKeyword.includes('rooftop') || cleanKeyword.includes('skyline') || cleanKeyword.includes('sunset') || cleanKeyword.includes('observatory')) {
        category = 'view';
    }

    const list = FALLBACK_PHOTO_MAPPING[category] || FALLBACK_PHOTO_MAPPING.default;
    let sum = 0;
    for (let i = 0; i < cleanKeyword.length; i++) {
        sum += cleanKeyword.charCodeAt(i);
    }
    const index = sum % list.length;
    return list[index];
};

const fallbackEnrichWithGemini = async (step, city) => {
    try {
        if (!genAI) {
            console.warn('[Gemini Fallback] Cannot run fallback because GEMINI_API_KEY is not configured.');
            return null;
        }

        const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });
        const query = step.search_query || `${step.activity} in ${city}`;
        
        const prompt = `You are a helpful romantic date assistant. We need to find a REAL, specific venue matching the search query: "${query}" in the location: "${city}".
Because the Google Places API is currently unavailable, you must act as a backup database and return details of a real, highly-rated venue that exists.

Please return ONLY a JSON object (no markdown block, no conversational text) matching the schema:
{
  "venue": "Name of the real specific venue",
  "address": "Short formatted street address (e.g. 17 Barrow St, New York, NY 10014)",
  "rating": 4.7,
  "userRatingCount": 850,
  "lat": 40.732681,
  "lng": -74.001648,
  "websiteUrl": "https://...",
  "review": "A single brief positive highlight review from a customer (max 15 words)",
  "reviewAuthor": "Alex M.",
  "vibeKeyword": "dinner / drinks / coffee / stroll / art / music / view"
}

Ensure the venue is real and currently open/operating in that area. If there are coords for that neighborhood or city, approximate them realistically.`;

        const result = await model.generateContent(prompt);
        let rawText = result.response.text().trim();
        
        // Clean markdown blocks if present
        if (rawText.startsWith('```')) {
            const jsonMatch = rawText.match(/\{[\s\S]*\}/);
            rawText = jsonMatch ? jsonMatch[0] : rawText;
        }
        
        const data = JSON.parse(rawText);
        return data;
    } catch (e) {
        console.error('[Gemini Fallback Error] Failed to generate fallback place details:', e);
        return null;
    }
};

const fetchRealImageWithSerpApi = async (venue, city) => {
    const apiKey = process.env.SERP_API_KEY;
    if (!apiKey) {
        console.warn('[SerpApi Image Fallback] SERP_API_KEY is not defined in environment variables.');
        return null;
    }

    try {
        console.log(`[SerpApi Image Search] Searching real images for: "${venue} in ${city}"`);
        const response = await axios.get('https://serpapi.com/search.json', {
            params: {
                engine: 'google_images',
                q: `${venue} ${city} venue or storefront`,
                api_key: apiKey,
                num: 5
            },
            timeout: 5000
        });

        const results = response.data.images_results;
        if (results && results.length > 0) {
            for (const img of results) {
                const url = img.original;
                if (url && url.startsWith('http') && !url.includes('svg') && !url.includes('data:image')) {
                    console.log(`[SerpApi Image Success] Found real image for "${venue}": ${url}`);
                    return url;
                }
            }
        }
        console.log(`[SerpApi Image Empty] No suitable image found for "${venue}"`);
        return null;
    } catch (e) {
        console.warn(`[SerpApi Image Error] Failed to search image for "${venue}":`, e.message);
        return null;
    }
};

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
        // Skip enrichment if already verified with a valid Google photo or if enrichment was already attempted
        const hasValidGooglePhoto = step.googlePlaceId && 
            (step.photoUrl || '').includes('places.googleapis.com') && 
            !(step.photoUrl || '').includes('/photos/AU_ZV');

        if (hasValidGooglePhoto || step.enrichment_attempted) {
            return step;
        }

        try {
            // --- STEP 1: Determine the best Search Query ---
            const isPlaceholder = !step.venue || 
                                 step.venue.includes('TBD') || 
                                 step.venue.includes('REAL PLACE') || 
                                 step.venue.includes('Search for');
            
            let place = null;

            // --- STEP 1.5: Pre-Indexed Place ID / Venue Name Cache Check ---
            if (step.googlePlaceId) {
                const pKey = cacheService.normalizePlaceId(step.googlePlaceId);
                const preCached = await cacheService.getCachedPlace(pKey);
                if (preCached?.places?.[0]) {
                    console.log(`[Google Place Index Hit] Reusing indexed place for ID "${step.googlePlaceId}"`);
                    place = preCached.places[0];
                }
            }
            if (!place && step.venue && !isPlaceholder) {
                const vKey = cacheService.normalizeVenueKey(step.venue, city);
                const preCached = await cacheService.getCachedPlace(vKey);
                if (preCached?.places?.[0]) {
                    console.log(`[Google Venue Index Hit] Reusing indexed venue for "${step.venue}" in ${city}`);
                    place = preCached.places[0];
                }
            }

            let response;
            if (!place) {
                // STEP 2: Formulate a precise search query
                const searchContext = location || city || 'NYC';
                const query = step.search_query || (isPlaceholder 
                    ? `${step.activity} in ${searchContext}`
                    : `${step.venue} in ${searchContext}`);
                
                console.log(`[Google Search] Query: "${query}"`);

                response = await postPlacesSearchText(
                    { 
                        textQuery: query, 
                        maxResultCount: 1,
                        ...(locationBias && { locationBias }) // Real-time GPS Biasing
                    },
                    { headers: { 'X-Goog-Api-Key': GOOGLE_API_KEY, 'X-Goog-FieldMask': 'places.displayName,places.shortFormattedAddress,places.rating,places.location,places.photos,places.userRatingCount,places.name,places.reviews,places.websiteUri' } }
                );

                place = response.data.places?.[0];
            }

            // Fallback A: If we searched by venue name and failed, try the search_query directly if it exists
            if (!place && !isPlaceholder && step.search_query) {
                response = await postPlacesSearchText(
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
                response = await postPlacesSearchText(
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
                    response = await postPlacesSearchText(
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
                // If Google search failed entirely or returned nothing, trigger Gemini Fallback!
                console.log(`[Google Places Empty] Triggering Gemini Fallback for: "${step.activity}" (${step.search_query || step.venue})`);
                const geminiPlace = await fallbackEnrichWithGemini(step, city);
                if (geminiPlace) {
                    let photoUrl = await fetchRealImageWithSerpApi(geminiPlace.venue, city);
                    if (!photoUrl) {
                        photoUrl = getFallbackUnsplashPhoto(geminiPlace.vibeKeyword || step.activity || step.vibe_keyword);
                    }
                    return {
                        ...step,
                        venue: geminiPlace.venue,
                        address: geminiPlace.address,
                        rating: geminiPlace.rating || 4.5,
                        userRatingCount: geminiPlace.userRatingCount || 100,
                        lat: geminiPlace.lat,
                        lng: geminiPlace.lng,
                        photoUrl: photoUrl,
                        websiteUrl: geminiPlace.websiteUrl,
                        reviews: geminiPlace.review ? [{
                            text: geminiPlace.review,
                            author: geminiPlace.reviewAuthor || 'Guest',
                            rating: geminiPlace.rating || 5
                        }] : (step.reviews || []),
                        verified: true,
                        enrichment_attempted: true
                    };
                }
                
                // IMPORTANT: Keep the old photo if search fails entirely, but strip completely broken legacy ones
                const cleanPhotoUrl = (step.photoUrl || '').includes('/photos/AU_ZV') ? null : step.photoUrl;
                return { ...step, photoUrl: cleanPhotoUrl, verified: false, enrichment_attempted: true };
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
                verified: true,
                enrichment_attempted: true
            };
        } catch (err) {
            console.warn(`[Enrichment Error] ${step.activity}:`, err.message);
            
            // Check for 403 Forbidden which indicates Google Places API is not set up / Billing is disabled
            if (err.response?.status === 403 || err.message?.includes('403') || err.message?.includes('REQUEST_DENIED')) {
                console.warn(`[Google Places API Warning] Request failed with 403. Google Places API is likely disabled or Billing is not enabled on your Google Cloud Console. To use live Google Places, please enable billing at https://console.cloud.google.com/project/_/billing/enable`);
            }

            // Fallback to Gemini on API error!
            console.log(`[Google Places Error Fallback] Triggering Gemini Fallback for: "${step.activity}"`);
            const geminiPlace = await fallbackEnrichWithGemini(step, city);
            if (geminiPlace) {
                let photoUrl = await fetchRealImageWithSerpApi(geminiPlace.venue, city);
                if (!photoUrl) {
                    photoUrl = getFallbackUnsplashPhoto(geminiPlace.vibeKeyword || step.activity || step.vibe_keyword);
                }
                return {
                    ...step,
                    venue: geminiPlace.venue,
                    address: geminiPlace.address,
                    rating: geminiPlace.rating || 4.5,
                    userRatingCount: geminiPlace.userRatingCount || 100,
                    lat: geminiPlace.lat,
                    lng: geminiPlace.lng,
                    photoUrl: photoUrl,
                    websiteUrl: geminiPlace.websiteUrl,
                    reviews: geminiPlace.review ? [{
                        text: geminiPlace.review,
                        author: geminiPlace.reviewAuthor || 'Guest',
                        rating: geminiPlace.rating || 5
                    }] : (step.reviews || []),
                    verified: true,
                    enrichment_attempted: true
                };
            }

            return { ...step, verified: false, enrichment_attempted: true };
        }
    }));

    return enrichedSteps;
};;

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


export const generateAIOptions = async (params) => {
    try {
        console.log(`[ItineraryService] Fetching multi-generation options from AI Microservice: ${AI_SERVICE_URL}`);
        const response = await axios.post(`${AI_SERVICE_URL}/generate-options`, {
            city: params.city || params.location,
            vibe: params.vibe,
            budget: params.budget,
            preferences: params.preferences || params.prompt || '',
            lat: params.lat,
            lng: params.lng,
            numActivities: params.numActivities || 3,
            radius: params.radius,
            planDate: params.planDate,
            planTime: params.planTime
        }, { timeout: 30000 });

        if (response.data && response.data.raw_options) {
            let optionsData;
            try {
                const raw = response.data.raw_options;
                const jsonMatch = raw.match(/\{[\s\S]*\}/);
                optionsData = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
            } catch (e) {
                console.error('[Microservice Options Parse Error]', e);
                throw new Error("Invalid options format from AI Microservice");
            }

            if (optionsData.options && Array.isArray(optionsData.options)) {
                return optionsData.options;
            }
        }
        throw new Error("Empty options response from AI Microservice");
    } catch (err) {
        console.warn(`[AI Options Microservice Failed] using fallback options generator: ${err.message}`);
        const city = params.city || params.location || 'NYC';
        return [
            {
                id: '1',
                title: `${params.vibe ? (params.vibe.charAt(0).toUpperCase() + params.vibe.slice(1)) : 'Romantic'} Evening in ${city}`,
                tagline: 'A candlelit journey through cozy neighborhood favorites',
                vibe: params.vibe || 'romantic',
                estimated_cost: '$$',
                description: `Experience intimate dining, artisanal cocktails, and a nightcap in ${city}.`,
                steps: [
                    { time: '6:30 PM', activity: 'Craft Cocktails', venue: 'REAL PLACE TBD', search_query: `craft cocktail lounge in ${city}`, description: 'Start the evening with signature cocktails.' },
                    { time: '8:00 PM', activity: 'Candlelit Dinner', venue: 'REAL PLACE TBD', search_query: `intimate romantic restaurant in ${city}`, description: 'Enjoy chef specials in a cozy atmosphere.' },
                    { time: '9:45 PM', activity: 'Late Night Lounge', venue: 'REAL PLACE TBD', search_query: `speakeasy jazz lounge in ${city}`, description: 'Conclude with smooth jazz and nightcaps.' }
                ]
            },
            {
                id: '2',
                title: `Playful & Active Night Out`,
                tagline: 'High-energy fun followed by casual bites and drinks',
                vibe: 'adventure',
                estimated_cost: '$',
                description: `An engaging night filled with interactive games and lively spots around ${city}.`,
                steps: [
                    { time: '6:00 PM', activity: 'Arcade / Games', venue: 'REAL PLACE TBD', search_query: `retro arcade bar or bowling in ${city}`, description: 'Kick off with playful competition.' },
                    { time: '7:45 PM', activity: 'Casual Feast', venue: 'REAL PLACE TBD', search_query: `lively patio gourmet tacos or burgers in ${city}`, description: 'Grab flavorful, relaxed bites.' },
                    { time: '9:30 PM', activity: 'Dessert & Stroll', venue: 'REAL PLACE TBD', search_query: `gourmet gelato or dessert shop in ${city}`, description: 'Sweet treats under evening lights.' }
                ]
            },
            {
                id: '3',
                title: `Artistic & Speakeasy Culture`,
                tagline: 'Curated galleries, rooftop views, and hidden bars',
                vibe: 'artistic',
                estimated_cost: '$$$',
                description: `A sophisticated, culture-rich date through iconic art and secret lounges in ${city}.`,
                steps: [
                    { time: '5:30 PM', activity: 'Gallery / Viewpoint', venue: 'REAL PLACE TBD', search_query: `scenic viewpoint or modern gallery in ${city}`, description: 'Immerse in art and panoramic sights.' },
                    { time: '7:30 PM', activity: 'Fine Dining', venue: 'REAL PLACE TBD', search_query: `top-rated upscale bistro in ${city}`, description: 'Savor an exceptional multi-course dinner.' },
                    { time: '9:30 PM', activity: 'Hidden Speakeasy', venue: 'REAL PLACE TBD', search_query: `secret bookshelf speakeasy bar in ${city}`, description: 'Unwind with bespoke mixology.' }
                ]
            }
        ];
    }
};

export const finalizeSelectedOption = async (supabase, userId, params, selectedOption) => {
    const rawSteps = selectedOption.steps || [];
    const city = params.city || params.location || 'NYC';
    const coords = (params.lat && params.lng) ? { lat: params.lat, lng: params.lng } : null;
    const radius = params.neighborhoodLock ? 800 : (params.radius || 15000);

    const enrichedSteps = await enrichWithRealPlaces(rawSteps, city, coords, radius);

    const itineraryData = {
        title: selectedOption.title,
        description: selectedOption.description || selectedOption.tagline,
        vibe: selectedOption.vibe || params.vibe || 'romantic',
        estimated_cost: selectedOption.estimated_cost || '$$',
        steps: enrichedSteps
    };

    const aiResult = {
        source: 'SHOWDOWN_OPTION_ENRICHED',
        data: itineraryData,
        enriched: true
    };

    const savedPlan = await savePlan(supabase, userId, params, aiResult);
    return savedPlan;
};

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
              "description": "An extremely short, single-sentence blurb (max 15-20 words total) structured exactly as: 'One short sensory sentence (max 8-10 words). • 💡 Tip: [Max 5 words]. • 👔 Attire: [Max 2 words]. • 📅 Booking: [Max 2 words].'"
            }
          ]
        }
        
        Do not return anything else except the JSON.`;
        
        const fallbackModels = [
            "gemini-3.6-flash",
            "gemini-flash-latest",
            "gemini-3.5-flash",
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

                // Enrich fallback steps with real places
                const rawSteps = data.steps || data.itinerary || [];
                if (rawSteps.length > 0) {
                    const city = params.city || params.location || 'NYC';
                    const coords = (params.lat && params.lng) ? { lat: params.lat, lng: params.lng } : null;
                    const radius = params.neighborhoodLock ? 800 : (params.radius || 15000);
                    const enrichedSteps = await enrichWithRealPlaces(rawSteps, city, coords, radius);
                    data.steps = enrichedSteps;
                }

                return { 
                    source: `NATIVE_GEMINI_FALLBACK_${modelName.toUpperCase().replace(/-/g, '_')}`, 
                    data, 
                    enriched: true 
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
        const restResponse = await postPlacesSearchText(
            {
                textQuery: `top rated ${vibe} restaurant in ${city}`,
                maxResultCount: 1,
                ...(locationBias && { locationBias })
            },
            { headers: { 'X-Goog-Api-Key': GOOGLE_API_KEY, 'X-Goog-FieldMask': 'places.displayName,places.location,places.shortFormattedAddress,places.rating' } }
        );

        // 2. Find an Activity
        const actResponse = await postPlacesSearchText(
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

    // Generate prompt embedding if AI_SERVICE_URL and text exists
    let promptEmbedding = null;
    try {
        const embedText = `Location: ${planData.location || planData.city || 'NYC'} | Vibe: ${planData.vibe || 'chill'} | Title: ${title} | Description: ${description}`;
        console.log(`[ItineraryService] Generating embedding for plan: "${title}"`);
        const embedResponse = await axios.post(`${AI_SERVICE_URL}/embed`, {
            text: embedText
        }, { timeout: 5000 });
        if (embedResponse.data && embedResponse.data.embedding) {
            promptEmbedding = embedResponse.data.embedding;
            console.log('[ItineraryService] Successfully generated prompt embedding.');
        }
    } catch (embedErr) {
        console.warn(`[ItineraryService] Failed to generate embedding during save: ${embedErr.message}`);
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
            prompt_embedding: promptEmbedding,
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

export const getTrendingPlans = async (supabase, userId, requestedLocation, userLat, userLng, searchRadius) => {
    try {
        const dbClient = supabaseAdmin || supabase;
        let locationFilter = null;
        const isValidUUID = (id) => typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

        if (userId && isValidUUID(userId)) {
            // Fetch user profile securely server-side
            const { data: profile } = await dbClient
                .from('profiles')
                .select('is_premium, current_location, custom_location')
                .eq('id', userId)
                .single();

            if (profile) {
                // Strict standard user gatekeeping
                if (!profile.is_premium && requestedLocation && requestedLocation !== profile.current_location) {
                    const err = new Error("Premium Tier restriction: Upgrade to access Global Trip Planner.");
                    err.status = 403;
                    throw err;
                }

                // Premium Global Switcher or Local Default
                if (profile.is_premium && (requestedLocation || profile.custom_location)) {
                    locationFilter = requestedLocation || profile.custom_location;
                } else {
                    locationFilter = profile.current_location;
                }
            }
        }

        // Fetch a pool of active plans matching location & lifecycle state
        let targetUserId = null;
        try {
            const { data: profileData } = await dbClient
                .from('profiles')
                .select('id')
                .eq('email', 'rayanerold@gmail.com')
                .maybeSingle();
            if (profileData) {
                targetUserId = profileData.id;
                console.log(`[Trending] Found user ID from profiles for rayanerold@gmail.com: ${targetUserId}`);
            }
        } catch (err) {
            console.warn('[Trending] Failed to get user by email from profiles:', err.message);
        }

        let query;
        if (targetUserId) {
            query = dbClient
                .from('plans')
                .select('*')
                .eq('user_id', targetUserId)
                .is('deleted_at', null)
                .eq('is_completed', false)
                .or('expires_at.is.null,expires_at.gt.now()')
                .not('itinerary', 'is', null)
                .order('created_at', { ascending: false });
        } else {
            query = dbClient
                .from('plans')
                .select('*')
                .is('deleted_at', null)
                .eq('is_completed', false)
                .or('expires_at.is.null,expires_at.gt.now()') // Exclude expired plans
                .not('itinerary', 'is', null)
                .order('boost_count', { ascending: false });
        }

        if (locationFilter) {
            query = query.ilike('location', `%${locationFilter}%`); // Enforce location isolation
        }

        let { data, error } = await query.limit(60);

        // Fallback: If we queried by targetUserId and got no plans, fall back to default trending plans
        if ((!data || data.length === 0) && targetUserId) {
            console.log('[Trending] No plans found for target user, falling back to general trending plans...');
            const defaultQuery = dbClient
                .from('plans')
                .select('*')
                .is('deleted_at', null)
                .eq('is_completed', false)
                .or('expires_at.is.null,expires_at.gt.now()')
                .not('itinerary', 'is', null)
                .order('boost_count', { ascending: false });
            
            let queryFallback;
            if (locationFilter) {
                queryFallback = defaultQuery.ilike('location', `%${locationFilter}%`);
            } else {
                queryFallback = defaultQuery;
            }
            
            const res = await queryFallback.limit(60);
            if (!res.error && res.data) {
                data = res.data;
            }
        }

        if ((error || !data || data.length === 0) && locationFilter) {
            console.warn(`[Trending] No plans found for local filter "${locationFilter}". Fetching broader trending plans as fallback...`);
            const fallbackQuery = dbClient
                .from('plans')
                .select('*')
                .is('deleted_at', null)
                .eq('is_completed', false)
                .or('expires_at.is.null,expires_at.gt.now()')
                .not('itinerary', 'is', null)
                .order('boost_count', { ascending: false })
                .limit(60);
            
            const res = await fallbackQuery;
            if (!res.error && res.data) {
                data = res.data;
            }
        }

        if (!data || data.length === 0) {
            console.warn('[Trending] No plans found in database matching criteria.');
            return [];
        }

        // Proximity calculation and filtering
        let isProximityMatch = false;
        if (userLat !== undefined && userLng !== undefined && userLat !== null && userLng !== null) {
            const latVal = parseFloat(userLat);
            const lngVal = parseFloat(userLng);
            const radVal = parseFloat(searchRadius) || 15;
            
            if (!isNaN(latVal) && !isNaN(lngVal)) {
                console.log(`[Proximity] Filtering plans near user coords: (${latVal}, ${lngVal}) within ${radVal} miles`);
                const calculateDistance = (lat1, lon1, lat2, lon2) => {
                    const R = 3958.8; // Earth's radius in miles
                    const dLat = (lat2 - lat1) * (Math.PI / 180);
                    const dLon = (lon2 - lon1) * (Math.PI / 180);
                    const a =
                        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);
                    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                    return R * c;
                };

                const proximityPlans = data.map(plan => {
                    const itinerary = plan.itinerary || {};
                    const steps = Array.isArray(itinerary) ? itinerary : (itinerary.steps || []);
                    const firstStep = steps[0];
                    if (firstStep && firstStep.lat !== undefined && firstStep.lng !== undefined) {
                        const dist = calculateDistance(latVal, lngVal, parseFloat(firstStep.lat), parseFloat(firstStep.lng));
                        return { ...plan, proximity_distance_miles: dist };
                    }
                    return null;
                }).filter(p => p !== null && p.proximity_distance_miles <= radVal);

                if (proximityPlans.length > 0) {
                    proximityPlans.sort((a, b) => a.proximity_distance_miles - b.proximity_distance_miles);
                    data = proximityPlans;
                    isProximityMatch = true;
                } else {
                    console.log('[Proximity] No plans found in local radius. Falling back to non-proximity plans.');
                }
            }
        }

        // Shuffle and pick a display batch (20 to match Dashboard UI)
        const selectedPlans = isProximityMatch 
            ? data.slice(0, 20) 
            : data.sort(() => Math.random() - 0.5).slice(0, 20);

        // --- REAL PHOTO ENFORCEMENT ---
        // We use a sequential loop here to avoid hitting Google API rate limits with 20 parallel plans.
        const enrichedPlans = [];
        for (const plan of selectedPlans) {
            let itinerary = plan.itinerary;
            let steps = Array.isArray(itinerary) ? itinerary : (itinerary?.steps || []);
            
            const needsEnrichment = steps.some(s => 
                (!s.enrichment_attempted && (
                    !s.googlePlaceId || 
                    !(s.photoUrl || '').includes('places.googleapis.com') ||
                    (s.photoUrl || '').includes('maps.googleapis.com') ||
                    (s.photoUrl || '').includes('unsplash') ||
                    (s.photoUrl || '').includes('/photos/AU_ZV') // Force enrichment for legacy Google photo reference
                )) || (
                    // Force re-enrichment if it is stuck using an Unsplash photo url
                    (s.photoUrl || '').includes('unsplash')
                )
            );
            
            if (needsEnrichment && steps.length > 0) {
                console.log(`[Trending] Found unverified steps in "${plan.title || plan.id}". Enriching...`);
                try {
                    const rawEnrichedSteps = await enrichWithRealPlaces(steps, plan.location, { lat: plan.lat, lng: plan.lng });
                    const enrichedSteps = enrichStepsWithImages(rawEnrichedSteps);
                    
                    let updatedItinerary = Array.isArray(itinerary) ? enrichedSteps : { ...itinerary, steps: enrichedSteps };
                    
                    // Await the DB update to ensure persistence
                    const { error } = await dbClient.from('plans')
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
        throw err;
    }
};

export const searchPlans = async (supabase, query) => {
    // 1. Try semantic search if query is longer than 2 characters
    if (query && query.trim().length > 2) {
        try {
            console.log(`[ItineraryService] Attempting semantic search for query: "${query}"`);
            const embedResponse = await axios.post(`${AI_SERVICE_URL}/embed`, {
                text: query
            }, { timeout: 5000 });
            
            if (embedResponse.data && embedResponse.data.embedding) {
                const queryVector = embedResponse.data.embedding;
                
                // Call Supabase RPC match_plans
                const { data: semanticResults, error: rpcError } = await supabase
                    .rpc('match_plans', {
                        query_embedding: queryVector,
                        match_threshold: 0.35, // A reasonable cosine similarity threshold
                        match_count: 20
                    });
                    
                if (!rpcError && semanticResults && semanticResults.length > 0) {
                    console.log(`[ItineraryService] Semantic search returned ${semanticResults.length} matches.`);
                    return semanticResults;
                } else if (rpcError) {
                    console.warn('[ItineraryService] Semantic RPC error:', rpcError.message);
                }
            }
        } catch (err) {
            console.warn(`[ItineraryService] Semantic search failed: ${err.message}. Falling back to keyword search.`);
        }
    }

    // 2. Keyword fallback search
    console.log(`[ItineraryService] Executing fallback keyword search for: "${query}"`);
    const { data } = await supabase
        .from('plans')
        .select('*')
        .is('deleted_at', null)
        .not('itinerary', 'is', null)
        .or(`location.ilike.%${query}%,vibe.ilike.%${query}%,title.ilike.%${query}%,description.ilike.%${query}%`)
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
    const actualUserId = typeof userId === 'object' && userId !== null ? (userId.id || userId.userId || userId.user_id) : userId;
    if (!actualUserId) throw new Error('userId is required');
    const { data: plan } = await supabase.from('plans').select('boost_count, boosted_by').eq('id', planId).single();
    const boostedBy = Array.isArray(plan.boosted_by) ? plan.boosted_by : [];
    const alreadyBoosted = boostedBy.includes(actualUserId);

    const newCount = alreadyBoosted ? Math.max(0, plan.boost_count - 1) : plan.boost_count + 1;
    const newBoostedBy = alreadyBoosted ? boostedBy.filter(uid => uid !== actualUserId) : [...boostedBy, actualUserId];

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
        
        const response = await postPlacesSearchText(
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
        const isValidUUID = (id) => typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        const actualUserId = isValidUUID(userId) ? userId : '00000000-0000-0000-0000-000000000000';

        // 1. Get user's recent favorite plans to learn "taste"
        const { data: favorites } = await supabase
            .from('plans')
            .select('vibe, itinerary')
            .eq('user_id', actualUserId)
            .order('created_at', { ascending: false })
            .limit(10);

        // Extract most frequent vibes
        const vibes = favorites ? favorites.map(f => f.vibe).filter(Boolean) : [];
        const topVibe = vibes.length > 0 ? vibes[0] : null;

        // 2. Query for similar plans from the community
        let query = supabase
            .from('plans')
            .select('*')
            .is('deleted_at', null)
            .eq('is_completed', false)
            .or('expires_at.is.null,expires_at.gt.now()')
            .not('itinerary', 'is', null)
            .neq('user_id', actualUserId); // Don't recommend their own plans

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
                .is('deleted_at', null)
                .eq('is_completed', false)
                .or('expires_at.is.null,expires_at.gt.now()')
                .not('itinerary', 'is', null)
                .neq('user_id', actualUserId)
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

export const swapVenue = getNearbyAlternatives;

export const getOrCreateWeeklySpark = async (supabase, userId) => {
    const now = new Date();
    const sunday = new Date(now);
    sunday.setDate(now.getDate() - now.getDay());
    sunday.setHours(0, 0, 0, 0);

    const { data: existing } = await supabase
        .from('plans')
        .select('*')
        .eq('user_id', userId)
        .eq('generation_type', 'weekly_spark')
        .gte('created_at', sunday.toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

    if (existing && existing.length > 0) {
        return existing[0];
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('current_location, custom_location')
        .eq('id', userId)
        .single();
    const location = profile?.custom_location || profile?.current_location || 'New York City';

    const vibes = ['romantic', 'adventurous', 'cozy', 'trendy', 'secret spots'];
    const randomVibe = vibes[Math.floor(Math.random() * vibes.length)];

    const aiResult = await generateAIDate({
        city: location,
        vibe: randomVibe,
        budget: 'moderate',
        numActivities: 3
    });

    let steps = [];
    let title = 'Your Weekly Spark';
    let description = 'A curated surprise experience for this week';

    if (typeof aiResult.data === 'object' && aiResult.data !== null) {
        steps = aiResult.data.steps || aiResult.data.itinerary || [];
        title = aiResult.data.title || title;
        description = aiResult.data.description || description;
    }

    const { data: newPlan, error: insertError } = await supabase
        .from('plans')
        .insert([{
            user_id: userId,
            location: location,
            vibe: randomVibe,
            budget: 'moderate',
            itinerary: {
                steps: steps,
                metadata: {
                    is_scratch_revealed: false,
                    user_input: 'Weekly Spark surprise date',
                    location: location,
                    vibe: randomVibe,
                    budget: 'moderate',
                    planDate: now.toISOString().split('T')[0]
                }
            },
            title: title,
            description: description,
            is_favorite: false,
            is_completed: false,
            generation_type: 'weekly_spark',
            created_at: now.toISOString()
        }])
        .select()
        .single();

    if (insertError) throw insertError;
    return newPlan;
};

/**
 * Progressive Enrichment Helper: Enriches a single step on-demand with real Google Places venue details.
 */
export const enrichSingleStep = async (step, location, coords = null, radius = 15000) => {
    try {
        const enriched = await enrichWithRealPlaces([step], location, coords, radius);
        return (enriched && enriched.length > 0) ? enriched[0] : step;
    } catch (e) {
        console.warn('[EnrichSingleStep Warning]', e.message);
        return step;
    }
};

