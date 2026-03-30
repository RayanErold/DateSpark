import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { 
    Heart, 
    MessageCircle, 
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
    Zap,
    Check,
    LogOut,
    Map as MapIcon,
    Wallet,
    Car,
    LayoutGrid,
    Bookmark,
    User,
    Settings,
    Bell,
    ChevronDown,
    Circle,
    Globe,
    Loader2
} from 'lucide-react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { loadStripe } from '@stripe/stripe-js';
import BottomNav from '../components/BottomNav';

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
    { featureType: 'water', elementType: 'water.text.stroke', stylers: [{ color: '#030712' }] }
];

const Dashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [plans, setPlans] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [activeTab, setActiveTab] = useState('all');
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
        email: ''
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
        const premium = localStorage.getItem('isPremium') === 'true';
        const expiry = localStorage.getItem('premiumExpiry');
        if (premium && expiry) {
            if (Date.now() > parseInt(expiry, 10)) {
                localStorage.setItem('isPremium', 'false');
                localStorage.removeItem('premiumExpiry');
                return false;
            }
        }
        return premium;
    }); // Bound to localStorage for testing
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [showVisionModal, setShowVisionModal] = useState(false); // Vision Modal state
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
    const [switchUpUses, setSwitchUpUses] = useState(() => {
        const saved = localStorage.getItem('switchUpUses');
        return saved ? parseInt(saved, 10) : 0;
    });

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
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
        libraries: ['places']
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
                'Prefer': method === 'DELETE' ? 'return=minimal' : 'return=representation'
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
                    parsedErr = json.message || json.error || JSON.stringify(json);
                } catch (e) { /* not json */ }
                
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
            try {
                const { data: { user }, error: userError } = await supabase.auth.getUser();
                if (userError) throw userError;

                console.log('Dashboard - Current User:', user?.id);
                setUser(user);

                if (user) {
                    setProfileData({
                        first_name: user.user_metadata?.first_name || '',
                        last_name: user.user_metadata?.last_name || '',
                        email: user.email || ''
                    });


                    // Fetch plans with explicit session refresh and advanced error logging
                    // Fetch plans via the backend proxy to bypass potential frontend JWT/400 errors
                    const fetchPlans = async () => {
                        try {
                            console.log('Dashboard - Fetching plans via server proxy for user:', user.id);
                            
                            const response = await fetch(`/api/user-plans?userId=${user.id}`);
                            if (!response.ok) {
                                const errData = await response.json();
                                throw new Error(errData.error || `Proxy error: ${response.status}`);
                            }

                            const data = await response.json();
                            console.log('Dashboard - Successfully fetched plans via proxy:', data.length);
                            setPlans(data || []);
                        } catch (err) {
                            console.error('Final Plan Fetch Error (via Proxy):', err.message);
                        }
                    };

                    await fetchPlans();
                } else {
                    console.warn('Dashboard - No authenticated user found');
                }
            } catch (err) {
                console.error('Dashboard - fetchUserData error:', err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserData();
        
        // Safety timeout to prevent infinite "Loading..." hang
        const timeout = setTimeout(() => {
            if (isLoading) {
                console.warn('Dashboard - Fetch timed out, forcing load completion');
                setIsLoading(false);
            }
        }, 8000); // 8 second safety net for slow connections

        return () => clearTimeout(timeout);
    }, []);

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
        const queryParams = new URLSearchParams(window.location.search);
        const stripePayment = queryParams.get('stripe_payment');

        if (stripePayment === 'success') {
            setIsPremium(true);
            localStorage.setItem('isPremium', 'true');
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
    }, []);

    const handleBatchDelete = async () => {
        const count = selectedPlanIds.length;
        if (count === 0) return;

        const isFromTrash = settingsTab === 'trash' && showSettingsModal;
        const isFromFavorites = activeTab === 'favorites';
        
        // New Hybrid Logic:
        // - Trash Tab: Permanent delete
        // - All Plans Tab: Permanent delete (User: "whenever user select them in batch or delete them, the will be erase forever")
        // - Favorites Tab: Soft delete (User: "only when user delete from favorites, they will be tranfer to trash bin")
        
        let confirmMsg = `Are you sure you want to permanently delete these ${count} plans?`;
        let isSoftDelete = false;

        if (isFromFavorites && !isFromTrash) {
            confirmMsg = `Move these ${count} plans to Trash? (Stored for 7 days)`;
            isSoftDelete = true;
        }

        if (!window.confirm(confirmMsg)) return;

        try {
            const idsParam = selectedPlanIds.map(id => `"${id}"`).join(',');
            
            if (isSoftDelete) {
                // Soft Batch Delete
                const now = new Date().toISOString();
                await supabaseRequest('PATCH', `plans?id=in.(${idsParam})`, { deleted_at: now });
                setPlans(plans.map(p => selectedPlanIds.includes(p.id) ? { ...p, deleted_at: now } : p));
                alert(`${count} plans moved to Trash.`);
            } else {
                // Permanent Batch Delete
                await supabaseRequest('DELETE', `plans?id=in.(${idsParam})`);
                setPlans(plans.filter(p => !selectedPlanIds.includes(p.id)));
                alert(`${count} plans deleted forever.`);
            }
            setSelectedPlanIds([]);
            setIsSelectMode(false);
        } catch (err) {
            console.error('Batch Delete Error:', err);
            alert(`Batch operation failed: ${err.message}`);
        }
    };

    const handleDelete = async (planId, e) => {
        e.stopPropagation();

        const isFromFavorites = activeTab === 'favorites';
        const isFromTrash = settingsTab === 'trash' && showSettingsModal;

        // New Hybrid Logic:
        // - Trash Tab: Permanent delete
        // - All Plans Tab: Permanent delete
        // - Favorites Tab: Soft delete
        
        let confirmMsg = 'Are you sure you want to permanently delete this plan?';
        let isSoftDelete = false;

        if (isFromFavorites && !isFromTrash) {
            confirmMsg = 'Move this favorited plan to Trash? (Stored for 7 days)';
            isSoftDelete = true;
        }

        if (!window.confirm(confirmMsg)) return;

        try {
            if (isSoftDelete) {
                // Soft delete
                const now = new Date().toISOString();
                await supabaseRequest('PATCH', `plans?id=eq.${planId}`, { deleted_at: now });
                setPlans(plans.map(p => p.id === planId ? { ...p, deleted_at: now } : p));
                alert('Plan moved to Trash! (Recoverable for 7 days)');
            } else {
                // Permanent Delete
                await supabaseRequest('DELETE', `plans?id=eq.${planId}`);
                setPlans(plans.filter(p => p.id !== planId));
                if (!isFromTrash) alert('Plan deleted forever.');
            }
            if (selectedPlan && selectedPlan.id === planId) setSelectedPlan(null);
        } catch (err) {
            console.error('Error deleting plan:', err.message);
            alert(`Failed to delete plan: ${err.message}`);
        }
    };

    const handleRestorePlan = async (planId, e) => {
        e.stopPropagation();
        try {
            await supabaseRequest('PATCH', `plans?id=eq.${planId}`, { deleted_at: null });
            setPlans(plans.map(p => p.id === planId ? { ...p, deleted_at: null } : p));
            alert('Plan restored to your dashboard!');
        } catch (err) {
            console.error('Error restoring plan:', err.message);
            alert(`Restore failed: ${err.message}`);
        }
    };

    const handleToggleFavorite = async (plan, e) => {
        e.stopPropagation();

        // --- FREEMIUM FAVORITE LIMIT LOGIC ---
        if (!plan.is_favorite && !isPremium) {
            const currentFavoritesCount = plans.filter(p => p.is_favorite).length;
            if (currentFavoritesCount >= 4) {
                setShowUpgradeModal(true);
                return; // Block saving
            }
        }

        const newStatus = !plan.is_favorite;

        try {
            await supabaseRequest('PATCH', `plans?id=eq.${plan.id}`, { is_favorite: newStatus });
            setPlans(plans.map(p => p.id === plan.id ? { ...p, is_favorite: newStatus } : p));
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

        // Ensure file is an image and not too large (limit to 1MB for base64 storage)
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file.');
            return;
        }
        if (file.size > 1024 * 1024) {
            alert('Image is too large. Please select a photo under 1MB.');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64String = reader.result;
            const { error } = await supabase.auth.updateUser({
                data: { avatar_url: base64String }
            });

            if (!error) {
                const { data: { user: updatedUser } } = await supabase.auth.getUser();
                setUser(updatedUser);
            } else {
                alert('Failed to update profile picture.');
            }
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

    const handleUpdateProfile = async () => {
        setIsSavingProfile(true);
        try {
            const { error } = await supabase.auth.updateUser({
                email: profileData.email !== user.email ? profileData.email : undefined,
                data: {
                    first_name: profileData.first_name,
                    last_name: profileData.last_name
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
        if (!isPremium && switchUpUses >= 2) {
            setShowUpgradeModal(true);
            return;
        }
        setActiveSwitchIndex(idx);
        setIsSwitchingUp(true);
        setAlternatives([]);

        try {
            // Get user's current location if possible, otherwise use step's location
            let lat = step.lat;
            let lng = step.lng;

            if (navigator.geolocation) {
                const pos = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
                }).catch(() => null);

                if (pos) {
                    lat = pos.coords.latitude;
                    lng = pos.coords.longitude;
                }
            }

            const response = await axios.post('/api/nearby-alternatives', {
                lat,
                lng,
                type: step.activity,
                radius: 5000, // 5km radius
                budget: selectedPlan.budget,
                currentPlaceId: step.id // Avoid suggesting the same place
            });

            setAlternatives(response.data.alternatives || []);
        } catch (err) {
            console.error('Error fetching alternatives:', err);
            alert('Failed to find nearby alternatives.');
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
                venue: alt.name,
                address: alt.address,
                rating: alt.rating,
                description: alt.description || originalStep.description, // Fallback to original description if needed
                photoUrl: alt.photo,
                lat: alt.location?.latitude,
                lng: alt.location?.longitude,
                searchUrl: alt.searchUrl,
                placeId: alt.id
            };

            steps[activeSwitchIndex] = newStep;

            const updatedItinerary = isArrayItinerary ? steps : { ...currentPlan.itinerary, steps };

            try {
                // Use the more reliable window.fetch helper
                await supabaseRequest('PATCH', `plans?id=eq.${selectedPlan.id}`, { itinerary: updatedItinerary });
            } catch (err) {
                console.error('Switch Up Database Error:', err);
                throw new Error(`Database Update Failed: ${err.message}`);
            }

            // Update local state
            setPlans(prev => prev.map(p => p.id === selectedPlan.id ? { ...p, itinerary: updatedItinerary } : p));
            setSelectedPlan(prev => ({ ...prev, itinerary: updatedItinerary }));

            setActiveSwitchIndex(null);
            setAlternatives([]);

            // Increment uses for free users
            if (!isPremium) {
                const newUses = switchUpUses + 1;
                setSwitchUpUses(newUses);
                localStorage.setItem('switchUpUses', newUses.toString());
                localStorage.setItem('switchUpLastUseTime', Date.now().toString());
            }

        } catch (error) {
            console.error('Error confirming switch:', error);
            alert(`Failed to update the plan: ${error.message}. Please try again.`);
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
                        <LayoutGrid className="w-4 h-4" /> All
                    </button>
                    <button
                        onClick={() => setActiveTab('favorites')}
                        className={`flex-1 py-2.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'favorites' ? 'bg-white text-coral shadow-sm' : 'text-gray-500 hover:text-navy'}`}
                    >
                        <Heart className={`w-4 h-4 ${activeTab === 'favorites' ? 'fill-coral text-coral' : ''}`} /> Favorites
                    </button>
                    <div className="w-px h-6 bg-gray-200 mx-1 self-center" />
                    <button
                        onClick={() => {
                            setIsSelectMode(!isSelectMode);
                            setSelectedPlanIds([]);
                        }}
                        className={`flex-1 py-2.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${isSelectMode ? 'bg-navy text-white shadow-sm' : 'text-gray-500 hover:text-navy'}`}
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
                    {plans.filter(p => !p.deleted_at).map((plan, planIdx) => renderPlanCard(plan, planIdx, false))}
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
                                <Trash2 className="w-4 h-4" /> Move to Trash
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>

        {/* View Plan Modal (Sleek Timeline UI) */}
        {selectedPlan && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/50 backdrop-blur-sm">
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
                                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
                                    <Heart className="w-5 h-5 fill-coral text-coral" />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-base font-black font-outfit tracking-tight truncate">{selectedPlan.vibe} Date</h2>
                                    <p className="text-[9px] text-gray-400 uppercase tracking-widest font-black opacity-70">
                                        {!Array.isArray(selectedPlan.itinerary) && selectedPlan.itinerary?.metadata?.planDate ?
                                            `${new Date(selectedPlan.itinerary.metadata.planDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
                                            : 'Available in New York City'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
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
                                    const isLockedStep = !isPremium && idx >= 2;

                                    // Assign specific colors for styling dots
                                    const dotColors = ['bg-coral', 'bg-yellow-400', 'bg-navy', 'bg-emerald-500', 'bg-purple-500'];
                                    const textColor = ['text-coral', 'text-yellow-500', 'text-navy', 'text-emerald-600', 'text-purple-600'];
                                    const colorIdx = idx % dotColors.length;
                                    return (
                                        <div
                                            key={idx}
                                            className={`relative ${(isLockedStep || (selectedPlan.isPartiallyLocked && idx >= 1)) ? 'cursor-pointer group/locked' : ''}`}
                                            onClick={() => {
                                                if (isLockedStep || (selectedPlan.isPartiallyLocked && idx >= 1)) setShowUpgradeModal(true);
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

                                            <div className={`bg-white border border-gray-100 rounded-2xl p-3.5 flex flex-col gap-2.5 shadow-sm transition-all hover:shadow-md ${(isLockedStep || (selectedPlan.isPartiallyLocked && idx >= 1)) ? 'blur-sm select-none opacity-60' : ''} ${completedSteps.includes(idx) ? 'opacity-40' : ''}`}>
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
                                                        className="px-2.5 py-1.5 bg-violet-50 text-violet-600 outline outline-1 outline-violet-200 text-[10px] font-black rounded-lg hover:bg-violet-600 hover:text-white transition-all inline-flex items-center gap-1 shadow-[0_1px_8px_rgba(139,92,246,0.1)] hover:shadow-violet-200/50 group/btn"
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
                        Unlock full AI-driven itineraries, unlimited saving features, and city support.
                    </p>

                    <div className="grid md:grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto px-1">
                        {/* Daily Date Pass - THE HOOK */}
                        <div className="bg-white border-2 border-coral rounded-2xl p-5 text-left relative group hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
                            <div className="absolute top-0 right-0 bg-coral text-white px-3 py-1 rounded-bl-xl text-[9px] font-black uppercase tracking-wider z-10">
                                Most Popular
                            </div>
                            <div>
                                <h4 className="text-lg font-black text-navy mb-1">24-Hour Pass</h4>
                                <p className="text-gray-400 text-[11px] mb-3">Perfect for tonight's date.</p>
                                <div className="flex items-end gap-1 mb-4">
                                    <span className="text-2xl font-black text-navy">$1.99</span>
                                    <span className="text-gray-400 text-xs mb-1 uppercase">/24hr</span>
                                </div>
                                <ul className="space-y-1.5 text-[11px] text-gray-500 font-bold mb-5 border-t border-gray-100 pt-3">
                                    <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-coral flex-shrink-0" /> Unlimited 5-stop plans</li>
                                    <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-coral flex-shrink-0" /> Switch Up & Booking</li>
                                    <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-coral flex-shrink-0" /> Unlimited favorites</li>
                                    <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-coral flex-shrink-0" /> Instant Directions & Rides</li>
                                </ul>
                            </div>
                            <button onClick={() => handleBuyPass('daily')} className="w-full py-2.5 bg-coral text-white text-xs font-black rounded-xl hover:bg-coral/90 transition-colors shadow-lg mt-auto">
                                Get Pass
                            </button>
                        </div>

                        {/* DateSpark Plus / Monthly */}
                        <div className="bg-gradient-to-br from-navy to-navy/90 rounded-2xl p-5 text-white text-left relative overflow-hidden group hover:shadow-xl transition-all duration-300 border border-navy-100/20 flex flex-col justify-between">
                            <div>
                                <h4 className="text-lg font-black mb-1">DateSpark Plus</h4>
                                <p className="text-white/70 text-[11px] mb-3">Unlimited planning + Premium hacks.</p>
                                <div className="flex items-end gap-1 mb-4">
                                    <span className="text-2xl font-black">$9.99</span>
                                    <span className="text-white/50 text-xs mb-1">/mo</span>
                                </div>
                                <ul className="space-y-1.5 text-[11px] text-white/80 font-bold mb-5 border-t border-white/10 pt-3">
                                    <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-gold flex-shrink-0" /> Daily pass + AI Customizer</li>
                                    <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-gold flex-shrink-0" /> 7-Day Recycle Bin access</li>
                                    <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-gold flex-shrink-0" /> Anniversary & Special Occasions</li>
                                    <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-gold flex-shrink-0" /> Priority New Features</li>
                                </ul>
                            </div>
                            <button onClick={() => handleBuyPass('premium')} className="w-full py-2.5 bg-white text-navy text-xs font-black rounded-xl hover:bg-gray-50 transition-colors shadow-lg mt-auto">
                                Upgrade Now
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
                                        <div className="flex items-center gap-3">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${isPremium ? 'bg-green-100' : 'bg-gray-100'}`}>
                                                {isPremium ? <Check className="w-3.5 h-3.5 text-green-600 font-bold" /> : <X className="w-3.5 h-3.5 text-gray-400 font-bold" />}
                                            </div>
                                            <span className={`font-medium ${isPremium ? 'text-gray-600' : 'text-gray-400'}`}>
                                                {isPremium ? "Unlimited date itinerary requests" : "5 daily date requests"}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${isPremium ? 'bg-green-100' : 'bg-gray-100'}`}>
                                                {isPremium ? <Check className="w-3.5 h-3.5 text-green-600 font-bold" /> : <X className="w-3.5 h-3.5 text-gray-400 font-bold" />}
                                            </div>
                                            <span className={`font-medium ${isPremium ? 'text-gray-600' : 'text-gray-400'}`}>
                                                {isPremium ? "Unlimited 'Swap Spot' requests" : "2 'Swap Spot' requests total"}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                                <Check className="w-3.5 h-3.5 text-green-600 font-bold" />
                                            </div>
                                            <span className="text-gray-600 font-medium">
                                                Save {isPremium ? "unlimited favorites" : "up to 4 favorite dates"}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${isPremium ? 'bg-green-100' : 'bg-gray-100'}`}>
                                                {isPremium ? <Check className="w-3.5 h-3.5 text-green-600 font-bold" /> : <X className="w-3.5 h-3.5 text-gray-400 font-bold" />}
                                            </div>
                                            <span className={`font-medium ${isPremium ? 'text-gray-600' : 'text-gray-400'}`}>
                                                {isPremium ? "7-Day Recycle Bin & AI Customizer" : "Premium 7rd+ Itinerary Locking"}
                                            </span>
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
                                                        if (window.confirm('Are you sure you want to cancel your DateSpark Plus subscription?')) {
                                                            setIsPremium(false);
                                                            localStorage.setItem('isPremium', 'false');
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
                                            <h4 className="text-sm font-black text-navy mt-6 mb-2">Available Plans to Upgrade</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {[
                                                    { name: "24-Hour Pass", price: "$1.99", desc: "Unlimited plans, Switch Up & Booking.", period: "24hr", type: 'daily' },
                                                    { name: "DateSpark Plus", price: "$9.99", desc: "AI Customizer, 7-Day Bin & Priority features.", period: "mo", type: 'premium' }
                                                ].map((sub, idx) => (
                                                    <div key={idx} className="bg-white border border-gray-100 p-4 rounded-2xl flex flex-col justify-between hover:border-coral/40 transition-all shadow-sm">
                                                        <div>
                                                            <h5 className="font-bold text-navy text-sm">{sub.name}</h5>
                                                            <p className="text-[10px] text-gray-400 mt-0.5 leading-tight font-medium">{sub.desc}</p>
                                                            <p className="text-base font-black text-navy mt-2">{sub.price}<span className="text-xs font-normal text-gray-400">/{sub.period}</span></p>
                                                        </div>
                                                        <button
                                                            onClick={() => handleBuyPass(sub.type)}
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
                                                { id: 'dark', name: 'Midnight Dark', bg: 'bg-[#0f172a] border-black', preview: ['bg-coral', 'bg-white'] },
                                                { id: 'sunset', name: 'Sunset Haze', bg: 'bg-gradient-to-br from-coral to-fuchsia-500 border-coral', preview: ['bg-white', 'bg-navy'] }
                                            ].map(theme => (
                                                <button
                                                    key={theme.id}
                                                    onClick={() => {
                                                        if (!isPremium && theme.id !== 'theme_light_id_placeholder') { // Wait, or just theme.id !== 'light'
                                                            if (!isPremium && theme.id !== 'light') {
                                                                setShowUpgradeModal(true);
                                                            } else {
                                                                setAppTheme(theme.id);
                                                            }
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
