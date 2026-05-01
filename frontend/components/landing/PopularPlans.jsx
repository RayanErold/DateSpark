import React from 'react';
import { motion } from 'framer-motion';
import { Star, ArrowUpRight, ArrowRight } from 'lucide-react';

const PopularPlans = () => {
    const plans = [
        {
            title: 'Classic Romance',
            location: 'SOHO, MANHATTAN, NY',
            rating: 4.9,
            reviews: 12,
            tag: '#1 IN MANHATTAN',
            image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&q=80&w=400',
            status: 'RISING',
            category: 'CLASSIC ROMANCE'
        },
        {
            title: 'A Curated Playful Evening',
            location: 'EAST BRONX',
            rating: 4.9,
            reviews: 4,
            tag: 'TOP RATED',
            image: 'https://images.unsplash.com/photo-1522336572468-97b06e8ef143?auto=format&fit=crop&q=80&w=400',
            status: 'RISING',
            category: 'PLAYFUL EVENING'
        },
        {
            title: 'The Ultimate Chill Experience',
            location: 'MANHATTAN',
            rating: 4.9,
            reviews: 7,
            tag: 'TRENDING',
            image: 'https://images.unsplash.com/photo-1493770348161-369560ae357d?auto=format&fit=crop&q=80&w=400',
            status: 'RISING',
            category: 'CHILL EXPERIENCE'
        },
        {
            title: 'Classic Romance',
            location: 'SOUTHEAST YONKERS',
            rating: 4.0,
            reviews: 3,
            tag: 'NEW',
            image: 'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?auto=format&fit=crop&q=80&w=400',
            status: 'RISING',
            category: 'ROMANCE'
        }
    ];

    return (
        <section className="py-16 md:py-24 bg-gray-50/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between mb-8 md:mb-12">
                    <h2 className="text-3xl font-black text-navy tracking-tight">Popular Plans</h2>
                    <button className="flex items-center gap-1.5 text-coral font-black text-sm uppercase tracking-widest group">
                        View all <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {plans.map((plan, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-gray-100 group hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                        >
                            {/* Image Container */}
                            <div className="relative h-64 overflow-hidden">
                                <img 
                                    src={plan.image} 
                                    alt={plan.title}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                
                                {/* Overlay Tags */}
                                <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
                                    <div className="px-3 py-1.5 bg-coral text-white text-[9px] font-black rounded-lg flex items-center gap-1">
                                        <Star className="w-2.5 h-2.5 fill-white" /> {plan.tag}
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <div className="px-2.5 py-1 bg-black/40 backdrop-blur-sm text-white text-[8px] font-black rounded-md uppercase tracking-wider">
                                            {plan.category}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="absolute bottom-4 left-4">
                                    <div className="px-2.5 py-1 bg-white/20 backdrop-blur-md text-white text-[9px] font-black rounded-md uppercase tracking-widest border border-white/20">
                                        {plan.location}
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-1">
                                        <Star className="w-3.5 h-3.5 text-coral fill-coral" />
                                        <span className="text-sm font-black text-navy">{plan.rating}</span>
                                        <span className="text-xs font-medium text-gray-400">({plan.reviews})</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-coral animate-pulse">
                                        <ArrowUpRight className="w-3 h-3" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">{plan.status}</span>
                                    </div>
                                </div>

                                <button className="w-full py-4 bg-gray-50 text-navy border border-gray-100 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-navy hover:text-white hover:border-navy transition-all flex items-center justify-center gap-2 group">
                                    View Full Itinerary <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default PopularPlans;
