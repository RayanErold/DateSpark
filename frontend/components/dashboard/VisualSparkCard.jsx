import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Star,
    Sparkles,
    MapPin,
    ChevronLeft,
    ChevronRight,
    ArrowLeft,
    Heart
} from 'lucide-react';

const VisualSparkCard = ({ plan, onView, theme, isTopInBorough, boroughName, onPersonalize, collabStatus }) => {
    const [photoIndex, setPhotoIndex] = useState(0);
    const [isCardBoosted, setIsCardBoosted] = useState(false);
    const itinerary = plan.itinerary || {};
    const steps = Array.isArray(itinerary) ? itinerary : (itinerary.steps || []);

    const API_URL = import.meta.env.VITE_API_URL || '';

    const getProxiedPhoto = (photoUrl) => {
        if (!photoUrl) return null;
        if (photoUrl.includes('unsplash')) return null;
        if (photoUrl.includes('googleusercontent.com')) return photoUrl;
        if (
            photoUrl.includes('places.googleapis.com') ||
            photoUrl.includes('maps.googleapis.com') ||
            photoUrl.includes('staticmap')
        ) {
            return `${API_URL}/api/photo-proxy?url=${encodeURIComponent(photoUrl)}`;
        }
        return photoUrl;
    };

    const photos = steps
        .map(s => s.photoUrl)
        .filter(url => url && !url.includes('placeholder'))
        .map(getProxiedPhoto)
        .filter(Boolean);

    const hasPhotos = photos.length > 0;
    const currentPhoto = photos[photoIndex];

    const [imageError, setImageError] = useState(false);

    const handleImageError = () => {
        if (photos && photos.length > 1 && photoIndex < photos.length - 1) {
            setPhotoIndex(prev => prev + 1);
            setImageError(false);
        } else {
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

    const fallbacks = {
        romantic:  'https://images.unsplash.com/photo-1516589174184-c68526514ec0?w=800&q=80',
        chill:     'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
        nightlife: 'https://images.unsplash.com/photo-1514525253361-bee8d419b74e?w=800&q=80',
        active:    'https://images.unsplash.com/photo-1502904550040-753d5ad069de?w=800&q=80',
    };
    const planVibe = (plan.vibe || 'chill').toLowerCase();
    const coverFallback = fallbacks[planVibe] || fallbacks.chill;

    const isDark = theme === 'dark';

    return (
        <motion.div
            whileHover={{ y: -6 }}
            className={`w-full rounded-[2rem] border overflow-hidden transition-all duration-300 relative group/card flex flex-col justify-between h-full ${
                isDark
                    ? 'bg-[#2D1B1B] border-white/10 shadow-[0_15px_35px_rgba(0,0,0,0.4)]'
                    : 'editorial-card shadow-[0_8px_32px_rgba(45,27,46,0.07)]'
            }`}
        >
            {/* ── VISUAL HEADER ── */}
            <div className="relative h-40 overflow-hidden group/photo bg-blush/20 flex-shrink-0">
                <img
                    key={currentPhoto || `${plan.id}-${photoIndex}`}
                    src={(!imageError && currentPhoto) ? currentPhoto : coverFallback}
                    alt={plan.vibe}
                    onError={handleImageError}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover/photo:scale-105"
                />

                {/* Warm editorial gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-plum/70 via-plum/20 to-transparent pointer-events-none" />

                {/* Heart / Like Button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsCardBoosted(!isCardBoosted);
                    }}
                    className={`absolute top-4 right-4 w-9 h-9 rounded-full backdrop-blur-md flex items-center justify-center border active:scale-75 shadow-lg transition-all duration-300 z-30 cursor-pointer
                        ${isCardBoosted
                            ? 'bg-rose/20 border-rose text-rose scale-105 shadow-rose/20'
                            : 'bg-black/40 border-white/20 text-white hover:bg-white/10'
                        }`}
                >
                    <Heart className={`w-4 h-4 ${isCardBoosted ? 'fill-rose text-rose' : 'text-white'}`} />
                </button>

                {/* Vibe Pill */}
                <div className="absolute top-4 left-4 z-20">
                    <div className="px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/25 text-[9px] font-semibold text-white uppercase tracking-widest shadow-xl flex items-center gap-1.5 font-outfit">
                        <Sparkles className="w-3.5 h-3.5 text-rose fill-rose" /> {plan.vibe || 'Date'}
                    </div>
                </div>

                {/* Location Badge */}
                <div className="absolute bottom-4 left-4 z-20">
                    <span className="px-3 py-1.5 bg-black/50 backdrop-blur-md rounded-xl border border-white/15 text-[9px] font-semibold text-white uppercase tracking-widest flex items-center gap-1 shadow-md font-outfit">
                        <MapPin className="w-3.5 h-3.5 text-rose" /> {plan.location || boroughName || 'NYC'}
                    </span>
                </div>

                {/* Collab status badge */}
                {collabStatus && (
                    <div className="absolute bottom-4 right-4 z-20">
                        <span className="px-3 py-1.5 bg-blush/90 backdrop-blur-md rounded-xl border border-rose/20 text-[9px] font-semibold text-plum uppercase tracking-widest flex items-center gap-1 shadow-md font-outfit">
                            {collabStatus}
                        </span>
                    </div>
                )}

                {/* Pagination Arrows */}
                {photos.length > 1 && (
                    <>
                        <button
                            onClick={handlePrev}
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/30 md:bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full border border-white/10 flex items-center justify-center text-white opacity-100 md:opacity-0 md:group-hover/photo:opacity-100 transition-all z-30"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleNext}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/30 md:bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full border border-white/10 flex items-center justify-center text-white opacity-100 md:opacity-0 md:group-hover/photo:opacity-100 transition-all z-30"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </>
                )}

                {/* Pagination Dots */}
                {photos.length > 1 && (
                    <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1.5 z-20">
                        {photos.map((_, idx) => (
                            <div
                                key={idx}
                                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${idx === photoIndex ? 'w-3.5 bg-white shadow-sm' : 'w-1.5 bg-white/30 hover:bg-white/50'}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setPhotoIndex(idx);
                                    setImageError(false);
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* ── CONTENT BODY ── */}
            <div className={`p-4 flex-1 flex flex-col justify-between ${isDark ? 'bg-[#2D1B1B]' : 'bg-ivory/95'}`}>
                <div>
                    {/* Rating Row */}
                    <div className="flex items-center justify-between mb-3">
                        <div />
                        <div className="flex items-center gap-1 bg-rose/10 border border-rose/20 px-2.5 py-1 rounded-xl text-rose shrink-0">
                            <Star className="w-3.5 h-3.5 fill-rose text-rose" />
                            <span className="text-xs font-semibold font-outfit">{plan.avg_rating || '4.9'}</span>
                        </div>
                    </div>

                    {/* Description */}
                    <p className={`text-sm font-medium leading-relaxed mb-4 line-clamp-2 ${isDark ? 'text-ivory/70' : 'text-taupe'}`}>
                        {plan.description || 'A highly recommended, premium DateSpark experience.'}
                    </p>

                    {/* Stop Numbers */}
                    {steps.length > 0 && (
                        <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide py-1 mb-5">
                            {steps.slice(0, 3).map((step, sIdx) => (
                                <div key={sIdx} className="flex items-center gap-1.5 shrink-0">
                                    <span className="text-xs font-semibold text-rose font-outfit">{sIdx + 1}</span>
                                    <span className={`text-[11px] font-medium truncate max-w-[80px] ${isDark ? 'text-ivory/50' : 'text-taupe/70'}`}>
                                        {step.activity || step.title || 'Stop'}
                                    </span>
                                </div>
                            ))}
                            {steps.length > 3 && (
                                <span className="text-xs font-semibold text-rose shrink-0 font-outfit">+{steps.length - 3}</span>
                            )}
                        </div>
                    )}
                </div>

                {/* Actions Bar */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => onView(plan)}
                        className={`flex-grow py-2.5 px-4 font-semibold rounded-2xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 group/btn text-xs uppercase tracking-wider font-outfit ${
                            isDark
                                ? 'bg-ivory/10 text-ivory hover:bg-rose hover:text-ivory'
                                : 'bg-plum text-ivory hover:bg-rose hover:-translate-y-0.5'
                        }`}
                    >
                        View Itinerary
                        <ArrowLeft className="w-4 h-4 rotate-180 transition-transform group-hover/btn:translate-x-0.5" />
                    </button>
                    {onPersonalize && (
                        <button
                            onClick={() => onPersonalize(plan)}
                            className="w-10 h-10 bg-gradient-to-tr from-rose to-pink-400 hover:from-rose hover:to-blush text-ivory rounded-2xl flex items-center justify-center shadow-lg shadow-rose/20 active:scale-95 transition-all group/sparky shrink-0 cursor-pointer"
                            title="Personalize with Sparky"
                        >
                            <Sparkles className="w-5 h-5 group-hover/sparky:animate-pulse" />
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default VisualSparkCard;
