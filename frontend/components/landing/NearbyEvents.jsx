import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Ticket, MapPin, Calendar, ExternalLink, Sparkles, Search, RefreshCw } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

const QUICK_CITIES = ['New York', 'Los Angeles', 'Chicago', 'Miami', 'San Francisco'];

const CATEGORIES = [
    { id: 'all',       label: 'All Events', emoji: '✨', color: 'from-violet-600 to-fuchsia-600' },
    { id: 'family',    label: 'Family',     emoji: '👨‍👩‍👧', color: 'from-sky-500 to-blue-600' },
    { id: 'community', label: 'Groups',     emoji: '🤝', color: 'from-orange-400 to-red-500' },
    { id: 'music',     label: 'Music',      emoji: '🎵', color: 'from-pink-500 to-rose-600' },
    { id: 'sports',    label: 'Sports',     emoji: '🏆', color: 'from-orange-500 to-amber-600' },
    { id: 'theater',   label: 'Theater',    emoji: '🎭', color: 'from-emerald-500 to-teal-600' },
    { id: 'comedy',    label: 'Comedy',     emoji: '😂', color: 'from-yellow-500 to-orange-500' },
    { id: 'classes',   label: 'Classes',    emoji: '🎨', color: 'from-indigo-500 to-purple-600' },
    { id: 'tech',      label: 'Tech',       emoji: '💻', color: 'from-cyan-500 to-blue-500' },
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
        return evt.image;
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

    // Deterministic selection using event name hash to prevent layout shifting
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
    
    // 1. De-duplicate by event name (case-insensitive, trimmed)
    const seenNames = new Set();
    const uniqueEvents = [];
    for (const evt of rawEvents) {
        const cleanName = (evt.name || '').trim().toLowerCase();
        if (!seenNames.has(cleanName)) {
            seenNames.add(cleanName);
            uniqueEvents.push(evt);
        }
    }
    
    // 2. Group by segment/category
    const groups = {};
    for (const evt of uniqueEvents) {
        const cat = evt.segment || evt.genre || 'Other';
        if (!groups[cat]) {
            groups[cat] = [];
        }
        groups[cat].push(evt);
    }
    
    // Shuffle events within each category group to ensure variety
    Object.keys(groups).forEach(c => {
        groups[c].sort(() => Math.random() - 0.5);
    });
    
    // 3. Round-robin select from groups
    const categories = Object.keys(groups);
    const selected = [];
    const indices = {};
    categories.forEach(c => { indices[c] = 0; });
    
    let added = true;
    while (added && selected.length < count) {
        added = false;
        // Shuffle category order per round-robin pass to randomize which category comes first
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

const NearbyEvents = () => {
    const navigate = useNavigate();
    const [city, setCity] = useState('New York');
    const [cityInput, setCityInput] = useState('New York');
    const [category, setCategory] = useState('all');
    const [events, setEvents] = useState([]);
    const [eventsCache, setEventsCache] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    const fetchLocalEvents = async (searchCity, searchCategory = 'all') => {
        setIsLoading(true);
        // Map boroughs to metro center for Ticketmaster compatibility
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
            const res = await axios.get(`${API_URL}/api/events?city=${encodeURIComponent(queryCity)}&category=${searchCategory}`);
            if (res.data && res.data.length > 0) {
                const mixed = mixAndDeduplicateEvents(res.data, 8);
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
                    <div className="flex md:grid md:grid-cols-2 lg:grid-cols-4 gap-6 overflow-x-auto md:overflow-visible pb-4 md:pb-0 snap-x snap-mandatory scrollbar-hide">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="bg-slate-50 border border-slate-100 rounded-xl md:rounded-2xl h-[280px] sm:h-[320px] md:h-[360px] animate-pulse shadow-sm w-[210px] sm:w-[260px] md:w-auto flex-shrink-0 snap-start" />
                        ))}
                    </div>
                ) : (
                    <div className="flex md:grid md:grid-cols-2 lg:grid-cols-4 gap-6 overflow-x-auto md:overflow-visible pb-4 md:pb-0 snap-x snap-mandatory scrollbar-hide">
                        {events.map((evt) => {
                            const color = segmentColor(evt.segment);
                            return (
                                <motion.div
                                    key={evt.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    onClick={handleEventClick}
                                    className="bg-white rounded-xl md:rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between group w-[210px] sm:w-[260px] md:w-auto flex-shrink-0 snap-start"
                                >
                                    {/* Image */}
                                    <div className="relative h-32 sm:h-40 md:h-44 overflow-hidden bg-navy/5">
                                        <img
                                            src={getEventImage(evt)}
                                            alt={evt.name}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            onError={(e) => {
                                                e.target.src = getEventImage({ ...evt, image: null });
                                            }}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                        
                                        {/* Category Badge */}
                                        <div className={`absolute top-3 left-3 bg-gradient-to-r ${color} text-white text-[7px] sm:text-[8px] font-black px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md uppercase tracking-wider shadow-sm`}>
                                            {evt.genre || evt.segment}
                                        </div>
 
                                        {/* Source Badge */}
                                        <div className="absolute top-3 right-3 bg-black/45 backdrop-blur-md text-white/90 text-[7px] sm:text-[8px] font-black px-1.5 sm:px-2 py-0.5 rounded-md uppercase tracking-tighter border border-white/10 shadow-sm">
                                            {evt.source === 'SeatGeek' ? 'SeatGeek' : 'Ticketmaster'}
                                        </div>
                                    </div>
 
                                    {/* Content */}
                                    <div className="p-3.5 sm:p-4.5 md:p-5 flex-1 flex flex-col justify-between">
                                        <div className="space-y-1.5 sm:space-y-2.5 mb-2.5 sm:mb-4">
                                            <h4 className="font-black text-xs sm:text-sm text-navy leading-tight line-clamp-2 group-hover:text-coral transition-colors">
                                                {evt.name}
                                            </h4>
                                            
                                            {evt.venueName && (
                                                <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-gray-500 font-bold">
                                                    <MapPin className="w-3 h-3 text-coral flex-shrink-0" />
                                                    <span className="truncate">{evt.venueName}</span>
                                                </div>
                                            )}
 
                                            <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-gray-400 font-medium">
                                                <Calendar className="w-3 h-3 flex-shrink-0" />
                                                <span>{formatDate(evt.date, evt.time)}</span>
                                            </div>
                                        </div>
 
                                        <div className="space-y-2 sm:space-y-3 pt-2 border-t border-gray-50">
                                            <div className="flex items-center justify-between text-[10px] sm:text-xs">
                                                <span className="font-bold text-gray-400">Price Range</span>
                                                <span className="font-black text-navy">{formatPrice(evt.priceMin, evt.priceMax, evt.currency)}</span>
                                            </div>
                                            
                                            <button className="w-full py-2 sm:py-2.5 md:py-3 bg-gray-50 text-navy border border-gray-100 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest group-hover:bg-navy group-hover:text-white group-hover:border-navy transition-all flex items-center justify-center gap-1.5 sm:gap-2">
                                                Get Tickets <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
};

export default NearbyEvents;
