import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { Heart, LogOut, Plus, MapPin, Calendar, Clock, X, Map as MapIcon, Compass, Trash2, Ticket, Share2, Wallet, Car, LayoutGrid, Bookmark, User, Settings, CreditCard, Bell, ChevronDown, Check, Circle, Search, Utensils, Globe, Loader2 } from 'lucide-react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#111827' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#111827' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#9ca3af' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#f97316' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#f43f5e' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#064e3b' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#10b981' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1f2937' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#111827' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#6b7280' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#374151' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#111827' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#d1d5db' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#111827' }] },
  { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#f97316' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#030712' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#4b5563' }] },
  { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#030712' }] }
];

const Dashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [plans, setPlans] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [activeTab, setActiveTab] = useState('all');

    // --- SETTINGS STATE ---
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [settingsTab, setSettingsTab] = useState('profile');
    const [appTheme, setAppTheme] = useState(() => localStorage.getItem('appTheme') || 'light');

    useEffect(() => {
        // Simple client-side theme class injector triggers layout fits
        document.documentElement.setAttribute('data-theme', appTheme);
        localStorage.setItem('appTheme', appTheme);
    }, [appTheme]);

    // --- FREEMIUM LOGIC STATE ---
    const [isPremium, setIsPremium] = useState(() => localStorage.getItem('isPremium') === 'true'); // Bound to localStorage for testing
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [showVisionModal, setShowVisionModal] = useState(false); // Vision Modal state
    const [completedSteps, setCompletedSteps] = useState([]);

    useEffect(() => {
        if (selectedPlan && selectedPlan.id) {
            const saved = localStorage.getItem(`completed_steps_${selectedPlan.id}`);
            setCompletedSteps(saved ? JSON.parse(saved) : []);
        }
    }, [selectedPlan]);

    const toggleStepCompletion = (idx) => {
        setCompletedSteps(prev => {
            const updated = prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx];
            if (selectedPlan && selectedPlan.id) {
                localStorage.setItem(`completed_steps_${selectedPlan.id}`, JSON.stringify(updated));
            }
            return updated;
        });
    };

    const handleBuyPass = async (planType) => {
        try {
            const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
            if (!stripe) throw new Error("Stripe Failed to Load");

            const response = await axios.post('/api/create-checkout-session', { planType });
            const { id, url } = response.data;

            // Redirect to Stripe Checkout using session URL or ID
            if (url) {
                window.location.href = url; // Standard redirect
            } else {
                await stripe.redirectToCheckout({ sessionId: id });
            }
        } catch (err) {
            console.error('Checkout error:', err);
            alert(`Payment failed: ${err.response?.data?.error || err.message}`);
        }
    };

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
    });

    const mapContainerStyle = {
        width: '100%',
        height: '300px',
        borderRadius: '1rem'
    };

    useEffect(() => {
        const fetchUserData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            if (user) {
                // Fetch user's plans
                const { data, error } = await supabase
                    .from('plans')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (!error && data) {
                    setPlans(data);
                }
            }
            setIsLoading(false);
        };

        fetchUserData();
    }, []);

    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        const stripePayment = queryParams.get('stripe_payment');

        if (stripePayment === 'success') {
            setIsPremium(true);
            localStorage.setItem('isPremium', 'true'); // Persist local testing flag
            alert('🎉 Payment Successful! You are now a Premium Member.');
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
        } else if (stripePayment === 'canceled') {
            alert('❌ Payment Canceled.');
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    const handleDelete = async (planId, e) => {
        e.stopPropagation();

        const isFavoritesTab = activeTab === 'favorites';
        const confirmMsg = isFavoritesTab
            ? 'Are you sure you want to permanently delete this favorited plan?'
            : 'Are you sure you want to remove this plan from your dashboard?';

        if (!window.confirm(confirmMsg)) return;

        try {
            if (isFavoritesTab) {
                // Hard delete from favorites tab
                const { error } = await supabase
                    .from('plans')
                    .delete()
                    .eq('id', planId);

                if (error) throw error;
                setPlans(plans.filter(p => p.id !== planId));
            } else {
                // Soft delete (archive) from main dashboard
                const { error } = await supabase
                    .from('plans')
                    .update({ is_archived: true })
                    .eq('id', planId);

                if (error) throw error;
                setPlans(plans.map(p => p.id === planId ? { ...p, is_archived: true } : p));
            }

            if (selectedPlan && selectedPlan.id === planId) setSelectedPlan(null);
        } catch (err) {
            console.error('Error removing plan:', err.message);
            alert('Failed to remove plan.');
        }
    };

    const handleToggleFavorite = async (plan, e) => {
        e.stopPropagation();

        // --- FREEMIUM FAVORITE LIMIT LOGIC ---
        if (!plan.is_favorite && !isPremium) {
            const currentFavoritesCount = plans.filter(p => p.is_favorite).length;
            if (currentFavoritesCount >= 3) {
                setShowUpgradeModal(true);
                return; // Block saving
            }
        }

        const newStatus = !plan.is_favorite;

        try {
            const { error } = await supabase
                .from('plans')
                .update({ is_favorite: newStatus })
                .eq('id', plan.id);

            if (error) throw error;
            setPlans(plans.map(p => p.id === plan.id ? { ...p, is_favorite: newStatus } : p));
        } catch (err) {
            console.error('Error toggling favorite:', err.message);
            alert('Failed to update favorite status.');
        }
    };

    const handleSync = () => {
        if (!selectedPlan) return;

        const steps = Array.isArray(selectedPlan.itinerary) ? selectedPlan.itinerary : selectedPlan.itinerary?.steps || [];
        const formattedStops = steps.map((step) => `${step.time} - ${step.venue}`).join('\n');

        const eventName = encodeURIComponent(`Date Night: ${selectedPlan.vibe} Plan`);
        const details = encodeURIComponent(`DateSpark Itinerary:\n${formattedStops}`);
        const loc = encodeURIComponent(selectedPlan.location);
        const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${eventName}&details=${details}&location=${loc}`;
        window.open(url, '_blank');
    };

    const handleShare = async () => {
        if (!selectedPlan) return;

        const domain = window.location.origin;
        const shareLink = `${domain}/shared/${selectedPlan.id}`;

        const steps = Array.isArray(selectedPlan.itinerary) ? selectedPlan.itinerary : selectedPlan.itinerary?.steps || [];
        const formattedStops = steps.map((step, index) => `${index + 1}. ${step.time} - ${step.venue}`).join('\n');

        const text = `✨ Our custom ${selectedPlan.vibe} date plan carefully crafted by DateSpark!\n\nTimeline:\n${formattedStops}\n\nCheck out the full interactive map here:`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${selectedPlan.vibe} Date Plan`,
                    text: text,
                    url: shareLink,
                });
            } catch (err) {
                console.error('Share failed:', err);
            }
        } else {
            try {
                await navigator.clipboard.writeText(`${text}\n${shareLink}`);
                alert('Detailed DateSpark link copied to clipboard!');
            } catch (err) {
                alert('Failed to copy to clipboard.');
            }
        }
    };

    const handleBudget = () => {
        if (!selectedPlan) return;
        let estimate = '';
        if (selectedPlan.budget.toLowerCase().includes('cheap') || selectedPlan.budget.toLowerCase().includes('$')) estimate = 'Estimated cost: $30 - $60 total.';
        else if (selectedPlan.budget.toLowerCase().includes('expensive') || selectedPlan.budget.toLowerCase().includes('$$$')) estimate = 'Estimated cost: $150+ total.';
        else estimate = 'Estimated cost: $60 - $120 total.';

        alert(`Budget Tier: ${selectedPlan.budget.toUpperCase()}\n\n${estimate}\nThis accounts for dinner and standard event tickets.`);
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    const getGroupedFavorites = () => {
        const favorites = plans.filter(p => p.is_favorite);
        const grouped = {};

        favorites.forEach(plan => {
            let planDateStr = null;
            if (!Array.isArray(plan.itinerary) && plan.itinerary?.metadata?.planDate) {
                planDateStr = plan.itinerary.metadata.planDate;
            } else {
                planDateStr = plan.created_at?.split('T')[0] || new Date().toISOString().split('T')[0];
            }

            const [year, month, day] = planDateStr.split('-');
            const monthNames = ["January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"];
            const monthYear = `${monthNames[parseInt(month, 10) - 1]} ${year}`;

            const category = plan.vibe || 'Other';

            if (!grouped[monthYear]) grouped[monthYear] = {};
            if (!grouped[monthYear][category]) grouped[monthYear][category] = [];

            grouped[monthYear][category].push(plan);
        });

        return grouped;
    };

    const groupedFavorites = getGroupedFavorites();
    const hasFavorites = plans.some(p => p.is_favorite);

    const renderPlanCard = (plan, planIdx, enforceLocked = false, isCompact = false) => {
        const isLockedPlan = enforceLocked || (!isPremium && activeTab === 'all' && planIdx >= 3);

        return (
            <div
                key={plan.id}
                className={`bg-white rounded-3xl border border-gray-100 ${isCompact ? 'p-4' : 'p-6'} shadow-sm transition-all group relative overflow-hidden ${isLockedPlan ? 'cursor-not-allowed border-gray-200' : 'hover:shadow-md'}`}
                onClick={() => {
                    if (isLockedPlan) {
                        setShowUpgradeModal(true);
                    }
                }}
            >
                {/* Blur Overlay for Locked Plans */}
                {isLockedPlan && (
                    <div className="absolute inset-0 z-10 backdrop-blur-[6px] bg-white/40 flex flex-col items-center justify-center pointer-events-none">
                        <div className="w-12 h-12 bg-navy rounded-full flex items-center justify-center mb-3 shadow-lg">
                            <span className="text-white text-xl">🔒</span>
                        </div>
                        <h4 className="text-lg font-black text-navy px-4 text-center">Premium Plan</h4>
                        <p className="text-sm font-bold text-coral mt-1">Click to Unlock</p>
                    </div>
                )}
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all z-30">
                    <button
                        onClick={(e) => handleToggleFavorite(plan, e)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors bg-white rounded-full shadow-sm"
                        title={plan.is_favorite ? "Remove from Favorites" : "Mark as Favorite"}
                    >
                        <Heart className={`w-5 h-5 ${plan.is_favorite ? 'fill-red-500 text-red-500' : ''}`} />
                    </button>
                    <button
                        onClick={(e) => handleDelete(plan.id, e)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors bg-white rounded-full shadow-sm"
                        title="Delete Plan"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-4 pr-8">
                    <div className="space-y-1">
                        <h3 className={`${isCompact ? 'text-lg' : 'text-xl'} font-bold text-navy capitalize`}>{plan.vibe} Date</h3>
                        <div className="flex flex-col gap-1.5 mt-2">
                            <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                                <MapPin className="w-4 h-4 text-coral" /> {plan.location}
                            </div>
                            {!Array.isArray(plan.itinerary) && plan.itinerary?.metadata?.planDate && (
                                <div className="flex items-center gap-2 text-sm text-navy font-bold">
                                    <Calendar className="w-4 h-4 text-navy" /> Planned for: {
                                        new Date(plan.itinerary.metadata.planDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
                                    }
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <span className="inline-block px-3 py-1 mb-4 bg-green-50 text-green-700 text-xs font-bold uppercase rounded-full tracking-wider border border-green-100">
                    {plan.budget}
                </span>

                {!isCompact && (
                    <div className="space-y-4 mb-6">
                        {(Array.isArray(plan.itinerary) ? plan.itinerary : plan.itinerary?.steps || [])?.slice(0, 2).map((step, idx) => (
                            <div key={idx} className="flex gap-3">
                                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 text-navy">
                                    <Clock className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-navy">{step.time}</p>
                                    <p className="text-sm text-gray-600 line-clamp-1">{step.activity}</p>
                                </div>
                            </div>
                        ))}
                        {(Array.isArray(plan.itinerary) ? plan.itinerary : plan.itinerary?.steps || [])?.length > 2 && (
                            <p className="text-sm text-coral font-medium pl-11">
                                + {(Array.isArray(plan.itinerary) ? plan.itinerary : plan.itinerary?.steps)?.length - 2} more activities {isLockedPlan ? '(Locked)' : ''}
                            </p>
                        )}
                    </div>
                )}
                <button
                    onClick={(e) => {
                        if (isLockedPlan) {
                            e.stopPropagation();
                            setShowUpgradeModal(true);
                        } else {
                            setSelectedPlan(plan);
                        }
                    }}
                    className={`w-full py-2.5 font-bold rounded-xl border transition-colors ${isLockedPlan ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-gray-50 text-navy border-gray-100 group-hover:bg-coral group-hover:text-white group-hover:border-coral'
                        }`}
                >
                    {isLockedPlan ? 'Unlock Plan' : 'View Full Plan'}
                </button>
            </div>
        );
    };

    if (isLoading) {
        return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;
    }

    return (
        <div className={`min-h-screen transition-colors duration-300 ${appTheme === 'dark' ? 'bg-navy text-white [&_.bg-white]:bg-navy/80 [&_.text-navy]:text-white [&_.border-gray-100]:border-white/10' : appTheme === 'sunset' ? 'bg-gradient-to-br from-coral/5 to-pink-50/50 bg-white' : 'bg-gray-50'}`}>
            {/* Minimal App Header */}
            <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Link to="/dashboard" className="flex items-center gap-2">
                        <img src="/datespark-logo.png" alt="DateSpark Logo" className="w-8 h-8 rounded-lg shadow-md object-cover bg-white" />
                        <span className="text-lg font-bold text-navy">DateSpark</span>
                    </Link>

                    <div className="flex items-center gap-4 relative">
                        {/* Mock Toggle for testing Premium Features in Header */}
                        <div className="hidden sm:flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 mr-2">
                            <span className={`text-xs font-bold ${!isPremium ? 'text-coral' : 'text-gray-400'}`}>Free</span>
                            <button
                                onClick={() => {
                                    const newVal = !isPremium;
                                    setIsPremium(newVal);
                                    localStorage.setItem('isPremium', newVal.toString());
                                }}
                                className={`w-10 h-5 rounded-full transition-colors relative flex items-center ${isPremium ? 'bg-navy' : 'bg-gray-200'}`}
                                title="Toggle Premium Status for Testing"
                            >
                                <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-[3px] transition-transform ${isPremium ? 'translate-x-[22px]' : 'translate-x-[3px]'}`} />
                            </button>
                            <span className={`text-xs font-bold ${isPremium ? 'text-navy' : 'text-gray-400'}`}>Pro</span>
                        </div>

                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center gap-2 hover:bg-gray-50 p-1.5 rounded-xl transition-colors outline-none"
                        >
                            <div className="w-9 h-9 bg-navy text-white rounded-lg flex items-center justify-center font-bold shadow-sm">
                                {user?.user_metadata?.first_name?.[0] || 'U'}
                            </div>
                            <span className="text-sm font-bold text-navy hidden sm:block">
                                {user?.user_metadata?.first_name || 'User'}
                            </span>
                            <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Dropdown Menu */}
                        {isDropdownOpen && (
                            <div className="absolute top-14 right-0 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="p-4 border-b border-gray-50 bg-gray-50/50">
                                    <p className="font-bold text-navy truncate">{user?.user_metadata?.first_name} {user?.user_metadata?.last_name}</p>
                                    <p className="text-xs text-gray-500 truncate mt-0.5">{user?.email}</p>
                                </div>
                                <div className="p-2 space-y-1">
                                    <button
                                        onClick={() => { setShowSettingsModal(true); setSettingsTab('profile'); setIsDropdownOpen(false); }}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-navy rounded-xl transition-colors text-left"
                                    >
                                        <User className="w-4 h-4 text-gray-400" /> Account Profile
                                    </button>
                                    <button
                                        onClick={() => { setShowSettingsModal(true); setSettingsTab('subscription'); setIsDropdownOpen(false); }}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-navy rounded-xl transition-colors text-left"
                                    >
                                        <CreditCard className="w-4 h-4 text-gray-400" /> Subscription & Billing
                                    </button>
                                    <button
                                        onClick={() => { setShowSettingsModal(true); setSettingsTab('preferences'); setIsDropdownOpen(false); }}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-navy rounded-xl transition-colors text-left"
                                    >
                                        <Settings className="w-4 h-4 text-gray-400" /> Preferences
                                    </button>
                                </div>
                                <div className="p-2 border-t border-gray-50">
                                    <button
                                        onClick={handleSignOut}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors text-left"
                                    >
                                        <LogOut className="w-4 h-4" /> Sign Out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-navy">Your Date Plans</h1>
                        <p className="text-gray-500 mt-1">Manage and view your generated itineraries.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link
                            to="/generate"
                            className="btn-primary py-3 px-6 rounded-xl flex items-center justify-center gap-2 font-bold shadow-lg shadow-coral/20 hover:-translate-y-0.5 transition-all"
                        >
                            <Plus className="w-5 h-5" /> New Plan
                        </Link>
                    </div>
                </div>

                {/* Tabs */}
                {plans.length > 0 && (
                    <div className="flex bg-gray-200/50 p-1.5 rounded-2xl mb-8 border border-gray-100 max-w-sm">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`flex-1 py-2.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'all' ? 'bg-white text-navy shadow-sm' : 'text-gray-500 hover:text-navy'}`}
                        >
                            <LayoutGrid className="w-4 h-4" /> All Plans
                        </button>
                        <button
                            onClick={() => setActiveTab('favorites')}
                            className={`flex-1 py-2.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'favorites' ? 'bg-white text-coral shadow-sm' : 'text-gray-500 hover:text-navy'}`}
                        >
                            <Heart className={`w-4 h-4 ${activeTab === 'favorites' ? 'fill-coral text-coral' : ''}`} /> Favorites
                        </button>
                    </div>
                )}

                {/* OUR VISION BANNER */}
                <div className="bg-gradient-to-r from-violet-500/10 via-coral/5 to-white rounded-3xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between border border-gray-100 shadow-sm animate-in fade-in duration-500">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-coral/10 rounded-2xl flex items-center justify-center text-coral shadow-sm">
                            <Heart className="w-6 h-6 fill-coral text-coral" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-navy flex items-center gap-2">Why I built DateSpark <span className="text-xl">💖</span></h3>
                            <p className="text-gray-500 text-sm font-medium mt-0.5 max-w-lg">
                                Tired of date night decision fatigue? I built DateSpark to make creating unforgettable memories stress-free and enjoyable.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowVisionModal(true)}
                        className="mt-4 md:mt-0 px-5 py-2.5 bg-navy text-white text-xs font-bold rounded-xl hover:bg-navy/90 transition-all shadow-sm outline outline-1 outline-white/10"
                    >
                        Read Our Story
                    </button>
                </div>

                {plans.filter(p => !p.is_archived || p.is_favorite).length === 0 ? (
                    <div className="bg-gradient-to-br from-navy to-navy/90 rounded-[2.5rem] p-12 text-center relative overflow-hidden shadow-xl border border-navy-100/20 max-w-2xl mx-auto my-8 animate-in fade-in zoom-in-95 duration-500">
                        {/* Ambient decorative gradient bubbles */}
                        <div className="absolute -right-16 -top-16 w-64 h-64 bg-coral/20 rounded-full blur-3xl animate-pulse" />
                        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-violet-500/20 rounded-full blur-3xl" />

                        <div className="relative z-10 space-y-4">
                            <div className="w-20 h-20 bg-gradient-to-br from-coral to-pink-500 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-coral/30 rotate-6 hover:rotate-0 transition-transform duration-300">
                                <Heart className="w-10 h-10 fill-white text-white" />
                            </div>

                            <h2 className="text-4xl font-black text-white tracking-tight">Let’s plan your next date 💖</h2>
                            <p className="text-white/80 max-w-md mx-auto font-medium text-lg">
                                Stop deciding, start dating. Generate custom timelines and interactive maps in seconds.
                            </p>

                            <div className="pt-4">
                                <Link
                                    to="/generate"
                                    className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-navy font-black rounded-2xl hover:bg-coral hover:text-white transition-all shadow-xl hover:-translate-y-1 active:scale-[0.98] group"
                                >
                                    Start your first plan <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                                </Link>
                            </div>
                        </div>
                    </div>
                ) : activeTab === 'favorites' && !hasFavorites ? (
                    <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center shadow-sm animate-in fade-in duration-300">
                        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-coral">
                            <Heart className="w-8 h-8 fill-coral text-coral" />
                        </div>
                        <h3 className="text-xl font-bold text-navy mb-2">No favorites yet</h3>
                        <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                            Click the heart icon on any plan to save it to your favorites.
                        </p>
                        <button
                            onClick={() => setActiveTab('all')}
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-navy text-white font-bold rounded-xl hover:bg-navy/90 transition-colors"
                        >
                            View All Plans
                        </button>
                    </div>
                ) : activeTab === 'all' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
                        {plans.filter(p => !p.is_archived).map((plan, planIdx) => renderPlanCard(plan, planIdx, false))}
                    </div>
                ) : (
                    <div className="space-y-12 pb-12 animate-in fade-in duration-500">
                        {Object.entries(groupedFavorites).map(([monthYear, categories]) => (
                            <div key={monthYear} className="bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                                <h2 className="text-3xl font-black text-navy mb-8 flex items-center gap-3">
                                    <div className="w-12 h-12 bg-coral rounded-2xl flex items-center justify-center shadow-md shadow-coral/20">
                                        <Calendar className="w-6 h-6 text-white" />
                                    </div>
                                    {monthYear}
                                </h2>
                                <div className="space-y-10">
                                    {Object.entries(categories).map(([category, categoryPlans]) => (
                                        <div key={category} className="pl-4 sm:pl-6 border-l-4 border-gray-100 relative">
                                            {/* Decorative dot */}
                                            <div className="absolute top-1.5 -left-2.5 w-4 h-4 bg-gray-200 border-4 border-white rounded-full"></div>

                                            <h3 className="text-xl font-bold text-gray-800 uppercase tracking-wide mb-6 flex items-center gap-3">
                                                {category} Dates
                                                <span className="bg-gray-100 text-gray-500 px-3 py-1 text-xs rounded-full">{categoryPlans.length}</span>
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {categoryPlans.map((plan, idx) => renderPlanCard(plan, idx, false, true))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* View Plan Modal (Sleek Timeline UI) */}
            {selectedPlan && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/50 backdrop-blur-sm">
                    <div className="bg-[#f8f9fa] rounded-[2rem] shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row relative">

                        {/* Left Column: Timeline UI */}
                        <div className="flex-1 overflow-y-auto bg-transparent md:bg-white flex flex-col z-10">

                            {/* Navy Header Section */}
                            <div className="bg-[#0f172a]/90 backdrop-blur-md text-white p-6 sm:p-8 pb-10 sm:pb-12 relative rounded-bl-[2rem] md:rounded-bl-none sticky top-0 z-20">
                                <button
                                    onClick={() => setSelectedPlan(null)}
                                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors md:hidden"
                                >
                                    <X className="w-5 h-5" />
                                </button>

                                <div className="flex justify-between items-start">
                                    <div className="flex gap-4 items-center">
                                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                                            <Heart className="w-6 h-6 fill-white text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black font-outfit">{selectedPlan.vibe} Date</h2>
                                            <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mt-1">
                                                {!Array.isArray(selectedPlan.itinerary) && selectedPlan.itinerary?.metadata?.planDate ?
                                                    `PLANNED FOR ${new Date(selectedPlan.itinerary.metadata.planDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()}`
                                                    : 'PLANNED FOR TONIGHT'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right hidden sm:block">
                                        <h3 className="text-xl font-bold">{(Array.isArray(selectedPlan.itinerary) ? selectedPlan.itinerary : selectedPlan.itinerary?.steps)?.[0]?.time || 'TBD'}</h3>
                                        <p className="text-xs text-gray-400 font-bold uppercase mt-1">{selectedPlan.location}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Floating Tab Bar */}
                            <div className="px-4 md:px-8 -mt-6 z-10 w-full flex justify-center">
                                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-2 flex justify-between items-center text-sm font-bold text-gray-500 w-full max-w-sm">
                                    <button className="flex-1 flex flex-col items-center gap-1 py-2 text-navy bg-gray-50 rounded-xl">
                                        <Ticket className="w-5 h-5" /> Itinerary
                                    </button>
                                    <button onClick={handleSync} className="flex-1 flex flex-col items-center gap-1 py-2 hover:text-navy transition-colors">
                                        <Calendar className="w-5 h-5" /> Sync
                                    </button>
                                    <button onClick={handleShare} className="flex-1 flex flex-col items-center gap-1 py-1.5 bg-violet-50 hover:bg-violet-100 text-violet-700 rounded-xl transition-colors border border-violet-100 shadow-sm relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-gradient-to-r from-violet-200/0 via-violet-200/50 to-violet-200/0 -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
                                        <img src="/datespark-logo.png" alt="DateSpark Logo" className="w-5 h-5 rounded object-cover shadow-sm bg-white z-10" />
                                        <span className="text-[10px] font-black tracking-wide uppercase z-10 line-clamp-1 w-full text-center px-1">Share DateSpark</span>
                                    </button>
                                    <button onClick={handleBudget} className="flex-1 flex flex-col items-center gap-1 py-2 hover:text-navy transition-colors">
                                        <Wallet className="w-5 h-5" /> Budget
                                    </button>
                                </div>
                            </div>

                            {/* Vertical Timeline */}
                            {/* Spacer for Map on Mobile */}
                            <div className="h-[250px] md:hidden flex-shrink-0"></div>
                            <div className="p-6 sm:p-8 pt-10 bg-white md:bg-white rounded-t-[2.5rem] md:rounded-none shadow-sm md:shadow-none">
                                <div className="relative border-l-2 border-dashed border-gray-200 ml-4 space-y-10 pb-8">
                                    {(Array.isArray(selectedPlan.itinerary) ? selectedPlan.itinerary : selectedPlan.itinerary?.steps)?.map((step, idx) => {
                                        const isLockedStep = !isPremium && idx >= 2;

                                        // Assign specific colors for styling dots
                                        const dotColors = ['bg-coral', 'bg-yellow-400', 'bg-navy', 'bg-emerald-500', 'bg-purple-500'];
                                        const textColor = ['text-coral', 'text-yellow-500', 'text-navy', 'text-emerald-600', 'text-purple-600'];
                                        const colorIdx = idx % dotColors.length;
                                        return (
                                            <div
                                                key={idx}
                                                className={`relative ${isLockedStep ? 'cursor-pointer group/locked' : ''}`}
                                                onClick={() => {
                                                    if (isLockedStep) setShowUpgradeModal(true);
                                                }}
                                            >
                                                {/* Absolute Time on the far left of the Line setup */}
                                                <div className="absolute -left-14 top-2 text-[11px] font-black text-gray-400 text-right w-10">
                                                    {step.time}
                                                </div>

                                                {/* Checkbox Trigger button absolute on the line triggers abs items */}
                                                <button
                                                    type="button"
                                                    disabled={isLockedStep}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleStepCompletion(idx);
                                                    }}
                                                    className={`absolute -left-[7px] top-2 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm flex items-center justify-center transition-all cursor-pointer z-10 ${completedSteps.includes(idx)
                                                        ? 'bg-emerald-500 text-white border-emerald-500'
                                                        : isLockedStep ? 'bg-gray-300' : 'bg-white hover:bg-gray-50 border-gray-300'
                                                        }`}
                                                >
                                                    {completedSteps.includes(idx) ? (
                                                        <Check className="w-2 h-2 font-black" />
                                                    ) : isLockedStep ? (
                                                        <span className="text-[7px]">🔒</span>
                                                    ) : (
                                                        <div className={`w-1.5 h-1.5 rounded-full ${dotColors[colorIdx]}`} />
                                                    )}
                                                </button>

                                                {/* Card wrapper triggers layout fits securely node triggers absolute setup triggers absolute space Node triggers layout fixes triggers absolute list overlays node trigg */}
                                                <div className={`bg-white border border-gray-100 rounded-2xl p-3.5 flex flex-col gap-2.5 shadow-sm transition-all hover:shadow-md ${isLockedStep ? 'blur-sm select-none opacity-60 group-hover/locked:blur-md group-hover/locked:opacity-40' : ''} ${completedSteps.includes(idx) ? 'opacity-40' : ''}`}>
                                                     <div className="flex items-start gap-3">
                                                         {/* Category Icon */}
                                                         <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-gray-50/80 border border-gray-50`}>
                                                             {idx === 0 || step.activity?.toLowerCase().includes('dinner') || step.activity?.toLowerCase().includes('drinks') ? (
                                                                 <Utensils className="w-4 h-4 text-coral" />
                                                             ) : idx === 1 || step.activity?.toLowerCase().includes('walk') || step.activity?.toLowerCase().includes('stroll') ? (
                                                                 <Compass className="w-4 h-4 text-amber-500" />
                                                             ) : (
                                                                 <Ticket className="w-4 h-4 text-navy" />
                                                             )}
                                                         </div>
                                                         
                                                         <div className="flex-1">
                                                             <h4 className="text-base font-black font-outfit text-navy line-clamp-1">{step.venue}</h4>
                                                             <p className={`text-[9px] font-black uppercase tracking-wider ${textColor[colorIdx]} ${completedSteps.includes(idx) ? 'line-through' : ''}`}>
                                                                 {step.activity}
                                                             </p>
                                                         </div>
                                                     </div>

                                                     <p className="text-[11px] text-gray-500 font-medium leading-relaxed border-t border-gray-50 pt-2 mt-0.5">{step.description}</p>

                                                    {step.photoUrl && (
                                                        <div className="overflow-hidden rounded-xl border border-gray-50 shadow-sm mt-1">
                                                            <img
                                                                src={step.photoUrl}
                                                                alt={step.venue}
                                                                className="w-full h-44 object-cover hover:scale-105 transition-transform duration-500"
                                                                loading="lazy"
                                                            />
                                                        </div>
                                                    )}

                                                    {/* Action Tags */}
                                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                                        {step.directionsUrl && (
                                                            <a
                                                                href={step.directionsUrl}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="px-2.5 py-1.5 bg-blue-50 text-blue-600 outline outline-1 outline-blue-200 text-xs font-bold rounded-lg hover:bg-blue-600 hover:text-white transition-all inline-flex items-center gap-1 shadow-sm"
                                                            >
                                                                <MapPin className="w-3 h-3" /> Get Directions
                                                            </a>
                                                        )}

                                                        {step.bookingUrl && (
                                                            <a
                                                                href={step.bookingUrl}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="px-2.5 py-1.5 bg-green-50 text-green-600 outline outline-1 outline-green-200 text-xs font-bold rounded-lg hover:bg-green-600 hover:text-white transition-all inline-flex items-center gap-1 shadow-sm"
                                                            >
                                                                {step.bookingType === 'opentable' ? <Utensils className="w-3 h-3" /> : <Ticket className="w-3 h-3" />}
                                                                {step.bookingType === 'opentable' ? 'Book on OpenTable' : 'Find Tickets'}
                                                            </a>
                                                        )}

                                                        {step.url && step.url !== '#' && (
                                                            <a
                                                                href={step.url}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="px-2.5 py-1.5 bg-coral/10 text-coral text-xs font-bold rounded-lg hover:bg-coral hover:text-white transition-colors border border-coral/20 inline-flex items-center gap-1 shadow-sm"
                                                            >
                                                                <Ticket className="w-3 h-3" /> Book Tickets
                                                            </a>
                                                        )}

                                                        {!step.url && step.searchUrl && (
                                                            <a
                                                                href={step.searchUrl}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="px-2.5 py-1.5 bg-blue-50 text-blue-600 outline outline-1 outline-blue-200 text-xs font-bold rounded-lg hover:bg-blue-600 hover:text-white transition-all inline-flex items-center gap-1 shadow-sm"
                                                            >
                                                                <Search className="w-3 h-3" /> Search on Google
                                                            </a>
                                                        )}

                                                        {step.lat && step.lng && (
                                                            <a
                                                                href={`https://m.uber.com/ul/?action=setPickup&client_id=datespark_mvp&dropoff[latitude]=${step.lat}&dropoff[longitude]=${step.lng}&dropoff[nickname]=${encodeURIComponent(step.venue)}`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="px-2.5 py-1.5 bg-black text-white text-xs font-bold rounded-lg hover:bg-gray-800 transition-colors inline-flex items-center gap-1 shadow-sm"
                                                            >
                                                                <Car className="w-3 h-3" /> Get a Ride
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Upgrade Overlay Text pointing specifically at the locked content */}
                                                {isLockedStep && (
                                                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center opacity-0 group-hover/locked:opacity-100 transition-opacity">
                                                        <span className="bg-navy text-white px-4 py-2 rounded-xl font-bold shadow-xl flex items-center gap-2">
                                                            Unlock Premium Dates
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Embedded Google Map */}
                        <div className="absolute inset-0 md:relative md:flex flex-col w-full md:w-[350px] lg:w-[450px] bg-gray-50 border-l border-gray-200 z-0">
                            <div className="absolute top-4 right-4 z-10">
                                <button
                                    onClick={() => setSelectedPlan(null)}
                                    className="p-2 bg-white text-gray-500 hover:text-navy shadow-md rounded-full transition-colors pointer-events-auto"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {isLoaded ? (
                                <GoogleMap
                                    mapContainerStyle={{ width: '100%', height: '100%' }}
                                    center={
                                        (Array.isArray(selectedPlan.itinerary) ? selectedPlan.itinerary : selectedPlan.itinerary?.steps)?.length > 0
                                            ? { lat: (Array.isArray(selectedPlan.itinerary) ? selectedPlan.itinerary : selectedPlan.itinerary?.steps)[0].lat, lng: (Array.isArray(selectedPlan.itinerary) ? selectedPlan.itinerary : selectedPlan.itinerary?.steps)[0].lng }
                                            : { lat: 40.7128, lng: -74.0060 } // Default to NYC if no coordinates
                                    }
                                    zoom={14}
                                    options={{
                                        disableDefaultUI: true,
                                        styles: appTheme === 'dark' ? darkMapStyle : undefined,
                                    }}
                                >
                                    {/* Markers for each step */}
                                    {(Array.isArray(selectedPlan.itinerary) ? selectedPlan.itinerary : selectedPlan.itinerary?.steps || []).map((step, idx) => (
                                        <Marker
                                            key={idx}
                                            position={{ lat: step.lat, lng: step.lng }}
                                            label={{ text: (idx + 1).toString(), color: 'white', fontWeight: 'bold' }}
                                        />
                                    ))}
                                </GoogleMap>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                                    <MapIcon className="w-12 h-12 mb-4 opacity-50" />
                                    <p className="font-medium">Please add your Google Maps API Key to view the map.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* UPGRADE MODAL */}
            {showUpgradeModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm px-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all p-8 text-center relative animate-fade-in-up p-6 md:p-8">
                        <button
                            onClick={() => setShowUpgradeModal(false)}
                            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-navy transition-colors bg-gray-50 rounded-full z-20"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="w-16 h-16 bg-gradient-to-br from-coral to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-coral/30 rotate-3">
                            <Heart className="w-8 h-8 fill-white text-white" />
                        </div>

                        <h2 className="text-2xl font-black text-navy mb-2">Upgrade to Premium</h2>
                        <p className="text-gray-500 mb-6 max-w-md mx-auto font-medium text-xs">
                            Unlock full AI-driven itineraries, unlimited saving features, and city support mapped off our authorized landing tiers Node triggers.
                        </p>

                        <div className="grid md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto px-1">
                            {/* Elite Couples / Annual */}
                            <div className="bg-gradient-to-br from-navy to-navy/90 rounded-2xl p-5 text-white text-left relative overflow-hidden group hover:shadow-xl transition-all duration-300 border border-navy-100/20 flex flex-col justify-between">
                                <div className="absolute top-0 right-0 bg-gradient-to-r from-gold to-yellow-400 text-navy px-3 py-1 bg-gold rounded-bl-xl text-[9px] font-black uppercase tracking-wider z-10">
                                    Best Value
                                </div>
                                <div>
                                    <h4 className="text-lg font-black mb-1">Elite Couples</h4>
                                    <p className="text-white/70 text-[11px] mb-3">Total romance management & priority updates Node triggers.</p>
                                    <div className="flex items-end gap-1 mb-4">
                                        <span className="text-2xl font-black">$99</span>
                                        <span className="text-white/50 text-xs mb-1">/yr</span>
                                    </div>
                                    <ul className="space-y-1.5 text-[11px] text-white/80 font-bold mb-5 border-t border-white/10 pt-3">
                                        <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-gold flex-shrink-0" /> Priority bookings</li>
                                        <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-gold flex-shrink-0" /> Global city setup</li>
                                        <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-gold flex-shrink-0" /> Special planning grid</li>
                                    </ul>
                                </div>
                                <button onClick={() => handleBuyPass('elite')} className="w-full py-2.5 bg-white text-navy text-xs font-black rounded-xl hover:bg-gray-50 transition-colors shadow-lg mt-auto">
                                    Subscribe Elite
                                </button>
                            </div>

                            {/* Premium Member / Monthly */}
                            <div className="bg-white border-2 border-gray-100 rounded-2xl p-5 text-left relative group hover:border-coral/40 hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
                                <div>
                                    <h4 className="text-lg font-black text-navy mb-1">Premium Member</h4>
                                    <p className="text-gray-400 text-[11px] mb-3">For couples who go out often Node triggers.</p>
                                    <div className="flex items-end gap-1 mb-4">
                                        <span className="text-2xl font-black text-navy">$9.99</span>
                                        <span className="text-gray-400 text-xs mb-1">/mo</span>
                                    </div>
                                    <ul className="space-y-1.5 text-[11px] text-gray-500 font-bold mb-5 border-t border-gray-100 pt-3">
                                        <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-coral flex-shrink-0" /> Unlimited dates</li>
                                        <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-coral flex-shrink-0" /> Unlimited savings</li>
                                        <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-coral flex-shrink-0" /> Theme tweaks</li>
                                    </ul>
                                </div>
                                <button onClick={() => handleBuyPass('premium')} className="w-full py-2.5 bg-gradient-to-r from-coral to-coral/90 text-white text-xs font-black rounded-xl hover:opacity-90 transition-colors shadow-lg mt-auto">
                                    Subscribe Monthly
                                </button>
                            </div>

                            {/* Lifetime Access */}
                            <div className="bg-white border-2 border-gray-100 rounded-2xl p-5 text-left relative group hover:border-coral/40 hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
                                <div className="absolute top-0 right-0 bg-blue-500 text-white px-3 py-1 rounded-bl-xl text-[9px] font-black uppercase tracking-wider z-10">
                                    Save Big
                                </div>
                                <div>
                                    <h4 className="text-lg font-black text-navy mb-1">Lifetime Access</h4>
                                    <p className="text-gray-400 text-[11px] mb-3">Early Bird bundle available for first users.</p>
                                    <div className="flex items-end gap-1 mb-4">
                                        <span className="text-2xl font-black text-navy">$29.99</span>
                                        <span className="text-gray-400 text-xs mb-1 uppercase">/once</span>
                                    </div>
                                    <ul className="space-y-1.5 text-[11px] text-gray-500 font-bold mb-5 border-t border-gray-100 pt-3">
                                        <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-coral flex-shrink-0" /> core features</li>
                                        <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-coral flex-shrink-0" /> global access</li>
                                        <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-coral flex-shrink-0" /> zero fees ever</li>
                                    </ul>
                                </div>
                                <button onClick={() => handleBuyPass('lifetime')} className="w-full py-2.5 bg-gray-900 text-white text-xs font-black rounded-xl hover:bg-gray-800 transition-colors shadow-lg mt-auto">
                                    Get Lifetime
                                </button>
                            </div>

                            {/* Daily Date Pass */}
                            <div className="bg-white border-2 border-gray-100 rounded-2xl p-5 text-left relative group hover:border-coral/40 hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
                                <div>
                                    <h4 className="text-lg font-black text-navy mb-1">Daily Date Pass</h4>
                                    <p className="text-gray-400 text-[11px] mb-3">24hr pass full premium unlock coverage triggers.</p>
                                    <div className="flex items-end gap-1 mb-4">
                                        <span className="text-2xl font-black text-navy">$1.99</span>
                                        <span className="text-gray-400 text-xs mb-1 uppercase">/24hr</span>
                                    </div>
                                    <ul className="space-y-1.5 text-[11px] text-gray-500 font-bold mb-5 border-t border-gray-100 pt-3">
                                        <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-coral flex-shrink-0" /> Full 5-stop loop</li>
                                        <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-coral flex-shrink-0" /> Maps & Ubers</li>
                                        <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-coral flex-shrink-0" /> 24hr customizer</li>
                                    </ul>
                                </div>
                                <button onClick={() => handleBuyPass('daily')} className="w-full py-2.5 bg-gradient-to-r from-coral/10 to-coral/5 border border-coral text-coral text-xs font-black rounded-xl hover:bg-coral/15 transition-colors mt-auto">
                                    Get 24hr Access
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowUpgradeModal(false)}
                            className="w-full py-3 mt-4 text-gray-400 font-bold hover:text-gray-600 transition-colors text-sm"
                        >
                            Maybe Later
                        </button>
                    </div>
                </div>
            )}

            {/* OUR VISION MODAL */}
            {showVisionModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-navy/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col relative animate-in fade-in zoom-in-95 duration-200">
                        <div className="bg-gradient-to-r from-violet-500 to-coral h-2.5 w-full"></div>

                        <div className="p-8 pb-12 flex-1 overflow-y-auto">
                            <div className="w-16 h-16 bg-coral/10 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                                <Heart className="w-8 h-8 fill-coral text-coral" />
                            </div>

                            <h2 className="text-2xl font-black text-navy text-center mb-2">The Vision Behind DateSpark</h2>
                            <p className="text-xs text-gray-400 uppercase tracking-widest font-black text-center mb-6">Designed by Couples, For Couples</p>

                            <div className="space-y-4 text-gray-600 font-normal leading-relaxed text-sm">
                                <p>
                                    Like many couples, my partner and I always hit the same wall on Friday night: <strong>"What are we doing tonight?"</strong> Standard map searches give you random scattered places, not an actual execution plan with timings and sequence flow.
                                </p>
                                <p>
                                    I built <strong>DateSpark</strong> to solve decision fatigue by planning structured chronological timelines absolute map route iterations that make sense.
                                </p>
                                <p>
                                    Whether it's matching dinner sequences perfectly inside coordinates or automating ticket search deep-links, the goal is always the same: <strong>More deep memories with less stress</strong>.
                                </p>
                                <p className="pt-4 font-black text-navy text-center border-t border-gray-100 mt-6">
                                    Thanks for riding along on the journey to better dates! 💖
                                </p>
                            </div>

                            <button
                                onClick={() => setShowVisionModal(false)}
                                className="w-full mt-8 py-3.5 bg-navy text-white font-black rounded-xl hover:bg-navy/90 transition-all active:scale-[0.98] shadow-sm"
                            >
                                Close story
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ACCOUNT SETTINGS MODAL */}
            {showSettingsModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-navy/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl h-[600px] overflow-hidden flex flex-col md:flex-row relative animate-in fade-in zoom-in-95 duration-200">
                        {/* Sidebar */}
                        <div className="w-full md:w-64 bg-gray-50 border-r border-gray-100 flex flex-col p-6">
                            <h2 className="text-xl font-black text-navy mb-8">Settings</h2>
                            <nav className="space-y-2 flex-1">
                                <button
                                    onClick={() => setSettingsTab('profile')}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors text-left ${settingsTab === 'profile' ? 'bg-white text-navy shadow-sm border border-gray-100' : 'text-gray-500 hover:text-navy hover:bg-gray-100/50'}`}
                                >
                                    <User className={`w-5 h-5 ${settingsTab === 'profile' ? 'text-coral' : 'text-gray-400'}`} /> Profile
                                </button>
                                <button
                                    onClick={() => setSettingsTab('subscription')}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors text-left ${settingsTab === 'subscription' ? 'bg-white text-navy shadow-sm border border-gray-100' : 'text-gray-500 hover:text-navy hover:bg-gray-100/50'}`}
                                >
                                    <CreditCard className={`w-5 h-5 ${settingsTab === 'subscription' ? 'text-coral' : 'text-gray-400'}`} /> Subscription
                                </button>
                                <button
                                    onClick={() => setSettingsTab('preferences')}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors text-left ${settingsTab === 'preferences' ? 'bg-white text-navy shadow-sm border border-gray-100' : 'text-gray-500 hover:text-navy hover:bg-gray-100/50'}`}
                                >
                                    <Bell className={`w-5 h-5 ${settingsTab === 'preferences' ? 'text-coral' : 'text-gray-400'}`} /> Preferences
                                </button>
                            </nav>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto p-8 lg:p-12 relative">
                            <button
                                onClick={() => setShowSettingsModal(false)}
                                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-navy hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            {settingsTab === 'profile' && (
                                <div className="max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300">
                                    <h3 className="text-2xl font-black text-navy mb-2">Account Profile</h3>
                                    <p className="text-gray-500 mb-8 font-medium">Manage your personal information and email.</p>

                                    <div className="space-y-5">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-1">First Name</label>
                                                <input type="text" disabled value={user?.user_metadata?.first_name || ''} className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-1">Last Name</label>
                                                <input type="text" disabled value={user?.user_metadata?.last_name || ''} className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
                                            <input type="email" disabled value={user?.email || ''} className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed" />
                                        </div>
                                        <button className="btn-primary py-3 px-6 rounded-xl font-bold opacity-50 cursor-not-allowed w-full mt-4">
                                            Update Profile
                                        </button>
                                    </div>
                                </div>
                            )}

                            {settingsTab === 'subscription' && (
                                <div className="max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-300">
                                    <h3 className="text-2xl font-black text-navy mb-2">Subscription & Billing</h3>
                                    <p className="text-gray-500 mb-8 font-medium">Manage your DateSpark Premium plan and billing details.</p>

                                    <div className={`p-6 md:p-8 rounded-3xl border-2 ${isPremium ? 'border-coral/20 bg-coral/5' : 'border-gray-100 bg-white shadow-sm'}`}>
                                        <div className="flex items-center justify-between mb-6">
                                            <div>
                                                <h4 className="text-lg font-black text-navy">{isPremium ? 'DateSpark Premium' : 'DateSpark Free'}</h4>
                                                <p className="text-gray-500 font-medium mt-1">{isPremium ? 'Active Subscription' : 'Current Plan'}</p>
                                            </div>
                                            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg bg-white">
                                                {isPremium ? <Heart className="w-6 h-6 fill-coral text-coral" /> : <div className="font-black text-navy text-xl">F</div>}
                                            </div>
                                        </div>

                                        <div className="space-y-3 mb-8">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${isPremium ? 'bg-green-100' : 'bg-gray-100'}`}>
                                                    {isPremium ? <Check className="w-3.5 h-3.5 text-green-600 font-bold" /> : <X className="w-3.5 h-3.5 text-gray-400 font-bold" />}
                                                </div>
                                                <span className={`font-medium ${isPremium ? 'text-gray-600' : 'text-gray-400'}`}>Ultra-detailed AI generated itineraries</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${isPremium ? 'bg-green-100' : 'bg-gray-100'}`}>
                                                    {isPremium ? <Check className="w-3.5 h-3.5 text-green-600 font-bold" /> : <X className="w-3.5 h-3.5 text-gray-400 font-bold" />}
                                                </div>
                                                <span className={`font-medium ${isPremium ? 'text-gray-600' : 'text-gray-400'}`}>All 4-5 activities unlocked per plan</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                                    <Check className="w-3.5 h-3.5 text-green-600 font-bold" />
                                                </div>
                                                <span className="text-gray-600 font-medium">
                                                    Save up to {isPremium ? "unlimited favorites" : "3 favorites"}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${isPremium ? 'bg-green-100' : 'bg-gray-100'}`}>
                                                    {isPremium ? <Check className="w-3.5 h-3.5 text-green-600 font-bold" /> : <X className="w-3.5 h-3.5 text-gray-400 font-bold" />}
                                                </div>
                                                <span className={`font-medium ${isPremium ? 'text-gray-600' : 'text-gray-400'}`}>Unlimited plan generations</span>
                                            </div>
                                        </div>

                                        {isPremium ? (
                                            <div className="flex flex-col gap-3">
                                                <div className="flex flex-col sm:flex-row gap-3">
                                                    <button className="flex-1 py-3 px-6 bg-navy text-white rounded-xl font-bold hover:bg-navy/90 transition-colors">
                                                        Manage Billing Info
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if (window.confirm('Are you sure you want to cancel your Premium subscription? You can cancel anytime to stop recurring billing.')) {
                                                                setIsPremium(false);
                                                            }
                                                        }}
                                                        className="py-3 px-6 bg-white border border-red-200 text-red-600 rounded-xl font-bold hover:bg-red-50 transition-colors"
                                                    >
                                                        Cancel Subscription
                                                    </button>
                                                </div>
                                                <p className="text-[11px] text-gray-400 text-center font-medium">* Cancel anytime. Access remains active until billing period ends.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <h4 className="text-sm font-black text-navy mt-6 mb-2">Available Plans to Upgrade / Switch</h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    {[
                                                        { name: "Daily Date Pass", price: "$1.99", desc: "24-hour full access to unlimited plans.", period: "24hr" },
                                                        { name: "Lifetime Access", price: "$29.99", desc: "Pay once, access forever.", period: "lifetime" },
                                                        { name: "Premium Member", price: "$9.99", desc: "Unlimited dates & customize.", period: "mo" },
                                                        { name: "Elite Premium", price: "$99", desc: "Total romance management.", period: "yr" }
                                                    ].map((sub, idx) => (
                                                        <div key={idx} className="bg-white border border-gray-100 p-4 rounded-2xl flex flex-col justify-between hover:border-coral/40 transition-all shadow-sm">
                                                            <div>
                                                                <h5 className="font-bold text-navy text-sm">{sub.name}</h5>
                                                                <p className="text-[10px] text-gray-400 mt-0.5 leading-tight font-medium">{sub.desc}</p>
                                                                <p className="text-base font-black text-navy mt-2">{sub.price}<span className="text-xs font-normal text-gray-400">/{sub.period}</span></p>
                                                            </div>
                                                            <button
                                                                onClick={() => { setIsPremium(true); alert(`Upgraded to ${sub.name}! (Mock)`); }}
                                                                className="w-full mt-3 py-2 bg-navy text-white rounded-xl font-bold text-xs hover:bg-navy/90 transition-colors"
                                                            >
                                                                Select Plan
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {settingsTab === 'preferences' && (
                                <div className="max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300">
                                    <h3 className="text-2xl font-black text-navy mb-2">Preferences</h3>
                                    <p className="text-gray-500 mb-8 font-medium">Customize your DateSpark experience.</p>

                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between p-4 border border-gray-100 rounded-2xl bg-white shadow-sm">
                                            <div>
                                                <h4 className="font-bold text-navy">Email Reminders</h4>
                                                <p className="text-sm text-gray-500 mt-0.5">Get reminded the day before your planned date.</p>
                                            </div>
                                            <div className="w-12 h-6 bg-navy rounded-full relative cursor-pointer">
                                                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between p-4 border border-gray-100 rounded-2xl bg-white shadow-sm">
                                            <div>
                                                <h4 className="font-bold text-navy">Dark Mode</h4>
                                                <p className="text-sm text-gray-500 mt-0.5">Switch app to dark theme (Coming Soon).</p>
                                            </div>
                                            <div className="w-12 h-6 bg-gray-200 rounded-full relative cursor-not-allowed">
                                                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                                            </div>
                                        </div>

                                        {/* App Theme Selection */}
                                        <div className="space-y-4 pt-4 border-t border-gray-100">
                                            <h4 className="font-bold text-navy text-sm uppercase tracking-wider">App Theme Selection</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {[
                                                    { id: 'light', name: 'Classic Light', bg: 'bg-white border-gray-100', preview: ['bg-coral', 'bg-navy'] },
                                                    { id: 'dark', name: 'Midnight Dark', bg: 'bg-navy border-black', preview: ['bg-coral', 'bg-white'] },
                                                    { id: 'sunset', name: 'Sunset Haze', bg: 'bg-gradient-to-br from-coral to-pink-500 border-coral', preview: ['bg-white', 'bg-navy'] }
                                                ].map(theme => (
                                                    <button 
                                                        key={theme.id}
                                                        onClick={() => setAppTheme(theme.id)}
                                                        className={`p-4 rounded-xl border flex items-center justify-between transition-all ${appTheme === theme.id ? 'border-coral shadow-sm bg-coral/5' : 'border-gray-100 hover:border-gray-200 bg-white'}`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-5 h-5 rounded-full ${theme.bg} border`} />
                                                            <span className="font-semibold text-sm text-navy">{theme.name}</span>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            {theme.preview.map((c, i) => <div key={i} className={`w-2 h-2 rounded-full ${c}`} />)}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}



        </div>
    );
};

export default Dashboard;
