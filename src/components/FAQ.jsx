import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

const FAQ = () => {
    const faqs = [
        {
            question: "What exactly do I get when I pay?",
            answer: "You get the full, unlocked itinerary for your night. This include exact addresses of all 3-4 spots, reservation links, real-time ticket availability for events, and a custom Google Maps route to navigate between them."
        },
        {
            question: "How do you ensure my safety during dates?",
            answer: "Safety is our priority. We only recommend highly-rated, vetted venues in well-lit, populated areas in New York and Jersey. We also include 'Safety Check' tips in every premium itinerary."
        },
        {
            question: "Who can I contact if I have an issue with a booking?",
            answer: "While we don't handle the bookings directly, our support team at support@datespark.live is available to help you navigate any issues with partner venues or generated plans."
        },
        {
            question: "Can I use DateSpark outside of NYC and NJ?",
            answer: "We are currently hyper-focused on providing the best experience in New York City and Northern New Jersey. We are expanding soon—join our waitlist to be notified when we launch in your city!"
        },
        {
            question: "Do I need to download an app?",
            answer: "Nope. We're a simple, powerful web app. You can plan, pay, and follow your itinerary right from your mobile or desktop browser."
        }
    ];

    const [openIndex, setOpenIndex] = useState(0);

    return (
        <section id="faq" className="section-padding">
            <div className="container-custom">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-3xl font-bold text-navy mb-12 text-center">Frequently Asked Questions</h2>
                    <div className="space-y-4">
                        {faqs.map((faq, index) => (
                            <div key={index} className="border-b border-gray-100 last:border-0 pb-4">
                                <button
                                    className="w-full flex items-center justify-between text-left py-4 hover:text-coral transition-colors"
                                    onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
                                >
                                    <span className="text-lg font-bold text-navy">{faq.question}</span>
                                    {openIndex === index ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                                </button>
                                {openIndex === index && (
                                    <div className="text-gray-600 pb-4 animate-in fade-in slide-in-from-top-2 duration-300">
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
