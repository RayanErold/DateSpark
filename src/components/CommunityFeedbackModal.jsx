import React, { useState } from 'react';
import { Star, X, Upload, MessageSquare, Loader2, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';

const CommunityFeedbackModal = ({ isOpen, onClose, plan, onFeedbackSubmitted }) => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedTag, setSelectedTag] = useState(null);
    const [error, setError] = useState(null);

    const VIBE_TAGS = [
        { id: 'anniversary', label: 'Anniversary', icon: '💍' },
        { id: 'icebreaker', label: 'Icebreaker', icon: '🧊' },
        { id: 'budget', label: 'Budget-Friendly', icon: '💸' },
        { id: 'rainy', label: 'Rainy Day', icon: '🌧️' }
    ];

    if (!isOpen || !plan) return null;

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreviewUrl(URL.createObjectURL(selectedFile));
        }
    };

    const handleSubmit = async () => {
        if (rating === 0) {
            setError("Please select a star rating first.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            let imageUrl = null;

            // 1. Upload Image (If any)
            if (file) {
                const fileExt = file.name.split('.').pop();
                // Simple unique naming to avoid collisions
                const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
                const filePath = `${user?.id || 'anonymous'}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('plan_reviews')
                    .upload(filePath, file);

                if (uploadError) throw new Error("Image upload failed: " + uploadError.message);

                const { data: publicUrlData } = supabase.storage
                    .from('plan_reviews')
                    .getPublicUrl(filePath);

                imageUrl = publicUrlData.publicUrl;
            }

            // 2. Fetch current plan data to calculate new averages safely via backend proxy
            const statsRes = await fetch(`/api/plans/${plan.id}`);
            if (!statsRes.ok) {
                const errorData = await statsRes.json();
                throw new Error(errorData.error || "Failed to fetch plan stats.");
            }
            const currentPlan = await statsRes.json();

            const oldTotal = currentPlan?.total_tries || 0;
            const oldAvg = currentPlan?.avg_rating || 0;
            const oldReviews = currentPlan?.reviews || [];

            const newTotal = oldTotal + 1;
            // Guard against divide by zero, though newTotal will be at least 1 here
            const newAvg = newTotal > 0 ? ((oldAvg * oldTotal) + rating) / newTotal : rating;

            const newReview = {
                rating,
                comment: comment.trim(),
                image: imageUrl,
                timestamp: new Date().toISOString(),
                user_id: user?.id || 'anonymous'
            };

            const updatedReviews = Array.isArray(oldReviews) ? [...oldReviews, newReview] : [newReview];

            // Update Vibe Tags
            const oldVibeTags = currentPlan.vibe_tags || [];
            const updatedVibeTags = selectedTag ? [...oldVibeTags, selectedTag] : oldVibeTags;

            // 3. Update Plan directly via Supabase client (assume backend proxy handles JWT or RLS is permissive enough for updates on these fields)
            // Using backend proxy `/api/update-plan` to bypass RLS issues, similar to Dashboard.jsx logic
            const response = await fetch('/api/update-plan', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    planId: plan.id,
                    updateData: {
                        avg_rating: Number(newAvg.toFixed(1)),
                        total_tries: newTotal,
                        reviews: updatedReviews,
                        vibe_tags: updatedVibeTags
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to update review in backend.");
            }

            // 4. Success callback
            if (onFeedbackSubmitted) {
                onFeedbackSubmitted({
                    ...plan,
                    avg_rating: Number(newAvg.toFixed(1)),
                    total_tries: newTotal,
                    reviews: updatedReviews,
                    vibe_tags: updatedVibeTags
                });
            }

            onClose();

        } catch (err) {
            console.error("Review Submit Error:", err);
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl relative flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                
                {/* Header Container */}
                <div className="p-6 pb-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-black text-navy">Rate this Plan</h2>
                        <p className="text-xs text-gray-500 font-medium mt-1">Help others discover great dates!</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-gray-400 hover:text-navy hover:bg-gray-100 transition-colors shadow-sm"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 flex flex-col gap-6">
                    {error && (
                        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-100 font-medium">
                            {error}
                        </div>
                    )}

                    {/* Star Rating */}
                    <div className="flex flex-col items-center">
                        <span className="text-sm font-bold text-gray-600 mb-3 uppercase tracking-wider">How was it?</span>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    onClick={() => setRating(star)}
                                    className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
                                >
                                    <Star 
                                        className={`w-10 h-10 ${
                                            (hoverRating || rating) >= star 
                                                ? 'fill-coral text-coral' 
                                                : 'text-gray-200'
                                        } transition-colors duration-200`} 
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Vibe Tags */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
                            <Star className="w-3.5 h-3.5 text-coral" /> Perfect For... <span className="text-gray-400 normal-case font-medium">(Optional)</span>
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {VIBE_TAGS.map((tag) => (
                                <button
                                    key={tag.id}
                                    onClick={() => setSelectedTag(selectedTag === tag.id ? null : tag.id)}
                                    className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all flex items-center gap-1.5 ${
                                        selectedTag === tag.id
                                            ? 'bg-coral border-coral text-white shadow-md shadow-coral/20'
                                            : 'bg-white border-gray-100 text-gray-500 hover:border-coral hover:text-coral'
                                    }`}
                                >
                                    <span>{tag.icon}</span> {tag.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Comment */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
                            <MessageSquare className="w-3.5 h-3.5" /> Short Review <span className="text-gray-400 normal-case font-medium ml-auto">{comment.length}/120</span>
                        </label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value.slice(0, 120))}
                            placeholder="What was the highlight? Any tips?"
                            className="w-full bg-gray-50 border border-gray-200 focus:border-coral rounded-xl p-3 text-sm text-navy placeholder:text-gray-400 font-medium outline-none resize-none h-20 transition-colors"
                        />
                    </div>

                    {/* Image Upload */}
                    <div className="flex flex-col gap-2">
                         <label className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
                            <ImageIcon className="w-3.5 h-3.5" /> Add a Photo <span className="text-gray-400 normal-case font-medium">(Optional)</span>
                        </label>
                        
                        {!previewUrl ? (
                            <label className="w-full border-2 border-dashed border-gray-200 hover:border-coral bg-gray-50 hover:bg-coral/5 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors group">
                                <Upload className="w-6 h-6 text-gray-400 group-hover:text-coral transition-colors" />
                                <span className="text-xs font-bold text-gray-500 group-hover:text-coral transition-colors">Click to upload image</span>
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={handleFileChange} 
                                    className="hidden" 
                                />
                            </label>
                        ) : (
                            <div className="relative w-full h-32 rounded-xl overflow-hidden border border-gray-200 group">
                                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                <button
                                    onClick={() => { setFile(null); setPreviewUrl(null); }}
                                    className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full hover:bg-black/70 transition-colors backdrop-blur-md"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 pt-2 border-t border-gray-100 bg-gray-50/30">
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || rating === 0}
                        className="w-full py-3.5 bg-coral text-white font-black rounded-xl hover:bg-coral/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-coral/20"
                    >
                        {isSubmitting ? (
                            <><Loader2 className="w-5 h-5 animate-spin" /> Publishing...</>
                        ) : 'Submit Review'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CommunityFeedbackModal;
