import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, Plus, Trash2, Heart, DollarSign, Gift, 
    Compass, Coffee, Check, X, Flame, Calendar, MapPin
} from 'lucide-react';
import axios from 'axios';

const WishlistTab = ({ appTheme, userId, setToastMessage, onSparkWish }) => {
    const isDark = appTheme === 'dark';
    
    // Wishlist state
    const [wishes, setWishes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterCategory, setFilterCategory] = useState('All');
    const [filterStatus, setFilterStatus] = useState('active'); // 'active' or 'completed'
    
    // Modal state for adding a new wish
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newCategory, setNewCategory] = useState('Cozy Date');
    const [newNotes, setNewNotes] = useState('');
    const [newBudget, setNewBudget] = useState('$$');
    const [newPriority, setNewPriority] = useState(3);
    const [submitting, setSubmitting] = useState(false);

    // Fetch wishlist items
    const fetchWishlist = async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const res = await axios.get(`/api/wishlist?userId=${userId}`);
            setWishes(res.data || []);
        } catch (err) {
            console.error('[FETCH_WISHLIST_ERROR]', err);
            setToastMessage('Could not load your wishlist. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWishlist();
    }, [userId]);

    // Handle adding a new wish
    const handleAddWish = async (e) => {
        e.preventDefault();
        if (!newTitle.trim()) {
            setToastMessage('Please enter an activity name!');
            return;
        }

        setSubmitting(true);
        try {
            const res = await axios.post('/api/wishlist', {
                userId,
                title: newTitle.trim(),
                category: newCategory,
                notes: newNotes.trim() || null,
                budget: newBudget,
                priority: newPriority
            });

            if (res.data.success) {
                setWishes([res.data.item, ...wishes]);
                setToastMessage('Wish added to your board! 💖');
                setIsAddOpen(false);
                // Reset form
                setNewTitle('');
                setNewCategory('Cozy Date');
                setNewNotes('');
                setNewBudget('$$');
                setNewPriority(3);
            }
        } catch (err) {
            console.error('[ADD_WISH_ERROR]', err);
            setToastMessage('Failed to add wish. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // Toggle completion status of a wish
    const handleToggleComplete = async (id, currentStatus) => {
        try {
            const res = await axios.patch(`/api/wishlist/${id}`, {
                is_completed: !currentStatus
            });

            if (res.data.success) {
                setWishes(wishes.map(w => w.id === id ? res.data.item : w));
                setToastMessage(
                    !currentStatus 
                        ? 'Experienced! Moved to completed moments 🎉' 
                        : 'Wish reactivated!'
                );
            }
        } catch (err) {
            console.error('[TOGGLE_WISH_ERROR]', err);
            setToastMessage('Could not update wish status.');
        }
    };

    // Delete a wish
    const handleDeleteWish = async (id) => {
        if (!window.confirm('Are you sure you want to remove this activity from your wishlist?')) return;
        
        try {
            const res = await axios.delete(`/api/wishlist/${id}`);
            if (res.data.success) {
                setWishes(wishes.filter(w => w.id !== id));
                setToastMessage('Activity removed from wishlist.');
            }
        } catch (err) {
            console.error('[DELETE_WISH_ERROR]', err);
            setToastMessage('Failed to remove wish.');
        }
    };

    // Filtered wishes
    const filteredWishes = wishes.filter(w => {
        const matchesCategory = filterCategory === 'All' || w.category === filterCategory;
        const matchesStatus = filterStatus === 'active' ? !w.is_completed : w.is_completed;
        return matchesCategory && matchesStatus;
    });

    const CATEGORIES = ['Cozy Date', 'Foodie Spot', 'Adventure', 'Art & Culture', 'Active & Fun', 'Other'];
    const VIBE_COLORS = {
        'Cozy Date': 'from-pink-500/10 to-rose-500/10 text-rose-500 border-rose-500/20',
        'Foodie Spot': 'from-orange-500/10 to-amber-500/10 text-amber-600 border-amber-500/20',
        'Adventure': 'from-emerald-500/10 to-teal-500/10 text-emerald-600 border-emerald-500/20',
        'Art & Culture': 'from-indigo-500/10 to-violet-500/10 text-violet-600 border-violet-500/20',
        'Active & Fun': 'from-sky-500/10 to-blue-500/10 text-sky-600 border-sky-500/20',
        'Other': 'from-slate-500/10 to-zinc-500/10 text-slate-600 border-slate-500/20'
    };

    return (
        <div className="pt-6 max-w-5xl mx-auto px-4 pb-24">
            {/* Header section with glassmorphic backdrop */}
            <div className={`p-8 rounded-[2.5rem] border transition-all duration-300 relative overflow-hidden mb-8 ${
                isDark 
                    ? 'bg-[#151b2c] border-white/5 shadow-2xl' 
                    : 'bg-white border-orange-100/70 shadow-xl shadow-orange-500/5'
            }`}>
                <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-orange-500/10 via-coral/5 to-pink-500/0 rounded-full blur-3xl -z-10 pointer-events-none" />
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-500 via-coral to-pink-500 flex items-center justify-center shadow-lg shadow-coral/30 shrink-0">
                            <Gift className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h2 className={`text-2.5xl font-black tracking-tight ${isDark ? 'text-white' : 'text-navy'}`}>
                                Sparky's Wishboard
                            </h2>
                            <p className={`text-sm font-semibold mt-0.5 ${isDark ? 'text-white/50' : 'text-slate-400'}`}>
                                Craft your shared activity wishlist and spark ideas into custom date plans.
                            </p>
                        </div>
                    </div>
                    
                    <button
                        onClick={() => setIsAddOpen(true)}
                        className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-orange-500 to-coral text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-coral/25 hover:brightness-105 active:scale-98 transition-all shrink-0"
                    >
                        <Plus className="w-4 h-4 stroke-[3]" /> Add Date Wish
                    </button>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                {/* Active vs Completed Filters */}
                <div className={`flex rounded-2xl p-1 border self-start ${
                    isDark ? 'bg-black/20 border-white/5' : 'bg-gray-100 border-gray-200'
                }`}>
                    <button
                        onClick={() => setFilterStatus('active')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                            filterStatus === 'active'
                                ? 'bg-gradient-to-r from-orange-500 to-coral text-white shadow'
                                : isDark ? 'text-white/60 hover:text-white' : 'text-slate-500 hover:text-navy'
                        }`}
                    >
                        <Flame className="w-3.5 h-3.5" /> Active Wishes
                    </button>
                    <button
                        onClick={() => setFilterStatus('completed')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                            filterStatus === 'completed'
                                ? 'bg-gradient-to-r from-orange-500 to-coral text-white shadow'
                                : isDark ? 'text-white/60 hover:text-white' : 'text-slate-500 hover:text-navy'
                        }`}
                    >
                        <Check className="w-3.5 h-3.5" /> Experienced ({wishes.filter(w => w.is_completed).length})
                    </button>
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {['All', ...CATEGORIES].map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setFilterCategory(cat)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border shrink-0 ${
                                filterCategory === cat
                                    ? isDark
                                        ? 'bg-white/10 border-white/20 text-white'
                                        : 'bg-white border-coral text-coral shadow-sm shadow-coral/10'
                                    : isDark
                                        ? 'bg-white/5 border-transparent text-white/40 hover:text-white/70'
                                        : 'bg-white border-gray-100 text-slate-400 hover:border-gray-200 hover:text-slate-600'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Wishes Grid */}
            {loading ? (
                <div className="flex flex-col items-center justify-center min-h-[300px]">
                    <div className="w-10 h-10 border-3 border-coral border-t-transparent rounded-full animate-spin mb-4" />
                    <p className={`text-sm font-bold ${isDark ? 'text-white/40' : 'text-slate-400'}`}>Loading your wishlist...</p>
                </div>
            ) : filteredWishes.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-[2rem] p-12 text-center border flex flex-col items-center justify-center min-h-[300px] ${
                        isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-orange-100/50'
                    }`}
                >
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-500/10 to-pink-500/10 rounded-3xl flex items-center justify-center mb-6">
                        <Gift className="w-7 h-7 text-coral" />
                    </div>
                    <h3 className={`text-lg font-black mb-1.5 ${isDark ? 'text-white' : 'text-navy'}`}>
                        {filterStatus === 'active' ? 'Your Wishboard is Empty' : 'No Experienced Memories Yet'}
                    </h3>
                    <p className={`text-xs font-semibold max-w-sm mx-auto mb-6 leading-relaxed ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
                        {filterStatus === 'active' 
                            ? 'Start by adding date activities you want to share with your partner. Then use Sparky to bring them to life!'
                            : 'Mark your date wishes as completed once you experience them together. Build a board of your love story!'}
                    </p>
                    {filterStatus === 'active' && (
                        <button
                            onClick={() => setIsAddOpen(true)}
                            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-orange-500 to-coral text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-coral/15"
                        >
                            <Plus className="w-3.5 h-3.5 stroke-[3]" /> Add First Wish
                        </button>
                    )}
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                        {filteredWishes.map((wish, index) => (
                            <motion.div
                                key={wish.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                transition={{ duration: 0.25 }}
                                className={`p-6 rounded-[2rem] border transition-all duration-300 flex flex-col justify-between relative overflow-hidden group ${
                                    isDark 
                                        ? 'bg-[#151b2c] border-white/5 hover:border-white/10 shadow-2xl' 
                                        : 'bg-white border-orange-100/50 hover:border-orange-200 shadow-lg shadow-orange-500/2 hover:shadow-orange-500/6'
                                }`}
                            >
                                {/* Glow element on hover */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/5 to-pink-500/0 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                                <div>
                                    {/* Card Header */}
                                    <div className="flex items-start justify-between gap-4 mb-3">
                                        <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border ${
                                            VIBE_COLORS[wish.category] || 'bg-slate-100 text-slate-600'
                                        }`}>
                                            {wish.category}
                                        </span>
                                        
                                        {/* Heart Spark Rating */}
                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <Heart 
                                                    key={i} 
                                                    className={`w-3.5 h-3.5 ${
                                                        i < wish.priority 
                                                            ? 'text-coral fill-coral' 
                                                            : isDark ? 'text-white/10' : 'text-slate-200'
                                                    }`} 
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Wish Title */}
                                    <h4 className={`text-md font-black tracking-tight leading-snug mb-2 ${
                                        wish.is_completed ? 'line-through opacity-50' : ''
                                    } ${isDark ? 'text-white' : 'text-navy'}`}>
                                        {wish.title}
                                    </h4>

                                    {/* Notes */}
                                    {wish.notes && (
                                        <p className={`text-xs font-semibold leading-relaxed mb-4 ${
                                            isDark ? 'text-white/40' : 'text-slate-400'
                                        }`}>
                                            {wish.notes}
                                        </p>
                                    )}
                                </div>

                                {/* Card Footer Action Area */}
                                <div className="border-t border-gray-100/5 pt-4 mt-2 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        {/* Complete Checkbox */}
                                        <button
                                            onClick={() => handleToggleComplete(wish.id, wish.is_completed)}
                                            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                                                wish.is_completed
                                                    ? 'border-green-500 bg-green-500/10 text-green-500'
                                                    : isDark 
                                                        ? 'border-white/10 hover:border-coral bg-white/5 text-transparent hover:text-coral/50' 
                                                        : 'border-slate-200 hover:border-coral bg-slate-50 text-transparent hover:text-coral/50'
                                            }`}
                                            title={wish.is_completed ? 'Mark Active' : 'Mark Completed (Experienced!)'}
                                        >
                                            <Check className="w-4 h-4 stroke-[3.5]" />
                                        </button>
                                        
                                        {/* Budget Indicator */}
                                        <span className={`text-xs font-black tracking-wider px-2 py-0.5 rounded-lg ${
                                            isDark ? 'bg-white/5 text-white/50' : 'bg-slate-50 text-slate-400'
                                        }`}>
                                            {wish.budget}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {/* AI Spark Button */}
                                        {!wish.is_completed && (
                                            <button
                                                onClick={() => onSparkWish(wish.title, wish.category)}
                                                className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-orange-500/10 to-coral/10 hover:from-orange-500 hover:to-coral border border-coral/25 hover:border-transparent text-coral hover:text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-sm hover:shadow-md hover:shadow-coral/20"
                                                title="Spark a Date Plan from this wish!"
                                            >
                                                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                                                Spark ⚡
                                            </button>
                                        )}

                                        {/* Delete Button */}
                                        <button
                                            onClick={() => handleDeleteWish(wish.id)}
                                            className={`p-2 rounded-xl transition-all border ${
                                                isDark 
                                                    ? 'border-white/5 hover:border-red-500/30 text-white/30 hover:text-red-500 hover:bg-red-500/5' 
                                                    : 'border-slate-100 hover:border-red-100 text-slate-300 hover:text-red-500 hover:bg-red-50/50'
                                            }`}
                                            title="Delete wish"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Slide-over Form Modal for Adding wishes */}
            <AnimatePresence>
                {isAddOpen && (
                    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-end">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAddOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />

                        {/* Form Panel */}
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
                            className={`w-full max-w-md h-full relative z-10 flex flex-col justify-between border-l ${
                                isDark ? 'bg-[#0f1422] border-white/5 text-white' : 'bg-white border-gray-100 text-navy'
                            }`}
                        >
                            <div className="p-6 overflow-y-auto flex-1 space-y-6">
                                {/* Form Header */}
                                <div className="flex items-center justify-between border-b border-gray-100/5 pb-4">
                                    <div className="flex items-center gap-2.5">
                                        <Gift className="w-5 h-5 text-coral" />
                                        <h3 className="text-lg font-black tracking-tight">Add Wishlist Date</h3>
                                    </div>
                                    <button
                                        onClick={() => setIsAddOpen(false)}
                                        className={`p-2 rounded-xl border ${
                                            isDark ? 'border-white/5 hover:bg-white/5 text-white/50' : 'border-gray-100 hover:bg-gray-50 text-slate-400'
                                        }`}
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <form onSubmit={handleAddWish} className="space-y-5">
                                    {/* Date Wish Title */}
                                    <div>
                                        <label className={`block text-xs font-black uppercase tracking-wider mb-2 ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
                                            Date Activity / Spot Name
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={newTitle}
                                            onChange={(e) => setNewTitle(e.target.value)}
                                            placeholder="e.g. Try pottery class, Picnic at Sunset Cliff"
                                            className={`w-full px-4 py-3.5 rounded-2xl text-sm font-bold border outline-none transition-all ${
                                                isDark 
                                                    ? 'bg-white/5 border-white/10 text-white focus:border-coral/50 focus:bg-white/10' 
                                                    : 'bg-slate-50 border-slate-200 text-navy focus:border-coral/50 focus:bg-white'
                                            }`}
                                        />
                                    </div>

                                    {/* Vibe Category */}
                                    <div>
                                        <label className={`block text-xs font-black uppercase tracking-wider mb-2 ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
                                            Date Vibe / Category
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {CATEGORIES.map((cat) => (
                                                <button
                                                    key={cat}
                                                    type="button"
                                                    onClick={() => setNewCategory(cat)}
                                                    className={`px-3 py-2.5 rounded-xl border text-center text-xs font-bold transition-all ${
                                                        newCategory === cat
                                                            ? 'border-coral bg-coral/10 text-coral'
                                                            : isDark 
                                                                ? 'border-white/10 bg-white/5 text-white/50 hover:bg-white/10' 
                                                                : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300'
                                                    }`}
                                                >
                                                    {cat}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Excitement level (Priority) */}
                                    <div>
                                        <label className={`block text-xs font-black uppercase tracking-wider mb-2 ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
                                            Spark Priority (Excitement)
                                        </label>
                                        <div className="flex items-center gap-3 py-2 px-4 rounded-2xl border border-gray-100/5 bg-black/10 w-fit">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <button
                                                    key={i}
                                                    type="button"
                                                    onClick={() => setNewPriority(i + 1)}
                                                    className="transition-transform active:scale-90"
                                                >
                                                    <Heart 
                                                        className={`w-6 h-6 ${
                                                            i < newPriority 
                                                                ? 'text-coral fill-coral' 
                                                                : isDark ? 'text-white/20' : 'text-slate-300'
                                                        }`} 
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Budget Selection */}
                                    <div>
                                        <label className={`block text-xs font-black uppercase tracking-wider mb-2 ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
                                            Estimated Budget
                                        </label>
                                        <div className="flex rounded-2xl p-1 border w-full max-w-[200px] border-gray-100/5 bg-black/10">
                                            {['$', '$$', '$$$'].map((b) => (
                                                <button
                                                    key={b}
                                                    type="button"
                                                    onClick={() => setNewBudget(b)}
                                                    className={`flex-1 py-2 text-center text-xs font-black rounded-xl transition-all ${
                                                        newBudget === b
                                                            ? 'bg-gradient-to-r from-orange-500 to-coral text-white shadow'
                                                            : 'text-slate-400 hover:text-white'
                                                    }`}
                                                >
                                                    {b}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Notes */}
                                    <div>
                                        <label className={`block text-xs font-black uppercase tracking-wider mb-2 ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
                                            Specific Notes or Links (Optional)
                                        </label>
                                        <textarea
                                            rows={3}
                                            value={newNotes}
                                            onChange={(e) => setNewNotes(e.target.value)}
                                            placeholder="e.g. Bring a warm blanket, best viewed during twilight"
                                            className={`w-full px-4 py-3 rounded-2xl text-sm font-semibold border outline-none transition-all resize-none ${
                                                isDark 
                                                    ? 'bg-white/5 border-white/10 text-white focus:border-coral/50 focus:bg-white/10' 
                                                    : 'bg-slate-50 border-slate-200 text-navy focus:border-coral/50 focus:bg-white'
                                            }`}
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-coral text-white font-black text-sm uppercase tracking-widest transition-all transform active:scale-95 shadow-lg shadow-coral/20 mt-4"
                                    >
                                        {submitting ? 'Adding...' : 'Save to Wishlist 💖'}
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default WishlistTab;
