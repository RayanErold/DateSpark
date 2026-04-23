import React from 'react';
import { MapPin, Sparkles, Share2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
        opacity: 1,
        transition: { staggerChildren: 0.2 }
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

const HowItWorks = () => {
    const steps = [
        {
            step: '01',
            icon: <MapPin className="w-7 h-7 text-coral" />,
            color: 'from-coral/20 to-orange-500/10',
            ring: 'ring-coral/30',
            title: 'Set your city & vibe',
            description: 'Drop your neighbourhood, pick a date & time, choose your mood — romantic, adventurous, or chill. Done in 30 seconds.',
        },
        {
            step: '02',
            icon: <Sparkles className="w-7 h-7 text-violet-500" />,
            color: 'from-violet-500/20 to-fuchsia-500/10',
            ring: 'ring-violet-400/30',
            title: 'AI builds your itinerary',
            description: 'We pull real-time data from Google Maps & top review platforms to craft a perfectly timed, venue-by-venue plan.',
        },
        {
            step: '03',
            icon: <Share2 className="w-7 h-7 text-gold" />,
            color: 'from-yellow-400/20 to-amber-400/10',
            ring: 'ring-yellow-400/30',
            title: 'Save, share & go',
            description: 'Send a beautiful shared link to your partner. Every stop includes maps, booking links, and reservation windows.',
        },
    ];
    return (
        <section id="how-it-works" className="py-24 bg-gray-50 relative overflow-hidden">
            {/* Decorative blob */}
            <div className="absolute right-0 top-0 w-96 h-96 bg-coral/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute left-[-5%] bottom-0 w-80 h-80 bg-violet-500/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Header */}
                <motion.div 
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-50px" }}
                    variants={itemVariants}
                    className="text-center max-w-2xl mx-auto mb-20"
                >
                    <span className="inline-block text-xs font-black text-coral uppercase tracking-[0.2em] bg-coral/10 px-4 py-1.5 rounded-full mb-5">
                        How It Works
                    </span>
                    <h2 className="text-4xl md:text-5xl font-black text-navy leading-tight">
                        A perfect night out,<br />planned in 3 steps.
                    </h2>
                    <p className="mt-4 text-gray-500 text-lg font-medium leading-relaxed">
                        No endless scrolling. No group chats. Just a curated evening ready to go.
                    </p>
                </motion.div>

                {/* Steps */}
                <motion.div 
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-50px" }}
                    variants={containerVariants}
                    className="relative grid md:grid-cols-3 gap-6 lg:gap-10"
                >
                    {/* Desktop connector line */}
                    <div className="hidden md:block absolute top-12 left-[17%] right-[17%] h-px bg-gradient-to-r from-coral/30 via-violet-400/30 to-yellow-400/30 -z-0" />

                    {steps.map((step, i) => (
                        <motion.div
                            variants={itemVariants}
                            key={i}
                            className="relative bg-white rounded-3xl border border-gray-100 p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                        >
                            {/* Step badge */}
                            <div className="absolute -top-3 -right-3 w-8 h-8 bg-navy text-white rounded-full flex items-center justify-center text-xs font-black shadow-lg">
                                {step.step}
                            </div>

                            {/* Icon */}
                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} ring-2 ${step.ring} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                {step.icon}
                            </div>

                            <h3 className="text-xl font-black text-navy mb-3">{step.title}</h3>
                            <p className="text-gray-500 leading-relaxed text-sm">{step.description}</p>
                        </motion.div>
                    ))}
                </motion.div>

                {/* CTA below */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    className="text-center mt-14"
                >
                    <Link
                        to="/demo"
                        className="inline-flex items-center gap-2 bg-navy text-white font-black px-8 py-4 rounded-2xl hover:-translate-y-0.5 hover:shadow-xl hover:shadow-navy/20 transition-all duration-200 group"
                    >
                        See it in action
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <p className="text-gray-400 text-sm font-medium mt-3">Free · No signup required to preview</p>
                </motion.div>
            </div>
        </section>
    );
};

export default HowItWorks;
