import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
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
import { useGoogleMaps } from '../../lib/googleMaps';

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
        id: 'active_fun',
        label: 'Active & Fun',
        helper: 'Arcade, bowling, playful games',
        icon: Sparkles,
        prompt: 'Plan an active and fun date. Include interactive spots like an arcade, bowling, or other competitive games, paired with casual dining or drinks.',
    },
    {
        id: 'outdoors',
        label: 'Outdoor Adventure',
        helper: 'Scenic walks, hiking, nature',
        icon: Compass,
        prompt: 'Plan an outdoor and scenic date. Focus on natural beauty, parks, scenic walks, or outdoor recreation, followed by cozy outdoor dining or drinks.',
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
    location: initialLocation = '',
    budget: initialBudget = '$100',
    radius: initialRadius = 8046,
    numActivities: initialNumActivities = 3,
    planDate: initialPlanDate,
    planTime: initialPlanTime = '07:00 PM',
    isTrip: initialIsTrip = false,
    initialPrompt,
    initialVibe,
    onConceptSelected,
    onSettingsChange,
    onPlanSaved,
    isStudio = false,
    hideHeader = false,
    userName = 'Rayan',
}) => {
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL || '';
    
    const getProxiedPhoto = (photoUrl) => {
        if (!photoUrl || photoUrl.includes('unsplash')) return null;
        if (photoUrl.includes('googleusercontent.com')) return photoUrl;
        if (photoUrl.includes('places.googleapis.com') || 
            photoUrl.includes('maps.googleapis.com') || 
            photoUrl.includes('staticmap')) {
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
    const [selectedGoal, setSelectedGoal] = useState(initialVibe || 'first_date');
    const [chatMode, setChatMode] = useState('concierge'); // 'concierge' or 'wizard'
    const [isTrip, setIsTrip] = useState(initialIsTrip);

    // 1.1 PROPOSED PLAN STATE
    const [proposedPlan, setProposedPlan] = useState(null);
    const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

    // 2. NEW CUSTOMIZABLE OPTIONS
    const [location, setLocation] = useState(initialLocation);
    const [lat, setLat] = useState(null);
    const [lng, setLng] = useState(null);
    const [budget, setBudget] = useState(initialBudget);
    const [radius, setRadius] = useState(initialRadius);
    const [numActivities, setNumActivities] = useState(initialNumActivities);
    const [planDate, setPlanDate] = useState(initialPlanDate || new Date().toISOString().split('T')[0]);
    const [planTime, setPlanTime] = useState(initialPlanTime);

    // 3. UI STATE
    const [isExpanded, setIsExpanded] = useState(false);
    const [currentStep, setCurrentStep] = useState(initialLocation ? 2 : 0); // Start at step 0 for concierge
    const [showCustomPicker, setShowCustomPicker] = useState(false);
    const [showCustomLocation, setShowCustomLocation] = useState(false);
    const [customLocationText, setCustomLocationText] = useState('');
    const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0]);
    const [customTime, setCustomTime] = useState('19:00');
    const [locationLoading, setLocationLoading] = useState(false);

    const { isLoaded } = useGoogleMaps();
    const [placesService, setPlacesService] = useState(null);

    useEffect(() => {
        if (isLoaded && window.google?.maps?.places && !placesService) {
            const dummy = document.createElement('div');
            setPlacesService(new window.google.maps.places.PlacesService(dummy));
        }
    }, [isLoaded, placesService]);

    // Google Places Photo Enrichment for proposedPlan preview
    useEffect(() => {
        if (!placesService || !proposedPlan) return;
        
        let isMounted = true;
        
        const enrichDraftPlan = async () => {
            const steps = proposedPlan.activities || 
                         (Array.isArray(proposedPlan.itinerary) ? proposedPlan.itinerary : (proposedPlan.itinerary?.steps || []));
            
            if (!steps || steps.length === 0) return;
            
            let modified = false;
            const enrichedSteps = [...steps];
            const city = proposedPlan.location || proposedPlan.city || location || 'New York';

            for (let i = 0; i < enrichedSteps.length; i++) {
                if (!isMounted) break;
                const act = enrichedSteps[i];
                if (act._photoEnriched) continue;

                const actName = act.name || act.venue || act.activity;
                const hasPhoto = (act.photo || act.photoUrl) && String(act.photo || act.photoUrl).trim() !== '';
                const photoSrc = hasPhoto ? (act.photo || act.photoUrl) : '';
                
                const isGenericOrMissing = !hasPhoto || 
                                           photoSrc.includes('encrypted-tbn0.gstatic.com') ||
                                           photoSrc.includes('maps.googleapis.com') ||
                                           photoSrc.includes('staticmap') ||
                                           photoSrc.includes('unsplash');

                if (isGenericOrMissing && actName) {
                    try {
                        const actCity = act.location || act.address || city;
                        await new Promise((resolve) => {
                            placesService.textSearch({ query: `${actName} ${actCity}` }, (results, status) => {
                                if (status === window.google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
                                    const place = results[0];
                                    let newPhotoUrl = act.photoUrl;
                                    
                                     if (place.photos && place.photos.length > 0) {
                                         const photo = place.photos[0];
                                         newPhotoUrl = photo.photo_reference
                                             ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photo.photo_reference}`
                                             : photo.getUrl({ maxWidth: 800 });
                                     }

                                    enrichedSteps[i] = { 
                                        ...act, 
                                        ...(newPhotoUrl && { photoUrl: newPhotoUrl, photo: newPhotoUrl }),
                                        lat: place.geometry?.location?.lat?.() || act.lat,
                                        lng: place.geometry?.location?.lng?.() || act.lng,
                                        _photoEnriched: true 
                                    };
                                    modified = true;
                                } else {
                                    // If Google Places fails, remove the generic placeholder so smart fallback kicks in
                                    const cleanedAct = { ...act, _photoEnriched: true };
                                    if (String(cleanedAct.photoUrl).includes('unsplash') || String(cleanedAct.photo).includes('unsplash')) {
                                        delete cleanedAct.photoUrl;
                                        delete cleanedAct.photo;
                                        modified = true;
                                    }
                                    enrichedSteps[i] = cleanedAct;
                                }
                                setTimeout(resolve, 350);
                            });
                        });
                    } catch (e) {
                        console.error("Error fetching photo for", actName, e);
                    }
                } else {
                    enrichedSteps[i] = { ...act, _photoEnriched: true };
                }
            }

            if (isMounted && modified) {
                // Determine how to save back to proposedPlan based on structure
                const newPlan = { ...proposedPlan };
                if (proposedPlan.activities) {
                    newPlan.activities = enrichedSteps;
                } else if (Array.isArray(proposedPlan.itinerary)) {
                    newPlan.itinerary = enrichedSteps;
                } else if (proposedPlan.itinerary?.steps) {
                    newPlan.itinerary = { ...newPlan.itinerary, steps: enrichedSteps };
                }
                setProposedPlan(newPlan);
            }
        };

        enrichDraftPlan();
        
        return () => { isMounted = false; };
    }, [placesService, proposedPlan, location]);

    const scrollRef = useRef(null);
    const inputRef = useRef(null);
    const recognitionRef = useRef(null);
    const speechBaseInputRef = useRef('');

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
                    : `Hi ${userName}! I've analyzed your preferences, past dates, and what's happening around you. What kind of vibe are we going for? 💅`,
                options: [
                    "💖 Romantic / something sweet",
                    "🏕️ Adventurous / let's explore",
                    "☕ Chill & Casual / low key vibe",
                    "💵 Budget Friendly / save & enjoy",
                    "✨ Surprise Me / I'm open to ideas"
                ]
            };
            setMessages([welcomeMsg]);
            
            if (initialPrompt) {
                setMessages(prev => [...prev, { role: 'user', content: initialPrompt }]);
                setChatMode('concierge');
                setCurrentStep(0); // Go directly to free chat
            } else {
                setChatMode('concierge');
                setCurrentStep(0); // Starts in concierge mode
            }
        }
    }, [initialPrompt, initialVibe, userName]);

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
                    : `Hi! I'm Sparky, your premium AI Date & Trip Concierge. 🌟 I'm here to help you craft incredible dates, weekend getaways, neighborhood crawls, and epic travels. Tell me what you're thinking, or click one of the quick sparks below!`,
                options: [
                    "Looking for a chill date night near me 🍻",
                    "Need a fun outdoor adventure day 🌳",
                    "Arcade & gaming date crawl 🎮",
                    "Bowling & beer night 🎳",
                    "I want to plan a romantic weekend getaway ✈️"
                ]
            }
        ]);
        setChatMode('concierge');
        setCurrentStep(0);
        setIsTrip(false);
        setInput('');
        setIsExpanded(false); // Automatically collapse the interface when plan is saved or declined
    };

    // Autoscroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, streamedText, extractedConcepts, currentStep, showCustomPicker, proposedPlan, isGeneratingPlan]);

    // Autofocus input on mount for fast typing (only on desktop to prevent mobile keypad/overlay popups)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (inputRef.current && window.innerWidth >= 768) {
                inputRef.current.focus();
            }
        }, 150);
        return () => clearTimeout(timer);
    }, []);

    // Cleanup speech recognition on unmount
    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    // Voice integration
    const toggleListening = () => {
        if (isListening) {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            setIsListening(false);
            return;
        }

        if (SpeechRecognition) {
            speechBaseInputRef.current = input;
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onresult = (event) => {
                let sessionTranscript = '';
                for (let i = 0; i < event.results.length; i++) {
                    sessionTranscript += event.results[i][0].transcript;
                }
                const base = speechBaseInputRef.current || '';
                const space = base && !base.endsWith(' ') ? ' ' : '';
                setInput(base + space + sessionTranscript);
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
            try {
                recognition.start();
                setIsListening(true);
            } catch (err) {
                console.error("Failed to start speech recognition", err);
                setIsListening(false);
            }
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
        const finalBudget = overrides.budget || budget;
        const finalGoal = overrides.goal || selectedGoal;
        const promptText = refinementPrompt 
            ? refinementPrompt 
            : isTrip
                ? `A custom premium ${numActivities}-step travel trip itinerary in ${location || 'NYC'}, budget range ${finalBudget || 'moderate'}, featuring incredible local landmarks, scenic routes, and top-tier dining.`
                : `A custom ${numActivities}-step ${finalGoal || 'date'} experience in ${location || 'NYC'}, budget range ${finalBudget || 'moderate'}, with activities focused on a fun and cohesive couple experience.`;

        if (!userId) {
            localStorage.setItem('pending_spark_prompt', promptText);
            localStorage.setItem('pending_spark_location', location || '');
            localStorage.setItem('pending_spark_budget', finalBudget);
            localStorage.setItem('pending_spark_goal', finalGoal);
            localStorage.setItem('pending_spark_num_activities', numActivities);
            localStorage.setItem('pending_spark_date', planDate);
            localStorage.setItem('pending_spark_time', planTime);
            localStorage.setItem('pending_spark_is_trip', isTrip ? 'true' : 'false');
            navigate('/signup');
            return;
        }

        setIsGeneratingPlan(true);
        setProposedPlan(null);
        
        try {
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

    // Spark Premium AI Concierge message sender
    const sendConciergeMessage = async (textToSend) => {
        setIsStreaming(true);
        const userMessage = { role: 'user', content: textToSend };
        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        setInput('');

        try {
            const res = await fetch('/api/spark-concierge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: updatedMessages,
                    currentSettings: {
                        location,
                        budget,
                        vibe: selectedGoal,
                        numActivities,
                        planDate,
                        planTime,
                        isTrip
                    }
                })
            });

            if (!res.ok) throw new Error('Concierge request failed');
            const data = await res.json();

            // Extract parameters and sync to state
            if (data.inferredParams) {
                if (data.inferredParams.location) setLocation(data.inferredParams.location);
                if (data.inferredParams.budget) setBudget(data.inferredParams.budget);
                if (data.inferredParams.vibe) setSelectedGoal(data.inferredParams.vibe);
                if (data.inferredParams.numActivities) setNumActivities(data.inferredParams.numActivities);
                if (data.inferredParams.planDate) setPlanDate(data.inferredParams.planDate);
                if (data.inferredParams.planTime) setPlanTime(data.inferredParams.planTime);
                if (data.inferredParams.isTrip !== undefined) setIsTrip(data.inferredParams.isTrip);
            }

            setMessages(prev => [
                ...prev,
                {
                    role: 'assistant',
                    content: data.reply,
                    options: data.options || [],
                    concepts: data.concepts || []
                }
            ]);
        } catch (err) {
            console.error('[Spark Concierge Error]', err);
            setMessages(prev => [
                ...prev,
                {
                    role: 'assistant',
                    content: "Oh no, my sparking coils are a bit tangled! 🛑 Let's try that again."
                }
            ]);
        } finally {
            setIsStreaming(false);
        }
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

        if (chatMode === 'concierge') {
            await sendConciergeMessage(textToSend);
            return;
        }

        // Fallback for direct prompt execution if not in concierge mode
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
                                        className="bg-white border border-orange-200 text-navy text-base md:text-xs rounded-xl px-2.5 py-1.5 outline-none w-full font-bold focus:text-lg transition-all"
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
                                        className="bg-white border border-orange-200 text-navy text-base md:text-xs rounded-xl px-2.5 py-1.5 outline-none w-full font-bold focus:text-lg transition-all"
                                    />
                                </div>
                                <div className="flex items-center gap-1.5 w-full">
                                    <Clock className="w-4 h-4 text-orange-500 flex-shrink-0" />
                                    <input
                                        type="time"
                                        value={customTime}
                                        onChange={(e) => setCustomTime(e.target.value)}
                                        className="bg-white border border-orange-200 text-navy text-base md:text-xs rounded-xl px-2.5 py-1.5 outline-none w-full font-bold focus:text-lg transition-all"
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
                </div>
            );
        }

        if (currentStep === 5) {
            return (
                <div className="flex flex-wrap gap-2 mt-2">
                    {[
                        { label: '💸 Chill & Free ($0)', budget: '$0', goal: 'budget' },
                        { label: '🍻 Cozy & Casual ($50)', budget: '$50', goal: 'first_date' },
                        { label: '🎮 Arcade & Gaming Crawl ($75)', budget: '$75', goal: 'active_fun' },
                        { label: '🎳 Bowling & Beer Night ($75)', budget: '$75', goal: 'active_fun' },
                        { label: '🌳 Outdoor & Scenic Walks ($30)', budget: '$30', goal: 'outdoors' },
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
                </div>
            );
        }

        return null;
    };

    const renderMessageContent = (msg, isLast, role) => {
        const isObject = typeof msg === 'object' && msg !== null;
        const contentStr = isObject ? msg.content : msg;
        let text = contentStr.split('READY')[0];
        let options = isObject && msg.options ? msg.options : [];
        
        // Handle backward compatibility for standard strings
        const optionsMatch = text.match(/\[OPTIONS:\s*([\s\S]*?)\]/i);
        if (optionsMatch) {
            options = optionsMatch[1].split('|').map(option => option.trim().replace(/\n/g, ' ')).filter(Boolean);
            text = text.replace(optionsMatch[0], '');
        }

        const handleOptionClick = (option) => {
            sendPrompt(option);
        };

        return (
            <div className="space-y-3">
                <div className="whitespace-pre-wrap leading-relaxed">{text.trim()}</div>
                {options.length > 0 && isLast && role === 'assistant' && (
                    <div className="flex flex-wrap gap-2 pt-1">
                        {options.map((option) => {
                            const parts = option.split(' / ');
                            const hasSub = parts.length > 1;
                            return (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() => handleOptionClick(hasSub ? parts[0].trim() : option)}
                                    disabled={isStreaming}
                                    className="rounded-2xl border border-slate-100 bg-white px-3.5 py-2 text-left transition hover:border-rose-350 hover:shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                                >
                                    <span className="text-[11px] font-black text-slate-800 flex items-center gap-1">
                                        {parts[0]}
                                    </span>
                                    {hasSub && (
                                        <span className="text-[9px] text-slate-400 font-bold">
                                            / {parts[1]}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
                {isObject && msg.concepts && msg.concepts.length > 0 && isLast && role === 'assistant' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-2">
                        {msg.concepts.map((concept, index) => (
                            <div
                                key={index}
                                className="p-4 rounded-2xl border border-orange-100 bg-orange-50/20 shadow-sm hover:shadow-md hover:border-orange-300 transition-all duration-300 flex flex-col justify-between"
                            >
                                <div>
                                    <span className="text-[9px] font-black text-orange-600 uppercase tracking-widest bg-white border border-orange-100 px-2 py-0.5 rounded-lg shadow-sm">
                                        {concept.tagline || 'PREMIUM SPARK'}
                                    </span>
                                    <h4 className="text-sm font-black text-navy mt-2">{concept.title}</h4>
                                    <p className="text-[11px] font-bold text-slate-500 mt-1 leading-relaxed">
                                        {concept.description}
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        generateProposedPlan(
                                            `A premium sequence themed around: ${concept.title}. Details: ${concept.description}`,
                                            { budget, goal: selectedGoal }
                                        );
                                    }}
                                    className="w-full mt-4 py-2 bg-gradient-to-r from-orange-500 to-coral text-white font-black text-xs rounded-xl shadow-md hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer"
                                >
                                    Spark It! ⚡
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    // Chat main wrapper styles depending on expand state
    const containerClasses = isExpanded
        ? "fixed inset-0 z-[999] flex flex-col bg-white w-screen h-screen md:rounded-xl md:shadow-2xl md:max-w-4xl md:h-[85vh] md:m-auto transition-all duration-300 ease-out"
        : isStudio
            ? "overflow-hidden rounded-xl border border-orange-100/80 bg-white shadow-[0_12px_45px_rgba(255,127,80,0.06)] w-full flex flex-col h-[600px] transition-all duration-300 ease-out relative"
            : "overflow-hidden rounded-xl border border-orange-100 bg-white shadow-[0_12px_40px_rgba(255,127,80,0.08)] max-w-2xl mx-auto flex flex-col h-[350px] transition-all duration-300 ease-out relative";

    const chatContent = (
        <div className={containerClasses}>
                {/* Header with maximum interactive controls */}
                {!hideHeader && (
                    <div className="border-b border-rose-100 bg-gradient-to-r from-rose-50/70 via-rose-50/20 to-white px-4 py-3 flex items-center justify-between flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-rose-500 to-coral text-white shadow-md shadow-rose-500/20">
                                <Heart className="h-4.5 w-4.5 fill-current animate-pulse" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black tracking-tight uppercase bg-gradient-to-r from-rose-600 via-rose-500 to-coral bg-clip-text text-transparent">
                                    Sparky
                                </h3>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
                                    <span className="text-[9px] font-black uppercase text-rose-600 tracking-wider">
                                        {currentStep > 0 ? `Customizing: Step ${currentStep} of 5` : chatMode === 'concierge' ? 'AI Concierge 🌟' : 'AI Live Architect'}
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
                            {currentStep === 0 && chatMode === 'wizard' && (
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
                                    className="hidden sm:inline-flex items-center gap-1 text-[10px] font-black uppercase text-rose-600 hover:text-navy bg-rose-50 px-2.5 py-1 rounded-xl transition-all"
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
                )}

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
                                    <div className={`rounded-xl p-3 px-4 text-xs font-semibold leading-relaxed shadow-sm ${message.role === 'user' ? 'rounded-tr-sm bg-navy text-white' : 'rounded-tl-sm border border-slate-100 bg-white text-navy'}`}>
                                        {renderMessageContent(message, idx === messages.length - 1 && !isStreaming, message.role)}
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
                                <div className="bg-white border border-orange-100 rounded-xl p-3.5 shadow-sm max-w-[90%]">
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
                        {messages.length === 1 && currentStep === 1 && chatMode === 'wizard' && (
                            <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm mx-2">
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
                                                const searchString = `${act.type || ''} ${actName} ${act.description || ''} ${act.activity || ''}`.toLowerCase();
                                                let fallbackImage = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600'; // Default restaurant/vibe
                                                
                                                if (searchString.includes('kitchen') || searchString.includes('cook')) {
                                                    fallbackImage = 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=600'; // Kitchen/Cooking
                                                } else if (searchString.includes('balcony') || searchString.includes('porch') || searchString.includes('patio')) {
                                                    fallbackImage = 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&q=80&w=600'; // Balcony
                                                } else if (searchString.includes('couch') || searchString.includes('movie') || searchString.includes('home') || searchString.includes('living room')) {
                                                    fallbackImage = 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&q=80&w=600'; // Living room
                                                } else if (searchString.includes('bar') || searchString.includes('drink') || searchString.includes('cocktail') || searchString.includes('club')) {
                                                    fallbackImage = 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=600'; // Bar
                                                } else if (searchString.includes('park') || searchString.includes('outdoor') || searchString.includes('walk') || searchString.includes('scenic') || searchString.includes('garden')) {
                                                    fallbackImage = 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&q=80&w=600'; // Park
                                                } else if (searchString.includes('dessert') || searchString.includes('sweet') || searchString.includes('cafe') || searchString.includes('coffee') || searchString.includes('bakery')) {
                                                    fallbackImage = 'https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&q=80&w=600'; // Cafe
                                                } else if (searchString.includes('activity') || searchString.includes('game') || searchString.includes('fun') || searchString.includes('museum') || searchString.includes('theater')) {
                                                    fallbackImage = 'https://images.unsplash.com/photo-1481277542470-605612bd2d61?auto=format&fit=crop&q=80&w=600'; // Activity
                                                } else {
                                                    // Deterministic varied fallback for unknown categories
                                                    const fallbacks = [
                                                        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600', // Restaurant
                                                        'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=600', // Bar/Vibe
                                                        'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&q=80&w=600', // Outdoor/Scenic
                                                        'https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&q=80&w=600', // Cafe/Dessert
                                                        'https://images.unsplash.com/photo-1481277542470-605612bd2d61?auto=format&fit=crop&q=80&w=600'  // Activity/Event
                                                    ];
                                                    fallbackImage = fallbacks[index % fallbacks.length];
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
                    <div className="border-t border-slate-100 bg-white p-3 flex-shrink-0">
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
                                onFocus={() => {
                                    if (window.innerWidth < 768) {
                                        setIsExpanded(true);
                                    }
                                }}
                                placeholder={currentStep > 0 ? "Or type a custom answer here..." : "Tell me what you're thinking..."}
                                disabled={isStreaming || isForceGenerating}
                                autoFocus={isExpanded}
                                className="h-11 w-full rounded-xl border border-slate-200/60 bg-slate-50 pl-4 pr-24 text-base md:text-xs font-bold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-rose-350 focus:bg-white disabled:opacity-60"
                            />
                            <div className="absolute inset-y-0 right-1 flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={toggleListening}
                                    disabled={isStreaming || isForceGenerating}
                                    className={`rounded-lg p-2 transition active:scale-95 disabled:opacity-40 ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-transparent text-slate-400 hover:text-navy'}`}
                                    aria-label="Toggle voice input"
                                >
                                    <Mic className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => sendPrompt()}
                                    disabled={!input.trim() || isStreaming || isForceGenerating}
                                    className="rounded-full bg-rose-500 hover:bg-rose-600 p-2 text-white shadow-md transition active:scale-95 disabled:opacity-40 flex items-center justify-center w-8 h-8"
                                    aria-label="Send message to Sparky"
                                >
                                    {isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                                </button>
                            </div>
                        </div>
                        
                        {/* Try saying Chips */}
                        {currentStep === 0 && (
                            <div className="flex items-center gap-1.5 mt-2 overflow-x-auto scrollbar-hide py-0.5">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider shrink-0">Try saying:</span>
                                {[
                                    "Rooftop dinner under $100",
                                    "Fun indoor activities",
                                    "Weekend getaway",
                                    "Arcade date night"
                                ].map((chip) => (
                                    <button
                                        key={chip}
                                        onClick={() => {
                                            setInput(chip);
                                            inputRef.current?.focus();
                                        }}
                                        className="px-2 py-0.5 rounded-md bg-slate-50 hover:bg-slate-100 border border-slate-200/50 text-[9px] font-bold text-slate-500 transition-all whitespace-nowrap cursor-pointer active:scale-95"
                                    >
                                        {chip}
                                    </button>
                                ))}
                            </div>
                        )}

                        <p className="mt-1.5 text-center text-[8px] font-black uppercase tracking-widest text-slate-400">
                            Powered by Sparky AI Engine • Capped 5-Step Customizer
                        </p>
                    </div>
                </div>
            </div>
    );

    if (isExpanded) {
        return (
            <>
                {/* Inline Static Placeholder to prevent layout shifts behind the overlay */}
                <div className={isStudio ? "h-[600px] w-full bg-slate-50 border border-slate-100 rounded-[2rem] flex flex-col items-center justify-center text-slate-400/75 text-xs font-bold font-outfit" : "h-[350px] max-w-2xl mx-auto w-full bg-slate-50 border border-slate-100 rounded-3xl flex flex-col items-center justify-center text-slate-400/75 text-xs font-bold font-outfit"}>
                    <div className="flex flex-col items-center gap-2">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75 font-outfit"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                        </span>
                        <span className="font-outfit text-slate-500 font-semibold mt-1">Spark AI is active in focus mode...</span>
                    </div>
                </div>

                {/* The Portal rendering at the document.body root */}
                {createPortal(
                    <>
                        <div
                            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[998] transition-opacity animate-in fade-in duration-300"
                            onClick={() => setIsExpanded(false)}
                        />
                        {chatContent}
                    </>,
                    document.body
                )}
            </>
        );
    }

    return chatContent;
};

export default DateArchitectChat;
