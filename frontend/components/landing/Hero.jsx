import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Play, Calendar, Ticket, MapPin } from 'lucide-react';
import dashboardMockup from '../../assets/dashboard-mockup.png';
import { trackABEvent } from '../../lib/hooks/useABTest';

const Hero = () => {
    const navigate = useNavigate();
    const TEST_KEY = 'landing-hero-v1';

    const handleCTAClick = () => {
        trackABEvent(TEST_KEY, 'A', 'cta_click');
        navigate('/signup');
    };

    return (
        <section className="relative min-h-[90vh] lg:min-h-screen flex items-center pt-24 lg:pt-20 mesh-bg overflow-hidden">
            {/* Subtle background accents */}
            <div className="absolute top-0 right-0 -z-10 w-1/2 h-full bg-gradient-to-l from-gray-50 to-transparent" />
            <div className="absolute top-[10%] right-[5%] -z-10 w-[600px] h-[600px] bg-coral/5 rounded-full blur-[120px]" />
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                    
                    {/* Left: Content */}
                    <div className="flex-1 lg:flex-[0.9] text-center lg:text-left z-10">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <h1 className="text-4xl sm:text-6xl md:text-8xl font-black text-navy tracking-tighter leading-[0.95] mb-6 lg:mb-8">
                                Plan dates <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-coral via-pink-500 to-rose-400">
                                    that spark
                                </span> ✨
                            </h1>
                            
                            <div className="space-y-4 mb-8 lg:mb-10">
                                <p className="text-base sm:text-lg md:text-2xl font-black text-gray-400 tracking-tight leading-tight">
                                    Smart date ideas, personalized for you. <br />
                                    <span className="text-gray-500">Real plans, not just suggestions.</span>
                                </p>
                                <p className="text-sm sm:text-base lg:text-lg text-gray-400 font-medium max-w-lg mx-auto lg:mx-0 leading-relaxed">
                                    Whether it's a cozy night in or an adventure across town, <span className="text-coral font-bold">DateSpark</span> helps you plan unforgettable moments.
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-10 sm:mb-12">
                                <button 
                                    onClick={handleCTAClick}
                                    className="btn-primary w-full sm:w-auto"
                                >
                                    Start Planning Free <ArrowRight className="w-5 h-5" />
                                </button>
                                <button className="btn-secondary w-full sm:w-auto">
                                    <Play className="w-4 h-4 fill-navy" /> See How It Works
                                </button>
                            </div>

                            {/* Tags */}
                            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 sm:gap-3">
                                {[
                                    { icon: <Sparkles className="w-3.5 h-3.5" />, text: 'Personalized ideas' },
                                    { icon: <Calendar className="w-3.5 h-3.5" />, text: 'Curated events' },
                                    { icon: <MapPin className="w-3.5 h-3.5" />, text: 'Easy planning' }
                                ].map((tag, i) => (
                                    <div key={i} className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-50 rounded-xl border border-gray-100 text-[10px] sm:text-[11px] font-black text-gray-400 uppercase tracking-widest">
                                        <span className="text-coral/60">{tag.icon}</span>
                                        {tag.text}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>

                    {/* Right: Premium Mockup */}
                    <div className="flex-[1.1] lg:flex-[1.3] relative w-full lg:w-auto perspective-2000 overflow-visible">
                        <motion.div
                            initial={{ opacity: 0, x: 50, rotateY: -10 }}
                            animate={{ opacity: 1, x: 0, rotateY: 0 }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="relative lg:scale-125 lg:translate-x-20 origin-center lg:origin-left"
                        >
                            <div className="relative rounded-2xl lg:rounded-[3rem] overflow-hidden shadow-[0_30px_60px_-12px_rgba(0,0,0,0.12)] lg:shadow-[0_60px_100px_-20px_rgba(0,0,0,0.1)] border border-gray-100">
                                <img 
                                    src={dashboardMockup} 
                                    alt="DateSpark Dashboard Preview" 
                                    className="w-full h-auto"
                                />
                                {/* Overlay glow */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent pointer-events-none" />
                            </div>

                            {/* Floating UI Elements for depth */}
                            <motion.div 
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute -top-6 -right-6 bg-white p-4 rounded-2xl shadow-xl border border-gray-100 flex items-center gap-3 z-20"
                            >
                                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                                    <Sparkles className="w-4 h-4 text-green-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-navy uppercase tracking-widest">Plan Verified</p>
                                    <p className="text-[9px] font-bold text-gray-400">98% Match Score</p>
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default Hero;

