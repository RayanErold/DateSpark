import React, { useState } from 'react';
import { Heart, Menu, X } from 'lucide-react';

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
                    <a href="#how-it-works" className="text-gray-600 hover:text-coral font-medium transition-colors">How it works</a>
                    <a href="#benefits" className="text-gray-600 hover:text-coral font-medium transition-colors">Why us</a>
                    <a href="#pricing" className="text-gray-600 hover:text-coral font-medium transition-colors">Pricing</a>
                    <a href="#waitlist" className="text-gray-600 hover:text-coral font-medium transition-colors" title="Get notified when we launch in new cities">New cities</a>
                    <a href="/login" className="text-gray-600 hover:text-coral font-medium transition-colors">Log in</a>
                    <a href="/demo" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border-2 border-violet-500 text-violet-600 font-black text-sm hover:bg-violet-500 hover:text-white transition-all duration-200">
                        <span className="text-base">✨</span> Try Demo
                    </a>
                    <a href="/signup" className="btn-primary py-2 px-6 rounded-xl hover:text-white transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2">Plan a date now</a>
                </div>

                {/* Mobile Menu Toggle & CTA */}
                <div className="md:hidden flex items-center gap-2">
                    <a href="/demo" className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-black text-white bg-gradient-to-r from-violet-600 to-purple-500 shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 transition-all">
                        ✨ Demo
                    </a>
                    <a href="/signup" className="btn-primary py-1.5 px-3 text-xs rounded-lg hover:text-white transition-all focus:outline-none">Start now</a>
                    <button 
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="p-2 -mr-2 text-gray-600 hover:text-coral transition-colors"
                    >
                        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Dropdown Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden flex flex-col absolute top-20 left-0 right-0 bg-white border-b border-gray-100 shadow-2xl py-4 px-6 animate-in slide-in-from-top-2 duration-200 z-40">
                    <a href="#how-it-works" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-600 hover:text-coral font-bold text-lg py-3 border-b border-gray-50 transition-colors">How it works</a>
                    <a href="#benefits" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-600 hover:text-coral font-bold text-lg py-3 border-b border-gray-50 transition-colors">Why us</a>
                    <a href="#pricing" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-600 hover:text-coral font-bold text-lg py-3 border-b border-gray-50 transition-colors">Pricing</a>
                    <a href="#waitlist" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-600 hover:text-coral font-bold text-lg py-3 border-b border-gray-50 transition-colors">New cities waitlist</a>
                    <a href="/demo" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2 font-black text-lg py-3 border-b border-gray-50 text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-purple-500 transition-colors">
                        ✨ Try the Demo
                    </a>
                    <a href="/login" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-600 hover:text-coral font-bold text-lg py-3 transition-colors mt-2">Log in to your account</a>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
