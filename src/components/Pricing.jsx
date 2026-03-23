import React from 'react';
import { Check, ArrowRight, Star, Heart } from 'lucide-react';

const Pricing = () => {
    const plans = [
        {
            name: "Free Preview",
            tagline: "See what we can do for you.",
            price: "$0",
            period: "/mo",
            features: [
                { text: "Generate up to 3 date ideas for free", comingSoon: false },
                { text: "See the first 2 stops of every date", comingSoon: false },
                { text: "Save up to 3 favorite itineraries", comingSoon: false },
                { text: "Up to 2 requests using AI Date Customizer", comingSoon: true }
            ],
            cta: "Try Free Version",
            highlight: false
        },
        {
            name: "Daily Date Pass",
            tagline: "24 hours of full access to unlimited premium planning.",
            price: "$1.99",
            period: "/24hr",
            features: [
                { text: "Unlock full 5-stop itineraries", comingSoon: false },
                { text: "Book tables, get directions, order Ubers", comingSoon: false },
                { text: "Save favorites to your dashboard", comingSoon: false },
                { text: "Unlimited AI Customizer (24hr access)", comingSoon: true }
            ],
            cta: "Unlock 24hr Access",
            highlight: true,
            badge: "24H FULL ACCESS"
        },
        {
            name: "Lifetime Access",
            tagline: "Early Bird! First users only.",
            price: "$29.99",
            period: "/lifetime",
            savings: "Best Deal",
            features: [
                { text: "Lifetime access to all core features", comingSoon: false },
                { text: "Book tables, get directions, order Ubers", comingSoon: false },
                { text: "Save favorites to your dashboard", comingSoon: false },
                { text: "Use in any supported city you visit", comingSoon: false },
                { text: "Early feature testing access", comingSoon: false }
            ],
            cta: "Get Lifetime Access",
            highlight: false
        },
        {
            name: "Premium Member",
            tagline: "For couples who go out often.",
            price: "$9.99",
            period: "/mo",
            features: [
                { text: "Unlock unlimited date plans", comingSoon: false },
                { text: "Unlimited favorite savings", comingSoon: false },
                { text: "Custom Font personalization", comingSoon: false },
                { text: "Theme Customization", comingSoon: false },
                { text: "Unlimited AI Date Customizer", comingSoon: true }
            ],
            cta: "Subscribe Now",
            highlight: false
        },
        {
            name: "Elite Couples",
            tagline: "Total romance management.",
            price: "$99",
            period: "/yr",
            savings: "2 Months Free",
            features: [
                { text: "Everything from Premium plan", comingSoon: false },
                { text: "Priority bookings & map fixes", comingSoon: false },
                { text: "Global city expansion access", comingSoon: false },
                { text: "Special event planning setup", comingSoon: true }
            ],
            cta: "Subscribe Now",
            highlight: false
        }
    ];

    return (
        <section id="pricing" className="section-padding bg-navy text-white rounded-[40px] md:rounded-[60px] mx-4 md:mx-8 mb-20 overflow-hidden shadow-2xl">
            <div className="container-custom">
                <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
                    <h2 className="text-4xl font-black tracking-tight leading-none">Simple pricing for happy memories.</h2>
                    <p className="text-gray-400 font-medium">Pick the best plan to find city secrets without the stress.</p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-12">
                    {plans.map((sub, idx) => (
                        <div key={idx} className={`relative p-8 rounded-[40px] border flex flex-col transition-all duration-300 hover:-translate-y-1 ${
                            sub.highlight 
                                ? 'bg-white text-navy border-white shadow-2xl scale-[1.03]' 
                                : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                        }`}>
                            {sub.savings && (
                                <div className="absolute -top-4 right-8 bg-gold text-navy px-4 py-1 rounded-full text-xs font-black uppercase shadow-lg">
                                    {sub.savings}
                                </div>
                            )}
                            {sub.badge && (
                                <div className="absolute top-0 right-0 bg-coral text-white px-5 py-2 rounded-bl-2xl text-[10px] font-black animate-pulse">
                                    {sub.badge}
                                </div>
                            )}

                            <div className="space-y-2 mb-6">
                                <h4 className="text-2xl font-black tracking-tight">{sub.name}</h4>
                                <p className={`text-xs ${sub.highlight ? 'text-gray-500' : 'text-gray-400'}`}>{sub.tagline}</p>
                            </div>

                            <div className="text-4xl font-black mb-6">
                                {sub.price}<span className={`text-lg font-normal ${sub.highlight ? 'text-gray-500' : 'text-gray-400'}`}>{sub.period}</span>
                            </div>

                            <ul className="space-y-4 mb-8 flex-grow">
                                {sub.features.map((feature, fIdx) => (
                                    <li key={fIdx} className="flex items-start gap-3">
                                        <Check className={`w-4 h-4 mt-0.5 ${feature.locked ? 'text-gray-400' : sub.highlight ? 'text-coral' : 'text-gold'}`} />
                                        <div className="flex flex-col">
                                            <span className={`text-sm ${feature.locked ? 'opacity-40' : ''} ${feature.comingSoon ? 'line-through opacity-50' : ''}`}>{feature.text}</span>
                                            {feature.comingSoon && (
                                                <span className="text-[9px] font-black uppercase text-purple-400 tracking-wider">Coming Soon</span>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>

                            <a
                                href="#waitlist"
                                className={`w-full py-4 rounded-2xl font-black text-center flex items-center justify-center gap-2 transition-all ${
                                    sub.highlight 
                                        ? 'bg-coral text-white hover:bg-opacity-90 shadow-xl shadow-coral/30' 
                                        : 'bg-white/10 border border-white/20 hover:bg-white/20 text-white'
                                }`}
                            >
                                {sub.cta} <ArrowRight className="w-4 h-4" />
                            </a>
                        </div>
                    ))}
                </div>

                <p className="text-center mt-12 text-gray-500 text-sm italic">
                    Couples on the waitlist get special discounts when we launch.
                </p>
            </div>
        </section>
    );
};

export default Pricing;
