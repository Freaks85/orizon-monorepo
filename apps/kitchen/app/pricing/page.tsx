"use client";

import React from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Check } from 'lucide-react';
import Link from 'next/link';

export default function PricingPage() {
    const plans = [
        {
            name: "Starter",
            price: "29€",
            period: "/mois",
            description: "Pour les petits établissements.",
            features: ["1 Tablette", "Relevés Illimités", "Support Email", "Export PDF"],
            cta: "Choisir Starter",
            highlight: false
        },
        {
            name: "Pro",
            price: "49€",
            period: "/mois",
            description: "La solution complète pour restaurateurs.",
            features: ["3 Tablettes", "Sondes Bluetooth", "Support Prioritaire", "Module IA Étiquettes", "Alertes SMS"],
            cta: "Choisir Pro",
            highlight: true
        },
        {
            name: "Enterprise",
            price: "Sur Devis",
            period: "",
            description: "Pour les chaînes et franchises.",
            features: ["Multi-sites", "API Access", "Account Manager", "Formation sur site", "SSO"],
            cta: "Contacter Ventes",
            highlight: false
        }
    ];

    return (
        <div className="bg-rich-black min-h-screen text-white selection:bg-neon-green selection:text-black flex flex-col">
            <Header />
            <main className="flex-grow pt-32 pb-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h1 className="font-display text-5xl md:text-7xl font-bold uppercase mb-6">
                            Investissez dans la <span className="text-stroke-green">Sérénité</span>
                        </h1>
                        <p className="font-mono text-slate-400 max-w-2xl mx-auto">
                            Des tarifs transparents. Sans engagement. 7 jours d'essai gratuit sur tous les plans.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {plans.map((plan, index) => (
                            <div
                                key={index}
                                className={`relative p-8 border ${plan.highlight ? 'border-neon-green bg-neon-green/5' : 'border-white/10 bg-black'} flex flex-col`}
                            >
                                {plan.highlight && (
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-neon-green text-black px-4 py-1 text-xs font-bold uppercase tracking-widest">
                                        Recommandé
                                    </div>
                                )}

                                <h3 className="font-display text-3xl uppercase mb-2">{plan.name}</h3>
                                <div className="flex items-baseline gap-1 mb-4">
                                    <span className="text-4xl font-bold text-neon-green">{plan.price}</span>
                                    <span className="text-sm text-slate-500 font-mono">{plan.period}</span>
                                </div>
                                <p className="text-slate-400 text-sm mb-8 font-mono border-b border-white/10 pb-8">
                                    {plan.description}
                                </p>

                                <ul className="space-y-4 mb-8 flex-grow">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-center gap-3 text-sm font-mono uppercase">
                                            <Check className="h-4 w-4 text-neon-green" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                <Link
                                    href="/signup"
                                    className={`w-full py-4 text-center text-xs font-bold uppercase tracking-widest transition-colors ${plan.highlight
                                            ? 'bg-neon-green text-black hover:bg-white'
                                            : 'border border-white/20 hover:border-neon-green hover:text-neon-green'
                                        }`}
                                >
                                    {plan.cta}
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
