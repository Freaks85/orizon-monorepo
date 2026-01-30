"use client";

import React from 'react';
import { ShieldCheck, Menu, X } from 'lucide-react';
import Link from 'next/link';

export const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    return (
        <header className="fixed top-0 w-full z-50 border-b border-white/10 bg-black/80 backdrop-blur-md">
            <div className="max-w-[1920px] mx-auto px-6 lg:px-12">
                <div className="flex justify-between items-center h-20">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="border border-neon-green/30 p-1.5 group-hover:border-neon-green transition-colors">
                            <ShieldCheck className="h-6 w-6 text-neon-green" />
                        </div>
                        <span className="font-display font-bold text-2xl tracking-widest text-white uppercase">
                            Orizons<span className="text-neon-green">Kitchen</span>
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center space-x-12">
                        <Link href="/features" className="text-xs font-bold tracking-[0.2em] text-slate-400 hover:text-neon-green uppercase transition-colors relative group">
                            Fonctionnalités
                            <span className="absolute -bottom-2 left-0 w-0 h-[1px] bg-neon-green group-hover:w-full transition-all duration-300"></span>
                        </Link>
                        <Link href="/pricing" className="text-xs font-bold tracking-[0.2em] text-slate-400 hover:text-neon-green uppercase transition-colors relative group">
                            Achat
                            <span className="absolute -bottom-2 left-0 w-0 h-[1px] bg-neon-green group-hover:w-full transition-all duration-300"></span>
                        </Link>
                    </nav>

                    {/* CTA */}
                    <div className="hidden md:flex items-center gap-6">
                        <Link href="/login" className="text-xs font-bold tracking-[0.1em] text-white hover:text-neon-green uppercase">
                            Connexion
                        </Link>
                        <Link href="/signup" className="bg-neon-green text-black px-6 py-2 text-xs font-bold tracking-[0.1em] uppercase hover:bg-white transition-colors">
                            Essai 7 Jours
                        </Link>
                    </div>

                    {/* Mobile menu button */}
                    <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden text-white">
                        {isMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden bg-black border-b border-white/10 p-4">
                    <nav className="flex flex-col space-y-4">
                        <Link href="/features" className="text-sm font-bold tracking-widest text-slate-400 hover:text-neon-green uppercase">Fonctionnalités</Link>
                        <Link href="/pricing" className="text-sm font-bold tracking-widest text-slate-400 hover:text-neon-green uppercase">Achat</Link>
                        <Link href="/login" className="text-sm font-bold tracking-widest text-white hover:text-neon-green uppercase">Connexion</Link>
                        <Link href="/signup" className="text-sm font-bold tracking-widest text-neon-green uppercase">Essai 7 Jours</Link>
                    </nav>
                </div>
            )}
        </header>
    );
};
