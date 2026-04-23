import React, { useState } from 'react';
import { Lightbulb, Send, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import axios from 'axios';

const FeatureFeedback = () => {
    const [feedback, setFeedback] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [selectedOption, setSelectedOption] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const options = [
        "Better restaurant picks",
        "More ideas for small budgets",
        "Ways to invite my partner",
        "Secret spots in my city",
        "Something else..."
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!feedback.trim() && !selectedOption) return;

        setIsSubmitting(true);
        try {
            const combinedText = selectedOption 
                ? `[${selectedOption}] ${feedback.trim()}`.trim()
                : feedback.trim();

            await axios.post('/api/feedback', {
                text: combinedText,
                userId: null, // Anonymous from landing
                email: null   // Anonymous from landing
            });

            setSubmitted(true);
            setFeedback('');
            setSelectedOption('');
        } catch (err) {
            console.error("Feedback error:", err);
            alert("Failed to send feedback. Please try again later.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section id="feedback" className="section-padding bg-soft-pink/20">
            <div className="container-custom">
                <div className="max-w-4xl mx-auto bg-white rounded-[40px] p-8 md:p-12 shadow-xl border border-coral/10">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6 text-center md:text-left">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-coral/10 text-coral rounded-full text-sm font-bold uppercase tracking-wider">
                                <Lightbulb className="w-4 h-4" /> We're listening!
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold text-navy leading-tight">
                                What are you looking forward to seeing?
                            </h2>
                            <p className="text-gray-600">
                                We want to build the best app for you. Tell us what would make your date nights even better!
                            </p>
                            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                                {options.map((option, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedOption(option)}
                                        className={`px-4 py-2 rounded-full border text-sm transition-all ${selectedOption === option
                                                ? 'bg-coral text-white border-coral shadow-lg scale-105'
                                                : 'bg-white text-gray-500 border-gray-200 hover:border-coral hover:text-coral'
                                            }`}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="relative">
                            {!submitted ? (
                                <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in duration-500">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-navy ml-2">Your idea or feedback:</label>
                                        <textarea
                                            value={feedback}
                                            onChange={(e) => setFeedback(e.target.value)}
                                            placeholder="Example: I'd love to see indoor dates for rainy days!"
                                            className="w-full bg-gray-50 border border-gray-100 rounded-3xl p-6 h-40 focus:outline-none focus:ring-4 focus:ring-coral/10 focus:border-coral transition-all resize-none text-gray-700"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || (!feedback.trim() && !selectedOption)}
                                        className="w-full btn-primary py-4 rounded-2xl flex items-center justify-center gap-2 group disabled:opacity-50"
                                    >
                                        {isSubmitting ? (
                                            <><Loader2 className="w-5 h-5 animate-spin" /> Sending...</>
                                        ) : (
                                            <>Send Feedback <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /></>
                                        )}
                                    </button>
                                </form>
                            ) : (
                                <div className="text-center py-12 space-y-4 animate-in zoom-in duration-500">
                                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <CheckCircle2 className="w-10 h-10" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-navy">Thanks for the idea!</h3>
                                    <p className="text-gray-500 max-w-[280px] mx-auto">
                                        We're small but fast. Your feedback helps us pick what to build next! 🚀
                                    </p>
                                    <button
                                        onClick={() => setSubmitted(false)}
                                        className="text-coral font-bold hover:underline pt-4"
                                    >
                                        Share another idea
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default FeatureFeedback;
