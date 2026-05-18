import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, Copy, Download, Trash2, Edit2, Plus, 
    Smile, Heart, Users, Compass, Eye, Code, Terminal, Check
} from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '';

const WishlistTab = ({ appTheme, setToastMessage }) => {
    const isDark = appTheme === 'dark';
    
    // Form Inputs
    const [wishlistPrompt, setWishlistPrompt] = useState('');
    const [partnerName, setPartnerName] = useState('');
    const [relationType, setRelationType] = useState('partner');
    
    // Output States
    const [loading, setLoading] = useState(false);
    const [wishlistData, setWishlistData] = useState(null);
    const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'json'
    const [copied, setCopied] = useState(false);

    const handleSparkWishlist = async (e) => {
        e.preventDefault();
        if (!wishlistPrompt.trim()) {
            setToastMessage('Please enter at least one activity or idea!');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(`${API_BASE}/api/wishlist-parse`, {
                wishlistPrompt,
                partnerName: partnerName.trim() || 'Companion',
                relationType
            });

            if (response.data.success && response.data.wishlist) {
                setWishlistData(response.data.wishlist);
                setToastMessage('Wishlist Sparked! ⚡');
            } else {
                setToastMessage('Could not structure wishlist. Please try again.');
            }
        } catch (err) {
            console.error('[WISHLIST_SPARK_ERROR]', err);
            setToastMessage('Failed to connect to Spark AI. Please check your setup.');
        } finally {
            setLoading(false);
        }
    };

    const handleCopyToClipboard = () => {
        if (!wishlistData) return;
        navigator.clipboard.writeText(JSON.stringify(wishlistData, null, 2));
        setCopied(true);
        setToastMessage('JSON Copied to Clipboard! 📋');
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownloadJSON = () => {
        if (!wishlistData) return;
        const fileData = JSON.stringify(wishlistData, null, 2);
        const blob = new Blob([fileData], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `${partnerName.trim() || 'companion'}_wishlist.json`;
        link.href = url;
        link.click();
        setToastMessage('Wishlist JSON Downloaded! 📥');
    };

    const RELATION_OPTIONS = [
        { value: 'partner', label: 'Romantic Partner', icon: Heart, color: 'text-rose-500' },
        { value: 'friend', label: 'Best Friend', icon: Smile, color: 'text-amber-500' },
        { value: 'date', label: 'First Date / Crush', icon: Sparkles, color: 'text-violet-500' },
        { value: 'spouse', label: 'Spouse / Wife / Husband', icon: Users, color: 'text-emerald-500' }
    ];

    return (
        <div className="pt-6 max-w-4xl mx-auto px-4 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0">
                    <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h2 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-navy'}`}>
                        Create with Spark AI
                    </h2>
                    <p className={`text-sm font-medium ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
                        Structure your shared activities wishlist into formatted, premium JSON output
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left side: Input Form */}
                <div className="lg:col-span-5 space-y-6">
                    <div className={`p-6 rounded-[2rem] border transition-all duration-300 ${
                        isDark ? 'bg-white/5 border-white/10 shadow-2xl' : 'bg-white border-gray-100 shadow-xl'
                    }`}>
                        <form onSubmit={handleSparkWishlist} className="space-y-5">
                            {/* Companion Name */}
                            <div>
                                <label className={`block text-xs font-black uppercase tracking-wider mb-2 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                                    Companion Name
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Jess, Alex"
                                    value={partnerName}
                                    onChange={(e) => setPartnerName(e.target.value)}
                                    className={`w-full px-4 py-3 rounded-2xl text-sm font-bold border outline-none transition-all ${
                                        isDark 
                                            ? 'bg-white/5 border-white/10 text-white focus:border-orange-500/40 focus:bg-white/10' 
                                            : 'bg-gray-50 border-gray-200 text-navy focus:border-orange-300 focus:bg-white'
                                    }`}
                                />
                            </div>

                            {/* Relationship Type */}
                            <div>
                                <label className={`block text-xs font-black uppercase tracking-wider mb-2 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                                    Relationship Type
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {RELATION_OPTIONS.map((opt) => {
                                        const Icon = opt.icon;
                                        const isSelected = relationType === opt.value;
                                        return (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => setRelationType(opt.value)}
                                                className={`flex items-center gap-2 p-3 rounded-xl border text-left text-xs font-black transition-all ${
                                                    isSelected
                                                        ? 'border-orange-500 bg-orange-500/10 text-orange-500'
                                                        : isDark 
                                                            ? 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10' 
                                                            : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                                                }`}
                                            >
                                                <Icon className={`w-3.5 h-3.5 shrink-0 ${opt.color}`} />
                                                <span className="truncate">{opt.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Wishlist Prompt */}
                            <div>
                                <label className={`block text-xs font-black uppercase tracking-wider mb-2 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                                    Activities Wishlist Prompt
                                </label>
                                <textarea
                                    rows={4}
                                    placeholder="Enter things you want to do... (e.g. coffee date at a cozy cafe, try pottery class, sunset walk, stargazing)"
                                    value={wishlistPrompt}
                                    onChange={(e) => setWishlistPrompt(e.target.value)}
                                    className={`w-full px-4 py-3 rounded-2xl text-sm font-medium border outline-none transition-all resize-none ${
                                        isDark 
                                            ? 'bg-white/5 border-white/10 text-white focus:border-orange-500/40 focus:bg-white/10' 
                                            : 'bg-gray-50 border-gray-200 text-navy focus:border-orange-300 focus:bg-white'
                                    }`}
                                />
                            </div>

                            {/* Spark Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-white transition-all transform active:scale-95 flex items-center justify-center gap-2 shadow-lg ${
                                    loading 
                                        ? 'bg-orange-500/50 cursor-not-allowed' 
                                        : 'bg-gradient-to-r from-orange-500 to-red-600 hover:opacity-90 shadow-orange-500/20'
                                }`}
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Sparking JSON...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4" />
                                        Spark Wishlist
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Right side: JSON / Output Console */}
                <div className="lg:col-span-7 space-y-6">
                    <AnimatePresence mode="wait">
                        {!wishlistData ? (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className={`rounded-[2rem] p-12 text-center border flex flex-col items-center justify-center min-h-[400px] ${
                                    isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
                                }`}
                            >
                                <div className="w-16 h-16 bg-gradient-to-br from-orange-500/10 to-red-600/10 rounded-3xl flex items-center justify-center mb-6">
                                    <Terminal className="w-8 h-8 text-orange-500" />
                                </div>
                                <h3 className={`text-xl font-black mb-2 ${isDark ? 'text-white' : 'text-navy'}`}>
                                    JSON Console Ready
                                </h3>
                                <p className={`text-sm max-w-sm mx-auto ${isDark ? 'text-white/40' : 'text-gray-500'}`}>
                                    Fill out the form on the left and spark it to generate a beautiful, structured JSON wishlist.
                                </p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="output"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={`rounded-[2rem] border overflow-hidden transition-all duration-300 ${
                                    isDark ? 'bg-[#0d1220] border-white/10 shadow-2xl' : 'bg-white border-gray-200 shadow-xl'
                                }`}
                            >
                                {/* Console Controls Header */}
                                <div className={`flex items-center justify-between px-6 py-4 border-b ${
                                    isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'
                                }`}>
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex gap-1.5">
                                            <div className="w-3 h-3 rounded-full bg-red-500" />
                                            <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                            <div className="w-3 h-3 rounded-full bg-green-500" />
                                        </div>
                                        <span className={`text-xs font-mono font-black ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
                                            wishlist_output.json
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {/* Toggle View */}
                                        <div className={`flex rounded-lg p-0.5 border ${isDark ? 'border-white/10 bg-black/20' : 'border-gray-200 bg-gray-100'}`}>
                                            <button
                                                onClick={() => setViewMode('cards')}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all ${
                                                    viewMode === 'cards'
                                                        ? 'bg-orange-500 text-white shadow-sm'
                                                        : isDark ? 'text-white/50 hover:text-white' : 'text-gray-500 hover:text-navy'
                                                }`}
                                            >
                                                <Eye className="w-3.5 h-3.5" /> Interactive
                                            </button>
                                            <button
                                                onClick={() => setViewMode('json')}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all ${
                                                    viewMode === 'json'
                                                        ? 'bg-orange-500 text-white shadow-sm'
                                                        : isDark ? 'text-white/50 hover:text-white' : 'text-gray-500 hover:text-navy'
                                                }`}
                                            >
                                                <Code className="w-3.5 h-3.5" /> Raw JSON
                                            </button>
                                        </div>
                                        
                                        {/* Copy / Download Buttons */}
                                        <button
                                            onClick={handleCopyToClipboard}
                                            className={`p-2 rounded-xl transition-all ${
                                                isDark ? 'bg-white/5 text-white/60 hover:bg-white/10' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                            }`}
                                            title="Copy JSON"
                                        >
                                            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                        <button
                                            onClick={handleDownloadJSON}
                                            className={`p-2 rounded-xl transition-all ${
                                                isDark ? 'bg-white/5 text-white/60 hover:bg-white/10' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                            }`}
                                            title="Download JSON"
                                        >
                                            <Download className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Content Display */}
                                <div className="p-6">
                                    {viewMode === 'cards' ? (
                                        <div className="space-y-6">
                                            {/* Companion Overview */}
                                            <div className={`p-4 rounded-2xl flex items-center justify-between border ${
                                                isDark ? 'bg-white/5 border-white/5' : 'bg-orange-50/50 border-orange-100'
                                            }`}>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                                                        <Heart className="w-5 h-5 text-orange-500" />
                                                    </div>
                                                    <div>
                                                        <h4 className={`text-sm font-black ${isDark ? 'text-white' : 'text-navy'}`}>
                                                            {wishlistData.companionName}'s Wishlist
                                                        </h4>
                                                        <p className={`text-xs capitalize font-bold ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
                                                            {wishlistData.relationType} Vibe
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                                                    isDark ? 'bg-white/10 text-white/70' : 'bg-orange-100 text-orange-600'
                                                }`}>
                                                    JSON OK
                                                </span>
                                            </div>

                                            {/* Grid of Wishlist Items */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {wishlistData.items?.map((item, idx) => (
                                                    <motion.div
                                                        key={item.id || idx}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0, transition: { delay: idx * 0.05 } }}
                                                        className={`p-4 rounded-2xl border flex flex-col justify-between ${
                                                            item.type === 'suggested'
                                                                ? isDark ? 'bg-orange-950/20 border-orange-500/30' : 'bg-orange-50/30 border-orange-200'
                                                                : isDark ? 'bg-white/5 border-white/5' : 'bg-white border-gray-100'
                                                        }`}
                                                    >
                                                        <div>
                                                            <div className="flex items-center justify-between gap-2 mb-2">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xl shrink-0">{item.emoji || '✨'}</span>
                                                                    <h5 className={`font-black text-sm truncate max-w-[150px] ${isDark ? 'text-white' : 'text-navy'}`}>
                                                                        {item.title}
                                                                    </h5>
                                                                </div>
                                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                                                                    item.type === 'suggested'
                                                                        ? 'bg-orange-500 text-white'
                                                                        : isDark ? 'bg-white/10 text-white/55' : 'bg-gray-100 text-gray-500'
                                                                }`}>
                                                                    {item.type === 'suggested' ? 'AI Idea' : 'Wish'}
                                                                </span>
                                                            </div>
                                                            <p className={`text-xs font-medium mb-3 line-clamp-2 leading-relaxed ${
                                                                isDark ? 'text-white/60' : 'text-gray-500'
                                                            }`}>
                                                                {item.description}
                                                            </p>
                                                        </div>

                                                        <div className="flex items-center justify-between border-t pt-3 mt-1 border-gray-100/5">
                                                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded bg-orange-500/5 text-orange-500`}>
                                                                {item.vibe || 'Cozy'}
                                                            </span>
                                                            <span className={`text-[10px] font-black tracking-widest ${isDark ? 'text-white/50' : 'text-gray-400'}`}>
                                                                Cost: {item.cost || '$$'}
                                                            </span>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <pre className={`p-5 rounded-2xl font-mono text-xs overflow-x-auto leading-relaxed border max-h-[500px] ${
                                                isDark 
                                                    ? 'bg-black/40 border-white/5 text-orange-400' 
                                                    : 'bg-gray-50 border-gray-200 text-navy'
                                            }`}>
                                                <code>{JSON.stringify(wishlistData, null, 2)}</code>
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default WishlistTab;
