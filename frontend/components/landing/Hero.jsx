import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bot, Flame, Music, MapPin, Calendar, Clock, DollarSign, ArrowRight, Play, Heart, Ticket, Share2, Wallet, CheckCircle, X, Star, Map as MapIcon, Utensils, Compass, Car, Search, Sparkles, Navigation, Loader2 } from 'lucide-react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { motion, AnimatePresence } from 'framer-motion';

const DEMO_PLAN = {
    vibe: 'Boutique Romantic',
    location: 'West Village, NYC',
    date: 'Friday Evening',
    itinerary: [
        {
            id: 1,
            time: '4:30 PM',
            activity: 'SCENIC STROLL',
            venue: 'The High Line',
            description: 'Kickoff the date by taking in iconic NYC scenery along this elevated park. Rating: 4.8 ⭐. Price: Free. Breathtaking skyline and nature paths.',
            photoUrl: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80',
            lat: 40.7480, lng: -74.0048,
            rating: 4.8, reviews: 145102, price: 'Free',
            directionsUrl: '#', bookingUrl: '#', bookingType: 'tickets'
        },
        {
            id: 2,
            time: '6:00 PM',
            activity: 'COCKTAILS & VIEWS',
            venue: 'The Standard High Line',
            description: 'Elevated craft cocktails with sweeping sunset views of the Hudson River. Rating: 4.4 ⭐.',
            photoUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800&q=80',
            lat: 40.7408, lng: -74.0080,
            rating: 4.4, reviews: 10450, price: '$$$$',
            directionsUrl: '#'
        },
        {
            id: 3,
            time: '7:45 PM',
            activity: 'INTIMATE DINNER',
            venue: 'L\'Artusi',
            description: 'A bustling, multi-level space serving incredible upscale Italian small plates. Rating: 4.7 ⭐.',
            photoUrl: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=800&q=80',
            lat: 40.7335, lng: -74.0050,
            rating: 4.7, reviews: 4120, price: '$$$',
            directionsUrl: '#', bookingUrl: '#', bookingType: 'opentable'
        }
    ]
};
const customMapStyle = [
    { "featureType": "all", "elementType": "geometry.stroke", "stylers": [{ "color": "#e8e8e8" }] },
    { "featureType": "landscape", "elementType": "geometry.fill", "stylers": [{ "color": "#fafafa" }] },
    { "featureType": "poi", "elementType": "all", "stylers": [{ "visibility": "off" }] },
    { "featureType": "road", "elementType": "geometry.fill", "stylers": [{ "color": "#ffffff" }] },
    { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#888888" }] },
    { "featureType": "road.highway", "elementType": "geometry.fill", "stylers": [{ "color": "#f0f0f0" }] },
    { "featureType": "transit", "elementType": "all", "stylers": [{ "visibility": "off" }] },
    { "featureType": "water", "elementType": "geometry.fill", "stylers": [{ "color": "#e2e8f0" }] }
];

const Hero = () => {
    const [showDemoModal, setShowDemoModal] = useState(false);
    const [showMapMobile, setShowMapMobile] = useState(false);
    const [demoItinerary, setDemoItinerary] = useState(DEMO_PLAN.itinerary);
    const [mapCenter, setMapCenter] = useState({ lat: 40.7380, lng: -74.0048 });
    const [selectedMarkerId, setSelectedMarkerId] = useState(1);
    const [showFirstPlan, setShowFirstPlan] = useState(false);
    const [shareTooltip, setShareTooltip] = useState(false);
    const [activeFeature, setActiveFeature] = useState('itinerary');
    const [isSwappingId, setIsSwappingId] = useState(null);
    const [mockToast, setMockToast] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const navigate = useNavigate();

    const triggerToast = (msg) => {
        setMockToast(msg);
        setTimeout(() => setMockToast(null), 3000);
    };

    useEffect(() => {
        if (!searchQuery.trim()) {
            setShowResults(false);
            setSearchResults([]);
            return;
        }

        const delayDebounceFn = setTimeout(() => {
            const fetchResults = async () => {
                setIsSearching(true);
                setShowResults(true);
                try {
                    const res = await fetch(`http://localhost:5000/api/search?q=${encodeURIComponent(searchQuery)}`);
                    const data = await res.json();
                    setSearchResults(data);
                } catch (err) {
                    console.error("Search failed", err);
                    setSearchResults([]);
                } finally {
                    setIsSearching(false);
                }
            };
            fetchResults();
        }, 400);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const handleSearch = () => {
        // Now handled by useEffect, but keep the function reference for the button/enter key just to trigger visual focus or manual override
        if (!searchQuery.trim()) return;
        setShowResults(true);
    };

    const handleStepInteraction = (step) => {
        setMapCenter({ lat: step.lat, lng: step.lng });
        setSelectedMarkerId(step.id);
    };

    const handleSwitchUp = (stepId, e) => {
        e.stopPropagation();
        setIsSwappingId(stepId);

        // Simulate AI Latency
        setTimeout(() => {
            setDemoItinerary(prev => prev.map(step => {
                if (step.id === stepId) {
                    // Realistic switch for the High Line to something else nearby
                    if (stepId === 1) {
                        return {
                            ...step,
                            venue: step.venue === 'The High Line' ? 'Chelsea Market' : 'The High Line',
                            activity: step.venue === 'The High Line' ? 'ARTISAN BITES' : 'SCENIC STROLL',
                            description: step.venue === 'The High Line'
                                ? 'Indoor urban food court and shopping mall. Perfect for casual evening wandering.'
                                : 'Kickoff the date by taking in iconic NYC scenery along this elevated park.',
                            photoUrl: step.venue === 'The High Line' ? 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80' : 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80',
                            lat: step.venue === 'The High Line' ? 40.7420 : 40.7480,
                            lng: step.venue === 'The High Line' ? -74.0048 : -74.0048,
                        };
                    }
                    if (stepId === 2) {
                        return {
                            ...step,
                            venue: step.venue === 'The Standard High Line' ? 'Bar Pisellino' : 'The Standard High Line',
                            activity: step.venue === 'The Standard High Line' ? 'ITALIAN APERITIVO' : 'COCKTAILS & VIEWS',
                            description: step.venue === 'The Standard High Line'
                                ? 'A bustling Italian espresso & cocktail bar with a fantastic street-side patio vibe.'
                                : 'Elevated craft cocktails with sweeping sunset views of the Hudson River.',
                            photoUrl: step.venue === 'The Standard High Line' ? 'https://images.unsplash.com/photo-1560624052-449f5ddf0c31?w=800&q=80' : 'https://images.unsplash.com/photo-1514362545857-3bc16c4f0d1e?w=800&q=80',
                            lat: step.venue === 'The Standard High Line' ? 40.7335 : 40.7408,
                            lng: step.venue === 'The Standard High Line' ? -74.0020 : -74.0080,
                        };
                    }
                    // Switch for L'Artusi to Boucherie
                    if (stepId === 3) {
                        return {
                            ...step,
                            venue: step.venue === 'L\'Artusi' ? 'Boucherie West Village' : 'L\'Artusi',
                            activity: step.venue === 'L\'Artusi' ? 'FRENCH BRASSERIE' : 'INTIMATE DINNER',
                            description: step.venue === 'L\'Artusi'
                                ? 'A sprawling traditional French brasserie known for impeccable steak frites and wine.'
                                : 'A bustling, multi-level space serving incredible upscale Italian small plates.',
                            photoUrl: step.venue === 'L\'Artusi' ? 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&q=80' : 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=800&q=80',
                        };
                    }
                }
                return step;
            }));

            // Also update map to the new marker location
            setMapCenter(prev => {
                const updatedStep = demoItinerary.find(s => s.id === stepId);
                return prev;
            });
            setIsSwappingId(null);
            triggerToast("AI swapped venue based on vibe!");
        }, 1200);
    };

    const libraries = React.useMemo(() => ['places'], []);
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
        libraries: libraries
    });

    const features = [
        { id: 'itinerary', icon: <Ticket className="w-5 h-5" />, label: 'Itinerary', comingSoon: false },
        { id: 'share', icon: <Share2 className="w-5 h-5" />, label: 'Share', comingSoon: false },
    ];

    return (
        <>
            <section className="relative min-h-[95vh] flex flex-col justify-center pt-32 pb-20 overflow-hidden bg-[#0a0f1c]">
                {/* Deep Rich Background Decor */}
                <div className="absolute top-0 right-0 -z-10 w-full h-[800px] bg-gradient-to-b from-[#1a103c]/80 via-[#0a0f1c] to-[#0a0f1c] opacity-80" />
                <div className="absolute top-[-20%] left-[-10%] -z-10 w-[800px] h-[800px] bg-coral/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[10%] right-[-10%] -z-10 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[100px]" />
                <div className="absolute inset-0 -z-10 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-[0.05]" />

                {/* Global Toast */}
                <AnimatePresence>
                    {mockToast && (
                        <motion.div
                            initial={{ opacity: 0, y: 20, x: '-50%' }}
                            animate={{ opacity: 1, y: 0, x: '-50%' }}
                            exit={{ opacity: 0, y: 20, x: '-50%' }}
                            className="fixed bottom-10 left-1/2 z-[100] bg-navy text-white px-6 py-3 rounded-full shadow-2xl tracking-wide font-black text-xs flex items-center justify-center gap-2 w-max border border-white/10"
                        >
                            <Sparkles className="w-4 h-4 text-gold" />
                            {mockToast}
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="container-custom relative z-10 w-full flex flex-col items-center">

                    {/* 1. Hero Text */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, type: 'spring' }}
                        className="text-center space-y-6 max-w-4xl mx-auto mb-10"
                    >
                        <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight leading-[1.1]">
                            Find your perfect <span className="text-transparent bg-clip-text bg-gradient-to-r from-coral to-violet-400">vibe.</span>
                        </h1>
                        <p className="text-xl text-gray-400 font-medium">
                            Search millions of trending spots, or let Sparky curate an unforgettable itinerary for you.
                        </p>
                    </motion.div>

                    {/* 2. Global Search Bar */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.1, type: 'spring' }}
                        className="w-full max-w-3xl relative z-50 mb-16"
                    >
                        <div className="flex flex-col sm:flex-row items-center bg-white/10 backdrop-blur-md rounded-3xl sm:rounded-full p-2 border border-white/20 shadow-2xl gap-2 sm:gap-0 relative">
                            <div className="flex-1 flex items-center px-4 gap-3 w-full py-2 sm:py-0">
                                <Search className="w-6 h-6 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    placeholder="Search 'Rooftop in Brooklyn', 'Cozy Cafe'..."
                                    className="w-full bg-transparent outline-none text-white text-lg font-medium placeholder:text-gray-500"
                                />
                            </div>
                            <div className="hidden sm:flex items-center px-4 gap-2 text-gray-400 border-l border-white/20 h-8">
                                <MapPin className="w-5 h-5" />
                                <span className="text-base font-medium">New York</span>
                            </div>
                            <button 
                                onClick={handleSearch}
                                className="w-full sm:w-auto bg-gradient-to-r from-coral to-violet-600 text-white px-8 py-4 rounded-2xl sm:rounded-full font-black hover:opacity-90 transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                            >
                                {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : "Search"}
                            </button>
                        </div>
                        
                        {/* Search Results Dropdown */}
                        <AnimatePresence>
                            {showResults && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute top-full left-0 right-0 mt-4 bg-[#111827] border border-white/10 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl z-50 max-h-[400px] overflow-y-auto custom-scrollbar"
                                >
                                    <div className="p-4 flex justify-between items-center border-b border-white/5">
                                        <h3 className="text-white font-bold text-sm">Search Results</h3>
                                        <button onClick={() => setShowResults(false)} className="text-gray-400 hover:text-white transition-colors">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="p-2">
                                        {isSearching ? (
                                            <div className="flex justify-center p-8 text-gray-400">
                                                <Loader2 className="w-6 h-6 animate-spin" />
                                            </div>
                                        ) : searchResults.length > 0 ? (
                                            <div className="flex gap-4 overflow-x-auto pb-4 pt-2 px-2 scrollbar-none snap-x snap-mandatory">
                                                {searchResults.map((plan, idx) => {
                                                    let parsedItinerary = plan.itinerary;
                                                    if (typeof parsedItinerary === 'string') {
                                                        try { parsedItinerary = JSON.parse(parsedItinerary); } catch (e) {}
                                                    }
                                                    // Handle both shapes: plain array OR { steps: [] }
                                                    const steps = Array.isArray(parsedItinerary)
                                                        ? parsedItinerary
                                                        : (parsedItinerary?.steps || []);
                                                    const firstStep = steps[0] || null;
                                                    const img = firstStep?.photoUrl || firstStep?.photo || null;
                                                    
                                                    return (
                                                        <motion.div
                                                            key={idx}
                                                            initial={{ opacity: 0, scale: 0.95 }}
                                                            animate={{ opacity: 1, scale: 1, transition: { delay: idx * 0.05 } }}
                                                            whileHover={{ y: -4 }}
                                                            onClick={() => { window.location.href = '/signup'; }}
                                                            className="flex-shrink-0 w-[185px] sm:w-[240px] snap-start bg-[#111827] rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl cursor-pointer group"
                                                        >
                                                            {/* Image */}
                                                            <div className="relative h-28 sm:h-40 overflow-hidden">
                                                                {img
                                                                    ? <img src={img} alt={plan.location || plan.vibe} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                                                    : <div className="w-full h-full bg-gradient-to-br from-violet-900 via-navy to-[#0a0f1c]" />
                                                                }
                                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                                                                {/* Rank badge */}
                                                                <div className="absolute top-3 left-3 w-7 h-7 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
                                                                    <span className="text-white font-black text-xs">#{idx + 1}</span>
                                                                </div>
                                                                {/* Heat badge */}
                                                                <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full">
                                                                    <span className="text-white text-[9px] font-bold">🔥 Trending</span>
                                                                </div>
                                                                {/* Type tag */}
                                                                <div className="absolute bottom-3 left-3 bg-coral px-2.5 py-1 rounded-full">
                                                                    <span className="text-white font-black text-[9px] uppercase tracking-wide">{plan.vibe || "Date"}</span>
                                                                </div>
                                                            </div>

                                                            {/* Info */}
                                                            <div className="p-4">
                                                                <div className="flex items-start justify-between mb-2">
                                                                    <div className="min-w-0 pr-2">
                                                                        <h4 className="text-white font-black text-base leading-tight tracking-tight line-clamp-1">{plan.location || "New York, NY"}</h4>
                                                                        <p className="text-gray-500 text-xs font-semibold mt-0.5 truncate">{firstStep?.venue || "Secret Spot"}</p>
                                                                    </div>
                                                                    <span className="text-xl flex-shrink-0">🔥</span>
                                                                </div>
                                                                <div className="flex items-center justify-between mt-3">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                                                        <span className="text-white font-black text-xs">4.9</span>
                                                                        <span className="text-gray-600 text-[10px]">(12K)</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1 bg-white/5 border border-white/8 px-2.5 py-1 rounded-full">
                                                                        <Clock className="w-3 h-3 text-coral" />
                                                                        <span className="text-gray-400 text-[10px] font-bold">{firstStep?.time || "6:00 PM"}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="text-center p-8 text-gray-500 text-sm font-medium">
                                                No plans found for "{searchQuery}". Try a different vibe!
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                    
                    {/* 3. "Get Your First Plan" Button */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="flex flex-col items-center gap-4 mb-16"
                    >
                        <button
                            onClick={() => setShowFirstPlan(!showFirstPlan)}
                            className="group relative flex items-center gap-3 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all duration-300 backdrop-blur-sm"
                        >
                            <div className="absolute inset-0 bg-coral/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                            <Sparkles className="w-5 h-5 text-coral group-hover:rotate-12 transition-transform" />
                            <span className="text-white font-black tracking-tight">
                                {showFirstPlan ? "Hide Preview" : "See what a first plan looks like"}
                            </span>
                            <ArrowRight className={`w-4 h-4 text-white/40 group-hover:translate-x-1 group-hover:text-white transition-all ${showFirstPlan ? 'rotate-90' : ''}`} />
                        </button>
                        
                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em]">
                            ✨ AI-generated in 3 seconds
                        </p>
                    </motion.div>

                    {/* 4. Interactive First Plan Preview (Inline - App Replica) */}
                    <AnimatePresence>
                        {showFirstPlan && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 40 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 40 }}
                                transition={{ duration: 0.8, type: 'spring', bounce: 0.2 }}
                                className="w-full max-w-6xl mb-24 relative px-4 sm:px-0"
                            >
                                <div className="bg-white rounded-[2.5rem] sm:rounded-[3.5rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)] border border-navy/10 overflow-hidden flex flex-col md:flex-row h-[700px] sm:h-[800px] relative">
                                    
                                    {/* App Header Replica */}
                                    <div className="absolute top-0 left-0 right-0 h-16 sm:h-20 bg-[#1e293b] z-30 flex items-center justify-between px-4 sm:px-8">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/10 flex items-center justify-center">
                                                <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-white/40" />
                                            </div>
                                            <div className="max-w-[140px] sm:max-w-none">
                                                <h3 className="text-white font-black text-xs sm:text-sm leading-none truncate">The Ultimate West Village Date</h3>
                                                <p className="text-[9px] sm:text-[10px] text-white/40 uppercase tracking-widest font-black mt-1">New York, NY</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 sm:gap-3">
                                            <button className="bg-coral hover:bg-coral/90 text-white px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wide flex items-center gap-1.5 sm:gap-2 shadow-lg shadow-coral/20 transition-all active:scale-95">
                                                <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> <span className="hidden xs:inline">Steal</span>
                                            </button>
                                            <button className="bg-white/10 hover:bg-white/20 text-white p-2 sm:px-4 sm:py-2.5 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wide flex items-center gap-2">
                                                <Flame className="w-3.5 h-3.5 text-orange-400" /> <span className="hidden md:inline">Boost</span>
                                            </button>
                                            <button className="hidden sm:flex bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wide items-center gap-2">
                                                <Share2 className="w-3.5 h-3.5" /> Share
                                            </button>
                                            <button 
                                                onClick={() => setShowFirstPlan(false)}
                                                className="w-8 h-8 sm:w-10 sm:h-10 bg-white/10 hover:bg-white/20 text-white rounded-xl flex items-center justify-center transition-all"
                                            >
                                                <X className="w-4 h-4 sm:w-5 sm:h-5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Content Area */}
                                    <div className="flex flex-1 relative overflow-hidden h-full pt-16 sm:pt-20">
                                        
                                        {/* Left Column: Itinerary Timeline */}
                                        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#f8fafc] pb-24 sm:pb-12">
                                            <div className="px-5 sm:px-10 space-y-8 sm:y-12 relative py-8">
                                                {/* Connecting Line */}
                                                <div className="absolute left-[39px] sm:left-[55px] top-12 bottom-12 w-0.5 border-l-2 border-dashed border-gray-200" />
                                                
                                                {DEMO_PLAN.itinerary.map((step, idx) => (
                                                    <div key={idx} className="relative pl-10 sm:pl-16">
                                                        {/* Time Marker */}
                                                        <div className="absolute left-0 top-3 text-[9px] sm:text-[10px] font-black text-gray-400 text-right w-6 sm:w-10 leading-tight">
                                                            {step.time}
                                                        </div>
                                                        {/* Dot */}
                                                        <div className="absolute left-[13px] sm:left-[21px] top-3.5 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-400 border-2 border-white shadow-sm z-10" />
                                                        
                                                        {/* Venue Card */}
                                                        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-4 sm:p-7 hover:shadow-xl transition-all duration-500 group relative">
                                                            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                                                                <div>
                                                                    <h4 className="text-lg sm:text-2xl font-black text-navy mb-1 leading-tight">{step.venue}</h4>
                                                                    <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-coral">{step.activity}</p>
                                                                </div>
                                                                <div className="bg-amber-50 text-amber-600 px-2 py-1 rounded-lg flex items-center gap-1 self-start sm:self-auto">
                                                                    <Star className="w-3.5 h-3.5 fill-current" />
                                                                    <span className="text-[10px] sm:text-[11px] font-black">{step.rating}</span>
                                                                </div>
                                                            </div>

                                                            <p className="text-gray-500 text-xs sm:text-sm font-medium leading-relaxed mb-6 italic border-l-2 border-coral/20 pl-3">
                                                                "A hand-picked gem in the heart of {DEMO_PLAN.location}. Essential for the {DEMO_PLAN.vibe} experience."
                                                            </p>

                                                            <div className="relative rounded-2xl overflow-hidden mb-6 h-40 sm:h-64 shadow-inner">
                                                                <img src={step.photoUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
                                                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                                                                <div className="absolute bottom-4 left-4 bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full text-[9px] text-white font-black uppercase tracking-wider">
                                                                    Verified Location
                                                                </div>
                                                            </div>

                                                            {/* Button Stack - Responsive Grid */}
                                                            <div className="grid grid-cols-2 gap-2 sm:gap-3">
                                                                <button className="flex items-center justify-center gap-1.5 sm:gap-2 bg-violet-600 hover:bg-violet-700 text-white py-2.5 sm:py-3.5 rounded-xl text-[9px] sm:text-[11px] font-black uppercase tracking-wide transition-all shadow-lg shadow-violet-200">
                                                                    <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Swap
                                                                </button>
                                                                <button className="flex items-center justify-center gap-1.5 sm:gap-2 border border-gray-200 hover:bg-gray-50 text-navy py-2.5 sm:py-3.5 rounded-xl text-[9px] sm:text-[11px] font-black uppercase tracking-wide transition-all">
                                                                    <Navigation className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-400" /> Website
                                                                </button>
                                                                <button className="hidden sm:flex items-center justify-center gap-2 border border-gray-200 hover:bg-gray-50 text-navy py-3.5 rounded-xl text-[11px] font-black uppercase tracking-wide transition-all">
                                                                    <Search className="w-3.5 h-3.5 text-gray-400" /> Search
                                                                </button>
                                                                <button className="flex items-center justify-center gap-1.5 sm:gap-2 bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 sm:py-3.5 rounded-xl text-[9px] sm:text-[11px] font-black uppercase tracking-wide transition-all shadow-lg shadow-emerald-100">
                                                                    <Navigation className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Navigate
                                                                </button>
                                                                <button className="flex items-center justify-center gap-1.5 sm:gap-2 bg-black hover:bg-gray-900 text-white py-2.5 sm:py-3.5 rounded-xl text-[9px] sm:text-[11px] font-black uppercase tracking-wide transition-all col-span-1 sm:col-span-2 shadow-lg">
                                                                    <Car className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Uber
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Right Column: Desktop Only Map */}
                                        <div className="hidden md:block w-[42%] h-full relative border-l border-gray-200">
                                            {isLoaded ? (
                                                <GoogleMap
                                                    mapContainerStyle={{ width: '100%', height: '100%' }}
                                                    center={mapCenter}
                                                    zoom={14}
                                                    options={{
                                                        disableDefaultUI: true,
                                                        styles: customMapStyle
                                                    }}
                                                >
                                                    {DEMO_PLAN.itinerary.map((step, idx) => (
                                                        <Marker 
                                                            key={idx} 
                                                            position={{ lat: step.lat, lng: step.lng }}
                                                            label={{ text: (idx + 1).toString(), color: 'white', fontWeight: 'bold' }}
                                                        />
                                                    ))}
                                                </GoogleMap>
                                            ) : (
                                                <div className="flex items-center justify-center h-full bg-gray-100 text-gray-400 text-xs font-black uppercase tracking-widest">
                                                    Loading Map...
                                                </div>
                                            )}
                                        </div>

                                        {/* Mobile Floating Map Toggle (Simulated) */}
                                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 md:hidden">
                                            <button className="bg-navy text-white px-6 py-3 rounded-full font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-2xl ring-4 ring-white/10">
                                                <MapIcon className="w-4 h-4 text-coral" /> View Map View
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* 5. The Bento Grid */}
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={{
                            hidden: { opacity: 0 },
                            visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
                        }}
                        className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-5 auto-rows-[280px]"
                    >

                        {/* Bento 1: AI Concierge (2 columns) */}
                        <motion.div
                            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                            onClick={() => setShowDemoModal(true)}
                            className="md:col-span-2 relative rounded-[2rem] bg-gradient-to-br from-[#131B2F] to-[#0A0F1C] border border-white/10 overflow-hidden group cursor-pointer shadow-2xl"
                        >
                            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-[0.05]" />
                            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/20 rounded-full blur-[80px]" />
                            <div className="p-8 relative z-10 flex flex-col h-full justify-between">
                                <div>
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-500/20 border border-violet-500/30 rounded-full text-violet-300 text-xs font-bold mb-4">
                                        <Bot className="w-3.5 h-3.5" /> AI Concierge
                                    </div>
                                    <h3 className="text-3xl font-black text-white tracking-tight leading-tight max-w-md">
                                        Don't want to search? <br /> Let Sparky plan it.
                                    </h3>
                                </div>
                                <div className="flex items-center justify-between mt-auto">
                                    <p className="text-gray-400 font-medium text-sm">Takes 5 seconds. 100% personalized.</p>
                                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-coral group-hover:rotate-12 transition-all shadow-lg">
                                        <Sparkles className="w-5 h-5 text-white" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Bento 2: Ticketmaster (1 column) */}
                        <motion.div
                            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                            className="relative rounded-[2rem] bg-gradient-to-br from-violet-600 to-fuchsia-600 border border-white/10 overflow-hidden group cursor-pointer shadow-2xl"
                        >
                            <div className="absolute top-0 right-0 w-full h-full bg-black/10" />
                            <div className="p-8 relative z-10 flex flex-col h-full justify-between">
                                <div>
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-white text-xs font-bold mb-4">
                                        <Music className="w-3.5 h-3.5" /> Live Events
                                    </div>
                                    <h3 className="text-2xl font-black text-white tracking-tight leading-tight">
                                        Concerts, sports, & theater.
                                    </h3>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-white/80 text-xs font-black uppercase tracking-wider">Powered by Ticketmaster</span>
                                    <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </motion.div>

                        {/* Bento 3: Community Trending (1 column) */}
                        <motion.div
                            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                            className="relative rounded-[2rem] bg-white border border-gray-200 overflow-hidden group cursor-pointer shadow-xl"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-coral/10 rounded-full blur-[40px]" />
                            <div className="p-8 relative z-10 flex flex-col h-full justify-between">
                                <div>
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-coral/10 text-coral border border-coral/20 rounded-full text-xs font-bold mb-4">
                                        <Flame className="w-3.5 h-3.5" /> Trending Now
                                    </div>
                                    <h3 className="text-2xl font-black text-navy tracking-tight leading-tight">
                                        See where everyone is going.
                                    </h3>
                                </div>
                                <div className="flex items-center justify-between mt-4">
                                    <div className="flex -space-x-3">
                                        <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop" className="w-10 h-10 rounded-full border-2 border-white object-cover" />
                                        <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop" className="w-10 h-10 rounded-full border-2 border-white object-cover" />
                                        <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-500">+10k</div>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 group-hover:text-coral transition-all" />
                                </div>
                            </div>
                        </motion.div>

                        {/* Bento 4: Modes (2 columns) */}
                        <motion.div
                            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                            className="md:col-span-2 relative rounded-[2rem] bg-[#0a0f1c] border border-white/10 overflow-hidden group shadow-2xl"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-coral/10 to-transparent" />
                            <div className="p-8 relative z-10 flex flex-col sm:flex-row sm:items-center justify-between h-full gap-6">
                                <div>
                                    <h3 className="text-3xl font-black text-white tracking-tight leading-tight mb-2">
                                        Not just for romance.
                                    </h3>
                                    <p className="text-gray-400 font-medium text-sm">Choose your mode and let's go.</p>
                                </div>
                                <div className="flex gap-3">
                                    <div className="bg-white/5 border border-white/10 px-5 py-4 rounded-[1.5rem] flex flex-col items-center gap-2 hover:bg-white/10 transition-colors cursor-pointer hover:border-coral/50">
                                        <Heart className="w-7 h-7 text-coral fill-coral/20" />
                                        <span className="text-white text-xs font-bold">Romantic</span>
                                    </div>
                                    <div className="bg-white/5 border border-white/10 px-5 py-4 rounded-[1.5rem] flex flex-col items-center gap-2 hover:bg-white/10 transition-colors cursor-pointer hover:border-blue-400/50">
                                        <Utensils className="w-7 h-7 text-blue-400" />
                                        <span className="text-white text-xs font-bold">Squad</span>
                                    </div>
                                    <div className="bg-white/5 border border-white/10 px-5 py-4 rounded-[1.5rem] flex flex-col items-center gap-2 hover:bg-white/10 transition-colors cursor-pointer hover:border-emerald-400/50">
                                        <Compass className="w-7 h-7 text-emerald-400" />
                                        <span className="text-white text-xs font-bold">Solo</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                    </motion.div>
                </div>
                {/* Interactive Demo Modal */}
                {showDemoModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm">
                        <div className="bg-[#f8f9fa] rounded-[2rem] shadow-2xl w-full max-w-4xl h-full md:h-auto max-h-full md:max-h-[90vh] overflow-hidden flex flex-col md:flex-row relative animate-in zoom-in-95 duration-300">

                            {/* Left Sidebar - Timeline */}
                            <div className={`flex-1 min-h-0 overflow-y-auto custom-scrollbar bg-transparent md:bg-white flex-col z-10 ${showMapMobile ? 'hidden md:flex' : 'flex'}`}>
                                {/* Sticky Top Banner inside Modal - Unified Dark Style */}
                                <div className="bg-[#0f172a]/95 backdrop-blur-md p-4 sm:p-5 text-white relative flex justify-between items-center rounded-bl-3xl md:rounded-bl-none sticky top-0 z-20 border-b border-white/5">
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                                <Heart className="w-5 h-5 fill-coral text-white" />
                                            </div>
                                            <div>
                                                <h2 className="text-lg font-black font-outfit leading-tight">Boutique Romantic Date</h2>
                                                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black mt-1">Friday Evening</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => {
                                                setShareTooltip(true);
                                                setTimeout(() => setShareTooltip(false), 2000);
                                            }}
                                            className="hidden sm:flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition-all relative"
                                        >
                                            <Share2 className="w-4 h-4 text-coral" />
                                            <span className="text-xs font-bold">Share Plan</span>
                                            {shareTooltip && (
                                                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-navy text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap animate-in fade-in zoom-in-90 tracking-tight">Link Copied!</div>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowDemoModal(false);
                                                setShowMapMobile(false);
                                            }}
                                            className="p-2 text-white/60 hover:text-white bg-white/10 rounded-full transition-colors"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Timeline Contents */}
                                <div className="relative flex-1 p-0 sm:p-8 sm:pt-4 pb-12 w-full">

                                    {/* Spacer for Background Map Visualization on Mobile */}
                                    <div className="h-[250px] md:hidden relative flex items-end justify-center pb-2 flex-shrink-0 z-20">
                                        {/* Mobile Map Toggle Button */}
                                        <button
                                            onClick={() => setShowMapMobile(true)}
                                            className="bg-navy/95 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-md flex items-center gap-1.5 border border-white/20 transform transition-all active:scale-95"
                                        >
                                            <MapIcon className="w-3.5 h-3.5" />
                                            Expand Map
                                        </button>
                                    </div>

                                    <div className="p-6 sm:p-8 pt-10 bg-white md:bg-white rounded-[2.5rem] md:rounded-none shadow-sm md:shadow-none relative z-10 mt-[-2rem]">
                                        <div className="space-y-6 border-l-2 border-dashed border-gray-200 ml-6 sm:ml-14 relative pb-6">
                                            {demoItinerary.map((step, idx) => {
                                                const icons = [
                                                    <Utensils className="w-5 h-5 text-coral" />,
                                                    <Compass className="w-5 h-5 text-gold" />,
                                                    <Ticket className="w-5 h-5 text-purple-500" />
                                                ];
                                                return (
                                                    <div key={idx} className="relative pl-5 cursor-pointer group/step" onClick={() => handleStepInteraction(step)}>
                                                        {/* Left Absolute Time */}
                                                        <div className="absolute -left-14 top-2 text-[11px] font-black text-gray-400 text-right w-10">
                                                            {step.time}
                                                        </div>

                                                        {/* Center Dot */}
                                                        <div className={`absolute -left-[7px] top-3 w-3 h-3 rounded-full border-2 border-white shadow-sm bg-coral transition-transform group-hover/step:scale-125`} />

                                                        {/* Right Card - Premium App Match */}
                                                        <div className={`relative rounded-[2.5rem] flex flex-col gap-4 transition-all duration-500 flex-shrink-0 w-[85vw] sm:max-w-[400px] snap-start p-4 sm:p-6 ${selectedMarkerId === step.id ? 'bg-white border-2 border-coral/20 shadow-xl ring-8 ring-coral/5' : 'bg-white border border-navy/5 shadow-sm hover:shadow-md'} ${isSwappingId === step.id ? 'opacity-80 pointer-events-none' : ''}`}>

                                                            <AnimatePresence>
                                                                {isSwappingId === step.id && (
                                                                    <motion.div
                                                                        initial={{ opacity: 0 }}
                                                                        animate={{ opacity: 1 }}
                                                                        exit={{ opacity: 0 }}
                                                                        className="absolute inset-0 z-20 bg-white/80 backdrop-blur-[2px] rounded-[2.5rem] flex flex-col items-center justify-center gap-4 border border-coral/30"
                                                                    >
                                                                        <div className="w-12 h-12 rounded-2xl bg-coral/10 text-coral flex items-center justify-center animate-pulse">
                                                                            <Sparkles className="w-6 h-6 animate-spin-slow" />
                                                                        </div>
                                                                        <p className="text-coral font-black text-sm uppercase tracking-widest animate-pulse">AI is switching venue...</p>
                                                                    </motion.div>
                                                                )}
                                                            </AnimatePresence>

                                                            <div className="flex items-center gap-4">
                                                                <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                                                                    {icons[idx % icons.length]}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center justify-between gap-2">
                                                                        <h4 className="text-[17px] font-black text-navy leading-tight truncate">{step.venue}</h4>
                                                                        {step.rating && (
                                                                            <div className="flex items-center gap-1 bg-gradient-to-r from-amber-400 to-orange-400 text-white px-1.5 py-0.5 rounded text-[9px] font-black tracking-wide shadow-sm flex-shrink-0">
                                                                                <Star className="w-3 h-3 fill-current" />
                                                                                {step.rating}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-[10px] bg-coral/10 text-coral font-black uppercase tracking-widest inline-block px-1.5 py-0.5 rounded mt-1 truncate max-w-full">{step.activity}</p>
                                                                </div>
                                                            </div>

                                                            {step.photoUrl && (
                                                                <motion.img
                                                                    key={step.photoUrl} // forces re-render animation when swapped
                                                                    initial={{ opacity: 0.5, scale: 0.98 }}
                                                                    animate={{ opacity: 1, scale: 1 }}
                                                                    src={step.photoUrl}
                                                                    alt={step.venue}
                                                                    className="rounded-[2rem] w-full h-40 object-cover border border-gray-50 shadow-inner mt-1 object-center"
                                                                />
                                                            )}
                                                            <p className="text-[13px] text-gray-500 leading-relaxed font-medium mt-1">{step.description}</p>

                                                            {/* Action Row - Dashboard Match */}
                                                            <div className="grid grid-cols-2 gap-2 mt-2 pt-4 border-t border-gray-50">
                                                                <button onClick={(e) => { e.stopPropagation(); triggerToast(`Opening Maps API...`); }} className="flex items-center justify-center gap-2 px-3 py-2.5 bg-gray-50 text-navy font-bold text-xs rounded-xl hover:bg-gray-100 transition-colors shadow-sm">
                                                                    <MapPin className="w-3.5 h-3.5 text-gray-500" /> Directions
                                                                </button>
                                                                <button onClick={(e) => { e.stopPropagation(); triggerToast(`Mocking partner ticket booking...`); }} className="flex items-center justify-center gap-2 px-3 py-2.5 bg-gray-50 text-navy font-bold text-xs rounded-xl hover:bg-gray-100 transition-colors shadow-sm">
                                                                    <Ticket className="w-3.5 h-3.5 text-gray-500" /> Book
                                                                </button>
                                                                <button
                                                                    onClick={(e) => handleSwitchUp(step.id, e)}
                                                                    disabled={isSwappingId === step.id}
                                                                    className="flex items-center justify-center gap-2 px-3 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold text-xs rounded-xl hover:brightness-110 transition-all col-span-2 shadow-md hover:shadow-lg hover:-translate-y-0.5 transform active:scale-95 disabled:opacity-50"
                                                                >
                                                                    <Sparkles className="w-3.5 h-3.5" /> Switch Up Venue
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="mt-8 -ml-14 bg-gray-50 p-6 rounded-3xl border border-gray-100 flex flex-col items-center justify-center text-center space-y-4">
                                        <div className="w-12 h-12 bg-coral/10 text-coral rounded-2xl flex items-center justify-center">
                                            <Heart className="w-6 h-6 fill-current" />
                                        </div>
                                        <h4 className="font-bold text-navy text-lg">Ready to spark something?</h4>
                                        <button
                                            onClick={() => {
                                                setShowDemoModal(false);
                                                setShowMapMobile(false);
                                                navigate('/signup');
                                            }}
                                            className="w-full bg-navy text-white py-4 px-6 rounded-2xl font-black text-center flex items-center justify-center gap-2 hover:bg-coral transition-colors shadow-lg group shadow-coral/5"
                                        >
                                            Plan Your First Date <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Right Panel - Embedded Google Map */}
                            <div className={`${showMapMobile ? 'flex flex-1 min-h-[80vh] z-50' : 'absolute inset-0 z-0 md:relative md:flex pointer-events-none md:pointer-events-auto'} md:flex-col w-full md:w-5/12 bg-gray-50 border-l border-gray-200`}>
                                {showMapMobile && (
                                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 md:hidden">
                                        <button
                                            onClick={() => setShowMapMobile(false)}
                                            className="bg-white text-navy px-6 py-3 rounded-full font-bold shadow-xl flex items-center gap-2 border border-gray-100 transform transition-all active:scale-95"
                                        >
                                            <Ticket className="w-5 h-5 text-coral" />
                                            Back to Itinerary
                                        </button>
                                    </div>
                                )}

                                {isLoaded ? (
                                    <div className="flex-1 w-full relative min-h-[50vh]">
                                        <GoogleMap
                                            mapContainerStyle={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
                                            center={{ lat: 40.7400, lng: -73.9980 }} // Center on mapped area
                                            zoom={14}
                                            options={{
                                                disableDefaultUI: true,
                                                gestureHandling: 'greedy',
                                                styles: customMapStyle
                                            }}
                                        >
                                            {demoItinerary.map((step, idx) => (
                                                <Marker
                                                    key={idx}
                                                    position={{ lat: step.lat, lng: step.lng }}
                                                    label={{ text: (idx + 1).toString(), color: 'white', fontWeight: 'bold' }}
                                                    icon={selectedMarkerId === step.id ? undefined : {
                                                        path: window.google?.maps.SymbolPath.CIRCLE,
                                                        scale: 6,
                                                        fillColor: "#f97316",
                                                        fillOpacity: 0.8,
                                                        strokeWeight: 2,
                                                        strokeColor: "white"
                                                    }}
                                                />
                                            ))}
                                        </GoogleMap>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center bg-gray-100/50 min-h-[50vh]">
                                        <MapIcon className="w-12 h-12 mb-4 opacity-50" />
                                        <p className="font-medium">Please add your Google Maps API Key to view the map.</p>
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                )}
            </section>

            {/* Trending Spots Section */}
            <section className="relative bg-[#0a0f1c] py-16 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1c] via-[#0d1526] to-[#0a0f1c]" />
                <div className="container-custom relative z-10">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0, transition: { duration: 0.7 } }}
                        viewport={{ once: true }}
                        className="flex items-center justify-between mb-8"
                    >
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-1.5 h-5 bg-coral rounded-full" />
                                <span className="text-coral font-black text-xs uppercase tracking-widest">Trending Near You</span>
                            </div>
                            <h2 className="text-white font-black text-3xl md:text-4xl tracking-tight">
                                Top Spots <span className="text-transparent bg-clip-text bg-gradient-to-r from-coral to-violet-400">Right Now</span>
                            </h2>
                        </div>
                        <div className="hidden md:flex items-center gap-2 text-gray-500 text-sm font-bold">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Updated live
                        </div>
                    </motion.div>

                    {/* Cards Strip */}
                    <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory">
                        {[
                            {
                                rank: 1, emoji: "🌿", name: "The High Line", type: "Scenic Walk", time: "4:30 PM",
                                rating: 4.9, reviews: "145K", tag: "TOURIST FAVORITE", tagColor: "bg-blue-500",
                                img: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600&q=80",
                                heat: "🔥 Trending"
                            },
                            {
                                rank: 2, emoji: "🍷", name: "Bar Pisellino", type: "Cocktail Bar", time: "6:00 PM",
                                rating: 4.7, reviews: "8.2K", tag: "LOCAL'S PICK", tagColor: "bg-violet-500",
                                img: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&q=80",
                                heat: "⚡ Hot Tonight"
                            },
                            {
                                rank: 3, emoji: "🍝", name: "L'Artusi", type: "Italian Fine Dining", time: "8:00 PM",
                                rating: 4.8, reviews: "4.1K", tag: "98% VIBE MATCH", tagColor: "bg-coral",
                                img: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=600&q=80",
                                heat: "🏆 Top Rated"
                            },
                            {
                                rank: 4, emoji: "🌅", name: "Hudson Yards View", type: "Rooftop Terrace", time: "9:30 PM",
                                rating: 4.6, reviews: "12K", tag: "DATE NIGHT", tagColor: "bg-pink-500",
                                img: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=600&q=80",
                                heat: "✨ New"
                            },
                            {
                                rank: 5, emoji: "☕", name: "Bluestone Lane", type: "Specialty Coffee", time: "10:00 PM",
                                rating: 4.5, reviews: "6.7K", tag: "AFTER DINNER", tagColor: "bg-amber-500",
                                img: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80",
                                heat: "🌙 Late Night"
                            },
                        ].map((spot, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                                whileInView={{ opacity: 1, y: 0, scale: 1, transition: { delay: idx * 0.12, duration: 0.6, type: "spring" } }}
                                viewport={{ once: true }}
                                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                                className="flex-shrink-0 w-[185px] sm:w-[240px] snap-start bg-[#111827] rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl cursor-pointer group"
                            >
                                {/* Image */}
                                <div className="relative h-28 sm:h-40 overflow-hidden">
                                    <img src={spot.img} alt={spot.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                                    {/* Rank badge */}
                                    <div className="absolute top-3 left-3 w-7 h-7 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
                                        <span className="text-white font-black text-xs">#{spot.rank}</span>
                                    </div>
                                    {/* Heat badge */}
                                    <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full">
                                        <span className="text-white text-[9px] font-bold">{spot.heat}</span>
                                    </div>
                                    {/* Type tag */}
                                    <div className={`absolute bottom-3 left-3 ${spot.tagColor} px-2.5 py-1 rounded-full`}>
                                        <span className="text-white font-black text-[9px] uppercase tracking-wide">{spot.tag}</span>
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <h4 className="text-white font-black text-base leading-tight tracking-tight">{spot.name}</h4>
                                            <p className="text-gray-500 text-xs font-semibold mt-0.5">{spot.type}</p>
                                        </div>
                                        <span className="text-2xl">{spot.emoji}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                            <span className="text-white font-black text-xs">{spot.rating}</span>
                                            <span className="text-gray-600 text-[10px]">({spot.reviews})</span>
                                        </div>
                                        <div className="flex items-center gap-1 bg-white/5 border border-white/8 px-2.5 py-1 rounded-full">
                                            <Clock className="w-3 h-3 text-coral" />
                                            <span className="text-gray-400 text-[10px] font-bold">{spot.time}</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* CTA below */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0, transition: { delay: 0.5 } }}
                        viewport={{ once: true }}
                        className="mt-10 text-center"
                    >
                        <p className="text-gray-500 text-sm mb-4 font-medium">All of these — discovered, sequenced, and booked for you in seconds.</p>
                        <Link to="/signup" className="inline-flex items-center gap-2 bg-white text-navy font-black text-sm px-8 py-4 rounded-2xl hover:bg-coral hover:text-white transition-all duration-300 shadow-xl hover:shadow-coral/30">
                            Build My Date Plan <ArrowRight className="w-4 h-4" />
                        </Link>
                    </motion.div>
                </div>
            </section>
        </>
    );
};

export default Hero;
