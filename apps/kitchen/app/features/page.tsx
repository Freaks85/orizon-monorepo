"use client";

import React from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Thermometer, Truck, ClipboardCheck, Bell, Smartphone, Cloud, Shield, Zap } from 'lucide-react';

export default function FeaturesPage() {
    const features = [
        {
            icon: <Thermometer className="h-8 w-8 text-neon-green" />,
            title: "Relevés de Température",
            desc: "Saisie manuelle ou automatique via sondes Bluetooth. Alertes en temps réel."
        },
        {
            icon: <Truck className="h-8 w-8 text-neon-green" />,
            title: "Réception Marchandise",
            desc: "Photos des BL et étiquettes. Contrôle conformité fournisseurs."
        },
        {
            icon: <ClipboardCheck className="h-8 w-8 text-neon-green" />,
            title: "Traçabilité & DLC",
            desc: "Calcul automatique des dates limites. Impression d'étiquettes."
        },
        {
            icon: <Bell className="h-8 w-8 text-neon-green" />,
            title: "Plan de Nettoyage",
            desc: "Planning digitalisé des tâches. Suivi par équipe et par zone."
        },
        {
            icon: <Smartphone className="h-8 w-8 text-neon-green" />,
            title: "Application Mobile",
            desc: "Accessible sur iOS et Android. Mode hors-ligne disponible."
        },
        {
            icon: <Cloud className="h-8 w-8 text-neon-green" />,
            title: "Archivage Cloud",
            desc: "Données sécurisées et accessibles 24/7. Historique illimité."
        },
        {
            icon: <Shield className="h-8 w-8 text-neon-green" />,
            title: "Conformité Légale",
            desc: "Rapports prêts pour l'inspection sanitaire. Mises à jour réglementaires."
        },
        {
            icon: <Zap className="h-8 w-8 text-neon-green" />,
            title: "Alertes Intelligentes",
            desc: "Notifications push, SMS et Email en cas d'anomalie critique."
        }
    ];

    return (
        <div className="bg-rich-black min-h-screen text-white selection:bg-neon-green selection:text-black flex flex-col">
            <Header />
            <main className="flex-grow pt-32 pb-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-20">
                        <h1 className="font-display text-5xl md:text-7xl font-bold uppercase mb-6">
                            Arsenal <span className="text-stroke-green">Tactique</span>
                        </h1>
                        <p className="font-mono text-slate-400 max-w-2xl">
                            Une suite d'outils de précision pour une maîtrise totale de votre hygiène.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {features.map((feature, index) => (
                            <div key={index} className="p-8 border border-white/10 hover:border-neon-green/50 hover:bg-white/5 transition-all group">
                                <div className="mb-6 p-3 bg-white/5 inline-block rounded-sm group-hover:text-neon-green transition-colors">
                                    {feature.icon}
                                </div>
                                <h3 className="font-display text-xl uppercase mb-3 text-white">{feature.title}</h3>
                                <p className="text-slate-500 text-sm font-mono leading-relaxed">
                                    {feature.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
