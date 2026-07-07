import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Gift, Heart, Calendar, Sparkles } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import GiftCardPurchase from '../components/features/GiftCardPurchase';
import GiftCardRedeem from '../components/features/GiftCardRedeem';

const OCCASIONS = [
    {
        id: 'valentines',
        label: "Valentine's Day",
        emoji: '💌',
        color: 'bg-rose/10 border-rose/30',
        plan: 'COUPLES_MONTH',
        desc: "Because love deserves more than flowers."
    },
    {
        id: 'anniversary',
        label: 'Anniversary',
        emoji: '🥂',
        color: 'bg-champagne/40 border-champagne',
        plan: 'COUPLES_YEAR',
        desc: "A whole year of planning the best nights."
    },
    {
        id: 'birthday',
        label: 'Birthday',
        emoji: '🎂',
        color: 'bg-blush/40 border-blush',
        plan: '24H',
        desc: "Give them a night they'll never forget."
    },
    {
        id: 'justbecause',
        label: 'Just Because',
        emoji: '✨',
        color: 'bg-violet-50 border-violet-200',
        plan: 'COUPLES_MONTH',
        desc: "Thoughtful gestures need no occasion."
    },
];

const GiftCardPage = () => {
    const [showPurchase, setShowPurchase] = useState(false);
    const [initialPlan, setInitialPlan] = useState(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [searchParams] = useSearchParams();

    useEffect(() => {
        if (searchParams.get('success') === '1') {
            setShowSuccess(true);
        }
    }, [searchParams]);

    const handleOccasionClick = (plan) => {
        setInitialPlan(plan);
        setShowPurchase(true);
    };

    return (
        <div className="min-h-screen bg-ivory">
            <Navbar />

            <main className="pt-28 pb-20">
                {/* Hero */}
                <section className="mesh-bg py-20 mb-16">
                    <div className="container-custom text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <span className="editorial-label mb-4 block">Gift DateSpark</span>
                            <h1 className="text-5xl md:text-7xl font-serif font-bold text-plum tracking-tight mb-6">
                                Give the gift of<br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose via-pink-400 to-blush italic">
                                    unforgettable dates
                                </span>
                            </h1>
                            <p className="text-taupe text-xl max-w-xl mx-auto mb-10 font-medium leading-relaxed">
                                A DateSpark gift card is the most thoughtful present for the couple who deserves more date nights.
                            </p>
                            <button
                                onClick={() => setShowPurchase(true)}
                                className="btn-primary mx-auto"
                            >
                                <Gift className="w-5 h-5" /> Send a Gift Card
                            </button>
                        </motion.div>
                    </div>
                </section>

                {/* Success Banner */}
                {showSuccess && (
                    <div className="container-custom mb-10">
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="editorial-card p-5 flex items-center gap-4 bg-rose/8 border-rose/30"
                        >
                            <div className="w-10 h-10 rounded-full bg-rose/10 flex items-center justify-center flex-shrink-0">
                                <Heart className="w-5 h-5 text-rose fill-rose/30" />
                            </div>
                            <div>
                                <p className="font-semibold text-plum font-outfit">Gift card purchased!</p>
                                <p className="text-taupe text-sm">The recipient will receive an email with their code shortly.</p>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Occasions */}
                <section className="container-custom mb-20">
                    <div className="text-center mb-10">
                        <span className="editorial-label mb-3 block">Perfect for every moment</span>
                        <h2 className="text-3xl font-serif font-bold text-plum">Choose an occasion</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {OCCASIONS.map((o, i) => (
                            <motion.button
                                key={o.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.08 }}
                                whileHover={{ y: -4 }}
                                onClick={() => handleOccasionClick(o.plan)}
                                className={`editorial-card p-7 text-left transition-all hover:shadow-xl ${o.color}`}
                            >
                                <span className="text-4xl block mb-4">{o.emoji}</span>
                                <h3 className="font-semibold text-plum mb-2 font-outfit">{o.label}</h3>
                                <p className="text-taupe text-sm leading-relaxed">{o.desc}</p>
                            </motion.button>
                        ))}
                    </div>
                </section>

                {/* Redeem Section */}
                <section className="container-custom">
                    <div className="text-center mb-10">
                        <span className="editorial-label mb-3 block">Received a gift?</span>
                        <h2 className="text-3xl font-serif font-bold text-plum">Redeem your card</h2>
                    </div>
                    <div className="flex justify-center">
                        <GiftCardRedeem />
                    </div>
                </section>
            </main>

            <Footer />

            {/* Purchase Modal */}
            {showPurchase && (
                <GiftCardPurchase
                    initialPlan={initialPlan}
                    onClose={() => { setShowPurchase(false); setInitialPlan(null); }}
                />
            )}
        </div>
    );
};

export default GiftCardPage;
