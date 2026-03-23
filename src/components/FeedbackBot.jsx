import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Compass, X, Loader2 } from 'lucide-react';
import axios from 'axios';
import { supabase } from '../lib/supabase';

const FeedbackBot = () => {
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [feedbackText, setFeedbackText] = useState('');
    const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
    const [user, setUser] = useState(null);

    // Draggable State Hook
    const [position, setPosition] = useState({ x: 0, y: 0 }); // Defer initialization to layout effect
    const [isDragging, setIsDragging] = useState(false);
    const dragRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0, hasMoved: false });

    // Initialize position safely after paint
    useLayoutEffect(() => {
        if (typeof window !== 'undefined') {
            setPosition({
                x: window.innerWidth - 64, // Start pinned strictly to right edge
                y: window.innerHeight / 2 - 30 // Start mid-screen vertically
            });
        }
        
        // Handle window resize to keep it snapped to the edge
        const handleResize = () => {
            setPosition(prev => ({
                x: prev.x > window.innerWidth / 2 ? window.innerWidth - 64 : 16,
                y: Math.min(prev.y, window.innerHeight - 80)
            }));
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Drag tracking logic
    useEffect(() => {
        if (!isDragging) return;
        
        const handleMove = (e) => {
            // Prevent default touch scrolling when dragging
            if (e.cancelable && e.type.includes('touch')) e.preventDefault();
            
            const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
            const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
            
            const deltaX = clientX - dragRef.current.startX;
            const deltaY = clientY - dragRef.current.startY;

            if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
                dragRef.current.hasMoved = true;
            }

            if (dragRef.current.hasMoved) {
                setPosition({
                    x: Math.max(0, Math.min(window.innerWidth - 64, dragRef.current.initialX + deltaX)),
                    y: Math.max(0, Math.min(window.innerHeight - 80, dragRef.current.initialY + deltaY))
                });
            }
        };

        const handleUp = () => {
            setIsDragging(false);
            if (dragRef.current.hasMoved) {
                // Snap to the closest side (left or right edge)
                setPosition(prev => ({
                    x: prev.x > window.innerWidth / 2 ? window.innerWidth - 64 : 16,
                    y: prev.y
                }));
            }
        };

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleUp);
        window.addEventListener('touchmove', handleMove, { passive: false });
        window.addEventListener('touchend', handleUp);

        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleUp);
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('touchend', handleUp);
        };
    }, [isDragging]);

    const handleDown = (e) => {
        setIsDragging(true);
        dragRef.current = {
            startX: e.type.includes('mouse') ? e.clientX : e.touches[0].clientX,
            startY: e.type.includes('mouse') ? e.clientY : e.touches[0].clientY,
            initialX: position.x,
            initialY: position.y,
            hasMoved: false
        };
    };

    const handleClick = () => {
        if (!dragRef.current.hasMoved) {
            setShowFeedbackModal(true);
        }
    };

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        getUser();
    }, []);

    const handleFeedbackSubmit = async (e) => {
        e.preventDefault();
        if (!feedbackText.trim()) return;

        setIsSubmittingFeedback(true);
        try {
            await axios.post('/api/feedback', {
                text: feedbackText,
                userId: user?.id,
                email: user?.email
            });
            alert("Feedback sent! Thank you for helping us improve DateSpark.");
            setFeedbackText('');
            setShowFeedbackModal(false);
        } catch (err) {
            console.error("Feedback error:", err);
            alert("Failed to send feedback. Please try again later.");
        } finally {
            setIsSubmittingFeedback(false);
        }
    };

    // Don't render until layout gives us a valid position
    if (position.x === 0 && position.y === 0) return null;

    return (
        <>
            {/* Feedback Bot Floating Trigger */}
            <div 
                className={`fixed z-[90] touch-none ${!isDragging ? 'transition-all duration-300 ease-out' : ''}`}
                style={{ left: `${position.x}px`, top: `${position.y}px` }}
            >
                <button
                    onMouseDown={handleDown}
                    onTouchStart={handleDown}
                    onClick={handleClick}
                    className={`p-4 bg-gradient-to-br from-coral to-pink-500 text-white rounded-full shadow-2xl transition-transform flex items-center justify-center group relative border border-white/20 hover:scale-105 ${isDragging ? 'scale-95 cursor-grabbing' : 'cursor-pointer active:scale-95'}`}
                    title="Send Feedback"
                >
                    <div className="absolute -top-10 right-0 bg-navy text-white text-[11px] font-black px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg pointer-events-none whitespace-nowrap hidden md:block">
                        Suggest Ideas 💡
                    </div>
                    <Compass className={`w-6 h-6 ${isDragging ? '' : 'animate-[spin_20s_linear_infinite]'}`} />
                </button>
            </div>

            {/* Feedback Modal */}
            {showFeedbackModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all p-8 relative animate-fade-in-up">
                        <button
                            onClick={() => setShowFeedbackModal(false)}
                            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-navy transition-colors bg-gray-50 rounded-full"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-violet-100">
                            <Compass className="w-8 h-8 text-violet-600" />
                        </div>

                        <h2 className="text-2xl font-black text-navy mb-2">Have an Idea? 💡</h2>
                        <p className="text-gray-500 mb-6 text-sm font-medium">What improvements or features would you love to see in DateSpark?</p>

                        <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                            <div>
                                <textarea
                                    required
                                    rows={4}
                                    placeholder="I want to see... / Add this feature..."
                                    value={feedbackText}
                                    onChange={(e) => setFeedbackText(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-coral focus:border-transparent transition-all text-sm resize-none font-medium"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmittingFeedback || !feedbackText.trim()}
                                className="w-full bg-coral text-white py-3.5 rounded-xl font-black shadow-lg shadow-coral/20 flex justify-center items-center gap-2 active:scale-[0.98] disabled:opacity-50"
                            >
                                {isSubmittingFeedback ? (
                                    <><Loader2 className="w-5 h-5 animate-spin" /> Sending...</>
                                ) : (
                                    'Submit Proposal'
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default FeedbackBot;
