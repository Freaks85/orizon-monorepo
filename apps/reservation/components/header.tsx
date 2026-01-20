"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarRange, Menu, X } from 'lucide-react';
import Link from 'next/link';

export function Header() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 sm:gap-3">
                    <motion.div
                        className="w-8 h-8 sm:w-10 sm:h-10 bg-[#ff6b00] rounded-lg sm:rounded-xl flex items-center justify-center"
                        whileHover={{ scale: 1.05 }}
                    >
                        <CalendarRange className="h-4 w-4 sm:h-5 sm:w-5 text-black" />
                    </motion.div>
                    <span className="font-display font-bold text-base sm:text-xl tracking-wider text-white uppercase">
                        Orizon<span className="text-[#ff6b00] hidden xs:inline">Reservation</span><span className="text-[#ff6b00] xs:hidden">Resa</span>
                    </span>
                </Link>

                {/* Navigation Desktop */}
                <nav className="hidden md:flex items-center gap-8">
                    <a
                        href="#features"
                        className="text-sm text-slate-400 hover:text-white transition-colors font-mono uppercase tracking-wider"
                    >
                        Fonctionnalites
                    </a>
                    <a
                        href="#comparison"
                        className="text-sm text-slate-400 hover:text-white transition-colors font-mono uppercase tracking-wider"
                    >
                        Avantages
                    </a>
                </nav>

                {/* Auth Buttons Desktop */}
                <div className="hidden sm:flex items-center gap-3">
                    <Link
                        href="/login"
                        className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors font-mono uppercase tracking-wider"
                    >
                        Connexion
                    </Link>
                    <Link
                        href="/signup"
                        className="px-4 sm:px-5 py-2 sm:py-2.5 bg-[#ff6b00] text-black font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-[#ff8533] transition-colors"
                    >
                        Essai gratuit
                    </Link>
                </div>

                {/* Mobile Menu Button */}
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="sm:hidden p-2 text-slate-400 hover:text-white transition-colors"
                >
                    {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="sm:hidden bg-[#050505]/95 backdrop-blur-xl border-b border-white/10 overflow-hidden"
                    >
                        <nav className="flex flex-col p-4 gap-4">
                            <a
                                href="#features"
                                onClick={() => setMobileMenuOpen(false)}
                                className="text-sm text-slate-400 hover:text-white transition-colors font-mono uppercase tracking-wider py-2"
                            >
                                Fonctionnalites
                            </a>
                            <a
                                href="#comparison"
                                onClick={() => setMobileMenuOpen(false)}
                                className="text-sm text-slate-400 hover:text-white transition-colors font-mono uppercase tracking-wider py-2"
                            >
                                Avantages
                            </a>
                            <div className="border-t border-white/10 pt-4 flex flex-col gap-3">
                                <Link
                                    href="/login"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="text-center py-3 text-sm text-slate-400 hover:text-white transition-colors font-mono uppercase tracking-wider border border-white/10 rounded-lg"
                                >
                                    Connexion
                                </Link>
                                <Link
                                    href="/signup"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="text-center py-3 bg-[#ff6b00] text-black font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-[#ff8533] transition-colors"
                                >
                                    Essai gratuit
                                </Link>
                            </div>
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}
