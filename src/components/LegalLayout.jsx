import React from 'react';
import { ArrowLeft } from 'lucide-react';
import Footer from './Footer';

const LegalLayout = ({ children, title, lastUpdated }) => {
    return (
        <div className="min-h-screen bg-white">
            {/* Simple Legal Header */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="container-custom flex items-center justify-between h-20">
                    <a href="/" className="flex items-center gap-2">
                        <img src="/datespark-logo.png" alt="DateSpark Logo" className="w-10 h-10 rounded-xl shadow-lg shadow-coral/20 object-cover bg-white" />
                        <span className="text-xl font-bold tracking-tight text-navy">DateSpark</span>
                    </a>
                    <a href="/" className="flex items-center gap-2 text-gray-500 hover:text-coral transition-colors font-medium">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </a>
                </div>
            </nav>

            {/* Legal Content */}
            <main className="pt-32 pb-20">
                <div className="container-custom max-w-4xl">
                    <div className="mb-12">
                        <h1 className="text-4xl md:text-5xl font-black text-navy mb-4 tracking-tight">
                            {title}
                        </h1>
                        {lastUpdated && (
                            <p className="text-gray-400 font-medium">
                                Last Updated: {lastUpdated}
                            </p>
                        )}
                    </div>
                    <div className="prose prose-slate max-w-none prose-headings:text-navy prose-headings:font-black prose-p:text-gray-600 prose-p:leading-relaxed prose-li:text-gray-600">
                        {children}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default LegalLayout;
