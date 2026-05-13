import React from 'react';
import Navbar from '../components/common/Navbar';
import Hero from '../components/landing/Hero';
import HeroVariationB from '../components/landing/HeroVariationB';
import Features from '../components/landing/Features';
import PopularPlans from '../components/landing/PopularPlans';
import HowItWorks from '../components/landing/HowItWorks';
import SocialProof from '../components/landing/SocialProof';
import FAQ from '../components/landing/FAQ';
import Footer from '../components/common/Footer';
import { useABTest } from '../lib/hooks/useABTest';

const LandingPage = () => {
    const variant = useABTest('landing-hero-v1');

    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <main>
                {/* A/B Test: Hero Section */}
                {variant === 'B' ? <HeroVariationB /> : <Hero />}
                
                {/* 2. Features Grid (4 icons) */}
                <Features />
                
                {/* 3. Popular Plans Gallery */}
                <PopularPlans />

                {/* 4. How It Works Section */}
                <HowItWorks />
                
                {/* 5. Supplementary Social Proof & FAQ */}
                <SocialProof />
                <FAQ />
            </main>
            <Footer />
        </div>
    );
};

export default LandingPage;

