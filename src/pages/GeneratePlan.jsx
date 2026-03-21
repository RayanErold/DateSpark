import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Sparkles, MapPin, DollarSign, ArrowLeft, Loader2, Calendar, Wand2, CheckCircle2, Lock, Compass, Utensils, ChevronDown, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';

const GeneratePlan = () => {
    const navigate = useNavigate();
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSuggesting, setIsSuggesting] = useState(false);

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    // Core states
    const [mode, setMode] = useState('classic'); // 'classic' or 'ai_custom'
    const [isPremium, setIsPremium] = useState(() => localStorage.getItem('isPremium') === 'true'); // Bound to localStorage for testing
    const [showPremiumModal, setShowPremiumModal] = useState(false);
    const [showAiAddonModal, setShowAiAddonModal] = useState(false);
    const [showDietaryOptions, setShowDietaryOptions] = useState(false);
    const [showNeighborhoodDropdown, setShowNeighborhoodDropdown] = useState(false);
    const [error, setError] = useState(null);

    const nycNeighborhoods = [
        "West Village", "Soho", "Lower East Side", "Greenwich Village", "East Village", 
        "Chelsea", "Tribeca", "Gramercy", "Upper West Side", "Upper East Side",
        "Williamsburg", "Dumbo", "Greenpoint", "Astoria", "Long Island City",
        "Financial District", "Battery Park City", "Murray Hill", "Hell's Kitchen"
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
    const [customRadius, setCustomRadius] = useState(8046); // Default to 5 Miles

    // Classic Form states
    const [formData, setFormData] = useState({
        location: '', // Initially empty, will be auto-filled or typed by user
        date: today,
        vibe: 'chill',
        startTime: '18:00',
        endTime: '22:00',
        budget: '',
        interests: 'Any',
        activities: '',
        radius: 8046, // Default to 5 Miles
        dietary: [],
        neighborhoods: [], // Array of selected neighborhoods (max 3)
    });

    const [isLocating, setIsLocating] = useState(false);

    // Auto-detect user's city on mount
    React.useEffect(() => {
        if ('geolocation' in navigator) {
            setIsLocating(true);
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    try {
                        const { latitude, longitude } = position.coords;
                        // Use OpenStreetMap Nominatim for free reverse geocoding
                        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`);
                        const data = await response.json();

                        if (data && data.address) {
                            const city = data.address.city || data.address.town || data.address.village || data.address.county;
                            const state = data.address.state;
                            if (city && state) {
                                setFormData(prev => ({ ...prev, location: `${city}, ${state}` }));
                            } else if (city) {
                                setFormData(prev => ({ ...prev, location: city }));
                            }
                        }
                    } catch (err) {
                        console.error("Error reverse geocoding:", err);
                    } finally {
                        setIsLocating(false);
                    }
                },
                (err) => {
                    console.error("Geolocation error:", err);
                    setIsLocating(false);
                },
                { timeout: 10000 }
            );
        }
    }, []);

    const vibes = [
        { id: 'chill', label: 'Chill & Cozy' },
        { id: 'fancy', label: 'Fancy & Romantic' },
        { id: 'active', label: 'Active & Adventurous' },
        { id: 'hidden', label: 'Hidden Gems' },
    ];

    const interestCategories = [
        { id: 'Any', label: 'Surprise Me! (Any)' },
        { id: 'Food & Drink', label: 'Food & Drink (Coffee, Dining, Dessert)' },
        { id: 'Entertainment & Culture', label: 'Entertainment & Culture (Museums, Theater, Shows)' },
        { id: 'Outdoor Activities', label: 'Outdoor Activities (Parks, Gardens, Picnics)' },
        { id: 'Fun & Adventure', label: 'Fun & Adventure (Escape Rooms, Mini-Golf, Arcades)' },
    ];

    const handleBudgetChange = (e) => {
        let val = e.target.value;
        val = val.replace(/\D/g, '');
        if (val.length > 0) {
            setFormData({ ...formData, budget: '$' + val });
        } else {
            setFormData({ ...formData, budget: '' });
        }
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

    const handleGetCurrentLocation = () => {
        setIsLocating(true);
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setFormData({
                        ...formData,
                        location: "Current Location",
                        lat: latitude,
                        lng: longitude
                    });
                    setIsLocating(false);
                },
                (error) => {
                    console.error("Geolocation error:", error);
                    setIsLocating(false);
                    alert("Failed to get location. Please type your address manually.");
                }
            );
        } else {
            setIsLocating(false);
            alert("Geolocation is not supported by your browser.");
        }
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

        // Guard clause for free users
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
                    ideaCount,
                    userId: user?.id
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to generate suggestions.');
            }

            const data = await response.json();
            setAiConcepts(data.concepts || []);
            setAiQuestions(data.questions || []);

            // Append the AI's response to history to maintain context
            setConversationHistory([
                ...newHistory,
                { role: 'ai', text: `I pitched ${data.concepts?.length || 0} ideas. Added questions to refine.` }
            ]);

            if (isRefinement) {
                setRefinePrompt(''); // Clear refine input
            }
            setSelectedConceptIndex(null); // Reset selection
        } catch (err) {
            setError(err.message || 'Error communicating with AI. Please try again.');
        } finally {
            setIsSuggesting(false);
        }
    };

    const handleGenerateCustom = async (e) => {
        e.preventDefault();

        // Guard clause for free users
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
                    location: formData.location, // Pass location string
                    lat: formData.lat || null,  // Pass coordinates if GPS was used
                    lng: formData.lng || null
                })
            });

            if (!response.ok) throw new Error('Failed to build custom itinerary.');

            // Increment uses for free users
            if (!isPremium) {
                const newUses = aiCustomUses + 1;
                setAiCustomUses(newUses);
                localStorage.setItem('aiCustomUses', newUses.toString());
                localStorage.setItem('aiCustomLastUseTime', Date.now().toString()); // Set timestamp on use
            }

            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
            setIsGenerating(false);
        }
    };

    const handleSubmitClassic = async (e) => {
        e.preventDefault();
        setIsGenerating(true);
        setError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();

            const response = await fetch('/api/generate-date', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user?.id,
                    ideaCount, // Pass idea count
                    ...formData
                })
            });

            if (!response.ok) throw new Error('Failed to generate plan.');
            navigate('/dashboard');
        } catch (err) {
            setError(err.message || 'Something went wrong. Please try again.');
            setIsGenerating(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col relative overflow-hidden">
            {/* Ambient Background Elements */}
            <div className="absolute top-0 right-0 -z-10 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-coral/10 via-transparent to-transparent opacity-60" />
            <div className="absolute -bottom-64 -left-64 -z-10 w-96 h-96 bg-violet-400/20 rounded-full blur-[100px]" />
            <div className="absolute top-1/3 -right-24 -z-10 w-64 h-64 bg-gold/10 rounded-full blur-[80px]" />

            <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-30">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Link to="/dashboard" className="flex items-center gap-2 text-gray-500 hover:text-navy transition-colors font-medium">
                        <ArrowLeft className="w-5 h-5" /> Back
                    </Link>
                    <div className="flex items-center gap-2">
                        <img src="/datespark-logo.png" alt="DateSpark Logo" className="w-8 h-8 rounded-lg shadow-md object-cover bg-white" />
                        <span className="text-lg font-bold text-navy">DateSpark</span>
                    </div>
                    <div className="w-16" /> {/* Spacer */}
                </div>
            </header>

            <main className="flex-grow flex flex-col pt-12 px-4 sm:px-6 relative z-10 w-full max-w-2xl mx-auto">
                {/* Header Section */}
                <div className="text-center mb-10 relative">
                    <Sparkles className="absolute -top-4 -left-4 w-6 h-6 text-gold animate-pulse opacity-50 hidden sm:block" />
                    <Heart className="absolute bottom-2 -right-4 w-5 h-5 text-coral animate-bounce opacity-50 hidden sm:block" />
                    <h1 className="text-4xl md:text-5xl font-black text-navy mb-4 tracking-tight">Design your perfect date</h1>
                    <p className="text-gray-500 text-lg md:text-xl font-medium">Tell us what you're looking for, or let AI craft an exact experience.</p>
                </div>

                {/* Mode Switcher Tabs */}
                <div className="flex bg-gray-50/80 p-1.5 rounded-2xl mb-8 border border-gray-100 overflow-hidden">
                    <button
                        onClick={() => handleModeSwitch('classic')}
                        className={`flex-1 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${mode === 'classic' ? 'bg-white text-navy shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        <MapPin className="w-4 h-4" /> Guided Builder
                    </button>
                    <button
                        onClick={() => handleModeSwitch('ai_custom')}
                        className={`relative flex-1 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${mode === 'ai_custom' ? 'bg-white text-navy shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        <Wand2 className={`w-4 h-4 ${mode === 'ai_custom' ? 'text-violet-500 animate-pulse' : ''}`} />
                        Create your own date
                        {!isPremium && (
                            <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${mode === 'ai_custom' ? 'bg-violet-100 text-violet-600' : 'bg-gray-200 text-gray-500'}`}>
                                {Math.max(0, 2 - aiCustomUses)} left
                            </span>
                        )}
                    </button>
                </div>

                {error && (
                    <div className="p-4 mb-6 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100 animate-in fade-in">
                        {error}
                    </div>
                )}

                {/* --- AI MODE --- */}
                {mode === 'ai_custom' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        {aiConcepts.length === 0 ? (
                            <div className="bg-white rounded-3xl shadow-[0_2px_40px_rgba(0,0,0,0.04)] border border-gray-100 p-8 sm:p-10">
                                <form onSubmit={handleSuggestConcepts} className="space-y-6">
                                    <div className="space-y-4">
                                        <label className="flex items-center gap-2 text-[16px] font-bold text-navy">
                                            Describe your perfect date idea...
                                        </label>
                                        <textarea
                                            placeholder="e.g. 'I want to take her to Chipotle, then visit MoMA to chill, and finish with some highly rated artisanal ice cream in Midtown.'"
                                            value={initialPrompt}
                                            onChange={(e) => setInitialPrompt(e.target.value)}
                                            rows={5}
                                            className="w-full px-5 py-5 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all text-[15px] font-medium placeholder-gray-400 resize-none text-gray-700"
                                            required
                                        />
                                        <p className="text-[14px] text-gray-500 font-medium px-1">
                                            Be as specific as you want. Our AI will pitch you {ideaCount} distinct ideas based on this prompt.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                        <div className="space-y-3">
                                            <label className="flex items-center gap-2 text-[15px] font-bold text-navy">
                                                <Calendar className="text-violet-500 w-4 h-4" /> Pick a Date
                                            </label>
                                            <input
                                                type="date"
                                                required
                                                min={today}
                                                value={formData.date}
                                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                                className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors text-[14px] font-medium text-gray-700"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="flex items-center gap-2 text-[15px] font-bold text-navy">
                                                <Compass className="text-violet-500 w-4 h-4" /> Search Radius
                                            </label>
                                            <select
                                                value={customRadius}
                                                onChange={(e) => setCustomRadius(Number(e.target.value))}
                                                className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors text-[15px] font-medium appearance-none cursor-pointer text-gray-700"
                                            >
                                                <option value={1609}>1 Mile</option>
                                                <option value={4828}>3 Miles</option>
                                                <option value={8046}>5 Miles</option>
                                                <option value={16093}>10 Miles</option>
                                                <option value={24140}>Citywide (15+ Miles)</option>
                                            </select>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="flex items-center gap-2 text-[15px] font-bold text-navy">
                                                <Sparkles className="text-violet-500 w-4 h-4" /> How many ideas?
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="7"
                                                value={ideaCount}
                                                onChange={(e) => setIdeaCount(Number(e.target.value))}
                                                className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors text-[15px] font-medium text-gray-700"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4">
                                        <button
                                            type="submit"
                                            disabled={isSuggesting || !initialPrompt.trim()}
                                            className="w-full bg-navy text-white hover:bg-navy/90 py-4 rounded-xl text-[16px] font-bold flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                                        >
                                            {isSuggesting ? (
                                                <><Loader2 className="w-5 h-5 animate-spin" /> {conversationHistory.length > 0 ? 'Refining...' : 'Analyzing request...'}</>
                                            ) : (
                                                <><Wand2 className="w-5 h-5" /> Pitch me some ideas</>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        ) : (
                            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-20">
                                <div className="bg-white rounded-3xl p-6 shadow-[0_2px_20px_rgba(0,0,0,0.02)] border border-gray-100 flex justify-between items-center">
                                    <div>
                                        <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-1">Your Prompt</h3>
                                        <p className="text-navy font-medium italic text-[15px]">"{initialPrompt}"</p>
                                    </div>
                                    <button onClick={() => { setAiConcepts([]); setConversationHistory([]); }} className="text-[13px] font-bold text-violet-600 hover:text-violet-700 bg-violet-50 px-4 py-2 rounded-xl transition-colors">Start Over</button>
                                </div>

                                {/* AI CONCIERGE CHAT UI */}
                                {aiQuestions.length > 0 && (
                                    <div className="bg-violet-50/50 border border-violet-100 rounded-3xl p-6 mt-6">
                                        <div className="flex items-start gap-4 mb-4">
                                            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border border-violet-200/50">
                                                <Wand2 className="w-5 h-5 text-white" />
                                            </div>
                                            <div className="space-y-2">
                                                {aiQuestions.map((q, i) => (
                                                    <div key={i} className="bg-white px-5 py-3.5 rounded-2xl rounded-tl-sm shadow-sm border border-violet-100 text-navy font-medium text-[15px] inline-block max-w-[85%]">
                                                        {q}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={refinePrompt}
                                                onChange={(e) => setRefinePrompt(e.target.value)}
                                                placeholder="Reply to refine these ideas..."
                                                className="flex-1 px-5 py-3.5 bg-white rounded-2xl border border-violet-200 focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400 text-[15px] font-medium text-gray-700 transition-colors"
                                                onKeyDown={(e) => e.key === 'Enter' && handleSuggestConcepts(e, true)}
                                            />
                                            <button
                                                onClick={(e) => handleSuggestConcepts(e, true)}
                                                disabled={!refinePrompt.trim() || isSuggesting}
                                                className="bg-violet-600 text-white px-6 py-3.5 rounded-2xl font-bold hover:bg-violet-700 transition-colors disabled:opacity-50 text-[15px]"
                                            >
                                                {isSuggesting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refine"}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <h2 className="text-xl font-bold text-navy px-2 pt-8">Select an Idea</h2>
                                <p className="text-[15px] text-gray-500 px-2 pb-2">Pick your favorite blueprint to generate the final timeline.</p>

                                <div className="space-y-4">
                                    {aiConcepts.map((concept, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => setSelectedConceptIndex(idx)}
                                            className={`p-6 rounded-2xl border cursor-pointer transition-all ${selectedConceptIndex === idx
                                                ? 'border-violet-500 bg-violet-50/30 shadow-[0_2px_15px_rgba(139,92,246,0.08)] scale-[1.01]'
                                                : 'border-gray-200 bg-white hover:border-violet-300 hover:bg-violet-50/10'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <h3 className="text-[18px] font-bold text-navy pr-4">{concept.title}</h3>
                                                {selectedConceptIndex === idx ? (
                                                    <CheckCircle2 className="w-5 h-5 text-violet-600 flex-shrink-0" />
                                                ) : (
                                                    <div className="w-5 h-5 rounded-full border-2 border-gray-200 flex-shrink-0" />
                                                )}
                                            </div>
                                            <p className="text-[15px] text-gray-600 mb-4">{concept.description}</p>
                                            <div className="flex gap-2">
                                                <span className="px-3 py-1 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold text-gray-500">
                                                    {concept.vibeCategory}
                                                </span>
                                                <span className="px-3 py-1 bg-green-50/80 text-green-700 border border-green-100 rounded-lg text-xs font-bold">
                                                    {concept.budgetStr}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-4">
                                    <button
                                        onClick={handleGenerateCustom}
                                        disabled={selectedConceptIndex === null || isGenerating}
                                        className="w-full bg-navy text-white hover:bg-navy/90 py-4 rounded-xl text-[16px] font-bold flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                                    >
                                        {isGenerating ? (
                                            <><Loader2 className="w-5 h-5 animate-spin" /> Building Map Timeline...</>
                                        ) : (
                                            <><MapPin className="w-5 h-5" /> Generate Itinerary</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )
                        }
                    </div >
                )}

                {/* --- CLASSIC MODE --- */}
                {
                    mode === 'classic' && (
                        <div className="bg-white rounded-3xl shadow-[0_4px_40px_rgba(0,0,0,0.04)] border border-gray-100 p-8 sm:p-10 mb-20 animate-in fade-in zoom-in-95 duration-500 relative">
                            <form onSubmit={handleSubmitClassic} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                        <label className="flex items-center gap-2 text-[15px] font-bold text-navy">
                                            <MapPin className="text-coral w-4 h-4" /> City or Neighborhood
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                required
                                                placeholder="e.g. New York City, NY"
                                                value={formData.location}
                                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                                className="w-full px-5 py-3.5 pl-12 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:border-coral focus:ring-1 focus:ring-coral text-[15px] font-medium text-gray-700 transition-colors"
                                            />
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer hover:text-coral transition-colors" onClick={handleGetCurrentLocation} title="Use My Current Location">
                                                {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="flex items-center gap-2 text-[15px] font-bold text-navy">
                                            <Compass className="text-coral w-4 h-4" /> Search Radius
                                        </label>
                                        <select
                                            value={formData.radius}
                                            onChange={(e) => setFormData({ ...formData, radius: Number(e.target.value) })}
                                            className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:border-coral focus:ring-1 focus:ring-coral transition-colors text-[15px] font-medium appearance-none cursor-pointer text-gray-700"
                                        >
                                            <option value={1609}>1 Mile</option>
                                            <option value={4828}>3 Miles</option>
                                            <option value={8046}>5 Miles</option>
                                            <option value={16093}>10 Miles</option>
                                            <option value={24140}>Citywide (15+ Miles)</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Neighborhood Input Multi-Select */}
                                <div className="space-y-3">
                                    <label className="flex items-center gap-2 text-[15px] font-bold text-navy">
                                        <Compass className="text-coral w-4 h-4" /> Specific Neighborhoods (Max 3)
                                    </label>
                                    <div className="relative">
                                        <div
                                             onClick={() => setShowNeighborhoodDropdown(!showNeighborhoodDropdown)}
                                             className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl flex items-center justify-between text-[15px] font-medium text-gray-700 transition-colors hover:border-coral cursor-pointer"
                                         >
                                             <div className="flex flex-wrap gap-1.5">
                                                 {(formData.neighborhoods || []).length === 0 ? (
                                                     <span className="text-gray-400">Select Up to 3 Neighborhoods (Leave blank for random)</span>
                                                 ) : (
                                                     (formData.neighborhoods || []).map(nb => (
                                                         <span key={nb} className="bg-coral/10 text-coral text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                                                             {nb}
                                                             <div className="hover:text-navy cursor-pointer ml-1" onClick={(e) => { e.stopPropagation(); setFormData({ ...formData, neighborhoods: (formData.neighborhoods || []).filter(n => n !== nb) }); }}>
                                                                 ×
                                                             </div>
                                                         </span>
                                                     ))
                                                 )}
                                             </div>
                                             <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showNeighborhoodDropdown ? 'rotate-180' : ''}`} />
                                         </div>

                                        {showNeighborhoodDropdown && (
                                            <div className="absolute z-20 top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl max-h-60 overflow-y-auto p-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                                <div className="grid grid-cols-2 gap-1">                                                     {nycNeighborhoods.map(nb => {
                                                         const currentNb = formData.neighborhoods || [];
                                                         const isChecked = currentNb.includes(nb);
                                                         const isDisabled = !isChecked && currentNb.length >= 3;
                                                         return (
                                                             <button
                                                                 type="button"
                                                                 key={nb}
                                                                 disabled={isDisabled}
                                                                 onClick={() => {
                                                                     if (isChecked) {
                                                                         setFormData({ ...formData, neighborhoods: currentNb.filter(n => n !== nb) });
                                                                     } else if (currentNb.length < 3) {
                                                                         setFormData({ ...formData, neighborhoods: [...currentNb, nb] });
                                                                     }
                                                                 }}
                                                                 className={`flex items-center gap-2 p-2.5 rounded-xl text-[13px] font-medium transition-colors text-left ${isChecked ? 'bg-coral/5 text-coral' : 'hover:bg-gray-50 text-gray-700'} ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                                                             >
                                                                 <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${isChecked ? 'bg-coral border-coral text-white' : 'border-gray-300'}`}>
                                                                     {isChecked && <Check className="w-2.5 h-2.5" />}
                                                                 </div>
                                                                 {nb}
                                                             </button>
                                                         );
                                                     })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="flex items-center gap-2 text-[15px] font-bold text-navy">
                                        <Heart className="text-coral w-4 h-4" /> What's the vibe?
                                    </label>
                                    <select
                                        value={formData.vibe}
                                        onChange={(e) => setFormData({ ...formData, vibe: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:border-coral focus:ring-1 focus:ring-coral transition-colors text-[15px] font-medium appearance-none cursor-pointer text-gray-700"
                                    >
                                        {vibes.map((v) => (
                                            <option key={v.id} value={v.id}>
                                                {v.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Dietary Restrictions Dropdown */}
                                <div className="space-y-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowDietaryOptions(!showDietaryOptions)}
                                        className="flex items-center justify-between w-full px-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-all duration-200 cursor-pointer group"
                                    >
                                        <div className="flex items-center gap-2 text-[15px] font-bold text-navy">
                                            <Utensils className="text-coral w-4 h-4 group-hover:scale-110 transition-transform" />
                                            Dietary Preferences
                                            <span className="text-gray-400 font-medium text-xs">(Optional)</span>
                                            {formData.dietary?.length > 0 && (
                                                <span className="bg-coral/10 text-coral text-[10px] px-1.5 py-0.5 rounded-full font-black">
                                                    {formData.dietary.length}
                                                </span>
                                            )}
                                        </div>
                                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showDietaryOptions ? 'rotate-180' : ''}`} />
                                    </button>

                                    {showDietaryOptions && (
                                        <div className="flex flex-wrap gap-2 p-4 bg-white border border-gray-100 rounded-xl shadow-inner animate-fade-in">
                                            {['Vegan', 'Vegetarian', 'Gluten-Free', 'Halal', 'Kosher', 'Nut Allergy', 'Dairy-Free'].map((diet) => {
                                                const isSelected = formData.dietary?.includes(diet);
                                                return (
                                                    <button
                                                        type="button"
                                                        key={diet}
                                                        onClick={() => toggleDietary(diet)}
                                                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${isSelected
                                                            ? 'bg-coral text-white border-coral shadow-sm shadow-coral/20'
                                                            : 'bg-gray-50 text-gray-600 border-gray-100 hover:bg-gray-100'
                                                            }`}
                                                    >
                                                        {diet}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-3">
                                        <label className="flex items-center gap-2 text-[15px] font-bold text-navy">
                                            <Calendar className="text-coral w-4 h-4" /> Date
                                        </label>
                                        <input
                                            type="date"
                                            required
                                            min={today}
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                            className="w-full px-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:border-coral focus:ring-1 focus:ring-coral transition-colors text-[14px] font-medium text-gray-700"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="flex items-center gap-2 text-[15px] font-bold text-navy">
                                            Start Time
                                        </label>
                                        <input
                                            type="time"
                                            required
                                            value={formData.startTime}
                                            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                            className="w-full px-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:border-coral focus:ring-1 focus:ring-coral transition-colors text-[14px] font-medium text-gray-700"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="flex items-center gap-2 text-[15px] font-bold text-navy">
                                            End Time
                                        </label>
                                        <input
                                            type="time"
                                            required
                                            value={formData.endTime}
                                            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                            className="w-full px-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:border-coral focus:ring-1 focus:ring-coral transition-colors text-[14px] font-medium text-gray-700"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-3">
                                        <label className="flex items-center gap-2 text-[15px] font-bold text-navy">
                                            <DollarSign className="text-coral w-4 h-4" /> Target Budget
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. $100"
                                            value={formData.budget}
                                            onChange={handleBudgetChange}
                                            className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:border-coral focus:ring-1 focus:ring-coral transition-colors text-[15px] font-medium placeholder-gray-400 text-gray-700"
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <label className="flex items-center gap-2 text-[15px] font-bold text-navy">
                                            <Sparkles className="text-coral w-4 h-4" /> Interest-Based Filtering
                                        </label>
                                        <select
                                            value={formData.interests}
                                            onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                                            className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:border-coral focus:ring-1 focus:ring-coral transition-colors text-[15px] font-medium appearance-none cursor-pointer text-gray-700"
                                        >
                                            {interestCategories.map((category) => (
                                                <option key={category.id} value={category.id}>
                                                    {category.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="flex items-center gap-2 text-[15px] font-bold text-navy">
                                            <Sparkles className="text-coral w-4 h-4" /> How many ideas?
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="7"
                                            value={ideaCount}
                                            onChange={(e) => setIdeaCount(Number(e.target.value))}
                                            className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:border-coral focus:ring-1 focus:ring-coral transition-colors text-[15px] font-medium text-gray-700"
                                        />
                                    </div>
                                </div>

                                <div className="pt-6">
                                    <button
                                        type="submit"
                                        disabled={isGenerating || !formData.location}
                                        className="w-full bg-navy text-white hover:bg-navy/90 py-4 rounded-xl text-[16px] font-bold flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                                    >
                                        {isGenerating ? (
                                            <><Loader2 className="w-5 h-5 animate-spin" /> Curating your perfect date...</>
                                        ) : (
                                            <><Sparkles className="w-5 h-5" /> Generate Itinerary</>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )
                }
            </main >

            {/* Premium Upgrade Modal */}
            {
                showPremiumModal && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-200">
                            <button
                                onClick={() => setShowPremiumModal(false)}
                                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                ✕
                            </button>

                            <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-violet-200">
                                <Wand2 className="w-8 h-8 text-white" />
                            </div>

                            <h3 className="text-2xl font-black text-navy mb-2">Create your own date</h3>
                            <p className="text-gray-500 mb-6 leading-relaxed">
                                Take complete control over your itinerary. Describe exactly what you want, and our AI will build custom options using live data across New York City.
                            </p>

                            <div className="space-y-3 mb-8">
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-violet-500 flex-shrink-0" />
                                    <span className="font-medium text-gray-700">Type any custom prompt</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-violet-500 flex-shrink-0" />
                                    <span className="font-medium text-gray-700">Receive 3 distinct blueprints</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-violet-500 flex-shrink-0" />
                                    <span className="font-medium text-gray-700">Highly customized locations</span>
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    setIsPremium(true); // Mock unlocking it
                                    setShowPremiumModal(false);
                                    setMode('ai_custom');
                                }}
                                className="w-full bg-navy text-white text-lg font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"
                            >
                                Upgrade for $4.99 <ArrowLeft className="w-5 h-5 rotate-180" />
                            </button>
                            <p className="text-center text-xs text-gray-400 font-bold uppercase mt-4">
                                *Mock click: will instantly unlock feature for testing
                            </p>
                        </div>
                    </div>
                )
            }

            {/* $2.99 AI Customizer Add-On Modal */}
            {
                showAiAddonModal && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-200 border border-gray-100">
                            <button
                                onClick={() => setShowAiAddonModal(false)}
                                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                ✕
                            </button>

                            <div className="w-16 h-16 bg-gradient-to-br from-coral to-pink-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-coral/20">
                                <Sparkles className="w-8 h-8 text-white" />
                            </div>

                            <h3 className="text-2xl font-black text-navy mb-2">Unlock Unlimited AI</h3>
                            <p className="text-gray-500 mb-6 leading-relaxed font-medium">
                                You've used all 3 free AI generations. For just $2.99, get unlimited access to the AI date customizer forever.
                            </p>

                            <div className="space-y-4 mb-8 bg-gray-50 rounded-2xl p-4 border border-gray-100">
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-coral flex-shrink-0" />
                                    <span className="font-bold text-navy">Unlimited custom prompts</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-coral flex-shrink-0" />
                                    <span className="font-bold text-navy">Refine ideas endlessly</span>
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    alert("Redirecting to Stripe for $2.99 AI Add-On...");
                                    setIsPremium(true); // Mock unlocking it
                                    setShowAiAddonModal(false);
                                    setMode('ai_custom');
                                }}
                                className="w-full bg-gradient-to-r from-coral to-pink-500 text-white text-lg font-black py-4 rounded-xl flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-coral/30 hover:-translate-y-0.5 transition-all active:translate-y-0"
                            >
                                Unlock for $2.99 <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default GeneratePlan;
