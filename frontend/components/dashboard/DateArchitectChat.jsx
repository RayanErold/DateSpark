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
    HeartHandshake,
    Locate,
    Loader2,
    MapPin,
    MessageCircle,
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
        label: 'Cozy conversation',
        prompt: 'We want a cozy night with quiet conversation, warm drinks, and a dessert ending.',
    },
    {
        label: 'Food crawl',
        prompt: 'Build a three-stop food crawl with appetizers, a main bite, and dessert, all close together.',
    },
    {
        label: 'Hidden gems',
        prompt: 'Show us local hidden gems that do not feel touristy and make the night feel special.',
    },
    {
        label: 'Late night',
        prompt: 'Plan a late-night date after 9 PM with flexible spots that are still open.',
    },
    {
        label: 'Playful date',
        prompt: 'Make it playful and lightly competitive, with a fun activity and casual food after.',
    },
];

const BUDGET_PRESETS = ['$50', '$100', '$150', '$250'];
const QUICK_LOCATIONS = ['Manhattan', 'Brooklyn', 'Queens', 'Jersey City', 'Hoboken', 'New York City', 'NYC'];

const radiusLabel = (radius) => `${(radius / 1609.34).toFixed(1)} mi`;

const DateArchitectChat = ({ userId, location: initialLocation, budget: initialBudget, radius: initialRadius, onConceptSelected, onSettingsChange }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamedText, setStreamedText] = useState('');
    const [extractedConcepts, setExtractedConcepts] = useState(null);
    const [isForceGenerating, setIsForceGenerating] = useState(false);
    const [selectedGoal, setSelectedGoal] = useState('first_date');
    const [location, setLocation] = useState(initialLocation || '');
    const [budget, setBudget] = useState(initialBudget || '$100');
    const [radius, setRadius] = useState(initialRadius || 8046);
    const [showBasics, setShowBasics] = useState(!initialLocation);
    const [showSettings, setShowSettings] = useState(false);
    const [showGoalPicker, setShowGoalPicker] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);
    const scrollRef = useRef(null);
    const inputRef = useRef(null);

    // Use ref for onSettingsChange to prevent infinite re-render loops
    const onSettingsChangeRef = useRef(onSettingsChange);
    useEffect(() => {
        onSettingsChangeRef.current = onSettingsChange;
    }, [onSettingsChange]);

    useEffect(() => {
        onSettingsChangeRef.current?.({ location, budget, radius });
    }, [location, budget, radius]);

    useEffect(() => {
        if (messages.length === 0) {
            setMessages([
                {
                    role: 'assistant',
                    content: `Hi, I'm Sparky. I can turn a rough idea into a real date plan with budget, route flow, backup options, and partner-friendly choices. Start by choosing a goal or tell me what kind of night you want.`,
                },
            ]);
        }
    }, [messages.length]);

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
        setLocationLoading(true);
        if (!navigator.geolocation) {
            setLocationLoading(false);
            return;
        }
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`);
                    const data = await response.json();
                    if (data.results?.[0]) setLocation(data.results[0].formatted_address);
                } catch (err) {
                    console.error('Geocoding error', err);
                } finally {
                    setLocationLoading(false);
                }
            },
            () => setLocationLoading(false)
        );
    };

    const sendPrompt = async (overrideInput = null) => {
        const textToSend = typeof overrideInput === 'string' ? overrideInput : input;
        if (!textToSend.trim() || isStreaming) return;

        if (!location.trim()) {
            if (textToSend.toLowerCase() === 'use current location') {
                handlePreciseLocation();
                setMessages(prev => [
                    ...prev,
                    { role: 'user', content: textToSend },
                    { role: 'assistant', content: 'I am checking your current location. If the browser asks, allow location access, or type a neighborhood like Manhattan or Williamsburg.' },
                ]);
                setInput('');
                return;
            }

            if (isLocationAnswer(textToSend)) {
                acceptLocationAnswer(textToSend);
                return;
            }

            setMessages(prev => [
                ...prev,
                { role: 'user', content: textToSend },
                { role: 'assistant', content: 'Tell me the neighborhood or city first, then I can suggest real places that make sense together. [OPTIONS: Use current location | Manhattan | Brooklyn]' },
            ]);
            setInput('');
            return;
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
                    location,
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
                    userId,
                    budget,
                    goal: DATE_GOALS.find(item => item.id === selectedGoal)?.label || 'Flexible date',
                }),
            });
            const data = await response.json();
            onConceptSelected(data.concepts?.[0] || { title: 'Custom Date Plan', description: 'A partner-ready itinerary based on your chat with Sparky.' }, { location, budget, radius });
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
                                className="rounded-2xl border border-violet-100 bg-violet-50 px-3 py-2.5 text-left text-[12px] font-black text-violet-700 transition hover:border-violet-300 hover:bg-white disabled:opacity-50"
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
        <div className="overflow-hidden rounded-[1.75rem] border border-gray-100 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
            <div className="border-b border-gray-100 bg-gradient-to-br from-violet-50 via-white to-rose-50 px-4 py-5 sm:px-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-start gap-4">
                        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-600/20">
                            <Sparkles className="h-6 w-6" />
                            <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-4 border-white bg-emerald-500" />
                        </div>
                        <div>
                            <div className="mb-1 flex flex-wrap items-center gap-2">
                                <h3 className="text-2xl font-black leading-none text-navy">Sparky</h3>
                                <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-violet-600 shadow-sm">Dating AI assistant</span>
                            </div>
                            <p className="max-w-2xl text-sm font-bold leading-relaxed text-gray-500">
                                Tell me the occasion, budget, and energy. I will turn it into a route-ready date with real venues, backup logic, and partner-friendly choices.
                            </p>
                        </div>
                    </div>
                    <div className="hidden grid-cols-4 gap-2 rounded-2xl bg-white/80 p-2 shadow-sm lg:grid lg:min-w-[320px]">
                        {readiness.map((item) => (
                            <div key={item.label} className={`rounded-xl px-2 py-2 text-center ${item.done ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-400'}`}>
                                <CheckCircle2 className="mx-auto mb-1 h-4 w-4" />
                                <span className="block text-[9px] font-black uppercase tracking-tight">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => setShowBasics(!showBasics)}
                    className="mt-5 flex w-full items-center justify-between gap-3 rounded-2xl border border-violet-100 bg-white px-4 py-3 text-left shadow-sm transition hover:border-violet-200"
                >
                    <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-violet-600">Plan basics</p>
                        <p className="truncate text-sm font-black text-navy">
                            {location || 'Add location'} · {budget || 'Flexible'} · {currentGoal.label} · {radiusLabel(radius)}
                        </p>
                    </div>
                    <ChevronDown className={`h-5 w-5 shrink-0 text-violet-600 transition ${showBasics ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                    {showBasics && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="mt-3 space-y-3 rounded-2xl border border-violet-100 bg-white p-4">
                                <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_130px_auto]">
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-500" />
                                        <input
                                            type="text"
                                            placeholder="City or neighborhood"
                                            value={location}
                                            onChange={(e) => setLocation(e.target.value)}
                                            className="h-14 w-full rounded-2xl border-2 border-violet-100 bg-white pl-11 pr-12 text-sm font-black text-navy outline-none transition focus:border-violet-500"
                                        />
                                        <button
                                            type="button"
                                            onClick={handlePreciseLocation}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-violet-600 hover:bg-violet-50"
                                            aria-label="Use current location"
                                        >
                                            {locationLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Locate className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <DollarSign className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500" />
                                        <input
                                            type="text"
                                            placeholder="Budget"
                                            value={budget}
                                            onChange={(e) => setBudget(e.target.value)}
                                            className="h-14 w-full rounded-2xl border-2 border-emerald-100 bg-white pl-10 pr-3 text-sm font-black text-navy outline-none transition focus:border-emerald-500"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowSettings(!showSettings)}
                                        className="h-14 rounded-2xl border-2 border-gray-100 bg-white px-4 text-sm font-black text-navy transition hover:border-violet-200"
                                    >
                                        <Compass className="mr-2 inline h-4 w-4 text-violet-500" />
                                        {radiusLabel(radius)}
                                        <ChevronDown className={`ml-2 inline h-4 w-4 transition ${showSettings ? 'rotate-180' : ''}`} />
                                    </button>
                                </div>

                                <div className="grid gap-3 md:grid-cols-2">
                                    <div>
                                        <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">Date goal</span>
                                        <button
                                            type="button"
                                            onClick={() => setShowGoalPicker(!showGoalPicker)}
                                            className="flex w-full items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-left text-sm font-black text-navy"
                                        >
                                            {currentGoal.label}
                                            <ChevronDown className={`h-4 w-4 text-violet-600 transition ${showGoalPicker ? 'rotate-180' : ''}`} />
                                        </button>
                                        {showGoalPicker && (
                                            <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                                {DATE_GOALS.map((goal) => {
                                                    const Icon = goal.icon;
                                                    const active = selectedGoal === goal.id;
                                                    return (
                                                        <button
                                                            type="button"
                                                            key={goal.id}
                                                            onClick={() => {
                                                                setSelectedGoal(goal.id);
                                                                setInput(goal.prompt);
                                                                setShowGoalPicker(false);
                                                                inputRef.current?.focus();
                                                            }}
                                                            className={`rounded-xl border px-3 py-2 text-left transition ${active ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-gray-100 bg-white text-gray-600 hover:border-violet-200'}`}
                                                        >
                                                            <Icon className="mb-1 h-4 w-4" />
                                                            <span className="block text-[12px] font-black">{goal.label}</span>
                                                            <span className="block text-[10px] font-bold opacity-70">{goal.helper}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">Budget shortcuts</span>
                                        <div className="grid grid-cols-4 gap-2">
                                            {BUDGET_PRESETS.map((preset) => (
                                                <button
                                                    type="button"
                                                    key={preset}
                                                    onClick={() => setBudget(preset)}
                                                    className={`rounded-xl border px-2 py-3 text-xs font-black transition ${budget === preset ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-emerald-200'}`}
                                                >
                                                    {preset}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {showSettings && (
                                    <div className="rounded-2xl bg-violet-50 p-4">
                                        <div className="mb-3 flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Search radius</span>
                                            <span className="text-sm font-black text-violet-600">{radiusLabel(radius)}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="804"
                                            max="32186"
                                            step="804"
                                            value={radius}
                                            onChange={(e) => setRadius(Number(e.target.value))}
                                            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-violet-100 accent-violet-600"
                                        />
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="grid lg:grid-cols-[1fr_340px]">
                <div className="flex min-h-[620px] flex-col">
                    <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto bg-gray-50/60 p-4 sm:p-6">
                        {messages.map((message, idx) => (
                            <motion.div
                                key={`${message.role}-${idx}`}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`flex max-w-[92%] gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl ${message.role === 'user' ? 'bg-navy text-white' : 'bg-white text-violet-600 shadow-sm'}`}>
                                        {message.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                                    </div>
                                    <div className={`rounded-[1.35rem] p-4 text-sm font-semibold leading-relaxed shadow-sm ${message.role === 'user' ? 'rounded-tr-sm bg-navy text-white' : 'rounded-tl-sm border border-gray-100 bg-white text-navy'}`}>
                                        {renderMessageContent(message.content, idx === messages.length - 1 && !isStreaming, message.role)}
                                    </div>
                                </div>
                            </motion.div>
                        ))}

                        {messages.length === 1 && (
                            <div className="rounded-[1.5rem] border border-gray-100 bg-white p-4 shadow-sm">
                                <div className="mb-3 flex items-center justify-between gap-3">
                                    <div>
                                        <h4 className="text-sm font-black text-navy">Try one of these</h4>
                                        <p className="text-xs font-bold text-gray-400">Tap a prompt, then Sparky will ask one useful follow-up.</p>
                                    </div>
                                    <Moon className="h-5 w-5 text-violet-500" />
                                </div>
                                <div className="grid gap-2 sm:grid-cols-2">
                                    {STARTER_PROMPTS.map((starter) => (
                                        <button
                                            type="button"
                                            key={starter.label}
                                            onClick={() => sendPrompt(starter.prompt)}
                                            className="rounded-2xl border border-gray-100 bg-gray-50 p-3 text-left transition hover:border-violet-200 hover:bg-white active:scale-[0.98]"
                                        >
                                            <span className="block text-[12px] font-black text-navy">{starter.label}</span>
                                            <span className="mt-1 block text-[11px] font-bold leading-snug text-gray-400">{starter.prompt}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {isStreaming && (
                            <div className="flex justify-start">
                                <div className="flex max-w-[92%] gap-3">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white text-violet-600 shadow-sm">
                                        <Bot className="h-4 w-4" />
                                    </div>
                                    <div className="rounded-[1.35rem] rounded-tl-sm border border-gray-100 bg-white p-4 text-sm font-semibold leading-relaxed text-navy shadow-sm">
                                        {streamedText ? renderMessageContent(streamedText, false, 'assistant') : (
                                            <div className="flex items-center gap-2 text-violet-600">
                                                <Loader2 className="h-4 w-4 animate-spin" />
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
                                    className="rounded-[1.5rem] border border-violet-100 bg-white p-4 shadow-sm"
                                >
                                    <div className="mb-4">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-violet-600">Sparky's plan options</p>
                                        <h4 className="text-xl font-black text-navy">Choose a direction</h4>
                                    </div>
                                    <div className="grid gap-3">
                                        {extractedConcepts.map((concept) => (
                                            <button
                                                type="button"
                                                key={concept.title}
                                                onClick={() => onConceptSelected(concept, { location, budget, radius })}
                                                className="group rounded-2xl border-2 border-gray-100 bg-gray-50 p-4 text-left transition hover:border-violet-300 hover:bg-white active:scale-[0.99]"
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
                                                    <ArrowRight className="mt-1 h-5 w-5 text-violet-500 transition group-hover:translate-x-1" />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="border-t border-gray-100 bg-white p-4 sm:p-6">
                        <div className="relative">
                            <textarea
                                ref={inputRef}
                                value={input}
                                onChange={(e) => {
                                    setInput(e.target.value);
                                    e.target.style.height = 'auto';
                                    e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        sendPrompt();
                                    }
                                }}
                                placeholder="Example: Low-cost rainy date in West Village, cozy, no reservations, dessert ending..."
                                disabled={isStreaming || isForceGenerating}
                                rows={2}
                                className="min-h-[74px] w-full resize-none rounded-[1.5rem] border-2 border-gray-100 bg-gray-50 px-5 py-4 pr-16 text-sm font-bold text-navy outline-none transition placeholder:text-gray-400 focus:border-violet-400 focus:bg-white disabled:opacity-60"
                            />
                            <button
                                type="button"
                                onClick={() => sendPrompt()}
                                disabled={!input.trim() || isStreaming || isForceGenerating}
                                className="absolute bottom-3 right-3 rounded-2xl bg-navy p-3 text-white shadow-lg transition hover:bg-violet-700 active:scale-95 disabled:opacity-40"
                                aria-label="Send message to Sparky"
                            >
                                {isStreaming ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                            </button>
                        </div>
                        <p className="mt-3 text-center text-[10px] font-black uppercase tracking-widest text-gray-300">
                            Sparky asks fewer questions when it already has enough to build.
                        </p>
                    </div>
                </div>

                <aside className="border-t border-gray-100 bg-white p-5 lg:border-l lg:border-t-0">
                    <div className="sticky top-24 space-y-5">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-violet-600">Live brief</p>
                            <h4 className="text-xl font-black text-navy">What Sparky knows</h4>
                        </div>
                        <div className="space-y-3 rounded-[1.5rem] border border-gray-100 bg-gray-50 p-4">
                            {readiness.map((item) => (
                                <div key={item.label} className="flex items-center justify-between gap-3 rounded-2xl bg-white px-3 py-2.5">
                                    <span className="text-xs font-black uppercase tracking-widest text-gray-400">{item.label}</span>
                                    {item.done ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <span className="h-2 w-2 rounded-full bg-gray-200" />}
                                </div>
                            ))}
                        </div>
                        <div className="rounded-[1.5rem] border border-violet-100 bg-violet-50 p-4">
                            <div className="mb-3 flex items-center justify-between">
                                <span className="text-xs font-black text-violet-700">Readiness</span>
                                <span className="text-xs font-black text-violet-700">{readyCount}/4</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-white">
                                <motion.div
                                    className="h-full rounded-full bg-violet-600"
                                    animate={{ width: `${(readyCount / 4) * 100}%` }}
                                />
                            </div>
                            <p className="mt-3 text-xs font-bold leading-relaxed text-violet-700/70">
                                Once location, budget, and your vibe are clear, Sparky can create real plan options.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handleForceGenerate}
                            disabled={!canGenerate || isForceGenerating}
                            className="w-full rounded-2xl bg-violet-600 px-4 py-4 text-sm font-black text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-700 active:scale-[0.98] disabled:bg-gray-100 disabled:text-gray-400 disabled:shadow-none"
                        >
                            {isForceGenerating ? <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 inline h-4 w-4" />}
                            Build My Date Plan
                        </button>
                        {!canGenerate && (
                            <p className="text-center text-[11px] font-bold text-gray-400">
                                Add a location, budget, and date goal first.
                            </p>
                        )}
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default DateArchitectChat;
