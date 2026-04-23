import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Heart, Loader2, Eye, EyeOff } from 'lucide-react';

const Signup = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const referralCode = searchParams.get('ref');
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
    const [showPassword, setShowPassword] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const email = formData.email?.trim().toLowerCase();
        const password = formData.password;

        if (!agreedToTerms) {
            setError("Please agree to the Terms of Service and Privacy Policy.");
            setIsLoading(false);
            return;
        }

        if (!email || !password) {
            setError("Email and password are required.");
            setIsLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        first_name: formData.firstName,
                        last_name: formData.lastName,
                    }
                }
            });

            if (error) {
                console.error('Raw Supabase Signup Error:', error);
                
                // Detect multiple variations of "Already Registered" error
                const isAlreadyRegistered = 
                    error.message?.toLowerCase().includes('already registered') || 
                    error.message?.toLowerCase().includes('already exists') ||
                    error.message?.toLowerCase().includes('already in use') ||
                    error.code === 'user_already_exists';

                if (isAlreadyRegistered) {
                    setError(
                        <div className="flex flex-col gap-2">
                            <span>An account with this email already exists.</span>
                            <Link to="/login" className="text-white bg-red-600 px-3 py-1.5 rounded-lg text-center font-bold hover:bg-red-700 transition-colors">
                                Sign in instead
                            </Link>
                        </div>
                    );
                    return;
                }
                throw error;
            }

            // Check if user already exists (Supabase returns success but empty identities for existing users)
            const isExistingUser = data?.user && (!data.user.identities || data.user.identities.length === 0);
            
            if (isExistingUser) {
                 setError(
                    <div className="flex flex-col gap-2">
                        <span>An account with this email already exists.</span>
                        <Link to="/login" className="text-white bg-red-600 px-3 py-1.5 rounded-lg text-center font-bold hover:bg-red-700 transition-colors">
                            Sign in instead
                        </Link>
                    </div>
                );
                return;
            }

            // On successful signup, redirect to dashboard
            if (data?.user) {
                console.log('Signup success, entering verification mode');
                setVerificationMode(true);
            }
        } catch (err) {
            console.error('Final Signup Error:', err);
            // Show the raw message for debugging, but fall back to a generic one
            const message = err.message || (typeof err === 'object' ? JSON.stringify(err) : String(err));
            setError(`Error: ${message}`);
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
                    redirectTo: `${window.location.origin}/onboarding`
                }
            });
            if (error) throw error;
        } catch (err) {
            console.error('Google login error:', err);
            setError(err.message || 'Error signing in with Google');
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
                type: 'signup'
            });

            if (error) {
                console.error('Raw Verification Error:', error);
                throw error;
            }

            // Trigger Welcome Email in background (Silent failure preferred for UX)
            const welcomeData = {
                email: formData.email.trim(),
                firstName: formData.firstName
            };
            
            console.log('Verification success, triggering welcome email:', welcomeData);
            
            fetch('/api/send-welcome', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(welcomeData)
            }).catch(e => console.error('Welcome email trigger failed:', e));

            // NEW: Redeem referral if code exists
            if (referralCode && data?.user?.id) {
                console.log('Detected referral code, redeeming:', referralCode);
                fetch('/api/redeem-referral', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: data.user.id, referralCode })
                }).then(res => res.json())
                  .then(refData => console.log('Referral redemption result:', refData))
                  .catch(e => console.error('Referral redemption failed:', e));
            }

            navigate('/onboarding');
        } catch (err) {
            console.error('Full Verification Error:', err);
            setError(err.message || 'Invalid or expired verification code');
        } finally {
            setIsLoading(false);
        }
    };

    if (verificationMode) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="flex items-center justify-center gap-2 mb-8 cursor-pointer">
                        <img src="/datespark-logo.png" alt="DateSpark Logo" className="w-10 h-10 rounded-xl shadow-lg shadow-coral/20 object-cover bg-white" />
                        <span className="text-2xl font-bold tracking-tight text-navy">DateSpark</span>
                    </div>
                    <h2 className="mt-6 text-center text-3xl font-black text-navy">Verify your email</h2>
                    <p className="mt-2 text-center text-sm text-gray-500">
                        We sent a verification code to <span className="font-bold text-navy">{formData.email}</span>
                    </p>
                </div>

                <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-white py-8 px-4 shadow sm:rounded-2xl sm:px-10 border border-gray-100">
                        <form className="space-y-6" onSubmit={handleVerifyOtp}>
                            {error && (
                                <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-medium border border-red-100 italic">
                                    {error}
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-bold text-gray-700">Verification Code</label>
                                <div className="mt-1">
                                    <input
                                        type="text"
                                        maxLength={8}
                                        required
                                        placeholder="12345678"
                                        value={verificationCode}
                                        onChange={(e) => setVerificationCode(e.target.value.replace(/\s/g, '').replace(/\D/g, ''))}
                                        className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-coral focus:border-transparent transition-all sm:text-sm text-center text-xl font-bold tracking-[0.2em]"
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
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
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
                            <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-medium border border-red-100 italic">
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

                        <div>
                            <div className="flex items-start">
                                <div className="flex items-center h-5">
                                    <input
                                        id="terms"
                                        name="terms"
                                        type="checkbox"
                                        checked={agreedToTerms}
                                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                                        className="h-4 w-4 text-coral focus:ring-coral border-gray-300 rounded cursor-pointer transition-colors"
                                        required
                                    />
                                </div>
                                <div className="ml-3 text-sm">
                                    <label htmlFor="terms" className="text-gray-500 cursor-pointer select-none">
                                        I agree to the{' '}
                                        <Link to="/terms" className="font-bold text-coral hover:text-coral/80 underline decoration-coral/30">
                                            Terms of Service
                                        </Link>
                                        {' '}and{' '}
                                        <Link to="/privacy" className="font-bold text-coral hover:text-coral/80 underline decoration-coral/30">
                                            Privacy Policy
                                        </Link>
                                    </label>
                                </div>
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

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-100"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-400">Or continue with</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            disabled={isLoading}
                            onClick={handleGoogleLogin}
                            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-200 rounded-xl bg-white text-gray-700 font-bold hover:bg-gray-50 transition-all shadow-sm active:scale-[0.98]"
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
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Signup;
