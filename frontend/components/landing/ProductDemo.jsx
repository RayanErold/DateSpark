import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Play, MapPin, Clock, Heart, Check } from 'lucide-react';

const PREVIEW_STEPS = [
    {
        time: '7:00 PM',
        icon: '🌆',
        venue: 'The High Line',
        type: 'Scenic Stroll',
        desc: 'Kick off the evening with iconic NYC views along the elevated park.',
    },
    {
        time: '8:15 PM',
        icon: '🍹',
        venue: 'The Standard High Line',
        type: 'Cocktails & Views',
        desc: 'Craft cocktails with sweeping sunset views over the Hudson River.',
    },
    {
        time: '9:30 PM',
        icon: '🍽️',
        venue: "L'Artusi",
        type: 'Intimate Dinner',
        desc: "Upscale Italian small plates in one of the West Village's best-kept secrets.",
    },
];

const ProductDemo = () => {
    return (
        <section id="demo" className="py-24 bg-navy relative overflow-hidden">
            {/* Background glows */}
            <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-coral/25 via-navy to-navy pointer-events-none -z-0" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-gold/10 rounded-full blur-[120px] opacity-60 pointer-events-none -z-0" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                {/* Section Label */}
                <div className="text-center mb-14">
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-full text-sm font-bold backdrop-blur-sm border border-white/10 shadow-xl">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-coral opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-coral" />
                        </span>
                        Live Interactive Demo
                    </span>
                    <h2 className="mt-6 text-4xl md:text-5xl font-black text-white leading-tight">
                        See exactly what you get.<br />
                        <span className="text-coral">In under 60 seconds.</span>
                    </h2>
                    <p className="mt-4 text-gray-400 text-lg font-medium max-w-xl mx-auto">
                        No account needed. Try it now and get a real, AI-curated date night — free.
                    </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-10 lg:gap-20 items-start">

                    {/* LEFT — Itinerary Preview */}
                    <div className="space-y-4">
                        <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-5">
                            Sample Itinerary — West Village, NYC
                        </p>

                        {PREVIEW_STEPS.map((step, i) => (
                            <div
                                key={i}
                                className={`relative bg-white/5 border border-white/10 rounded-2xl p-5 flex gap-4 items-start hover:bg-white/10 transition-all duration-200 group ${i > 0 ? 'opacity-80' : ''}`}
                            >
                                {/* Step number + connector */}
                                <div className="flex flex-col items-center gap-1 shrink-0">
                                    <div className="w-9 h-9 rounded-xl bg-coral/20 text-coral flex items-center justify-center text-lg">
                                        {step.icon}
                                    </div>
                                    {i < PREVIEW_STEPS.length - 1 && (
                                        <div className="w-px h-full min-h-[24px] bg-white/10 mt-1" />
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-black text-coral uppercase tracking-widest">{step.type}</span>
                                        <span className="text-gray-600 text-xs">·</span>
                                        <span className="flex items-center gap-1 text-xs font-bold text-gray-500">
                                            <Clock className="w-3 h-3" />{step.time}
                                        </span>
                                    </div>
                                    <h4 className="text-white font-black text-base leading-snug mb-1">{step.venue}</h4>
                                    <p className="text-gray-400 text-sm leading-relaxed">{step.desc}</p>
                                </div>
                            </div>
                        ))}

                        {/* Locked teaser */}
                        <div className="relative bg-white/5 border border-white/10 rounded-2xl p-5 overflow-hidden">
                            <div className="absolute inset-0 backdrop-blur-lg bg-navy/70 flex flex-col items-center justify-center z-10 rounded-2xl border border-white/10">
                                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center mb-2">
                                    <span className="text-lg">🔒</span>
                                </div>
                                <p className="text-white font-black text-sm">+2 more stops unlocked on sign up</p>
                                <p className="text-gray-400 text-xs mt-1">Free account · No credit card</p>
                            </div>
                            {/* Ghost content for depth */}
                            <div className="h-16 opacity-0 pointer-events-none">placeholder</div>
                        </div>

                        {/* Trust signals */}
                        <div className="flex items-center gap-6 pt-2 pl-1">
                            {[
                                { icon: <MapPin className="w-3.5 h-3.5" />, label: 'Real venues' },
                                { icon: <Clock className="w-3.5 h-3.5" />, label: 'Timed itinerary' },
                                { icon: <Heart className="w-3.5 h-3.5" />, label: 'Vibe-matched' },
                            ].map((t, i) => (
                                <div key={i} className="flex items-center gap-1.5 text-gray-400 text-xs font-bold">
                                    <span className="text-coral">{t.icon}</span>
                                    {t.label}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT — CTA Widget */}
                    <div className="lg:sticky lg:top-24 space-y-5">
                        {/* Main CTA Card */}
                        <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/15 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
                            {/* Corner shimmer */}
                            <div className="absolute -top-12 -right-12 w-40 h-40 bg-coral/15 rounded-full blur-2xl group-hover:bg-coral/25 transition-all duration-500" />

                            <div className="relative z-10">
                                <div className="w-14 h-14 bg-coral/20 rounded-2xl flex items-center justify-center mb-5">
                                    <Sparkles className="w-7 h-7 text-coral" />
                                </div>
                                <h3 className="text-2xl font-black text-white mb-2">Try The Engine Free</h3>
                                <p className="text-gray-400 font-medium text-sm mb-7 leading-relaxed">
                                    Generate your own real date night itinerary — drop your neighbourhood, pick a vibe, and watch the magic.
                                </p>

                                {/* Feature checklist */}
                                <ul className="space-y-2.5 mb-8">
                                    {[
                                        'Real restaurants & hidden gems',
                                        'AI-curated, perfectly timed',
                                        'Maps, links & booking built-in',
                                        'No credit card required',
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-center gap-2.5 text-sm text-gray-300 font-medium">
                                            <div className="w-5 h-5 rounded-full bg-coral/20 flex items-center justify-center shrink-0">
                                                <Check className="w-3 h-3 text-coral" />
                                            </div>
                                            {item}
                                        </li>
                                    ))}
                                </ul>

                                {/* Primary button */}
                                <button
                                    onClick={() => window.open('/demo', '_blank')}
                                    className="w-full bg-coral hover:bg-coral/90 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-coral/30 hover:shadow-coral/50 hover:-translate-y-0.5 active:scale-95 transition-all duration-200 text-base group/btn"
                                >
                                    <Play className="w-4 h-4 fill-white" />
                                    Open Interactive Demo
                                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                </button>

                                {/* Secondary — sign up */}
                                <div className="mt-4 text-center">
                                    <span className="text-gray-500 text-sm font-medium">Already convinced?&nbsp;</span>
                                    <Link to="/signup" className="text-coral font-black text-sm hover:underline">
                                        Create a free account →
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Social proof mini bar */}
                        <div className="flex items-center justify-center gap-6 py-3 px-5 bg-white/5 border border-white/10 rounded-2xl">
                            <div className="flex -space-x-2">
                                {['photo-1534528741775-53994a69daeb', 'photo-1506794778202-cad84cf45f1d', 'photo-1494790108377-be9c29b29330'].map((id, i) => (
                                    <img
                                        key={i}
                                        src={`https://images.unsplash.com/${id}?w=60&h=60&fit=crop`}
                                        alt="User"
                                        className="w-8 h-8 rounded-full border-2 border-navy object-cover"
                                    />
                                ))}
                            </div>
                            <p className="text-gray-300 text-xs font-bold">
                                Joined by <span className="text-white">5,000+ couples</span> this month
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ProductDemo;
