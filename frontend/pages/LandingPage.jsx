import React from 'react';
import Navbar from '../components/common/Navbar';
import Hero from '../components/landing/Hero';
import HeroVariationB from '../components/landing/HeroVariationB';
import Features from '../components/landing/Features';
import PopularPlans from '../components/landing/PopularPlans';
import HowItWorks from '../components/landing/HowItWorks';
import SocialProof from '../components/landing/SocialProof';
import FAQ from '../components/landing/FAQ';
import BlogSection from '../components/landing/BlogSection';
import Footer from '../components/common/Footer';
import InteractiveDemo from '../components/landing/InteractiveDemo';
import DateArchitectChat from '../components/dashboard/DateArchitectChat';
import { Sparkles } from 'lucide-react';
import { useABTest } from '../lib/hooks/useABTest';

const LandingPage = () => {
    const variant = useABTest('landing-hero-v1');

    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <main>
                {/* A/B Test: Hero Section */}
                {variant === 'B' ? <HeroVariationB /> : <Hero />}
                
                {/* Demo Video Simulation */}
                <InteractiveDemo />

                {/* Try Sparky Live Section */}
                <section className="py-20 bg-slate-50/50 border-y border-slate-100/80 relative">
                    <div className="max-w-4xl mx-auto px-4 text-center">
                        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-orange-50 text-orange-600 rounded-lg text-[10px] font-black uppercase tracking-widest mb-4 border border-orange-100 shadow-sm">
                            <Sparkles className="w-3.5 h-3.5 text-orange-500 fill-orange-500 animate-pulse" /> Try Sparky Live
                        </div>
                        <h2 className="text-3xl md:text-4xl lg:text-[42px] font-black text-navy mb-4 tracking-tight leading-tight">
                            Co-Create Your Perfect Plan
                        </h2>
                        <p className="text-slate-500 font-medium text-sm md:text-base max-w-xl mx-auto mb-12 leading-relaxed">
                            Describe your dream night out or click one of the quick sparks. Sparky will instantly guide you to a personalized itinerary.
                        </p>
                        <div className="max-w-2xl mx-auto text-left bg-white p-3 rounded-2xl border border-slate-100 shadow-md">
                            <DateArchitectChat />
                        </div>
                    </div>
                </section>

                {/* 2. Features Grid (4 icons) */}
                <Features />
                
                {/* 3. Popular Plans Gallery */}
                <PopularPlans />

                {/* 4. How It Works Section */}
                <HowItWorks />
                
                {/* 5. Supplementary Social Proof & FAQ */}
                <SocialProof />
                <FAQ />

                {/* 6. The Journal (Blog posts) */}
                <BlogSection />
            </main>
            <Footer />
        </div>
    );
};

export default LandingPage;

