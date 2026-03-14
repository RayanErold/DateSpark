import React from 'react';

const ProductDemo = () => {
    return (
        <section className="py-24 bg-navy relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-0 -z-10 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-coral/20 via-navy to-navy" />
            <div className="absolute -bottom-64 -left-64 w-96 h-96 bg-gold/10 rounded-full blur-3xl opacity-50" />

            <div className="container-custom relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-20 space-y-6">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-full text-sm font-semibold backdrop-blur-sm border border-white/10 shadow-xl">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-coral opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-coral"></span>
                        </span>
                        Real moments captured
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black text-white leading-tight">
                        Less Planning.<br />
                        <span className="text-coral">More Connecting.</span>
                    </h2>
                    <p className="text-xl text-gray-400">
                        DateSpark handles the friction of figuring out "what to do," so you can focus on what actually matters: enjoying the moment together.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
                    <div className="relative rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 group aspect-[4/5] md:aspect-auto md:h-[600px]">
                        <img
                            src="/couple-phone.png"
                            alt="Couple planning date"
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/40 to-transparent opacity-90" />
                        <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12 w-full">
                            <div className="w-12 h-12 bg-coral rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-coral/30">
                                <span className="text-white font-black text-xl">1</span>
                            </div>
                            <h3 className="text-3xl font-bold text-white mb-4">The Spark</h3>
                            <p className="text-lg text-gray-300">
                                Skip the 40-minute "I don't know, what do you want to do" debate. Choose a vibe together and lock in a plan instantly.
                            </p>
                        </div>
                    </div>

                    <div className="relative rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 group aspect-[4/5] md:aspect-auto md:h-[600px] md:translate-y-16">
                        <img
                            src="/couple-dinner.png"
                            alt="Couple enjoying date"
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/40 to-transparent opacity-90" />
                        <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12 w-full">
                            <div className="w-12 h-12 bg-gold rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-gold/30">
                                <span className="text-navy font-black text-xl">2</span>
                            </div>
                            <h3 className="text-3xl font-bold text-white mb-4">The Experience</h3>
                            <p className="text-lg text-gray-300">
                                Discover hidden gem restaurants and local events. The logistics are handled, so you can stay fully present.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ProductDemo;
