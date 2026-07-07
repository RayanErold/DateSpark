import React, { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Sparkles, MapPin, Star, ChevronRight } from 'lucide-react';

const SwipeCard = ({ plan, isTop, onSwipe, onView, theme }) => {
    const [photoIndex, setPhotoIndex] = useState(0);
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-25, 25]);
    const opacity = useTransform(x, [-250, -200, 0, 200, 250], [0, 1, 1, 1, 0]);
    const likeOpacity = useTransform(x, [50, 150], [0, 1]);
    const passOpacity = useTransform(x, [-150, -50], [1, 0]);

    if (!isTop) {
        return (
            <div className="absolute inset-0 rounded-[2rem] overflow-hidden shadow-2xl scale-[0.96] translate-y-4 opacity-50 transition-all duration-500">
                <div className="h-full w-full bg-plum/60 backdrop-blur-sm" />
            </div>
        );
    }

    if (!plan || (!Array.isArray(plan.itinerary) && !plan.itinerary?.steps)) {
        return (
            <div className="absolute inset-0 bg-plum rounded-[2rem] flex flex-col items-center justify-center p-8 text-center gap-4 shadow-xl">
                <Sparkles className="w-8 h-8 text-ivory/20" />
                <p className="text-ivory/40 text-sm font-semibold font-outfit">Plan data unavailable</p>
                <button onClick={() => onSwipe('left')} className="px-6 py-2 bg-ivory/10 text-ivory rounded-xl text-xs font-semibold font-outfit">Skip</button>
            </div>
        );
    }

    const API_URL = import.meta.env.VITE_API_URL || '';
    const getProxiedPhoto = (photoUrl) => {
        if (!photoUrl) return null;
        if (photoUrl.includes('staticmap') || photoUrl.includes('maps.googleapis.com/maps/api/staticmap')) return null;
        if (photoUrl.includes('googleusercontent.com')) return photoUrl;
        if (photoUrl.includes('places.googleapis.com') || photoUrl.includes('maps.googleapis.com')) {
            return `${API_URL}/api/photo-proxy?url=${encodeURIComponent(photoUrl)}`;
        }
        return photoUrl;
    };

    const cardTitle = plan.vibe ? `${plan.vibe} Date` : 'Trending Date';
    const cardLocation = plan.location || 'New York, NY';
    const cardRating = plan.avg_rating ? parseFloat(plan.avg_rating).toFixed(1) : '4.9';
    const triesCount = plan.boost_count !== undefined ? plan.boost_count : (plan.total_tries || 0);
    const steps = Array.isArray(plan.itinerary) ? plan.itinerary : plan.itinerary?.steps || [];
    const photos = steps
        .map(s => s.photoUrl || s.image)
        .filter(Boolean)
        .map(getProxiedPhoto)
        .filter(Boolean);
    const currentPhoto = photos.length > 0 ? photos[photoIndex] : 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80';
    const currentVenue = steps[photoIndex]?.venue || 'Discovery Stop';

    const handlePhotoTap = (e) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        if (clickX < rect.width / 2) {
            setPhotoIndex(prev => Math.max(0, prev - 1));
        } else {
            setPhotoIndex(prev => Math.min(photos.length - 1, prev + 1));
        }
    };

    return (
        <motion.div
            style={{ x, rotate, opacity }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.9}
            onDragEnd={(_, info) => {
                if (info.offset.x > 120) onSwipe('right');
                else if (info.offset.x < -120) onSwipe('left');
            }}
            whileDrag={{ scale: 1.02 }}
            className="absolute inset-0 rounded-[2rem] overflow-hidden cursor-grab active:cursor-grabbing shadow-2xl"
            onClick={handlePhotoTap}
        >
            {/* Full-bleed photo */}
            <motion.img
                key={currentPhoto}
                src={currentPhoto}
                alt={currentVenue}
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Top gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-plum/60 via-transparent to-transparent z-10" />

            {/* Bottom gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-plum/90 via-plum/40 to-transparent z-10" />

            {/* Swipe indicators */}
            <motion.div
                style={{ opacity: likeOpacity }}
                className="absolute top-12 left-6 z-30 rotate-[-12deg] border-[3px] border-rose rounded-xl px-4 py-2"
            >
                <span className="text-rose font-semibold text-2xl tracking-widest font-outfit">SAVE ♡</span>
            </motion.div>
            <motion.div
                style={{ opacity: passOpacity }}
                className="absolute top-12 right-6 z-30 rotate-[12deg] border-[3px] border-champagne/80 rounded-xl px-4 py-2"
            >
                <span className="text-champagne font-semibold text-2xl tracking-widest font-outfit">PASS ✕</span>
            </motion.div>

            {/* Top bar: Pagination + Badges */}
            <div className="absolute top-0 inset-x-0 z-20 px-4 pt-4">
                {photos.length > 1 && (
                    <div className="flex gap-1.5 mb-3">
                        {photos.map((_, idx) => (
                            <div
                                key={idx}
                                className={`h-[3px] flex-1 rounded-full transition-all duration-300 ${
                                    idx === photoIndex ? 'bg-ivory shadow-[0_0_8px_rgba(250,247,242,0.8)]' : 'bg-ivory/30'
                                }`}
                            />
                        ))}
                    </div>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="bg-gradient-to-r from-rose to-pink-400 text-ivory text-[9px] font-semibold px-3 py-1 rounded-full uppercase tracking-widest shadow-sm font-outfit">
                        TRENDING
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-tighter px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-md border border-ivory/20 text-ivory/80 font-outfit">
                        <MapPin className="w-3 h-3 text-rose" /> {cardLocation}
                    </div>
                </div>
            </div>

            {/* Bottom overlay: Info + CTA */}
            <div className="absolute bottom-0 inset-x-0 z-20 px-5 pb-6 pt-10">
                <h3 className="text-[26px] font-bold text-ivory leading-tight tracking-tight mb-1 drop-shadow-lg font-serif">
                    {cardTitle}
                </h3>
                <div className="flex items-center gap-1.5 mb-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose" />
                    <span className="text-ivory/70 text-xs font-semibold uppercase tracking-widest truncate font-outfit">
                        {currentVenue}
                    </span>
                    {photos.length > 1 && (
                        <span className="text-ivory/40 text-[10px] font-semibold ml-auto font-outfit">
                            {photoIndex + 1} / {photos.length}
                        </span>
                    )}
                </div>

                {/* Stats + CTA */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-rose fill-rose" />
                                <span className="font-semibold text-ivory text-base font-outfit">{cardRating}</span>
                            </div>
                            <span className="text-[9px] font-semibold uppercase tracking-widest text-ivory/40 font-outfit">Rating</span>
                        </div>
                        <div className="w-px h-7 bg-ivory/10" />
                        <div className="flex flex-col">
                            <span className="font-semibold text-ivory text-base font-outfit">{triesCount}</span>
                            <span className="text-[9px] font-semibold uppercase tracking-widest text-ivory/40 font-outfit">Tries</span>
                        </div>
                    </div>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            onView();
                        }}
                        className="px-5 py-2.5 bg-ivory/15 backdrop-blur-md border border-ivory/25 text-ivory font-semibold rounded-xl text-xs shadow-lg active:scale-95 transition-all flex items-center gap-2 hover:bg-ivory/25 group/btn font-outfit uppercase tracking-wider"
                    >
                        View Plan
                        <ChevronRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default SwipeCard;
