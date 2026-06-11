import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Ticket, MapPin, Calendar, ExternalLink, Sparkles, Search, RefreshCw } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

const QUICK_CITIES = ['New York', 'Los Angeles', 'Chicago', 'Miami', 'San Francisco'];

const MOCK_EVENTS = [
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

const NearbyEvents = () => {
    const navigate = useNavigate();
    const [city, setCity] = useState('New York');
    const [cityInput, setCityInput] = useState('New York');
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchLocalEvents = async (searchCity) => {
        setIsLoading(true);
        // Map boroughs to metro center for Ticketmaster compatibility
        let queryCity = searchCity;
        const metroKeywords = ['manhattan', 'brooklyn', 'queens', 'bronx', 'staten island', 'jersey city', 'hoboken'];
        if (metroKeywords.includes(searchCity.toLowerCase())) {
            queryCity = 'New York';
        }

        try {
            const res = await axios.get(`${API_URL}/api/events?city=${encodeURIComponent(queryCity)}&category=all`);
            if (res.data && res.data.length > 0) {
                // De-duplicate by id
                const unique = Array.from(new Map(res.data.map(item => [item.id, item])).values());
                setEvents(unique.slice(0, 8));
            } else {
                setEvents(MOCK_EVENTS);
            }
        } catch (e) {
            console.warn('[NearbyEvents] Failed to fetch events, falling back to mock events:', e);
            setEvents(MOCK_EVENTS);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLocalEvents(city);
    }, [city]);

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

                {/* Events Grid */}
                {isLoading ? (
                    <div className="flex md:grid md:grid-cols-2 lg:grid-cols-4 gap-6 overflow-x-auto md:overflow-visible pb-4 md:pb-0 snap-x snap-mandatory scrollbar-hide">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="bg-slate-50 border border-slate-100 rounded-[2rem] h-[360px] animate-pulse shadow-sm w-[280px] sm:w-[320px] md:w-auto flex-shrink-0 snap-start" />
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
                                    className="bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between group w-[280px] sm:w-[320px] md:w-auto flex-shrink-0 snap-start"
                                >
                                    {/* Image */}
                                    <div className="relative h-44 overflow-hidden bg-navy/5">
                                        {evt.image ? (
                                            <img
                                                src={evt.image}
                                                alt={evt.name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.parentElement.classList.add('bg-gradient-to-br', 'from-navy', 'to-coral/20');
                                                }}
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-navy to-coral/20 flex flex-col items-center justify-center p-6 text-center gap-3">
                                                <Ticket className="w-10 h-10 text-white/20" />
                                                <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">Live Event</span>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                        
                                        {/* Category Badge */}
                                        <div className={`absolute top-4 left-4 bg-gradient-to-r ${color} text-white text-[8px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider shadow-sm`}>
                                            {evt.genre || evt.segment}
                                        </div>

                                        {/* Source Badge */}
                                        <div className="absolute top-4 right-4 bg-black/45 backdrop-blur-md text-white/90 text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter border border-white/10 shadow-sm">
                                            {evt.source === 'SeatGeek' ? 'SeatGeek' : 'Ticketmaster'}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-5 flex-1 flex flex-col justify-between">
                                        <div className="space-y-2.5 mb-4">
                                            <h4 className="font-black text-sm text-navy leading-tight line-clamp-2 group-hover:text-coral transition-colors">
                                                {evt.name}
                                            </h4>
                                            
                                            {evt.venueName && (
                                                <div className="flex items-center gap-1.5 text-xs text-gray-500 font-bold">
                                                    <MapPin className="w-3.5 h-3.5 text-coral flex-shrink-0" />
                                                    <span className="truncate">{evt.venueName}</span>
                                                </div>
                                            )}

                                            <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                                                <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                                                <span>{formatDate(evt.date, evt.time)}</span>
                                            </div>
                                        </div>

                                        <div className="space-y-3 pt-2 border-t border-gray-50">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-bold text-gray-400">Price Range</span>
                                                <span className="font-black text-navy">{formatPrice(evt.priceMin, evt.priceMax, evt.currency)}</span>
                                            </div>
                                            
                                            <button className="w-full py-3 bg-gray-50 text-navy border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest group-hover:bg-navy group-hover:text-white group-hover:border-navy transition-all flex items-center justify-center gap-2">
                                                Get Tickets <ExternalLink className="w-3 h-3" />
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
