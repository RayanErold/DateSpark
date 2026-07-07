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
        <section className="py-16 md:py-24 bg-ivory relative overflow-hidden">
            <div className="absolute left-0 bottom-0 w-96 h-96 bg-rose/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute right-0 top-0 w-64 h-64 bg-champagne/20 rounded-full blur-[80px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                {/* Header */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-50px" }}
                    variants={itemVariants}
                    className="text-center mb-10 md:mb-16"
                >
                    <span className="inline-block editorial-label bg-rose/10 px-4 py-1.5 rounded-full mb-5">
                        Real Reviews
                    </span>
                    <h2 className="text-4xl md:text-5xl font-serif font-bold text-plum leading-tight">
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
                        <motion.div variants={itemVariants} key={i} className="editorial-card p-6 text-center hover:shadow-md transition-shadow">
                            <div className="text-3xl font-semibold text-plum font-outfit">{s.value}</div>
                            <div className="editorial-label mt-1">{s.label}</div>
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
                            className="editorial-card p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
                        >
                            {/* Stars */}
                            <div className="flex gap-0.5 mb-5">
                                {Array.from({ length: t.rating }).map((_, j) => (
                                    <Star key={j} className="w-4 h-4 fill-rose text-rose" />
                                ))}
                            </div>

                            <p className="text-taupe leading-relaxed flex-1 text-[15px] mb-6 italic font-serif">
                                "{t.text}"
                            </p>

                            <div className="flex items-center gap-3 pt-4 border-t border-blush/40">
                                <img
                                    src={t.avatar}
                                    alt={t.author}
                                    className="w-10 h-10 rounded-full object-cover border-2 border-blush"
                                />
                                <div>
                                    <div className="font-semibold text-plum text-sm font-outfit">{t.author}</div>
                                    <div className="text-xs text-taupe/70 font-medium">{t.role}</div>
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
