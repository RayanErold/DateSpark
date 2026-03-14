import React, { useState } from 'react';
import { Send, CheckCircle, Sparkles, Bell, PartyPopper, Gift, Star, ArrowRight } from 'lucide-react';

const Waitlist = () => {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [position, setPosition] = useState(null);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) return;

        setIsLoading(true);
        setError(null); // Clear previous errors

        try {
            const response = await fetch('/api/waitlist', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Something went wrong');
            }

            setSubmitted(true);
            setEmail('');
            setPosition(data.position);
        } catch (err) {
            console.error('Waitlist error:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section id="waitlist" className="section-padding relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-1/2 left-0 -translate-y-1/2 -z-10 w-64 h-64 bg-coral/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-0 -z-10 w-96 h-96 bg-gold/10 rounded-full blur-3xl opacity-50" />

            {/* Confetti Animation (Visible on submission) */}
            {submitted && (
                <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
                    {[...Array(20)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute w-2 h-2 bg-coral rounded-full animate-confetti"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `-10px`,
                                backgroundColor: ['#ff7f50', '#ffd700', '#ffffff', '#0a192f'][Math.floor(Math.random() * 4)],
                                animationDelay: `${Math.random() * 3}s`,
                                animationDuration: `${Math.random() * 2 + 2}s`
                            }}
                        />
                    ))}
                </div>
            )}

            <div className="container-custom">
                <div className="bg-navy rounded-[40px] p-8 md:p-16 relative overflow-hidden shadow-2xl border border-white/5">
                    {/* Abstract background pattern */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none">
                        <div className="absolute top-0 right-0 w-64 h-64 border-4 border-white rounded-full -translate-y-1/2 translate-x-1/2" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 border-4 border-white rounded-full translate-y-1/2 -translate-x-1/2" />
                    </div>

                    {/* Catchy Badge */}
                    <div className="absolute -top-2 md:top-6 right-1/2 translate-x-1/2 md:-right-4 md:translate-x-0 rotate-3 z-20">
                        <div className="bg-gold text-navy px-6 py-2 rounded-2xl font-black text-sm uppercase shadow-xl animate-float-badge border-2 border-white">
                            Limited Space! ⚡️
                        </div>
                    </div>

                    <div className="relative z-10 max-w-2xl mx-auto text-center space-y-8">
                        {!submitted ? (
                            <>
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 text-gold rounded-full text-sm font-bold uppercase tracking-widest">
                                    <Sparkles className="w-4 h-4" /> REWARDS AWAIT YOU
                                </div>

                                <h2 className="text-4xl md:text-6xl font-black text-white leading-tight">
                                    Stop planning. <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-coral to-pink-400">Start dating.</span>
                                </h2>

                                <div className="space-y-4">
                                    <p className="text-gray-300 text-lg md:text-xl leading-relaxed max-w-lg mx-auto">
                                        Join the waitlist to get:
                                    </p>
                                    <div className="flex flex-wrap justify-center gap-4">
                                        <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl text-coral font-bold text-sm">
                                            <Gift className="w-4 h-4" /> Free First Date Plan
                                        </div>
                                        <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl text-gold font-bold text-sm">
                                            <Star className="w-4 h-4" /> Early Access Pricing
                                        </div>
                                    </div>
                                </div>

                                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto pt-6 group">
                                    <div className="relative flex-grow">
                                        <input
                                            type="email"
                                            placeholder="Enter your email"
                                            required
                                            className="w-full bg-white/10 border-2 border-white/20 text-white px-6 py-5 rounded-[20px] focus:outline-none focus:border-coral focus:ring-4 focus:ring-coral/20 transition-all text-lg placeholder:text-gray-500"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="relative overflow-hidden group/btn btn-primary bg-gradient-to-br from-coral to-[#ff4d4d] py-5 px-10 rounded-[20px] font-black text-white text-lg tracking-wide shadow-[0_0_20px_rgba(255,127,80,0.4)] hover:shadow-[0_0_35px_rgba(255,127,80,0.6)] animate-waitlist-glow disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95 flex items-center justify-center min-w-[200px]"
                                    >
                                        {/* Shimmer effect overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover/btn:animate-shimmer-fast pointer-events-none" />

                                        <span className="relative flex items-center gap-2">
                                            {isLoading ? (
                                                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    GET THE GIFTS <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                                                </>
                                            )}
                                        </span>
                                    </button>
                                </form>

                                {error && (
                                    <div className="text-red-400 text-sm font-bold bg-white/5 py-2 px-4 rounded-xl border border-red-400/20 inline-block">
                                        ⚠️ {error}
                                    </div>
                                )}

                                <div className="flex items-center justify-center gap-4 text-sm text-gray-400 pt-2 font-medium">
                                    <div className="flex -space-x-2">
                                        {[1, 2, 3].map((n) => (
                                            <div key={n} className="w-8 h-8 rounded-full border-2 border-navy bg-gray-800" />
                                        ))}
                                    </div>
                                    <span>Joined by 2,492+ couples today</span>
                                </div>
                            </>
                        ) : (
                            <div className="py-12 space-y-6 animate-in fade-in zoom-in duration-500">
                                <div className="relative">
                                    <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-emerald-500/20">
                                        <PartyPopper className="w-12 h-12 text-white" />
                                    </div>
                                    <div className="absolute -top-2 -right-4 bg-gold text-navy px-3 py-1 rounded-full text-xs font-black shadow-lg animate-bounce">
                                        YOU'RE IN!
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-4xl font-black text-white">Welcome to the Club! 🥂</h3>
                                    <div className="inline-block bg-coral/20 text-coral px-4 py-1.5 rounded-full text-sm font-bold border border-coral/30">
                                        You're #{position} on the list
                                    </div>
                                </div>

                                <p className="text-gray-300 text-xl max-w-md mx-auto">
                                    Check your inbox! We just sent your **Free First Date Plan** and your **VIP Discount Code**.
                                </p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-sm mx-auto pt-4">
                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-1">
                                        <Gift className="w-6 h-6 text-coral" />
                                        <span className="text-[10px] uppercase font-bold text-gray-500">First Gift</span>
                                        <span className="text-xs font-bold text-white">Free Itinerary</span>
                                    </div>
                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-1">
                                        <Star className="w-6 h-6 text-gold" />
                                        <span className="text-[10px] uppercase font-bold text-gray-500">Second Gift</span>
                                        <span className="text-xs font-bold text-white">20% Launch Code</span>
                                    </div>
                                </div>

                                <div className="pt-8">
                                    <button
                                        onClick={() => setSubmitted(false)}
                                        className="text-gray-400 hover:text-white transition-colors text-sm font-medium underline underline-offset-4"
                                    >
                                        Sign up another couple
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Catchy footer text */}
            <p className="text-center mt-8 text-gray-400 text-sm font-medium uppercase tracking-[0.2em] opacity-50">
                // YOUR REWARDS ARE SECURED
            </p>

            <style>{`
                @keyframes confetti {
                    0% { transform: translateY(0) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
                }
                .animate-confetti {
                    animation-name: confetti;
                    animation-timing-function: linear;
                    animation-iteration-count: 1;
                    animation-fill-mode: forwards;
                }
            `}</style>
        </section>
    );
};

export default Waitlist;
