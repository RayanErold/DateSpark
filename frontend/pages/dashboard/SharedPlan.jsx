import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Heart, MapPin, Calendar, Clock, Map as MapIcon, Sparkles, Utensils, Ticket, Search, Car, Compass, Star, Quote, MessageSquare, Lock, ArrowRight, X, Navigation, LayoutDashboard, Music, Camera, Palette, Trophy, Mic2 } from 'lucide-react';
import { GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useGoogleMaps } from '../../lib/googleMaps';
import { supabase } from '../../lib/supabase';

const darkMapStyle = [
    { elementType: 'geometry', stylers: [{ color: '#111827' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#111827' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#9ca3af' }] },
    { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#f97316' }] },
    { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#f43f5e' }] },
    { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#064e3b' }] },
    { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#10b981' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1f2937' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#111827' }] },
    { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#6b7280' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#374151' }] },
    { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#111827' }] },
    { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#d1d5db' }] },
    { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#111827' }] },
    { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#f97316' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#030712' }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#4b5563' }] },
    { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#030712' }] }
];

// Generates a self-contained SVG pin with a number label — no external URL needed
const makeSvgPin = (label, fill, isSelected) => {
    const size = isSelected ? 44 : 34;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size * 1.4}" viewBox="0 0 34 48">
        <path d="M17 0C7.6 0 0 7.6 0 17c0 12.3 17 31 17 31S34 29.3 34 17C34 7.6 26.4 0 17 0z" fill="#${fill}" stroke="white" stroke-width="2"/>
        <text x="17" y="22" text-anchor="middle" font-family="Arial,sans-serif" font-size="13" font-weight="900" fill="white">${label}</text>
    </svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const SharedPlan = () => {
    const { id } = useParams();
    const [plan, setPlan] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [appTheme] = useState(() => localStorage.getItem('appTheme') || 'light');
    const [selectedMarker, setSelectedMarker] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const mapRef = useRef(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setIsLoggedIn(!!session?.user);
        });
    }, []);

    const onMapLoad = useCallback((map) => {
        mapRef.current = map;
    }, []);

    // Fit map to show all markers once steps are loaded
    const fitMapBounds = useCallback((map, steps) => {
        if (!map || !steps || steps.length === 0) return;
        const validSteps = steps.filter(s => s.lat && s.lng);
        if (validSteps.length === 0) return;
        if (validSteps.length === 1) {
            map.setCenter({ lat: parseFloat(validSteps[0].lat), lng: parseFloat(validSteps[0].lng) });
            map.setZoom(15);
            return;
        }
        const bounds = new window.google.maps.LatLngBounds();
        validSteps.forEach(s => bounds.extend({ lat: parseFloat(s.lat), lng: parseFloat(s.lng) }));
        map.fitBounds(bounds, { top: 60, right: 40, bottom: 40, left: 40 });
    }, []);

    const focusStep = useCallback((idx, step) => {
        const lat = parseFloat(step.lat);
        const lng = parseFloat(step.lng);
        if (isNaN(lat) || isNaN(lng)) return;

        setSelectedMarker(idx);
        if (mapRef.current) {
            mapRef.current.panTo({ lat, lng });
            mapRef.current.setZoom(16);
        }
    }, []);

    const { isLoaded } = useGoogleMaps();

    useEffect(() => {
        const fetchPlan = async () => {
            if (id === 'demo-preview') {
                const cached = localStorage.getItem('datespark_demo_plan');
                if (cached) {
                    setPlan(JSON.parse(cached));
                    setIsLoading(false);
                    return;
                }
            }
            try {
                const response = await fetch(`/api/plans/${id}`);
                if (!response.ok) {
                    throw new Error('Plan not found or could not be loaded.');
                }
                const data = await response.json();
                setPlan(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPlan();
    }, [id]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
                <div className="w-20 h-20 bg-coral/10 rounded-[2rem] flex items-center justify-center animate-pulse mb-4">
                    <Heart className="w-10 h-10 fill-coral text-coral" />
                </div>
                <h2 className="text-2xl font-black text-navy tracking-tight">Crafting your date...</h2>
                <p className="text-gray-400 font-medium mt-2">Setting the mood for a perfect evening</p>
            </div>
        );
    }

    if (error || !plan) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
                <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-coral">
                    <Heart className="w-8 h-8 fill-coral text-coral" />
                </div>
                <h2 className="text-2xl font-black text-navy mb-2">Oops! Plan Not Found</h2>
                <p className="text-gray-500 mb-6 max-w-sm">
                    This date plan might have been removed or the link is invalid.
                </p>
                <Link to="/" className="btn-primary py-3 px-8 rounded-xl font-bold inline-block">
                    Create Your Own on DateSpark
                </Link>
            </div>
        );
    }

    const itinerarySteps = Array.isArray(plan.itinerary)
        ? plan.itinerary
        : (plan.itinerary?.steps || plan.plan_content || []);

    const mapCenter = itinerarySteps.length > 0
        ? { lat: parseFloat(itinerarySteps[0].lat), lng: parseFloat(itinerarySteps[0].lng) }
        : { lat: 40.7128, lng: -74.0060 }; // Default NYC if empty

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 group">
                        <img src="/datespark-logo.png" alt="DateSpark Logo" className="w-8 h-8 rounded-lg shadow-md object-cover bg-white group-hover:scale-105 transition-transform" />
                        <span className="text-lg font-black text-navy tracking-tight">DateSpark</span>
                    </Link>

                    {/* Right side nav:
                        - demo-preview: ALWAYS show guest CTAs (never trust isLoggedIn for this route)
                        - other shared plans: show Dashboard if logged in, else Sign Up
                    */}
                    <div className="flex items-center gap-3">
                        {(isLoggedIn && id !== 'demo-preview') ? (
                            <Link to="/dashboard" className="flex items-center gap-2 bg-navy text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:-translate-y-0.5 transition-all">
                                <LayoutDashboard className="w-4 h-4" /> Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link to="/login" className="hidden sm:block text-sm font-bold text-navy hover:text-coral transition-colors px-3 py-2">
                                    Log In
                                </Link>
                                <Link to="/signup" className="flex items-center gap-2 bg-gradient-to-r from-coral to-orange-500 text-white px-4 py-2 rounded-xl text-sm font-black shadow-md shadow-coral/30 hover:-translate-y-0.5 hover:shadow-coral/50 transition-all">
                                    <Sparkles className="w-4 h-4" /> {id === 'demo-preview' ? 'Save This Plan' : 'Sign Up Free'}
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <main className="flex-1 w-full max-w-5xl mx-auto py-8 px-4 sm:px-6 flex flex-col items-center">

                <div className="text-center mb-10 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-violet-50 text-violet-700 rounded-full text-sm font-bold mb-4 shadow-sm border border-violet-100">
                        <Sparkles className="w-4 h-4" /> AI-Generated Date Plan
                    </div>
                    {/* Community Rating Summary */}
                    <div className="flex items-center justify-center gap-4 mb-4">
                        <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map(s => (
                                <Star key={s} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                            ))}
                            <span className="ml-1 text-sm font-black text-navy">{plan.avg_rating || '4.9'}</span>
                        </div>
                        <div className="w-px h-4 bg-gray-200" />
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Community Approved</p>
                    </div>
                    <h1 className="text-3xl font-black text-navy mb-4 capitalize font-inter">{plan.vibe} Date</h1>
                    <p className="text-xs text-gray-500 font-medium max-w-md mx-auto mb-2 px-4">
                        Shared plans open in the browser. Some stops may appear as a preview until the full itinerary is unlocked.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-4 text-gray-500 font-medium font-inter">
                        <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-gray-100"><MapPin className="w-4 h-4 text-coral" /> {plan.location}</span>
                        <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-gray-100"><Calendar className="w-4 h-4 text-navy" /> {
                            plan.itinerary?.metadata?.planDate
                                ? new Date(plan.itinerary.metadata.planDate + 'T00:00:00').toLocaleDateString()
                                : plan.created_at?.split('T')[0] || new Date().toISOString().split('T')[0]
                        }</span>
                        <span className="flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1.5 rounded-lg shadow-sm border border-green-100 font-bold uppercase text-xs tracking-wider">{plan.budget}</span>
                    </div>
                </div>

                {/* Split View: Timeline + Map */}
                <div className="w-full min-h-[600px] bg-transparent md:bg-white rounded-[2rem] shadow-xl overflow-hidden flex flex-col md:flex-row relative animate-in fade-in zoom-in-95 duration-700 delay-100 border border-gray-100">


                    {/* Left Column: Timeline UI */}
                    <div className="flex-1 md:w-1/2 bg-transparent md:bg-white p-6 sm:p-8 md:p-12 md:max-h-[700px] overflow-y-auto z-10 font-inter">
                        {/* Spacer for Map on Mobile */}
                        <div className="h-[200px] md:hidden flex-shrink-0"></div>
                        <div className="bg-white md:bg-transparent rounded-t-[2.5rem] p-6 md:p-0 shadow-sm md:shadow-none">
                            <div className="relative border-l-2 border-dashed border-gray-200 ml-4 space-y-12 pb-8">
                                {itinerarySteps.map((step, idx) => {
                                    // Public Gating: If it's a preview plan, recipients only see 2 stops (idx 0, 1). 3rd stop (idx 2) is locked.
                                    const isPreview = plan.itinerary?.metadata?.isPreviewPlan || plan.is_preview || false;
                                    const isLockedStep = isPreview && idx >= 2;

                                    const CATEGORY_THEMES = {
                                        food: { dot: 'bg-emerald-500', text: 'text-emerald-600', icon: <Utensils className="w-3 h-3" />, cta: 'View Menu & Reserve', badge: 'Dining' },
                                        drinks: { dot: 'bg-amber-500', text: 'text-amber-600', icon: <Compass className="w-3 h-3" />, cta: 'View Selection', badge: 'Drinks' },
                                        music: { dot: 'bg-indigo-500', text: 'text-indigo-600', icon: <Music className="w-3 h-3" />, cta: 'Get Tickets', badge: 'Music' },
                                        sports: { dot: 'bg-red-500', text: 'text-red-600', icon: <Trophy className="w-3 h-3" />, cta: 'Book Activity', badge: 'Sports' },
                                        comedy: { dot: 'bg-yellow-400', text: 'text-yellow-600', icon: <Mic2 className="w-3 h-3" />, cta: 'Check Showtimes', badge: 'Comedy' },
                                        art: { dot: 'bg-purple-500', text: 'text-purple-600', icon: <Palette className="w-3 h-3" />, cta: 'Gallery Info', badge: 'Art' },
                                        scenic: { dot: 'bg-sky-500', text: 'text-sky-600', icon: <Camera className="w-3 h-3" />, cta: 'View Details', badge: 'Scenic' },
                                        activity: { dot: 'bg-rose-500', text: 'text-rose-600', icon: <Target className="w-3 h-3" />, cta: 'Book Experience', badge: 'Activity' },
                                        general: { dot: 'bg-navy', text: 'text-navy', icon: <MapPin className="w-3 h-3" />, cta: 'Visit Website', badge: 'Spot' }
                                    };

                                    const theme = CATEGORY_THEMES[step.category] || CATEGORY_THEMES.general;

                                    return (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, x: -20 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            onViewportEnter={() => !isLockedStep && focusStep(idx, step)}
                                            viewport={{ once: false, margin: "-100px", amount: 0.5 }}
                                            className={`relative pl-8 group cursor-pointer snap-start pt-4 pb-12`}
                                            onClick={() => !isLockedStep && focusStep(idx, step)}
                                        >
                                            {/* Locked state overlay */}
                                            {isLockedStep && (
                                                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/30 backdrop-blur-[6px] rounded-2xl border border-white/50 shadow-lg p-6 text-center ml-4 mt-2">
                                                    <div className="w-14 h-14 bg-coral rounded-full flex items-center justify-center mb-4 shadow-xl">
                                                        <Lock className="w-7 h-7 text-white" />
                                                    </div>
                                                    <h4 className="font-black text-navy text-2xl mb-2 mt-2 tracking-tight">Unlock Full Itinerary</h4>
                                                    <p className="text-sm font-bold text-gray-600 mb-6 max-w-[280px]">Sign up for free to reveal the rest of your personalized date plan.</p>
                                                    <Link to="/signup" className="pointer-events-auto bg-navy text-white px-8 py-4 rounded-2xl font-black text-[16px] shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                                                        Sign Up Free <ArrowRight className="w-5 h-5" />
                                                    </Link>
                                                </div>
                                            )}

                                            {/* Colored Dot — pulses when selected */}
                                            <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-4 border-white flex items-center justify-center transition-all duration-300 ${theme.dot} ${selectedMarker === idx ? 'scale-150 shadow-lg' : ''}`}>
                                            </div>

                                            <div className={`${isLockedStep ? 'blur-md select-none opacity-40 pointer-events-none' : ''}`}>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className={`text-[10px] font-black uppercase tracking-widest ${theme.text} font-inter flex items-center gap-1.5`}>
                                                        {theme.icon} {step.time} • {step.activity}
                                                    </p>
                                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded bg-white shadow-sm border border-gray-100 ${theme.text} uppercase tracking-tighter`}>
                                                        {theme.badge}
                                                    </span>
                                                </div>
                                                <h4 className="text-2xl font-black text-navy mb-2 font-inter">{step.venue}</h4>

                                                {/* Per-Stop Community Snippet */}
                                                {plan.reviews?.find(r => r.stop_feedback?.[step.venue]?.comment) && (
                                                    <div className="mb-3 p-3 bg-gray-50/80 rounded-xl border border-gray-100 italic text-[13px] text-gray-600 relative">
                                                        <Quote className="w-3 h-3 text-coral/30 absolute -top-1 -left-1" />
                                                        "{plan.reviews.find(r => r.stop_feedback?.[step.venue]?.comment)?.stop_feedback[step.venue]?.comment}"
                                                    </div>
                                                )}

                                                <p className="text-gray-500 font-medium mb-3 font-inter">{step.description}</p>

                                                {step.photoUrl && (
                                                    <div className="mb-4 overflow-hidden rounded-xl border border-gray-100 shadow-sm mt-2">
                                                        <img
                                                            src={step.photoUrl}
                                                            alt={step.venue}
                                                            className="w-full h-48 object-cover hover:scale-105 transition-transform duration-500"
                                                            loading="lazy"
                                                        />
                                                    </div>
                                                )}

                                                <div className="flex flex-wrap items-center gap-2 mt-4">
                                                    {/* Always show Get Directions — use coords if available, else search by name */}
                                                    <a
                                                        href={
                                                            step.lat && step.lng
                                                                ? `https://www.google.com/maps/dir/?api=1&destination=${step.lat},${step.lng}&destination_place_id=${encodeURIComponent(step.venue)}`
                                                                : step.directionsUrl
                                                                    ? step.directionsUrl
                                                                    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((step.venue || '') + ' ' + (step.address || ''))}`
                                                        }
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="px-2.5 py-1.5 bg-blue-50 text-blue-600 outline outline-1 outline-blue-200 text-[10px] font-bold rounded-lg hover:bg-blue-600 hover:text-white transition-all inline-flex items-center gap-1 shadow-sm"
                                                    >
                                                        <MapPin className="w-3 h-3" /> Get Directions
                                                    </a>

                                                    {/* Primary Website Button */}
                                                    {(step.websiteUrl || step.url) && (
                                                        <a
                                                            href={step.websiteUrl || step.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="px-2.5 py-1.5 bg-indigo-50 text-indigo-600 outline outline-1 outline-indigo-200 text-[10px] font-bold rounded-lg hover:bg-indigo-600 hover:text-white transition-all inline-flex items-center gap-1 shadow-sm"
                                                        >
                                                            {theme.icon} {theme.cta}
                                                        </a>
                                                    )}



                                                    {/* Booking Integration (OpenTable etc) */}
                                                    {step.bookingUrl && (
                                                        <a
                                                            href={step.bookingUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="px-2.5 py-1.5 bg-green-50 text-green-600 outline outline-1 outline-green-200 text-[10px] font-bold rounded-lg hover:bg-green-600 hover:text-white transition-all inline-flex items-center gap-1 shadow-sm"
                                                        >
                                                            {step.bookingType === 'opentable' ? <Utensils className="w-3 h-3" /> : <Ticket className="w-3 h-3" />}
                                                            {step.bookingType === 'opentable' ? 'Book on OpenTable' : 'Book Tickets'}
                                                        </a>
                                                    )}

                                                    <a
                                                        href={`https://www.google.com/search?q=${encodeURIComponent(step.venue + ' ' + (step.address || ''))}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="px-2.5 py-1.5 bg-gray-50 text-gray-600 outline outline-1 outline-gray-200 text-[10px] font-bold rounded-lg hover:bg-gray-800 hover:text-white transition-all inline-flex items-center gap-1 shadow-sm"
                                                    >
                                                        <Search className="w-3 h-3" /> Search on Google
                                                    </a>

                                                    {step.lat && step.lng && (
                                                        <a
                                                            href={`https://m.uber.com/ul/?action=setPickup&client_id=datespark_mvp&dropoff[latitude]=${step.lat}&dropoff[longitude]=${step.lng}&dropoff[nickname]=${encodeURIComponent(step.venue)}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="px-2.5 py-1.5 bg-black text-white text-[10px] font-bold rounded-lg hover:bg-gray-800 transition-colors inline-flex items-center gap-1 shadow-sm"
                                                        >
                                                            <Car className="w-3 h-3" /> Get a Ride
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Interactive Google Map */}
                    <div className="absolute inset-0 md:relative md:w-1/2 h-full md:h-auto bg-gray-50 border-t md:border-t-0 md:border-l border-gray-100 z-0">
                        {isLoaded ? (
                            <GoogleMap
                                mapContainerStyle={{ width: '100%', height: '100%' }}
                                center={mapCenter}
                                zoom={14}
                                onLoad={(map) => { onMapLoad(map); fitMapBounds(map, itinerarySteps); }}
                                onClick={() => setSelectedMarker(null)}
                                options={{
                                    disableDefaultUI: true,
                                    zoomControl: true,
                                    styles: appTheme === 'dark' ? darkMapStyle : undefined,
                                    gestureHandling: 'cooperative',
                                }}
                            >
                                {itinerarySteps.map((step, idx) => {
                                    const isPreview = plan.itinerary?.metadata?.isPreviewPlan || plan.is_preview || false;
                                    const isLockedStep = isPreview && idx >= 2;
                                    const lat = parseFloat(step.lat);
                                    const lng = parseFloat(step.lng);
                                    if (!lat || !lng || isNaN(lat) || isNaN(lng)) return null;

                                    const CATEGORY_HEX = {
                                        food: '10b981',
                                        drinks: 'f59e0b',
                                        music: '6366f1',
                                        sports: 'ef4444',
                                        comedy: 'fbbf24',
                                        art: 'a855f7',
                                        scenic: '0ea5e9',
                                        activity: 'f43f5e',
                                        general: '1e3a5f'
                                    };
                                    
                                    const categoryHex = CATEGORY_HEX[step.category] || CATEGORY_HEX.general;
                                    const hex = isLockedStep ? '9ca3af' : categoryHex;
                                    const pinLabel = isLockedStep ? '?' : String(idx + 1);
                                    const isSelected = selectedMarker === idx;

                                    // Use inline SVG pin — no external URL dependency
                                    const pinIcon = {
                                        url: makeSvgPin(pinLabel, hex, isSelected),
                                        scaledSize: new window.google.maps.Size(isSelected ? 44 : 34, isSelected ? 62 : 48),
                                        anchor: new window.google.maps.Point(isSelected ? 22 : 17, isSelected ? 62 : 48),
                                    };

                                    const directionsHref = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

                                    return (
                                        <Marker
                                            key={idx}
                                            position={{ lat, lng }}
                                            icon={pinIcon}
                                            opacity={isLockedStep ? 0.5 : 1}
                                            onClick={() => !isLockedStep && setSelectedMarker(idx === selectedMarker ? null : idx)}
                                        >
                                            <AnimatePresence mode="wait">
                                                {isSelected && (
                                                    <InfoWindow
                                                        position={{ lat, lng }}
                                                        onCloseClick={() => setSelectedMarker(null)}
                                                        options={{ pixelOffset: new window.google.maps.Size(0, -40) }}
                                                    >
                                                        <motion.div
                                                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                                            exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                                            className="glassmorphic-card p-4 min-w-[240px] max-w-[280px]"
                                                            style={{
                                                                fontFamily: 'Inter, sans-serif',
                                                                background: 'rgba(255, 255, 255, 0.9)',
                                                                backdropFilter: 'blur(16px)',
                                                                borderRadius: '1.5rem',
                                                                border: '1px solid rgba(255, 255, 255, 0.5)',
                                                                boxShadow: '0 20px 40px rgba(0,0,0,0.12)'
                                                            }}
                                                        >
                                                            <div className="flex items-center gap-3 mb-3">
                                                                <div className={`w-8 h-8 rounded-full bg-[#${hex}] flex items-center justify-center shadow-lg border-2 border-white`}>
                                                                    <span className="text-[14px] text-white font-black">{idx + 1}</span>
                                                                </div>
                                                                <span className={`text-[11px] font-black uppercase tracking-widest text-[#${hex}]`}>
                                                                    {step.time} · {step.activity}
                                                                </span>
                                                            </div>

                                                            <h4 className="text-[18px] font-black text-navy mb-1 leading-tight tracking-tight">{step.venue}</h4>
                                                            {step.address && <p className="text-[11px] text-gray-500 font-medium mb-4 line-clamp-2 leading-relaxed">{step.address}</p>}

                                                            <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100/50">
                                                                <a href={directionsHref} target="_blank" rel="noopener noreferrer" className="flex-1 px-3 py-2.5 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black text-center hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-1.5 shadow-sm">
                                                                    <Navigation className="w-3.5 h-3.5" /> GO
                                                                </a>
                                                                {(step.websiteUrl || step.url) && (
                                                                    <a href={step.websiteUrl || step.url} target="_blank" rel="noopener noreferrer" className="flex-1 px-3 py-2.5 bg-violet-50 text-violet-600 rounded-xl text-[10px] font-black text-center hover:bg-violet-600 hover:text-white transition-all flex items-center justify-center gap-1.5 shadow-sm">
                                                                        <Sparkles className="w-3.5 h-3.5" /> VISIT
                                                                    </a>
                                                                )}
                                                                <a href={`https://m.uber.com/ul/?action=setPickup&dropoff[latitude]=${step.lat}&dropoff[longitude]=${step.lng}`} target="_blank" rel="noopener noreferrer" className="px-3 py-2.5 bg-black text-white rounded-xl text-[10px] font-black text-center hover:bg-gray-800 transition-all shadow-sm">
                                                                    UBER
                                                                </a>
                                                            </div>
                                                        </motion.div>
                                                    </InfoWindow>
                                                )}
                                            </AnimatePresence>
                                        </Marker>
                                    );
                                })}
                            </GoogleMap>
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center bg-gray-100/50">
                                <MapIcon className="w-12 h-12 mb-4 opacity-50" />
                                <p className="font-medium">Loading Interactive Map...</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Community Reviews Section */}
                {plan.reviews && plan.reviews.length > 0 && (
                    <div className="w-full mt-20 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <h2 className="text-3xl font-black text-navy mb-2 font-inter uppercase tracking-tighter">Community Buzz</h2>
                                <p className="text-gray-400 font-bold text-sm uppercase tracking-widest">Real experiences from DateSpark couples</p>
                            </div>
                            <div className="text-right">
                                <p className="text-4xl font-black text-navy leading-none">{plan.avg_rating || '4.9'}</p>
                                <div className="flex items-center gap-0.5 justify-end mt-1">
                                    {[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-3 h-3 fill-yellow-400 text-yellow-400" />)}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                            {plan.reviews.map((rev, i) => (
                                <div key={i} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col gap-4 premium-shadow hover:shadow-xl transition-all duration-300">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-coral/10 flex items-center justify-center border border-coral/20">
                                                <span className="text-lg">👤</span>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-0.5">
                                                    {[...Array(5)].map((_, si) => (
                                                        <Star key={si} className={`w-3 h-3 ${si < rev.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-100'}`} />
                                                    ))}
                                                </div>
                                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest leading-none">Verified User</p>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-black text-navy/20 uppercase tracking-widest">
                                            {new Date(rev.timestamp).toLocaleDateString()}
                                        </span>
                                    </div>

                                    {rev.comment && (
                                        <p className="text-sm font-medium text-navy/70 leading-relaxed italic">
                                            "{rev.comment}"
                                        </p>
                                    )}

                                    {rev.image && (
                                        <div className="w-full aspect-video rounded-2xl overflow-hidden shadow-sm">
                                            <img src={rev.image} alt="Date Memory" className="w-full h-full object-cover" />
                                        </div>
                                    )}

                                    {rev.stop_feedback && Object.keys(rev.stop_feedback).length > 0 && (
                                        <div className="pt-4 border-t border-gray-100 space-y-3">
                                            <p className="text-[10px] font-black text-coral uppercase tracking-widest">Venue Feedback</p>
                                            <div className="space-y-2">
                                                {Object.entries(rev.stop_feedback).map(([venue, info], fi) => (
                                                    <div key={fi} className="flex items-start gap-2 bg-gray-50/50 p-2.5 rounded-xl border border-gray-50">
                                                        <div className="w-6 h-6 rounded-lg bg-navy flex items-center justify-center flex-shrink-0">
                                                            <span className="text-[10px] text-white font-black">{fi + 1}</span>
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-[11px] font-black text-navy truncate">{venue}</p>
                                                            {info.comment && <p className="text-[11px] text-gray-400 font-medium leading-tight mt-1">"{info.comment}"</p>}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            {/* Final Viral CTA / Free Marketing */}
            <div className="w-full max-w-5xl mx-auto px-4 pb-20 pt-10">
                <div className="bg-gradient-to-r from-navy to-navy/90 rounded-[3rem] p-10 md:p-16 text-center shadow-2xl relative overflow-hidden group">
                    {/* Background Glow */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-coral/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-coral/30 transition-colors" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-600/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                    <div className="relative z-10 max-w-2xl mx-auto space-y-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-white/80 text-sm font-bold backdrop-blur-sm border border-white/10">
                            <Heart className="w-4 h-4 fill-coral text-coral" /> Trusted by 5,000+ Couples
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black text-white leading-tight">
                            Want a plan like this for <span className="text-transparent bg-clip-text bg-gradient-to-r from-coral to-gold animate-gradient-x">your next date?</span>
                        </h2>
                        <p className="text-lg text-white/60 font-medium">
                            Stop the "I don't know, what do you want to do?" fight. Get a full, ready-to-go plan in seconds.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                            <Link to="/signup" className="w-full sm:w-auto bg-coral text-white px-10 py-5 rounded-2xl font-black text-xl shadow-[0_10px_40px_rgba(255,127,80,0.3)] hover:scale-[1.05] transition-all flex items-center justify-center gap-3 active:scale-95 leading-none">
                                Plan My Date Now <Sparkles className="w-6 h-6" />
                            </Link>
                            <Link to="/" className="w-full sm:w-auto bg-white/5 hover:bg-white/10 text-white px-10 py-5 rounded-2xl font-black text-xl border border-white/10 transition-all flex items-center justify-center gap-3">
                                See How It Works
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Sticky CTA for Mobile (Free Marketing) */}
            <div className="sm:hidden fixed bottom-0 w-full bg-white border-t border-gray-100 p-4 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] z-40 transition-transform animate-in slide-in-from-bottom-full duration-500 delay-1000">
                <Link to="/signup" className="w-full bg-navy text-white px-4 py-4 rounded-xl text-md font-black shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
                    <Sparkles className="w-5 h-5 text-gold" /> Start Your Free Plan
                </Link>
            </div>

            <footer className="w-full py-8 text-center text-gray-400 text-sm font-medium mt-auto bg-white border-t border-gray-50">
                Powered by <Link to="/" className="font-bold text-navy hover:underline">DateSpark</Link>
            </footer>
        </div>
    );
};

export default SharedPlan;
