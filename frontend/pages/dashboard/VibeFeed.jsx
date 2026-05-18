import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, MapPin, Sparkles, Navigation, Volume2, VolumeX, Play, Wand2, ArrowLeft, MoreVertical, Bookmark } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import BottomNav from '../../components/common/BottomNav';
import { supabase } from '../../lib/supabase';

const VibeCard = ({ item, isActive, isMuted, onToggleMute }) => {
    const videoRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [videoError, setVideoError] = useState(false);

    useEffect(() => {
        let isMounted = true;
        
        const handlePlay = async () => {
            if (!videoRef.current) return;
            
            try {
                if (isActive) {
                    setVideoError(false);
                    await videoRef.current.play();
                    if (isMounted) setIsPlaying(true);
                } else {
                    videoRef.current.pause();
                    if (isMounted) setIsPlaying(false);
                }
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.log('Playback error:', error);
                    if (isMounted) setIsPlaying(false);
                }
            }
        };

        handlePlay();

        return () => {
            isMounted = false;
        };
    }, [isActive]);

    const togglePlay = () => {
        if (!videoRef.current) return;
        if (videoRef.current.paused) {
            videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
        } else {
            videoRef.current.pause();
            setIsPlaying(false);
        }
    };

    return (
        <div className="relative h-screen w-full snap-start overflow-hidden bg-black flex items-center justify-center">
            {/* Video Background */}
            <video
                key={item.videoUrl}
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                loop
                muted={isMuted}
                playsInline
                onClick={togglePlay}
                onError={(e) => {
                    console.error('Video Load Error:', e);
                    setVideoError(true);
                }}
            >
                <source src={item.videoUrl} type="video/mp4" />
                Your browser does not support the video tag.
            </video>

            {/* Error Placeholder */}
            {videoError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-navy/20 backdrop-blur-xl p-8 text-center">
                    <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-4">
                        <VolumeX className="w-10 h-10 text-white/40" />
                    </div>
                    <h3 className="text-white font-black text-xl mb-2">Video Unavailable</h3>
                    <p className="text-white/60 text-sm">We couldn't load the vibe for {item.title}.</p>
                </div>
            )}

            {/* Dark Overlays */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 pointer-events-none" />

            {/* Content Overlay */}
            <div className="absolute bottom-24 left-0 right-0 p-6 flex flex-col gap-4 z-40">
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={isActive ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col gap-2 max-w-[80%]"
                >
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-coral/20 backdrop-blur-md border border-coral/30 text-coral text-[10px] font-black uppercase tracking-widest rounded-full">
                            {item.vibe}
                        </span>
                        <div className="flex items-center gap-1 text-white/80 text-[10px] font-bold">
                            <MapPin className="w-3 h-3" />
                            {item.distance || '0.5 miles'}
                        </div>
                    </div>
                    <h2 className="text-3xl font-black text-white tracking-tight drop-shadow-lg">
                        {item.title}
                    </h2>
                    <p className="text-white/80 text-sm font-medium leading-relaxed line-clamp-2 drop-shadow-md">
                        {item.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1 px-2 py-1 bg-white/10 backdrop-blur-md rounded-lg border border-white/10">
                            <Navigation className="w-3.5 h-3.5 text-white" />
                            <span className="text-[11px] font-black text-white">{item.location}</span>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isActive ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.4 }}
                    className="flex items-center gap-3 mt-4"
                >
                    <Link 
                        to="/dashboard"
                        className="flex-1 bg-white text-navy py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-transform"
                    >
                        <Wand2 className="w-4 h-4" />
                        Plan This Date
                    </Link>
                    <button className="w-14 h-14 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl flex items-center justify-center text-white active:scale-95 transition-transform">
                        <Bookmark className="w-6 h-6" />
                    </button>
                </motion.div>
            </div>

            {/* Right Side Actions */}
            <div className="absolute right-4 bottom-32 flex flex-col gap-6 items-center z-40">
                <div className="flex flex-col items-center gap-1 group">
                    <button className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-all group-active:scale-90">
                        <Heart className="w-6 h-6 group-hover:fill-coral group-hover:text-coral transition-colors" />
                    </button>
                    <span className="text-[10px] font-black text-white uppercase tracking-tighter">Like</span>
                </div>
                <div className="flex flex-col items-center gap-1 group">
                    <button className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-all group-active:scale-90">
                        <Share2 className="w-6 h-6" />
                    </button>
                    <span className="text-[10px] font-black text-white uppercase tracking-tighter">Share</span>
                </div>
                <button 
                    onClick={onToggleMute}
                    className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-all active:scale-90"
                >
                    {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                </button>
            </div>

            {/* Play/Pause Indicator (Overlay) */}
            {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
                    <div className="w-20 h-20 bg-black/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20">
                        <Play className="w-10 h-10 text-white fill-white ml-1" />
                    </div>
                </div>
            )}
        </div>
    );
};

const VibeFeed = () => {
    const navigate = useNavigate();
    const [vibes, setVibes] = useState([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [isMuted, setIsMuted] = useState(true);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const containerRef = useRef(null);

    useEffect(() => {
        const fetchVibes = async () => {
            try {
                setLoading(true);
                const { data, error } = await supabase
                    .from('vibes')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;
                
                const formattedVibes = data.map(v => ({
                    id: v.id,
                    videoUrl: v.video_url,
                    title: v.title,
                    location: v.location,
                    description: v.description,
                    vibe: v.vibe,
                    rating: v.rating,
                    distance: v.distance || '0.5 miles'
                }));

                setVibes(formattedVibes);
            } catch (err) {
                console.error('Error fetching vibes:', err);
                setError('Failed to load vibes');
            } finally {
                setLoading(false);
            }
        };

        fetchVibes();
    }, []);

    const handleScroll = () => {
        if (!containerRef.current) return;
        const index = Math.round(containerRef.current.scrollTop / window.innerHeight);
        if (index !== activeIndex) {
            setActiveIndex(index);
        }
    };

    if (loading) {
        return (
            <div className="h-screen w-full bg-black flex flex-col items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 border-2 border-white/20 border-t-coral rounded-full mb-4"
                />
                <p className="text-white/40 font-black uppercase tracking-[0.2em] text-[10px]">Loading Vibes</p>
            </div>
        );
    }

    if (error || vibes.length === 0) {
        return (
            <div className="h-screen w-full bg-[#0a192f] flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-6">
                    <Sparkles className="w-8 h-8 text-white/20" />
                </div>
                <h3 className="text-white font-black text-xl mb-2">No Vibes Found</h3>
                <p className="text-white/40 text-sm mb-8">We couldn't find any date discovery videos in your area yet.</p>
                <div className="fixed bottom-0 left-0 right-0">
                    <BottomNav currentTab="vibe" onTabChange={(tab) => {
                        if (tab === 'home') navigate('/dashboard');
                    }} />
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen w-full bg-black overflow-hidden flex flex-col relative">
            {/* Top Bar */}
            <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-6 bg-gradient-to-b from-black/60 to-transparent">
                <Link to="/dashboard" className="w-10 h-10 bg-white/10 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white active:scale-95 transition-transform">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="flex gap-4">
                    <button className="text-white font-black uppercase tracking-widest text-xs border-b-2 border-coral pb-1">Trending</button>
                    <button className="text-white/60 font-black uppercase tracking-widest text-xs pb-1 hover:text-white transition-colors">Nearby</button>
                </div>
                <button className="w-10 h-10 bg-white/10 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white active:scale-95 transition-transform">
                    <MoreVertical className="w-5 h-5" />
                </button>
            </div>

            {/* Vertical Scroll Container */}
            <div 
                ref={containerRef}
                onScroll={handleScroll}
                className="flex-grow overflow-y-scroll snap-y snap-mandatory scrollbar-hide h-full"
                style={{ scrollBehavior: 'smooth' }}
            >
                {vibes.map((item, index) => (
                    <VibeCard 
                        key={item.id}
                        item={item}
                        isActive={index === activeIndex}
                        isMuted={isMuted}
                        onToggleMute={() => setIsMuted(!isMuted)}
                    />
                ))}
            </div>

            {/* Bottom Nav Overlay */}
            <div className="fixed bottom-0 left-0 right-0 pointer-events-none z-50">
                <div className="pointer-events-auto">
                    <BottomNav 
                        currentTab="vibe" 
                        onTabChange={(tab) => {
                            if (tab === 'home') navigate('/dashboard');
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default VibeFeed;
