import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Calendar, User } from 'lucide-react';

const BlogSection = () => {
    const posts = [
        {
            id: 1,
            date: 'April 28, 2026',
            author: 'Elena Rossi',
            title: 'How AI Saved My Anniversary After My Reservation Was Canceled',
            excerpt: 'When my favorite bistro shut down due to a kitchen fire, DateSpark re-routed our entire night in 15 seconds. Here is how it happened.',
            image: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&q=80',
            category: 'Success Stories'
        },
        {
            id: 2,
            date: 'April 15, 2026',
            author: 'Marcus Chen',
            title: 'The "Vibe-Check" Algorithm: Why DateSpark Knows You Better Than You Do',
            excerpt: 'I tried to fool the AI by selecting conflicting vibes. The result was the most balanced, exciting night I have had in years.',
            image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80',
            category: 'Tech'
        },
        {
            id: 3,
            date: 'March 30, 2026',
            author: 'Sarah Jenkins',
            title: '5 Hidden Gems in the West Village You Won’t Find on Yelp',
            excerpt: 'Discovery is the heart of romance. We worked with DateSpark to uncover NYC’s best-kept secrets.',
            image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80',
            category: 'City Guides'
        }
    ];

    return (
        <section className="py-24 bg-white">
            <div className="container-custom">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                    <div className="max-w-2xl">
                        <motion.span 
                            initial={{ opacity: 0, x: -10 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="text-coral font-black uppercase tracking-[0.2em] text-xs"
                        >
                            The Journal
                        </motion.span>
                        <motion.h2 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="text-4xl md:text-5xl font-black text-navy mt-4 leading-tight"
                        >
                            Insights from the <br /> <span className="text-coral">Front Lines of Romance.</span>
                        </motion.h2>
                    </div>
                    <motion.button 
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="group flex items-center gap-2 text-navy font-black text-sm uppercase tracking-widest hover:text-coral transition-colors"
                    >
                        View All Posts <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </motion.button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    {posts.map((post, idx) => (
                        <motion.article
                            key={post.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className="flex flex-col group cursor-pointer"
                        >
                            <div className="relative aspect-[16/10] rounded-[2.5rem] overflow-hidden mb-6 shadow-lg group-hover:shadow-2xl transition-all duration-500">
                                <img 
                                    src={post.image} 
                                    alt={post.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                />
                                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-1 rounded-full">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-navy">{post.category}</span>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-4 text-gray-400 text-xs font-bold mb-4 uppercase tracking-wider">
                                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {post.date}</span>
                                <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {post.author}</span>
                            </div>

                            <h3 className="text-2xl font-black text-navy mb-4 leading-tight group-hover:text-coral transition-colors line-clamp-2">
                                {post.title}
                            </h3>
                            
                            <p className="text-gray-500 font-medium leading-relaxed mb-6 line-clamp-3">
                                {post.excerpt}
                            </p>

                            <div className="mt-auto pt-4 border-t border-gray-100 flex items-center gap-2 text-navy font-black text-[10px] uppercase tracking-[0.2em] group-hover:gap-4 transition-all">
                                Read Article <ArrowRight className="w-4 h-4 text-coral" />
                            </div>
                        </motion.article>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default BlogSection;
