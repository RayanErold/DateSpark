import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Ticket, MapPin, Calendar, ExternalLink, Search, RefreshCw, Star } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

const QUICK_CITIES = ['New York', 'Los Angeles', 'Chicago', 'Miami', 'San Francisco'];

const CATEGORIES = [
    { id: 'all',       label: 'All Events', emoji: '✨', color: 'from-violet-600 to-fuchsia-600' },
    { id: 'music',     label: 'Music',      emoji: '🎵', color: 'from-pink-500 to-rose-600' },
    { id: 'sports',    label: 'Sports',     emoji: '🏆', color: 'from-orange-500 to-amber-600' },
    { id: 'theater',   label: 'Theater',    emoji: '🎭', color: 'from-emerald-500 to-teal-600' },
    { id: 'comedy',    label: 'Comedy',     emoji: '😂', color: 'from-yellow-500 to-orange-500' },
    { id: 'food',      label: 'Food & Drink', emoji: '🍷', color: 'from-red-500 to-rose-500' },
];

const CATEGORY_FALLBACK_IMAGES = {
    music: [
        'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=600&q=80'
    ],
    sports: [
        'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80'
    ],
    theater: [
        'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1516307364728-22f12d51c02e?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=600&q=80'
    ],
    comedy: [
        'https://images.unsplash.com/photo-1585699324551-f6c309eed262?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1527224857830-43a7acc85260?auto=format&fit=crop&w=600&q=80'
    ],
    family: [
        'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1489659639091-8b687bc4386e?auto=format&fit=crop&w=600&q=80'
    ],
    community: [
        'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=600&q=80'
    ],
    activities: [
        'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1513829096999-4978602297f7?auto=format&fit=crop&w=600&q=80'
    ],
    outdoors: [
        'https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=600&q=80'
    ],
    food: [
        'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80'
    ],
    festivals: [
        'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1481162854517-d9e353af153d?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=600&q=80'
    ],
    classes: [
        'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=600&q=80'
    ],
    tech: [
        'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80'
    ],
    all: [
        'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=600&q=80'
    ]
};

const getEventImage = (evt) => {
    if (evt.image && evt.image.trim() !== '') {
        const isMapUrl = evt.image.includes('google.com/maps') ||
                         evt.image.includes('maps.googleapis.com') ||
                         evt.image.includes('staticmap') ||
                         evt.image.includes('/maps/vt/');
        if (!isMapUrl) {
            return evt.image;
        }
    }
    const seg = (evt.segment || evt.genre || 'all').toLowerCase();
    let list = CATEGORY_FALLBACK_IMAGES.all;
    
    if (seg.includes('music') || seg.includes('concert')) list = CATEGORY_FALLBACK_IMAGES.music;
    else if (seg.includes('sport') || seg.includes('athletic') || seg.includes('basketball') || seg.includes('football')) list = CATEGORY_FALLBACK_IMAGES.sports;
    else if (seg.includes('theat') || seg.includes('broadway') || seg.includes('art') || seg.includes('museum')) list = CATEGORY_FALLBACK_IMAGES.theater;
    else if (seg.includes('comedy') || seg.includes('standup')) list = CATEGORY_FALLBACK_IMAGES.comedy;
    else if (seg.includes('family') || seg.includes('child')) list = CATEGORY_FALLBACK_IMAGES.family;
    else if (seg.includes('group') || seg.includes('meetup') || seg.includes('social') || seg.includes('community')) list = CATEGORY_FALLBACK_IMAGES.community;
    else if (seg.includes('class') || seg.includes('workshop')) list = CATEGORY_FALLBACK_IMAGES.classes;
    else if (seg.includes('tech') || seg.includes('network') || seg.includes('software') || seg.includes('science') || seg.includes('computer')) list = CATEGORY_FALLBACK_IMAGES.tech;
    else if (seg.includes('activities') || seg.includes('arcade') || seg.includes('bowling') || seg.includes('game') || seg.includes('recreation')) list = CATEGORY_FALLBACK_IMAGES.activities;
    else if (seg.includes('outdoor') || seg.includes('hike') || seg.includes('nature') || seg.includes('park') || seg.includes('scenic')) list = CATEGORY_FALLBACK_IMAGES.outdoors;
    else if (seg.includes('food') || seg.includes('drink') || seg.includes('wine') || seg.includes('beer') || seg.includes('culinary') || seg.includes('dining')) list = CATEGORY_FALLBACK_IMAGES.food;
    else if (seg.includes('festival') || seg.includes('fair') || seg.includes('expo') || seg.includes('exhibition') || seg.includes('carnival')) list = CATEGORY_FALLBACK_IMAGES.festivals;

    const name = evt.name || '';
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % list.length;
    return list[idx];
};

const MOCK_EVENTS = [
    {
        id: 'mock-family-1',
        name: 'Science & Discovery Interactive Expo',
        venueName: 'Science Center & Museum Hall',
        date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
        time: '11:00 AM',
        image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=600&q=80',
        genre: 'Family Activity',
        segment: 'Family',
        priceMin: 15,
        priceMax: 30,
        currency: 'USD',
        source: 'Ticketmaster'
    },
    {
        id: 'mock-1',
        name: 'Summer Rooftop Jazz Night',
        venueName: 'The Press Room, Manhattan',
        date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
        time: '08:00 PM',
        image: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=600&q=80',
        genre: 'Jazz Music',
        segment: 'Music',
        priceMin: 25,
        priceMax: 45,
        currency: 'USD',
        source: 'Ticketmaster'
    },
    {
        id: 'mock-2',
        name: 'Broadway Classics Under The Stars',
        venueName: 'Central Park Theater, NYC',
        date: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0],
        time: '07:30 PM',
        image: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=600&q=80',
        genre: 'Broadway',
        segment: 'Arts & Theatre',
        priceMin: 40,
        priceMax: 90,
        currency: 'USD',
        source: 'Ticketmaster'
    },
    {
        id: 'mock-3',
        name: 'Championship Basketball Game',
        venueName: 'Barclays Center, Brooklyn',
        date: new Date(Date.now() + 86400000 * 1).toISOString().split('T')[0],
        time: '08:30 PM',
        image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=600&q=80',
        genre: 'Basketball',
        segment: 'Sports',
        priceMin: 65,
        priceMax: 150,
        currency: 'USD',
        source: 'SeatGeek'
    },
    {
        id: 'mock-4',
        name: 'Late Night Comedy Stand-up Show',
        venueName: 'Greenwich Village Comedy Club',
        date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
        time: '09:00 PM',
        image: 'https://images.unsplash.com/photo-1585699324551-f6c309eed262?auto=format&fit=crop&w=600&q=80',
        genre: 'Standup Comedy',
        segment: 'Comedy',
        priceMin: 15,
        priceMax: 30,
        currency: 'USD',
        source: 'SeatGeek'
    }
];

const SEGMENT_COLORS = {
    Music:            'from-pink-500 to-rose-600 shadow-pink-500/20',
    Sports:           'from-orange-600 to-amber-600 shadow-orange-500/20',
    'Arts & Theatre': 'from-emerald-600 to-teal-600 shadow-emerald-500/20',
    Family:           'from-sky-500 to-blue-600 shadow-blue-500/20',
    Comedy:           'from-yellow-500 to-orange-500 shadow-yellow-500/20',
    Community:        'from-orange-400 to-red-500 shadow-orange-500/20',
    Activity:         'from-indigo-500 to-purple-600 shadow-indigo-500/20',
    Outdoors:         'from-emerald-500 to-green-600 shadow-emerald-500/20',
    Food:             'from-red-500 to-rose-500 shadow-red-500/20',
    Festivals:        'from-amber-500 to-red-500 shadow-amber-500/20',
};

const segmentColor = (seg) => SEGMENT_COLORS[seg] || 'from-violet-600 to-fuchsia-600';

const formatDate = (dateStr, timeStr) => {
    if (!dateStr) return 'Date TBD';
    if (dateStr.includes(',') || /[a-zA-Z]/.test(dateStr)) return dateStr;
    try {
        const d = new Date(`${dateStr}T${timeStr || '00:00'}:00`);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    } catch (e) {
        return dateStr;
    }
};

const formatPrice = (min, max, currency) => {
    if (!min) return 'Check pricing';
    const sym = currency === 'USD' ? '$' : currency;
    return max && max !== min ? `${sym}${Math.round(min)} - ${sym}${Math.round(max)}` : `From ${sym}${Math.round(min)}`;
};

const mixAndDeduplicateEvents = (rawEvents, count = 8) => {
    if (!rawEvents || rawEvents.length === 0) return [];
    const seenNames = new Set();
    const uniqueEvents = [];
    for (const evt of rawEvents) {
        const cleanName = (evt.name || '').trim().toLowerCase();
        if (!seenNames.has(cleanName)) {
            seenNames.add(cleanName);
            uniqueEvents.push(evt);
        }
    }
    const groups = {};
    for (const evt of uniqueEvents) {
        const cat = evt.segment || evt.genre || 'Other';
        if (!groups[cat]) { groups[cat] = []; }
        groups[cat].push(evt);
    }
    Object.keys(groups).forEach(c => {
        groups[c].sort(() => Math.random() - 0.5);
    });
    const categories = Object.keys(groups);
    const selected = [];
    const indices = {};
    categories.forEach(c => { indices[c] = 0; });
    let added = true;
    while (added && selected.length < count) {
        added = false;
        const shuffledCats = [...categories].sort(() => Math.random() - 0.5);
        for (const c of shuffledCats) {
            const idx = indices[c];
            if (idx < groups[c].length) {
                selected.push(groups[c][idx]);
                indices[c] = idx + 1;
                added = true;
                if (selected.length >= count) break;
            }
        }
    }
    return selected;
};

// Replicated EventCard Component to match EventsTab.jsx style perfectly
const EventCard = ({ evt, idx, onClick }) => {
    const color = segmentColor(evt.segment);
    const isCancelled = evt.status === 'cancelled';
    const rawImg = evt.image || '';
    const isGstatic = rawImg.includes('gstatic.com') || rawImg.includes('googleusercontent.com');
    const mainImgUrl = isGstatic ? getEventImage({ ...evt, image: null }) : getEventImage(evt);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0, transition: { delay: idx * 0.04 } }}
            viewport={{ once: true }}
            whileHover={{ y: -4 }}
            onClick={onClick}
            className={`block rounded-[2rem] overflow-hidden border group transition-all duration-500 hover:shadow-xl hover:-translate-y-1.5 p-3 bg-white border-slate-100 text-navy shadow-sm cursor-pointer ${isCancelled ? 'opacity-50 pointer-events-none' : ''}`}
        >
            {/* Image Section */}
            <div className="relative aspect-[16/10] sm:aspect-[16/9] rounded-2xl overflow-hidden bg-slate-900/5 mb-3 shadow-inner">
                <img
                    src={mainImgUrl}
                    alt={evt.name}
                    className="w-full h-full object-cover transition-transform duration-600 group-hover:scale-105"
                    onError={(e) => {
                        e.target.src = getEventImage({ ...evt, image: null });
                    }}
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 opacity-70 group-hover:opacity-85 transition-opacity" />

                {/* Category badge */}
                <div className={`absolute top-3 left-3 bg-gradient-to-r ${color} text-white text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider z-10 shadow-sm`}>
                    {evt.genre || evt.segment}
                </div>

                {/* Source Badge */}
                <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-md text-white/90 text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter border border-white/10 z-10 shadow-sm">
                    {evt.source === 'SeatGeek' ? 'SG' : evt.source === 'Local' ? 'Google' : 'TM'}
                </div>

                {/* Event logo / avatar badge (for Google Events with thumbnails) */}
                {isGstatic && evt.image && (
                    <div className="absolute bottom-3 right-3 w-11 h-11 rounded-full overflow-hidden border-2 border-white shadow-lg z-10 bg-white">
                        <img 
                            src={evt.image} 
                            alt="Event logo" 
                            className="w-full h-full object-cover select-none pointer-events-none" 
                            onError={(e) => {
                                e.target.parentNode.style.display = 'none';
                            }}
                        />
                    </div>
                )}

                {/* Date overlay badge */}
                <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 bg-black/40 backdrop-blur-sm border border-white/10 px-2.5 py-1 rounded-xl">
                    <Calendar className="w-3 h-3 text-rose" />
                    <span className="text-[9px] font-black text-white/90 uppercase tracking-widest">
                        {evt.date ? new Date(evt.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase() : 'TBD'}
                    </span>
                </div>
            </div>

            {/* Info */}
            <div className="px-1 py-1 font-outfit">
                <h4 className="font-black text-sm leading-snug line-clamp-1 mb-1 group-hover:text-rose transition-colors text-navy">
                    {evt.name}
                </h4>
                {evt.venueName && (
                    <div className="flex items-center gap-1 mb-2">
                        <MapPin className="w-3 h-3 text-rose/80 flex-shrink-0" />
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate">{evt.venueName}</p>
                    </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between border-t pt-2 mt-1 border-gray-100/50">
                    <span className="text-[11px] font-black text-slate-500">
                        {formatPrice(evt.priceMin, evt.priceMax, evt.currency)}
                    </span>
                    <div className={`flex items-center gap-1 text-[9px] font-black px-3 py-1.5 rounded-full bg-gradient-to-r ${color} text-white group-hover:opacity-90 transition-opacity`}>
                        Get Tickets <ExternalLink className="w-2.5 h-2.5" />
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const NearbyEvents = ({ selectedCity: propCity, setSelectedCity: propSetCity, userCoords, searchRadius }) => {
    const navigate = useNavigate();
    const [localCity, setLocalCity] = useState('New York');
    const city = propCity || localCity;
    const setCity = propSetCity || setLocalCity;
    const [cityInput, setCityInput] = useState('New York');
    const [category, setCategory] = useState('all');
    const [events, setEvents] = useState([]);
    const [eventsCache, setEventsCache] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    const fetchLocalEvents = async (searchCity, searchCategory = 'all') => {
        setIsLoading(true);
        let queryCity = searchCity;
        const metroKeywords = ['manhattan', 'brooklyn', 'queens', 'bronx', 'staten island', 'jersey city', 'hoboken'];
        if (metroKeywords.includes(searchCity.toLowerCase())) {
            queryCity = 'New York';
        }

        const cacheKey = `${queryCity.toLowerCase()}_${searchCategory.toLowerCase()}`;
        if (eventsCache[cacheKey]) {
            setEvents(eventsCache[cacheKey]);
            setIsLoading(false);
            return;
        }

        try {
            // Replaced axios with native browser fetch to ensure correct CORS / Vite Proxy routing
            const url = `${API_URL}/api/events?city=${encodeURIComponent(queryCity)}&category=${searchCategory}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response not ok');
            const data = await response.json();
            
            if (data && data.length > 0) {
                const mixed = mixAndDeduplicateEvents(data, 8);
                setEvents(mixed);
                setEventsCache(prev => ({
                    ...prev,
                    [cacheKey]: mixed
                }));
            } else {
                const mixedMock = mixAndDeduplicateEvents(MOCK_EVENTS, 8);
                setEvents(mixedMock);
                setEventsCache(prev => ({
                    ...prev,
                    [cacheKey]: mixedMock
                }));
            }
        } catch (e) {
            console.warn('[NearbyEvents] Failed to fetch events, falling back to mock events:', e);
            const mixedMock = mixAndDeduplicateEvents(MOCK_EVENTS, 8);
            setEvents(mixedMock);
            setEventsCache(prev => ({
                ...prev,
                [cacheKey]: mixedMock
            }));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLocalEvents(city, category);
    }, [city, category]);

    const handleSearch = (e) => {
        e.preventDefault();
        if (cityInput.trim()) {
            setCity(cityInput.trim());
        }
    };

    const handleEventClick = () => {
        navigate('/signup');
    };

    return (
        <section className="py-16 md:py-24 bg-white border-t border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div className="space-y-1">
                        <h2 className="text-3xl font-black text-navy tracking-tight flex items-center gap-3">
                            Nearby Live Events <Ticket className="w-6 h-6 text-coral" />
                        </h2>
                        <p className="text-gray-400 font-bold text-sm uppercase tracking-widest pl-1">
                            Live concerts, sports, and performances happening in your city
                        </p>
                    </div>

                    {/* Search Input */}
                    <form onSubmit={handleSearch} className="flex items-center gap-2 max-w-sm w-full md:w-80">
                        <div className="flex items-center gap-2 rounded-2xl border border-gray-200 px-4 py-3 bg-white w-full shadow-sm focus-within:border-coral transition-colors">
                            <MapPin className="w-4 h-4 text-coral flex-shrink-0" />
                            <input
                                type="text"
                                value={cityInput}
                                onChange={e => setCityInput(e.target.value)}
                                placeholder="Enter city (e.g. New York)"
                                className="w-full bg-transparent text-sm font-semibold outline-none text-navy placeholder-gray-400"
                            />
                            <button type="submit" className="text-coral hover:text-orange-600 transition-colors">
                                <Search className="w-4 h-4" />
                            </button>
                        </div>
                    </form>
                </div>

                {/* Quick select pills */}
                <div className="flex gap-2 overflow-x-auto scrollbar-none pb-4 mb-8">
                    {QUICK_CITIES.map(c => (
                        <button
                            key={c}
                            onClick={() => {
                                setCity(c);
                                setCityInput(c);
                            }}
                            className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-black transition-all border ${
                                city.toLowerCase() === c.toLowerCase()
                                    ? 'bg-coral border-coral text-white shadow-md'
                                    : 'bg-slate-50 border-slate-100 text-gray-500 hover:border-gray-300 hover:bg-white'
                            }`}
                        >
                            {c}
                        </button>
                    ))}
                </div>

                {/* Category selector pills */}
                <div className="flex gap-2 overflow-x-auto scrollbar-none pb-4 mb-8 snap-x snap-mandatory">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setCategory(cat.id)}
                            className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-black transition-all flex items-center gap-1.5 border snap-start ${
                                category === cat.id
                                    ? `bg-gradient-to-r ${cat.color} border-transparent text-white shadow-md`
                                    : 'bg-slate-50 border-slate-100 text-gray-500 hover:border-gray-200 hover:bg-white'
                            }`}
                        >
                            <span>{cat.emoji}</span>
                            <span>{cat.label}</span>
                        </button>
                    ))}
                </div>

                {/* Events Grid */}
                {isLoading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="bg-slate-50 border border-slate-100 rounded-xl md:rounded-2xl h-[240px] sm:h-[280px] md:h-[320px] animate-pulse shadow-sm w-full" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                        {events.map((evt, idx) => (
                            <EventCard 
                                key={evt.id || idx} 
                                evt={evt} 
                                idx={idx} 
                                onClick={handleEventClick} 
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default NearbyEvents;
