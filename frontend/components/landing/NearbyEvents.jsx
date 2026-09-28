import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Ticket, MapPin, Calendar, ExternalLink, Search, RefreshCw, Star, Music, Trophy, Sparkles, Wine, Laugh } from 'lucide-react';

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

const mixAndDeduplicateEvents = (rawEvents, count = 4) => {
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

// Replicated EventCard Component with real photo support & authentic venue badge fallback
const EventCard = ({ evt, idx, onClick }) => {
    const color = segmentColor(evt.segment);
    const isCancelled = evt.status === 'cancelled';
    const [imgFailed, setImgFailed] = useState(false);

    const isValidImage = (url) => {
        if (!url || typeof url !== 'string' || url.trim() === '') return false;
        if (url.includes('unsplash.com')) return false;
        if (url.includes('google.com/maps') || url.includes('maps.googleapis.com') || url.includes('staticmap') || url.includes('/maps/vt/')) return false;
        return true;
    };

    const hasPhoto = isValidImage(evt.image) && !imgFailed;

    const getCategoryIcon = (seg) => {
        const s = (seg || '').toLowerCase();
        if (s.includes('music') || s.includes('concert')) return <Music className="w-8 h-8 text-white/90" />;
        if (s.includes('sport') || s.includes('athletic')) return <Trophy className="w-8 h-8 text-white/90" />;
        if (s.includes('theat') || s.includes('art')) return <Sparkles className="w-8 h-8 text-white/90" />;
        if (s.includes('comedy') || s.includes('standup')) return <Laugh className="w-8 h-8 text-white/90" />;
        if (s.includes('food') || s.includes('drink')) return <Wine className="w-8 h-8 text-white/90" />;
        return <Ticket className="w-8 h-8 text-white/90" />;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0, transition: { delay: idx * 0.04 } }}
            viewport={{ once: true }}
            whileHover={{ y: -4 }}
            onClick={onClick}
            className={`block rounded-[2rem] overflow-hidden border group transition-all duration-500 hover:shadow-xl hover:-translate-y-1.5 p-3 bg-white border-slate-100 text-navy shadow-sm cursor-pointer ${isCancelled ? 'opacity-50 pointer-events-none' : ''}`}
        >
            {/* Image Section or Authentic Venue Pass */}
            <div className="relative aspect-[16/10] sm:aspect-[16/9] rounded-2xl overflow-hidden bg-slate-900/5 mb-3 shadow-inner">
                {hasPhoto ? (
                    <img
                        src={evt.image}
                        alt={evt.name}
                        className="w-full h-full object-cover transition-transform duration-600 group-hover:scale-105"
                        onError={() => setImgFailed(true)}
                    />
                ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${color} flex flex-col items-center justify-center p-4 relative overflow-hidden group-hover:scale-105 transition-transform duration-500`}>
                        <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-white/10 blur-xl pointer-events-none" />
                        <div className="absolute -left-6 -top-6 w-24 h-24 rounded-full bg-black/10 blur-lg pointer-events-none" />
                        <div className="relative z-10 flex flex-col items-center gap-1.5 text-center">
                            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-md">
                                {getCategoryIcon(evt.segment || evt.genre)}
                            </div>
                            <span className="text-[11px] font-black text-white uppercase tracking-wider line-clamp-1 max-w-[190px] drop-shadow-sm">
                                {evt.venueName || evt.name}
                            </span>
                        </div>
                    </div>
                )}
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 opacity-70 group-hover:opacity-85 transition-opacity pointer-events-none" />

                {/* Category badge */}
                <div className={`absolute top-3 left-3 bg-gradient-to-r ${color} text-white text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider z-10 shadow-sm`}>
                    {evt.genre || evt.segment}
                </div>

                {/* Source Badge */}
                <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-md text-white/90 text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter border border-white/10 z-10 shadow-sm">
                    {evt.source === 'SeatGeek' ? 'SG' : evt.source === 'Local' ? 'Google' : 'TM'}
                </div>

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
        let queryCity = searchCity || 'New York';
        const metroKeywords = ['manhattan', 'brooklyn', 'queens', 'bronx', 'staten island', 'jersey city', 'hoboken'];
        const norm = (searchCity || '').toLowerCase().trim();
        const isBorough = metroKeywords.some(k => norm === k || norm.startsWith(k + ',') || norm.startsWith(k + ' ') || norm.includes(k));
        if (isBorough || norm.includes('new york') || norm.includes('nyc')) {
            queryCity = 'New York';
        }

        const cacheKey = `${queryCity.toLowerCase()}_${searchCategory.toLowerCase()}`;
        if (eventsCache[cacheKey]) {
            setEvents(eventsCache[cacheKey]);
            setIsLoading(false);
            return;
        }

        try {
            const url = `${API_URL}/api/events?city=${encodeURIComponent(queryCity)}&category=${searchCategory}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response not ok');
            const data = await response.json();
            
            if (data && data.length > 0) {
                const mixed = mixAndDeduplicateEvents(data, 4);
                setEvents(mixed);
                setEventsCache(prev => ({
                    ...prev,
                    [cacheKey]: mixed
                }));
            } else {
                setEvents([]);
            }
        } catch (e) {
            console.warn('[NearbyEvents] Failed to fetch events:', e);
            setEvents([]);
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
        <section className="py-14 md:py-20 bg-white border-t border-slate-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                    <div className="space-y-1.5">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 border border-violet-100 text-violet-600 text-[10px] font-black uppercase tracking-wider">
                            <Ticket className="w-3 h-3" />
                            <span>Curated Spotlight</span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-black text-navy tracking-tight flex items-center gap-2.5 font-serif">
                            Live Events in {city}
                        </h2>
                        <p className="text-gray-400 font-bold text-xs uppercase tracking-widest pl-0.5">
                            Handpicked 4-event spotlight • Live music, comedy & entertainment
                        </p>
                    </div>

                    {/* Search Input */}
                    <form onSubmit={handleSearch} className="flex items-center gap-2 max-w-sm w-full md:w-72">
                        <div className="flex items-center gap-2 rounded-2xl border border-gray-200 px-3.5 py-2.5 bg-slate-50/60 w-full shadow-sm focus-within:border-coral focus-within:bg-white transition-all">
                            <MapPin className="w-4 h-4 text-coral flex-shrink-0" />
                            <input
                                type="text"
                                value={cityInput}
                                onChange={e => setCityInput(e.target.value)}
                                placeholder="Search city..."
                                className="w-full bg-transparent text-xs font-semibold outline-none text-navy placeholder-gray-400"
                            />
                            <button type="submit" className="text-coral hover:text-orange-600 transition-colors cursor-pointer">
                                <Search className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </form>
                </div>

                {/* Quick select pills */}
                <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-3 mb-4 w-full">
                    {QUICK_CITIES.map(c => (
                        <button
                            key={c}
                            onClick={() => {
                                setCity(c);
                                setCityInput(c);
                            }}
                            className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-black transition-all border cursor-pointer ${
                                city.toLowerCase() === c.toLowerCase()
                                    ? 'bg-coral border-coral text-white shadow-sm'
                                    : 'bg-slate-50 border-slate-200 text-gray-500 hover:border-gray-300 hover:bg-white'
                            }`}
                        >
                            {c}
                        </button>
                    ))}
                </div>

                {/* Category selector pills */}
                <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-3 mb-8 snap-x snap-mandatory w-full">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setCategory(cat.id)}
                            className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-black transition-all flex items-center gap-1.5 border snap-start cursor-pointer ${
                                category === cat.id
                                    ? `bg-gradient-to-r ${cat.color} border-transparent text-white shadow-sm`
                                    : 'bg-slate-50 border-slate-200 text-gray-500 hover:border-gray-300 hover:bg-white'
                            }`}
                        >
                            <span>{cat.emoji}</span>
                            <span>{cat.label}</span>
                        </button>
                    ))}
                </div>

                {/* Events Grid: Exactly 4 cards on desktop */}
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="bg-slate-50 border border-slate-100 rounded-2xl h-[280px] animate-pulse shadow-sm w-full" />
                        ))}
                    </div>
                ) : events.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {events.map((evt, idx) => (
                            <EventCard 
                                key={evt.id || idx} 
                                evt={evt} 
                                idx={idx} 
                                onClick={handleEventClick} 
                            />
                        ))}
                    </div>
                ) : (
                    <div className="bg-slate-50/60 border border-slate-100 rounded-3xl p-10 text-center max-w-xl mx-auto shadow-sm flex flex-col items-center justify-center gap-3">
                        <div className="w-11 h-11 bg-coral/10 rounded-full flex items-center justify-center">
                            <Ticket className="w-5 h-5 text-coral" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-black text-navy text-lg font-serif">No live events found in {city}</h3>
                            <p className="text-gray-400 text-xs font-semibold max-w-sm">
                                No live happenings scheduled in {city} for this category right now. Try picking another category or city!
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};

export default NearbyEvents;
