import React from 'react';
import { Quote } from 'lucide-react';

const SocialProof = () => {
    const testimonials = [
        {
            text: "Best $5 I ever spent. No more 40-minute 'I don't know, what do you want to do?' conversations.",
            author: "Alex & Sam",
            role: "Busy Professionals"
        },
        {
            text: "We found a secret jazz bar we never would've found otherwise. The itinerary was perfectly timed.",
            author: "Jordan P.",
            role: "College Student"
        },
        {
            text: "The event selection is spot on. It's like having a local friend plan your city trip.",
            author: "Mia W.",
            role: "Urban Explorer"
        }
    ];

    return (
        <section className="section-padding overflow-hidden">
            <div className="container-custom">
                <div className="text-center mb-12">
                    <h3 className="text-navy font-bold text-xl uppercase tracking-widest bg-coral/5 inline-block px-6 py-2 rounded-full">Loved by couples in the city</h3>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {testimonials.map((t, i) => (
                        <div key={i} className="relative p-8 bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                            <Quote className="absolute top-4 right-8 w-12 h-12 text-gray-50 -z-10" />
                            <p className="text-gray-600 italic mb-6 leading-relaxed">"{t.text}"</p>
                            <div>
                                <div className="font-bold text-navy">{t.author}</div>
                                <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">{t.role}</div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-16 text-center text-gray-400 font-medium flex flex-wrap items-center justify-center gap-8 opacity-60 grayscale">
                    <span className="text-2xl font-black italic">Google Maps</span>
                    <span className="text-2xl font-black italic">Yelp</span>
                    <span className="text-2xl font-black italic">Eventbrite</span>
                </div>
            </div>
        </section>
    );
};

export default SocialProof;
