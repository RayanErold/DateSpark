import React from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import TrustedPartners from '../components/TrustedPartners';
import HowItWorks from '../components/HowItWorks';
import ProductDemo from '../components/ProductDemo';
import Benefits from '../components/Benefits';
import SocialProof from '../components/SocialProof';
import Pricing from '../components/Pricing';
import FAQ from '../components/FAQ';
import FeatureFeedback from '../components/FeatureFeedback';
import Waitlist from '../components/Waitlist';
import Footer from '../components/Footer';

/**
 * LandingPage — conversion-optimized section order:
 * 1. Hero          — Hook & primary CTA
 * 2. TrustedPartners — Social proof / credibility (beneath the fold)
 * 3. HowItWorks    — Explain the product simply
 * 4. ProductDemo   — Show, don't just tell (interactive CTA)
 * 5. Benefits      — Why us over alternatives
 * 6. SocialProof   — Testimonials / quotes
 * 7. Pricing       — Commit / convert
 * 8. FAQ           — Handle objections before Waitlist
 * 9. FeatureFeedback — Community engagement
 * 10. Waitlist     — Capture leads who aren't ready to pay yet
 * 11. Footer
 */
const LandingPage = () => {
    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <main>
                <Hero />
                <TrustedPartners />
                <HowItWorks />
                <ProductDemo />
                <Benefits />
                <SocialProof />
                <Pricing />
                <FAQ />
                <FeatureFeedback />
                <Waitlist />
            </main>
            <Footer />
        </div>
    );
};

export default LandingPage;
