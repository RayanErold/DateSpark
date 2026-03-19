import React from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import ProductDemo from '../components/ProductDemo';
import TrustedPartners from '../components/TrustedPartners';
import HowItWorks from '../components/HowItWorks';
import Benefits from '../components/Benefits';
import Pricing from '../components/Pricing';
import Waitlist from '../components/Waitlist';
import FeatureFeedback from '../components/FeatureFeedback';
import SocialProof from '../components/SocialProof';
import FAQ from '../components/FAQ';
import Footer from '../components/Footer';

const LandingPage = () => {
    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <main>
                <Hero />
                <TrustedPartners />
                <ProductDemo />
                <HowItWorks />
                <Benefits />
                <Pricing />
                <Waitlist />
                <FeatureFeedback />
                <SocialProof />
                <FAQ />
            </main>
            <Footer />
        </div>
    );
};

export default LandingPage;
