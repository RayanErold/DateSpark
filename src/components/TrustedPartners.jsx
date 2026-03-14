import React from 'react';
import { MapPin, Navigation2, Star, Utensils } from 'lucide-react';

const TrustedPartners = () => {
    return (
        <section className="py-12 bg-white border-t border-b border-gray-100 overflow-hidden">
            <div className="container-custom">
                <p className="text-center text-sm font-bold text-gray-400 uppercase tracking-widest mb-8">
                    Powered by real data from trusted partners
                </p>

                {/* Logo Carousel or Grid */}
                <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 hover:opacity-100 transition-opacity duration-500">

                    {/* Partner 1: Yelp/Reviews */}
                    <div className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all duration-300">
                        <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center text-white rotate-3">
                            <Star className="w-5 h-5 fill-current" />
                        </div>
                        <span className="text-xl font-black tracking-tight text-navy">Yelp</span>
                    </div>

                    {/* Partner 2: Google Maps / Navigation */}
                    <div className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all duration-300">
                        <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white -rotate-3">
                            <MapPin className="w-5 h-5 fill-current" />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-navy">Google Maps</span>
                    </div>

                    {/* Partner 3: Uber/Rides */}
                    <div className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all duration-300">
                        <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white rotate-6">
                            <Navigation2 className="w-5 h-5 fill-current" />
                        </div>
                        <span className="text-xl font-light tracking-wide text-navy">Uber</span>
                    </div>

                    {/* Partner 4: OpenTable/Reservations */}
                    <div className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all duration-300">
                        <div className="w-10 h-10 bg-rose-600 rounded-xl flex items-center justify-center text-white -rotate-6">
                            <Utensils className="w-5 h-5" />
                        </div>
                        <span className="text-xl font-serif font-black tracking-tight text-navy">OpenTable</span>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default TrustedPartners;
