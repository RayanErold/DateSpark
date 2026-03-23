import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Heart, Loader2 } from 'lucide-react';

const Signup = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
    });
    const [verificationMode, setVerificationMode] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        first_name: formData.firstName,
                        last_name: formData.lastName,
                    }
                }
            });

            if (error) throw error;

            // On successful signup, redirect to dashboard
            if (data?.user) {
                setVerificationMode(true);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.verifyOtp({
                email: formData.email.trim(),
                token: verificationCode.replace(/\s/g, ''),
                type: 'email'
            });

            if (error) throw error;
            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (verificationMode) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="flex items-center justify-center gap-2 mb-8 cursor-pointer">
                        <img src="/datespark-logo.png" alt="DateSpark Logo" className="w-10 h-10 rounded-xl shadow-lg shadow-coral/20 object-cover bg-white" />
                        <span className="text-2xl font-bold tracking-tight text-navy">DateSpark</span>
                    </div>
                    <h2 className="mt-6 text-center text-3xl font-black text-navy">Verify your email</h2>
                    <p className="mt-2 text-center text-sm text-gray-500">
                        We sent a 6-digit code to <span className="font-bold text-navy">{formData.email}</span>
                    </p>
                </div>

                <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-white py-8 px-4 shadow sm:rounded-2xl sm:px-10 border border-gray-100">
                        <form className="space-y-6" onSubmit={handleVerifyOtp}>
                            {error && (
                                <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium">
                                    {error}
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-bold text-gray-700">Verification Code</label>
                                <div className="mt-1">
                                    <input
                                        type="text"
                                        maxLength={6}
                                        required
                                        placeholder="123456"
                                        value={verificationCode}
                                        onChange={(e) => setVerificationCode(e.target.value)}
                                        className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-coral focus:border-transparent transition-all sm:text-sm text-center text-xl font-bold tracking-widest"
                                    />
                                </div>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full btn-primary py-3 rounded-xl flex justify-center items-center gap-2"
                                >
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Continue'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <Link to="/" className="flex items-center justify-center gap-2 mb-8 cursor-pointer">
                    <img src="/datespark-logo.png" alt="DateSpark Logo" className="w-10 h-10 rounded-xl shadow-lg shadow-coral/20 object-cover bg-white" />
                    <span className="text-2xl font-bold tracking-tight text-navy">DateSpark</span>
                </Link>
                <h2 className="mt-6 text-center text-3xl font-black text-navy">Create your account</h2>
                <p className="mt-2 text-center text-sm text-gray-500">
                    Already have an account?{' '}
                    <Link to="/login" className="font-medium text-coral hover:text-coral/80 transition-colors">
                        Sign in
                    </Link>
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-2xl sm:px-10 border border-gray-100">
                    <form className="space-y-6" onSubmit={handleSignup}>
                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium">
                                {error}
                            </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700">First Name</label>
                                <div className="mt-1">
                                    <input
                                        name="firstName"
                                        type="text"
                                        required
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-coral focus:border-transparent transition-all sm:text-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700">Last Name</label>
                                <div className="mt-1">
                                    <input
                                        name="lastName"
                                        type="text"
                                        required
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-coral focus:border-transparent transition-all sm:text-sm"
                                    />
                                </div>
                            </div>
                        </div>

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

                        <div>
                            <label className="block text-sm font-bold text-gray-700">Password</label>
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

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full btn-primary py-3 rounded-xl flex justify-center items-center gap-2"
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Signup;
