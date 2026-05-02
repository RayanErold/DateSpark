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
    
    // Extract photos and filter out invalid/null ones
    const photos = steps
        .map(s => s.photoUrl)
        .filter(Boolean);
        
    const hasPhotos = photos.length > 0;
    const currentPhoto = hasPhotos ? photos[photoIndex] : null;

    const handleNext = (e) => {
        e.stopPropagation();
        if (photos.length > 0) {
            setPhotoIndex(prev => (prev + 1) % photos.length);
        }
    };

    const handlePrev = (e) => {
        e.stopPropagation();
        if (photos.length > 0) {
            setPhotoIndex(prev => (prev - 1 + photos.length) % photos.length);
        }
    };

    return (
        <motion.div
            whileHover={{ y: -5 }}
            className={`flex-shrink-0 w-[75vw] sm:w-[280px] rounded-3xl border overflow-hidden shadow-xl transition-all duration-300 ${theme === 'dark' ? 'bg-navy border-white/10' : 'bg-white border-gray-100'}`}
        >
            {/* Visual Header (Rectangular Photo) */}
            <div className="relative h-44 overflow-hidden group/photo">
                {hasPhotos ? (
                    <>
                        <img
                            src={currentPhoto}
                            alt={plan.vibe}
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
                                    }}
                                />
                            ))}
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                    </>
                ) : (
                    <div className="relative h-full w-full">
                        <img 
                            src={(() => {
                                const v = (plan.vibe || 'chill').toLowerCase();
                                if (v.includes('romantic')) return 'https://images.unsplash.com/photo-1516589174184-c68526514ec0?w=600&q=80';
                                if (v.includes('chill') || v.includes('cozy')) return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80';
                                if (v.includes('night') || v.includes('bar')) return 'https://images.unsplash.com/photo-1514525253361-bee8d419b74e?w=600&q=80';
                                if (v.includes('active') || v.includes('outdoor')) return 'https://images.unsplash.com/photo-1502904550040-753d5ad069de?w=600&q=80';
                                return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80';
                            })()} 
                            className="w-full h-full object-cover opacity-60 grayscale-[20%]"
                            alt="Fallback"
                        />
                        <div className="absolute inset-0 bg-gradient-to-br from-navy/80 via-navy/40 to-coral/30 flex flex-col items-center justify-center gap-3 p-8">
                            <MapPin className="w-12 h-12 text-white/40" />
                            <span className="text-white/60 text-xs font-black uppercase tracking-widest text-center shadow-sm">Visualizing {plan.vibe}...</span>
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
