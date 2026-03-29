import React from 'react';
import { Check, ArrowRight, Star, Heart } from 'lucide-react';

const Pricing = () => {
    const plans = [
        {
            name: "The Spark",
            tagline: "Experience the magic of stress-free planning.",
            price: "$0",
            period: "/forever",
            features: [
                { text: "1-2 Premium Date Ideas", icon: Star },
                { text: "Preview Itineraries (First 2 stops)", icon: Check },
                { text: "Save 2 Favorite Dates", icon: Heart },
                { text: "Limited 'Switch Up' (1 change only)", icon: Check, muted: true }
            ],
            cta: "Try for Free",
            highlight: false,
            className: "bg-white/5 border-white/10 text-white hover:bg-white/10"
        },
        {
            name: "24-Hour Pass",
            tagline: "The instant plan for a perfect tonight.",
            price: "$1.99",
            period: "/24hr",
            features: [
                { text: "Unlimited Full 5-Stop Itineraries", icon: Star },
                { text: "Unlimited 'Switch Up' (Found a spot you don't love? Swap it!)", icon: Heart },
                { text: "Book Tables & Order Rides In-App", icon: Check },
                { text: "Save Unlimited Favorites", icon: Check },
                { text: "Instant Directions", icon: Check }
            ],
            cta: "Unlock My Date Night",
            highlight: true,
            badge: "MOST POPULAR FOR TONIGHT",
            className: "bg-white text-navy border-white shadow-[0_20px_50px_rgba(244,63,94,0.3)] scale-[1.05]"
        },
        {
            name: "DateSpark Plus",
            tagline: "For couples who never want the magic to end.",
            price: "$9.99",
            period: "/mo",
            features: [
                { text: "Everything in the Daily Pass", icon: Star },
                { text: "Advanced AI Customizer (Tweak your vibe)", icon: Check },
                { text: "7-Day Recycle Bin (Recover deleted dates)", icon: Heart },
                { text: "Anniversary & Special Occasion Planning", icon: Star },
                { text: "Priority Access to New Features", icon: Check }
            ],
            cta: "Get DateSpark Plus",
            highlight: false,
            className: "bg-navy-light/50 border-white/20 text-white hover:border-coral/50",
            savings: "Cancel Anytime"
        }
    ];

    return (
        <section id="pricing" className="section-padding bg-[#0A0F1E] text-white rounded-[40px] md:rounded-[60px] mx-4 md:mx-8 mb-20 overflow-hidden shadow-2xl relative border border-white/5">
            {/* Background Decorative Element */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-coral/5 blur-[120px] rounded-full -mr-64 -mt-64" />
            
            <div className="container-custom relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-16 space-y-6">
                    <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1]">
                        Plan the perfect date in <span className="text-coral">seconds.</span>
                    </h2>
                    <p className="text-xl text-gray-400 font-medium">
                        Stop stressing. Start connecting. Choose the best way to spark your romance tonight.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
                    {plans.map((sub, idx) => (
                        <div key={idx} className={`relative p-8 rounded-[40px] border flex flex-col transition-all duration-500 hover:-translate-y-2 ${sub.className}`}>
                            {sub.badge && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-coral text-white px-6 py-2 rounded-full text-[10px] font-black tracking-widest uppercase shadow-xl z-20 whitespace-nowrap animate-bounce">
                                    {sub.badge}
                                </div>
                            )}
                            
                            {sub.savings && (
                                <div className="absolute top-6 right-8 text-[10px] font-black uppercase text-coral tracking-wider px-3 py-1 bg-coral/10 rounded-full">
                                    {sub.savings}
                                </div>
                            )}

                            <div className="mb-8">
                                <h4 className="text-2xl font-black tracking-tight mb-2">{sub.name}</h4>
                                <p className={`text-sm font-medium ${sub.highlight ? 'text-gray-500' : 'text-gray-400'}`}>
                                    {sub.tagline}
                                </p>
                            </div>

                            <div className="flex items-baseline gap-1 mb-8">
                                <span className="text-5xl font-black">{sub.price}</span>
                                <span className={`text-lg font-bold ${sub.highlight ? 'text-gray-400' : 'text-gray-500'}`}>{sub.period}</span>
                            </div>

                            <ul className="space-y-4 mb-10 flex-grow">
                                {sub.features.map((feature, fIdx) => (
                                    <li key={fIdx} className="flex items-start gap-3">
                                        <div className={`p-1 rounded-md ${sub.highlight ? 'bg-coral/10 text-coral' : 'bg-white/10 text-coral'}`}>
                                            <feature.icon className="w-3 h-3" />
                                        </div>
                                        <span className={`text-sm font-medium leading-tight ${feature.muted ? 'opacity-50' : ''}`}>
                                            {feature.text}
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => {
                                    // Map UI names to internal server plan types
                                    const planMap = {
                                        "The Spark": "free",
                                        "24-Hour Pass": "daily",
                                        "Romantic Elite": "premium"
                                    };
                                    window.location.href = '#waitlist'; // Fallback for now, could be stripe logic
                                }}
                                className={`w-full py-5 rounded-2xl font-black text-center flex items-center justify-center gap-2 transition-all group overflow-hidden relative ${
                                    sub.highlight 
                                        ? 'bg-coral text-white hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-coral/40' 
                                        : 'bg-white/5 border border-white/10 hover:bg-white/10 text-white'
                                }`}
                            >
                                <span className="relative z-10">{sub.cta}</span>
                                <ArrowRight className={`w-5 h-5 transition-transform group-hover:translate-x-1 ${sub.highlight ? 'text-white' : 'text-coral'}`} />
                            </button>
                        </div>
                    ))}
                </div>

                <div className="mt-16 text-center space-y-4">
                    <div className="flex items-center justify-center -space-x-3 mb-4">
                        {[1, 2, 3, 4, 5].map(i => (
                            <img key={i} src={`https://i.pravatar.cc/100?u=${i + 10}`} className="w-10 h-10 rounded-full border-4 border-[#0A0F1E]" alt="User" />
                        ))}
                        <div className="w-10 h-10 rounded-full border-4 border-[#0A0F1E] bg-coral flex items-center justify-center text-[10px] font-black">
                            +500
                        </div>
                    </div>
                    <p className="text-gray-400 text-sm font-medium">
                        Join <span className="text-white font-bold">500+ couples</span> planning stress-free dates.
                    </p>
                </div>
            </div>
        </section>
    );
};

export default Pricing;
