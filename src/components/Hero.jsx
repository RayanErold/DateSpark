import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Clock, DollarSign, ArrowRight, Play, Heart, Ticket, Share2, Wallet, CheckCircle, X, Star, Map as MapIcon, Utensils, Compass, Car, Search } from 'lucide-react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

const DEMO_PLAN = {
    vibe: 'Classic Romance',
    location: 'New York City',
    itinerary: [
        {
            time: '6:00 PM',
            activity: 'Scenic Night Stroll',
            venue: 'The High Line',
            description: 'Start your evening on the elevated historic rail line with gorgeous skyline and Hudson River views.',
            photoUrl: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&q=80',
            lat: 40.7480, lng: -74.0048,
            rating: 4.8, reviews: 34102, price: 'Free',
            directionsUrl: '#'
        },
        {
            time: '7:30 PM',
            activity: 'Italian Candlelight Dinner',
            venue: 'L’Artusi',
            description: 'Signature handmade pasta and a curated wine list in a cozy, intimate West Village setting.',
            photoUrl: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80',
            lat: 40.7338, lng: -74.0056,
            rating: 4.6, reviews: 2432, price: '50',
            directionsUrl: '#', bookingUrl: '#', bookingType: 'opentable'
        },
        {
            time: '9:30 PM',
            activity: 'Speakeasy Cocktails',
            venue: 'Raines Law Room',
            description: 'Ring the doorbell to enter this sophisticated Chelsea den for world-class craft cocktails.',
            photoUrl: 'https://images.unsplash.com/photo-1574096079513-d8259312b785?w=800&q=80',
            lat: 40.7374, lng: -73.9937,
            rating: 4.7, reviews: 1560, price: '20',
            directionsUrl: '#'
        },
        {
            time: '11:00 PM',
            activity: 'Skyline Views',
            venue: 'Top of the Rock',
            description: 'Take in 360-degree views of the Manhattan skyline from the legendary observation deck.',
            photoUrl: 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?w=800&q=80',
            lat: 40.7587, lng: -73.9787,
            rating: 4.7, reviews: 45000, price: '100',
            directionsUrl: '#'
        },
        {
            time: '12:30 AM',
            activity: 'Smooth Jazz',
            venue: 'Village Vanguard',
            description: 'End the night at the "Camelot of Jazz," the most famous basement in music history.',
            photoUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&q=80',
            lat: 40.7361, lng: -74.0017,
            rating: 4.8, reviews: 2100, price: '30',
            directionsUrl: '#'
        }
    ]
};

const Hero = () => {
    const [activeFeature, setActiveFeature] = useState('itinerary');
    const [showDemoModal, setShowDemoModal] = useState(false);
    const [showMapMobile, setShowMapMobile] = useState(false);
    const navigate = useNavigate();

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
    });

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
                        <Link to="/signup" className="bg-navy text-white px-8 py-4 rounded-2xl font-black text-lg flex items-center gap-2 shadow-[0_10px_40px_rgba(10,25,47,0.2)] hover:scale-[1.02] hover:shadow-[0_20px_60px_rgba(10,25,47,0.3)] transition-all group">
                            Start My Plan <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <button
                            onClick={() => setShowDemoModal(true)}
                            className="flex items-center gap-2 text-navy font-bold hover:text-coral transition-colors bg-white border-2 border-gray-200 px-6 py-4 rounded-2xl hover:border-coral group shadow-sm active:scale-95"
                        >
                            <div className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center group-hover:border-coral transition-colors">
                                <Play className="w-4 h-4 fill-navy group-hover:fill-coral group-hover:text-coral transition-colors" />
                            </div>
                            See a Demo
                        </button>
                    </div>
                </div>

                <div className="relative">
                    {/* App Mockup Placeholder */}
                    <div className="relative z-10 bg-white rounded-[40px] shadow-2xl border-8 border-navy/5 overflow-hidden w-full max-w-[420px] mx-auto h-[600px] flex flex-col">
                        {/* Mockup Header */}
                        <div className="p-6 bg-navy text-white flex-shrink-0">
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
                        <div className="p-8 bg-gray-50/50 flex-1 overflow-y-auto custom-scrollbar relative">
                            {/* Map Background Layer for Itinerary */}
                            {activeFeature === 'itinerary' && (
                                <div className="absolute inset-0 opacity-20 pointer-events-none z-0 overflow-hidden">
                                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1449034446853-66c86144b0ad?w=1000&q=80')] bg-cover bg-center grayscale" />
                                    <div className="absolute inset-0 bg-gradient-to-b from-gray-50/80 via-transparent to-gray-50/80" />
                                </div>
                            )}

                            {activeFeature === 'itinerary' && (
                                <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">
                                    <div className="relative border-l-2 border-dashed border-purple-500/20 ml-14 space-y-5 pb-4">
                                        {[
                                            { time: '6:00 PM', category: 'Walk', venue: 'The High Line', desc: 'Sunset walk on the elevated rail line.', icon: <Compass className="w-4 h-4 text-gold" />, dot: 'bg-gold', photoUrl: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&q=80' },
                                            { time: '7:30 PM', category: 'Dinner', venue: 'L’Artusi', desc: 'Cozy Italian & Candlelight in the West Village.', icon: <Utensils className="w-4 h-4 text-coral" />, dot: 'bg-coral', photoUrl: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80' },
                                            { time: '9:30 PM', category: 'Drinks', venue: 'Raines Law Room', desc: 'Secret speakeasy cocktails in Chelsea.', icon: <Search className="w-4 h-4 text-blue-500" />, dot: 'bg-blue-500', photoUrl: 'https://images.unsplash.com/photo-1574096079513-d8259312b785?w=800&q=80' },
                                            { time: '11:00 PM', category: 'View', venue: 'Top of the Rock', desc: 'Breathtaking 360-degree skyline views.', icon: <Compass className="w-4 h-4 text-navy" />, dot: 'bg-navy', photoUrl: 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?w=800&q=80' },
                                            { time: '12:30 AM', category: 'Jazz', venue: 'Village Vanguard', desc: 'Legendary basement jazz performance.', icon: <Ticket className="w-4 h-4 text-purple-500" />, dot: 'bg-purple-500', photoUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&q=80' }
                                        ].map((step, idx) => (
                                            <div key={idx} className="relative pl-5">
                                                {/* Left Absolute Time */}
                                                <div className="absolute -left-14 top-2 text-[10px] font-black text-gray-400 text-right w-10">
                                                    {step.time}
                                                </div>

                                                {/* Center Dot */}
                                                <div className={`absolute -left-[7px] top-3 w-3 h-3 rounded-full border-2 border-white shadow-sm ${step.dot}`} />

                                                {/* Right Card */}
                                                <div className="bg-white border border-gray-100 rounded-xl p-3 flex flex-col gap-2 shadow-sm transition-all hover:shadow-md">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                                                            {step.icon}
                                                        </div>
                                                        <div className="flex-1">
                                                            <h4 className="text-sm font-black text-navy line-clamp-1">{step.venue}</h4>
                                                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">{step.category}</p>
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-gray-500 border-t border-gray-50 pt-1.5 mt-0.5 leading-relaxed">{step.desc}</p>
                                                    {step.photoUrl && (
                                                        <img src={step.photoUrl} alt={step.venue} className="rounded-lg w-full h-24 object-cover border border-gray-50 shadow-sm mt-1" />
                                                    )}
                                                </div>
                                            </div>
                                        ))}
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
                                        <span className="text-xs font-mono text-gray-400 truncate">datespark.live/v/x92_s0v...</span>
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

                            <Link to="/signup" className="w-full bg-navy text-white py-5 rounded-2xl font-black text-xl tracking-tight flex items-center justify-center gap-3 mt-8 shadow-[0_20px_40px_rgba(10,25,47,0.3)] hover:scale-[1.02] transition-transform active:scale-95 leading-none relative z-30 group">
                                <span className="relative z-10">Plan Your Date</span>
                                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                            </Link>
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
            {/* Interactive Demo Modal */}
            {showDemoModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm">
                    <div className="bg-[#f8f9fa] rounded-[2rem] shadow-2xl w-full max-w-4xl h-full md:h-auto max-h-full md:max-h-[90vh] overflow-hidden flex flex-col md:flex-row relative animate-in zoom-in-95 duration-300">

                        {/* Left Sidebar - Timeline */}
                        <div className={`flex-1 min-h-0 overflow-y-auto custom-scrollbar bg-transparent md:bg-white flex-col z-10 ${showMapMobile ? 'hidden md:flex' : 'flex'}`}>
                            {/* Sticky Top Banner inside Modal */}
                            <div className="bg-[#0f172a]/90 backdrop-blur-md p-4 sm:p-6 pb-6 sm:pb-8 text-white relative flex justify-between items-center rounded-bl-[2rem] md:rounded-bl-none sticky top-0 z-20">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                                            <Heart className="w-5 h-5 fill-white text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-black font-outfit leading-tight">{DEMO_PLAN.vibe} Date</h2>
                                            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mt-1">Planned for Tonight</p>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowDemoModal(false);
                                        setShowMapMobile(false);
                                    }}
                                    className="p-2 text-white/60 hover:text-white bg-white/10 rounded-full transition-colors self-start"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Timeline Contents */}
                            <div className="relative flex-1 p-0 sm:p-8 sm:pt-4 pb-12 w-full">
                                {/* Spacer for Background Map Visualization on Mobile */}
                                <div className="h-[250px] md:hidden relative flex items-end justify-center pb-2 flex-shrink-0 z-20">
                                    {/* Mobile Map Toggle Button */}
                                    <button
                                        onClick={() => setShowMapMobile(true)}
                                        className="bg-navy/95 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-md flex items-center gap-1.5 border border-white/20 transform transition-all active:scale-95"
                                    >
                                        <MapIcon className="w-3.5 h-3.5" />
                                        Expand Map
                                    </button>
                                </div>

                                <div className="p-6 sm:p-8 pt-10 bg-white md:bg-white rounded-[2.5rem] md:rounded-none shadow-sm md:shadow-none relative z-10 mt-[-2rem]">
                                    <div className="space-y-6 border-l-2 border-dashed border-purple-500/20 ml-6 sm:ml-14 relative pb-6">
                                        {DEMO_PLAN.itinerary.map((step, idx) => {
                                            const dotColors = ['bg-coral', 'bg-gold', 'bg-blue-500', 'bg-navy', 'bg-purple-500'];
                                            const icons = [
                                                <Utensils className="w-5 h-5 text-coral" />,
                                                <Compass className="w-5 h-5 text-gold" />,
                                                <Search className="w-5 h-5 text-blue-500" />,
                                                <Compass className="w-5 h-5 text-navy" />,
                                                <Ticket className="w-5 h-5 text-purple-500" />
                                            ];
                                            return (
                                                <div key={idx} className="relative pl-5">
                                                    {/* Left Absolute Time */}
                                                    <div className="absolute -left-14 top-2 text-[11px] font-black text-gray-400 text-right w-10">
                                                        {step.time}
                                                    </div>

                                                    {/* Center Dot */}
                                                    <div className={`absolute -left-[7px] top-3 w-3 h-3 rounded-full border-2 border-white shadow-sm ${dotColors[idx % 3]}`} />

                                                    {/* Right Card */}
                                                    <div className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col gap-3 shadow-sm transition-all hover:shadow-md">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                                                                {icons[idx % icons.length]}
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <h4 className="text-base font-black text-navy">{step.venue}</h4>
                                                                    {step.rating && (
                                                                        <div className="flex items-center gap-1 bg-amber-50 text-amber-500 px-1.5 py-0.5 rounded-md text-xs font-bold border border-amber-100 flex-shrink-0">
                                                                            <Star className="w-3.5 h-3.5 fill-current" />
                                                                            {step.rating}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{step.activity}</p>
                                                            </div>
                                                        </div>
                                                        <p className="text-sm text-gray-500 border-t border-gray-50 pt-2 mt-1 leading-relaxed">{step.description}</p>
                                                        {step.photoUrl && (
                                                            <img src={step.photoUrl} alt={step.venue} className="rounded-xl w-full h-40 object-cover border border-gray-50 shadow-sm mt-1 mb-2" />
                                                        )}

                                                        {/* Action Tags */}
                                                        <div className="flex flex-wrap items-center gap-2 mt-1">
                                                            {step.directionsUrl && (
                                                                <button
                                                                    className="px-2.5 py-1.5 bg-blue-50 text-blue-600 outline outline-1 outline-blue-200 text-xs font-bold rounded-lg hover:bg-blue-600 hover:text-white transition-all inline-flex items-center gap-1 shadow-sm cursor-default"
                                                                >
                                                                    <MapPin className="w-3 h-3" /> Get Directions
                                                                </button>
                                                            )}

                                                            {step.bookingUrl && (
                                                                <button
                                                                    className="px-2.5 py-1.5 bg-green-50 text-green-600 outline outline-1 outline-green-200 text-xs font-bold rounded-lg hover:bg-green-600 hover:text-white transition-all inline-flex items-center gap-1 shadow-sm cursor-default"
                                                                >
                                                                    {step.bookingType === 'opentable' ? <Utensils className="w-3 h-3" /> : <Ticket className="w-3 h-3" />}
                                                                    {step.bookingType === 'opentable' ? 'Book on OpenTable' : 'Find Tickets'}
                                                                </button>
                                                            )}

                                                            {step.searchUrl && (
                                                                <button
                                                                    className="px-2.5 py-1.5 bg-blue-50 text-blue-600 outline outline-1 outline-blue-200 text-xs font-bold rounded-lg hover:bg-blue-600 hover:text-white transition-all inline-flex items-center gap-1 shadow-sm cursor-default"
                                                                >
                                                                    <Search className="w-3 h-3" /> Search on Google
                                                                </button>
                                                            )}

                                                            {step.lat && step.lng && (
                                                                <button
                                                                    className="px-2.5 py-1.5 bg-black text-white text-xs font-bold rounded-lg hover:bg-gray-800 transition-colors inline-flex items-center gap-1 shadow-sm cursor-default"
                                                                >
                                                                    <Car className="w-3 h-3" /> Get a Ride
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="mt-8 -ml-14 bg-gray-50 p-6 rounded-3xl border border-gray-100 flex flex-col items-center justify-center text-center space-y-4">
                                    <div className="w-12 h-12 bg-coral/10 text-coral rounded-2xl flex items-center justify-center">
                                        <Heart className="w-6 h-6 fill-current" />
                                    </div>
                                    <h4 className="font-bold text-navy text-lg">Ready to spark something?</h4>
                                    <button
                                        onClick={() => {
                                            setShowDemoModal(false);
                                            setShowMapMobile(false);
                                            navigate('/signup');
                                        }}
                                        className="w-full bg-navy text-white py-4 px-6 rounded-2xl font-black text-center flex items-center justify-center gap-2 hover:bg-coral transition-colors shadow-lg group shadow-coral/5"
                                    >
                                        Plan Your First Date <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Right Panel - Embedded Google Map */}
                        <div className={`${showMapMobile ? 'flex flex-1 min-h-[80vh] z-50' : 'absolute inset-0 z-0 md:relative md:flex pointer-events-none md:pointer-events-auto'} md:flex-col w-full md:w-5/12 bg-gray-50 border-l border-gray-200`}>
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

                            {isLoaded ? (
                                <div className="flex-1 w-full relative min-h-[50vh]">
                                    <GoogleMap
                                        mapContainerStyle={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
                                        center={{ lat: 40.7400, lng: -73.9980 }} // Center on mapped area
                                        zoom={14}
                                        options={{
                                            disableDefaultUI: true,
                                            gestureHandling: 'greedy',
                                        }}
                                    >
                                        {DEMO_PLAN.itinerary.map((step, idx) => (
                                            <Marker
                                                key={idx}
                                                position={{ lat: step.lat, lng: step.lng }}
                                                label={{ text: (idx + 1).toString(), color: 'white', fontWeight: 'bold' }}
                                            />
                                        ))}
                                    </GoogleMap>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center bg-gray-100/50 min-h-[50vh]">
                                    <MapIcon className="w-12 h-12 mb-4 opacity-50" />
                                    <p className="font-medium">Please add your Google Maps API Key to view the map.</p>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            )}
        </section>
    );
};

export default Hero;
