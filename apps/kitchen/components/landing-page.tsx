"use client";

import React, { useRef } from 'react';
import {
    Thermometer,
    Truck,
    ClipboardCheck,
    Bell,
    X,
    Activity
} from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Header } from './header';
import { Footer } from './footer';
import { DashboardHeroSection } from './dashboard-hero-section';

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
                        <span className="border border-neon-green/50 text-neon-green px-4 py-1 text-[10px] font-bold tracking-[0.3em] uppercase bg-neon-green/5">
                            Système HACCP v2.0
                        </span>
                    </motion.div>

                    <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[1.15] font-bold uppercase tracking-tight text-center">
                        <span className="block text-white/70">Protégez.</span>
                        <span className="block text-white text-6xl sm:text-7xl md:text-8xl lg:text-9xl my-2 md:my-4 drop-shadow-[0_0_30px_rgba(0,255,157,0.3)]">Contrôlez.</span>
                        <span className="block text-stroke text-white/70">Excellez.</span>
                    </h1>

                    <p className="mt-8 text-slate-400 text-sm md:text-base max-w-xl mx-auto font-mono tracking-wide">
                        La solution complète pour gérer votre conformité HACCP en toute sérénité
                    </p>
                </motion.div>

                {/* Background Image / Video Placeholder */}
                <div className="absolute inset-0 z-10 opacity-30 mix-blend-overlay">
                    <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1556910103-1c02745a30bf?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center grayscale contrast-125 brightness-50"></div>
                </div>

                {/* Scroll Indicator */}
                <motion.div
                    style={{ opacity }}
                    className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2"
                >
                    <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Scroll to initialize</span>
                    <div className="w-[1px] h-12 bg-gradient-to-b from-neon-green to-transparent"></div>
                </motion.div>
            </div>
        </section>
    );
};

// --- Marquee Section ---
const Marquee = () => {
    return (
        <div className="bg-neon-green py-4 overflow-hidden flex whitespace-nowrap border-y border-black">
            <motion.div
                animate={{ x: [0, -1000] }}
                transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                className="flex gap-12 items-center"
            >
                {[...Array(10)].map((_, i) => (
                    <span key={i} className="text-black font-display font-bold text-4xl uppercase tracking-wider flex items-center gap-12">
                        100% Conforme <span className="w-3 h-3 bg-black rotate-45"></span> Zéro Papier <span className="w-3 h-3 bg-black rotate-45"></span> Haute Précision <span className="w-3 h-3 bg-black rotate-45"></span>
                    </span>
                ))}
            </motion.div>
        </div>
    );
};

// --- Comparison Section ---
const Comparison = () => {
    return (
        <section className="py-32 bg-rich-black relative border-t border-white/10">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border border-white/10">

                    {/* Old World */}
                    <div className="p-12 border-b lg:border-b-0 lg:border-r border-white/10 relative group overflow-hidden">
                        <div className="absolute inset-0 bg-red-900/5 group-hover:bg-red-900/10 transition-colors duration-500"></div>
                        <h3 className="font-display text-4xl text-slate-600 mb-8 uppercase line-through decoration-red-500/50 decoration-2">Le Chaos</h3>
                        <ul className="space-y-6">
                            {['Papiers gras & illisibles', 'Stress des contrôles', 'Archives physiques', 'Erreurs humaines'].map((item, i) => (
                                <li key={i} className="flex items-center gap-4 text-slate-600 font-mono text-sm uppercase tracking-wider">
                                    <X className="h-4 w-4 text-red-900" /> {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* New World */}
                    <div className="p-12 relative group overflow-hidden">
                        <div className="absolute inset-0 bg-neon-green/5 group-hover:bg-neon-green/10 transition-colors duration-500"></div>
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-neon-green/50 shadow-[0_0_10px_rgba(0,255,157,0.5)] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700"></div>

                        <h3 className="font-display text-4xl text-white mb-8 uppercase flex items-center gap-4">
                            L'Ordre <Activity className="h-6 w-6 text-neon-green animate-pulse" />
                        </h3>
                        <ul className="space-y-6">
                            {['Digitalisation Totale', 'Sérénité Absolue', 'Cloud Sécurisé', 'Précision Chirurgicale'].map((item, i) => (
                                <li key={i} className="flex items-center gap-4 text-white font-mono text-sm uppercase tracking-wider">
                                    <span className="text-neon-green">0{i + 1}</span> {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                </div>
            </div>
        </section>
    );
};

// --- Horizontal Scroll Features ---
const HorizontalFeatures = () => {
    const targetRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: targetRef,
    });

    const x = useTransform(scrollYProgress, [0, 1], ["0%", "-75%"]);

    const features = [
        {
            title: "Température",
            icon: <Thermometer className="h-12 w-12 text-neon-green" />,
            desc: "Sondes connectées. Relevés instantanés. Précision décimale.",
            id: "01"
        },
        {
            title: "Réception",
            icon: <Truck className="h-12 w-12 text-neon-green" />,
            desc: "Contrôle fournisseurs. Scan étiquettes IA. Validation conforme.",
            id: "02"
        },
        {
            title: "Traçabilité",
            icon: <ClipboardCheck className="h-12 w-12 text-neon-green" />,
            desc: "Suivi DLC secondaire. Étiquetage automatisé. Historique infalsifiable.",
            id: "03"
        },
        {
            title: "Alertes",
            icon: <Bell className="h-12 w-12 text-neon-green" />,
            desc: "Notification critique 24/7. SMS & Email. Réactivité immédiate.",
            id: "04"
        }
    ];

    return (
        <section ref={targetRef} className="relative h-[300vh] bg-dark-gunmetal">
            <div className="sticky top-0 h-screen flex items-center overflow-hidden">
                <div className="absolute top-12 left-12 z-10">
                    <h2 className="font-display text-6xl text-white uppercase opacity-20">Modules Tactiques</h2>
                </div>

                <motion.div style={{ x }} className="flex gap-12 px-24">
                    {features.map((feature, i) => (
                        <div key={i} className="w-[80vw] md:w-[600px] h-[60vh] bg-rich-black border border-white/10 p-12 flex flex-col justify-between relative group hover:border-neon-green/50 transition-colors duration-500">
                            <div className="absolute top-0 right-0 p-6 font-mono text-6xl text-white/5 font-bold group-hover:text-neon-green/10 transition-colors">
                                {feature.id}
                            </div>

                            <div>
                                <div className="mb-8 p-4 border border-white/10 inline-block rounded-none group-hover:bg-neon-green/10 transition-colors">
                                    {feature.icon}
                                </div>
                                <h3 className="font-display text-5xl text-white uppercase mb-6">{feature.title}</h3>
                                <p className="font-mono text-slate-400 uppercase tracking-wider leading-relaxed border-l-2 border-neon-green pl-6">
                                    {feature.desc}
                                </p>
                            </div>

                            <div className="flex justify-between items-end border-t border-white/10 pt-8">
                                <span className="text-xs font-mono text-neon-green uppercase tracking-widest">Status: Active</span>
                                <div className="h-2 w-2 bg-neon-green animate-ping"></div>
                            </div>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};

export default function LandingPage() {
    return (
        <div className="bg-rich-black min-h-screen text-white selection:bg-neon-green selection:text-black">
            <Header />
            <main>
                <Hero />
                <Marquee />
                <DashboardHeroSection />
                <Comparison />
                <HorizontalFeatures />
            </main>
            <Footer />
        </div>
    );
}
