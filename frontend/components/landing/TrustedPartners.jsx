import React from 'react';
import { MapPin, Navigation2, Star, Utensils, Ticket } from 'lucide-react';
import { motion } from 'framer-motion';

const TrustedPartners = () => {
    const partnerNodes = [
        (
            <div key="yelp" className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all duration-300 flex-shrink-0">
                <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center text-white rotate-3">
                    <Star className="w-5 h-5 fill-current" />
                </div>
                <span className="text-xl font-black tracking-tighter text-navy uppercase">YELP</span>
            </div>
        ),
        (
            <div key="gmaps" className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all duration-300 flex-shrink-0">
                <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white -rotate-3">
                    <MapPin className="w-5 h-5 fill-current" />
                </div>
                <span className="text-xl font-black tracking-tighter text-navy uppercase">GOOGLE MAPS</span>
            </div>
        ),
        (
            <div key="uber" className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all duration-300 flex-shrink-0">
                <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white rotate-6">
                    <Navigation2 className="w-5 h-5 fill-current" />
                </div>
                <span className="text-xl font-black tracking-tighter text-navy uppercase">UBER</span>
            </div>
        ),
        (
            <div key="opentable" className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all duration-300 flex-shrink-0">
                <div className="w-10 h-10 bg-rose-600 rounded-xl flex items-center justify-center text-white -rotate-6">
                    <Utensils className="w-5 h-5" />
                </div>
                <span className="text-xl font-black tracking-tighter text-navy uppercase">OPENTABLE</span>
            </div>
        ),
        (
            <div key="eventbrite" className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all duration-300 flex-shrink-0">
                <div className="w-10 h-10 bg-[#f05537] rounded-xl flex items-center justify-center text-white rotate-3">
                    <Ticket className="w-5 h-5" />
                </div>
                <span className="text-xl font-black tracking-tighter text-navy uppercase">EVENTBRITE</span>
            </div>
        ),
        (
            <div key="seatgeek" className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all duration-300 flex-shrink-0">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white -rotate-6">
                    <Ticket className="w-5 h-5" />
                </div>
                <span className="text-xl font-black tracking-tighter text-navy uppercase">SEATGEEK</span>
            </div>
        ),
        (
            <div key="ticketmaster" className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all duration-300 flex-shrink-0">
                <div className="w-10 h-10 bg-blue-800 rounded-xl flex items-center justify-center text-white rotate-6">
                    <Star className="w-5 h-5" />
                </div>
                <span className="text-xl font-black tracking-tighter text-navy uppercase">TICKETMASTER</span>
            </div>
        )
    ];

    return (
        <motion.section
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="py-16 bg-white border-t border-b border-gray-50 overflow-hidden relative"
        >
            <style>{`
                @keyframes scroll {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-scroll {
                    animation: scroll 30s linear infinite;
                }
            `}</style>

            <div className="container-custom relative">
                <p className="text-center text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] mb-12">
                    OFFICIALLY INTEGRATED WITH WORLD-CLASS PARTNERS
                </p>

                {/* Logo Carousel sliding marquee */}
                <div className="flex overflow-hidden relative w-full [mask-image:linear-gradient(to_right,transparent,white_15%,white_85%,transparent)]">
                    <div className="flex animate-scroll items-center opacity-40 hover:opacity-100 transition-opacity duration-700 w-max">
                        {/* Track 1 */}
                        <div className="flex items-center space-x-16 md:space-x-32 pr-16 md:pr-32">
                            {partnerNodes}
                        </div>
                        {/* Track 2 for seamless loop */}
                        <div className="flex items-center space-x-16 md:space-x-32 pr-16 md:pr-32">
                            {partnerNodes}
                        </div>
                    </div>
                </div>
            </div>
        </motion.section>
    );
};

export default TrustedPartners;
