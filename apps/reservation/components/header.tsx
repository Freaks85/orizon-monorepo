"use client";

import { motion } from 'framer-motion';
import { CalendarRange } from 'lucide-react';
import Link from 'next/link';

export function Header() {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-3">
                    <motion.div
                        className="w-10 h-10 bg-[#ff6b00] rounded-xl flex items-center justify-center"
                        whileHover={{ scale: 1.05 }}
                    >
                        <CalendarRange className="h-5 w-5 text-black" />
                    </motion.div>
                    <span className="font-display font-bold text-xl tracking-wider text-white uppercase">
                        Orizon<span className="text-[#ff6b00]">Reservation</span>
                    </span>
                </Link>

                {/* Navigation */}
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

                {/* Auth Buttons */}
                <div className="flex items-center gap-3">
                    <Link
                        href="/login"
                        className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors font-mono uppercase tracking-wider"
                    >
                        Connexion
                    </Link>
                    <Link
                        href="/signup"
                        className="px-5 py-2.5 bg-[#ff6b00] text-black font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-[#ff8533] transition-colors"
                    >
                        Essai gratuit
                    </Link>
                </div>
            </div>
        </header>
    );
}
