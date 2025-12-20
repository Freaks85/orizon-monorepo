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
    Zap
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
        color: "#ff6b00"
    },
    {
        icon: CalendarRange,
        title: "Reservations 24/7",
        description: "Vos clients reservent en ligne a toute heure. Plus d'appels manques, plus de carnet papier.",
        color: "#ff6b00"
    },
    {
        icon: Palette,
        title: "Page personnalisable",
        description: "Une page de reservation a votre image. Logo, couleurs, horaires - tout est configurable.",
        color: "#ff6b00"
    },
    {
        icon: Clock,
        title: "Services flexibles",
        description: "Definissez vos services (dejeuner, diner) avec creneaux et capacites personnalises.",
        color: "#ff6b00"
    }
];

const marqueeItems = [
    "Zero commission",
    "Page personnalisable",
    "Multi-salles",
    "Reservations illimitees",
    "Notifications temps reel",
    "Editeur graphique",
    "Zero commission",
    "Page personnalisable",
    "Multi-salles",
    "Reservations illimitees"
];

export function LandingPage() {
    const featuresRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: featuresRef,
        offset: ["start end", "end start"]
    });

    const x = useTransform(scrollYProgress, [0, 1], ["0%", "-50%"]);

    return (
        <div className="min-h-screen bg-[#050505]">
            <Header />

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6 bg-grid-pattern relative overflow-hidden">
                {/* Gradient orbs */}
                <div className="absolute top-20 left-1/4 w-96 h-96 bg-[#ff6b00]/20 rounded-full blur-[128px] pointer-events-none" />
                <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-[#ff6b00]/10 rounded-full blur-[96px] pointer-events-none" />

                <div className="max-w-7xl mx-auto text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <span className="inline-block px-4 py-1.5 bg-[#ff6b00]/10 border border-[#ff6b00]/20 rounded-full text-[#ff6b00] text-xs font-mono uppercase tracking-wider mb-6">
                            Gestion des reservations
                        </span>

                        <h1 className="font-display text-5xl md:text-7xl font-bold text-white uppercase tracking-wider mb-6">
                            Reservez. Gerez.<br />
                            <span className="text-[#ff6b00]">Simplifiez.</span>
                        </h1>

                        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
                            La solution complete de reservation en ligne pour votre restaurant.
                            Fini les appels manques et le carnet papier.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                href="/signup"
                                className="px-8 py-4 bg-[#ff6b00] text-black font-bold text-sm uppercase tracking-widest rounded-lg hover:bg-[#ff8533] transition-colors flex items-center gap-2"
                            >
                                Essai gratuit 7 jours
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                            <a
                                href="#features"
                                className="px-8 py-4 bg-white/5 border border-white/10 text-white font-bold text-sm uppercase tracking-widest rounded-lg hover:bg-white/10 transition-colors"
                            >
                                Decouvrir
                            </a>
                        </div>
                    </motion.div>

                    {/* Stats */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                        className="mt-20 grid grid-cols-3 gap-8 max-w-3xl mx-auto"
                    >
                        {[
                            { value: "0%", label: "Commission" },
                            { value: "24/7", label: "Disponible" },
                            { value: "2min", label: "Configuration" }
                        ].map((stat) => (
                            <div key={stat.label} className="text-center">
                                <div className="text-3xl md:text-4xl font-display font-bold text-[#ff6b00] mb-1">
                                    {stat.value}
                                </div>
                                <div className="text-sm text-slate-500 font-mono uppercase tracking-wider">
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Marquee */}
            <section className="py-6 border-y border-white/5 overflow-hidden bg-[#0a0a0a]">
                <motion.div
                    className="flex gap-8 whitespace-nowrap"
                    animate={{ x: [0, -1000] }}
                    transition={{
                        x: {
                            repeat: Infinity,
                            repeatType: "loop",
                            duration: 20,
                            ease: "linear"
                        }
                    }}
                >
                    {marqueeItems.map((item, index) => (
                        <span key={index} className="flex items-center gap-8">
                            <span className="text-sm font-mono uppercase tracking-wider text-slate-400">
                                {item}
                            </span>
                            <span className="w-2 h-2 bg-[#ff6b00] rounded-full" />
                        </span>
                    ))}
                </motion.div>
            </section>

            {/* Features Section */}
            <section id="features" ref={featuresRef} className="py-24 px-6 overflow-hidden">
                <div className="max-w-7xl mx-auto mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center"
                    >
                        <h2 className="font-display text-4xl font-bold text-white uppercase tracking-wider mb-4">
                            Tout ce dont vous avez besoin
                        </h2>
                        <p className="text-slate-400 max-w-xl mx-auto">
                            Une suite complete d'outils pour gerer vos reservations efficacement
                        </p>
                    </motion.div>
                </div>

                {/* Horizontal scroll cards */}
                <motion.div
                    style={{ x }}
                    className="flex gap-6 pl-6"
                >
                    {features.map((feature, index) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="flex-shrink-0 w-80 bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 hover:border-[#ff6b00]/30 transition-colors"
                        >
                            <div
                                className="w-14 h-14 rounded-xl flex items-center justify-center mb-6"
                                style={{ backgroundColor: `${feature.color}15` }}
                            >
                                <feature.icon className="h-7 w-7" style={{ color: feature.color }} />
                            </div>
                            <h3 className="font-display text-xl font-bold text-white uppercase tracking-wider mb-3">
                                {feature.title}
                            </h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                {feature.description}
                            </p>
                        </motion.div>
                    ))}
                </motion.div>
            </section>

            {/* Comparison Section */}
            <section id="comparison" className="py-24 px-6 bg-[#0a0a0a] border-y border-white/5">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="font-display text-4xl font-bold text-white uppercase tracking-wider mb-4">
                            Avant / Apres
                        </h2>
                        <p className="text-slate-400 max-w-xl mx-auto">
                            Decouvrez la difference avec OrizonReservation
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Le Chaos */}
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="bg-[#050505] border border-red-500/20 rounded-2xl p-8"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center">
                                    <AlertCircle className="h-6 w-6 text-red-500" />
                                </div>
                                <h3 className="font-display text-2xl font-bold text-red-500 uppercase tracking-wider">
                                    Le Chaos
                                </h3>
                            </div>
                            <ul className="space-y-4">
                                {[
                                    { icon: Phone, text: "Telephone qui sonne sans arret" },
                                    { icon: BookOpen, text: "Carnet papier illisible" },
                                    { icon: AlertCircle, text: "Reservations oubliees" },
                                    { icon: Users, text: "Clients mecontents" }
                                ].map((item) => (
                                    <li key={item.text} className="flex items-center gap-3 text-slate-400">
                                        <item.icon className="h-5 w-5 text-red-500/50" />
                                        <span>{item.text}</span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>

                        {/* L'Ordre */}
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="bg-[#050505] border border-[#ff6b00]/20 rounded-2xl p-8"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-[#ff6b00]/10 rounded-xl flex items-center justify-center">
                                    <Sparkles className="h-6 w-6 text-[#ff6b00]" />
                                </div>
                                <h3 className="font-display text-2xl font-bold text-[#ff6b00] uppercase tracking-wider">
                                    L'Ordre
                                </h3>
                            </div>
                            <ul className="space-y-4">
                                {[
                                    { icon: CalendarRange, text: "Reservations automatiques 24/7" },
                                    { icon: LayoutGrid, text: "Vue claire de toutes vos tables" },
                                    { icon: Bell, text: "Notifications en temps reel" },
                                    { icon: Zap, text: "Gestion sereine et efficace" }
                                ].map((item) => (
                                    <li key={item.text} className="flex items-center gap-3 text-slate-400">
                                        <item.icon className="h-5 w-5 text-[#ff6b00]" />
                                        <span>{item.text}</span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="font-display text-4xl font-bold text-white uppercase tracking-wider mb-4">
                            Pret a simplifier vos reservations ?
                        </h2>
                        <p className="text-slate-400 mb-8">
                            Essayez gratuitement pendant 7 jours. Aucune carte bancaire requise.
                        </p>
                        <Link
                            href="/signup"
                            className="inline-flex items-center gap-2 px-8 py-4 bg-[#ff6b00] text-black font-bold text-sm uppercase tracking-widest rounded-lg hover:bg-[#ff8533] transition-colors"
                        >
                            Commencer maintenant
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </motion.div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
