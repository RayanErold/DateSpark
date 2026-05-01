import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Search, Brain, Sparkles } from 'lucide-react';

const ProblemSection = () => {
    const problems = [
        {
            icon: <Clock className="w-6 h-6 text-coral" />,
            title: "Planning Fatigue",
            description: "Average couples spend 45 minutes just deciding where to eat. We turn that into 3 seconds of AI magic."
        },
        {
            icon: <Search className="w-6 h-6 text-violet-400" />,
            title: "The Paradox of Choice",
            description: "Endless scrolling on Yelp and TikTok leads to indecision. Our AI curates the top 1% of venues for your specific vibe."
        },
        {
            icon: <Brain className="w-6 h-6 text-emerald-400" />,
            title: "Logistical Nightmares",
            description: "Coordinating travel times, booking links, and routes is a chore. DateSpark builds a seamless, executable itinerary."
        }
    ];

    return (
        <section className="py-24 bg-[#0a0f1c] overflow-hidden relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-coral/5 rounded-full blur-[120px] pointer-events-none" />
            
            <div className="container-custom relative z-10">
                <div className="max-w-3xl mx-auto text-center mb-16">
                    <motion.span 
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-coral font-black uppercase tracking-[0.2em] text-xs"
                    >
                        The Problem
                    </motion.span>
                    <motion.h2 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-5xl font-black text-white mt-4 mb-6 leading-tight"
                    >
                        Why is dating so <span className="text-transparent bg-clip-text bg-gradient-to-r from-coral to-violet-400">exhausting?</span>
                    </motion.h2>
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-gray-400 text-lg font-medium"
                    >
                        Most dates fail before they even start because the planning process is a full-time job. We believe you should spend your energy on the person, not the platform.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {problems.map((prob, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 + 0.3 }}
                            className="bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-[2.5rem] hover:bg-white/10 transition-all duration-500 group"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">
                                {prob.icon}
                            </div>
                            <h3 className="text-xl font-black text-white mb-4 tracking-tight">{prob.title}</h3>
                            <p className="text-gray-400 font-medium leading-relaxed">
                                {prob.description}
                            </p>
                        </motion.div>
                    ))}
                </div>

                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.6 }}
                    className="mt-20 p-1 bg-gradient-to-r from-coral/20 via-violet-500/20 to-coral/20 rounded-[3rem]"
                >
                    <div className="bg-[#0a0f1c] rounded-[2.9rem] p-10 md:p-16 text-center">
                        <Sparkles className="w-12 h-12 text-coral mx-auto mb-6 animate-pulse" />
                        <h3 className="text-2xl md:text-3xl font-black text-white mb-4">The Solution: DateSpark AI</h3>
                        <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-8 font-medium">
                            Our proprietary algorithm considers 50+ factors—from real-time traffic to your shared interests—to build a date that feels like it was planned by a world-class concierge.
                        </p>
                        <button className="bg-white text-navy px-10 py-4 rounded-full font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/5">
                            Stop Planning, Start Sparking
                        </button>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default ProblemSection;
