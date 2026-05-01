import React from 'react';
import { Star } from 'lucide-react';
import { motion } from 'framer-motion';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
        opacity: 1,
        transition: { staggerChildren: 0.15 }
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

const testimonials = [
    {
        text: "Best $1.99 I ever spent. No more 40-minute 'I don't know, what do you want to do?' conversations.",
        author: 'Alex & Sam',
        role: 'Busy Professionals, Manhattan',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop',
        rating: 5,
    },
    {
        text: "We found a secret jazz bar I never would've discovered otherwise. The itinerary was perfectly timed — every transition felt effortless.",
        author: 'Kade D.',
        role: 'Dating Coach, Brooklyn',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop',
        rating: 5,
    },
    {
        text: "It's like having a local friend who actually knows every hidden gem. We've used it three weekends in a row now.",
        author: 'Mia W.',
        role: 'Urban Explorer, NYC',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop',
        rating: 5,
    },
];

const stats = [
    { value: '5,000+', label: 'Couples Served' },
    { value: '4.9★', label: 'Average Rating' },
    { value: '60s', label: 'Plan Generated' },
    { value: '100%', label: 'Real Venues' },
];

const SocialProof = () => {
    return (
        <section className="py-16 md:py-24 bg-gray-50 relative overflow-hidden">
            <div className="absolute left-0 bottom-0 w-96 h-96 bg-coral/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                {/* Header */}
                <motion.div 
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-50px" }}
                    variants={itemVariants}
                    className="text-center mb-10 md:mb-16"
                >
                    <span className="inline-block text-xs font-black text-coral uppercase tracking-[0.2em] bg-coral/10 px-4 py-1.5 rounded-full mb-5">
                        Real Reviews
                    </span>
                    <h2 className="text-4xl md:text-5xl font-black text-navy leading-tight">
                        Loved by couples<br />across NYC.
                    </h2>
                </motion.div>

                {/* Stats bar */}
                <motion.div 
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-50px" }}
                    variants={containerVariants}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-14"
                >
                    {stats.map((s, i) => (
                        <motion.div variants={itemVariants} key={i} className="bg-white border border-gray-100 rounded-2xl p-6 text-center shadow-sm hover:shadow-md transition-shadow">
                            <div className="text-3xl font-black text-navy">{s.value}</div>
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{s.label}</div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Testimonial cards */}
                <motion.div 
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-50px" }}
                    variants={containerVariants}
                    className="grid md:grid-cols-3 gap-6"
                >
                    {testimonials.map((t, i) => (
                        <motion.div
                            variants={itemVariants}
                            key={i}
                            className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
                        >
                            {/* Stars */}
                            <div className="flex gap-0.5 mb-5">
                                {Array.from({ length: t.rating }).map((_, j) => (
                                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                                ))}
                            </div>

                            <p className="text-gray-600 leading-relaxed flex-1 text-[15px] mb-6">
                                "{t.text}"
                            </p>

                            <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
                                <img
                                    src={t.avatar}
                                    alt={t.author}
                                    className="w-10 h-10 rounded-full object-cover border-2 border-gray-100"
                                />
                                <div>
                                    <div className="font-black text-navy text-sm">{t.author}</div>
                                    <div className="text-xs text-gray-400 font-medium">{t.role}</div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};

export default SocialProof;
