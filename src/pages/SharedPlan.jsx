import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Heart, MapPin, Calendar, Clock, Map as MapIcon, Sparkles } from 'lucide-react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

const SharedPlan = () => {
    const { id } = useParams();
    const [plan, setPlan] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

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
        return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold text-navy">Loading DateSpark Plan...</div>;
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
        : { lat: 40.7128, lng: -74.0060 }; // Default NYC

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
                <div className="w-full bg-white rounded-[2rem] shadow-xl overflow-hidden flex flex-col md:flex-row relative animate-in fade-in zoom-in-95 duration-700 delay-100 border border-gray-100">

                    {/* Left Column: Timeline UI */}
                    <div className="flex-1 md:w-1/2 p-8 md:p-12 md:max-h-[700px] overflow-y-auto">
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

                    {/* Right Column: Google Map */}
                    <div className="w-full md:w-1/2 h-[400px] md:h-auto bg-gray-50 relative border-t md:border-t-0 md:border-l border-gray-100">
                        {isLoaded ? (
                            <GoogleMap
                                mapContainerStyle={{ width: '100%', height: '100%' }}
                                center={mapCenter}
                                zoom={14}
                                options={{ disableDefaultUI: true }}
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

            {/* Bottom Sticky CTA for Mobile (Free Marketing) */}
            <div className="sm:hidden fixed bottom-0 w-full bg-white border-t border-gray-100 p-4 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] z-40">
                <Link to="/" className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-4 py-3.5 rounded-xl text-md font-black shadow-lg shadow-violet-200 flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
                    <Sparkles className="w-5 h-5" /> Make Your Own Plan on DateSpark
                </Link>
            </div>

            <footer className="w-full py-8 text-center text-gray-400 text-sm font-medium mt-auto bg-white border-t border-gray-50">
                Powered by <Link to="/" className="font-bold text-navy hover:underline">DateSpark</Link>
            </footer>
        </div>
    );
};

export default SharedPlan;
