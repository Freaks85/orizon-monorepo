"use client";

import { motion } from 'framer-motion';
import { ShieldCheck, CalendarRange, ChefHat, ArrowRight, Check } from 'lucide-react';
import Link from 'next/link';

const apps = [
    {
        name: 'OrizonKitchen',
        description: 'Gestion HACCP et traçabilité alimentaire',
        icon: ShieldCheck,
        color: '#00ff9d',
        features: ['Relevés de températures', 'Traçabilité DLC', 'Nettoyage & hygiène', 'Alertes en temps réel'],
        href: 'https://kitchen.orizonsapp.com',
        available: true
    },
    {
        name: 'OrizonReservation',
        description: 'Gestion des réservations en ligne',
        icon: CalendarRange,
        color: '#00ff9d',
        features: ['Page de réservation', 'Gestion des salles', 'Services personnalisés', 'Notifications'],
        href: 'https://reservation.orizonsapp.com',
        available: true
    },
    {
        name: 'OrizonMenu',
        description: 'Gestion de carte et menus digitaux',
        icon: ChefHat,
        color: '#6366f1',
        features: ['Menu digital QR', 'Gestion des plats', 'Allergènes', 'Multi-langues'],
        href: '#',
        available: false
    }
];

export default function HomePage() {
    return (
        <div className="min-h-screen bg-[#050505]">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-[#00ff9d] rounded-lg flex items-center justify-center">
                            <span className="text-black font-bold text-lg">O</span>
                        </div>
                        <span className="font-display font-bold text-xl tracking-wider text-white uppercase">
                            Orizon<span className="text-[#00ff9d]">App</span>
                        </span>
                    </div>
                    <nav className="hidden md:flex items-center gap-6">
                        <a href="#apps" className="text-sm text-slate-400 hover:text-white transition-colors font-mono uppercase tracking-wider">
                            Applications
                        </a>
                        <a href="#pricing" className="text-sm text-slate-400 hover:text-white transition-colors font-mono uppercase tracking-wider">
                            Tarifs
                        </a>
                        <Link
                            href="https://kitchen.orizonsapp.com/login"
                            className="px-4 py-2 bg-[#00ff9d] text-black font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-white transition-colors"
                        >
                            Se connecter
                        </Link>
                    </nav>
                </div>
            </header>

            {/* Hero */}
            <section className="pt-32 pb-20 px-6 bg-grid-pattern">
                <div className="max-w-7xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <span className="inline-block px-4 py-1.5 bg-[#00ff9d]/10 border border-[#00ff9d]/20 rounded-full text-[#00ff9d] text-xs font-mono uppercase tracking-wider mb-6">
                            Suite d'applications pour la restauration
                        </span>
                        <h1 className="font-display text-5xl md:text-7xl font-bold text-white uppercase tracking-wider mb-6">
                            Une plateforme,<br />
                            <span className="text-[#00ff9d]">toutes vos solutions</span>
                        </h1>
                        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
                            Gérez votre restaurant de A à Z avec nos applications interconnectées.
                            HACCP, réservations, menus digitaux - tout en un seul endroit.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <a
                                href="#apps"
                                className="px-8 py-4 bg-[#00ff9d] text-black font-bold text-sm uppercase tracking-widest rounded-lg hover:bg-white transition-colors flex items-center gap-2"
                            >
                                Découvrir les apps
                                <ArrowRight className="h-4 w-4" />
                            </a>
                            <Link
                                href="https://kitchen.orizonsapp.com/signup"
                                className="px-8 py-4 bg-white/5 border border-white/10 text-white font-bold text-sm uppercase tracking-widest rounded-lg hover:bg-white/10 transition-colors"
                            >
                                Essai gratuit 7 jours
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Apps */}
            <section id="apps" className="py-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="font-display text-4xl font-bold text-white uppercase tracking-wider mb-4">
                            Nos applications
                        </h2>
                        <p className="text-slate-400 max-w-xl mx-auto">
                            Chaque application est conçue pour répondre à un besoin spécifique,
                            tout en fonctionnant parfaitement ensemble.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {apps.map((app, index) => (
                            <motion.div
                                key={app.name}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className={`bg-[#0a0a0a] border rounded-2xl p-8 relative overflow-hidden ${
                                    app.available
                                        ? 'border-white/10 hover:border-[#00ff9d]/30'
                                        : 'border-white/5 opacity-60'
                                } transition-colors`}
                            >
                                {!app.available && (
                                    <div className="absolute top-4 right-4 px-2 py-1 bg-white/10 rounded text-[10px] font-mono uppercase text-slate-400">
                                        Bientôt
                                    </div>
                                )}

                                <div
                                    className="w-14 h-14 rounded-xl flex items-center justify-center mb-6"
                                    style={{ backgroundColor: `${app.color}10` }}
                                >
                                    <app.icon className="h-7 w-7" style={{ color: app.color }} />
                                </div>

                                <h3 className="font-display text-2xl font-bold text-white uppercase tracking-wider mb-2">
                                    {app.name}
                                </h3>
                                <p className="text-slate-400 mb-6">{app.description}</p>

                                <ul className="space-y-2 mb-8">
                                    {app.features.map((feature) => (
                                        <li key={feature} className="flex items-center gap-2 text-sm text-slate-400">
                                            <Check className="h-4 w-4" style={{ color: app.color }} />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                {app.available ? (
                                    <a
                                        href={app.href}
                                        className="block w-full py-3 text-center font-bold text-xs uppercase tracking-widest rounded-lg transition-colors"
                                        style={{
                                            backgroundColor: app.color,
                                            color: '#000'
                                        }}
                                    >
                                        Accéder
                                    </a>
                                ) : (
                                    <button
                                        disabled
                                        className="block w-full py-3 text-center font-bold text-xs uppercase tracking-widest rounded-lg bg-white/5 text-slate-500 cursor-not-allowed"
                                    >
                                        Prochainement
                                    </button>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 px-6 bg-[#0a0a0a] border-y border-white/5">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="font-display text-4xl font-bold text-white uppercase tracking-wider mb-4">
                        Prêt à commencer ?
                    </h2>
                    <p className="text-slate-400 mb-8">
                        Essayez gratuitement pendant 7 jours. Aucune carte bancaire requise.
                    </p>
                    <Link
                        href="https://kitchen.orizonsapp.com/signup"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-[#00ff9d] text-black font-bold text-sm uppercase tracking-widest rounded-lg hover:bg-white transition-colors"
                    >
                        Créer mon compte
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-[#00ff9d] rounded flex items-center justify-center">
                            <span className="text-black font-bold text-sm">O</span>
                        </div>
                        <span className="font-display font-bold tracking-wider text-white uppercase">
                            OrizonApp
                        </span>
                    </div>
                    <p className="text-slate-500 text-sm font-mono">
                        © 2024 OrizonApp. Tous droits réservés.
                    </p>
                </div>
            </footer>
        </div>
    );
}
