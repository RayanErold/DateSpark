import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Loader2, Gift, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { supabase } from '../lib/supabase';
import Navbar from '../components/common/Navbar';

const CollabAcceptPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [status, setStatus] = useState('loading'); // loading | checking_auth | accepted | surprise | error | unauthenticated
    const [planId, setPlanId] = useState(null);
    const [isSurprise, setIsSurprise] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setError('Invalid invite link.');
            return;
        }

        const tryAccept = async () => {
            setStatus('checking_auth');
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                // Store token in sessionStorage and redirect to signup
                sessionStorage.setItem('pendingCollabToken', token);
                setStatus('unauthenticated');
                return;
            }

            try {
                const { data } = await axios.get('/api/collab/accept', {
                    params: { token, userId: user.id }
                });
                setPlanId(data.planId);
                if (data.isSurpriseMode) {
                    setIsSurprise(true);
                    setStatus('surprise');
                } else {
                    setStatus('accepted');
                }
            } catch (err) {
                setError(err.response?.data?.error || 'Failed to accept invite.');
                setStatus('error');
            }
        };

        tryAccept();
    }, [token]);

    // After login, re-attempt acceptance with stored token
    useEffect(() => {
        const storedToken = sessionStorage.getItem('pendingCollabToken');
        if (storedToken && storedToken === token && status === 'checking_auth') {
            sessionStorage.removeItem('pendingCollabToken');
        }
    }, []);

    return (
        <div className="min-h-screen bg-ivory">
            <Navbar />
            <div className="flex items-center justify-center min-h-[80vh] px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="editorial-card p-10 w-full max-w-md text-center"
                >
                    {/* Loading */}
                    {(status === 'loading' || status === 'checking_auth') && (
                        <>
                            <Loader2 className="w-10 h-10 text-rose mx-auto mb-4 animate-spin" />
                            <p className="editorial-label">Preparing your date plan...</p>
                        </>
                    )}

                    {/* Accepted */}
                    {status === 'accepted' && (
                        <>
                            <div className="w-16 h-16 rounded-full bg-rose/10 flex items-center justify-center mx-auto mb-6">
                                <Heart className="w-8 h-8 text-rose fill-rose/30" />
                            </div>
                            <span className="editorial-label mb-2 block">You're in!</span>
                            <h1 className="text-2xl font-serif font-bold text-plum mb-3">You've joined the date plan</h1>
                            <p className="text-taupe text-sm mb-8">You can now view the plan, vote on stops, and help shape the perfect night out together.</p>
                            <button
                                onClick={() => navigate(planId ? `/dashboard` : '/dashboard')}
                                className="btn-primary mx-auto"
                            >
                                View Date Plan <ArrowRight className="w-4 h-4" />
                            </button>
                        </>
                    )}

                    {/* Surprise mode */}
                    {status === 'surprise' && (
                        <>
                            <div className="w-16 h-16 rounded-full bg-champagne/40 flex items-center justify-center mx-auto mb-6">
                                <Gift className="w-8 h-8 text-taupe" />
                            </div>
                            <span className="editorial-label mb-2 block">Surprise Mode</span>
                            <h1 className="text-2xl font-serif font-bold text-plum mb-3">You've been invited to a surprise date!</h1>
                            <p className="text-taupe text-sm mb-8">Your partner has planned something special. The details will be revealed on date night. Just show up ready to be swept off your feet.</p>
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="btn-primary mx-auto"
                            >
                                Go to Dashboard <ArrowRight className="w-4 h-4" />
                            </button>
                        </>
                    )}

                    {/* Unauthenticated */}
                    {status === 'unauthenticated' && (
                        <>
                            <div className="w-16 h-16 rounded-full bg-rose/10 flex items-center justify-center mx-auto mb-6">
                                <Heart className="w-8 h-8 text-rose fill-rose/30" />
                            </div>
                            <span className="editorial-label mb-2 block">One More Step</span>
                            <h1 className="text-2xl font-serif font-bold text-plum mb-3">Create your account to join the date plan</h1>
                            <p className="text-taupe text-sm mb-8">Sign up for free and you'll automatically be added to the plan. Takes less than 30 seconds.</p>
                            <a href={`/signup?collab=${token}`} className="btn-primary mx-auto inline-flex">
                                Create Free Account <ArrowRight className="w-4 h-4" />
                            </a>
                            <p className="text-taupe/60 text-xs mt-4">Already have an account? <a href={`/login?collab=${token}`} className="text-rose hover:underline">Sign in</a></p>
                        </>
                    )}

                    {/* Error */}
                    {status === 'error' && (
                        <>
                            <div className="w-16 h-16 rounded-full bg-blush/60 flex items-center justify-center mx-auto mb-6">
                                <span className="text-2xl">💔</span>
                            </div>
                            <h1 className="text-2xl font-serif font-bold text-plum mb-3">Oops</h1>
                            <p className="text-taupe text-sm mb-8">{error || 'This invite link is invalid or has expired.'}</p>
                            <button onClick={() => navigate('/')} className="btn-secondary mx-auto">
                                Go to DateSpark
                            </button>
                        </>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default CollabAcceptPage;
