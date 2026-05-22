import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Users, 
    ShieldAlert, 
    Award, 
    Compass, 
    RefreshCw, 
    Trash2, 
    ArrowLeft, 
    ShieldCheck, 
    UserCheck,
    AlertCircle,
    UserMinus,
    CheckCircle2,
    Database,
    Zap
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import axios from 'axios';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [currentAdmin, setCurrentAdmin] = useState(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalUsers: 0, premiumUsers: 0, totalFeedbacks: 0, totalPlans: 0 });
    const [usersList, setUsersList] = useState([]);
    const [feedbacksList, setFeedbacksList] = useState([]);
    const [activeTab, setActiveTab] = useState('users'); // 'users' or 'tickets'
    const [actionLoading, setActionLoading] = useState(false);
    const [notification, setNotification] = useState({ type: null, message: '' });

    // Toast helper
    const showToast = (type, message) => {
        setNotification({ type, message });
        setTimeout(() => setNotification({ type: null, message: '' }), 4000);
    };

    // 1. Verify user role
    useEffect(() => {
        const verifyAdminRole = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    navigate('/login');
                    return;
                }
                // Fetch profile to verify admin
                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (error || !profile || !profile.is_admin) {
                    showToast('error', 'Access denied: Administrative privileges required.');
                    setTimeout(() => navigate('/dashboard'), 2000);
                    return;
                }

                setCurrentAdmin(profile);
                await loadDashboardData(user.id);
            } catch (err) {
                console.error('[Admin Auth Error]', err);
                navigate('/dashboard');
            } finally {
                setLoading(false);
            }
        };

        verifyAdminRole();
    }, [navigate]);

    // 2. Fetch data from secure admin endpoints
    const loadDashboardData = async (adminId) => {
        try {
            const headers = { 'x-user-id': adminId };

            const [statsRes, usersRes, feedbacksRes] = await Promise.all([
                axios.get('/api/admin/stats', { headers }),
                axios.get('/api/admin/users', { headers }),
                axios.get('/api/admin/feedbacks', { headers })
            ]);

            if (statsRes.data.success) setStats(statsRes.data.stats);
            if (usersRes.data.success) setUsersList(usersRes.data.users);
            if (feedbacksRes.data.success) setFeedbacksList(feedbacksRes.data.feedbacks);
        } catch (err) {
            console.error('[Load Admin Data Error]', err);
            showToast('error', 'Failed to retrieve administrative data.');
        }
    };

    // 3. User operations
    const handleTogglePremium = async (targetUserId, currentStatus) => {
        if (!currentAdmin) return;
        setActionLoading(true);
        try {
            const response = await axios.post('/api/admin/toggle-premium', {
                targetUserId,
                isPremium: !currentStatus,
                adminId: currentAdmin.id
            }, {
                headers: { 'x-user-id': currentAdmin.id }
            });

            if (response.data.success) {
                showToast('success', `Updated user premium status to ${!currentStatus ? 'Active' : 'Inactive'}!`);
                // Update local list
                setUsersList(prev => prev.map(u => u.id === targetUserId ? { ...u, is_premium: !currentStatus } : u));
                // Update stats
                setStats(prev => ({
                    ...prev,
                    premiumUsers: prev.premiumUsers + (!currentStatus ? 1 : -1)
                }));
            }
        } catch (err) {
            showToast('error', 'Failed to toggle premium membership.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleToggleAdmin = async (targetUserId, currentStatus) => {
        if (!currentAdmin) return;
        if (targetUserId === currentAdmin.id) {
            showToast('error', 'You cannot revoke your own admin rights!');
            return;
        }
        setActionLoading(true);
        try {
            const response = await axios.post('/api/admin/toggle-admin', {
                targetUserId,
                isAdmin: !currentStatus,
                adminId: currentAdmin.id
            }, {
                headers: { 'x-user-id': currentAdmin.id }
            });

            if (response.data.success) {
                showToast('success', `User administrative rights ${!currentStatus ? 'granted' : 'revoked'}.`);
                setUsersList(prev => prev.map(u => u.id === targetUserId ? { ...u, is_admin: !currentStatus } : u));
            }
        } catch (err) {
            showToast('error', 'Failed to update administrative permissions.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleResetUsage = async (targetUserId) => {
        if (!currentAdmin) return;
        setActionLoading(true);
        try {
            const response = await axios.post('/api/admin/reset-usage', {
                targetUserId,
                adminId: currentAdmin.id
            }, {
                headers: { 'x-user-id': currentAdmin.id }
            });

            if (response.data.success) {
                showToast('success', 'User daily generation limits successfully reset!');
                setUsersList(prev => prev.map(u => u.id === targetUserId ? { 
                    ...u, 
                    classic_usage_today: 0, 
                    guided_usage_today: 0, 
                    swap_usage_today: 0 
                } : u));
            }
        } catch (err) {
            showToast('error', 'Failed to reset daily limits.');
        } finally {
            setActionLoading(false);
        }
    };

    // 4. Ticket/Feedback operations
    const handleResolveTicket = async (ticketId) => {
        if (!currentAdmin) return;
        setActionLoading(true);
        try {
            const response = await axios.delete(`/api/admin/feedbacks/${ticketId}?adminId=${currentAdmin.id}`, {
                headers: { 'x-user-id': currentAdmin.id }
            });

            if (response.data.success) {
                showToast('success', 'Ticket successfully marked as resolved & resolved!');
                setFeedbacksList(prev => prev.filter(t => t.id !== ticketId));
                setStats(prev => ({ ...prev, totalFeedbacks: Math.max(0, prev.totalFeedbacks - 1) }));
            }
        } catch (err) {
            showToast('error', 'Failed to resolve customer ticket.');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#060B1A] flex flex-col items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 border-2 border-white/20 border-t-coral rounded-full mb-4"
                />
                <p className="text-white/40 font-black uppercase tracking-[0.2em] text-[10px] animate-pulse">Verifying Admin clearance</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#060B1A] text-white font-sans antialiased pb-24 selection:bg-coral/30">
            {/* Ambient Background Glows */}
            <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-coral/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="fixed bottom-0 right-1/4 w-[600px] h-[600px] bg-violet-600/5 rounded-full blur-[150px] pointer-events-none" />

            {/* Top Navigation */}
            <div className="border-b border-white/5 bg-white/2 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link to="/dashboard" className="w-10 h-10 bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl flex items-center justify-center transition-all">
                            <ArrowLeft className="w-4 h-4" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg font-black tracking-tight uppercase">Admin Center</h1>
                                <span className="px-2 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[9px] font-black uppercase rounded-full tracking-widest">Clearance L3</span>
                            </div>
                            <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider">DateSpark Core & Customer Support Ops</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/10">
                        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                        <span className="text-xs font-black uppercase text-white/80">{currentAdmin?.id ? `ID: ${currentAdmin.id.slice(0,8)}` : 'Admin Account'}</span>
                    </div>
                </div>
            </div>

            {/* Dashboard Container */}
            <div className="max-w-7xl mx-auto px-6 mt-8">
                
                {/* Notification Area */}
                <AnimatePresence>
                    {notification.message && (
                        <motion.div 
                            initial={{ opacity: 0, y: -25 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -25 }}
                            className={`mb-6 p-4 rounded-2xl flex items-center gap-3 border font-bold text-sm shadow-2xl ${
                                notification.type === 'success' 
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            }`}
                        >
                            {notification.type === 'success' ? (
                                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                            ) : (
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            )}
                            <span>{notification.message}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-violet-400', bg: 'bg-violet-500/10' },
                        { label: 'Premium Accounts', value: stats.premiumUsers, icon: Award, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                        { label: 'Customer Tickets', value: stats.totalFeedbacks, icon: ShieldAlert, color: 'text-coral', bg: 'bg-coral/10' },
                        { label: 'Saved Date Plans', value: stats.totalPlans, icon: Database, color: 'text-teal-400', bg: 'bg-teal-500/10' }
                    ].map((m, idx) => (
                        <div key={idx} className="bg-white/3 border border-white/5 p-6 rounded-3xl relative overflow-hidden group hover:border-white/10 transition-all">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[10px] font-black uppercase text-white/40 tracking-wider">{m.label}</span>
                                <div className={`p-2.5 rounded-xl ${m.bg}`}>
                                    <m.icon className={`w-5 h-5 ${m.color}`} />
                                </div>
                            </div>
                            <h3 className="text-3xl font-black tracking-tight">{m.value}</h3>
                        </div>
                    ))}
                </div>

                {/* Tab Switcher */}
                <div className="flex border-b border-white/5 mb-8">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`px-6 py-3.5 font-black uppercase tracking-wider text-xs border-b-2 transition-all ${
                            activeTab === 'users' 
                                ? 'border-coral text-coral' 
                                : 'border-transparent text-white/40 hover:text-white'
                        }`}
                    >
                        👥 User Base ({usersList.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('tickets')}
                        className={`px-6 py-3.5 font-black uppercase tracking-wider text-xs border-b-2 transition-all ${
                            activeTab === 'tickets' 
                                ? 'border-coral text-coral' 
                                : 'border-transparent text-white/40 hover:text-white'
                        }`}
                    >
                        ⚠️ Support Tickets & Feedback ({feedbacksList.length})
                    </button>
                </div>

                {/* Active Tab View */}
                <div className="bg-white/2 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-md">
                    
                    {/* 1. USERS LIST VIEW */}
                    {activeTab === 'users' && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/5 bg-white/2 text-[10px] font-black text-white/40 uppercase tracking-widest">
                                        <th className="py-4 px-6">User / UUID</th>
                                        <th className="py-4 px-6">Permissions</th>
                                        <th className="py-4 px-6 text-center">Daily Usage (Classic / Guided)</th>
                                        <th className="py-4 px-6 text-right">Support Operations</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {usersList.map((user) => (
                                        <tr key={user.id} className="hover:bg-white/2 transition-colors text-sm font-medium">
                                            <td className="py-5 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center font-black text-coral border border-white/10 uppercase">
                                                        {user.avatar_url ? (
                                                            <img src={user.avatar_url} alt="" className="w-full h-full object-cover rounded-2xl" />
                                                        ) : (
                                                            user.id.slice(0, 2)
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold flex items-center gap-1.5 text-white/80 hover:text-white">
                                                            {user.id}
                                                            {user.is_admin && <ShieldCheck className="w-4 h-4 text-emerald-400" />}
                                                        </div>
                                                        <div className="text-[10px] font-bold text-white/30 uppercase mt-0.5">Updated: {new Date(user.updated_at).toLocaleDateString()}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-5 px-6">
                                                <div className="flex gap-2">
                                                    <span className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-lg tracking-wider border ${
                                                        user.is_premium 
                                                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                                                            : 'bg-white/5 text-white/40 border-white/10'
                                                    }`}>
                                                        {user.is_premium ? '★ Premium' : 'Free tier'}
                                                    </span>
                                                    <span className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-lg tracking-wider border ${
                                                        user.is_admin 
                                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                                            : 'bg-white/5 text-white/40 border-white/10'
                                                    }`}>
                                                        {user.is_admin ? '🛡 Admin' : 'Customer'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-5 px-6 text-center">
                                                <div className="flex items-center justify-center gap-3">
                                                    <span className="text-white/60">
                                                        <strong className="text-white font-bold">{user.classic_usage_today || 0}</strong>/5 AI
                                                    </span>
                                                    <span className="text-white/20">|</span>
                                                    <span className="text-white/60">
                                                        <strong className="text-white font-bold">{user.guided_usage_today || 0}</strong>/3 API
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-5 px-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    
                                                    {/* Toggle Premium Button */}
                                                    <button
                                                        onClick={() => handleTogglePremium(user.id, user.is_premium)}
                                                        disabled={actionLoading}
                                                        className={`p-2 rounded-xl border transition-all ${
                                                            user.is_premium 
                                                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/25' 
                                                                : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white'
                                                        }`}
                                                        title={user.is_premium ? 'Revoke Premium' : 'Grant Premium'}
                                                    >
                                                        <Award className="w-4 h-4" />
                                                    </button>

                                                    {/* Toggle Admin Button */}
                                                    <button
                                                        onClick={() => handleToggleAdmin(user.id, user.is_admin)}
                                                        disabled={actionLoading || user.id === currentAdmin.id}
                                                        className={`p-2 rounded-xl border transition-all ${
                                                            user.is_admin 
                                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/25' 
                                                                : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white'
                                                        }`}
                                                        title={user.is_admin ? 'Revoke Admin' : 'Make Admin'}
                                                    >
                                                        <ShieldCheck className="w-4 h-4" />
                                                    </button>

                                                    {/* Reset Limits Button */}
                                                    <button
                                                        onClick={() => handleResetUsage(user.id)}
                                                        disabled={actionLoading}
                                                        className="p-2 bg-white/5 text-teal-400 border border-white/10 hover:bg-white/10 hover:border-teal-500/30 rounded-xl transition-all"
                                                        title="Reset Daily Limit"
                                                    >
                                                        <RefreshCw className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {usersList.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="py-8 text-center text-white/40 font-bold">No registered profiles found in the database.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* 2. TICKETS / FEEDBACK LIST VIEW */}
                    {activeTab === 'tickets' && (
                        <div className="p-6 space-y-4">
                            {feedbacksList.map((ticket) => (
                                <div key={ticket.id} className="bg-white/3 border border-white/5 p-6 rounded-2xl flex flex-col md:flex-row md:items-start justify-between gap-6 hover:border-white/10 transition-all">
                                    <div className="space-y-3 flex-grow">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <span className="px-2.5 py-0.5 bg-coral/20 text-coral border border-coral/30 text-[9px] font-black uppercase rounded-full tracking-widest">
                                                Support Request
                                            </span>
                                            <span className="text-white/40 text-xs font-bold">
                                                📅 {new Date(ticket.created_at).toLocaleString()}
                                            </span>
                                        </div>
                                        
                                        <p className="text-white/80 font-bold text-sm bg-black/20 p-4 rounded-xl border border-white/5 leading-relaxed font-sans">
                                            "{ticket.text}"
                                        </p>

                                        <div className="flex flex-col gap-1 text-[11px] font-bold text-white/40 uppercase">
                                            <div>📧 Email: <span className="text-white/80 normal-case">{ticket.email || 'Anonymous/Unspecified'}</span></div>
                                            <div>👥 User UUID: <span className="text-white/80">{ticket.user_id || 'Not authenticated'}</span></div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex-shrink-0">
                                        <button
                                            onClick={() => handleResolveTicket(ticket.id)}
                                            disabled={actionLoading}
                                            className="w-full md:w-auto px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/20 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md"
                                        >
                                            <CheckCircle2 className="w-4 h-4" />
                                            Resolve & Close
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {feedbacksList.length === 0 && (
                                <div className="py-12 text-center text-white/40 font-bold flex flex-col items-center justify-center gap-3">
                                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                                    <div>All support tickets resolved! No active customer requests.</div>
                                </div>
                            )}
                        </div>
                    )}

                </div>

            </div>
        </div>
    );
};

export default AdminDashboard;
