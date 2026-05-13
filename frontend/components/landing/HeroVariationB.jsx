import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Heart, Star, Zap } from 'lucide-react';
import dashboardMockup from '../../assets/dashboard-mockup.png';
import { trackABEvent } from '../../lib/hooks/useABTest';

const HeroVariationB = () => {
    const navigate = useNavigate();
    const TEST_KEY = 'landing-hero-v1';

    const handleCTAClick = () => {
        trackABEvent(TEST_KEY, 'B', 'cta_click');
        navigate('/signup');
    };

    return (
        <section className="relative min-h-[90vh] lg:min-h-screen flex items-center pt-24 lg:pt-20 bg-navy overflow-hidden">
            {/* Dark Mode Mesh Background */}
            <div className="absolute inset-0 -z-10 opacity-30">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-coral/20 via-transparent to-navy" />
                <div className="absolute top-1/4 right-0 w-96 h-96 bg-pink-500/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-coral/10 rounded-full blur-[100px]" />
            </div>
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                    
                    {/* Left: Content */}
                    <div className="flex-1 lg:flex-[0.9] text-center lg:text-left z-10">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full mb-6">
                                <span className="flex h-2 w-2 rounded-full bg-coral animate-pulse" />
                                <span className="text-[10px] font-black text-coral uppercase tracking-[0.2em]">New: AI Match Score 2.0</span>
                            </div>

                            <h1 className="text-5xl sm:text-7xl md:text-8xl font-black text-white tracking-tighter leading-[0.9] mb-8">
                                Dates they'll <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-coral to-pink-400">
                                    never forget.
                                </span>
                            </h1>
                            
                            <div className="space-y-6 mb-10">
                                <p className="text-lg sm:text-xl md:text-2xl font-medium text-gray-300 tracking-tight leading-relaxed max-w-xl mx-auto lg:mx-0">
                                    Stop asking "what do you want to do?" <br className="hidden sm:block" />
                                    Get personalized, step-by-step itineraries that make <span className="text-white font-bold italic underline decoration-coral">every night out</span> special.
                                </p>
                            </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-12">
                        <button 
                            onClick={handleCTAClick}
                            className="bg-coral text-white px-10 py-5 rounded-2xl font-black text-base uppercase tracking-widest transition-all hover:scale-[1.05] hover:shadow-[0_20px_50px_rgba(255,127,80,0.4)] active:scale-95 flex items-center justify-center gap-3 group"
                        >
                            Claim Your First Plan <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <div className="flex flex-col items-center lg:items-start">
                            <div className="flex -space-x-2 mb-1">
                                {[1,2,3,4].map(i => (
                                    <div key={i} className="w-8 h-8 rounded-full border-2 border-navy bg-gray-200 overflow-hidden">
                                        <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" />
                                    </div>
                                ))}
                            </div>
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Joined by 2,000+ happy couples</p>
                        </div>
                    </div>

                    {/* Value Props */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {[
                            { icon: <Heart className="w-4 h-4" />, title: 'Relationship Focused', desc: 'Deepen your bond' },
                            { icon: <Zap className="w-4 h-4" />, title: 'Zero Stress', desc: 'We handle the details' },
                            { icon: <Star className="w-4 h-4" />, title: 'VIP Perks', desc: 'Exclusive date deals' }
                        ].map((prop, i) => (
                            <div key={i} className="flex items-start gap-3 text-left">
                                <div className="p-2 bg-white/5 rounded-lg text-coral">
                                    {prop.icon}
                                </div>
                                <div>
                                    <h3 className="text-xs font-black text-white uppercase tracking-wider">{prop.title}</h3>
                                    <p className="text-[11px] text-gray-400">{prop.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Right: Premium Mockup with different effect */}
            <div className="flex-[1.1] lg:flex-[1.3] relative w-full lg:w-auto perspective-2000 mt-12 lg:mt-0">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="relative lg:scale-110 lg:translate-x-10"
                >
                    <div className="relative rounded-[2rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border border-white/10">
                        <img 
                            src={dashboardMockup} 
                            alt="DateSpark Dashboard Preview" 
                            className="w-full h-auto grayscale-[20%] hover:grayscale-0 transition-all duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-navy/60 via-transparent to-transparent" />
                    </div>

                    {/* Floating Success Card */}
                    <motion.div 
                        animate={{ y: [0, 15, 0] }}
                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute -bottom-8 -left-8 bg-white p-6 rounded-[2rem] shadow-2xl border border-gray-100 max-w-[240px] z-20"
                    >
                        <div className="flex items-center gap-2 mb-3">
                            <div className="flex">
                                {[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3 text-gold fill-gold" />)}
                            </div>
                            <span className="text-[10px] font-black text-navy uppercase">"Game Changer"</span>
                        </div>
                        <p className="text-xs text-gray-500 font-medium leading-relaxed">
                            "Finally, no more arguing about where to eat. The curated plan was perfect!"
                        </p>
                        <p className="mt-3 text-[10px] font-black text-coral uppercase tracking-widest">— Sarah & Mike</p>
                    </motion.div>
                </motion.div>
            </div>

                </div>
            </div>
        </section>
    );
};

export default HeroVariationB;
