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
    ChevronLeft,
    Circle,
    Globe,
    Moon,
    Sun,
    Shield,
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
    Copy,
    Flame,
    ThumbsUp,
    Reply
} from 'lucide-react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { loadStripe } from '@stripe/stripe-js';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import BottomNav from '../components/BottomNav';
import PremiumExperienceModal from '../components/PremiumExperienceModal';
import UsageBadge from '../components/UsageBadge';
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
    const [currentTab, setCurrentTab] = useState('home'); // 'home', 'plans', 'discovery', 'account'
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
        const isCurrentlyAdmin = userEmail === adminEmail;
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

    // --- BOOST / REPLY STATE ---
    const [boostingPlanId, setBoostingPlanId] = useState(null); // show loading on boost btn
    const [replyingTo, setReplyingTo] = useState(null); // { planId, reviewIndex }
    const [replyText, setReplyText] = useState('');
    const [isPostingReply, setIsPostingReply] = useState(false);
    const [likingReview, setLikingReview] = useState(null); // { planId, reviewIndex }

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
            'anniversary': { label: 'Anniversary', icon: 'ðŸ’' },
            'icebreaker': { label: 'Icebreaker', icon: 'ðŸ§Š' },
            'budget': { label: 'Budget-Friendly', icon: 'ðŸ’¸' },
            'rainy': { label: 'Rainy Day', icon: 'ðŸŒ§ï¸' }
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

    const handleSignOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            alert(`Error signing out: ${error.message}`);
        } else {
            localStorage.clear();
            navigate('/auth');
        }
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsUploading(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Math.random()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            // 1. Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            // 3. Update Auth Metadata
            const { error: updateError } = await supabase.auth.updateUser({
                data: { avatar_url: publicUrl }
            });

            if (updateError) throw updateError;

            // 4. Update local state
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
                if (user?.email) {
                    localStorage.setItem('userEmail', user.email);
                }

                // Fetch premium status and usage from secure backend proxy
                const [premRes, usageRes] = await Promise.all([
                    fetch(`/api/user-premium/${user.id}`),
                    fetch(`/api/user-usage/${user.id}`)
                ]);

                if (premRes.ok) {
                    const data = await premRes.ok ? await premRes.json() : { isPremium: false };
                    
                    // Admin Special Logic: Sync with DB but respect manual toggle for testing
                    if (user?.email?.toLowerCase() === 'rayanerold@gmail.com') {
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

                            // Admin Special Logic: Sync with DB but respect manual toggle for testing
                            if (user?.email === 'rayanerold@gmail.com') {
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
            alert('ðŸŽ‰ Payment Successful! You are now a Premium Member.');
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
        } else if (stripePayment === 'canceled') {
            alert('âŒ Payment Canceled.');
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
                    setFeedbackMessage(newStatus ? 'Plan moved to Favorites! ðŸ’–' : 'Plan removed from Favorites.');
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

        const text = `âœ¨ Our custom ${planToShare.vibe} date plan carefully crafted by DateSpark!\n\nTimeline:\n${formattedStops}\n\nCheck out the full interactive map here:`;

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

            alert('Thank you for your feedback! ðŸš€ (Message sent to admin)');
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
        
        // Robust 2MB limit check for storage (much better than Base64)
        if (file.size > 2 * 1024 * 1024) {
            alert('Image is too large. Please select a photo under 2MB for your profile.');
            return;
        }

        setIsUploading(true);
        try {
            // 1. Upload to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}_${Date.now()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            // We use 'avatars' bucket. If it fails, fallback to metadata but warn.
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { 
                    cacheControl: '3600',
                    upsert: true 
                });

            if (uploadError) {
                console.warn('Storage upload failed, attempting fallback...', uploadError);
                throw new Error('Failed to upload image to storage.');
            }

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            // 3. Update Auth Metadata
            const { error: authError } = await supabase.auth.updateUser({
                data: { avatar_url: publicUrl }
            });

            if (authError) throw authError;

            // 4. Sync with Backend DB (Profiles table)
            try {
                await fetch('/api/update-profile-photo', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.id, avatarUrl: publicUrl })
                });
            } catch (syncErr) {
                console.error('DB Sync failed, but photo saved to auth:', syncErr);
            }

            // 5. Update local state
            const { data: { user: updatedUser } } = await supabase.auth.getUser();
            setUser(updatedUser);
            
            // Sync with current session
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) setUser(session.user);

            alert('Profile picture updated successfully!');
        } catch (err) {
            console.error('Avatar Process Error:', err);
            alert('Error processing image: ' + err.message);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteAvatar = async () => {
        if (!window.confirm('Are you sure you want to remove your profile picture?')) return;

        setIsUploading(true);
        try {
            // 1. Update Auth Metadata
            const { error: authError } = await supabase.auth.updateUser({
                data: { avatar_url: null }
            });

            if (authError) throw authError;

            // 2. Sync with Backend DB
            try {
                await fetch('/api/update-profile-photo', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.id, avatarUrl: null })
                });
            } catch (syncErr) {
                console.error('DB Sync failed:', syncErr);
            }

            // 3. Update local state
            const { data: { user: updatedUser } } = await supabase.auth.getUser();
            setUser(updatedUser);
            alert('Profile picture removed.');
        } catch (err) {
            console.error('Avatar Delete Error:', err);
            alert('Failed to remove profile picture.');
        } finally {
            setIsUploading(false);
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
            const scoreA = ((a.avg_rating || 0) * 0.6) + (Math.log10((a.total_tries || 0) + 1) * 0.2) + ((a.boost_count || 0) * 0.2);
            const scoreB = ((b.avg_rating || 0) * 0.6) + (Math.log10((b.total_tries || 0) + 1) * 0.2) + ((b.boost_count || 0) * 0.2);
            return scoreB - scoreA;
        })
        .slice(0, 3);

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // SOCIAL HANDLERS â€” Boost, Like Review, Reply to Review
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    const handleBoostPlan = async (plan, e) => {
        e.stopPropagation();
        if (!user?.id) return;
        setBoostingPlanId(plan.id);
        try {
            const res = await fetch('/api/boost-plan', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId: plan.id, userId: user.id })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            // Optimistic update
            const updatePlan = p => p.id === plan.id
                ? { ...p, boost_count: data.boost_count, boosted_by: data.boosted ? [...(p.boosted_by || []), user.id] : (p.boosted_by || []).filter(id => id !== user.id) }
                : p;
            setPlans(prev => prev.map(updatePlan));
            if (selectedPlan?.id === plan.id) setSelectedPlan(prev => updatePlan(prev));
            setGlobalTrendingPlans(prev => prev.map(updatePlan));
        } catch (err) {
            console.error('[Boost]', err);
        } finally {
            setBoostingPlanId(null);
        }
    };

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

        const isLockedPlan = enforceLocked || (!isPremium && activeTab === 'all' && planIdx >= 2);
        const isPartiallyLocked = !isPremium && activeTab === 'all' && planIdx === 1;

        return (
            <div
                key={plan.id}
                className={`bg-white rounded-3xl border border-gray-100 ${isCompact ? 'p-4' : 'p-6'} shadow-sm transition-all group relative overflow-hidden flex-shrink-0 w-[85vw] sm:w-auto snap-center ${isLockedPlan ? 'cursor-not-allowed border-gray-200' : 'hover:shadow-md'}`}
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
                            <span className="text-white text-xl">ðŸ”’</span>
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

                {/* ðŸ”¥ Trending Badge */}
                {(plan.boost_count || 0) >= 5 && (
                    <div className="mb-3 flex items-center gap-2 px-3 py-1.5 bg-orange-50 rounded-xl border border-orange-100 w-fit">
                        <Flame className="w-4 h-4 text-orange-500 fill-orange-400" />
                        <span className="text-xs font-black text-orange-600 uppercase tracking-wider">Trending Spot</span>
                    </div>
                )}

                {/* Social Row: Rating + Boost + Tried It */}
                <div className="flex items-center gap-2 pt-4 mt-2 border-t border-gray-100 mb-4">
                    {/* Rating */}
                    <div className="flex items-center gap-1.5 flex-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                        <span className="text-sm font-black text-navy">{plan.avg_rating ? parseFloat(plan.avg_rating).toFixed(1) : 'New'}</span>
                        <span className="text-xs font-medium text-gray-400">({plan.total_tries || 0})</span>
                    </div>

                    {/* ðŸ”¥ Boost Button */}
                    <button
                        onClick={(e) => handleBoostPlan(plan, e)}
                        disabled={boostingPlanId === plan.id}
                        title={Array.isArray(plan.boosted_by) && plan.boosted_by.includes(user?.id) ? 'Remove Boost' : 'Boost this Spot!'}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-black transition-all border ${
                            Array.isArray(plan.boosted_by) && plan.boosted_by.includes(user?.id)
                                ? 'bg-orange-100 border-orange-300 text-orange-600'
                                : 'bg-gray-50 border-gray-100 text-gray-400 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-500'
                        }`}
                    >
                        <Flame className={`w-3.5 h-3.5 ${Array.isArray(plan.boosted_by) && plan.boosted_by.includes(user?.id) ? 'fill-orange-400' : ''}`} />
                        {plan.boost_count || 0}
                    </button>

                    {/* â¤ï¸ Tried It */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (isLockedPlan) setShowUpgradeModal(true);
                            else setRatingPlan(plan);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-coral/10 hover:bg-coral/20 text-coral rounded-xl text-xs font-black transition-colors border border-coral/10"
                    >
                        <Heart className="w-3.5 h-3.5" /> Tried It
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

    // --- SUB-PAGE RENDER FUNCTIONS ---

    const renderOverview = () => (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Compact New Plan Button */}
            <div className="mb-6 px-4 flex justify-center">
                <Link 
                    to="/generate" 
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-coral text-white font-black rounded-xl hover:bg-coral/90 transition-all shadow-lg shadow-coral/20 hover:-translate-y-0.5 active:scale-[0.98] group"
                >
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                    <span className="text-[15px] tracking-tight">Start New Plan</span>
                </Link>
            </div>

            {/* Referral Loop Section */}
            <div className="mb-6 bg-gradient-to-br from-navy to-navy/90 rounded-2xl p-4 relative overflow-hidden shadow-lg border border-navy-100/10 group">
                <div className="absolute -right-8 -top-8 w-24 h-24 bg-coral/15 rounded-full blur-2xl animate-pulse" />
                <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-coral to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-coral/20 flex-shrink-0 group-hover:scale-105 transition-transform">
                        <Gift className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                        <h2 className="text-lg font-black text-white tracking-tight">Give 30 Days, Get 30 Days ðŸ’–</h2>
                        <p className="text-white/60 text-[11px] font-medium leading-relaxed max-w-sm">
                            Invite friends to join and unlock a **Full Month of Plus** for free!
                        </p>
                    </div>
                    <div className="flex flex-col gap-2 w-full sm:w-auto">
                        <div className="bg-white/5 backdrop-blur-md rounded-xl p-2.5 border border-white/10 flex items-center gap-3 bg-navy/40">
                            <span className="font-mono font-black text-base text-coral tracking-wider flex-1">{referralDetails.code || 'SPARK-REF'}</span>
                            <button 
                                onClick={() => {
                                    navigator.clipboard.writeText(`${window.location.origin}/signup?ref=${referralDetails.code}`);
                                    setCopied(true);
                                    setTimeout(() => setCopied(false), 2000);
                                }}
                                className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-white/40 hover:text-white"
                            >
                                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Empty State / Hero */}
            {plans.length === 0 ? (
                <div className="bg-gradient-to-br from-navy to-navy/90 rounded-[2.5rem] p-12 text-center relative overflow-hidden shadow-xl border border-navy-100/20 max-w-2xl mx-auto my-8">
                    <div className="absolute -right-16 -top-16 w-64 h-64 bg-coral/20 rounded-full blur-3xl animate-pulse" />
                    <div className="relative z-10 space-y-4">
                        <div className="w-20 h-20 bg-gradient-to-br from-coral to-pink-500 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-coral/30 rotate-6 hover:rotate-0 transition-transform duration-300">
                            <Heart className="w-10 h-10 fill-white text-white" />
                        </div>
                        <h2 className="text-4xl font-black text-white tracking-tight">Letâ€™s plan your next date ðŸ’–</h2>
                        <p className="text-white/80 max-w-md mx-auto font-medium text-lg">Stop deciding, start dating. Generate custom timelines and interactive maps in seconds.</p>
                        <div className="pt-4">
                            <Link to="/generate" className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-navy font-black rounded-2xl hover:bg-coral hover:text-white transition-all shadow-xl hover:-translate-y-1 active:scale-[0.98] group">
                                Start your first plan <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                            </Link>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between mb-2 px-4">
                        <h3 className="text-xl font-black text-navy border-l-4 border-coral pl-4">Latest Discoveries</h3>
                        <button onClick={() => setCurrentTab('plans')} className="text-sm font-bold text-coral hover:bg-coral/5 px-4 py-2 rounded-xl transition-all">View Full History</button>
                    </div>
                    <div className="flex md:grid md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-x-auto md:overflow-x-visible snap-x snap-mandatory px-4 md:px-0 pb-4 md:pb-0 scrollbar-hide">
                        {plans.slice(0, 3).map((plan, idx) => renderPlanCard(plan, idx, false))}
                    </div>
                </div>
            )}

            {/* Community Trending */}
            {globalTrendingPlans.length > 0 && (
                <div className="pt-8">
                    <div className="flex items-center justify-between mb-8 px-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-coral/10 rounded-2xl flex items-center justify-center text-coral shadow-inner">
                                <Sparkles className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-navy tracking-tight">Popular in Discovery</h3>
                                <p className="text-gray-500 text-sm font-medium">Hand-picked itineraries loved by the community.</p>
                            </div>
                        </div>
                        <button onClick={() => setCurrentTab('discovery')} className="hidden sm:flex items-center gap-2 px-4 py-2 bg-navy text-white rounded-xl text-xs font-bold hover:bg-navy/90 transition-all">
                            Explore All <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="flex md:grid md:grid-cols-2 lg:grid-cols-3 gap-8 overflow-x-auto md:overflow-x-visible snap-x snap-mandatory px-4 md:px-0 pb-4 md:pb-0 scrollbar-hide">
                        {globalTrendingPlans.slice(0, 3).map((plan, idx) => renderPlanCard(plan, idx, false, true))}
                    </div>
                </div>
            )}
        </div>
    );

    const renderMyPlans = () => (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4">
                <div>
                    <h2 className="text-2xl font-black text-navy tracking-tight">Your Date Schedule</h2>
                    <p className="text-gray-500 text-sm font-medium mt-1">Manage all your generated and saved itineraries.</p>
                </div>
                <div className="flex items-center gap-3">
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
                    <p className="text-gray-500 mb-6">Start planning your first unforgettable date tonight.</p>
                    <Link to="/generate" className="inline-flex items-center gap-2 px-8 py-3 bg-navy text-white font-bold rounded-xl hover:bg-navy/90 transition-all">
                        <Plus className="w-4 h-4" /> Create First Plan
                    </Link>
                </div>
            ) : (
                <div className="flex md:grid md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-x-auto md:overflow-x-visible snap-x snap-mandatory px-4 md:px-0 pb-4 md:pb-0 scrollbar-hide">
                    {(activeTab === 'favorites' ? plans.filter(p => p.is_favorite) : plans).filter(p => !p.deleted_at).map((plan, idx) => renderPlanCard(plan, idx, false))}
                </div>
            )}
        </div>
    );

    const renderDiscovery = () => (
        <div className="space-y-8 animate-in fade-in duration-500 flex flex-col h-full min-h-[70vh]">
            <div className="px-4 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-coral/10 text-coral rounded-full text-xs font-black uppercase tracking-[0.2em] mb-4 outline outline-1 outline-coral/20">
                    <Flame className="w-3.5 h-3.5 fill-coral" /> Discovery Mode
                </div>
                <h2 className="text-4xl font-black text-navy tracking-tight">Todayâ€™s Top Sparks ðŸ”¥</h2>
                <p className="text-gray-500 text-sm font-medium mt-1">Swipe right on dates you love to save them to your Favorites.</p>
            </div>
            
            <div className="flex-1 relative flex items-center justify-center mt-6">
                {globalTrendingPlans.length > 0 ? (
                    <div className="relative w-full max-w-[440px] h-[520px]">
                        {/* Background Decorative Accents */}
                        <div className="absolute inset-0 bg-gradient-to-br from-coral/10 to-transparent blur-3xl -z-10 rounded-full scale-125 opacity-30" />
                        
                        {globalTrendingPlans.slice(swipeIndex, swipeIndex + 3).reverse().map((plan, i) => {
                            const isTop = i === 2 || (globalTrendingPlans.length - swipeIndex < 3 && i === (globalTrendingPlans.length - swipeIndex - 1));
                            return (
                                <div key={plan.id} className="absolute inset-0 transform transition-all duration-300">
                                    <SwipeCard 
                                        plan={plan}
                                        isTop={isTop}
                                        theme={appTheme}
                                        onSwipe={(dir) => {
                                            if (dir === 'right') handleToggleFavorite(plan);
                                            setSwipeIndex(prev => prev + 1);
                                        }}
                                        onView={() => setSelectedPlan(plan)}
                                    />
                                </div>
                            );
                        })}
                        {swipeIndex >= globalTrendingPlans.length && (
                            <div className="flex flex-col items-center justify-center h-full text-center p-10 bg-white rounded-[3rem] border-2 border-dashed border-gray-100 shadow-sm animate-in zoom-in-95 duration-500">
                                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                                    <History className="w-10 h-10 text-gray-300 animate-pulse" />
                                </div>
                                <h3 className="text-2xl font-black text-navy tracking-tight">End of the stack!</h3>
                                <p className="text-gray-400 text-[13px] mt-2 font-medium leading-relaxed max-w-[220px] mx-auto">Weâ€™ve shown you everything popular in your area. Come back tomorrow for fresh sparks!</p>
                                <button 
                                    onClick={() => setSwipeIndex(0)} 
                                    className="mt-8 px-10 py-4 bg-navy text-white font-black rounded-2xl active:scale-95 transition-all shadow-xl shadow-navy/20 flex items-center gap-2 group"
                                >
                                    <History className="w-4 h-4 group-hover:-rotate-180 transition-transform duration-500" />
                                    Explore Again
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-12 h-12 text-coral animate-spin" />
                        <p className="text-gray-400 font-bold text-sm tracking-widest animate-pulse">FINDING FRESH SPARKS...</p>
                    </div>
                )}
            </div>
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
                        {/* Integrated Avatar Picker */}
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
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">First Name</label>
                                <input
                                    type="text"
                                    value={profileData.first_name}
                                    onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
                                    className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-coral focus:bg-white rounded-2xl outline-none font-bold text-navy transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Last Name</label>
                                <input
                                    type="text"
                                    value={profileData.last_name}
                                    onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })}
                                    className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-coral focus:bg-white rounded-2xl outline-none font-bold text-navy transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Email Address</label>
                            <input
                                type="email"
                                value={profileData.email}
                                disabled
                                className="w-full px-5 py-4 bg-gray-50/50 border-2 border-transparent rounded-2xl font-bold text-gray-400 cursor-not-allowed"
                            />
                            <p className="text-[10px] text-gray-400 mt-2 px-1 italic">Email cannot be changed directly for security.</p>
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
                                    <p className="text-gray-500 font-bold text-xs">{isPremium ? 'Unlimited access enabled' : 'Limited itinerary generation'}</p>
                                </div>
                            </div>
                            {!isPremium && <span className="bg-coral text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse shadow-lg shadow-coral/30">Upgrade</span>}
                        </div>
                        
                        <div className="space-y-4 mb-8">
                           {(isPremium ? [
                                "Unlimited AI date generations",
                                "30-Day Unrestricted Access",
                                "Priority server processing",
                                "Unlock Custom App Themes",
                                "Full Map Interaction"
                           ] : [
                                "3 Free Generations / Month",
                                "Standard AI processing",
                                "Public Date Spark browsing",
                                "Save 3 Favorites"
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
                            <button 
                                onClick={handleManageSubscription}
                                className="w-full py-4 text-gray-400 font-black text-xs uppercase tracking-widest hover:text-red-500 transition-colors border-t border-coral/10 mt-4 pt-8"
                            >
                                Downgrade or Cancel Subscription
                            </button>
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
                { id: 'light', name: 'Classic Day', desc: 'The original clean experience', colors: 'from-blue-50 to-white' },
                { id: 'dark', name: 'Midnight', desc: 'Deep ocean blues for night planning', colors: 'from-navy to-black' },
                { id: 'sunset', name: 'Golden Hour', desc: 'Warm palettes for romantic vibes', colors: 'from-orange-100 to-pink-50' }
            ];

            return (
                <div className="animate-in slide-in-from-right-4 duration-300 max-w-2xl mx-auto pb-20 px-4">
                    {renderBackHeader('App Appearance')}
                    
                    <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm space-y-10">
                        {/* Explicit Theme Picker */}
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

                        {/* High-Level Display Toggle */}
                        <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
                            <div className="flex items-center gap-5">
                                <div className={`w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 shadow-inner`}>
                                    {appTheme === 'dark' ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
                                </div>
                                <div className="text-left">
                                    <p className="font-black text-navy">Automatic Dark Mode</p>
                                    <p className="text-[11px] text-gray-400 font-medium mt-0.5">Force dark aesthetics override</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setAppTheme(appTheme === 'dark' ? 'light' : 'dark')}
                                className={`w-14 h-7 rounded-full transition-all relative flex items-center shadow-inner ${appTheme === 'dark' ? 'bg-navy' : 'bg-gray-200'}`}
                            >
                                <div className={`w-5 h-5 rounded-full bg-white shadow-lg absolute transition-all ${appTheme === 'dark' ? 'left-8' : 'left-1'}`} />
                            </button>
                        </div>
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

                {/* Promotional Card matching requested style */}
                <div className="bg-gradient-to-br from-coral/5 to-white rounded-[2.5rem] border border-coral/10 p-8 text-center shadow-lg shadow-coral/5 mb-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Sparkles className="w-20 h-20 text-coral rotate-12" />
                    </div>
                    <h3 className="text-[10px] font-black text-coral uppercase tracking-[0.3em] mb-3">Spread the Word</h3>
                    <p className="text-gray-500 text-xs font-bold mb-8 leading-relaxed max-w-xs mx-auto">
                        Love DateSpark? Share it with a friend and help them plan their next dream date!
                    </p>
                    <button 
                        onClick={() => {
                            if (navigator.share) {
                                navigator.share({
                                    title: 'DateSpark',
                                    text: 'I found the perfect tool for planning modern dates!',
                                    url: window.location.origin
                                });
                            } else {
                                navigator.clipboard.writeText(window.location.origin);
                                alert('Link copied to clipboard!');
                            }
                        }}
                        className="w-full py-4 bg-coral text-white font-black rounded-2xl hover:bg-coral/90 hover:-translate-y-0.5 active:translate-y-0 transition-all shadow-xl shadow-coral/30 flex items-center justify-center gap-2"
                    >
                        <Share2 className="w-5 h-5" />
                        Share DateSpark
                    </button>
                </div>

                {/* Subtle Logout */}
                <button 
                    onClick={handleSignOut}
                    className="w-full py-4 text-gray-300 font-black text-[10px] uppercase tracking-widest hover:text-red-500 transition-colors"
                >
                    Sign Out Securely
                </button>

                <p className="text-[10px] text-gray-200 font-black text-center pt-8 uppercase tracking-[0.4em]">Version 2.5 Master</p>
            </div>
        );
    };


    const renderFavorites = () => (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4">
                <div>
                    <h2 className="text-2xl font-black text-navy tracking-tight">Your Favorites ðŸ’–</h2>
                    <p className="text-gray-500 text-sm font-medium mt-1">Your hand-picked itineraries for perfect dates.</p>
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
                <div className="flex md:grid md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-x-auto md:overflow-x-visible snap-x snap-mandatory px-4 md:px-0 pb-4 md:pb-0 scrollbar-hide">
                    {plans.filter(p => !p.deleted_at && p.is_favorite).map((plan, idx) => renderPlanCard(plan, idx, false))}
                </div>
            )}
        </div>
    );

    const renderHeader = () => {
        const tabTitles = {
            home: "Welcome Back",
            favorites: "Your Favorites",
            discovery: "Discovery Mode",
            account: "Your Account"
        };
        const tabSubtitles = {
            home: "Start your next adventure.",
            favorites: "Hand-picked itineraries you love.",
            discovery: "Swipe right to save your favorites.",
            account: "Manage your profile and settings."
        };

        return (
            <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Link to="/dashboard" onClick={() => setCurrentTab('home')} className="flex items-center gap-2">
                        <img src="/datespark-logo.png" alt="DateSpark Logo" className="w-8 h-8 rounded-lg shadow-md object-cover bg-white" />
                        <span className="text-lg font-bold text-navy">DateSpark</span>
                    </Link>

                    <div className="flex items-center gap-4">
                        {/* Desktop-only Tab Navigation */}
                        <nav className="hidden md:flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
                             <button
                                onClick={() => setCurrentTab('home')}
                                className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${currentTab === 'home' ? 'bg-white text-navy shadow-sm' : 'text-gray-400 hover:text-navy'}`}
                             >
                                Home
                             </button>
                             <button
                                onClick={() => setCurrentTab('favorites')}
                                className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${currentTab === 'favorites' ? 'bg-white text-navy shadow-sm' : 'text-gray-400 hover:text-navy'}`}
                             >
                                Favorites
                             </button>
                             <button
                                onClick={() => setCurrentTab('discovery')}
                                className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${currentTab === 'discovery' ? 'bg-white text-navy shadow-sm' : 'text-gray-400 hover:text-navy'}`}
                             >
                                Discover
                             </button>
                        </nav>

                        <div className="flex items-center gap-4 relative">
                            {/* Mock Toggle - ADMIN ONLY (rayanerold@gmail.com) */}
                            {(user?.email?.toLowerCase() === 'rayanerold@gmail.com' || localStorage.getItem('userEmail')?.toLowerCase() === 'rayanerold@gmail.com') && (
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
                                        {user?.user_metadata?.first_name?.[0] || 'K'}
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

    return (
        <div className={`min-h-screen transition-colors duration-300 ${appTheme === 'dark' ? 'bg-navy text-white [&_.bg-white]:bg-navy/80 [&_.text-navy]:text-white [&_.border-gray-100]:border-white/10' : appTheme === 'sunset' ? 'bg-gradient-to-br from-coral/5 to-pink-50/50 bg-white' : 'bg-gray-50'}`}>
            {/* Minimal App Header */}
            {renderHeader()}

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-32">
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
                        {currentTab === 'discovery' && renderDiscovery()}
                        {currentTab === 'account' && renderAccount()}
                    </motion.div>
                </AnimatePresence>
            </main>

        {/* View Plan Modal (Sleek Timeline UI) */}
        {selectedPlan && (
            <div
                className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center sm:p-4 bg-navy/50 backdrop-blur-sm"
                style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
                <div className="bg-[#f8f9fa] rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl w-full max-w-5xl h-[95svh] sm:max-h-[90vh] overflow-hidden flex flex-col md:flex-row relative">
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

                        {/* Sticky Header â€” fully mobile/iPhone safe */}
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
                                        <h2 className="text-sm font-black font-outfit tracking-tight truncate">{selectedPlan.vibe} Date</h2>
                                        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-white/10 rounded-md border border-white/10 flex-shrink-0">
                                            <History className="w-2.5 h-2.5 text-gray-400" />
                                            <span className="text-[9px] font-black text-white/70">{selectedPlan.total_tries || 0}</span>
                                        </div>
                                    </div>
                                    <p className="text-[9px] text-gray-400 uppercase tracking-widest font-black opacity-70 truncate">
                                        {!Array.isArray(selectedPlan.itinerary) && selectedPlan.itinerary?.metadata?.planDate ?
                                            `${new Date(selectedPlan.itinerary.metadata.planDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
                                            : 'Available in New York City'}
                                    </p>
                                </div>
                            </div>

                            {/* Right: Actions + Close */}
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                <button
                                    onClick={() => handleForkPlan(selectedPlan)}
                                    className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-all text-[10px] font-black group shadow-lg shadow-violet-500/20"
                                >
                                    <Sparkles className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
                                    <span>Steal & Customize</span>
                                </button>
                                {/* Mobile compact Steal button */}
                                <button
                                    onClick={() => handleForkPlan(selectedPlan)}
                                    className="sm:hidden flex items-center gap-1 px-2.5 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-all text-[9px] font-black"
                                >
                                    <Sparkles className="w-3 h-3" />
                                    <span>Steal</span>
                                </button>
                                <button
                                    onClick={handleShare}
                                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all text-[9px] sm:text-[10px] font-black group"
                                >
                                    <Share2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-coral group-hover:scale-110 transition-transform" />
                                    <span className="hidden sm:inline">Share Plan</span>
                                </button>
                                {/* Close / Back â€” always visible, min 44px tap target */}
                                <button
                                    onClick={() => {
                                        setSelectedPlan(null);
                                        setShowMapMobile(false);
                                    }}
                                    className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                                    aria-label="Close plan"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Mobile Map Spacer */}
                        <div className="h-[180px] sm:h-[200px] md:hidden relative flex items-end justify-center pb-2 flex-shrink-0 z-20">
                            <button
                                onClick={() => setShowMapMobile(true)}
                                className="bg-navy/95 backdrop-blur-md text-white px-4 py-2 rounded-full text-xs font-bold shadow-md flex items-center gap-1.5 border border-white/20 transform transition-all active:scale-95 mt-auto min-h-[40px]"
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
                                                    <span className="text-[7px]">ðŸ”’</span>
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
                                                                                    â˜… {alt.rating || 'New'}
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
                                {/* Section Header + Boost this Plan */}
                                <div className="flex items-center justify-between mb-5">
                                    <h3 className="text-xl font-black text-navy flex items-center gap-2">
                                        ðŸ’¬ What People Say
                                    </h3>
                                    <button
                                        onClick={(e) => handleBoostPlan(selectedPlan, e)}
                                        disabled={boostingPlanId === selectedPlan?.id}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-sm transition-all border ${
                                            Array.isArray(selectedPlan?.boosted_by) && selectedPlan.boosted_by.includes(user?.id)
                                                ? 'bg-orange-100 border-orange-300 text-orange-600'
                                                : 'bg-gray-50 border-gray-100 text-gray-400 hover:bg-orange-50 hover:text-orange-500 hover:border-orange-200'
                                        }`}
                                        title="Boost this plan so more people see it!"
                                    >
                                        <Flame className={`w-4 h-4 ${Array.isArray(selectedPlan?.boosted_by) && selectedPlan.boosted_by.includes(user?.id) ? 'fill-orange-400 text-orange-500' : ''}`} />
                                        {Array.isArray(selectedPlan?.boosted_by) && selectedPlan.boosted_by.includes(user?.id) ? 'Boosted!' : 'Boost'} Â· {selectedPlan?.boost_count || 0}
                                    </button>
                                </div>
                                
                                {Array.isArray(selectedPlan?.reviews) && selectedPlan.reviews.length > 0 ? (
                                    <div className="space-y-4">
                                        {selectedPlan.reviews.map((r, i) => {
                                            const likeCount = Array.isArray(r.likes) ? r.likes.length : 0;
                                            const hasLiked  = Array.isArray(r.likes) && r.likes.includes(user?.id);
                                            const replies   = Array.isArray(r.replies) ? r.replies : [];
                                            const isReplying = replyingTo?.planId === selectedPlan.id && replyingTo?.reviewIndex === i;

                                            return (
                                                <div key={i} className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-3">
                                                    {/* Review Header */}
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-xl bg-navy text-white flex items-center justify-center font-black text-sm flex-shrink-0">
                                                            {r.user_id?.toString().slice(0,1).toUpperCase() || '?'}
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
                                                        {/* ðŸ‘ Like */}
                                                        <button
                                                            onClick={() => handleLikeReview(selectedPlan.id, i)}
                                                            disabled={likingReview?.planId === selectedPlan.id && likingReview?.reviewIndex === i}
                                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all border ${
                                                                hasLiked
                                                                    ? 'bg-blue-50 border-blue-200 text-blue-600'
                                                                    : 'bg-white border-gray-100 text-gray-400 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-500'
                                                            }`}
                                                        >
                                                            <ThumbsUp className={`w-3.5 h-3.5 ${hasLiked ? 'fill-blue-400' : ''}`} />
                                                            {likeCount > 0 ? likeCount : 'Helpful'}
                                                        </button>

                                                        {/* ðŸ’¬ Reply */}
                                                        <button
                                                            onClick={() => {
                                                                if (isReplying) { setReplyingTo(null); setReplyText(''); }
                                                                else setReplyingTo({ planId: selectedPlan.id, reviewIndex: i });
                                                            }}
                                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all border ${
                                                                isReplying
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
                                        <div className="text-4xl mb-3">ðŸ’¬</div>
                                        <p className="text-[15px] font-black text-navy">No reviews yet</p>
                                        <p className="text-xs font-medium text-gray-500 mt-1.5 max-w-[200px] mx-auto">Be the first to try this date and share how it went!</p>
                                    </div>
                                )}
                                
                                <button 
                                    onClick={() => setRatingPlan(selectedPlan)}
                                    className="w-full mt-4 py-4 bg-coral text-white font-black rounded-2xl hover:bg-coral/90 transition-colors flex justify-center items-center gap-2 shadow-lg shadow-coral/20 active:scale-[0.98]"
                                >
                                    â­ I Tried This Plan â€” Leave a Review
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
                            <p className="pt-4 font-black text-navy text-center border-t border-gray-100 mt-6">Thanks for riding along on the journey to better dates! ðŸ’–</p>
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

        {/* FEEDBACK / IDEA MODAL */}
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
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-xl">
                            <Compass className="w-8 h-8 text-violet-600" />
                        </div>
                        <h2 className="text-3xl font-black text-white mb-3">Have an Idea? ðŸ’¡</h2>
                        <p className="text-gray-400 font-medium mb-8 leading-relaxed">What improvements or features would you love to see in DateSpark?</p>
                        <textarea
                            value={feedbackMessage}
                            onChange={(e) => setFeedbackMessage(e.target.value)}
                            placeholder="I want to see... / Add this feature..."
                            className="w-full h-40 bg-[#252f44] border-2 border-transparent focus:border-coral/50 rounded-2xl p-5 text-white placeholder:text-gray-500 font-medium outline-none transition-all resize-none shadow-inner mb-6"
                        />
                        <button
                            onClick={handleSubmitFeedback}
                            disabled={isSubmittingFeedback || !feedbackMessage.trim()}
                            className="w-full py-4 bg-coral text-white font-black rounded-2xl shadow-xl shadow-coral/20 hover:bg-coral/90 disabled:opacity-50 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                        >
                            {isSubmittingFeedback ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Proposal'}
                        </button>
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
            currentTab={currentTab}
            onTabChange={setCurrentTab}
            avatarUrl={user?.user_metadata?.avatar_url}
            userInitial={user?.user_metadata?.first_name?.[0] || 'K'}
        />
    </div>
  );
};

export default Dashboard;
