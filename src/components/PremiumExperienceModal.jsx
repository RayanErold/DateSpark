import React from 'react';
import { X, Check, Heart, Sparkles, Star } from 'lucide-react';

const PremiumExperienceModal = ({ isOpen, onClose, onUpgrade, limitType }) => {
    if (!isOpen) return null;

    const passFeatures = [
        "Unlimited plans generation",
        "Access to unlimited swap spots",
        "Access to best venues",
        "AI plans customizer (24h)",
        "Unlock all stops instantly",
        "Get directions & rides"
    ];

    const plusFeatures = [
        "Everything in 24-Hour Pass",
        "30-Day Unrestricted Access",
        "Priority AI Generation",
        "Save Unlimited Favorites",
        "Custom Theme Unlock",
        "Early Access to Features"
    ];

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 md:p-6 bg-navy/80 backdrop-blur-xl animate-in fade-in duration-300">
            {/* Modal Container - Wider for side-by-side */}
            <div className="relative w-full max-w-[850px] max-h-[95vh] overflow-y-auto overflow-x-hidden bg-[#fdfdfd] rounded-[2.5rem] shadow-2xl flex flex-col animate-in slide-in-from-bottom-8 zoom-in-95 duration-500 border border-white/20 disable-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
                
                {/* Close Button */}
                <button 
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 bg-gray-100 hover:bg-gray-200 text-gray-400 rounded-full transition-all z-20"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="p-6 sm:p-10 text-center flex-1 flex flex-col items-center">
                    {/* Top Icon Display */}
                    <div className="mb-6">
                        <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center relative shadow-inner">
                            <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center">
                                <div className="w-9 h-9 bg-gradient-to-br from-rose-400 to-coral rounded-xl flex items-center justify-center shadow-lg shadow-coral/20">
                                    <Heart className="w-5 h-5 text-white fill-white/20" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-black text-navy mb-2 tracking-tight font-[Outfit]">Upgrade to Premium</h2>
                    <p className="text-gray-500 text-sm font-medium leading-relaxed max-w-[400px] mx-auto mb-10">
                        {limitType 
                            ? "You've reached your free daily limit. Upgrade for unlimited access, or try again tomorrow when your limits automatically reset." 
                            : "Stop planning, start dating. Choose the plan that fits your night."}
                    </p>

                    {/* Even Split Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mb-8 overflow-visible">
                        
                        {/* 24-Hour Pass Card */}
                        <div className="bg-white border-2 border-slate-100 rounded-3xl p-8 flex flex-col relative transition-all duration-300 hover:border-coral/30 hover:shadow-xl hover:shadow-coral/10 hover:-translate-y-1 group">
                            <div className="mb-6">
                                <span className="text-[10px] font-black uppercase tracking-widest text-coral bg-coral/5 px-2 py-0.5 rounded">Flex Choice</span>
                                <h3 className="text-xl font-black text-navy mt-2">24-Hour Pass</h3>
                                <p className="text-gray-400 text-xs font-bold">Perfect for tonight's date.</p>
                            </div>

                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-4xl font-black text-navy">$1.99</span>
                                <span className="text-gray-400 font-bold text-base">/24HR</span>
                            </div>

                            <div className="space-y-4 mb-10 flex-1">
                                {passFeatures.map((feature, idx) => (
                                    <div key={idx} className="flex items-start gap-3 text-left">
                                        <div className="mt-1 bg-coral/10 p-0.5 rounded-full flex-shrink-0">
                                            <Check className="w-3 h-3 text-coral stroke-[3]" />
                                        </div>
                                        <span className="text-[13px] font-bold text-gray-600 leading-tight">{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <button 
                                onClick={() => onUpgrade('24H')}
                                className="w-full py-4 bg-white border-2 border-coral text-coral hover:bg-coral hover:text-white font-black rounded-2xl transition-all transform active:scale-95 shadow-lg shadow-coral/5"
                            >
                                Get Pass
                            </button>
                        </div>

                        {/* DateSpark Plus Card (Promoted) */}
                        <div className="bg-[#0b101c] rounded-3xl p-8 flex flex-col relative shadow-2xl shadow-navy/40 border-[1.5px] border-slate-700/50 overflow-visible transition-transform duration-300 hover:scale-[1.02]">
                            <div className="absolute inset-0 rounded-3xl shadow-[inset_0_0_20px_rgba(255,127,80,0.1)] pointer-events-none"></div>
                            <div className="absolute -top-4 right-4 bg-gradient-to-r from-coral to-rose-500 text-white text-[11px] font-black uppercase tracking-widest px-4 py-2 rounded-full shadow-lg shadow-coral/30 border border-white/20 z-10 animate-float-badge">
                                30 Days Free
                            </div>

                            <div className="mb-6">
                                <span className="text-[10px] font-black uppercase tracking-widest text-coral">Full Access</span>
                                <h3 className="text-xl font-black text-white mt-2">DateSpark Plus</h3>
                                <p className="text-gray-400 text-xs font-bold">The ultimate dating toolkit.</p>
                            </div>

                            <div className="flex flex-col mb-6">
                                <div className="flex items-baseline gap-1 text-white">
                                    <span className="text-4xl font-black">$9.99</span>
                                    <span className="text-gray-400 font-bold text-base">/month</span>
                                </div>
                                <p className="text-coral text-[11px] font-black uppercase tracking-wider mt-1">First 30 Days Completely Free</p>
                            </div>

                            <div className="space-y-4 mb-10 flex-1">
                                {plusFeatures.map((feature, idx) => (
                                    <div key={idx} className="flex items-start gap-3 text-left">
                                        <div className="mt-1 bg-coral p-0.5 rounded-full flex-shrink-0 shadow-sm shadow-coral/50">
                                            <Check className="w-3 h-3 text-white stroke-[4]" />
                                        </div>
                                        <span className="text-[13px] font-bold text-gray-200 leading-tight">{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <button 
                                onClick={() => onUpgrade('ELITE')}
                                className="w-full py-4 bg-gradient-to-r from-coral to-rose-500 hover:from-rose-500 hover:to-coral text-white font-black rounded-2xl shadow-xl shadow-coral/30 transition-all transform active:scale-95 animate-pulse-subtle"
                            >
                                Start Free Trial
                            </button>
                        </div>
                    </div>

                    <button 
                        onClick={onClose}
                        className="text-gray-400 font-black text-[10px] hover:text-navy transition-colors tracking-widest uppercase mb-4"
                    >
                        Maybe Later
                    </button>
                </div>

                {/* Footer Stats */}
                <div className="px-6 sm:px-10 py-6 bg-gray-50/50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 opacity-60">
                            {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-navy text-navy" />)}
                            <span className="text-[10px] font-black text-navy ml-1">4.9/5.0</span>
                        </div>
                        <div className="h-3 w-px bg-gray-200 hidden sm:block" />
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                            Built for NYC Romance
                        </span>
                    </div>
                    <div className="flex items-center gap-2 grayscale brightness-125 opacity-50 select-none">
                         <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                            Secure via Stripe
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PremiumExperienceModal;
