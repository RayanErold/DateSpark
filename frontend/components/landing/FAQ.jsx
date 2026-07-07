import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

const FAQ = () => {
    const faqs = [
        {
            question: "What exactly do I get when I pay?",
            answer: "You get the full, unlocked itinerary for your night: addresses and details for each stop, links to directions and official sites or booking pages where available, and an interactive map. We surface real venue data when we can, but third-party availability and reservations are always subject to the venue or ticketing site."
        },
        {
            question: "How do you approach safety?",
            answer: "We focus on well-reviewed, established venues in busy areas of New York and New Jersey. You should always use your own judgment, share your plans with someone you trust, and follow venue and local guidance. Tips in itineraries are suggestions, not professional safety advice."
        },
        {
            question: "Who can I contact if I have an issue with a booking?",
            answer: "While we don't handle the bookings directly, our support team at support@datespark.live is available to help you navigate any issues with partner venues or generated plans."
        },
        {
            question: "Can I use DateSpark outside of NYC and NJ?",
            answer: "We are currently hyper-focused on providing the best experience in New York City and New Jersey. We are expanding soon—join our waitlist to be notified when we launch in your city!"
        },
        {
            question: "Do I need to download an app?",
            answer: "Nope. We're a simple, powerful web app. You can plan, pay, and follow your itinerary right from your mobile or desktop browser."
        }
    ];

    const [openIndex, setOpenIndex] = useState(0);

    return (
        <section id="faq" className="section-padding bg-mist">
            <div className="container-custom">
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-12">
                        <span className="editorial-label mb-3 block">Got Questions?</span>
                        <h2 className="text-3xl font-serif font-bold text-plum">Frequently Asked Questions</h2>
                    </div>
                    <div className="space-y-2">
                        {faqs.map((faq, index) => (
                            <div key={index} className={`editorial-card overflow-hidden transition-all duration-300 ${openIndex === index ? 'shadow-md' : ''}`}>
                                <button
                                    className="w-full flex items-center justify-between text-left px-6 py-5 hover:text-rose transition-colors"
                                    onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
                                >
                                    <span className="text-base font-semibold text-plum pr-4 font-outfit">{faq.question}</span>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${openIndex === index ? 'bg-rose/15 text-rose' : 'bg-blush/50 text-taupe'}`}>
                                        {openIndex === index ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                    </div>
                                </button>
                                {openIndex === index && (
                                    <div className="px-6 pb-5 text-taupe text-sm leading-relaxed animate-in fade-in slide-in-from-top-2 duration-300 border-t border-blush/30 pt-4">
                                        {faq.answer}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default FAQ;
