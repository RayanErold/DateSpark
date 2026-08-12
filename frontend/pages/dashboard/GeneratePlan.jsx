import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Heart, Sparkles, MapPin, DollarSign, ArrowLeft, ArrowRight, Loader2, Calendar, Wand2, CheckCircle2, Lock, Compass, Utensils, ChevronDown, Check, Sliders, Target, Locate, Clock, X, Wallet, Umbrella, Martini, Footprints, BadgeDollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConceptSkeleton } from '../../components/ui/SkeletonLoader';
import { supabase } from '../../lib/supabase';
import { useGoogleMaps } from '../../lib/googleMaps';
import BottomNav from '../../components/common/BottomNav';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import PremiumExperienceModal from '../../components/modals/PremiumExperienceModal';
import { setFlashMessage } from '../../lib/flashMessage';


/** Must match server.js `/api/user-usage` defaults until fetch completes */
const SERVER_DEFAULT_LIMITS = { classic: 2, guided: 2, swap: 3, save_weekly: 3 };

const BUDGET_MODES = [
    { id: 'wallet', label: 'Under $50', hint: 'Free/cheap anchors', value: '$50', icon: Wallet },
    { id: 'smart', label: 'Under $100', hint: 'Best value flow', value: '$100', icon: BadgeDollarSign },
    { id: 'free_first', label: 'Free + Food', hint: 'Save on the opener', value: '$75', icon: Footprints },
    { id: 'happy_hour', label: 'Happy Hour', hint: 'Drinks and bites', value: '$80', icon: Martini },
    { id: 'splurge', label: 'Splurge', hint: 'Premium night out', value: '$250', icon: Sparkles },
    { id: 'no_reservation', label: 'No Reservation', hint: 'Flexible walk-ins', value: '$120', icon: Umbrella },
];

const NEIGHBORHOOD_PACKS = [
    { label: 'West Village Romance', neighborhoods: ['West Village', 'Greenwich Village'], vibe: 'romantic', budgetMode: 'smart' },
    { label: 'Brooklyn Creative', neighborhoods: ['Williamsburg', 'Dumbo', 'Greenpoint'], vibe: 'artistic', budgetMode: 'smart' },
    { label: 'Jersey Waterfront', neighborhoods: ['Jersey City', 'Hoboken'], vibe: 'romantic', budgetMode: 'free_first' },
    { label: 'Rainy Manhattan', neighborhoods: ['Chelsea', 'Flatiron', 'SoHo'], vibe: 'chill', budgetMode: 'no_reservation' },
    { label: 'Late Night LES', neighborhoods: ['Lower East Side', 'East Village'], vibe: 'party', budgetMode: 'happy_hour' },
];

const GeneratePlan = () => {
    const navigate = useNavigate();
    const [user, setUser] = React.useState(null);
    const [, setAuthLoading] = React.useState(true);
    const [isGenerating, setIsGenerating] = React.useState(false);
    const [loadingStage, setLoadingStage] = React.useState(0);
    const [isOnline, setIsOnline] = React.useState(navigator.onLine);
    const [isSuggesting, setIsSuggesting] = React.useState(false);
    const [isArchitectActive, setIsArchitectActive] = useState(false);

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    // Core states
    const [searchParams] = useSearchParams();
    const urlPrompt = searchParams.get('prompt') || searchParams.get('vibe') || '';
    const mode = 'classic';
    const [isSelectionSkipped, setIsSelectionSkipped] = useState(true);
    
    // --- FREEMIUM LOGIC STATE ---
    const [isPremium, setIsPremium] = useState(() => {
        // Admin Override Initialization
        const adminEmail = 'rayanerold@gmail.com';
        const userEmail = localStorage.getItem('userEmail')?.toLowerCase();
        const isCurrentlyAdmin = userEmail === adminEmail;
        if (isCurrentlyAdmin) {
            return localStorage.getItem('isPremium') === 'true';
        }
        return false; // Default false for security
    });
    const [showPremiumModal, setShowPremiumModal] = useState(false);
    const [limitType, setLimitType] = useState(null); // 'classic', 'guided', or 'swap'
    const [showAiAddonModal, setShowAiAddonModal] = useState(false);
    const [showDietaryOptions, setShowDietaryOptions] = useState(false);
    const [error, setError] = useState(null);

    // Usage state for Free users
    const [usage, setUsage] = useState({
        classic: 0,
        guided: 0,
        swap: 0,
        save_weekly: 0
    });
    const [limits, setLimits] = useState({ ...SERVER_DEFAULT_LIMITS });

    // Google Maps Autocomplete states
    const { isLoaded } = useGoogleMaps();
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [autocompleteService, setAutocompleteService] = useState(null);
    const [placesService, setPlacesService] = useState(null);

    React.useEffect(() => {
        if (isLoaded && window.google?.maps?.places) {
            if (!autocompleteService) {
                setAutocompleteService(new window.google.maps.places.AutocompleteService());
            }
            if (!placesService) {
                const dummy = document.createElement('div');
                setPlacesService(new window.google.maps.places.PlacesService(dummy));
            }
        }
    }, [isLoaded, autocompleteService, placesService]);

    // Initialize Auth Session
    React.useEffect(() => {
        const initAuth = async () => {
            try {
                const { data: { user: currentUser } } = await supabase.auth.getUser();
                setUser(currentUser);
                if (currentUser?.email) {
                    localStorage.setItem('userEmail', currentUser.email);
                }

                if (currentUser) {
                    const [premRes, usageRes] = await Promise.all([
                        fetch(`/api/user-premium/${currentUser.id}`),
                        fetch(`/api/user-usage/${currentUser.id}`)
                    ]);

                    if (premRes.ok) {
                        const { isPremium: dbStatus } = await premRes.json();

                        if (import.meta.env.DEV && currentUser?.email?.toLowerCase() === 'rayanerold@gmail.com') {
                            const manualChoice = localStorage.getItem('isPremium');
                            if (manualChoice !== null) {
                                setIsPremium(manualChoice === 'true');
                            } else {
                                setIsPremium(dbStatus);
                            }
                        } else {
                            setIsPremium(dbStatus);
                            localStorage.setItem('isPremium', dbStatus ? 'true' : 'false');
                        }
                    }

                    if (usageRes.ok) {
                        const data = await usageRes.json();
                        setUsage(prev => ({ ...prev, ...data.usage }));
                        setLimits(prev => ({ ...prev, ...data.limits }));
                    }

                    // ✨ Load Vibe Profile — pre-fill vibe & budget for personalized defaults
                    const { data: profileData } = await supabase
                        .from('profiles')
                        .select('vibe_profile')
                        .eq('id', currentUser.id)
                        .maybeSingle();

                    if (profileData?.vibe_profile) {
                        const vp = profileData.vibe_profile;
                        setVibeProfile(vp);
                        setFormData(prev => ({
                            ...prev,
                            vibe: vp.primaryVibe || prev.vibe,
                            budget: vp.budget || prev.budget,
                            budgetMode: vp.budget === 'budget' ? 'wallet' : vp.budget === 'premium' ? 'splurge' : prev.budgetMode,
                        }));
                        setAiBudget(vp.budget || '');
                    }
                }
            } catch (err) {
                console.error('GeneratePlan initAuth error:', err);
            } finally {
                setAuthLoading(false);
            }
        };

        initAuth();
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            const newUser = session?.user || null;
            setUser(newUser);
            if (newUser?.email) {
                localStorage.setItem('userEmail', newUser.email);
            }
            if (newUser) {
                const [premRes, usageRes] = await Promise.all([
                    fetch(`/api/user-premium/${newUser.id}`),
                    fetch(`/api/user-usage/${newUser.id}`)
                ]);
                if (premRes.ok) {
                    const { isPremium: dbStatus } = await premRes.json();

                    if (import.meta.env.DEV && newUser?.email?.toLowerCase() === 'rayanerold@gmail.com') {
                        const manualChoice = localStorage.getItem('isPremium');
                        if (manualChoice !== null) {
                            setIsPremium(manualChoice === 'true');
                        } else {
                            setIsPremium(dbStatus);
                        }
                    } else {
                        setIsPremium(dbStatus);
                        localStorage.setItem('isPremium', dbStatus ? 'true' : 'false');
                    }
                }
                if (usageRes.ok) {
                    const data = await usageRes.json();
                    setUsage(prev => ({ ...prev, ...data.usage }));
                    setLimits(prev => ({ ...prev, ...data.limits }));
                }
            }
            setAuthLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const syncPremiumWithDB = async (isPremiumVal) => {
        if (!user) return;
        try {
            console.log('GeneratePlan - Syncing Premium Status to DB:', isPremiumVal);
            const response = await fetch('/api/update-premium-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, isPremium: isPremiumVal })
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Sync failed');
            }
            console.log('GeneratePlan - Premium DB Sync Success');
        } catch (err) {
            console.error('GeneratePlan - DB Sync Error:', err.message);
        }
    };

    const handleBuyPass = async (planType) => {
        try {
            const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
            if (!stripe) throw new Error("Stripe Failed to Load");

            const response = await axios.post('/api/create-checkout-session', { 
                planType,
                userId: user?.id,
                email: user?.email
            });
            const { id, url } = response.data;

            if (url) {
                window.location.href = url;
            } else {
                await stripe.redirectToCheckout({ sessionId: id });
            }
        } catch (err) {
            console.error('Checkout error:', err);
            setError(`Payment failed: ${err.response?.data?.error || err.message}`);
        }
    };

    // Connectivity Tracking
    React.useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Smart Loading Stage Lifecycle
    React.useEffect(() => {
        let interval;
        if (isGenerating || isSuggesting) {
            interval = setInterval(() => {
                setLoadingStage((prev) => (prev + 1) % 6);
            }, 2500);
        } else {
            setLoadingStage(0);
        }
        return () => clearInterval(interval);
    }, [isGenerating, isSuggesting]);

    const loadingMessages = [
        "Scanning for the city's hidden gems...",
        "Curating the perfect vibe for you...",
        "Checking the best tables in the house...",
        "Setting the mood for a perfect evening...",
        "Calculating the romance factor...",
        "Almost there! Finalizing your itinerary..."
    ];

    const handleLocationChange = async (val) => {
        setFormData(prev => ({ ...prev, location: val, usePreciseLocation: false }));
        
        if (!val || val.length < 3) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        try {
            if (window.google?.maps?.importLibrary) {
                const { AutocompleteSuggestion } = await window.google.maps.importLibrary("places");
                const { suggestions: newSuggestions } = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
                    input: val,
                    includedPrimaryTypes: ['geocode', 'establishment'],
                });
                
                if (newSuggestions && newSuggestions.length > 0) {
                    const mapped = newSuggestions.map(s => ({
                        place_id: s.placePrediction.placeId,
                        description: s.placePrediction.text.text,
                        structured_formatting: {
                            main_text: s.placePrediction.text.text.split(',')[0],
                            secondary_text: s.placePrediction.text.text.split(',').slice(1).join(',').trim()
                        }
                    }));
                    setSuggestions(mapped);
                    setShowSuggestions(true);
                    return;
                }
            }
            
            if (autocompleteService) {
                autocompleteService.getPlacePredictions(
                    { input: val, types: ['geocode', 'establishment'] },
                    (predictions, status) => {
                        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
                            setSuggestions(predictions);
                            setShowSuggestions(true);
                        } else {
                            setSuggestions([]);
                            setShowSuggestions(false);
                        }
                    }
                );
            }
        } catch (err) {
            console.error("Autocomplete error:", err);
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const handleSelectSuggestion = async (suggestion) => {
        setFormData(prev => ({ ...prev, location: suggestion.description }));
        setShowSuggestions(false);

        try {
            if (window.google?.maps?.importLibrary) {
                const { Place } = await window.google.maps.importLibrary("places");
                const place = new Place({ id: suggestion.place_id });
                await place.fetchFields({ fields: ['location'] });
                if (place.location) {
                    setFormData(prev => ({
                        ...prev,
                        lat: place.location.lat(),
                        lng: place.location.lng()
                    }));
                    return;
                }
            }
            
            if (placesService && suggestion.place_id) {
                placesService.getDetails(
                    { placeId: suggestion.place_id, fields: ['geometry'] },
                    (place, status) => {
                        if (status === window.google.maps.places.PlacesServiceStatus.OK && place.geometry) {
                            setFormData(prev => ({
                                ...prev,
                                lat: place.geometry.location.lat(),
                                lng: place.geometry.location.lng()
                            }));
                        }
                    }
                );
            }
        } catch (err) {
            console.error("Place details error:", err);
        }
    };

    const popularNeighborhoods = [
        "Lower East Side", "SoHo", "West Village", "East Village", "Greenwich Village",
        "Chelsea", "Tribeca", "Upper East Side", "Upper West Side", "Hell's Kitchen",
        "Financial District", "Williamsburg", "Dumbo", "Greenpoint", "Bushwick",
        "Astoria", "Long Island City", "Harlem", "Brooklyn Heights", "Prospect Heights",
        "Fort Greene", "Park Slope", "Jersey City", "Hoboken"
    ];


    // AI Flow states
    const [initialPrompt, setInitialPrompt] = useState(urlPrompt || '');
    const [conversationHistory, setConversationHistory] = useState([]);
    const [aiConcepts, setAiConcepts] = useState([]);
    const [selectedConceptIndex, setSelectedConceptIndex] = useState(null);
    const [refinementCount, setRefinementCount] = useState(0);
    const [aiBudget, setAiBudget] = useState('');
    const [customRadius, setCustomRadius] = useState(8046);
    // Vibe profile from onboarding — used to personalize generation
    const [vibeProfile, setVibeProfile] = useState(null);

    // Classic Form states
    const [formData, setFormData] = useState({
        location: '', 
        date: today,
        vibe: 'chill',
        time: '18:00',
        endTime: '22:00',
        budget: '',
        budgetMode: 'smart',
        interests: 'Any',
        radius: 8046, 
        dietary: [],
        neighborhoods: [],
        usePreciseLocation: false,
        lat: null,
        lng: null,
        is_favorite: false
    });

    const [locationLoading, setLocationLoading] = useState(false);
    const [showLocationPrompt, setShowLocationPrompt] = useState(false);

    const handlePreciseLocation = () => {
        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser");
            return;
        }

        // If already active, just toggle off
        if (formData.usePreciseLocation) {
            setFormData(prev => ({
                ...prev,
                usePreciseLocation: false,
                location: ''
            }));
            return;
        }

        setShowLocationPrompt(true);
    };

    const triggerPreciseLocation = () => {
        setShowLocationPrompt(false);
        setLocationLoading(true);
        setError(null);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude, accuracy } = position.coords;
                console.log(`[GPS] Detected: ${latitude}, ${longitude} (Accuracy: ${accuracy}m)`);
                
                if (accuracy > 3000) {
                    console.warn("Low GPS accuracy detected. Reverting to manual if results look wrong.");
                }

                if (window.google?.maps?.Geocoder) {
                    const geocoder = new window.google.maps.Geocoder();
                    geocoder.geocode({ location: { lat: latitude, lng: longitude } }, (results, status) => {
                        let readableLocation = 'Current Location';
                        
                        if (status === 'OK' && results[0]) {
                            const neighborhood = results[0].address_components.find(c => c.types.includes('neighborhood'))?.long_name;
                            const sublocality = results[0].address_components.find(c => c.types.includes('sublocality_level_1'))?.long_name 
                                || results[0].address_components.find(c => c.types.includes('sublocality'))?.long_name;
                            const locality = results[0].address_components.find(c => c.types.includes('locality'))?.long_name;
                            const area = results[0].address_components.find(c => c.types.includes('administrative_area_level_2'))?.long_name;
                            
                            readableLocation = neighborhood || sublocality || locality || area || results[0].formatted_address.split(',')[0];
                        }

                        setFormData(prev => ({
                            ...prev,
                            lat: latitude,
                            lng: longitude,
                            usePreciseLocation: true,
                            location: readableLocation
                        }));
                        setLocationLoading(false);
                    });
                } else {
                    setFormData(prev => ({
                        ...prev,
                        lat: latitude,
                        lng: longitude,
                        usePreciseLocation: true,
                        location: 'Current Location'
                    }));
                    setLocationLoading(false);
                }
            },
            (err) => {
                console.error("Location error:", err);
                let msg = "Unable to retrieve your location. Check permissions.";
                if (err.code === 1) msg = "Location permission denied. Please enable it in browser settings.";
                if (err.code === 3) msg = "Location request timed out. Try again or enter manually.";
                setError(msg);
                setLocationLoading(false);
            },
            { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
        );
    };

    const toggleDietary = (diet) => {
        setFormData(prev => {
            const current = prev.dietary || [];
            if (current.includes(diet)) {
                return { ...prev, dietary: current.filter(d => d !== diet) };
            } else {
                return { ...prev, dietary: [...current, diet] };
            }
        });
    };

    const applyBudgetMode = (mode) => {
        setFormData(prev => ({
            ...prev,
            budgetMode: mode.id,
            budget: mode.value
        }));
        setAiBudget(mode.value);
    };

    const applyNeighborhoodPack = (pack) => {
        const matchingBudget = BUDGET_MODES.find(mode => mode.id === pack.budgetMode);
        setFormData(prev => ({
            ...prev,
            vibe: pack.vibe,
            budgetMode: pack.budgetMode,
            budget: matchingBudget?.value || prev.budget,
            neighborhoods: pack.neighborhoods
        }));
        if (matchingBudget?.value) setAiBudget(matchingBudget.value);
    };

    const handleModeSwitch = (newMode) => {
        if (newMode === 'ai_custom' && !isPremium && usage.guided >= limits.guided) {
            setLimitType('guided');
            setShowPremiumModal(true);
            return;
        }
        setMode(newMode);
        setError(null);
    };

    const handleSuggestConcepts = async (e) => {
        if (e) e.preventDefault();
        
        if (!initialPrompt.trim()) return;
        if (!formData.location) {
            setError("Please select a location first.");
            return;
        }

        if (!isPremium && usage.guided >= limits.guided) {
            setLimitType('guided');
            setShowPremiumModal(true);
            return;
        }

        setIsArchitectActive(true);
        setAiConcepts(['INIT']); 
    };

    const handleGenerateCustom = async (e, forcedConcept = null, forcedSettings = null) => {
        if (e && e.preventDefault) e.preventDefault();
        
        const conceptToUse = forcedConcept || (selectedConceptIndex !== null ? aiConcepts[selectedConceptIndex] : null);
        if (!conceptToUse) return;

        if (!isPremium && usage.classic >= limits.classic) {
            setLimitType('classic');
            setShowPremiumModal(true);
            return;
        }

        setIsGenerating(true);
        setError(null);

        try {
            const currentUser = user || (await supabase.auth.getUser()).data.user;
            if (!currentUser) throw new Error('You must be logged in.');

            const response = await fetch('/api/generate-custom-date', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: currentUser.id,
                    concept: conceptToUse,
                    date: formData.date,
                    budget: forcedSettings?.budget || aiBudget || formData.budget,
                    budgetMode: formData.budgetMode,
                    radius: forcedSettings?.radius || customRadius,
                    location: forcedSettings?.location || formData.location,
                    lat: forcedSettings?.lat !== undefined ? forcedSettings.lat : formData.lat,
                    lng: forcedSettings?.lng !== undefined ? forcedSettings.lng : formData.lng,
                    dietary: formData.dietary,
                    neighborhoods: formData.neighborhoods,
                    interests: formData.interests,
                    is_favorite: formData.is_favorite
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                if (response.status === 403 || errData.code === 'LIMIT_REACHED') {
                    setIsGenerating(false);
                    setLimitType('classic');
                    setShowPremiumModal(true);
                    return;
                }
                throw new Error(errData.error || 'Failed to build custom itinerary.');
            }

            const result = await response.json();
            const firstPlanId = result.plan?.id || (Array.isArray(result) ? result[0]?.id : null);

            if (!isPremium) {
                setUsage(prev => ({ ...prev, classic: prev.classic + 1 }));
            }

            setFlashMessage('Plan ready — opening your itinerary.');
            if (firstPlanId) {
                navigate(`/shared/${firstPlanId}`);
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.message);
            setIsGenerating(false);
            if (err.message.toLowerCase().includes('limit') || err.message.toLowerCase().includes('reached')) {
                setLimitType('classic');
                setShowPremiumModal(true);
            }
        }
    };

    const handleSubmitClassic = async (e) => {
        if (e && e.preventDefault) e.preventDefault();

        if (!formData.location || !formData.date || !formData.time || !formData.endTime) {
            setError("Please fill out all required fields under 'Where & When'.");
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        setError(null);

        if (!isPremium && usage.guided >= limits.guided) {
            setLimitType('guided');
            setShowPremiumModal(true);
            return;
        }

        const performGenerate = async (retryCount = 0) => {
            setIsGenerating(true);
            try {
                if (!isOnline) throw new Error('You appear to be offline. Check your connection.');

                const currentUser = user || (await supabase.auth.getUser()).data.user;
                if (!currentUser) throw new Error('You must be logged in.');

                const response = await fetch('/api/generate-date', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: currentUser.id,
                        ...formData,
                        vibeProfile: vibeProfile || null,
                    })
                });

                if (!response.ok) {
                    const result = await response.json();
                    if (response.status === 403 || result.code === 'LIMIT_REACHED') {
                        setIsGenerating(false);
                        setLimitType('guided');
                        setShowPremiumModal(true);
                        return;
                    }
                    if (response.status >= 500 && retryCount < 1) {
                        return performGenerate(retryCount + 1);
                    }
                    throw new Error(result.error || 'Failed to generate plan.');
                }

                const createdPlans = await response.json();
                
                if (!isPremium) {
                    setUsage(prev => ({ ...prev, guided: prev.guided + 1 }));
                }

                setFlashMessage('Plan ready — opening your dashboard!');
                navigate('/dashboard');
            } catch (err) {
                setError(err.message === 'Failed to fetch' ? 'Network error. We will save your data so you can retry!' : err.message);
                setIsGenerating(false);
                if (err.message.toLowerCase().includes('limit') || err.message.toLowerCase().includes('reached')) {
                    setLimitType('guided');
                    setShowPremiumModal(true);
                }
            }
        };

        performGenerate();
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col relative overflow-hidden">
            {!isOnline && (
                <div className="bg-red-600 text-white text-[11px] font-black uppercase tracking-widest py-2 text-center sticky top-0 z-[100] animate-in slide-in-from-top-full duration-300">
                    ⚠️ Connection Lost. Check your internet.
                </div>
            )}
            <div className="absolute top-0 right-0 -z-10 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-coral/10 via-transparent to-transparent opacity-60" />
            <div className="absolute top-[20%] right-[-10%] -z-10 w-[500px] h-[500px] bg-coral/5 rounded-full blur-[120px] animate-pulse" />
            
            <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-30">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Link to="/dashboard" className="flex items-center gap-2 text-navy hover:text-coral transition-all font-black text-sm group">
                        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-coral/10 group-hover:scale-110 transition-all">
                            <ArrowLeft className="w-4 h-4" />
                        </div>
                        Back
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-coral/20 to-pink-500/20 rounded-xl p-[1px]">
                            <div className="w-full h-full bg-white rounded-[11px] flex items-center justify-center">
                                <img src="/datespark-logo.png" alt="DateSpark Logo" className="w-7 h-7 object-cover" />
                            </div>
                        </div>
                        <span className="text-xl font-black text-navy tracking-tight">DateSpark</span>
                    </div>
                    {/* Mock Toggle - ADMIN ONLY */}
                    {(import.meta.env.DEV && (user?.email?.toLowerCase() === 'rayanerold@gmail.com' || localStorage.getItem('userEmail')?.toLowerCase() === 'rayanerold@gmail.com')) && (
                        <div className="hidden md:flex items-center gap-2 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100">
                            <span className={`text-xs font-bold ${!isPremium ? 'text-coral' : 'text-gray-400'}`}>Free</span>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    const newVal = !isPremium;
                                    setIsPremium(newVal);
                                    localStorage.setItem('isPremium', newVal.toString());
                                    syncPremiumWithDB(newVal);
                                }}
                                className={`w-10 h-5 rounded-full transition-all duration-200 relative flex items-center shadow-inner ${isPremium ? 'bg-navy' : 'bg-gray-300'}`}
                                title="Admin: Toggle Premium Status"
                            >
                                <div className={`w-3.5 h-3.5 rounded-full bg-white shadow-md absolute transition-all duration-200 ${isPremium ? 'left-6' : 'left-0.5'}`} />
                            </button>
                            <span className={`text-xs font-bold ${isPremium ? 'text-navy' : 'text-gray-400'}`}>Pro</span>
                        </div>
                    )}
                    <div className="w-8 flex justify-end" />
                </div>
            </header>

            <main className={`flex-grow flex flex-col pt-6 pb-24 px-4 sm:px-6 relative z-10 w-full mx-auto transition-all duration-500 ${mode === 'ai_custom' ? 'max-w-5xl' : 'max-w-2xl'}`}>
                <div className="text-center mb-8 sm:mb-12 relative animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-50 text-violet-600 rounded-full border border-violet-100 mb-4 sm:mb-6 group cursor-default shadow-sm animate-pulse">
                        <Sparkles className="w-3 h-3 group-hover:rotate-12 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest">AI-Powered Experience</span>
                    </div>
                    <h1 className="text-2xl sm:text-4xl md:text-6xl font-black text-navy mb-4 sm:mb-6 tracking-tighter leading-[1.1]">
                        Design your <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-fuchsia-500 to-coral">perfect date</span>
                    </h1>
                    <p className="text-gray-500 text-xs sm:text-lg md:text-xl font-medium max-w-lg mx-auto leading-relaxed px-4">
                        Stop planning, start experiencing. Your <span className="text-navy font-black italic">perfect night out</span> is just a few clicks away.
                    </p>
                </div>



                {error && (
                    <div className="p-4 mb-6 bg-red-50 text-red-600 rounded-2xl text-sm font-bold border border-red-100 italic flex items-center justify-between gap-3 shadow-sm animate-in fade-in slide-in-from-left-4 duration-300">
                        <div className="flex items-center gap-2">
                            {error.toLowerCase().includes('limit') ? <Lock className="w-4 h-4" /> : <X className="w-4 h-4" />}
                            <span>{error}</span>
                        </div>
                        {error.toLowerCase().includes('limit') || error.toLowerCase().includes('upgrade') ? (
                            <button 
                                onClick={(e) => { e.preventDefault(); setShowPremiumModal(true); }}
                                className="bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white px-4 py-2 rounded-xl text-xs font-black hover:shadow-lg hover:shadow-fuchsia-500/20 transition-all flex-shrink-0 animate-pulse"
                            >
                                Upgrade to Premium
                            </button>
                        ) : (
                            <button 
                                onClick={() => handleSubmitClassic({ preventDefault: () => {} })}
                                className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-black hover:bg-red-700 transition-colors flex-shrink-0"
                            >
                                Retry Now
                            </button>
                        )}
                    </div>
                )}



                {/* --- CLASSIC MODE --- */}
                {mode === 'classic' && (
                    <div className="bg-white rounded-[2.5rem] shadow-[0_8px_60px_rgba(0,0,0,0.05)] border border-gray-100 p-8 sm:p-12 mb-20 animate-in fade-in zoom-in-95 duration-500 relative">
                        <form onSubmit={handleSubmitClassic} className="space-y-10">
                            {/* SECTION: WHERE & WHEN */}
                            <div className="space-y-6">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Step 1 of 2</p>
                                <label className="text-[15px] font-black text-navy uppercase tracking-wider flex items-center gap-2">
                                    <MapPin className="text-coral w-4 h-4" /> Where & When
                                </label>
                                <div className="relative group">
                                    <Compass className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        placeholder="City, Neighborhood or Zip Code..."
                                        required
                                        value={formData.location}
                                        onChange={(e) => handleLocationChange(e.target.value)}
                                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                        onFocus={() => formData.location.length >= 3 && setShowSuggestions(true)}
                                        className="w-full pl-14 pr-32 py-4 sm:py-5 bg-white border-2 border-gray-100 rounded-2xl focus:outline-none focus:border-coral/50 text-[15px] font-bold text-navy shadow-sm transition-all"
                                    />
                                    {showSuggestions && suggestions.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                            {suggestions.map((s) => (
                                                <button
                                                    key={s.place_id}
                                                    type="button"
                                                    onMouseDown={() => handleSelectSuggestion(s)}
                                                    className="w-full px-6 py-4 text-left hover:bg-gray-50 flex items-center gap-3 border-b border-gray-50 last:border-0 transition-colors"
                                                >
                                                    <MapPin className="w-4 h-4 text-gray-400" />
                                                    <div>
                                                        <div className="text-[14px] font-bold text-navy">{s.structured_formatting.main_text}</div>
                                                        <div className="text-[11px] text-gray-400">{s.structured_formatting.secondary_text}</div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        onClick={handlePreciseLocation}
                                        disabled={locationLoading}
                                        className={`absolute right-3 top-1/2 -translate-y-1/2 px-3 sm:px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all shadow-lg active:scale-95 ${
                                            formData.usePreciseLocation 
                                            ? 'bg-green-500 text-white shadow-green-500/20' 
                                            : 'bg-coral text-white shadow-coral/30 hover:bg-coral-600 animate-pulse-subtle'
                                        }`}
                                    >
                                        {locationLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Locate className="w-3.5 h-3.5" />}
                                        <span className="hidden sm:inline">{formData.usePreciseLocation ? 'GPS: ACTIVE' : 'Use My Location'}</span>
                                        <span className="sm:hidden">{formData.usePreciseLocation ? 'ON' : 'GPS'}</span>
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[12px] font-black text-gray-400 uppercase tracking-widest px-1">Date</label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                            className="w-full px-5 py-3.5 sm:py-4 bg-white border-2 border-gray-100 rounded-2xl focus:outline-none focus:border-coral/50 text-[14px] font-bold text-navy shadow-sm"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[12px] font-black text-gray-400 uppercase tracking-widest px-1">Start Time</label>
                                        <input
                                            type="time"
                                            required
                                            value={formData.time}
                                            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                            className="w-full px-5 py-3.5 sm:py-4 bg-white border-2 border-gray-100 rounded-2xl focus:outline-none focus:border-coral/50 text-[14px] font-bold text-navy shadow-sm"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[12px] font-black text-gray-400 uppercase tracking-widest px-1">Ends by</label>
                                        <input
                                            type="time"
                                            required
                                            value={formData.endTime}
                                            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                            className="w-full px-5 py-3.5 sm:py-4 bg-white border-2 border-gray-100 rounded-2xl focus:outline-none focus:border-coral/50 text-[14px] font-bold text-navy shadow-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* SECTION: VIBE & INTERESTS */}
                            <div className="space-y-8 pt-4 border-t border-gray-100">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Step 2 of 2</p>
                                <label className="text-[15px] font-black text-navy uppercase tracking-wider flex items-center gap-2">
                                    <Sparkles className="text-coral w-4 h-4" /> Vibe & Interests
                                </label>

                                <div className="space-y-4">
                                    <label className="text-[12px] font-black text-gray-400 uppercase tracking-widest px-1">Choose the Vibe</label>
                                    <div className="relative">
                                        <select
                                            value={formData.vibe}
                                            onChange={(e) => setFormData({ ...formData, vibe: e.target.value })}
                                            className="w-full px-6 py-5 bg-white border-2 border-gray-100 rounded-2xl focus:outline-none focus:border-coral/50 text-[15px] font-bold text-navy shadow-sm appearance-none cursor-pointer transition-all hover:border-gray-200"
                                        >
                                            <option value="chill">Chill & Cozy</option>
                                            <option value="romantic">Romantic & Intimate</option>
                                            <option value="active">Active & Adventurous</option>
                                            <option value="fancy">Fancy & Upscale</option>
                                            <option value="hidden">Hidden Gems & Unique</option>
                                            <option value="artistic">Artistic & Cultural</option>
                                            <option value="playful">Playful & Competitive</option>
                                            <option value="nature">Nature & Serenity</option>
                                            <option value="party">Night Owl & Party</option>
                                            <option value="educational">Educational & Curious</option>
                                        </select>
                                        <Sliders className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 w-5 h-5" />
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex justify-between items-center px-1">
                                        <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Budget Strategy</h4>
                                        <span className="text-sm font-black text-coral">{BUDGET_MODES.find(mode => mode.id === formData.budgetMode)?.label || formData.budget || '$0'}</span>
                                    </div>
                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                                        {BUDGET_MODES.map((mode) => {
                                            const Icon = mode.icon;
                                            const isActive = formData.budgetMode === mode.id;
                                            return (
                                                <button
                                                    type="button"
                                                    key={mode.id}
                                                    onClick={() => applyBudgetMode(mode)}
                                                    className={`min-h-[76px] rounded-2xl border-2 p-3 text-left transition-all active:scale-[0.98] ${isActive ? 'border-coral bg-coral text-white shadow-lg shadow-coral/20' : 'border-gray-100 bg-white text-navy hover:border-coral/30'}`}
                                                >
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-coral'}`} />
                                                        <span className="text-[12px] font-black leading-tight">{mode.label}</span>
                                                    </div>
                                                    <p className={`text-[10px] font-bold leading-snug ${isActive ? 'text-white/80' : 'text-gray-400'}`}>{mode.hint}</p>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1000"
                                        step="1"
                                        value={parseInt((formData.budget || '$0').replace('$', '') || 0)}
                                        onChange={(e) => setFormData({ ...formData, budget: `$${e.target.value}` })}
                                        className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-coral"
                                    />
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[12px] font-black text-gray-400 uppercase tracking-widest px-1">Primary Interest</label>
                                    <div className="relative">
                                        <select
                                            value={formData.interests}
                                            onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                                            className="w-full px-6 py-5 bg-white border-2 border-gray-100 rounded-2xl focus:outline-none focus:border-coral/50 text-[15px] font-bold text-navy shadow-sm appearance-none cursor-pointer transition-all hover:border-gray-200"
                                        >
                                            <option value="Any">Everything / Mix</option>
                                            <option value="Food & Drink">Food & Cocktails</option>
                                            <option value="Entertainment & Culture">Shows & Culture</option>
                                            <option value="Outdoor Activities">Parks & Outdoor</option>
                                            <option value="Fun & Adventure">Games & Trivia</option>
                                            <option value="Art & Museums">Art & Museums</option>
                                            <option value="Live Music">Live Music & Gigs</option>
                                            <option value="Health & Wellness">Health & Wellness</option>
                                            <option value="Shopping & Fashion">Shopping & Fashion</option>
                                            <option value="Sports & Fitness">Sports & Fitness</option>
                                            <option value="Tech & Innovation">Tech & Innovation</option>
                                        </select>
                                        <Target className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 w-5 h-5" />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[12px] font-black text-gray-400 uppercase tracking-widest px-1">Search Radius</label>
                                    <div className="relative">
                                        <select
                                            value={formData.radius}
                                            onChange={(e) => setFormData({ ...formData, radius: Number(e.target.value) })}
                                            className="w-full px-6 py-5 bg-white border-2 border-gray-100 rounded-2xl focus:outline-none focus:border-coral/50 text-[15px] font-bold text-navy shadow-sm appearance-none cursor-pointer transition-all hover:border-gray-200"
                                        >
                                            <option value={1609}>1 Mile</option>
                                            <option value={4828}>3 Miles</option>
                                            <option value={8046}>5 Miles</option>
                                            <option value={16093}>10 Miles</option>
                                            <option value={32186}>20 Miles</option>
                                        </select>
                                        <Compass className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 w-5 h-5" />
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowDietaryOptions(!showDietaryOptions)}
                                        className="w-full flex items-center justify-between gap-4 p-5 bg-navy/5 border-2 border-navy/10 hover:border-navy/20 hover:bg-navy/10 rounded-2xl transition-all duration-300 group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-white border border-navy/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <Sliders className="w-5 h-5 text-navy" />
                                            </div>
                                            <div className="text-left">
                                                <div className="text-[14px] font-black text-navy leading-tight">Fine-tune your results</div>
                                                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-tighter">Neighborhoods & Dietary</div>
                                            </div>
                                        </div>
                                        <ChevronDown className={`w-5 h-5 text-navy transition-transform duration-300 ${showDietaryOptions ? 'rotate-180' : ''}`} />
                                    </button>

                                    {showDietaryOptions && (
                                        <div className="space-y-8 mt-4 p-8 bg-gray-50/80 rounded-[2.5rem] border border-gray-100 animate-in fade-in slide-in-from-top-4 duration-300">
                                            <div className="space-y-4">
                                                <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-1">Local Date Packs</h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                    {NEIGHBORHOOD_PACKS.map((pack) => (
                                                        <button
                                                            type="button"
                                                            key={pack.label}
                                                            onClick={() => applyNeighborhoodPack(pack)}
                                                            className="p-4 rounded-2xl bg-white border-2 border-gray-100 text-left hover:border-coral/40 hover:-translate-y-0.5 transition-all active:scale-[0.98]"
                                                        >
                                                            <div className="flex items-center justify-between gap-3 mb-1">
                                                                <span className="text-[13px] font-black text-navy">{pack.label}</span>
                                                                <MapPin className="w-4 h-4 text-coral flex-shrink-0" />
                                                            </div>
                                                            <p className="text-[11px] font-bold text-gray-400 leading-snug">
                                                                {pack.neighborhoods.join(' + ')}
                                                            </p>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-1">Specific Neighborhoods (Max 3)</h4>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                    {popularNeighborhoods.map(nb => {
                                                        const isChecked = (formData.neighborhoods || []).includes(nb);
                                                        const isDisabled = !isChecked && (formData.neighborhoods || []).length >= 3;
                                                        return (
                                                            <button
                                                                type="button"
                                                                key={nb}
                                                                disabled={isDisabled}
                                                                onClick={() => {
                                                                    const current = formData.neighborhoods || [];
                                                                    if (isChecked) {
                                                                        setFormData({ ...formData, neighborhoods: current.filter(n => n !== nb) });
                                                                    } else if (current.length < 3) {
                                                                        setFormData({ ...formData, neighborhoods: [...current, nb] });
                                                                    }
                                                                }}
                                                                className={`px-4 py-3 rounded-xl text-[12px] font-bold border-2 text-left transition-all ${isChecked ? 'bg-coral text-white border-coral shadow-md' : 'bg-white text-gray-500 border-gray-100 hover:border-coral/40'} ${isDisabled ? 'opacity-30 cursor-not-allowed' : ''}`}
                                                            >
                                                                {nb}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-1">Dietary Restrictions</h4>
                                                <div className="flex flex-wrap gap-2 mb-8">
                                                    {['Vegan', 'Vegetarian', 'Gluten-Free', 'Halal', 'Kosher', 'Nut Allergy'].map((diet) => {
                                                        const isChecked = (formData.dietary || []).includes(diet);
                                                        return (
                                                            <button
                                                                type="button"
                                                                key={diet}
                                                                onClick={() => toggleDietary(diet)}
                                                                className={`px-4 py-3 rounded-xl text-[12px] font-bold border-2 transition-all ${isChecked ? 'bg-coral text-white border-coral shadow-md' : 'bg-white text-gray-500 border-gray-100 hover:border-coral/40'}`}
                                                            >
                                                                {diet}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* MAIN SUBMIT BUTTONS */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-12 mb-6">
                                <button
                                    type="submit"
                                    disabled={isGenerating}
                                    className="w-full bg-navy text-white hover:bg-navy/90 py-5 rounded-2xl text-[17px] font-black flex items-center justify-center gap-3 disabled:opacity-50 transition-all shadow-lg active:scale-95 group sm:col-span-2"
                                >
                                    {isGenerating ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Sparkles className="w-6 h-6 group-hover:animate-pulse" />Generate Itineraries</>}
                                </button>

                                <div className="sm:col-span-2 flex items-center gap-3 px-4 py-2 bg-white border-2 border-gray-100 rounded-2xl shadow-sm">
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, is_favorite: !prev.is_favorite }))}
                                        className={`w-12 h-6 rounded-full transition-all duration-300 relative flex items-center p-1 shadow-inner ${formData.is_favorite ? 'bg-coral' : 'bg-gray-300'}`}
                                    >
                                        <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-300 ${formData.is_favorite ? 'translate-x-6' : 'translate-x-0'}`} />
                                    </button>
                                    <span className="text-[14px] font-black text-navy uppercase tracking-widest flex items-center gap-2">
                                        <Heart className={`w-4 h-4 ${formData.is_favorite ? 'fill-coral text-coral' : 'text-gray-400'}`} />
                                        Save to Favorites Automatically
                                    </span>
                                </div>
                                
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFormData(prev => ({ ...prev, vibe: 'hidden', interests: 'Any', budget: '$200' }));
                                        handleSubmitClassic({ preventDefault: () => { } });
                                    }}
                                    className="w-full bg-white text-coral border-2 border-coral/20 hover:border-coral/40 hover:bg-coral/5 py-4 rounded-2xl text-[15px] font-black flex items-center justify-center gap-2 transition-all active:scale-95 group"
                                >
                                    <Sparkles className="w-4 h-4 text-coral opacity-50 group-hover:opacity-100" /> Surprise Me!
                                </button>
                                
                                <button
                                    type="button"
                                    onClick={() => navigate('/dashboard')}
                                    className="w-full bg-gray-100 text-gray-500 hover:bg-gray-200 py-4 rounded-2xl text-[15px] font-black flex items-center justify-center gap-2 transition-all active:scale-95"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Smart Loading Overlay */}
                {isGenerating && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="fixed inset-0 bg-white/40 backdrop-blur-2xl z-[100] flex flex-col items-center justify-center p-6 text-center"
                    >
                        <div className="relative mb-12">
                            <motion.div 
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                className="w-32 h-32 border-[3px] border-coral/10 border-t-coral rounded-full"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                >
                                    <Heart className="w-10 h-10 fill-coral text-coral" />
                                </motion.div>
                            </div>
                        </div>
                        
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="space-y-4"
                        >
                            <h2 className="text-4xl font-black text-navy tracking-tight">Crafting Your Evening</h2>
                            <p className="text-coral font-black text-xl animate-pulse min-h-[1.5em]">
                                {loadingMessages[loadingStage]}
                            </p>
                        </motion.div>

                        <div className="mt-16 max-w-sm w-full bg-navy/5 h-1.5 rounded-full overflow-hidden">
                            <motion.div 
                                className="h-full bg-gradient-to-r from-coral to-pink-500 rounded-full"
                                animate={{ width: `${((loadingStage + 1) / loadingMessages.length) * 100}%` }}
                                transition={{ duration: 1 }}
                            />
                        </div>
                        <p className="mt-6 text-[10px] font-black uppercase tracking-[0.3em] text-navy/30">Step {loadingStage + 1} of {loadingMessages.length}</p>
                    </motion.div>
                )}
            </main>

            {/* AI Add-On Modal */}
            {showAiAddonModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-200 border border-gray-100">
                        <button
                            onClick={() => setShowAiAddonModal(false)}
                            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                        >
                            ✕
                        </button>
                        <div className="w-16 h-16 bg-gradient-to-br from-coral to-pink-500 rounded-2xl flex items-center justify-center mb-6">
                            <Sparkles className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-2xl font-black text-navy mb-2">Unlimited AI Customizer</h3>
                        <p className="text-gray-500 mb-6 font-medium">Unlock DateSpark Plus for unlimited access to the AI date customizer forever.</p>
                        <button
                            onClick={() => {
                                setIsPremium(true);
                                setShowAiAddonModal(false);
                                setMode('ai_custom');
                            }}
                            className="w-full bg-gradient-to-r from-coral to-pink-500 text-white text-lg font-black py-4 rounded-xl flex items-center justify-center gap-2 hover:shadow-lg transition-all"
                        >
                            Unlock for $9.99 <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            <BottomNav 
                currentTab="generate" 
                onTabChange={(tab) => {
                    if (tab === 'home') navigate('/dashboard');
                    if (tab === 'vibe') navigate('/vibe-feed');
                    if (tab === 'account') navigate('/dashboard'); 
                }}
                appTheme="light"
            />

            <PremiumExperienceModal 
                isOpen={showPremiumModal} 
                onClose={() => { setShowPremiumModal(false); setLimitType(null); }}
                onUpgrade={(type) => handleBuyPass(type || 'ELITE')}
                limitType={limitType}
            />

            {showLocationPrompt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-navy/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="w-full max-w-md bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden">
                        <div className="absolute -right-12 -top-12 w-32 h-32 bg-coral/10 rounded-full blur-2xl" />
                        <div className="absolute -left-12 -bottom-12 w-32 h-32 bg-[#4361ee]/5 rounded-full blur-2xl" />
                        
                        <div className="relative z-10 text-center font-outfit">
                            <div className="w-14 h-14 bg-gradient-to-br from-coral to-orange-400 rounded-2xl mx-auto mb-5 flex items-center justify-center shadow-lg shadow-coral/30">
                                <MapPin className="w-7 h-7 text-white" />
                            </div>
                            
                            <h3 className="text-2xl font-black text-navy mb-2 tracking-tight">Allow Precise Location?</h3>
                            <p className="text-xs text-gray-500 leading-relaxed mb-6 font-medium">
                                DateSpark needs your location coordinates to find the best local hotspots, trending performances, and events happening nearby.
                            </p>
                            
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={triggerPreciseLocation}
                                    className="w-full py-3.5 bg-coral text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-md shadow-coral/25 hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer"
                                >
                                    Yes, Allow GPS Access
                                </button>
                                <button
                                    onClick={() => setShowLocationPrompt(false)}
                                    className="w-full py-3.5 bg-gray-50 text-navy text-xs font-black uppercase tracking-wider rounded-2xl border border-gray-150 hover:bg-gray-100 active:scale-[0.98] transition-all cursor-pointer"
                                >
                                    No, Search Manually
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GeneratePlan;
