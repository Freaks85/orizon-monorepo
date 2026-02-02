"use client";

import { motion, useScroll, useTransform, useMotionValue } from 'framer-motion';
import {
    ArrowRight,
    Zap,
    Shield,
    Clock,
    Users,
    CalendarRange,
    LayoutGrid,
    Bell,
    Globe,
    Sparkles,
    CreditCard,
    Gift,
    TrendingUp,
    BadgePercent,
    ChevronDown
} from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { useState, useRef, useCallback } from 'react';

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

const clipReveal = {
    hidden: { clipPath: "inset(100% 0 0 0)", opacity: 0 },
    visible: (i: number = 0) => ({
        clipPath: "inset(0% 0 0 0)",
        opacity: 1,
        transition: { duration: 0.8, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] as const }
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

const allFeatures = [
    { icon: CalendarRange, text: "Réservations illimitées" },
    { icon: LayoutGrid, text: "Salles et tables illimitées" },
    { icon: Users, text: "Utilisateurs illimités" },
    { icon: Globe, text: "Page de réservation personnalisée" },
    { icon: Bell, text: "Notifications email automatiques" },
    { icon: TrendingUp, text: "Statistiques et rapports" },
    { icon: Shield, text: "Données sécurisées & RGPD" },
    { icon: Clock, text: "Support prioritaire" },
];

const savings = [
    { label: "Commission par réservation", competitor: "2-3€", us: "0€" },
    { label: "Frais de setup", competitor: "200-500€", us: "0€" },
    { label: "Coût mensuel moyen", competitor: "80-150€", us: "40€" },
];

const faqs = [
    {
        question: "L'essai gratuit est-il vraiment sans carte bancaire ?",
        answer: "Oui, aucune carte bancaire n'est demandée pour commencer votre essai de 7 jours. Vous aurez accès à toutes les fonctionnalités sans aucun engagement."
    },
    {
        question: "Que se passe-t-il après les 7 jours d'essai ?",
        answer: "À la fin de votre essai, vous pouvez choisir de vous abonner à 40€/mois pour continuer. Si vous ne souhaitez pas continuer, votre compte sera simplement désactivé. Aucune facturation automatique."
    },
    {
        question: "Puis-je annuler mon abonnement à tout moment ?",
        answer: "Absolument. Sans engagement, vous pouvez annuler à tout moment depuis votre espace. L'accès reste actif jusqu'à la fin de la période payée."
    },
    {
        question: "Y a-t-il des frais cachés ou des commissions ?",
        answer: "Non. 40€/mois, c'est tout. Pas de commission sur vos réservations, pas de frais de setup, pas de surcoût pour les fonctionnalités premium."
    },
    {
        question: "Combien de réservations puis-je gérer ?",
        answer: "Illimité. Que vous ayez 10 ou 1000 réservations par mois, le prix reste le même. Pas de paliers, pas de limites."
    }
];

/* ─────────────────────────────────────────────
   COMPONENTS
   ───────────────────────────────────────────── */

const PricingCard = ({ currentPrice, isAnnual }: { currentPrice: number; isAnnual: boolean }) => {
    const { ref, mouseX, mouseY, handleMouseMove } = useMouseGlow();

    return (
        <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
        >
            {/* Animated border glow */}
            <div className="absolute -inset-[1px] bg-gradient-to-r from-neon-orange/50 via-neon-orange/20 to-neon-orange/50 rounded-3xl blur-sm animate-pulse" />
            <div className="absolute -inset-6 bg-neon-orange/10 rounded-3xl blur-3xl" />

            <motion.div
                ref={ref}
                onMouseMove={handleMouseMove}
                className="group relative rounded-2xl border border-neon-orange/30 bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-10 sm:p-14 overflow-hidden backdrop-blur-sm"
            >
                {/* Mouse-following glow */}
                <motion.div
                    className="absolute w-96 h-96 bg-neon-orange/[0.08] rounded-full blur-3xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ x: mouseX, y: mouseY, translateX: "-50%", translateY: "-50%" }}
                />

                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-neon-orange/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-600/5 rounded-full blur-3xl" />

                <div className="relative z-10">
                    {/* Header */}
                    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-12">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 }}
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <motion.div
                                    className="w-14 h-14 rounded-xl bg-neon-orange/20 flex items-center justify-center"
                                    whileHover={{ rotate: -10, scale: 1.1 }}
                                    transition={{ type: "spring", stiffness: 300 }}
                                >
                                    <Sparkles className="w-7 h-7 text-neon-orange" />
                                </motion.div>
                                <div>
                                    <h2 className="font-display text-3xl text-white uppercase">Orizons Pro</h2>
                                    <p className="text-slate-400 text-base">Accès complet à toutes les fonctionnalités</p>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.4 }}
                            className="text-left lg:text-right"
                        >
                            <div className="flex items-baseline gap-2">
                                <motion.span
                                    key={currentPrice}
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="font-display text-7xl sm:text-8xl text-white"
                                >
                                    {currentPrice}€
                                </motion.span>
                                <span className="text-slate-400 text-xl">/mois</span>
                            </div>
                            {isAnnual && (
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-green-400 text-base mt-2"
                                >
                                    Facturé {currentPrice * 12}€/an
                                </motion.p>
                            )}
                        </motion.div>
                    </div>

                    {/* Features grid */}
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={staggerContainer}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-12"
                    >
                        {allFeatures.map((feature, index) => (
                            <motion.div
                                key={index}
                                variants={fadeUp}
                                custom={index}
                                whileHover={{ x: 6 }}
                                className="flex items-center gap-4 text-slate-300 group/item cursor-default"
                            >
                                <div className="w-10 h-10 rounded-lg bg-neon-orange/10 flex items-center justify-center shrink-0 group-hover/item:bg-neon-orange/20 transition-colors">
                                    <feature.icon className="w-5 h-5 text-neon-orange" />
                                </div>
                                <span className="text-base group-hover/item:text-white transition-colors">{feature.text}</span>
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* CTA */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5 }}
                    >
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Link
                                href="/signup"
                                className="group flex items-center justify-center gap-3 w-full px-8 py-6 bg-gradient-to-r from-[#ff6b00] to-[#ff8533] text-black font-bold text-base uppercase tracking-widest rounded-xl shimmer-hover relative overflow-hidden"
                            >
                                <span className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
                                <Gift className="w-5 h-5" />
                                Commencer l'essai gratuit
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </motion.div>
                    </motion.div>

                    {/* Trust badges */}
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={staggerContainer}
                        className="flex flex-wrap items-center justify-center gap-8 mt-10 pt-10 border-t border-white/[0.06]"
                    >
                        {[
                            { icon: CreditCard, text: "Sans carte bancaire" },
                            { icon: Clock, text: "Configuration en 2 min" },
                            { icon: Zap, text: "Sans engagement" }
                        ].map((badge, i) => (
                            <motion.div
                                key={i}
                                variants={fadeUp}
                                custom={i}
                                className="flex items-center gap-3 text-slate-400 text-base"
                            >
                                <badge.icon className="w-5 h-5" />
                                <span>{badge.text}</span>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </motion.div>
        </motion.div>
    );
};

const FAQItem = ({ faq, index, isOpen, onToggle }: { faq: typeof faqs[0]; index: number; isOpen: boolean; onToggle: () => void }) => {
    return (
        <motion.div
            variants={fadeUp}
            custom={index}
            className="rounded-2xl border border-white/[0.06] overflow-hidden"
        >
            <motion.button
                onClick={onToggle}
                className="w-full flex items-center justify-between p-8 text-left bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                whileHover={{ x: 4 }}
            >
                <span className="text-white font-medium text-lg pr-4">{faq.question}</span>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-10 h-10 rounded-full bg-neon-orange/10 flex items-center justify-center shrink-0"
                >
                    <ChevronDown className="w-5 h-5 text-neon-orange" />
                </motion.div>
            </motion.button>
            <motion.div
                initial={false}
                animate={{
                    height: isOpen ? "auto" : 0,
                    opacity: isOpen ? 1 : 0
                }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
            >
                <div className="px-8 pb-10 pt-4">
                    <p className="text-slate-300 text-lg leading-loose">{faq.answer}</p>
                </div>
            </motion.div>
        </motion.div>
    );
};

/* ─────────────────────────────────────────────
   PAGE
   ───────────────────────────────────────────── */

export default function PricingPage() {
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const [isAnnual, setIsAnnual] = useState(false);

    const monthlyPrice = 40;
    const annualPrice = 35;
    const currentPrice = isAnnual ? annualPrice : monthlyPrice;
    const annualSavings = (monthlyPrice - annualPrice) * 12;

    const heroRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: heroRef,
        offset: ["start start", "end start"]
    });
    const scale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);
    const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
    const yText = useTransform(scrollYProgress, [0, 1], [0, 150]);
    const yOrb1 = useTransform(scrollYProgress, [0, 1], [0, -100]);
    const yOrb2 = useTransform(scrollYProgress, [0, 1], [0, 80]);

    const heroWords = ["Un", "prix", "simple,", "tout", "inclus."];

    return (
        <div className="min-h-screen bg-rich-black">
            <Header />

            <main>
                {/* HERO SECTION - Full screen like landing page */}
                <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
                    {/* Living background */}
                    <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none" />
                    <div className="absolute inset-0 bg-mesh-gradient pointer-events-none" />
                    <div className="absolute inset-0 noise-overlay pointer-events-none" />

                    {/* Animated orbs */}
                    <motion.div
                        style={{ y: yOrb1 }}
                        className="absolute top-[15%] left-[10%] w-[500px] h-[500px] bg-[#ff6b00]/[0.07] orb pointer-events-none"
                    />
                    <motion.div
                        style={{ y: yOrb2 }}
                        className="absolute bottom-[10%] right-[5%] w-[400px] h-[400px] bg-violet-600/[0.05] orb orb-2 pointer-events-none"
                    />
                    <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#ff6b00]/[0.03] animate-glow-breathe rounded-full pointer-events-none" />

                    <motion.div style={{ scale, opacity, y: yText }} className="relative z-20 text-center px-4 max-w-6xl mx-auto">
                        {/* Badge */}
                        <motion.div
                            initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
                            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="mb-10 flex justify-center"
                        >
                            <span className="group inline-flex items-center gap-2.5 border border-green-500/30 text-green-400 px-6 py-3 text-xs font-bold tracking-[0.2em] uppercase bg-green-500/5 rounded-full hover:bg-green-500/10 hover:border-green-500/50 transition-all duration-500 cursor-default">
                                <Gift className="w-4 h-4 animate-pulse" />
                                7 jours d'essai gratuit — Sans carte bancaire
                                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                            </span>
                        </motion.div>

                        {/* Title — word-by-word clipPath reveal */}
                        <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl leading-[1.05] font-bold uppercase tracking-tight mb-10">
                            <motion.span
                                initial="hidden"
                                animate="visible"
                                variants={staggerContainer}
                                className="flex flex-wrap justify-center gap-x-4 md:gap-x-6"
                            >
                                {heroWords.map((word, i) => (
                                    <motion.span
                                        key={i}
                                        custom={i}
                                        variants={clipReveal}
                                        className={word === "inclus."
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
                            className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed"
                        >
                            Pas de commission sur vos réservations. Pas de frais cachés.
                            Pas de limites. Juste un abonnement mensuel transparent.
                        </motion.p>
                    </motion.div>

                    {/* Scroll indicator */}
                    <motion.div
                        style={{ opacity }}
                        className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2"
                    >
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 2 }}
                            className="flex flex-col items-center gap-2"
                        >
                            <span className="text-[10px] uppercase tracking-[0.2em] text-slate-600 font-mono">Scroll</span>
                            <motion.div
                                animate={{ y: [0, 8, 0] }}
                                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                            >
                                <ChevronDown className="w-5 h-5 text-neon-orange/70" />
                            </motion.div>
                            <div className="w-[1px] h-12 bg-gradient-to-b from-neon-orange/40 to-transparent" />
                        </motion.div>
                    </motion.div>
                </section>

                {/* PRICING CARD SECTION */}
                <section className="py-32 px-4 sm:px-6 relative overflow-hidden">
                    <div className="absolute inset-0 bg-dark-gunmetal" />
                    <div className="absolute inset-0 noise-overlay pointer-events-none opacity-30" />

                    <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-neon-orange/[0.04] rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-violet-600/[0.04] rounded-full blur-3xl pointer-events-none" />

                    <div className="max-w-5xl mx-auto relative z-10">
                        {/* Toggle Mensuel/Annuel */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="flex items-center justify-center gap-6 mb-16"
                        >
                            <span className={`text-base font-medium transition-colors ${!isAnnual ? 'text-white' : 'text-slate-500'}`}>
                                Mensuel
                            </span>
                            <motion.button
                                onClick={() => setIsAnnual(!isAnnual)}
                                className={`relative w-16 h-8 rounded-full transition-colors duration-300 ${isAnnual ? 'bg-neon-orange' : 'bg-white/10'}`}
                                whileTap={{ scale: 0.95 }}
                            >
                                <motion.div
                                    animate={{ x: isAnnual ? 32 : 4 }}
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                    className="absolute top-1 w-6 h-6 rounded-full bg-white"
                                />
                            </motion.button>
                            <span className={`text-base font-medium transition-colors flex items-center gap-3 ${isAnnual ? 'text-white' : 'text-slate-500'}`}>
                                Annuel
                                <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm font-bold"
                                >
                                    -{annualSavings}€/an
                                </motion.span>
                            </span>
                        </motion.div>

                        <PricingCard currentPrice={currentPrice} isAnnual={isAnnual} />
                    </div>
                </section>

                {/* COMPARISON SECTION */}
                <section className="py-32 px-4 sm:px-6 relative overflow-hidden">
                    <div className="absolute inset-0 noise-overlay pointer-events-none opacity-20" />

                    <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-neon-orange/[0.04] rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
                    <div className="absolute top-1/2 right-0 w-[350px] h-[350px] bg-violet-600/[0.04] rounded-full blur-3xl pointer-events-none -translate-y-1/2" />

                    <div className="max-w-5xl mx-auto relative z-10">
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={staggerContainer}
                            className="text-center mb-20"
                        >
                            <motion.div variants={scaleIn} custom={0} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-neon-orange/10 border border-neon-orange/20 text-neon-orange text-sm font-medium mb-8">
                                <BadgePercent className="w-4 h-4" />
                                Économisez avec Orizons
                            </motion.div>
                            <motion.h2 variants={clipReveal} custom={1} className="font-display text-4xl sm:text-5xl lg:text-6xl text-white uppercase mb-6">
                                Comparez et économisez
                            </motion.h2>
                            <motion.p variants={blurReveal} custom={2} className="text-slate-400 text-lg max-w-2xl mx-auto">
                                Les autres plateformes prennent des commissions sur chaque réservation.
                                Pas nous.
                            </motion.p>
                        </motion.div>

                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={staggerContainer}
                            className="rounded-2xl border border-white/[0.06] overflow-hidden backdrop-blur-sm"
                        >
                            {/* Header */}
                            <div className="grid grid-cols-3 gap-4 p-8 bg-white/[0.02] border-b border-white/[0.06]">
                                <div></div>
                                <div className="text-center">
                                    <p className="text-slate-400 text-base">Autres plateformes</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-neon-orange font-bold text-base">Orizons</p>
                                </div>
                            </div>

                            {/* Rows */}
                            {savings.map((item, index) => (
                                <motion.div
                                    key={index}
                                    variants={fadeUp}
                                    custom={index}
                                    whileHover={{ backgroundColor: "rgba(255,255,255,0.02)" }}
                                    className="grid grid-cols-3 gap-4 p-8 border-b border-white/[0.06] last:border-b-0 transition-colors"
                                >
                                    <div className="text-slate-300 text-base">{item.label}</div>
                                    <div className="text-center">
                                        <span className="text-red-400 text-lg line-through">{item.competitor}</span>
                                    </div>
                                    <div className="text-center">
                                        <motion.span
                                            whileHover={{ scale: 1.1 }}
                                            className="text-green-400 text-lg font-bold inline-block"
                                        >
                                            {item.us}
                                        </motion.span>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>

                        {/* Example calculation */}
                        <motion.div
                            initial={{ opacity: 0, y: 30, scale: 0.95 }}
                            whileInView={{ opacity: 1, y: 0, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 }}
                            whileHover={{ scale: 1.02 }}
                            className="mt-10 p-8 rounded-2xl bg-green-500/10 border border-green-500/20"
                        >
                            <div className="flex items-start gap-5">
                                <motion.div
                                    className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center shrink-0"
                                    animate={{ rotate: [0, 10, -10, 0] }}
                                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                                >
                                    <TrendingUp className="w-6 h-6 text-green-400" />
                                </motion.div>
                                <div>
                                    <p className="text-green-400 font-bold text-lg mb-2">Exemple concret</p>
                                    <p className="text-slate-300 text-base leading-relaxed">
                                        Avec 100 réservations/mois et une commission de 2€ par réservation,
                                        vous payez <span className="text-red-400 font-bold">200€/mois</span> ailleurs.
                                        Chez Orizons : <span className="text-green-400 font-bold">40€/mois</span>.
                                        Économie : <span className="text-green-400 font-bold">160€/mois</span> soit <span className="text-green-400 font-bold">1920€/an</span>.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* FAQ SECTION */}
                <section className="py-32 px-4 sm:px-6 relative overflow-hidden">
                    <div className="absolute inset-0 bg-dark-gunmetal" />
                    <div className="absolute inset-0 noise-overlay pointer-events-none opacity-30" />

                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-violet-600/[0.05] rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-[350px] h-[350px] bg-neon-orange/[0.04] rounded-full blur-3xl pointer-events-none" />

                    <div className="max-w-4xl mx-auto relative z-10">
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={staggerContainer}
                            className="text-center mb-16"
                        >
                            <motion.h2 variants={clipReveal} custom={0} className="font-display text-4xl sm:text-5xl lg:text-6xl text-white uppercase mb-6">
                                Questions fréquentes
                            </motion.h2>
                        </motion.div>

                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={staggerContainer}
                            className="space-y-5"
                        >
                            {faqs.map((faq, index) => (
                                <FAQItem
                                    key={index}
                                    faq={faq}
                                    index={index}
                                    isOpen={openFaq === index}
                                    onToggle={() => setOpenFaq(openFaq === index ? null : index)}
                                />
                            ))}
                        </motion.div>
                    </div>
                </section>

                {/* FINAL CTA SECTION */}
                <section className="py-40 px-4 sm:px-6 relative overflow-hidden">
                    <div className="absolute inset-0 bg-mesh-gradient pointer-events-none" />
                    <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] pointer-events-none" />
                    <div className="absolute inset-0 noise-overlay pointer-events-none" />

                    <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#ff6b00]/[0.07] orb pointer-events-none" />
                    <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-violet-600/[0.05] orb orb-2 pointer-events-none" />

                    <div className="max-w-5xl mx-auto text-center relative z-10">
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={staggerContainer}
                        >
                            <motion.div variants={scaleIn} custom={0} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium mb-10">
                                <Gift className="w-4 h-4" />
                                Essai gratuit de 7 jours
                            </motion.div>

                            <motion.h2
                                variants={clipReveal}
                                custom={1}
                                className="font-display text-5xl sm:text-6xl lg:text-7xl xl:text-8xl text-white uppercase mb-8"
                            >
                                Prêt à essayer ?
                            </motion.h2>

                            <motion.p variants={blurReveal} custom={2} className="text-slate-400 text-xl mb-14 max-w-2xl mx-auto leading-relaxed">
                                Testez Orizons gratuitement pendant 7 jours.
                                Sans carte bancaire. Sans engagement.
                            </motion.p>

                            <motion.div variants={scaleIn} custom={3}>
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.97 }}
                                    className="inline-block"
                                >
                                    <Link
                                        href="/signup"
                                        className="group inline-flex items-center gap-4 px-12 py-6 bg-gradient-to-r from-[#ff6b00] to-[#ff8533] text-black font-bold text-base uppercase tracking-widest rounded-xl shimmer-hover relative overflow-hidden"
                                    >
                                        <span className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
                                        Démarrer mon essai gratuit
                                        <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                </motion.div>
                            </motion.div>

                            <motion.p variants={fadeUp} custom={4} className="text-slate-500 text-base mt-8">
                                Puis 40€/mois · Sans engagement · Annulable à tout moment
                            </motion.p>
                        </motion.div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
