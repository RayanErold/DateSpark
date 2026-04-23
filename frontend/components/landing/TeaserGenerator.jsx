import React, { useState } from 'react';
import { Sparkles, MapPin, Clock, Lock, ArrowRight, Utensils, Music, Footprints, Camera } from 'lucide-react';

const TeaserGenerator = () => {
    const [vibe, setVibe] = useState('chill');
    const [isGenerating, setIsGenerating] = useState(false);
    const [showPlan, setShowPlan] = useState(false);

    const vibes = [
        { id: 'chill', label: 'Chill & Cozy', icon: <Utensils className="w-4 h-4" /> },
        { id: 'fancy', label: 'Fancy & Romantic', icon: <Sparkles className="w-4 h-4" /> },
        { id: 'active', label: 'Active & Adventurous', icon: <Footprints className="w-4 h-4" /> },
        { id: 'hidden', label: 'Hidden Gems', icon: <MapPin className="w-4 h-4" /> },
    ];

    const itineraries = {
        chill: [
            { time: '6:30 PM', type: 'Artisan Coffee & Books', icon: <Utensils /> },
            { time: '7:45 PM', type: 'Quiet Waterfront Walk', icon: <Footprints /> },
            { time: '9:00 PM', type: 'Jazz & Wine Cellar', icon: <Music /> },
        ],
        fancy: [
            { time: '7:00 PM', type: 'Rooftop Cocktail Hour', icon: <Music /> },
            { time: '8:30 PM', type: 'Michelin-star Fusion', icon: <Utensils /> },
            { time: '10:30 PM', type: 'Speakeasy Nightcap', icon: <MapPin /> },
        ],
        active: [
            { time: '10:00 AM', type: 'Scenic Ridge Hike', icon: <Footprints /> },
            { time: '12:30 PM', type: 'Local Farm Picnic', icon: <Utensils /> },
            { time: '2:00 PM', type: 'Kayaking at Sunset', icon: <Camera /> },
        ],
        hidden: [
            { time: '6:00 PM', type: 'Undiscovered Gallery', icon: <Camera /> },
            { time: '7:30 PM', type: 'Back-alley Ramen Shop', icon: <Utensils /> },
            { time: '9:30 PM', type: 'Vintage Vinyl Bar', icon: <Music /> },
        ]
    };

    const handleGenerate = () => {
        setIsGenerating(true);
        setShowPlan(false);
        setTimeout(() => {
            setIsGenerating(false);
            setShowPlan(true);
        }, 1200);
    };

    return (
        <section id="demo" className="section-padding bg-navy text-white overflow-hidden relative">
            <div className="container-custom">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    {/* Left Side: Controls */}
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-coral/10 text-coral rounded-full text-sm font-bold uppercase tracking-wider">
                                <Sparkles className="w-4 h-4" /> Instant Magic
                            </div>
                            <h2 className="text-4xl md:text-5xl font-black leading-tight">
                                Build your perfect <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-coral to-pink-400">Date in 2 seconds.</span>
                            </h2>
                            <p className="text-gray-400 text-lg">
                                Pick your vibe, and we'll show you exactly what your night could look like.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-3">
                                {vibes.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => setVibe(item.id)}
                                        className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${vibe === item.id
                                                ? 'border-coral bg-coral/10 text-white shadow-lg'
                                                : 'border-white/5 bg-white/5 text-gray-400 hover:border-white/20'
                                            }`}
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${vibe === item.id ? 'bg-coral text-white' : 'bg-white/10'}`}>
                                            {item.icon}
                                        </div>
                                        <span className="font-bold text-sm">{item.label}</span>
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating}
                                className="w-full btn-primary py-5 rounded-2xl flex items-center justify-center gap-3 text-lg group"
                            >
                                {isGenerating ? (
                                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        See my plan <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Right Side: The Teaser Plan */}
                    <div className="relative">
                        <div className={`bg-white rounded-[40px] p-8 md:p-12 shadow-2xl transition-all duration-700 transform ${showPlan ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-0'}`}>
                            <div className="space-y-8">
                                <div className="flex items-center justify-between border-b border-gray-100 pb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-coral/10 rounded-2xl flex items-center justify-center text-coral">
                                            <MapPin className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-navy text-xl">Saturday Night</h3>
                                            <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">{vibe} mood • 2 people</p>
                                        </div>
                                    </div>
                                    <div className="bg-green-50 text-green-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase">
                                        Verified Plan
                                    </div>
                                </div>

                                <div className="space-y-6 relative">
                                    {/* The Blurry Itinerary */}
                                    {itineraries[vibe]?.map((step, idx) => (
                                        <div key={idx} className="flex gap-6 items-start relative">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="w-10 h-10 bg-navy text-white rounded-xl flex items-center justify-center shadow-lg relative z-10">
                                                    <Clock className="w-5 h-5" />
                                                </div>
                                                {idx !== itineraries[vibe].length - 1 && (
                                                    <div className="w-0.5 h-16 bg-gray-100 border-dashed border-l-2" />
                                                )}
                                            </div>
                                            <div className="flex-grow pt-1 overflow-hidden">
                                                <div className="text-sm font-bold text-gray-400 mb-1">{step.time}</div>
                                                <div className="relative">
                                                    {/* The text we want to tease */}
                                                    <div className="text-xl font-black text-navy filter blur-md select-none">
                                                        Secret Romantic Location
                                                    </div>
                                                    <div className="text-sm text-gray-500 font-medium">
                                                        {step.type}
                                                    </div>

                                                    {/* "Unlock" Badge overlay */}
                                                    <div className="absolute inset-0 flex items-center justify-end">
                                                        <div className="bg-white/80 backdrop-blur-sm border border-gray-100 px-2 py-1 rounded-lg text-[10px] font-black text-coral flex items-center gap-1 shadow-sm">
                                                            <Lock className="w-3 h-3" /> UNLOCK
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Overlay for the whole results area */}
                                    <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-white via-white/40 to-transparent z-20" />

                                    <div className="absolute inset-x-0 -bottom-6 flex justify-center z-30">
                                        <a
                                            href="#waitlist"
                                            className="bg-navy text-white px-8 py-4 rounded-2xl font-black text-lg shadow-xl hover:scale-105 transition-all flex items-center gap-3 animate-bounce"
                                        >
                                            Reveal these spots <Lock className="w-5 h-5" />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Background Decoration */}
                        <div className="absolute -top-12 -right-12 -z-10 w-64 h-64 bg-coral/10 rounded-full blur-3xl" />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default TeaserGenerator;
