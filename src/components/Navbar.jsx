import React from 'react';
import { Heart } from 'lucide-react';

const Navbar = () => {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
            <div className="container-custom flex items-center justify-between h-20">
                <a href="/" className="flex items-center gap-2">
                    <img src="/datespark-logo.png" alt="DateSpark Logo" className="w-10 h-10 rounded-xl shadow-lg shadow-coral/20 object-cover bg-white" />
                    <span className="text-xl font-bold tracking-tight text-navy">DateSpark</span>
                </a>

                <div className="hidden md:flex items-center gap-8">
                    <a href="#how-it-works" className="text-gray-600 hover:text-coral font-medium transition-colors">How it works</a>
                    <a href="#benefits" className="text-gray-600 hover:text-coral font-medium transition-colors">Why us</a>
                    <a href="#pricing" className="text-gray-600 hover:text-coral font-medium transition-colors">Pricing</a>
                    <a href="#waitlist" className="text-gray-600 hover:text-coral font-medium transition-colors">Join Waitlist</a>
                    <a href="/login" className="text-gray-600 hover:text-coral font-medium transition-colors">Log in</a>
                    <a href="/signup" className="btn-primary py-2 px-6 rounded-xl hover:text-white">Plan a date now</a>
                </div>

                <a href="/signup" className="md:hidden btn-primary py-2 px-6 rounded-xl hover:text-white">Start now</a>
            </div>
        </nav>
    );
};

export default Navbar;
