import React from 'react';
import Navbar from '../components/common/Navbar';
import Hero from '../components/landing/Hero';
import Features from '../components/landing/Features';
import PopularPlans from '../components/landing/PopularPlans';
import HowItWorks from '../components/landing/HowItWorks';
import SocialProof from '../components/landing/SocialProof';
import FAQ from '../components/landing/FAQ';
import BlogSection from '../components/landing/BlogSection';
import Footer from '../components/common/Footer';
import InteractiveDemo from '../components/landing/InteractiveDemo';

const LandingPage = () => {
    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <main>
                {/* Hero section with embedded Sparky AI interface */}
                <Hero />
                
                {/* Demo Video Simulation */}
                <InteractiveDemo />

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


