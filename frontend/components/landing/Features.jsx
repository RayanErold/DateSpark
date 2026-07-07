import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Ticket, Sparkles, MapPin } from 'lucide-react';

const Features = () => {
    const navigate = useNavigate();
    const features = [
        {
            icon: <Calendar className="w-6 h-6 text-rose" />,
            title: 'Personalized Plans',
            description: 'Get date ideas tailored to your interests, vibe, and budget.',
            color: 'bg-rose/10'
        },
        {
            icon: <Ticket className="w-6 h-6 text-violet-400" />,
            title: 'Local Events',
            description: 'Discover curated events happening near you.',
            color: 'bg-violet-50'
        },
        {
            icon: <Sparkles className="w-6 h-6 text-pink-400" />,
            title: 'Smart Suggestions',
            description: 'AI-powered ideas that actually get you.',
            color: 'bg-blush/60'
        },
        {
            icon: <MapPin className="w-6 h-6 text-emerald-500" />,
            title: 'Easy Itineraries',
            description: 'Maps, timings, and stops—all in one place.',
            color: 'bg-emerald-50'
        }
    ];

    return (
        <section className="py-16 md:py-24 bg-mist border-y border-blush/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-10 md:mb-16">
                    <span className="editorial-label mb-3 block">Why couples love us</span>
                    <h2 className="text-3xl md:text-4xl font-serif font-bold text-plum tracking-tight">
                        Everything you need to plan the perfect date
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                    {features.map((feature, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            onClick={() => navigate('/signup')}
                            className="flex flex-col items-center text-center space-y-4 group cursor-pointer"
                        >
                            <div className={`w-16 h-16 rounded-full ${feature.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                {feature.icon}
                            </div>
                            <h3 className="text-base font-semibold text-plum uppercase tracking-wider font-outfit">{feature.title}</h3>
                            <p className="text-taupe text-sm font-medium leading-relaxed max-w-[200px]">
                                {feature.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Features;
