"use client";

import { CalendarRange } from 'lucide-react';
import Link from 'next/link';

export function Footer() {
    return (
        <footer className="py-12 px-6 border-t border-white/5">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#ff6b00] rounded-lg flex items-center justify-center">
                        <CalendarRange className="h-4 w-4 text-black" />
                    </div>
                    <span className="font-display font-bold tracking-wider text-white uppercase">
                        OrizonReservation
                    </span>
                </Link>

                {/* Links */}
                <nav className="flex items-center gap-6">
                    <Link
                        href="https://orizonapp.vercel.app"
                        className="text-sm text-slate-500 hover:text-slate-400 transition-colors font-mono"
                    >
                        OrizonApp
                    </Link>
                    <Link
                        href="https://kitchen-orizonapp.vercel.app"
                        className="text-sm text-slate-500 hover:text-slate-400 transition-colors font-mono"
                    >
                        OrizonKitchen
                    </Link>
                </nav>

                {/* Copyright */}
                <p className="text-slate-500 text-sm font-mono">
                    © 2024 OrizonApp. Tous droits reserves.
                </p>
            </div>
        </footer>
    );
}
