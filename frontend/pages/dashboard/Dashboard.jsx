import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import {
    Heart,
    MessageCircle,
    MessageSquare,
    Share2,
    Trash2,
    RefreshCw,
    Send,
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
    Flame,
    ArrowRight,
    LifeBuoy,
    Loader2,
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
    ChevronLeft,
    Circle,
    Globe,
    Moon,
    Sun,
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
    Copy,
    ThumbsUp,
    Reply,
    TrendingUp,
    Navigation,
    Home,
    Menu,
    Bot,
    Wand2,
    Gem,
    ShuffleIcon,
    Footprints
} from 'lucide-react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { useGoogleMaps } from '../../lib/googleMaps';
import { loadStripe } from '@stripe/stripe-js';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import BottomNav from '../../components/common/BottomNav';
import EventsTab from '../../components/dashboard/EventsTab';
import WishlistTab from '../../components/dashboard/WishlistTab';
import PremiumExperienceModal from '../../components/modals/PremiumExperienceModal';
import UsageBadge from '../../components/common/UsageBadge';
import { consumeFlashMessage } from '../../lib/flashMessage';
import CommunityFeedbackModal from '../../components/modals/CommunityFeedbackModal';
import VisualSparkCard from '../../components/dashboard/VisualSparkCard';
import ShareCardModal from '../../components/modals/ShareCardModal';
import NearbyMapWidget from '../../components/dashboard/NearbyMapWidget';
import SwipeCard from '../../components/dashboard/SwipeCard';
import DateArchitectChat from '../../components/dashboard/DateArchitectChat';

const SERVER_DEFAULT_LIMITS = { classic: 2, guided: 2, swap: 3, save_weekly: 3 };

const STOP_REACTIONS_MAP = {
    loved: { emoji: '😍', label: 'Loved It', color: 'bg-pink-50 text-pink-600 border-pink-100' },
    hidden: { emoji: '💎', label: 'Hidden Gem', color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
    overpriced: { emoji: '💸', label: 'Overpriced', color: 'bg-yellow-50 text-yellow-600 border-yellow-100' },
    skip: { emoji: '👎', label: 'Would Skip', color: 'bg-gray-100 text-gray-600 border-gray-200' }
};

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

// Helper to calculate distance in miles between two coordinates (Haversine formula)
const getDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 3958.8; // Radius of the earth in miles
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c; 
};

const Dashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const hasFetchedRef = React.useRef(false);
    const [plans, setPlans] = useState([]);
    const [isSharing, setIsSharing] = useState(false);
    const [recommendations, setRecommendations] = useState([]);
    const [isFetchingRecs, setIsFetchingRecs] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [activeTab, setActiveTab] = useState('all');
    const [showDiscovery, setShowDiscovery] = useState(false);
    const [swipeIndex, setSwipeIndex] = useState(0);
    const [swipeDirection, setSwipeDirection] = useState(null);
    const [showMapMobile, setShowMapMobile] = useState(false);
    const [currentTab, setCurrentTab] = useState('home'); // 'home', 'plans', 'discovery', 'account'
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(window.innerWidth < 1024);
    const [accountSubView, setAccountSubView] = useState('menu'); // 'menu', 'personal', 'billing', 'preferences', 'trash'

    // --- SETTINGS STATE ---
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
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

    // --- CUSTOMIZATION INTERCEPT ---
    const [showCustomizeModal, setShowCustomizeModal] = useState(false);
    const [pendingCustomizeAction, setPendingCustomizeAction] = useState(null);
    const [isCustomizing, setIsCustomizing] = useState(false);

    // --- UNIFIED STATE SYNC HELPER ---
    const syncPlanState = (updatedPlan) => {
        if (!updatedPlan?.id) return;
        const updater = p => p.id === updatedPlan.id ? { ...p, ...updatedPlan } : p;
        setPlans(prev => prev.map(updater));
        setGlobalTrendingPlans(prev => prev.map(updater));
        if (selectedPlan?.id === updatedPlan.id) {
            setSelectedPlan(prev => ({ ...prev, ...updatedPlan }));
        }
    };
    const [activeVibeFilter, setActiveVibeFilter] = useState('ALL');
    const [aiCopilotInput, setAiCopilotInput] = useState('');
    const [copilotSuggestion, setCopilotSuggestion] = useState(null);
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
        const userEmail = localStorage.getItem('userEmail')?.toLowerCase();
        const isCurrentlyAdmin = import.meta.env.DEV && userEmail === adminEmail;
        if (isCurrentlyAdmin) {
            return localStorage.getItem('isPremium') === 'true';
        }
        return false; // Regular users default to false (strict DB sync)
    });
    const [isAdmin, setIsAdmin] = useState(false);

    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [limitType, setLimitType] = useState(null); // 'classic', 'guided', or 'swap'
    const [showVisionModal, setShowVisionModal] = useState(false); // Vision Modal state
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, plan: null, type: 'trash', isBatch: false });
    const [showIdeaModal, setShowIdeaModal] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [ideaText, setIdeaText] = useState('');
    const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
    const [completedSteps, setCompletedSteps] = useState([]);
    const [shareCardPlan, setShareCardPlan] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatingStatus, setGeneratingStatus] = useState('');
    const [feedbackText, setFeedbackText] = useState('');
    const [feedbackType, setFeedbackType] = useState('feedback'); // 'feedback' or 'support'

    useEffect(() => {
        const msg = consumeFlashMessage();
        if (!msg) return;
        setToastMessage(msg);
        const t = setTimeout(() => setToastMessage(''), 6500);
        return () => clearTimeout(t);
    }, []);

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

    // --- BOOST / REPLY STATE ---
    const [boostingPlanId, setBoostingPlanId] = useState(null); // show loading on boost btn
    const [replyingTo, setReplyingTo] = useState(null); // { planId, reviewIndex }
    const [replyText, setReplyText] = useState('');
    const [isPostingReply, setIsPostingReply] = useState(false);
    const [likingReview, setLikingReview] = useState(null); // { planId, reviewIndex }
    const [userCity, setUserCity] = useState('New York');

    useEffect(() => {
        if (currentTab === 'vibe' || currentTab === 'discovery') {
            navigate('/vibe-feed');
        }
    }, [currentTab]);

    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition((position) => {
                const { latitude: lat, longitude: lng, accuracy } = position.coords;
                console.log(`[Dashboard GPS] Detected: ${lat}, ${lng} (Accuracy: ${accuracy}m)`);

                // Service Area Check (NYC + New Jersey)
                const isWithinNYCNJ = lat >= 38.9 && lat <= 41.4 && lng >= -75.6 && lng <= -73.7;

                if (isWithinNYCNJ) {
                    const boroughs = [
                        { name: 'Manhattan', lat: 40.7831, lng: -73.9712 },
                        { name: 'Brooklyn', lat: 40.6782, lng: -73.9442 },
                        { name: 'Queens', lat: 40.7282, lng: -73.7949 },
                        { name: 'Bronx', lat: 40.8448, lng: -73.8648 },
                        { name: 'Staten Island', lat: 40.5795, lng: -74.1502 },
                        { name: 'Jersey City', lat: 40.7178, lng: -74.0431 },
                        { name: 'Hoboken', lat: 40.7440, lng: -74.0324 }
                    ];
                    let closest = boroughs[0];
                    let minDist = Infinity;
                    boroughs.forEach(b => {
                        const dist = Math.sqrt(Math.pow(b.lat - lat, 2) + Math.pow(b.lng - lng, 2));
                        if (dist < minDist) { minDist = dist; closest = b; }
                    });
                    console.log(`[Dashboard GPS] Resolved to NYC Area: ${closest.name}`);
                    setUserCity(closest.name);
                } else {
                    // OUTSIDE NYC/NJ: Use Reverse Geocoding to get the real city
                    if (window.google?.maps?.Geocoder) {
                        new window.google.maps.Geocoder().geocode({ location: { lat, lng } }, (results, status) => {
                            if (status === 'OK' && results[0]) {
                                const cityComp = results[0].address_components.find(c =>
                                    c.types.includes('locality') || c.types.includes('sublocality')
                                );
                                if (cityComp) {
                                    console.log(`[Dashboard GPS] Resolved to Global City: ${cityComp.long_name}`);
                                    setUserCity(cityComp.long_name);
                                } else {
                                    setUserCity('New York'); // Hard fallback
                                }
                            }
                        });
                    }
                }
            },
                (err) => console.log('Location access denied, defaulting to New York.'),
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
            );
        }
    }, []);

    // Desktop Keyboard Discovery Navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (currentTab !== 'discovery' || swipeIndex >= globalTrendingPlans.length || selectedPlan) return;

            if (e.key === 'ArrowLeft') {
                setSwipeIndex(prev => prev + 1);
            } else if (e.key === 'ArrowRight') {
                const plan = globalTrendingPlans[swipeIndex];
                if (plan) handleToggleFavorite(plan);
                setSwipeIndex(prev => prev + 1);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentTab, swipeIndex, globalTrendingPlans, selectedPlan]);

    // Usage state for Free users (defaults match server.js until API returns)
    const [usage, setUsage] = useState({
        classic: 0,
        guided: 0,
        swap: 0,
        save_weekly: 0
    });
    const [limits, setLimits] = useState({ ...SERVER_DEFAULT_LIMITS });

    // --- PLACE RATINGS STATE ---
    const [placeRatings, setPlaceRatings] = useState([]);
    const [isFetchingRatings, setIsFetchingRatings] = useState(false);

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

    const fetchPlaceRatings = async (planId) => {
        if (!planId) return;
        setIsFetchingRatings(true);
        try {
            const response = await axios.get(`/api/place-ratings?planId=${planId}`);
            setPlaceRatings(response.data || []);
        } catch (err) {
            console.error('Error fetching place ratings:', err);
            setPlaceRatings([]);
        } finally {
            setIsFetchingRatings(false);
        }
    };

    useEffect(() => {
        if (selectedPlan && selectedPlan.id) {
            const saved = localStorage.getItem(`completed_steps_${selectedPlan.id}`);
            setCompletedSteps(saved ? JSON.parse(saved) : []);
            fetchPlaceRatings(selectedPlan.id);
        } else {
            setPlaceRatings([]);
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

    useEffect(() => {
        const initData = async () => {
            if (!user) return;
            try {
                const [premRes, usageRes] = await Promise.all([
                    fetch(`/api/user-premium/${user.id}`),
                    fetch(`/api/user-usage/${user.id}`)
                ]);

                if (premRes.ok) {
                    const premData = await premRes.json();
                    const dbStatus = premData.isPremium;
                    setIsAdmin(premData.isAdmin || false);
                    if (import.meta.env.DEV && user?.email?.toLowerCase() === 'rayanerold@gmail.com') {
                        const manualChoice = localStorage.getItem('isPremium');
                        if (manualChoice !== null) setIsPremium(manualChoice === 'true');
                        else setIsPremium(dbStatus);
                    } else {
                        setIsPremium(dbStatus);
                        localStorage.setItem('isPremium', dbStatus ? 'true' : 'false');
                    }
                }

                if (usageRes.ok) {
                    const data = await usageRes.json();
                    setUsage(prev => ({ ...prev, ...data.usage }));
                    setLimits(prev => ({ ...prev, ...data.limits }));
                }
            } catch (err) {
                console.error('Error syncing dashboard data:', err);
            }
        };
        initData();
    }, [user]);

    const handleBuyPass = async (planType) => {
        try {
            // Re-fetch session to ensure we have valid user data for the payment
            const { data: { session: authSession } } = await supabase.auth.getSession();
            const activeUser = authSession?.user || user;

            if (!activeUser?.id || !activeUser?.email) {
                alert("Please sign in again to continue with the payment.");
                return;
            }

            const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
            if (!stripe) throw new Error("Stripe Failed to Load. Please check your internet connection.");

            const response = await axios.post('/api/create-checkout-session', {
                planType,
                userId: activeUser.id,
                email: activeUser.email
            });
            const { id, url } = response.data;

            if (url) {
                window.location.href = url;
            } else if (id) {
                await stripe.redirectToCheckout({ sessionId: id });
            } else {
                throw new Error("Invalid checkout session response from server.");
            }
        } catch (err) {
            console.error('Checkout error:', err);
            const errorMsg = err.response?.data?.error || err.message;
            alert(`Payment setup failed: ${errorMsg}`);
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

    const handleCancelManual = async () => {
        if (!confirm('Are you sure you want to cancel your Premium status? You will lose access to all Plus features immediately.')) return;
        try {
            setIsLoading(true);
            const response = await fetch('/api/cancel-manual-subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user?.id })
            });

            if (response.ok) {
                setToastMessage('Subscription canceled! 🚀');
                setTimeout(() => window.location.reload(), 2000);
            }
        } catch (err) {
            console.error('Error canceling manual:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignOut = async () => {
        try {
            await supabase.auth.signOut();
            localStorage.clear();
            // Force hard reload to landing page to clear all in-memory state
            window.location.href = '/';
        } catch (error) {
            console.error('Logout error:', error);
            // Even if Supabase fails (e.g. invalid session), we MUST clear local state
            localStorage.clear();
            window.location.href = '/';
        }
    };

    const handleGeneratePlan = async (prompt, overrides = {}) => {
        if (!prompt) return;
        setIsGenerating(true);
        setGeneratingStatus('Sparking your date idea...');
        try {
            console.log('[Dashboard] Generating direct plan for prompt:', prompt);
            const response = await axios.post('/api/generate-date', {
                prompt,
                userId: user?.id,
                email: user?.email,
                city: overrides.location || userCity,
                lat: overrides.lat,
                lng: overrides.lng,
                budget: overrides.budget,
                numActivities: overrides.numActivities,
                radius: overrides.radius,
                planDate: overrides.planDate,
                planTime: overrides.planTime,
                type: 'classic'
            });

            if (response.data.success) {
                const newPlan = response.data.plan;
                setPlans(prev => [newPlan, ...prev]);
                setSelectedPlan(newPlan);
                setToastMessage('Sparked a new date! ⚡');
                setAiCopilotInput('');
            } else {
                setToastMessage('Spark could not be ignited. Please try again. 🛑');
            }
        } catch (err) {
            console.error('Direct generation error:', err);
            if (err.response?.status === 403) {
                setLimitType('classic');
                setShowUpgradeModal(true);
            } else {
                setToastMessage('Failed to spark date. Please try again. 🛑');
            }
        } finally {
            setIsGenerating(false);
            setGeneratingStatus('');
        }
    };

    const handleRecreatePlan = async (planId) => {
        if (!planId) return;
        setIsGenerating(true);
        setGeneratingStatus('Refining your date variation...');
        try {
            console.log('[Dashboard] Recreating plan variation for ID:', planId);
            const response = await axios.post('/api/recreate-date', {
                planId,
                userId: user?.id,
                email: user?.email,
                type: 'classic'
            });

            if (response.data.success) {
                const newPlan = response.data.plan;
                setPlans(prev => [newPlan, ...prev]);
                setSelectedPlan(newPlan);
                setToastMessage('Recreated your date variation! 🎨');
            }
        } catch (err) {
            console.error('Recreation error:', err);
            if (err.response?.status === 403) {
                setLimitType('classic');
                setShowUpgradeModal(true);
            } else {
                setToastMessage('Failed to recreate variation. 🛑');
            }
        } finally {
            setIsGenerating(false);
            setGeneratingStatus('');
        }
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsUploading(true);

            // Send to our bulletproof backend proxy instead of direct Supabase storage
            const response = await fetch('/api/upload-avatar', {
                method: 'POST',
                headers: {
                    'Content-Type': file.type,
                    'x-user-id': user.id
                },
                body: file // express.raw() will pick this up
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Server upload failed');
            }

            const { publicUrl } = await response.json();

            // Update local state (Auth metadata was already updated by backend)
            setUser(prev => ({
                ...prev,
                user_metadata: { ...prev.user_metadata, avatar_url: publicUrl }
            }));

            alert('Profile photo updated successfully!');
        } catch (err) {
            console.error('Avatar upload error:', err);
            alert(`Upload failed: ${err.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    const handleUpdateProfile = async () => {
        try {
            setIsSavingProfile(true);
            const { error } = await supabase.auth.updateUser({
                data: {
                    first_name: profileData.first_name,
                    last_name: profileData.last_name
                }
            });

            if (error) throw error;

            setUser(prev => ({
                ...prev,
                user_metadata: {
                    ...prev.user_metadata,
                    first_name: profileData.first_name,
                    last_name: profileData.last_name
                }
            }));

            alert('Profile updated successfully!');
        } catch (err) {
            console.error('Update profile error:', err);
            alert(`Update failed: ${err.message}`);
        } finally {
            setIsSavingProfile(false);
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
    const { isLoaded } = useGoogleMaps();

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
                if (user?.email) {
                    localStorage.setItem('userEmail', user.email);
                }

                // Fetch premium status and usage from secure backend proxy
                const [premRes, usageRes] = await Promise.all([
                    fetch(`/api/user-premium/${user.id}`),
                    fetch(`/api/user-usage/${user.id}`)
                ]);

                if (premRes.ok) {
                    const data = await premRes.json();
                    setIsAdmin(data.isAdmin || false);

                    // Admin Special Logic: Sync with DB but respect manual toggle for testing
                    if (import.meta.env.DEV && user?.email?.toLowerCase() === 'rayanerold@gmail.com') {
                        const manualChoice = localStorage.getItem('isPremium');
                        if (manualChoice !== null) {
                            setIsPremium(manualChoice === 'true');
                        } else {
                            setIsPremium(data.isPremium);
                        }
                    } else {
                        setIsPremium(data.isPremium);
                        localStorage.setItem('isPremium', data.isPremium ? 'true' : 'false');
                    }

                    setReferralDetails({
                        code: data.referral_code || '',
                        count: data.referral_count || 0
                    });
                }

                if (usageRes.ok) {
                    const data = await usageRes.json();
                    setUsage(prev => ({ ...prev, ...data.usage }));
                    setLimits(prev => ({ ...prev, ...data.limits }));
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
                            const { isPremium: dbStatus, isAdmin: dbAdmin, premium_expiry, referral_code, referral_count } = data;
                            setIsAdmin(dbAdmin || false);

                            // Check if premium via boolean OR via active expiry
                            const now = new Date();
                            const hasActivePass = premium_expiry && new Date(premium_expiry) > now;
                            const finalStatus = dbStatus || hasActivePass;

                            // Admin Special Logic: Sync with DB but respect manual toggle for testing
                            if (import.meta.env.DEV && user?.email === 'rayanerold@gmail.com') {
                                const manualChoice = localStorage.getItem('isPremium');
                                if (manualChoice !== null) {
                                    setIsPremium(manualChoice === 'true');
                                } else {
                                    setIsPremium(finalStatus);
                                }
                            } else {
                                setIsPremium(finalStatus);
                                localStorage.setItem('isPremium', finalStatus ? 'true' : 'false');
                            }
                            if (premium_expiry) {
                                localStorage.setItem('premiumExpiry', premium_expiry);
                            } else {
                                localStorage.removeItem('premiumExpiry');
                            }
                        }
                    } catch (syncErr) {
                        console.error('Dashboard Premium Sync Error:', syncErr);
                    }

                    const fetchPlans = async () => {
                        try {
                            console.log('Dashboard - Fetching plans via server proxy for user:', user.id);
                            const response = await fetch(`/api/user-plans?userId=${user.id}`);
                            if (!response.ok) {
                                const errorData = await response.json().catch(() => ({}));
                                throw new Error(errorData.error || `Proxy error: ${response.status}`);
                            }
                            const data = await response.json();
                            setPlans(data || []);
                        } catch (err) {
                            console.error('Final Plan Fetch Error (via Proxy):', err.message);
                            // Only set error state if we have literally zero plans and first load failed
                            if (plans.length === 0) {
                                // Potentially set an error state here if UI has an ErrorBoundary
                            }
                        } finally {
                            setIsLoading(false);
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

    // NEW: Fetch trending plans dynamically to ensure fresh discovery feed
    useEffect(() => {
        const fetchTrending = async () => {
            setIsTrendingLoading(true);
            try {
                console.log('[Trending] Refreshing community favorites...');
                const response = await fetch('/api/trending-plans');
                if (response.ok) {
                    const data = await response.json();
                    // Backend already shuffles from top 100, but we can do a client-side shuffle too for extra randomness
                    const shuffled = (data || []).sort(() => Math.random() - 0.5);
                    setGlobalTrendingPlans(shuffled);
                }
            } catch (err) {
                console.error('Failed to fetch trending plans:', err);
                setGlobalTrendingPlans([]);
            } finally {
                setIsTrendingLoading(false);
            }
        };
        
        if (user) {
            fetchTrending();
        }
    }, [user]);

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
            alert('Payment Canceled.');
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
                    setFeedbackMessage(newStatus ? 'Saved to Favorites! 💖' : 'Removed from Favorites.');
                    setTimeout(() => setFeedbackMessage(''), 3000);
                    if (newStatus) {
                        setTimeout(() => setCurrentTab('favorites'), 600);
                    }
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

    const handleForkPlan = async (originalPlan, isAutomatic = false) => {
        if (!originalPlan) return null;
        if (!isAutomatic) setIsLoading(true);
        try {
            // Clone the plan but reset stats/reviews
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            const activeUser = currentUser || user; // Fallback to state user

            if (!activeUser) throw new Error('No active session found for customization');

            const firstStep = Array.isArray(originalPlan.itinerary) ? originalPlan.itinerary[0] : originalPlan.itinerary?.steps?.[0];
            const fallbackLat = originalPlan.itinerary?.metadata?.lat || firstStep?.lat;
            const fallbackLng = originalPlan.itinerary?.metadata?.lng || firstStep?.lng;

            // --- SAFE ITINERARY CLONING ---
            let newItinerary;
            if (Array.isArray(originalPlan.itinerary)) {
                newItinerary = [...originalPlan.itinerary];
            } else {
                newItinerary = {
                    ...originalPlan.itinerary,
                    metadata: {
                        ...(originalPlan.itinerary?.metadata || {}),
                        isPreviewPlan: false, // UNLOCK for the new owner
                        isPremiumGenerated: isPremium,
                        forkedFrom: originalPlan.id,
                        // SAFE STORAGE: Move top-level lat/lng (which might not exist in original) or use fallbacks
                        lat: originalPlan.lat || fallbackLat,
                        lng: originalPlan.lng || fallbackLng
                    }
                };
            }

            // --- SAFE CLONE: Only use columns known to exist in the database table ---
            const newPlan = {
                user_id: activeUser.id,
                vibe: originalPlan.vibe,
                location: originalPlan.location,
                itinerary: newItinerary,
                budget: originalPlan.budget || '$$'
            };

            console.log('[Safe Fork] Attempting insert with columns:', Object.keys(newPlan));
            const { data, error } = await supabase
                .from('plans')
                .insert([newPlan])
                .select()
                .single();

            if (error) throw error;

            setPlans(prev => [data, ...prev]);
            setSelectedPlan({ ...data, isPartiallyLocked: false });

            if (!isAutomatic) {
                setFeedbackMessage('Plan saved to your dashboard! 🚀');
                setCurrentTab('home');
                setTimeout(() => setFeedbackMessage(''), 4000);
            }
            return data;
        } catch (err) {
            console.error('Error forking plan:', err);
            setDebugError('Failed to customize plan: ' + (err.message || 'Check database schema'));
            return null;
        } finally {
            if (!isAutomatic) setIsLoading(false);
        }
    };

    const handleToggleFavorite = async (plan, e) => {
        if (e && e.stopPropagation) e.stopPropagation();

        // --- FREEMIUM WEEKLY SAVE LIMIT LOGIC ---
        if (!plan.is_favorite && !isPremium) {
            try {
                const res = await fetch('/api/increment-save-usage', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user?.id })
                });
                
                const data = await res.json();

                if (!res.ok || !data.allowed) {
                    if (res.status === 403 || data.code === 'LIMIT_REACHED' || !data.allowed) {
                        setLimitType('save_weekly');
                        setShowUpgradeModal(true);
                        return;
                    }
                }
            } catch (err) {
                console.error('Save limit check failed:', err);
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
            syncPlanState({ id: plan.id, is_favorite: newStatus });
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
        if (!ideaText.trim() || isSubmittingFeedback) return;
        setIsSubmittingFeedback(true);

        try {
            const response = await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user?.id,
                    email: user?.email,
                    text: ideaText.trim()
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || response.statusText);
            }

            setToastMessage('Thank you for your feedback! 🚀');
            setTimeout(() => setToastMessage(''), 4000);
            setIdeaText('');
            setShowIdeaModal(false);
        } catch (err) {
            console.error('Feedback Submission Error:', err);
            setToastMessage(`Submission failed: ${err.message}`);
            setTimeout(() => setToastMessage(''), 4000);
        } finally {
            setIsSubmittingFeedback(false);
        }
    };

    const handleTryPlan = async (planId) => {
        const id = typeof planId === 'object' ? planId.id : planId;
        if (!id) return;
        try {
            const response = await fetch(`/api/plans/${id}/try`, { method: 'POST' });
            if (response.ok) {
                setToastMessage('Date Sparked! Enjoy your night! 🥂');
                setTimeout(() => setToastMessage(''), 3000);
            }
        } catch (err) {
            console.error('Failed to spark date:', err);
        }
    };

    const handleBoostPlan = async (planId) => {
        const id = typeof planId === 'object' ? planId.id : planId;
        if (!id || !user?.id) return;

        const targetPlan = selectedPlan?.id === id ? selectedPlan : plans.find(p => p.id === id);
        const isBoosted = Array.isArray(targetPlan?.boosted_by) && targetPlan.boosted_by.includes(user.id);

        try {
            const response = await fetch(`/api/plans/${id}/boost`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id })
            });

            if (response.ok) {
                const data = await response.json();
                setToastMessage(isBoosted ? 'Removed from Tried' : 'Marked as Tried! ✨');
                setTimeout(() => setToastMessage(''), 2000);

                // Optimistic UI Update for toggle
                const updatedFields = {
                    boost_count: data.boost_count ?? (isBoosted ? Math.max(0, (targetPlan?.boost_count || 0) - 1) : (targetPlan?.boost_count || 0) + 1),
                    boosted_by: isBoosted
                        ? (targetPlan?.boosted_by || []).filter(uid => uid !== user.id)
                        : Array.isArray(targetPlan?.boosted_by) ? [...targetPlan.boosted_by, user.id] : [user.id]
                };

                const updatePlan = p => p.id === id ? { ...p, ...updatedFields } : p;
                setPlans(prev => prev.map(updatePlan));
                setGlobalTrendingPlans(prev => prev.map(updatePlan));
                if (selectedPlan?.id === id) {
                    setSelectedPlan(prev => ({ ...prev, ...updatedFields }));
                }
            }
        } catch (err) {
            console.error('Failed to toggle boost:', err);
        }
    };

    const handleConfirmCustomize = async () => {
        if (!selectedPlan) return;
        setIsCustomizing(true);
        try {
            console.log('[Customize] Triggering fork for plan:', selectedPlan.id);
            const newPlan = await handleForkPlan(selectedPlan, true);

            if (newPlan) {
                console.log('[Customize] Fork successful. New Plan ID:', newPlan.id);
                // Ensure UI reflects the new tab behind the modal
                setCurrentTab('home');
                setToastMessage('Plan saved to your dashboard! 🚀');
                setTimeout(() => setToastMessage(''), 4000);

                if (pendingCustomizeAction) {
                    const { idx, step } = pendingCustomizeAction;
                    console.log('[Customize] Resuming swap for step index:', idx);

                    const steps = Array.isArray(newPlan.itinerary) ? newPlan.itinerary : newPlan.itinerary?.steps || [];
                    const newStep = steps[idx] || step;

                    // Longer delay to let state settle
                    setTimeout(() => {
                        handleSwitchUp(idx, newStep, newPlan);
                    }, 800);
                }
            } else {
                console.warn('[Customize] Fork returned null. Check handleForkPlan errors.');
            }
            setShowCustomizeModal(false);
            setPendingCustomizeAction(null);
        } catch (err) {
            console.error('Customize failed in confirm handler:', err);
            alert('Something went wrong during customization. Please try again.');
        } finally {
            setIsCustomizing(false);
        }
    };

    const handleSwitchUp = async (idx, step, customPlan = null) => {
        const targetPlan = customPlan || selectedPlan;

        // --- INTERCEPT: Only owners can edit. If not owned, prompt customize ---
        if (targetPlan.user_id !== user?.id) {
            setPendingCustomizeAction({ idx, step });
            setShowCustomizeModal(true);
            return;
        }

        if (!isPremium && usage.swap >= limits.swap) {
            setLimitType('swap');
            setShowUpgradeModal(true);
            return;
        }

        setActiveSwitchIndex(idx);
        setIsSwitchingUp(true);
        setAlternatives([]);

        try {
            // --- ANCHOR LOGIC: Always base alternatives on the FIRST destination to keep the date localized ---
            const firstStep = Array.isArray(targetPlan.itinerary) ? targetPlan.itinerary[0] : targetPlan.itinerary?.steps?.[0];
            let lat = firstStep?.lat ? Number(firstStep.lat) : null;
            let lng = firstStep?.lng ? Number(firstStep.lng) : null;

            // Fallback to plan-level coordinates if first step is missing coords
            if (!lat || !lng) {
                lat = targetPlan.lat || targetPlan.itinerary?.metadata?.lat || null;
                lng = targetPlan.lng || targetPlan.itinerary?.metadata?.lng || null;
            }

            // Secondary Fallback: Use the current step's coordinates if everything else fails
            if (!lat || !lng) {
                lat = step.lat ? Number(step.lat) : null;
                lng = step.lng ? Number(step.lng) : null;
            }

            if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
                lat = 40.7128;
                lng = -74.0060;
                console.warn('[SwitchUp] Coordinates missing, defaulting to NYC Center');
            }

            // --- ROBUST CATEGORY IDENTIFICATION ---
            let swapVibe = 'interesting place';
            const activityLower = (step.activity || '').toLowerCase();
            const venueLower = (step.venue || '').toLowerCase();
            const descLower = (step.description || '').toLowerCase();

            if (activityLower.includes('dinner') || activityLower.includes('food') || activityLower.includes('restaurant') || descLower.includes('menu') || descLower.includes('dine')) {
                swapVibe = 'highly rated restaurants';
            } else if (activityLower.includes('drinks') || activityLower.includes('cocktail') || activityLower.includes('bar') || venueLower.includes('bar') || venueLower.includes('pub')) {
                swapVibe = 'popular cocktail bars and speakies';
            } else if (activityLower.includes('dessert') || activityLower.includes('treat') || activityLower.includes('bakery') || venueLower.includes('ice cream') || descLower.includes('sweet')) {
                swapVibe = 'famous dessert and pastry shops';
            } else if (activityLower.includes('walk') || activityLower.includes('stroll') || activityLower.includes('park') || descLower.includes('view') || descLower.includes('outdoor')) {
                swapVibe = 'scenic parks and public attractions';
            } else if (activityLower.includes('entertainment') || activityLower.includes('activity') || descLower.includes('fun') || descLower.includes('interactive')) {
                swapVibe = 'unique interactive experiences';
            }

            console.log(`[SwitchUp] Requesting for ${swapVibe} at (${lat}, ${lng}) with radius 12km`);

            const response = await axios.post('/api/nearby-alternatives', {
                lat,
                lng,
                type: swapVibe,
                radius: 12000,
                budget: targetPlan?.budget || '$$',
                currentPlaceId: step.placeId || '',
                userId: user?.id
            });

            if (response.data && response.data.alternatives) {
                console.log(`[SwitchUp] Success: Found ${response.data.alternatives.length} alternatives.`);
                setAlternatives(response.data.alternatives);
            } else {
                console.warn('[SwitchUp] API returned success but no alternatives array.');
                setAlternatives([]);
            }
        } catch (err) {
            console.error('[SwitchUp] Critical Failure:', err.response?.data || err.message);
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
                websiteUrl: alt.website || null, // FIX: Update the website URL for the new venue
                placeId: alt.id || originalStep.placeId,
                search_term: `${alt.name} ${alt.address}` // Update search term for UI buttons
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

            // Update local state across all lists
            syncPlanState({ id: selectedPlan.id, itinerary: updatedItinerary });

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
            const scoreA = ((a.avg_rating || 0) * 0.6) + (Math.log10((a.total_tries || 0) + 1) * 0.2) + ((a.boost_count || 0) * 0.2);
            const scoreB = ((b.avg_rating || 0) * 0.6) + (Math.log10((b.total_tries || 0) + 1) * 0.2) + ((b.boost_count || 0) * 0.2);
            return scoreB - scoreA;
        })
        .slice(0, 3);

    // ————————————————————————————————————————————————————————————————————————————————————————
    // SOCIAL HANDLERS — Boost, Like Review, Reply to Review
    // ————————————————————————————————————————————————————————————————————————————————————————


    const handleLikeReview = async (planId, reviewIndex) => {
        if (!user?.id) return;
        setLikingReview({ planId, reviewIndex });
        try {
            const res = await fetch('/api/like-review', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId, reviewIndex, userId: user.id })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            const updatePlan = p => p.id === planId ? { ...p, reviews: data.reviews } : p;
            setPlans(prev => prev.map(updatePlan));
            if (selectedPlan?.id === planId) setSelectedPlan(prev => ({ ...prev, reviews: data.reviews }));
        } catch (err) {
            console.error('[Like Review]', err);
        } finally {
            setLikingReview(null);
        }
    };

    const handlePostReply = async () => {
        if (!replyingTo || !replyText.trim() || !user?.id) return;
        setIsPostingReply(true);
        try {
            const res = await fetch('/api/reply-review', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    planId: replyingTo.planId,
                    reviewIndex: replyingTo.reviewIndex,
                    userId: user.id,
                    userInitial: user?.user_metadata?.first_name?.[0] || '?',
                    text: replyText
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            const updatePlan = p => p.id === replyingTo.planId ? { ...p, reviews: data.reviews } : p;
            setPlans(prev => prev.map(updatePlan));
            if (selectedPlan?.id === replyingTo.planId) setSelectedPlan(prev => ({ ...prev, reviews: data.reviews }));
            setReplyingTo(null);
            setReplyText('');
        } catch (err) {
            console.error('[Reply]', err);
        } finally {
            setIsPostingReply(false);
        }
    };

    const renderPlanCard = (plan, planIdx, enforceLocked = false, isCompact = false) => {
        const isPreview = plan.itinerary?.metadata?.isPreviewPlan || plan.is_preview || false;
        const isLockedPlan = enforceLocked || false; // Whole-card lock disabled for now as per "1 Full + 1 Preview" rule
        const isPartiallyLocked = !isPremium && isPreview; // Only 2nd+ plans are partially locked for free users

        const itinerarySteps = Array.isArray(plan.itinerary) ? plan.itinerary : plan.itinerary?.steps || [];
        const coverImage = itinerarySteps[0]?.photoUrl || itinerarySteps[0]?.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80';

        return (
            <div
                key={plan.id}
                className={`rounded-[2.5rem] border transition-all duration-500 group relative overflow-hidden flex-shrink-0 w-full sm:max-w-none snap-start premium-shadow premium-shadow-hover ${appTheme === 'dark'
                        ? 'border-white/10 hover:border-white/20'
                        : 'border-navy/5 shadow-sm'
                    } ${isCompact ? 'p-3' : 'p-4 sm:p-6'} ${isLockedPlan ? 'cursor-not-allowed grayscale-[0.5] opacity-80' : ''}`}
                onClick={() => {
                    if (isLockedPlan) {
                        setShowUpgradeModal(true);
                    }
                }}
            >
                {/* Cinematic Background Image */}
                <div className="absolute inset-0 z-0">
                    <img
                        src={coverImage}
                        alt="Plan Cover"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80';
                        }}
                    />
                    {/* Multi-layer Gradient Overlay for readability */}
                    <div className={`absolute inset-0 z-1 ${appTheme === 'dark'
                            ? 'bg-gradient-to-b from-navy/60 via-navy/40 to-navy/95'
                            : 'bg-gradient-to-b from-black/40 via-black/20 to-black/80'
                        }`} />
                </div>

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
                    <div className={`absolute top-4 ${isSelectMode ? 'left-12' : 'left-4'} z-30 animate-in fade-in zoom-in duration-500`}>
                        <div className="px-3 py-1 bg-white/90 backdrop-blur-md border border-coral/20 rounded-full shadow-md flex items-center gap-1.5 ring-1 ring-coral/5">
                            <span className="text-xs">{getPopularTag(plan.vibe_tags).icon}</span>
                            <span className="text-[10px] font-black text-coral uppercase tracking-tighter">{getPopularTag(plan.vibe_tags).label}</span>
                        </div>
                    </div>
                )}

                <div className="flex flex-col gap-2 sm:gap-5 mb-4 sm:mb-6 relative z-10">
                    {/* 🗓️ Planned For - TOP Minimalist Badge */}
                    <div className="flex items-center justify-between gap-4">
                        {(plan.itinerary?.metadata?.planDate || plan.created_at) && (
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl shadow-sm border backdrop-blur-md ${appTheme === 'dark' ? 'bg-white/10 border-white/10' : 'bg-black/20 border-white/20'
                                }`}>
                                <Calendar className={`w-3.5 h-3.5 ${appTheme === 'dark' ? 'text-white/60' : 'text-coral'}`} />
                                <p className={`text-[10px] font-black uppercase tracking-widest font-outfit ${appTheme === 'dark' ? 'text-white/60' : 'text-white/70'
                                    }`}>
                                    Scheduled for: <span className={appTheme === 'dark' ? 'text-white' : 'text-white'}>
                                        {new Date((plan.itinerary?.metadata?.planDate || plan.created_at) + (plan.itinerary?.metadata?.planDate ? 'T00:00:00' : '')).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()}
                                    </span>
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="space-y-1">
                        <h3 className={`text-2xl font-black leading-tight font-outfit line-clamp-2 drop-shadow-lg ${appTheme === 'dark' ? 'text-white' : 'text-white'
                            }`}>
                            {plan.vibe_variant || (plan.vibe ? plan.vibe.charAt(0).toUpperCase() + plan.vibe.slice(1).toLowerCase() + " Date" : "Perfect Date Plan")}
                        </h3>
                        <div className="flex items-center gap-3 flex-wrap">
                            <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full backdrop-blur-md border ${appTheme === 'dark' ? 'bg-white/10 border-white/10 text-white' : 'bg-black/20 border-white/20 text-white'
                                }`}>
                                <MapPin className="w-3 h-3 text-coral" /> {plan.location}
                            </div>
                            {plan.budget && (
                                <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full backdrop-blur-md border ${appTheme === 'dark' ? 'bg-white/10 border-white/10 text-white' : 'bg-black/20 border-white/20 text-white'
                                    }`}>
                                    <CreditCard className="w-3 h-3 text-emerald-400" /> {plan.budget}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {!isCompact && (
                    <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-8 relative z-10">
                        {itinerarySteps.slice(0, 2).map((step, idx) => (
                            <div key={idx} className="flex items-center gap-4 relative group/step">
                                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 border transition-all backdrop-blur-md ${appTheme === 'dark'
                                        ? 'bg-white/10 border-white/20 text-white'
                                        : 'bg-white/20 border-white/20 text-white group-hover/step:bg-white/30'
                                    }`}>
                                    <Clock className="w-4.5 h-4.5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-[14px] font-black leading-none mb-1 font-outfit drop-shadow-md ${appTheme === 'dark' ? 'text-white' : 'text-white'}`}>{step.time}</p>
                                    <p className={`text-[12px] font-bold truncate font-outfit drop-shadow-md ${appTheme === 'dark' ? 'text-white/60' : 'text-white/80'}`}>
                                        {step.activity}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {itinerarySteps.length > 2 && (
                            <div className="flex items-center gap-3 pl-15">
                                <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg backdrop-blur-md ${appTheme === 'dark' ? 'bg-white/10 text-white/50' : 'bg-white/20 text-white/80'
                                    }`}>
                                    + {itinerarySteps.length - 2} ADDED STOPS
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Modern Social Action Bar */}
                <div className={`flex items-center justify-between gap-2 py-4 mb-5 border-t relative z-10 ${appTheme === 'dark' ? 'border-white/10' : 'border-white/20'}`}>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                                <Star key={s} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                            ))}
                        </div>
                        <span className={`text-xs font-black drop-shadow-md ${appTheme === 'dark' ? 'text-white/80' : 'text-white/90'}`}>{plan.avg_rating || '4.9'}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setShareCardPlan(plan); }}
                            className={`w-9 h-9 flex items-center justify-center transition-all border rounded-xl hover:scale-110 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2 ${appTheme === 'dark'
                                    ? 'bg-coral/20 border-coral/40 text-coral hover:bg-coral/30'
                                    : 'bg-coral/10 border-coral/30 text-coral hover:bg-coral/15'
                                }`}
                            title="Share — opens beautiful share card"
                        >
                            <Share2 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={(e) => handleToggleFavorite(plan, e)}
                            title={plan.is_favorite ? "Remove from Favorites" : "Add to Favorites"}
                            className={`w-9 h-9 flex items-center justify-center transition-all border rounded-xl hover:scale-110 active:scale-95 ${appTheme === 'dark'
                                    ? 'bg-white/5 border-white/10 text-white/40 hover:text-red-500'
                                    : 'bg-white/10 border-white/20 text-white/70 hover:text-red-400 hover:border-red-400'
                                }`}
                        >
                            <Heart className={`w-4 h-4 ${plan.is_favorite ? 'fill-red-500 text-red-500' : ''}`} />
                        </button>
                        <button
                            onClick={(e) => handleDelete(plan.id, e)}
                            title="Delete this Date Plan"
                            className={`w-9 h-9 flex items-center justify-center transition-all border rounded-xl hover:scale-110 active:scale-95 ${appTheme === 'dark'
                                    ? 'bg-white/5 border-white/10 text-white/40 hover:text-red-500'
                                    : 'bg-white/10 border-white/20 text-white/70 hover:text-red-400 hover:border-red-400'
                                }`}
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>

                        <div className={`w-px h-6 mx-1 opacity-20 ${appTheme === 'dark' ? 'bg-white' : 'bg-white'}`} />

                        <button
                            onClick={(e) => { e.stopPropagation(); handleBoostPlan(plan.id); }}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-black transition-all duration-300 group/boost shadow-md active:scale-95 backdrop-blur-md ${Array.isArray(plan.boosted_by) && plan.boosted_by.includes(user?.id)
                                    ? 'bg-gradient-to-r from-orange-500 via-coral to-pink-500 text-white shadow-lg shadow-coral/30 hover:shadow-xl hover:-translate-y-0.5 border border-white/20'
                                    : appTheme === 'dark'
                                        ? 'bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10'
                                        : 'bg-black/20 border border-white/20 text-white/80 hover:text-coral hover:bg-black/40 hover:border-coral/50'
                                }`}
                        >
                            {Array.isArray(plan.boosted_by) && plan.boosted_by.includes(user?.id) ? (
                                <div className="flex items-center justify-center w-5 h-5 bg-white/20 rounded-full shadow-inner">
                                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                                </div>
                            ) : (
                                <div className={`flex items-center justify-center w-5 h-5 rounded-full transition-colors ${appTheme === 'dark' ? 'bg-white/10 group-hover/boost:bg-coral/20' : 'bg-white/10 group-hover/boost:bg-coral/30'}`}>
                                    <Flame className={`w-3 h-3 transition-colors ${appTheme === 'dark' ? 'opacity-70 group-hover/boost:opacity-100 group-hover/boost:fill-coral text-coral' : 'text-white group-hover/boost:fill-coral group-hover/boost:text-coral'}`} />
                                </div>
                            )}
                            <span className={`tracking-tight ${Array.isArray(plan.boosted_by) && plan.boosted_by.includes(user?.id) ? 'drop-shadow-sm' : ''}`}>
                                {Array.isArray(plan.boosted_by) && plan.boosted_by.includes(user?.id) ? 'We Tried This' : 'Tried It?'}
                            </span>
                            <span className={`opacity-50 font-black px-0.5 ${Array.isArray(plan.boosted_by) && plan.boosted_by.includes(user?.id) ? 'text-white/60' : ''}`}>•</span>
                            <span className={Array.isArray(plan.boosted_by) && plan.boosted_by.includes(user?.id) ? 'text-white' : ''}>{plan.boost_count || 0}</span>
                        </button>
                    </div>
                </div>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (isLockedPlan) setShowUpgradeModal(true);
                        else setSelectedPlan({ ...plan, isPartiallyLocked });
                    }}
                    className={`w-full py-4.5 text-[15px] font-black rounded-2xl transition-all active:scale-[0.98] font-outfit border flex items-center justify-center gap-3 group/btn shadow-lg relative z-10 backdrop-blur-md ${isLockedPlan
                            ? (appTheme === 'dark' ? "bg-white/5 text-white/20 border-white/5" : "bg-black/20 text-white/40 border-white/20")
                            : isPartiallyLocked
                                ? (appTheme === 'dark'
                                    ? "bg-white/10 text-white border-white/20 hover:bg-coral hover:text-white hover:border-coral"
                                    : "bg-white/20 text-white border-white/30 hover:bg-coral hover:text-white hover:border-coral")
                                : (appTheme === 'dark'
                                    ? "bg-white/10 text-white border-white/20 hover:bg-coral hover:text-white hover:border-coral"
                                    : "bg-white/20 text-white border-white/30 hover:bg-coral hover:text-white hover:border-coral")
                        }`}
                >
                    {isLockedPlan ? (
                        <><Lock className="w-4 h-4" /> Unlock Master Plan</>
                    ) : isPartiallyLocked ? (
                        <><Sparkles className="w-5 h-5 text-gold group-hover/btn:text-white" /> Preview Plan <ArrowRight className="w-4.5 h-4.5 transition-transform group-hover/btn:translate-x-1" /></>
                    ) : (
                        <>View Full Itinerary <ArrowRight className="w-4.5 h-4.5 transition-transform group-hover/btn:translate-x-1" /></>
                    )}
                </button>
            </div>
        );
    };



    const renderSparkSuggestions = () => {
        // Derive personalized prompts from user's plan history
        const activePlans = plans.filter(p => !p.deleted_at);

        const vibeFreq = {};
        const locationFreq = {};
        const budgets = new Set();

        activePlans.forEach(p => {
            if (p.vibe) vibeFreq[p.vibe] = (vibeFreq[p.vibe] || 0) + 1;
            if (p.location) {
                const city = p.location.split(',')[0].trim();
                locationFreq[city] = (locationFreq[city] || 0) + 1;
            }
            if (p.budget) budgets.add(p.budget);
        });

        const topVibe = Object.entries(vibeFreq).sort((a, b) => b[1] - a[1])[0]?.[0];
        const topLocation = Object.entries(locationFreq).sort((a, b) => b[1] - a[1])[0]?.[0];
        const topBudget = [...budgets][0];

        // Build personalized prompts
        const personalizedPrompts = [];
        if (topVibe && topLocation) personalizedPrompts.push({
            emoji: '🔁', label: `Another ${topVibe} night in ${topLocation}`,
            prompt: `Plan a ${topVibe} date night in ${topLocation}`, tag: 'Based on history', tagColor: 'bg-violet-50 text-violet-600'
        });
        if (topVibe) personalizedPrompts.push({
            emoji: '✨', label: `Surprise ${topVibe} twist`,
            prompt: `Surprise me with a unique ${topVibe} date experience`, tag: 'Your vibe', tagColor: 'bg-coral/10 text-coral'
        });
        if (topBudget) personalizedPrompts.push({
            emoji: '💸', label: `${topBudget} budget date night`,
            prompt: `Plan a creative date night with a ${topBudget} budget`, tag: 'Budget match', tagColor: 'bg-emerald-50 text-emerald-600'
        });

        // Curated fallbacks
        const fallbacks = [
            { emoji: '🌆', label: 'Rooftop jazz bar evening', prompt: 'Plan a romantic rooftop jazz bar evening for two', tag: 'Romantic', tagColor: 'bg-rose-50 text-rose-500' },
            { emoji: '🌿', label: 'Hidden garden picnic', prompt: 'Plan a cozy hidden garden picnic date', tag: 'Cozy', tagColor: 'bg-emerald-50 text-emerald-600' },
            { emoji: '🍜', label: 'Late-night food crawl', prompt: 'Plan an adventurous late-night food market crawl', tag: 'Adventurous', tagColor: 'bg-amber-50 text-amber-600' },
            { emoji: '🎨', label: 'Art gallery & wine', prompt: 'Plan a sophisticated art gallery and wine date evening', tag: 'Artsy', tagColor: 'bg-indigo-50 text-indigo-600' },
            { emoji: '🌊', label: 'Sunset waterfront stroll', prompt: 'Plan a romantic sunset waterfront walking date', tag: 'Scenic', tagColor: 'bg-blue-50 text-blue-600' },
        ];

        const suggestions = personalizedPrompts.length >= 2
            ? [...personalizedPrompts, ...fallbacks.slice(0, 3 - personalizedPrompts.length)]
            : fallbacks.slice(0, 3);

        return (
            <div className={`rounded-[2rem] p-5 shadow-xl border ${appTheme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white/80 backdrop-blur-xl border-white/30'}`}>
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-violet-500/30">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h5 className={`text-sm font-black ${appTheme === 'dark' ? 'text-white' : 'text-navy'}`}>Spark Suggestions</h5>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                {personalizedPrompts.length > 0 ? 'Personalized for you' : 'Curated picks'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-violet-50 rounded-xl border border-violet-100">
                        <Zap className="w-3 h-3 text-violet-500" />
                        <span className="text-[9px] font-black text-violet-600 uppercase tracking-wider">AI</span>
                    </div>
                </div>

                {/* Suggestion Cards */}
                <div className="space-y-2">
                    {suggestions.map((rec, i) => (
                        <button
                            key={i}
                            onClick={() => handleGeneratePlan(rec.prompt)}
                            className={`group flex items-center gap-3 w-full p-3 rounded-2xl border transition-all duration-200 active:scale-[0.98] no-underline cursor-pointer
                                ${appTheme === 'dark'
                                    ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-coral/30'
                                    : 'bg-white border-gray-100 hover:border-coral/30 hover:shadow-md'
                                }`}
                        >
                            {/* Emoji bubble */}
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg transition-transform duration-200 group-hover:scale-110
                                ${appTheme === 'dark' ? 'bg-white/10' : 'bg-gray-50'}`}>
                                {rec.emoji}
                            </div>

                            {/* Text */}
                            <div className="flex-1 min-w-0">
                                <p className={`text-[12px] font-black truncate transition-colors group-hover:text-coral ${appTheme === 'dark' ? 'text-white' : 'text-navy'}`}>
                                    {rec.label}
                                </p>
                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${rec.tagColor}`}>
                                    {rec.tag}
                                </span>
                            </div>

                            {/* Spark arrow */}
                            <div className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[9px] font-black flex-shrink-0 transition-all duration-200 group-hover:bg-coral group-hover:text-white
                                ${appTheme === 'dark' ? 'bg-white/10 text-white/50' : 'bg-gray-50 text-slate-400'}`}>
                                Spark
                                <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                            </div>
                        </button>
                    ))}
                </div>

                {/* Footer hint */}
                <p className={`mt-3 text-center text-[9px] font-bold ${appTheme === 'dark' ? 'text-white/20' : 'text-slate-300'}`}>
                    Tap any suggestion to launch Spark AI ⚡
                </p>
            </div>
        );
    };

    // --- SUB-PAGE RENDER FUNCTIONS ---

    const renderOverview = () => {
        const activePlans = plans.filter(p => !p.deleted_at);
        const recentPlan = activePlans.length
            ? activePlans.reduce((best, p) => {
                const tb = new Date(best.updated_at || best.created_at).getTime();
                const tp = new Date(p.updated_at || p.created_at).getTime();
                return tp >= tb ? p : best;
            })
            : null;

        // Usage limits
        const usageMetrics = [
            { id: 'builder', label: 'BUILDER', current: usage.classic ?? 0, limit: limits.classic ?? SERVER_DEFAULT_LIMITS.classic, color: 'bg-blue-500' },
            { id: 'ai', label: 'AI', current: usage.guided ?? 0, limit: limits.guided ?? SERVER_DEFAULT_LIMITS.guided, color: 'bg-purple-500' },
            { id: 'swaps', label: 'SWAPS', current: usage.swap ?? 0, limit: limits.swap ?? SERVER_DEFAULT_LIMITS.swap, color: 'bg-green-500' },
            { id: 'saves', label: 'FAVORITE SAVES', current: usage.save_weekly ?? 0, limit: limits.save_weekly ?? SERVER_DEFAULT_LIMITS.save_weekly, color: 'bg-orange-500' },
        ];

        return (
            <div className="animate-in fade-in duration-500 pt-4 pb-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        {/* Header Greetings */}
                        <div className="flex flex-wrap items-start justify-between gap-4 mb-6 px-4">
                            <div className="animate-in slide-in-from-bottom-2 fade-in duration-500">
                                <p className={`text-[11px] font-black uppercase tracking-widest mb-1 ${appTheme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>
                                    {(() => { const h = new Date().getHours(); return h < 12 ? '☀️ Good Morning' : h < 17 ? '🌤️ Good Afternoon' : '🌙 Good Evening'; })()}
                                </p>
                                <h1 className={`text-2xl sm:text-3xl font-black ${appTheme === 'dark' ? 'text-white' : 'text-navy'} tracking-tight`}>
                                    {profileData.first_name || user?.user_metadata?.first_name || 'You'}, ready to spark? ✨
                                </h1>
                                <p className={`text-xs font-medium ${appTheme === 'dark' ? 'text-white/50' : 'text-slate-400'} mt-1`}>
                                    Based on your history, you love <span className="font-black text-coral">cozy evening dates</span>. Here's what's next.
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Link
                                    to="/generate"
                                    className="h-9 px-4 bg-gradient-to-r from-coral to-orange-500 text-white font-black text-[11px] uppercase tracking-wider rounded-xl shadow-lg shadow-coral/20 hover:brightness-105 active:scale-95 transition-all flex items-center gap-1.5"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>New Plan</span>
                                </Link>
                                {!isPremium && (() => {
                                    const totalUsage = usageMetrics.reduce((acc, curr) => acc + (curr.current || 0), 0);
                                    const totalLimit = usageMetrics.reduce((acc, curr) => acc + (curr.limit || 1), 0);
                                    return (
                                        <div className="relative group">
                                            <button className="h-9 px-3 bg-white hover:bg-gray-50 text-navy font-black text-[11px] rounded-xl border border-gray-100 flex items-center gap-1.5 shadow-sm">
                                                <Zap className="w-3.5 h-3.5 text-coral" />
                                                <span>{totalUsage}/{totalLimit}</span>
                                            </button>
                                            <div className="absolute right-0 top-11 w-64 p-4 bg-navy text-white rounded-2xl shadow-2xl border border-white/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100]">
                                                <h5 className="text-xs font-black tracking-wide mb-3 border-b border-white/10 pb-1">Usage Summary</h5>
                                                <div className="space-y-3">
                                                    {usageMetrics.map((m) => {
                                                        const pct = Math.min(100, (m.current / m.limit) * 100);
                                                        return (
                                                            <div key={m.id} className="space-y-1">
                                                                <div className="flex justify-between text-[10px] font-bold">
                                                                    <span>{m.label}</span><span>{m.current}/{m.limit}</span>
                                                                </div>
                                                                <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                                                                    <div className={`h-full ${m.color} rounded-full`} style={{ width: `${pct}%` }} />
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>

                        {/* Main AI Interface was moved to the right sidebar under the map */}

                        {/* Smart Recommendations Section */}
                        {recommendations.length > 0 && (
                            <section className="mb-10 px-4">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="text-lg font-black text-navy font-outfit flex items-center gap-2">
                                            <Sparkles className="w-5 h-5 text-coral" />
                                            Smart Suggestions
                                        </h3>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Inspired by your taste</p>
                                    </div>
                                    <button 
                                        onClick={() => setCurrentTab('plans')}
                                        className="text-[10px] font-black text-coral hover:underline uppercase tracking-tighter"
                                    >
                                        Explore All
                                    </button>
                                </div>
                                
                                <div className="flex gap-4 overflow-x-auto pb-6 -mx-4 px-4 snap-x no-scrollbar">
                                    {recommendations.map((rec) => {
                                        // SMART IMAGE FINDER
                                        const steps = Array.isArray(rec.itinerary) ? rec.itinerary : (rec.itinerary?.steps || rec.itinerary?.schedule || rec.itinerary?.itinerary || []);
                                        const vibe = (rec.vibe || 'chill').toLowerCase();
                                        
                                        // Vibe-based Fallbacks
                                        const fallbacks = {
                                            romantic: 'https://images.unsplash.com/photo-1516589174184-c68526514ec0?w=600&q=80',
                                            chill: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80',
                                            nightlife: 'https://images.unsplash.com/photo-1514525253361-bee8d419b74e?w=600&q=80',
                                            active: 'https://images.unsplash.com/photo-1502904550040-753d5ad069de?w=600&q=80',
                                            foodie: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80'
                                        };

                                        const planImage = steps[0]?.photoUrl || steps[0]?.image || fallbacks[vibe] || fallbacks.chill;

                                        return (
                                            <div 
                                                key={rec.id}
                                                onClick={() => setSelectedPlan(rec)}
                                                className="flex-shrink-0 w-72 h-44 rounded-[2rem] relative overflow-hidden group cursor-pointer premium-shadow-hover snap-start border border-gray-100/50"
                                            >
                                                <img 
                                                    src={planImage} 
                                                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                                                    alt="Recommendation"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/20 to-transparent" />
                                                
                                                <div className="absolute bottom-4 left-5 right-5">
                                                    <div className="flex items-center gap-1.5 mb-2">
                                                        <span className="px-2 py-0.5 bg-coral/90 text-white text-[8px] font-black rounded-lg uppercase tracking-widest">
                                                            {rec.vibe || 'CHILL'}
                                                        </span>
                                                        <span className="px-2 py-0.5 bg-white/20 backdrop-blur-md text-white text-[8px] font-black rounded-lg uppercase tracking-widest border border-white/20">
                                                            {(rec.location || 'Local').split(',')[0]}
                                                        </span>
                                                    </div>
                                                    <h4 className="text-white font-black text-sm line-clamp-1 drop-shadow-md font-outfit uppercase tracking-tight">
                                                        {rec.vibe_variant || rec.title || 'Sparked Date'}
                                                    </h4>
                                                </div>
                                                
                                                <div className="absolute top-4 right-5">
                                                    <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/10">
                                                        <Flame className="w-3 h-3 text-orange-400 fill-orange-400" />
                                                        <span className="text-[10px] font-black text-white">{rec.boost_count || 0}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        )}

                        <hr className={`mx-4 border-t ${appTheme === 'dark' ? 'border-white/5' : 'border-gray-100'} mb-6`} />

                        {/* Current Plan */}
                        {recentPlan && (() => {
                            const recentPlanSteps = Array.isArray(recentPlan.itinerary) ? recentPlan.itinerary : (recentPlan.itinerary?.steps || recentPlan.itinerary?.schedule || recentPlan.itinerary?.itinerary || []);
                            
                            // SMART IMAGE FINDER for Recent Plan
                            const recentVibe = (recentPlan.vibe || 'chill').toLowerCase();
                            const fallbacks = {
                                romantic: 'https://images.unsplash.com/photo-1516589174184-c68526514ec0?w=800&q=80',
                                chill: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
                                nightlife: 'https://images.unsplash.com/photo-1514525253361-bee8d419b74e?w=800&q=80',
                                active: 'https://images.unsplash.com/photo-1502904550040-753d5ad069de?w=800&q=80',
                                foodie: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80'
                            };

                            const recentPlanImage = recentPlanSteps[0]?.photoUrl || recentPlanSteps[0]?.image || fallbacks[recentVibe] || fallbacks.chill;
                            const planDate = new Date((recentPlan.itinerary?.metadata?.planDate || recentPlan.created_at) + (recentPlan.itinerary?.metadata?.planDate ? 'T00:00:00' : '')).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();
                            const visibleStops = recentPlanSteps.slice(0, 2);
                            const extraStops = Math.max(0, recentPlanSteps.length - 2);
                            const planCost = recentPlan.itinerary?.metadata?.estimatedCost || recentPlan.estimated_cost;
                            const planRating = parseFloat(recentPlan.avg_rating || 4.9).toFixed(1);

                            return (
                                <div className="px-4 mb-6">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className={`text-sm font-black uppercase tracking-widest ${appTheme === 'dark' ? 'text-white/50' : 'text-slate-400'}`}>Continue Planning</h3>
                                        <button onClick={() => setCurrentTab('plans')} className="text-xs font-black text-coral hover:opacity-80">View all</button>
                                    </div>

                                    {/* Premium tall card matching reference design */}
                                    <div
                                        className="w-full rounded-3xl relative overflow-hidden cursor-pointer active:scale-[0.99] transition-all shadow-2xl group"
                                        style={{ minHeight: '420px' }}
                                        onClick={() => setSelectedPlan(recentPlan)}
                                    >
                                        {/* Background image */}
                                        <div
                                            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                                            style={{ backgroundImage: `url('${recentPlanImage}')` }}
                                        />
                                        {/* Gradient overlay — stronger at top and bottom */}
                                        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/80" />

                                        {/* Content layers */}
                                        <div className="relative z-10 flex flex-col h-full p-5" style={{ minHeight: '420px' }}>

                                            {/* TOP: Scheduled date badge */}
                                            <div className="flex items-center gap-2 mb-4">
                                                <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full">
                                                    <Calendar className="w-3 h-3 text-coral" />
                                                    <span className="text-[10px] font-black text-white/80 uppercase tracking-widest">
                                                        Scheduled for: <span className="text-white">{planDate}</span>
                                                    </span>
                                                </div>
                                            </div>

                                            {/* TITLE */}
                                            <h4 className="text-white text-[22px] font-black leading-tight drop-shadow-lg mb-3 max-w-[85%]">
                                                {recentPlan.vibe_variant || (recentPlan.vibe ? (recentPlan.vibe.toLowerCase().startsWith('a curated') ? recentPlan.vibe : `A curated ${recentPlan.vibe.toLowerCase()} Date`) : 'Custom Date Experience')}
                                            </h4>

                                            {/* LOCATION + COST PILLS */}
                                            <div className="flex items-center gap-2 mb-5 flex-wrap">
                                                <div className="flex items-center gap-1 bg-black/30 backdrop-blur-sm border border-white/15 px-3 py-1.5 rounded-full">
                                                    <MapPin className="w-3 h-3 text-coral" />
                                                    <span className="text-[11px] font-black text-white uppercase tracking-wide">{(recentPlan.location || 'NYC').split(',')[0]}</span>
                                                </div>
                                                {planCost && (
                                                    <div className="flex items-center gap-1 bg-emerald-500/20 backdrop-blur-sm border border-emerald-400/30 px-3 py-1.5 rounded-full">
                                                        <span className="text-[11px] font-black text-emerald-300">${planCost}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* ITINERARY STOPS */}
                                            <div className="flex flex-col gap-2.5 mb-4">
                                                {visibleStops.map((step, idx) => (
                                                    <div key={idx} className="flex items-center gap-3">
                                                        <div className="w-9 h-9 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                                            <Clock className="w-4 h-4 text-white/80" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-white text-sm font-black leading-none">
                                                                {step.time || (idx === 0 ? '6:00 PM' : '7:45 PM')}
                                                            </p>
                                                            <p className="text-white/60 text-[11px] font-medium mt-0.5 truncate">
                                                                {step.venue || step.activity || 'Venue stop'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                                {extraStops > 0 && (
                                                    <div className="flex items-center">
                                                        <span className="text-[11px] font-black text-white/70 bg-white/10 backdrop-blur-sm border border-white/20 px-3 py-1.5 rounded-full uppercase tracking-widest">
                                                            + {extraStops} Added Stop{extraStops > 1 ? 's' : ''}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* BOTTOM: rating + action icons + tried it */}
                                            <div className="mt-auto">
                                                <div className="flex items-center justify-between mb-4">
                                                    {/* Stars + rating */}
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex items-center gap-0.5">
                                                            {[1, 2, 3, 4, 5].map(i => (
                                                                <Star key={i} className={`w-4 h-4 ${i <= Math.round(parseFloat(planRating)) ? 'fill-yellow-400 text-yellow-400' : 'text-white/20'}`} />
                                                            ))}
                                                        </div>
                                                        <span className="text-white font-black text-sm">{planRating}</span>
                                                    </div>

                                                    {/* Action icons + Tried It */}
                                                    <div className="flex items-center gap-2">
                                                        {/* Share */}
                                                        <button
                                                            onClick={e => { e.stopPropagation(); handleShare(recentPlan); }}
                                                            className="w-9 h-9 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl flex items-center justify-center hover:bg-coral/30 hover:border-coral/40 active:scale-90 transition-all"
                                                            title="Share plan"
                                                        >
                                                            <Share2 className="w-4 h-4 text-white/80" />
                                                        </button>
                                                        {/* Favorite */}
                                                        <button
                                                            onClick={e => { e.stopPropagation(); handleToggleFavorite(recentPlan, e); }}
                                                            className={`w-9 h-9 backdrop-blur-md border rounded-xl flex items-center justify-center active:scale-90 transition-all ${
                                                                recentPlan.is_favorite
                                                                    ? 'bg-red-500/30 border-red-400/50 hover:bg-red-500/40'
                                                                    : 'bg-white/10 border-white/20 hover:bg-red-500/20 hover:border-red-400/40'
                                                            }`}
                                                            title={recentPlan.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                                                        >
                                                            <Heart className={`w-4 h-4 ${recentPlan.is_favorite ? 'fill-red-400 text-red-400' : 'text-white/80'}`} />
                                                        </button>
                                                        {/* Delete */}
                                                        <button
                                                            onClick={e => { e.stopPropagation(); setConfirmModal({ isOpen: true, plan: recentPlan, type: 'trash', isBatch: false }); }}
                                                            className="w-9 h-9 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl flex items-center justify-center hover:bg-red-500/40 hover:border-red-400/50 active:scale-90 transition-all"
                                                            title="Delete plan"
                                                        >
                                                            <Trash2 className="w-4 h-4 text-white/80" />
                                                        </button>
                                                        {/* Tried It / Boost */}
                                                        <button
                                                            onClick={e => { e.stopPropagation(); handleBoostPlan(recentPlan.id); }}
                                                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl backdrop-blur-md border active:scale-95 transition-all ${
                                                                Array.isArray(recentPlan.boosted_by) && recentPlan.boosted_by.includes(user?.id)
                                                                    ? 'bg-gradient-to-r from-orange-500 via-coral to-pink-500 border-white/20 text-white shadow-lg shadow-coral/30'
                                                                    : 'bg-white/10 border-white/20 hover:bg-white/20'
                                                            }`}
                                                            title="Mark as tried"
                                                        >
                                                            <Flame className={`w-3.5 h-3.5 ${Array.isArray(recentPlan.boosted_by) && recentPlan.boosted_by.includes(user?.id) ? 'fill-white text-white' : 'text-coral'}`} />
                                                            <span className="text-[10px] font-black text-white">
                                                                {Array.isArray(recentPlan.boosted_by) && recentPlan.boosted_by.includes(user?.id) ? 'We Tried!' : 'Tried It?'}
                                                            </span>
                                                            <span className="text-white/40 text-[9px] font-black">•</span>
                                                            <span className="text-[10px] font-black text-white">{recentPlan.boost_count || 0}</span>
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* CTA Button */}
                                                <button
                                                    onClick={e => { e.stopPropagation(); setSelectedPlan(recentPlan); }}
                                                    className="w-full py-4 bg-gradient-to-r from-coral to-orange-500 hover:brightness-110 active:scale-[0.98] rounded-2xl text-white font-black text-base shadow-2xl shadow-coral/30 flex items-center justify-center gap-2 transition-all"
                                                >
                                                    View Full Itinerary <ArrowRight className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}

                        <hr className={`mx-4 border-t ${appTheme === 'dark' ? 'border-white/5' : 'border-gray-100'} mb-6`} />

                        {/* Your Date Plans */}
                        <div className="px-4 mb-8">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className={`text-sm font-black uppercase tracking-widest ${appTheme === 'dark' ? 'text-white/50' : 'text-slate-400'}`}>Your Plans</h3>
                                <button onClick={() => setCurrentTab('plans')} className="text-xs font-black text-coral hover:opacity-80">View all</button>
                            </div>

                            {isLoading ? (
                                <div className="flex gap-3 px-4 pb-4 overflow-hidden">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="flex-shrink-0 w-44 h-44 rounded-2xl bg-gray-200 animate-pulse" />
                                    ))}
                                </div>
                            ) : plans.filter(p => !p.deleted_at && !p.is_favorite).length === 0 ? (
                                <div className={`flex flex-col items-center justify-center py-12 px-6 rounded-2xl border border-dashed ${appTheme === 'dark' ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50/50'}`}>
                                    <div className="w-14 h-14 bg-coral/10 rounded-2xl flex items-center justify-center mb-4">
                                        <Sparkles className="w-7 h-7 text-coral" />
                                    </div>
                                    <h4 className={`text-sm font-black mb-1 ${appTheme === 'dark' ? 'text-white' : 'text-navy'}`}>No plans yet</h4>
                                    <p className="text-xs text-slate-400 font-medium text-center mb-4">Start crafting your first unforgettable date experience.</p>
                                    <button onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="no-underline px-5 py-2.5 bg-gradient-to-r from-coral to-orange-500 rounded-xl text-white text-xs font-black shadow-lg shadow-coral/25 hover:brightness-105 active:scale-95 transition-all flex items-center gap-2">
                                        <Plus className="w-3.5 h-3.5" /> Create First Plan
                                    </button>
                                </div>
                            ) : (
                                <div className="flex overflow-x-auto gap-3 px-4 md:px-0 pb-4 snap-x snap-mandatory scrollbar-hide">
                                    {plans
                                        .filter(p => !p.deleted_at && !p.is_favorite)
                                        .slice(0, 12)
                                        .map((plan, idx) => {
                                            const planSteps = Array.isArray(plan.itinerary) ? plan.itinerary : plan.itinerary?.steps || [];
                                            const planImage = planSteps[0]?.photoUrl || planSteps[0]?.image || 'https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=600';
                                            const planDateStr = new Date((plan.itinerary?.metadata?.planDate || plan.created_at) + (plan.itinerary?.metadata?.planDate ? 'T00:00:00' : '')).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
                                            const planRating = plan.avg_rating || '4.9';

                                            const handleSharePlan = async (e) => {
                                                e.stopPropagation();
                                                const shareUrl = `${window.location.origin}/shared/${plan.id}`;
                                                if (navigator.share) {
                                                    try { await navigator.share({ title: 'Check out my DateSpark plan!', url: shareUrl }); } catch (_) { }
                                                } else {
                                                    navigator.clipboard.writeText(shareUrl);
                                                    setToastMessage('Link copied to clipboard! 🔗');
                                                    setTimeout(() => setToastMessage(''), 3000);
                                                }
                                            };

                                            return (
                                                <div
                                                    key={plan.id || idx}
                                                    className="snap-start flex-shrink-0 w-44 h-44 rounded-2xl bg-cover bg-center relative overflow-hidden group cursor-pointer active:scale-95 transition-all shadow-md"
                                                    style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.15), rgba(0,0,0,0.75)), url('${planImage}')` }}
                                                    onClick={() => setSelectedPlan(plan)}
                                                >
                                                    {/* Top-left: Share + Delete — visible on hover */}
                                                    <div className="absolute top-2 left-2 flex items-center gap-1.5 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                        <button
                                                            onClick={handleSharePlan}
                                                            className="w-7 h-7 bg-black/40 backdrop-blur-md border border-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 active:scale-90 transition-all"
                                                            title="Share"
                                                        >
                                                            <Share2 className="w-3 h-3 text-white" />
                                                        </button>
                                                        <button
                                                            onClick={e => { e.stopPropagation(); setConfirmModal({ isOpen: true, plan, type: 'trash', isBatch: false }); }}
                                                            className="w-7 h-7 bg-black/40 backdrop-blur-md border border-white/20 rounded-lg flex items-center justify-center hover:bg-red-500/70 active:scale-90 transition-all"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-3 h-3 text-white" />
                                                        </button>
                                                    </div>

                                                    {/* Top-right: Rating */}
                                                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/30 backdrop-blur-md border border-white/20 px-2 py-1 rounded-xl text-white z-10">
                                                        <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
                                                        <span className="text-[9px] font-black">{planRating}</span>
                                                    </div>

                                                    {/* Hover: View overlay */}
                                                    <div className="absolute inset-0 bg-coral/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 z-20">
                                                        <span className="text-white font-black text-sm flex items-center gap-1.5">View <ChevronRight className="w-4 h-4" /></span>
                                                    </div>

                                                    {/* Bottom info */}
                                                    <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
                                                        <h4 className="text-white text-xs font-black leading-tight truncate drop-shadow-md">
                                                            {plan.vibe ? plan.vibe.charAt(0).toUpperCase() + plan.vibe.slice(1).toLowerCase() + ' Date' : 'Custom Date'}
                                                        </h4>
                                                        <div className="flex items-center gap-1.5 mt-1">
                                                            <span className="text-white/70 text-[9px] font-bold flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5 text-coral/80" />{(plan.location || 'NYC').split(',')[0]}</span>
                                                            <span className="text-white/50 text-[9px]">·</span>
                                                            <span className="text-white/70 text-[9px] font-bold">{planDateStr}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            )}
                        </div>

                        {/* Mobile-only Parity: AI Copilot, Maps & AI Suggestions */}
                        <div className="lg:hidden flex flex-col gap-6 px-4 pb-10">


                            {/* AI Suggestions (Personalized) */}
                            {renderSparkSuggestions()}

                            {/* Map View */}
                            <div className="relative">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-black text-navy font-outfit flex items-center gap-2">
                                        <MapPin className="w-5 h-5 text-coral" />
                                        Explore Nearby
                                    </h3>
                                    <button 
                                        onClick={() => setCurrentTab('events')}
                                        className="text-[10px] font-black text-coral hover:underline uppercase tracking-widest"
                                    >
                                        View All Events
                                    </button>
                                </div>
                                <NearbyMapWidget
                                    globalTrendingPlans={globalTrendingPlans}
                                    isLoaded={isLoaded}
                                    onFindEvents={() => setCurrentTab('events')}
                                />
                            </div>

                            {/* Spark AI UI (DateArchitectChat) under the Map for Mobile */}
                            <div className="bg-white rounded-xl border border-orange-100/60 p-1.5 shadow-[0_8px_30px_rgba(255,127,80,0.04)]">
                                <DateArchitectChat
                                    userId={user?.id}
                                    onConceptSelected={(concept, settings) => {
                                        handleGeneratePlan(`${concept.title}. ${concept.description}`, settings);
                                    }}
                                    onSettingsChange={() => {}}
                                    onPlanSaved={(savedPlan) => {
                                        setPlans(prev => [savedPlan, ...prev]);
                                        setSelectedPlan(savedPlan);
                                        setToastMessage('Sparked a new date! ⚡');
                                    }}
                                />
                            </div>
                        </div>

                    </div> {/* End of lg:col-span-2 */}

                    {/* Right Sidebar — AI Copilot */}
                    <div className="hidden lg:flex flex-col gap-5">

                        {/* Profile + Streak compact */}
                        <div className="bg-white/70 backdrop-blur-xl border border-white/30 rounded-[2rem] p-5 shadow-xl flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-coral/20 shadow-md flex-shrink-0">
                                <img
                                    src={profileData.avatar_url || user?.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300'}
                                    alt="avatar"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="min-w-0">
                                <h4 className="text-base font-black text-navy truncate">{profileData.first_name || user?.user_metadata?.first_name || 'You'}</h4>
                                <p className="text-[10px] text-slate-400 font-bold">{isPremium ? '✨ Premium Spark' : 'Free Tier'}</p>
                            </div>
                            <span className="ml-auto flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-orange-500 to-amber-400 rounded-xl text-[10px] font-black text-white shadow-md flex-shrink-0">
                                🔥 7
                            </span>
                        </div>



                        {/* ── SPARK SUGGESTIONS — AI Prompt Recommender ── */}
                        {renderSparkSuggestions()}




                        {/* Live Location Map Widget */}
                        <NearbyMapWidget
                            globalTrendingPlans={globalTrendingPlans}
                            isLoaded={isLoaded}
                            onFindEvents={() => setCurrentTab('events')}
                        />

                        {/* Spark AI UI (DateArchitectChat) under the Map for Desktop */}
                        <div className="bg-white rounded-xl border border-orange-100/60 p-1.5 shadow-[0_8px_30px_rgba(255,127,80,0.04)]">
                            <DateArchitectChat
                                userId={user?.id}
                                onConceptSelected={(concept, settings) => {
                                    handleGeneratePlan(`${concept.title}. ${concept.description}`, settings);
                                }}
                                onSettingsChange={() => {}}
                                onPlanSaved={(savedPlan) => {
                                    setPlans(prev => [savedPlan, ...prev]);
                                    setSelectedPlan(savedPlan);
                                    setToastMessage('Sparked a new date! ⚡');
                                }}
                            />
                        </div>

                    </div> {/* End of Right Sidebar */}
                </div> {/* End of grid-cols-3 */}

                {/* Community Trending */}
                {globalTrendingPlans.length > 0 && (() => {
                    // Smarter City Extraction Helper
                    const getCity = (loc) => {
                        if (!loc) return 'NYC';
                        const parts = loc.split(',').map(p => p.trim());
                        // 1. If "Venue, Borough/City, State" (3 parts), return parts[1]
                        // 2. If "Borough/City, State" (2 parts), return parts[0]
                        // 3. Fallback to just the first part normalized
                        if (parts.length >= 3) return parts[1];
                        if (parts.length === 2) return parts[0];
                        return parts[0] || 'NYC';
                    };

                    return (
                        <div className="pt-8">
                            <div className="flex items-center justify-between mb-8 px-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-coral/10 rounded-2xl flex items-center justify-center text-coral shadow-inner">
                                        <Sparkles className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className={`text-2xl font-black tracking-tight ${appTheme === 'dark' ? 'text-white' : 'text-navy'
                                            }`}>Trending Spots Now</h3>
                                        <p className={`${appTheme === 'dark' ? 'text-white/40' : 'text-navy/60'} text-sm font-medium`}>Community ideas from other couples — preview here, or save from Discovery.</p>
                                    </div>
                                </div>
                                <button onClick={() => setCurrentTab('events')} className="hidden sm:flex items-center gap-2 px-4 py-2 bg-navy text-white rounded-xl text-xs font-bold hover:bg-navy/90 transition-all">
                                    See Events <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="flex overflow-x-auto gap-4 md:gap-8 px-4 md:px-0 pb-10 snap-x snap-mandatory scrollbar-hide">
                                {globalTrendingPlans
                                    .sort((a, b) => (b.boost_count || 0) - (a.boost_count || 0))
                                    .slice(0, 20) // Deep Discovery
                                    .map((plan, idx) => {
                                        const planCity = getCity(plan.location);
                                        return (
                                            <div key={plan.id || idx} className="snap-start">
                                                <VisualSparkCard
                                                    plan={plan}
                                                    onView={setSelectedPlan}
                                                    theme={appTheme}
                                                    isTopInBorough={idx === 0}
                                                    boroughName={planCity}
                                                />
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    );
                })()}
            </div>
        );
    };

    const renderMyPlans = () => (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="px-4">
                <button
                    onClick={() => setCurrentTab('home')}
                    className="flex items-center gap-2 text-xs font-black text-gray-400 hover:text-coral transition-colors uppercase tracking-widest mb-4 group"
                >
                    <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                    Back to Overview
                </button>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4">
                <div>
                    <h2 className="text-2xl font-black text-navy tracking-tight">Your Date Schedule</h2>
                    <p className="text-gray-500 text-sm font-medium mt-1">Manage all your generated and saved itineraries.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            setIsSelectMode(!isSelectMode);
                            setSelectedPlanIds([]);
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all border ${isSelectMode ? 'bg-navy text-white border-navy' : 'bg-white text-navy border-gray-200 hover:border-coral hover:text-coral'}`}
                    >
                        {isSelectMode ? 'Cancel' : 'Select'}
                    </button>
                    <div className="flex bg-gray-200/40 p-1 rounded-2xl border border-gray-100">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${activeTab === 'all' ? 'bg-white text-navy shadow-sm' : 'text-gray-500 hover:text-navy'}`}
                        >
                            All Plans
                        </button>
                        <button
                            onClick={() => setActiveTab('favorites')}
                            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${activeTab === 'favorites' ? 'bg-white text-coral shadow-sm' : 'text-gray-500 hover:text-navy'}`}
                        >
                            Favorites
                        </button>
                    </div>
                </div>
            </div>

            {plans.length === 0 ? (
                <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center shadow-sm max-w-lg mx-auto">
                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Calendar className="w-8 h-8 text-gray-300" />
                    </div>
                    <h3 className="text-xl font-bold text-navy mb-2">No plans yet</h3>
                    <p className="text-navy/60 mb-6">Start planning your first unforgettable date tonight.</p>
                    <button onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="inline-flex items-center gap-2 px-8 py-3 bg-navy text-white font-bold rounded-xl hover:bg-navy/90 transition-all">
                        <Plus className="w-4 h-4" /> Create First Plan
                    </button>
                </div>
            ) : (
                <div className="flex flex-row overflow-x-auto snap-x snap-mandatory gap-5 scrollbar-hide pb-4 px-4 md:px-0">
                    {(activeTab === 'favorites' ? plans.filter(p => p.is_favorite) : plans.filter(p => !p.is_favorite))
                        .filter(p => !p.deleted_at)
                        .map((plan, idx) => (
                            <div key={plan.id} className="flex-shrink-0 w-[85vw] sm:w-[400px] snap-center">
                                {renderPlanCard(plan, idx, false)}
                            </div>
                        ))}
                </div>
            )}
        </div>
    );



    const renderAccount = () => {

        const renderBackHeader = (title) => (
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => setAccountSubView('menu')}
                    className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-navy hover:bg-gray-50 transition-all shadow-sm group"
                >
                    <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                </button>
                <h2 className="text-2xl font-black text-navy tracking-tight">{title}</h2>
            </div>
        );

        if (accountSubView === 'personal') {
            return (
                <div className="animate-in slide-in-from-right-4 duration-300 max-w-2xl mx-auto pb-20 px-4">
                    {renderBackHeader('Personal Information')}

                    <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm space-y-8">
                        <div className="flex flex-col items-center gap-4 py-4">
                            <div className="relative group">
                                {user?.user_metadata?.avatar_url ? (
                                    <img src={user.user_metadata.avatar_url} className="w-28 h-28 rounded-3xl object-cover shadow-xl border-4 border-white" alt="Profile" />
                                ) : (
                                    <div className="w-28 h-28 rounded-3xl bg-navy text-white flex items-center justify-center text-3xl font-black shadow-lg">
                                        {user?.user_metadata?.first_name?.[0] || 'K'}
                                    </div>
                                )}
                                <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-coral text-white rounded-xl shadow-xl flex items-center justify-center cursor-pointer hover:bg-coral/90 transition-all border-2 border-white group-hover:scale-110 active:scale-95">
                                    {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                                    <input type="file" className="hidden" onChange={handleAvatarUpload} accept="image/*" disabled={isUploading} />
                                </label>
                            </div>
                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Update Profile Photo</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[10px] font-black text-navy/40 uppercase tracking-widest mb-2 px-1">First Name</label>
                                <input
                                    type="text"
                                    value={profileData.first_name}
                                    onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
                                    className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-coral focus:bg-white rounded-2xl outline-none font-bold text-navy transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-navy/40 uppercase tracking-widest mb-2 px-1">Last Name</label>
                                <input
                                    type="text"
                                    value={profileData.last_name}
                                    onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })}
                                    className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-coral focus:bg-white rounded-2xl outline-none font-bold text-navy transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-navy/40 uppercase tracking-widest mb-2 px-1">Email Address</label>
                            <input
                                type="email"
                                value={profileData.email}
                                disabled
                                className="w-full px-5 py-4 bg-gray-50/50 border-2 border-transparent rounded-2xl font-bold text-navy/40 cursor-not-allowed"
                            />
                            <p className="text-[10px] text-navy/30 mt-2 px-1 italic">Email cannot be changed directly for security.</p>
                        </div>
                        <div className="pt-4">
                            <button
                                onClick={handleUpdateProfile}
                                disabled={isSavingProfile}
                                className="w-full py-4 bg-navy text-white font-black rounded-2xl hover:bg-navy/90 active:scale-[0.98] transition-all shadow-xl shadow-navy/20 flex items-center justify-center gap-2"
                            >
                                {isSavingProfile ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        if (accountSubView === 'billing') {
            return (
                <div className="animate-in slide-in-from-right-4 duration-300 max-w-2xl mx-auto pb-20 px-4">
                    {renderBackHeader('Membership & Billing')}
                    <div className={`p-8 rounded-[2.5rem] border-2 transition-all ${isPremium ? 'border-coral/20 bg-coral/5 shadow-xl shadow-coral/5' : 'border-gray-100 bg-white shadow-sm'}`}>
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-lg ${isPremium ? 'bg-navy text-white' : 'bg-gray-100 text-gray-300'}`}>
                                    {isPremium ? <Heart className="w-8 h-8 fill-coral text-coral" /> : <div className="text-2xl font-black italic">F</div>}
                                </div>
                                <div>
                                    <h4 className="text-xl font-black text-navy">{isPremium ? 'DateSpark Premium' : 'Free Spark Plan'}</h4>
                                    <p className="text-navy/40 font-bold text-xs">{isPremium ? 'Unlimited access enabled' : 'Limited itinerary generation'}</p>
                                </div>
                            </div>
                            {!isPremium && <span className="bg-coral text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse shadow-lg shadow-coral/30">Upgrade</span>}
                        </div>

                        <div className="space-y-4 mb-8">
                            {(isPremium ? [
                                "Access to everything in 24h Pass",
                                "Unlock Secret & Hidden Gem Venues",
                                "Early access to new features",
                                "Priority Support"
                            ] : [
                                "Limited Date Generations / 24hr",
                                "Limited 'Swap Spots' / 24hr",
                                "Limited Venue Access",
                                "Access to Trending Spots",
                                "Public Date Spark Browsing"
                            ]).map((f, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${isPremium ? 'bg-navy' : 'bg-gray-100'}`}>
                                        <Check className={`w-3.5 h-3.5 ${isPremium ? 'text-coral' : 'text-gray-400'}`} />
                                    </div>
                                    <span className="text-sm font-bold text-navy/80">{f}</span>
                                </div>
                            ))}
                        </div>

                        {isPremium ? (
                            <div className="pt-8 border-t border-coral/10 mt-4">
                                <div className="space-y-3">
                                    <button
                                        onClick={handleManageSubscription}
                                        className="w-full py-4 bg-gray-50 text-gray-500 font-black text-xs uppercase tracking-widest hover:bg-navy hover:text-white rounded-2xl transition-all flex items-center justify-center gap-2 border border-gray-100 shadow-sm"
                                    >
                                        <CreditCard className="w-4 h-4 opacity-70" />
                                        Manage Subscription & Billing
                                    </button>

                                </div>
                                <p className="text-[9px] text-gray-400 font-medium text-center mt-3 px-4 italic leading-relaxed">
                                    Manage payment methods or cancel your subscription securely via our partner, Stripe.
                                </p>
                            </div>
                        ) : (
                            <button onClick={() => setShowUpgradeModal(true)} className="w-full py-4 bg-coral text-white font-black rounded-2xl hover:bg-coral/90 transition-all shadow-xl shadow-coral/20 flex items-center justify-center gap-2">
                                Unlock Premium Mastery
                            </button>
                        )}
                    </div>
                </div>
            );
        }

        if (accountSubView === 'trash') {
            const trashedPlans = plans.filter(p => p.deleted_at);
            return (
                <div className="animate-in slide-in-from-right-4 duration-300 max-w-2xl mx-auto pb-20 px-4">
                    {renderBackHeader('Recycle Bin')}
                    <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
                        <p className="text-gray-500 text-sm font-medium mb-8 text-center bg-gray-50 py-3 rounded-xl border border-gray-100 italic px-4">
                            Favorited plans you delete are kept here for 7 days before being permanently removed.
                        </p>

                        {trashedPlans.length === 0 ? (
                            <div className="py-20 text-center">
                                <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-4 text-gray-200">
                                    <Trash2 className="w-10 h-10" />
                                </div>
                                <p className="text-gray-400 font-bold">Trash is empty</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {trashedPlans.map(plan => (
                                    <div key={plan.id} className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 flex items-center justify-between group hover:border-coral/20 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-navy font-black text-xs border border-gray-100 shadow-sm">
                                                {plan.location?.slice(0, 3).toUpperCase() || 'LOC'}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-navy text-sm">{plan.vibe} Date</h4>
                                                <p className="text-[10px] text-gray-400 font-medium">Deleted on {new Date(plan.deleted_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={(e) => handleRestorePlan(plan.id, e)} className="px-4 py-2 bg-white text-green-600 text-[10px] font-black rounded-xl border border-gray-100 hover:bg-green-600 hover:text-white transition-all shadow-sm">Restore</button>
                                            <button onClick={(e) => handleDelete(plan.id, e)} className="px-4 py-2 bg-white text-red-600 text-[10px] font-black rounded-xl border border-gray-100 hover:bg-red-600 hover:text-white transition-all shadow-sm">Delete</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        if (accountSubView === 'preferences') {
            const themes = [
                { id: 'light', name: 'Classic (Light)', desc: 'The original clean experience', colors: 'from-blue-50 to-white' },
                { id: 'dark', name: 'Midnight (Dark)', desc: 'Deep ocean blues for night planning', colors: 'from-navy to-black' },
                { id: 'sunset', name: 'Golden Hour (Warm)', desc: 'Warm palettes for romantic vibes', colors: 'from-orange-100 to-pink-50' }
            ];

            return (
                <div className="animate-in slide-in-from-right-4 duration-300 max-w-2xl mx-auto pb-20 px-4">
                    {renderBackHeader('App Appearance')}

                    <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm space-y-10">
                        <div className="space-y-6">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Active Visual Theme</label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {themes.map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => setAppTheme(t.id)}
                                        className={`p-6 rounded-3xl border-2 transition-all text-left relative overflow-hidden group ${appTheme === t.id ? 'border-coral shadow-lg shadow-coral/10' : 'border-gray-50 hover:border-gray-200'}`}
                                    >
                                        <div className={`h-12 w-full bg-gradient-to-br ${t.colors} rounded-xl mb-4 border border-black/5`} />
                                        <h4 className={`text-sm font-black ${appTheme === t.id ? 'text-coral' : 'text-navy'}`}>{t.name}</h4>
                                        <p className="text-[10px] text-gray-400 font-bold mt-1 leading-tight">{t.desc}</p>

                                        {appTheme === t.id && (
                                            <div className="absolute top-3 right-3 w-5 h-5 bg-coral rounded-full flex items-center justify-center">
                                                <Check className="w-3 h-3 text-white" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <p className="text-[10px] text-gray-400 font-medium leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">
                            Custom themes are saved locally to your device. Cloud sync for preferences is coming in a future update!
                        </p>
                    </div>
                </div>
            );
        }



        return (
            <div className="max-w-2xl mx-auto pb-20 px-4 animate-in fade-in duration-500">
                {/* Header matching requested style */}
                <div className="flex items-center justify-between mb-12 pt-4">
                    <h2 className="text-3xl font-black text-navy tracking-tight">Settings</h2>
                    <button
                        onClick={() => setCurrentTab('home')}
                        className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-navy transition-all border border-gray-100 shadow-sm"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Simplified Menu List */}
                <div className="space-y-2 mb-12">
                    {[
                        { id: 'personal', label: 'Profile', icon: User },
                        { id: 'billing', label: 'Subscription', icon: CreditCard },
                        { id: 'preferences', label: 'Preferences', icon: Bell },
                        { id: 'trash', label: 'Trash Bin', icon: Trash2 }
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setAccountSubView(item.id)}
                            className="w-full flex items-center gap-6 p-5 hover:bg-gray-50 rounded-3xl transition-all group"
                        >
                            <item.icon className="w-6 h-6 text-gray-300 group-hover:text-navy transition-colors" />
                            <span className="text-lg font-black text-gray-500 group-hover:text-navy transition-colors">{item.label}</span>
                        </button>
                    ))}
                </div>

                {/* Referral Loop Section - Compact Dashboard Move */}
                <div className="bg-gradient-to-br from-navy to-navy/90 rounded-3xl border border-white/5 p-5 sm:p-6 text-center shadow-xl shadow-navy/20 mb-8 relative overflow-hidden group">
                    <div className="absolute -right-8 -top-8 w-24 h-24 bg-coral/10 rounded-full blur-2xl animate-pulse" />
                    <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-coral to-pink-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-coral/30 rotate-3 group-hover:rotate-0 transition-transform">
                            <Gift className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 text-left">
                            <h3 className="text-base font-black text-white tracking-tight">Give 7, Get 7 💖</h3>
                            <p className="text-white/50 text-[10px] font-medium leading-relaxed max-w-[180px]">
                                Share DateSpark and unlock **7 Days of Plus** free!
                            </p>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-3 border border-white/10 flex items-center gap-3 bg-navy/40 shadow-inner group-hover:border-coral/20 transition-all flex-1 sm:flex-none">
                                <span className="font-mono font-black text-sm text-coral tracking-widest uppercase">{referralDetails.code || 'SPARK-REF'}</span>
                            </div>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(`${window.location.origin}/signup?ref=${referralDetails.code}`);
                                    setCopied(true);
                                    setTimeout(() => setCopied(false), 2000);
                                }}
                                className="w-11 h-11 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-xl transition-all text-white/60 hover:text-white border border-white/5"
                                title="Copy Link"
                            >
                                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                            </button>
                            <button
                                onClick={() => {
                                    if (navigator.share) {
                                        navigator.share({
                                            title: 'Join DateSpark Plus 💖',
                                            text: `Plan your dream dates with DateSpark! Use my code ${referralDetails.code} to get 7 days free.`,
                                            url: `${window.location.origin}/signup?ref=${referralDetails.code}`
                                        });
                                    } else {
                                        navigator.clipboard.writeText(`${window.location.origin}/signup?ref=${referralDetails.code}`);
                                        alert('Link copied to clipboard!');
                                    }
                                }}
                                className="w-11 h-11 flex items-center justify-center bg-coral hover:bg-coral/90 rounded-xl transition-all text-white shadow-lg active:scale-95"
                                title="Native Share"
                            >
                                <Share2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── FEEDBACK & SUPPORT ── */}
                <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm mb-8">
                    <div className="flex items-center gap-4 mb-6">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner transition-colors ${feedbackType === 'support' ? 'bg-navy/10 text-navy' : 'bg-coral/10 text-coral'}`}>
                            {feedbackType === 'support' ? <LifeBuoy className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-navy tracking-tight">
                                {feedbackType === 'feedback' ? 'Share Your Feedback' : 'Contact Support'}
                            </h3>
                            <p className="text-navy/40 text-[10px] font-black uppercase tracking-widest mt-0.5">
                                {feedbackType === 'feedback' ? 'Help us spark better dates' : 'Report an issue or get help'}
                            </p>
                        </div>
                    </div>

                    {/* Toggle Switch */}
                    <div className="flex bg-gray-50 p-1.5 rounded-2xl mb-6 border border-gray-100">
                        <button 
                            onClick={() => setFeedbackType('feedback')}
                            className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${feedbackType === 'feedback' ? 'bg-white text-coral shadow-sm border border-coral/5' : 'text-gray-400 hover:text-navy'}`}
                        >
                            Feedback
                        </button>
                        <button 
                            onClick={() => setFeedbackType('support')}
                            className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${feedbackType === 'support' ? 'bg-navy text-white shadow-sm' : 'text-gray-400 hover:text-navy'}`}
                        >
                            Technical Support
                        </button>
                    </div>
                    
                    <div className="space-y-4">
                        <textarea
                            value={feedbackText}
                            onChange={(e) => setFeedbackText(e.target.value)}
                            disabled={isSubmittingFeedback}
                            placeholder={feedbackType === 'feedback' 
                                ? "What would make DateSpark better for you? (e.g. 'I wish I could export to PDF', 'More vegetarian options')..." 
                                : "Tell us what's wrong. Please include details so we can help you faster..."}
                            className="w-full px-6 py-5 bg-gray-50 border-2 border-transparent focus:border-coral focus:bg-white rounded-[2rem] outline-none font-medium text-navy transition-all min-h-[140px] resize-none text-sm placeholder:text-gray-300 disabled:opacity-50"
                        />
                        <button 
                            onClick={async () => {
                                if (!feedbackText.trim()) return;
                                setIsSubmittingFeedback(true);
                                try {
                                    const response = await fetch('/api/feedback', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            message: feedbackText,
                                            userId: user?.id,
                                            userEmail: user?.email,
                                            type: feedbackType
                                        })
                                    });
                                    if (response.ok) {
                                        alert(feedbackType === 'feedback' 
                                            ? 'Thank you! Your feedback has been received. 💖' 
                                            : 'Support request sent! We will get back to you shortly. 🚀');
                                        setFeedbackText('');
                                    } else {
                                        throw new Error('Failed to send');
                                    }
                                } catch (error) {
                                    alert('Oops! Something went wrong. Please try again.');
                                } finally {
                                    setIsSubmittingFeedback(false);
                                }
                            }}
                            disabled={isSubmittingFeedback || !feedbackText.trim()}
                            className={`w-full py-4 text-white font-black rounded-2xl active:scale-[0.98] transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 ${feedbackType === 'support' ? 'bg-navy hover:bg-navy/90 shadow-navy/20' : 'bg-coral hover:bg-coral/90 shadow-coral/20'}`}
                        >
                            {isSubmittingFeedback ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : feedbackType === 'support' ? (
                                <LifeBuoy className="w-5 h-5" />
                            ) : (
                                <Send className="w-5 h-5" />
                            )}
                            {isSubmittingFeedback ? 'Sending...' : (feedbackType === 'feedback' ? 'Send Feedback' : 'Send Support Request')}
                        </button>
                    </div>
                </div>

                {/* Admin Dashboard Entry */}
                {isAdmin && (
                    <Link
                        to="/admin"
                        className="w-full mb-4 py-4 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 text-white font-black text-xs uppercase tracking-[0.2em] hover:opacity-90 rounded-2xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 group"
                    >
                        <Settings className="w-4 h-4 transition-transform group-hover:rotate-45" />
                        🛡️ Administrative Console
                    </Link>
                )}

                {/* Visible Logout */}
                <button
                    onClick={handleSignOut}
                    className="w-full py-4.5 bg-red-50 text-red-600 font-black text-xs uppercase tracking-[0.2em] hover:bg-red-600 hover:text-white rounded-2xl transition-all shadow-sm active:scale-95 border border-red-100 flex items-center justify-center gap-2 group"
                >
                    <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                    Sign Out Securely
                </button>

                <p className="text-[10px] text-gray-200 font-black text-center pt-8 uppercase tracking-[0.4em]">DateSpark v2.5 Master • Made for Couples</p>
            </div>
        );
    };


    const renderFavorites = () => (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4">
                <div>
                    <h2 className={`text-2xl font-black tracking-tight ${appTheme === 'dark' ? 'text-white' : 'text-navy'
                        }`}>Your Favorites ✨</h2>
                    <p className={`${appTheme === 'dark' ? 'text-white/40' : 'text-navy/60'} text-sm font-medium mt-1`}>Your hand-picked itineraries for perfect dates.</p>
                </div>
            </div>

            {plans.filter(p => !p.deleted_at && p.is_favorite).length === 0 ? (
                <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center shadow-sm max-w-lg mx-auto">
                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Heart className="w-8 h-8 text-gray-300" />
                    </div>
                    <h3 className="text-xl font-bold text-navy mb-2">No favorites yet!</h3>
                    <p className="text-gray-400 mb-6 font-medium">Love a date? Tap the heart icon on any plan card to save it here for quick access.</p>
                    <button onClick={() => setCurrentTab('home')} className="px-8 py-3 bg-navy text-white font-black rounded-xl hover:bg-navy/90 transition-all">
                        Discover New Dates
                    </button>
                </div>
            ) : (
                (() => {
                    const favPlans = plans.filter(p => !p.deleted_at && p.is_favorite);
                    // Group by Month
                    const grouped = favPlans.reduce((acc, plan) => {
                        const date = new Date(plan.created_at);
                        const key = date.toLocaleString('default', { month: 'long', year: 'numeric' });
                        if (!acc[key]) acc[key] = [];
                        acc[key].push(plan);
                        return acc;
                    }, {});
                    return (
                        <div className="space-y-8 px-4">
                            {Object.entries(grouped).map(([month, monthPlans]) => (
                                <div key={month}>
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className={`text-[11px] font-black uppercase tracking-[0.2em] ${appTheme === 'dark' ? 'text-white/30' : 'text-gray-300'
                                            }`}>{month}</span>
                                        <div className={`flex-1 h-px ${appTheme === 'dark' ? 'bg-white/10' : 'bg-gray-100'
                                            }`} />
                                        <span className={`text-[10px] font-bold ${appTheme === 'dark' ? 'text-white/20' : 'text-gray-300'
                                            }`}>{monthPlans.length} plan{monthPlans.length !== 1 ? 's' : ''}</span>
                                    </div>
                                    <div className="flex flex-row overflow-x-auto snap-x snap-mandatory gap-6 scrollbar-hide pb-2 md:pb-0 px-1">
                                        {monthPlans.map((plan, idx) => (
                                            <div key={plan.id} className="flex-shrink-0 w-[85vw] sm:w-[400px] snap-center">
                                                {renderPlanCard(plan, idx, false)}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    );
                })()
            )}
        </div>
    );

    const renderHeader = () => {
        const tabTitles = {
            home: "Welcome Back",
            favorites: "Your Favorites",
            discovery: "Discovery Mode",
            events: "Local Events",
            account: "Your Account"
        };
        const tabSubtitles = {
            home: "Start your next adventure.",
            favorites: "Hand-picked itineraries you love.",
            discovery: "Swipe right to save your favorites.",
            account: "Manage your profile and settings."
        };

        return (
            <header className={`border-b transition-colors duration-500 fixed top-0 left-0 right-0 w-full z-30 pt-[env(safe-area-inset-top,0px)] ${appTheme === 'dark' ? 'bg-[#050810]/80 backdrop-blur-xl border-white/5' : 'bg-white/95 backdrop-blur-md border-gray-100'
                }`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                            className="md:hidden p-2 bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-navy rounded-xl transition-all"
                            title="Toggle Menu"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <Link to="/dashboard" onClick={() => setCurrentTab('home')} className="flex items-center gap-2 group">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-coral to-pink-500 p-[2px] shadow-lg shadow-coral/10 group-hover:scale-105 transition-transform">
                                <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center overflow-hidden">
                                    <img src="/datespark-logo.png" alt="DateSpark Logo" className="w-7 h-7 object-cover" />
                                </div>
                            </div>
                            <span className={`text-xl font-black tracking-tight ${appTheme === 'dark' ? 'text-white' : 'text-navy'}`}>DateSpark</span>
                        </Link>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Desktop-only Tab Navigation - Removed as requested */}


                        <div className="flex items-center gap-4 relative">
                            {/* CLEARLY VISIBLE UPGRADE ICON/BUTTON */}
                            {!isPremium && (
                                <button
                                    onClick={() => setShowUpgradeModal(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-500/30 hover:scale-105 transition-all active:scale-95 animate-pulse"
                                >
                                    <Crown className="w-3.5 h-3.5 fill-white" />
                                    Upgrade
                                </button>
                            )}

                            <button
                                onClick={() => setCurrentTab('account')}
                                className={`flex items-center gap-2 p-1.5 rounded-xl transition-colors outline-none ${currentTab === 'account' ? 'bg-coral/10 ring-1 ring-coral/20' : 'hover:bg-gray-50'}`}
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
                                        {user?.user_metadata?.first_name || 'K'}
                                    </div>
                                )}
                                <span className={`text-sm font-bold hidden sm:block ${currentTab === 'account' ? 'text-coral' : 'text-navy'}`}>
                                    {user?.user_metadata?.first_name || 'Account'}
                                </span>
                                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${currentTab === 'account' ? 'rotate-180 text-coral' : ''}`} />
                            </button>
                        </div>
                    </div>
                </div>
            </header>
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
        <div className={`min-h-screen transition-colors duration-500 relative flex flex-col font-inter overflow-hidden ${appTheme === 'dark' ? 'bg-[#060B1A] text-white' :
            appTheme === 'sunset' ? 'bg-gradient-to-br from-coral/5 to-pink-50/50 bg-white' :
                'bg-gray-50'
            }`}>
            {/* 
                ✨ THE MIDNIGHT GLOW ✨
                Restoring the airy, premium feel with multi-layered ambient "blooms".
            */}
            {appTheme === 'dark' && (
                <>
                    {/* Primary Upper-Right "Whiteness" Bloom - Significantly More Airy */}
                    <div className="absolute top-[-25%] right-[-15%] w-[900px] h-[900px] bg-white opacity-[0.22] rounded-full blur-[140px] -z-10 pointer-events-none animate-pulse-slow" />

                    {/* Secondary Coral Bloom for Signature DateSpark Vibe */}
                    <div className="absolute top-[5%] right-[5%] w-[600px] h-[600px] bg-[#FF7F50] opacity-[0.12] rounded-full blur-[110px] -z-10 pointer-events-none" />

                    {/* Subtly Airy Bottom Left Bloom */}
                    <div className="absolute bottom-[-15%] left-[-10%] w-[600px] h-[600px] bg-indigo-500 opacity-[0.08] rounded-full blur-[120px] -z-10 pointer-events-none" />
                </>
            )}

            {/* Sunset Ambient Bloom */}
            {appTheme === 'sunset' && (
                <div className="absolute top-[-10%] right-[-10%] w-[700px] h-[700px] bg-coral opacity-[0.12] rounded-full blur-[130px] -z-10 pointer-events-none" />
            )}

            {renderHeader()}

            <div
                className="flex flex-1 w-full relative"
                style={{
                    paddingTop: 'calc(74px + env(safe-area-inset-top, 0px))',
                    paddingBottom: 'max(8rem, calc(5rem + env(safe-area-inset-bottom)))'
                }}
            >
                {/* Mobile Backdrop when expanded */}
                {!isSidebarCollapsed && (
                    <div
                        className="fixed inset-0 bg-navy/20 backdrop-blur-sm z-[65] md:hidden"
                        onClick={() => setIsSidebarCollapsed(true)}
                    />
                )}

                {/* Collapsible Sidebar */}
                <aside
                    className={`flex flex-col fixed md:sticky bg-white border-r border-gray-100 transition-all duration-300 z-[70] ${isSidebarCollapsed
                            ? 'w-0 -translate-x-full md:w-20 md:translate-x-0'
                            : 'w-64 translate-x-0'
                        }`}
                    style={{
                        top: 'calc(74px + env(safe-area-inset-top, 0px))',
                        height: 'calc(100vh - 74px - env(safe-area-inset-top, 0px))'
                    }}
                >
                    {/* Toggle Button - Desktop Only (Mobile uses Header Hamburger) */}
                    <div className={`p-4 hidden md:flex ${isSidebarCollapsed ? 'justify-center' : 'justify-end'} border-b border-gray-50`}>
                        <button
                            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                            className="p-1.5 rounded-xl bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-navy transition-all shadow-sm"
                            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                        >
                            {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                        </button>
                    </div>

                    {/* Navigation Links */}
                    <nav className="flex-1 py-6 px-3 flex flex-col gap-2 overflow-y-auto">
                        {/* Dashboard (Home) */}
                        <button
                            onClick={() => { setCurrentTab('home'); if (window.innerWidth < 768) setIsSidebarCollapsed(true); }}
                            className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-bold transition-all ${currentTab === 'home'
                                    ? 'bg-coral/5 text-coral'
                                    : 'text-slate-500 hover:bg-gray-50 hover:text-navy'
                                } ${isSidebarCollapsed ? 'md:justify-center' : ''}`}
                        >
                            <Home className={`w-5 h-5 shrink-0 ${currentTab === 'home' ? 'text-coral' : 'text-slate-400'}`} />
                            {(!isSidebarCollapsed || window.innerWidth < 768) && <span className="text-sm font-outfit">Dashboard</span>}
                        </button>

                        {/* Events */}
                        <button
                            onClick={() => { setCurrentTab('events'); if (window.innerWidth < 768) setIsSidebarCollapsed(true); }}
                            className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-bold transition-all ${currentTab === 'events'
                                    ? 'bg-coral/5 text-coral'
                                    : 'text-slate-500 hover:bg-gray-50 hover:text-navy'
                                } ${isSidebarCollapsed ? 'md:justify-center' : ''}`}
                        >
                            <Ticket className={`w-5 h-5 shrink-0 ${currentTab === 'events' ? 'text-coral' : 'text-slate-400'}`} />
                            {(!isSidebarCollapsed || window.innerWidth < 768) && <span className="text-sm font-outfit">Events</span>}
                        </button>

                        {/* Favorites */}
                        <button
                            onClick={() => { setCurrentTab('favorites'); if (window.innerWidth < 768) setIsSidebarCollapsed(true); }}
                            className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-bold transition-all ${currentTab === 'favorites'
                                    ? 'bg-coral/5 text-coral'
                                    : 'text-slate-500 hover:bg-gray-50 hover:text-navy'
                                } ${isSidebarCollapsed ? 'md:justify-center' : ''}`}
                        >
                            <Heart className={`w-5 h-5 shrink-0 ${currentTab === 'favorites' ? 'text-coral' : 'text-slate-400'}`} />
                            {(!isSidebarCollapsed || window.innerWidth < 768) && <span className="text-sm font-outfit">Favorites</span>}
                        </button>

                        {/* My Plans */}
                        <button
                            onClick={() => { setCurrentTab('plans'); setActiveTab('all'); if (window.innerWidth < 768) setIsSidebarCollapsed(true); }}
                            className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-bold transition-all ${currentTab === 'plans' && activeTab === 'all'
                                    ? 'bg-coral/5 text-coral'
                                    : 'text-slate-500 hover:bg-gray-50 hover:text-navy'
                                } ${isSidebarCollapsed ? 'md:justify-center' : ''}`}
                        >
                            <Calendar className={`w-5 h-5 shrink-0 ${currentTab === 'plans' && activeTab === 'all' ? 'text-coral' : 'text-slate-400'}`} />
                            {(!isSidebarCollapsed || window.innerWidth < 768) && <span className="text-sm font-outfit">My Plans</span>}
                        </button>

                        {/* Wishlist */}
                        <button
                            onClick={() => { setCurrentTab('wishlist'); if (window.innerWidth < 768) setIsSidebarCollapsed(true); }}
                            className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-bold transition-all ${currentTab === 'wishlist'
                                    ? 'bg-coral/5 text-coral'
                                    : 'text-slate-500 hover:bg-gray-50 hover:text-navy'
                                } ${isSidebarCollapsed ? 'md:justify-center' : ''}`}
                        >
                            <Gift className={`w-5 h-5 shrink-0 ${currentTab === 'wishlist' ? 'text-coral' : 'text-slate-400'}`} />
                            {(!isSidebarCollapsed || window.innerWidth < 768) && <span className="text-sm font-outfit">Wishlist</span>}
                        </button>

                        {/* Profile & Settings embedded */}
                        <button
                            onClick={() => { setCurrentTab('account'); setAccountSubView('menu'); if (window.innerWidth < 768) setIsSidebarCollapsed(true); }}
                            className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-bold transition-all ${currentTab === 'account'
                                    ? 'bg-coral/5 text-coral'
                                    : 'text-slate-500 hover:bg-gray-50 hover:text-navy'
                                } ${isSidebarCollapsed ? 'md:justify-center' : ''}`}
                        >
                            <Settings className={`w-5 h-5 shrink-0 ${currentTab === 'account' ? 'text-coral' : 'text-slate-400'}`} />
                            {(!isSidebarCollapsed || window.innerWidth < 768) && <span className="text-sm font-outfit">Settings</span>}
                        </button>
                    </nav>

                    {/* Go Premium Upgrade Card */}
                    {!isPremium && (
                        <div className="p-3 border-t border-gray-50">
                            {!isSidebarCollapsed ? (
                                <div className="p-4 bg-white border border-rose-100 rounded-2xl shadow-lg shadow-coral/5 relative overflow-hidden flex flex-col items-center text-center">
                                    <div className="absolute -right-8 -top-8 w-24 h-24 bg-coral/10 rounded-full blur-xl" />
                                    <Crown className="w-6 h-6 text-gold fill-gold/10 mb-2 drop-shadow-sm" />
                                    <h4 className="text-sm font-black text-navy tracking-tight mb-0.5">Go Premium</h4>
                                    <p className="text-[10px] text-slate-400 font-bold leading-tight mb-3 max-w-[140px]">
                                        Unlock unlimited plans, AI suggestions, and more!
                                    </p>
                                    <button
                                        onClick={() => setShowUpgradeModal(true)}
                                        className="w-full py-2 bg-gradient-to-r from-orange-500 via-coral to-pink-500 text-white font-black text-xs rounded-xl shadow-md shadow-coral/20 hover:brightness-105 active:scale-95 transition-all"
                                    >
                                        Upgrade Now
                                    </button>
                                </div>
                            ) : (
                                <div className="flex justify-center py-2">
                                    <button
                                        onClick={() => setShowUpgradeModal(true)}
                                        className="w-10 h-10 bg-gradient-to-br from-orange-500 via-coral to-pink-500 rounded-xl flex items-center justify-center text-white shadow-md hover:scale-105 active:scale-95 transition-all"
                                        title="Upgrade Now"
                                    >
                                        <Crown className="w-4 h-4 text-white" />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </aside>

                <main className="flex-1 w-full max-w-full lg:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                        >
                            {currentTab === 'home' && renderOverview()}
                            {currentTab === 'favorites' && renderFavorites()}
                            {currentTab === 'plans' && renderMyPlans()}
                            {currentTab === 'wishlist' && (
                                <WishlistTab 
                                    appTheme={appTheme} 
                                    userId={user?.id}
                                    setToastMessage={setToastMessage} 
                                    onSparkWish={async (title, category) => {
                                        await handleGeneratePlan(`${title} (${category} wish)`, { vibe: category });
                                        setCurrentTab('plans');
                                    }}
                                />
                            )}
                            {currentTab === 'events' && <EventsTab appTheme={appTheme} userCity={userCity} setToastMessage={setToastMessage} />}
                            {currentTab === 'account' && renderAccount()}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>

            {/* View Plan Modal (Sleek Timeline UI) */}
            <AnimatePresence>
                {selectedPlan && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center sm:p-4 bg-navy/50 backdrop-blur-sm"
                        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
                    >
                        <motion.div
                            initial={{ y: "100%", opacity: 0, scale: 0.95 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: "100%", opacity: 0, scale: 0.95 }}
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            className="bg-[#f8f9fa] rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl w-full max-w-5xl h-[95svh] sm:max-h-[90vh] overflow-hidden flex flex-col md:flex-row relative">
                            {/* Desktop Close Button */}
                            <button
                                onClick={() => {
                                    setSelectedPlan(null);
                                    setShowMapMobile(false);
                                }}
                                className="absolute top-6 right-6 z-[60] p-2.5 bg-navy/20 hover:bg-navy/40 text-navy rounded-full transition-all hidden md:block border border-navy/5"
                            >
                                <X className="w-6 h-6" />
                            </button>

                            {/* Left Column: Timeline UI */}
                            <div className={`flex-1 overflow-y-auto bg-transparent md:bg-white flex-col z-10 ${showMapMobile ? 'hidden md:flex' : 'flex'}`}>

                                {/* Sticky Header — fully mobile/iPhone safe */}
                                <div className="bg-[#0f172a]/95 backdrop-blur-xl text-white px-3 py-3 border-b border-white/10 sticky top-0 z-20 flex items-center justify-between gap-2">
                                    {/* Left: Favorite + Title */}
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                        <button
                                            onClick={(e) => handleToggleFavorite(selectedPlan, e)}
                                            className={`min-w-[40px] w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-300 flex-shrink-0 ${selectedPlan.is_favorite ? 'bg-coral/20 border-coral/30' : 'bg-white/10 border-white/10 hover:bg-white/20'}`}
                                            title={selectedPlan.is_favorite ? 'Remove from Favorites' : 'Add to Favorites'}
                                        >
                                            <Heart className={`w-4 h-4 transition-all duration-300 ${selectedPlan.is_favorite ? 'fill-coral text-coral scale-110' : 'text-white/70'}`} />
                                        </button>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <h2 className="text-sm font-black font-inter tracking-tight truncate">{selectedPlan.vibe} Date</h2>
                                                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-white/10 rounded-md border border-white/10 flex-shrink-0">
                                                    <History className="w-2.5 h-2.5 text-gray-400" />
                                                    <span className="text-[9px] font-black text-white/70">{selectedPlan.total_tries || 0}</span>
                                                </div>
                                            </div>
                                            <p className="text-[9px] text-gray-400 uppercase tracking-widest font-black opacity-70 truncate font-inter">
                                                {!Array.isArray(selectedPlan.itinerary) && selectedPlan.itinerary?.metadata?.planDate ?
                                                    `${new Date(selectedPlan.itinerary.metadata.planDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
                                                    : 'Available in New York City'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Right: Actions + Close */}
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        {/* Desktop Only Actions */}
                                        <div className="hidden sm:flex items-center gap-2">
                                            <button
                                                onClick={() => handleForkPlan(selectedPlan)}
                                                className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl transition-all text-[11px] font-black group shadow-lg shadow-violet-500/20 font-inter"
                                            >
                                                <Sparkles className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
                                                <span>Steal & Customize</span>
                                            </button>
                                            <button
                                                onClick={() => handleRecreatePlan(selectedPlan.id)}
                                                className="flex items-center gap-2 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-xl transition-all text-[11px] font-black group font-inter text-indigo-600"
                                            >
                                                <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform`} />
                                                <span>Recreate</span>
                                            </button>
                                        </div>

                                        {/* Mobile/Compact Actions */}
                                        <button
                                            type="button"
                                            onClick={handleShare}
                                            className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-coral/95 hover:bg-coral border border-coral rounded-xl transition-all text-[10px] sm:text-[11px] font-black group font-inter text-white shadow-md shadow-coral/20 min-h-[44px]"
                                        >
                                            <Share2 className="w-3.5 h-3.5 text-white group-hover:scale-110 transition-transform" />
                                            <span>Share with your Date</span>
                                        </button>

                                        {/* Close Button — Primary target on mobile */}
                                        <button
                                            onClick={() => {
                                                setSelectedPlan(null);
                                                setShowMapMobile(false);
                                            }}
                                            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all border border-white/5"
                                            aria-label="Close plan"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Mobile Secondary Action Row — Hidden on desktop */}
                                <div className="sm:hidden bg-[#0f172a]/95 backdrop-blur-xl px-3 py-2 flex items-center gap-2 border-b border-white/5">
                                    <button
                                        onClick={() => handleForkPlan(selectedPlan)}
                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-violet-600/20 border border-violet-500/30 text-violet-400 rounded-xl text-[10px] font-black uppercase tracking-wider"
                                    >
                                        <Sparkles className="w-3.5 h-3.5" /> Steal & Edit
                                    </button>
                                    <button
                                        onClick={() => handleRecreatePlan(selectedPlan.id)}
                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white/5 border border-white/10 text-white/70 rounded-xl text-[10px] font-black uppercase tracking-wider"
                                    >
                                        <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} /> Variations
                                    </button>
                                </div>

                                <p className="px-3 py-2.5 text-[10px] sm:text-[11px] text-white/80 font-medium bg-[#0c1222] border-b border-white/10 leading-snug">
                                    Tip: <span className="font-black text-coral/95">Share</span> sends a link your date can open in the browser. Preview links may hide some stops until they unlock the full plan.
                                </p>

                                {/* Mobile Map Spacer */}
                                <div className="h-[180px] sm:h-[200px] md:hidden relative flex items-end justify-center pb-2 flex-shrink-0 z-20">
                                    <button
                                        onClick={() => setShowMapMobile(true)}
                                        className="bg-navy/95 backdrop-blur-md text-white px-4 py-2 rounded-full text-xs font-bold shadow-md flex items-center gap-1.5 border border-white/20 transform transition-all active:scale-95 mt-auto min-h-[40px] font-inter"
                                    >
                                        <MapIcon className="w-3.5 h-3.5" />
                                        Expand Map
                                    </button>
                                </div>

                                {(!selectedPlan.itinerary || 
                                    (Array.isArray(selectedPlan.itinerary) && selectedPlan.itinerary.length === 0) ||
                                    (typeof selectedPlan.itinerary === 'object' && 
                                     !(selectedPlan.itinerary.steps?.length > 0) && 
                                     !(selectedPlan.itinerary.itinerary?.length > 0) &&
                                     !Array.isArray(selectedPlan.itinerary))
                                ) ? (
                                    <div className="flex flex-col items-center justify-center h-full py-20 text-center px-6">
                                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                                            <Sparkles className="w-10 h-10 text-gray-200" />
                                        </div>
                                        <h3 className="text-xl font-black text-navy mb-2">No Plan Details Found</h3>
                                        <p className="text-gray-400 font-medium">Wait, where's the plan? Try sparking it again or check your connection. 🛑</p>
                                    </div>
                                ) : (
                                    <div className="p-6 sm:p-8 pt-10 bg-white md:bg-white rounded-t-[2.5rem] md:rounded-none shadow-sm md:shadow-none relative mt-[-1.5rem] min-h-screen">
                                        <div className="relative border-l-2 border-dashed border-gray-200 ml-4 space-y-10 pb-8">
                                            {(Array.isArray(selectedPlan.itinerary)
                                            ? selectedPlan.itinerary
                                            : (selectedPlan.itinerary?.steps || selectedPlan.itinerary?.itinerary || selectedPlan.itinerary?.schedule || [])
                                        )?.map((step, idx, arr) => {
                                            // Gating Rule: If it's a preview plan, free users only see 2 stops (idx 0, 1). 3rd stop (idx 2) is locked.
                                            const isPreview = selectedPlan.itinerary?.metadata?.isPreviewPlan || selectedPlan.is_preview || false;
                                            const isLockedStep = !isPremium && isPreview && idx >= 2;

                                            // Assign specific colors for styling dots
                                            const dotColors = ['bg-coral', 'bg-yellow-400', 'bg-navy', 'bg-emerald-500', 'bg-purple-500'];
                                            const textColor = ['text-coral', 'text-yellow-500', 'text-navy', 'text-emerald-600', 'text-purple-600'];
                                            const colorIdx = idx % dotColors.length;
                                            return (
                                                <motion.div
                                                    key={idx}
                                                    initial={{ opacity: 0, x: -30 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.1 + idx * 0.15, type: 'spring', bounce: 0.3 }}
                                                    className={`relative ${isLockedStep ? 'cursor-pointer group/locked' : ''}`}
                                                    onClick={() => {
                                                        if (isLockedStep) setShowUpgradeModal(true);
                                                    }}
                                                >
                                                    {/* Absolute Time on the far left of the Line setup */}
                                                    <div className="absolute -left-14 top-2 text-[11px] font-black text-gray-400 text-right w-10 font-inter">
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
                                                            : isLockedStep ? 'bg-gray-300 shadow-none' : 'bg-white hover:bg-gray-50 border-gray-300'
                                                            }`}
                                                    >
                                                        {completedSteps.includes(idx) ? (
                                                            <Check className="w-2 h-2 font-black" />
                                                        ) : isLockedStep ? (
                                                            <Lock className="w-2 h-2 text-gray-500" />
                                                        ) : (
                                                            <div className={`w-1.5 h-1.5 rounded-full ${dotColors[colorIdx]}`} />
                                                        )}
                                                    </button>

                                                    <div className={`bg-white border border-gray-100 rounded-2xl p-4 sm:p-6 flex flex-col gap-4 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-coral/20 ${isLockedStep ? 'blur-[10px] select-none opacity-40 pointer-events-none' : ''} ${completedSteps.includes(idx) ? 'opacity-40' : ''}`}>
                                                        <div className="flex items-start gap-4">
                                                            {/* Category Icon */}
                                                            <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-50 border border-gray-100 shadow-sm">
                                                                {idx === 0 || step.activity?.toLowerCase().includes('dinner') || step.activity?.toLowerCase().includes('drinks') ? (
                                                                    <Utensils className="w-5 h-5 text-[#FF7F50]" />
                                                                ) : idx === 1 || step.activity?.toLowerCase().includes('walk') || step.activity?.toLowerCase().includes('stroll') ? (
                                                                    <Compass className="w-5 h-5 text-amber-500" />
                                                                ) : (
                                                                    <Ticket className="w-5 h-5 text-navy" />
                                                                )}
                                                            </div>

                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-start justify-between gap-4 mb-1">
                                                                    <div>
                                                                        <h4 className="text-lg font-black font-inter text-navy leading-tight">{step.venue}</h4>
                                                                        <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#FF7F50] font-inter">
                                                                            {step.activity}
                                                                        </p>
                                                                    </div>
                                                                    <div className="flex flex-col items-end gap-1.5">
                                                                        <span className="text-[11px] font-black text-gray-300 tracking-tighter font-inter">{step.time}</span>
                                                                        <div className="flex items-center gap-1.5 bg-[#FFF9E5] px-2.5 py-1 rounded-lg border border-[#F5E1A4] shadow-sm">
                                                                            <Star className="w-3 h-3 fill-[#FFD700] text-[#FFD700]" />
                                                                            <span className="text-[11px] font-black text-[#846404] font-inter flex items-center gap-1">
                                                                                {step.rating ? parseFloat(step.rating).toFixed(1) : '4.7'}
                                                                                <span className="text-[10px] opacity-40 font-bold">
                                                                                    ({step.userRatingCount > 999 ? (step.userRatingCount / 1000).toFixed(1) + 'k' : step.userRatingCount || '150'}+)
                                                                                </span>
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {step.sub_headline && (
                                                                    <p className="text-[12px] font-black text-[#FF7F50] leading-tight mb-2 font-inter">
                                                                        "{step.sub_headline}"
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Vibe Tags */}
                                                        <div className="flex flex-wrap gap-1.5 mb-2 mt-1">
                                                            <span className="px-2 py-1 bg-gray-50 text-gray-500 rounded text-[10px] font-bold border border-gray-100 uppercase tracking-widest">Good for talking</span>
                                                            <span className="px-2 py-1 bg-gray-50 text-gray-500 rounded text-[10px] font-bold border border-gray-100 uppercase tracking-widest">Great Atmosphere</span>
                                                        </div>

                                                        <p className="text-[13px] text-gray-600 font-medium leading-relaxed border-t border-gray-50 pt-3">
                                                            {step.description}
                                                        </p>

                                                        {step.photoUrl && (
                                                            <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-sm mt-1 relative bg-gray-50">
                                                                <img
                                                                    src={step.photoUrl}
                                                                    alt={step.venue}
                                                                    className="w-full h-48 sm:h-56 object-cover hover:scale-105 transition-transform duration-700"
                                                                    loading="lazy"
                                                                    onError={(e) => {
                                                                        e.target.style.display = 'none'; // Hide broken image
                                                                    }}
                                                                />
                                                            </div>
                                                        )}

                                                        {/* ✨ VERIFIED GOOGLE REVIEWS ✨ */}
                                                        {step.reviews && step.reviews.length > 0 && (
                                                            <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100 relative overflow-hidden group/review hover:bg-gray-50 transition-colors">
                                                                <div className="flex items-center justify-between mb-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="flex items-center gap-0.5">
                                                                            {[...Array(5)].map((_, i) => (
                                                                                <Star key={i} className={`w-2.5 h-2.5 ${i < Math.floor(step.reviews[0].rating) ? 'fill-[#FFD700] text-[#FFD700]' : 'text-gray-200'}`} />
                                                                            ))}
                                                                        </div>
                                                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Verified Guest</span>
                                                                    </div>
                                                                </div>

                                                                <div className="relative">
                                                                    <MessageSquare className="absolute -left-1 -top-1 w-8 h-8 text-coral/5 rotate-12" />
                                                                    <p className="text-[12px] text-navy italic font-medium leading-relaxed relative z-10 pl-1">
                                                                        "{step.reviews[0].text.length > 140 ? step.reviews[0].text.substring(0, 140) + '...' : step.reviews[0].text}"
                                                                    </p>
                                                                </div>

                                                                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                                                                    <div className="w-6 h-6 rounded-full bg-navy/5 flex items-center justify-center text-[10px] font-black text-navy border border-navy/10">
                                                                        {step.reviews[0].author ? step.reviews[0].author.charAt(0) : 'G'}
                                                                    </div>
                                                                    <span className="text-[11px] font-black text-navy opacity-60">{step.reviews[0].author || 'Google User'}</span>
                                                                    {step.reviews.length > 1 && (
                                                                        <span className="text-[9px] font-black text-coral/60 ml-auto">+ {step.reviews.length - 1} more reviews</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Action Buttons - Per Screenshot */}
                                                        <div className="flex flex-wrap items-center gap-3 mt-2">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleSwitchUp(idx, step); }}
                                                                className={`px-4 py-2 text-white text-[11px] font-black rounded-xl hover:shadow-lg transition-all active:scale-95 flex items-center gap-1.5 shadow-md ${selectedPlan?.user_id === user?.id
                                                                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:shadow-indigo-500/30'
                                                                    : 'bg-gradient-to-r from-coral to-pink-500 hover:shadow-coral/30'
                                                                    }`}
                                                            >
                                                                <Sparkles className="w-3.5 h-3.5" />
                                                                {selectedPlan?.user_id === user?.id ? 'Swap This Spot' : 'Customize to Swap'}
                                                            </button>

                                                            {step.websiteUrl && (
                                                                <a
                                                                    href={step.websiteUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="px-4 py-2 bg-white text-navy border border-gray-200 text-[11px] font-black rounded-xl hover:bg-gray-50 transition-all flex items-center gap-1.5 shadow-sm"
                                                                >
                                                                    <Ticket className="w-3.5 h-3.5 text-coral" /> Visit Website
                                                                </a>
                                                            )}

                                                            <a
                                                                href={`https://www.google.com/search?q=${encodeURIComponent(step.venue + ' ' + (step.address || ''))}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="px-4 py-2 bg-white text-navy border border-gray-200 text-[11px] font-black rounded-xl hover:bg-gray-50 transition-all flex items-center gap-1.5 shadow-sm"
                                                            >
                                                                <Search className="w-3.5 h-3.5" /> Search on Google
                                                            </a>

                                                            <a
                                                                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(step.venue + ' ' + (step.address || ''))}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-white text-[11px] font-black rounded-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
                                                            >
                                                                <Navigation className="w-3.5 h-3.5" /> Get Directions
                                                            </a>

                                                            {step.lat && step.lng && (
                                                                <a
                                                                    href={`https://m.uber.com/ul/?action=setPickup&client_id=datespark_mvp&dropoff[latitude]=${step.lat}&dropoff[longitude]=${step.lng}&dropoff[nickname]=${encodeURIComponent(step.venue)}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="px-4 py-2 bg-black text-white text-[11px] font-black rounded-xl hover:bg-gray-900 transition-all flex items-center gap-1.5 shadow-md"
                                                                >
                                                                    <Car className="w-3.5 h-3.5" /> Get a Ride
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
                                                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-700 bg-white/10 backdrop-blur-[4px] rounded-2xl border border-white/20 shadow-2xl">
                                                            <div className="w-14 h-14 bg-violet-600 rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-violet-500/40 transform hover:scale-110 transition-transform">
                                                                <Lock className="w-7 h-7 text-white" />
                                                            </div>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setShowUpgradeModal(true); }}
                                                                className="px-8 py-4 bg-navy text-white rounded-2xl text-[14px] font-black shadow-2xl hover:bg-coral hover:scale-105 transition-all active:scale-95 font-inter border border-white/20"
                                                            >
                                                                Unlock Plan
                                                            </button>
                                                        </div>
                                                    )}

                                                    {/* Walk Time Connector */}
                                                    {!isLockedStep && idx < arr.length - 1 && arr[idx+1] && (
                                                        <div className="absolute -bottom-10 left-0 flex items-center gap-3 w-full opacity-60 z-10">
                                                            <div className="w-8 h-[1px] bg-dashed bg-gray-300 ml-4"></div>
                                                            {(() => {
                                                                const dist = getDistance(
                                                                    parseFloat(step.lat), parseFloat(step.lng),
                                                                    parseFloat(arr[idx+1].lat), parseFloat(arr[idx+1].lng)
                                                                );
                                                                if (!dist || dist > 3) return null; // Over 3 miles, probably driving
                                                                const walkTimeMins = Math.round(dist * 20); // rough ~20 min per mile
                                                                return (
                                                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded border border-gray-100 shadow-sm relative">
                                                                        <Footprints className="w-3 h-3 text-coral" /> {walkTimeMins} min walk ({dist.toFixed(1)} mi)
                                                                    </div>
                                                                );
                                                            })()}
                                                        </div>
                                                    )}
                                                </motion.div>
                                            );
                                        })}
                                    </div>

                                    {/* Community Feedback Section */}
                                    <div className="mt-8 border-t border-gray-100 pt-8 pb-10">
                                        {/* Section Header + Boost this Plan */}
                                        <div className="flex items-center justify-between mb-5">
                                            <h3 className="text-xl font-black text-navy flex items-center gap-2">
                                                💬 What People Say
                                            </h3>
                                            <button
                                                onClick={(e) => handleBoostPlan(selectedPlan, e)}
                                                disabled={boostingPlanId === selectedPlan?.id}
                                                className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-sm transition-all border shadow-lg ${Array.isArray(selectedPlan?.boosted_by) && selectedPlan.boosted_by.includes(user?.id)
                                                    ? 'bg-orange-100 border-orange-300 text-orange-600 hover:bg-white'
                                                    : 'bg-gray-50 border-gray-100 text-teal-600 hover:bg-orange-50 hover:text-orange-500 hover:border-orange-200'
                                                    }`}
                                                title={Array.isArray(selectedPlan?.boosted_by) && selectedPlan.boosted_by.includes(user?.id) ? "Remove Boost" : "Boost this plan so more people see it!"}
                                            >
                                                <Flame className={`w-5 h-5 ${Array.isArray(selectedPlan?.boosted_by) && selectedPlan.boosted_by.includes(user?.id) ? 'fill-orange-400 text-orange-500' : ''}`} />
                                                <span className="hidden sm:inline">
                                                    {Array.isArray(selectedPlan?.boosted_by) && selectedPlan.boosted_by.includes(user?.id) ? 'Boosted!' : 'Boost Plan'}
                                                </span>
                                                <span className="sm:hidden">
                                                    {Array.isArray(selectedPlan?.boosted_by) && selectedPlan.boosted_by.includes(user?.id) ? 'Boosted' : 'Boost'}
                                                </span>
                                                · {selectedPlan?.boost_count || 0}
                                            </button>
                                        </div>

                                        {Array.isArray(selectedPlan?.reviews) && selectedPlan.reviews.length > 0 ? (
                                            <div className="space-y-4">
                                                {selectedPlan.reviews.map((r, i) => {
                                                    const likeCount = Array.isArray(r.likes) ? r.likes.length : 0;
                                                    const hasLiked = Array.isArray(r.likes) && r.likes.includes(user?.id);
                                                    const replies = Array.isArray(r.replies) ? r.replies : [];
                                                    const isReplying = replyingTo?.planId === selectedPlan.id && replyingTo?.reviewIndex === i;

                                                    return (
                                                        <div key={i} className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-3">
                                                            {/* Review Header */}
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-9 h-9 rounded-xl bg-navy text-white flex items-center justify-center font-black text-sm flex-shrink-0">
                                                                    {r.user_id?.toString().slice(0, 1).toUpperCase() || '?'}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                        <span className="text-xs font-black text-navy">Anonymous Explorer</span>
                                                                        <div className="flex items-center gap-0.5 bg-yellow-50 px-2 py-0.5 rounded-lg border border-yellow-100">
                                                                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                                                            <span className="text-[10px] font-black text-yellow-700">{r.rating}.0</span>
                                                                        </div>
                                                                    </div>
                                                                    <span className="text-[10px] text-gray-400 font-medium">{new Date(r.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                                </div>
                                                            </div>

                                                            {/* Comment */}
                                                            {r.comment && <p className="text-sm text-gray-700 font-medium leading-relaxed">{r.comment}</p>}

                                                            {/* Photo */}
                                                            {r.image && (
                                                                <img src={r.image} alt="User photo" className="w-full max-h-48 rounded-xl object-cover shadow-sm border border-gray-200" loading="lazy" />
                                                            )}

                                                            {/* Quick Tags from per-stop ratings would show here if relevant */}

                                                            {/* Actions: Like + Reply */}
                                                            <div className="flex items-center gap-3 pt-1">
                                                                {/* 👍 Like */}
                                                                <button
                                                                    onClick={() => handleLikeReview(selectedPlan.id, i)}
                                                                    disabled={likingReview?.planId === selectedPlan.id && likingReview?.reviewIndex === i}
                                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all border ${hasLiked
                                                                        ? 'bg-blue-50 border-blue-200 text-blue-600'
                                                                        : 'bg-white border-gray-100 text-gray-400 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-500'
                                                                        }`}
                                                                >
                                                                    <ThumbsUp className={`w-3.5 h-3.5 ${hasLiked ? 'fill-blue-400' : ''}`} />
                                                                    {likeCount > 0 ? likeCount : 'Helpful'}
                                                                </button>

                                                                {/* 💬 Reply */}
                                                                <button
                                                                    onClick={() => {
                                                                        if (isReplying) { setReplyingTo(null); setReplyText(''); }
                                                                        else setReplyingTo({ planId: selectedPlan.id, reviewIndex: i });
                                                                    }}
                                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all border ${isReplying
                                                                        ? 'bg-coral/10 border-coral/20 text-coral'
                                                                        : 'bg-white border-gray-100 text-gray-400 hover:bg-coral/5 hover:text-coral hover:border-coral/20'
                                                                        }`}
                                                                >
                                                                    <Reply className="w-3.5 h-3.5" />
                                                                    Reply{replies.length > 0 ? ` (${replies.length})` : ''}
                                                                </button>
                                                            </div>

                                                            {/* Inline Reply Box */}
                                                            {isReplying && (
                                                                <div className="flex gap-2 pt-1 animate-in slide-in-from-top-2 duration-200">
                                                                    <div className="w-7 h-7 rounded-lg bg-coral text-white flex items-center justify-center font-black text-xs flex-shrink-0">
                                                                        {user?.user_metadata?.first_name?.[0] || '?'}
                                                                    </div>
                                                                    <div className="flex-1 space-y-2">
                                                                        <textarea
                                                                            autoFocus
                                                                            value={replyText}
                                                                            onChange={(e) => setReplyText(e.target.value.slice(0, 200))}
                                                                            placeholder="Write a reply..."
                                                                            className="w-full bg-white border-2 border-gray-100 focus:border-coral rounded-xl p-2.5 text-xs text-navy placeholder:text-gray-300 font-medium outline-none resize-none h-16 transition-colors"
                                                                        />
                                                                        <div className="flex gap-2">
                                                                            <button
                                                                                onClick={handlePostReply}
                                                                                disabled={!replyText.trim() || isPostingReply}
                                                                                className="px-4 py-1.5 bg-coral text-white text-xs font-black rounded-lg disabled:opacity-40 hover:bg-coral/90 transition-colors flex items-center gap-1"
                                                                            >
                                                                                {isPostingReply ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                                                                                Post
                                                                            </button>
                                                                            <button
                                                                                onClick={() => { setReplyingTo(null); setReplyText(''); }}
                                                                                className="px-3 py-1.5 text-gray-400 text-xs font-bold hover:text-navy transition-colors"
                                                                            >Cancel</button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Existing Replies Thread */}
                                                            {replies.length > 0 && (
                                                                <div className="pl-4 border-l-2 border-gray-200 space-y-2 mt-1">
                                                                    {replies.map((rep, ri) => (
                                                                        <div key={ri} className="flex gap-2 items-start">
                                                                            <div className="w-6 h-6 rounded-lg bg-gray-200 text-gray-600 flex items-center justify-center font-black text-[10px] flex-shrink-0">
                                                                                {rep.user_initial || '?'}
                                                                            </div>
                                                                            <div className="bg-white rounded-xl px-3 py-2 border border-gray-100 flex-1">
                                                                                <p className="text-xs text-gray-700 font-medium leading-relaxed">{rep.text}</p>
                                                                                <span className="text-[9px] text-gray-400 font-medium mt-0.5 block">{new Date(rep.timestamp).toLocaleDateString()}</span>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="bg-gradient-to-br from-indigo-50/50 to-white rounded-3xl p-8 text-center border border-indigo-100/50 mb-4 shadow-sm">
                                                <div className="text-4xl mb-3">💬</div>
                                                <p className="text-[15px] font-black text-navy">No reviews yet</p>
                                                <p className="text-xs font-medium text-gray-500 mt-1.5 max-w-[200px] mx-auto">Be the first to try this date and share how it went!</p>
                                            </div>
                                        )}

                                        <button
                                            onClick={() => setRatingPlan(selectedPlan)}
                                            className="w-full mt-4 py-4 bg-coral text-white font-black rounded-2xl hover:bg-coral/90 transition-colors flex justify-center items-center gap-2 shadow-lg shadow-coral/20 active:scale-[0.98]"
                                        >
                                            ❗ I Tried This Plan — Leave a Review
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <motion.div
                            initial={{ x: 50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.3, duration: 0.5, ease: 'easeOut' }}
                            className={`${showMapMobile ? 'flex flex-1 min-h-[80vh] z-50 touch-none pointer-events-auto' : 'absolute inset-0 z-0 md:relative md:flex pointer-events-none md:pointer-events-auto'} md:flex-col w-full md:w-[350px] lg:w-[450px] bg-gray-50 border-l border-gray-200`}
                        >
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
                                                    const steps = selectedPlan.activities || 
                                                                  (Array.isArray(selectedPlan.itinerary) ? selectedPlan.itinerary : selectedPlan.itinerary?.steps || []);
                                                    const firstValidStep = steps.find(s => s.lat !== undefined && s.lng !== undefined && s.lat !== null && s.lng !== null);
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
                                            {(() => {
                                                const steps = selectedPlan.activities || 
                                                              (Array.isArray(selectedPlan.itinerary) ? selectedPlan.itinerary : selectedPlan.itinerary?.steps || []);
                                                return steps
                                                    .filter(step => step.lat !== undefined && step.lng !== undefined && step.lat !== null && step.lng !== null)
                                                    .map((step, idx) => (
                                                        <Marker
                                                            key={idx}
                                                            position={{ lat: Number(step.lat), lng: Number(step.lng) }}
                                                            label={{ text: (idx + 1).toString(), color: 'white', fontWeight: 'bold' }}
                                                        />
                                                    ));
                                            })()}
                                        </GoogleMap>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center min-h-[50vh]">
                                        <MapIcon className="w-12 h-12 mb-4 opacity-50" />
                                        <p className="font-medium">Please add your Google Maps API Key to view the map.</p>
                                    </div>
                                )}
                            </motion.div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* UPGRADE MODAL - Premium Experience */}
            <PremiumExperienceModal
                isOpen={showUpgradeModal}
                onClose={() => { setShowUpgradeModal(false); setLimitType(null); }}
                onUpgrade={(type) => handleBuyPass(type || 'ELITE')}
                limitType={limitType}
            />

            {/* COMMUNITY FEEDBACK MODAL (Rating individual plans) */}
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
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-navy/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-500">
                        <div className="bg-gradient-to-r from-violet-500 to-coral h-2.5 w-full"></div>
                        <div className="p-8 sm:p-12 flex-1 overflow-y-auto">
                            <div className="w-16 h-16 bg-coral/10 rounded-3xl flex items-center justify-center mb-8 shadow-sm">
                                <Heart className="w-8 h-8 fill-coral text-coral" />
                            </div>
                            <h2 className="text-3xl font-black text-navy mb-4 tracking-tight">The Vision Behind DateSpark</h2>
                            <div className="space-y-4 text-gray-600 font-medium leading-relaxed text-sm">
                                <p>Like many couples, my partner and I always hit the same wall on Friday night: <strong>"What are we doing tonight?"</strong> Standard map searches give you random scattered places, not an actual execution plan with timings and sequence flow.</p>
                                <p>I built <strong>DateSpark</strong> to solve decision fatigue by planning structured chronological timelines absolute map route iterations that make sense.</p>
                                <p>Whether it's matching dinner sequences perfectly inside coordinates or automating ticket search deep-links, the goal is always the same: <strong>More deep memories with less stress</strong>.</p>
                                <p className="pt-4 font-black text-navy text-center border-t border-gray-100 mt-6">Thanks for riding along on the journey to better dates! 💖</p>
                            </div>
                            <button
                                onClick={() => setShowVisionModal(false)}
                                className="w-full mt-8 py-4 bg-navy text-white font-black rounded-2xl hover:bg-navy/90 transition-all active:scale-[0.98] shadow-xl shadow-navy/20"
                            >
                                Got it, Let's Date!
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* SUPPORT & FEEDBACK MODAL */}
            {showIdeaModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-navy/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-[#1a2235] border border-white/10 rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-300">
                        <button
                            onClick={() => setShowIdeaModal(false)}
                            className="absolute top-6 right-6 p-2 text-gray-400 hover:text-white bg-white/5 rounded-full transition-colors z-10"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <div className="p-8 sm:p-10">
                            <div className="w-16 h-16 bg-gradient-to-br from-coral to-violet-600 rounded-2xl flex items-center justify-center mb-8 shadow-xl">
                                <LifeBuoy className="w-8 h-8 text-white animate-pulse" />
                            </div>
                            <h2 className="text-3xl font-black text-white mb-3 tracking-tight">Support & Ideas 📬</h2>
                            <p className="text-gray-400 font-medium mb-8 leading-relaxed">Need help or have a feature request? Send a message directly to our team.</p>
                            <textarea
                                value={ideaText}
                                onChange={(e) => setIdeaText(e.target.value)}
                                placeholder="How can we help? / I'd love to see a feature that..."
                                className="w-full h-40 bg-[#252f44] border-2 border-transparent focus:border-coral/50 rounded-2xl p-5 text-white placeholder:text-gray-500 font-medium outline-none transition-all resize-none shadow-inner mb-6"
                            />
                            <button
                                onClick={handleSubmitFeedback}
                                disabled={isSubmittingFeedback || !ideaText.trim()}
                                className={`w-full py-4 bg-coral text-white font-black rounded-2xl shadow-xl shadow-coral/20 hover:bg-coral/90 disabled:opacity-50 transition-all flex items-center justify-center gap-3 active:scale-[0.98] ${isSubmittingFeedback ? 'animate-pulse cursor-wait' : ''}`}
                            >
                                {isSubmittingFeedback ? (
                                    <><Loader2 className="w-5 h-5 animate-spin" /> Sending to Team...</>
                                ) : (
                                    <>Send to Support <ArrowRight className="w-5 h-5" /></>
                                )}
                            </button>
                            <p className="text-center text-[10px] text-gray-500 mt-6 uppercase tracking-widest font-bold">Expect a reply within 24-48 hours</p>
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
                                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                                className="py-4 rounded-2xl text-[14px] font-black text-gray-400 hover:bg-gray-50 transition-all uppercase tracking-widest"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={performDelete}
                                className={`py-4 rounded-2xl text-[14px] font-black text-white shadow-lg transition-all active:scale-95 uppercase tracking-widest ${confirmModal.type === 'delete' ? 'bg-red-600 shadow-red-500/30' :
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


            {/* SHARE CARD MODAL */}
            {shareCardPlan && (
                <ShareCardModal
                    plan={shareCardPlan}
                    user={user}
                    onClose={() => setShareCardPlan(null)}
                />
            )}

            {/* CUSTOMIZE PLAN MODAL (FOR TRENDING SPOTS) */}

            <AnimatePresence>
                {showCustomizeModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden flex flex-col relative"
                        >
                            <div className="p-8 text-center bg-gradient-to-b from-violet-50 to-white">
                                <div className="w-20 h-20 bg-violet-600 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-xl shadow-violet-500/20 transform -rotate-3 hover:rotate-0 transition-transform">
                                    <Sparkles className="w-10 h-10 text-white" />
                                </div>
                                <h3 className="text-2xl font-black text-navy mb-3 tracking-tight">Customize this plan? ✨</h3>
                                <p className="text-gray-500 font-medium text-[15px] leading-relaxed px-4 mb-8">
                                    To swap spots or edit this Trending Plan, we'll save a <span className="text-violet-600 font-bold">private copy</span> to your dashboard so you can make it your own.
                                </p>

                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={handleConfirmCustomize}
                                        disabled={isCustomizing}
                                        className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                                    >
                                        {isCustomizing ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Preparing Spark...
                                            </>
                                        ) : (
                                            <>
                                                Yes, Customize & Swap
                                                <ChevronRight className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowCustomizeModal(false);
                                            setPendingCustomizeAction(null);
                                        }}
                                        className="w-full py-4 text-[13px] font-black text-gray-400 hover:text-navy transition-colors uppercase tracking-widest"
                                    >
                                        Maybe Later
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* BATCH ACTION BAR (Floating) */}
            <AnimatePresence>
                {isSelectMode && selectedPlanIds.length > 0 && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-24 left-4 right-4 z-[55] md:bottom-8 md:left-1/2 md:-translate-x-1/2 md:w-auto"
                    >
                        <div className="bg-navy/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-6 md:min-w-[400px]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-coral/20 rounded-xl flex items-center justify-center">
                                    <Check className="w-5 h-5 text-coral" />
                                </div>
                                <div>
                                    <p className="text-white font-black text-sm">{selectedPlanIds.length} Selected</p>
                                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Multiple Plans</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setSelectedPlanIds([])}
                                    className="px-4 py-2 text-white/60 hover:text-white text-xs font-bold transition-colors"
                                >
                                    Deselect
                                </button>
                                <button
                                    onClick={handleBatchDelete}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black transition-all shadow-lg active:scale-95"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete {selectedPlanIds.length}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="lg:hidden">
                <BottomNav
                    currentTab={currentTab}
                    onTabChange={setCurrentTab}
                    avatarUrl={user?.user_metadata?.avatar_url}
                    userInitial={user?.user_metadata?.first_name?.[0] || 'K'}
                />
            </div>

            {/* GLOBAL TOAST NOTIFICATION */}
            <AnimatePresence>
                {toastMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
                        exit={{ opacity: 0, y: 20, scale: 0.9, x: '-50%' }}
                        className="fixed top-8 left-1/2 z-[2000] pl-4 pr-2 py-2.5 bg-navy/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-coral/20 flex items-center gap-3 max-w-[min(90vw,420px)]"
                        role="status"
                    >
                        <div className="w-8 h-8 bg-coral rounded-full flex items-center justify-center shadow-lg flex-shrink-0 animate-bounce">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <p className="text-white font-black text-sm tracking-tight flex-1 min-w-0 leading-snug">{toastMessage}</p>
                        <button
                            type="button"
                            onClick={() => setToastMessage('')}
                            className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-coral shrink-0"
                            aria-label="Dismiss notification"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* ── GENERATION OVERLAY ── */}
            <AnimatePresence>
                {isGenerating && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-navy/90 backdrop-blur-md text-white px-6 text-center"
                    >
                        <div className="relative mb-8">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                className="w-24 h-24 border-t-2 border-r-2 border-coral rounded-full"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Sparkles className="w-8 h-8 text-coral animate-pulse" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-black mb-3 tracking-tight text-white">Designing your Concierge Experience</h2>
                        <p className="text-white/60 font-bold text-sm max-w-sm font-inter">
                            {generatingStatus || 'Our AI is hand-picking the best spots for your date...'}
                        </p>
                        <div className="mt-8 flex gap-2">
                            <span className="w-2 h-2 bg-coral rounded-full animate-bounce [animation-delay:-0.3s]" />
                            <span className="w-2 h-2 bg-coral rounded-full animate-bounce [animation-delay:-0.15s]" />
                            <span className="w-2 h-2 bg-coral rounded-full animate-bounce" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Dashboard;