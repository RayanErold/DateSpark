import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { 
    Heart, 
    MessageCircle, 
    MessageSquare,
    Share2, 
    Trash2, 
    Search, 
    X, 
    ChevronRight, 
    Calendar, 
    MapPin, 
    Clock, 
    Sparkles, 
    Download, 
    Star, 
    Lock, 
    Ticket, 
    ExternalLink, 
    Plus, 
    Layout, 
    Utensils, 
    Compass, 
    History,
    FileText,
    ArrowLeft,
    Monitor,
    Smartphone,
    CreditCard,
    ChevronDown,
    Circle,
    Globe,
    Loader2,
    Zap,
    Crown,
    Check,
    Map as MapIcon,
    Bell,
    Car,
    LogOut,
    User,
    Settings,
    Gift,
    Copy
} from 'lucide-react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { loadStripe } from '@stripe/stripe-js';
import BottomNav from '../components/BottomNav';
import PremiumExperienceModal from '../components/PremiumExperienceModal';
import UsageBadge from '../components/UsageBadge';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import CommunityFeedbackModal from '../components/CommunityFeedbackModal';

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

const GOOGLE_MAPS_LIBRARIES = ['places'];

const SwipeCard = ({ plan, isTop, onSwipe, onView, theme }) => {
    const [photoIndex, setPhotoIndex] = useState(0);
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-25, 25]);
    const opacity = useTransform(x, [-250, -200, 0, 200, 250], [0, 1, 1, 1, 0]);
    const likeOpacity = useTransform(x, [50, 150], [0, 1]);
    const passOpacity = useTransform(x, [-150, -50], [1, 0]);

    if (!isTop) {
        return (
            <div className="absolute inset-0 bg-white/5 rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl scale-[0.96] translate-y-4 opacity-50 transition-all duration-500">
                <div className="h-full w-full bg-navy/40 backdrop-blur-3xl" />
            </div>
        );
    }

    // Data Mapping
    const cardTitle = plan.vibe ? `${plan.vibe} Date` : 'Trending Date';
    const cardLocation = plan.location || 'New Rochelle, NY';
    const cardRating = plan.avg_rating ? parseFloat(plan.avg_rating).toFixed(1) : '4.9';
    const triesCount = plan.total_tries || Math.floor(Math.random() * 150) + 50;
    const steps = Array.isArray(plan.itinerary) ? plan.itinerary : plan.itinerary?.steps || [];
    const photos = steps.map(s => s.photoUrl).filter(Boolean);
    const hasPhotos = photos.length > 0;
    const currentPhoto = hasPhotos ? photos[photoIndex] : null;

    const handlePhotoTap = (e) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        if (clickX < rect.width / 2) {
            setPhotoIndex(prev => Math.max(0, prev - 1));
        } else {
            setPhotoIndex(prev => (prev + 1) % photos.length);
        }
    };

    return (
        <motion.div
            style={{ x, rotate, opacity }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.9}
            onDragEnd={(_, info) => {
                if (info.offset.x > 120) onSwipe('right');
                else if (info.offset.x < -120) onSwipe('left');
            }}
            whileDrag={{ scale: 1.02 }}
            className={`absolute inset-0 rounded-[2.5rem] shadow-xl overflow-hidden cursor-grab active:cursor-grabbing border flex flex-col transition-colors duration-300 ${
                theme === 'dark' ? 'bg-navy border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.6)]' :
                theme === 'sunset' ? 'bg-white border-coral/20' :
                'bg-white border-gray-100 shadow-xl'
            }`}
        >
            {/* Visual Feedback Overlays */}
            <motion.div style={{ opacity: likeOpacity }} className="absolute inset-0 bg-green-500/10 pointer-events-none z-50 flex items-center justify-center">
                <div className="scale-[2] bg-green-500 p-4 rounded-full shadow-2xl">
                    <Heart className="w-12 h-12 text-white fill-white" />
                </div>
            </motion.div>
            <motion.div style={{ opacity: passOpacity }} className="absolute inset-0 bg-red-500/10 pointer-events-none z-50 flex items-center justify-center">
                <div className="scale-[2] bg-red-500 p-4 rounded-full shadow-2xl">
                    <X className="w-12 h-12 text-white" />
                </div>
            </motion.div>

            {/* HEADER SECTION */}
            <div className={`p-10 pb-6 z-20 ${theme === 'dark' ? 'bg-gradient-to-b from-navy to-navy/50' : 'bg-transparent'}`}>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                    <div className="bg-gradient-to-r from-coral to-pink-500 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-xl">TRENDING</div>
                    <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-tighter px-2.5 py-1 rounded-full border ${
                        theme === 'dark' ? 'text-white/50 bg-white/5 border-white/5' : 'text-gray-400 bg-gray-50 border-gray-100'
                    }`}>
                        <MapPin className="w-3 h-3 text-coral" /> {cardLocation}
                    </div>
                </div>
                <h3 className={`text-3xl font-black leading-tight font-outfit drop-shadow-sm ${
                    theme === 'dark' ? 'text-white' : 'text-navy'
                }`}>{cardTitle}</h3>
            </div>

            {/* IMAGE GALLERY SECTION */}
            <div 
                className={`relative flex-1 mx-6 rounded-[2.5rem] overflow-hidden border pointer-events-auto cursor-pointer mb-6 transition-colors ${
                    theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'
                }`}
                onClick={handlePhotoTap}
            >
                {hasPhotos ? (
                    <>
                        <img 
                            key={currentPhoto}
                            src={currentPhoto} 
                            alt={`Venue ${photoIndex + 1}`} 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover/image:scale-105" 
                        />
                        {/* Progress Bars (Tinder Style) */}
                        <div className="absolute top-3 inset-x-3 flex gap-1.5 z-30">
                            {photos.map((_, idx) => (
                                <div 
                                    key={idx} 
                                    className={`h-[3px] flex-1 rounded-full transition-all duration-300 ${idx === photoIndex ? 'bg-white shadow-[0_0_5px_rgba(255,255,255,0.5)]' : 'bg-white/30'}`}
                                />
                            ))}
                        </div>
                        {/* Tap Indicators (Hidden visually but functional) */}
                        <div className="absolute inset-y-0 left-0 w-1/3 z-20" />
                        <div className="absolute inset-y-0 right-0 w-1/3 z-20" />
                    </>
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-navy via-navy/90 to-coral opacity-40 p-8 text-center gap-3">
                         <MapPin className="w-12 h-12 text-white/20" />
                         <span className="text-white/40 text-xs font-bold font-outfit">Visualizing venue details...</span>
                    </div>
                )}
                {/* Image Label Overlay */}
                <div className="absolute bottom-4 left-4 right-4 z-20">
                    <div className="bg-navy/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 inline-flex items-center gap-2">
                        <span className="text-[10px] font-black text-white/90 uppercase tracking-widest">{steps[photoIndex]?.venue || 'Discovery Stop'}</span>
                    </div>
                </div>
            </div>

            {/* FOOTER SECTION */}
            <div className="px-8 pb-8 pt-2 z-20">
                <p className={`text-sm font-medium line-clamp-2 leading-snug mb-4 ${
                    theme === 'dark' ? 'text-white/60' : 'text-gray-500'
                }`}>{steps[photoIndex]?.activity || plan.vibe} Date</p>
                
                <div className={`flex items-center justify-between border-t pt-5 ${
                    theme === 'dark' ? 'border-white/10' : 'border-gray-100'
                }`}>
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                <span className={`font-black text-base ${theme === 'dark' ? 'text-white' : 'text-navy'}`}>{cardRating}</span>
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-widest mt-0.5 text-gray-400">Rating</span>
                        </div>
                        <div className={`w-px h-6 ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'}`} />
                        <div className="flex flex-col">
                            <span className={`font-black text-base ${theme === 'dark' ? 'text-white' : 'text-navy'}`}>{triesCount}</span>
                            <span className="text-[9px] font-black uppercase tracking-widest mt-0.5 text-gray-400">Tries</span>
                        </div>
                    </div>

                    <button 
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            e.preventDefault();
                            onView(); 
                        }} 
                        className={`px-6 py-3 font-black rounded-xl transition-all text-xs shadow-lg active:scale-95 flex items-center gap-2 group/btn ${
                            theme === 'dark' ? 'bg-white text-navy hover:bg-coral hover:text-white' : 'bg-navy text-white hover:bg-coral hover:translate-y-[-2px]'
                        }`}
                    >
                        View Plan
                        <ChevronRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

const Dashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const hasFetchedRef = React.useRef(false);
    const [plans, setPlans] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [activeTab, setActiveTab] = useState('all');
    const [showDiscovery, setShowDiscovery] = useState(false);
    const [swipeIndex, setSwipeIndex] = useState(0);
    const [swipeDirection, setSwipeDirection] = useState(null);
    const [showMapMobile, setShowMapMobile] = useState(false);

    // --- SETTINGS STATE ---
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [debugError, setDebugError] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [settingsTab, setSettingsTab] = useState('profile');
    const [appTheme, setAppTheme] = useState(() => localStorage.getItem('appTheme') || 'light');
    const [profileData, setProfileData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        weekend_spark_enabled: true
    });
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [showVisionBanner, setShowVisionBanner] = useState(() => {
        return localStorage.getItem('hideVisionBanner') !== 'true';
    });

    useEffect(() => {
        // Apply theme class to body for index.css targeting
        document.body.className = `theme-${appTheme}`;
        localStorage.setItem('appTheme', appTheme);
    }, [appTheme]);

    // --- FREEMIUM LOGIC STATE ---
    const [isPremium, setIsPremium] = useState(() => {
        // Allow Admin to persist their manual toggle for testing
        const adminEmail = 'rayanerold@gmail.com';
        const isCurrentlyAdmin = localStorage.getItem('userEmail') === adminEmail;
        if (isCurrentlyAdmin) {
            return localStorage.getItem('isPremium') === 'true';
        }
        return false; // Regular users default to false (strict DB sync)
    });

    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [limitType, setLimitType] = useState(null); // 'classic', 'guided', or 'swap'
    const [showVisionModal, setShowVisionModal] = useState(false); // Vision Modal state
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, plan: null, type: 'trash', isBatch: false });
    const [showIdeaModal, setShowIdeaModal] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState('');
    const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
    const [completedSteps, setCompletedSteps] = useState([]);

    // --- SWITCH UP STATE ---
    const [isSwitchingUp, setIsSwitchingUp] = useState(false);
    const [alternatives, setAlternatives] = useState([]);
    const [activeSwitchIndex, setActiveSwitchIndex] = useState(null);
    const [selectedPlanIds, setSelectedPlanIds] = useState([]);
    const [isSelectMode, setIsSelectMode] = useState(false);
    
    // --- SOCIAL & FEEDBACK STATE ---
    const [ratingPlan, setRatingPlan] = useState(null);
    const [globalTrendingPlans, setGlobalTrendingPlans] = useState([]);
    const [isTrendingLoading, setIsTrendingLoading] = useState(false);
    const [referralDetails, setReferralDetails] = useState({ code: '', count: 0 });
    const [copied, setCopied] = useState(false);

    // Usage state for Free users
    const [usage, setUsage] = useState({
        classic: 0,
        guided: 0,
        swap: 0
    });
    const [limits, setLimits] = useState({
        classic: 3,
        guided: 2,
        swap: 10
    });

    // Helper: Get most popular vibe tag
    const getPopularTag = (vibe_tags) => {
        if (!Array.isArray(vibe_tags) || vibe_tags.length === 0) return null;
        const counts = vibe_tags.reduce((acc, tag) => {
            acc[tag] = (acc[tag] || 0) + 1;
            return acc;
        }, {});
        const mostFrequent = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
        
        const tags = {
            'anniversary': { label: 'Anniversary', icon: '💍' },
            'icebreaker': { label: 'Icebreaker', icon: '🧊' },
            'budget': { label: 'Budget-Friendly', icon: '💸' },
            'rainy': { label: 'Rainy Day', icon: '🌧️' }
        };
        return tags[mostFrequent] || null;
    };

    // Calculate User Level / Badges
    const userReviewCount = plans.reduce((acc, p) => {
        const myReviews = Array.isArray(p.reviews) ? p.reviews.filter(r => r.user_id === user?.id) : [];
        return acc + myReviews.length;
    }, 0);
    const isDateMaster = userReviewCount >= 3;

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

            const response = await axios.post('/api/create-checkout-session', { 
                planType,
                userId: user?.id,
                email: user?.email
            });
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

    const handleManageSubscription = async () => {
        try {
            setIsLoading(true);
            const response = await axios.post('/api/create-portal-session', {
                userId: user?.id,
                email: user?.email
            });
            
            if (response.data.url) {
                window.location.href = response.data.url;
            } else {
                throw new Error('Portal URL not returned');
            }
        } catch (err) {
            console.error('Portal error:', err);
            alert('Failed to open subscription management. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const syncPremiumWithDB = async (status) => {
        // Optimistic UI update
        setIsPremium(status);
        localStorage.setItem('isPremium', status ? 'true' : 'false');
        
        if (!user) {
            console.warn('Cannot sync premium status: No authenticated user found.');
            return;
        }

        try {
            console.log(`[Sync] Attempting to sync premium status (${status}) for user: ${user.id}`);
            const response = await fetch('/api/update-premium-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, isPremium: status })
            });
            
            if (!response.ok) {
                const errData = await response.json();
                console.error('[Sync] DB update failed:', errData.error);
                // Optionally revert on failure if you want strict sync, 
                // but for testing, let's keep it optimistic.
            } else {
                console.log('[Sync] Database successfully updated.');
            }
        } catch (err) {
            console.error('[Sync] Network error during premium sync:', err);
        }
    };
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
        libraries: GOOGLE_MAPS_LIBRARIES
    });

    const mapContainerStyle = {
        width: '100%',
        height: '300px',
        borderRadius: '1rem'
    };

    const supabaseRequest = async (method, path, body = null) => {
        const baseUrl = import.meta.env.VITE_SUPABASE_URL;
        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        // Use the user's active session token if available to bypass RLS, otherwise fallback to anonKey
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token || anonKey; 
        
        const options = {
            method,
            headers: {
                'apikey': anonKey,
                'Authorization': `Bearer ${token}`,
                'Prefer': method === 'PATCH' || method === 'DELETE' ? 'return=minimal' : 'return=representation'
            }
        };

        if (body) {
            options.headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(body);
        }

        const url = `${baseUrl}/rest/v1/${path}`;
        
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                const errBody = await response.text();
                let parsedErr = errBody;
                try {
                    const json = JSON.parse(errBody);
                    parsedErr = json.message || json.error || json.hint || JSON.stringify(json);
                } catch (e) { /* not json */ }
                
                console.error(`Supabase API Detailed Error [${method} ${path}]:`, errBody);
                throw new Error(`HTTP ${response.status}: ${parsedErr}`);
            }
            
            if (response.status === 204) return { success: true };
            const text = await response.text();
            return text ? JSON.parse(text) : { success: true };
        } catch (err) {
            console.error(`supabaseRequest ERROR [${method} ${path}]:`, err.message);
            throw err;
        }
    };

    useEffect(() => {
        const fetchUserData = async () => {
            if (hasFetchedRef.current) return;
            hasFetchedRef.current = true;
            
            try {
                const { data: { user }, error: userError } = await supabase.auth.getUser();
                if (userError) throw userError;

                console.log('Dashboard - Current User:', user?.id);
                setUser(user);

                // Fetch premium status and usage from secure backend proxy
                const [premRes, usageRes] = await Promise.all([
                    fetch(`/api/user-premium/${user.id}`),
                    fetch(`/api/user-usage/${user.id}`)
                ]);

                if (premRes.ok) {
                    const data = await premRes.json();
                    setIsPremium(data.isPremium);
                    setReferralDetails({ 
                        code: data.referral_code || '', 
                        count: data.referral_count || 0 
                    });
                    localStorage.setItem('isPremium', data.isPremium ? 'true' : 'false');
                }

                if (usageRes.ok) {
                    const data = await usageRes.json();
                    setUsage(data.usage);
                    setLimits(data.limits);
                }

                if (user) {
                    setProfileData({
                        first_name: user.user_metadata?.first_name || '',
                        last_name: user.user_metadata?.last_name || '',
                        email: user.email || ''
                    });

                    // Sync premium status from DB to local state using secure backend proxy to bypass UUID/400 errors
                    try {
                        const response = await fetch(`/api/user-premium/${user.id}`);
                        if (response.ok) {
                            const data = await response.json();
                            const { isPremium: dbStatus, premium_expiry, referral_code, referral_count } = data;
                            
                            // Check if premium via boolean OR via active expiry
                            const now = new Date();
                            const hasActivePass = premium_expiry && new Date(premium_expiry) > now;
                            const finalStatus = dbStatus || hasActivePass;

                            setIsPremium(finalStatus);
                            setReferralDetails({ 
                                code: referral_code || '', 
                                count: referral_count || 0 
                            });
                            localStorage.setItem('isPremium', finalStatus ? 'true' : 'false');
                            if (premium_expiry) {
                                localStorage.setItem('premiumExpiry', premium_expiry);
                            } else {
                                localStorage.removeItem('premiumExpiry');
                            }
                        }
                    } catch (syncErr) {
                        console.error('Dashboard Premium Sync Error:', syncErr);
                    }

                    // Fetch plans via the backend proxy
                    const fetchPlans = async () => {
                        try {
                            console.log('Dashboard - Fetching plans via server proxy for user:', user.id);
                            const response = await fetch(`/api/user-plans?userId=${user.id}`);
                            if (!response.ok) throw new Error(`Proxy error: ${response.status}`);
                            const data = await response.json();
                            setPlans(data || []);
                        } catch (err) {
                            console.error('Final Plan Fetch Error (via Proxy):', err.message);
                        }
                    };

                    await fetchPlans();
                }
            } catch (err) {
                console.error('Dashboard - fetchUserData error:', err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserData();
        return () => { hasFetchedRef.current = false; };
    }, []);

    // NEW: Fetch trending plans if user has no plans
    useEffect(() => {
        const fetchTrending = async () => {
            // Only fetch trending if user is loaded and they have no plans of their own yet
            // Ensure globalTrendingPlans is not already set and trendingPlans is not already set
            if (user && plans.length === 0 && globalTrendingPlans.length === 0) {
                setIsTrendingLoading(true);
                try {
                    console.log('[Trending] Fetching community favorites for new user experience...');
                    const response = await fetch('/api/trending-plans');
                    if (response.ok) {
                        const data = await response.json();
                        setGlobalTrendingPlans(data || []);
                    }
                } catch (err) {
                    console.error('Failed to fetch trending plans:', err);
                } finally {
                    setIsTrendingLoading(false);
                }
            }
        };
        fetchTrending();
    }, [user, plans.length, globalTrendingPlans.length]);

    const handleForceReload = async () => {
        setIsLoading(true);
        try {
            const baseUrl = import.meta.env.VITE_SUPABASE_URL;
            const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
            const response = await fetch(`${baseUrl}/rest/v1/plans?user_id=eq.${user?.id}&select=*`, {
                headers: { 'apikey': anonKey, 'Authorization': `Bearer ${anonKey}` }
            });
            const data = await response.json();
            const userPlans = data || [];
            setPlans(userPlans.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
            alert(`Found ${data?.length} total plans. ${userPlans.length} for you.`);
        } catch (err) {
            alert('Reload failed: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!user) return; // Wait for user to be loaded before syncing payment
        
        const queryParams = new URLSearchParams(window.location.search);
        const stripePayment = queryParams.get('stripe_payment');

        if (stripePayment === 'success') {
            // Persist to database AND local state
            syncPremiumWithDB(true);
            
            // If they bought a daily pass, set 24h expiry (simplified for MVP)
            const twentyFourHours = 24 * 60 * 60 * 1000;
            localStorage.setItem('premiumExpiry', (Date.now() + twentyFourHours).toString()); // Persist local testing flag
            alert('🎉 Payment Successful! You are now a Premium Member.');
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
        } else if (stripePayment === 'canceled') {
            alert('❌ Payment Canceled.');
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, [user]);

    const handleBatchDelete = async () => {
        const count = selectedPlanIds.length;
        if (count === 0) return;

        const isFromTrash = settingsTab === 'trash' && showSettingsModal;
        const mode = isFromTrash ? 'delete' : 'trash';
        
        setConfirmModal({ 
            isOpen: true, 
            plan: { count, id: selectedPlanIds.join(',') }, 
            type: mode, 
            isBatch: true 
        });
    };

    const performDelete = async () => {
        const { plan, type, isBatch } = confirmModal;
        if (!plan) return;

        try {
            if (isBatch) {
                const ids = plan.id.split(',');
                if (type === 'trash') {
                    const now = new Date().toISOString();
                     const response = await fetch('/api/update-plan', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            planId: plan.id, 
                            isBatch: true,
                            updateData: { deleted_at: now } 
                        })
                    });
                    if (!response.ok) throw new Error('Proxy batch trash failed');
                    setPlans(plans.map(p => ids.includes(p.id) ? { ...p, deleted_at: now } : p));
                } else {
                    const response = await fetch('/api/delete-plan', {
                        method: 'POST', 
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ planId: plan.id, isBatch: true })
                    });
                    if (!response.ok) throw new Error('Proxy delete failed');
                    setPlans(plans.filter(p => !ids.includes(p.id)));
                }
                setSelectedPlanIds([]);
                setIsSelectMode(false);
            } else if (type === 'favorite') {
                const newStatus = !plan.is_favorite;
                try {
                    const response = await fetch('/api/update-plan', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            planId: plan.id,
                            updateData: { is_favorite: newStatus }
                        })
                    });
                    if (!response.ok) throw new Error('Proxy favorite update failed');
                    
                    setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, is_favorite: newStatus } : p));
                    if (selectedPlan?.id === plan.id) {
                        setSelectedPlan(prev => ({ ...prev, is_favorite: newStatus }));
                    }
                    setFeedbackMessage(newStatus ? 'Plan moved to Favorites! 💖' : 'Plan removed from Favorites.');
                    setTimeout(() => setFeedbackMessage(''), 3000);
                } catch (err) {
                    console.error('Error toggling favorite:', err.message);
                    alert(`Failed to update favorite status: ${err.message}`);
                }
            } else {
                // Single plan trash/delete
                if (type === 'trash') {
                    const now = new Date().toISOString();
                    const response = await fetch('/api/update-plan', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            planId: plan.id, 
                            updateData: { deleted_at: now } 
                        })
                    });
                    if (!response.ok) throw new Error('Proxy trash failed');
                    setPlans(plans.map(p => p.id === plan.id ? { ...p, deleted_at: now } : p));
                } else {
                    const response = await fetch('/api/delete-plan', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ planId: plan.id, isBatch: false })
                    });
                    if (!response.ok) throw new Error('Proxy delete failed');
                    setPlans(plans.filter(p => p.id !== plan.id));
                }
            }
            setConfirmModal({ isOpen: false, plan: null, type: 'trash', isBatch: false });
        } catch (err) {
            console.error('Operation execution error:', err.message);
            alert(`Operation failed: ${err.message}`);
        }
    };

    const handleDelete = async (planId, e) => {
        if (e && e.stopPropagation) e.stopPropagation();
        
        const planObj = typeof planId === 'string' ? plans.find(p => p.id === planId) : planId;
        if (!planObj) return;

        const isFromTrash = (settingsTab === 'trash' && showSettingsModal) || planObj.deleted_at;
        const mode = isFromTrash ? 'delete' : 'trash';
        
        setConfirmModal({ isOpen: true, plan: planObj, type: mode, isBatch: false });
    };

    const handleRestorePlan = async (planId, e) => {
        e.stopPropagation();
        try {
            const response = await fetch('/api/update-plan', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    planId: planId, 
                    updateData: { deleted_at: null } 
                })
            });
            if (!response.ok) throw new Error('Proxy restore failed');
            setPlans(plans.map(p => p.id === planId ? { ...p, deleted_at: null } : p));
            alert('Plan restored to your dashboard!');
        } catch (err) {
            console.error('Error restoring plan:', err.message);
            alert(`Restore failed: ${err.message}`);
        }
    };

    const handleForkPlan = async (originalPlan) => {
        if (!originalPlan) return;
        setIsLoading(true);
        try {
            // Clone the plan but reset stats/reviews
            const { data: { user } } = await supabase.auth.getUser();
            const newPlan = {
                user_id: user.id,
                vibe: originalPlan.vibe,
                location: originalPlan.location,
                itinerary: originalPlan.itinerary,
                is_favorite: false,
                avg_rating: 0,
                total_tries: 0,
                reviews: [],
                vibe_tags: []
            };

            const { data, error } = await supabase
                .from('plans')
                .insert([newPlan])
                .select();

            if (error) throw error;

            setPlans(prev => [data[0], ...prev]);
            setSelectedPlan(null);
            setFeedbackMessage('Plan cloned! You can now customize it.');
            setTimeout(() => setFeedbackMessage(''), 3000);
        } catch (err) {
            console.error('Error forking plan:', err);
            setDebugError('Failed to clone plan: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleFavorite = async (plan, e) => {
        if (e && e.stopPropagation) e.stopPropagation();

        // --- FREEMIUM FAVORITE LIMIT LOGIC ---
        if (!plan.is_favorite && !isPremium) {
            const currentFavoritesCount = plans.filter(p => p.is_favorite).length;
            if (currentFavoritesCount >= 4) {
                setShowUpgradeModal(true);
                return; // Block saving
            }
        }

        const newStatus = !plan.is_favorite;

        // --- NEW: CONFIRMATION PROMPT FOR MIGRATION ---
        if (newStatus && activeTab === 'all') {
            setConfirmModal({
                isOpen: true,
                plan,
                type: 'favorite',
                isBatch: false
            });
            return;
        }

        try {
            const response = await fetch('/api/update-plan', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    planId: plan.id, 
                    updateData: { is_favorite: newStatus } 
                })
            });
            if (!response.ok) throw new Error('Proxy favorite update failed');
            setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, is_favorite: newStatus } : p));
            if (selectedPlan?.id === plan.id) {
                setSelectedPlan(prev => ({ ...prev, is_favorite: newStatus }));
            }
        } catch (err) {
            console.error('Error toggling favorite:', err.message);
            alert(`Failed to update favorite status: ${err.message}`);
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

    const handleShare = async (planToShare = selectedPlan) => {
        if (!planToShare) return;

        const domain = window.location.origin;
        const shareLink = `${domain}/shared/${planToShare.id}`;

        const steps = Array.isArray(planToShare.itinerary) ? planToShare.itinerary : planToShare.itinerary?.steps || [];
        const formattedStops = steps.map((step, index) => `${index + 1}. ${step.time} - ${step.venue}`).join('\n');

        const text = `✨ Our custom ${planToShare.vibe} date plan carefully crafted by DateSpark!\n\nTimeline:\n${formattedStops}\n\nCheck out the full interactive map here:`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${planToShare.vibe} Date Plan`,
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

    const handleSubmitFeedback = async () => {
        if (!feedbackMessage.trim()) return;
        setIsSubmittingFeedback(true);
        
        try {
            const response = await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user?.id,
                    email: user?.email,
                    text: feedbackMessage.trim()
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || response.statusText);
            }

            alert('Thank you for your feedback! 🚀 (Message sent to admin)');
            setFeedbackMessage('');
            setShowIdeaModal(false);
        } catch (err) {
            console.error('Feedback Submission Error:', err);
            alert(`Submission failed: ${err.message}`);
        } finally {
            setIsSubmittingFeedback(false);
        }
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Ensure file is an image
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file.');
            return;
        }
        
        // Robust 1MB limit check (Base64 grows by ~33%)
        if (file.size > 1024 * 1024) {
            alert('Image is too large. Please select a photo under 1MB for your profile.');
            return;
        }

        setIsUploading(true);
        const reader = new FileReader();
        reader.onloadend = async () => {
            try {
                const base64String = reader.result;
                const { error } = await supabase.auth.updateUser({
                    data: { avatar_url: base64String }
                });

                if (!error) {
                    const { data: { user: updatedUser } } = await supabase.auth.getUser();
                    setUser(updatedUser);
                    // Force re-fetch user state locally to sync header avatar
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session?.user) setUser(session.user);
                } else {
                    console.error('Avatar Update Error:', error);
                    alert('Failed to update profile picture: ' + error.message);
                }
            } catch (err) {
                console.error('File Read Error:', err);
                alert('Error processing image. Please try another one.');
            } finally {
                setIsUploading(false);
            }
        };
        reader.onerror = () => {
            alert('Error reading file. Please try again.');
            setIsUploading(false);
        };
        reader.readAsDataURL(file);
    };

    const handleDeleteAvatar = async () => {
        if (!window.confirm('Are you sure you want to remove your profile picture?')) return;

        const { error } = await supabase.auth.updateUser({
            data: { avatar_url: null }
        });

        if (!error) {
            const { data: { user: updatedUser } } = await supabase.auth.getUser();
            setUser(updatedUser);
        } else {
            alert('Failed to remove profile picture.');
        }
    };

    useEffect(() => {
        if (user) {
            setProfileData({
                first_name: user.user_metadata?.first_name || '',
                last_name: user.user_metadata?.last_name || '',
                email: user.email || '',
                weekend_spark_enabled: user.user_metadata?.weekend_spark_enabled !== false // Default true
            });
        }
    }, [user]);

    const handleUpdateProfile = async () => {
        setIsSavingProfile(true);
        try {
            const { error } = await supabase.auth.updateUser({
                email: profileData.email !== user.email ? profileData.email : undefined,
                data: {
                    first_name: profileData.first_name,
                    last_name: profileData.last_name,
                    weekend_spark_enabled: profileData.weekend_spark_enabled
                }
            });

            if (error) throw error;

            const { data: { user: updatedUser } } = await supabase.auth.getUser();
            setUser(updatedUser);
            alert('Profile updated successfully!');
        } catch (err) {
            alert(`Error updating profile: ${err.message}`);
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleShareApp = async () => {
        const domain = window.location.origin;
        const shareData = {
            title: 'DateSpark - AI Powered Date Planning',
            text: 'I just found this amazing app that plans perfect dates for couples! Check out DateSpark:',
            url: domain
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                if (err.name !== 'AbortError') console.error('Share failed:', err);
            }
        } else {
            try {
                await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
                alert('App link copied to clipboard! Share it with your friends.');
            } catch (err) {
                alert('Failed to copy link.');
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

    const handleSwitchUp = async (idx, step) => {
        if (!isPremium && usage.swap >= limits.swap) {
            setLimitType('swap');
            setShowUpgradeModal(true);
            return;
        }

        setActiveSwitchIndex(idx);
        setIsSwitchingUp(true);
        setAlternatives([]);

        try {
            // Priority 1: Use coordinates stored in the step (most accurate for that venue)
            // Priority 2: Try browser geolocation (current user position)
            // Priority 3: Fallback to NYC center if all else fails
            let lat = Number(step.lat);
            let lng = Number(step.lng);

            if (navigator.geolocation) {
                try {
                    const pos = await new Promise((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
                    });
                    if (pos) {
                        lat = pos.coords.latitude;
                        lng = pos.coords.longitude;
                        console.log('Using browser geolocation for swap:', { lat, lng });
                    }
                } catch (geoErr) {
                    console.warn('Geolocation failed or timed out, sticking with step coordinates:', geoErr.message);
                }
            }

            // Final safety net: If still no valid coords, default to NYC
            if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
                lat = 40.7128;
                lng = -74.0060;
                console.warn('Coordinates missing from step and geo, defaulting to NYC:', { lat, lng });
            }

            // Improve search query: 
            // If activity is generic (e.g. "Stop 1"), use the venue name or a generic "interesting place"
            let searchQuery = step.activity;
            if (searchQuery.toLowerCase().includes('stop ') || searchQuery.length < 3) {
                // Try to infer a better query from the venue or description
                if (step.venue && !step.venue.toLowerCase().includes('venue')) {
                    searchQuery = `${step.venue} vibes`;
                } else {
                    searchQuery = 'trending spots';
                }
            } else if (searchQuery.toLowerCase().includes('dinner') || searchQuery.toLowerCase().includes('restaurant')) {
                searchQuery = 'highly rated restaurants';
            } else if (searchQuery.toLowerCase().includes('dessert') || searchQuery.toLowerCase().includes('treat')) {
                searchQuery = 'famous dessert spots';
            } else if (searchQuery.toLowerCase().includes('entertainment') || searchQuery.toLowerCase().includes('activity')) {
                searchQuery = 'fun interactive experiences';
            }

            const response = await axios.post('/api/nearby-alternatives', {
                lat,
                lng,
                type: searchQuery,
                radius: 5000, 
                budget: selectedPlan?.budget || 'moderate',
                currentPlaceId: step.placeId || step.id,
                userId: user?.id
            });

            setAlternatives(response.data.alternatives || []);
        } catch (err) {
            console.error('Error fetching alternatives:', err);
            alert('Failed to find nearby alternatives. Please try again.');
        } finally {
            setIsSwitchingUp(false);
        }
    };

    const confirmSwitch = async (alt) => {
        if (!activeSwitchIndex && activeSwitchIndex !== 0) return;

        try {
            const currentPlan = plans.find(p => p.id === selectedPlan.id);
            if (!currentPlan) return;

            const isArrayItinerary = Array.isArray(currentPlan.itinerary);
            const steps = isArrayItinerary ? [...currentPlan.itinerary] : [...currentPlan.itinerary.steps];
            const originalStep = steps[activeSwitchIndex];

            // Create the new step object by merging original metadata (time) with new venue data
            const newStep = {
                ...originalStep,
                venue: alt.name || 'New Venue',
                address: alt.address || originalStep.address,
                rating: alt.rating || originalStep.rating,
                description: alt.description || 'No description available.',
                photoUrl: alt.photo || 'https://images.unsplash.com/photo-1496806342719-f997480fe5ad?w=800&q=80',
                lat: alt.location?.latitude || originalStep.lat,
                lng: alt.location?.longitude || originalStep.lng,
                searchUrl: alt.searchUrl || `https://www.google.com/search?q=${encodeURIComponent(alt.name || 'New Venue')}`,
                placeId: alt.id || originalStep.placeId
            };

            steps[activeSwitchIndex] = newStep;

            const updatedItinerary = isArrayItinerary ? steps : { ...currentPlan.itinerary, steps };

            try {
                // Use the server-side proxy to bypass frontend JWT/RLS issues
                const response = await fetch('/api/update-plan', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        planId: selectedPlan.id, 
                        updateData: { itinerary: updatedItinerary } 
                    })
                });

                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.error || `Proxy error: ${response.status}`);
                }
            } catch (err) {
                console.error('Switch Up Proxy Error:', err);
                throw new Error(`Proxy Update Failed: ${err.message}`);
            }

            // Update local state
            setPlans(prev => prev.map(p => p.id === selectedPlan.id ? { ...p, itinerary: updatedItinerary } : p));
            setSelectedPlan(prev => ({ ...prev, itinerary: updatedItinerary }));

            setActiveSwitchIndex(null);
            setAlternatives([]);

            // Increment locally for instant UI feedback
            if (!isPremium) {
                setUsage(prev => ({ ...prev, swap: prev.swap + 1 }));
            }

        } catch (error) {
            console.error('Error confirming switch:', error);
            if (error.response?.status === 403 || error.message.toLowerCase().includes('limit')) {
                setLimitType('swap');
                setShowUpgradeModal(true);
            } else {
                alert(`Failed to update the plan: ${error.message}. Please try again.`);
            }
        }
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

    // Calculate Local Trending Plans 
    const localTrendingPlans = [...plans]
        .filter(p => !p.deleted_at && p.total_tries > 0)
        .sort((a, b) => {
            const scoreA = ((a.avg_rating || 0) * 0.7) + (Math.log10((a.total_tries || 0) + 1) * 0.3);
            const scoreB = ((b.avg_rating || 0) * 0.7) + (Math.log10((b.total_tries || 0) + 1) * 0.3);
            return scoreB - scoreA;
        })
        .slice(0, 3);

    const renderPlanCard = (plan, planIdx, enforceLocked = false, isCompact = false) => {
        const isLockedPlan = enforceLocked || (!isPremium && activeTab === 'all' && planIdx >= 2);
        const isPartiallyLocked = !isPremium && activeTab === 'all' && planIdx === 1;

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
                {/* Selection Checkbox */}
                {isSelectMode && (
                    <div 
                        className="absolute top-4 left-4 z-40"
                        onClick={(e) => {
                            e.stopPropagation();
                            const isSelected = selectedPlanIds.includes(plan.id);
                            if (isSelected) {
                                setSelectedPlanIds(prev => prev.filter(id => id !== plan.id));
                            } else {
                                setSelectedPlanIds(prev => [...prev, plan.id]);
                            }
                        }}
                    >
                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${selectedPlanIds.includes(plan.id) ? 'bg-coral border-coral text-white' : 'bg-white/80 border-gray-200'}`}>
                            {selectedPlanIds.includes(plan.id) && <Check className="w-4 h-4" />}
                        </div>
                    </div>
                )}
                
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
                
                {/* Popular Vibe Tag Badge */}
                {!isLockedPlan && getPopularTag(plan.vibe_tags) && (
                    <div className="absolute top-4 left-4 z-30 animate-in fade-in zoom-in duration-500">
                        <div className="px-2.5 py-1 bg-white/90 backdrop-blur-md border border-coral/20 rounded-full shadow-sm flex items-center gap-1.5 ring-1 ring-coral/5">
                            <span className="text-xs">{getPopularTag(plan.vibe_tags).icon}</span>
                            <span className="text-[10px] font-black text-coral uppercase tracking-tighter">{getPopularTag(plan.vibe_tags).label}</span>
                        </div>
                    </div>
                )}

                <div className="absolute top-4 right-4 flex gap-2 z-30">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleShare(plan);
                        }}
                        className="p-2 text-gray-500 hover:text-coral transition-colors bg-white/90 backdrop-blur-sm rounded-full shadow-sm border border-gray-100"
                        title="Share Plan"
                    >
                        <Share2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={(e) => handleToggleFavorite(plan, e)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors bg-white/90 backdrop-blur-sm rounded-full shadow-sm border border-gray-100"
                        title={plan.is_favorite ? "Remove from Favorites" : "Mark as Favorite"}
                    >
                        <Heart className={`w-4 h-4 ${plan.is_favorite ? 'fill-red-500 text-red-500' : ''}`} />
                    </button>
                    <button
                        onClick={(e) => handleDelete(plan.id, e)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors bg-white/90 backdrop-blur-sm rounded-full shadow-sm border border-gray-100"
                        title="Delete Plan"
                    >
                        <Trash2 className="w-4 h-4" />
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

                {/* Social Analytics Row */}
                <div className="flex items-center justify-between pt-4 mt-2 border-t border-gray-100 mb-4">
                    <div className="flex items-center gap-1.5 px-2 py-1 -ml-2 rounded-lg transition-colors">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-black text-navy">{plan.avg_rating ? parseFloat(plan.avg_rating).toFixed(1) : 'New'}</span>
                        <span className="text-xs font-medium text-gray-400">({plan.total_tries || 0} tries)</span>
                    </div>
                    <button
                         onClick={(e) => {
                             e.stopPropagation();
                             if (isLockedPlan) {
                                setShowUpgradeModal(true);
                             } else {
                                setRatingPlan(plan);
                             }
                         }}
                         className="flex items-center gap-1.5 px-3 py-1.5 bg-coral/10 hover:bg-coral/20 text-coral rounded-lg text-xs font-bold transition-colors"
                    >
                        <Heart className="w-3.5 h-3.5" /> Tried it
                    </button>
                </div>
                
                <button
                    onClick={(e) => {
                        if (isLockedPlan) {
                            e.stopPropagation();
                            setShowUpgradeModal(true);
                        } else {
                            setSelectedPlan({ ...plan, isPartiallyLocked });
                        }
                    }}
                    className={`w-full py-2.5 font-bold rounded-xl border transition-colors ${isLockedPlan ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-gray-50 text-navy border-gray-100 group-hover:bg-coral group-hover:text-white group-hover:border-coral'
                        }`}
                >
                    {isLockedPlan ? 'Unlock Plan' : (isPartiallyLocked ? 'Preview Plan' : 'View Full Plan')}
                </button>
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-12 h-12 text-coral animate-spin" />
                <div className="flex flex-col items-center gap-1">
                    <p className="text-navy font-bold">Sparking your dashboard...</p>
                    <button 
                        onClick={() => window.location.reload()} 
                        className="text-xs text-coral font-black hover:underline mt-2 p-2"
                    >
                        Taking too long? Tap to Refresh
                    </button>
                </div>
            </div>
        );
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
                    {/* Mock Toggle - ADMIN ONLY (rayanerold@gmail.com) */}
                    {user?.email === 'rayanerold@gmail.com' && (
                        <div className="hidden md:flex items-center gap-2 bg-rose-50/50 px-3 py-1.5 rounded-lg border border-rose-100 mr-2">
                            <span className={`text-xs font-bold ${!isPremium ? 'text-coral' : 'text-gray-400'}`}>Free</span>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const newVal = !isPremium;
                                    console.log('[ ADMIN ] Premium Toggle Triggered:', newVal);
                                    setIsPremium(newVal);
                                    localStorage.setItem('isPremium', newVal.toString());
                                    syncPremiumWithDB(newVal);
                                }}
                                style={{ cursor: 'pointer', pointerEvents: 'auto', zIndex: 9999, position: 'relative' }}
                                className={`w-12 h-6 rounded-full transition-all duration-200 relative flex items-center shadow-inner ${isPremium ? 'bg-navy' : 'bg-gray-300'}`}
                                title="Admin: Toggle Premium Status"
                            >
                                <div className={`w-4 h-4 rounded-full bg-white shadow-md absolute transition-all duration-200 ${isPremium ? 'left-7' : 'left-1'}`} />
                            </button>
                            <span className={`text-xs font-bold ${isPremium ? 'text-navy' : 'text-gray-400'}`}>Pro</span>
                        </div>
                    )}

                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-2 hover:bg-gray-50 p-1.5 rounded-xl transition-colors outline-none"
                    >
                        {user?.user_metadata?.avatar_url ? (
                            <img
                                src={user.user_metadata.avatar_url}
                                alt="Profile"
                                className="w-9 h-9 rounded-lg object-cover shadow-sm border border-gray-100"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.user_metadata?.first_name || 'Kade. D')}&background=0a192f&color=fff`;
                                }}
                            />
                        ) : (
                            <div className="w-9 h-9 bg-navy text-white rounded-lg flex items-center justify-center font-bold shadow-sm">
                                {user?.user_metadata?.first_name?.[0] || 'K'}
                            </div>
                        )}
                        <span className="text-sm font-bold text-navy hidden sm:block">
                            {user?.user_metadata?.first_name || 'Kade. D'}
                        </span>
                        {isDateMaster && (
                            <div className="bg-coral/10 p-1 rounded-md" title="Date Master Status">
                                <Sparkles className="w-3.5 h-3.5 text-coral fill-coral/20" />
                            </div>
                        )}
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

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-32">

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-navy">Your Date Plans</h1>
                    <p className="text-gray-500 mt-1">Manage and view your generated itineraries.</p>
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                    <Link
                        to="/generate"
                        className="btn-primary py-3 px-6 rounded-xl flex items-center justify-center gap-2 font-bold shadow-lg shadow-coral/20 hover:-translate-y-0.5 transition-all"
                    >
                        <Plus className="w-5 h-5" /> New Plan
                    </Link>

                    {/* NEW: Repositioned Discover Button next to New Plan (Primary Action) */}
                    <button
                        onClick={() => setShowDiscovery(true)}
                        className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-3 px-6 rounded-xl flex items-center justify-center gap-2 font-black shadow-lg shadow-indigo-500/20 hover:-translate-y-0.5 transition-all group relative overflow-hidden"
                        title="Discovery Mode"
                    >
                        <Sparkles className="w-5 h-5 animate-pulse group-hover:scale-110 transition-transform" />
                        <span className="tracking-tight">Discover Dates</span>
                        
                        {/* Noticeable Pop Badge */}
                        <span className="absolute -top-1 -right-1 flex h-4 w-4">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-white text-[8px] font-bold text-indigo-600 items-center justify-center shadow-sm">NEW</span>
                        </span>
                    </button>
                </div>
            </div>

            {/* NEW: Referral Loop Section (Ultra-Compact) */}
            <div className="mb-6 bg-gradient-to-br from-navy to-navy/90 rounded-2xl p-4 relative overflow-hidden shadow-lg border border-navy-100/10 group">
                {/* Ambient logic decoration */}
                <div className="absolute -right-8 -top-8 w-24 h-24 bg-coral/15 rounded-full blur-2xl animate-pulse" />
                
                <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-coral to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-coral/20 flex-shrink-0 group-hover:scale-105 transition-transform">
                        <Gift className="w-6 h-6 text-white" />
                    </div>
                    
                    <div className="flex-1 text-center sm:text-left">
                        <h2 className="text-lg font-black text-white tracking-tight">Give 30 Days, Get 30 Days 💖</h2>
                        <p className="text-white/60 text-[11px] font-medium leading-relaxed max-w-sm">
                            Invite 3 friends to join and unlock a **Full Month of Plus** for free!
                        </p>
                        
                        {/* Progress Bar (Ultra-Compact) */}
                        <div className="mt-3 max-w-[200px] mx-auto sm:mx-0">
                            <div className="flex justify-between text-[9px] font-black text-white/30 mb-1 uppercase tracking-widest">
                                <span>{referralDetails.count} / 3 friends</span>
                            </div>
                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-gradient-to-r from-coral to-pink-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_6px_rgba(255,107,107,0.3)]"
                                    style={{ width: `${Math.min((referralDetails.count / 3) * 100, 100)}%` }}
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex-shrink-0 w-full sm:w-auto">
                        <div className="bg-white/5 backdrop-blur-md rounded-xl p-2.5 border border-white/10">
                            <div className="flex items-center gap-3 bg-navy/40 px-3 py-1.5 rounded-lg border border-white/5">
                                <span className="font-mono font-black text-base text-coral tracking-wider">{referralDetails.code || 'SPARK-REF'}</span>
                                <button 
                                    onClick={() => {
                                        const link = `${window.location.origin}/signup?ref=${referralDetails.code}`;
                                        navigator.clipboard.writeText(link);
                                        setCopied(true);
                                        setTimeout(() => setCopied(false), 2000);
                                    }}
                                    className="p-1 hover:bg-white/10 rounded-md transition-colors text-white/40 hover:text-white"
                                    title="Copy Link"
                                >
                                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            {plans.length > 0 && (
                <div className="flex bg-gray-200/50 p-1.5 rounded-2xl mb-8 border border-gray-100 max-w-sm">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${activeTab === 'all' ? 'bg-white text-navy shadow-sm' : 'text-gray-500 hover:text-navy'}`}
                    >
                        <Layout className="w-4 h-4" /> All
                    </button>
                    <button
                        onClick={() => setActiveTab('favorites')}
                        className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${activeTab === 'favorites' ? 'bg-white text-coral shadow-sm' : 'text-gray-500 hover:text-navy'}`}
                    >
                        <Heart className={`w-4 h-4 ${activeTab === 'favorites' ? 'fill-coral text-coral' : ''}`} /> Favorites
                    </button>

                    {/* Tab Navigation cleaned up (Discover moved to primary actions) */}

                    <div className="w-px h-6 bg-gray-200 mx-1 self-center" />
                    <button
                        onClick={() => {
                            setIsSelectMode(!isSelectMode);
                            setSelectedPlanIds([]);
                        }}
                        className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${isSelectMode ? 'bg-navy text-white shadow-sm' : 'text-gray-500 hover:text-navy'}`}
                    >
                        <Check className="w-4 h-4" /> {isSelectMode ? 'Cancel' : 'Select'}
                    </button>
                </div>
            )}

            {/* OUR VISION BANNER */}
            {showVisionBanner && (
                <div className="bg-gradient-to-r from-violet-500/10 via-coral/5 to-white rounded-3xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between border border-gray-100 shadow-sm animate-in fade-in duration-500 relative group">
                    {/* Close Button */}
                    <button 
                        onClick={() => {
                            setShowVisionBanner(false);
                            localStorage.setItem('hideVisionBanner', 'true');
                        }}
                        className="absolute top-4 right-4 p-2 text-gray-400 hover:text-navy hover:bg-gray-100 rounded-full transition-all opacity-0 group-hover:opacity-100"
                        title="Dismiss Banner"
                    >
                        <X className="w-4 h-4" />
                    </button>

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
                <div className="flex flex-col items-end gap-1">
                    <div className="flex flex-col sm:flex-row gap-2 mt-4 md:mt-0">
                        <button
                            onClick={() => setShowIdeaModal(true)}
                            className="px-5 py-2.5 bg-coral text-white text-xs font-bold rounded-xl hover:bg-coral/90 transition-all shadow-sm shadow-coral/20 flex items-center justify-center gap-2"
                        >
                            Have an Idea? 💡
                        </button>
                        <button
                            onClick={() => setShowVisionModal(true)}
                            className="px-5 py-2.5 bg-navy text-white text-xs font-bold rounded-xl hover:bg-navy/90 transition-all shadow-sm outline outline-1 outline-white/10"
                        >
                            Read Our Story
                        </button>
                    </div>
                    </div>
                </div>
            )}

            {plans.length === 0 ? (
                <>
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

                    {/* NEW: Trending Discovery for New Users */}
                    {globalTrendingPlans.length > 0 && (
                        <div className="mt-16 mb-24 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
                            <div className="flex items-center justify-between mb-8 px-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-coral/10 rounded-2xl flex items-center justify-center text-coral shadow-inner">
                                        <Compass className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-navy tracking-tight">Explore Community Favorites</h3>
                                        <p className="text-gray-500 text-sm font-medium">Hand-picked itineraries loved by the DateSpark community.</p>
                                    </div>
                                </div>
                                <Sparkles className="w-6 h-6 text-coral animate-pulse" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {globalTrendingPlans.slice(0, 6).map((plan, idx) => renderPlanCard(plan, idx, false, true))}
                            </div>
                        </div>
                    )}
                </>
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
            ) : activeTab === 'favorites' ? (
                <div className="animate-in fade-in duration-300">
                    <h3 className="text-xl font-black text-navy mb-6 flex items-center gap-2">
                        Favorite Plans
                        <span className="bg-coral/10 text-coral text-[10px] px-2 py-1 rounded-full">
                            {plans.filter(p => p.is_favorite && !p.deleted_at).length}
                        </span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {plans.filter(p => p.is_favorite && !p.deleted_at).map((plan, planIdx) => renderPlanCard(plan, planIdx, false))}
                    </div>
                </div>
            ) : activeTab === 'all' ? (
                <div className="animate-in fade-in duration-300">
                    <h3 className="text-xl font-black text-navy mb-6 flex items-center gap-2">
                        Your Date Plans
                        <span className="bg-gray-100 text-gray-400 text-[10px] px-2 py-1 rounded-full">{plans.filter(p => !p.deleted_at && !p.is_favorite).length}</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {plans.filter(p => !p.deleted_at && !p.is_favorite).map((plan, planIdx) => renderPlanCard(plan, planIdx, false))}
                    </div>
                </div>
            ) : null}

            {/* Discovery Button (Noticeable FAB) */}
            <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 1, type: "spring" }}
                className="fixed bottom-24 right-6 z-40"
            >
                <motion.button
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    animate={{ 
                        boxShadow: ["0px 0px 0px rgba(124, 58, 237, 0)", "0px 0px 25px rgba(255, 107, 107, 0.6)", "0px 0px 0px rgba(124, 58, 237, 0)"],
                        y: [0, -4, 0]
                    }}
                    transition={{ 
                        boxShadow: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
                        y: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                    }}
                    onClick={() => setShowDiscovery(true)}
                    className="w-14 h-14 bg-gradient-to-br from-coral to-pink-500 text-white rounded-full shadow-2xl flex items-center justify-center border-2 border-white/20 relative group"
                    title="Discovery Mode"
                >
                    <Sparkles className="w-7 h-7 animate-pulse" />
                    
                    {/* Pop notification badge */}
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-white text-[8px] font-black text-coral items-center justify-center">NEW</span>
                    </span>

                    {/* Tooltip on hover */}
                    <div className="absolute right-full mr-4 bg-navy px-3 py-1.5 rounded-lg text-[10px] font-black text-white whitespace-nowrap hidden md:group-hover:block animate-in fade-in slide-in-from-right-2">
                        DISCOVER TRENDING DATES 💖
                    </div>
                </motion.button>
            </motion.div>

            {/* Discovery Mode (Dating App Swipe Interface) */}
            <AnimatePresence>
                {showDiscovery && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`fixed inset-0 z-[100] backdrop-blur-xl flex flex-col p-6 overflow-hidden transition-colors duration-500 ${
                            appTheme === 'dark' ? 'bg-navy/95' : 
                            appTheme === 'sunset' ? 'bg-[#ff6b6b]/10 contrast-125' : 
                            'bg-gray-50/95'
                        }`}
                    >
                        <div className="flex justify-between items-center mb-8">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${appTheme === 'dark' ? 'bg-white/10' : 'bg-navy/5'}`}>
                                    <Sparkles className={`w-6 h-6 ${appTheme === 'dark' ? 'text-white' : 'text-coral'}`} />
                                </div>
                                <div>
                                    <h2 className={`text-xl font-black leading-tight ${appTheme === 'dark' ? 'text-white' : 'text-navy'}`}>Discovery Mode</h2>
                                    <p className={`text-[10px] font-bold uppercase tracking-widest ${appTheme === 'dark' ? 'text-white/40' : 'text-gray-400'}`}>Swipe right to save</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowDiscovery(false)}
                                className={`p-3 rounded-full transition-colors ${appTheme === 'dark' ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-navy/5 hover:bg-navy/10 text-navy'}`}
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex-1 relative flex items-center justify-center perspective-[2000px] w-full px-4">
                            {globalTrendingPlans.length > 0 ? (
                                <div className="relative w-full max-w-[520px] h-full max-h-[70vh] md:max-h-[75vh] lg:max-h-[80vh]">
                                    {globalTrendingPlans.slice(swipeIndex, swipeIndex + 3).reverse().map((plan, i) => {
                                        const isTop = i === 2 || (globalTrendingPlans.length - swipeIndex < 3 && i === (globalTrendingPlans.length - swipeIndex - 1));
                                        return (
                                            <motion.div
                                                key={plan.id}
                                                initial={isTop ? { scale: 0.8, y: 20, opacity: 0 } : {}}
                                                animate={isTop ? { scale: 1, y: 0, opacity: 1 } : {}}
                                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                                className="absolute inset-0"
                                            >
                                                <SwipeCard 
                                                    plan={plan}
                                                    isTop={isTop}
                                                    theme={appTheme}
                                                onSwipe={(dir) => {
                                                    if (dir === 'right') handleToggleFavorite(plan);
                                                    setSwipeIndex(prev => prev + 1);
                                                }}
                                                onView={() => {
                                                    setSelectedPlan(plan);
                                                    setShowDiscovery(false);
                                                }}
                                            />
                                            </motion.div>
                                        );
                                    })}
                                    
                                    {swipeIndex >= globalTrendingPlans.length && (
                                        <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-white/5 rounded-[2.5rem] border-2 border-dashed border-white/10">
                                            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-4">
                                                <History className="w-10 h-10 text-white/20" />
                                            </div>
                                            <h3 className="text-xl font-black text-white">No more plans!</h3>
                                            <p className="text-white/40 text-sm mt-1">Check back later for more community inspiration.</p>
                                            <button 
                                                onClick={() => setSwipeIndex(0)}
                                                className="mt-6 px-6 py-3 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-all"
                                            >
                                                Start Over
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <Loader2 className="w-12 h-12 text-white animate-spin" />
                            )}
                        </div>

                        <div className="flex justify-center gap-10 mt-12 mb-8">
                            <button 
                                onClick={() => setSwipeIndex(prev => prev + 1)}
                                disabled={swipeIndex >= globalTrendingPlans.length}
                                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all active:scale-95 border-2 shadow-2xl relative group/btn ${
                                    appTheme === 'dark' ? 'bg-white/5 border-white/10 text-white/40 hover:bg-red-500/20 hover:text-red-500 hover:border-red-500/50 shadow-black/40' : 'bg-white border-gray-200 text-red-500 hover:border-red-500/30 hover:bg-red-50 shadow-gray-200/50'
                                }`}
                                title="Pass (Swipe Left)"
                            >
                                <X className="w-10 h-10 transition-transform group-hover/btn:scale-110 active:scale-90" />
                            </button>
                            <button 
                                onClick={() => {
                                    const currentPlan = globalTrendingPlans[swipeIndex];
                                    if (currentPlan) handleToggleFavorite(currentPlan);
                                    setSwipeIndex(prev => prev + 1);
                                }}
                                disabled={swipeIndex >= globalTrendingPlans.length}
                                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all active:scale-95 border-2 shadow-2xl relative group/btn ${
                                    appTheme === 'dark' ? 'bg-white/5 border-white/10 text-white/40 hover:bg-green-500/20 hover:text-green-500 hover:border-green-500/50 shadow-black/40' : 'bg-white border-gray-200 text-coral hover:border-coral/30 hover:bg-coral/5 shadow-gray-200/50'
                                }`}
                                title="Like (Swipe Right)"
                            >
                                <Heart className={`w-10 h-10 transition-all duration-300 group-hover/btn:scale-110 active:scale-90 ${globalTrendingPlans[swipeIndex]?.is_favorite ? 'fill-coral text-coral' : ''}`} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Batch Action Bar */}
            {selectedPlanIds.length > 0 && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] animate-in slide-in-from-bottom-10 duration-500">
                    <div className="bg-navy/95 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-4 shadow-2xl flex items-center gap-6">
                        <div className="flex flex-col">
                            <span className="text-white font-black text-sm">{selectedPlanIds.length} Plans Selected</span>
                            <span className="text-white/50 text-[10px] uppercase tracking-widest font-bold">Batch Actions</span>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <div className="flex gap-3">
                            <button
                                onClick={() => setSelectedPlanIds([])}
                                className="px-4 py-2 bg-white/10 text-white text-xs font-bold rounded-xl hover:bg-white/20 transition-all"
                            >
                                Deselect
                            </button>
                            <button
                                onClick={handleBatchDelete}
                                className="px-4 py-2 bg-coral text-white text-xs font-bold rounded-xl hover:bg-coral/90 shadow-lg shadow-coral/20 transition-all flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" /> {settingsTab === 'trash' ? 'Delete Permanently' : 'Move to Trash'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>

        {/* View Plan Modal (Sleek Timeline UI) */}
        {selectedPlan && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-navy/50 backdrop-blur-sm">
                <div className="bg-[#f8f9fa] rounded-[2rem] shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row relative">
                    {/* Desktop Close Button */}
                    <button
                        onClick={() => {
                            setSelectedPlan(null);
                            setShowMapMobile(false);
                        }}
                        className="absolute top-6 right-6 z-50 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors hidden md:block"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    {/* Left Column: Timeline UI */}
                    <div className={`flex-1 overflow-y-auto bg-transparent md:bg-white flex-col z-10 ${showMapMobile ? 'hidden md:flex' : 'flex'}`}>

                        {/* Extra Compact Header Section */}
                        <div className="bg-[#0f172a]/95 backdrop-blur-xl text-white p-4 border-b border-white/10 sticky top-0 z-20 rounded-b-2xl md:rounded-b-none flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={(e) => handleToggleFavorite(selectedPlan, e)}
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-300 ${selectedPlan.is_favorite ? 'bg-coral/20 border-coral/30' : 'bg-white/10 border-white/10 hover:bg-white/20'}`}
                                    title={selectedPlan.is_favorite ? 'Remove from Favorites' : 'Add to Favorites'}
                                >
                                    <Heart className={`w-5 h-5 transition-all duration-300 ${selectedPlan.is_favorite ? 'fill-coral text-coral scale-110' : 'text-white/70'}`} />
                                </button>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-base font-black font-outfit tracking-tight truncate">{selectedPlan.vibe} Date</h2>
                                        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-white/10 rounded-md border border-white/10">
                                            <History className="w-2.5 h-2.5 text-gray-400" />
                                            <span className="text-[9px] font-black text-white/70">{selectedPlan.total_tries || 0} Tries</span>
                                        </div>
                                    </div>
                                    <p className="text-[9px] text-gray-400 uppercase tracking-widest font-black opacity-70">
                                        {!Array.isArray(selectedPlan.itinerary) && selectedPlan.itinerary?.metadata?.planDate ?
                                            `${new Date(selectedPlan.itinerary.metadata.planDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
                                            : 'Available in New York City'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleForkPlan(selectedPlan)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-all text-[10px] font-black group shadow-lg shadow-violet-500/20"
                                >
                                    <Sparkles className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
                                    <span>Steal & Customize</span>
                                </button>
                                <button
                                    onClick={handleShare}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all text-[10px] font-black group"
                                >
                                    <Share2 className="w-3.5 h-3.5 text-coral group-hover:scale-110 transition-transform" />
                                    <span>Share Plan</span>
                                </button>
                                <button
                                    onClick={() => {
                                        setSelectedPlan(null);
                                        setShowMapMobile(false);
                                    }}
                                    className="p-1.5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg transition-all"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>


                        {/* Spacer for Background Map Visualization on Mobile */}
                        <div className="h-[200px] md:hidden relative flex items-end justify-center pb-2 flex-shrink-0 z-20">
                            {/* Mobile Map Toggle Button */}
                            <button
                                onClick={() => setShowMapMobile(true)}
                                className="bg-navy/95 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-md flex items-center gap-1.5 border border-white/20 transform transition-all active:scale-95 mt-auto"
                            >
                                <MapIcon className="w-3.5 h-3.5" />
                                Expand Map
                            </button>
                        </div>

                        <div className="p-6 sm:p-8 pt-8 bg-white md:bg-white rounded-t-[2.5rem] md:rounded-none shadow-sm md:shadow-none relative mt-[-1rem]">
                            <div className="relative border-l-2 border-dashed border-gray-200 ml-4 space-y-10 pb-8">
                                {(Array.isArray(selectedPlan.itinerary) ? selectedPlan.itinerary : selectedPlan.itinerary?.steps || [])?.map((step, idx) => {
                                    const isLockedStep = !isPremium && selectedPlan.isPartiallyLocked && idx >= 2;

                                    // Assign specific colors for styling dots
                                    const dotColors = ['bg-coral', 'bg-yellow-400', 'bg-navy', 'bg-emerald-500', 'bg-purple-500'];
                                    const textColor = ['text-coral', 'text-yellow-500', 'text-navy', 'text-emerald-600', 'text-purple-600'];
                                    const colorIdx = idx % dotColors.length;
                                    return (
                                        <div
                                            key={idx}
                                            className={`relative ${(!isPremium && (isLockedStep || (selectedPlan.isPartiallyLocked && idx >= 1))) ? 'cursor-pointer group/locked' : ''}`}
                                            onClick={() => {
                                                if (isLockedStep) setShowUpgradeModal(true);
                                            }}
                                        >
                                            {/* Absolute Time on the far left of the Line setup */}
                                            <div className="absolute -left-14 top-2 text-[11px] font-black text-gray-400 text-right w-10">
                                                {step.time}
                                            </div>

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

                                            <div className={`bg-white border border-gray-100 rounded-2xl p-3.5 flex flex-col gap-2.5 shadow-sm transition-all hover:shadow-md ${(!isPremium && (isLockedStep || (selectedPlan.isPartiallyLocked && idx >= 2))) ? 'blur-[6px] select-none opacity-60 pointer-events-none' : ''} ${completedSteps.includes(idx) ? 'opacity-40' : ''}`}>
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

                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-base font-black font-outfit text-navy truncate group-hover:text-coral transition-colors">{step.venue}</h4>
                                                        <p className={`text-[9px] font-black uppercase tracking-wider ${textColor[colorIdx]} ${completedSteps.includes(idx) ? 'line-through' : ''}`}>
                                                            {step.activity}
                                                        </p>
                                                    </div>
                                                    <span className="text-[10px] font-black text-gray-300">{step.time}</span>
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

                                                {/* Action Tags - Reverted Style */}
                                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                                    {step.directionsUrl && (
                                                        <a
                                                            href={step.directionsUrl}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="px-2.5 py-1.5 bg-blue-50 text-blue-600 outline outline-1 outline-blue-200 text-[10px] font-bold rounded-lg hover:bg-blue-600 hover:text-white transition-all inline-flex items-center gap-1 shadow-sm"
                                                        >
                                                            <MapPin className="w-3 h-3" /> Get Directions
                                                        </a>
                                                    )}

                                                    {step.url && (
                                                        <a
                                                            href={step.url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="px-2.5 py-1.5 bg-indigo-50 text-indigo-600 outline outline-1 outline-indigo-200 text-[10px] font-bold rounded-lg hover:bg-indigo-600 hover:text-white transition-all inline-flex items-center gap-1 shadow-sm"
                                                        >
                                                            <Compass className="w-3 h-3" /> Visit Official Website
                                                        </a>
                                                    )}

                                                    {step.bookingUrl && (
                                                        <a
                                                            href={step.bookingUrl}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="px-2.5 py-1.5 bg-green-50 text-green-600 outline outline-1 outline-green-200 text-[10px] font-bold rounded-lg hover:bg-green-600 hover:text-white transition-all inline-flex items-center gap-1 shadow-sm"
                                                        >
                                                            {step.bookingType === 'opentable' ? <Utensils className="w-3 h-3" /> : <Ticket className="w-3 h-3" />}
                                                            {step.bookingType === 'opentable' ? 'Book on OpenTable' : 'Book Tickets'}
                                                        </a>
                                                    )}

                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleSwitchUp(idx, step);
                                                        }}
                                                        className="px-3 py-2 bg-violet-600 text-white text-[10px] font-black rounded-xl hover:bg-violet-700 transition-all inline-flex items-center gap-1.5 shadow-lg shadow-violet-500/20 active:scale-95 group/btn"
                                                    >
                                                        <Sparkles className="w-3 h-3 group-hover/btn:rotate-12 transition-transform" />
                                                        Swap This Spot
                                                    </button>

                                                    <a
                                                        href={`https://www.google.com/search?q=${encodeURIComponent(step.venue + ' ' + (step.address || ''))}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="px-2.5 py-1.5 bg-gray-50 text-gray-600 outline outline-1 outline-gray-200 text-[10px] font-bold rounded-lg hover:bg-gray-800 hover:text-white transition-all inline-flex items-center gap-1 shadow-sm"
                                                    >
                                                        <Search className="w-3 h-3" /> Search on Google
                                                    </a>

                                                    {step.lat && step.lng && (
                                                        <a
                                                            href={`https://m.uber.com/ul/?action=setPickup&client_id=datespark_mvp&dropoff[latitude]=${step.lat}&dropoff[longitude]=${step.lng}&dropoff[nickname]=${encodeURIComponent(step.venue)}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="px-2.5 py-1.5 bg-black text-white text-[10px] font-bold rounded-lg hover:bg-gray-800 transition-colors inline-flex items-center gap-1 shadow-sm"
                                                        >
                                                            <Car className="w-3 h-3" /> Get a Ride
                                                        </a>
                                                    )}
                                                </div>

                                                {/* Alternatives List */}
                                                {activeSwitchIndex === idx && (
                                                    <div className="mt-4 bg-violet-50/50 rounded-2xl p-4 border border-violet-100 animate-in fade-in slide-in-from-top-2 duration-300">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <h5 className="text-[11px] font-black text-violet-600 uppercase tracking-widest flex items-center gap-2">
                                                                <Sparkles className="w-3 h-3" /> Nearby Alternatives
                                                            </h5>
                                                            <button onClick={() => setActiveSwitchIndex(null)} className="text-gray-400 hover:text-gray-600">
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        </div>

                                                        {isSwitchingUp ? (
                                                            <div className="flex flex-col items-center py-4 gap-2">
                                                                <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
                                                                <p className="text-[10px] font-bold text-violet-400">Finding better spots nearby...</p>
                                                            </div>
                                                        ) : alternatives.length > 0 ? (
                                                            <div className="space-y-2">
                                                                {alternatives.map((alt) => (
                                                                    <button
                                                                        key={alt.id}
                                                                        onClick={() => confirmSwitch(alt)}
                                                                        className="w-full bg-white p-3 rounded-xl border border-white hover:border-violet-300 hover:shadow-md transition-all flex items-start gap-3 text-left group/alt"
                                                                    >
                                                                        {alt.photo && (
                                                                            <img src={alt.photo} className="w-16 h-16 rounded-xl object-cover shadow-sm bg-gray-50" alt={alt.name} />
                                                                        )}
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="text-sm font-black text-navy leading-tight group-hover/alt:text-violet-600 transition-colors mb-0.5">{alt.name}</p>
                                                                            <p className="text-[11px] text-gray-500 line-clamp-2 mb-2 leading-relaxed font-medium">
                                                                                {alt.description}
                                                                            </p>
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="text-[11px] font-black text-coral flex items-center gap-0.5">
                                                                                    ★ {alt.rating || 'New'}
                                                                                </span>
                                                                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                                                                                    {alt.userRatingCount || 0} reviews
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                        <Plus className="w-4 h-4 text-violet-300 group-hover/alt:text-violet-600 transition-colors" />
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col items-center py-6 text-center">
                                                                <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center mb-2">
                                                                    <Sparkles className="w-5 h-5 text-violet-400" />
                                                                </div>
                                                                <p className="text-[13px] font-black text-navy">No spots found nearby</p>
                                                                <p className="text-[10px] text-gray-400 font-bold mt-1 max-w-[200px]">We couldn't find any high-rated alternatives in the immediate area.</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
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

                            {/* Community Feedback Section */}
                            <div className="mt-8 border-t border-gray-100 pt-8 pb-10">
                                <h3 className="text-xl font-black text-navy mb-4 flex items-center gap-2">
                                    <MessageSquare className="w-5 h-5 text-coral" /> Community Feedback
                                </h3>
                                
                                {Array.isArray(selectedPlan?.reviews) && selectedPlan.reviews.length > 0 ? (
                                    <div className="space-y-4">
                                        {selectedPlan.reviews.map((r, i) => (
                                            <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm animate-in fade-in duration-300 relative overflow-hidden">
                                                <div className="flex items-center gap-2 mb-3 z-10 relative">
                                                    <div className="flex bg-yellow-50 px-2 py-1 flex-shrink-0 rounded-lg outline outline-1 outline-yellow-100 items-center gap-1">
                                                        <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                                                        <span className="text-[11px] font-black text-yellow-700">{r.rating}.0</span>
                                                    </div>
                                                    <span className="text-[10px] text-gray-400 font-bold ml-auto uppercase tracking-wider">{new Date(r.timestamp).toLocaleDateString()}</span>
                                                </div>
                                                {r.comment && <p className="text-sm text-gray-700 font-medium mb-3 relative z-10 leading-relaxed">{r.comment}</p>}
                                                {r.image && (
                                                    <img src={r.image} alt="User captured moment" className="w-full max-h-48 rounded-xl object-cover shadow-sm border border-gray-200 mt-2 z-10 relative" loading="lazy" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-gradient-to-br from-indigo-50/50 to-white rounded-3xl p-6 text-center border border-indigo-100/50 mb-4 shadow-sm relative overflow-hidden">
                                        <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-indigo-100 rounded-full blur-2xl"></div>
                                        <div className="w-12 h-12 bg-white rounded-2xl mx-auto flex items-center justify-center mb-3 shadow-sm border border-gray-50 text-indigo-500 relative z-10 rotate-6">
                                            <Sparkles className="w-6 h-6" />
                                        </div>
                                        <p className="text-[15px] font-black text-navy relative z-10">No feedback yet</p>
                                        <p className="text-xs font-medium text-gray-500 mt-1.5 max-w-[200px] mx-auto relative z-10 line-clamp-2 leading-relaxed">Be the very first to try this specific date and leave a review!</p>
                                    </div>
                                )}
                                
                                <button 
                                    onClick={() => setRatingPlan(selectedPlan)}
                                    className="w-full mt-4 py-3.5 bg-gray-50 border border-gray-200 text-navy font-black rounded-xl hover:bg-coral hover:text-white hover:border-coral transition-colors flex justify-center items-center gap-2 tracking-wide group/btn transform active:scale-95 shadow-sm"
                                >
                                    <Heart className="w-4 h-4 text-coral group-hover/btn:text-white group-hover/btn:fill-white group-hover/btn:scale-110 transition-all" />
                                    I Tried this Plan
                                </button>
                            </div>

                        </div>
                    </div>

                    {/* Right Column: Embedded Google Map */}
                    <div className={`${showMapMobile ? 'flex flex-1 min-h-[80vh] z-50 touch-none pointer-events-auto' : 'absolute inset-0 z-0 md:relative md:flex pointer-events-none md:pointer-events-auto'} md:flex-col w-full md:w-[350px] lg:w-[450px] bg-gray-50 border-l border-gray-200`}>
                        {showMapMobile && (
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 md:hidden">
                                <button
                                    onClick={() => setShowMapMobile(false)}
                                    className="bg-white text-navy px-6 py-3 rounded-full font-bold shadow-xl flex items-center gap-2 border border-gray-100 transform transition-all active:scale-95"
                                >
                                    <Ticket className="w-5 h-5 text-coral" />
                                    Back to Itinerary
                                </button>
                            </div>
                        )}
                        <div className="absolute top-4 right-4 z-10">
                            <button
                                onClick={() => {
                                    setSelectedPlan(null);
                                    setShowMapMobile(false);
                                }}
                                className="p-2 bg-white text-gray-500 hover:text-navy shadow-md rounded-full transition-colors pointer-events-auto"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {isLoaded ? (
                            <div className="flex-1 w-full relative min-h-[50vh]">
                                <GoogleMap
                                    mapContainerStyle={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
                                    center={
                                        (() => {
                                            const steps = Array.isArray(selectedPlan.itinerary) ? selectedPlan.itinerary : selectedPlan.itinerary?.steps || [];
                                            const firstValidStep = steps.find(s => typeof s.lat === 'number' && typeof s.lng === 'number');
                                            return firstValidStep 
                                                ? { lat: Number(firstValidStep.lat), lng: Number(firstValidStep.lng) } 
                                                : { lat: 40.7128, lng: -74.0060 };
                                        })()
                                    }
                                    zoom={14}
                                    options={{
                                        disableDefaultUI: true,
                                        styles: appTheme === 'dark' ? darkMapStyle : undefined,
                                        gestureHandling: 'greedy',
                                    }}
                                >
                                    {/* Markers for each step */}
                                    {(Array.isArray(selectedPlan.itinerary) ? selectedPlan.itinerary : selectedPlan.itinerary?.steps || [])
                                        .filter(step => typeof step.lat === 'number' && typeof step.lng === 'number')
                                        .map((step, idx) => (
                                            <Marker
                                                key={idx}
                                                position={{ lat: Number(step.lat), lng: Number(step.lng) }}
                                                label={{ text: (idx + 1).toString(), color: 'white', fontWeight: 'bold' }}
                                            />
                                        ))}
                                </GoogleMap>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center min-h-[50vh]">
                                <MapIcon className="w-12 h-12 mb-4 opacity-50" />
                                <p className="font-medium">Please add your Google Maps API Key to view the map.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* UPGRADE MODAL - Premium Experience */}
        <PremiumExperienceModal 
            isOpen={showUpgradeModal} 
            onClose={() => { setShowUpgradeModal(false); setLimitType(null); }}
            onUpgrade={(type) => handleBuyPass(type || 'ELITE')}
            limitType={limitType}
        />

        {/* COMMUNITY FEEDBACK MODAL */}
        <CommunityFeedbackModal 
            isOpen={!!ratingPlan}
            onClose={() => setRatingPlan(null)}
            plan={ratingPlan}
            onFeedbackSubmitted={(updatedPlan) => {
                setPlans(prev => prev.map(p => p.id === updatedPlan.id ? updatedPlan : p));
                if (selectedPlan && selectedPlan.id === updatedPlan.id) {
                    setSelectedPlan(updatedPlan);
                }
            }}
        />

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

        {/* FEEDBACK MODAL */}
        {showIdeaModal && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-navy/60 backdrop-blur-sm">
                <div className="bg-[#1a2235] border border-white/10 rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col relative animate-in fade-in zoom-in-95 duration-300">
                    <button 
                        onClick={() => setShowIdeaModal(false)}
                        className="absolute top-6 right-6 p-2 text-gray-400 hover:text-white bg-white/5 rounded-full transition-colors z-10"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="p-8 sm:p-10">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-xl">
                            <Compass className="w-8 h-8 text-violet-600" />
                        </div>

                        <h2 className="text-3xl font-black text-white mb-3">Have an Idea? 💡</h2>
                        <p className="text-gray-400 font-medium mb-8 leading-relaxed">
                            What improvements or features would you love to see in DateSpark?
                        </p>

                        <div className="space-y-6">
                            <div className="relative group">
                                <textarea
                                    value={feedbackMessage}
                                    onChange={(e) => setFeedbackMessage(e.target.value)}
                                    placeholder="I want to see... / Add this feature..."
                                    className="w-full h-40 bg-[#252f44] border-2 border-transparent focus:border-coral/50 rounded-2xl p-5 text-white placeholder:text-gray-500 font-medium outline-none transition-all resize-none shadow-inner"
                                />
                            </div>

                            <button
                                onClick={handleSubmitFeedback}
                                disabled={isSubmittingFeedback || !feedbackMessage.trim()}
                                className="w-full py-4 bg-coral text-white font-black rounded-2xl shadow-xl shadow-coral/20 hover:bg-coral/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                            >
                                {isSubmittingFeedback ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    'Submit Proposal'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {showSettingsModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-6 bg-navy/60 backdrop-blur-md">
                <div className="bg-white sm:rounded-[2.5rem] shadow-2xl w-full max-w-5xl h-full sm:h-[90vh] md:h-[650px] overflow-hidden flex flex-col md:flex-row relative animate-in fade-in zoom-in-95 duration-300">
                    
                    {/* Header for Mobile Drill-down */}
                    <div className="md:hidden flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-20">
                        <div className="flex items-center gap-3">
                            {(settingsTab && settingsTab !== 'menu') && (
                                <button 
                                    onClick={() => setSettingsTab('menu')}
                                    className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-navy active:scale-90 transition-all"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                            )}
                            <h2 className="text-xl font-black text-navy tracking-tight">
                                {settingsTab === 'menu' || !settingsTab ? 'Settings' : 
                                 settingsTab.charAt(0).toUpperCase() + settingsTab.slice(1)}
                            </h2>
                        </div>
                        <button 
                            onClick={() => setShowSettingsModal(false)}
                            className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 active:scale-90 transition-all border border-gray-100/50"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Sidebar / Menu */}
                    <div className={`${(settingsTab && settingsTab !== 'menu') ? 'hidden md:flex' : 'flex'} w-full md:w-72 bg-gray-50/50 border-r border-gray-100 flex-col p-6 md:p-8 overflow-y-auto flex-shrink-0 transition-all duration-300`}>
                        <div className="hidden md:block mb-10">
                            <h2 className="text-2xl font-black text-navy tracking-tight">Settings</h2>
                            <p className="text-gray-500 text-sm font-medium mt-1">Manage your account</p>
                        </div>
                        <nav className="space-y-1.5 flex-1">
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
                            <button
                                onClick={() => {
                                    if (!isPremium) {
                                        setShowUpgradeModal(true);
                                    } else {
                                        setSettingsTab('trash');
                                    }
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors text-left ${settingsTab === 'trash' ? 'bg-white text-red-600 shadow-sm border border-gray-100' : 'text-gray-500 hover:text-navy hover:bg-gray-100/50'} ${!isPremium ? 'opacity-60' : ''}`}
                            >
                                <Trash2 className={`w-5 h-5 ${settingsTab === 'trash' ? 'text-red-500' : 'text-gray-400'}`} />
                                <span className="flex-1">Trash Bin</span>
                                {!isPremium && <Lock className="w-3.5 h-3.5 text-coral" />}
                            </button>
                            <div className="mt-8 pt-8 border-t border-gray-100 px-4">
                                <div className="bg-coral/5 rounded-2xl p-4 border border-coral/10">
                                    <h5 className="text-xs font-black text-coral uppercase tracking-widest mb-2">Spread the Word</h5>
                                    <p className="text-[10px] text-gray-500 font-medium mb-3">Love DateSpark? Share it with a friend and help them plan their next dream date!</p>
                                    <button
                                        onClick={handleShareApp}
                                        className="w-full py-2.5 bg-coral text-white text-xs font-black rounded-xl hover:bg-coral/90 transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-md shadow-coral/20"
                                    >
                                        <Share2 className="w-3.5 h-3.5" /> Share DateSpark
                                    </button>
                                </div>
                            </div>
                        </nav>
                    </div>

                    {/* Content Area */}
                    <div className={`${(settingsTab === 'menu' || !settingsTab) ? 'hidden md:flex' : 'flex'} flex-1 overflow-y-auto p-8 lg:p-14 relative flex-col`}>
                        <button
                            onClick={() => setShowSettingsModal(false)}
                            className="hidden md:flex absolute top-8 right-8 w-10 h-10 items-center justify-center text-gray-400 hover:text-navy hover:bg-gray-100 rounded-full transition-all border border-transparent hover:border-gray-200"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {settingsTab === 'profile' && (
                            <div className="max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <h3 className="text-2xl font-black text-navy mb-2">Account Profile</h3>
                                <p className="text-gray-500 mb-8 font-medium">Manage your personal information and email.</p>

                                <div className="flex items-center gap-6 mb-8 p-6 bg-gray-50 rounded-2xl border border-gray-100">
                                    <div className="relative group">
                                        <div className="w-24 h-24 rounded-full overflow-hidden bg-white border-4 border-white shadow-md">
                                            {user?.user_metadata?.avatar_url ? (
                                                <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-coral/10 text-coral">
                                                    <User className="w-10 h-10" />
                                                </div>
                                            )}
                                            {isUploading && (
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white">
                                                    <Loader2 className="w-6 h-6 animate-spin" />
                                                </div>
                                            )}
                                        </div>
                                        <label className="absolute -bottom-1 -right-1 p-2 bg-coral text-white rounded-full shadow-lg cursor-pointer hover:scale-110 transition-transform active:scale-95">
                                            <Plus className="w-4 h-4" />
                                            <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={isUploading} />
                                        </label>
                                    </div>
                                    <div>
                                        <h4 className="font-black text-navy text-lg leading-tight">Your Profile Photo</h4>
                                        <p className="text-gray-500 text-xs font-medium mb-3">Upload a clean picture of yourself.</p>
                                        <button
                                            onClick={handleDeleteAvatar}
                                            disabled={isUploading || !user?.user_metadata?.avatar_url}
                                            className="text-xs font-bold text-coral hover:text-coral/80 disabled:opacity-30 flex items-center gap-1.5"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" /> Delete Picture
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">First Name</label>
                                            <input
                                                type="text"
                                                value={profileData.first_name}
                                                onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-coral focus:border-transparent outline-none transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Last Name</label>
                                            <input
                                                type="text"
                                                value={profileData.last_name}
                                                onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-coral focus:border-transparent outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
                                        <input
                                            type="email"
                                            value={profileData.email}
                                            onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-coral focus:border-transparent outline-none transition-all"
                                        />
                                        <p className="text-[10px] text-coral mt-1 italic font-medium">Note: Changing email will require verification.</p>
                                    </div>
                                    <div className="pt-2">
                                        <button
                                            onClick={handleUpdateProfile}
                                            disabled={isLoading}
                                            className="w-full sm:w-auto px-8 py-3.5 bg-navy text-white font-black rounded-xl hover:bg-navy/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                        >
                                            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                            Save Changes
                                        </button>
                                    </div>
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
                                            <h4 className="text-lg font-black text-navy">{isPremium ? 'DateSpark Plus' : 'The Spark'}</h4>
                                            <p className="text-gray-500 font-medium mt-1">{isPremium ? 'Active Subscription' : 'Current Plan'}</p>
                                        </div>
                                        <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg bg-white">
                                            {isPremium ? <Heart className="w-6 h-6 fill-coral text-coral" /> : <div className="font-black text-navy text-xl">F</div>}
                                        </div>
                                    </div>

                                    <div className="space-y-3 mb-8">
                                        {isPremium ? (
                                            [
                                                "Unlimited plans generation",
                                                "30-Day Unrestricted Access",
                                                "Priority AI Generation",
                                                "Save Unlimited Favorites",
                                                "Custom Theme Unlock",
                                                "Early Access to Features"
                                            ].map((feature, idx) => (
                                                <div key={idx} className="flex items-center gap-3">
                                                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 bg-green-100">
                                                        <Check className="w-3.5 h-3.5 text-green-600 font-bold" />
                                                    </div>
                                                    <span className="font-bold text-navy text-[13px]">
                                                        {feature}
                                                    </span>
                                                </div>
                                            ))
                                        ) : (
                                            <>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 bg-amber-100">
                                                        <Zap className="w-3.5 h-3.5 text-amber-600 font-bold" />
                                                    </div>
                                                    <span className="font-bold text-navy text-[13px]">
                                                        3 Classic plans per day
                                                    </span>
                                                    <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full text-gray-500 ml-auto">
                                                        {usage.classic}/{limits.classic} Used
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 bg-violet-100">
                                                        <Crown className="w-3.5 h-3.5 text-violet-600 font-bold" />
                                                    </div>
                                                    <span className="font-bold text-navy text-[13px]">
                                                        2 AI Custom plans per day
                                                    </span>
                                                    <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full text-gray-500 ml-auto">
                                                        {usage.guided}/{limits.guided} Used
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 bg-blue-100">
                                                        <Zap className="w-3.5 h-3.5 text-blue-600 font-bold" />
                                                    </div>
                                                    <span className="font-bold text-navy text-[13px]">
                                                        10 Swap Spots per day
                                                    </span>
                                                    <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full text-gray-500 ml-auto">
                                                        {usage.swap}/{limits.swap} Used
                                                    </span>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {isPremium ? (
                                        <div className="flex flex-col gap-3">
                                            <div className="flex flex-col sm:flex-row gap-3">
                                                <button 
                                                    onClick={handleManageSubscription}
                                                    disabled={isLoading}
                                                    className="flex-1 py-3.5 px-6 bg-navy text-white rounded-xl font-bold hover:bg-navy/90 transition-all flex items-center justify-center gap-2 shadow-lg active:scale-[0.98]"
                                                >
                                                    {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                                    Manage Subscription & Billing
                                                    <ExternalLink className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <p className="text-[11px] text-gray-400 text-center font-medium">✨ You are a premium member. Manage your payments or cancel via Stripe Portal.</p>
                                        </div>
                                    ) : (
                                        <div className="pt-2 border-t border-gray-100 mt-6">
                                            <div className="bg-gradient-to-r from-navy to-[#0f172a] p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-xl shadow-navy/10">
                                                <div className="absolute -right-10 -top-10 w-40 h-40 bg-coral/20 rounded-full blur-3xl pointer-events-none"></div>
                                                <div className="relative z-10 text-center sm:text-left">
                                                    <span className="text-coral text-[10px] font-black uppercase tracking-widest mb-1 block">Unlock Everything</span>
                                                    <h4 className="text-white font-black text-lg">Upgrade to Premium</h4>
                                                    <p className="text-white/60 text-xs mt-1 font-medium max-w-[250px]">Get unlimited plans, custom themes, and exclusive AI perks.</p>
                                                </div>
                                                <button
                                                    onClick={() => setShowUpgradeModal(true)}
                                                    className="relative z-10 w-full sm:w-auto px-6 py-3 bg-coral hover:bg-coral/90 text-white font-black text-sm rounded-xl transition-all active:scale-95 shadow-lg shadow-coral/20 whitespace-nowrap"
                                                >
                                                    View Plans & Pricing
                                                </button>
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
                                    <div className="flex items-center justify-between p-4 border border-gray-100 rounded-2xl bg-gray-50/50 opacity-60">
                                        <div>
                                            <h4 className="font-bold text-navy">Weekend Spark Emails</h4>
                                            <p className="text-[11px] text-gray-500 mt-0.5 italic">Coming Soon: Weekly top-rated community spotlights for your weekend plans.</p>
                                        </div>
                                        <div className="w-12 h-6 bg-gray-300 rounded-full relative cursor-not-allowed">
                                            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between p-4 border border-gray-100 rounded-2xl bg-gray-50/50 opacity-60">
                                        <div>
                                            <h4 className="font-bold text-navy">Planned Date Reminders</h4>
                                            <p className="text-xs text-gray-500 mt-0.5 italic">Coming Soon: Automatic reminders for your scheduled plans.</p>
                                        </div>
                                        <div className="w-12 h-6 bg-gray-300 rounded-full relative cursor-not-allowed">
                                            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full"></div>
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
                                                { id: 'dark', name: 'Midnight Dark', bg: 'bg-[#0f172a] border-black', preview: ['bg-coral', 'bg-white'] },
                                                { id: 'sunset', name: 'Sunset Haze', bg: 'bg-gradient-to-br from-coral to-fuchsia-500 border-coral', preview: ['bg-white', 'bg-navy'] }
                                            ].map(theme => (
                                                <button
                                                    key={theme.id}
                                                    onClick={() => {
                                                        if (!isPremium && theme.id !== 'light') {
                                                            setShowUpgradeModal(true);
                                                        } else {
                                                            setAppTheme(theme.id);
                                                        }
                                                    }}

                                                    className={`p-4 rounded-xl border flex items-center justify-between transition-all ${appTheme === theme.id ? 'border-coral shadow-sm bg-coral/5' : 'border-gray-100 hover:border-gray-200 bg-white'} ${!isPremium && theme.id !== 'light' ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-5 h-5 rounded-full ${theme.bg} border`} />
                                                        <span className="font-semibold text-sm text-navy">{theme.name}</span>
                                                        {!isPremium && theme.id !== 'light' && <Lock className="w-3.5 h-3.5 text-coral flex-shrink-0" />}
                                                    </div>
                                                    <div className="flex gap-1">
                                                        {theme.preview.map((c, i) => <div key={i} className={`w-2 h-2 rounded-full ${c}`} />)}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="pt-4">
                                        <button
                                            onClick={handleUpdateProfile}
                                            disabled={isSavingProfile}
                                            className="w-full py-3 bg-navy text-white font-bold rounded-xl hover:bg-navy/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-navy/20"
                                        >
                                            {isSavingProfile ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving Preferences...</> : 'Save Preferences'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                        {settingsTab === 'trash' && (
                                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 h-full flex flex-col">
                                        <h3 className="text-2xl font-black text-navy mb-2">Recycle Bin</h3>
                                        <p className="text-gray-500 mb-6 font-medium text-sm">Favorited plans you deleted are kept here for 7 days.</p>

                                        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                                            {plans.filter(p => p.deleted_at).length === 0 ? (
                                                <div className="py-20 text-center">
                                                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-300">
                                                        <Trash2 className="w-8 h-8" />
                                                    </div>
                                                    <p className="text-gray-400 font-bold">Trash is empty</p>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 gap-4">
                                                    {plans.filter(p => p.deleted_at).map((plan) => (
                                                        <div key={plan.id} className="bg-white border border-gray-100 p-4 rounded-2xl flex items-center justify-between group hover:border-coral/20 transition-all shadow-sm">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-navy font-black text-xs">
                                                                    {plan.location?.slice(0, 3).toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-bold text-navy text-sm">{plan.vibe} Date</h4>
                                                                    <p className="text-[10px] text-gray-400 font-medium">{new Date(plan.deleted_at).toLocaleDateString()} • {plan.location}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={(e) => handleRestorePlan(plan.id, e)}
                                                                    className="px-3 py-1.5 bg-green-50 text-green-600 text-[10px] font-black rounded-lg hover:bg-green-600 hover:text-white transition-all"
                                                                >
                                                                    Restore
                                                                </button>
                                                                <button
                                                                    onClick={(e) => handleDelete(plan.id, e)}
                                                                    className="px-3 py-1.5 bg-red-50 text-red-600 text-[10px] font-black rounded-lg hover:bg-red-600 hover:text-white transition-all"
                                                                >
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* --- CUSTOM CONFIRMATION MODAL --- */}
                {confirmModal.isOpen && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="bg-white rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
                            <div className={`p-8 text-center ${confirmModal.type === 'delete' ? 'bg-red-50' : confirmModal.type === 'favorite' ? 'bg-coral/10' : 'bg-coral/5'}`}>
                                <div className={`w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-lg transform -rotate-3 ${confirmModal.type === 'delete' ? 'bg-red-500 text-white' : confirmModal.type === 'favorite' ? 'bg-coral text-white' : 'bg-coral text-white'}`}>
                                    {confirmModal.type === 'favorite' ? <Heart className="w-10 h-10 fill-white" /> : <Trash2 className="w-10 h-10" />}
                                </div>
                                <h3 className="text-2xl font-black text-navy mb-2 tracking-tight">
                                    {confirmModal.type === 'delete' ? 'Permanently Delete?' : 
                                     confirmModal.type === 'favorite' ? 'Move to Favorites?' : 
                                     'Move to Trash?'}
                                </h3>
                                <p className="text-gray-500 font-medium text-[15px] leading-relaxed px-4">
                                    {confirmModal.type === 'delete' 
                                        ? "This action is final and cannot be undone. Say goodbye to this date forever?"
                                        : confirmModal.type === 'favorite'
                                            ? "This plan will be tucked away in your Favorites tab to keep your dashboard clean."
                                            : "Don't worry, you can recover this date plan from your settings for up to 7 days."}
                                </p>
                            </div>
                            <div className="p-6 grid grid-cols-2 gap-4">
                                <button 
                                    onClick={() => setConfirmModal({ isOpen: false, plan: null, type: 'trash' })}
                                    className="py-4 rounded-2xl text-[14px] font-black text-gray-400 hover:bg-gray-50 transition-all uppercase tracking-widest"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={performDelete}
                                    className={`py-4 rounded-2xl text-[14px] font-black text-white shadow-lg transition-all active:scale-95 uppercase tracking-widest ${
                                        confirmModal.type === 'delete' ? 'bg-red-600 shadow-red-500/30' : 
                                        confirmModal.type === 'favorite' ? 'bg-coral shadow-coral/30' :
                                        'bg-navy shadow-navy/30'
                                    }`}
                                >
                                    {confirmModal.type === 'delete' ? 'Delete' : 
                                     confirmModal.type === 'favorite' ? 'Move to Favorites' : 
                                     'Confirm'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <BottomNav
                    onProfileClick={() => {
                        setShowSettingsModal(true);
                        setSettingsTab('profile');
                    }}
                    avatarUrl={user?.user_metadata?.avatar_url}
                    userInitial={user?.user_metadata?.first_name?.[0] || 'K'}
                />
            </div>
        );
};

        export default Dashboard;
