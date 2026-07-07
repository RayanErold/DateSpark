import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Ticket, MapPin, Calendar, Clock, ExternalLink,
    Loader2, Music, Zap, Trophy, Sparkles, ChevronRight,
    RefreshCw, Search
} from 'lucide-react';
import { Autocomplete } from '@react-google-maps/api';

const API_BASE = import.meta.env.VITE_API_URL || '';

const CATEGORIES = [
    { id: 'all',     label: 'All Events', emoji: '✨', color: 'from-violet-600 to-fuchsia-600' },
    { id: 'family',  label: 'Family',     emoji: '👨‍👩‍👧', color: 'from-sky-500 to-blue-600' },
    { id: 'community', label: 'Groups',   emoji: '🤝', color: 'from-orange-400 to-red-500' },
    { id: 'music',   label: 'Music',      emoji: '🎵', color: 'from-pink-500 to-rose-600' },
    { id: 'sports',  label: 'Sports',     emoji: '🏆', color: 'from-orange-500 to-amber-600' },
    { id: 'theater', label: 'Theater',    emoji: '🎭', color: 'from-emerald-500 to-teal-600' },
    { id: 'comedy',  label: 'Comedy',     emoji: '😂', color: 'from-yellow-500 to-orange-500' },
    { id: 'activities', label: 'Activities', emoji: '🎮', color: 'from-violet-500 to-purple-600' },
    { id: 'outdoors', label: 'Outdoors',  emoji: '🌳', color: 'from-emerald-500 to-green-600' },
    { id: 'food',    label: 'Food & Drink', emoji: '🍷', color: 'from-red-500 to-rose-500' },
    { id: 'festivals', label: 'Festivals', emoji: '🎪', color: 'from-amber-500 to-red-500' },
    { id: 'classes', label: 'Classes',    emoji: '🎨', color: 'from-indigo-500 to-purple-600' },
    { id: 'tech',    label: 'Tech',       emoji: '💻', color: 'from-cyan-500 to-blue-500' },
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
    if (!dateStr || dateStr === 'Invalid Date') return 'Date TBD';
    
    // If the input date string is already a formatted, human-readable date/time (e.g. "Thu, May 28, 7:30 PM")
    // we return it directly to preserve the beautiful presentation and prevent rendering glitches.
    if (dateStr.includes(',') || /[a-zA-Z]/.test(dateStr)) {
        return dateStr;
    }
    
    try {
        let cleanTime = timeStr || '00:00';
        if (cleanTime.split(':').length === 2) {
            cleanTime = `${cleanTime}:00`;
        }
        const d = new Date(`${dateStr}T${cleanTime}`);
        if (isNaN(d.getTime())) {
            return dateStr;
        }
        const dateLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        const timeLabel = timeStr ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '';
        return timeLabel ? `${dateLabel} · ${timeLabel}` : dateLabel;
    } catch (e) {
        return dateStr;
    }
};

const formatPrice = (min, max, currency) => {
    if (!min) return 'See tickets';
    const sym = currency === 'USD' ? '$' : currency;
    return max && max !== min ? `${sym}${Math.round(min)} – ${sym}${Math.round(max)}` : `From ${sym}${Math.round(min)}`;
};

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

// ─── SKELETON ────────────────────────────────────────────────────────────────
const EventSkeleton = ({ isDark }) => (
    <div className={`rounded-[1.5rem] overflow-hidden border animate-pulse ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-gray-100'}`}>
        <div className={`h-36 ${isDark ? 'bg-white/10' : 'bg-gray-100'}`} />
        <div className="p-4 space-y-2">
            <div className={`h-3 w-1/3 rounded-full ${isDark ? 'bg-white/10' : 'bg-gray-100'}`} />
            <div className={`h-5 w-4/5 rounded-full ${isDark ? 'bg-white/10' : 'bg-gray-100'}`} />
            <div className={`h-3 w-2/3 rounded-full ${isDark ? 'bg-white/10' : 'bg-gray-100'}`} />
        </div>
    </div>
);

// ─── EVENT CARD ──────────────────────────────────────────────────────────────
const EventCard = ({ evt, isDark, idx }) => {
    const color = segmentColor(evt.segment);
    const isCancelled = evt.status === 'cancelled';
    const imgUrl = getEventImage(evt);
    const isGstatic = imgUrl.includes('gstatic.com') || imgUrl.includes('googleusercontent.com');

    return (
        <motion.a
            href={evt.url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, transition: { delay: idx * 0.04 } }}
            whileHover={{ y: -4 }}
            className={`block rounded-[1.5rem] overflow-hidden border group transition-shadow hover:shadow-xl ${
                isDark ? 'bg-[#111827] border-white/8 hover:border-white/20' : 'bg-white border-gray-100 shadow-sm hover:shadow-md'
            } ${isCancelled ? 'opacity-50 pointer-events-none' : ''}`}
        >
            {/* Image Section */}
            <div className="relative h-40 overflow-hidden bg-black/10 flex items-center justify-center">
                {isGstatic ? (
                    <>
                        {/* Blurred Backdrop */}
                        <img
                            src={imgUrl}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover blur-xl opacity-60 scale-125 select-none pointer-events-none"
                        />
                        {/* Crisp contained foreground */}
                        <motion.img
                            src={imgUrl}
                            alt={evt.name}
                            whileHover={{ scale: 1.05 }}
                            transition={{ duration: 0.4 }}
                            className="h-full w-auto object-contain relative z-10 animate-fade-in"
                            onError={(e) => {
                                e.target.src = getEventImage({ ...evt, image: null });
                            }}
                        />
                    </>
                ) : (
                    <motion.img
                        src={imgUrl}
                        alt={evt.name}
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.6 }}
                        className="w-full h-full object-cover animate-fade-in"
                        onError={(e) => {
                            e.target.src = getEventImage({ ...evt, image: null });
                        }}
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                {/* Category badge */}
                <div className={`absolute top-3 left-3 bg-gradient-to-r ${color} text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest z-10 shadow-sm`}>
                    {evt.genre || evt.segment}
                </div>

                {/* Source Badge */}
                <div className={`absolute top-3 right-3 bg-black/40 backdrop-blur-md text-white/90 text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter border border-white/10 z-10 shadow-sm`}>
                    {evt.source === 'SeatGeek' ? 'SG' : evt.source === 'Local' ? 'Google' : 'TM'}
                </div>

                {/* Cancelled badge */}
                {isCancelled && (
                    <div className="absolute inset-0 bg-red-600/20 flex items-center justify-center backdrop-blur-[2px]">
                        <span className="bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-xl">
                            Cancelled
                        </span>
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="p-4">
                <h4 className={`font-black text-[15px] leading-tight line-clamp-2 mb-2 group-hover:text-violet-500 transition-colors ${isDark ? 'text-white' : 'text-navy'}`}>
                    {evt.name}
                </h4>
                {evt.venueName && (
                    <div className="flex items-center gap-1 mb-1">
                        <MapPin className="w-3 h-3 text-coral flex-shrink-0" />
                        <p className="text-xs text-gray-500 font-medium truncate">{evt.venueName}</p>
                    </div>
                )}
                <div className="flex items-center gap-1 mb-3">
                    <Calendar className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    <p className="text-xs text-gray-400 font-medium">{formatDate(evt.date, evt.time)}</p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between">
                    <span className={`text-xs font-black ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                        {formatPrice(evt.priceMin, evt.priceMax, evt.currency)}
                    </span>
                    <div className={`flex items-center gap-1 text-[10px] font-black px-3 py-1.5 rounded-full bg-gradient-to-r ${color} text-white group-hover:opacity-90 transition-opacity`}>
                        Get Tickets <ExternalLink className="w-2.5 h-2.5" />
                    </div>
                </div>
            </div>
        </motion.a>
    );
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
const EventsTab = ({ appTheme, userCity, setToastMessage }) => {
    const isDark = appTheme === 'dark';
    const [category, setCategory]   = useState('all');
    const [city, setCity]           = useState(userCity || 'New York');
    const [cityInput, setCityInput] = useState(userCity || 'New York');
    const [events, setEvents]       = useState([]);
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState(null);
    const [apiReady, setApiReady]   = useState(true);
    const [autocomplete, setAutocomplete] = useState(null);



    const onAutocompleteLoad = (autocompleteInstance) => {
        setAutocomplete(autocompleteInstance);
    };

    const onPlaceChanged = () => {
        if (autocomplete !== null) {
            const place = autocomplete.getPlace();
            if (place.address_components) {
                // Find city from address components
                const cityComp = place.address_components.find(c => 
                    c.types.includes('locality') || 
                    c.types.includes('administrative_area_level_1') ||
                    c.types.includes('administrative_area_level_2')
                );
                const cityName = cityComp?.long_name || place.name;
                if (cityName) {
                    setCityInput(cityName);
                    setCity(cityName);
                }
            } else if (place.name) {
                setCityInput(place.name);
                setCity(place.name);
            }
        }
    };

    const fetchEvents = useCallback(async (c = city, cat = category) => {
        setLoading(true);
        setError(null);
        
        // Ticketmaster/SeatGeek metro logic: boroughs & neighbors -> "New York"
        let searchCity = c;
        const metroKeywords = ['manhattan', 'brooklyn', 'queens', 'bronx', 'staten island', 'jersey city', 'hoboken'];
        if (metroKeywords.includes(c.toLowerCase())) {
            searchCity = 'New York';
        }

        try {
            const res = await fetch(`${API_BASE}/api/events?city=${encodeURIComponent(searchCity)}&category=${cat}&size=${cat === 'all' ? 100 : 100}`);
            if (res.status === 503) {
                setApiReady(false);
                setLoading(false);
                return;
            }
            if (!res.ok) throw new Error('Failed to load events');
            const data = await res.json();
            // Final safety check for unique IDs on frontend
            const uniqueData = Array.from(new Map(data.map(item => [item.id, item])).values());
            setEvents(uniqueData);
            setApiReady(true);
        } catch (e) {
            setError('Could not load events. Check your connection and try again.');
        } finally {
            setLoading(false);
        }
    }, [city, category]);

    useEffect(() => { fetchEvents(city, category); }, [city, category]);

    const handleCitySearch = (e) => {
        e.preventDefault();
        const trimmed = cityInput.trim();
        if (trimmed) { setCity(trimmed); }
    };

    // ─── API NOT CONFIGURED YET ───────────────────────────────────────────────
    if (!apiReady) return (
        <div className="pt-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg">
                    <Ticket className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h2 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-navy'}`}>Live Events</h2>
                    <p className={`text-sm ${isDark ? 'text-white/40' : 'text-gray-400'}`}>Concerts, sports & theater near you</p>
                </div>
            </div>
            <div className={`rounded-[2rem] p-8 text-center border ${isDark ? 'bg-violet-900/20 border-violet-500/20' : 'bg-violet-50 border-violet-100'}`}>
                <div className="w-16 h-16 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-xl">
                    <Zap className="w-8 h-8 text-white" />
                </div>
                <h3 className={`text-xl font-black mb-2 ${isDark ? 'text-white' : 'text-navy'}`}>Almost Live!</h3>
                <p className={`text-sm mb-6 max-w-xs mx-auto ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                    Add your Ticketmaster API key to <code className="font-mono bg-black/10 px-1 rounded">.env</code> as <code className="font-mono bg-black/10 px-1 rounded">TICKETMASTER_API_KEY</code> to see live events.
                </p>
                <a
                    href="https://developer.ticketmaster.com/products-and-docs/apis/getting-started/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-black rounded-2xl text-sm shadow-lg"
                >
                    Get API Key <ExternalLink className="w-4 h-4" />
                </a>
            </div>
        </div>
    );

    return (
        <div className="pt-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6 px-1">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/20 flex-shrink-0">
                    <Ticket className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h2 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-navy'}`}>Live Events</h2>
                    <p className={`text-sm font-medium ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
                        Real events near you — click any to get tickets
                    </p>
                </div>
            </div>

            {/* City Search */}
            <form onSubmit={handleCitySearch} className="mb-5">
                <div className={`flex items-center gap-2 rounded-2xl border px-4 py-3 transition-colors ${
                    isDark ? 'bg-white/5 border-white/10 focus-within:border-violet-500/40' : 'bg-white border-gray-200 shadow-sm focus-within:border-violet-300'
                }`}>
                    <MapPin className="w-4 h-4 text-coral flex-shrink-0" />
                    <Autocomplete
                        onLoad={onAutocompleteLoad}
                        onPlaceChanged={onPlaceChanged}
                        options={{ types: ['(cities)'] }}
                        className="flex-1"
                    >
                        <input
                            type="text"
                            value={cityInput}
                            onChange={e => setCityInput(e.target.value)}
                            placeholder="City (e.g. New York, Los Angeles)"
                            className={`w-full bg-transparent text-sm font-medium outline-none ${isDark ? 'text-white placeholder-white/30' : 'text-navy placeholder-gray-400'}`}
                        />
                    </Autocomplete>
                    <button type="submit" className="text-violet-500 hover:text-violet-400 transition-colors">
                        <Search className="w-4 h-4" />
                    </button>
                </div>
            </form>

            {/* Category pills */}
            <div className="flex gap-2 overflow-x-auto scrollbar-none pb-2 mb-6">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setCategory(cat.id)}
                        className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black transition-all ${
                            category === cat.id
                                ? `bg-gradient-to-r ${cat.color} text-white shadow-lg`
                                : isDark ? 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10' : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'
                        }`}
                    >
                        <span>{cat.emoji}</span> {cat.label}
                    </button>
                ))}
            </div>

            {/* Events Content */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => <EventSkeleton key={i} isDark={isDark} />)}
                </div>
            ) : error ? (
                <div className="text-center py-16">
                    <p className={`font-bold mb-4 ${isDark ? 'text-white/50' : 'text-gray-400'}`}>{error}</p>
                    <button
                        onClick={() => fetchEvents()}
                        className="flex items-center gap-2 mx-auto px-5 py-2.5 bg-violet-600 text-white font-black rounded-2xl text-sm"
                    >
                        <RefreshCw className="w-4 h-4" /> Try Again
                    </button>
                </div>
            ) : events.length === 0 ? (
                <div className="text-center py-16">
                    <Ticket className={`w-10 h-10 mx-auto mb-4 ${isDark ? 'text-white/20' : 'text-gray-200'}`} />
                    <p className={`font-black text-base mb-1 ${isDark ? 'text-white/50' : 'text-gray-400'}`}>No events found in {city}</p>
                    <p className={`text-sm ${isDark ? 'text-white/30' : 'text-gray-400'}`}>Try a different city or category</p>
                </div>
            ) : category === 'all' ? (
                (() => {
                    const renderedIds = new Set();
                    
                    return (
                        <div className="space-y-12">
                            {CATEGORIES.filter(c => c.id !== 'all').map(cat => {
                                const catEvents = events.filter(e => {
                                    if (renderedIds.has(e.id)) return false;
                                    
                                    const matches = e.segment?.toLowerCase() === cat.id || 
                                                    e.genre?.toLowerCase() === cat.id ||
                                                    (cat.id === 'theater' && e.segment === 'Arts & Theatre') ||
                                                    (cat.id === 'activities' && (
                                                        e.segment?.toLowerCase() === 'activity' || 
                                                        e.segment?.toLowerCase() === 'recreation' || 
                                                        e.genre?.toLowerCase() === 'recreation' ||
                                                        e.genre?.toLowerCase().includes('arcade') ||
                                                        e.genre?.toLowerCase().includes('bowling') ||
                                                        e.genre?.toLowerCase().includes('game')
                                                    )) ||
                                                    (cat.id === 'outdoors' && (
                                                        e.segment?.toLowerCase() === 'outdoor' || 
                                                        e.segment?.toLowerCase() === 'outdoors' || 
                                                        e.genre?.toLowerCase().includes('hiking') ||
                                                        e.genre?.toLowerCase().includes('park') ||
                                                        e.genre?.toLowerCase().includes('nature')
                                                    )) ||
                                                    (cat.id === 'food' && (
                                                        e.segment?.toLowerCase() === 'food' || 
                                                        e.genre?.toLowerCase().includes('food') ||
                                                        e.genre?.toLowerCase().includes('drink') ||
                                                        e.genre?.toLowerCase().includes('wine') ||
                                                        e.genre?.toLowerCase().includes('culinary')
                                                    )) ||
                                                    (cat.id === 'festivals' && (
                                                        e.segment?.toLowerCase() === 'festival' || 
                                                        e.genre?.toLowerCase().includes('festival') ||
                                                        e.genre?.toLowerCase().includes('fair') ||
                                                        e.genre?.toLowerCase().includes('expo')
                                                    ));
                                    
                                    if (matches) {
                                        renderedIds.add(e.id);
                                        return true;
                                    }
                                    return false;
                                });
                                
                                if (catEvents.length === 0) return null;

                                return (
                                    <div key={cat.id} className="space-y-4">
                                        <div className="flex items-center justify-between px-1">
                                            <h3 className={`text-xl font-black flex items-center gap-2 ${isDark ? 'text-white' : 'text-navy'}`}>
                                                <span className="text-2xl">{cat.emoji}</span>
                                                {cat.label}
                                            </h3>
                                            <button 
                                                onClick={() => setCategory(cat.id)}
                                                className="text-xs font-black text-violet-500 uppercase tracking-widest hover:underline"
                                            >
                                                View All
                                            </button>
                                        </div>
                                        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
                                            {catEvents.map((evt, idx) => (
                                                <div key={evt.id} className="min-w-[280px] sm:min-w-[320px] snap-start">
                                                    <EventCard evt={evt} isDark={isDark} idx={idx} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                            
                            {/* Catch-all for events that didn't match the main categories */}
                            {(() => {
                                const otherEvents = events.filter(e => !renderedIds.has(e.id));
                                
                                if (otherEvents.length === 0) return null;

                                return (
                                    <div className="space-y-4">
                                        <div className="px-1">
                                            <h3 className={`text-xl font-black ${isDark ? 'text-white' : 'text-navy'}`}>More Happenings</h3>
                                        </div>
                                        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
                                            {otherEvents.map((evt, idx) => (
                                                <div key={evt.id} className="min-w-[280px] sm:min-w-[320px] snap-start">
                                                    <EventCard evt={evt} isDark={isDark} idx={idx} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    );
                })()
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {events.map((evt, idx) => (
                        <EventCard key={evt.id} evt={evt} isDark={isDark} idx={idx} />
                    ))}
                </div>
            )}

            {/* Footer attribution */}
            {!loading && events.length > 0 && (
                <div className={`mt-10 flex flex-col items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-white/20' : 'text-gray-300'}`}>
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1"><Ticket className="w-2.5 h-2.5" /> Ticketmaster</span>
                        <span className="w-1 h-1 rounded-full bg-current opacity-50" />
                        <span className="flex items-center gap-1 font-bold text-sky-400">SeatGeek</span>
                    </div>
                    <p className="opacity-50">Verified Live Data</p>
                </div>
            )}
        </div>
    );
};

export default EventsTab;
