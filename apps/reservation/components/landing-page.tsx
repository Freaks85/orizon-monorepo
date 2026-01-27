"use client";

import { motion, useScroll, useTransform } from 'framer-motion';
import {
    CalendarRange,
    LayoutGrid,
    Palette,
    Clock,
    Users,
    ArrowRight,
    Phone,
    BookOpen,
    AlertCircle,
    Sparkles,
    Bell,
    Zap,
    Activity,
    X
} from 'lucide-react';
import Link from 'next/link';
import { useRef } from 'react';
import { Header } from './header';
import { Footer } from './footer';

const features = [
    {
        icon: LayoutGrid,
        title: "Editeur de salles",
        description: "Creez visuellement vos plans de salle avec notre editeur drag & drop. Placez tables et zones en quelques clics.",
        id: "01"
    },
    {
        icon: CalendarRange,
        title: "Reservations 24/7",
        description: "Vos clients reservent en ligne a toute heure. Plus d'appels manques, plus de carnet papier.",
        id: "02"
    },
    {
        icon: Palette,
        title: "Page personnalisable",
        description: "Une page de reservation a votre image. Logo, couleurs, horaires - tout est configurable.",
        id: "03"
    },
    {
        icon: Clock,
        title: "Services flexibles",
        description: "Definissez vos services (dejeuner, diner) avec creneaux et capacites personnalises.",
        id: "04"
    }
];

const marqueeItems = [
    "Zero commission",
    "Page personnalisable",
    "Multi-salles",
    "Reservations illimitees",
    "Notifications temps reel",
    "Editeur graphique"
];

// --- Hero Section ---
const Hero = () => {
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end start"]
    });

    const scale = useTransform(scrollYProgress, [0, 1], [1, 1.5]);
    const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
    const yText = useTransform(scrollYProgress, [0, 1], [0, 200]);

    return (
        <section ref={containerRef} className="relative h-[150vh] bg-rich-black overflow-hidden">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none"></div>

            {/* Sticky Container */}
            <div className="sticky top-0 h-screen flex flex-col items-center justify-center overflow-hidden">

                {/* Main Title */}
                <motion.div
                    style={{ scale, opacity, y: yText }}
                    className="relative z-20 text-center px-4"
                >
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className="mb-6 flex justify-center"
                    >
                        <span className="border border-neon-orange/50 text-neon-orange px-4 py-1 text-[10px] font-bold tracking-[0.3em] uppercase bg-neon-orange/5">
                            Gestion des reservations
                        </span>
                    </motion.div>

                    <h1 className="font-display text-4xl sm:text-5xl md:text-7xl lg:text-8xl leading-[1.15] font-bold uppercase tracking-tight text-center">
                        <span className="block text-white/70">Reservez.</span>
                        <span className="block text-white text-5xl sm:text-6xl md:text-8xl lg:text-9xl my-2 md:my-4 drop-shadow-[0_0_30px_rgba(255,107,0,0.3)]">Gerez.</span>
                        <span className="block text-stroke text-white/70">Simplifiez.</span>
                    </h1>

                    <p className="mt-8 text-slate-400 text-sm md:text-base max-w-xl mx-auto font-mono tracking-wide">
                        La solution complete de reservation en ligne pour votre restaurant
                    </p>
                </motion.div>

                {/* Background Image */}
                <div className="absolute inset-0 z-10 opacity-30 mix-blend-overlay">
                    <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center grayscale contrast-125 brightness-50"></div>
                </div>

                {/* Scroll Indicator */}
                <motion.div
                    style={{ opacity }}
                    className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2"
                >
                    <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Scroll to discover</span>
                    <div className="w-[1px] h-12 bg-gradient-to-b from-neon-orange to-transparent"></div>
                </motion.div>
            </div>
        </section>
    );
};

// --- Marquee Section ---
const Marquee = () => {
    return (
        <div className="bg-neon-orange py-3 sm:py-4 overflow-hidden flex whitespace-nowrap border-y border-black">
            <motion.div
                animate={{ x: [0, -1000] }}
                transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                className="flex gap-6 sm:gap-12 items-center"
            >
                {[...Array(10)].map((_, i) => (
                    <span key={i} className="text-black font-display font-bold text-xl sm:text-2xl lg:text-4xl uppercase tracking-wider flex items-center gap-6 sm:gap-12">
                        {marqueeItems.map((item, j) => (
                            <span key={j} className="flex items-center gap-6 sm:gap-12">
                                {item} <span className="w-2 h-2 sm:w-3 sm:h-3 bg-black rotate-45"></span>
                            </span>
                        ))}
                    </span>
                ))}
            </motion.div>
        </div>
    );
};

// --- Comparison Section ---
const Comparison = () => {
    return (
        <section className="py-16 sm:py-24 lg:py-32 bg-rich-black relative border-t border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border border-white/10">

                    {/* Old World */}
                    <div className="p-6 sm:p-8 lg:p-12 border-b lg:border-b-0 lg:border-r border-white/10 relative group overflow-hidden">
                        <div className="absolute inset-0 bg-red-900/5 group-hover:bg-red-900/10 transition-colors duration-500"></div>
                        <h3 className="font-display text-2xl sm:text-3xl lg:text-4xl text-slate-600 mb-6 sm:mb-8 uppercase line-through decoration-red-500/50 decoration-2">Le Chaos</h3>
                        <ul className="space-y-4 sm:space-y-6">
                            {['Telephone qui sonne sans arret', 'Carnet papier illisible', 'Reservations oubliees', 'Clients mecontents'].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 sm:gap-4 text-slate-600 font-mono text-xs sm:text-sm uppercase tracking-wider">
                                    <X className="h-4 w-4 text-red-900 flex-shrink-0" /> {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* New World */}
                    <div className="p-6 sm:p-8 lg:p-12 relative group overflow-hidden">
                        <div className="absolute inset-0 bg-neon-orange/5 group-hover:bg-neon-orange/10 transition-colors duration-500"></div>
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-neon-orange/50 shadow-[0_0_10px_rgba(255,107,0,0.5)] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700"></div>

                        <h3 className="font-display text-2xl sm:text-3xl lg:text-4xl text-white mb-6 sm:mb-8 uppercase flex items-center gap-3 sm:gap-4">
                            L'Ordre <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-neon-orange animate-pulse" />
                        </h3>
                        <ul className="space-y-4 sm:space-y-6">
                            {['Reservations automatiques 24/7', 'Vue claire de toutes vos tables', 'Notifications en temps reel', 'Gestion sereine et efficace'].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 sm:gap-4 text-white font-mono text-xs sm:text-sm uppercase tracking-wider">
                                    <span className="text-neon-orange flex-shrink-0">0{i + 1}</span> {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                </div>
            </div>
        </section>
    );
};

// --- Horizontal Scroll Features (Desktop) / Grid Features (Mobile) ---
const HorizontalFeatures = () => {
    const targetRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: targetRef,
    });

    const x = useTransform(scrollYProgress, [0, 1], ["0%", "-75%"]);

    return (
        <>
            {/* Mobile: Vertical Grid */}
            <section className="lg:hidden py-16 sm:py-24 bg-dark-gunmetal px-4 sm:px-6">
                <div className="max-w-7xl mx-auto">
                    <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-white uppercase opacity-40 mb-8 sm:mb-12 text-center">Fonctionnalites</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        {features.map((feature, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-rich-black border border-white/10 p-6 sm:p-8 flex flex-col relative group hover:border-neon-orange/50 transition-colors duration-500 rounded-xl"
                            >
                                <div className="absolute top-4 right-4 font-mono text-4xl text-white/5 font-bold group-hover:text-neon-orange/10 transition-colors">
                                    {feature.id}
                                </div>

                                <div className="mb-4 sm:mb-6 p-3 border border-white/10 inline-block rounded-lg w-fit group-hover:bg-neon-orange/10 transition-colors">
                                    <feature.icon className="h-8 w-8 sm:h-10 sm:w-10 text-neon-orange" />
                                </div>
                                <h3 className="font-display text-xl sm:text-2xl text-white uppercase mb-3 sm:mb-4">{feature.title}</h3>
                                <p className="font-mono text-slate-400 text-xs sm:text-sm uppercase tracking-wider leading-relaxed border-l-2 border-neon-orange pl-4">
                                    {feature.description}
                                </p>

                                <div className="flex justify-between items-end border-t border-white/10 pt-4 mt-auto">
                                    <span className="text-[10px] sm:text-xs font-mono text-neon-orange uppercase tracking-widest">Status: Active</span>
                                    <div className="h-2 w-2 bg-neon-orange animate-ping"></div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Desktop: Horizontal Scroll */}
            <section ref={targetRef} className="relative h-[300vh] bg-dark-gunmetal hidden lg:block">
                <div className="sticky top-0 h-screen flex items-center overflow-hidden">
                    <div className="absolute top-12 left-12 z-10">
                        <h2 className="font-display text-6xl text-white uppercase opacity-20">Fonctionnalites</h2>
                    </div>

                    <motion.div style={{ x }} className="flex gap-12 px-24">
                        {features.map((feature, i) => (
                            <div key={i} className="w-[600px] h-[60vh] bg-rich-black border border-white/10 p-12 flex flex-col justify-between relative group hover:border-neon-orange/50 transition-colors duration-500">
                                <div className="absolute top-0 right-0 p-6 font-mono text-6xl text-white/5 font-bold group-hover:text-neon-orange/10 transition-colors">
                                    {feature.id}
                                </div>

                                <div>
                                    <div className="mb-8 p-4 border border-white/10 inline-block rounded-none group-hover:bg-neon-orange/10 transition-colors">
                                        <feature.icon className="h-12 w-12 text-neon-orange" />
                                    </div>
                                    <h3 className="font-display text-5xl text-white uppercase mb-6">{feature.title}</h3>
                                    <p className="font-mono text-slate-400 uppercase tracking-wider leading-relaxed border-l-2 border-neon-orange pl-6">
                                        {feature.description}
                                    </p>
                                </div>

                                <div className="flex justify-between items-end border-t border-white/10 pt-8">
                                    <span className="text-xs font-mono text-neon-orange uppercase tracking-widest">Status: Active</span>
                                    <div className="h-2 w-2 bg-neon-orange animate-ping"></div>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </section>
        </>
    );
};

// --- CTA Section ---
const CTASection = () => {
    return (
        <section className="py-16 sm:py-24 lg:py-32 px-4 sm:px-6 bg-rich-black border-t border-white/10">
            <div className="max-w-4xl mx-auto text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <h2 className="font-display text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold text-white uppercase tracking-wider mb-4 sm:mb-6">
                        Pret a simplifier vos reservations ?
                    </h2>
                    <p className="text-slate-400 text-sm sm:text-base lg:text-lg mb-8 sm:mb-10 font-mono px-4">
                        Essayez gratuitement pendant 7 jours. Aucune carte bancaire requise.
                    </p>
                    <Link
                        href="/signup"
                        className="inline-flex items-center gap-2 sm:gap-3 px-6 sm:px-10 py-4 sm:py-5 bg-neon-orange text-black font-bold text-xs sm:text-sm uppercase tracking-widest hover:bg-neon-orange-light transition-colors rounded-lg"
                    >
                        Commencer maintenant
                        <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Link>
                </motion.div>
            </div>
        </section>
    );
};

export function LandingPage() {
    return (
        <div className="bg-rich-black min-h-screen text-white selection:bg-neon-orange selection:text-black">
            <Header />
            <main>
                <Hero />
                <Marquee />
                <Comparison />
                <HorizontalFeatures />
                <CTASection />
            </main>
            <Footer />
        </div>
    );
}
