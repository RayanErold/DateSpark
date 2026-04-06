import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Heart, Loader2, Eye, EyeOff, Mail, RefreshCw } from 'lucide-react';

// Resend Email Confirmation Component with cooldown timer
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
            <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                <Mail className="w-7 h-7 text-green-500" />
            </div>
            <div>
                <h3 className="text-xl font-black text-navy">Check your email</h3>
                <p className="text-sm text-gray-500 mt-1">
                    {resetType === 'username'
                        ? `We've sent your account details to`
                        : `We've sent a password reset link to`}
                </p>
                <p className="text-sm font-bold text-navy mt-1">{email}</p>
            </div>

            <p className="text-xs text-gray-400">Didn't get it? Check your spam folder or resend below.</p>

            <button
                onClick={handleResend}
                disabled={cooldown > 0 || isSending}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all border ${
                    cooldown > 0
                        ? 'bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed'
                        : 'bg-coral/10 text-coral border-coral/20 hover:bg-coral/20'
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
                className="w-full text-center text-sm font-semibold text-gray-400 hover:text-navy transition-colors"
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
    const [isOtpMode, setIsOtpMode] = useState(false); // Default to password login as requested
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

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithOtp({
                email: formData.email,
                options: {
                    shouldCreateUser: false, // Login only
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
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <Link to="/" className="flex items-center justify-center gap-2 mb-8 cursor-pointer">
                    <img src="/datespark-logo.png" alt="DateSpark Logo" className="w-10 h-10 rounded-xl shadow-lg shadow-coral/20 object-cover bg-white" />
                    <span className="text-2xl font-bold tracking-tight text-navy">DateSpark</span>
                </Link>
                <h2 className="mt-6 text-center text-3xl font-black text-navy">{otpSent ? 'Enter verification code' : 'Welcome back'}</h2>
                <p className="mt-2 text-center text-sm text-gray-500">
                    {otpSent ? (
                        <>We sent a verification code to <span className="font-bold text-navy">{formData.email}</span></>
                    ) : (
                        <>
                            Don't have an account?{' '}
                            <Link to="/signup" className="font-medium text-coral hover:text-coral/80 transition-colors">
                                Create one now
                            </Link>
                        </>
                    )}
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-2xl sm:px-10 border border-gray-100">
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
                                <h3 className="text-xl font-black text-navy mb-2">What did you forget?</h3>
                                <p className="text-sm text-gray-400">Choose an option below to recover your access.</p>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                <button 
                                    onClick={() => { setResetType('username'); setResetStep('input'); }}
                                    className="w-full flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-2xl hover:border-coral transition-all group"
                                >
                                    <div className="text-left">
                                        <span className="block font-black text-navy group-hover:text-coral transition-colors">Forgot Username/Email</span>
                                        <span className="text-xs text-gray-400">Recover your account identity</span>
                                    </div>
                                    <Eye className="w-5 h-5 text-gray-300 group-hover:text-coral transition-colors" />
                                </button>
                                <button 
                                    onClick={() => { setResetType('password'); setResetStep('input'); }}
                                    className="w-full flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-2xl hover:border-coral transition-all group"
                                >
                                    <div className="text-left">
                                        <span className="block font-black text-navy group-hover:text-coral transition-colors">Forgot Password</span>
                                        <span className="text-xs text-gray-400">Reset your secure access</span>
                                    </div>
                                    <Heart className="w-5 h-5 text-gray-300 group-hover:text-coral transition-colors" />
                                </button>
                            </div>
                            <button 
                                onClick={() => { setIsResetMode(false); setResetStep(null); }} 
                                className="w-full text-center text-sm font-bold text-gray-400 hover:text-navy"
                            >
                                Back to Sign In
                            </button>
                        </div>
                    ) : (
                        <form className="space-y-6" onSubmit={otpSent ? handleVerifyOtp : (isOtpMode ? handleSendOtp : (isResetMode ? (resetType === 'username' ? handleForgotUsername : handleResetPassword) : handleLogin))}>
                            {error && (
                                <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium">
                                    {error}
                                </div>
                            )}

                            {!otpSent && (
                                <div>
                                    <label className="block text-sm font-bold text-gray-700">{isResetMode ? 'Account Email' : 'Username or Email'}</label>
                                    <div className="mt-1">
                                        <input
                                            name="email"
                                            type="email"
                                            placeholder="your@email.com"
                                            autoComplete="email"
                                            required
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-coral focus:border-transparent transition-all sm:text-sm"
                                        />
                                    </div>
                                </div>
                            )}

                            {otpSent && (
                                <div>
                                    <label className="block text-sm font-bold text-gray-700">Verification Code</label>
                                    <div className="mt-1">
                                        <input
                                            type="text"
                                            maxLength={8}
                                            required
                                            placeholder="12345678"
                                            value={otpCode}
                                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                            className="appearance-none block w-full px-4 py-4 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-coral focus:border-transparent transition-all text-center text-2xl font-black tracking-[0.2em] text-navy"
                                        />
                                    </div>
                                </div>
                            )}

                            {!isOtpMode && !isResetMode && !otpSent && (
                                <div>
                                    <div className="flex items-center justify-between">
                                        <label className="block text-sm font-bold text-gray-700">Password</label>
                                        <button type="button" onClick={() => { setIsResetMode(true); setResetStep('select'); }} className="text-xs font-semibold text-coral hover:underline">Forgot username or password?</button>
                                    </div>
                                    <div className="mt-1 relative">
                                        <input
                                            name="password"
                                            type={showPassword ? "text" : "password"}
                                            required
                                            value={formData.password}
                                            onChange={handleChange}
                                            className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-coral focus:border-transparent transition-all sm:text-sm pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-coral transition-colors"
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
                                    className="w-full btn-primary py-3 rounded-xl flex justify-center items-center gap-2 shadow-lg shadow-coral/10 hover:shadow-coral/20 transition-all font-black text-lg"
                                >
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (otpSent ? 'Verify & Sign In' : (isOtpMode ? 'Send Magic Code' : (isResetMode ? (resetType === 'username' ? 'Find My Username' : 'Send Reset Link') : 'Sign In')))}
                                </button>
                                
                                {(isResetMode || otpSent) && (
                                    <button 
                                        type="button" 
                                        onClick={() => { setIsResetMode(false); setOtpSent(false); setResetSent(false); setResetStep(null); setResetType(null); }} 
                                        className="w-full text-center text-sm font-bold text-gray-400 hover:text-navy mt-4"
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
