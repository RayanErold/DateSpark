import React from 'react';
import { Check, ArrowRight, Sparkles, Star, Users, Globe, Zap } from 'lucide-react';

const Pricing = () => {
    const subscriptions = [
        {
            name: "Premium Member",
            tagline: "For couples who go out often.",
            price: "$9.99",
            period: "/mo",
            features: [
                "Plan unlimited dates",
                "Unlock all venues & restaurants",
                "Unlimited AI Date Customizer",
                "Save unlimited favorites",
                "Access to all supported cities",
                "Early access to new features"
            ],
            cta: "Subscribe Now",
            highlight: false,
            comingSoon: false
        },
        {
            name: "All-Inclusive Lovers",
            tagline: "The best deal for you.",
            price: "$149.99",
            period: "/yr",
            savings: "2 months free",
            features: [
                "Everything from the Monthly plan",
                "Use it in any city you visit",
                "Change your plan anytime",
                "Be the first to try new things",
                "Special plans for birthdays & anniversaries"
            ],
            cta: "Subscribe Now",
            highlight: true,
            comingSoon: false
        }
    ];

    return (
        <section id="pricing" className="section-padding bg-navy text-white rounded-[60px] mx-4 md:mx-8 mb-20 overflow-hidden shadow-2xl">
            <div className="container-custom">
                <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
                    <h2 className="text-4xl font-bold">Simple pricing for happy memories.</h2>
                    <p className="text-gray-400">Pick the best plan to find city secrets without the stress.</p>
                </div>

                {/* MVP Plans */}
                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
                    {/* Free Tier */}
                    <div className="bg-white/5 border border-white/10 p-10 rounded-[40px] flex flex-col space-y-8">
                        <div className="space-y-2">
                            <h3 className="text-2xl font-bold">Free Preview</h3>
                            <p className="text-gray-400">See what we can do for you.</p>
                        </div>
                        <div className="text-4xl font-bold">$0<span className="text-lg font-normal text-gray-400">/mo</span></div>
                        <ul className="space-y-4 flex-grow">
                            <li className="flex items-center gap-3 text-gray-300">
                                <Check className="w-5 h-5 text-coral" />
                                Generate up to 3 date ideas for free
                            </li>
                            <li className="flex items-center gap-3 text-gray-300">
                                <Check className="w-5 h-5 text-coral" />
                                See the first 2 stops of every date
                            </li>
                            <li className="flex items-center gap-3 text-gray-300">
                                <Check className="w-5 h-5 text-coral" />
                                Free AI Customization (2 uses)
                            </li>
                            <li className="flex items-center gap-3 text-gray-300 opacity-50">
                                <Check className="w-5 h-5 text-coral" />
                                Extended 5-stop itineraries are locked
                            </li>
                        </ul>
                        <button className="w-full py-4 rounded-2xl border border-white/20 font-bold hover:bg-white/10 transition-colors">
                            Try the Free Version
                        </button>
                    </div>

                    {/* Paid Tier */}
                    <div className="bg-white p-10 rounded-[40px] flex flex-col space-y-8 text-navy relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-coral text-white px-6 py-2 rounded-bl-2xl text-sm font-bold animate-pulse">
                            HOT TONIGHT
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-bold">One-time Date Pass</h3>
                            <p className="text-gray-600">Unlock your perfect plan tonight.</p>
                        </div>
                        <div className="text-4xl font-bold">$4.99<span className="text-lg font-normal text-gray-500">/once</span></div>
                        <ul className="space-y-4 flex-grow">
                            <li className="flex items-center gap-3">
                                <Check className="w-5 h-5 text-coral" />
                                Unlock all 7 distinct itinerary variations
                            </li>
                            <li className="flex items-center gap-3">
                                <Check className="w-5 h-5 text-coral" />
                                Unlimited AI Date Customizer included
                            </li>
                            <li className="flex items-center gap-3">
                                <Check className="w-5 h-5 text-coral" />
                                Extended 5-stop comprehensive dates
                            </li>
                            <li className="flex items-center gap-3">
                                <Check className="w-5 h-5 text-coral" />
                                Book tables, get directions, order Ubers
                            </li>
                            <li className="flex items-center gap-3">
                                <Check className="w-5 h-5 text-coral" />
                                Save unlimited favorites to your dashboard
                            </li>
                        </ul>
                        <button className="w-full py-4 rounded-2xl bg-coral text-white font-bold flex items-center justify-center gap-2 shadow-xl shadow-coral/30 hover:bg-coral/90 transition-all hover:scale-[1.02]">
                            Unlock tonight's plan <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Subscription Plans */}
                <div className="pt-20 border-t border-white/10 mt-20">
                    <div className="text-center mb-12 space-y-2">
                        <span className="inline-block px-4 py-1.5 bg-gold/20 text-gold rounded-full text-xs font-bold uppercase tracking-widest">Upgrade your experience</span>
                        <h3 className="text-3xl font-bold">Premium Subscriptions</h3>
                        <p className="text-gray-400">For couples who want the best date nights, every time.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        {subscriptions.map((sub, idx) => (
                            <div key={idx} className={`relative p-10 rounded-[40px] border transition-all ${sub.highlight ? 'bg-white text-navy border-white shadow-2xl scale-[1.02]' : 'bg-white/5 border-white/10 text-white'}`}>
                                {sub.savings && (
                                    <div className="absolute -top-4 right-8 bg-gold text-navy px-4 py-1 rounded-full text-xs font-black uppercase shadow-lg">
                                        {sub.savings}
                                    </div>
                                )}
                                <div className="space-y-2 mb-8">
                                    <h4 className="text-2xl font-bold tracking-tight">{sub.name}</h4>
                                    <p className={`${sub.highlight ? 'text-gray-500' : 'text-gray-400'}`}>{sub.tagline}</p>
                                </div>

                                <div className="text-4xl font-bold mb-8">
                                    {sub.price}<span className={`text-lg font-normal ${sub.highlight ? 'text-gray-500' : 'text-gray-400'}`}>{sub.period}</span>
                                </div>

                                <ul className="space-y-4 mb-10 flex-grow">
                                    {sub.features.map((feature, fIdx) => (
                                        <li key={fIdx} className="flex items-center gap-3">
                                            <Check className={`w-5 h-5 ${sub.highlight ? 'text-coral' : 'text-gold'}`} />
                                            <span className="text-sm">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <a
                                    href="#waitlist"
                                    className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${sub.highlight ? 'bg-navy text-white hover:bg-opacity-90' : 'bg-white/10 border border-white/20 hover:bg-white/20'}`}
                                >
                                    {sub.cta} <Star className="w-4 h-4 fill-current" />
                                </a>
                            </div>
                        ))}
                    </div>
                </div>

                <p className="text-center mt-12 text-gray-500 text-sm italic">
                    Couples on the waitlist get special discounts when we launch.
                </p>
            </div>
        </section>
    );
};

export default Pricing;
