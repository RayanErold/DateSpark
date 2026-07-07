import { Heart, Instagram, Twitter, Facebook } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="bg-plum pt-20 pb-10">
            <div className="container-custom">
                <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
                    <div className="md:col-span-2 lg:col-span-2 space-y-6">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-rose rounded-lg flex items-center justify-center shadow-lg shadow-rose/30">
                                <Heart className="text-ivory w-5 h-5 fill-current" />
                            </div>
                            <span className="text-xl font-bold tracking-tight text-ivory font-outfit">DateSpark</span>
                        </div>
                        <p className="text-ivory/60 max-w-sm leading-relaxed text-sm">
                            Making city nights unforgettable since 2026. Join thousands of couples rediscovering the joy of date night.
                        </p>
                        <div className="flex gap-4">
                            <a href="https://instagram.com/datespark01/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-ivory/10 flex items-center justify-center text-ivory/40 hover:text-rose hover:border-rose/40 transition-all">
                                <Instagram className="w-5 h-5" />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full border border-ivory/10 flex items-center justify-center text-ivory/40 hover:text-rose hover:border-rose/40 transition-all">
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full border border-ivory/10 flex items-center justify-center text-ivory/40 hover:text-rose hover:border-rose/40 transition-all">
                                <Facebook className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h4 className="font-semibold text-ivory text-sm uppercase tracking-wider font-outfit">Product</h4>
                        <ul className="space-y-4 text-ivory/50 text-sm">
                            <li><a href="#how-it-works" className="hover:text-rose transition-colors">How it works</a></li>
                            <li><a href="#benefits" className="hover:text-rose transition-colors">Why us</a></li>
                            <li><a href="#pricing" className="hover:text-rose transition-colors">Pricing</a></li>
                            <li><a href="#demo" className="hover:text-rose transition-colors">Example Plans</a></li>
                        </ul>
                    </div>

                    <div className="space-y-6">
                        <h4 className="font-semibold text-ivory text-sm uppercase tracking-wider font-outfit">Support</h4>
                        <ul className="space-y-4 text-ivory/50 text-sm">
                            <li><a href="#faq" className="hover:text-rose transition-colors">Help Center</a></li>
                            <li><a href="mailto:support@datespark.live" className="hover:text-rose transition-colors">Contact Support</a></li>
                            <li><a href="#faq" className="hover:text-rose transition-colors">Safety Tips</a></li>
                        </ul>
                    </div>

                    <div className="space-y-6">
                        <h4 className="font-semibold text-ivory text-sm uppercase tracking-wider font-outfit">Legal</h4>
                        <ul className="space-y-4 text-ivory/50 text-sm">
                            <li><Link to="/privacy" className="hover:text-rose transition-colors">Privacy Policy</Link></li>
                            <li><Link to="/terms" className="hover:text-rose transition-colors">Terms of Service</Link></li>
                            <li><Link to="/refund" className="hover:text-rose transition-colors">Refund Policy</Link></li>
                            <li><Link to="/cookies" className="hover:text-rose transition-colors">Cookie Policy</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-ivory/10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-ivory/30">
                    <p>© 2026 DateSpark Inc. All rights reserved.</p>
                    <p>Built with ❤️ for couples everywhere.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
