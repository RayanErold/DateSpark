import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, 
    Share2, 
    Copy, 
    Check, 
    Instagram, 
    MessageCircle, 
    MapPin, 
    Sparkles, 
    Star, 
    Calendar,
    ArrowRight
} from 'lucide-react';

const ShareCardModal = ({ plan, onClose, user }) => {
    const [copied, setCopied] = useState(false);
    const cardRef = React.useRef(null);

    if (!plan) return null;

    const itinerary = plan.itinerary || {};
    const steps = Array.isArray(itinerary) ? itinerary : (itinerary.steps || []);
    const coverImage = steps[0]?.photoUrl || steps[0]?.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80';
    const shareUrl = `${window.location.origin}/shared/${plan.id}`;
    const planTitle = plan.vibe_variant || (plan.vibe ? plan.vibe.charAt(0).toUpperCase() + plan.vibe.slice(1) + ' Date' : 'Perfect Date Plan');

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        } catch { }
    };

    const handleNativeShare = async () => {
        const text = `✨ ${planTitle} — crafted with DateSpark\n📍 ${plan.location}\n\n${steps.slice(0, 3).map((s, i) => `${i + 1}. ${s.time} · ${s.venue}`).join('\n')}\n\nSee the full plan 👇`;
        if (navigator.share) {
            try { await navigator.share({ title: planTitle, text, url: shareUrl }); } catch { }
        } else {
            handleCopyLink();
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[900] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ y: "100%", opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: "100%", opacity: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-t-[2.5rem] sm:rounded-[3rem] w-full max-w-lg overflow-hidden shadow-2xl relative"
                >
                    {/* Share Card Content */}
                    <div ref={cardRef} className="relative aspect-[4/5] sm:aspect-auto sm:min-h-[500px] bg-navy overflow-hidden group">
                        {/* Background Image with Overlay */}
                        <div className="absolute inset-0">
                            <img src={coverImage} alt={planTitle} className="w-full h-full object-cover opacity-60 scale-105 group-hover:scale-100 transition-transform duration-1000" />
                            <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/40 to-transparent" />
                            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />
                        </div>

                        {/* Top Branding */}
                        <div className="absolute top-8 inset-x-8 flex items-center justify-between z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-coral rounded-xl flex items-center justify-center shadow-lg rotate-3">
                                    <Sparkles className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h5 className="text-white font-black text-xs uppercase tracking-[0.2em] opacity-90">DateSpark</h5>
                                    <p className="text-coral text-[8px] font-black uppercase tracking-widest">Premium Concierge</p>
                                </div>
                            </div>
                            <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
                                <span className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                                    <Calendar className="w-3 h-3 text-coral" /> New Plan
                                </span>
                            </div>
                        </div>

                        {/* Plan Details */}
                        <div className="absolute bottom-10 inset-x-8 z-10">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="px-3 py-1 bg-coral/20 backdrop-blur-md border border-coral/30 rounded-lg">
                                    <span className="text-[10px] font-black text-coral uppercase tracking-widest">#{plan.vibe}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                </div>
                            </div>

                            <h3 className="text-4xl font-black text-white mb-4 leading-tight tracking-tight drop-shadow-2xl">
                                {planTitle}
                            </h3>

                            <div className="flex items-center gap-3 mb-8 opacity-80">
                                <div className="w-6 h-6 bg-white/10 rounded-lg flex items-center justify-center">
                                    <MapPin className="w-3.5 h-3.5 text-coral" />
                                </div>
                                <p className="text-sm font-bold text-white tracking-wide">{plan.location}</p>
                            </div>

                            {/* Itinerary Preview */}
                            <div className="space-y-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-5 shadow-2xl">
                                {steps.slice(0, 3).map((step, idx) => (
                                    <div key={idx} className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-[10px] font-black text-coral border border-white/5">
                                            0{idx + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">{step.time}</p>
                                            <p className="text-sm font-bold text-white truncate">{step.venue}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Visual Decorations */}
                        <div className="absolute top-1/2 -right-20 w-64 h-64 bg-coral/20 rounded-full blur-[100px] pointer-events-none" />
                        <div className="absolute -left-20 bottom-1/4 w-48 h-48 bg-violet-600/20 rounded-full blur-[80px] pointer-events-none" />
                    </div>

                    {/* Actions Area */}
                    <div className="p-8 bg-gray-50 border-t border-gray-100">
                        <div className="flex flex-col gap-4">
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={handleCopyLink}
                                    className={`py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl ${copied ? 'bg-green-500 text-white shadow-green-500/20' : 'bg-white text-navy border border-gray-100 hover:bg-gray-50'}`}
                                >
                                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4 text-coral" />}
                                    {copied ? 'Copied!' : 'Copy Link'}
                                </button>
                                <button
                                    onClick={handleNativeShare}
                                    className="py-4 bg-navy text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl shadow-navy/20 hover:scale-[1.02] active:scale-95"
                                >
                                    <Share2 className="w-4 h-4 text-coral" />
                                    Share Now
                                </button>
                            </div>

                            <div className="flex items-center justify-between px-2 pt-2">
                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Share to Stories</p>
                                <div className="flex gap-4">
                                    <button className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-pink-500 hover:scale-110 transition-transform">
                                        <Instagram className="w-4 h-4" />
                                    </button>
                                    <button className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-green-500 hover:scale-110 transition-transform">
                                        <MessageCircle className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-white transition-colors z-20"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ShareCardModal;
