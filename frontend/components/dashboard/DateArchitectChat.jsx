import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, User, Bot, Loader2, MapPin, DollarSign, CheckCircle2, MessageCircle, Compass, Locate, Settings, ChevronDown, ArrowRight } from 'lucide-react';

const STARTER_PROMPTS = [
    { icon: "🥂", text: "Anniversary", color: "from-pink-500 to-rose-600", prompt: "Plan an unforgettable anniversary night — intimate dinner, a beautiful walk, and a rooftop moment." },
    { icon: "🗺️", text: "First Date", color: "from-blue-500 to-indigo-600", prompt: "It's a first date. Keep it fun, low-pressure, and conversation-friendly — coffee, a stroll, maybe a surprise." },
    { icon: "🌆", text: "Local Gems", color: "from-emerald-500 to-teal-600", prompt: "Show me the side of this city most people miss — local bars, underground spots, hole-in-the-wall restaurants." },
    { icon: "⚡", text: "Spontaneous", color: "from-orange-500 to-amber-600", prompt: "We have 3 hours, no plan, and want to feel alive. Make it bold, unexpected, and impossible to forget." },
    { icon: "🕯️", text: "Cozy Vibes", color: "from-amber-700 to-orange-800", prompt: "Rainy day cozy vibes — fireplaces, bookstores, warm drinks, and intimate conversation spots." },
    { icon: "🥃", text: "Speakeasies", color: "from-slate-700 to-slate-900", prompt: "A secret speakeasy tour — hidden entrances, low lights, craft cocktails, and a mysterious atmosphere." },
    { icon: "🎨", text: "Artistic", color: "from-violet-500 to-purple-700", prompt: "Artistic & Intellectual — gallery hopping, jazz bars, and thought-provoking cultural spots." },
    { icon: "🍦", text: "Playful", color: "from-pink-400 to-fuchsia-500", prompt: "Sweet & Playful — arcades, dessert bars, lighthearted fun, and maybe some competitive mini-golf." },
    { icon: "😂", text: "Comedy Night", color: "from-yellow-400 to-orange-500", prompt: "A night of laughter — start with a trendy dinner, then hit the best comedy clubs for some stand-up magic." },
    { icon: "🏀", text: "Active/Sporty", color: "from-red-600 to-orange-700", prompt: "Competitive and active — bowling, ping pong bars, or an indoor climbing session followed by protein-rich bites." },
    { icon: "🎵", text: "Live Gigs", color: "from-indigo-600 to-blue-800", prompt: "For the music lovers — find a live jazz set or an indie gig, with pre-show drinks at a vinyl bar." },
    { icon: "💎", text: "Luxurious", color: "from-amber-400 to-yellow-600", prompt: "Pure luxury — fine dining with a view, chauffeur vibes, and the most exclusive spots in the city." },
    { icon: "🍕", text: "Foodie Tour", color: "from-red-500 to-rose-700", prompt: "A culinary journey — hit 3 different spots for appetizers, mains, and desserts. The ultimate foodie adventure." },
    { icon: "💬", text: "Deep Talk", color: "from-blue-400 to-cyan-500", prompt: "Connection focused — quiet wine bars, peaceful waterfront walks, and places meant for hours of deep conversation." },
    { icon: "🗼", text: "Rooftop Hop", color: "from-indigo-400 to-purple-500", prompt: "High altitude vibes — a night dedicated to the best views, rooftop cocktails, and city lights." },
    { icon: "🐕", text: "Dog Friendly", color: "from-amber-400 to-orange-500", prompt: "A date for three — spots that welcome our furry friend, including dog-friendly patios and park strolls." },
    { icon: "🍃", text: "Vegan Night", color: "from-green-500 to-emerald-600", prompt: "The ultimate plant-based date — high-end vegan dining and eco-conscious cocktail spots." },
    { icon: "🚣", text: "Outdoor Adv.", color: "from-sky-500 to-blue-600", prompt: "Active outdoors — kayaking, bike rides, or a scenic hike followed by a casual outdoor picnic." },
    { icon: "🎮", text: "Gamer Date", color: "from-fuchsia-600 to-purple-800", prompt: "Retro and modern gaming — arcade bars, e-sports lounges, and neon-lit late-night snacks." },
    { icon: "🌙", text: "Late Night", color: "from-navy to-slate-900", prompt: "For the night owls — 24/7 diners, late-night jazz, and secret spots that only wake up after midnight." }
];

const DateArchitectChat = ({ userId, location: initialLocation, budget: initialBudget, radius: initialRadius, onConceptSelected, onSettingsChange }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamedText, setStreamedText] = useState('');
    const [extractedConcepts, setExtractedConcepts] = useState(null);
    const scrollRef = useRef(null);

    // Dynamic Preferences
    const [location, setLocation] = useState(initialLocation || '');
    const [budget, setBudget] = useState(initialBudget || '');
    const [radius, setRadius] = useState(initialRadius || 8046); // Default 5 miles
    const [showSettings, setShowSettings] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);

    // Sync settings with parent
    useEffect(() => {
        if (onSettingsChange) {
            onSettingsChange({ location, budget, radius });
        }
    }, [location, budget, radius, onSettingsChange]);

    // Initial greeting
    useEffect(() => {
        if (messages.length === 0) {
            setMessages([
                { 
                    role: 'assistant', 
                    content: `Hey! I'm Sparky. I see we're planning something special in ${location || 'the city'}. What's the vibe you're dreaming of tonight?` 
                }
            ]);
        }
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, streamedText]);

    const handlePreciseLocation = () => {
        setLocationLoading(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    try {
                        const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`);
                        const data = await response.json();
                        if (data.results[0]) {
                            setLocation(data.results[0].formatted_address);
                        }
                    } catch (err) {
                        console.error("Geocoding error", err);
                    }
                    setLocationLoading(false);
                },
                () => setLocationLoading(false)
            );
        } else {
            setLocationLoading(false);
        }
    };

    const handleSend = async (overrideInput = null) => {
        const textToSend = typeof overrideInput === 'string' ? overrideInput : input;
        if (!textToSend.trim() || isStreaming) return;

        // Ensure location is present
        if (!location.trim()) {
            setMessages(prev => [...prev, 
                { role: 'user', content: textToSend },
                { role: 'assistant', content: "I'd love to help, but I need to know where you are! Please update your location in the settings above so I can find the best spots for you." }
            ]);
            setInput('');
            return;
        }

        const userMessage = { role: 'user', content: textToSend };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        if (typeof overrideInput !== 'string') setInput('');
        setIsStreaming(true);
        setStreamedText('');
        setExtractedConcepts(null);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/architect-stream`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: newMessages,
                    userId,
                    location,
                    budget,
                    radius
                })
            });

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullContent = '';

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') continue;
                        
                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.text) {
                                fullContent += parsed.text;
                                setStreamedText(fullContent);
                            }
                        } catch (e) {}
                    }
                }
            }

            if (fullContent.includes('READY')) {
                const jsonPart = fullContent.split('READY')[1];
                try {
                    const data = JSON.parse(jsonPart.match(/\{.*\}/s)[0]);
                    setExtractedConcepts(data.concepts);
                } catch (e) {
                    console.error("Failed to parse concepts from stream", e);
                }
            }

            setMessages(prev => [...prev, { role: 'assistant', content: fullContent }]);
            setStreamedText('');
            setIsStreaming(false);

        } catch (err) {
            console.error("Streaming error:", err);
            setIsStreaming(false);
        }
    };

    const renderMessageContent = (content, isLast, role) => {
        let text = content.split('READY')[0];
        let options = [];

        const optionsMatch = text.match(/\[OPTIONS:\s*([\s\S]*?)\]/i);
        if (optionsMatch) {
            options = optionsMatch[1].split('|').map(o => o.trim().replace(/\n/g, ' '));
            text = text.replace(optionsMatch[0], '');
        }

        return (
            <div className="space-y-4">
                <div className="whitespace-pre-wrap leading-relaxed">{text.trim()}</div>
                {options.length > 0 && isLast && role === 'assistant' && (
                    <div className="flex flex-wrap gap-2 pt-2">
                        {options.map((opt, i) => (
                            <motion.button
                                key={i}
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleSend(opt)}
                                disabled={isStreaming}
                                className="text-[12px] font-black px-4 py-2 bg-gradient-to-br from-violet-50 to-white text-violet-600 hover:text-violet-700 rounded-xl transition-all border-2 border-violet-100/50 shadow-sm disabled:opacity-50 text-left flex items-center gap-2"
                            >
                                <MessageCircle className="w-3 h-3" />
                                {opt}
                            </motion.button>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-[750px] bg-white rounded-[2.5rem] border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.08)] overflow-hidden relative group">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 left-0 w-full h-full -z-10 bg-gradient-to-b from-violet-50/30 to-transparent" />
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-violet-400/5 rounded-full blur-3xl group-hover:bg-violet-400/10 transition-colors duration-1000" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-pink-400/5 rounded-full blur-3xl group-hover:bg-pink-400/10 transition-colors duration-1000" />

            {/* Header & Quick Config */}
            <div className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-20">
                <div className="p-6 pb-2 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/20 rotate-3">
                                <Sparkles className="w-6 h-6 text-white" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-4 border-white rounded-full shadow-sm" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-xl font-black text-navy tracking-tight">Sparky</h3>
                                <span className="px-2 py-0.5 bg-violet-100 text-violet-600 text-[10px] font-black uppercase tracking-widest rounded-full">AI Architect</span>
                            </div>
                            <p className="text-[11px] font-bold text-gray-400 flex items-center gap-1.5 uppercase tracking-tighter">
                                Online &bull; Ready to build
                            </p>
                        </div>
                    </div>
                </div>

                <div className="px-6 pb-6 space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Location Pill */}
                        <div className="flex-1 min-w-[200px] relative group">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-500" />
                            <input 
                                type="text" 
                                placeholder="Where are we?"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                className="w-full pl-11 pr-10 py-3 bg-violet-50/50 border-2 border-violet-100/50 rounded-2xl text-[13px] font-bold text-navy focus:border-violet-500 focus:bg-white outline-none transition-all"
                            />
                            <button 
                                onClick={handlePreciseLocation}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-violet-600 hover:bg-violet-100 rounded-lg transition-colors"
                            >
                                {locationLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Locate className="w-3.5 h-3.5" />}
                            </button>
                        </div>

                        {/* Budget Pill */}
                        <div className="w-[120px] relative group">
                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                            <input 
                                type="text" 
                                placeholder="Budget"
                                value={budget}
                                onChange={(e) => setBudget(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-emerald-50/50 border-2 border-emerald-100/50 rounded-2xl text-[13px] font-bold text-navy focus:border-emerald-500 focus:bg-white outline-none transition-all"
                            />
                        </div>

                        {/* Radius Pill Trigger */}
                        <button 
                            onClick={() => setShowSettings(!showSettings)}
                            className={`px-4 py-3 rounded-2xl border-2 transition-all flex items-center gap-2 ${
                                showSettings 
                                ? 'bg-violet-600 border-violet-600 text-white shadow-lg' 
                                : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100'
                            }`}
                        >
                            <Compass className={`w-4 h-4 ${showSettings ? 'animate-spin-slow' : ''}`} />
                            <span className="text-[13px] font-bold">{(radius / 1609.34).toFixed(1)}mi</span>
                            <ChevronDown className={`w-4 h-4 transition-transform ${showSettings ? 'rotate-180' : ''}`} />
                        </button>
                    </div>

                    <AnimatePresence>
                        {showSettings && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="p-5 bg-gradient-to-br from-violet-50 to-white rounded-[2rem] border-2 border-violet-100 shadow-inner">
                                    <div className="flex justify-between items-center mb-4 px-1">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-violet-500 rounded-full animate-pulse" />
                                            <span className="text-[10px] font-black text-violet-600 uppercase tracking-[0.2em]">Architect Search Radius</span>
                                        </div>
                                        <span className="text-sm font-black text-navy">{(radius / 1609.34).toFixed(1)} MILES</span>
                                    </div>
                                    <input 
                                        type="range"
                                        min="804"
                                        max="32186"
                                        step="804"
                                        value={radius}
                                        onChange={(e) => setRadius(Number(e.target.value))}
                                        className="w-full h-2 bg-violet-100 rounded-lg appearance-none cursor-pointer accent-violet-600"
                                    />
                                    <div className="flex justify-between mt-2 px-1 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                        <span>Nearby (0.5mi)</span>
                                        <span>City Wide (20mi)</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Chat Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth custom-scrollbar">
                {messages.map((m, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`max-w-[85%] flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${m.role === 'user' ? 'bg-navy rotate-3' : 'bg-white border border-gray-100 -rotate-3'}`}>
                                {m.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-violet-600" />}
                            </div>
                            <div className={`p-5 rounded-[2rem] text-[15px] font-medium shadow-sm transition-all ${
                                m.role === 'user' 
                                ? 'bg-navy text-white rounded-tr-none shadow-navy/10' 
                                : 'bg-white text-navy border border-gray-100/50 rounded-tl-none shadow-gray-200/50'
                            }`}>
                                {renderMessageContent(m.content, idx === messages.length - 1 && !isStreaming, m.role)}
                            </div>
                        </div>
                    </motion.div>
                ))}

                {messages.length === 1 && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4 px-2 pt-4"
                    >
                        <div className="flex items-center justify-between">
                            <h4 className="text-[10px] font-black text-violet-500 uppercase tracking-widest flex items-center gap-2">
                                <Sparkles className="w-3 h-3" /> Get Inspired
                            </h4>
                            <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">Scroll for more</span>
                        </div>
                        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide snap-x">
                            {STARTER_PROMPTS.map((starter, i) => (
                                <motion.button
                                    key={i}
                                    whileHover={{ y: -5, scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleSend(starter.prompt)}
                                    className="flex-shrink-0 w-[140px] snap-center group relative overflow-hidden rounded-3xl aspect-[4/5] p-4 flex flex-col justify-end text-left shadow-lg"
                                >
                                    <div className={`absolute inset-0 bg-gradient-to-br ${starter.color} opacity-90 group-hover:opacity-100 transition-opacity`} />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                    <div className="relative z-10 space-y-1.5">
                                        <span className="text-2xl block group-hover:scale-125 transition-transform duration-500">{starter.icon}</span>
                                        <span className="text-[11px] font-black text-white leading-tight block uppercase tracking-tight">
                                            {starter.text}
                                        </span>
                                    </div>
                                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ArrowRight className="w-3 h-3 text-white" />
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {isStreaming && (
                    <div className="flex justify-start">
                        <div className="max-w-[85%] flex gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-white border border-gray-100 -rotate-3 flex items-center justify-center shrink-0 shadow-sm">
                                <Bot className="w-5 h-5 text-violet-600" />
                            </div>
                            <div className="p-5 rounded-[2rem] text-[15px] bg-white text-navy shadow-sm border border-gray-100/50 rounded-tl-none flex flex-col gap-3 min-w-[200px]">
                                {streamedText ? (
                                    <>
                                        {renderMessageContent(streamedText, false, 'assistant')}
                                        <div className="flex gap-1 items-center mt-2">
                                            <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-1.5 h-1.5 bg-violet-400 rounded-full" />
                                            <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }} className="w-1.5 h-1.5 bg-violet-400 rounded-full" />
                                            <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }} className="w-1.5 h-1.5 bg-violet-400 rounded-full" />
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex items-center gap-3 text-violet-500 font-bold italic">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span className="text-sm uppercase tracking-widest text-[11px] font-black">Architecting ideas...</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Extracted Concepts Display */}
                <AnimatePresence>
                    {extractedConcepts && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            className="space-y-6 pt-10 border-t border-gray-100 relative"
                        >
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-6 py-1 border border-gray-100 rounded-full text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
                                Blueprints Ready
                            </div>
                            
                            <div className="grid grid-cols-1 gap-4">
                                {extractedConcepts.map((concept, idx) => (
                                    <motion.div
                                        key={idx}
                                        whileHover={{ y: -4, shadow: "0 20px 40px rgba(124, 58, 237, 0.1)" }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => onConceptSelected(concept)}
                                        className="p-6 bg-gradient-to-br from-violet-50/50 to-white border-2 border-violet-100/50 rounded-[2rem] cursor-pointer hover:border-violet-300 transition-all flex items-center justify-between group shadow-sm"
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 bg-violet-500 rounded-full" />
                                                <h4 className="font-black text-navy text-lg tracking-tight">{concept.title}</h4>
                                            </div>
                                            <p className="text-sm text-navy/60 font-medium pl-4">{concept.description}</p>
                                        </div>
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-gray-100 group-hover:bg-violet-600 group-hover:border-violet-600 transition-all shadow-sm">
                                            <CheckCircle2 className="w-6 h-6 text-violet-600 group-hover:text-white transition-colors" />
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Input Area */}
            <div className="p-6 bg-white/80 backdrop-blur-xl border-t border-gray-100 z-20">
                <div className="relative flex items-center gap-4">
                    <div className="flex-1 relative group">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                            placeholder="Tell Sparky more about your vision..."
                            rows={1}
                            className="w-full px-7 py-5 bg-gray-50/50 border-2 border-gray-100 rounded-[2rem] focus:outline-none focus:border-violet-500/50 text-[15px] font-bold text-navy resize-none pr-16 transition-all shadow-inner placeholder:text-gray-400 placeholder:font-medium"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2">
                             <button
                                onClick={handleSend}
                                disabled={!input.trim() || isStreaming}
                                className="p-3 bg-navy text-white rounded-2xl hover:bg-navy/90 disabled:opacity-50 transition-all shadow-lg active:scale-90 group"
                            >
                                {isStreaming ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />}
                            </button>
                        </div>
                    </div>
                </div>
                <p className="text-center text-[10px] font-bold text-gray-300 mt-4 uppercase tracking-widest">
                    Sparky learns from your conversation to build the perfect plan
                </p>
            </div>
        </div>
    );
};

export default DateArchitectChat;
