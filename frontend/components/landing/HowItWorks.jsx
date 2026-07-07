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
        <section id="how-it-works" className="py-16 md:py-24 bg-mist overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-10 md:mb-16">
                    <span className="editorial-label mb-3 block">The Process</span>
                    <h2 className="text-3xl font-serif font-bold text-plum tracking-tight">How DateSpark works</h2>
                </div>

                <div className="relative">
                    {/* Connection Line (Desktop) */}
                    <div className="hidden lg:block absolute top-1/2 left-0 w-full h-0.5 bg-blush/60 -translate-y-1/2 z-0" />

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
                                    <div className="w-16 h-16 bg-rose text-ivory rounded-full flex items-center justify-center text-xl font-semibold shadow-lg shadow-rose/25 relative z-10 font-outfit">
                                        {step.number}
                                    </div>
                                </div>
                                <h3 className="text-xl font-semibold text-plum mb-4 font-outfit">{step.title}</h3>
                                <p className="text-taupe font-medium leading-relaxed max-w-[240px]">
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
