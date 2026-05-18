import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Heart, Loader2, Eye, EyeOff, Mail, RefreshCw, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

// Resend Email Confirmation Component
const ResendConfirmation = ({ email, resetType, onResend, onBack }) => {
    const [cooldown, setCooldown] = useState(30);
    const [isSending, setIsSending] = useState(false);
    const [resendCount, setResendCount] = useState(0);
    const timerRef = useRef(null);

    useEffect(() => {
        timerRef.current = setInterval(() => {
            setCooldown(prev => {
                if (prev <= 1) { clearInterval(timerRef.current); return 0; }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, [resendCount]);

    const handleResend = async (e) => {
        if (cooldown > 0 || isSending) return;
        setIsSending(true);
        await onResend(e);
        setIsSending(false);
        setCooldown(30);
        setResendCount(c => c + 1);
    };

    return (
        <div className="text-center space-y-5">
            <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                <Mail className="w-7 h-7 text-emerald-400" />
            </div>
            <div>
                <h3 className="text-xl font-black text-white">Check your email</h3>
                <p className="text-sm mt-1 text-slate-400">
                    {resetType === 'username'
                        ? "We've sent your account details to"
                        : "We've sent a password reset link to"}
                </p>
                <p className="text-sm font-bold text-orange-400 mt-1">{email}</p>
            </div>

            <p className="text-xs text-slate-400/80">Didn't get it? Check your spam folder or resend below.</p>

            <button
                onClick={handleResend}
                disabled={cooldown > 0 || isSending}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all border ${
                    cooldown > 0
                        ? 'bg-slate-800/40 text-slate-500 border-slate-700/30 cursor-not-allowed'
                        : 'bg-orange-500/10 text-orange-400 border-orange-500/20 hover:bg-orange-500/20 cursor-pointer'
                }`}
            >
                {isSending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <RefreshCw className="w-4 h-4" />
                )}
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Email'}
            </button>

            <button
                onClick={onBack}
                className="w-full text-center text-sm font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
                Back to Sign In
            </button>
        </div>
    );
};

const Login = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [isResetMode, setIsResetMode] = useState(false);
    const [resetStep, setResetStep] = useState(null); // 'select', 'input', or null
    const [resetType, setResetType] = useState(null); // 'username', 'password', or null
    const [resetSent, setResetSent] = useState(false);
    const [isOtpMode, setIsOtpMode] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: formData.email,
                password: formData.password,
            });

            if (error) throw error;

            if (data?.user) {
                navigate('/dashboard');
            }
        } catch (err) {
            console.error('Login error detail:', err);
            const msg = err.message || (typeof err === 'object' ? JSON.stringify(err) : String(err));
            setError(msg || 'An unexpected error occurred during login');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/dashboard`
                }
            });
            if (error) throw error;
        } catch (err) {
            console.error('Google login error:', err);
            setError(err.message || 'Error signing in with Google');
            setIsLoading(false);
        }
    };

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithOtp({
                email: formData.email,
                options: {
                    shouldCreateUser: false,
                }
            });
            if (error) throw error;
            setOtpSent(true);
        } catch (err) {
            console.error('Magic code error detail:', err);
            const msg = err.message || (typeof err === 'object' ? JSON.stringify(err) : String(err));
            setError(msg || 'Error sending magic code');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase.auth.verifyOtp({
                email: formData.email,
                token: otpCode,
                type: 'email'
            });
            if (error) throw error;
            if (data?.user) navigate('/dashboard');
        } catch (err) {
            console.error('Login Verification Error:', err);
            const msg = err.message || (typeof err === 'object' ? JSON.stringify(err) : String(err));
            setError(msg || 'Invalid or expired magic code');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });
            if (error) throw error;
            setResetSent(true);
        } catch (err) {
            console.error('Reset password error:', err);
            setError(err.message || 'Error sending reset link');
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotUsername = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/forgot-username', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to send username reminder');
            setResetSent(true);
        } catch (err) {
            console.error('Forgot username error:', err);
            setError(err.message || 'Error sending username reminder');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#070d19] relative flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden font-outfit">
            {/* Ambient Orange & Coral Backdrops */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-r from-orange-500/15 via-orange-600/10 to-coral/20 rounded-full blur-[130px] pointer-events-none" />
            <div className="absolute bottom-10 left-10 w-[300px] h-[300px] bg-orange-600/10 rounded-full blur-[90px] pointer-events-none" />
            <div className="absolute top-10 right-10 w-[300px] h-[300px] bg-coral/10 rounded-full blur-[90px] pointer-events-none" />

            <div className="relative sm:mx-auto sm:w-full sm:max-w-md z-10 text-center">
                <Link to="/" className="inline-flex flex-col items-center gap-3 cursor-pointer group">
                    <motion.div
                        animate={{
                            scale: [1, 1.18, 1, 1.18, 1],
                        }}
                        transition={{
                            duration: 1.4,
                            repeat: Infinity,
                            repeatType: "loop",
                            ease: "easeInOut",
                        }}
                        className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-coral text-white shadow-xl shadow-orange-500/25 border border-orange-400/25"
                    >
                        <Heart className="h-7 w-7 fill-current" />
                    </motion.div>
                    <div>
                        <span className="text-3xl font-black tracking-tight bg-gradient-to-r from-orange-400 via-orange-300 to-coral bg-clip-text text-transparent">
                            DateSpark
                        </span>
                        <p className="text-[9px] font-black text-orange-400/80 uppercase tracking-widest leading-none mt-1">
                            Heartbeat Login Engine
                        </p>
                    </div>
                </Link>
                <h2 className="mt-5 text-2xl font-black text-white">
                    {otpSent ? 'Verify code' : 'Welcome back'}
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                    {otpSent ? (
                        <>We sent a verification code to <span className="font-bold text-orange-400">{formData.email}</span></>
                    ) : (
                        <>
                            Don't have an account?{' '}
                            <Link to="/signup" className="font-bold text-orange-400 hover:text-orange-300 transition-colors">
                                Create one now
                            </Link>
                        </>
                    )}
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
                <div className="bg-slate-900/60 backdrop-blur-2xl py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-white/5">
                    {resetSent ? (
                        <ResendConfirmation
                            email={formData.email}
                            resetType={resetType}
                            onResend={resetType === 'username' ? handleForgotUsername : handleResetPassword}
                            onBack={() => { setIsResetMode(false); setResetStep(null); setResetType(null); setResetSent(false); }}
                        />
                    ) : resetStep === 'select' ? (
                        <div className="space-y-6">
                            <div className="text-center">
                                <h3 className="text-xl font-black text-white mb-2">What did you forget?</h3>
                                <p className="text-sm text-slate-400">Choose an option below to recover your access.</p>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                <button 
                                    onClick={() => { setResetType('username'); setResetStep('input'); }}
                                    className="w-full flex items-center justify-between p-4 bg-slate-950/40 border border-white/5 rounded-2xl hover:border-orange-500/50 transition-all group cursor-pointer"
                                >
                                    <div className="text-left">
                                        <span className="block font-black text-white group-hover:text-orange-400 transition-colors">Forgot Username/Email</span>
                                        <span className="text-xs text-slate-500">Recover your account identity</span>
                                    </div>
                                    <Eye className="w-5 h-5 text-slate-600 group-hover:text-orange-400 transition-colors" />
                                </button>
                                <button 
                                    onClick={() => { setResetType('password'); setResetStep('input'); }}
                                    className="w-full flex items-center justify-between p-4 bg-slate-950/40 border border-white/5 rounded-2xl hover:border-orange-500/50 transition-all group cursor-pointer"
                                >
                                    <div className="text-left">
                                        <span className="block font-black text-white group-hover:text-orange-400 transition-colors">Forgot Password</span>
                                        <span className="text-xs text-slate-500">Reset your secure access</span>
                                    </div>
                                    <Heart className="w-5 h-5 text-slate-600 group-hover:text-orange-400 transition-colors" />
                                </button>
                            </div>
                            <button 
                                onClick={() => { setIsResetMode(false); setResetStep(null); }} 
                                className="w-full text-center text-sm font-bold text-slate-500 hover:text-white cursor-pointer"
                            >
                                Back to Sign In
                            </button>
                        </div>
                    ) : (
                        <form className="space-y-6" onSubmit={otpSent ? handleVerifyOtp : (isOtpMode ? handleSendOtp : (isResetMode ? (resetType === 'username' ? handleForgotUsername : handleResetPassword) : handleLogin))}>
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm font-medium">
                                    {error}
                                </div>
                            )}

                            {!otpSent && (
                                <div>
                                    <label className="block text-sm font-bold text-slate-300">Account Email</label>
                                    <div className="mt-1">
                                        <input
                                            name="email"
                                            type="email"
                                            placeholder="your@email.com"
                                            autoComplete="email"
                                            required
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="appearance-none block w-full px-4 py-3 border border-white/10 bg-slate-950/40 rounded-xl placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all sm:text-sm text-white"
                                        />
                                    </div>
                                </div>
                            )}

                            {otpSent && (
                                <div>
                                    <label className="block text-sm font-bold text-slate-300">Verification Code</label>
                                    <div className="mt-1">
                                        <input
                                            type="text"
                                            maxLength={8}
                                            required
                                            placeholder="12345678"
                                            value={otpCode}
                                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                            className="appearance-none block w-full px-4 py-4 border border-white/10 bg-slate-950/40 rounded-xl placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all text-center text-2xl font-black tracking-[0.2em] text-white"
                                        />
                                    </div>
                                </div>
                            )}

                            {!isOtpMode && !isResetMode && !otpSent && (
                                <div>
                                    <div className="flex items-center justify-between">
                                        <label className="block text-sm font-bold text-slate-300">Password</label>
                                        <button type="button" onClick={() => { setIsResetMode(true); setResetStep('select'); }} className="text-xs font-semibold text-orange-400 hover:underline cursor-pointer">Forgot username or password?</button>
                                    </div>
                                    <div className="mt-1 relative">
                                        <input
                                            name="password"
                                            type={showPassword ? "text" : "password"}
                                            required
                                            value={formData.password}
                                            onChange={handleChange}
                                            className="appearance-none block w-full px-4 py-3 border border-white/10 bg-slate-950/40 rounded-xl placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all sm:text-sm text-white pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-orange-400 transition-colors cursor-pointer"
                                        >
                                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-gradient-to-r from-orange-500 to-coral text-white font-black py-3.5 rounded-xl flex justify-center items-center gap-2 shadow-lg shadow-orange-500/10 hover:shadow-orange-500/25 hover:from-orange-600 hover:to-coral active:scale-[0.98] transition-all duration-300 border-none cursor-pointer text-base disabled:opacity-50"
                                >
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (otpSent ? 'Verify & Sign In' : (isOtpMode ? 'Send Magic Code' : (isResetMode ? (resetType === 'username' ? 'Find My Username' : 'Send Reset Link') : 'Sign In')))}
                                </button>

                                {!isResetMode && !otpSent && (
                                    <>
                                        <div className="relative my-6">
                                            <div className="absolute inset-0 flex items-center">
                                                <div className="w-full border-t border-white/5"></div>
                                            </div>
                                            <div className="relative flex justify-center text-sm">
                                                <span className="px-3 bg-slate-900 text-slate-500">Or continue with</span>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            disabled={isLoading}
                                            onClick={handleGoogleLogin}
                                            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-white/10 bg-slate-950/40 rounded-xl text-slate-300 font-bold hover:bg-slate-950/60 hover:text-white transition-all shadow-sm active:scale-[0.98] cursor-pointer"
                                        >
                                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                                <path
                                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                                    fill="#4285F4"
                                                />
                                                <path
                                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                                    fill="#34A853"
                                                />
                                                <path
                                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                                    fill="#FBBC05"
                                                />
                                                <path
                                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 6.64l3.66 2.85c.87-2.6 3.3-4.53 12-4.53z"
                                                    fill="#EA4335"
                                                />
                                            </svg>
                                            Google
                                        </button>
                                    </>
                                )}
                                
                                {(isResetMode || otpSent) && (
                                    <button 
                                        type="button" 
                                        onClick={() => { setIsResetMode(false); setOtpSent(false); setResetSent(false); setResetStep(null); setResetType(null); }} 
                                        className="w-full text-center text-sm font-bold text-slate-500 hover:text-white mt-4 cursor-pointer"
                                    >
                                        Back to Sign In
                                    </button>
                                )}
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Login;
