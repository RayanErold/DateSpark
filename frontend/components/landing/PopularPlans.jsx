import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, ArrowUpRight, ArrowRight, Sparkles, MapPin } from 'lucide-react';
import axios from 'axios';

const QUICK_CITIES = ['New York', 'Los Angeles', 'Chicago', 'Miami', 'San Francisco'];

const PopularPlans = ({ selectedCity: propCity, setSelectedCity: propSetCity, userCoords, searchRadius }) => {
    const navigate = useNavigate();
    const [localCity, setLocalCity] = useState('New York');
    const selectedCity = propCity || localCity;
    const setSelectedCity = propSetCity || setLocalCity;
    const [plans, setPlans] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const API_URL = import.meta.env.VITE_API_URL || '';

    const getProxiedPhoto = (photoUrl) => {
        if (!photoUrl) return null;
        if (photoUrl.includes('unsplash')) return null; // Filter out Unsplash placeholder images
        if (photoUrl.includes('googleusercontent.com')) return photoUrl;
        
        // Use the backend proxy for Google Places photos to bypass CORS/referrer restrictions
        if (photoUrl.includes('googleapis.com') || photoUrl.includes('staticmap') || photoUrl.includes('maps.googleapis.com')) {
            return `${API_URL}/api/photo-proxy?url=${encodeURIComponent(photoUrl)}`;
        }
        return photoUrl;
    };

    useEffect(() => {
        const fetchPlans = async () => {
            setIsLoading(true);
            try {
                let url = `${API_URL}/api/trending-plans?location=${encodeURIComponent(selectedCity)}`;
                if (userCoords?.lat && userCoords?.lng) {
                    url += `&lat=${userCoords.lat}&lng=${userCoords.lng}&radius=${searchRadius || 15}`;
                }
                const response = await axios.get(url);
                if (response.data && response.data.length > 0) {
                    // Map the DB plan structure to the component's expected structure
                    const mappedPlans = response.data
                        .map(plan => {
                            const steps = plan.itinerary?.steps || [];
                            // Find the first photo that doesn't use Unsplash
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
                } else {
                    setPlans([]);
                }
            } catch (error) {
                console.error('Failed to fetch trending plans:', error);
                setPlans([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPlans();
    }, [selectedCity, userCoords?.lat, userCoords?.lng, searchRadius]);

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
                            <div key={i} className="bg-white rounded-xl md:rounded-2xl h-[300px] sm:h-[350px] md:h-[400px] animate-pulse shadow-sm w-[210px] sm:w-[260px] md:w-auto flex-shrink-0 snap-start" />
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="py-16 md:py-24 bg-gray-50/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div className="space-y-1">
                        <h2 className="text-3xl font-black text-navy tracking-tight flex items-center gap-3">
                            {userCoords?.lat ? 'Trending Spots Near You' : `Popular Plans in ${selectedCity}`} <Sparkles className="w-6 h-6 text-coral" />
                        </h2>
                        <p className="text-gray-400 font-bold text-sm uppercase tracking-widest pl-1">
                            Real venues, real photos from Google
                        </p>
                    </div>
                    
                    {/* Location selector pills */}
                    <div className="flex gap-2 overflow-x-auto scrollbar-none pb-2 md:pb-0">
                        {QUICK_CITIES.map(c => (
                            <button
                                key={c}
                                onClick={() => setSelectedCity(c)}
                                className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-black transition-all border ${
                                    selectedCity.toLowerCase() === c.toLowerCase()
                                        ? 'bg-coral border-coral text-white shadow-md'
                                        : 'bg-white border-slate-200 text-gray-500 hover:border-gray-300 hover:bg-slate-50'
                                }`}
                            >
                                {c}
                            </button>
                        ))}
                    </div>
                </div>

                {plans.length > 0 ? (
                    <div className="flex md:grid md:grid-cols-2 lg:grid-cols-4 gap-6 overflow-x-auto md:overflow-visible pb-4 md:pb-0 snap-x snap-mandatory scrollbar-hide">
                        {plans.map((plan, i) => (
                            <motion.div
                                 key={i}
                                 initial={{ opacity: 0, scale: 0.95 }}
                                 whileInView={{ opacity: 1, scale: 1 }}
                                 viewport={{ once: true }}
                                 transition={{ delay: i * 0.1 }}
                                 onClick={handlePlanClick}
                                 className="bg-white rounded-xl md:rounded-2xl overflow-hidden shadow-sm border border-gray-100 group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer w-[210px] sm:w-[260px] md:w-auto flex-shrink-0 snap-start"
                            >
                                {/* Image Container */}
                                <div className="relative h-36 sm:h-48 md:h-64 overflow-hidden bg-navy/5">
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
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                    
                                    {/* Overlay Tags */}
                                    <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
                                        <div className="px-2 sm:px-2.5 py-1 bg-coral text-white text-[8px] sm:text-[9px] font-black rounded-lg flex items-center gap-1 shadow-sm">
                                            <Star className="w-2 sm:w-2.5 h-2 sm:h-2.5 fill-white" /> {plan.tag}
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <div className="px-2 py-0.5 sm:py-1 bg-black/40 backdrop-blur-sm text-white text-[7px] sm:text-[8px] font-black rounded-md uppercase tracking-wider">
                                                {plan.category}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="absolute bottom-3 left-3">
                                        <div className="px-2 py-0.5 sm:py-1 bg-white/20 backdrop-blur-md text-white text-[8px] sm:text-[9px] font-black rounded-md uppercase tracking-widest border border-white/20">
                                            {plan.location}
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-3.5 sm:p-4.5 md:p-6">
                                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                                        <div className="flex items-center gap-1">
                                            <Star className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-coral fill-coral" />
                                            <span className="text-xs sm:text-sm font-black text-navy">{plan.rating}</span>
                                            <span className="text-[10px] sm:text-xs font-medium text-gray-400">({plan.reviews})</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-coral animate-pulse">
                                            <ArrowUpRight className="w-2.5 sm:w-3 h-2.5 sm:h-3" />
                                            <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest">{plan.status}</span>
                                        </div>
                                    </div>

                                    <button className="w-full py-2.5 sm:py-3 md:py-4 bg-gray-50 text-navy border border-gray-100 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] md:text-[11px] font-black uppercase tracking-widest group-hover:bg-navy group-hover:text-white group-hover:border-navy transition-all flex items-center justify-center gap-1.5 sm:gap-2 group">
                                        View Itinerary <ArrowRight className="w-3 sm:w-3.5 h-3 sm:h-3.5 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center max-w-xl mx-auto shadow-sm flex flex-col items-center justify-center gap-4">
                        <div className="w-12 h-12 bg-coral/10 rounded-full flex items-center justify-center">
                            <MapPin className="w-6 h-6 text-coral" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-black text-navy text-lg">No date plans in {selectedCity} yet</h3>
                            <p className="text-gray-400 text-sm font-semibold max-w-sm">
                                We haven't verified any itineraries with real photos in {selectedCity} yet. Sign up to create the first one!
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/signup')}
                            className="px-6 py-3 bg-navy text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-coral transition-colors shadow-sm"
                        >
                            Generate a Plan
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
};

export default PopularPlans;
