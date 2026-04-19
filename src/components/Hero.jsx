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
        <section className="relative pt-32 pb-20 overflow-hidden bg-white">
            {/* Background Decor - Enhanced */}
            <div className="absolute top-0 right-0 -z-10 w-2/3 h-full bg-gradient-to-bl from-violet-100/50 via-soft-pink/30 to-transparent rounded-l-[120px] blur-3xl opacity-70" />
            <div className="absolute -top-32 -left-32 -z-10 w-[500px] h-[500px] bg-gradient-to-br from-gold/20 via-coral/10 to-transparent rounded-full blur-3xl animate-pulse" />

            {/* Grid Pattern Overlay */}
            <div className="absolute inset-0 -z-10 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-[0.03]" />

            <div className="container-custom grid lg:grid-cols-2 gap-12 items-center relative z-10">
                <div className="text-center lg:text-left space-y-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-navy/5 border border-navy/10 text-navy rounded-full text-sm font-bold shadow-sm backdrop-blur-sm">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-coral to-pink-500 text-white">
                            <Sparkles className="w-3 h-3" />
                        </div>
                        <span className="pl-1">Available now in NYC & NJ</span>
                    </div>

                    <h1 className="text-4xl md:text-7xl lg:text-[76px] font-black text-navy leading-[1.05] tracking-tight">
                        Stop arguing.<br />Start <span className="text-transparent bg-clip-text bg-gradient-to-r from-coral via-pink-500 to-violet-500 animate-gradient-x">dating.</span>
                    </h1>

                    <p className="text-xl text-gray-500 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
                        The AI date planner that actually works. We use real restaurants and hidden gems to build your perfect, ready-to-go itinerary in seconds in your city.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-5 pt-4">
                        <Link to="/signup" className="bg-gradient-to-r from-orange-500 via-coral to-pink-500 text-white px-8 py-4 rounded-2xl font-black text-lg flex items-center gap-2 shadow-[0_10px_40px_rgba(249,115,22,0.3)] hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(249,115,22,0.4)] transition-all group focus:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2 relative overflow-hidden">
                            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                            <span className="relative z-10">Start My Plan for Free</span>
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10" />
                        </Link>
                        <button
                            onClick={() => window.open('/demo', '_blank')}
                            className="flex items-center gap-2 text-navy font-bold hover:text-coral transition-colors bg-white border-2 border-gray-200 px-6 py-4 rounded-2xl hover:border-coral group shadow-sm active:scale-95"
                        >
                            <div className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center group-hover:border-coral transition-colors bg-navy/5">
                                <Play className="w-4 h-4 fill-navy group-hover:fill-coral group-hover:text-coral transition-colors" />
                            </div>
                            See It In Action
                        </button>
                    </div>

                    <div className="pt-6 flex items-center justify-center lg:justify-start gap-4">
                        <div className="flex -space-x-3">
                            <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop" alt="User" className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-sm" />
                            <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop" alt="User" className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-sm" />
                            <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" alt="User" className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-sm" />
                            <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] font-black text-navy shadow-sm">+5k</div>
                        </div>
                        <div className="flex flex-col">
                            <div className="flex gap-1">
                                {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />)}
                            </div>
                            <span className="text-xs font-bold text-gray-500">Loved by 5,000+ couples</span>
                        </div>
                    </div>
                </div>

                <div className="relative">
                    {/* App Mockup Placeholder */}
                    <div className="relative z-10 bg-white rounded-[40px] shadow-2xl border-8 border-navy/5 overflow-hidden w-full max-w-[420px] mx-auto h-[600px] flex flex-col">
                        
                        {/* Mockup Header - High Fidelity Dashboard Style */}
                        <div className="bg-[#0c1222] text-white flex-shrink-0 relative z-20 shadow-md">
                            <div className="p-4 border-b border-white/10">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-coral/10 border border-coral/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                            <Heart className="w-4 h-4 fill-coral text-coral" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <span className="block text-sm font-black leading-tight tracking-tight truncate font-inter">Boutique Romantic Date</span>
                                            </div>
                                            <span className="text-[9px] opacity-70 uppercase tracking-widest font-black font-inter">Available in New York City</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                        <button
                                            onClick={(e) => { e.preventDefault(); triggerToast("This would let you customize the plan."); }}
                                            className="flex items-center gap-1 px-2.5 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-all text-[9px] font-black font-inter"
                                        >
                                            <Sparkles className="w-3 h-3" />
                                            <span>Steal</span>
                                        </button>
                                        <button
                                            onClick={(e) => { e.preventDefault(); setShareTooltip(true); setTimeout(() => setShareTooltip(false), 2000); }}
                                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-coral/90 hover:bg-coral border border-coral rounded-lg transition-all text-[9px] sm:text-[10px] font-black group font-inter text-white shadow-md shadow-coral/20 relative"
                                        >
                                            <Share2 className="w-3.5 h-3.5 text-white group-hover:scale-110 transition-transform" />
                                            <span className="hidden sm:inline">Share link</span>
                                            <span className="sm:hidden">Share</span>
                                            {shareTooltip && (
                                                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-navy text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap animate-in fade-in zoom-in-90 tracking-tight z-50 pointer-events-none">Link Copied!</div>
                                            )}
                                        </button>
                                        <button className="min-w-[32px] min-h-[32px] flex items-center justify-center text-gray-400 hover:text-white rounded-xl transition-all">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                {/* Feature Switcher Tabs - Minimal */}
                                <div className="flex bg-white/5 rounded-xl p-1 justify-between gap-0.5">
                                    {features.map((f) => (
                                        <button
                                            key={f.id}
                                            type="button"
                                            onClick={() => setActiveFeature(f.id)}
                                            className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 py-2 rounded-lg transition-all min-w-0 ${activeFeature === f.id
                                                ? 'bg-white text-navy shadow-sm'
                                                : 'text-white/40 hover:text-white'
                                                }`}
                                        >
                                            {React.cloneElement(f.icon, { className: 'w-3.5 h-3.5 shrink-0' })}
                                            <span className="text-[8px] font-black uppercase tracking-wider leading-tight text-center">{f.label}</span>
                                            {f.comingSoon && (
                                                <span className="text-[6px] font-black uppercase tracking-tighter text-coral/90">Soon</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {/* Tip Bar */}
                            <p className="px-3 py-2 text-[10px] sm:text-[11px] text-white/80 font-medium bg-[#0c1222] border-b border-white/10 leading-snug z-20 relative text-center">
                                Tip: <span className="font-black text-coral/95">Share</span> sends a link your date can open.
                            </p>
                        </div>

                        {/* Expanded Mobile Map view */}
                        <AnimatePresence>
                            {showMapMobile && (
                                <motion.div
                                    initial={{ y: '100%' }}
                                    animate={{ y: 0 }}
                                    exit={{ y: '100%' }}
                                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                    className="absolute inset-x-0 bottom-0 top-[148px] bg-white z-50 flex flex-col rounded-b-[32px] overflow-hidden shadow-2xl"
                                >
                                    <div className="p-4 bg-white border-b border-gray-100 flex items-center justify-between shadow-sm z-10">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-coral/10 flex items-center justify-center">
                                                <MapIcon className="w-5 h-5 text-coral" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-black text-navy leading-tight">Interactive Map</h3>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">All Date Locations</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setShowMapMobile(false)}
                                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-navy rounded-xl font-black text-[11px] transition-all flex items-center gap-2"
                                        >
                                            <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                                            Back
                                        </button>
                                    </div>
                                    <div className="flex-1 w-full bg-gray-100 relative">
                                        {isLoaded ? (
                                            <GoogleMap
                                                mapContainerStyle={{ width: '100%', height: '100%' }}
                                                center={mapCenter}
                                                zoom={14}
                                                options={{ disableDefaultUI: true, gestureHandling: 'greedy', styles: customMapStyle }}
                                            >
                                                {demoItinerary.map((step) => (
                                                    <Marker
                                                        key={step.id}
                                                        position={{ lat: step.lat, lng: step.lng }}
                                                        onClick={() => handleStepInteraction(step)}
                                                        icon={selectedMarkerId === step.id ? undefined : {
                                                            path: window.google?.maps.SymbolPath.CIRCLE,
                                                            scale: 8,
                                                            fillColor: "#f97316",
                                                            fillOpacity: 0.9,
                                                            strokeWeight: 2,
                                                            strokeColor: "white"
                                                        }}
                                                    />
                                                ))}
                                            </GoogleMap>
                                        ) : (
                                            <div className="w-full h-full bg-gray-200" />
                                        )}
                                    </div>
                                    <div className="p-4 bg-white border-t border-gray-100 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
                                        <button
                                            onClick={() => setShowMapMobile(false)}
                                            className="w-full py-3.5 bg-navy text-white rounded-xl font-black text-sm active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                            Back to Itinerary
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Mockup Content Body */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar relative bg-gray-50/50">
                            {activeFeature === 'itinerary' ? (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative flex flex-col">
                                    {/* Small Top Map Integration */}
                                    <div className="h-[180px] w-full relative z-30 border-b border-gray-100 flex-shrink-0">
                                        {isLoaded ? (
                                            <GoogleMap
                                                mapContainerStyle={{ width: '100%', height: '100%' }}
                                                center={mapCenter}
                                                zoom={15}
                                                options={{ disableDefaultUI: true, gestureHandling: 'none' }}
                                            >
                                                {demoItinerary.map((step) => (
                                                    <Marker
                                                        key={step.id}
                                                        position={{ lat: step.lat, lng: step.lng }}
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
                                        ) : (
                                            <div className="w-full h-full bg-gray-200" />
                                        )}
                                        <div className="absolute inset-x-0 bottom-4 z-20 flex justify-center pointer-events-none">
                                            <button 
                                                onClick={() => setShowMapMobile(true)}
                                                className="bg-navy/95 backdrop-blur-md text-white px-5 py-2.5 rounded-full text-xs font-black shadow-2xl flex items-center gap-2 border border-white/20 transform transition-all active:scale-95 cursor-pointer hover:scale-[1.05] font-inter hover:bg-navy pointer-events-auto ring-4 ring-navy/5"
                                            >
                                                <MapIcon className="w-4 h-4 text-coral" />
                                                Expand Map
                                            </button>
                                        </div>
                                    </div>

                                    {/* Itinerary Steps */}
                                    <div className="p-4 pt-10 relative z-10 mt-[-2rem] bg-white rounded-t-[2rem] space-y-8">
                                        <div className="relative border-l-2 border-dashed border-gray-200 ml-10 pb-4 space-y-12">
                                            {demoItinerary.map((step, idx) => {
                                                const icons = [
                                                    <Utensils className="w-3.5 h-3.5 text-coral" />,
                                                    <Compass className="w-3.5 h-3.5 text-gold" />,
                                                    <Ticket className="w-3.5 h-3.5 text-purple-500" />
                                                ];
                                                return (
                                                    <div key={idx} className="relative pl-6 cursor-pointer group/step" onClick={() => handleStepInteraction(step)}>
                                                        {/* Left Absolute Time */}
                                                        <div className="absolute -left-14 top-1 text-[10px] font-black text-gray-400 text-right w-10">
                                                            <div>{step.time}</div>
                                                            <div className="text-[8px] opacity-60">PM</div>
                                                        </div>

                                                        {/* Center Dot */}
                                                        <div className={`absolute -left-[7px] top-2 w-3 h-3 rounded-full border-2 border-white shadow-sm bg-coral transition-transform group-hover/step:scale-125`} />

                                                        {/* Right Card - High Fidelity */}
                                                        <div className={`rounded-3xl p-4 flex flex-col gap-3 transition-all ${selectedMarkerId === step.id ? 'bg-white border-2 border-coral/20 shadow-md ring-4 ring-coral/5' : 'bg-white border border-gray-100 shadow-sm hover:shadow-md'}`}>
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                                                                    {icons[idx % icons.length]}
                                                                </div>
                                                                <div className="flex-1">
                                                                    <div className="flex items-center justify-between gap-1">
                                                                        <h4 className="text-sm font-black text-navy leading-tight">{step.venue}</h4>
                                                                        <span className="text-[10px] font-bold text-gray-300">{step.time}</span>
                                                                    </div>
                                                                    <p className="text-[9px] text-coral font-bold uppercase tracking-wider">{step.activity}</p>
                                                                </div>
                                                            </div>
                                                            <p className="text-[11px] text-gray-500 leading-relaxed font-medium">{step.description}</p>
                                                            {step.photoUrl && (
                                                                <img src={step.photoUrl} alt={step.venue} className="rounded-2xl w-full h-32 object-cover border border-gray-50 shadow-sm" />
                                                            )}

                                                            {/* Action Buttons - High Fidelity Match */}
                                                            <div className="flex flex-wrap items-center gap-3 mt-2">
                                                                <button
                                                                    onClick={(e) => handleSwitchUp(step.id, e)}
                                                                    className={`px-4 py-2 text-white text-[11px] font-black rounded-xl hover:shadow-lg transition-all active:scale-95 flex items-center gap-1.5 shadow-md bg-gradient-to-r from-violet-600 to-indigo-600 hover:shadow-indigo-500/30`}
                                                                >
                                                                    <Sparkles className="w-3.5 h-3.5" /> Swap This Spot
                                                                </button>
                                                                <a
                                                                    onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleDemoToast("This would visit the venue's website.", "info"); }}
                                                                    href="#"
                                                                    className="px-4 py-2 bg-white text-navy border border-gray-200 text-[11px] font-black rounded-xl hover:bg-gray-50 transition-all flex items-center gap-1.5 shadow-sm"
                                                                >
                                                                    <Ticket className="w-3.5 h-3.5 text-coral" /> Visit Website
                                                                </a>
                                                                <a
                                                                    onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleDemoToast("This would search for the venue on Google.", "info"); }}
                                                                    href="#"
                                                                    className="px-4 py-2 bg-white text-navy border border-gray-200 text-[11px] font-black rounded-xl hover:bg-gray-50 transition-all flex items-center gap-1.5 shadow-sm"
                                                                >
                                                                    <Search className="w-3.5 h-3.5" /> Search on Google
                                                                </a>
                                                                <a
                                                                    onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleDemoToast("This would open Google Maps directions.", "info"); }}
                                                                    href="#"
                                                                    className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-white text-[11px] font-black rounded-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
                                                                >
                                                                    <Navigation className="w-3.5 h-3.5" /> Get Directions
                                                                </a>
                                                                <a
                                                                    onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleDemoToast("This would open the Uber app to book a ride.", "info"); }}
                                                                    href="#"
                                                                    className="px-4 py-2 bg-black text-white text-[11px] font-black rounded-xl hover:bg-gray-900 transition-all flex items-center gap-1.5 shadow-md"
                                                                >
                                                                    <Car className="w-3.5 h-3.5" /> Get a Ride
                                                                </a>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Community Feedback & Trending Spots Section */}
                                        <div className="mt-8 border-t border-gray-100 pt-8 pb-10">
                                            <div className="flex items-center justify-between mb-5">
                                                <h3 className="text-xl font-black text-navy flex items-center gap-2">
                                                    🔥 Trending Spots near you
                                                </h3>
                                            </div>
                                            <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory shrink-0">
                                                <div className="min-w-[220px] max-w-[220px] bg-white rounded-2xl p-3 border border-gray-100 snap-center shadow-sm hover:shadow-md transition-shadow">
                                                    <img src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80" alt="Chelsea Market" className="w-full h-32 object-cover rounded-xl mb-3" />
                                                    <h4 className="text-sm font-black text-navy leading-tight">Chelsea Market</h4>
                                                    <p className="text-[10px] text-coral font-bold uppercase tracking-wider mb-1.5 mt-0.5">Artisan Bites</p>
                                                    <span className="text-[11px] text-gray-500 font-medium line-clamp-2 leading-relaxed">A hot spot for impromptu food dates in the area with tons of vendors.</span>
                                                </div>
                                                <div className="min-w-[220px] max-w-[220px] bg-white rounded-2xl p-3 border border-gray-100 snap-center shadow-sm hover:shadow-md transition-shadow">
                                                    <img src="https://images.unsplash.com/photo-1560624052-449f5ddf0c31?w=800&q=80" alt="Bar Pisellino" className="w-full h-32 object-cover rounded-xl mb-3" />
                                                    <h4 className="text-sm font-black text-navy leading-tight">Bar Pisellino</h4>
                                                    <p className="text-[10px] text-coral font-bold uppercase tracking-wider mb-1.5 mt-0.5">Italian Aperitivo</p>
                                                    <span className="text-[11px] text-gray-500 font-medium line-clamp-2 leading-relaxed">Extremely popular street-style Italian cocktails.</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-8">
                                    {/* Placeholder for other features in mockup */}
                                </div>
                            )}
                        </div>


                        {activeFeature === 'sync' && (
                            <div className="flex flex-col items-center justify-center h-full text-center space-y-6 animate-in fade-in zoom-in duration-500 py-10 px-4">
                                <span className="text-[10px] font-black uppercase tracking-widest text-violet-600 bg-violet-50 px-3 py-1 rounded-full border border-violet-100">Coming soon</span>
                                <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center shadow-inner">
                                    <Calendar className="w-10 h-10" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold text-navy">Google Calendar Sync</h3>
                                    <p className="text-sm text-gray-500 px-6">We&apos;re building one-tap calendar export and reminders. Preview of the experience below.</p>
                                </div>
                                <label className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm cursor-default opacity-60">
                                    <div className="w-10 h-6 bg-blue-600 rounded-full relative">
                                        <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                                    </div>
                                    <span className="font-bold text-sm text-navy">Sync (preview)</span>
                                </label>
                            </div>
                        )}

                        {activeFeature === 'share' && (
                            <div className="flex flex-col items-center justify-center h-full text-center space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 py-10 px-4">
                                <div className="w-20 h-20 bg-soft-pink text-coral rounded-3xl flex items-center justify-center">
                                    <Share2 className="w-10 h-10" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold text-navy">Shareable Itinerary</h3>
                                    <p className="text-sm text-gray-500 px-6">Share a link from your real plan in the app. Preview links may hide some stops until unlock—exact behavior depends on your plan.</p>
                                </div>
                                <div className="w-full bg-white p-4 rounded-2xl border border-dashed border-gray-200 flex items-center justify-between gap-4">
                                    <span className="text-xs font-mono text-gray-400 truncate">datespark.live/v/x92_s0v...</span>
                                    <button className="text-coral font-bold text-xs uppercase hover:underline">Copy Link</button>
                                </div>
                            </div>
                        )}

                        {activeFeature === 'budget' && (
                            <div className="flex flex-col items-center justify-center h-full text-center space-y-6 animate-in fade-in slide-in-from-left-4 duration-500 py-10 px-4">
                                <span className="text-[10px] font-black uppercase tracking-widest text-violet-600 bg-violet-50 px-3 py-1 rounded-full border border-violet-100">Coming soon</span>
                                <div className="w-20 h-20 bg-gold/10 text-gold rounded-3xl flex items-center justify-center">
                                    <Wallet className="w-10 h-10" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold text-navy">Smart Budget Guard</h3>
                                    <p className="text-sm text-gray-500 px-6">We&apos;re refining stricter budget tracking across stops. You already set budget in the planner—this screen is a preview.</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4 w-full">
                                    <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                        <span className="block text-[10px] font-bold text-gray-400 uppercase">Est. Cost</span>
                                        <span className="text-lg font-bold text-navy">$118.00</span>
                                    </div>
                                    <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                        <span className="block text-[10px] font-bold text-gray-400 uppercase overflow-hidden text-ellipsis whitespace-nowrap">Budget Status</span>
                                        <span className="text-lg font-bold text-green-500">-$32 Left</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <Link to="/signup" className="w-full bg-navy text-white py-5 rounded-2xl font-black text-xl tracking-tight flex items-center justify-center gap-3 mt-8 shadow-[0_20px_40px_rgba(10,25,47,0.3)] hover:scale-[1.02] transition-transform active:scale-95 leading-none relative z-30 group">
                            <span className="relative z-10">Plan Your Date</span>
                            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                    <div className="hidden md:flex absolute -left-16 bottom-24 bg-white p-5 rounded-[28px] shadow-2xl flex-col gap-1 items-start z-10 border border-gray-100 group hover:-translate-y-2 transition-transform cursor-default max-w-[240px]">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-coral animate-ping" />
                            <span className="text-[10px] font-bold text-coral uppercase tracking-widest">Live Updates</span>
                        </div>
                        <div className="font-black text-navy">Nearby secrets active now</div>
                    </div>
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
    );
};

export default Hero;
