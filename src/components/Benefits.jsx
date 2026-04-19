import React from 'react';
import { Sparkles, Zap, MapPin, Rocket, Shield, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

const Benefits = () => {
    const benefits = [
        {
            icon: <Sparkles className="w-6 h-6 text-coral" />,
            bg: 'bg-coral/10',
            title: 'Real spots, not generic ideas',
            description: 'Plans are built from actual trending restaurants, bars, and events in your city — not outdated listicles or generic suggestions.',
        },
        {
            icon: <Zap className="w-6 h-6 text-amber-500" />,
            bg: 'bg-amber-50',
            title: 'Perfect for last-minute plans',
            description: 'Generate a curated date night in under 60 seconds. Ideal when someone asks "so what are we doing tonight?"',
        },
        {
            icon: <MapPin className="w-6 h-6 text-violet-500" />,
            bg: 'bg-violet-50',
            title: 'Navigation & tickets built-in',
            description: 'Every stop comes with direct Google Maps directions and ticket window links for events — no extra research needed.',
        },
        {
            icon: <Rocket className="w-6 h-6 text-sky-500" />,
            bg: 'bg-sky-50',
            title: 'One button, a full night out',
            description: 'No complex filters or endless menus. Tell us your vibe and budget — we handle the sequencing, timing, and everything else.',
        },
        {
            icon: <Shield className="w-6 h-6 text-green-500" />,
            bg: 'bg-green-50',
            title: 'Vet-rated quality guarantee',
            description: 'Every venue is cross-referenced with real ratings and reviews. We don\'t surface hidden gems that are actually just mediocre.',
        },
        {
            icon: <RefreshCw className="w-6 h-6 text-pink-500" />,
            bg: 'bg-pink-50',
            title: 'Swap anything in one tap',
            description: 'Not feeling a spot? Hit swap and our AI instantly replaces it with a better alternative — no regenerating the whole plan.',
        },
    ];

    return (
        <section id="benefits" className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <span className="inline-block text-xs font-black text-violet-500 uppercase tracking-[0.2em] bg-violet-50 px-4 py-1.5 rounded-full mb-5">
                        Why DateSpark
                    </span>
                    <h2 className="text-4xl md:text-5xl font-black text-navy leading-tight">
                        Why settle for another<br />"dinner and a movie"?
                    </h2>
                    <p className="mt-4 text-gray-500 text-lg font-medium leading-relaxed">
                        We've helped thousands of couples rediscover their city, minus the planning fatigue. Every plan is unique, curated, and ready to go.
                    </p>
                </div>

                {/* Benefits grid */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {benefits.map((b, i) => (
                        <div
                            key={i}
                            className="group p-7 rounded-3xl border border-gray-100 bg-white hover:border-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 space-y-4"
                        >
                            <div className={`w-12 h-12 rounded-2xl ${b.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                                {b.icon}
                            </div>
                            <h3 className="font-black text-navy text-lg leading-snug">{b.title}</h3>
                            <p className="text-gray-500 text-sm leading-relaxed">{b.description}</p>
                        </div>
                    ))}
                </div>

                {/* CTA strip */}
                <div className="mt-16 bg-navy rounded-3xl p-10 md:p-14 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-coral/10 rounded-full blur-[100px] pointer-events-none" />
                    <div className="relative z-10">
                        <h3 className="text-3xl md:text-4xl font-black text-white mb-3">
                            Ready to plan your best date yet?
                        </h3>
                        <p className="text-gray-400 font-medium mb-8 max-w-md mx-auto">
                            Your first plan is completely free. No credit card, no commitment.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                to="/signup"
                                className="px-8 py-4 bg-coral text-white font-black rounded-2xl hover:-translate-y-0.5 hover:shadow-xl hover:shadow-coral/30 transition-all duration-200 text-base"
                            >
                                Start Free — No Card Needed
                            </Link>
                            <button
                                onClick={() => window.open('/demo', '_blank')}
                                className="px-8 py-4 bg-white/10 text-white border border-white/20 font-black rounded-2xl hover:bg-white/20 transition-all text-base"
                            >
                                Try the Demo First
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Benefits;
