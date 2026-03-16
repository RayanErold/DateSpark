import React from 'react';
import { Search, Map, Send, CheckCircle2 } from 'lucide-react';

const HowItWorks = () => {
    const steps = [
        {
            icon: <Search className="w-8 h-8 text-coral" />,
            title: "Tell us your city & night",
            description: "Choose your city, date window, budget, and the vibe you're looking for (romantic, adventurous, or chill)."
        },
        {
            icon: <Map className="w-8 h-8 text-gold" />,
            title: "We find local spots & events",
            description: "We pull real-time data from Google Maps to find the best secrets in your city."
        },
        {
            icon: <CheckCircle2 className="w-8 h-8 text-navy" />,
            title: "You get a complete itinerary",
            description: "Get a 3-4 step timeline with exact places, booking links, and directions ready to go."
        }
    ];

    return (
        <section id="how-it-works" className="section-padding bg-gray-50/50">
            <div className="container-custom">
                <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
                    <h2 className="text-4xl font-bold text-navy">Planning a night out shouldn't take all night.</h2>
                    <p className="text-gray-600 text-lg">We do the legwork so you can focus on the memories. Here's how it works in 3 simple steps.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 relative">
                    {/* Connector line for desktop */}
                    <div className="hidden md:block absolute top-20 left-[15%] right-[15%] h-0.5 border-t-2 border-dashed border-gray-200 -z-10" />

                    {steps.map((step, index) => (
                        <div key={index} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center space-y-4 hover:shadow-md transition-shadow group">
                            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center group-hover:bg-white group-hover:scale-110 transition-all duration-300">
                                {step.icon}
                            </div>
                            <div className="w-8 h-8 bg-navy text-white rounded-full flex items-center justify-center font-bold text-sm">
                                {index + 1}
                            </div>
                            <h3 className="text-xl font-bold text-navy pt-2">{step.title}</h3>
                            <p className="text-gray-500 leading-relaxed">{step.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;
