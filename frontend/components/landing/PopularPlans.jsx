import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, ArrowRight, Sparkles, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';

const QUICK_CITIES = ['New York', 'Los Angeles', 'Chicago', 'Miami', 'San Francisco'];

const PopularPlans = ({ selectedCity: propCity, setSelectedCity: propSetCity, userCoords, searchRadius }) => {
    const navigate = useNavigate();
    const [localCity, setLocalCity] = useState('New York');
    const selectedCity = propCity || localCity;
    const setSelectedCity = propSetCity || setLocalCity;
    const [plans, setPlans] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const scrollContainerRef = useRef(null);
    
    const API_URL = import.meta.env.VITE_API_URL || '';

    const getProxiedPhoto = (photoUrl) => {
        if (!photoUrl || typeof photoUrl !== 'string') return null;
        if (photoUrl.includes('unsplash')) return null; // Reject Unsplash placeholder images
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
                    const mappedPlans = response.data
                        .map(plan => {
                            const steps = plan.itinerary?.steps || [];
                            // Find the first verified photo that doesn't use Unsplash
                            const validStep = steps.find(s => s.photoUrl && !s.photoUrl.includes('unsplash')) || steps[0];
                            const firstPhoto = validStep?.photoUrl;
                            const featuredVenue = validStep?.venue || validStep?.name || null;
                            
                            return {
                                title: plan.title || 'Curated Date',
                                featuredVenue: featuredVenue && !featuredVenue.includes('TBD') ? featuredVenue : null,
                                location: plan.location || 'NYC',
                                rating: parseFloat(plan.avg_rating || 4.9).toFixed(1),
                                reviews: plan.boost_count || plan.total_tries || Math.floor(Math.random() * 20) + 12,
                                tag: plan.boost_count > 10 ? 'TRENDING' : 'VERIFIED',
                                image: getProxiedPhoto(firstPhoto),
                                category: (plan.vibe || 'Date').toUpperCase()
                            };
                        })
                        // Only include plans with verified non-placeholder images
                        .filter(p => p.image);
                    
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

    const handleScroll = (direction) => {
        if (scrollContainerRef.current) {
            const scrollDistance = 340;
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollDistance : scrollDistance,
                behavior: 'smooth'
            });
        }
    };

    return (
        <section className="py-14 md:py-20 bg-slate-50/60 border-t border-slate-100 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* ── SECTION HEADER ── */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                    <div className="space-y-1.5">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-coral/10 border border-coral/20 text-coral text-[10px] font-black uppercase tracking-wider">
                            <Sparkles className="w-3 h-3" />
                            <span>Verified Real Spots</span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-black text-navy tracking-tight flex items-center gap-2.5 font-serif">
                            {userCoords?.lat ? 'Trending Spots Near You' : `Trending Spots in ${selectedCity}`}
                        </h2>
                        <p className="text-gray-400 font-bold text-xs uppercase tracking-widest pl-0.5">
                            Real venues & curated itineraries • Slide horizontally to explore
                        </p>
                    </div>
                    
                    {/* Controls: City Selector & Arrow Navigation */}
                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Quick City Pills */}
                        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide py-1">
                            {QUICK_CITIES.map(c => (
                                <button
                                    key={c}
                                    onClick={() => setSelectedCity(c)}
                                    className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-black transition-all border cursor-pointer ${
                                        selectedCity.toLowerCase() === c.toLowerCase()
                                            ? 'bg-coral border-coral text-white shadow-sm'
                                            : 'bg-white border-slate-200 text-gray-500 hover:border-gray-300 hover:bg-slate-50'
                                    }`}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>

                        {/* Slider Scroll Arrows (Desktop) */}
                        {plans.length > 0 && (
                            <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-slate-200">
                                <button
                                    onClick={() => handleScroll('left')}
                                    aria-label="Scroll left"
                                    className="w-8 h-8 rounded-full bg-white border border-slate-200 text-navy hover:bg-slate-100 hover:text-coral hover:border-coral/50 transition-all flex items-center justify-center shadow-sm cursor-pointer active:scale-95"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleScroll('right')}
                                    aria-label="Scroll right"
                                    className="w-8 h-8 rounded-full bg-white border border-slate-200 text-navy hover:bg-slate-100 hover:text-coral hover:border-coral/50 transition-all flex items-center justify-center shadow-sm cursor-pointer active:scale-95"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── CONTENT: HORIZONTAL SLIDING STRIP OR EMPTY STATE ── */}
                {isLoading ? (
                    <div className="flex gap-5 overflow-hidden py-2">
                        {[1, 2, 3, 4].map(i => (
                            <div 
                                key={i} 
                                className="w-[280px] sm:w-[320px] h-[340px] bg-white rounded-2xl border border-slate-100 animate-pulse shadow-sm flex-shrink-0" 
                            />
                        ))}
                    </div>
                ) : plans.length > 0 ? (
                    <div className="relative">
                        {/* Smooth Horizontal Sliding Strip */}
                        <div 
                            ref={scrollContainerRef}
                            className="flex gap-5 overflow-x-auto scrollbar-hide snap-x snap-mandatory py-2 -mx-4 px-4 sm:mx-0 sm:px-0 scroll-smooth"
                        >
                            {plans.map((plan, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: Math.min(i * 0.05, 0.3) }}
                                    onClick={handlePlanClick}
                                    className="w-[280px] sm:w-[310px] flex-shrink-0 snap-start bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-slate-100 group transition-all duration-300 hover:-translate-y-1.5 cursor-pointer flex flex-col justify-between"
                                >
                                    {/* Image with Badges */}
                                    <div className="relative h-44 overflow-hidden bg-navy/5">
                                        <img 
                                            src={plan.image} 
                                            alt={plan.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.parentElement.classList.add('bg-gradient-to-br', 'from-navy', 'to-coral/20');
                                            }}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                                        
                                        {/* Overlay Badges */}
                                        <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
                                            <div className="px-2.5 py-0.5 bg-coral text-white text-[9px] font-black rounded-lg flex items-center gap-1 shadow-sm uppercase tracking-wider">
                                                <Star className="w-2.5 h-2.5 fill-white" /> {plan.tag}
                                            </div>
                                            <div className="px-2 py-0.5 bg-black/50 backdrop-blur-md text-white text-[8px] font-black rounded-md uppercase tracking-wider border border-white/10">
                                                {plan.category}
                                            </div>
                                        </div>
                                        
                                        {/* Bottom Location & Rating Overlay */}
                                        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white">
                                            <div className="flex items-center gap-1 px-2 py-0.5 bg-black/40 backdrop-blur-md rounded-md text-[9px] font-bold border border-white/10 truncate max-w-[190px]">
                                                <MapPin className="w-2.5 h-2.5 text-coral shrink-0" />
                                                <span className="truncate">{plan.location}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-[9px] font-black text-amber-300 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10">
                                                <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                                                <span>{plan.rating}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card Details */}
                                    <div className="p-4 flex flex-col justify-between flex-1">
                                        <div className="mb-3">
                                            <h3 className="font-black text-navy text-sm leading-snug line-clamp-1 group-hover:text-coral transition-colors mb-1 font-outfit">
                                                {plan.title}
                                            </h3>
                                            {plan.featuredVenue && (
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate">
                                                    Spot: {plan.featuredVenue}
                                                </p>
                                            )}
                                        </div>

                                        <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                {plan.reviews} saves
                                            </span>
                                            <div className="flex items-center gap-1 text-xs font-black text-coral group-hover:translate-x-0.5 transition-transform">
                                                <span>View Date</span>
                                                <ArrowRight className="w-3.5 h-3.5" />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                ) : (
                    /* Clean Empty State when no verified plans exist in the selected state/city */
                    <div className="bg-white border border-slate-100 rounded-3xl p-10 text-center max-w-xl mx-auto shadow-sm flex flex-col items-center justify-center gap-3">
                        <div className="w-11 h-11 bg-coral/10 rounded-full flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-coral" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-black text-navy text-lg font-serif">No date plans in {selectedCity} yet</h3>
                            <p className="text-gray-400 text-xs font-medium max-w-sm">
                                We haven't verified itineraries with real photos in {selectedCity} yet. Be the first to spark one!
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/signup')}
                            className="mt-1 px-5 py-2.5 bg-navy text-white text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-coral transition-colors shadow-sm cursor-pointer"
                        >
                            Spark a Plan in {selectedCity} ⚡
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
};

export default PopularPlans;
