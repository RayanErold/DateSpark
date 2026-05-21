import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
    Star, 
    Sparkles, 
    MapPin, 
    ChevronLeft, 
    ChevronRight, 
    Flame, 
    ArrowLeft 
} from 'lucide-react';

const VisualSparkCard = ({ plan, onView, theme, isTopInBorough, boroughName }) => {
    const [photoIndex, setPhotoIndex] = useState(0);
    const itinerary = plan.itinerary || {};
    const steps = Array.isArray(itinerary) ? itinerary : (itinerary.steps || []);
    
    // Google Maps API Key for frontend-side photo reconstruction
    const googleMapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    const API_URL = import.meta.env.VITE_API_URL || '';

    /**
     * Routes Google Places photo URLs through the backend proxy.
     * 
     * WHY: Google Places photo endpoints block direct browser requests due to
     * CORS/referrer restrictions. Requests MUST be made server-to-server.
     * The backend /api/photo-proxy fetches the image and streams it back.
     */
    const getProxiedPhoto = (photoUrl) => {
        if (!photoUrl) return null;
        
        // If it's a Google Places URL, route through our backend proxy
        // WHY: Google restricts direct browser access (CORS)
        if (photoUrl.includes('places.googleapis.com') || photoUrl.includes('maps.googleapis.com')) {
            return `${API_URL}/api/photo-proxy?url=${encodeURIComponent(photoUrl)}`;
        }
        
        // For Unsplash or any other valid public URL, return as-is
        return photoUrl;
    };

    // Optimized photo extraction: Filter out obviously broken or non-visual steps
    const photos = steps
        .map(s => s.photoUrl)
        .filter(url => url && !url.includes('placeholder'))
        .map(getProxiedPhoto)
        .filter(Boolean); // Remove nulls from unsplash/invalid URLs


    const hasPhotos = photos.length > 0;
    const currentPhoto = photos[photoIndex];

    const [imageError, setImageError] = useState(false);

    // Auto-advance if a photo fails (preventing broken trending images)
    const handleImageError = (e) => {
        const errorUrl = e.target.src;
        console.warn(`[VisualSparkCard] Photo ${photoIndex + 1}/${photos.length} failed for ${plan.id}. URL: ${errorUrl.split('?')[0]}...`);
        
        // Ensure we have multiple photos to skip through
        if (photos && photos.length > 1 && photoIndex < photos.length - 1) {
            // Try the next photo in the itinerary sequence
            setPhotoIndex(prev => prev + 1);
            // Reset error state for the new attempt
            setImageError(false);
        } else {
            // No more photos left in this plan, trigger the premium gradient fallback
            setImageError(true);
        }
    };

    const handleNext = (e) => {
        e.stopPropagation();
        if (photos.length > 0) {
            setPhotoIndex(prev => (prev + 1) % photos.length);
            setImageError(false);
        }
    };

    const handlePrev = (e) => {
        e.stopPropagation();
        if (photos.length > 0) {
            setPhotoIndex(prev => (prev - 1 + photos.length) % photos.length);
            setImageError(false);
        }
    };

    return (
        <motion.div
            whileHover={{ y: -5 }}
            className={`flex-shrink-0 w-[75vw] sm:w-[280px] rounded-3xl border overflow-hidden shadow-xl transition-all duration-300 ${theme === 'dark' ? 'bg-navy border-white/10' : 'bg-white border-gray-100'}`}
        >
            {/* Visual Header (Rectangular Photo) */}
            <div className="relative h-44 overflow-hidden group/photo bg-navy/20">
                {hasPhotos && !imageError ? (
                    <>
                        <img
                            key={currentPhoto || `${plan.id}-${photoIndex}`}
                            src={currentPhoto}
                            alt={plan.vibe}
                            onError={handleImageError}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover/photo:scale-105"
                        />
                        {/* Glassmorphism Overlays */}
                        <div className="absolute top-4 left-4 flex flex-col gap-2 z-20">
                            {isTopInBorough && (
                                <div className="px-3 py-1.5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full text-[10px] font-black text-white uppercase tracking-widest shadow-xl flex items-center gap-1.5 animate-bounce">
                                    <Star className="w-3 h-3 fill-white" /> #1 in {boroughName}
                                </div>
                            )}
                            <div className="flex gap-2">
                                <div className="px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/20 text-[10px] font-black text-white uppercase tracking-widest shadow-xl flex items-center gap-1.5">
                                    <Sparkles className="w-3 h-3 text-coral" /> {plan.vibe}
                                </div>
                                <div className="px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-[10px] font-black text-white uppercase tracking-widest shadow-xl flex items-center gap-1.5">
                                    <MapPin className="w-3 h-3 text-coral" /> {plan.location}
                                </div>
                            </div>
                        </div>

                        {/* Pagination Arrows */}
                        {photos.length > 1 && (
                            <>
                                <button
                                    onClick={handlePrev}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full border border-white/10 flex items-center justify-center text-white opacity-0 group-hover/photo:opacity-100 transition-all z-30"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={handleNext}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full border border-white/10 flex items-center justify-center text-white opacity-0 group-hover/photo:opacity-100 transition-all z-30"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </>
                        )}

                        {/* Pagination Dots */}
                        <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1 z-20">
                            {photos.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`h-1 rounded-full transition-all duration-300 ${idx === photoIndex ? 'w-3 bg-white shadow-sm' : 'w-1 bg-white/30 hover:bg-white/50'}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setPhotoIndex(idx);
                                        setImageError(false);
                                    }}
                                />
                            ))}
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                    </>
                ) : (
                    <div className="premium-gradient-fallback relative h-full w-full flex flex-col items-center justify-center gap-4 p-8 overflow-hidden">
                        {/* Abstract Animated Mesh Background */}
                        <div className="absolute inset-0 opacity-20">
                            <div className="absolute top-0 -left-1/4 w-full h-full bg-emerald-500/20 blur-[120px] animate-pulse-slow" />
                            <div className="absolute bottom-0 -right-1/4 w-full h-full bg-navy/40 blur-[100px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
                        </div>

                        <div className="relative z-10 flex flex-col items-center gap-3">
                            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl flex items-center justify-center shadow-2xl">
                                <MapPin className="w-8 h-8 text-emerald-400/60" />
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-white/80 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Authentic Experience</span>
                                <span className="text-white/40 text-[9px] font-bold uppercase tracking-wider text-center max-w-[150px] leading-relaxed">
                                    Visualizing {plan.vibe || 'this experience'}...
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Content Body */}
            <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 mb-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            <span className={`text-base font-black ${theme === 'dark' ? 'text-white' : 'text-navy'}`}>{plan.avg_rating || '4.9'}</span>
                            <span className="text-xs text-gray-400 font-bold">({plan.boost_count !== undefined ? plan.boost_count : (plan.total_tries || 75)})</span>
                        </div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Overall Rating</span>
                    </div>
                    <div className="flex bg-coral/10 border border-coral/20 px-4 py-2 rounded-2xl items-center gap-2">
                        <Flame className="w-4 h-4 text-coral fill-coral" />
                        <span className="text-xs font-black text-coral uppercase tracking-widest">{(plan.boost_count || plan.total_tries || 75) > 50 ? 'Trending' : 'Rising'}</span>
                    </div>
                </div>

                <button
                    onClick={() => onView(plan)}
                    className={`w-full py-4 font-black rounded-2xl transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 group/btn ${theme === 'dark' ? 'bg-white text-navy hover:bg-coral hover:text-white' : 'bg-navy text-white hover:bg-coral hover:-translate-y-1'}`}
                >
                    View Full Itinerary
                    <ArrowLeft className="w-5 h-5 rotate-180 transition-transform group-hover/btn:translate-x-1" />
                </button>
            </div>
        </motion.div>
    );
};

export default VisualSparkCard;
