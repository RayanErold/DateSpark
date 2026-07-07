import { useState } from 'react';
import { Check, ArrowRight, Star, Heart, AlertCircle, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import { motion } from 'framer-motion';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.12 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: "easeOut" }
    }
};

const Pricing = () => {
    const [error, setError] = useState(null);

    const plans = [
        {
            name: "The Spark",
            tagline: "Sign up free—full app with fair daily limits in NYC & New Jersey.",
            price: "$0",
            period: "/forever",
            features: [
                { text: "Up to 2 builder plans per 24 hours", icon: Star },
                { text: "Up to 2 AI customizer sessions per 24 hours", icon: Star },
                { text: "Up to 3 spot swaps per 24 hours", icon: Star },
                { text: "Up to 3 favorite saves per week", icon: Star },
                { text: "Browse trending community plans", icon: Check },
                { text: "Shareable plan links", icon: Check }
            ],
            cta: "Start free",
            highlight: false,
            dark: false,
        },
        {
            name: "24-Hour Pass",
            tagline: "The instant plan for a perfect tonight.",
            price: "$1.99",
            period: "/24hr",
            badge: "TONIGHT'S PICK",
            features: [
                { text: "Unlimited plan generation", icon: Star },
                { text: "Access to unlimited swap spots", icon: Heart },
                { text: "Access to best venues", icon: Check },
                { text: "AI plans customizer (24h)", icon: Star },
                { text: "Unlock all stops instantly", icon: Check },
                { text: "Get directions & rides", icon: Check }
            ],
            cta: "Unlock My Date Night",
            highlight: true,
            dark: false,
        },
        {
            name: "Couples",
            tagline: "Plan together. Surprise each other. Never run out of ideas.",
            price: "$14.99",
            period: "/mo",
            badge: "NEW — PLAN TOGETHER",
            savings: "Most Complete",
            features: [
                { text: "Unlimited plan generation", icon: Star },
                { text: "Invite partner to collaborate", icon: Users },
                { text: "Vote on stops together (love / maybe / skip)", icon: Heart },
                { text: "Surprise Mode — hide plan until date night", icon: Star },
                { text: "Date reminders & anniversary alerts", icon: Check },
                { text: "Gift card purchase & redemption", icon: Check },
                { text: "All Premium features included", icon: Check }
            ],
            cta: "Start Couples Plan",
            highlight: false,
            dark: true,
        },
        {
            name: "DateSpark Plus",
            tagline: "The ultimate romantic companion.",
            price: "$9.99",
            period: "/mo",
            features: [
                { text: "Access to everything in 24h Pass", icon: Star },
                { text: "Unlock Secret & Hidden Gem Venues", icon: Heart },
                { text: "Access to best venues", icon: Check },
                { text: "Early access to new features", icon: Star },
                { text: "Priority Support", icon: Check }
            ],
            cta: "Start Free Trial",
            highlight: false,
            dark: false,
            savings: "7 Days Free"
        }
    ];

    const handlePlanClick = async (planName) => {
        const planMap = {
            "The Spark":      "free",
            "24-Hour Pass":   "24H",
            "Couples":        "COUPLES",
            "DateSpark Plus": "ELITE"
        };

        const type = planMap[planName];
        if (type === 'free') {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                window.location.href = user ? '/dashboard' : '/signup';
            } catch {
                window.location.href = '/signup';
            }
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setError("Please log in to upgrade your plan!");
                setTimeout(() => setError(null), 5000);
                return;
            }

            const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
            const response = await axios.post('/api/create-checkout-session', {
                planType: type,
                userId: user.id,
                email: user.email
            });
            const { id: sessionId, url } = response.data;

            if (url) {
                window.location.href = url;
            } else if (stripe && sessionId) {
                await stripe.redirectToCheckout({ sessionId });
            }
        } catch (err) {
            console.error('Pricing Payment Error:', err);
            setError("Connection error. Please try again later.");
            setTimeout(() => setError(null), 5000);
        }
    };

    return (
        <section id="pricing" className="section-padding">
            <div className="container-custom relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.6 }}
                    className="text-center max-w-3xl mx-auto mb-16 space-y-4"
                >
                    <span className="editorial-label">Choose your plan</span>
                    <h2 className="text-4xl md:text-5xl font-serif font-bold text-plum tracking-tight leading-[1.1]">
                        Plan the perfect date in <span className="text-rose italic">seconds.</span>
                    </h2>
                    <p className="text-lg text-taupe font-medium">
                        Stop stressing. Start connecting.
                    </p>
                </motion.div>

                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-50px" }}
                    variants={containerVariants}
                    className="grid grid-cols-1 lg:grid-cols-4 gap-6 max-w-7xl mx-auto items-stretch"
                >
                    {plans.map((sub, idx) => (
                        <motion.div
                            variants={itemVariants}
                            key={idx}
                            className={`relative p-7 rounded-[2rem] border flex flex-col transition-all duration-500 hover:-translate-y-2 ${
                                sub.dark
                                    ? 'bg-plum border-plum text-ivory shadow-2xl shadow-plum/20'
                                    : sub.highlight
                                        ? 'bg-ivory border-rose shadow-xl shadow-rose/15 scale-[1.02]'
                                        : 'editorial-card text-plum'
                            }`}
                        >
                            {/* Badge */}
                            {sub.badge && (
                                <div className={`absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-1.5 rounded-full text-[9px] font-semibold tracking-widest uppercase shadow-xl z-20 whitespace-nowrap font-outfit ${
                                    sub.dark ? 'bg-rose text-ivory' : 'bg-rose text-ivory'
                                }`}>
                                    {sub.badge}
                                </div>
                            )}

                            {/* Savings badge */}
                            {sub.savings && (
                                <div className={`absolute top-5 right-5 text-[9px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full font-outfit ${
                                    sub.dark ? 'text-ivory bg-ivory/10' : 'text-rose bg-rose/10'
                                }`}>
                                    {sub.savings}
                                </div>
                            )}

                            {/* Plan name + tagline */}
                            <div className="mb-6 mt-2">
                                <h4 className={`text-xl font-bold tracking-tight mb-2 font-outfit ${sub.dark ? 'text-ivory' : 'text-plum'}`}>
                                    {sub.name}
                                </h4>
                                <p className={`text-sm font-medium leading-relaxed ${sub.dark ? 'text-ivory/60' : 'text-taupe'}`}>
                                    {sub.tagline}
                                </p>
                            </div>

                            {/* Price */}
                            <div className="flex items-baseline gap-1 mb-7">
                                <span className={`text-4xl font-bold font-outfit ${sub.dark ? 'text-ivory' : 'text-plum'}`}>
                                    {sub.price}
                                </span>
                                <span className={`text-base font-medium ${sub.dark ? 'text-ivory/50' : 'text-taupe'}`}>
                                    {sub.period}
                                </span>
                            </div>

                            {/* Features */}
                            <ul className="space-y-3.5 mb-8 flex-grow">
                                {sub.features.map((feature, fIdx) => (
                                    <li key={fIdx} className="flex items-start gap-3">
                                        <div className={`p-1 rounded-md flex-shrink-0 ${
                                            sub.dark
                                                ? 'bg-rose/20 text-rose'
                                                : sub.highlight
                                                    ? 'bg-rose/10 text-rose'
                                                    : 'bg-blush/60 text-rose'
                                        }`}>
                                            <feature.icon className="w-3 h-3" />
                                        </div>
                                        <span className={`text-sm font-medium leading-tight ${sub.dark ? 'text-ivory/80' : 'text-taupe'}`}>
                                            {feature.text}
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            {/* CTA Button */}
                            <button
                                onClick={() => handlePlanClick(sub.name)}
                                className={`w-full py-4 rounded-2xl font-semibold text-center flex items-center justify-center gap-2 transition-all group overflow-hidden relative text-sm uppercase tracking-widest font-outfit ${
                                    sub.dark
                                        ? 'bg-rose text-ivory hover:brightness-105 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-rose/30'
                                        : sub.highlight
                                            ? 'bg-plum text-ivory hover:bg-rose hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-plum/20'
                                            : 'bg-ivory border border-blush text-plum hover:bg-blush/30 hover:border-rose/30'
                                }`}
                            >
                                <span className="relative z-10">{sub.cta}</span>
                                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </button>

                            {error && idx === 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-500 text-xs font-semibold"
                                >
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    <span>{error}</span>
                                </motion.div>
                            )}
                        </motion.div>
                    ))}
                </motion.div>

                {/* Social proof footer */}
                <div className="mt-16 text-center space-y-4">
                    <div className="flex items-center justify-center -space-x-3 mb-4">
                        {[1, 2, 3, 4, 5].map(i => (
                            <img key={i} src={`https://i.pravatar.cc/100?u=${i + 10}`} className="w-10 h-10 rounded-full border-4 border-ivory" alt="User" />
                        ))}
                        <div className="w-10 h-10 rounded-full border-4 border-ivory bg-rose flex items-center justify-center text-[10px] font-semibold text-ivory font-outfit">
                            +
                        </div>
                    </div>
                    <p className="text-taupe text-sm font-medium">
                        Join <span className="text-plum font-semibold">couples in NYC &amp; New Jersey</span> planning stress-free dates.
                    </p>
                </div>
            </div>
        </section>
    );
};

export default Pricing;
