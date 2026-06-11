import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Calendar, MapPin } from 'lucide-react';
import DateArchitectChat from '../dashboard/DateArchitectChat';

const Hero = () => {
    const navigate = useNavigate();

    const handleCTAClick = () => {
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
                                <button 
                                    onClick={() => navigate('/signup')}
                                    className="btn-secondary w-full sm:w-auto border-coral/20 text-coral hover:bg-coral/5"
                                >
                                    <MapPin className="w-4 h-4 text-coral" /> Nearby Plans
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

                    {/* Right: Embedded Sparky AI Concierge chat widget */}
                    <div className="flex-[1.1] lg:flex-[1.3] w-full max-w-xl mx-auto z-10">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="bg-white p-3 rounded-2xl border border-slate-100 shadow-xl overflow-hidden"
                        >
                            <DateArchitectChat isStudio={true} />
                        </motion.div>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default Hero;


