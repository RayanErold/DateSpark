import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Flame, Sparkles, Trophy, Check, ArrowRight, X, AlertCircle, Camera } from 'lucide-react';

export default function CoupleChallenges({ user, setToastMessage }) {
    const [profile, setProfile] = useState(null);
    const [challenges, setChallenges] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // AI Verification Modal States
    const [selectedChallenge, setSelectedChallenge] = useState(null);
    const [proofUrl, setProofUrl] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationError, setVerificationError] = useState('');

    const MOCK_PRESETS = [
        { label: '🌅 Sunset Picnic', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=600' },
        { label: '🍝 Restaurant Dinner', url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600' },
        { label: '🍸 Hidden Bar / Cocktail', url: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=600' },
        { label: '🎳 Arcade / Bowling', url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=600' },
        { label: '🍦 Gelato / Desserts', url: 'https://images.unsplash.com/photo-1512201858474-07b93222cd64?auto=format&fit=crop&q=80&w=600' },
        { label: '🐈 Invalid Image (Cat)', url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=600' }
    ];

    const fetchChallenges = async () => {
        try {
            const response = await axios.get(`/api/challenges?userId=${user?.id}`);
            setProfile(response.data.profile);
            setChallenges(response.data.challenges);
        } catch (err) {
            console.error('Failed to fetch challenges:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user?.id) fetchChallenges();
    }, [user]);

    const handleVerifyAndClaim = async () => {
        if (!proofUrl.trim()) {
            setVerificationError('Please enter or select a proof image URL.');
            return;
        }

        setIsVerifying(true);
        setVerificationError('');

        try {
            const response = await axios.post('/api/challenges/complete', {
                userId: user.id,
                challengeId: selectedChallenge.id,
                proofUrl: proofUrl.trim()
            });

            if (response.data.success) {
                if (response.data.verified) {
                    const prevLevel = profile.level;
                    const nextLevel = response.data.profile.level;
                    if (nextLevel > prevLevel) {
                        setToastMessage(`🎉 LEVEL UP! You reached Level ${nextLevel}! 🚀`);
                    } else {
                        setToastMessage('Challenge verified & claimed! +50 XP ⚡');
                    }
                    setTimeout(() => setToastMessage(''), 3000);
                    setSelectedChallenge(null);
                    await fetchChallenges();
                } else {
                    setVerificationError(response.data.reason || 'AI could not verify this proof. Try a different photo!');
                }
            }
        } catch (err) {
            console.error('Failed to claim challenge:', err);
            const errMsg = err.response?.data?.error || 'AI verification failed. Please check the image URL and try again.';
            setVerificationError(errMsg);
        } finally {
            setIsVerifying(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[250px] text-gray-400">
                <div className="animate-spin rounded-full h-5 w-5 border-b-[1.5px] border-coral mb-3"></div>
                <p className="text-[12px] font-bold tracking-widest uppercase">Syncing Challenges...</p>
            </div>
        );
    }

    const xpPercent = Math.min(100, Math.max(0, profile?.xp || 0));

    return (
        <div className="max-w-md mx-auto px-1 py-3 relative">
            {/* Header */}
            <div className="text-center mb-6">
                <span className="inline-flex items-center gap-1 bg-coral/10 text-coral text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full mb-1.5">
                    <Trophy className="w-3 h-3" /> Challenges & Levels
                </span>
                <h2 className="text-[18px] font-black text-navy leading-tight tracking-tight">Level Up Our Vibe</h2>
                <p className="text-[11px] text-gray-400 font-medium max-w-xs mx-auto mt-1">Complete date nights, upload proof, and let our AI validator verify your shared achievements.</p>
            </div>

            {/* Streak & Level Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-5">
                {/* Streak card */}
                <div className="bg-white p-3 rounded-xl border-[0.5px] border-gray-100 shadow-sm flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center border-[0.5px] border-orange-100/50 shrink-0">
                        <Flame className="w-5 h-5 text-orange-500 fill-orange-500 animate-pulse" />
                    </div>
                    <div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Date Streak</div>
                        <div className="text-[13px] font-black text-navy tracking-tight">{profile?.streak_count || 0} Week{profile?.streak_count !== 1 ? 's' : ''}</div>
                    </div>
                </div>

                {/* Level status card */}
                <div className="bg-white p-3 rounded-xl border-[0.5px] border-gray-100 shadow-sm flex items-center gap-3">
                    <div className="w-10 h-10 bg-coral/5 rounded-lg flex items-center justify-center border-[0.5px] border-coral/10 shrink-0">
                        <Sparkles className="w-5 h-5 text-coral" />
                    </div>
                    <div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Relationship Level</div>
                        <div className="text-[13px] font-black text-navy tracking-tight">Level {profile?.level || 1}</div>
                    </div>
                </div>
            </div>

            {/* XP progress bar card */}
            <div className="bg-white p-3.5 rounded-xl border-[0.5px] border-gray-100 shadow-sm mb-6">
                <div className="flex justify-between items-center text-[10px] font-black text-navy uppercase tracking-wider mb-2">
                    <span>XP Progress</span>
                    <span className="text-coral">{profile?.xp || 0} / 100 XP</span>
                </div>
                <div className="w-full h-1.5 bg-gray-50 rounded-full overflow-hidden border-[0.5px] border-gray-100/50">
                    <div 
                        className="h-full bg-gradient-to-r from-coral to-orange-400 transition-all duration-500 rounded-full"
                        style={{ width: `${xpPercent}%` }}
                    />
                </div>
                <p className="text-[10px] text-gray-400 font-medium mt-2">Earn {100 - (profile?.xp || 0)} more XP to level up to Level {(profile?.level || 1) + 1}!</p>
            </div>

            {/* Challenges Board */}
            <h3 className="text-[11px] font-black text-navy uppercase tracking-wider mb-3">Vibe Challenges</h3>
            <div className="space-y-3">
                {challenges.map((ch) => {
                    const isCompleted = profile?.completed_challenges?.includes(ch.id);

                    return (
                        <div 
                            key={ch.id}
                            className={`p-3 rounded-xl border-[0.5px] transition-all flex items-center justify-between gap-4 ${
                                isCompleted 
                                    ? 'bg-gray-50/50 border-gray-100' 
                                    : 'bg-white border-gray-100 hover:border-coral/20'
                            }`}
                        >
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[12px] font-black text-navy tracking-tight">{ch.title}</span>
                                    <span className="text-[9px] font-bold text-coral bg-coral/5 px-1.5 py-0.5 rounded border-[0.5px] border-coral/10 uppercase tracking-tight shrink-0">
                                        +50 XP
                                    </span>
                                </div>
                                <p className="text-[10.5px] text-gray-400 font-medium leading-normal mt-0.5">{ch.description}</p>
                            </div>

                            {isCompleted ? (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border-[0.5px] border-emerald-100 px-2.5 py-1 rounded-lg shrink-0">
                                    <Check className="w-3 h-3" /> Claimed
                                </span>
                            ) : (
                                <button
                                    onClick={() => {
                                        setSelectedChallenge(ch);
                                        setProofUrl('');
                                        setVerificationError('');
                                    }}
                                    className="bg-navy hover:bg-navy-light text-white text-[10.5px] font-black px-3 py-1.5 rounded-lg active:scale-95 transition-all shadow-sm shrink-0 flex items-center gap-0.5 animate-pulse"
                                >
                                    Claim <ArrowRight className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* AI PROOF VERIFICATION MODAL SHEET */}
            {selectedChallenge && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 border-[0.5px] border-gray-150 flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="p-5 border-b-[0.5px] border-gray-100 bg-gray-50/50 flex justify-between items-start">
                            <div>
                                <span className="inline-flex items-center gap-1 bg-coral/10 text-coral text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded">
                                    🛡️ AI Verification Required
                                </span>
                                <h3 className="text-[13px] font-black text-navy mt-1.5 tracking-tight">Prove you completed:</h3>
                                <p className="text-[11px] font-bold text-coral mt-0.5">"{selectedChallenge.title}"</p>
                            </div>
                            <button 
                                onClick={() => setSelectedChallenge(null)}
                                className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-5 space-y-4 flex-1 overflow-y-auto">
                            <p className="text-[11px] text-gray-500 font-semibold leading-relaxed">
                                {selectedChallenge.description} To claim your points, submit a picture showing you completed this challenge.
                            </p>

                            {/* Proof URL Input */}
                            <div>
                                <label className="block text-[10px] font-black text-navy uppercase tracking-wider mb-1.5">Proof Image URL</label>
                                <input
                                    type="text"
                                    value={proofUrl}
                                    onChange={(e) => setProofUrl(e.target.value)}
                                    placeholder="Paste public image link (e.g. Unsplash, Imgur)..."
                                    className="w-full p-2.5 bg-gray-50 border-[0.5px] border-gray-250 rounded-xl text-xs font-medium placeholder-gray-400 focus:outline-none focus:border-coral transition-all"
                                />
                            </div>

                            {/* Presets Grid */}
                            <div>
                                <label className="block text-[10px] font-black text-navy uppercase tracking-wider mb-2">Or select a mock photo to test:</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {MOCK_PRESETS.map((preset, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => setProofUrl(preset.url)}
                                            className={`p-2 rounded-lg text-left text-[10px] font-semibold border transition-all ${
                                                proofUrl === preset.url
                                                    ? 'bg-coral/5 border-coral text-coral font-bold shadow-sm'
                                                    : 'bg-white border-gray-150 text-slate-600 hover:bg-gray-50'
                                            }`}
                                        >
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Verification Failure Message */}
                            {verificationError && (
                                <div className="p-3 bg-rose-50 border-[0.5px] border-rose-100 text-rose-600 rounded-xl flex items-start gap-2 animate-in slide-in-from-top-2 duration-300">
                                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                    <p className="text-[10.5px] font-bold leading-normal">{verificationError}</p>
                                </div>
                            )}
                        </div>

                        {/* Actions Footer */}
                        <div className="p-4 bg-gray-50/50 border-t-[0.5px] border-gray-100 grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setSelectedChallenge(null)}
                                className="py-2 rounded-xl text-xs font-black text-gray-400 hover:bg-gray-100 transition-all uppercase tracking-wider border-[0.5px] border-gray-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleVerifyAndClaim}
                                disabled={isVerifying}
                                className="py-2 rounded-xl text-xs font-black text-white bg-coral hover:bg-coral-dark shadow-md shadow-coral/20 transition-all active:scale-95 uppercase tracking-wider flex items-center justify-center gap-1.5"
                            >
                                {isVerifying ? (
                                    <>
                                        <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                                        <span>Analyzing...</span>
                                    </>
                                ) : (
                                    <>
                                        <Camera className="w-3.5 h-3.5" />
                                        <span>Verify & Claim</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
