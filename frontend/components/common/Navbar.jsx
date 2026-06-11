import React, { useState } from 'react';
import { Menu, X, ArrowRight } from 'lucide-react';

const Navbar = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
            <div className="container-custom flex items-center justify-between h-20">
                <a href="/" className="flex items-center gap-2">
                    <img src="/datespark-logo.png" alt="DateSpark Logo" className="w-10 h-10 rounded-xl shadow-lg shadow-coral/20 object-cover bg-white" />
                    <span className="text-xl font-bold tracking-tight text-navy">DateSpark</span>
                </a>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-8">
                    <a href="/#how-it-works" className="text-gray-600 hover:text-coral font-medium transition-colors">How it works</a>
                    <a href="/#benefits" className="text-gray-600 hover:text-coral font-medium transition-colors">Why us</a>
                    <a href="/pricing" className="text-gray-600 hover:text-coral font-medium transition-colors font-bold text-coral">Pricing</a>
                    <a href="/login" className="bg-gradient-to-r from-coral to-pink-500 text-white font-bold text-[12px] uppercase tracking-wider py-2 px-5.5 rounded-full shadow-[0_6px_12px_-4px_rgba(255,95,86,0.35)] hover:shadow-[0_10px_20px_-6px_rgba(255,95,86,0.5)] hover:scale-105 hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-1.5">
                        Sign In <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                </div>

                {/* Mobile Menu Toggle & CTA */}
                <div className="md:hidden flex items-center gap-2">
                    <a href="/login" className="bg-gradient-to-r from-coral to-pink-500 text-white font-bold text-[11px] uppercase tracking-wider py-1.5 px-3.5 rounded-full shadow-[0_4px_10px_-3px_rgba(255,95,86,0.3)] active:scale-95 transition-all duration-300 flex items-center gap-1 focus:outline-none">
                        Sign In <ArrowRight className="w-3 h-3" />
                    </a>
                    <button 
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="p-2 -mr-1 text-gray-600 hover:text-coral transition-colors"
                        aria-label="Toggle menu"
                    >
                        {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile Dropdown Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden flex flex-col absolute top-20 left-0 right-0 bg-white border-b border-gray-100 shadow-2xl py-4 px-6 animate-in slide-in-from-top-2 duration-200 z-40">
                    <a href="/#how-it-works" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-600 hover:text-coral font-bold text-base py-3 border-b border-gray-50 transition-colors">How it works</a>
                    <a href="/#benefits" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-600 hover:text-coral font-bold text-base py-3 border-b border-gray-50 transition-colors">Why us</a>
                    <a href="/pricing" onClick={() => setIsMobileMenuOpen(false)} className="text-coral font-bold text-base py-3 border-b border-gray-50 transition-colors">Pricing</a>
                    <a href="/signup" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-600 hover:text-coral font-bold text-base py-3 transition-colors mt-2">Create a free account</a>
                </div>
            )}
        </nav>
    );
};

export default Navbar;

