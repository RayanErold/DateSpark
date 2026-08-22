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
    'community': 'Community'
};

const SEATGEEK_TAXONOMY_MAP = {
    'music': 'concert',
    'sports': 'sports',
    'theater': 'theater',
    'comedy': 'comedy',
    'family': 'family',
    'food': 'festival',
    'festivals': 'festival',
    'all': 'event'
};

function mapInternalCategoryToAPI(internalCategory, userKeyword) {
  const mappings = {
    tech: {
      ticketmasterId: 'KZFzniwnSyZfZ7v7na', // Miscellaneous/Seminars code
      fallbackKeyword: userKeyword || 'technology',
      serpQueryModifier: userKeyword || 'technology conferences'
    },
    music: {
      ticketmasterId: 'KZFzniwnSyZfZ7v7jM',
      fallbackKeyword: userKeyword || 'concert',
      serpQueryModifier: userKeyword || 'live music concerts'
    }
  };
  return mappings[internalCategory?.toLowerCase()] || {
    ticketmasterId: '',
    fallbackKeyword: userKeyword,
    serpQueryModifier: userKeyword || internalCategory
  };
}

const parseUnstructuredDate = (dateStr) => {
    if (!dateStr) return null;
    const cleanStr = dateStr.trim().toLowerCase();
    
    if (cleanStr.includes('today')) {
        return new Date().toISOString().split('T')[0];
    }
    if (cleanStr.includes('tomorrow')) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    }

    // Try parsing months
    const months = {
        jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
        jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
    };

    // Try Day Month first (e.g. "10 Jul")
    const dayMonthRegex = /\b(\d{1,2})\b\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*/i;
    const matchDM = cleanStr.match(dayMonthRegex);
    if (matchDM) {
        const dayStr = matchDM[1].padStart(2, '0');
        const monthAbbr = matchDM[2].toLowerCase().substring(0, 3);
        const monthStr = months[monthAbbr];
        if (monthStr) {
            const currentYear = new Date().getFullYear();
            let parsedDate = new Date(`${currentYear}-${monthStr}-${dayStr}`);
            
            const yearMatch = cleanStr.match(/\b(20\d{2})\b/);
            if (yearMatch) {
                parsedDate = new Date(`${yearMatch[1]}-${monthStr}-${dayStr}`);
            } else {
                const now = new Date();
                now.setHours(0,0,0,0);
                if (parsedDate < now && (now - parsedDate) > 30 * 24 * 60 * 60 * 1000) {
                    parsedDate.setFullYear(currentYear + 1);
                }
            }
            if (!isNaN(parsedDate.getTime())) {
                return parsedDate.toISOString().split('T')[0];
            }
        }
    }

    // Try Month Day (e.g. "Jul 10")
    const monthRegex = /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\b(\d{1,2})\b/i;
    const match = cleanStr.match(monthRegex);
    if (match) {
        const monthAbbr = match[1].toLowerCase().substring(0, 3);
        const dayStr = match[2].padStart(2, '0');
        const monthStr = months[monthAbbr];
        if (monthStr) {
            const currentYear = new Date().getFullYear();
            let parsedDate = new Date(`${currentYear}-${monthStr}-${dayStr}`);
            
            const yearMatch = cleanStr.match(/\b(20\d{2})\b/);
            if (yearMatch) {
                parsedDate = new Date(`${yearMatch[1]}-${monthStr}-${dayStr}`);
            } else {
                const now = new Date();
                now.setHours(0,0,0,0);
                if (parsedDate < now && (now - parsedDate) > 30 * 24 * 60 * 60 * 1000) {
                    parsedDate.setFullYear(currentYear + 1);
                }
            }
            if (!isNaN(parsedDate.getTime())) {
                return parsedDate.toISOString().split('T')[0];
            }
        }
    }

    // Try standard JS Date parsing
    try {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
            return d.toISOString().split('T')[0];
        }
    } catch (e) {
        // Ignore
    }

    return null;
};

const parseUnstructuredDateTime = (dateStr) => {
    if (!dateStr) return { date: 'Date TBD', time: null };
    
    const parsedDate = parseUnstructuredDate(dateStr);
    
    // Search for patterns like "7:30 PM", "7 PM", "14:30"
    let parsedTime = null;
    const timeRegex = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i;
    const match = dateStr.match(timeRegex);
    if (match) {
        let hours = parseInt(match[1], 10);
        const minutes = match[2] ? parseInt(match[2], 10) : 0;
        const ampm = match[3].toLowerCase();
        
        if (ampm === 'pm' && hours < 12) hours += 12;
        if (ampm === 'am' && hours === 12) hours = 0;
        
        parsedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
    }
    
    return {
        date: parsedDate || dateStr,
        time: parsedTime
    };
};

const classifySerpEvent = (title, category) => {
    const t = (title || '').toLowerCase();
    
    if (t.includes('class') || t.includes('workshop') || t.includes('learn') || t.includes('course') || t.includes('training') || t.includes('seminar') || t.includes('craft')) {
        return { segment: 'Activity', genre: 'Classes' };
    }
    if (t.includes('tech') || t.includes('software') || t.includes('developer') || t.includes('coding') || t.includes('cyber') || t.includes('science') || t.includes('data science') || t.includes('ai') || t.includes('networking')) {
        return { segment: 'Activity', genre: 'Tech' };
    }
    if (t.includes('community') || t.includes('meetup') || t.includes('social') || t.includes('gathering') || t.includes('club') || t.includes('volunteer')) {
        return { segment: 'Community', genre: 'Community' };
    }
    if (t.includes('concert') || t.includes('music') || t.includes('band') || t.includes('singer') || t.includes('song') || t.includes('jazz') || t.includes('rock') || t.includes('symphony') || t.includes('festival') && t.includes('music')) {
        return { segment: 'Music', genre: 'Music' };
    }
    if (t.includes('comedy') || t.includes('standup') || t.includes('improv') || t.includes('laugh')) {
        return { segment: 'Arts & Theatre', genre: 'Comedy' };
    }
    if (t.includes('theater') || t.includes('broadway') || t.includes('play') || t.includes('musical') || t.includes('opera') || t.includes('art') || t.includes('museum') || t.includes('exhibition') || t.includes('gallery')) {
        return { segment: 'Arts & Theatre', genre: 'Theater' };
    }
    if (t.includes('hike') || t.includes('hiking') || t.includes('outdoor') || t.includes('nature') || t.includes('trail') || t.includes('park') || t.includes('camping')) {
        return { segment: 'Outdoors', genre: 'Outdoors' };
    }
    if (t.includes('food') || t.includes('drink') || t.includes('wine') || t.includes('beer') || t.includes('culinary') || t.includes('taste') || t.includes('dining') || t.includes('brunch') || t.includes('cocktail')) {
        return { segment: 'Food', genre: 'Food & Drink' };
    }
    if (t.includes('festival') || t.includes('fair') || t.includes('expo') || t.includes('exhibition') || t.includes('carnival') || t.includes('bazaar')) {
        return { segment: 'Festivals', genre: 'Festivals' };
    }
    if (t.includes('game') || t.includes('arcade') || t.includes('bowling') || t.includes('trivia') || t.includes('board game') || t.includes('gaming')) {
        return { segment: 'Activity', genre: 'Activities' };
    }
    if (t.includes('family') || t.includes('kids') || t.includes('children') || t.includes('zoo')) {
        return { segment: 'Family', genre: 'Family' };
    }
    
    const cat = category.toLowerCase();
    if (cat !== 'all') {
        const titleCat = category.charAt(0).toUpperCase() + category.slice(1);
        let genreName = titleCat;
        if (cat === 'community') genreName = 'Community';
        if (cat === 'activities') genreName = 'Activities';
        if (cat === 'outdoors') genreName = 'Outdoors';
        if (cat === 'food') genreName = 'Food & Drink';
        if (cat === 'festivals') genreName = 'Festivals';
        
        let segmentName = titleCat;
        if (cat === 'classes' || cat === 'tech' || cat === 'activities') segmentName = 'Activity';
        if (cat === 'outdoors') segmentName = 'Outdoors';
        if (cat === 'food') segmentName = 'Food';
        if (cat === 'festivals') segmentName = 'Festivals';
        if (cat === 'community') segmentName = 'Community';
        
        return { segment: segmentName, genre: genreName };
    }
    
    return { segment: 'Activity', genre: 'Activity' };
};

const mapSeatGeekTypeToClassification = (type, category) => {
    const t = (type || '').toLowerCase();
    
    if (t.includes('concert') || t.includes('music') || t.includes('showcase') || t.includes('band')) {
        return { segment: 'Music', genre: 'Music' };
    }
    if (t.includes('comedy')) {
        return { segment: 'Arts & Theatre', genre: 'Comedy' };
    }
    if (t.includes('theater') || t.includes('broadway') || t.includes('dance') || t.includes('play') || t.includes('opera') || t.includes('musical')) {
        return { segment: 'Arts & Theatre', genre: 'Theater' };
    }
    if (t.includes('sport') || t.includes('game') || t.includes('nba') || t.includes('nfl') || t.includes('mlb') || t.includes('nhl') || t.includes('soccer') || t.includes('fight') || t.includes('wrestling') || t.includes('racing') || t.includes('rodeo')) {
        return { segment: 'Sports', genre: 'Sports' };
    }
    if (t.includes('festival') || t.includes('expo') || t.includes('fair') || t.includes('parade')) {
        return { segment: 'Festivals', genre: 'Festivals' };
    }
    if (t.includes('family') || t.includes('kids')) {
        return { segment: 'Family', genre: 'Family' };
    }
    
    const cat = category.toLowerCase();
    if (cat !== 'all') {
        const titleCat = category.charAt(0).toUpperCase() + category.slice(1);
        return { segment: titleCat, genre: titleCat };
    }
    
    return { segment: 'Activity', genre: 'Activity' };
};

export const fetchSerpEvents = async (city, category, size = 15, apiKey, keyword = '') => {
    if (!apiKey) return [];
    
    const apiConfig = mapInternalCategoryToAPI(category, keyword);
    const cleanKey = apiKey.trim();

    try {
        // Fetch Page 1 (first 10 events)
        const res = await axios.get('https://serpapi.com/search.json', {
            params: {
                engine: 'google_events',
                q: `${apiConfig.serpQueryModifier} in ${city}`,
                api_key: cleanKey,
                start: 0
            },
            timeout: 12000
        });
        let raw = res.data?.events_results || [];
        console.log(`[SerpApi Page 1] Found ${raw.length} events for query: "${apiConfig.serpQueryModifier}" in ${city}`);

        // Fetch Page 2 if requested size > 10 and we got exactly 10 or more events from page 1
        if (size > 10 && raw.length >= 10) {
            try {
                const res2 = await axios.get('https://serpapi.com/search.json', {
                    params: {
                        engine: 'google_events',
                        q: `${apiConfig.serpQueryModifier} in ${city}`,
                        api_key: cleanKey,
                        start: 10
                    },
                    timeout: 12000
                });
                const raw2 = res2.data?.events_results || [];
                console.log(`[SerpApi Page 2] Found ${raw2.length} events for query: "${apiConfig.serpQueryModifier}"`);
                raw = [...raw, ...raw2];
            } catch (err2) {
                console.warn('[SerpApi Page 2 Error]', err2.message);
            }
        }
        
        return raw.slice(0, size).map((evt, i) => {
            let imgUrl = evt.image || evt.thumbnail;
            if (imgUrl && (imgUrl.includes('google.com/maps') || imgUrl.includes('maps.googleapis.com') || imgUrl.includes('staticmap') || imgUrl.includes('/maps/vt/'))) {
                imgUrl = null;
            }
            const rawDateStr = evt.date?.when || evt.date?.start_date || 'Date TBD';
            const { date, time } = parseUnstructuredDateTime(rawDateStr);
            const classification = classifySerpEvent(evt.title, category);
            return {
                id: `serp-${evt.title?.substring(0,3).toLowerCase().replace(/[^a-z0-9]/g, '')}-${i}`,
                source: 'Local',
                name: evt.title,
                url: evt.link,
                date: date,
                time: time,
                venueName: evt.venue?.name,
                address: Array.isArray(evt.address) ? evt.address.join(', ') : evt.address,
                image: imgUrl,
                segment: classification.segment,
                genre: classification.genre,
                priceMin: null,
                currency: 'USD',
                status: 'active'
            };
        });
    } catch (err) {
        console.warn('[SerpApi Error]', err.message);
        return [];
    }
};

export const fetchEvents = async (supabase, city, category, size = 50, keys = {}, keyword = '', forceRefresh = false) => {
    const { ticketmaster, serpapi, seatgeek } = keys;
    
    // Trim and lowercase parameters to prevent duplicate caching and queries
    const cleanCity = (city || '').trim();
    const normalizedCity = cleanCity.toLowerCase();
    const cat = (category || 'all').toLowerCase();
    const cleanKeyword = (keyword || '').trim();
    const hasKeyword = cleanKeyword.length > 0;
    
    if (!normalizedCity) return [];
    
    // 1. CHECK CACHE FIRST (skip if keyword search or forceRefresh is true)
    if (!hasKeyword && !forceRefresh) {
        try {
            const { data: cachedEntries } = await supabase
                .from('event_cache')
                .select('created_at, data')
                .eq('city', normalizedCity)
                .eq('category', cat);

            if (cachedEntries && cachedEntries.length > 0) {
                const cacheAgeMs = Date.now() - new Date(cachedEntries[0].created_at).getTime();
                const fourHours = 4 * 60 * 60 * 1000;
                
                if (cacheAgeMs < fourHours) {
                    const nowStr = new Date().toISOString().split('T')[0];
                    const upcoming = cachedEntries[0].data.filter(evt => !evt.date || evt.date === 'Date TBD' || evt.date >= nowStr);
                    console.log(`[EventCache] ✅ Cache HIT for "${cat}" in ${cleanCity} (${upcoming.length} upcoming events, Age: ${Math.round(cacheAgeMs / 360000) / 10}h)`);
                    return upcoming;
                } else {
                    console.log(`[EventCache] ⚠️ Cache expired for "${cat}" in ${cleanCity} (Age: ${Math.round(cacheAgeMs / 360000) / 10}h). Forcing fresh fetch...`);
                }
            }
        } catch (err) {
            console.warn('[EventCache] ⚠️ Read Error:', err.message);
        }
        console.log(`[EventCache] ❌ Cache MISS for "${cat}" in ${cleanCity}. Fetching fresh...`);
    } else {
        console.log(`[EventCache] 🔍 Bypassing cache. Reason: ${hasKeyword ? `Keyword search: "${cleanKeyword}"` : 'Force refresh requested'}`);
    }

    // 2. Determine if this is a "Local-Heavy" category that REQUIRED SerpApi
    const isLocalCategory = ['classes', 'tech', 'community', 'activities', 'outdoors', 'food', 'festivals'].includes(cat);
    
    // 3. Fetch from standard sources (TM & SG)
    let tmEvents = [];
    let sgEvents = [];
    
    if (cat === 'all') {
        const targetCats = ['music', 'sports', 'theater', 'comedy'];
        // Slice size per category to get a balanced set
        const sizePerCat = Math.ceil(size / targetCats.length);
        
        const tmPromises = ticketmaster 
            ? targetCats.map(c => fetchTicketmasterEvents(cleanCity, c, sizePerCat, ticketmaster, cleanKeyword))
            : [];
        const sgPromises = seatgeek
            ? targetCats.map(c => fetchSeatGeekEvents(cleanCity, c, sizePerCat, seatgeek, cleanKeyword))
            : [];
            
        const tmResults = await Promise.all(tmPromises);
        const sgResults = await Promise.all(sgPromises);
        
        tmEvents = tmResults.flat();
        sgEvents = sgResults.flat();
    } else {
        const [tmRes, sgRes] = await Promise.all([
            ticketmaster ? fetchTicketmasterEvents(cleanCity, category, size, ticketmaster, cleanKeyword) : Promise.resolve([]),
            seatgeek ? fetchSeatGeekEvents(cleanCity, category, size, seatgeek, cleanKeyword) : Promise.resolve([])
        ]);
        tmEvents = tmRes;
        sgEvents = sgRes;
    }

    // 4. Trigger SerpApi:
    //    - Always for local categories
    //    - Always for the 'all' category to introduce local-heavy categories (food, festivals, outdoors, general)
    //    - As a fallback if standard sources are empty
    let serpEvents = [];
    if (serpapi && (isLocalCategory || cat === 'all' || (tmEvents.length + sgEvents.length < 5))) {
        console.log(`[EventService] 🔍 Triggering SerpApi search for "${cat}" in ${cleanCity} (Quota Protection Active)`);
        if (cat === 'all') {
            // Fetch popular date-friendly local categories in parallel to populate the dashboard rows
            const serpCategories = ['all', 'food', 'festivals', 'outdoors'];
            const serpPromises = serpCategories.map(c => fetchSerpEvents(cleanCity, c, 15, serpapi, cleanKeyword));
            const serpResults = await Promise.all(serpPromises);
            serpEvents = serpResults.flat();
        } else {
            serpEvents = await fetchSerpEvents(cleanCity, category, size, serpapi, cleanKeyword);
        }
    }

    // Merge and deduplicate by name, date and venue to avoid duplicates across TM, SG, and SerpApi
    const uniqueEvents = [];
    for (const evt of [...tmEvents, ...sgEvents, ...serpEvents]) {
        const duplicateExist = uniqueEvents.some(existing => {
            const nameA = (existing.name || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
            const nameB = (evt.name || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
            if (nameA !== nameB) return false;
            
            const dateA = existing.date || '';
            const dateB = evt.date || '';
            if (dateA !== dateB) return false;
            
            const venueA = (existing.venueName || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
            const venueB = (evt.venueName || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
            
            if (!venueA || !venueB) return true;
            if (venueA === venueB || venueA.includes(venueB) || venueB.includes(venueA)) return true;
            if (venueA.substring(0, 8) === venueB.substring(0, 8)) return true;
            
            return false;
        });
        
        if (!duplicateExist) {
            uniqueEvents.push(evt);
        }
    }

    // Sort chronologically: soonest events first, TBD/invalid dates at the end
    const sorted = uniqueEvents.sort((a, b) => {
        const dateA = a.date && a.date !== 'Date TBD' ? new Date(`${a.date}T${a.time || '00:00:00'}`) : null;
        const dateB = b.date && b.date !== 'Date TBD' ? new Date(`${b.date}T${b.time || '00:00:00'}`) : null;
        
        const hasA = dateA && !isNaN(dateA.getTime());
        const hasB = dateB && !isNaN(dateB.getTime());
        
        if (hasA && hasB) {
            return dateA - dateB;
        }
        if (hasA) return -1;
        if (hasB) return 1;
        return 0;
    });

    // 5. ASYNC CACHE SAVE & FALLBACK FOR TECH
    if (sorted.length === 0 && (cat === 'tech' || cat === 'classes' || cat === 'community')) {
        console.log(`[EventService] Generating curated fallback events for "${cat}" in ${cleanCity}`);
        const today = new Date();
        const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
        const nextWeek = new Date(today); nextWeek.setDate(today.getDate() + 5);

        sorted.push(
            {
                id: `tech-fallback-1`,
                source: 'Community',
                name: `${cleanCity} AI & Tech Meetup: Developer Demo Night`,
                url: `https://www.google.com/search?q=${encodeURIComponent(`${cleanCity} AI tech meetup demo night`)}`,
                date: today.toISOString().split('T')[0],
                time: '18:30:00',
                venueName: `${cleanCity} Tech Hub / Innovation Center`,
                address: `Downtown ${cleanCity}`,
                image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop',
                segment: 'Activity',
                genre: 'Tech',
                priceMin: 0,
                priceMax: 0,
                currency: 'USD',
                status: 'active'
            },
            {
                id: `tech-fallback-2`,
                source: 'Community',
                name: `${cleanCity} Builders & Founders Networking Mixer`,
                url: `https://www.google.com/search?q=${encodeURIComponent(`${cleanCity} startup founders networking mixer`)}`,
                date: tomorrow.toISOString().split('T')[0],
                time: '19:00:00',
                venueName: `${cleanCity} Rooftop Lounge`,
                address: `Central ${cleanCity}`,
                image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop',
                segment: 'Activity',
                genre: 'Tech',
                priceMin: 0,
                priceMax: 15,
                currency: 'USD',
                status: 'active'
            },
            {
                id: `tech-fallback-3`,
                source: 'Community',
                name: `Hackathon & Open Source Showcase`,
                url: `https://www.google.com/search?q=${encodeURIComponent(`${cleanCity} hackathon open source meetup`)}`,
                date: nextWeek.toISOString().split('T')[0],
                time: '18:00:00',
                venueName: `Co-Working Space ${cleanCity}`,
                address: `${cleanCity}`,
                image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop',
                segment: 'Activity',
                genre: 'Tech',
                priceMin: 0,
                priceMax: 0,
                currency: 'USD',
                status: 'active'
            }
        );
    }

    if (sorted.length > 0 && !hasKeyword) {
        supabase.from('event_cache').upsert({
            city: normalizedCity,
            category: cat,
            data: sorted,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        }, { onConflict: 'city,category' })
        .then(({ error }) => {
            if (error) console.error(`[EventCache] ❌ Save Error for "${cat}" in ${cleanCity}:`, error.message);
            else console.log(`[EventCache] 💾 Cached ${sorted.length} events for "${cat}" in ${cleanCity}`);
        })
        .catch(err => {
            console.error(`[EventCache] ❌ Synchronous Save Exception for "${cat}" in ${cleanCity}:`, err.message);
        });
    }

    const nowStr = new Date().toISOString().split('T')[0];
    return sorted.filter(evt => !evt.date || evt.date === 'Date TBD' || evt.date >= nowStr);
};

export const fetchSeatGeekEvents = async (city, category, size = 15, clientId, keyword = '') => {
    if (!clientId) return [];
    
    // Skip SeatGeek for unsupported local categories to prevent category pollution
    if (['classes', 'community'].includes(category.toLowerCase())) return [];

    const apiConfig = mapInternalCategoryToAPI(category, keyword);
    const taxonomy = SEATGEEK_TAXONOMY_MAP[category.toLowerCase()] || (category.toLowerCase() === 'tech' ? 'event' : null);
    
    let url = `https://api.seatgeek.com/2/events?client_id=${clientId}&venue.city=${encodeURIComponent(city)}&per_page=${size}&sort=datetime_local.asc`;
    if (taxonomy) {
        url += `&taxonomies.name=${taxonomy}`;
    }
    const qParam = apiConfig.fallbackKeyword || keyword || (category.toLowerCase() === 'tech' ? 'tech' : '');
    if (qParam) {
        url += `&q=${encodeURIComponent(qParam)}`;
    }

    try {
        const res = await axios.get(url, { timeout: 8000 });
        const raw = res.data?.events || [];
        
        return raw.map(evt => {
            const classification = mapSeatGeekTypeToClassification(evt.type, category);
            return {
                id: `sg-${evt.id}`,
                source: 'SeatGeek',
                name: evt.short_title || evt.title,
                url: evt.url,
                date: evt.datetime_local?.split('T')[0],
                time: evt.datetime_local?.split('T')[1],
                venueName: evt.venue?.name,
                address: evt.venue?.address,
                image: evt.performers?.[0]?.images?.huge || evt.performers?.[0]?.images?.large || evt.performers?.[0]?.image,
                segment: category.toLowerCase() === 'tech' ? 'Activity' : classification.segment,
                genre: category.toLowerCase() === 'tech' ? 'Tech' : classification.genre,
                priceMin: evt.stats?.lowest_price,
                priceMax: evt.stats?.highest_price,
                currency: 'USD',
                status: 'active'
            };
        });
    } catch (err) {
        console.warn('[SeatGeek Error]', err.message);
        return [];
    }
};

const fetchTicketmasterEvents = async (city, category, size, apiKey, keyword = '') => {
    const apiConfig = mapInternalCategoryToAPI(category, keyword);
    // Skip TM if it's a very local category they don't cover well
    if (['classes', 'community'].includes(category.toLowerCase())) return [];

    const segmentName = CATEGORY_SEGMENT_MAP[category.toLowerCase()];
    let url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${apiKey}&city=${encodeURIComponent(city)}&size=${size}&sort=date,asc`;
    if (segmentName) {
        url += `&segmentName=${encodeURIComponent(segmentName)}`;
    }
    if (apiConfig.ticketmasterId) {
        url += `&classificationId=${apiConfig.ticketmasterId}`;
    }
    if (keyword) {
        url += `&keyword=${encodeURIComponent(keyword)}`;
    } else if (!apiConfig.ticketmasterId && apiConfig.fallbackKeyword) {
        url += `&keyword=${encodeURIComponent(apiConfig.fallbackKeyword)}`;
    }

    try {
        const res = await axios.get(url, { timeout: 8000 });
        const raw = res.data?._embedded?.events || [];
        const isTechCat = category.toLowerCase() === 'tech';

        return raw
            .filter(evt => {
                if (!isTechCat) return true;
                const name = (evt.name || '').toLowerCase();
                const segName = (evt.classifications?.[0]?.segment?.name || '').toLowerCase();
                if (segName.includes('theatre') || segName.includes('arts') || segName.includes('sports')) {
                    return name.includes('tech') || name.includes('hackathon') || name.includes('ai') || name.includes('software') || name.includes('coding');
                }
                return true;
            })
            .map(evt => ({
                id: `tm-${evt.id}`,
                source: 'Ticketmaster',
                name: evt.name,
                url: evt.url,
                date: evt.dates?.start?.localDate,
                time: evt.dates?.start?.localTime,
                venueName: evt._embedded?.venues?.[0]?.name,
                address: evt._embedded?.venues?.[0]?.address?.line1,
                image: evt.images?.sort((a, b) => b.width - a.width)?.[0]?.url,
                segment: isTechCat ? 'Activity' : evt.classifications?.[0]?.segment?.name,
                genre: isTechCat ? 'Tech' : evt.classifications?.[0]?.genre?.name,
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
