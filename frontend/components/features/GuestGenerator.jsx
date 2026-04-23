import React, { useState, useEffect, useRef } from 'react';
import { Loader2, MapPin, Sparkles, Locate, Check, Calendar, ArrowRight, Lock } from 'lucide-react';
import { useJsApiLoader } from '@react-google-maps/api';
import { isLocationInServiceArea } from '../../lib/geo';
import { useNavigate } from 'react-router-dom';

const VIBES = [
    { id: 'romantic', icon: '🍷', label: 'Romantic' },
    { id: 'adventurous', icon: '🧗', label: 'Adventurous' },
    { id: 'casual', icon: '☕', label: 'Casual & Chill' },
    { id: 'fancy', icon: '✨', label: 'Upscale' }
];

const libraries = ['places'];
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const GuestGenerator = () => {
    const navigate = useNavigate();
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: GOOGLE_API_KEY,
        libraries: libraries,
    });

    const [location, setLocation] = useState('');
    const [lat, setLat] = useState(null);
    const [lng, setLng] = useState(null);
    const [selectedVibe, setSelectedVibe] = useState('romantic');
    const [duration, setDuration] = useState(4);
    
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState(null);
    const [locationLoading, setLocationLoading] = useState(false);
    const [demoUsed, setDemoUsed] = useState(false);
    const [generatedPlan, setGeneratedPlan] = useState(null);
    const [isInNetwork, setIsInNetwork] = useState(false);

    const autocompleteRef = useRef(null);

    useEffect(() => {
        const hasUsed = localStorage.getItem('datespark_demo_used');
        if (hasUsed) {
            setDemoUsed(true);
            const cached = localStorage.getItem('datespark_demo_plan');
            if (cached) {
                try {
                    const parsed = JSON.parse(cached);
                    setGeneratedPlan(parsed.plan);
                    setIsInNetwork(parsed.inNetwork);
                } catch (e) {
                    console.error('Failed to parse cached plan', e);
                }
            }
        }
    }, []);

    useEffect(() => {
        if (!isLoaded || !window.google) return;

        const input = document.getElementById('guest-location-input');
        if (!input) return;

        autocompleteRef.current = new window.google.maps.places.Autocomplete(input, {
            types: ['(regions)'],
            componentRestrictions: { country: 'us' }
        });

        autocompleteRef.current.addListener('place_changed', () => {
            const place = autocompleteRef.current.getPlace();
            if (place.geometry) {
                const newLat = place.geometry.location.lat();
                const newLng = place.geometry.location.lng();
                setLocation(place.formatted_address || place.name);
                setLat(newLat);
                setLng(newLng);
            }
        });
    }, [isLoaded]);

    const handlePreciseLocation = () => {
        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser");
            return;
        }

        setLocationLoading(true);
        setError(null);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                if (window.google?.maps?.Geocoder) {
                    const geocoder = new window.google.maps.Geocoder();
                    geocoder.geocode({ location: { lat: latitude, lng: longitude } }, (results, status) => {
                        let readableLocation = 'Current Location';
                        if (status === 'OK' && results[0]) {
                            const locality = results[0].address_components.find(c => c.types.includes('locality'))?.long_name;
                            readableLocation = locality || results[0].formatted_address.split(',')[0];
                        }
                        setLat(latitude);
                        setLng(longitude);
                        setLocation(readableLocation);
                        setLocationLoading(false);
                    });
                } else {
                    setLat(latitude);
                    setLng(longitude);
                    setLocation('Current Location');
                    setLocationLoading(false);
                }
            },
            () => {
                setError("Unable to retrieve your location");
                setLocationLoading(false);
            }
        );
    };

    const handleGenerate = async () => {
        if (!location) {
            setError("Please enter a location.");
            return;
        }
        
        // Let them know if they try to cheat
        if (demoUsed && generatedPlan) {
           setError("You've already generated your free demo!");
           return;
        }

        setIsGenerating(true);
        setError(null);

        const inNetwork = isLocationInServiceArea(location, lat, lng);
        setIsInNetwork(inNetwork);

        try {
            const res = await fetch('/api/guest-generate-date', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ vibe: selectedVibe, location, duration, lat, lng })
            });

            if (!res.ok) throw new Error('Failed to generate.');
            const data = await res.json();
            
            const plan = data[0];
            setGeneratedPlan(plan);
            setDemoUsed(true);
            
            localStorage.setItem('datespark_demo_used', 'true');
            localStorage.setItem('datespark_demo_plan', JSON.stringify({ plan, inNetwork }));

        } catch (err) {
            setError(err.message);
        } finally {
            setIsGenerating(false);
        }
    };

    if (generatedPlan) {
        // Render the teaser!
        const steps = generatedPlan.itinerary?.steps || [];
        const isSimulation = !isInNetwork;

        return (
            <div className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 md:p-8 animate-fade-in relative z-10 transition-all duration-500">
                <div className="text-center mb-8">
                   <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-coral/10 text-coral rounded-full text-xs font-bold mb-2">
                       <Sparkles size={14} />
                       {isSimulation ? "Simulation Mode" : "Your Curated Plan"}
                   </div>
                   <h3 className="text-2xl font-black text-white">
                       {selectedVibe.charAt(0).toUpperCase() + selectedVibe.slice(1)} Date in {location}
                   </h3>
                   {isSimulation && <p className="text-sm text-gray-400 mt-1">We don't officially support this area yet, but here's a taste of what we can do.</p>}
                </div>

                <div className="space-y-4">
                    {steps.map((step, index) => {
                        const isBlurred = index > 0;
                        return (
                            <div key={index} className={`relative bg-white/5 border border-white/10 rounded-2xl p-5 ${isBlurred ? 'overflow-hidden' : ''}`}>
                                {/* BLUR OVERLAY */}
                                {isBlurred && (
                                    <div className="absolute inset-0 z-20 backdrop-blur-xl bg-navy/60 flex flex-col items-center justify-center p-6 border-white/20 border-t">
                                        <Lock className="text-gold mb-3" size={28} />
                                        <h4 className="text-xl font-bold text-white mb-2 text-center">
                                           Hidden Stop
                                        </h4>
                                        <p className="text-gray-300 text-center text-sm mb-6 max-w-sm">
                                           {isSimulation 
                                             ? `Sign up for the Waitlist to get DateSpark in ${location}.`
                                             : 'Create a free account to unlock the full itinerary and start planning your perfect dates.'}
                                        </p>
                                        
                                        <button 
                                            onClick={() => {
                                                if (isSimulation) {
                                                    document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth' });
                                                } else {
                                                    navigate('/signup');
                                                }
                                            }}
                                            className="px-6 py-3 bg-coral text-white rounded-full font-bold hover:bg-coral-dark flex items-center gap-2"
                                        >
                                            {isSimulation ? 'Join Waitlist' : 'Create Free Account'}
                                            <ArrowRight size={18} />
                                        </button>
                                    </div>
                                )}

                                {/* CONTENT (Blurred if > 0) */}
                                <div className={`flex flex-col md:flex-row gap-5 ${isBlurred ? 'opacity-30 blur-sm pointer-events-none select-none' : ''}`}>
                                    <div className="md:w-1/3 aspect-video md:aspect-square rounded-xl overflow-hidden bg-gray-800 relative">
                                        {step.photoUrl ? (
                                            <img src={step.photoUrl} alt={step.venue} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-500">No Image</div>
                                        )}
                                        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-xs text-white font-semibold">
                                            {step.time}
                                        </div>
                                    </div>
                                    <div className="md:w-2/3 flex flex-col justify-center">
                                        {step.sub_headline && (
                                            <span className="text-coral text-sm font-bold tracking-wide uppercase mb-1">
                                                {step.sub_headline}
                                            </span>
                                        )}
                                        <h4 className="text-lg font-bold text-white mb-2">{step.venue || step.activity}</h4>
                                        <p className="text-gray-300 text-sm mb-3 line-clamp-3">{step.description}</p>
                                        <div className="flex items-center gap-3 text-xs text-gray-400">
                                            {step.rating && (
                                                <div className="flex items-center gap-1">
                                                    <span className="text-gold">★</span> {step.rating} ({step.userRatingCount || 0})
                                                </div>
                                            )}
                                            {step.address && <div className="truncate"><MapPin size={12} className="inline mr-1"/> {step.address.split(',')[0]}</div>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    return (
        <div className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 md:p-8 relative z-10 shadow-2xl">
            <div className="text-center mb-8">
                <h3 className="text-2xl font-black text-white mb-2">Try The Engine</h3>
                <p className="text-gray-400">Generate a sample itinerary. Prove the magic.</p>
            </div>

            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-3">1. Select a Vibe</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {VIBES.map(v => (
                            <button
                                key={v.id}
                                onClick={() => setSelectedVibe(v.id)}
                                className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all border ${
                                    selectedVibe === v.id 
                                    ? 'bg-coral border-coral text-white scale-105 shadow-[0_0_20px_rgba(255,107,107,0.4)]' 
                                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
                                }`}
                            >
                                <span className="text-2xl mb-1">{v.icon}</span>
                                <span className="text-xs font-bold">{v.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">2. Enter a City or Neighborhood</label>
                    <div className="relative flex items-center">
                        <MapPin className="absolute left-4 text-gray-400" size={20} />
                        <input
                            id="guest-location-input"
                            type="text"
                            placeholder="e.g. West Village, NYC"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 pr-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-coral transition-all"
                            disabled={locationLoading}
                        />
                        <button
                            onClick={handlePreciseLocation}
                            className="absolute right-3 p-1.5 bg-white/10 text-coral hover:bg-white/20 hover:text-white rounded-lg transition-colors flex items-center justify-center"
                            disabled={locationLoading}
                            title="Use Current Location"
                        >
                            {locationLoading ? <Loader2 size={16} className="animate-spin text-white" /> : <Locate size={16} />}
                        </button>
                    </div>
                    {error && <p className="text-coral text-sm mt-2">{error}</p>}
                </div>

                <div>
                    <label className="block text-sm flex justify-between font-semibold text-gray-300 mb-2">
                        <span>3. How long do you have?</span>
                        <span className="text-coral">{duration} hours</span>
                    </label>
                    <input 
                        type="range" 
                        min="2" max="8" step="1"
                        value={duration}
                        onChange={(e) => setDuration(parseInt(e.target.value))}
                        className="w-full accent-coral h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1 px-1">
                        <span>Quick Bite</span>
                        <span>All Day</span>
                    </div>
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !location || locationLoading}
                    className="w-full bg-coral hover:bg-coral-dark text-white rounded-xl py-4 font-black flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(255,107,107,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed group uppercase tracking-wider relative overflow-hidden"
                >
                    <div className="absolute inset-0 w-1/4 h-full bg-white/20 skew-x-[-20deg] group-hover:animate-shine -z-10 translate-x-[-300%] group-hover:translate-x-[500%] transition-transform duration-1000"></div>
                    {isGenerating ? (
                        <>
                            <Loader2 size={24} className="animate-spin" />
                            Curating Demo...
                        </>
                    ) : (
                        <>
                            <Sparkles size={20} className="animate-pulse" />
                            Generate Free Date
                        </>
                    )}
                </button>
                <div className="text-center text-xs text-gray-500 font-medium">1 free demo per device.</div>
            </div>
        </div>
    );
};

export default GuestGenerator;
