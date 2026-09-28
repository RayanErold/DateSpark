import React, { useState, useEffect, useCallback } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import {
    Ticket, MapPin, Calendar, Clock, ExternalLink,
    Loader2, Music, Zap, Trophy, Sparkles, ChevronRight,
    RefreshCw, Search
} from 'lucide-react';
import { Autocomplete } from '@react-google-maps/api';

const API_BASE = import.meta.env.VITE_API_URL || '';

const CATEGORIES = [
    { id: 'all',       label: 'All Events',   emoji: '✨', color: 'from-violet-600 to-fuchsia-600' },
    { id: 'music',     label: 'Music',        emoji: '🎵', color: 'from-pink-500 to-rose-600' },
    { id: 'sports',    label: 'Sports',       emoji: '🏆', color: 'from-orange-500 to-amber-600' },
    { id: 'theater',   label: 'Theater',      emoji: '🎭', color: 'from-emerald-500 to-teal-600' },
    { id: 'comedy',    label: 'Comedy',       emoji: '😂', color: 'from-yellow-500 to-orange-500' },
    { id: 'food',      label: 'Food & Drink', emoji: '🍷', color: 'from-red-500 to-rose-500' },
    { id: 'tech',      label: 'Tech Events',  emoji: '💻', color: 'from-blue-500 to-indigo-600' },
    { id: 'outdoors',  label: 'Outdoors',     emoji: '🌲', color: 'from-emerald-500 to-green-600' },
    { id: 'classes',   label: 'Classes',      emoji: '🎓', color: 'from-purple-500 to-indigo-600' },
    { id: 'community', label: 'Community',    emoji: '🤝', color: 'from-orange-400 to-red-500' },
];

const POPULAR_CITIES = [
    { name: 'Miami', label: 'Miami, FL', icon: '🏖️' },
    { name: 'San Francisco', label: 'San Francisco, CA', icon: '🌉' },
    { name: 'Las Vegas', label: 'Las Vegas, NV', icon: '🎰' },
    { name: 'New York', label: 'New York, NY', icon: '🗽' },
    { name: 'Los Angeles', label: 'Los Angeles, CA', icon: '🎬' },
    { name: 'Chicago', label: 'Chicago, IL', icon: '🏙️' },
    { name: 'Austin', label: 'Austin, TX', icon: '🎸' },
    { name: 'London', label: 'London, UK', icon: '🎡' },
    { name: 'Paris', label: 'Paris, FR', icon: '🥐' },
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

const _formatDate = (dateStr, timeStr) => {
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
    } catch {
        return dateStr;
    }
};

const formatPrice = (min, max, currency) => {
    if (!min) return 'See tickets';
    const sym = currency === 'USD' ? '$' : currency;
    return max && max !== min ? `${sym}${Math.round(min)} – ${sym}${Math.round(max)}` : `From ${sym}${Math.round(min)}`;
};

const getCategoryIcon = (seg) => {
    const s = (seg || '').toLowerCase();
    if (s.includes('music') || s.includes('concert')) return <Music className="w-8 h-8 text-white/90" />;
    if (s.includes('sport') || s.includes('athletic')) return <Trophy className="w-8 h-8 text-white/90" />;
    if (s.includes('theat') || s.includes('art')) return <Sparkles className="w-8 h-8 text-white/90" />;
    if (s.includes('tech') || s.includes('code')) return <Zap className="w-8 h-8 text-white/90" />;
    return <Ticket className="w-8 h-8 text-white/90" />;
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
    const [imgFailed, setImgFailed] = useState(false);

    const isValidImage = (url) => {
        if (!url || typeof url !== 'string' || url.trim() === '') return false;
        if (url.includes('unsplash.com')) return false;
        if (url.includes('google.com/maps') || url.includes('maps.googleapis.com') || url.includes('staticmap') || url.includes('/maps/vt/')) return false;
        return true;
    };

    const hasPhoto = isValidImage(evt.image) && !imgFailed;

    return (
        <motion.a
            href={evt.url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, transition: { delay: idx * 0.04 } }}
            whileHover={{ y: -4 }}
            className={`block rounded-[2rem] overflow-hidden border group transition-all duration-500 hover:shadow-xl hover:-translate-y-1.5 p-3 ${
                isDark ? 'bg-[#111827] border-white/8 hover:border-white/20 text-white' : 'bg-white border-slate-100 text-navy shadow-sm'
            } ${isCancelled ? 'opacity-50 pointer-events-none' : ''}`}
        >
            {/* Image Section or Authentic Venue Pass */}
            <div className="relative aspect-[16/10] sm:aspect-[16/9] rounded-2xl overflow-hidden bg-slate-900/5 mb-3 shadow-inner">
                {hasPhoto ? (
                    <motion.img
                        src={evt.image}
                        alt={evt.name}
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.6 }}
                        className="w-full h-full object-cover animate-fade-in"
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

                {/* Cancelled badge */}
                {isCancelled && (
                    <div className="absolute inset-0 bg-red-600/20 flex items-center justify-center backdrop-blur-[2px]">
                        <span className="bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-xl">
                            Cancelled
                        </span>
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
                <h4 className={`font-black text-sm leading-snug line-clamp-1 mb-1 group-hover:text-rose transition-colors ${isDark ? 'text-white' : 'text-navy'}`}>
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
                    <span className={`text-[11px] font-black ${isDark ? 'text-white/60' : 'text-slate-500'}`}>
                        {formatPrice(evt.priceMin, evt.priceMax, evt.currency)}
                    </span>
                    <div className={`flex items-center gap-1 text-[9px] font-black px-3 py-1.5 rounded-full bg-gradient-to-r ${color} text-white group-hover:opacity-90 transition-opacity`}>
                        Get Tickets <ExternalLink className="w-2.5 h-2.5" />
                    </div>
                </div>
            </div>
        </motion.a>
    );
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
const EventsTab = ({ appTheme, userCity }) => {
    const isDark = appTheme === 'dark';
    const [category, setCategory]   = useState('all');
    const [city, setCity]           = useState(userCity || 'New York');
    const [cityInput, setCityInput] = useState(userCity || 'New York');
    const [events, setEvents]       = useState([]);
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState(null);
    const [apiReady, setApiReady]   = useState(true);
    const [autocomplete, setAutocomplete] = useState(null);
    const [dateFilter, setDateFilter] = useState('all');
    const [keywordInput, setKeywordInput] = useState('');
    const [showCityDropdown, setShowCityDropdown] = useState(false);
    const [appliedKeyword, setAppliedKeyword] = useState('');



    const onAutocompleteLoad = (autocompleteInstance) => {
        setAutocomplete(autocompleteInstance);
    };

    const onPlaceChanged = () => {
        if (autocomplete !== null) {
            const place = autocomplete.getPlace();
            if (place.address_components) {
                // Find sublocality first (for boroughs like Manhattan, Queens, Brooklyn) then locality (city)
                const cityComp = place.address_components.find(c => 
                    c.types.includes('sublocality_level_1')
                ) || place.address_components.find(c => 
                    c.types.includes('locality')
                ) || place.address_components.find(c =>
                    c.types.includes('administrative_area_level_1') ||
                    c.types.includes('administrative_area_level_2')
                );
                const cityName = cityComp?.long_name || place.name;
                
                const stateComp = place.address_components.find(c => c.types.includes('administrative_area_level_1'));
                const countryComp = place.address_components.find(c => c.types.includes('country'));
                
                let fullLocationName = cityName;
                if (stateComp && stateComp.short_name !== cityName) {
                    fullLocationName += `, ${stateComp.short_name}`;
                }
                if (countryComp && countryComp.long_name !== cityName) {
                    fullLocationName += `, ${countryComp.long_name}`;
                }
                
                if (cityName) {
                    setCityInput(cityName);
                    setCity(fullLocationName);
                }
            } else if (place.name) {
                setCityInput(place.name);
                setCity(place.name);
            }
        }
    };

    const fetchEvents = useCallback(async (c = city, cat = category, kw = appliedKeyword, forceRefresh = false) => {
        setLoading(true);
        setError(null);
        
        // Ticketmaster/SeatGeek metro logic: boroughs & neighbors -> "New York"
        let searchCity = c;
        const metroKeywords = ['manhattan', 'brooklyn', 'queens', 'bronx', 'staten island', 'jersey city', 'hoboken'];
        const normalizedC = c.toLowerCase().trim();
        const isBoroughOfNYC = metroKeywords.some(keyword => {
            if (normalizedC === keyword) return true;
            if (normalizedC.startsWith(keyword + ',') || normalizedC.startsWith(keyword + ' ')) {
                // Check if it's a NY/USA local area (excludes Manhattan Beach CA, etc.)
                return normalizedC.includes('ny') || normalizedC.includes('new york') || normalizedC.includes('usa') || normalizedC.includes('united states') || !normalizedC.includes(',');
            }
            return false;
        });
        
        if (isBoroughOfNYC) {
            searchCity = 'New York';
        }

        try {
            let url = `${API_BASE}/api/events?city=${encodeURIComponent(searchCity)}&category=${cat}&size=${cat === 'all' ? 100 : 100}`;
            if (kw) {
                url += `&keyword=${encodeURIComponent(kw)}`;
            }
            if (forceRefresh) {
                url += `&refresh=true`;
            }
            const res = await fetch(url);
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
        } catch {
            setError('Could not load events. Check your connection and try again.');
        } finally {
            setLoading(false);
        }
    }, [city, category, appliedKeyword]);

    useEffect(() => { 
        fetchEvents(city, category, appliedKeyword); 
    }, [city, category, appliedKeyword, fetchEvents]);

    const handleRefreshEvents = () => {
        fetchEvents(city, category, appliedKeyword, true);
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

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        const trimmed = cityInput.trim();
        if (trimmed && trimmed.toLowerCase() !== city.toLowerCase()) {
            setCity(trimmed);
        }
        setAppliedKeyword(keywordInput);
    };

    const filteredEvents = events.filter(e => {
        // 1. Keyword search match (appliedKeyword)
        if (appliedKeyword) {
            const kw = appliedKeyword.toLowerCase().trim();
            const nameMatches = (e.name || '').toLowerCase().includes(kw);
            const venueMatches = (e.venueName || '').toLowerCase().includes(kw);
            const genreMatches = (e.genre || '').toLowerCase().includes(kw);
            const segmentMatches = (e.segment || '').toLowerCase().includes(kw);
            if (!nameMatches && !venueMatches && !genreMatches && !segmentMatches) {
                return false;
            }
        }

        // 2. Date match (dateFilter)
        if (dateFilter && dateFilter !== 'all') {
            const eventDateStr = e.date;
            if (!eventDateStr) return false;
            
            const eventDate = new Date(eventDateStr);
            const today = new Date();
            
            // Normalize dates to midnight for clean comparison
            const getMidnight = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
            const evMidnight = getMidnight(eventDate);
            const tdMidnight = getMidnight(today);
            
            const diffTime = evMidnight.getTime() - tdMidnight.getTime();
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
            
            if (dateFilter === 'today') {
                if (diffDays !== 0) return false;
            } else if (dateFilter === 'tomorrow') {
                if (diffDays !== 1) return false;
            } else if (dateFilter === 'weekend') {
                const day = eventDate.getDay();
                if (day !== 0 && day !== 5 && day !== 6) return false;
                if (diffDays < -1 || diffDays > 6) return false;
            } else if (dateFilter === 'week') {
                if (diffDays < 0 || diffDays > 7) return false;
            } else if (dateFilter === 'next_week') {
                if (diffDays < 8 || diffDays > 14) return false;
            }
        }
        
        return true;
    });

    return (
        <div className="pt-6 max-w-4xl mx-auto font-outfit">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 px-1">
                <div className="flex items-center gap-4">
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
                <button
                    type="button"
                    onClick={handleRefreshEvents}
                    disabled={loading}
                    className={`p-2.5 rounded-2xl border transition-all duration-300 flex items-center justify-center ${
                        isDark 
                            ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white/80 hover:text-white' 
                            : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-navy'
                    } disabled:opacity-50`}
                    title="Refresh events"
                >
                    <RefreshCw className={`w-4.5 h-4.5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Premium Ticketmaster-style unified search bar layout */}
            <form onSubmit={handleSearchSubmit} className="mb-4 px-1">
                <div className={`flex flex-col md:flex-row items-stretch rounded-3xl border shadow-sm bg-white transition-all relative ${
                    isDark ? 'border-white/10 bg-white/5 focus-within:border-violet-500/40' : 'border-gray-200 bg-white focus-within:border-violet-300'
                }`}>
                    {/* Location Segment */}
                    <div className="flex-1 flex items-center gap-3 px-5 py-3 border-b md:border-b-0 md:border-r border-gray-100/50 relative">
                        <MapPin className="w-5 h-5 text-coral flex-shrink-0" />
                        <div className="flex-1 flex flex-col items-start w-full">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Location</span>
                            <Autocomplete
                                onLoad={onAutocompleteLoad}
                                onPlaceChanged={onPlaceChanged}
                                options={{ types: ['(regions)'] }}
                                className="w-full"
                            >
                                <input
                                    type="text"
                                    value={cityInput}
                                    onChange={e => setCityInput(e.target.value)}
                                    onFocus={() => setShowCityDropdown(true)}
                                    onBlur={() => setTimeout(() => setShowCityDropdown(false), 200)}
                                    placeholder="City or Zip Code"
                                    className={`w-full bg-transparent text-xs font-bold outline-none border-none p-0 mt-0.5 ${
                                        isDark ? 'text-white placeholder-white/30' : 'text-navy placeholder-slate-400'
                                    }`}
                                />
                            </Autocomplete>
                        </div>

                        {/* Quick Location Dropdown Menu */}
                        {showCityDropdown && (
                            <div className={`absolute top-full left-0 mt-2 w-72 rounded-2xl border shadow-2xl z-50 overflow-hidden backdrop-blur-xl ${
                                isDark ? 'bg-slate-900/95 border-white/15 text-white' : 'bg-white border-slate-200 text-navy'
                            }`}>
                                <div className="p-2.5 border-b border-slate-100 dark:border-white/10 flex items-center justify-between bg-slate-50/50 dark:bg-white/5">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2 flex items-center gap-1">
                                        <MapPin className="w-3 h-3 text-coral" /> Popular Destinations
                                    </span>
                                    <span className="text-[10px] font-bold text-coral px-2">1-Click</span>
                                </div>
                                <div className="max-h-60 overflow-y-auto py-1">
                                    {POPULAR_CITIES.map((c) => (
                                        <button
                                            key={c.name}
                                            type="button"
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                setCityInput(c.name);
                                                setCity(c.name);
                                                setShowCityDropdown(false);
                                            }}
                                            className={`w-full text-left px-3.5 py-2.5 text-xs font-bold flex items-center justify-between transition-all hover:bg-violet-500/10 cursor-pointer ${
                                                city.toLowerCase().includes(c.name.toLowerCase()) || cityInput.toLowerCase().includes(c.name.toLowerCase())
                                                    ? 'text-coral font-black bg-coral/5'
                                                    : isDark ? 'text-white/80 hover:text-white' : 'text-navy'
                                            }`}
                                        >
                                            <span className="flex items-center gap-2">
                                                <span className="text-base">{c.icon}</span> {c.label}
                                            </span>
                                            <ChevronRight className="w-3.5 h-3.5 opacity-40" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Dates Segment */}
                    <div className="flex-1 flex items-center gap-3 px-5 py-3 border-b md:border-b-0 md:border-r border-gray-100/50">
                        <Calendar className="w-5 h-5 text-violet-500 flex-shrink-0" />
                        <div className="flex-1 flex flex-col items-start w-full">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Dates</span>
                            <select
                                value={dateFilter}
                                onChange={e => setDateFilter(e.target.value)}
                                className={`w-full bg-transparent text-xs font-bold outline-none border-none p-0 mt-0.5 cursor-pointer appearance-none ${
                                    isDark ? 'text-white bg-navy' : 'text-navy bg-white'
                                }`}
                            >
                                <option value="all">All Dates</option>
                                <option value="today">Today</option>
                                <option value="tomorrow">Tomorrow</option>
                                <option value="weekend">This Weekend</option>
                                <option value="week">This Week</option>
                                <option value="next_week">Next Week</option>
                            </select>
                        </div>
                    </div>

                    {/* Search / Keyword Segment */}
                    <div className="flex-[1.5] flex items-center gap-3 px-5 py-3 relative">
                        <Search className="w-5 h-5 text-blue-500 flex-shrink-0" />
                        <div className="flex-1 flex flex-col items-start w-full pr-24">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Search</span>
                            <input
                                type="text"
                                value={keywordInput}
                                onChange={e => setKeywordInput(e.target.value)}
                                placeholder="Artist, Event or Venue"
                                className={`w-full bg-transparent text-xs font-bold outline-none border-none p-0 mt-0.5 ${
                                    isDark ? 'text-white placeholder-white/30' : 'text-navy placeholder-slate-400'
                                }`}
                            />
                        </div>
                        <button
                            type="submit"
                            className="absolute right-3 top-1/2 -translate-y-1/2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                        >
                            Search
                        </button>
                    </div>
                </div>
            </form>

            {/* Quick Destination Cities Pills */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2 mb-6 px-1 w-full">
                <span className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1 shrink-0 ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
                    <MapPin className="w-3 h-3 text-coral" /> Quick Cities:
                </span>
                {POPULAR_CITIES.map((c) => {
                    const isActive = city.toLowerCase().includes(c.name.toLowerCase()) || cityInput.toLowerCase().includes(c.name.toLowerCase());
                    return (
                        <button
                            type="button"
                            key={c.name}
                            onClick={() => {
                                setCityInput(c.name);
                                setCity(c.name);
                                setShowCityDropdown(false);
                            }}
                            className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border shrink-0 active:scale-95 cursor-pointer ${
                                isActive
                                    ? 'bg-gradient-to-r from-coral to-rose-500 border-transparent text-white shadow-md shadow-coral/20 font-black'
                                    : isDark
                                        ? 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:border-white/20'
                                        : 'bg-white text-navy border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                        >
                            <span>{c.icon}</span> {c.name}
                        </button>
                    );
                })}
            </div>

            {/* Category pills */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-6 px-1 w-full">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setCategory(cat.id)}
                        className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black transition-all border shrink-0 ${
                            category === cat.id
                                ? `bg-gradient-to-r ${cat.color} border-transparent text-white shadow-lg`
                                : isDark ? 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
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
            ) : filteredEvents.length === 0 ? (
                <div className="text-center py-16">
                    <Ticket className={`w-10 h-10 mx-auto mb-4 ${isDark ? 'text-white/20' : 'text-gray-200'}`} />
                    <p className={`font-black text-base mb-1 ${isDark ? 'text-white/50' : 'text-gray-400'}`}>
                        {appliedKeyword || dateFilter !== 'all' ? 'No matching events found' : `No events found in ${city}`}
                    </p>
                    <p className={`text-sm ${isDark ? 'text-white/30' : 'text-gray-400'}`}>
                        {appliedKeyword || dateFilter !== 'all' ? 'Try adjusting your search filters or tags.' : 'Try a different city or category'}
                    </p>
                    {(appliedKeyword || dateFilter !== 'all') && (
                        <button
                            onClick={() => {
                                setKeywordInput('');
                                setAppliedKeyword('');
                                setDateFilter('all');
                            }}
                            className="mt-4 inline-flex items-center gap-2 px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-md"
                        >
                            Reset Filters
                        </button>
                    )}
                </div>
            ) : category === 'all' ? (
                (() => {
                    const renderedIds = new Set();
                    
                    return (
                        <div className="space-y-12">
                            {CATEGORIES.filter(c => c.id !== 'all').map(cat => {
                                const catEvents = filteredEvents.filter(e => {
                                    if (renderedIds.has(e.id)) return false;
                                    
                                    const matches = e.segment?.toLowerCase() === cat.id || 
                                                    e.genre?.toLowerCase() === cat.id ||
                                                    (cat.id === 'theater' && e.segment === 'Arts & Theatre') ||
                                                    (cat.id === 'food' && (
                                                        e.segment?.toLowerCase() === 'food' || 
                                                        e.genre?.toLowerCase().includes('food') ||
                                                        e.genre?.toLowerCase().includes('drink') ||
                                                        e.genre?.toLowerCase().includes('wine') ||
                                                        e.genre?.toLowerCase().includes('culinary')
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
                                        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory w-full">
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
                                const otherEvents = filteredEvents.filter(e => !renderedIds.has(e.id));
                                
                                if (otherEvents.length === 0) return null;

                                return (
                                    <div className="space-y-4">
                                        <div className="px-1">
                                            <h3 className={`text-xl font-black ${isDark ? 'text-white' : 'text-navy'}`}>More Happenings</h3>
                                        </div>
                                        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory w-full">
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
                    {filteredEvents.map((evt, idx) => (
                        <EventCard key={evt.id} evt={evt} isDark={isDark} idx={idx} />
                    ))}
                </div>
            )}

            {/* Footer attribution */}
            {!loading && filteredEvents.length > 0 && (
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
