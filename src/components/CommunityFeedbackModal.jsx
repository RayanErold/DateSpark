import React, { useState } from 'react';
import { Star, X, Upload, Loader2, Image as ImageIcon, ChevronRight, ChevronLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';

// ─────────────────────────────────────────────────────────────
// Helper — Get itinerary stops from any plan shape
// ─────────────────────────────────────────────────────────────
const getStops = (plan) => {
    const raw = Array.isArray(plan?.itinerary)
        ? plan.itinerary
        : plan?.itinerary?.steps || [];
    return raw.filter(s => s?.venue).slice(0, 6); // Max 6 stops shown
};

// Quick emoji reactions for per-stop rating
const STOP_REACTIONS = [
    { id: 'loved',   emoji: '😍', label: 'Loved It!',      color: 'bg-pink-50 border-pink-400 text-pink-600' },
    { id: 'hidden',  emoji: '💎', label: 'Hidden Gem',      color: 'bg-indigo-50 border-indigo-400 text-indigo-600' },
    { id: 'overpriced', emoji: '💸', label: 'Overpriced',  color: 'bg-yellow-50 border-yellow-400 text-yellow-600' },
    { id: 'skip',    emoji: '👎', label: 'Would Skip',      color: 'bg-gray-100 border-gray-400 text-gray-600' },
];

// Vibe tags for overall plan
const VIBE_TAGS = [
    { id: 'anniversary', label: 'Anniversary', icon: '💍' },
    { id: 'icebreaker',  label: 'First Date',  icon: '🧊' },
    { id: 'budget',      label: 'Budget Date', icon: '💸' },
    { id: 'rainy',       label: 'Rainy Day',   icon: '🌧️' },
];

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
const CommunityFeedbackModal = ({ isOpen, onClose, plan, onFeedbackSubmitted }) => {
    const [step, setStep] = useState(1); // 1 = overall plan, 2 = per-stop
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [selectedTag, setSelectedTag] = useState(null);
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    // Per-stop state: { [stopIndex]: { stars: number, reaction: string } }
    const [stopRatings, setStopRatings] = useState({});

    if (!isOpen || !plan) return null;

    const stops = getStops(plan);
    const canProceedStep1 = rating > 0;

    const handleFileChange = (e) => {
        const f = e.target.files[0];
        if (f) { setFile(f); setPreviewUrl(URL.createObjectURL(f)); }
    };

    const setStopStar = (idx, stars) =>
        setStopRatings(prev => ({ ...prev, [idx]: { ...prev[idx], stars } }));

    const setStopReaction = (idx, reaction) =>
        setStopRatings(prev => ({
            ...prev,
            [idx]: { ...prev[idx], reaction: prev[idx]?.reaction === reaction ? null : reaction }
        }));

    const handleSubmit = async () => {
        if (rating === 0) { setError('Please pick a star rating first!'); return; }
        setIsSubmitting(true);
        setError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            const userId = user?.id || 'anonymous';

            // Upload image if any
            let imageUrl = null;
            if (file) {
                const ext = file.name.split('.').pop();
                const path = `${userId}/${Date.now()}.${ext}`;
                const { error: upErr } = await supabase.storage.from('plan_reviews').upload(path, file);
                if (upErr) throw new Error('Image upload failed: ' + upErr.message);
                const { data: urlData } = supabase.storage.from('plan_reviews').getPublicUrl(path);
                imageUrl = urlData.publicUrl;
            }

            // Fetch current plan stats
            const statsRes = await fetch(`/api/plans/${plan.id}`);
            if (!statsRes.ok) throw new Error('Could not load plan stats.');
            const currentPlan = await statsRes.json();

            const oldTotal = currentPlan?.total_tries || 0;
            const oldAvg   = currentPlan?.avg_rating   || 0;
            const oldReviews = Array.isArray(currentPlan?.reviews) ? currentPlan.reviews : [];

            const newTotal = oldTotal + 1;
            const newAvg   = ((oldAvg * oldTotal) + rating) / newTotal;

            const newReview = {
                rating,
                comment:   comment.trim(),
                image:     imageUrl,
                timestamp: new Date().toISOString(),
                user_id:   userId,
                likes:     [],
                replies:   [],
            };

            const updatedReviews  = [...oldReviews, newReview];
            const oldVibeTags     = currentPlan?.vibe_tags || [];
            const updatedVibeTags = selectedTag ? [...oldVibeTags, selectedTag] : oldVibeTags;

            // Update plan stats
            const patchRes = await fetch('/api/update-plan', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    planId: plan.id,
                    updateData: {
                        avg_rating:  Number(newAvg.toFixed(1)),
                        total_tries: newTotal,
                        reviews:     updatedReviews,
                        vibe_tags:   updatedVibeTags,
                    }
                })
            });
            if (!patchRes.ok) throw new Error('Failed to save your review.');

            // Submit per-stop ratings (fire-and-forget, soft fail)
            const stopEntries = Object.entries(stopRatings);
            if (stopEntries.length > 0) {
                await Promise.allSettled(
                    stopEntries.map(([idx, data]) => {
                        const stop = stops[parseInt(idx)];
                        if (!stop || (!data.stars && !data.reaction)) return Promise.resolve();
                        return fetch('/api/rate-place', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                planId:    plan.id,
                                placeName: stop.venue,
                                placeId:   stop.placeId || null,
                                rating:    data.stars || rating, // fall back to overall if no stop star
                                quickTag:  data.reaction || null,
                                userId,
                            })
                        });
                    })
                );
            }

            // Notify parent
            if (onFeedbackSubmitted) {
                onFeedbackSubmitted({
                    ...plan,
                    avg_rating:  Number(newAvg.toFixed(1)),
                    total_tries: newTotal,
                    reviews:     updatedReviews,
                    vibe_tags:   updatedVibeTags,
                });
            }
            onClose();

        } catch (err) {
            console.error('Review Submit Error:', err);
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-navy/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-t-[2rem] sm:rounded-[2rem] w-full max-w-md shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300 max-h-[95svh]">

                {/* ── HEADER ── */}
                <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3">
                        {step === 2 && (
                            <button onClick={() => setStep(1)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-navy hover:bg-gray-200 transition-colors">
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                        )}
                        <div>
                            <h2 className="text-xl font-black text-navy leading-tight">
                                {step === 1 ? '🌟 Rate Your Date' : '📍 Rate Each Spot'}
                            </h2>
                            <p className="text-xs text-gray-400 font-medium mt-0.5">
                                {step === 1
                                    ? `Step 1 of ${stops.length > 0 ? 2 : 1} — How did it go overall?`
                                    : 'Step 2 of 2 — Give each place its score'
                                }
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:text-navy hover:bg-gray-200 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* ── STEP INDICATOR ── */}
                {stops.length > 0 && (
                    <div className="px-6 pt-3 pb-1 flex gap-2 flex-shrink-0">
                        <div className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 1 ? 'bg-coral' : 'bg-gray-100'}`} />
                        <div className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 2 ? 'bg-coral' : 'bg-gray-100'}`} />
                    </div>
                )}

                {/* ── SCROLLABLE BODY ── */}
                <div className="flex-1 overflow-y-auto">

                    {/* ═══ STEP 1: OVERALL PLAN RATING ═══ */}
                    {step === 1 && (
                        <div className="p-6 space-y-6">
                            {error && (
                                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-100 font-medium">
                                    {error}
                                </div>
                            )}

                            {/* BIG STAR RATING */}
                            <div className="flex flex-col items-center gap-3 bg-gray-50 rounded-2xl p-5">
                                <span className="text-sm font-black text-gray-500 uppercase tracking-widest">How was the date?</span>
                                <div className="flex gap-3">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            onMouseEnter={() => setHoverRating(star)}
                                            onMouseLeave={() => setHoverRating(0)}
                                            onClick={() => setRating(star)}
                                            className="focus:outline-none transition-transform hover:scale-125 active:scale-95"
                                        >
                                            <Star
                                                className={`w-12 h-12 drop-shadow-sm transition-all duration-150 ${
                                                    (hoverRating || rating) >= star
                                                        ? 'fill-yellow-400 text-yellow-400 scale-110'
                                                        : 'text-gray-200'
                                                }`}
                                            />
                                        </button>
                                    ))}
                                </div>
                                <span className="text-lg font-black text-navy min-h-[1.5rem]">
                                    {rating === 5 ? '✨ Amazing!' : rating === 4 ? '😊 Really Good' : rating === 3 ? '😐 It was OK' : rating === 2 ? '😕 Not Great' : rating === 1 ? '😞 Disappointing' : ''}
                                </span>
                            </div>

                            {/* QUICK VIBE TAGS */}
                            <div className="space-y-2">
                                <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Perfect for... <span className="text-gray-300 font-medium normal-case">(optional)</span></p>
                                <div className="grid grid-cols-2 gap-2">
                                    {VIBE_TAGS.map(tag => (
                                        <button
                                            key={tag.id}
                                            onClick={() => setSelectedTag(selectedTag === tag.id ? null : tag.id)}
                                            className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold border-2 transition-all ${
                                                selectedTag === tag.id
                                                    ? 'bg-coral border-coral text-white shadow-md shadow-coral/20 scale-[1.02]'
                                                    : 'bg-white border-gray-100 text-gray-500 hover:border-coral/40'
                                            }`}
                                        >
                                            <span className="text-xl">{tag.icon}</span> {tag.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* SHORT COMMENT */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Leave a tip for others</p>
                                    <span className="text-[10px] text-gray-300 font-medium">{comment.length}/120</span>
                                </div>
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value.slice(0, 120))}
                                    placeholder="e.g. The restaurant was perfect but book ahead! 🍷"
                                    className="w-full bg-gray-50 border-2 border-gray-100 focus:border-coral rounded-2xl p-4 text-sm text-navy placeholder:text-gray-300 font-medium outline-none resize-none h-20 transition-colors"
                                />
                            </div>

                            {/* PHOTO UPLOAD */}
                            <div className="space-y-2">
                                <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Add a photo <span className="text-gray-300 font-medium normal-case">(optional)</span></p>
                                {!previewUrl ? (
                                    <label className="w-full border-2 border-dashed border-gray-200 hover:border-coral bg-gray-50 hover:bg-coral/5 rounded-2xl p-5 flex flex-col items-center gap-2 cursor-pointer transition-colors group">
                                        <span className="text-3xl">📸</span>
                                        <span className="text-sm font-bold text-gray-400 group-hover:text-coral transition-colors">Tap to add a photo</span>
                                        <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                                    </label>
                                ) : (
                                    <div className="relative w-full h-32 rounded-2xl overflow-hidden border-2 border-gray-100">
                                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => { setFile(null); setPreviewUrl(null); }}
                                            className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full hover:bg-black/80 transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ═══ STEP 2: PER-STOP RATINGS ═══ */}
                    {step === 2 && (
                        <div className="p-6 space-y-4">
                            {error && (
                                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-100 font-medium mb-2">
                                    {error}
                                </div>
                            )}
                            <p className="text-sm text-gray-500 font-medium text-center">
                                Tap an emoji for each place you visited 👇
                            </p>
                            {stops.map((stop, idx) => {
                                const sr = stopRatings[idx] || {};
                                return (
                                    <div key={idx} className="bg-gray-50 rounded-2xl p-4 space-y-3 border border-gray-100">
                                        {/* Stop Header */}
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-navy flex items-center justify-center flex-shrink-0">
                                                <span className="text-white text-sm font-black">{idx + 1}</span>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-black text-navy text-sm truncate">{stop.venue}</p>
                                                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{stop.activity || stop.time}</p>
                                            </div>
                                        </div>

                                        {/* Star rating for this stop */}
                                        <div className="flex gap-1.5 justify-center pt-1">
                                            {[1, 2, 3, 4, 5].map(s => (
                                                <button key={s} onClick={() => setStopStar(idx, sr.stars === s ? 0 : s)} className="focus:outline-none transition-transform hover:scale-110 active:scale-95">
                                                    <Star className={`w-7 h-7 transition-colors ${(sr.stars || 0) >= s ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                                                </button>
                                            ))}
                                        </div>

                                        {/* Quick emoji reactions */}
                                        <div className="grid grid-cols-2 gap-2">
                                            {STOP_REACTIONS.map(r => (
                                                <button
                                                    key={r.id}
                                                    onClick={() => setStopReaction(idx, r.id)}
                                                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-xs font-bold transition-all ${
                                                        sr.reaction === r.id
                                                            ? r.color + ' scale-[1.03] shadow-sm'
                                                            : 'bg-white border-gray-100 text-gray-500 hover:border-gray-300'
                                                    }`}
                                                >
                                                    <span className="text-lg">{r.emoji}</span> {r.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ── FOOTER ACTIONS ── */}
                <div className="p-5 pt-3 border-t border-gray-100 bg-gray-50/50 flex-shrink-0">
                    {step === 1 ? (
                        <button
                            onClick={() => {
                                if (!canProceedStep1) { setError('Please pick a star rating first!'); return; }
                                setError(null);
                                if (stops.length > 0) setStep(2);
                                else handleSubmit();
                            }}
                            disabled={!canProceedStep1}
                            className="w-full py-4 bg-coral text-white font-black text-base rounded-2xl hover:bg-coral/90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-coral/20 flex items-center justify-center gap-2"
                        >
                            {stops.length > 0 ? (
                                <><span>Next — Rate Each Spot</span> <ChevronRight className="w-5 h-5" /></>
                            ) : 'Submit Review'}
                        </button>
                    ) : (
                        <div className="space-y-2">
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="w-full py-4 bg-coral text-white font-black text-base rounded-2xl hover:bg-coral/90 active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-coral/20 flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <><Loader2 className="w-5 h-5 animate-spin" /> Publishing...</>
                                ) : '🚀 Submit All Reviews'}
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="w-full py-2.5 text-gray-400 text-sm font-bold rounded-xl hover:bg-gray-100 transition-colors"
                            >
                                Skip spot ratings & submit
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CommunityFeedbackModal;
