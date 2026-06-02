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
                <div className="h-full w-full bg-navy/60 backdrop-blur-sm" />
            </div>
        );
    }

    if (!plan || (!Array.isArray(plan.itinerary) && !plan.itinerary?.steps)) {
        return (
            <div className="absolute inset-0 bg-navy rounded-[2rem] flex flex-col items-center justify-center p-8 text-center gap-4 shadow-xl">
                <Sparkles className="w-8 h-8 text-white/20" />
                <p className="text-white/40 text-sm font-bold">Plan data unavailable</p>
                <button onClick={() => onSwipe('left')} className="px-6 py-2 bg-white/10 text-white rounded-xl text-xs font-black">Skip</button>
            </div>
        );
    }

    const API_URL = import.meta.env.VITE_API_URL || '';
    const getProxiedPhoto = (photoUrl) => {
        if (!photoUrl) return null;
        if (photoUrl.includes('staticmap') || photoUrl.includes('maps.googleapis.com/maps/api/staticmap')) {
            return null;
        }
        if (photoUrl.includes('places.googleapis.com') || 
            photoUrl.includes('maps.googleapis.com') || 
            photoUrl.includes('googleusercontent.com')) {
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
    const hasPhotos = photos.length > 0;
    const currentPhoto = hasPhotos ? photos[photoIndex] : 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80';
    const currentVenue = steps[photoIndex]?.venue || 'Discovery Stop';
    const currentActivity = steps[photoIndex]?.activity || plan.vibe;

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
            {/* ── FULL-BLEED BACKGROUND PHOTO ── */}
            <motion.img
                key={currentPhoto}
                src={currentPhoto}
                alt={currentVenue}
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0 w-full h-full object-cover"
            />

            {/* ── TOP GRADIENT OVERLAY ── */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-transparent z-10" />

            {/* ── BOTTOM GRADIENT OVERLAY ── */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10" />

            {/* ── SWIPE INDICATORS ── */}
            <motion.div
                style={{ opacity: likeOpacity }}
                className="absolute top-12 left-6 z-30 rotate-[-12deg] border-[3px] border-green-400 rounded-xl px-4 py-2"
            >
                <span className="text-green-400 font-black text-2xl tracking-widest">SAVE ♡</span>
            </motion.div>
            <motion.div
                style={{ opacity: passOpacity }}
                className="absolute top-12 right-6 z-30 rotate-[12deg] border-[3px] border-red-400 rounded-xl px-4 py-2"
            >
                <span className="text-red-400 font-black text-2xl tracking-widest">PASS ✕</span>
            </motion.div>

            {/* ── TOP BAR: Pagination + Location ── */}
            <div className="absolute top-0 inset-x-0 z-20 px-4 pt-4">
                {/* Pagination bars */}
                {photos.length > 1 && (
                    <div className="flex gap-1.5 mb-3">
                        {photos.map((_, idx) => (
                            <div
                                key={idx}
                                className={`h-[3px] flex-1 rounded-full transition-all duration-300 ${
                                    idx === photoIndex
                                        ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]'
                                        : 'bg-white/30'
                                }`}
                            />
                        ))}
                    </div>
                )}
                {/* Badges row */}
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="bg-gradient-to-r from-coral to-pink-500 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">
                        TRENDING
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-tighter px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-md border border-white/20 text-white/80">
                        <MapPin className="w-3 h-3 text-coral" /> {cardLocation}
                    </div>
                </div>
            </div>

            {/* ── BOTTOM OVERLAY: Info + CTA ── */}
            <div className="absolute bottom-0 inset-x-0 z-20 px-5 pb-6 pt-10">
                {/* Plan title */}
                <h3 className="text-[26px] font-black text-white leading-tight tracking-tight mb-1 drop-shadow-lg">
                    {cardTitle}
                </h3>
                {/* Current venue name */}
                <div className="flex items-center gap-1.5 mb-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-coral" />
                    <span className="text-white/70 text-xs font-black uppercase tracking-widest truncate">
                        {currentVenue}
                    </span>
                    {photos.length > 1 && (
                        <span className="text-white/40 text-[10px] font-black ml-auto">
                            {photoIndex + 1} / {photos.length}
                        </span>
                    )}
                </div>

                {/* Stats + CTA */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                <span className="font-black text-white text-base">{cardRating}</span>
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Rating</span>
                        </div>
                        <div className="w-px h-7 bg-white/10" />
                        <div className="flex flex-col">
                            <span className="font-black text-white text-base">{triesCount}</span>
                            <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Tries</span>
                        </div>
                    </div>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            onView();
                        }}
                        className="px-5 py-2.5 bg-white/15 backdrop-blur-md border border-white/25 text-white font-black rounded-xl text-xs shadow-lg active:scale-95 transition-all flex items-center gap-2 hover:bg-white/25 group/btn"
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
