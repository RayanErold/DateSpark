import React from 'react';
import { MapPin, Navigation2, Star, Utensils, Ticket } from 'lucide-react';

const TrustedPartners = () => {
    const partnerNodes = [
        (
            <div key="yelp" className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all duration-300 flex-shrink-0">
                <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center text-white rotate-3">
                    <Star className="w-5 h-5 fill-current" />
                </div>
                <span className="text-xl font-black tracking-tight text-navy">Yelp</span>
            </div>
        ),
        (
            <div key="gmaps" className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all duration-300 flex-shrink-0">
                <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white -rotate-3">
                    <MapPin className="w-5 h-5 fill-current" />
                </div>
                <span className="text-xl font-bold tracking-tight text-navy">Google Maps</span>
            </div>
        ),
        (
            <div key="uber" className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all duration-300 flex-shrink-0">
                <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white rotate-6">
                    <Navigation2 className="w-5 h-5 fill-current" />
                </div>
                <span className="text-xl font-light tracking-wide text-navy">Uber</span>
            </div>
        ),
        (
            <div key="opentable" className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all duration-300 flex-shrink-0">
                <div className="w-10 h-10 bg-rose-600 rounded-xl flex items-center justify-center text-white -rotate-6">
                    <Utensils className="w-5 h-5" />
                </div>
                <span className="text-xl font-serif font-black tracking-tight text-navy">OpenTable</span>
            </div>
        ),
        (
            <div key="eventbrite" className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all duration-300 flex-shrink-0">
                <div className="w-10 h-10 bg-[#f05537] rounded-xl flex items-center justify-center text-white rotate-3">
                    <Ticket className="w-5 h-5" />
                </div>
                <span className="text-xl font-black tracking-tight text-navy">EventBrite</span>
            </div>
        )
    ];

    return (
        <section className="py-12 bg-white border-t border-b border-gray-100 overflow-hidden relative">
            <style>{`
                @keyframes scroll {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-scroll {
                    animation: scroll 20s linear infinite;
                }
            `}</style>
            
            <div className="container-custom">
                <p className="text-center text-sm font-bold text-gray-400 uppercase tracking-widest mb-8">
                    Powered by real data from trusted partners
                </p>

                {/* Logo Carousel sliding marquee */}
                <div className="flex overflow-hidden relative w-full">
                    <div className="flex animate-scroll items-center opacity-60 hover:opacity-100 transition-opacity duration-500 w-max">
                        
                        {/* Track 1 */}
                        <div className="flex items-center space-x-12 md:space-x-24 pr-12 md:pr-24">
                            {partnerNodes}
                        </div>
                        
                        {/* Track 2 for seamless loop layout fits */}
                        <div className="flex items-center space-x-12 md:space-x-24 pr-12 md:pr-24">
                            {partnerNodes}
                        </div>

                    </div>
                </div>
            </div>
        </section>
    );
};

export default TrustedPartners;
