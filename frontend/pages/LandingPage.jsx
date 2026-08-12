import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search } from 'lucide-react';
import Navbar from '../components/common/Navbar';
import Hero from '../components/landing/Hero';
import Features from '../components/landing/Features';
import PopularPlans from '../components/landing/PopularPlans';
import NearbyEvents from '../components/landing/NearbyEvents';
import HowItWorks from '../components/landing/HowItWorks';
import SocialProof from '../components/landing/SocialProof';
import FAQ from '../components/landing/FAQ';
import Footer from '../components/common/Footer';
import { useGoogleMaps } from '../lib/googleMaps';

const CITIES = ['New York', 'Los Angeles', 'Chicago', 'Miami', 'San Francisco'];
const CITY_EMOJIS = {
    'New York': '🗽',
    'Los Angeles': '🌴',
    'Chicago': '🏙️',
    'Miami': '☀️',
    'San Francisco': '🌉'
};

const LandingPage = () => {
    const [selectedCity, setSelectedCity] = useState(() => localStorage.getItem('user_city') || 'New York');
    const [showModal, setShowModal] = useState(false);
    const [showPermissionModal, setShowPermissionModal] = useState(false);
    const [userCoords, setUserCoords] = useState(() => {
        const stored = localStorage.getItem('user_coords');
        return stored ? JSON.parse(stored) : null;
    });
    const [searchRadius, setSearchRadius] = useState(() => {
        const stored = localStorage.getItem('search_radius');
        return stored ? Number(stored) : 15;
    });
    const [addressInput, setAddressInput] = useState(() => localStorage.getItem('user_address') || 'New York, USA');

    const { isLoaded } = useGoogleMaps();
    const autocompleteRef = useRef(null);
    const inputRef = useRef(null);

    const requestBrowserLocation = (choice) => {
        if (!navigator.geolocation) {
            console.warn('Geolocation not supported');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setUserCoords(coords);
                localStorage.setItem('user_coords', JSON.stringify(coords));
                localStorage.setItem('location_permission_choice', choice);
                
                if (window.google?.maps?.Geocoder) {
                    new window.google.maps.Geocoder().geocode({ location: coords }, (results, status) => {
                        if (status === 'OK' && results[0]) {
                            const formatted = results[0].formatted_address;
                            setAddressInput(formatted);
                            localStorage.setItem('user_address', formatted);
                            
                            const cityComp = results[0].address_components.find(c => 
                                c.types.includes('locality') || c.types.includes('sublocality')
                            );
                            if (cityComp) {
                                setSelectedCity(cityComp.long_name);
                                localStorage.setItem('user_city', cityComp.long_name);
                            }
                        }
                    });
                }
            },
            (err) => {
                console.warn('Geolocation permission rejected or failed:', err);
                localStorage.setItem('location_permission_choice', 'declined');
                const storedCity = localStorage.getItem('user_city');
                if (!storedCity) {
                    setShowModal(true);
                }
            }
        );
    };

    useEffect(() => {
        const choice = localStorage.getItem('location_permission_choice');
        if (!choice) {
            // Delay modal slightly for smoother animation entrance
            const timer = setTimeout(() => setShowPermissionModal(true), 800);
            return () => clearTimeout(timer);
        } else if (choice === 'always' || choice === 'while_using') {
            requestBrowserLocation(choice);
        } else {
            const storedCity = localStorage.getItem('user_city');
            if (!storedCity) {
                setShowModal(true);
            }
        }
    }, []);

    useEffect(() => {
        if (!isLoaded || !inputRef.current) return;
        autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
            types: ['geocode', 'establishment'],
        });

        autocompleteRef.current.addListener('place_changed', () => {
            const place = autocompleteRef.current.getPlace();
            if (place.geometry && place.geometry.location) {
                const lat = place.geometry.location.lat();
                const lng = place.geometry.location.lng();
                const coords = { lat, lng };
                setUserCoords(coords);
                localStorage.setItem('user_coords', JSON.stringify(coords));
                
                const formatted = place.formatted_address || place.name;
                setAddressInput(formatted);
                localStorage.setItem('user_address', formatted);

                const cityComp = place.address_components?.find(c => c.types.includes('locality'));
                if (cityComp) {
                    setSelectedCity(cityComp.long_name);
                    localStorage.setItem('user_city', cityComp.long_name);
                }
            }
        });
    }, [isLoaded]);

    const handleCitySelect = (city) => {
        setSelectedCity(city);
        localStorage.setItem('user_city', city);
        
        const cityCoords = {
            'New York': { lat: 40.7128, lng: -74.0060 },
            'Los Angeles': { lat: 34.0522, lng: -118.2437 },
            'Chicago': { lat: 41.8781, lng: -87.6298 },
            'Miami': { lat: 25.7617, lng: -80.1918 },
            'San Francisco': { lat: 37.7749, lng: -122.4194 }
        }[city] || { lat: 40.7128, lng: -74.0060 };
        
        setUserCoords(cityCoords);
        localStorage.setItem('user_coords', JSON.stringify(cityCoords));
        setAddressInput(`${city}, USA`);
        localStorage.setItem('user_address', `${city}, USA`);
        
        setShowModal(false);
    };

    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            
            <main className="pt-20">
                {/* ── PREMIUM LOCATION BANNER ── */}
                <div className="bg-ivory border-b border-blush/40 py-4 px-4 shadow-sm relative z-40">
                    <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-4 font-outfit">
                        
                        {/* Autocomplete Input & GPS Button */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto flex-1 max-w-xl">
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <div className="w-8 h-8 rounded-full bg-rose/10 flex items-center justify-center animate-pulse">
                                    <MapPin className="w-4 h-4 text-rose" />
                                </div>
                                <span className="text-[11px] font-black text-plum tracking-wider uppercase">
                                    Near:
                                </span>
                            </div>
                            
                            <div className="relative flex-1 flex items-center bg-white border border-blush rounded-2xl shadow-sm px-3 py-1.5 focus-within:ring-2 focus-within:ring-rose/25 transition-all">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    placeholder="Enter address, neighborhood, or city..."
                                    value={addressInput}
                                    onChange={(e) => setAddressInput(e.target.value)}
                                    className="w-full bg-transparent border-none outline-none text-xs font-bold text-plum placeholder-taupe/50 pr-16"
                                />
                                <button
                                    onClick={() => {
                                        localStorage.removeItem('location_permission_choice');
                                        requestBrowserLocation('while_using');
                                    }}
                                    className="absolute right-9 p-1.5 rounded-xl hover:bg-rose/10 text-taupe hover:text-rose transition-all cursor-pointer"
                                    title="Detect my current location"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25s-7.5-4.108-7.5-11.25A7.5 7.5 0 1 1 19.5 10.5z" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => {
                                        setUserCoords(prev => prev ? { ...prev } : null);
                                    }}
                                    className="absolute right-2 p-1.5 bg-rose hover:bg-rose-600 text-white rounded-xl transition-all cursor-pointer flex items-center justify-center shadow-sm"
                                    title="Search spots near this address"
                                >
                                    <Search className="w-3.5 h-3.5 text-white" />
                                </button>
                            </div>
                        </div>

                        {/* City Quick Links */}
                        <div className="flex flex-wrap items-center justify-center gap-2">
                            {CITIES.map((city) => {
                                const isActive = selectedCity === city;
                                return (
                                    <button
                                        key={city}
                                        onClick={() => handleCitySelect(city)}
                                        className={`px-3 py-1 rounded-full text-[10px] font-black transition-all shadow-sm border uppercase tracking-wider cursor-pointer ${
                                            isActive
                                                ? 'bg-rose border-rose text-white shadow-rose/25 scale-[1.03]'
                                                : 'bg-white border-blush hover:bg-rose/5 text-taupe'
                                        }`}
                                    >
                                        <span className="mr-1">{CITY_EMOJIS[city]}</span>
                                        {city}
                                    </button>
                                );
                            })}
                        </div>

                    </div>
                </div>

                {/* Hero section with embedded Sparky AI interface */}
                <Hero />
                
                {/* 2. Features Grid (4 icons) */}
                <Features />
                
                {/* 3. Popular Plans Gallery */}
                <PopularPlans 
                    selectedCity={selectedCity} 
                    setSelectedCity={handleCitySelect} 
                    userCoords={userCoords} 
                    searchRadius={searchRadius} 
                />

                {/* Nearby Events Showcase */}
                <NearbyEvents 
                    selectedCity={selectedCity} 
                    setSelectedCity={handleCitySelect} 
                    userCoords={userCoords} 
                    searchRadius={searchRadius} 
                />

                {/* 4. How It Works Section */}
                <HowItWorks />
                
                {/* 5. Supplementary Social Proof & FAQ */}
                <SocialProof />
                <FAQ />
            </main>
            
            <Footer />

            {/* ── PREMIUM GEOLOCATION PERMISSION DIALOG ── */}
            {showPermissionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-plum/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="w-full max-w-md bg-ivory rounded-[2.5rem] border border-blush/60 p-8 shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden">
                        <div className="absolute -right-12 -top-12 w-32 h-32 bg-rose/10 rounded-full blur-2xl" />
                        <div className="absolute -left-12 -bottom-12 w-32 h-32 bg-champagne/30 rounded-full blur-2xl" />
                        
                        <div className="relative z-10 text-center font-outfit">
                            <div className="w-14 h-14 bg-gradient-to-br from-rose to-pink-400 rounded-2xl mx-auto mb-5 flex items-center justify-center shadow-lg shadow-rose/30">
                                <MapPin className="w-7 h-7 text-white" />
                            </div>
                            
                            <h3 className="text-2xl font-serif font-bold text-plum mb-2">Enable Location Services</h3>
                            <p className="text-xs text-taupe/80 leading-relaxed mb-6">
                                Allow DateSpark to discover local plans, trending hotspots, and live happenings directly in your neighborhood.
                            </p>
                            
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => {
                                        setShowPermissionModal(false);
                                        requestBrowserLocation('always');
                                    }}
                                    className="w-full py-3.5 bg-rose text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-md shadow-rose/25 hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer"
                                >
                                    Always Allow
                                </button>
                                <button
                                    onClick={() => {
                                        setShowPermissionModal(false);
                                        requestBrowserLocation('while_using');
                                    }}
                                    className="w-full py-3.5 bg-plum text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-md hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer"
                                >
                                    Only While Using the Site
                                </button>
                                <button
                                    onClick={() => {
                                        setShowPermissionModal(false);
                                        localStorage.setItem('location_permission_choice', 'declined');
                                        const storedCity = localStorage.getItem('user_city');
                                        if (!storedCity) {
                                            setShowModal(true);
                                        }
                                    }}
                                    className="w-full py-3 bg-white border border-blush hover:bg-rose/5 text-taupe text-xs font-black uppercase tracking-wider rounded-2xl transition-all active:scale-[0.98] cursor-pointer"
                                >
                                    Decline
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── PREMIUM LOCATION SELECTION MODAL ── */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-plum/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="w-full max-w-md bg-ivory rounded-[2.5rem] border border-blush/60 p-8 shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden">
                        <div className="absolute -right-12 -top-12 w-32 h-32 bg-rose/10 rounded-full blur-2xl" />
                        <div className="absolute -left-12 -bottom-12 w-32 h-32 bg-champagne/30 rounded-full blur-2xl" />
                        
                        <div className="relative z-10 text-center font-outfit">
                            <div className="w-14 h-14 bg-gradient-to-br from-rose to-pink-400 rounded-2xl mx-auto mb-5 flex items-center justify-center shadow-lg shadow-rose/30">
                                <MapPin className="w-7 h-7 text-white" />
                            </div>
                            
                            <h3 className="text-2xl font-serif font-bold text-plum mb-2">Select Your Vibe City</h3>
                            <p className="text-xs text-taupe/80 leading-relaxed mb-6">
                                Choose a location to explore custom date plans, hidden gem venues, and live happenings in your city.
                            </p>
                            
                            <div className="space-y-3">
                                {CITIES.map((city) => (
                                    <button
                                        key={city}
                                        onClick={() => handleCitySelect(city)}
                                        className="w-full py-3.5 px-6 bg-white hover:bg-rose/5 border border-blush rounded-2xl text-sm font-bold text-plum transition-all active:scale-[0.98] shadow-sm flex items-center justify-between cursor-pointer"
                                    >
                                        <span className="flex items-center gap-2.5">
                                            <span className="text-lg">{CITY_EMOJIS[city]}</span>
                                            <span>{city}</span>
                                        </span>
                                        <span className="text-[10px] font-black text-rose uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Select</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LandingPage;
