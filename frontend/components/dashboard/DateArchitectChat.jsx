import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowRight,
    Bot,
    CalendarHeart,
    CheckCircle2,
    ChevronDown,
    Compass,
    DollarSign,
    Edit2,
    Heart,
    HeartHandshake,
    Locate,
    Loader2,
    MapPin,
    MessageCircle,
    Mic,
    Moon,
    Send,
    Sparkles,
    Umbrella,
    User,
    Wallet,
    Maximize2,
    Minimize2,
    Calendar,
    Clock,
    Plus,
    X,
    XCircle
} from 'lucide-react';

const DATE_GOALS = [
    {
        id: 'first_date',
        label: 'First date',
        helper: 'Low pressure, easy conversation',
        icon: HeartHandshake,
        prompt: 'It is a first date. Keep it low-pressure, conversation-friendly, not too expensive, and easy to leave gracefully if needed.',
    },
    {
        id: 'romantic',
        label: 'Romantic night',
        helper: 'Intimate, thoughtful, memorable',
        icon: CalendarHeart,
        prompt: 'Plan a romantic date night with intimate lighting, a thoughtful dinner or drinks stop, and a memorable final moment.',
    },
    {
        id: 'budget',
        label: 'Smart budget',
        helper: 'Great date, controlled spend',
        icon: Wallet,
        prompt: 'Plan a great date that feels intentional but keeps the spend controlled. Use free or affordable anchors and one worthwhile paid stop.',
    },
    {
        id: 'rainy',
        label: 'Weather-safe',
        helper: 'Indoor backup built in',
        icon: Umbrella,
        prompt: 'Plan a weather-safe date with cozy indoor options, short travel between stops, and a backup if one place is too busy.',
    },
];

const STARTER_PROMPTS = [
    {
        label: 'Quick plan',
        prompt: 'I need a quick, no-fuss plan for tonight. Casual food and drinks.',
    },
    {
        label: 'Nearby plan',
        prompt: 'Use my current location and give me a nearby plan within walking distance.',
    },
    {
        label: 'Cozy conversation',
        prompt: 'We want a cozy night with quiet conversation, warm drinks, and a dessert ending.',
    },
    {
        label: 'Food crawl',
        prompt: 'Build a three-stop food crawl with appetizers, a main bite, and dessert, all close together.',
    },
    {
        label: 'Playful date',
        prompt: 'Make it playful and lightly competitive, with a fun activity and casual food after.',
    },
];

const radiusLabel = (radius) => `${(radius / 1609.34).toFixed(1)} mi`;

const DateArchitectChat = ({
    userId,
    location: initialLocation,
    budget: initialBudget,
    radius: initialRadius,
    initialPrompt,
    initialVibe,
    onConceptSelected,
    onSettingsChange,
    onPlanSaved,
}) => {
    const API_URL = import.meta.env.VITE_API_URL || '';
    
    const getProxiedPhoto = (photoUrl) => {
        if (!photoUrl) return null;
        if (photoUrl.includes('places.googleapis.com') || photoUrl.includes('maps.googleapis.com')) {
            return `${API_URL}/api/photo-proxy?url=${encodeURIComponent(photoUrl)}`;
        }
        return photoUrl;
    };

    // 1. CHAT & FLOW STATES
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamedText, setStreamedText] = useState('');
    const [extractedConcepts, setExtractedConcepts] = useState(null);
    const [isForceGenerating, setIsForceGenerating] = useState(false);
    const [selectedGoal, setSelectedGoal] = useState('first_date');

    // 1.1 PROPOSED PLAN STATE
    const [proposedPlan, setProposedPlan] = useState(null);
    const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

    // 2. NEW CUSTOMIZABLE OPTIONS
    const [location, setLocation] = useState(initialLocation || '');
    const [lat, setLat] = useState(null);
    const [lng, setLng] = useState(null);
    const [budget, setBudget] = useState(initialBudget || '$100');
    const [radius, setRadius] = useState(initialRadius || 8046); // Default 5 miles in meters
    const [numActivities, setNumActivities] = useState(3);
    const [planDate, setPlanDate] = useState(new Date().toISOString().split('T')[0]);
    const [planTime, setPlanTime] = useState('07:00 PM');

    // 3. UI STATE
    const [isExpanded, setIsExpanded] = useState(false);
    const [currentStep, setCurrentStep] = useState(initialLocation ? 2 : 1);
    const [showCustomPicker, setShowCustomPicker] = useState(false);
    const [showCustomLocation, setShowCustomLocation] = useState(false);
    const [customLocationText, setCustomLocationText] = useState('');
    const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0]);
    const [customTime, setCustomTime] = useState('19:00');
    const [locationLoading, setLocationLoading] = useState(false);

    const scrollRef = useRef(null);
    const inputRef = useRef(null);
    const recognitionRef = useRef(null);

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const [isListening, setIsListening] = useState(false);

    // Sync settings state upward
    const onSettingsChangeRef = useRef(onSettingsChange);
    useEffect(() => {
        onSettingsChangeRef.current = onSettingsChange;
    }, [onSettingsChange]);

    useEffect(() => {
        onSettingsChangeRef.current?.({
            location,
            budget,
            radius,
            lat,
            lng,
            numActivities,
            planDate,
            planTime
        });
    }, [location, budget, radius, lat, lng, numActivities, planDate, planTime]);

    // Initial greeting
    useEffect(() => {
        if (messages.length === 0) {
            const welcomeMsg = {
                role: 'assistant',
                content: initialPrompt 
                    ? `Sparking a plan for your date at ${initialPrompt.split('Date at ')[1] || 'this venue'}! I've noted the vibe is ${initialVibe || 'custom'}. What else should I know to make it perfect?`
                    : `Hi! I'm Sparky, your AI Date Architect. Let's customize your perfect date plan in 5 quick taps! \n\n📍 First, where is the starting point for your date?`,
            };
            setMessages([welcomeMsg]);
            
            if (initialPrompt) {
                setMessages(prev => [...prev, { role: 'user', content: initialPrompt }]);
                setCurrentStep(0); // Go directly to free chat
            }
        }
    }, [messages.length, initialPrompt, initialVibe]);

    const resetToInitialState = () => {
        setProposedPlan(null);
        setIsGeneratingPlan(false);
        setShowCustomLocation(false);
        setShowCustomPicker(false);
        setMessages([
            {
                role: 'assistant',
                content: initialPrompt 
                    ? `Sparking a plan for your date at ${initialPrompt.split('Date at ')[1] || 'this venue'}! I've noted the vibe is ${initialVibe || 'custom'}. What else should I know to make it perfect?`
                    : `Hi! I'm Sparky, your AI Date Architect. Let's customize your perfect date plan in 5 quick taps! \n\n📍 First, where is the starting point for your date?`,
            }
        ]);
        setCurrentStep(initialLocation ? 2 : 1);
        setInput('');
    };

    // Autoscroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, streamedText, extractedConcepts, currentStep, showCustomPicker, proposedPlan, isGeneratingPlan]);

    // Voice integration
    const toggleListening = () => {
        if (isListening) {
            if (recognitionRef.current) recognitionRef.current.stop();
            setIsListening(false);
            return;
        }

        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onresult = (event) => {
                let finalOnly = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    if (event.results[i].isFinal) {
                        finalOnly += event.results[i][0].transcript + ' ';
                    }
                }
                if (finalOnly) {
                    setInput(prev => prev + (prev.endsWith(' ') ? '' : ' ') + finalOnly.trim());
                }
            };

            recognition.onerror = (event) => {
                console.error("Speech recognition error", event.error);
                if (event.error === 'not-allowed') {
                    alert('Microphone access is blocked. Please ensure microphone permissions are granted in your browser settings to use voice input.');
                }
                setIsListening(false);
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current = recognition;
            recognition.start();
            setIsListening(true);
        } else {
            alert('Speech recognition is not supported in this browser. Please try Chrome or Safari.');
        }
    };

    // Geolocation lookup
    const handlePreciseLocation = () => {
        return new Promise((resolve, reject) => {
            setLocationLoading(true);
            if (!navigator.geolocation) {
                setLocationLoading(false);
                reject(new Error("No geolocation"));
                return;
            }
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    setLat(latitude);
                    setLng(longitude);
                    try {
                        const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`);
                        const data = await response.json();
                        if (data.results?.[0]) {
                            const addr = data.results[0].formatted_address;
                            setLocation(addr);
                            resolve({ lat: latitude, lng: longitude, location: addr });
                        } else {
                            resolve({ lat: latitude, lng: longitude, location: "Current Location" });
                        }
                    } catch (err) {
                        console.error('Geocoding error', err);
                        resolve({ lat: latitude, lng: longitude, location: "Current Location" });
                    } finally {
                        setLocationLoading(false);
                    }
                },
                (err) => {
                    setLocationLoading(false);
                    reject(err);
                }
            );
        });
    };

    // Advanced wizard flow handler
    // Spark AI proposed draft plan generator
    const generateProposedPlan = async (refinementPrompt = null, overrides = {}) => {
        setIsGeneratingPlan(true);
        setProposedPlan(null);
        
        const finalBudget = overrides.budget || budget;
        const finalGoal = overrides.goal || selectedGoal;
        
        try {
            const promptText = refinementPrompt 
                ? refinementPrompt 
                : `A custom ${numActivities}-step ${finalGoal || 'date'} experience in ${location || 'NYC'}, budget range ${finalBudget || 'moderate'}, with activities focused on a fun and cohesive couple experience.`;

            console.log('[DateArchitectChat] Generating draft plan with prompt:', promptText);

            const response = await fetch('/api/generate-date', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: promptText,
                    userId,
                    city: location || 'NYC',
                    lat,
                    lng,
                    budget: finalBudget,
                    numActivities,
                    radius,
                    planDate,
                    planTime,
                    type: 'classic',
                    draft: true
                })
            });

            const result = await response.json();
            if (result.success && result.plan) {
                setProposedPlan(result.plan);
                setMessages(prev => [
                    ...prev, 
                    { 
                        role: 'assistant', 
                        content: `Proposed plan successfully generated! ⚡ Check out the curated stops below. You can accept it to save to your dashboard, decline it to start over, or request changes using the chat below (e.g., "swap restaurant for a quiet park").` 
                    }
                ]);
            } else {
                setMessages(prev => [...prev, { role: 'assistant', content: 'Spark could not be ignited. Please try again. 🛑' }]);
            }
        } catch (err) {
            console.error('Failed to generate draft plan:', err);
            setMessages(prev => [...prev, { role: 'assistant', content: 'Failed to ignite the Spark. Please try again. 🛑' }]);
        } finally {
            setIsGeneratingPlan(false);
        }
    };

    const handleAcceptPlan = async () => {
        if (!proposedPlan) return;
        try {
            console.log('[DateArchitectChat] Saving draft plan for user:', userId, proposedPlan);
            const response = await fetch('/api/save-draft-plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    planData: proposedPlan
                })
            });
            const result = await response.json();
            if (response.ok && result.success && result.plan) {
                if (onPlanSaved) {
                    onPlanSaved(result.plan);
                } else if (onConceptSelected) {
                    onConceptSelected(result.plan, { isSavedPlan: true });
                }
                resetToInitialState();
            } else {
                const errorMsg = result.error || 'Server rejected the save request';
                console.error('[DateArchitectChat] Save draft failed:', errorMsg);
                alert(`Failed to save plan: ${errorMsg}`);
            }
        } catch (err) {
            console.error('Failed to save draft plan:', err);
            alert(`Failed to save plan due to a connection or system error: ${err.message}`);
        }
    };

    const handleDeclinePlan = () => {
        resetToInitialState();
    };

    // Advanced wizard flow handler
    const handleSelectOption = async (step, label, value) => {
        // 1. Add user message
        const userMsg = {
            role: 'user',
            content: label
        };

        // 2. Set the setting value
        let nextStep = step + 1;
        let assistantResponse = '';

        if (step === 1) {
            if (value === 'GPS') {
                setLocationLoading(true);
                try {
                    const res = await handlePreciseLocation();
                    setLocation(res.location);
                    userMsg.content = `📍 Near ${res.location.split(',')[0]}`;
                } catch(e) {
                    setLocation("NYC");
                    userMsg.content = `📍 Manhattan, NYC (Fallback)`;
                } finally {
                    setLocationLoading(false);
                }
            } else {
                setLocation(value);
            }
            assistantResponse = `Got the location! 🗺️ When are you looking to go?`;
        } 
        else if (step === 2) {
            if (value === 'CUSTOM') {
                setShowCustomPicker(true);
                return; // Wait for user to select inline
            }
            // Parse common values
            setPlanDate(value.date);
            setPlanTime(value.time);
            assistantResponse = `Awesome! ⚡ How many activities/stops would you like in this plan?`;
        }
        else if (step === 3) {
            setNumActivities(value);
            assistantResponse = `Perfect, a ${value}-step adventure! 🗺️ What search radius makes sense?`;
        }
        else if (step === 4) {
            setRadius(value);
            assistantResponse = `Understood. Finally, what's your target vibe and budget?`;
        }
        else if (step === 5) {
            setBudget(value.budget);
            setSelectedGoal(value.goal);
            nextStep = 0; // Complete
            assistantResponse = `Everything is set! Customizing your ${numActivities}-step plan in ${location.split(',')[0]} for ${planDate} at ${planTime}... Let's ignite the Spark! 🔥`;
        }

        const newMessages = [...messages, userMsg];
        if (assistantResponse) {
            newMessages.push({ role: 'assistant', content: assistantResponse });
        }
        setMessages(newMessages);
        setCurrentStep(nextStep);

        // Auto trigger proposed plan generation if we completed step 5
        if (nextStep === 0) {
            generateProposedPlan(null, {
                budget: value.budget,
                goal: value.goal
            });
        }
    };

    // Inline custom date picker confirm
    const handleConfirmCustomDateTime = () => {
        setShowCustomPicker(false);
        const formattedDate = customDate;
        // Format time 24h to 12h
        const [h, m] = customTime.split(':');
        const hr = parseInt(h);
        const ampm = hr >= 12 ? 'PM' : 'AM';
        const formattedTime = `${hr % 12 || 12}:${m} ${ampm}`;

        setPlanDate(formattedDate);
        setPlanTime(formattedTime);

        const userMsg = {
            role: 'user',
            content: `📅 ${formattedDate} at ${formattedTime}`
        };
        const assistantResponse = `Perfect! ⚡ How many activities/stops would you like in this plan?`;

        setMessages(prev => [...prev, userMsg, { role: 'assistant', content: assistantResponse }]);
        setCurrentStep(3);
    };

    // Inline custom location confirm
    const handleConfirmCustomLocation = () => {
        if (!customLocationText.trim()) return;
        const enteredLoc = customLocationText.trim();
        setShowCustomLocation(false);
        setCustomLocationText('');
        handleSelectOption(1, `📍 ${enteredLoc}`, enteredLoc);
    };

    // Generic prompt sender (Freeform chat input)
    const sendPrompt = async (overrideInput = null) => {
        const textToSend = typeof overrideInput === 'string' ? overrideInput : input;
        if (!textToSend.trim() || isStreaming || isGeneratingPlan) return;

        // If a proposed plan already exists, treat textToSend as a refinement prompt!
        if (proposedPlan) {
            const userMessage = {
                role: 'user',
                content: textToSend,
            };
            setMessages(prev => [...prev, userMessage]);
            setInput('');
            generateProposedPlan(textToSend);
            return;
        }

        // If in guided step mode, advance the wizard
        if (currentStep > 0) {
            // Treat typed input as step answer
            if (currentStep === 1) {
                setLocation(textToSend);
                const nextMessages = [
                    ...messages,
                    { role: 'user', content: textToSend },
                    { role: 'assistant', content: `Got the location! 🗺️ When are you looking to go?` }
                ];
                setMessages(nextMessages);
                setCurrentStep(2);
                setInput('');
                return;
            } else if (currentStep === 2) {
                setPlanDate(new Date().toISOString().split('T')[0]);
                setPlanTime(textToSend);
                const nextMessages = [
                    ...messages,
                    { role: 'user', content: textToSend },
                    { role: 'assistant', content: `Awesome! ⚡ How many activities/stops would you like in this plan?` }
                ];
                setMessages(nextMessages);
                setCurrentStep(3);
                setInput('');
                return;
            } else if (currentStep === 3) {
                const stops = parseInt(textToSend) || 3;
                setNumActivities(stops);
                const nextMessages = [
                    ...messages,
                    { role: 'user', content: textToSend },
                    { role: 'assistant', content: `Perfect, a ${stops}-step adventure! 🗺️ What search radius makes sense?` }
                ];
                setMessages(nextMessages);
                setCurrentStep(4);
                setInput('');
                return;
            } else if (currentStep === 4) {
                setRadius(4000); // Default
                const nextMessages = [
                    ...messages,
                    { role: 'user', content: textToSend },
                    { role: 'assistant', content: `Understood. Finally, what's your target vibe and budget?` }
                ];
                setMessages(nextMessages);
                setCurrentStep(5);
                setInput('');
                return;
            } else if (currentStep === 5) {
                setBudget("$100");
                setSelectedGoal("romantic");
                setCurrentStep(0);
                setInput('');
                const nextMessages = [
                    ...messages,
                    { role: 'user', content: textToSend }
                ];
                setMessages(nextMessages);
                generateProposedPlan(null, {
                    budget: "$100",
                    goal: "romantic"
                });
                return;
            }
        }

        // If currentStep === 0 and no proposedPlan, generate initial plan from prompt immediately!
        const userMessage = {
            role: 'user',
            content: textToSend,
        };
        const nextMessages = [...messages, userMessage];
        setMessages(nextMessages);
        setInput('');
        generateProposedPlan(textToSend);
    };

    // Skip the guiding questions and immediately compile using currently selected options
    const handleSkipAndGenerate = () => {
        setCurrentStep(0);
        const finalMsg = {
            role: 'assistant',
            content: `Skipping wizard questions! Generating a custom ${numActivities}-step plan matching your preferences immediately. ⚡`
        };
        const nextHist = [...messages, finalMsg];
        setMessages(nextHist);
        generateProposedPlan();
    };

    const renderStepChoices = () => {
        if (currentStep === 1) {
            return (
                <div className="space-y-2 mt-2">
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => handleSelectOption(1, '📍 Current Location', 'GPS')}
                            className="flex items-center gap-1 bg-coral/10 hover:bg-coral/20 text-coral px-3 py-1.5 rounded-full text-xs font-black transition-all border border-coral/20"
                        >
                            <Locate className="w-3 h-3" /> Current Location
                        </button>
                        {['Manhattan', 'Brooklyn', 'Queens', 'Jersey City', 'Hoboken'].map(city => (
                            <button
                                key={city}
                                onClick={() => handleSelectOption(1, `🗽 ${city}`, city)}
                                className="bg-navy/5 hover:bg-navy/10 text-navy px-3 py-1.5 rounded-full text-xs font-black transition-all border border-slate-100"
                            >
                                {city}
                            </button>
                        ))}
                        <button
                            onClick={() => setShowCustomLocation(!showCustomLocation)}
                            className="bg-navy/5 hover:bg-navy/10 text-navy px-3 py-1.5 rounded-full text-xs font-black transition-all border border-slate-100 flex items-center gap-1"
                        >
                            <MapPin className="w-3.5 h-3.5" /> Other...
                        </button>
                    </div>

                    <AnimatePresence>
                        {showCustomLocation && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-orange-50/50 rounded-2xl p-3 border border-orange-100 flex flex-col sm:flex-row items-center gap-2 mt-2"
                            >
                                <div className="flex items-center gap-1.5 w-full">
                                    <MapPin className="w-4 h-4 text-orange-500 flex-shrink-0" />
                                    <input
                                        type="text"
                                        placeholder="Enter any city or address..."
                                        value={customLocationText}
                                        onChange={(e) => setCustomLocationText(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleConfirmCustomLocation();
                                        }}
                                        className="bg-white border border-orange-200 text-navy text-xs rounded-xl px-2.5 py-1.5 outline-none w-full font-bold"
                                    />
                                </div>
                                <button
                                    onClick={handleConfirmCustomLocation}
                                    className="bg-navy hover:bg-orange-600 text-white font-black text-xs px-4 py-1.5 rounded-xl transition-all shadow-md flex-shrink-0"
                                >
                                    Confirm
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            );
        }

        if (currentStep === 2) {
            const today = new Date().toISOString().split('T')[0];
            const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
            const friday = new Date();
            friday.setDate(friday.getDate() + ((5 - friday.getDay() + 7) % 7));
            const fridayStr = friday.toISOString().split('T')[0];

            return (
                <div className="space-y-2 mt-2">
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => handleSelectOption(2, '📅 Tonight at 7:00 PM', { date: today, time: '07:00 PM' })}
                            className="bg-orange-50 hover:bg-orange-100/80 text-orange-700 px-3 py-1.5 rounded-full text-xs font-black transition-all"
                        >
                            Tonight (7 PM)
                        </button>
                        <button
                            onClick={() => handleSelectOption(2, '📅 Tomorrow at 6:00 PM', { date: tomorrow, time: '06:00 PM' })}
                            className="bg-orange-50 hover:bg-orange-100/80 text-orange-700 px-3 py-1.5 rounded-full text-xs font-black transition-all"
                        >
                            Tomorrow (6 PM)
                        </button>
                        <button
                            onClick={() => handleSelectOption(2, '📅 Friday Night at 8:00 PM', { date: fridayStr, time: '08:00 PM' })}
                            className="bg-orange-50 hover:bg-orange-100/80 text-orange-700 px-3 py-1.5 rounded-full text-xs font-black transition-all"
                        >
                            Friday Night (8 PM)
                        </button>
                        <button
                            onClick={() => setShowCustomPicker(true)}
                            className="bg-navy/5 hover:bg-navy/10 text-navy px-3 py-1.5 rounded-full text-xs font-black transition-all border border-slate-100 flex items-center gap-1"
                        >
                            <Calendar className="w-3.5 h-3.5" /> Pick Date/Time
                        </button>
                        <button
                            onClick={resetToInitialState}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-full text-xs font-black transition-all border border-slate-200 flex items-center gap-1"
                        >
                            ⬅ Back to Start
                        </button>
                    </div>

                    <AnimatePresence>
                        {showCustomPicker && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-orange-50/50 rounded-2xl p-3 border border-orange-100 flex flex-col sm:flex-row items-center gap-2 mt-2"
                            >
                                <div className="flex items-center gap-1.5 w-full">
                                    <Calendar className="w-4 h-4 text-orange-500 flex-shrink-0" />
                                    <input
                                        type="date"
                                        value={customDate}
                                        onChange={(e) => setCustomDate(e.target.value)}
                                        className="bg-white border border-orange-200 text-navy text-xs rounded-xl px-2.5 py-1.5 outline-none w-full font-bold"
                                    />
                                </div>
                                <div className="flex items-center gap-1.5 w-full">
                                    <Clock className="w-4 h-4 text-orange-500 flex-shrink-0" />
                                    <input
                                        type="time"
                                        value={customTime}
                                        onChange={(e) => setCustomTime(e.target.value)}
                                        className="bg-white border border-orange-200 text-navy text-xs rounded-xl px-2.5 py-1.5 outline-none w-full font-bold"
                                    />
                                </div>
                                <button
                                    onClick={handleConfirmCustomDateTime}
                                    className="bg-navy hover:bg-orange-600 text-white font-black text-xs px-4 py-1.5 rounded-xl transition-all shadow-md w-full sm:w-auto"
                                >
                                    Confirm
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            );
        }

        if (currentStep === 3) {
            return (
                <div className="flex flex-wrap gap-2 mt-2">
                    {[
                        { label: '⚡ 2 stops (Sweet & Simple)', count: 2 },
                        { label: '⚡ 3 stops (Classic Date)', count: 3 },
                        { label: '⚡ 4 stops (Fun Crawl)', count: 4 },
                        { label: '⚡ 5 stops (Epic Outing)', count: 5 }
                    ].map(opt => (
                        <button
                            key={opt.count}
                            onClick={() => handleSelectOption(3, opt.label, opt.count)}
                            className="bg-navy/5 hover:bg-navy/10 text-navy px-3 py-1.5 rounded-full text-xs font-black transition-all border border-slate-100"
                        >
                            {opt.count} Activities
                        </button>
                    ))}
                    <button
                        onClick={resetToInitialState}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-full text-xs font-black transition-all border border-slate-200 flex items-center gap-1"
                    >
                        ⬅ Back to Start
                    </button>
                </div>
            );
        }

        if (currentStep === 4) {
            return (
                <div className="flex flex-wrap gap-2 mt-2">
                    {[
                        { label: '🚶 Walking Distance (0.5 mi)', val: 805 },
                        { label: '🚗 Quick Uber Ride (2 mi)', val: 3218 },
                        { label: '🗺️ Standard City Range (5 mi)', val: 8046 },
                        { label: '🌐 Anywhere (10 mi)', val: 16093 }
                    ].map(opt => (
                        <button
                            key={opt.val}
                            onClick={() => handleSelectOption(4, opt.label, opt.val)}
                            className="bg-navy/5 hover:bg-navy/10 text-navy px-3 py-1.5 rounded-full text-xs font-black transition-all border border-slate-100"
                        >
                            {opt.label.split(' (')[1].replace(')', '')}
                        </button>
                    ))}
                    <button
                        onClick={resetToInitialState}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-full text-xs font-black transition-all border border-slate-200 flex items-center gap-1"
                    >
                        ⬅ Back to Start
                    </button>
                </div>
            );
        }

        if (currentStep === 5) {
            return (
                <div className="flex flex-wrap gap-2 mt-2">
                    {[
                        { label: '💸 Chill & Free ($0)', budget: '$0', goal: 'budget' },
                        { label: '🍻 Cozy & Casual ($50)', budget: '$50', goal: 'first_date' },
                        { label: '💖 Romantic & Intimate ($150)', budget: '$150', goal: 'romantic' },
                        { label: '✨ Premium Celebration ($300+)', budget: '$300', goal: 'romantic' }
                    ].map(opt => (
                        <button
                            key={opt.label}
                            onClick={() => handleSelectOption(5, opt.label, opt)}
                            className="bg-orange-50 hover:bg-orange-100/80 text-orange-700 px-3 py-1.5 rounded-full text-xs font-black transition-all"
                        >
                            {opt.label}
                        </button>
                    ))}
                    <button
                        onClick={resetToInitialState}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-full text-xs font-black transition-all border border-slate-200 flex items-center gap-1 font-bold"
                    >
                        ⬅ Back to Start
                    </button>
                </div>
            );
        }

        return null;
    };

    const renderMessageContent = (content, isLast, role) => {
        let text = content.split('READY')[0];
        let options = [];
        const optionsMatch = text.match(/\[OPTIONS:\s*([\s\S]*?)\]/i);
        if (optionsMatch) {
            options = optionsMatch[1].split('|').map(option => option.trim().replace(/\n/g, ' ')).filter(Boolean);
            text = text.replace(optionsMatch[0], '');
        }

        return (
            <div className="space-y-3">
                <div className="whitespace-pre-wrap leading-relaxed">{text.trim()}</div>
                {options.length > 0 && isLast && role === 'assistant' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                        {options.map((option) => (
                            <button
                                key={option}
                                type="button"
                                onClick={() => sendPrompt(option)}
                                disabled={isStreaming}
                                className="rounded-2xl border border-orange-100 bg-orange-50/80 px-3 py-2.5 text-left text-[12px] font-black text-orange-700 transition hover:border-orange-300 hover:bg-white disabled:opacity-50"
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    // Chat main wrapper styles depending on expand state
    const containerClasses = isExpanded
        ? "fixed inset-0 z-[999] flex flex-col bg-white w-screen h-screen md:rounded-3xl md:shadow-2xl md:max-w-4xl md:h-[85vh] md:m-auto transition-all duration-300 ease-out"
        : "overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-[0_12px_40px_rgba(255,127,80,0.08)] max-w-2xl mx-auto flex flex-col h-[350px] transition-all duration-300 ease-out relative";

    return (
        <>
            {isExpanded && (
                <div
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[998] transition-opacity"
                    onClick={() => setIsExpanded(false)}
                />
            )}

            <div className={containerClasses}>
                {/* Header with maximum interactive controls */}
                <div className="border-b border-orange-100 bg-gradient-to-r from-orange-50/70 via-orange-50/20 to-white px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-orange-500 to-coral text-white shadow-md shadow-orange-500/20">
                            <Heart className="h-4.5 w-4.5 fill-current animate-pulse" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black tracking-tight uppercase bg-gradient-to-r from-orange-600 via-orange-500 to-coral bg-clip-text text-transparent">
                                Create with Spark AI
                            </h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-ping" />
                                <span className="text-[9px] font-black uppercase text-orange-600 tracking-wider">
                                    {currentStep > 0 ? `Customizing: Step ${currentStep} of 5` : 'AI Live Architect'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Go back 1 step in Wizard */}
                        {currentStep > 1 && currentStep <= 5 && (
                            <button
                                onClick={() => {
                                    const prevStep = currentStep - 1;
                                    setCurrentStep(prevStep);
                                    // Remove the last user & assistant messages to revert the chat history
                                    setMessages(prev => prev.slice(0, prev.length - 2));
                                }}
                                className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-slate-500 hover:text-navy bg-slate-100 px-2.5 py-1 rounded-xl transition-all"
                            >
                                ⬅ Back
                            </button>
                        )}

                        {/* Prominent Back to Start / Wizard if we are in free chat / proposed plan mode */}
                        {currentStep === 0 && (
                            <button
                                onClick={resetToInitialState}
                                className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-orange-600 hover:text-navy bg-orange-50 px-2.5 py-1 rounded-xl transition-all font-bold"
                            >
                                ⬅ Back to Wizard
                            </button>
                        )}

                        {/* Reset / Start Over if not at step 1 */}
                        {(currentStep !== 1 || proposedPlan !== null || messages.length > 1) && (
                            <button
                                onClick={resetToInitialState}
                                className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-coral hover:text-navy bg-coral/10 px-2.5 py-1 rounded-xl transition-all"
                            >
                                Start Over
                            </button>
                        )}

                        {/* Skip guidance helper when wizard is running */}
                        {currentStep > 0 && currentStep <= 5 && (
                            <button
                                onClick={handleSkipAndGenerate}
                                className="hidden sm:inline-flex items-center gap-1 text-[10px] font-black uppercase text-orange-600 hover:text-navy bg-orange-50 px-2.5 py-1 rounded-xl transition-all"
                            >
                                Skip Guidance
                            </button>
                        )}
                        {/* Expandable toggle */}
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                            aria-label={isExpanded ? "Collapse Spark AI" : "Expand Spark AI"}
                        >
                            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                {/* Progress bar */}
                {currentStep > 0 && currentStep <= 5 && (
                    <div className="w-full bg-slate-100 h-1">
                        <div
                            className="bg-gradient-to-r from-orange-500 to-coral h-full transition-all duration-300"
                            style={{ width: `${(currentStep / 5) * 100}%` }}
                        />
                    </div>
                )}

                {/* Chat window body */}
                <div className="flex flex-col flex-1 min-h-0 bg-slate-50/30">
                    <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4 scroll-smooth">
                        {messages.map((message, idx) => (
                            <motion.div
                                key={`${message.role}-${idx}`}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`flex max-w-[85%] gap-2.5 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl shadow-sm ${message.role === 'user' ? 'bg-navy text-white' : 'bg-white text-orange-500'}`}>
                                        {message.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                                    </div>
                                    <div className={`rounded-2xl p-3 px-4 text-xs font-semibold leading-relaxed shadow-sm ${message.role === 'user' ? 'rounded-tr-sm bg-navy text-white' : 'rounded-tl-sm border border-slate-100 bg-white text-navy'}`}>
                                        {renderMessageContent(message.content, idx === messages.length - 1 && !isStreaming, message.role)}
                                    </div>
                                </div>
                            </motion.div>
                        ))}

                        {/* Interactive Suggestion Pills (Always rendered next in sequence) */}
                        {currentStep > 0 && currentStep <= 5 && !isStreaming && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex justify-start pl-10"
                            >
                                <div className="bg-white border border-orange-100 rounded-2xl p-3.5 shadow-sm max-w-[90%]">
                                    <span className="text-[10px] font-black uppercase text-orange-500 tracking-wider">Tap your choice:</span>
                                    {renderStepChoices()}
                                    {locationLoading && (
                                        <div className="flex items-center gap-2 text-xs font-black text-orange-500 mt-2">
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Fetching GPS Location...
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* Starter prompts (only at start) */}
                        {messages.length === 1 && currentStep === 1 && (
                            <div className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm mx-2">
                                <div className="mb-2.5 flex items-center justify-between">
                                    <h4 className="text-xs font-black text-navy uppercase tracking-wider">Or Use Conversation Prompts</h4>
                                    <Sparkles className="h-3.5 w-3.5 text-orange-500 animate-pulse" />
                                </div>
                                <div className="grid gap-2 sm:grid-cols-2">
                                    {STARTER_PROMPTS.map((starter) => (
                                        <button
                                            type="button"
                                            key={starter.label}
                                            onClick={() => {
                                                setCurrentStep(0); // Bypass guided wizard
                                                sendPrompt(starter.prompt);
                                            }}
                                            className="rounded-xl border border-slate-100 bg-slate-50/50 p-2.5 text-left transition hover:border-orange-200 hover:bg-white active:scale-[0.98]"
                                        >
                                            <span className="block text-[10.5px] font-black text-navy">{starter.label}</span>
                                            <span className="mt-0.5 block text-[9.5px] font-medium leading-snug text-slate-400 truncate">{starter.prompt}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        {/* Plan Generating Thinking bubble */}
                        {isGeneratingPlan && (
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-start">
                                    <div className="flex max-w-[85%] gap-2.5">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-orange-500 shadow-sm">
                                            <Bot className="h-4 w-4" />
                                        </div>
                                        <div className="rounded-2xl rounded-tl-sm border border-slate-100 bg-white p-3 px-4 text-xs font-semibold shadow-sm">
                                            <div className="flex items-center gap-2 text-orange-500 font-black">
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                <span>Sparky is architecting the perfect custom date plan...</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-start pl-10.5">
                                    <button
                                        onClick={resetToInitialState}
                                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-2xl text-[10.5px] font-black uppercase tracking-wider transition-all border border-slate-200 flex items-center gap-1.5 shadow-sm active:scale-[0.98]"
                                    >
                                        ⬅ Cancel & Start Over
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Offered Draft Plan Preview with Accept / Decline and Prompts */}
                        <AnimatePresence>
                            {proposedPlan && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="rounded-3xl border border-orange-100 bg-gradient-to-br from-orange-50/30 to-white p-5 shadow-lg mx-2 space-y-4"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-orange-500">Sparky's Offered Plan Draft</p>
                                            <h4 className="text-xl font-black text-navy mt-0.5">{proposedPlan.title || 'Sparked Adventure'}</h4>
                                        </div>
                                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                                            <Sparkles className="w-5 h-5 animate-pulse" />
                                        </div>
                                    </div>

                                    <p className="text-xs font-semibold leading-relaxed text-slate-600 bg-white/60 p-3 rounded-2xl border border-orange-50">
                                        {proposedPlan.description || 'Check out your tailored sequence below. You can refine any detail by chatting with me!'}
                                    </p>

                                    {/* Activities Timeline */}
                                    {/* Activities Timeline */}
                                    <div className="space-y-4 relative pl-4 border-l-2 border-orange-100/60 mt-3">
                                        {(() => {
                                            const steps = proposedPlan.activities || 
                                                          (Array.isArray(proposedPlan.itinerary) ? proposedPlan.itinerary : (proposedPlan.itinerary?.steps || []));
                                            return steps.map((act, index) => {
                                                const actName = act.name || act.venue || act.activity || `Stop ${index + 1}`;
                                                const hasPhoto = (act.photo || act.photoUrl) && String(act.photo || act.photoUrl).trim() !== '';
                                                const photoSrc = hasPhoto ? getProxiedPhoto(act.photo || act.photoUrl) : null;
                                                const actLocation = act.location || act.address || null;
                                                
                                                // Smart fallback based on type or keyword
                                                const typeLower = (act.type || 'stop').toLowerCase();
                                                let fallbackImage = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600'; // Default restaurant/vibe
                                                if (typeLower.includes('bar') || typeLower.includes('drink') || typeLower.includes('cocktail') || typeLower.includes('club')) {
                                                    fallbackImage = 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=600';
                                                } else if (typeLower.includes('park') || typeLower.includes('outdoor') || typeLower.includes('walk') || typeLower.includes('scenic') || typeLower.includes('garden')) {
                                                    fallbackImage = 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&q=80&w=600';
                                                } else if (typeLower.includes('dessert') || typeLower.includes('sweet') || typeLower.includes('cafe') || typeLower.includes('coffee') || typeLower.includes('bakery')) {
                                                    fallbackImage = 'https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&q=80&w=600';
                                                } else if (typeLower.includes('activity') || typeLower.includes('game') || typeLower.includes('fun') || typeLower.includes('museum') || typeLower.includes('theater')) {
                                                    fallbackImage = 'https://images.unsplash.com/photo-1481277542470-605612bd2d61?auto=format&fit=crop&q=80&w=600';
                                                }

                                                return (
                                                    <div key={index} className="relative space-y-2">
                                                        {/* Timeline bullet */}
                                                        <div className="absolute -left-[25px] top-4 flex h-5.5 w-5.5 items-center justify-center rounded-full bg-navy text-white ring-4 ring-white shadow-md z-10">
                                                            <span className="text-[10px] font-black">{index + 1}</span>
                                                        </div>
                                                        
                                                        <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.05)] transition-all duration-300 flex flex-col md:flex-row">
                                                            {/* Activity Image / Photo */}
                                                            <div className="w-full md:w-1/3 h-36 md:h-auto relative bg-slate-100 shrink-0 overflow-hidden">
                                                                <img
                                                                    src={photoSrc || fallbackImage}
                                                                    alt={actName}
                                                                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                                                                    onError={(e) => {
                                                                        e.target.src = fallbackImage;
                                                                    }}
                                                                />
                                                                <div className="absolute top-2.5 left-2.5 bg-navy/90 backdrop-blur-md text-white font-black text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                                    {act.type || 'Stop'}
                                                                </div>
                                                            </div>

                                                            {/* Activity Details */}
                                                            <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                                                                <div className="space-y-1">
                                                                    <div className="flex items-start justify-between gap-2">
                                                                        <h5 className="text-sm font-black text-navy leading-snug">{actName}</h5>
                                                                        {act.rating && (
                                                                            <div className="flex items-center gap-0.5 bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-lg text-[9px] font-black">
                                                                                ⭐ {act.rating}
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    <p className="text-[11px] font-semibold leading-relaxed text-slate-500">
                                                                        {act.description}
                                                                    </p>
                                                                </div>

                                                                <div className="flex items-center justify-between text-[10px] font-black border-t border-slate-50 pt-2">
                                                                    <span className="text-orange-500 flex items-center gap-1">
                                                                        🕒 {act.time || 'Flexible Time'}
                                                                    </span>
                                                                    {actLocation && (
                                                                        <span className="text-slate-400 truncate max-w-[150px]">
                                                                            📍 {actLocation}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            });
                                        })()}
                                    </div>

                                    {/* Decision Actions */}
                                    <div className="grid grid-cols-2 gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={handleAcceptPlan}
                                            className="flex items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs py-3 shadow-md hover:shadow-lg active:scale-[0.98] transition-all"
                                        >
                                            <CheckCircle2 className="w-4 h-4" />
                                            Accept & Go
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleDeclinePlan}
                                            className="flex items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-rose-500 to-coral hover:from-rose-600 hover:to-coral-dark text-white font-black text-xs py-3 shadow-md hover:shadow-lg active:scale-[0.98] transition-all"
                                        >
                                            <XCircle className="w-4 h-4" />
                                            Decline & Start Over
                                        </button>
                                    </div>
                                    <p className="text-center text-[10px] font-bold text-slate-400">
                                        💡 Need changes? Just type them in the chat box below!
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Chat footer input */}
                    <div className="border-t border-slate-100 bg-white p-3">
                        <div className="relative flex items-center">
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        sendPrompt();
                                    }
                                }}
                                placeholder={currentStep > 0 ? "Or type a custom answer here..." : "Refine your date, add vibes..."}
                                disabled={isStreaming || isForceGenerating}
                                className="h-11 w-full rounded-full border-2 border-slate-100 bg-slate-50 pl-4 pr-24 text-xs font-bold text-navy outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:bg-white disabled:opacity-60"
                            />
                            <div className="absolute inset-y-0 right-1 flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={toggleListening}
                                    disabled={isStreaming || isForceGenerating}
                                    className={`rounded-full p-2 transition active:scale-95 disabled:opacity-40 ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-transparent text-slate-400 hover:text-navy'}`}
                                    aria-label="Toggle voice input"
                                >
                                    <Mic className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => sendPrompt()}
                                    disabled={!input.trim() || isStreaming || isForceGenerating}
                                    className="rounded-full bg-navy hover:bg-orange-600 p-2 text-white shadow-md transition active:scale-95 disabled:opacity-40"
                                    aria-label="Send message to Sparky"
                                >
                                    {isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        <p className="mt-1.5 text-center text-[9px] font-black uppercase tracking-widest text-slate-400">
                            Powered by Sparky AI Engine • Capped 5-Step Customizer
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default DateArchitectChat;
