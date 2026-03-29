import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Clock, DollarSign, ArrowRight, Play, Heart, Ticket, Share2, Wallet, CheckCircle, X, Star, Map as MapIcon, Utensils, Compass, Car, Search, Sparkles } from 'lucide-react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

const DEMO_PLAN = {
    vibe: 'Fun & Active',
    location: 'New York City',
    date: 'March 29, 2026',
    itinerary: [
        {
            id: 1,
            time: '3:30 PM',
            activity: 'AFTERNOON SIGHTS',
            venue: 'The Local Overlook',
            description: 'Kickoff the date by taking in some local scenery. Rating: 4.3 ⭐ (276 reviews). Price: $$. A top-rated spot. Make sure to take pictures!',
            photoUrl: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&q=80',
            lat: 40.7128, lng: -74.0060,
            rating: 4.3, reviews: 276, price: '$$',
            directionsUrl: '#', bookingUrl: '#', bookingType: 'tickets'
        },
        {
            id: 2,
            time: '6:00 PM',
            activity: 'SCENIC WALK',
            venue: 'Skyline Park',
            description: 'Sunset walk with gorgeous views. Rating: 4.8 ⭐ (34,102 reviews). Price: Free. Beautiful skyline and nature paths.',
            photoUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80',
            lat: 40.7150, lng: -74.0100,
            rating: 4.8, reviews: 34102, price: 'Free',
            directionsUrl: '#'
        },
        {
            id: 3,
            time: '7:30 PM',
            activity: 'CANDLELIGHT DINNER',
            venue: 'Bistro 22',
            description: 'Cozy Dining & Candlelight. Rating: 4.6 ⭐ (2,432 reviews). Price: $$$. Signature handmade dishes and a curated wine list.',
            photoUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
            lat: 40.7100, lng: -74.0080,
            rating: 4.6, reviews: 2432, price: '$$$',
            directionsUrl: '#', bookingUrl: '#', bookingType: 'opentable'
        }
    ]
};

const Hero = () => {
    const [showDemoModal, setShowDemoModal] = useState(false);
    const [showMapMobile, setShowMapMobile] = useState(false);
    const [demoItinerary, setDemoItinerary] = useState(DEMO_PLAN.itinerary);
    const [mapCenter, setMapCenter] = useState({ lat: 40.7128, lng: -74.0060 });
    const [selectedMarkerId, setSelectedMarkerId] = useState(1);
    const [shareTooltip, setShareTooltip] = useState(false);
    const [activeFeature, setActiveFeature] = useState('itinerary');
    const navigate = useNavigate();

    const handleStepInteraction = (step) => {
        setMapCenter({ lat: step.lat, lng: step.lng });
        setSelectedMarkerId(step.id);
    };

    const handleSwitchUp = (stepId, e) => {
        e.stopPropagation();
        setDemoItinerary(prev => prev.map(step => {
            if (step.id === stepId) {
                return {
                    ...step,
                    venue: step.venue === 'The Local Overlook' ? 'Sushi Garden' : 'The Local Overlook',
                    description: step.venue === 'The Local Overlook' 
                        ? 'Fresh omakase and premium sake in a serene garden. Rating: 4.9 ⭐. Price: $$$' 
                        : 'Kickoff the date by taking in some local scenery. Rating: 4.3 ⭐. Price: $$'
                };
            }
            return step;
        }));
    };

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
    });

    const features = [
        { id: 'itinerary', icon: <Ticket className="w-5 h-5" />, label: 'Itinerary' },
        { id: 'sync', icon: <Calendar className="w-5 h-5" />, label: 'Sync' },
        { id: 'share', icon: <Share2 className="w-5 h-5" />, label: 'Share' },
        { id: 'budget', icon: <Wallet className="w-5 h-5" />, label: 'Budget' },
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
                        <span className="pl-1">Available now in NYC</span>
                    </div>

                    <h1 className="text-4xl md:text-7xl lg:text-[80px] font-black text-navy leading-[1.05] tracking-tight">
                        Get a full date night plan in <span className="text-transparent bg-clip-text bg-gradient-to-r from-coral via-pink-500 to-violet-500 animate-gradient-x">seconds.</span>
                    </h1>

                    <p className="text-xl text-gray-500 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
                        Stop arguing about where to go. We use real restaurants, bars, and local events to build your perfect, ready-to-go itinerary.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-5 pt-4">
                        <Link to="/signup" className="bg-navy text-white px-8 py-4 rounded-2xl font-black text-lg flex items-center gap-2 shadow-[0_10px_40px_rgba(10,25,47,0.2)] hover:scale-[1.02] hover:shadow-[0_20px_60px_rgba(10,25,47,0.3)] transition-all group">
                            Start My Plan <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <button
                            onClick={() => setShowDemoModal(true)}
                            className="flex items-center gap-2 text-navy font-bold hover:text-coral transition-colors bg-white border-2 border-gray-200 px-6 py-4 rounded-2xl hover:border-coral group shadow-sm active:scale-95"
                        >
                            <div className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center group-hover:border-coral transition-colors">
                                <Play className="w-4 h-4 fill-navy group-hover:fill-coral group-hover:text-coral transition-colors" />
                            </div>
                            See a Demo
                        </button>
                    </div>
                </div>

                <div className="relative">
                    {/* App Mockup Placeholder */}
                    <div className="relative z-10 bg-white rounded-[40px] shadow-2xl border-8 border-navy/5 overflow-hidden w-full max-w-[420px] mx-auto h-[600px] flex flex-col">                        {/* Mockup Header - Dark App Style */}
                        <div className="p-4 bg-navy text-white flex-shrink-0">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm">
                                        <Heart className="w-4 h-4 text-white fill-coral" />
                                    </div>
                                    <div>
                                        <span className="block text-xs font-black leading-tight">Fun & Active Date</span>
                                        <span className="text-[8px] opacity-60 uppercase tracking-widest font-black mt-0.5">March 29, 2026</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => {
                                            setShareTooltip(true);
                                            setTimeout(() => setShareTooltip(false), 2000);
                                        }}
                                        className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all relative"
                                    >
                                        <Share2 className="w-3.5 h-3.5 text-coral" />
                                        <span className="text-[10px] font-bold">Share Plan</span>
                                        {shareTooltip && (
                                            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-navy text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap animate-in fade-in zoom-in-90 tracking-tight">Link Copied!</div>
                                        )}
                                    </button>
                                    <button className="p-1 text-gray-400 hover:text-white transition-colors">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Feature Switcher Tabs - Minimal */}
                            <div className="flex bg-white/5 rounded-xl p-1 justify-between">
                                {features.map((f) => (
                                    <button
                                        key={f.id}
                                        onClick={() => setActiveFeature(f.id)}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${activeFeature === f.id
                                            ? 'bg-white text-navy shadow-sm'
                                            : 'text-white/40 hover:text-white'
                                            }`}
                                    >
                                        {React.cloneElement(f.icon, { className: 'w-3.5 h-3.5' })}
                                        <span className="text-[9px] font-black uppercase tracking-wider">{f.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Mockup Content Body */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar relative bg-gray-50/50">
                            {activeFeature === 'itinerary' ? (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative flex flex-col">
                                    {/* Small Top Map Integration */}
                                    <div className="h-[180px] w-full relative z-0 border-b border-gray-100 flex-shrink-0">
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
                                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 w-full flex justify-center">
                                            <button className="bg-navy/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-[10px] font-black shadow-lg flex items-center gap-1.5 border border-white/20 pointer-events-none">
                                                <MapIcon className="w-3 h-3" />
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

                                                            {/* Action Row - Small and Multi-colored */}
                                                            <div className="flex flex-wrap gap-1.5 pt-1">
                                                                <button className="px-2 py-1 bg-blue-50 text-blue-600 outline outline-1 outline-blue-100 text-[8px] font-black rounded-lg whitespace-nowrap">Get Directions</button>
                                                                <button className="px-2 py-1 bg-green-50 text-green-600 outline outline-1 outline-green-100 text-[8px] font-black rounded-lg whitespace-nowrap">Find Tickets</button>
                                                                <button 
                                                                    onClick={(e) => handleSwitchUp(step.id, e)}
                                                                    className="px-2 py-1 bg-purple-50 text-purple-600 outline outline-1 outline-purple-100 text-[8px] font-black rounded-lg whitespace-nowrap hover:bg-purple-600 hover:text-white transition-all active:scale-95"
                                                                >
                                                                    Switch Up
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        window.open(`https://www.google.com/search?q=${encodeURIComponent(step.venue + ' ' + (step.location_name || ''))}`, '_blank');
                                                                    }}
                                                                    className="px-2 py-1 bg-gray-50 text-gray-600 outline outline-1 outline-gray-100 text-[8px] font-black rounded-lg whitespace-nowrap hover:bg-gray-800 hover:text-white transition-all active:scale-95 flex items-center gap-1"
                                                                >
                                                                    <Search className="w-2 h-2" /> Search
                                                                </button>
                                                                <button className="px-2 py-1 bg-black text-white text-[8px] font-black rounded-lg whitespace-nowrap">Get a Ride</button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
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
                                <div className="flex flex-col items-center justify-center h-full text-center space-y-6 animate-in fade-in zoom-in duration-500 py-10">
                                    <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center shadow-inner">
                                        <Calendar className="w-10 h-10" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-bold text-navy">Google Calendar Sync</h3>
                                        <p className="text-sm text-gray-500 px-6">Automatically add tonight's schedule and location maps to both your calendars.</p>
                                    </div>
                                    <label className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm cursor-pointer hover:bg-gray-50 transition-colors">
                                        <div className="w-10 h-6 bg-blue-600 rounded-full relative">
                                            <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                                        </div>
                                        <span className="font-bold text-sm text-navy">Sync Enabled</span>
                                    </label>
                                </div>
                            )}

                            {activeFeature === 'share' && (
                                <div className="flex flex-col items-center justify-center h-full text-center space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 py-10">
                                    <div className="w-20 h-20 bg-soft-pink text-coral rounded-3xl flex items-center justify-center">
                                        <Share2 className="w-10 h-10" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-bold text-navy">Shareable Itinerary</h3>
                                        <p className="text-sm text-gray-500 px-6">Send a private web link to your date. They can see the plan but you keep the location a secret until 4pm!</p>
                                    </div>
                                    <div className="w-full bg-white p-4 rounded-2xl border border-dashed border-gray-200 flex items-center justify-between gap-4">
                                        <span className="text-xs font-mono text-gray-400 truncate">datespark.live/v/x92_s0v...</span>
                                        <button className="text-coral font-bold text-xs uppercase hover:underline">Copy Link</button>
                                    </div>
                                </div>
                            )}

                            {activeFeature === 'budget' && (
                                <div className="flex flex-col items-center justify-center h-full text-center space-y-6 animate-in fade-in slide-in-from-left-4 duration-500 py-10">
                                    <div className="w-20 h-20 bg-gold/10 text-gold rounded-3xl flex items-center justify-center">
                                        <Wallet className="w-10 h-10" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-bold text-navy">Smart Budget Guard</h3>
                                        <p className="text-sm text-gray-500 px-6">We only pick spots that fit your $150/person limit. No surprise $20 cocktails here.</p>
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
                                            <h2 className="text-lg font-black font-outfit leading-tight">Fun & Active Date</h2>
                                            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black mt-1">March 29, 2026</p>
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

                                                    {/* Right Card - Premium Look */}
                                                    <div className={`rounded-[2.5rem] p-6 flex flex-col gap-4 transition-all ${selectedMarkerId === step.id ? 'bg-white border-2 border-coral/20 shadow-xl ring-8 ring-coral/5' : 'bg-white border border-gray-100 shadow-md hover:shadow-xl'}`}>
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                                                                {icons[idx % icons.length]}
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <h4 className="text-lg font-black text-navy">{step.venue}</h4>
                                                                    {step.rating && (
                                                                        <div className="flex items-center gap-1 bg-amber-50 text-amber-500 px-2 py-1 rounded-lg text-xs font-black border border-amber-100 flex-shrink-0">
                                                                            <Star className="w-4 h-4 fill-current" />
                                                                            {step.rating}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <p className="text-sm text-coral font-bold uppercase tracking-wider">{step.activity}</p>
                                                            </div>
                                                        </div>
                                                        <p className="text-base text-gray-500 border-t border-gray-50 pt-4 mt-1 leading-relaxed font-medium">{step.description}</p>
                                                        {step.photoUrl && (
                                                            <img src={step.photoUrl} alt={step.venue} className="rounded-[2rem] w-full h-48 object-cover border border-gray-50 shadow-sm mt-1 mb-2" />
                                                        )}

                                                        {/* Action Row - Full Buttons */}
                                                        <div className="flex flex-wrap items-center gap-3 mt-2">
                                                            <button className="px-4 py-2.5 bg-blue-50 text-blue-600 outline outline-1 outline-blue-200 text-xs font-black rounded-xl hover:bg-blue-600 hover:text-white transition-all flex items-center gap-2 shadow-sm">
                                                                <MapPin className="w-4 h-4" /> Get Directions
                                                            </button>
                                                            <button className="px-4 py-2.5 bg-green-50 text-green-600 outline outline-1 outline-green-200 text-xs font-black rounded-xl hover:bg-green-600 hover:text-white transition-all flex items-center gap-2 shadow-sm">
                                                                <Ticket className="w-4 h-4" /> Find Tickets
                                                            </button>
                                                            <button 
                                                                onClick={(e) => handleSwitchUp(step.id, e)}
                                                                className="px-4 py-2.5 bg-purple-50 text-purple-600 outline outline-1 outline-purple-200 text-xs font-black rounded-xl hover:bg-purple-600 hover:text-white transition-all flex items-center gap-2 shadow-sm"
                                                            >
                                                                <Sparkles className="w-4 h-4" /> Switch Up
                                                            </button>
                                                            <button 
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    window.open(`https://www.google.com/search?q=${encodeURIComponent(step.venue + ' ' + (step.address || ''))}`, '_blank');
                                                                }}
                                                                className="px-4 py-2.5 bg-gray-50 text-gray-600 outline outline-1 outline-gray-200 text-xs font-black rounded-xl hover:bg-gray-800 hover:text-white transition-all flex items-center gap-2 shadow-sm"
                                                            >
                                                                <Search className="w-4 h-4" /> Search on Google
                                                            </button>
                                                            <button className="px-4 py-2.5 bg-black text-white text-xs font-black rounded-xl hover:bg-gray-800 transition-colors flex items-center gap-2 shadow-sm">
                                                                <Car className="w-4 h-4" /> Get a Ride
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
