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

const BUDGET_PRESETS = ['$50', '$100', '$150', '$250'];
const QUICK_LOCATIONS = ['Manhattan', 'Brooklyn', 'Queens', 'Jersey City', 'Hoboken', 'New York City', 'NYC'];

const radiusLabel = (radius) => `${(radius / 1609.34).toFixed(1)} mi`;

const DateArchitectChat = ({ userId, location: initialLocation, budget: initialBudget, radius: initialRadius, initialPrompt, initialVibe, onConceptSelected, onSettingsChange }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamedText, setStreamedText] = useState('');
    const [extractedConcepts, setExtractedConcepts] = useState(null);
    const [isForceGenerating, setIsForceGenerating] = useState(false);
    const [selectedGoal, setSelectedGoal] = useState('first_date');
    const [location, setLocation] = useState(initialLocation || '');
    const [lat, setLat] = useState(null);
    const [lng, setLng] = useState(null);
    const [budget, setBudget] = useState(initialBudget || '$100');
    const [radius, setRadius] = useState(initialRadius || 8046);
    const [showBasics, setShowBasics] = useState(!initialLocation);
    const [showSettings, setShowSettings] = useState(false);
    const [showGoalPicker, setShowGoalPicker] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);
    const scrollRef = useRef(null);
    const inputRef = useRef(null);
    const recognitionRef = useRef(null);

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const [isListening, setIsListening] = useState(false);

    const toggleListening = () => {
        if (isListening) {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            setIsListening(false);
            return;
        }

        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onresult = (event) => {
                let currentTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        currentTranscript += transcript + ' ';
                    } else {
                        currentTranscript += transcript;
                    }
                }
                setInput(prev => {
                    // Prevent appending repeatedly if it's not final, but for simplicity we can just set
                    // It's better to just handle final for simplicity, or append cautiously.
                    // For now, let's just use final results to avoid weird text behavior.
                    let finalOnly = '';
                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        if (event.results[i].isFinal) {
                            finalOnly += event.results[i][0].transcript + ' ';
                        }
                    }
                    if (finalOnly) {
                        return prev + (prev.endsWith(' ') ? '' : ' ') + finalOnly.trim();
                    }
                    return prev;
                });
            };

            recognition.onerror = (event) => {
                console.error("Speech recognition error", event.error);
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

    // Use ref for onSettingsChange to prevent infinite re-render loops
    const onSettingsChangeRef = useRef(onSettingsChange);
    useEffect(() => {
        onSettingsChangeRef.current = onSettingsChange;
    }, [onSettingsChange]);

    useEffect(() => {
        onSettingsChangeRef.current?.({ location, budget, radius, lat, lng });
    }, [location, budget, radius, lat, lng]);

    useEffect(() => {
        if (messages.length === 0) {
            const welcomeMsg = {
                role: 'assistant',
                content: initialPrompt 
                    ? `Sparking a plan for your date at ${initialPrompt.split('Date at ')[1] || 'this venue'}! I've noted the vibe is ${initialVibe || 'custom'}. What else should I know to make it perfect?`
                    : `Hi, I'm Sparky. I can turn a rough idea into a real date plan with budget, route flow, backup options, and partner-friendly choices. Start by choosing a goal or tell me what kind of night you want.`,
            };
            setMessages([welcomeMsg]);
            
            if (initialPrompt) {
                setMessages(prev => [...prev, { role: 'user', content: initialPrompt }]);
            }
        }
    }, [messages.length, initialPrompt, initialVibe]);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages, streamedText, extractedConcepts]);

    const userPromptCount = messages.filter(m => m.role === 'user').length;
    const hasLocation = !!location.trim();
    const hasBudget = !!budget.trim();
    const hasGoal = !!selectedGoal;
    const readiness = [
        { label: 'Location', done: hasLocation },
        { label: 'Budget', done: hasBudget },
        { label: 'Date goal', done: hasGoal },
        { label: 'Details', done: userPromptCount > 0 || hasGoal },
    ];
    const readyCount = readiness.filter(item => item.done).length;
    const canGenerate = hasLocation && hasBudget && hasGoal && !isStreaming;
    const currentGoal = DATE_GOALS.find(item => item.id === selectedGoal) || DATE_GOALS[0];

    const isLocationAnswer = (value) => {
        const normalized = value.trim().toLowerCase();
        return QUICK_LOCATIONS.some(place => place.toLowerCase() === normalized);
    };

    const acceptLocationAnswer = (value) => {
        const cleaned = value.trim();
        setLocation(cleaned === 'NYC' ? 'New York City' : cleaned);
        setInput('');
        setShowBasics(false);
        setMessages(prev => [
            ...prev,
            { role: 'user', content: cleaned },
            {
                role: 'assistant',
                content: `Perfect, I will plan around ${cleaned === 'NYC' ? 'New York City' : cleaned}. What kind of date is this? [OPTIONS: First date | Romantic night | Low-cost and cozy]`,
            },
        ]);
    };

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
                            setLocation(data.results[0].formatted_address);
                            resolve({ lat: latitude, lng: longitude, location: data.results[0].formatted_address });
                        } else {
                            resolve({ lat: latitude, lng: longitude, location: null });
                        }
                    } catch (err) {
                        console.error('Geocoding error', err);
                        resolve({ lat: latitude, lng: longitude, location: null });
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

    const sendPrompt = async (overrideInput = null) => {
        const textToSend = typeof overrideInput === 'string' ? overrideInput : input;
        if (!textToSend.trim() || isStreaming) return;

        let loc = location;
        let finalLat = lat;
        let finalLng = lng;

        if (!loc.trim()) {
            if (textToSend.toLowerCase().includes('current location')) {
                setMessages(prev => [
                    ...prev,
                    { role: 'user', content: textToSend },
                    { role: 'assistant', content: 'Checking your current location...' },
                ]);
                setInput('');
                try {
                    const result = await handlePreciseLocation();
                    if (result && result.location) {
                        loc = result.location;
                        finalLat = result.lat;
                        finalLng = result.lng;
                        setMessages(prev => prev.slice(0, -1)); // Remove the checking message
                    } else {
                        setMessages(prev => [
                            ...prev.slice(0, -1),
                            { role: 'assistant', content: 'I could not determine your exact location. Please type a neighborhood manually.' }
                        ]);
                        return;
                    }
                } catch(e) {
                     setMessages(prev => [
                        ...prev.slice(0, -1),
                        { role: 'assistant', content: 'Location access denied or unavailable. Please type your neighborhood or city manually.' }
                    ]);
                    return;
                }
            } else if (isLocationAnswer(textToSend)) {
                acceptLocationAnswer(textToSend);
                return;
            } else {
                setMessages(prev => [
                    ...prev,
                    { role: 'user', content: textToSend },
                    { role: 'assistant', content: 'Tell me the neighborhood or city first, then I can suggest real places that make sense together. [OPTIONS: Use current location | Manhattan | Brooklyn]' },
                ]);
                setInput('');
                return;
            }
        }

        const goal = DATE_GOALS.find(item => item.id === selectedGoal);
        const userMessage = {
            role: 'user',
            content: `${textToSend}\n\nDate goal: ${goal?.label || 'Flexible'}\nBudget: ${budget || 'Flexible'}\nSearch radius: ${radiusLabel(radius)}`,
        };
        const nextMessages = [...messages, userMessage];
        setMessages(nextMessages);
        setInput('');
        setIsStreaming(true);
        setStreamedText('');
        setExtractedConcepts(null);
        if (inputRef.current) inputRef.current.style.height = 'auto';

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/architect-stream`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: nextMessages,
                    userId,
                    location: loc,
                    lat: finalLat,
                    lng: finalLng,
                    budget,
                    radius,
                    goal: goal?.label || 'Flexible date',
                }),
            });

            if (!response.ok || !response.body) throw new Error('Sparky could not respond.');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullContent = '';

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value);
                for (const line of chunk.split('\n')) {
                    if (!line.startsWith('data: ')) continue;
                    const data = line.slice(6);
                    if (data === '[DONE]') continue;
                    try {
                        const parsed = JSON.parse(data);
                        if (parsed.text) {
                            fullContent += parsed.text;
                            setStreamedText(fullContent);
                        }
                    } catch {
                        // Ignore malformed stream fragments.
                    }
                }
            }

            const readyMatch = fullContent.match(/READY\s*([\s\S]*)/);
            if (readyMatch) {
                try {
                    const data = JSON.parse(readyMatch[1].match(/\{.*\}/s)?.[0] || '{"concepts":[]}');
                    setExtractedConcepts(data.concepts || []);
                } catch (err) {
                    console.error('Failed to parse concepts from stream', err);
                }
            }

            setMessages(prev => [...prev, { role: 'assistant', content: fullContent }]);
        } catch (err) {
            console.error('Streaming error:', err);
            setMessages(prev => [...prev, { role: 'assistant', content: 'I hit a planning snag. Try one more sentence with the occasion, budget, and neighborhood, and I will rebuild it.' }]);
        } finally {
            setStreamedText('');
            setIsStreaming(false);
        }
    };

    const handleForceGenerate = async () => {
        setIsForceGenerating(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/suggest-date-concepts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversationHistory: messages,
                    location,
                    lat,
                    lng,
                    userId,
                    budget,
                    goal: DATE_GOALS.find(item => item.id === selectedGoal)?.label || 'Flexible date',
                }),
            });
            const data = await response.json();
            onConceptSelected(data.concepts?.[0] || { title: 'Custom Date Plan', description: 'A partner-ready itinerary based on your chat with Sparky.' }, { location, budget, radius, lat, lng });
        } catch (err) {
            console.error('Failed to force generate', err);
            onConceptSelected({ title: 'Custom Date Plan', description: 'A partner-ready itinerary based on your chat with Sparky.' }, { location, budget, radius });
        } finally {
            setIsForceGenerating(false);
        }
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
                        <button
                            type="button"
                            onClick={() => inputRef.current?.focus()}
                            disabled={isStreaming}
                            className="rounded-2xl border border-gray-100 bg-white px-3 py-2.5 text-left text-[12px] font-black text-gray-500 transition hover:text-navy disabled:opacity-50 sm:col-span-3"
                        >
                            <Edit2 className="mr-1 inline h-3 w-3" />
                            Type my own answer
                        </button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="overflow-hidden rounded-xl border border-orange-100 bg-white shadow-[0_8px_30px_rgba(255,127,80,0.06)] max-w-2xl mx-auto flex flex-col h-[300px]">
            {/* Orange Gradient Header with Heartbeat */}
            <div className="border-b border-orange-100 bg-gradient-to-r from-orange-50/70 via-orange-50/20 to-white px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-orange-500 to-coral text-white shadow-md shadow-orange-500/20">
                        <Heart className="h-4 w-4 fill-current" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black tracking-tight uppercase bg-gradient-to-r from-orange-600 via-orange-500 to-coral bg-clip-text text-transparent">
                            Create with Spark AI
                        </h3>
                        <p className="text-[9px] font-black text-orange-500/80 uppercase tracking-widest leading-none mt-0.5">
                            Heartbeat Engine
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 bg-orange-100/60 border border-orange-200/50 px-2 py-1 rounded-md">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                    <span className="text-[9px] font-black uppercase text-orange-600 tracking-wider">Live Architect</span>
                </div>
            </div>

            <div className="flex flex-col flex-1 min-h-0">
                <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-gray-50/50 p-3">
                        {messages.map((message, idx) => (
                            <motion.div
                                key={`${message.role}-${idx}`}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`flex max-w-[92%] gap-2 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl ${message.role === 'user' ? 'bg-navy text-white' : 'bg-white text-orange-500 shadow-sm'}`}>
                                        {message.role === 'user' ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                                    </div>
                                    <div className={`rounded-[1rem] p-2.5 px-3 text-[11px] font-semibold leading-normal shadow-sm ${message.role === 'user' ? 'rounded-tr-sm bg-navy text-white' : 'rounded-tl-sm border border-gray-100 bg-white text-navy'}`}>
                                        {renderMessageContent(message.content, idx === messages.length - 1 && !isStreaming, message.role)}
                                    </div>
                                </div>
                            </motion.div>
                        ))}

                        {messages.length === 1 && (
                            <div className="rounded-xl border border-gray-100 bg-white p-2.5 shadow-sm">
                                <div className="mb-2 flex items-center justify-between gap-3">
                                    <div>
                                        <h4 className="text-xs font-black text-navy">Quick Starter Prompts</h4>
                                    </div>
                                    <Moon className="h-4 w-4 text-orange-500" />
                                </div>
                                <div className="grid gap-1.5 sm:grid-cols-2">
                                    {STARTER_PROMPTS.map((starter) => (
                                        <button
                                            type="button"
                                            key={starter.label}
                                            onClick={() => sendPrompt(starter.prompt)}
                                            className="rounded-xl border border-gray-100 bg-gray-50 p-2 text-left transition hover:border-orange-200 hover:bg-white active:scale-[0.98]"
                                        >
                                            <span className="block text-[10px] font-black text-navy">{starter.label}</span>
                                            <span className="mt-0.5 block text-[9px] font-bold leading-snug text-gray-400">{starter.prompt}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {isStreaming && (
                            <div className="flex justify-start">
                                <div className="flex max-w-[92%] gap-2">
                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-white text-orange-500 shadow-sm">
                                        <Bot className="h-3.5 w-3.5" />
                                    </div>
                                    <div className="rounded-[1rem] rounded-tl-sm border border-gray-100 bg-white p-2.5 px-3 text-[11px] font-semibold leading-normal shadow-sm">
                                        {streamedText ? renderMessageContent(streamedText, false, 'assistant') : (
                                            <div className="flex items-center gap-2 text-orange-500">
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                <span>Thinking through the date flow...</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        <AnimatePresence>
                            {extractedConcepts?.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="rounded-[1.5rem] border border-orange-100 bg-white p-4 shadow-sm"
                                >
                                    <div className="mb-4">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Sparky's plan options</p>
                                        <h4 className="text-xl font-black text-navy">Choose a direction</h4>
                                    </div>
                                    <div className="grid gap-3">
                                        {extractedConcepts.map((concept) => (
                                            <button
                                                type="button"
                                                key={concept.title}
                                                onClick={() => onConceptSelected(concept, { location, budget, radius, lat, lng })}
                                                className="group rounded-2xl border-2 border-gray-100 bg-gray-50 p-4 text-left transition hover:border-orange-300 hover:bg-white active:scale-[0.99]"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <h5 className="text-base font-black text-navy">{concept.title}</h5>
                                                        <p className="mt-1 text-sm font-bold leading-relaxed text-gray-500">{concept.description}</p>
                                                        {(concept.budgetStrategy || concept.routeLogic || concept.partnerFit) && (
                                                            <div className="mt-3 grid gap-2 sm:grid-cols-3">
                                                                {concept.budgetStrategy && <span className="rounded-xl bg-emerald-50 px-2 py-1.5 text-[10px] font-black text-emerald-700">{concept.budgetStrategy}</span>}
                                                                {concept.routeLogic && <span className="rounded-xl bg-blue-50 px-2 py-1.5 text-[10px] font-black text-blue-700">{concept.routeLogic}</span>}
                                                                {concept.partnerFit && <span className="rounded-xl bg-rose-50 px-2 py-1.5 text-[10px] font-black text-rose-700">{concept.partnerFit}</span>}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <ArrowRight className="mt-1 h-5 w-5 text-orange-500 transition group-hover:translate-x-1" />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="border-t border-gray-100 bg-white p-2">
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
                                placeholder="Example: Low-cost rainy date in West Village..."
                                disabled={isStreaming || isForceGenerating}
                                className="h-[42px] w-full rounded-full border-2 border-gray-100 bg-gray-50 pl-4 pr-20 text-xs font-bold text-navy outline-none transition placeholder:text-gray-400 focus:border-orange-400 focus:bg-white disabled:opacity-60"
                            />
                            <div className="absolute inset-y-0 right-1 flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={toggleListening}
                                    disabled={isStreaming || isForceGenerating}
                                    className={`rounded-full p-2 transition active:scale-95 disabled:opacity-40 ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-transparent text-gray-400 hover:text-navy'}`}
                                    aria-label="Toggle voice input"
                                >
                                    <Mic className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => sendPrompt()}
                                    disabled={!input.trim() || isStreaming || isForceGenerating}
                                    className="rounded-full bg-navy p-2 text-white shadow-md transition hover:bg-orange-600 active:scale-95 disabled:opacity-40"
                                    aria-label="Send message to Sparky"
                                >
                                    {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                        <p className="mt-1.5 text-center text-[9px] font-black uppercase tracking-widest text-orange-400/60">
                            Sparky AI • Infinite Possibilities
                        </p>
                    </div>
                </div>
            </div>
    );
};

export default DateArchitectChat;
