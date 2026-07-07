import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Camera, Calendar, Star, Heart, FileText, CheckCircle2 } from 'lucide-react';

export default function SparkJournal({ user }) {
    const [completedPlans, setCompletedPlans] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchCompletedPlans = async () => {
            try {
                // Fetch user plans, then filter for completed ones
                const response = await axios.get(`/api/user-plans?userId=${user?.id}`);
                const completed = (response.data || []).filter(p => p.is_completed);
                setCompletedPlans(completed);
            } catch (err) {
                console.error('Failed to fetch journal memories:', err);
            } finally {
                setIsLoading(false);
            }
        };

        if (user?.id) fetchCompletedPlans();
    }, [user]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[250px] text-gray-400">
                <div className="animate-spin rounded-full h-5 w-5 border-b-[1.5px] border-coral mb-3"></div>
                <p className="text-[12px] font-bold tracking-widest uppercase">Developing Memories...</p>
            </div>
        );
    }

    if (completedPlans.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-white/40 backdrop-blur-md rounded-2xl border-[0.5px] border-gray-100 text-center max-w-sm mx-auto my-6">
                <div className="w-12 h-12 bg-coral/5 rounded-full flex items-center justify-center mb-3.5 border-[0.5px] border-coral/10">
                    <Camera className="w-5 h-5 text-coral" />
                </div>
                <h3 className="text-[13px] font-black text-navy uppercase tracking-wider">No Memories Yet</h3>
                <p className="text-[11px] text-gray-400 font-medium mt-1.5 leading-relaxed">Your completed dates will appear here as polaroids. Go to your active plans, tap "Complete Date", and save your first memory!</p>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto px-1 py-3">
            <div className="text-center mb-6">
                <span className="inline-flex items-center gap-1 bg-coral/10 text-coral text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full mb-1.5">
                    <Heart className="w-3 h-3" /> Spark Journal
                </span>
                <h2 className="text-[18px] font-black text-navy leading-tight tracking-tight">Our Memory Lane</h2>
                <p className="text-[11px] text-gray-400 font-medium max-w-xs mx-auto mt-1">A private visual timeline of your completed experiences and shared date adventures.</p>
            </div>

            {/* Polaroid Memory Lane Grid */}
            <div className="grid grid-cols-2 gap-4">
                {completedPlans.map((plan) => {
                    const completedDate = plan.completed_at ? new Date(plan.completed_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                    }) : '';

                    return (
                        <div 
                            key={plan.id}
                            className="bg-white p-2.5 pb-4 rounded-lg shadow-sm border-[0.5px] border-gray-200/60 transform hover:-rotate-1 hover:scale-[1.01] transition-all duration-300"
                        >
                            {/* Polaroid Image Frame */}
                            <div className="relative w-full aspect-square bg-gray-50 rounded border-[0.5px] border-gray-100 overflow-hidden flex items-center justify-center group">
                                {plan.journal_photo_url ? (
                                    <img 
                                        src={plan.journal_photo_url} 
                                        alt={plan.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-gray-300 p-4">
                                        <Camera className="w-6 h-6 mb-1 opacity-40 text-gray-400" />
                                        <span className="text-[9px] font-bold tracking-tight text-center">No Photo Attached</span>
                                    </div>
                                )}
                                <div className="absolute top-2 left-2 bg-navy/70 backdrop-blur-sm text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                                    <Calendar className="w-2.5 h-2.5" />
                                    {completedDate}
                                </div>
                            </div>

                            {/* Polaroid Caption Info */}
                            <div className="mt-3 px-0.5">
                                <h3 className="text-[12px] font-black text-navy truncate leading-tight tracking-tight">{plan.title}</h3>
                                <p className="text-[10px] text-gray-400 font-bold truncate mt-0.5">{plan.location}</p>

                                {/* Rating Star Display */}
                                <div className="flex items-center gap-0.5 my-1.5">
                                    {[...Array(5)].map((_, i) => (
                                        <Star 
                                            key={i} 
                                            className={`w-3 h-3 ${i < Math.round(plan.journal_rating || 5) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} 
                                        />
                                    ))}
                                    <span className="text-[10px] text-navy font-black ml-1">{(plan.journal_rating || 5).toFixed(1)}</span>
                                </div>

                                {/* Journal Notes Block */}
                                {plan.journal_notes ? (
                                    <p className="text-[10.5px] text-gray-500 font-medium leading-relaxed bg-gray-50/50 p-2 rounded border-[0.5px] border-gray-100/50 italic max-h-16 overflow-y-auto">
                                        "{plan.journal_notes}"
                                    </p>
                                ) : (
                                    <p className="text-[9.5px] text-gray-400 font-medium leading-relaxed p-1 italic">
                                        No memories noted.
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
