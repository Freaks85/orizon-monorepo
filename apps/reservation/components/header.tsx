"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { CalendarRange, Menu, X, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function Header() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [hidden, setHidden] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const { scrollY } = useScroll();

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    // Hide on scroll down, show on scroll up
    useMotionValueEvent(scrollY, "change", (latest) => {
        const previous = scrollY.getPrevious() ?? 0;
        setScrolled(latest > 50);
        setHidden(latest > previous && latest > 300);
    });

    // Lock body scroll when mobile menu is open
    useEffect(() => {
        document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [mobileMenuOpen]);

    const navLinks = [
        { label: "Fonctionnalités", href: "#features" },
        { label: "Produit", href: "#comparison" },
        { label: "Tarifs", href: "#pricing" },
    ];

    return (
        <motion.header
            initial={{ y: -100 }}
            animate={{ y: hidden ? -100 : 0 }}
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
            style={{
                background: scrolled
                    ? "rgba(5, 5, 5, 0.7)"
                    : isMobile
                        ? "rgba(5, 5, 5, 0.95)"
                        : "transparent",
                backdropFilter: scrolled || isMobile ? "blur(24px)" : "none",
                borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : isMobile ? "1px solid rgba(255,255,255,0.04)" : "1px solid transparent",
            }}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="h-16 sm:h-18 flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <motion.div
                            className="w-9 h-9 bg-gradient-to-br from-[#ff6b00] to-[#cc5500] rounded-xl flex items-center justify-center shadow-lg shadow-[#ff6b00]/20 group-hover:shadow-[#ff6b00]/40 transition-shadow duration-500"
                            whileHover={{ scale: 1.05, rotate: -3 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <CalendarRange className="h-4.5 w-4.5 text-black" />
                        </motion.div>
                        <div className="flex flex-col">
                            <span className="font-display font-bold text-base sm:text-lg tracking-wider text-white uppercase leading-none">
                                Orizon<span className="text-[#ff6b00]">Resa</span>
                            </span>
                            <span className="text-[8px] text-slate-600 font-mono tracking-[0.2em] uppercase hidden sm:block">
                                Réservation
                            </span>
                        </div>
                    </Link>

                    {/* Navigation Desktop — center */}
                    <nav className="hidden md:flex items-center gap-1 bg-white/[0.03] backdrop-blur-sm rounded-full px-1.5 py-1 border border-white/[0.06]">
                        {navLinks.map((link) => (
                            <a
                                key={link.label}
                                href={link.href}
                                className="nav-link-underline relative px-5 py-2 text-[13px] text-slate-400 hover:text-white transition-colors duration-300 font-medium tracking-wide rounded-full hover:bg-white/[0.04]"
                            >
                                {link.label}
                            </a>
                        ))}
                    </nav>

                    {/* Auth Buttons Desktop */}
                    <div className="hidden sm:flex items-center gap-3">
                        <Link
                            href="/login"
                            className="px-4 py-2 text-[13px] text-slate-400 hover:text-white transition-colors duration-300 font-medium tracking-wide"
                        >
                            Connexion
                        </Link>
                        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                            <Link
                                href="/signup"
                                className="group shimmer-hover btn-magnetic px-5 py-2.5 bg-gradient-to-r from-[#ff6b00] to-[#ff8533] text-black font-bold text-xs uppercase tracking-widest rounded-xl flex items-center gap-2"
                            >
                                Essai gratuit
                                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform duration-300" />
                            </Link>
                        </motion.div>
                    </div>

                    {/* Mobile Menu Button */}
                    <motion.button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2.5 text-slate-400 hover:text-white transition-colors rounded-xl hover:bg-white/[0.05]"
                        whileTap={{ scale: 0.9 }}
                    >
                        <AnimatePresence mode="wait">
                            {mobileMenuOpen ? (
                                <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                                    <X className="h-5 w-5" />
                                </motion.div>
                            ) : (
                                <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                                    <Menu className="h-5 w-5" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.button>
                </div>
            </div>

            {/* Mobile Menu — full screen overlay */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="md:hidden fixed inset-0 top-16 z-40"
                        style={{ background: "rgba(5, 5, 5, 0.98)", backdropFilter: "blur(24px)" }}
                    >
                        <nav className="flex flex-col p-6 pt-8 gap-2 h-full">
                            {navLinks.map((link, i) => (
                                <motion.a
                                    key={link.label}
                                    href={link.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ delay: i * 0.08, duration: 0.3 }}
                                    className="text-2xl font-display text-white uppercase tracking-wider py-4 border-b border-white/[0.06] hover:text-[#ff6b00] transition-colors duration-300"
                                >
                                    {link.label}
                                </motion.a>
                            ))}

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="mt-auto pb-12 flex flex-col gap-3"
                            >
                                <Link
                                    href="/login"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="text-center py-4 text-sm text-slate-400 hover:text-white transition-colors font-medium border border-white/10 rounded-xl"
                                >
                                    Connexion
                                </Link>
                                <Link
                                    href="/signup"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="text-center py-4 bg-gradient-to-r from-[#ff6b00] to-[#ff8533] text-black font-bold text-sm uppercase tracking-widest rounded-xl flex items-center justify-center gap-2"
                                >
                                    Essai gratuit
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </motion.div>
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.header>
    );
}
