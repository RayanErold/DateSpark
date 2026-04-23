import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Clock, DollarSign, ArrowRight, Play, Heart, Ticket, Share2, Wallet, CheckCircle, X, Star, Map as MapIcon, Utensils, Compass, Car, Search, Sparkles, Navigation } from 'lucide-react';
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
    const [shareTooltip, setShareTooltip] = useState(false);
    const [activeFeature, setActiveFeature] = useState('itinerary');
    const [isSwappingId, setIsSwappingId] = useState(null);
    const [mockToast, setMockToast] = useState(null);
    const navigate = useNavigate();

    const triggerToast = (msg) => {
        setMockToast(msg);
        setTimeout(() => setMockToast(null), 3000);
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
        <section className="relative min-h-[95vh] flex flex-col justify-center pt-24 pb-20 overflow-hidden bg-[#0a0f1c]">
            {/* Deep Rich Background Decor */}
            <div className="absolute top-0 right-0 -z-10 w-full h-[800px] bg-gradient-to-b from-[#1a103c]/80 via-[#0a0f1c] to-[#0a0f1c] opacity-80" />
            <div className="absolute top-[-20%] left-[-10%] -z-10 w-[800px] h-[800px] bg-coral/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[10%] right-[-10%] -z-10 w-[600px] h-[600px] bg-violet-600/20 rounded-full blur-[100px]" />
            <div className="absolute inset-0 -z-10 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-[0.05]" />

            <div className="container-custom grid lg:grid-cols-2 gap-16 items-center relative z-10 w-full">
                
                {/* Left Side: Copy and Call to Action */}
                <motion.div 
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={{
                        hidden: { opacity: 0 },
                        visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
                    }}
                    className="text-center lg:text-left space-y-8 lg:pr-8"
                >
                    <motion.div variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, type: 'spring' } } }} className="inline-flex items-center gap-3 px-5 py-2.5 bg-white/5 border border-white/10 rounded-full text-sm font-bold shadow-2xl backdrop-blur-md">
                        <div className="relative flex items-center justify-center w-6 h-6">
                            <span className="absolute inline-flex h-full w-full rounded-full bg-coral opacity-40 animate-ping"></span>
                            <div className="relative flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-coral to-pink-500 text-white">
                                <Sparkles className="w-3.5 h-3.5" />
                            </div>
                        </div>
                        <span className="text-white/90">Available now in NYC and NJ</span>
                    </motion.div>

                    {/* H1 — word-by-word stagger reveal */}
                    <motion.h1
                        variants={{
                            hidden: { opacity: 1 },
                            visible: { opacity: 1, transition: { staggerChildren: 0.09, delayChildren: 0.1 } }
                        }}
                        className="font-black text-white leading-[1.02] tracking-tight overflow-hidden"
                    >
                        {/* Line 1: each word slides up */}
                        <span className="block text-[52px] md:text-[68px] lg:text-[78px]">
                            {['Your', 'next', 'great', 'date,'].map((word, i) => (
                                <motion.span
                                    key={i}
                                    variants={{
                                        hidden: { y: 80, opacity: 0, rotateX: 30 },
                                        visible: { y: 0, opacity: 1, rotateX: 0, transition: { duration: 0.75, type: 'spring', bounce: 0.28 } }
                                    }}
                                    className="inline-block mr-[0.22em] last:mr-0"
                                >
                                    {word}
                                </motion.span>
                            ))}
                        </span>
                        {/* Line 2: italic gradient — slides in from left */}
                        <motion.span
                            variants={{
                                hidden: { x: -50, opacity: 0, skewX: -4 },
                                visible: { x: 0, opacity: 1, skewX: 0, transition: { duration: 0.9, type: 'spring', bounce: 0.22, delay: 0.35 } }
                            }}
                            className="block text-[52px] md:text-[68px] lg:text-[78px] italic text-transparent bg-clip-text bg-gradient-to-r from-coral via-rose-400 to-pink-400"
                        >
                            already planned.
                        </motion.span>
                    </motion.h1>

                    {/* Subheadline + description block */}
                    <motion.div
                        variants={{
                            hidden: { opacity: 0, y: 28 },
                            visible: { opacity: 1, y: 0, transition: { duration: 0.7, delay: 0.55, ease: 'easeOut' } }
                        }}
                        className="space-y-5 max-w-xl mx-auto lg:mx-0"
                    >
                        {/* Subheadline */}
                        <div className="space-y-0.5">
                            <p className="text-xl md:text-2xl font-bold text-white/90 tracking-tight leading-snug">
                                Skip the scroll. Skip the search.
                            </p>
                            <p className="text-xl md:text-2xl font-black italic tracking-tight bg-gradient-to-r from-coral to-rose-400 text-transparent bg-clip-text">
                                Just show up and enjoy.
                            </p>
                        </div>

                        {/* Animated divider */}
                        <motion.div
                            initial={{ scaleX: 0, opacity: 0 }}
                            whileInView={{ scaleX: 1, opacity: 1, transition: { delay: 0.75, duration: 0.7, ease: 'easeOut' } }}
                            viewport={{ once: true }}
                            className="h-px bg-gradient-to-r from-coral/60 via-rose-400/30 to-transparent origin-left"
                        />

                        {/* Body */}
                        <p className="text-base md:text-lg text-gray-400 leading-relaxed font-medium">
                            Tell DateSpark your vibe and we handle the rest — hidden gems, perfect timing, a full evening sequenced in seconds.{' '}
                            <span className="text-gray-200 font-semibold">No Pinterest boards, no group chats, no decision fatigue.</span>{' '}
                            Just a night you'll actually remember.
                        </p>
                    </motion.div>

                    <motion.div variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, type: 'spring' } } }} className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-5 pt-4">
                        <Link to="/signup" className="w-full sm:w-auto bg-gradient-to-r from-coral to-violet-600 text-white px-8 py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-2 shadow-[0_10px_40px_rgba(249,115,22,0.3)] hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(249,115,22,0.5)] transition-all group focus:outline-none relative overflow-hidden">
                            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                            <span className="relative z-10">Get Your First Plan</span>
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10" />
                        </Link>
                        <button
                            onClick={() => setShowDemoModal(true)}
                            className="w-full sm:w-auto flex items-center justify-center gap-3 text-white font-bold hover:text-coral transition-colors bg-white/5 backdrop-blur-sm border border-white/10 px-8 py-5 rounded-2xl hover:border-coral/50 group shadow-lg active:scale-95"
                        >
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-coral/20 transition-colors">
                                <Play className="w-3.5 h-3.5 fill-white group-hover:fill-coral transition-colors ml-0.5" />
                            </div>
                            See How It Works
                        </button>
                    </motion.div>

                    <motion.div variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, type: 'spring' } } }} className="pt-8 flex items-center justify-center lg:justify-start gap-4 border-t border-white/10">
                        <div className="flex -space-x-3">
                            <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop" alt="User" className="w-10 h-10 rounded-full border-2 border-[#0a0f1c] object-cover shadow-sm" />
                            <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop" alt="User" className="w-10 h-10 rounded-full border-2 border-[#0a0f1c] object-cover shadow-sm" />
                            <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop" alt="User" className="w-10 h-10 rounded-full border-2 border-[#0a0f1c] object-cover shadow-sm" />
                        </div>
                        <div className="flex flex-col">
                            <div className="flex gap-1 mb-1">
                                {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-coral text-coral" />)}
                            </div>
                            <span className="text-xs font-bold text-gray-400"><strong className="text-white">5,000+</strong> dates planned this month</span>
                        </div>
                    </motion.div>
                </motion.div>

                {/* Right Side: Animated Value Props (Exploded Bento Style) */}
                <div className="relative w-full h-[800px] lg:h-[950px] mt-12 lg:mt-0">
                    
                    {/* Floating Stop 1: The High Line */}
                    <motion.div 
                        initial={{ opacity: 0, x: 80, rotate: 8 }}
                        whileInView={{ opacity: 1, x: 0, rotate: -2, transition: { delay: 0.2, duration: 1, type: "spring" } }}
                        viewport={{ once: true }}
                        className="absolute top-[5%] right-[2%] w-[320px] md:w-[400px] bg-white rounded-3xl p-4 shadow-2xl z-40 border-4 border-[#0a0f1c] transform transition-transform hover:scale-105 duration-500 hover:rotate-0"
                    >
                        {/* Stop badge */}
                        <div className="absolute -top-3 -left-3 w-9 h-9 rounded-full bg-[#4285F4] border-[3px] border-white shadow-lg flex items-center justify-center z-10">
                            <span className="text-white font-black text-sm">1</span>
                        </div>
                        <div className="flex items-center gap-5">
                            <img src="https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&h=400&fit=crop" alt="Walk" className="w-24 h-24 rounded-2xl object-cover shadow-inner" />
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full uppercase tracking-tight">Stop 1 • 4:30 PM</span>
                                </div>
                                <h4 className="text-navy font-black text-xl leading-tight tracking-tight">The High Line</h4>
                                <div className="flex items-center gap-1.5 mt-1.5 text-emerald-600 font-bold text-xs">
                                    <Compass className="w-3.5 h-3.5" /> Scenic Stroll • Free
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Floating Stop 2: Cocktails */}
                    <motion.div 
                        initial={{ opacity: 0, x: -80, rotate: -8 }}
                        whileInView={{ opacity: 1, x: 0, rotate: 3, transition: { delay: 0.4, duration: 1, type: "spring" } }}
                        viewport={{ once: true }}
                        className="absolute top-[18%] left-[2%] w-[320px] md:w-[400px] bg-navy rounded-3xl p-4 shadow-[0_20px_60px_rgba(249,115,22,0.3)] z-30 border-4 border-white/10 transform transition-transform hover:scale-105 duration-500 hover:rotate-0"
                    >
                        {/* Stop badge */}
                        <div className="absolute -top-3 -left-3 w-9 h-9 rounded-full bg-[#a855f7] border-[3px] border-[#0a0f1c] shadow-lg flex items-center justify-center z-10">
                            <span className="text-white font-black text-sm">2</span>
                        </div>
                        <div className="flex items-center gap-5">
                            <img src="https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&h=400&fit=crop" alt="Bar" className="w-24 h-24 rounded-2xl object-cover" />
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-black bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full uppercase tracking-tight">Stop 2 • 6:00 PM</span>
                                </div>
                                <h4 className="text-white font-black text-xl leading-tight tracking-tight">Bar Pisellino</h4>
                                <div className="flex items-center gap-1.5 mt-1.5 text-white/50 font-bold text-xs">
                                    <Star className="w-3.5 h-3.5 fill-coral text-coral" /> Top-Rated Aperitivo
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Floating Stop 3: Dinner */}
                    <motion.div 
                        initial={{ opacity: 0, y: 30, scale: 0.9 }}
                        whileInView={{ opacity: 1, y: 0, scale: 1, transition: { delay: 0.6, duration: 0.8, type: "spring" } }}
                        viewport={{ once: true }}
                        className="absolute top-[40%] left-1/2 -translate-x-1/2 w-[350px] md:w-[480px] bg-white rounded-[3rem] p-5 shadow-[0_50px_100px_rgba(0,0,0,0.6)] z-50 border-[8px] border-[#0a0f1c] hover:scale-[1.02] transition-transform duration-500"
                    >
                        {/* Stop 3 badge */}
                        <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-coral border-[3px] border-[#0a0f1c] shadow-xl flex items-center justify-center z-20">
                            <span className="text-white font-black text-base">3</span>
                        </div>
                        <div className="absolute -top-4 -right-4 bg-[#0a0f1c] text-white font-black text-[10px] px-4 py-2 rounded-full shadow-2xl border-2 border-coral z-10 animate-bounce">
                            98% VIBE MATCH
                        </div>
                        <div className="relative rounded-[2rem] overflow-hidden h-56 mb-4 bg-gray-100">
                             <img src="https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=800&fit=crop" alt="Dinner" className="w-full h-full object-cover" />
                             <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                             <div className="absolute bottom-5 left-6 text-white">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-black bg-coral/30 backdrop-blur-sm text-white px-2.5 py-1 rounded-full uppercase tracking-wider">Stop 3 • 8:00 PM</span>
                                </div>
                                <h4 className="font-black text-2xl leading-none tracking-tighter">L'Artusi • West Village</h4>
                             </div>
                        </div>
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-3">
                                <div className="flex text-coral">
                                    {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
                                </div>
                                <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">4,120 Vetted Reviews</span>
                            </div>
                            <div className="px-3 py-1 bg-coral text-white text-[10px] font-black rounded-lg shadow-lg shadow-coral/30">BOOKED 12x TODAY</div>
                        </div>
                    </motion.div>

                    {/* The Full Map Visualization Card — Google Maps Style */}
                    <motion.div
                        initial={{ opacity: 0, y: 60 }}
                        whileInView={{ opacity: 1, y: 0, transition: { delay: 0.8, duration: 1, type: "spring" } }}
                        viewport={{ once: true }}
                        className="absolute bottom-0 left-0 right-0 h-[380px] bg-white border-4 border-[#0a0f1c] rounded-[3rem] shadow-[0_50px_120px_rgba(0,0,0,0.9)] z-20 overflow-hidden"
                    >
                        {/* Google Maps Style Header */}
                        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-coral to-violet-600 flex items-center justify-center shadow-md">
                                    <Navigation className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-navy font-black text-sm tracking-tight leading-none">Your Route, Mapped</h3>
                                    <p className="text-gray-400 text-[10px] font-semibold mt-0.5">All stops within walking distance</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-emerald-700 font-black text-[10px] uppercase tracking-widest">Live</span>
                            </div>
                        </div>

                        {/* Google Maps Canvas */}
                        <div className="relative mx-0 mb-0 overflow-hidden flex-1" style={{ height: '300px', background: '#e8ead3' }}>
                            {/* Map base — Google Maps color palette */}
                            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 520 300" preserveAspectRatio="xMidYMid slice">
                                {/* Water body */}
                                <rect x="0" y="0" width="520" height="300" fill="#e8ead3" />
                                <ellipse cx="10" cy="150" rx="60" ry="160" fill="#aadaff" opacity="0.6" />
                                {/* Parks */}
                                <rect x="30" y="30" width="120" height="80" rx="8" fill="#c8e6c9" opacity="0.7" />
                                <rect x="200" y="20" width="80" height="50" rx="6" fill="#c8e6c9" opacity="0.5" />
                                {/* City blocks */}
                                <rect x="100" y="40" width="60" height="40" rx="4" fill="#f5f5f0" stroke="#ddd" strokeWidth="0.5" />
                                <rect x="170" y="40" width="40" height="40" rx="4" fill="#f5f5f0" stroke="#ddd" strokeWidth="0.5" />
                                <rect x="230" y="70" width="70" height="50" rx="4" fill="#f5f5f0" stroke="#ddd" strokeWidth="0.5" />
                                <rect x="310" y="40" width="90" height="60" rx="4" fill="#f5f5f0" stroke="#ddd" strokeWidth="0.5" />
                                <rect x="410" y="30" width="100" height="70" rx="4" fill="#f5f5f0" stroke="#ddd" strokeWidth="0.5" />
                                <rect x="100" y="130" width="80" height="55" rx="4" fill="#f5f5f0" stroke="#ddd" strokeWidth="0.5" />
                                <rect x="200" y="140" width="100" height="55" rx="4" fill="#f5f5f0" stroke="#ddd" strokeWidth="0.5" />
                                <rect x="320" y="140" width="90" height="55" rx="4" fill="#f5f5f0" stroke="#ddd" strokeWidth="0.5" />
                                <rect x="420" y="130" width="90" height="55" rx="4" fill="#f5f5f0" stroke="#ddd" strokeWidth="0.5" />
                                <rect x="80" y="220" width="120" height="60" rx="4" fill="#f5f5f0" stroke="#ddd" strokeWidth="0.5" />
                                <rect x="220" y="220" width="110" height="60" rx="4" fill="#f5f5f0" stroke="#ddd" strokeWidth="0.5" />
                                <rect x="350" y="220" width="160" height="60" rx="4" fill="#f5f5f0" stroke="#ddd" strokeWidth="0.5" />
                                {/* Major roads (yellow) */}
                                <line x1="0" y1="120" x2="520" y2="115" stroke="#fdd835" strokeWidth="6" />
                                <line x1="0" y1="200" x2="520" y2="205" stroke="#fdd835" strokeWidth="5" />
                                {/* Side streets (white) */}
                                <line x1="0" y1="80" x2="520" y2="78" stroke="white" strokeWidth="3" />
                                <line x1="0" y1="160" x2="520" y2="162" stroke="white" strokeWidth="2.5" />
                                <line x1="0" y1="240" x2="520" y2="238" stroke="white" strokeWidth="2.5" />
                                <line x1="90" y1="0" x2="88" y2="300" stroke="white" strokeWidth="3" />
                                <line x1="180" y1="0" x2="182" y2="300" stroke="white" strokeWidth="2.5" />
                                <line x1="310" y1="0" x2="308" y2="300" stroke="white" strokeWidth="2.5" />
                                <line x1="420" y1="0" x2="422" y2="300" stroke="white" strokeWidth="3" />
                                {/* Route glow */}
                                <motion.path
                                    d="M 65,235 C 120,210 180,195 245,185 C 300,178 370,195 455,188"
                                    fill="none" stroke="rgba(66,133,244,0.25)" strokeWidth="16" strokeLinecap="round"
                                    initial={{ pathLength: 0 }}
                                    whileInView={{ pathLength: 1, transition: { duration: 2.5, delay: 1.0, ease: "easeInOut" } }}
                                    viewport={{ once: true }}
                                />
                                {/* Route line — Google Maps blue */}
                                <motion.path
                                    d="M 65,235 C 120,210 180,195 245,185 C 300,178 370,195 455,188"
                                    fill="none" stroke="#4285F4" strokeWidth="5" strokeLinecap="round"
                                    initial={{ pathLength: 0 }}
                                    whileInView={{ pathLength: 1, transition: { duration: 2.5, delay: 1.0, ease: "easeInOut" } }}
                                    viewport={{ once: true }}
                                />
                                {/* Route outline */}
                                <motion.path
                                    d="M 65,235 C 120,210 180,195 245,185 C 300,178 370,195 455,188"
                                    fill="none" stroke="white" strokeWidth="8" strokeLinecap="round" opacity="0.4"
                                    initial={{ pathLength: 0 }}
                                    whileInView={{ pathLength: 1, transition: { duration: 2.3, delay: 1.0, ease: "easeInOut" } }}
                                    viewport={{ once: true }}
                                />
                            </svg>

                            {/* Stop 1 Pin — bottom-left, always visible */}
                            <motion.div
                                initial={{ scale: 0, y: -20, opacity: 0 }}
                                whileInView={{ scale: 1, y: 0, opacity: 1, transition: { delay: 1.0, duration: 0.6, type: "spring", bounce: 0.5 } }}
                                viewport={{ once: true }}
                                className="absolute"
                                style={{ left: 'calc(12% - 16px)', top: 'calc(78% - 48px)' }}
                            >
                                <div className="flex flex-col items-center">
                                    <div className="w-8 h-8 rounded-full bg-[#4285F4] border-2 border-white shadow-[0_4px_12px_rgba(66,133,244,0.6)] flex items-center justify-center">
                                        <span className="text-white font-black text-xs">1</span>
                                    </div>
                                    <div className="w-1 h-2 bg-[#4285F4]" />
                                    <div className="w-2 h-1 bg-[#4285F4] rounded-full" style={{ clipPath: 'polygon(50% 100%, 0% 0%, 100% 0%)' }} />
                                </div>
                                <div className="absolute top-0 left-10 bg-white rounded-lg shadow-xl border border-gray-100 px-2.5 py-1.5 whitespace-nowrap">
                                    <div className="text-navy font-black text-[10px]">The High Line</div>
                                    <div className="text-gray-400 text-[9px]">4:30 PM • Stop 1</div>
                                </div>
                            </motion.div>

                            {/* Stop 2 Pin — center, in lower half */}
                            <motion.div
                                initial={{ scale: 0, y: -20, opacity: 0 }}
                                whileInView={{ scale: 1, y: 0, opacity: 1, transition: { delay: 2.2, duration: 0.6, type: "spring", bounce: 0.5 } }}
                                viewport={{ once: true }}
                                className="absolute"
                                style={{ left: 'calc(46% - 16px)', top: 'calc(60% - 48px)' }}
                            >
                                <div className="flex flex-col items-center">
                                    <div className="w-8 h-8 rounded-full bg-[#a855f7] border-2 border-white shadow-[0_4px_12px_rgba(168,85,247,0.6)] flex items-center justify-center">
                                        <span className="text-white font-black text-xs">2</span>
                                    </div>
                                    <div className="w-1 h-2 bg-[#a855f7]" />
                                </div>
                                <div className="absolute top-0 left-10 bg-white rounded-lg shadow-xl border border-gray-100 px-2.5 py-1.5 whitespace-nowrap">
                                    <div className="text-navy font-black text-[10px]">Bar Pisellino</div>
                                    <div className="text-gray-400 text-[9px]">6:00 PM • Stop 2</div>
                                </div>
                            </motion.div>

                            {/* Stop 3 Pin — right side, lower half, label to the left */}
                            <motion.div
                                initial={{ scale: 0, y: -20, opacity: 0 }}
                                whileInView={{ scale: 1, y: 0, opacity: 1, transition: { delay: 3.2, duration: 0.6, type: "spring", bounce: 0.5 } }}
                                viewport={{ once: true }}
                                className="absolute"
                                style={{ left: 'calc(84% - 16px)', top: 'calc(62% - 48px)' }}
                            >
                                <div className="flex flex-col items-center">
                                    <motion.div
                                        animate={{ scale: [1, 1.15, 1] }}
                                        transition={{ repeat: Infinity, duration: 1.8 }}
                                        className="w-9 h-9 rounded-full bg-coral border-2 border-white shadow-[0_4px_16px_rgba(249,115,22,0.7)] flex items-center justify-center"
                                    >
                                        <span className="text-white font-black text-sm">3</span>
                                    </motion.div>
                                    <div className="w-1 h-2 bg-coral" />
                                </div>
                                {/* Label to the LEFT so it doesn't clip off right edge */}
                                <div className="absolute top-0 right-11 bg-white rounded-lg shadow-xl border border-coral/20 px-2.5 py-1.5 whitespace-nowrap">
                                    <div className="text-coral font-black text-[10px]">L'Artusi ★</div>
                                    <div className="text-gray-400 text-[9px]">8:00 PM • Stop 3</div>
                                </div>
                            </motion.div>

                            {/* Distance badge */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0, transition: { delay: 3.8 } }}
                                viewport={{ once: true }}
                                className="absolute bottom-3 right-3 bg-white border border-gray-200 shadow-md px-3 py-1.5 rounded-full flex items-center gap-2"
                            >
                                <MapPin className="w-3 h-3 text-coral" />
                                <span className="text-navy text-[10px] font-bold">~0.8 mi • 12 min walk</span>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
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
                                {/* Global Demo Toast */}
                                <AnimatePresence>
                                    {mockToast && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: -20, x: '-50%' }}
                                            animate={{ opacity: 1, y: 0, x: '-50%' }}
                                            exit={{ opacity: 0, y: -20, x: '-50%' }}
                                            className="absolute top-4 left-1/2 z-50 bg-navy text-white px-6 py-3 rounded-full shadow-2xl tracking-wide font-black text-xs flex items-center justify-center gap-2 w-max border border-white/10"
                                        >
                                            <Sparkles className="w-4 h-4 text-gold" />
                                            {mockToast}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
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
