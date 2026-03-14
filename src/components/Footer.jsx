import React from 'react';
import { Heart, Instagram, Twitter, Facebook } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-white border-t border-gray-100 pt-20 pb-10">
            <div className="container-custom">
                <div className="grid md:grid-cols-4 gap-12 mb-16">
                    <div className="col-span-2 space-y-6">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-coral rounded-lg flex items-center justify-center shadow-lg shadow-coral/20">
                                <Heart className="text-white w-5 h-5 fill-current" />
                            </div>
                            <span className="text-xl font-bold tracking-tight text-navy">DateSpark</span>
                        </div>
                        <p className="text-gray-500 max-w-sm leading-relaxed">
                            Making city nights unforgettable since 2026. Join thousands of couples rediscovering the joy of date night.
                        </p>
                        <div className="flex gap-4">
                            <a href="#" className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center text-gray-400 hover:text-coral hover:border-coral transition-all">
                                <Instagram className="w-5 h-5" />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center text-gray-400 hover:text-coral hover:border-coral transition-all">
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center text-gray-400 hover:text-coral hover:border-coral transition-all">
                                <Facebook className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h4 className="font-bold text-navy">Product</h4>
                        <ul className="space-y-4 text-gray-500">
                            <li><a href="#how-it-works" className="hover:text-coral transition-colors">How it works</a></li>
                            <li><a href="#benefits" className="hover:text-coral transition-colors">Why us</a></li>
                            <li><a href="#pricing" className="hover:text-coral transition-colors">Pricing</a></li>
                            <li><a href="#" className="hover:text-coral transition-colors">Example Plans</a></li>
                        </ul>
                    </div>

                    <div className="space-y-6">
                        <h4 className="font-bold text-navy">Legal</h4>
                        <ul className="space-y-4 text-gray-500">
                            <li><a href="#" className="hover:text-coral transition-colors">Privacy Policy</a></li>
                            <li><a href="#" className="hover:text-coral transition-colors">Terms of Service</a></li>
                            <li><a href="#" className="hover:text-coral transition-colors">Refund Policy</a></li>
                            <li><a href="#" className="hover:text-coral transition-colors">Cookie Policy</a></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-gray-50 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
                    <p>© 2026 DateSpark Inc. All rights reserved.</p>
                    <p>Built with ❤️ for busy couples everywhere.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
