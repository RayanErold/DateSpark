import React from 'react';
import { Sparkles, Zap, MapPin, Rocket, Shield, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.15 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: "easeOut" }
    }
};

const Benefits = () => {
    const benefits = [
        {
            icon: <Sparkles className="w-6 h-6 text-rose" />,
            bg: 'bg-rose/10',
            title: 'Real spots, not generic ideas',
            description: 'Plans are built from actual trending restaurants, bars, and events in your city — not outdated listicles or generic suggestions.',
        },
        {
            icon: <Zap className="w-6 h-6 text-amber-500" />,
            bg: 'bg-amber-50',
            title: 'Perfect for last-minute plans',
            description: 'Generate a curated date night in under 60 seconds. Ideal when someone asks "so what are we doing tonight?"',
        },
        {
            icon: <MapPin className="w-6 h-6 text-violet-500" />,
            bg: 'bg-violet-50',
            title: 'Navigation & tickets built-in',
            description: 'Every stop comes with direct Google Maps directions and ticket window links for events — no extra research needed.',
        },
        {
            icon: <Rocket className="w-6 h-6 text-sky-500" />,
            bg: 'bg-sky-50',
            title: 'One button, a full night out',
            description: 'No complex filters or endless menus. Tell us your vibe and budget — we handle sequencing, timing, route fit, and partner-ready sharing.',
        },
        {
            icon: <Shield className="w-6 h-6 text-emerald-500" />,
            bg: 'bg-emerald-50',
            title: 'Vet-rated quality guarantee',
            description: "Every venue is cross-referenced with real ratings and reviews. We don't surface hidden gems that are actually just mediocre.",
        },
        {
            icon: <RefreshCw className="w-6 h-6 text-pink-400" />,
            bg: 'bg-blush/60',
            title: 'Swap anything in one tap',
            description: "Not feeling a spot? Hit swap and our AI instantly replaces it with a better alternative — no regenerating the whole plan.",
        },
    ];

    return (
        <section id="benefits" className="py-24 bg-ivory">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-50px" }}
                    variants={itemVariants}
                    className="text-center max-w-2xl mx-auto mb-16"
                >
                    <span className="inline-block editorial-label bg-blush/60 px-4 py-1.5 rounded-full mb-5">
                        Why DateSpark
                    </span>
                    <h2 className="text-4xl md:text-5xl font-serif font-bold text-plum leading-tight">
                        Why settle for another<br />"dinner and a movie"?
                    </h2>
                    <p className="mt-4 text-taupe text-lg font-medium leading-relaxed">
                        We've helped thousands of couples rediscover their city, minus the planning fatigue.
                    </p>
                </motion.div>

                {/* Benefits grid */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-50px" }}
                    variants={containerVariants}
                    className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {benefits.map((b, i) => (
                        <motion.div
                            variants={itemVariants}
                            key={i}
                            className="group p-7 rounded-3xl border border-blush/40 bg-ivory hover:border-blush hover:shadow-xl hover:-translate-y-1 transition-all duration-300 space-y-4"
                        >
                            <div className={`w-12 h-12 rounded-2xl ${b.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                                {b.icon}
                            </div>
                            <h3 className="font-semibold text-plum text-lg leading-snug font-outfit">{b.title}</h3>
                            <p className="text-taupe text-sm leading-relaxed">{b.description}</p>
                        </motion.div>
                    ))}
                </motion.div>

                {/* CTA strip */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="mt-16 bg-plum rounded-3xl p-10 md:p-14 text-center relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-96 h-96 bg-rose/10 rounded-full blur-[100px] pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-champagne/10 rounded-full blur-[80px] pointer-events-none" />
                    <div className="relative z-10">
                        <h3 className="text-3xl md:text-4xl font-serif font-bold text-ivory mb-3">
                            Ready to plan your best date yet?
                        </h3>
                        <p className="text-ivory/60 font-medium mb-8 max-w-md mx-auto">
                            Your first plan is completely free. No credit card, no commitment.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                to="/signup"
                                className="px-8 py-4 bg-rose text-ivory font-semibold rounded-2xl hover:-translate-y-0.5 hover:shadow-xl hover:shadow-rose/30 transition-all duration-200 text-base uppercase tracking-widest"
                            >
                                Start Free — No Card Needed
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default Benefits;
