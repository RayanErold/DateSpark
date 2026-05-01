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
    'comedy': 'Arts & Theatre'
};

export const fetchEvents = async (city, category, size = 15, apiKey) => {
    const segmentName = CATEGORY_SEGMENT_MAP[category.toLowerCase()];
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
            venueName: evt._embedded?.venues?.[0]?.name,
            address: evt._embedded?.venues?.[0]?.address?.line1,
            priceMin: evt.priceRanges?.[0]?.min,
            currency: evt.priceRanges?.[0]?.currency || 'USD'
        }));
    } catch (err) {
        console.warn('[EventService Error]', err.message);
        return [];
    }
};
