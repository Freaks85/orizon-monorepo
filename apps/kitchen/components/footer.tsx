"use client";

import React from 'react';
import Link from 'next/link';

export const Footer = () => {
    return (
        <footer className="bg-black border-t border-white/10 py-24 relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none"></div>
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-start gap-12">
                    <div>
                        <h2 className="font-display text-4xl text-white uppercase mb-2">OrizonKitchen</h2>
                        <p className="font-mono text-xs text-neon-green uppercase tracking-[0.2em]">Command Center v2.0</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-12">
                        {[
                            { title: "Système", links: ["Status", "Updates", "Security"] },
                            { title: "Légal", links: ["Privacy", "Terms", "Compliance"] },
                            { title: "Contact", links: ["Support", "Sales", "HQ"] }
                        ].map((col, i) => (
                            <div key={i}>
                                <h4 className="font-mono text-xs text-slate-500 uppercase tracking-widest mb-6">{col.title}</h4>
                                <ul className="space-y-4">
                                    {col.links.map((link) => (
                                        <li key={link}>
                                            <Link href="#" className="text-sm text-white hover:text-neon-green uppercase font-bold tracking-wider transition-colors">
                                                {link}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-24 pt-8 border-t border-white/10 flex justify-between items-center">
                    <p className="font-mono text-[10px] text-slate-600 uppercase">© 2026 OrizonKitchen Defense Systems.</p>
                    <div className="flex gap-4">
                        <div className="h-1 w-1 bg-neon-green rounded-full"></div>
                        <div className="h-1 w-1 bg-neon-green rounded-full opacity-50"></div>
                        <div className="h-1 w-1 bg-neon-green rounded-full opacity-25"></div>
                    </div>
                </div>
            </div>
        </footer>
    );
};
