import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Sparkles, MapPin, DollarSign, ArrowLeft, ArrowRight, Loader2, Calendar, Wand2, CheckCircle2, Lock, Compass, Utensils, ChevronDown, Check, Sliders, Target, Locate } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useJsApiLoader } from '@react-google-maps/api';
import BottomNav from '../components/BottomNav';

const LIBRARIES = ['places'];

const GeneratePlan = () => {
    const navigate = useNavigate();
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSuggesting, setIsSuggesting] = useState(false);

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    // Core states
    const [mode, setMode] = useState('classic'); // 'classic' or 'ai_custom'
    const [isPremium, setIsPremium] = useState(() => localStorage.getItem('isPremium') === 'true'); 
    const [showPremiumModal, setShowPremiumModal] = useState(false);
    const [showAiAddonModal, setShowAiAddonModal] = useState(false);
    const [showDietaryOptions, setShowDietaryOptions] = useState(false);
    const [error, setError] = useState(null);

    // Google Maps Autocomplete states
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        libraries: LIBRARIES,
    });
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

    const handleLocationChange = (val) => {
        setFormData({ ...formData, location: val, usePreciseLocation: false });
        
        if (!val || val.length < 3 || !autocompleteService) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        autocompleteService.getPlacePredictions(
            {
                input: val,
                types: ['geocode', 'establishment'],
            },
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
    };

    const handleSelectSuggestion = (suggestion) => {
        setFormData(prev => ({ ...prev, location: suggestion.description }));
        setShowSuggestions(false);

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
    };

    const popularNeighborhoods = [
        "Downtown", "Midtown", "Westside", "Eastside", "Waterfront", "Arts District", "Historic Center", "Residential Area"
    ];

    // AI Custom Uses tracking for Free users
    const [aiCustomUses, setAiCustomUses] = useState(() => {
        const saved = localStorage.getItem('aiCustomUses');
        const lastUseTime = localStorage.getItem('aiCustomLastUseTime');

        if (lastUseTime) {
            const passedTime = Date.now() - parseInt(lastUseTime, 10);
            const twentyFourHours = 24 * 60 * 60 * 1000;
            if (passedTime >= twentyFourHours) {
                localStorage.setItem('aiCustomUses', '0');
                return 0;
            }
        }
        return saved ? parseInt(saved, 10) : 0;
    });

    // AI Flow states
    const [initialPrompt, setInitialPrompt] = useState('');
    const [refinePrompt, setRefinePrompt] = useState('');
    const [conversationHistory, setConversationHistory] = useState([]);
    const [aiConcepts, setAiConcepts] = useState([]);
    const [aiQuestions, setAiQuestions] = useState([]);
    const [ideaCount, setIdeaCount] = useState(3);
    const [selectedConceptIndex, setSelectedConceptIndex] = useState(null);
    const [refinementCount, setRefinementCount] = useState(0);
    const [aiBudget, setAiBudget] = useState('');
    const [customRadius, setCustomRadius] = useState(8046); 

    // Classic Form states
    const [formData, setFormData] = useState({
        location: '', 
        date: today,
        vibe: 'chill',
        time: '18:00',
        endTime: '22:00',
        budget: '',
        interests: 'Any',
        radius: 8046, 
        dietary: [],
        neighborhoods: [],
        usePreciseLocation: false,
        lat: null,
        lng: null
    });

    const [locationLoading, setLocationLoading] = useState(false);

    const handlePreciseLocation = () => {
        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser");
            return;
        }

        setLocationLoading(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setFormData(prev => ({
                    ...prev,
                    lat: latitude,
                    lng: longitude,
                    usePreciseLocation: !prev.usePreciseLocation,
                    location: 'Current Location'
                }));
                setLocationLoading(false);
            },
            (err) => {
                console.error("Location error:", err);
                setError("Unable to retrieve your location. Check permissions.");
                setLocationLoading(false);
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
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

    const handleModeSwitch = (newMode) => {
        if (newMode === 'ai_custom' && !isPremium && aiCustomUses >= 2) {
            setShowAiAddonModal(true);
            return;
        }
        setMode(newMode);
        setError(null);
    };

    const handleSuggestConcepts = async (e, isRefinement = false) => {
        if (e) e.preventDefault();
        if (isRefinement && refinementCount >= 2) {
            setError("Maximum refinements reached for this idea.");
            return;
        }

        if (!isPremium && aiCustomUses >= 2) {
            setShowAiAddonModal(true);
            return;
        }

        let newHistory = [];
        if (!isRefinement) {
            if (!initialPrompt.trim()) return;
            newHistory = [{ role: 'user', text: initialPrompt }];
        } else {
            if (!refinePrompt.trim()) return;
            newHistory = [...conversationHistory, { role: 'user', text: refinePrompt }];
        }

        setIsSuggesting(true);
        setError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            const response = await fetch('/api/suggest-date-concepts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversationHistory: newHistory,
                    ideaCount: 3, // Consistently return 3 ideas
                    userId: user?.id,
                    budget: aiBudget
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to generate suggestions.');
            }

            const data = await response.json();
            setAiConcepts(data.concepts || []);
            setAiQuestions(data.questions || []);
            setConversationHistory([...newHistory, { role: 'ai', text: `Pitched ${data.concepts?.length} ideas.` }]);
            if (isRefinement) {
                setRefinePrompt('');
                setRefinementCount(prev => prev + 1);
            }
            setSelectedConceptIndex(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSuggesting(false);
        }
    };

    const handleGenerateCustom = async (e) => {
        e.preventDefault();
        if (!isPremium && aiCustomUses >= 2) {
            setShowAiAddonModal(true);
            return;
        }
        if (selectedConceptIndex === null) return;
        setIsGenerating(true);
        setError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            const selectedConcept = aiConcepts[selectedConceptIndex];
            const response = await fetch('/api/generate-custom-date', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user?.id,
                    concept: selectedConcept,
                    date: formData.date,
                    radius: customRadius,
                    location: formData.location,
                    lat: formData.lat,
                    lng: formData.lng
                })
            });

            if (!response.ok) throw new Error('Failed to build custom itinerary.');

            if (!isPremium) {
                const newUses = aiCustomUses + 1;
                setAiCustomUses(newUses);
                localStorage.setItem('aiCustomUses', newUses.toString());
                localStorage.setItem('aiCustomLastUseTime', Date.now().toString());
            }

            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
            setIsGenerating(false);
        }
    };

    const handleSubmitClassic = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        setIsGenerating(true);
        setError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('You must be logged in.');

            const response = await fetch('/api/generate-date', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    ideaCount,
                    ...formData
                })
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Failed to generate plan.');
            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
            setIsGenerating(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col relative overflow-hidden">
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
                    <div className="w-16" />
                </div>
            </header>

            <main className="flex-grow flex flex-col pt-16 px-4 sm:px-6 relative z-10 w-full max-w-2xl mx-auto">
                <div className="text-center mb-12 relative animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-50 text-violet-600 rounded-full border border-violet-100 mb-6 group cursor-default shadow-sm animate-pulse">
                        <Sparkles className="w-3 h-3 group-hover:rotate-12 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest">AI-Powered Experience</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-navy mb-6 tracking-tighter leading-[1.1]">
                        Design your <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-fuchsia-500 to-coral">perfect date</span>
                    </h1>
                    <p className="text-gray-500 text-lg md:text-xl font-medium max-w-lg mx-auto leading-relaxed">
                        Stop planning, start experiencing. Your <span className="text-navy font-black italic">perfect night out</span> is just a few clicks away.
                    </p>
                </div>

                <div className="flex bg-gray-200/50 backdrop-blur-sm p-1.5 rounded-[1.5rem] mb-12 border border-white shadow-xl shadow-navy/5">
                    <button
                        onClick={() => handleModeSwitch('classic')}
                        className={`flex-1 py-4 px-6 rounded-[1.25rem] font-black text-lg flex items-center justify-center gap-3 transition-all duration-500 ${mode === 'classic' ? 'bg-white text-navy shadow-lg shadow-navy/5 scale-[1.02] ring-1 ring-black/5' : 'text-gray-400 hover:text-gray-600 hover:bg-white/40'}`}
                    >
                        <MapPin className={`w-5 h-5 ${mode === 'classic' ? 'text-coral' : ''}`} /> Guided Builder
                    </button>
                    <button
                        onClick={() => handleModeSwitch('ai_custom')}
                        className={`relative flex-1 py-4 px-6 rounded-[1.25rem] font-black text-lg flex items-center justify-center gap-3 transition-all duration-500 ${mode === 'ai_custom' ? 'bg-white text-navy shadow-lg shadow-navy/5 scale-[1.02] ring-1 ring-black/5' : 'text-gray-400 hover:text-gray-600 hover:bg-white/40'}`}
                    >
                        <Wand2 className={`w-5 h-5 ${mode === 'ai_custom' ? 'text-violet-500 animate-pulse' : ''}`} />
                        Create your own date
                    </button>
                </div>

                {error && (
                    <div className="p-4 mb-6 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100 italic">
                        {error}
                    </div>
                )}

                {/* --- AI MODE --- */}
                {mode === 'ai_custom' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        {aiConcepts.length === 0 ? (
                            <div className="bg-white rounded-[2.5rem] shadow-[0_8px_60px_rgba(0,0,0,0.05)] border border-gray-100 p-8 sm:p-12 mb-24 animate-in fade-in slide-in-from-bottom-6 duration-500">
                                <div className="space-y-10">
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-black text-violet-500 uppercase tracking-widest pl-1">Get Inspired</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {[
                                                { icon: "☕", text: "Cozy coffee crawl", prompt: "Plan a cozy evening starting with a specialty coffee crawl." },
                                                { icon: "🍕", text: "Local adventure", prompt: "High-energy date exploring local spots." },
                                                { icon: "🎷", text: "Luxury night", prompt: "A sophisticated night out with live music." },
                                                { icon: "🎮", text: "Fun & Games", prompt: "A playful date featuring a retro arcade." }
                                            ].map((starter, i) => (
                                                <button
                                                    key={i}
                                                    type="button"
                                                    onClick={() => setInitialPrompt(starter.prompt)}
                                                    className="group flex items-start gap-3 p-4 bg-violet-50/50 border border-violet-100 rounded-2xl text-left hover:bg-violet-600 hover:border-violet-600 transition-all duration-300"
                                                >
                                                    <span className="text-2xl group-hover:scale-110 transition-transform">{starter.icon}</span>
                                                    <span className="text-[13px] font-bold text-navy group-hover:text-white transition-colors">
                                                        {starter.text}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <form onSubmit={handleSuggestConcepts} className="space-y-8">
                                        <div className="space-y-4">
                                            <textarea
                                                placeholder="e.g. 'I want to take her to a museum to chill, and finish with some highly rated artisanal ice cream.'"
                                                value={initialPrompt}
                                                onChange={(e) => setInitialPrompt(e.target.value)}
                                                rows={4}
                                                className="w-full px-6 py-6 bg-gray-50 border-2 border-gray-100 rounded-[2rem] focus:outline-none focus:border-violet-500 transition-all text-[15px] font-medium resize-none shadow-inner"
                                                required
                                            />
                                            <div className="relative">
                                                <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                                <input 
                                                    type="text" 
                                                    placeholder="Budget (optional, e.g. $200)"
                                                    value={aiBudget}
                                                    onChange={(e) => setAiBudget(e.target.value)}
                                                    className="w-full pl-12 pr-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:outline-none focus:border-violet-500 text-[14px] font-bold text-navy"
                                                />
                                            </div>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={isSuggesting || !initialPrompt.trim()}
                                            className="w-full bg-navy text-white hover:bg-navy/90 py-4 rounded-xl text-[16px] font-bold flex items-center justify-center gap-3 disabled:opacity-50 transition-all shadow-sm"
                                        >
                                            {isSuggesting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Wand2 className="w-5 h-5" /> Pitch me some ideas</>}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6 pb-20 animate-in slide-in-from-bottom-4 duration-500">
                                <div className="bg-white rounded-3xl p-6 border border-gray-100 flex justify-between items-center shadow-sm">
                                    <div className="flex flex-col">
                                        <p className="text-navy font-medium italic text-[14px]">"{initialPrompt}"</p>
                                        {aiBudget && <span className="text-[11px] font-black text-coral uppercase tracking-widest mt-1">Budget: {aiBudget}</span>}
                                    </div>
                                    <button onClick={() => { setAiConcepts([]); setConversationHistory([]); setRefinementCount(0); setAiBudget(''); }} className="text-[13px] font-bold text-violet-600 hover:text-violet-700 bg-violet-50 px-4 py-2 rounded-xl shrink-0">Start Over</button>
                                </div>

                                <div className="flex items-center justify-between px-2">
                                    <h3 className="text-sm font-black text-navy uppercase tracking-wider">Select a Concept</h3>
                                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${refinementCount >= 2 ? 'bg-red-100 text-red-600' : 'bg-violet-100 text-violet-600'}`}>
                                        Refinements: {refinementCount}/2
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {aiConcepts.map((concept, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => setSelectedConceptIndex(idx)}
                                            className={`p-6 rounded-2xl border cursor-pointer transition-all ${selectedConceptIndex === idx ? 'border-violet-500 bg-violet-50 shadow-md scale-[1.01]' : 'border-gray-200 bg-white hover:border-violet-300'}`}
                                        >
                                            <h3 className="text-[18px] font-bold text-navy mb-2">{concept.title}</h3>
                                            <p className="text-[15px] text-gray-600">{concept.description}</p>
                                        </div>
                                    ))}
                                </div>

                                {refinementCount < 2 ? (
                                    <div className="bg-violet-50/50 border border-violet-100 rounded-[2rem] p-6 space-y-4">
                                        <textarea
                                            placeholder="Want to change something? (e.g. 'Make it more adventurous' or 'Add a dinner spot')"
                                            value={refinePrompt}
                                            onChange={(e) => setRefinePrompt(e.target.value)}
                                            rows={2}
                                            className="w-full px-5 py-4 bg-white border-2 border-violet-100 rounded-2xl focus:outline-none focus:border-violet-500 text-[14px] font-medium resize-none"
                                        />
                                        <button
                                            onClick={(e) => handleSuggestConcepts(e, true)}
                                            disabled={isSuggesting || !refinePrompt.trim()}
                                            className="w-full bg-violet-600 text-white hover:bg-violet-700 py-3 rounded-xl text-[14px] font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                        >
                                            {isSuggesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4" /> Refine these ideas</>}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl text-center">
                                        <p className="text-[13px] font-bold text-gray-500 italic">Maximum refinements reached. Select an idea below to continue.</p>
                                    </div>
                                )}

                                <button
                                    onClick={handleGenerateCustom}
                                    disabled={selectedConceptIndex === null || isGenerating}
                                    className="w-full bg-navy text-white hover:bg-navy/90 py-4 rounded-xl font-bold flex items-center justify-center gap-3 disabled:opacity-50 transition-all shadow-lg"
                                >
                                    {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <><MapPin className="w-5 h-5" /> Generate Itinerary</>}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* --- CLASSIC MODE --- */}
                {mode === 'classic' && (
                    <div className="bg-white rounded-[2.5rem] shadow-[0_8px_60px_rgba(0,0,0,0.05)] border border-gray-100 p-8 sm:p-12 mb-20 animate-in fade-in zoom-in-95 duration-500 relative">
                        <form onSubmit={handleSubmitClassic} className="space-y-10">
                            {/* SECTION: WHERE & WHEN */}
                            <div className="space-y-6">
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
                                        className="w-full pl-14 pr-32 py-5 bg-white border-2 border-gray-100 rounded-2xl focus:outline-none focus:border-coral/50 text-[15px] font-bold text-navy shadow-sm transition-all"
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
                                        className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-2 bg-coral/10 hover:bg-coral/20 text-coral rounded-xl text-[11px] font-black uppercase tracking-tighter flex items-center gap-1.5 transition-all"
                                    >
                                        {locationLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Locate className="w-3 h-3" />}
                                        {formData.usePreciseLocation ? 'Using GPS' : 'Precise Loc'}
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
                                            className="w-full px-5 py-4 bg-white border-2 border-gray-100 rounded-2xl focus:outline-none focus:border-coral/50 text-[14px] font-bold text-navy shadow-sm"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[12px] font-black text-gray-400 uppercase tracking-widest px-1">Start Time</label>
                                        <input
                                            type="time"
                                            required
                                            value={formData.time}
                                            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                            className="w-full px-5 py-4 bg-white border-2 border-gray-100 rounded-2xl focus:outline-none focus:border-coral/50 text-[14px] font-bold text-navy shadow-sm"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[12px] font-black text-gray-400 uppercase tracking-widest px-1">Ends by</label>
                                        <input
                                            type="time"
                                            required
                                            value={formData.endTime}
                                            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                            className="w-full px-5 py-4 bg-white border-2 border-gray-100 rounded-2xl focus:outline-none focus:border-coral/50 text-[14px] font-bold text-navy shadow-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* SECTION: VIBE & INTERESTS */}
                            <div className="space-y-8 pt-4 border-t border-gray-100">
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
                                            <option value="chill">Chill & Cozy 🛋️</option>
                                            <option value="romantic">Romantic & Intimate ❤️</option>
                                            <option value="active">Active & Adventurous 🍦</option>
                                            <option value="fancy">Fancy & Upscale ✨</option>
                                            <option value="hidden">Hidden Gems & Unique 💎</option>
                                        </select>
                                        <Sliders className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 w-5 h-5" />
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex justify-between items-center px-1">
                                        <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Budget Range</h4>
                                        <span className="text-sm font-black text-coral">{formData.budget || '$0'}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1000"
                                        step="50"
                                        value={parseInt(formData.budget?.replace('$', '') || 0)}
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
                                            <option value="Any">Everything / Mix 🎭</option>
                                            <option value="Food & Drink">Food & Cocktails 🍹</option>
                                            <option value="Entertainment & Culture">Shows & Culture 🏛️</option>
                                            <option value="Outdoor Activities">Parks & Outdoor 🌳</option>
                                            <option value="Fun & Adventure">Games & Trivia 🕹️</option>
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
                                    className="sm:col-span-2 w-full bg-navy text-white hover:bg-navy/90 py-5 rounded-2xl text-[17px] font-black flex items-center justify-center gap-3 disabled:opacity-50 transition-all shadow-lg active:scale-95 group"
                                >
                                    {isGenerating ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Sparkles className="w-6 h-6 group-hover:animate-pulse" /> Generate Itineraries</>}
                                </button>
                                
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFormData(prev => ({ ...prev, vibe: 'hidden', interests: 'Any' }));
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
            </main>

            {/* Premium Upgrade Modal */}
            {showPremiumModal && (
                <div className="fixed inset-0 bg-navy/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setShowPremiumModal(false)}
                            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                        >
                            ✕
                        </button>
                        <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-2xl flex items-center justify-center mb-6">
                            <Wand2 className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-2xl font-black text-navy mb-2">Unlock DateSpark Plus</h3>
                        <p className="text-gray-500 mb-6 font-medium">Get unlimited AI customizer, 7-day recycle bin and more.</p>
                        <button
                            onClick={() => {
                                setIsPremium(true);
                                setShowPremiumModal(false);
                                setMode('ai_custom');
                            }}
                            className="w-full bg-navy text-white text-lg font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"
                        >
                            Get Plus for $9.99 <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

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

            <BottomNav onProfileClick={() => navigate('/dashboard')} />
        </div>
    );
};

export default GeneratePlan;
