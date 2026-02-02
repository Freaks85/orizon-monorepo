"use client";

import { motion, useScroll, useTransform, useMotionValue } from 'framer-motion';
import {
    CalendarRange,
    LayoutGrid,
    Palette,
    Bell,
    BarChart3,
    Users,
    Clock,
    Mail,
    Shield,
    Smartphone,
    Globe,
    Zap,
    Check,
    ArrowRight,
    QrCode,
    Sparkles,
    ChevronDown,
} from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { useRef, useCallback } from 'react';

/* ─────────────────────────────────────────────
   ANIMATIONS
   ───────────────────────────────────────────── */

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

const wordReveal = {
    hidden: {
        clipPath: "inset(100% 0 0 0)",
        y: 40,
    },
    visible: (i: number) => ({
        clipPath: "inset(0% 0 0 0)",
        y: 0,
        transition: {
            duration: 0.8,
            delay: 0.3 + i * 0.08,
            ease: [0.22, 1, 0.36, 1] as const,
        }
    })
};

const blurReveal = {
    hidden: { opacity: 0, y: 20, filter: "blur(10px)" },
    visible: (i: number = 0) => ({
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: { duration: 0.8, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] as const }
    })
};

const scaleIn = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: (i: number = 0) => ({
        opacity: 1,
        scale: 1,
        transition: { duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] as const }
    })
};

// Mouse-aware glow hook
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

/* ─────────────────────────────────────────────
   DATA
   ───────────────────────────────────────────── */

const heroFeatures = [
    {
        icon: CalendarRange,
        title: "Réservations illimitées",
        description: "Acceptez autant de réservations que vous le souhaitez, sans commission ni limite mensuelle. Votre succès ne devrait pas être taxé."
    },
    {
        icon: LayoutGrid,
        title: "Plans de salle visuels",
        description: "Créez vos plans de salle en glisser-déposer et visualisez votre occupation en temps réel. Une vue d'ensemble parfaite."
    },
    {
        icon: Globe,
        title: "Page de réservation",
        description: "Une URL personnalisée pour vos clients avec votre logo et vos couleurs. Professionnelle et à votre image."
    }
];

const featureGroups = [
    {
        title: "Gestion simplifiée",
        icon: CalendarRange,
        items: [
            "Multi-services (midi, soir, brunch)",
            "Cahier de réservations digital",
            "Modification en temps réel",
            "Gestion multi-salles"
        ]
    },
    {
        title: "Communication",
        icon: Mail,
        items: [
            "Emails de confirmation automatiques",
            "Rappels clients programmés",
            "Notifications à chaque réservation",
            "Templates personnalisables"
        ]
    },
    {
        title: "Statistiques",
        icon: BarChart3,
        items: [
            "Tableau de bord analytique",
            "Taux d'occupation en temps réel",
            "Export CSV des données",
            "Historique complet"
        ]
    }
];

const keyBenefits = [
    { icon: Zap, text: "Mise en place en 5 minutes" },
    { icon: Smartphone, text: "Compatible mobile, tablette, desktop" },
    { icon: QrCode, text: "QR code pour vos tables" },
    { icon: Shield, text: "Données sécurisées & RGPD" },
    { icon: Clock, text: "Disponible 24/7" },
    { icon: Bell, text: "Support prioritaire" }
];

/* ─────────────────────────────────────────────
   COMPONENTS
   ───────────────────────────────────────────── */

const FeatureCard = ({ feature, index }: { feature: typeof heroFeatures[0]; index: number }) => {
    const { ref, mouseX, mouseY, handleMouseMove } = useMouseGlow();

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouseMove}
            variants={fadeUp}
            custom={index}
            whileHover={{ y: -12, transition: { duration: 0.3 } }}
            className="group relative p-10 rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-transparent overflow-hidden"
        >
            {/* Mouse-following glow */}
            <motion.div
                className="absolute w-80 h-80 bg-neon-orange/[0.1] rounded-full blur-3xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ x: mouseX, y: mouseY, translateX: "-50%", translateY: "-50%" }}
            />

            {/* Corner accent */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-neon-orange/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative z-10">
                <motion.div
                    className="w-16 h-16 rounded-2xl bg-neon-orange/10 flex items-center justify-center mb-8 group-hover:bg-neon-orange/20 transition-all duration-300"
                    whileHover={{ rotate: -10, scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                >
                    <feature.icon className="h-8 w-8 text-neon-orange" />
                </motion.div>
                <h3 className="font-display text-2xl lg:text-3xl text-white uppercase mb-4 tracking-wide">
                    {feature.title}
                </h3>
                <p className="text-slate-400 text-lg leading-relaxed">
                    {feature.description}
                </p>
            </div>

            {/* Animated corner dot */}
            <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="w-2 h-2 bg-neon-orange rounded-full animate-pulse" />
            </div>
        </motion.div>
    );
};

const FeatureGroupCard = ({ group, index }: { group: typeof featureGroups[0]; index: number }) => {
    const { ref, mouseX, mouseY, handleMouseMove } = useMouseGlow();

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouseMove}
            variants={fadeUp}
            custom={index}
            whileHover={{ y: -8 }}
            className="group relative p-8 lg:p-10 rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden"
        >
            {/* Mouse glow */}
            <motion.div
                className="absolute w-64 h-64 bg-neon-orange/[0.08] rounded-full blur-3xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ x: mouseX, y: mouseY, translateX: "-50%", translateY: "-50%" }}
            />

            <div className="relative z-10">
                <h3 className="font-display text-2xl text-white uppercase mb-8 tracking-wide flex items-center gap-4">
                    <motion.span
                        className="w-3 h-3 rounded-full bg-neon-orange"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                    />
                    {group.title}
                </h3>
                <ul className="space-y-5">
                    {group.items.map((item, itemIndex) => (
                        <motion.li
                            key={itemIndex}
                            className="flex items-start gap-4 text-slate-300 text-lg group/item cursor-default"
                            whileHover={{ x: 6 }}
                        >
                            <Check className="h-6 w-6 text-neon-orange shrink-0 mt-0.5 group-hover/item:scale-110 transition-transform" />
                            <span className="group-hover/item:text-white transition-colors">{item}</span>
                        </motion.li>
                    ))}
                </ul>
            </div>
        </motion.div>
    );
};

/* ─────────────────────────────────────────────
   PAGE
   ───────────────────────────────────────────── */

export default function FeaturesPage() {
    // Hero parallax
    const heroRef = useRef(null);
    const { scrollYProgress: heroScrollProgress } = useScroll({
        target: heroRef,
        offset: ["start start", "end start"]
    });
    const yOrb1 = useTransform(heroScrollProgress, [0, 1], [0, -200]);
    const yOrb2 = useTransform(heroScrollProgress, [0, 1], [0, 150]);
    const yOrb3 = useTransform(heroScrollProgress, [0, 1], [0, -100]);

    // Demo section
    const demoRef = useRef(null);
    const { scrollYProgress: demoProgress } = useScroll({
        target: demoRef,
        offset: ["start end", "center center"]
    });
    const demoScale = useTransform(demoProgress, [0, 1], [0.85, 1]);
    const demoOpacity = useTransform(demoProgress, [0, 0.5], [0, 1]);

    // Hero title words
    const titleLine1 = ["Tout", "ce", "dont"];
    const titleLine2 = ["vous", "avez", "besoin"];

    return (
        <div className="min-h-screen bg-rich-black">
            <Header />

            <main>
                {/* ═══════════════════════════════════════════════
                    HERO SECTION - Full Screen
                   ═══════════════════════════════════════════════ */}
                <section
                    ref={heroRef}
                    className="relative min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 overflow-hidden"
                >
                    {/* Background layers */}
                    <div className="absolute inset-0 bg-mesh-gradient pointer-events-none" />
                    <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none" />
                    <div className="absolute inset-0 noise-overlay pointer-events-none" />

                    {/* Parallax Orbs */}
                    <motion.div
                        style={{ y: yOrb1 }}
                        className="absolute top-[10%] left-[5%] w-[600px] h-[600px] bg-[#ff6b00]/[0.08] rounded-full blur-[120px] pointer-events-none"
                    />
                    <motion.div
                        style={{ y: yOrb2 }}
                        className="absolute bottom-[5%] right-[0%] w-[500px] h-[500px] bg-violet-600/[0.06] rounded-full blur-[100px] pointer-events-none"
                    />
                    <motion.div
                        style={{ y: yOrb3 }}
                        className="absolute top-[40%] right-[20%] w-[400px] h-[400px] bg-[#ff6b00]/[0.04] rounded-full blur-[80px] pointer-events-none"
                    />

                    {/* Center glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#ff6b00]/[0.03] rounded-full blur-[150px] animate-glow-breathe pointer-events-none" />

                    {/* Content */}
                    <div className="relative z-10 max-w-6xl mx-auto text-center">
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={staggerContainer}
                        >
                            {/* Badge */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.1 }}
                                className="mb-10 flex justify-center"
                            >
                                <span className="group inline-flex items-center gap-3 border border-neon-orange/30 text-neon-orange px-6 py-2.5 text-[10px] font-bold tracking-[0.3em] uppercase bg-neon-orange/5 rounded-full hover:bg-neon-orange/10 hover:border-neon-orange/50 transition-all duration-500 cursor-default">
                                    <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                                    Fonctionnalités complètes
                                    <span className="w-2 h-2 bg-neon-orange rounded-full animate-pulse" />
                                </span>
                            </motion.div>

                            {/* Title with word-by-word reveal */}
                            <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl text-white uppercase mb-8 leading-[0.9]">
                                <span className="block overflow-hidden">
                                    {titleLine1.map((word, i) => (
                                        <motion.span
                                            key={i}
                                            custom={i}
                                            variants={wordReveal}
                                            initial="hidden"
                                            animate="visible"
                                            className="inline-block mr-[0.3em]"
                                        >
                                            {word}
                                        </motion.span>
                                    ))}
                                </span>
                                <span className="block overflow-hidden mt-2">
                                    {titleLine2.map((word, i) => (
                                        <motion.span
                                            key={i}
                                            custom={i + titleLine1.length}
                                            variants={wordReveal}
                                            initial="hidden"
                                            animate="visible"
                                            className={`inline-block mr-[0.3em] ${i === titleLine2.length - 1 ? 'text-transparent bg-clip-text bg-gradient-to-r from-[#ff6b00] to-[#ff8533] drop-shadow-[0_0_60px_rgba(255,107,0,0.5)]' : ''}`}
                                        >
                                            {word}
                                        </motion.span>
                                    ))}
                                </span>
                            </h1>

                            {/* Subtitle */}
                            <motion.p
                                variants={blurReveal}
                                custom={8}
                                className="text-slate-400 text-lg sm:text-xl lg:text-2xl max-w-3xl mx-auto leading-relaxed"
                            >
                                Une solution complète pour gérer vos réservations.<br className="hidden sm:block" />
                                <span className="text-white/80">Sans commission. Sans limites. Sans compromis.</span>
                            </motion.p>
                        </motion.div>
                    </div>

                    {/* Scroll indicator */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.5, duration: 0.8 }}
                        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
                    >
                        <span className="text-slate-500 text-xs uppercase tracking-[0.2em]">Découvrir</span>
                        <motion.div
                            animate={{ y: [0, 8, 0] }}
                            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                        >
                            <ChevronDown className="w-5 h-5 text-slate-500" />
                        </motion.div>
                    </motion.div>
                </section>

                {/* ═══════════════════════════════════════════════
                    3 MAIN FEATURES - Large Cards
                   ═══════════════════════════════════════════════ */}
                <section className="py-32 lg:py-40 px-4 sm:px-6 relative overflow-hidden">
                    {/* Background effects */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] bg-neon-orange/[0.03] rounded-full blur-[150px] pointer-events-none" />

                    <div className="max-w-7xl mx-auto relative z-10">
                        {/* Section header */}
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-100px" }}
                            variants={staggerContainer}
                            className="text-center mb-20"
                        >
                            <motion.div variants={scaleIn} custom={0} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neon-orange/10 border border-neon-orange/20 text-neon-orange text-sm font-medium mb-6">
                                <Zap className="w-4 h-4" />
                                Fonctionnalités principales
                            </motion.div>
                            <motion.h2
                                variants={blurReveal}
                                custom={1}
                                className="font-display text-4xl sm:text-5xl lg:text-6xl text-white uppercase"
                            >
                                L'essentiel, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff6b00] to-[#ff8533]">en mieux</span>
                            </motion.h2>
                        </motion.div>

                        {/* Feature cards grid */}
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-50px" }}
                            variants={staggerContainer}
                            className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10"
                        >
                            {heroFeatures.map((feature, index) => (
                                <FeatureCard key={index} feature={feature} index={index} />
                            ))}
                        </motion.div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════
                    FEATURE LISTS - All Included
                   ═══════════════════════════════════════════════ */}
                <section className="py-32 lg:py-40 px-4 sm:px-6 relative border-t border-white/[0.06] bg-dark-gunmetal overflow-hidden">
                    <div className="absolute inset-0 noise-overlay pointer-events-none opacity-30" />
                    <div className="absolute inset-0 bg-mesh-gradient pointer-events-none opacity-50" />

                    {/* Decorative orbs */}
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-600/[0.05] rounded-full blur-[120px] pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-neon-orange/[0.04] rounded-full blur-[100px] pointer-events-none" />

                    <div className="max-w-7xl mx-auto relative z-10">
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-100px" }}
                            variants={staggerContainer}
                            className="text-center mb-20"
                        >
                            <motion.div variants={scaleIn} custom={0} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neon-orange/10 border border-neon-orange/20 text-neon-orange text-sm font-medium mb-6">
                                <Sparkles className="w-4 h-4" />
                                Tout inclus
                            </motion.div>
                            <motion.h2
                                variants={blurReveal}
                                custom={1}
                                className="font-display text-4xl sm:text-5xl lg:text-6xl text-white uppercase mb-6"
                            >
                                Fonctionnalités incluses
                            </motion.h2>
                            <motion.p variants={blurReveal} custom={2} className="text-slate-400 text-lg lg:text-xl max-w-2xl mx-auto">
                                Tout est compris dans l'abonnement. Pas de modules supplémentaires à payer.
                            </motion.p>
                        </motion.div>

                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-50px" }}
                            variants={staggerContainer}
                            className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10"
                        >
                            {featureGroups.map((group, index) => (
                                <FeatureGroupCard key={index} group={group} index={index} />
                            ))}
                        </motion.div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════
                    BENEFITS BAR
                   ═══════════════════════════════════════════════ */}
                <section className="py-16 lg:py-20 px-4 sm:px-6 relative border-t border-white/[0.06] bg-white/[0.02] overflow-hidden">
                    <div className="max-w-7xl mx-auto">
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={staggerContainer}
                            className="flex flex-wrap justify-center gap-x-12 gap-y-6"
                        >
                            {keyBenefits.map((benefit, index) => (
                                <motion.div
                                    key={index}
                                    variants={fadeUp}
                                    custom={index}
                                    whileHover={{ scale: 1.08, y: -4 }}
                                    className="flex items-center gap-3 text-slate-300 cursor-default"
                                >
                                    <motion.div
                                        whileHover={{ rotate: 15 }}
                                        className="text-neon-orange"
                                    >
                                        <benefit.icon className="h-5 w-5" />
                                    </motion.div>
                                    <span className="text-base">{benefit.text}</span>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════
                    VISUAL DEMO SECTION
                   ═══════════════════════════════════════════════ */}
                <section ref={demoRef} className="py-32 lg:py-40 px-4 sm:px-6 relative border-t border-white/[0.06] overflow-hidden">
                    {/* Background effects */}
                    <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-neon-orange/[0.05] rounded-full blur-[120px] pointer-events-none" />
                    <div className="absolute bottom-1/4 left-0 w-[400px] h-[400px] bg-violet-600/[0.04] rounded-full blur-[100px] pointer-events-none" />

                    <div className="max-w-7xl mx-auto relative z-10">
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-100px" }}
                            variants={staggerContainer}
                            className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center"
                        >
                            <motion.div variants={blurReveal} custom={0}>
                                <motion.span
                                    variants={scaleIn}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neon-orange/10 border border-neon-orange/20 text-neon-orange text-sm font-medium mb-6"
                                >
                                    <Palette className="w-4 h-4" />
                                    Interface intuitive
                                </motion.span>
                                <motion.h2
                                    variants={blurReveal}
                                    custom={1}
                                    className="font-display text-4xl sm:text-5xl lg:text-6xl text-white uppercase mt-4 mb-8"
                                >
                                    Conçu pour les<br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff6b00] to-[#ff8533]">restaurateurs</span>
                                </motion.h2>
                                <motion.p variants={blurReveal} custom={2} className="text-slate-400 text-lg lg:text-xl mb-12 leading-relaxed">
                                    Pas besoin de formation. L'interface est pensée pour être utilisée
                                    en plein service, même avec une main occupée. Visualisez vos réservations
                                    d'un coup d'œil et réagissez instantanément.
                                </motion.p>
                                <motion.div
                                    variants={staggerContainer}
                                    className="space-y-6"
                                >
                                    {[
                                        { icon: Users, title: "Multi-utilisateurs", desc: "Toute l'équipe peut accéder au système simultanément" },
                                        { icon: Palette, title: "Personnalisable", desc: "Adaptez l'interface à votre marque et vos couleurs" },
                                        { icon: Mail, title: "Communication automatisée", desc: "Plus besoin de rappeler manuellement vos clients" }
                                    ].map((item, i) => (
                                        <motion.div
                                            key={i}
                                            variants={fadeUp}
                                            custom={i + 3}
                                            whileHover={{ x: 10 }}
                                            className="flex items-center gap-5 group cursor-default"
                                        >
                                            <motion.div
                                                className="w-12 h-12 rounded-xl bg-neon-orange/10 flex items-center justify-center group-hover:bg-neon-orange/20 transition-colors"
                                                whileHover={{ rotate: -10 }}
                                            >
                                                <item.icon className="h-6 w-6 text-neon-orange" />
                                            </motion.div>
                                            <div>
                                                <p className="text-white font-medium text-lg group-hover:text-neon-orange transition-colors">{item.title}</p>
                                                <p className="text-slate-400">{item.desc}</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            </motion.div>

                            {/* Mock Dashboard with 3D effect */}
                            <motion.div
                                style={{ scale: demoScale, opacity: demoOpacity }}
                                className="relative"
                            >
                                {/* Glow behind */}
                                <div className="absolute -inset-12 bg-neon-orange/[0.08] blur-[80px] rounded-full pointer-events-none animate-glow-breathe" />

                                <motion.div
                                    whileHover={{ rotateY: -5, rotateX: 5 }}
                                    transition={{ type: "spring", stiffness: 100 }}
                                    style={{ transformPerspective: 1200 }}
                                    className="relative rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-transparent p-8 overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-neon-orange/5 rounded-full blur-3xl" />

                                    {/* Mini calendar preview */}
                                    <div className="relative z-10 space-y-5">
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="flex items-center gap-4">
                                                <motion.div
                                                    className="w-10 h-10 rounded-xl bg-neon-orange/20"
                                                    animate={{ rotate: [0, 5, -5, 0] }}
                                                    transition={{ repeat: Infinity, duration: 4 }}
                                                />
                                                <div className="h-5 w-40 bg-white/20 rounded" />
                                            </div>
                                            <div className="flex gap-3">
                                                <div className="h-10 w-10 bg-white/10 rounded-xl" />
                                                <div className="h-10 w-10 bg-white/10 rounded-xl" />
                                            </div>
                                        </div>

                                        {/* Time slots mock */}
                                        <div className="space-y-4">
                                            {[
                                                { time: "12:00", name: "Martin", count: 4, status: "confirmed" },
                                                { time: "12:30", name: "Dubois", count: 2, status: "pending" },
                                                { time: "13:00", name: "Bernard", count: 6, status: "confirmed" },
                                                { time: "19:30", name: "Petit", count: 3, status: "confirmed" },
                                            ].map((slot, i) => (
                                                <motion.div
                                                    key={i}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    whileInView={{ opacity: 1, x: 0 }}
                                                    viewport={{ once: true }}
                                                    transition={{ delay: i * 0.1 }}
                                                    whileHover={{ x: 6, backgroundColor: "rgba(255,255,255,0.04)" }}
                                                    className="flex items-center gap-5 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] transition-colors"
                                                >
                                                    <span className="text-slate-400 text-base font-mono w-16">{slot.time}</span>
                                                    <div className="flex-1">
                                                        <p className="text-white">{slot.name}</p>
                                                        <p className="text-slate-500 text-sm">{slot.count} personnes</p>
                                                    </div>
                                                    <motion.div
                                                        className={`w-3 h-3 rounded-full ${slot.status === 'confirmed' ? 'bg-green-500' : 'bg-yellow-500'}`}
                                                        animate={{ scale: [1, 1.2, 1] }}
                                                        transition={{ repeat: Infinity, duration: 2, delay: i * 0.2 }}
                                                    />
                                                </motion.div>
                                            ))}
                                        </div>

                                        {/* Stats bar */}
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            whileInView={{ opacity: 1 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: 0.5 }}
                                            className="flex justify-between pt-6 border-t border-white/[0.06]"
                                        >
                                            {[
                                                { value: "24", label: "Réservations", color: "text-white" },
                                                { value: "85%", label: "Occupation", color: "text-neon-orange" },
                                                { value: "68", label: "Couverts", color: "text-white" }
                                            ].map((stat, i) => (
                                                <motion.div
                                                    key={i}
                                                    className="text-center"
                                                    whileHover={{ scale: 1.1 }}
                                                >
                                                    <p className={`text-3xl font-display ${stat.color}`}>{stat.value}</p>
                                                    <p className="text-sm text-slate-500">{stat.label}</p>
                                                </motion.div>
                                            ))}
                                        </motion.div>
                                    </div>
                                </motion.div>
                            </motion.div>
                        </motion.div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════
                    PRICING CTA - Full Impact
                   ═══════════════════════════════════════════════ */}
                <section className="py-32 lg:py-40 px-4 sm:px-6 relative overflow-hidden border-t border-white/[0.06]">
                    <div className="absolute inset-0 bg-mesh-gradient pointer-events-none" />
                    <div className="absolute inset-0 noise-overlay pointer-events-none" />

                    {/* Large orbs */}
                    <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-[#ff6b00]/[0.08] rounded-full blur-[150px] pointer-events-none animate-glow-breathe" />
                    <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-violet-600/[0.05] rounded-full blur-[120px] pointer-events-none" />

                    <div className="max-w-5xl mx-auto relative z-10">
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-100px" }}
                            variants={staggerContainer}
                            className="text-center"
                        >
                            <motion.div variants={scaleIn} custom={0} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-neon-orange/10 border border-neon-orange/20 mb-10">
                                <BarChart3 className="h-4 w-4 text-neon-orange" />
                                <span className="text-neon-orange text-sm font-medium">Toutes les fonctionnalités incluses</span>
                            </motion.div>

                            <motion.h2
                                variants={blurReveal}
                                custom={1}
                                className="font-display text-5xl sm:text-6xl lg:text-7xl xl:text-8xl text-white uppercase mb-6"
                            >
                                40€<span className="text-slate-500 text-3xl sm:text-4xl lg:text-5xl">/mois</span>
                            </motion.h2>

                            <motion.p variants={blurReveal} custom={2} className="text-slate-400 text-xl lg:text-2xl mb-12 max-w-2xl mx-auto">
                                Sans commission sur vos réservations. Sans engagement. Résiliable à tout moment.
                            </motion.p>

                            <motion.div variants={scaleIn} custom={3}>
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.97 }}
                                    className="inline-block"
                                >
                                    <Link
                                        href="/signup"
                                        className="group inline-flex items-center gap-4 px-12 py-6 bg-gradient-to-r from-[#ff6b00] to-[#ff8533] text-black font-bold text-base uppercase tracking-widest rounded-2xl btn-magnetic shimmer-hover relative overflow-hidden"
                                    >
                                        <span className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
                                        Commencer maintenant
                                        <ArrowRight className="h-5 w-5 group-hover:translate-x-2 transition-transform duration-300" />
                                    </Link>
                                </motion.div>
                            </motion.div>

                            <motion.p
                                variants={blurReveal}
                                custom={4}
                                className="text-slate-500 text-sm mt-8"
                            >
                                7 jours d'essai gratuit • Aucune carte bancaire requise
                            </motion.p>
                        </motion.div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
