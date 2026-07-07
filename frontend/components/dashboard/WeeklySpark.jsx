import React, { useRef, useEffect, useState } from 'react';
import axios from 'axios';
import { Sparkles, MapPin, Lock, Check } from 'lucide-react';

export default function WeeklySpark({ user, setToastMessage }) {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [plan, setPlan] = useState(null);
    const [isRevealed, setIsRevealed] = useState(false);
    const [isScratched, setIsScratched] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [photoIndex, setPhotoIndex] = useState(0);
    const isDrawing = useRef(false);

    useEffect(() => {
        const fetchWeeklySpark = async () => {
            try {
                const response = await axios.get(`/api/weekly-spark?userId=${user?.id}`);
                setPlan(response.data);
                const revealed = response.data?.itinerary?.metadata?.is_scratch_revealed || false;
                setIsRevealed(revealed);
                setIsScratched(revealed);
            } catch (err) {
                console.error('Failed to fetch weekly spark:', err);
            } finally {
                setIsLoading(false);
            }
        };

        if (user?.id) fetchWeeklySpark();
    }, [user]);

    // Initialize Canvas Overlay
    useEffect(() => {
        if (isLoading || !plan || isRevealed) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const resizeCanvas = () => {
            canvas.width = canvas.parentElement.offsetWidth;
            canvas.height = canvas.parentElement.offsetHeight;
            
            // Draw Gradient Coating
            const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            grad.addColorStop(0, '#1e293b'); // Dark Slate slate-800
            grad.addColorStop(0.5, '#334155'); // slate-700
            grad.addColorStop(1, '#0f172a'); // slate-900
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Add subtle metallic/sparkly texture
            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            for (let i = 0; i < 40; i++) {
                const x = Math.random() * canvas.width;
                const y = Math.random() * canvas.height;
                const r = Math.random() * 2 + 1;
                ctx.beginPath();
                ctx.arc(x, y, r, 0, Math.PI * 2);
                ctx.fill();
            }

            // Draw lock instructions
            ctx.fillStyle = '#f8fafc';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('⚡ SCRATCH TO REVEAL THIS WEEK\'S SPARK ⚡', canvas.width / 2, canvas.height / 2 + 25);
            
            // Draw Lock Icon placeholder
            ctx.fillStyle = '#ff6b47';
            ctx.beginPath();
            ctx.arc(canvas.width / 2, canvas.height / 2 - 15, 20, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'white';
            ctx.font = '16px sans-serif';
            ctx.fillText('🔒', canvas.width / 2, canvas.height / 2 - 14);
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        return () => window.removeEventListener('resize', resizeCanvas);
    }, [isLoading, plan, isRevealed]);

    const getMousePos = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        
        // Handle touch vs mouse
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const scratch = (e) => {
        if (!isDrawing.current || isScratched) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const pos = getMousePos(e);

        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 22, 0, Math.PI * 2);
        ctx.fill();

        // Throttle check percentage to optimize performance
        if (Math.random() < 0.1) {
            checkScratchPercentage();
        }
    };

    const checkScratchPercentage = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imgData.data;
        let transparentPixels = 0;

        for (let i = 3; i < pixels.length; i += 4) {
            if (pixels[i] === 0) transparentPixels++;
        }

        const percentage = (transparentPixels / (pixels.length / 4)) * 100;
        
        if (percentage > 50) {
            revealSpark();
        }
    };

    const revealSpark = async () => {
        setIsScratched(true);
        // Animate canvas fadeout
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.style.transition = 'opacity 0.8s ease';
            canvas.style.opacity = 0;
            setTimeout(() => {
                setIsRevealed(true);
            }, 800);
        }

        try {
            await axios.post('/api/weekly-spark/reveal', {
                planId: plan.id,
                userId: user.id
            });
            setToastMessage('Weekly Spark unlocked! ✨');
            setTimeout(() => setToastMessage(''), 3000);
        } catch (err) {
            console.error('Failed to sync scratch reveal state:', err);
        }
    };

    const handleSaveToPlans = async () => {
        setIsSaving(true);
        try {
            // Modify generation_type to 'classic' to save it permanently in user plans
            await axios.post('/api/save-draft-plan', {
                userId: user.id,
                planData: {
                    ...plan,
                    generation_type: 'classic'
                }
            });
            
            setToastMessage('Date saved to your active plans! 🚀');
            setTimeout(() => setToastMessage(''), 3000);
        } catch (err) {
            console.error('Failed to save weekly spark:', err);
            setToastMessage('Failed to save to your active plans.');
            setTimeout(() => setToastMessage(''), 3000);
        } finally {
            setIsSaving(false);
        }
    };

    const getProxiedPhoto = (photoUrl) => {
        if (!photoUrl) return null;
        if (photoUrl.includes('staticmap') || photoUrl.includes('maps.googleapis.com/maps/api/staticmap')) return null;
        if (photoUrl.includes('googleusercontent.com')) return photoUrl;
        if (photoUrl.includes('places.googleapis.com') || photoUrl.includes('maps.googleapis.com')) {
            const API_URL = import.meta.env.VITE_API_URL || '';
            return `${API_URL}/api/photo-proxy?url=${encodeURIComponent(photoUrl)}`;
        }
        return photoUrl;
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[300px] text-gray-400">
                <div className="animate-spin rounded-full h-5 w-5 border-b-[1.5px] border-coral mb-3"></div>
                <p className="text-[12px] font-bold tracking-widest uppercase">Consulting Date Architect...</p>
            </div>
        );
    }

    if (!plan) {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-white/40 backdrop-blur-md rounded-2xl border border-gray-100 text-center max-w-sm mx-auto">
                <Lock className="w-8 h-8 text-gray-300 mb-3" />
                <p className="text-xs text-gray-500">Weekly Spark surprise plans will be available shortly. Ensure your current location is set in Profile settings.</p>
            </div>
        );
    }

    const steps = plan.itinerary?.steps || [];
    const activeStep = steps[photoIndex];

    return (
        <div className="max-w-md mx-auto px-1 py-3">
            <div className="text-center mb-5">
                <span className="inline-flex items-center gap-1 bg-coral/10 text-coral text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full mb-1.5">
                    <Sparkles className="w-3 h-3" /> Weekly Spark
                </span>
                <h2 className="text-[18px] font-black text-navy leading-tight tracking-tight">Your Weekend Mystery Date</h2>
                <p className="text-[11px] text-gray-400 font-medium max-w-xs mx-auto mt-1">A custom premium date suggestion generated specifically for you two. Revelations reset every Sunday.</p>
            </div>

            <div 
                ref={containerRef}
                className="relative bg-white rounded-2xl shadow-sm border-[0.5px] border-gray-100 overflow-hidden min-h-[460px] flex flex-col"
            >
                {/* Underlay: The Surprise Date Plan */}
                <div className={`transition-all duration-700 flex flex-col justify-between h-full flex-1 ${isScratched ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                    <div className="flex flex-col h-full flex-1">
                        {/* Full-bleed Photo with indicators */}
                        {isScratched && steps.length > 0 && (
                            <div 
                                className="relative w-full aspect-[16/10] bg-slate-900 overflow-hidden select-none cursor-pointer border-b-[0.5px] border-gray-100"
                                onClick={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const clickX = e.clientX - rect.left;
                                    if (clickX < rect.width / 2) {
                                        setPhotoIndex(prev => Math.max(0, prev - 1));
                                    } else {
                                        setPhotoIndex(prev => Math.min(steps.length - 1, prev + 1));
                                    }
                                }}
                            >
                                <img 
                                    src={getProxiedPhoto(activeStep?.photoUrl || activeStep?.image) || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80'} 
                                    alt={activeStep?.venue || 'Venue'}
                                    className="w-full h-full object-cover transition-all duration-300"
                                />

                                {/* Gradients */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-transparent" />

                                {/* Pagination lines */}
                                {steps.length > 1 && (
                                    <div className="absolute top-2 inset-x-3 flex gap-1 z-10">
                                        {steps.map((_, idx) => (
                                            <div
                                                key={idx}
                                                className={`h-[2px] flex-1 rounded-full transition-all duration-300 ${
                                                    idx === photoIndex ? 'bg-white shadow-[0_0_4px_rgba(255,255,255,0.8)]' : 'bg-white/30'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                )}

                                {/* Bottom info overlays */}
                                <div className="absolute bottom-3 left-3 right-3 text-white">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] bg-coral px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                                            Step {photoIndex + 1} of {steps.length}
                                        </span>
                                        <span className="text-[9px] font-bold tracking-tight text-white/90 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded">
                                            🕒 {activeStep?.time || 'TBD'}
                                        </span>
                                    </div>
                                    <h4 className="text-[13px] font-black tracking-tight mt-1 truncate">{activeStep?.activity || 'Activity'}</h4>
                                    <p className="text-[10px] text-gray-300 font-bold truncate flex items-center gap-0.5 mt-0.5">
                                        <MapPin className="w-2.5 h-2.5 shrink-0 text-coral" />
                                        {activeStep?.venue || 'Venue'}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Contents */}
                        <div className="p-4 flex-1 flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start gap-4 mb-2.5 border-b-[0.5px] border-gray-50 pb-2.5">
                                    <div>
                                        <h3 className="text-[13px] font-black text-navy tracking-tight">{plan.title}</h3>
                                        <p className="text-[10px] text-gray-400 font-medium mt-0.5 leading-tight">{plan.description}</p>
                                    </div>
                                    <span className="text-[9px] font-bold text-coral bg-coral/5 px-2 py-0.5 rounded border-[0.5px] border-coral/10 capitalize shrink-0">
                                        {plan.vibe}
                                    </span>
                                </div>

                                {/* Active step details */}
                                {activeStep && (
                                    <div className="bg-gray-50/70 p-3 rounded-xl border-[0.5px] border-gray-100/50 mt-1">
                                        <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                                            {activeStep.description}
                                        </p>
                                    </div>
                                )}

                                {/* Dot selection menu */}
                                <div className="flex justify-center items-center gap-2.5 mt-4">
                                    {steps.map((_, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setPhotoIndex(idx)}
                                            className={`w-6 h-6 rounded-full text-[9px] font-black transition-all flex items-center justify-center border ${
                                                idx === photoIndex 
                                                    ? 'bg-coral text-white border-coral' 
                                                    : 'bg-white text-navy border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            {idx + 1}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={handleSaveToPlans}
                                disabled={isSaving}
                                className="w-full mt-4 bg-coral hover:bg-coral-dark text-white py-2.5 rounded-xl text-xs font-black tracking-wide shadow-md hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                            >
                                {isSaving ? (
                                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                                ) : (
                                    <>
                                        <Check className="w-3.5 h-3.5" /> Save to My Plans
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Canvas Overlay: The Scratch layer */}
                {!isRevealed && (
                    <canvas
                        ref={canvasRef}
                        className="absolute inset-0 z-20 cursor-pointer touch-none select-none rounded-2xl flex-1 h-full"
                        onMouseDown={(e) => { isDrawing.current = true; scratch(e); }}
                        onMouseMove={scratch}
                        onMouseUp={() => isDrawing.current = false}
                        onMouseLeave={() => isDrawing.current = false}
                        onTouchStart={(e) => { isDrawing.current = true; scratch(e); }}
                        onTouchMove={scratch}
                        onTouchEnd={() => isDrawing.current = false}
                    />
                )}
            </div>
        </div>
    );
}
