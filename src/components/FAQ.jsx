import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

const FAQ = () => {
    const faqs = [
        {
            question: "What exactly do I get when I pay?",
            answer: "You get the full, unlocked itinerary for your night. This include exact addresses of all 3-4 spots, reservation links, real-time ticket availability for events, and a custom Google Maps route to navigate between them."
        },
        {
            question: "Which cities are supported right now?",
            answer: "We currently support New York, Los Angeles, Chicago, London, and Tokyo. We're adding new cities every week!"
        },
        {
            question: "Can I regenerate a plan if I don't like it?",
            answer: "Yes! Your One-time Pass allows you to regenerate up to 3 alternative plans for that same night if the first one doesn't quite fit your vibe."
        },
        {
            question: "Do I need to download an app?",
            answer: "Nope. We're a simple, powerful web app. You can plan, pay, and follow your itinerary right from your mobile or desktop browser."
        }
    ];

    const [openIndex, setOpenIndex] = useState(0);

    return (
        <section className="section-padding">
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
