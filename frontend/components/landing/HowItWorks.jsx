import React from 'react';
import { motion } from 'framer-motion';

const HowItWorks = () => {
    const steps = [
        {
            number: '1',
            title: 'Tell us your vibe',
            description: 'Share your mood, budget, and preferences.',
            icon: '🎨'
        },
        {
            number: '2',
            title: 'We find the best ideas',
            description: 'AI + local insights = the perfect date options.',
            icon: '💡'
        },
        {
            number: '3',
            title: 'You enjoy, we handle the rest',
            description: 'Get your full itinerary with maps, times, and stops.',
            icon: '✨'
        }
    ];

    return (
        <section id="how-it-works" className="py-16 md:py-24 bg-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-10 md:mb-16">
                    <h2 className="text-3xl font-black text-navy tracking-tight">How DateSpark works</h2>
                </div>

                <div className="relative">
                    {/* Connection Line (Desktop) */}
                    <div className="hidden lg:block absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -translate-y-1/2 z-0" />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
                        {steps.map((step, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.2 }}
                                className="flex flex-col items-center text-center"
                            >
                                <div className="relative mb-8">
                                    <div className="w-16 h-16 bg-coral text-white rounded-full flex items-center justify-center text-xl font-black shadow-lg shadow-coral/30 relative z-10">
                                        {step.number}
                                    </div>
                                    {/* Pulse effect */}
                                    <div className="absolute inset-0 bg-coral/20 rounded-full animate-ping scale-150 opacity-0" />
                                </div>
                                <h3 className="text-xl font-black text-navy mb-4">{step.title}</h3>
                                <p className="text-gray-400 font-medium leading-relaxed max-w-[240px]">
                                    {step.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;
