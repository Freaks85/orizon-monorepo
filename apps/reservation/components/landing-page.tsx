"use client";

import { motion, useScroll, useTransform, useMotionValue } from 'framer-motion';
import {
    CalendarRange,
    LayoutGrid,
    Palette,
    Clock,
    Bell,
    ArrowRight,
    X,
    Check,
    Activity,
    ChevronDown,
    Utensils,
    Sparkles,
    Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useRef, useState, useCallback } from 'react';
import { Header } from './header';
import { Footer } from './footer';

/* ─────────────────────────────────────────────
   HOOKS & UTILITIES
   ───────────────────────────────────────────── */

// Mouse-aware glow that follows cursor inside a container
function useMouseGlow() {
    const ref = useRef<HTMLDivElement>(null);
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;
        mouseX.set(e.clientX - rect.left);
        mouseY.set(e.clientY - rect.top);
    }, [mouseX, mouseY]);

    return { ref, mouseX, mouseY, handleMouseMove };
}

const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number = 0) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] as const }
    })
};

const staggerContainer = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1 } }
};

const clipReveal = {
    hidden: { clipPath: "inset(100% 0 0 0)", opacity: 0 },
    visible: (i: number = 0) => ({
        clipPath: "inset(0% 0 0 0)",
        opacity: 1,
        transition: { duration: 0.8, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] as const }
    })
};

/* ─────────────────────────────────────────────
   SECTION 1 — HERO
   ───────────────────────────────────────────── */

const Hero = () => {
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end start"]
    });

    const scale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
    const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
    const yText = useTransform(scrollYProgress, [0, 1], [0, 250]);
    const yOrb1 = useTransform(scrollYProgress, [0, 1], [0, -100]);
    const yOrb2 = useTransform(scrollYProgress, [0, 1], [0, 80]);

    const words = ["Chaque", "table", "mérite", "d'être", "remplie."];

    return (
        <section ref={containerRef} className="relative h-[150vh] bg-rich-black overflow-hidden">
            {/* Living background */}
            <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none" />
            <div className="absolute inset-0 bg-mesh-gradient pointer-events-none" />
            <div className="absolute inset-0 noise-overlay pointer-events-none" />

            {/* Animated orbs — constant organic movement */}
            <motion.div
                style={{ y: yOrb1 }}
                className="absolute top-[15%] left-[10%] w-[500px] h-[500px] bg-[#ff6b00]/[0.07] orb pointer-events-none"
            />
            <motion.div
                style={{ y: yOrb2 }}
                className="absolute bottom-[10%] right-[5%] w-[400px] h-[400px] bg-violet-600/[0.05] orb orb-2 pointer-events-none"
            />
            <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#ff6b00]/[0.03] animate-glow-breathe rounded-full pointer-events-none" />

            <div className="sticky top-0 h-screen flex flex-col items-center justify-center overflow-hidden">
                <motion.div style={{ scale, opacity, y: yText }} className="relative z-20 text-center px-4 max-w-5xl mx-auto">
                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="mb-8 flex justify-center"
                    >
                        <span className="group inline-flex items-center gap-2.5 border border-neon-orange/30 text-neon-orange px-5 py-2 text-[10px] font-bold tracking-[0.3em] uppercase bg-neon-orange/5 rounded-full hover:bg-neon-orange/10 hover:border-neon-orange/50 transition-all duration-500 cursor-default">
                            <Sparkles className="w-3 h-3 animate-pulse" />
                            Plateforme de réservation
                            <span className="w-1.5 h-1.5 bg-neon-orange rounded-full animate-pulse" />
                        </span>
                    </motion.div>

                    {/* Title — word-by-word clipPath reveal */}
                    <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl leading-[1.05] font-bold uppercase tracking-tight">
                        <motion.span
                            initial="hidden"
                            animate="visible"
                            variants={staggerContainer}
                            className="flex flex-wrap justify-center gap-x-4 md:gap-x-6"
                        >
                            {words.map((word, i) => (
                                <motion.span
                                    key={i}
                                    custom={i}
                                    variants={clipReveal}
                                    className={word === "remplie."
                                        ? "text-transparent bg-clip-text bg-gradient-to-r from-[#ff6b00] to-[#ff8533] drop-shadow-[0_0_40px_rgba(255,107,0,0.4)]"
                                        : "text-white"
                                    }
                                >
                                    {word}
                                </motion.span>
                            ))}
                        </motion.span>
                    </h1>

                    {/* Subtitle */}
                    <motion.p
                        initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        transition={{ duration: 0.8, delay: 1 }}
                        className="mt-8 text-slate-400 text-base md:text-lg max-w-xl mx-auto leading-relaxed"
                    >
                        Gérez vos réservations, vos salles et vos services depuis une seule interface pensée pour les restaurateurs.
                    </motion.p>

                    {/* CTAs */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 1.3 }}
                        className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                        <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                            <Link
                                href="/signup"
                                className="group shimmer-hover btn-magnetic px-8 py-4 bg-gradient-to-r from-[#ff6b00] to-[#ff8533] text-black font-bold text-xs uppercase tracking-widest rounded-xl flex items-center gap-3"
                            >
                                Commencer maintenant
                                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                            </Link>
                        </motion.div>
                        <motion.a
                            href="#features"
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            className="px-8 py-4 border border-white/15 text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:border-white/30 hover:bg-white/[0.04] transition-all duration-500 backdrop-blur-sm"
                        >
                            Découvrir
                        </motion.a>
                    </motion.div>

                    {/* Badges */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1, delay: 1.8 }}
                        className="mt-12 flex items-center justify-center gap-6 flex-wrap"
                    >
                        {["Sans commission", "Sans engagement", "40€ par mois"].map((tag, i) => (
                            <motion.span
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.8 + i * 0.15 }}
                                className="text-slate-500 text-[11px] font-medium tracking-wide flex items-center gap-2"
                            >
                                <Check className="w-3.5 h-3.5 text-neon-orange" /> {tag}
                            </motion.span>
                        ))}
                    </motion.div>
                </motion.div>

                {/* Scroll indicator */}
                <motion.div
                    style={{ opacity }}
                    className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2"
                >
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2.5 }}
                        className="flex flex-col items-center gap-2"
                    >
                        <span className="text-[10px] uppercase tracking-[0.2em] text-slate-600 font-mono">Scroll</span>
                        <motion.div
                            animate={{ y: [0, 8, 0] }}
                            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                        >
                            <ChevronDown className="w-4 h-4 text-neon-orange/70" />
                        </motion.div>
                        <div className="w-[1px] h-10 bg-gradient-to-b from-neon-orange/40 to-transparent" />
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
};

/* ─────────────────────────────────────────────
   SECTION 2 — MARQUEE
   ───────────────────────────────────────────── */

const marqueeItems1 = ["Zéro commission", "Réservations illimitées", "Multi-salles", "Temps réel", "Sans engagement", "Support 24/7"];
const marqueeItems2 = ["Éditeur de salles", "Page personnalisable", "Notifications", "Cahier de réservation", "Multi-services", "100% en ligne"];

const MarqueeRow = ({ items, reverse = false, speed = 20 }: { items: string[]; reverse?: boolean; speed?: number }) => (
    <div className="overflow-hidden flex whitespace-nowrap">
        <motion.div
            animate={{ x: reverse ? [-2000, 0] : [0, -2000] }}
            transition={{ repeat: Infinity, duration: speed, ease: "linear" }}
            className="flex gap-8 sm:gap-12 items-center"
        >
            {[...Array(12)].map((_, i) => (
                <span key={i} className="text-black font-display font-bold text-lg sm:text-2xl lg:text-3xl uppercase tracking-wider flex items-center gap-8 sm:gap-12">
                    {items.map((item, j) => (
                        <span key={j} className="flex items-center gap-8 sm:gap-12">
                            {item} <span className="w-1.5 h-1.5 bg-black/30 rotate-45" />
                        </span>
                    ))}
                </span>
            ))}
        </motion.div>
    </div>
);

const Marquee = () => (
    <div className="bg-gradient-to-r from-[#ff6b00] via-[#ff8533] to-[#ff6b00] animate-gradient-shift border-y border-black/10">
        <div className="py-3 sm:py-4">
            <MarqueeRow items={marqueeItems1} speed={25} />
        </div>
        <div className="py-3 sm:py-4 border-t border-black/10">
            <MarqueeRow items={marqueeItems2} reverse speed={30} />
        </div>
    </div>
);

/* ─────────────────────────────────────────────
   SECTION 3 — BENTO FEATURES
   ───────────────────────────────────────────── */

const bentoFeatures = [
    {
        icon: LayoutGrid,
        title: "Éditeur de salles",
        description: "Créez visuellement vos plans de salle avec notre éditeur drag & drop. Tables rondes, carrées, rectangulaires.",
        size: "lg:col-span-2 lg:row-span-1"
    },
    {
        icon: CalendarRange,
        title: "Réservations 24/7",
        description: "Vos clients réservent en ligne à toute heure. Plus d'appels manqués, plus de carnet papier.",
        size: "lg:row-span-2"
    },
    {
        icon: Bell,
        title: "Notifications",
        description: "Alertes email en temps réel pour chaque nouvelle réservation. Confirmez en un clic.",
        size: ""
    },
    {
        icon: Clock,
        title: "Multi-services",
        description: "Déjeuner, dîner, brunch — configurez vos créneaux avec limites de couverts.",
        size: ""
    },
    {
        icon: Palette,
        title: "Page personnalisable",
        description: "Une page de réservation à votre image. Couleurs, message d'accueil, coordonnées — tout est configurable.",
        size: "lg:col-span-2"
    }
];

const BentoCard = ({ feature, index }: { feature: typeof bentoFeatures[number]; index: number }) => {
    const { ref, mouseX, mouseY, handleMouseMove } = useMouseGlow();

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouseMove}
            variants={fadeUp}
            custom={index}
            whileHover={{ y: -4, transition: { duration: 0.3 } }}
            className={`group relative p-6 sm:p-8 lg:p-10 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm hover:border-neon-orange/20 transition-colors duration-500 overflow-hidden ${feature.size}`}
        >
            {/* Mouse-following glow */}
            <motion.div
                className="absolute w-64 h-64 bg-neon-orange/[0.06] rounded-full blur-3xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ x: mouseX, y: mouseY, translateX: "-50%", translateY: "-50%" }}
            />

            <div className="relative z-10">
                <motion.div
                    className="mb-6 p-3 border border-white/10 inline-flex rounded-xl group-hover:border-neon-orange/30 group-hover:bg-neon-orange/10 transition-all duration-500"
                    whileHover={{ rotate: -5 }}
                >
                    <feature.icon className="h-6 w-6 sm:h-7 sm:w-7 text-neon-orange" />
                </motion.div>
                <h3 className="font-display text-xl sm:text-2xl text-white uppercase mb-3">{feature.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
            </div>

            {/* Corner accent — breathing */}
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="w-1.5 h-1.5 bg-neon-orange rounded-full animate-pulse" />
            </div>
        </motion.div>
    );
};

const BentoFeatures = () => (
    <section id="features" className="py-20 sm:py-28 lg:py-36 bg-rich-black relative">
        <div className="absolute inset-0 noise-overlay pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
            <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={staggerContainer}
                className="mb-16 lg:mb-20"
            >
                <motion.span variants={fadeUp} custom={0} className="text-neon-orange text-xs font-mono uppercase tracking-[0.3em] flex items-center gap-2">
                    <Zap className="w-3 h-3" /> Fonctionnalités
                </motion.span>
                <motion.h2 variants={fadeUp} custom={1} className="font-display text-3xl sm:text-4xl lg:text-6xl text-white uppercase mt-4 leading-tight">
                    Tout ce dont vous<br />avez besoin
                </motion.h2>
            </motion.div>

            <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={staggerContainer}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5"
            >
                {bentoFeatures.map((feature, i) => (
                    <BentoCard key={i} feature={feature} index={i} />
                ))}
            </motion.div>
        </div>
    </section>
);

/* ─────────────────────────────────────────────
   SECTION 4 — PRODUCT SHOWCASE
   ───────────────────────────────────────────── */


const ProductShowcase = () => {
    const sectionRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start end", "end start"]
    });
    const mockupScale = useTransform(scrollYProgress, [0, 0.4], [0.88, 1]);
    const mockupOpacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);
    const mockupRotateX = useTransform(scrollYProgress, [0, 0.4], [8, 0]);

    return (
        <section ref={sectionRef} className="py-20 sm:py-28 lg:py-36 bg-dark-gunmetal relative overflow-hidden">
            <div className="absolute inset-0 noise-overlay pointer-events-none" />
            <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={staggerContainer}
                    className="text-center mb-16"
                >
                    <motion.span variants={fadeUp} custom={0} className="text-neon-orange text-xs font-mono uppercase tracking-[0.3em]">
                        Produit
                    </motion.span>
                    <motion.h2 variants={fadeUp} custom={1} className="font-display text-3xl sm:text-4xl lg:text-5xl text-white uppercase mt-4">
                        Conçu pour les restaurateurs exigeants
                    </motion.h2>
                </motion.div>

                {/* Browser Mockup with 3D perspective */}
                <motion.div
                    style={{
                        scale: mockupScale,
                        opacity: mockupOpacity,
                        rotateX: mockupRotateX,
                        transformPerspective: 1200
                    }}
                    className="relative"
                >
                    {/* Ambient glow — breathing */}
                    <div className="absolute -inset-16 bg-neon-orange/[0.06] blur-3xl rounded-full pointer-events-none animate-glow-breathe" />

                    <div className="relative rounded-2xl border border-white/10 overflow-hidden bg-rich-black shadow-2xl shadow-black/50">
                        {/* Chrome bar */}
                        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-white/[0.03]">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-red-500/60 hover:bg-red-500 transition-colors" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500/60 hover:bg-yellow-500 transition-colors" />
                                <div className="w-3 h-3 rounded-full bg-green-500/60 hover:bg-green-500 transition-colors" />
                            </div>
                            <div className="flex-1 mx-4">
                                <div className="bg-white/[0.06] rounded-lg py-1.5 px-4 text-xs text-slate-500 font-mono text-center">
                                    reservation.orizonapp.com/dashboard
                                </div>
                            </div>
                        </div>

                        {/* Dashboard content mockup */}
                        <div className="p-4 sm:p-6 lg:p-8 min-h-[350px] sm:min-h-[480px]">
                            <div className="flex gap-5">
                                {/* Sidebar */}
                                <div className="hidden md:flex flex-col w-48 shrink-0">
                                    <div className="flex items-center gap-2.5 mb-6 px-3">
                                        <div className="w-7 h-7 rounded-lg bg-neon-orange/20 flex items-center justify-center">
                                            <Utensils className="w-3.5 h-3.5 text-neon-orange" />
                                        </div>
                                        <span className="text-xs font-display text-white uppercase tracking-wide">Orizons</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        {[
                                            { label: "Dashboard", icon: "◉", active: true },
                                            { label: "Réservations", icon: "◎", active: false },
                                            { label: "Cahier Resa", icon: "▤", active: false },
                                            { label: "Salles", icon: "▣", active: false },
                                            { label: "Services", icon: "◈", active: false },
                                            { label: "Paramètres", icon: "⚙", active: false },
                                        ].map((item, i) => (
                                            <div key={i} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-mono transition-colors ${item.active ? "bg-neon-orange/15 text-neon-orange border border-neon-orange/20" : "text-slate-600"}`}>
                                                <span className="text-[10px]">{item.icon}</span>
                                                {item.label}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-auto pt-6 border-t border-white/[0.06]">
                                        <div className="flex items-center gap-2.5 px-3">
                                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-neon-orange/40 to-neon-orange/10 flex items-center justify-center text-[10px] text-white font-bold">JD</div>
                                            <div>
                                                <p className="text-[10px] text-white font-medium">Jean Dupont</p>
                                                <p className="text-[9px] text-slate-600 font-mono">Le Petit Bistrot</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Main content */}
                                <div className="flex-1 space-y-4 min-w-0">
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            <h3 className="text-sm font-display text-white uppercase">Dashboard</h3>
                                            <p className="text-[10px] text-slate-600 font-mono">Lundi 27 Janvier 2026</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="relative">
                                                <Bell className="w-4 h-4 text-slate-500" />
                                                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-neon-orange rounded-full animate-pulse" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* 4 real stat cards */}
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                                        {[
                                            { label: "Réservations aujourd'hui", value: "24", color: "text-neon-orange" },
                                            { label: "En attente", value: "3", color: "text-amber-400" },
                                            { label: "Couverts prévus", value: "86", color: "text-emerald-400" },
                                            { label: "Tables configurées", value: "12", color: "text-violet-400" }
                                        ].map((stat, i) => (
                                            <div key={i} className="p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                                                <p className="text-[9px] text-slate-600 font-mono uppercase tracking-wider leading-tight">{stat.label}</p>
                                                <p className={`text-xl font-display mt-1.5 ${stat.color}`}>{stat.value}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Quick actions + recent reservations */}
                                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-2.5">
                                        <div className="lg:col-span-2 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                                            <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider mb-3">Actions rapides</p>
                                            <div className="grid grid-cols-2 gap-2">
                                                {[
                                                    { label: "Salles", icon: "▣" },
                                                    { label: "Services", icon: "◈" },
                                                    { label: "Réservations", icon: "◎" },
                                                    { label: "Paramètres", icon: "⚙" }
                                                ].map((action, a) => (
                                                    <div key={a} className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02]">
                                                        <span className="text-neon-orange text-[10px]">{action.icon}</span>
                                                        <span className="text-[10px] text-white font-mono">{action.label}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="lg:col-span-3 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                                            <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider mb-3">Dernières réservations</p>
                                            <div className="space-y-2">
                                                {[
                                                    { name: "Martin", time: "19:30", guests: 4, status: "confirmed" },
                                                    { name: "Dupont", time: "20:00", guests: 2, status: "confirmed" },
                                                    { name: "Bernard", time: "20:30", guests: 6, status: "pending" },
                                                    { name: "Leroy", time: "21:00", guests: 3, status: "confirmed" },
                                                    { name: "Moreau", time: "21:30", guests: 5, status: "pending" }
                                                ].map((resa, r) => (
                                                    <div key={r} className="flex items-center gap-3 px-3 py-2 rounded-lg border border-white/[0.04] bg-white/[0.01]">
                                                        <div className="w-6 h-6 rounded-full bg-white/[0.06] flex items-center justify-center text-[9px] font-bold text-slate-400 shrink-0">
                                                            {resa.name[0]}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-[11px] text-white font-medium truncate">{resa.name}</p>
                                                            <p className="text-[9px] text-slate-600 font-mono">{resa.time} · {resa.guests} pers.</p>
                                                        </div>
                                                        <span className={`text-[8px] font-mono uppercase px-1.5 py-0.5 rounded-full ${
                                                            resa.status === "confirmed"
                                                                ? "bg-neon-orange/15 text-neon-orange"
                                                                : "bg-amber-500/15 text-amber-400"
                                                        }`}>
                                                            {resa.status === "confirmed" ? "Confirmé" : "En attente"}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </motion.div>
            </div>
        </section>
    );
};


/* ─────────────────────────────────────────────
   SECTION 6 — COMPARISON
   ───────────────────────────────────────────── */

const chaosItems = [
    "Téléphone qui sonne sans arrêt",
    "Carnet papier illisible",
    "Réservations oubliées",
    "Clients mécontents",
    "Revenus perdus"
];

const ordreItems = [
    "Réservations automatiques 24/7",
    "Vue claire de toutes vos tables",
    "Notifications en temps réel",
    "Clients satisfaits",
    "Revenus optimisés"
];

const Comparison = () => (
    <section id="comparison" className="py-20 sm:py-28 lg:py-36 bg-dark-gunmetal relative">
        <div className="absolute inset-0 noise-overlay pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
            <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={staggerContainer}
                className="mb-16"
            >
                <motion.span variants={fadeUp} custom={0} className="text-neon-orange text-xs font-mono uppercase tracking-[0.3em]">
                    Comparaison
                </motion.span>
                <motion.h2 variants={fadeUp} custom={1} className="font-display text-3xl sm:text-4xl lg:text-5xl text-white uppercase mt-4">
                    Avant / Après
                </motion.h2>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-2xl border border-white/[0.06] overflow-hidden">
                {/* Le Chaos */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={staggerContainer}
                    className="p-8 sm:p-10 lg:p-12 border-b lg:border-b-0 lg:border-r border-white/[0.06] relative group"
                >
                    <div className="absolute inset-0 bg-red-900/[0.03] group-hover:bg-red-900/[0.06] transition-colors duration-700" />
                    <motion.h3 variants={fadeUp} custom={0} className="relative font-display text-2xl sm:text-3xl text-slate-600 mb-8 uppercase line-through decoration-red-500/50 decoration-2">
                        Le Chaos
                    </motion.h3>
                    <ul className="relative space-y-5">
                        {chaosItems.map((item, i) => (
                            <motion.li
                                key={i}
                                variants={fadeUp}
                                custom={i + 1}
                                className="flex items-center gap-4 text-slate-600 text-sm font-mono uppercase tracking-wider"
                            >
                                <X className="h-4 w-4 text-red-800 flex-shrink-0" /> {item}
                            </motion.li>
                        ))}
                    </ul>
                </motion.div>

                {/* L'Ordre */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={staggerContainer}
                    className="p-8 sm:p-10 lg:p-12 relative group"
                >
                    <div className="absolute inset-0 bg-neon-orange/[0.02] group-hover:bg-neon-orange/[0.05] transition-colors duration-700" />
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-neon-orange/30 shadow-[0_0_15px_rgba(255,107,0,0.3)] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left" />

                    <motion.h3 variants={fadeUp} custom={0} className="relative font-display text-2xl sm:text-3xl text-white mb-8 uppercase flex items-center gap-3">
                        L&apos;Ordre <Activity className="h-5 w-5 text-neon-orange animate-pulse" />
                    </motion.h3>
                    <ul className="relative space-y-5">
                        {ordreItems.map((item, i) => (
                            <motion.li
                                key={i}
                                variants={fadeUp}
                                custom={i + 1}
                                className="flex items-center gap-4 text-white text-sm font-mono uppercase tracking-wider"
                            >
                                <Check className="h-4 w-4 text-neon-orange flex-shrink-0" /> {item}
                            </motion.li>
                        ))}
                    </ul>
                </motion.div>
            </div>
        </div>
    </section>
);

/* ─────────────────────────────────────────────
   SECTION 7 — PRICING
   ───────────────────────────────────────────── */

const plans = [
    {
        name: "Illimité",
        price: "40",
        period: "/ mois",
        description: "Tout inclus, sans commission",
        features: ["Salles illimitées", "Réservations illimitées", "Page personnalisable", "Statistiques avancées", "Support prioritaire", "Branding personnalisé", "Sans commission sur les réservations"],
        cta: "Commencer maintenant",
        highlighted: true
    }
];

const Pricing = () => (
    <section id="pricing" className="py-20 sm:py-28 lg:py-36 bg-rich-black relative border-t border-white/[0.06]">
        <div className="absolute inset-0 noise-overlay pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
            <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={staggerContainer}
                className="text-center mb-16"
            >
                <motion.span variants={fadeUp} custom={0} className="text-neon-orange text-xs font-mono uppercase tracking-[0.3em]">
                    Tarifs
                </motion.span>
                <motion.h2 variants={fadeUp} custom={1} className="font-display text-3xl sm:text-4xl lg:text-5xl text-white uppercase mt-4">
                    Un seul tarif, tout inclus
                </motion.h2>
                <motion.p variants={fadeUp} custom={2} className="text-slate-400 text-sm mt-4 max-w-md mx-auto">
                    40€ par mois. Sans commission. Sans limites.
                </motion.p>
            </motion.div>

            <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={staggerContainer}
                className="flex justify-center"
            >
                {plans.map((plan, i) => (
                    <motion.div
                        key={i}
                        variants={fadeUp}
                        custom={i}
                        whileHover={{ y: -6, transition: { duration: 0.3 } }}
                        className="relative p-8 sm:p-10 rounded-2xl border transition-all duration-500 border-neon-orange/30 bg-neon-orange/[0.03] max-w-md w-full"
                    >
                        <>
                            <div className="absolute inset-0 animate-border-rotate rounded-2xl" />
                            <span className="absolute -top-3 left-8 z-20 px-4 py-1.5 bg-gradient-to-r from-[#ff6b00] to-[#ff8533] text-black text-[10px] font-bold uppercase tracking-widest rounded-full shadow-lg shadow-[#ff6b00]/20">
                                Sans Commission
                            </span>
                        </>

                        <div className="relative z-10">
                            <h3 className="font-display text-xl text-white uppercase">{plan.name}</h3>
                            <div className="mt-4 flex items-baseline gap-1">
                                <span className="font-display text-5xl sm:text-6xl text-white">{plan.price}<span className="text-lg">€</span></span>
                                <span className="text-slate-500 text-sm font-mono">{plan.period}</span>
                            </div>
                            <p className="text-slate-400 text-sm mt-2">{plan.description}</p>

                            <ul className="mt-8 space-y-3">
                                {plan.features.map((feature, j) => (
                                    <li key={j} className="flex items-center gap-3 text-sm text-slate-300">
                                        <Check className="h-4 w-4 text-neon-orange flex-shrink-0" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                <Link
                                    href="/signup"
                                    className="mt-8 block text-center py-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all duration-300 shimmer-hover bg-gradient-to-r from-[#ff6b00] to-[#ff8533] text-black btn-magnetic"
                                >
                                    {plan.cta}
                                </Link>
                            </motion.div>
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                className="text-center text-slate-600 text-xs font-mono mt-8"
            >
                Résiliable à tout moment. Sans engagement.
            </motion.p>
        </div>
    </section>
);

/* ─────────────────────────────────────────────
   SECTION 8 — FINAL CTA
   ───────────────────────────────────────────── */

const FinalCTA = () => (
    <section className="py-24 sm:py-32 lg:py-40 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh-gradient pointer-events-none" />
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] pointer-events-none" />
        <div className="absolute inset-0 noise-overlay pointer-events-none" />

        {/* Living orbs */}
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-[#ff6b00]/[0.06] orb pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-violet-600/[0.04] orb orb-2 pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
            <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={staggerContainer}
            >
                <motion.p variants={fadeUp} custom={0} className="text-slate-400 text-sm font-medium uppercase tracking-widest mb-6">
                    Prêt à transformer votre restaurant ?
                </motion.p>

                <motion.h2
                    variants={clipReveal}
                    custom={1}
                    className="font-display text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white uppercase tracking-tight leading-[1.1]"
                >
                    Commencez<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff6b00] to-[#ff8533] drop-shadow-[0_0_40px_rgba(255,107,0,0.3)]">dès maintenant</span>
                </motion.h2>

                <motion.div variants={fadeUp} custom={3} className="mt-10">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} className="inline-block">
                        <Link
                            href="/signup"
                            className="group relative inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-[#ff6b00] to-[#ff8533] text-black font-bold text-sm uppercase tracking-widest rounded-xl btn-magnetic shimmer-hover pulse-ring"
                        >
                            Créer mon compte
                            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                        </Link>
                    </motion.div>
                </motion.div>

                <motion.p variants={fadeUp} custom={4} className="mt-8 text-slate-600 text-xs font-mono">
                    Configuration en moins de 2 minutes · Sans carte bancaire
                </motion.p>
            </motion.div>
        </div>
    </section>
);

/* ─────────────────────────────────────────────
   LANDING PAGE EXPORT
   ───────────────────────────────────────────── */

export function LandingPage() {
    return (
        <div className="bg-rich-black min-h-screen text-white selection:bg-neon-orange selection:text-black">
            <Header />
            <main>
                <Hero />
                <Marquee />
                <BentoFeatures />
                <ProductShowcase />
                <Comparison />
                <Pricing />
                <FinalCTA />
            </main>
            <Footer />
        </div>
    );
}
