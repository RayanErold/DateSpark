import React from 'react';
import Navbar from '../components/common/Navbar';
import Pricing from '../components/features/Pricing';
import Footer from '../components/common/Footer';
import { motion } from 'framer-motion';

const PricingPage = () => {
    return (
        <div className="min-h-screen bg-[#0a0f1c]">
            <Navbar />
            <main className="pt-32 pb-20">
                <div className="container-custom mb-16 text-center">
                    <motion.span 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-coral font-black uppercase tracking-[0.2em] text-xs"
                    >
                        Invest in Connection
                    </motion.span>
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl md:text-7xl font-black text-white mt-4 mb-6 tracking-tight"
                    >
                        Pricing for <span className="text-transparent bg-clip-text bg-gradient-to-r from-coral to-violet-400">every spark.</span>
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-gray-400 text-xl max-w-2xl mx-auto font-medium"
                    >
                        Whether it is your first date or your 500th, we have a plan to make it unforgettable.
                    </motion.p>
                </div>
                <Pricing />
            </main>
            <Footer />
        </div>
    );
};

export default PricingPage;
