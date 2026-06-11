import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, ArrowUpRight, ArrowRight, Sparkles, MapPin } from 'lucide-react';
import axios from 'axios';

const PopularPlans = () => {
    const navigate = useNavigate();
    const [plans, setPlans] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const API_URL = import.meta.env.VITE_API_URL || '';
    const googleMapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    const getProxiedPhoto = (photoUrl) => {
        if (!photoUrl || photoUrl.includes('unsplash')) return null;
        if (photoUrl.includes('googleusercontent.com')) return photoUrl;
        
        // Use the backend proxy for Google Places photos to bypass CORS/referrer restrictions
        if (photoUrl.includes('googleapis.com') || photoUrl.includes('staticmap') || photoUrl.includes('maps.googleapis.com')) {
            return `${API_URL}/api/photo-proxy?url=${encodeURIComponent(photoUrl)}`;
        }
        return photoUrl;
    };

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const response = await axios.get(`${API_URL}/api/trending-plans`);
                if (response.data && response.data.length > 0) {
                    // Map the DB plan structure to the component's expected structure
                    const mappedPlans = response.data.slice(0, 8).map(plan => {
                        const steps = plan.itinerary?.steps || [];
                        const firstPhoto = steps.find(s => s.photoUrl && !s.photoUrl.includes('unsplash'))?.photoUrl;
                        
                        return {
                            title: plan.title || 'Curated Date',
                            location: plan.location || 'NYC',
                            rating: parseFloat(plan.avg_rating || 4.9).toFixed(1),
                            reviews: plan.boost_count || plan.total_tries || Math.floor(Math.random() * 20) + 5,
                            tag: plan.boost_count > 10 ? 'TRENDING' : 'NEW',
                            image: getProxiedPhoto(firstPhoto),
                            status: plan.total_tries > 50 ? 'HOT' : 'RISING',
                            category: (plan.vibe || 'Date').toUpperCase()
                        };
                    });
                    setPlans(mappedPlans);
                }
            } catch (error) {
                console.error('Failed to fetch trending plans:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPlans();
    }, []);

    const handlePlanClick = () => {
        navigate('/signup');
    };

    if (isLoading) {
        return (
            <section className="py-16 md:py-24 bg-gray-50/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="h-8 w-48 bg-gray-200 animate-pulse rounded-lg mb-12" />
                    <div className="flex md:grid md:grid-cols-2 lg:grid-cols-4 gap-6 overflow-x-auto md:overflow-visible pb-4 md:pb-0 snap-x snap-mandatory scrollbar-hide">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="bg-white rounded-[2rem] h-[400px] animate-pulse shadow-sm w-[280px] sm:w-[320px] md:w-auto flex-shrink-0 snap-start" />
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    if (plans.length === 0) return null;

    return (
        <section className="py-16 md:py-24 bg-gray-50/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between mb-8 md:mb-12">
                    <div className="space-y-1">
                        <h2 className="text-3xl font-black text-navy tracking-tight flex items-center gap-3">
                            Popular Plans <Sparkles className="w-6 h-6 text-coral" />
                        </h2>
                        <p className="text-gray-400 font-bold text-sm uppercase tracking-widest pl-1">Real venues, real photos from Google</p>
                    </div>
                    <button 
                        onClick={() => navigate('/signup')}
                        className="flex items-center gap-1.5 text-coral font-black text-sm uppercase tracking-widest group"
                    >
                        View all <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>

                <div className="flex md:grid md:grid-cols-2 lg:grid-cols-4 gap-6 overflow-x-auto md:overflow-visible pb-4 md:pb-0 snap-x snap-mandatory scrollbar-hide">
                    {plans.map((plan, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            onClick={handlePlanClick}
                            className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-gray-100 group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer w-[280px] sm:w-[320px] md:w-auto flex-shrink-0 snap-start"
                        >
                            {/* Image Container */}
                            <div className="relative h-64 overflow-hidden bg-navy/5">
                                {plan.image ? (
                                    <img 
                                        key={plan.image}
                                        src={plan.image} 
                                        alt={plan.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.parentElement.classList.add('bg-gradient-to-br', 'from-navy', 'to-coral/20');
                                        }}
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-navy to-coral/20 flex flex-col items-center justify-center p-6 text-center gap-3">
                                        <MapPin className="w-10 h-10 text-white/20" />
                                        <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">Photo from Google Places</span>
                                    </div>
                                )}
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

                                <button className="w-full py-4 bg-gray-50 text-navy border border-gray-100 rounded-xl text-[11px] font-black uppercase tracking-widest group-hover:bg-navy group-hover:text-white group-hover:border-navy transition-all flex items-center justify-center gap-2 group">
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
