import axios from 'axios';

/**
 * EventService — Handles high-traffic external event discovery.
 * Decoupled to prevent Ticketmaster rate limits or outages from affecting the core app.
 */

const CATEGORY_SEGMENT_MAP = {
    'music': 'Music',
    'arts': 'Arts & Theatre',
    'sports': 'Sports',
    'film': 'Film',
    'theater': 'Arts & Theatre',
    'comedy': 'Arts & Theatre',
    'family': 'Family',
    'classes': 'Classes',
    'tech': 'Technology',
    'community': 'Community'
};

const SEATGEEK_TAXONOMY_MAP = {
    'music': 'concert',
    'sports': 'sports',
    'theater': 'theater',
    'comedy': 'comedy',
    'all': 'event'
};

export const fetchSerpEvents = async (city, category, size = 15, apiKey) => {
    if (!apiKey) return [];
    
    // Map our category to a friendly search term for Google Events
    const queryMap = {
        'classes': 'classes workshops',
        'tech': 'tech networking events',
        'community': 'community meetups',
        'music': 'live music concerts',
        'theater': 'theater shows',
        'comedy': 'comedy shows',
        'all': 'events'
    };
    
    const searchTerm = queryMap[category.toLowerCase()] || category;
    const cleanKey = apiKey.trim();

    try {
        const res = await axios.get('https://serpapi.com/search.json', {
            params: {
                engine: 'google_events',
                q: `${searchTerm} in ${city}`,
                api_key: cleanKey
            },
            timeout: 8000
        });
        const raw = res.data?.events_results || [];
        console.log(`[SerpApi] Found ${raw.length} events for search.`);
        
        return raw.slice(0, size).map((evt, i) => ({
            id: `serp-${evt.title?.substring(0,3)}-${i}`,
            source: 'Local',
            name: evt.title,
            url: evt.link,
            date: evt.date?.start_date,
            time: evt.date?.when,
            venueName: evt.venue?.name,
            address: Array.isArray(evt.address) ? evt.address.join(', ') : evt.address,
            image: evt.thumbnail || evt.image,
            segment: evt.venue?.name ? 'Community' : 'Activity',
            genre: category.charAt(0).toUpperCase() + category.slice(1),
            priceMin: null,
            currency: 'USD',
            status: 'active'
        }));
    } catch (err) {
        console.warn('[SerpApi Error]', err.message);
        return [];
    }
};

export const fetchEvents = async (supabase, city, category, size = 15, keys = {}) => {
    const { ticketmaster, serpapi, seatgeek } = keys;
    const cat = category.toLowerCase();
    
    // 1. CHECK CACHE FIRST
    try {
        const { data: cached, error: cacheError } = await supabase
            .from('event_cache')
            .select('data')
            .eq('city', city)
            .eq('category', cat)
            .gt('expires_at', new Date().toISOString())
            .maybeSingle();

        if (cached?.data && cached.data.length > 0) {
            console.log(`[EventCache] ✅ Cache HIT for "${cat}" in ${city}`);
            return cached.data;
        }
    } catch (err) {
        console.warn('[EventCache] ⚠️ Read Error:', err.message);
    }

    console.log(`[EventCache] ❌ Cache MISS for "${cat}" in ${city}. Fetching fresh...`);

    // 2. Determine if this is a "Local-Heavy" category that REQUIRED SerpApi
    const isLocalCategory = ['classes', 'tech', 'community'].includes(cat);
    
    // 3. Fetch from standard sources (TM & SG)
    const [tmEvents, sgEvents] = await Promise.all([
        ticketmaster ? fetchTicketmasterEvents(city, category, size, ticketmaster) : Promise.resolve([]),
        seatgeek ? fetchSeatGeekEvents(city, category, size, seatgeek) : Promise.resolve([])
    ]);

    // 4. Only trigger SerpApi if:
    //    - It's a local category (classes/tech/groups)
    //    - OR Ticketmaster + SeatGeek returned very few results (< 5)
    let serpEvents = [];
    if (serpapi && (isLocalCategory || (tmEvents.length + sgEvents.length < 5))) {
        console.log(`[EventService] 🔍 Triggering SerpApi search for "${cat}" in ${city} (Quota Protection Active)`);
        serpEvents = await fetchSerpEvents(city, category, size, serpapi);
    }

    // Merge and shuffle
    const all = [...tmEvents, ...sgEvents, ...serpEvents].sort(() => Math.random() - 0.5);

    // 5. ASYNC CACHE SAVE
    if (all.length > 0) {
        supabase.from('event_cache').upsert({
            city,
            category: cat,
            data: all,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        }, { onConflict: 'city,category' }).then(({ error }) => {
            if (error) console.error(`[EventCache] ❌ Save Error for "${cat}" in ${city}:`, error.message);
            else console.log(`[EventCache] 💾 Cached ${all.length} events for "${cat}" in ${city}`);
        });
    } else {
        console.warn(`[EventService] ⚠️ No events found for "${cat}" in ${city} across all sources.`);
    }

    return all;
};

export const fetchSeatGeekEvents = async (city, category, size = 15, clientId) => {
    if (!clientId) return [];
    
    const taxonomy = SEATGEEK_TAXONOMY_MAP[category.toLowerCase()] || 'event';
    const url = `https://api.seatgeek.com/2/events?client_id=${clientId}&venue.city=${encodeURIComponent(city)}&taxonomies.name=${taxonomy}&per_page=${size}&sort=datetime_local.asc`;

    try {
        const res = await axios.get(url, { timeout: 8000 });
        const raw = res.data?.events || [];
        
        return raw.map(evt => ({
            id: `sg-${evt.id}`,
            source: 'SeatGeek',
            name: evt.short_title || evt.title,
            url: evt.url,
            date: evt.datetime_local?.split('T')[0],
            time: evt.datetime_local?.split('T')[1],
            venueName: evt.venue?.name,
            address: evt.venue?.address,
            image: evt.performers?.[0]?.image,
            segment: evt.type?.toUpperCase(),
            genre: category.charAt(0).toUpperCase() + category.slice(1),
            priceMin: evt.stats?.lowest_price,
            priceMax: evt.stats?.highest_price,
            currency: 'USD',
            status: 'active'
        }));
    } catch (err) {
        console.warn('[SeatGeek Error]', err.message);
        return [];
    }
};

const fetchTicketmasterEvents = async (city, category, size, apiKey) => {
    const segmentName = CATEGORY_SEGMENT_MAP[category.toLowerCase()];
    // Skip TM if it's a very local category they don't cover well
    if (['classes', 'tech', 'community'].includes(category.toLowerCase())) return [];

    const url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${apiKey}&city=${encodeURIComponent(city)}&size=${size}&sort=date,asc${segmentName ? `&segmentName=${encodeURIComponent(segmentName)}` : ''}`;

    try {
        const res = await axios.get(url, { timeout: 8000 });
        const raw = res.data?._embedded?.events || [];
        return raw.map(evt => ({
            id: `tm-${evt.id}`,
            source: 'Ticketmaster',
            name: evt.name,
            url: evt.url,
            date: evt.dates?.start?.localDate,
            time: evt.dates?.start?.localTime,
            venueName: evt._embedded?.venues?.[0]?.name,
            address: evt._embedded?.venues?.[0]?.address?.line1,
            image: evt.images?.sort((a, b) => b.width - a.width)?.[0]?.url,
            segment: evt.classifications?.[0]?.segment?.name,
            genre: evt.classifications?.[0]?.genre?.name,
            priceMin: evt.priceRanges?.[0]?.min,
            priceMax: evt.priceRanges?.[0]?.max,
            currency: evt.priceRanges?.[0]?.currency || 'USD',
            status: evt.dates?.status?.code
        }));
    } catch (err) {
        console.warn('[Ticketmaster Error]', err.message);
        return [];
    }
};
