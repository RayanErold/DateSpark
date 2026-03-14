import React from 'react';
import { Sparkles, Zap, MapPin, Rocket } from 'lucide-react';

const Benefits = () => {
    const benefits = [
        {
            icon: <Sparkles className="w-6 h-6 text-coral" />,
            title: "Real spots, not generic ideas",
            description: "Plans come from actual trending restaurants, bars, and events in your city, not outdated lists."
        },
        {
            icon: <Zap className="w-6 h-6 text-gold" />,
            title: "Perfect for last-minute plans",
            description: "Generate a curated date night in under 60 seconds. Ideal for those 'what's the plan?' moments."
        },
        {
            icon: <MapPin className="w-6 h-6 text-navy" />,
            title: "Navigation & tickets included",
            description: "Every plan comes with direct links to Google Maps and ticket windows for events."
        },
        {
            icon: <Rocket className="w-6 h-6 text-coral" />,
            title: "One button, a full night out",
            description: "No complex filters or endless scrolling. Tell us your vibe and we handle the rest."
        }
    ];

    return (
        <section id="benefits" className="section-padding">
            <div className="container-custom">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div className="space-y-6">
                        <h2 className="text-4xl font-bold text-navy leading-tight">
                            Why settle for another movie night?
                        </h2>
                        <p className="text-lg text-gray-600 leading-relaxed">
                            We've helped thousands of couples rediscover their city without the planning fatigue. Every plan is unique, curated, and ready to go.
                        </p>
                        <div className="pt-4">
                            <button className="btn-secondary">Explore example plans</button>
                        </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6">
                        {benefits.map((benefit, index) => (
                            <div key={index} className="p-6 rounded-2xl border border-gray-100 bg-white hover:border-coral/20 hover:shadow-lg transition-all space-y-3">
                                <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center">
                                    {benefit.icon}
                                </div>
                                <h3 className="font-bold text-navy text-lg">{benefit.title}</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">{benefit.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Benefits;
