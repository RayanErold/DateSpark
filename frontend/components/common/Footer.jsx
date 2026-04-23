import { Heart, Instagram, Twitter, Facebook } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="bg-white border-t border-gray-100 pt-20 pb-10">
            <div className="container-custom">
                <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
                    <div className="md:col-span-2 lg:col-span-2 space-y-6">
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
                            <a href="https://instagram.com/datespark01/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center text-gray-400 hover:text-coral hover:border-coral transition-all">
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
                        <h4 className="font-bold text-navy text-sm uppercase tracking-wider">Product</h4>
                        <ul className="space-y-4 text-gray-500">
                            <li><a href="#how-it-works" className="hover:text-coral transition-colors">How it works</a></li>
                            <li><a href="#benefits" className="hover:text-coral transition-colors">Why us</a></li>
                            <li><a href="#pricing" className="hover:text-coral transition-colors">Pricing</a></li>
                            <li><a href="#demo" className="hover:text-coral transition-colors">Example Plans</a></li>
                        </ul>
                    </div>
 
                    <div className="space-y-6">
                        <h4 className="font-bold text-navy text-sm uppercase tracking-wider">Support</h4>
                        <ul className="space-y-4 text-gray-500">
                            <li><a href="#faq" className="hover:text-coral transition-colors">Help Center</a></li>
                            <li><a href="mailto:support@datespark.live" className="hover:text-coral transition-colors">Contact Support</a></li>
                            <li><a href="#faq" className="hover:text-coral transition-colors">Safety Tips</a></li>
                            <li><a href="#feedback" className="hover:text-coral transition-colors">Give Feedback</a></li>
                        </ul>
                    </div>

                    <div className="space-y-6">
                        <h4 className="font-bold text-navy text-sm uppercase tracking-wider">Legal</h4>
                        <ul className="space-y-4 text-gray-500">
                            <li><Link to="/privacy" className="hover:text-coral transition-colors">Privacy Policy</Link></li>
                            <li><Link to="/terms" className="hover:text-coral transition-colors">Terms of Service</Link></li>
                            <li><Link to="/refund" className="hover:text-coral transition-colors">Refund Policy</Link></li>
                            <li><Link to="/cookies" className="hover:text-coral transition-colors">Cookie Policy</Link></li>
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
