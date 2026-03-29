import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Heart, MapPin, Calendar, Clock, Map as MapIcon, Sparkles } from 'lucide-react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

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

const SharedPlan = () => {
    const { id } = useParams();
    const [plan, setPlan] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [appTheme] = useState(() => localStorage.getItem('appTheme') || 'light');

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
    });

    useEffect(() => {
        const fetchPlan = async () => {
            try {
                const response = await fetch(`/api/plans/${id}`);
                if (!response.ok) {
                    throw new Error('Plan not found or could not be loaded.');
                }
                const data = await response.json();
                setPlan(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPlan();
    }, [id]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
                <div className="w-20 h-20 bg-coral/10 rounded-[2rem] flex items-center justify-center animate-pulse mb-4">
                    <Heart className="w-10 h-10 fill-coral text-coral" />
                </div>
                <h2 className="text-2xl font-black text-navy tracking-tight">Crafting your date...</h2>
                <p className="text-gray-400 font-medium mt-2">Setting the mood for a perfect evening</p>
            </div>
        );
    }

    if (error || !plan) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
                <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-coral">
                    <Heart className="w-8 h-8 fill-coral text-coral" />
                </div>
                <h2 className="text-2xl font-black text-navy mb-2">Oops! Plan Not Found</h2>
                <p className="text-gray-500 mb-6 max-w-sm">
                    This date plan might have been removed or the link is invalid.
                </p>
                <Link to="/" className="btn-primary py-3 px-8 rounded-xl font-bold inline-block">
                    Create Your Own on DateSpark
                </Link>
            </div>
        );
    }

    const itinerarySteps = Array.isArray(plan.itinerary) ? plan.itinerary : plan.itinerary?.steps || [];
    const mapCenter = itinerarySteps.length > 0
        ? { lat: itinerarySteps[0].lat, lng: itinerarySteps[0].lng }
        : { lat: 0, lng: 0 }; // Default neutral

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header / Free Marketing */}
            <header className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 group">
                        <img src="/datespark-logo.png" alt="DateSpark Logo" className="w-8 h-8 rounded-lg shadow-md object-cover bg-white group-hover:scale-105 transition-transform" />
                        <span className="text-lg font-black text-navy tracking-tight">DateSpark</span>
                    </Link>
                    <Link to="/" className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md shadow-violet-200 hover:-translate-y-0.5 transition-all">
                        <Sparkles className="w-4 h-4" /> Create your own date
                    </Link>
                </div>
            </header>

            <main className="flex-1 w-full max-w-5xl mx-auto py-8 px-4 sm:px-6 flex flex-col items-center">

                <div className="text-center mb-10 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-violet-50 text-violet-700 rounded-full text-sm font-bold mb-4 shadow-sm border border-violet-100">
                        <Sparkles className="w-4 h-4" /> AI-Generated Date Plan
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-navy mb-4 capitalize">{plan.vibe} Date</h1>
                    <div className="flex flex-wrap items-center justify-center gap-4 text-gray-500 font-medium">
                        <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-gray-100"><MapPin className="w-4 h-4 text-coral" /> {plan.location}</span>
                        <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-gray-100"><Calendar className="w-4 h-4 text-navy" /> {
                            plan.itinerary?.metadata?.planDate
                                ? new Date(plan.itinerary.metadata.planDate + 'T00:00:00').toLocaleDateString()
                                : plan.created_at.split('T')[0]
                        }</span>
                        <span className="flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1.5 rounded-lg shadow-sm border border-green-100 font-bold uppercase text-xs tracking-wider">{plan.budget}</span>
                    </div>
                </div>

                {/* Split View: Timeline + Map */}
                <div className="w-full bg-transparent md:bg-white rounded-[2rem] shadow-xl overflow-hidden flex flex-col md:flex-row relative animate-in fade-in zoom-in-95 duration-700 delay-100 border border-gray-100">

                    {/* Left Column: Timeline UI */}
                    <div className="flex-1 md:w-1/2 bg-transparent md:bg-white p-6 sm:p-8 md:p-12 md:max-h-[700px] overflow-y-auto z-10">
                            {/* Spacer for Map on Mobile */}
                            <div className="h-[200px] md:hidden flex-shrink-0"></div>
                            <div className="bg-white md:bg-transparent rounded-t-[2.5rem] p-6 md:p-0 shadow-sm md:shadow-none">
                                <div className="relative border-l-2 border-dashed border-gray-200 ml-4 space-y-12 pb-8">
                            {itinerarySteps.map((step, idx) => {
                                const dotColors = ['bg-coral', 'bg-yellow-400', 'bg-navy', 'bg-emerald-500', 'bg-purple-500'];
                                const textColor = ['text-coral', 'text-yellow-500', 'text-navy', 'text-emerald-600', 'text-purple-600'];
                                const colorIdx = idx % dotColors.length;

                                return (
                                    <div key={idx} className="relative pl-8 group">
                                        {/* Colored Dot */}
                                        <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-4 border-white flex items-center justify-center ${dotColors[colorIdx]}`}>
                                        </div>

                                        <p className={`text-xs font-black uppercase tracking-wider mb-1 ${textColor[colorIdx]}`}>
                                            {step.time} • {step.activity}
                                        </p>
                                        <h4 className="text-2xl font-black text-navy mb-2">{step.venue}</h4>
                                        <p className="text-gray-500 font-medium mb-3">{step.description}</p>

                                        {step.photoUrl && (
                                            <div className="mb-4 overflow-hidden rounded-xl border border-gray-100 shadow-sm mt-2">
                                                <img
                                                    src={step.photoUrl}
                                                    alt={step.venue}
                                                    className="w-full h-48 object-cover hover:scale-105 transition-transform duration-500"
                                                    loading="lazy"
                                                />
                                            </div>
                                        )}

                                        {step.directionsUrl && (
                                            <a href={step.directionsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-bold text-coral hover:text-coral/80 transition-colors">
                                                <MapPin className="w-4 h-4" /> View on Map
                                            </a>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    </div>

                    {/* Right Column: Google Map */}
                    <div className="absolute inset-0 md:relative md:w-1/2 h-full md:h-auto bg-gray-50 border-t md:border-t-0 md:border-l border-gray-100 z-0">
                        {isLoaded ? (
                            <GoogleMap
                                mapContainerStyle={{ width: '100%', height: '100%' }}
                                center={mapCenter}
                                zoom={14}
                                options={{ disableDefaultUI: true, styles: appTheme === 'dark' ? darkMapStyle : undefined }}
                            >
                                {itinerarySteps.map((step, idx) => (
                                    <Marker
                                        key={idx}
                                        position={{ lat: step.lat, lng: step.lng }}
                                        label={{ text: (idx + 1).toString(), color: 'white', fontWeight: 'bold' }}
                                    />
                                ))}
                            </GoogleMap>
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center bg-gray-100/50">
                                <MapIcon className="w-12 h-12 mb-4 opacity-50" />
                                <p className="font-medium">Loading Interactive Map...</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Final Viral CTA / Free Marketing */}
            <div className="w-full max-w-5xl mx-auto px-4 pb-20 pt-10">
                <div className="bg-gradient-to-r from-navy to-navy/90 rounded-[3rem] p-10 md:p-16 text-center shadow-2xl relative overflow-hidden group">
                    {/* Background Glow */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-coral/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-coral/30 transition-colors" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-600/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                    <div className="relative z-10 max-w-2xl mx-auto space-y-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-white/80 text-sm font-bold backdrop-blur-sm border border-white/10">
                            <Heart className="w-4 h-4 fill-coral text-coral" /> Trusted by 5,000+ Couples
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black text-white leading-tight">
                            Want a plan like this for <span className="text-transparent bg-clip-text bg-gradient-to-r from-coral to-gold animate-gradient-x">your next date?</span>
                        </h2>
                        <p className="text-lg text-white/60 font-medium">
                            Stop the "I don't know, what do you want to do?" fight. Get a full, ready-to-go plan in seconds.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                            <Link to="/signup" className="w-full sm:w-auto bg-coral text-white px-10 py-5 rounded-2xl font-black text-xl shadow-[0_10px_40px_rgba(255,127,80,0.3)] hover:scale-[1.05] transition-all flex items-center justify-center gap-3 active:scale-95 leading-none">
                                Plan My Date Now <Sparkles className="w-6 h-6" />
                            </Link>
                            <Link to="/" className="w-full sm:w-auto bg-white/5 hover:bg-white/10 text-white px-10 py-5 rounded-2xl font-black text-xl border border-white/10 transition-all flex items-center justify-center gap-3">
                                See How It Works
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Sticky CTA for Mobile (Free Marketing) */}
            <div className="sm:hidden fixed bottom-0 w-full bg-white border-t border-gray-100 p-4 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] z-40 transition-transform animate-in slide-in-from-bottom-full duration-500 delay-1000">
                <Link to="/signup" className="w-full bg-navy text-white px-4 py-4 rounded-xl text-md font-black shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
                    <Sparkles className="w-5 h-5 text-gold" /> Start Your Free Plan
                </Link>
            </div>

            <footer className="w-full py-8 text-center text-gray-400 text-sm font-medium mt-auto bg-white border-t border-gray-50">
                Powered by <Link to="/" className="font-bold text-navy hover:underline">DateSpark</Link>
            </footer>
        </div>
    );
};

export default SharedPlan;
