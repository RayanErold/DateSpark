import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Heart, Loader2 } from 'lucide-react';

const Login = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [isResetMode, setIsResetMode] = useState(false);
    const [resetSent, setResetSent] = useState(false);
    const [isOtpMode, setIsOtpMode] = useState(true); // Default to OTP for premium feel
    const [otpSent, setOtpSent] = useState(false);
    const [otpCode, setOtpCode] = useState('');

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
            console.error('Login error:', err);
            setError(err.message || 'An unexpected error occurred during login');
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
            console.error('Magic code error:', err);
            setError(err.message || 'Error sending magic code');
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
            console.error('Verification error:', err);
            setError(err.message || 'Invalid or expired magic code');
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

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <Link to="/" className="flex items-center justify-center gap-2 mb-8 cursor-pointer">
                    <img src="/datespark-logo.png" alt="DateSpark Logo" className="w-10 h-10 rounded-xl shadow-lg shadow-coral/20 object-cover bg-white" />
                    <span className="text-2xl font-bold tracking-tight text-navy">DateSpark</span>
                </Link>
                <h2 className="mt-6 text-center text-3xl font-black text-navy">{otpSent ? 'Enter verification code' : 'Welcome back'}</h2>
                <p className="mt-2 text-center text-sm text-gray-500">
                    {otpSent ? (
                        <>We sent a 6-digit code to <span className="font-bold text-navy">{formData.email}</span></>
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
                        <div className="text-center space-y-4">
                            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto text-green-500">
                                <Heart className="w-6 h-6 fill-current" />
                            </div>
                            <h3 className="text-xl font-bold text-navy">Check your email</h3>
                            <p className="text-sm text-gray-500">We've sent a link to reset your password to {formData.email}</p>
                            <button onClick={() => { setIsResetMode(false); setResetSent(false); }} className="text-sm font-semibold text-coral mt-4">Back to Sign In</button>
                        </div>
                    ) : (
                        <form className="space-y-6" onSubmit={otpSent ? handleVerifyOtp : (isOtpMode ? handleSendOtp : (isResetMode ? handleResetPassword : handleLogin))}>
                            {error && (
                                <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium">
                                    {error}
                                </div>
                            )}

                            {!otpSent && (
                                <div>
                                    <label className="block text-sm font-bold text-gray-700">Email address</label>
                                    <div className="mt-1">
                                        <input
                                            name="email"
                                            type="email"
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
                                    <label className="block text-sm font-bold text-gray-700">6-Digit Code</label>
                                    <div className="mt-1">
                                        <input
                                            type="text"
                                            maxLength={6}
                                            required
                                            placeholder="123456"
                                            value={otpCode}
                                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                            className="appearance-none block w-full px-4 py-4 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-coral focus:border-transparent transition-all text-center text-2xl font-black tracking-[0.5em] text-navy"
                                        />
                                    </div>
                                </div>
                            )}

                            {!isOtpMode && !isResetMode && !otpSent && (
                                <div>
                                    <div className="flex items-center justify-between">
                                        <label className="block text-sm font-bold text-gray-700">Password</label>
                                        <button type="button" onClick={() => setIsResetMode(true)} className="text-xs font-semibold text-coral hover:underline">Forgot password?</button>
                                    </div>
                                    <div className="mt-1">
                                        <input
                                            name="password"
                                            type="password"
                                            required
                                            value={formData.password}
                                            onChange={handleChange}
                                            className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-coral focus:border-transparent transition-all sm:text-sm"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full btn-primary py-3 rounded-xl flex justify-center items-center gap-2 shadow-lg shadow-coral/10 hover:shadow-coral/20 transition-all font-black text-lg"
                                >
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (otpSent ? 'Verify & Sign In' : (isOtpMode ? 'Send Magic Code' : (isResetMode ? 'Send Reset Link' : 'Sign In')))}
                                </button>
                                
                                {!otpSent && !isResetMode && (
                                    <button 
                                        type="button" 
                                        onClick={() => setIsOtpMode(!isOtpMode)}
                                        className="w-full text-center text-sm font-bold text-gray-400 hover:text-navy transition-colors"
                                    >
                                        {isOtpMode ? 'Login with Password instead' : 'Login with Magic Code instead'}
                                    </button>
                                )}

                                {(isResetMode || otpSent) && (
                                    <button 
                                        type="button" 
                                        onClick={() => { setIsResetMode(false); setOtpSent(false); setResetSent(false); }} 
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
