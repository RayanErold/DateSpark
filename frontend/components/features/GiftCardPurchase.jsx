import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, ArrowRight, Heart, Star, X } from 'lucide-react';
import axios from 'axios';
import { supabase } from '../../lib/supabase';

const OCCASIONS = [
    { id: 'valentines', label: "Valentine's Day", emoji: '💌' },
    { id: 'anniversary', label: 'Anniversary', emoji: '🥂' },
    { id: 'birthday', label: 'Birthday', emoji: '🎂' },
    { id: 'justbecause', label: 'Just Because', emoji: '✨' },
];

const PLANS = [
    { id: '24H',           label: '24-Hour Pass',   price: '$1.99',  description: 'One perfect night, unlimited plans' },
    { id: 'COUPLES_MONTH', label: 'Couples — 1 Mo', price: '$14.99', description: 'Full couples plan for a month' },
    { id: 'COUPLES_YEAR',  label: 'Couples — 1 Yr', price: '$99',    description: 'A full year of unforgettable dates' },
];

const BRANDS = [
    { id: 'Fashion Nova', label: 'Fashion Nova', emoji: '🛍️' },
    { id: 'Starbucks',    label: 'Starbucks',    emoji: '☕' },
    { id: 'Airbnb',       label: 'Airbnb',       emoji: '🏡' },
    { id: 'Uber',         label: 'Uber',         emoji: '🚗' },
    { id: 'Target',       label: 'Target',       emoji: '🎯' }
];

const DENOMINATIONS = [25, 50, 100];

const GiftCardPurchase = ({ onClose, initialPlan }) => {
    const [step, setStep] = useState(1);
    const [selectedOccasion, setSelectedOccasion] = useState(null);
    
    // Purchase configurations
    const [giftCardType, setGiftCardType] = useState('datespark_pass'); // 'datespark_pass' or 'brand'
    const [selectedPlan, setSelectedPlan] = useState(initialPlan || null);
    const [selectedBrand, setSelectedBrand] = useState(null);
    const [selectedAmount, setSelectedAmount] = useState(25);

    const [recipientEmail, setRecipientEmail] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handlePurchase = async () => {
        if (giftCardType === 'datespark_pass' && !selectedPlan) {
            setError('Please choose a DateSpark Pass.');
            return;
        }
        if (giftCardType === 'brand' && !selectedBrand) {
            setError('Please choose a partner brand.');
            return;
        }
        if (!recipientEmail) {
            setError('Please fill in recipient email.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const response = await axios.post('/api/gift-cards/purchase', {
                giftCardType,
                planType: giftCardType === 'datespark_pass' ? selectedPlan : undefined,
                brandName: giftCardType === 'brand' ? selectedBrand : undefined,
                amount: giftCardType === 'brand' ? selectedAmount : undefined,
                purchaserId: user?.id || null,
                recipientEmail,
                message,
            });
            if (response.data.url) {
                window.location.href = response.data.url;
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-plum/50 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && onClose?.()}
        >
            <div className="editorial-card bg-ivory w-full max-w-lg p-8 relative shadow-2xl">
                {/* Close */}
                {onClose && (
                    <button onClick={onClose} className="absolute top-5 right-5 w-8 h-8 rounded-full bg-blush/60 flex items-center justify-center text-taupe hover:text-rose transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                )}

                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-rose/10 flex items-center justify-center">
                        <Gift className="w-6 h-6 text-rose" />
                    </div>
                    <div>
                        <span className="editorial-label block">Gift Shop</span>
                        <h2 className="text-xl font-serif font-bold text-plum leading-tight">Send a Gift Card</h2>
                    </div>
                </div>

                {/* Step 1: Occasion + Plan/Brand */}
                {step === 1 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                        <p className="editorial-label mb-2">Occasion</p>
                        <div className="grid grid-cols-2 gap-2 mb-5">
                            {OCCASIONS.map(o => (
                                <button
                                    key={o.id}
                                    type="button"
                                    onClick={() => setSelectedOccasion(o.id)}
                                    className={`p-3 rounded-2xl border text-left transition-all text-sm font-medium font-outfit ${
                                        selectedOccasion === o.id
                                            ? 'bg-rose/10 border-rose text-rose'
                                            : 'bg-ivory border-blush text-taupe hover:border-rose/40'
                                    }`}
                                >
                                    <span className="text-lg mr-2">{o.emoji}</span>{o.label}
                                </button>
                            ))}
                        </div>

                        {/* Gift Card Type Tab Toggle */}
                        <p className="editorial-label mb-2">Gift Card Type</p>
                        <div className="flex gap-2 mb-5 bg-[#f5ebe6]/60 p-1.5 rounded-2xl border border-blush/30">
                            <button
                                type="button"
                                onClick={() => setGiftCardType('datespark_pass')}
                                className={`flex-1 py-2 text-xs font-black rounded-xl transition-all font-outfit uppercase tracking-wider ${giftCardType === 'datespark_pass' ? 'bg-rose text-white shadow-md' : 'text-taupe hover:text-rose'}`}
                            >
                                DateSpark Pass
                            </button>
                            <button
                                type="button"
                                onClick={() => setGiftCardType('brand')}
                                className={`flex-1 py-2 text-xs font-black rounded-xl transition-all font-outfit uppercase tracking-wider ${giftCardType === 'brand' ? 'bg-rose text-white shadow-md' : 'text-taupe hover:text-rose'}`}
                            >
                                Partner Brand
                            </button>
                        </div>

                        {/* Conditionals */}
                        {giftCardType === 'datespark_pass' ? (
                            <div>
                                <p className="editorial-label mb-2">Choose Plan</p>
                                <div className="space-y-2 mb-6">
                                    {PLANS.map(p => (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => setSelectedPlan(p.id)}
                                            className={`w-full p-4 rounded-2xl border text-left transition-all ${
                                                selectedPlan === p.id
                                                    ? 'bg-rose/10 border-rose'
                                                    : 'bg-ivory border-blush hover:border-rose/40'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-semibold text-plum text-sm font-outfit">{p.label}</p>
                                                    <p className="text-taupe text-xs mt-0.5">{p.description}</p>
                                                </div>
                                                <span className="text-rose font-bold font-outfit">{p.price}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div>
                                <p className="editorial-label mb-2">Choose Brand</p>
                                <div className="grid grid-cols-2 gap-2 mb-5">
                                    {BRANDS.map(b => (
                                        <button
                                            key={b.id}
                                            type="button"
                                            onClick={() => setSelectedBrand(b.id)}
                                            className={`p-3 rounded-2xl border text-left transition-all text-xs font-semibold flex items-center gap-2 ${
                                                selectedBrand === b.id
                                                    ? 'bg-rose/10 border-rose text-rose font-bold'
                                                    : 'bg-ivory border-blush text-taupe hover:border-rose/40'
                                            }`}
                                        >
                                            <span className="text-base">{b.emoji}</span>
                                            <span className="font-outfit">{b.label}</span>
                                        </button>
                                    ))}
                                </div>

                                <p className="editorial-label mb-2">Choose Amount</p>
                                <div className="flex gap-2 mb-6">
                                    {DENOMINATIONS.map(amt => (
                                        <button
                                            key={amt}
                                            type="button"
                                            onClick={() => setSelectedAmount(amt)}
                                            className={`flex-1 py-3 rounded-2xl border text-center transition-all text-sm font-black font-outfit ${
                                                selectedAmount === amt
                                                    ? 'bg-rose text-white border-rose shadow-md'
                                                    : 'bg-ivory border-blush text-taupe hover:border-rose/40'
                                            }`}
                                        >
                                            ${amt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <button
                            onClick={() => setStep(2)}
                            disabled={giftCardType === 'datespark_pass' ? !selectedPlan : !selectedBrand}
                            className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Next: Personalize <ArrowRight className="w-4 h-4" />
                        </button>
                    </motion.div>
                )}

                {/* Step 2: Recipient + Message */}
                {step === 2 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                        <button onClick={() => setStep(1)} className="text-xs text-taupe hover:text-rose font-outfit uppercase tracking-widest mb-6 block">← Back</button>

                        <p className="editorial-label mb-2">Recipient Email</p>
                        <input
                            type="email"
                            placeholder="their@email.com"
                            value={recipientEmail}
                            onChange={e => setRecipientEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-2xl border border-blush bg-ivory text-plum placeholder:text-taupe/50 focus:outline-none focus:ring-2 focus:ring-rose/30 focus:border-rose mb-5 text-sm"
                        />

                        <p className="editorial-label mb-2">Personal Message <span className="normal-case text-taupe/60 tracking-normal">(optional)</span></p>
                        <textarea
                            placeholder="Write something heartfelt..."
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 rounded-2xl border border-blush bg-ivory text-plum placeholder:text-taupe/50 focus:outline-none focus:ring-2 focus:ring-rose/30 focus:border-rose mb-6 text-sm resize-none"
                        />

                        {/* Preview Card */}
                        <div className="editorial-card p-4 mb-6 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-rose/10 flex items-center justify-center flex-shrink-0">
                                <Heart className="w-5 h-5 text-rose fill-rose/30" />
                            </div>
                            <div>
                                <p className="text-xs text-taupe font-outfit uppercase tracking-widest">
                                    {giftCardType === 'datespark_pass' 
                                        ? `${PLANS.find(p => p.id === selectedPlan)?.label} · ${PLANS.find(p => p.id === selectedPlan)?.price}`
                                        : `${selectedBrand} · $${selectedAmount}`
                                    }
                                </p>
                                <p className="text-sm text-plum font-medium mt-0.5 italic font-serif">
                                    {message || 'A gift of unforgettable dates...'}
                                </p>
                            </div>
                        </div>

                        {error && (
                            <p className="text-red-500 text-xs mb-4 font-medium">{error}</p>
                        )}

                        <button
                            onClick={handlePurchase}
                            disabled={loading || !recipientEmail}
                            className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Processing...' : 'Send Gift Card'} <Gift className="w-4 h-4" />
                        </button>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
};

export default GiftCardPurchase;
