import React, { useState } from 'react';
import { MapPin, Calendar, Clock, DollarSign, ArrowRight, Play, Heart, Ticket, Share2, Wallet, CheckCircle } from 'lucide-react';

const Hero = () => {
    const [activeFeature, setActiveFeature] = useState('itinerary');

    const features = [
        { id: 'itinerary', icon: <Ticket className="w-5 h-5" />, label: 'Itinerary' },
        { id: 'sync', icon: <Calendar className="w-5 h-5" />, label: 'Sync' },
        { id: 'share', icon: <Share2 className="w-5 h-5" />, label: 'Share' },
        { id: 'budget', icon: <Wallet className="w-5 h-5" />, label: 'Budget' },
    ];

    return (
        <section className="relative pt-32 pb-20 overflow-hidden bg-white">
            {/* Background Decor - Enhanced */}
            <div className="absolute top-0 right-0 -z-10 w-2/3 h-full bg-gradient-to-bl from-violet-100/50 via-soft-pink/30 to-transparent rounded-l-[120px] blur-3xl opacity-70" />
            <div className="absolute -top-32 -left-32 -z-10 w-[500px] h-[500px] bg-gradient-to-br from-gold/20 via-coral/10 to-transparent rounded-full blur-3xl animate-pulse" />

            {/* Grid Pattern Overlay */}
            <div className="absolute inset-0 -z-10 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-[0.03]" />

            <div className="container-custom grid lg:grid-cols-2 gap-12 items-center relative z-10">
                <div className="text-center lg:text-left space-y-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-navy/5 border border-navy/10 text-navy rounded-full text-sm font-bold shadow-sm backdrop-blur-sm">
                        <div className="flex -space-x-2">
                            <div className="w-6 h-6 rounded-full bg-coral border-2 border-white flex items-center justify-center text-[8px] text-white">NYC</div>
                            <div className="w-6 h-6 rounded-full bg-gold border-2 border-white flex items-center justify-center text-[8px] text-navy">CHI</div>
                            <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center text-[8px] text-white">SF</div>
                        </div>
                        <span className="pl-1">Now live in New York, Chicago & SF</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl lg:text-[80px] font-black text-navy leading-[1.05] tracking-tight">
                        Get a full date night plan in <span className="text-transparent bg-clip-text bg-gradient-to-r from-coral via-pink-500 to-violet-500 animate-gradient-x">seconds.</span>
                    </h1>

                    <p className="text-xl text-gray-500 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
                        Stop arguing about where to go. We use real restaurants, bars, and local events to build your perfect, ready-to-go itinerary.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-5 pt-4">
                        <button className="bg-navy text-white px-8 py-4 rounded-2xl font-black text-lg flex items-center gap-2 shadow-[0_10px_40px_rgba(10,25,47,0.2)] hover:scale-[1.02] hover:shadow-[0_20px_60px_rgba(10,25,47,0.3)] transition-all group">
                            Plan a date now <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <a href="#how-it-works" className="flex items-center gap-2 text-navy font-semibold hover:text-coral transition-colors">
                            <div className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center">
                                <Play className="w-4 h-4 fill-navy" />
                            </div>
                            See how it works
                        </a>
                    </div>
                </div>

                <div className="relative">
                    {/* App Mockup Placeholder */}
                    <div className="relative z-10 bg-white rounded-[40px] shadow-2xl border-8 border-navy/5 overflow-hidden w-full max-w-[420px] mx-auto">
                        {/* Mockup Header */}
                        <div className="p-6 bg-navy text-white">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                        <Heart className="w-6 h-6 text-white fill-current" />
                                    </div>
                                    <div>
                                        <span className="block font-bold leading-none">Next Date</span>
                                        <span className="text-[10px] opacity-60 uppercase tracking-widest font-bold">Planned for Tonight</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="block font-bold">7:00 PM</span>
                                    <span className="text-[10px] opacity-60 font-bold">NYC</span>
                                </div>
                            </div>

                            {/* Feature Switcher Tabs */}
                            <div className="flex bg-white/10 rounded-2xl p-1 p-x-2 justify-between">
                                {features.map((f) => (
                                    <button
                                        key={f.id}
                                        onClick={() => setActiveFeature(f.id)}
                                        className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl transition-all ${activeFeature === f.id
                                            ? 'bg-white text-navy shadow-lg scale-105'
                                            : 'text-white/60 hover:text-white'
                                            }`}
                                    >
                                        {f.icon}
                                        <span className="text-[10px] font-bold">{f.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Mockup Content Body */}
                        <div className="p-8 min-h-[420px] bg-gray-50/50">
                            {activeFeature === 'itinerary' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="relative pl-8 border-l-2 border-dashed border-gray-200 space-y-8">
                                        <div className="relative">
                                            <div className="absolute -left-[41px] w-4 h-4 rounded-full bg-coral ring-4 ring-white" />
                                            <div className="space-y-1">
                                                <span className="text-xs font-bold uppercase tracking-wider text-coral">7:00 PM • Dinner</span>
                                                <h3 className="text-lg font-bold text-navy">The Golden Hour Bistro</h3>
                                                <p className="text-sm text-gray-500">Cozy Italian & Candlelight • NYC</p>
                                                <div className="pt-2 flex gap-2">
                                                    <span className="px-2 py-1 bg-coral/10 text-coral text-[10px] font-bold rounded">Confirmed</span>
                                                    <span className="px-2 py-1 bg-gray-100 text-gray-500 text-[10px] font-bold rounded">Menu Access</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="relative">
                                            <div className="absolute -left-[41px] w-4 h-4 rounded-full bg-gold ring-4 ring-white" />
                                            <div className="space-y-1">
                                                <span className="text-xs font-bold uppercase tracking-wider text-gold">9:00 PM • Live Music</span>
                                                <h3 className="text-lg font-bold text-navy">Starlight Jazz Lounge</h3>
                                                <p className="text-sm text-gray-500">Local quartet & signature drinks</p>
                                            </div>
                                        </div>

                                        <div className="relative">
                                            <div className="absolute -left-[41px] w-4 h-4 rounded-full bg-navy ring-4 ring-white" />
                                            <div className="space-y-1">
                                                <span className="text-xs font-bold uppercase tracking-wider text-navy">11:00 PM • Dessert</span>
                                                <h3 className="text-lg font-bold text-navy">Sweet Treats Rooftop</h3>
                                                <p className="text-sm text-gray-500">City views & artisan gelato</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeFeature === 'sync' && (
                                <div className="flex flex-col items-center justify-center h-full text-center space-y-6 animate-in fade-in zoom-in duration-500 py-10">
                                    <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center shadow-inner">
                                        <Calendar className="w-10 h-10" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-bold text-navy">Google Calendar Sync</h3>
                                        <p className="text-sm text-gray-500 px-6">Automatically add tonight's schedule and location maps to both your calendars.</p>
                                    </div>
                                    <label className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm cursor-pointer hover:bg-gray-50 transition-colors">
                                        <div className="w-10 h-6 bg-blue-600 rounded-full relative">
                                            <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                                        </div>
                                        <span className="font-bold text-sm text-navy">Sync Enabled</span>
                                    </label>
                                </div>
                            )}

                            {activeFeature === 'share' && (
                                <div className="flex flex-col items-center justify-center h-full text-center space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 py-10">
                                    <div className="w-20 h-20 bg-soft-pink text-coral rounded-3xl flex items-center justify-center">
                                        <Share2 className="w-10 h-10" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-bold text-navy">Shareable Itinerary</h3>
                                        <p className="text-sm text-gray-500 px-6">Send a private web link to your date. They can see the plan but you keep the location a secret until 4pm!</p>
                                    </div>
                                    <div className="w-full bg-white p-4 rounded-2xl border border-dashed border-gray-200 flex items-center justify-between gap-4">
                                        <span className="text-xs font-mono text-gray-400 truncate">datespark.app/v/x92_s0v...</span>
                                        <button className="text-coral font-bold text-xs uppercase hover:underline">Copy Link</button>
                                    </div>
                                </div>
                            )}

                            {activeFeature === 'budget' && (
                                <div className="flex flex-col items-center justify-center h-full text-center space-y-6 animate-in fade-in slide-in-from-left-4 duration-500 py-10">
                                    <div className="w-20 h-20 bg-gold/10 text-gold rounded-3xl flex items-center justify-center">
                                        <Wallet className="w-10 h-10" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-bold text-navy">Smart Budget Guard</h3>
                                        <p className="text-sm text-gray-500 px-6">We only pick spots that fit your $150/person limit. No surprise $20 cocktails here.</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 w-full">
                                        <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                            <span className="block text-[10px] font-bold text-gray-400 uppercase">Est. Cost</span>
                                            <span className="text-lg font-bold text-navy">$118.00</span>
                                        </div>
                                        <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                            <span className="block text-[10px] font-bold text-gray-400 uppercase overflow-hidden text-ellipsis whitespace-nowrap">Budget Status</span>
                                            <span className="text-lg font-bold text-green-500">-$32 Left</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <button className="w-full bg-navy text-white py-5 rounded-2xl font-black text-xl tracking-tight flex items-center justify-center gap-3 mt-8 shadow-[0_20px_40px_rgba(10,25,47,0.3)] hover:scale-[1.02] transition-transform active:scale-95 leading-none relative z-30 group">
                                <span className="relative z-10">Get full access now</span>
                                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>

                    {/* Floating elements */}
                    <div className="hidden md:flex absolute -right-16 -bottom-16 bg-white p-5 rounded-[28px] shadow-2xl items-center gap-4 animate-waitlist-glow z-20 border border-gray-100 max-w-[200px]">
                        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center">
                            <CheckCircle className="w-7 h-7" />
                        </div>
                        <div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Available MVP</div>
                            <div className="font-black text-navy text-lg">Beta Ready</div>
                        </div>
                    </div>

                    <div className="hidden md:flex absolute -left-16 bottom-24 bg-white p-5 rounded-[28px] shadow-2xl flex-col gap-1 items-start z-10 border border-gray-100 group hover:-translate-y-2 transition-transform cursor-default max-w-[240px]">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-coral animate-ping" />
                            <span className="text-[10px] font-bold text-coral uppercase tracking-widest">Live Updates</span>
                        </div>
                        <div className="font-black text-navy">Nearby secrets active in NYC</div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
