import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Monitor, Smartphone, Sparkles, Calendar, Share2, ArrowRight, Utensils, Compass, Camera, MapPin, Footprints, Navigation, Search, Car, Ticket, Quote } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import { useGoogleMaps } from '../../lib/googleMaps';

const makeSvgPin = (label, fill, isSelected) => {
    const size = isSelected ? 44 : 34;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size * 1.4}" viewBox="0 0 34 48">
        <path d="M17 0C7.6 0 0 7.6 0 17c0 12.3 17 31 17 31S34 29.3 34 17C34 7.6 26.4 0 17 0z" fill="#${fill}" stroke="white" stroke-width="2"/>
        <text x="17" y="22" text-anchor="middle" font-family="Arial,sans-serif" font-size="13" font-weight="900" fill="white">${label}</text>
    </svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const DEMO_STEPS = [
    {
        id: 1,
        title: 'Step 1: AI Preference Setup',
        timeRange: '0s - 15s',
        startTime: 0,
        endTime: 15,
        desc: 'Select your vibe, location, and budget. Let the Gemini AI engine process options instantly.',
        icon: Sparkles
    },
    {
        id: 2,
        title: 'Step 2: Interactive Timeline',
        timeRange: '15s - 30s',
        startTime: 15,
        endTime: 30,
        desc: 'Watch the timeline sync. View real venues, scheduled timings, and interactive map points.',
        icon: Calendar
    },
    {
        id: 3,
        title: 'Step 3: One-Tap Sharing',
        timeRange: '30s - 45s',
        startTime: 30,
        endTime: 45,
        desc: 'Instantly generate a beautiful itinerary link and share it directly with your partner.',
        icon: Share2
    }
];

const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const InteractiveDemo = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [speed, setSpeed] = useState(1);
    const progressRef = useRef(progress);
    const isPlayingRef = useRef(isPlaying);
    const speedRef = useRef(speed);
    const MAX_TIME = 45;

    // Keep refs in sync for the interval
    useEffect(() => { progressRef.current = progress; }, [progress]);
    useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
    useEffect(() => { speedRef.current = speed; }, [speed]);

    useEffect(() => {
        let interval;
        if (isPlaying) {
            interval = setInterval(() => {
                let nextProgress = progressRef.current + (0.1 * speedRef.current);
                if (nextProgress >= MAX_TIME) {
                    nextProgress = MAX_TIME;
                    setIsPlaying(false);
                }
                setProgress(nextProgress);
            }, 100);
        }
        return () => clearInterval(interval);
    }, [isPlaying]);

    const handleTimelineClick = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, clickX / rect.width));
        setProgress(percentage * MAX_TIME);
    };

    const togglePlay = () => {
        if (progress >= MAX_TIME) setProgress(0);
        setIsPlaying(!isPlaying);
    };

    const activeStep = DEMO_STEPS.find(s => progress >= s.startTime && progress < s.endTime) || DEMO_STEPS[2];

    return (
        <section className="py-24 bg-gradient-to-b from-white to-[#F8FAFC] relative overflow-hidden">
            {/* Background elements to match screenshot aesthetics */}
            <div className="absolute top-0 inset-x-0 flex justify-center -z-10 pointer-events-none opacity-50">
                <div className="w-[800px] h-[500px] bg-violet-100 rounded-full blur-[120px] -translate-y-1/2"></div>
            </div>

            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col items-center text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-violet-100 text-violet-700 rounded-full text-[11px] font-black tracking-widest uppercase mb-6 shadow-sm border border-violet-200">
                        <Monitor className="w-3.5 h-3.5" />
                        Interactive Simulation
                    </div>
                    <h2 className="text-4xl md:text-5xl lg:text-[54px] font-black text-[#1e1b4b] mb-5 tracking-tight leading-tight">
                        See the App in Action <br className="hidden md:block" /> under 60 Seconds
                    </h2>
                    <p className="text-lg md:text-xl text-slate-500 max-w-2xl font-medium">
                        Watch our automated simulation walk you through instant date generation, real-time timeline building, and effortless sharing.
                    </p>
                </div>

                {/* The Player Container */}
                <div className="bg-white rounded-2xl md:rounded-[2rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08)] border border-slate-200 overflow-hidden flex flex-col mx-auto max-w-[1400px]">

                    {/* Top Browser Bar */}
                    <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80 gap-4">
                        <div className="flex items-center gap-6 w-full sm:w-auto">
                            <div className="flex gap-2">
                                <div className="w-3.5 h-3.5 rounded-full bg-[#FF5F56] border border-[#E0443E]"></div>
                                <div className="w-3.5 h-3.5 rounded-full bg-[#FFBD2E] border border-[#DEA123]"></div>
                                <div className="w-3.5 h-3.5 rounded-full bg-[#27C93F] border border-[#1AAB29]"></div>
                            </div>
                            <div className="hidden sm:block px-3 py-1 bg-[#A78BFA] text-white rounded text-[10px] font-black uppercase tracking-wider shadow-inner">
                                Demo Video Simulation
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-500 bg-white px-4 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                            <Monitor className="w-4 h-4 text-violet-500" />
                            <span>Quick Tour: <span className="text-violet-700">{formatTime(progress)}</span> / {formatTime(MAX_TIME)}</span>
                            <Smartphone className="w-4 h-4 ml-1 text-slate-400" />
                        </div>
                    </div>

                    {/* Main Interface Area */}
                    <div className="flex flex-col lg:flex-row h-auto lg:h-[700px]">

                        {/* Left Navigation Panel */}
                        <div className="w-full lg:w-[380px] border-r border-slate-100 bg-[#F8FAFC] p-6 flex flex-col">
                            <h3 className="text-xs font-black text-violet-600 uppercase tracking-widest mb-6 px-2">Demo Navigation</h3>

                            <div className="space-y-4 flex-1">
                                {DEMO_STEPS.map(step => {
                                    const isActive = activeStep.id === step.id;
                                    return (
                                        <div
                                            key={step.id}
                                            onClick={() => { setProgress(step.startTime); setIsPlaying(true); }}
                                            className={`cursor-pointer rounded-[20px] p-5 transition-all duration-300 relative overflow-hidden
                                                ${isActive
                                                    ? 'bg-white shadow-md border-2 border-violet-400'
                                                    : 'bg-transparent border-2 border-transparent hover:bg-slate-100 hover:border-slate-200'}`}
                                        >
                                            {isActive && (
                                                <div className="absolute top-0 left-0 w-1 h-full bg-violet-500 rounded-l-full"></div>
                                            )}
                                            <div className="flex items-center justify-between mb-3">
                                                <div className={`flex items-center gap-2.5 font-bold ${isActive ? 'text-violet-700' : 'text-slate-700'}`}>
                                                    <step.icon className={`w-5 h-5 ${isActive ? 'text-violet-500' : 'text-slate-400'}`} />
                                                    <span className="text-sm">{step.title}</span>
                                                </div>
                                                <span className={`text-[11px] font-bold ${isActive ? 'text-violet-400' : 'text-slate-400'}`}>
                                                    {step.timeRange}
                                                </span>
                                            </div>
                                            <p className={`text-[13px] leading-relaxed ${isActive ? 'text-slate-600 font-medium' : 'text-slate-500'}`}>
                                                {step.desc}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-6 flex items-start gap-3 p-4 bg-violet-50/50 rounded-2xl border border-violet-100/50">
                                <Sparkles className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
                                <p className="text-[12px] text-violet-700/80 font-medium leading-relaxed">
                                    Interact by clicking the timeline scrub bar below to jump to any feature.
                                </p>
                            </div>
                        </div>

                        {/* Right Display Panel */}
                        <div className="flex-1 bg-slate-50 p-6 lg:p-10 relative overflow-hidden flex items-center justify-center">
                            {/* Inner App Container */}
                            <div className="w-full h-full max-w-6xl bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 flex flex-col overflow-hidden relative">

                                {/* App Header */}
                                <div className="h-14 border-b border-slate-100 px-5 flex items-center justify-between bg-white z-10">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-7 h-7 bg-coral rounded-lg flex items-center justify-center shadow-sm">
                                            <Sparkles className="w-4 h-4 text-white" />
                                        </div>
                                        <span className="font-black text-slate-800 text-[15px] tracking-tight">DateSpark Engine</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="hidden sm:flex w-56 h-8 bg-slate-50 border border-slate-200 rounded-full px-3 items-center">
                                            <span className="text-[11px] text-slate-400 font-medium">Search destinations...</span>
                                        </div>
                                        <div className="w-8 h-8 bg-violet-100 text-violet-700 rounded-full flex items-center justify-center text-xs font-black shadow-inner">
                                            JD
                                        </div>
                                    </div>
                                </div>

                                {/* Dynamic Content Area */}
                                <div className="flex-1 p-6 relative bg-slate-50/50">
                                    <AnimatePresence mode="wait">
                                        {activeStep.id === 1 && <Step1Animation key="step1" progress={progress} />}
                                        {activeStep.id === 2 && <Step2Animation key="step2" progress={progress} />}
                                        {activeStep.id === 3 && <Step3Animation key="step3" progress={progress} />}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Control Bar */}
                    <div className="px-6 py-6 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center gap-6">

                        <div className="flex items-center gap-4">
                            <button
                                onClick={togglePlay}
                                className="w-14 h-14 rounded-full bg-violet-600 hover:bg-violet-700 flex items-center justify-center text-white shadow-lg shadow-violet-200 transition-all hover:scale-105 active:scale-95 shrink-0"
                            >
                                {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                            </button>

                            <button
                                onClick={() => { setProgress(0); setIsPlaying(true); }}
                                className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors shrink-0"
                            >
                                <RotateCcw className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 w-full flex items-center gap-4">
                            <div className="text-[13px] font-bold text-slate-400 font-mono shrink-0">
                                {formatTime(progress)}
                            </div>

                            {/* Scrubber */}
                            <div className="flex-1 flex items-center cursor-pointer group h-8 relative" onClick={handleTimelineClick}>
                                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-violet-500 rounded-full transition-all duration-100 ease-linear"
                                        style={{ width: `${(progress / MAX_TIME) * 100}%` }}
                                    ></div>
                                </div>
                                {/* Thumb */}
                                <div
                                    className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-violet-600 rounded-full shadow-md border-[3px] border-white transition-all duration-100 group-hover:scale-125"
                                    style={{ left: `calc(${(progress / MAX_TIME) * 100}% - 10px)` }}
                                ></div>
                            </div>

                            <div className="text-[13px] font-bold text-slate-400 font-mono shrink-0">
                                {formatTime(MAX_TIME)}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 sm:ml-4 bg-slate-50 p-1.5 rounded-full border border-slate-100">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mx-2">Speed:</span>
                            {[1, 1.5, 2].map(s => (
                                <button
                                    key={s}
                                    onClick={() => setSpeed(s)}
                                    className={`w-9 h-9 rounded-full text-xs font-black transition-all ${speed === s ? 'bg-violet-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200'}`}
                                >
                                    {s}x
                                </button>
                            ))}
                        </div>

                    </div>
                </div>
            </div>
        </section>
    );
};

// --- Inner Step Animations ---

const Step1Animation = ({ progress }) => {
    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-sm mx-auto mt-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-coral" /> Let's plan your date
            </h3>

            <div className="space-y-6">
                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Location</label>
                    <div className="h-11 bg-slate-50 rounded-xl border border-slate-200 flex items-center px-4">
                        <motion.span
                            initial={{ width: 0 }}
                            animate={{ width: "auto" }}
                            transition={{ duration: 1.5, ease: "linear" }}
                            className="text-slate-700 text-sm overflow-hidden whitespace-nowrap inline-block font-bold"
                        >
                            West Village, New York City
                        </motion.span>
                    </div>
                </div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: progress > 2.5 ? 1 : 0, y: progress > 2.5 ? 0 : 10 }}>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">The Vibe</label>
                    <div className="flex flex-wrap gap-2">
                        <div className="px-3.5 py-1.5 bg-coral/10 text-coral border border-coral/20 rounded-lg text-xs font-black">Romantic ✨</div>
                        <div className="px-3.5 py-1.5 bg-violet-50 text-violet-600 border border-violet-100 rounded-lg text-xs font-black">Cocktails 🍸</div>
                        <div className="px-3.5 py-1.5 bg-slate-50 text-slate-500 border border-slate-200 rounded-lg text-xs font-bold">$$ Budget</div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: progress > 7 ? 1 : 0.95, opacity: progress > 7 ? 1 : 0 }}
                    className="pt-4 border-t border-slate-100"
                >
                    <button className="w-full py-3.5 bg-[#060B1A] text-white rounded-xl font-black flex items-center justify-center gap-2 text-sm shadow-md transition-all">
                        {progress > 9.5 ? (
                            <span className="flex items-center gap-2 text-coral">
                                <Sparkles className="w-4 h-4 animate-spin" /> Generating Magic...
                            </span>
                        ) : "Generate Itinerary"}
                    </button>
                </motion.div>
            </div>
        </motion.div>
    );
};

const MOCK_PLACES = [
    { query: 'The High Line, New York', defaultName: 'The High Line', time: '7:00 PM', category: 'scenic', desc: 'Scenic sunset stroll', lat: 40.747993, lng: -74.004765, icon: <Camera className="w-3 h-3" />, badge: 'Scenic', color: 'bg-sky-500', text: 'text-sky-600', hex: '0ea5e9' },
    { query: 'The Standard High Line, New York', defaultName: 'The Standard', time: '8:15 PM', category: 'drinks', desc: 'Craft Cocktails with a view', lat: 40.740887, lng: -74.008082, icon: <Compass className="w-3 h-3" />, badge: 'Drinks', color: 'bg-amber-500', text: 'text-amber-600', hex: 'f59e0b' },
    { query: "L'Artusi, New York", defaultName: "L'Artusi", time: '9:30 PM', category: 'food', desc: 'Intimate Italian Dinner', lat: 40.733560, lng: -74.005166, icon: <Utensils className="w-3 h-3" />, badge: 'Dining', color: 'bg-emerald-500', text: 'text-emerald-600', hex: '10b981' },
    { query: 'Village Vanguard, New York', defaultName: 'Village Vanguard', time: '11:00 PM', category: 'entertainment', desc: 'Live Jazz to end the night', lat: 40.736021, lng: -74.001646, icon: <Ticket className="w-3 h-3" />, badge: 'Entertainment', color: 'bg-violet-500', text: 'text-violet-600', hex: '8b5cf6' }
];

const Step2Animation = ({ progress }) => {
    const localTime = progress - 15;
    const { isLoaded } = useGoogleMaps();
    const [placesService, setPlacesService] = useState(null);
    const [realPlaces, setRealPlaces] = useState(MOCK_PLACES);
    const [selectedMarker, setSelectedMarker] = useState(null);
    const mapRef = useRef(null);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (isLoaded && window.google?.maps?.places && !placesService) {
            const dummy = document.createElement('div');
            setPlacesService(new window.google.maps.places.PlacesService(dummy));
        }
    }, [isLoaded, placesService]);

    useEffect(() => {
        if (placesService) {
            let mounted = true;
            const fetchPlaces = async () => {
                for (let idx = 0; idx < MOCK_PLACES.length; idx++) {
                    if (!mounted) break;
                    const mock = MOCK_PLACES[idx];
                    await new Promise(resolve => {
                        placesService.textSearch({ query: mock.query }, (results, status) => {
                            if (status === window.google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
                                const place = results[0];
                                setRealPlaces(prev => {
                                    const newPlaces = [...prev];
                                    newPlaces[idx] = {
                                        ...newPlaces[idx],
                                        venue: place.name,
                                        address: place.formatted_address,
                                        lat: place.geometry.location.lat(),
                                        lng: place.geometry.location.lng(),
                                        photoUrl: place.photos && place.photos.length > 0 ? place.photos[0].getUrl({ maxWidth: 800 }) : null
                                    };
                                    return newPlaces;
                                });
                            }
                            // Increased delay to 800ms to avoid OVER_QUERY_LIMIT
                            setTimeout(resolve, 800);
                        });
                    });
                }
            };
            fetchPlaces();
            return () => { mounted = false; };
        }
    }, [placesService]);

    const onMapLoad = useCallback((map) => {
        mapRef.current = map;
        const bounds = new window.google.maps.LatLngBounds();
        realPlaces.forEach(p => bounds.extend({ lat: p.lat, lng: p.lng }));
        map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
    }, [realPlaces]);

    // Timings for stagger
    const showItem1 = localTime > 1.5;
    const showItem2 = localTime > 4.5;
    const showItem3 = localTime > 7.5;
    const showItem4 = localTime > 10.5;

    useEffect(() => {
        // Use a tiny timeout to allow the DOM to render the newly added item
        setTimeout(() => {
            if (showItem4) {
                document.getElementById('demo-step-3')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else if (showItem3) {
                document.getElementById('demo-step-2')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else if (showItem2) {
                document.getElementById('demo-step-1')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }, 50);
    }, [showItem1, showItem2, showItem3, showItem4]);

    return (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col md:flex-row relative bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-xl">
            {/* Timeline Left Column */}
            <div ref={scrollRef} className="flex-1 md:w-1/2 p-6 md:p-8 overflow-y-auto z-10 bg-white scroll-smooth">
                <div className="mb-6 pb-4 border-b border-slate-100">
                    <h3 className="text-xl font-black text-slate-800 tracking-tight">Your Perfect Evening</h3>
                    <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest">West Village • $$ • Romantic</p>
                </div>

                <div className="relative border-l-2 border-dashed border-slate-200 ml-4 space-y-10 pb-8">
                    {realPlaces.map((item, idx) => {
                        const show = (idx === 0 && showItem1) || (idx === 1 && showItem2) || (idx === 2 && showItem3) || (idx === 3 && showItem4);
                        if (!show) return null;

                        return (
                            <motion.div
                                id={`demo-step-${idx}`}
                                key={idx}
                                initial={{ opacity: 0, x: -20, y: 10 }}
                                animate={{ opacity: 1, x: 0, y: 0 }}
                                transition={{ type: "spring", stiffness: 300, damping: 24 }}
                                className="relative pl-8 group cursor-pointer"
                                onClick={() => show && setSelectedMarker(idx)}
                            >
                                <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-4 border-white flex items-center justify-center transition-all duration-300 ${item.color} ${selectedMarker === idx ? 'scale-150 shadow-lg' : ''}`}></div>

                                <div className="flex items-center gap-2 mb-1">
                                    <p className={`text-[10px] font-black uppercase tracking-widest ${item.text} font-inter flex items-center gap-1.5`}>
                                        {item.icon} {item.time}
                                    </p>
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded bg-white shadow-sm border border-slate-100 ${item.text} uppercase tracking-tighter`}>
                                        {item.badge}
                                    </span>
                                </div>
                                <h4 className="text-xl font-black text-[#1e1b4b] mb-1 font-inter tracking-tight">{item.venue || item.defaultName}</h4>
                                <p className="text-slate-500 font-medium text-sm mb-3 font-inter">{item.desc}</p>

                                {item.photoUrl && (
                                    <div className="mb-4 overflow-hidden rounded-xl border border-slate-100 shadow-sm mt-2 relative aspect-[4/3]">
                                        <img src={item.photoUrl} alt={item.venue} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                    </div>
                                )}

                                <div className="flex flex-wrap items-center gap-2 mt-4">
                                    <a
                                        href="#"
                                        onClick={(e) => e.preventDefault()}
                                        className="px-2.5 py-1.5 bg-blue-50 text-blue-600 outline outline-1 outline-blue-200 text-[10px] font-bold rounded-lg hover:bg-blue-600 hover:text-white transition-all inline-flex items-center gap-1 shadow-sm"
                                    >
                                        <MapPin className="w-3 h-3" /> Get Directions
                                    </a>
                                    <a
                                        href="#"
                                        onClick={(e) => e.preventDefault()}
                                        className="px-2.5 py-1.5 bg-gray-50 text-gray-600 outline outline-1 outline-gray-200 text-[10px] font-bold rounded-lg hover:bg-gray-800 hover:text-white transition-all inline-flex items-center gap-1 shadow-sm"
                                    >
                                        <Search className="w-3 h-3" /> Search on Google
                                    </a>
                                    <a
                                        href="#"
                                        onClick={(e) => e.preventDefault()}
                                        className="px-2.5 py-1.5 bg-black text-white text-[10px] font-bold rounded-lg hover:bg-gray-800 transition-colors inline-flex items-center gap-1 shadow-sm"
                                    >
                                        <Car className="w-3 h-3" /> Get a Ride
                                    </a>
                                </div>
                                <div className="mt-4 grid grid-cols-3 gap-2">
                                    {[
                                        { value: 'love', label: 'Love' },
                                        { value: 'swap', label: 'Swap' },
                                        { value: 'skip', label: 'Skip' },
                                    ].map((vote) => (
                                        <button
                                            type="button"
                                            key={vote.value}
                                            onClick={(e) => { e.preventDefault(); }}
                                            className={`py-2.5 rounded-xl border text-[11px] font-black transition-all active:scale-[0.98] bg-white text-gray-500 border-gray-100 hover:border-coral/30`}
                                        >
                                            {vote.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Walk Time Connector */}
                                {idx < realPlaces.length - 1 && (
                                    <div className="absolute -bottom-8 left-0 flex items-center gap-3 w-full opacity-60 z-10">
                                        <div className="w-8 h-[1px] bg-dashed bg-gray-300 ml-4"></div>
                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded border border-gray-100 shadow-sm relative">
                                            <Footprints className="w-3 h-3 text-coral" /> {idx === 0 ? '8' : idx === 1 ? '12' : '6'} min walk ({(idx === 0 ? 0.4 : idx === 1 ? 0.6 : 0.3).toFixed(1)} mi)
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Map Right Column */}
            <div className="absolute inset-0 md:relative md:w-1/2 h-full bg-slate-50 border-l border-slate-100 z-0">
                {isLoaded ? (
                    <GoogleMap
                        mapContainerStyle={{ width: '100%', height: '100%' }}
                        center={{ lat: 40.740887, lng: -74.008082 }}
                        zoom={14}
                        onLoad={onMapLoad}
                        onClick={() => setSelectedMarker(null)}
                        options={{ disableDefaultUI: true, gestureHandling: 'cooperative' }}
                    >
                        {realPlaces.map((item, idx) => {
                            const show = (idx === 0 && showItem1) || (idx === 1 && showItem2) || (idx === 2 && showItem3) || (idx === 3 && showItem4);
                            if (!show || !item.lat) return null;
                            const isSelected = selectedMarker === idx;
                            const pinIcon = {
                                url: makeSvgPin(idx + 1, item.hex, isSelected),
                                scaledSize: new window.google.maps.Size(isSelected ? 44 : 34, isSelected ? 62 : 48),
                                anchor: new window.google.maps.Point(isSelected ? 22 : 17, isSelected ? 62 : 48),
                            };

                            return (
                                <Marker key={idx} position={{ lat: item.lat, lng: item.lng }} icon={pinIcon} onClick={() => setSelectedMarker(idx)}>
                                    <AnimatePresence mode="wait">
                                        {isSelected && (
                                            <InfoWindow position={{ lat: item.lat, lng: item.lng }} onCloseClick={() => setSelectedMarker(null)} options={{ pixelOffset: new window.google.maps.Size(0, -40) }}>
                                                <motion.div initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0 }} className="p-3 min-w-[200px]" style={{ fontFamily: 'Inter, sans-serif' }}>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div className={`w-6 h-6 rounded-full bg-[#${item.hex}] flex items-center justify-center shadow-lg border-2 border-white`}>
                                                            <span className="text-[10px] text-white font-black">{idx + 1}</span>
                                                        </div>
                                                        <span className={`text-[9px] font-black uppercase tracking-widest text-[#${item.hex}]`}>{item.time}</span>
                                                    </div>
                                                    <h4 className="text-[14px] font-black text-slate-800 leading-tight">{item.venue || item.defaultName}</h4>
                                                    {item.address && <p className="text-[10px] text-slate-500 font-medium mt-1 line-clamp-2">{item.address}</p>}
                                                </motion.div>
                                            </InfoWindow>
                                        )}
                                    </AnimatePresence>
                                </Marker>
                            );
                        })}
                    </GoogleMap>
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">Loading Map...</div>
                )}
            </div>
        </motion.div>
    );
};

const Step3Animation = ({ progress }) => {
    const localTime = progress - 30; // 0 to 15
    const showPopup = localTime > 1;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full relative flex items-center justify-center">
            {/* Blurred background mockup */}
            <div className="absolute inset-0 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 opacity-60 blur-sm transform scale-95">
                <div className="h-6 w-48 bg-slate-200 rounded-lg mb-8"></div>
                <div className="space-y-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex gap-4">
                            <div className="w-12 h-12 bg-slate-200 rounded-xl"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-4 w-32 bg-slate-200 rounded"></div>
                                <div className="h-3 w-48 bg-slate-100 rounded"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Share Popup Modal */}
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: showPopup ? 1 : 0.9, opacity: showPopup ? 1 : 0, y: showPopup ? 0 : 20 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="relative z-10 bg-[#060B1A] text-white rounded-[24px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)] p-8 w-[340px] border border-slate-800/50"
            >
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-gradient-to-br from-coral to-pink-500 rounded-full flex items-center justify-center shadow-lg shadow-coral/30 border-4 border-[#060B1A]">
                    <Share2 className="w-5 h-5 text-white" />
                </div>

                <h3 className="text-center text-xl font-black mb-2 mt-4 tracking-tight">Share the Magic</h3>
                <p className="text-center text-[13px] text-slate-400 font-medium mb-8 leading-relaxed">
                    Send this perfectly timed itinerary to your partner and get ready for a great night.
                </p>

                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3.5 mb-6 flex items-center justify-between group">
                    <span className="text-[11px] text-slate-300 truncate font-mono tracking-wider">datespark.live/plan/a8x9j...</span>
                    <button className="text-coral text-xs font-black px-3 py-1 rounded bg-coral/10 hover:bg-coral/20 transition-colors">Copy</button>
                </div>

                <motion.button
                    animate={localTime > 6 && localTime < 8 ? { scale: 0.97, opacity: 0.9 } : { scale: 1, opacity: 1 }}
                    className={`w-full py-4 rounded-xl font-black text-[13px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg transition-colors ${localTime > 7.5 ? 'bg-green-500 text-white shadow-green-500/25' : 'bg-coral text-white shadow-coral/25'}`}
                >
                    {localTime > 7.5 ? "Link Sent Successfully! 🎉" : "Send via SMS"}
                </motion.button>
            </motion.div>
        </motion.div>
    );
};

export default InteractiveDemo;
