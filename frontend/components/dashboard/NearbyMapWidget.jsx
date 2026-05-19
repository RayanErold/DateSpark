import React, { useState, useEffect } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { MapPin, ExternalLink, ChevronRight, Loader2 } from 'lucide-react';

const NearbyMapWidget = ({ globalTrendingPlans, isLoaded, onFindEvents }) => {

    const [userPos, setUserPos] = useState(null);
    const [geoError, setGeoError] = useState(false);
    const [geoLoading, setGeoLoading] = useState(true);
    const [neighborhood, setNeighborhood] = useState(null);
    const [mapRef, setMapRef] = useState(null);
    const [zoom, setZoom] = useState(15);

    const requestLocation = () => {
        setGeoError(false);
        setGeoLoading(true);
        if (!navigator.geolocation) { setGeoError(true); setGeoLoading(false); return; }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const latlng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setUserPos(latlng);
                setGeoLoading(false);
                if (window.google?.maps?.Geocoder) {
                    new window.google.maps.Geocoder().geocode({ location: latlng }, (results, status) => {
                        if (status === 'OK' && results[0]) {
                            const hood = results[0].address_components.find(c =>
                                c.types.includes('neighborhood') || c.types.includes('sublocality')
                            );
                            const city = results[0].address_components.find(c => c.types.includes('locality'));
                            setNeighborhood(hood?.short_name || city?.short_name || null);
                        }
                    });
                }
            },
            () => { setGeoError(true); setGeoLoading(false); }
        );
    };

    useEffect(() => { requestLocation(); }, []);

    useEffect(() => {
        if (!mapRef || !userPos || !window.google?.maps?.OverlayView) return;

        // Clean up previous overlay if it exists
        if (mapRef._pulseDot) {
            mapRef._pulseDot.setMap(null);
            mapRef._pulseDot = null;
        }

        class PulseDot extends window.google.maps.OverlayView {
            constructor(pos, name) {
                super();
                this._pos = pos;
                this._name = name || 'Your Location';
                this._el = null;
            }
            onAdd() {
                this._el = document.createElement('div');
                this._el.style.cssText = 'position:absolute;transform:translate(-50%,-50%);pointer-events:none;z-index:999;';
                this._el.innerHTML = `
                    <div style="position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;">
                        <div style="background:#0a192f;color:#ffffff;font-size:9px;font-family:'Outfit',sans-serif;font-weight:900;text-transform:uppercase;letter-spacing:1.2px;padding:5px 10px;border-radius:12px;box-shadow:0 4px 15px rgba(0,0,0,0.25);margin-bottom:8px;white-space:nowrap;border:1.5px solid rgba(255,255,255,0.15);display:flex;align-items:center;gap:5px;transform:translateY(-4px);">
                            <span style="width:5px;height:5px;border-radius:50%;background:#10b981;display:inline-block;box-shadow:0 0 8px #10b981;"></span>
                            \${this._name}
                        </div>
                        <div style="position:relative;width:20px;height:20px;display:flex;align-items:center;justify-content:center;">
                            <div style="position:absolute;width:40px;height:40px;border-radius:50%;background:rgba(255,107,71,0.3);animation:ds-pulse 2s ease-out infinite;"></div>
                            <div style="position:absolute;width:28px;height:28px;border-radius:50%;background:rgba(255,107,71,0.2);animation:ds-pulse 2s ease-out 0.5s infinite;"></div>
                            <div style="width:16px;height:16px;border-radius:50%;background:#FF6B47;border:2.5px solid #fff;box-shadow:0 2px 10px rgba(255,107,71,0.6),0 0 0 1px rgba(255,107,71,0.3);"></div>
                        </div>
                    </div>`;
                this.getPanes().overlayMouseTarget.appendChild(this._el);
            }
            draw() {
                const proj = this.getProjection();
                if (!proj) return;
                const pt = proj.fromLatLngToDivPixel(new window.google.maps.LatLng(this._pos.lat, this._pos.lng));
                if (pt && this._el) {
                    this._el.style.left = pt.x + 'px';
                    this._el.style.top = pt.y + 'px';
                }
            }
            onRemove() {
                this._el?.parentNode?.removeChild(this._el);
                this._el = null;
            }
        }

        const pulseDot = new PulseDot(userPos, neighborhood);
        pulseDot.setMap(mapRef);
        mapRef._pulseDot = pulseDot;

        // Pan to user position
        mapRef.panTo(userPos);

        return () => {
            pulseDot.setMap(null);
            if (mapRef) mapRef._pulseDot = null;
        };
    }, [mapRef, userPos, neighborhood]);

    const nearbyMarkers = (globalTrendingPlans || []).slice(0, 8).map((p) => {
        const itinerary = p.itinerary || {};
        const steps = Array.isArray(itinerary) ? itinerary : (itinerary.steps || []);
        const step = steps[0];
        return (step?.lat && step?.lng) ? { lat: step.lat, lng: step.lng, vibe: p.vibe } : null;
    }).filter(Boolean);

    const mapCenter = userPos || { lat: 40.7128, lng: -74.0060 };

    const openInMaps = () => {
        if (!userPos) return;
        window.open(`https://www.google.com/maps/search/?api=1&query=${userPos.lat},${userPos.lng}`, '_blank');
    };

    const handleZoomIn = () => { const z = Math.min(zoom + 1, 20); setZoom(z); mapRef?.setZoom(z); };
    const handleZoomOut = () => { const z = Math.max(zoom - 1, 10); setZoom(z); mapRef?.setZoom(z); };

    const miniMapStyle = [
        { elementType: 'geometry', stylers: [{ color: '#f0f4ff' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#6b7280' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
        { featureType: 'poi', stylers: [{ visibility: 'off' }] },
        { featureType: 'transit', stylers: [{ visibility: 'off' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
        { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#e2e8f0' }] },
        { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#cbd5e1' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#93c5fd' }] },
        { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#f0f4ff' }] },
        { featureType: 'landscape.man_made', elementType: 'geometry', stylers: [{ color: '#e8eeff' }] },
    ];

    if (typeof document !== 'undefined' && !document.getElementById('ds-pulse-ring')) {
        const s = document.createElement('style');
        s.id = 'ds-pulse-ring';
        s.textContent = '@keyframes ds-pulse{0%{transform:scale(0.6);opacity:0.9}100%{transform:scale(2.2);opacity:0}}';
        document.head.appendChild(s);
    }

    return (
        <div className="rounded-[2rem] overflow-hidden shadow-xl border border-white/20 relative" style={{ height: '260px' }}>

            <div className="absolute top-0 inset-x-0 z-20 px-3 pt-3 flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-md border border-white/60 shadow-sm px-3 py-1.5 rounded-full pointer-events-none">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        userPos ? 'bg-green-500' : geoError ? 'bg-red-400' : 'bg-amber-400 animate-pulse'
                    }`} />
                    <span className="text-[10px] font-black text-navy uppercase tracking-wider truncate max-w-[140px]">
                        {geoLoading ? 'Locating...' : geoError ? 'Location off' : neighborhood || 'You Are Here'}
                    </span>
                </div>
                {userPos && (
                    <button
                        onClick={openInMaps}
                        className="ml-auto flex items-center gap-1 bg-white/90 backdrop-blur-md border border-white/60 shadow-sm px-2.5 py-1.5 rounded-full active:scale-95 transition-all hover:bg-white"
                    >
                        <ExternalLink className="w-3 h-3 text-navy" />
                        <span className="text-[10px] font-black text-navy">Maps</span>
                    </button>
                )}
            </div>

            {!geoError && isLoaded && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-1.5">
                    <button onClick={handleZoomIn} className="w-8 h-8 bg-white/90 backdrop-blur-md border border-white/60 shadow-sm rounded-xl flex items-center justify-center text-navy font-black text-base leading-none active:scale-95 transition-all hover:bg-white select-none">+</button>
                    <button onClick={handleZoomOut} className="w-8 h-8 bg-white/90 backdrop-blur-md border border-white/60 shadow-sm rounded-xl flex items-center justify-center text-navy font-black text-base leading-none active:scale-95 transition-all hover:bg-white select-none">−</button>
                </div>
            )}

            {geoError ? (
                <div className="h-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col items-center justify-center gap-3 p-6 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-navy/5 border border-navy/10 flex items-center justify-center">
                        <MapPin className="w-7 h-7 text-navy/25" />
                    </div>
                    <div>
                        <p className="text-sm font-black text-navy">Enable Location</p>
                        <p className="text-[10px] text-slate-400 font-medium mt-1 max-w-[180px] mx-auto leading-relaxed">
                            Allow location to see yourself on the map and find nearby date spots.
                        </p>
                    </div>
                    <button onClick={requestLocation} className="px-5 py-2.5 bg-navy text-white text-[11px] font-black rounded-xl active:scale-95 transition-all shadow-md">
                        Enable &amp; Retry
                    </button>
                </div>
            ) : isLoaded ? (
                <GoogleMap
                    mapContainerStyle={{ width: '100%', height: '100%' }}
                    center={mapCenter}
                    zoom={zoom}
                    onLoad={(map) => setMapRef(map)}
                    options={{
                        disableDefaultUI: true,
                        zoomControl: false,
                        gestureHandling: 'greedy',
                        styles: miniMapStyle,
                        clickableIcons: false,
                    }}
                />
            ) : (
                <div className="h-full bg-gradient-to-br from-slate-100 to-blue-50 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-6 h-6 text-navy/20 animate-spin" />
                    <span className="text-[9px] text-slate-300 font-black uppercase tracking-widest">Loading Map...</span>
                </div>
            )}

            <div className="absolute bottom-0 inset-x-0 z-20 p-3">
                <button
                    onClick={onFindEvents}
                    className="w-full py-2.5 bg-navy/85 backdrop-blur-md text-white text-[11px] font-black rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all hover:bg-navy border border-white/10"
                >
                    {nearbyMarkers.length > 0 && (
                        <span className="bg-coral text-white text-[8px] font-black px-1.5 py-0.5 rounded-full leading-none">
                            {nearbyMarkers.length}
                        </span>
                    )}
                    Find Events Near Me
                    <ChevronRight className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
};

export default NearbyMapWidget;
