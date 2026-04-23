import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import {
    Sparkles, Heart, ArrowRight, CheckCircle2, Music, Sunset,
    Wine, Coffee, Zap, TreePine, Palette, Star, Moon, Sun,
    Flame, Snowflake, Compass, DollarSign
} from 'lucide-react';

// ─── Quiz Data ────────────────────────────────────────────────────────────────

const STEPS = [
    {
        id: 'atmosphere',
        step: 1,
        emoji: '🌆',
        title: 'What\'s your dream atmosphere?',
        subtitle: 'Pick the vibe that makes your heart race.',
        multiSelect: false,
        options: [
            {
                id: 'moody',
                label: 'Moody & Intimate',
                description: 'Speakeasies, jazz bars, candlelit corners',
                icon: <Moon className="w-5 h-5" />,
                color: 'from-purple-900 to-indigo-800',
                textColor: 'text-purple-200',
                ring: 'ring-purple-500',
                bg: 'bg-purple-950/40',
            },
            {
                id: 'bright',
                label: 'Bright & Minimal',
                description: 'Gallery hopping, rooftop gardens, modern cafes',
                icon: <Sun className="w-5 h-5" />,
                color: 'from-amber-400 to-orange-400',
                textColor: 'text-amber-900',
                ring: 'ring-amber-400',
                bg: 'bg-amber-50/80',
            },
            {
                id: 'adventurous',
                label: 'Bold & Adventurous',
                description: 'Unique experiences, hidden gems, off-the-beaten-path',
                icon: <Compass className="w-5 h-5" />,
                color: 'from-emerald-600 to-teal-500',
                textColor: 'text-emerald-100',
                ring: 'ring-emerald-500',
                bg: 'bg-emerald-950/40',
            },
            {
                id: 'fancy',
                label: 'Upscale & Refined',
                description: 'Fine dining, premium lounges, exclusive venues',
                icon: <Star className="w-5 h-5" />,
                color: 'from-yellow-500 to-amber-600',
                textColor: 'text-yellow-900',
                ring: 'ring-yellow-400',
                bg: 'bg-yellow-50/80',
            },
        ]
    },
    {
        id: 'energy',
        step: 2,
        emoji: '⚡',
        title: 'How do you two like to spend time?',
        subtitle: 'This shapes the flow of your perfect evening.',
        multiSelect: true,
        options: [
            {
                id: 'food_first',
                label: 'Good Food, Always',
                description: 'A great meal is non-negotiable',
                icon: <Coffee className="w-5 h-5" />,
                color: 'from-orange-400 to-red-400',
                ring: 'ring-orange-400',
                bg: 'bg-orange-50',
            },
            {
                id: 'drinks_vibes',
                label: 'Craft Cocktails & Vibes',
                description: 'Amazing bars with personality',
                icon: <Wine className="w-5 h-5" />,
                color: 'from-rose-500 to-pink-500',
                ring: 'ring-rose-400',
                bg: 'bg-rose-50',
            },
            {
                id: 'music_dance',
                label: 'Live Music & Dancing',
                description: 'Let the rhythm move you both',
                icon: <Music className="w-5 h-5" />,
                color: 'from-violet-600 to-purple-500',
                ring: 'ring-violet-400',
                bg: 'bg-violet-50',
            },
            {
                id: 'outdoor_scenic',
                label: 'Outdoors & Scenic Walks',
                description: 'Parks, waterfronts, city views',
                icon: <TreePine className="w-5 h-5" />,
                color: 'from-green-500 to-emerald-500',
                ring: 'ring-green-400',
                bg: 'bg-green-50',
            },
            {
                id: 'art_culture',
                label: 'Art & Culture',
                description: 'Galleries, shows, creative spaces',
                icon: <Palette className="w-5 h-5" />,
                color: 'from-cyan-500 to-blue-500',
                ring: 'ring-cyan-400',
                bg: 'bg-cyan-50',
            },
            {
                id: 'spontaneous',
                label: 'Spontaneous & Playful',
                description: 'Keep it fun, keep it surprising',
                icon: <Zap className="w-5 h-5" />,
                color: 'from-yellow-400 to-orange-400',
                ring: 'ring-yellow-400',
                bg: 'bg-yellow-50',
            },
        ]
    },
    {
        id: 'budget',
        step: 3,
        emoji: '💰',
        title: 'What\'s your sweet spot?',
        subtitle: 'We\'ll keep every suggestion within your comfort zone.',
        multiSelect: false,
        options: [
            {
                id: 'budget',
                label: 'Keep it Wallet-Friendly',
                description: 'Great dates don\'t require a big budget',
                icon: <Snowflake className="w-5 h-5" />,
                color: 'from-blue-400 to-cyan-400',
                ring: 'ring-blue-400',
                bg: 'bg-blue-50',
                badge: '$ - Under $50/person'
            },
            {
                id: 'moderate',
                label: 'Mid-Range Magic',
                description: 'The sweet spot: quality without the guilt',
                icon: <Sunset className="w-5 h-5" />,
                color: 'from-coral to-orange-400',
                ring: 'ring-coral',
                bg: 'bg-orange-50',
                badge: '$$ - $50–$120/person'
            },
            {
                id: 'upscale',
                label: 'Spare No Expense',
                description: 'Only the best will do for this night',
                icon: <Flame className="w-5 h-5" />,
                color: 'from-yellow-500 to-amber-600',
                ring: 'ring-yellow-500',
                bg: 'bg-yellow-50',
                badge: '$$$ - $120+/person'
            },
        ]
    }
];

// ─── Vibe Mapping to GeneratePlan vibes ───────────────────────────────────────
const ATMOSPHERE_TO_VIBE = {
    moody: 'fancy',
    bright: 'chill',
    adventurous: 'adventurous',
    fancy: 'fancy'
};

// ─── Main Component ───────────────────────────────────────────────────────────

const VibeOnboarding = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [firstName, setFirstName] = useState('');
    const [direction, setDirection] = useState(1); // 1 = forward, -1 = back

    useEffect(() => {
        const init = async () => {
            const { data: { user: u } } = await supabase.auth.getUser();
            if (!u) { navigate('/login'); return; }
            setUser(u);
            setFirstName(u.user_metadata?.first_name || 'there');

            // Already completed onboarding? Skip to dashboard
            const { data: profile } = await supabase
                .from('profiles')
                .select('onboarding_completed')
                .eq('id', u.id)
                .single();
            if (profile?.onboarding_completed) navigate('/dashboard');
        };
        init();
    }, [navigate]);

    const step = STEPS[currentStep];
    const totalSteps = STEPS.length;
    const progress = ((currentStep) / totalSteps) * 100;

    const handleSelect = (optionId) => {
        if (step.multiSelect) {
            const current = answers[step.id] || [];
            if (current.includes(optionId)) {
                setAnswers(prev => ({ ...prev, [step.id]: current.filter(x => x !== optionId) }));
            } else {
                setAnswers(prev => ({ ...prev, [step.id]: [...current, optionId] }));
            }
        } else {
            setAnswers(prev => ({ ...prev, [step.id]: optionId }));
        }
    };

    const isSelected = (optionId) => {
        if (step.multiSelect) return (answers[step.id] || []).includes(optionId);
        return answers[step.id] === optionId;
    };

    const canAdvance = () => {
        const val = answers[step.id];
        if (!val) return false;
        if (step.multiSelect) return val.length > 0;
        return true;
    };

    const handleNext = () => {
        if (!canAdvance()) return;
        if (currentStep < totalSteps - 1) {
            setDirection(1);
            setCurrentStep(prev => prev + 1);
        } else {
            handleSave();
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setDirection(-1);
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleSave = async () => {
        if (!user) return;
        setIsSaving(true);

        // Build a structured vibe profile
        const vibeProfile = {
            atmosphere: answers.atmosphere,
            activities: answers.energy || [],
            budget: answers.budget,
            // Derive primary vibe for AI use
            primaryVibe: ATMOSPHERE_TO_VIBE[answers.atmosphere] || 'chill',
            completedAt: new Date().toISOString()
        };

        try {
            await supabase
                .from('profiles')
                .update({
                    vibe_profile: vibeProfile,
                    onboarding_completed: true
                })
                .eq('id', user.id);
        } catch (err) {
            console.error('Failed to save vibe profile:', err);
        } finally {
            setIsSaving(false);
            navigate('/dashboard');
        }
    };

    const handleSkip = async () => {
        if (!user) return;
        try {
            await supabase
                .from('profiles')
                .update({ onboarding_completed: true })
                .eq('id', user.id);
        } catch (err) {
            console.error('Skip onboarding error:', err);
        }
        navigate('/dashboard');
    };

    // Animation variants
    const variants = {
        enter: (dir) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (dir) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
    };

    return (
        <div className="min-h-screen bg-[#060B1A] flex flex-col items-center justify-start overflow-hidden relative">
            {/* Animated background orbs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-coral/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[100px]" />
                <div className="absolute top-[40%] left-[60%] w-[300px] h-[300px] bg-blue-600/5 rounded-full blur-[80px]" />
            </div>

            <div className="relative z-10 w-full max-w-lg mx-auto px-4 pt-10 pb-20 flex flex-col items-center">
                {/* Logo */}
                <div className="flex items-center gap-2 mb-8">
                    <img src="/datespark-logo.png" alt="DateSpark" className="w-9 h-9 rounded-xl object-cover" />
                    <span className="text-white font-black text-xl tracking-tight">DateSpark</span>
                </div>

                {/* Progress Bar */}
                <div className="w-full mb-8">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-white/40 text-xs font-bold uppercase tracking-widest">
                            Step {currentStep + 1} of {totalSteps}
                        </span>
                        <button
                            onClick={handleSkip}
                            className="text-white/30 text-xs font-bold hover:text-white/60 transition-colors"
                        >
                            Skip for now →
                        </button>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-coral to-pink-500 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress + (100 / totalSteps)}%` }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                        />
                    </div>
                </div>

                {/* Step Content */}
                <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                        key={currentStep}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                        className="w-full"
                    >
                        {/* Step Header */}
                        {currentStep === 0 && (
                            <div className="text-center mb-8">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-coral/10 border border-coral/20 rounded-full mb-4">
                                    <Sparkles className="w-3.5 h-3.5 text-coral" />
                                    <span className="text-coral text-xs font-black uppercase tracking-widest">Vibe Check</span>
                                </div>
                                <h1 className="text-white text-3xl font-black leading-tight mb-2">
                                    Hey {firstName}! 👋
                                </h1>
                                <p className="text-white/50 text-sm font-medium">
                                    Let's personalize your experience so every date feels like it was made just for you.
                                </p>
                            </div>
                        )}

                        {/* Question */}
                        <div className="text-center mb-6">
                            <div className="text-4xl mb-3">{step.emoji}</div>
                            <h2 className="text-white text-xl sm:text-2xl font-black leading-tight mb-1">
                                {step.title}
                            </h2>
                            <p className="text-white/40 text-sm font-medium">{step.subtitle}</p>
                            {step.multiSelect && (
                                <span className="inline-block mt-2 text-white/30 text-xs font-bold uppercase tracking-wider">
                                    Pick all that apply
                                </span>
                            )}
                        </div>

                        {/* Options Grid */}
                        <div className={`grid gap-3 ${step.options.length <= 3 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
                            {step.options.map((option) => {
                                const selected = isSelected(option.id);
                                return (
                                    <motion.button
                                        key={option.id}
                                        onClick={() => handleSelect(option.id)}
                                        whileTap={{ scale: 0.97 }}
                                        className={`relative w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 group
                                            ${selected
                                                ? `border-transparent bg-gradient-to-br ${option.color} shadow-xl`
                                                : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all
                                                ${selected ? 'bg-white/20 text-white' : 'bg-white/10 text-white/50 group-hover:text-white/80'}`}>
                                                {option.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className={`font-black text-sm ${selected ? 'text-white' : 'text-white/80'}`}>
                                                        {option.label}
                                                    </span>
                                                    {selected && (
                                                        <motion.div
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            className="flex-shrink-0"
                                                        >
                                                            <CheckCircle2 className="w-4 h-4 text-white" />
                                                        </motion.div>
                                                    )}
                                                </div>
                                                <p className={`text-xs mt-0.5 leading-snug ${selected ? 'text-white/80' : 'text-white/40'}`}>
                                                    {option.description}
                                                </p>
                                                {option.badge && (
                                                    <span className={`inline-block mt-1.5 text-[10px] font-black px-2 py-0.5 rounded-full
                                                        ${selected ? 'bg-white/20 text-white' : 'bg-white/10 text-white/40'}`}>
                                                        {option.badge}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Navigation Buttons */}
                <div className="flex items-center gap-3 w-full mt-8">
                    {currentStep > 0 && (
                        <button
                            onClick={handleBack}
                            className="flex items-center gap-2 px-5 py-3.5 rounded-2xl border border-white/10 text-white/60 hover:text-white hover:border-white/30 font-black text-sm transition-all"
                        >
                            ← Back
                        </button>
                    )}
                    <motion.button
                        onClick={handleNext}
                        disabled={!canAdvance() || isSaving}
                        whileTap={{ scale: 0.97 }}
                        className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-black text-sm transition-all shadow-xl
                            ${canAdvance() && !isSaving
                                ? 'bg-gradient-to-r from-coral to-pink-500 text-white shadow-coral/30 hover:shadow-coral/50 hover:scale-[1.02]'
                                : 'bg-white/10 text-white/30 cursor-not-allowed'
                            }`}
                    >
                        {isSaving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Saving your vibe...
                            </>
                        ) : currentStep < totalSteps - 1 ? (
                            <>Next <ArrowRight className="w-4 h-4" /></>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4" />
                                Start Planning My Date
                            </>
                        )}
                    </motion.button>
                </div>

                {/* Footer Note */}
                <p className="text-white/20 text-xs text-center mt-6 font-medium leading-relaxed max-w-xs">
                    You can update your Vibe Profile anytime from your settings. This just helps us get it right the first time.
                </p>
            </div>
        </div>
    );
};

export default VibeOnboarding;
