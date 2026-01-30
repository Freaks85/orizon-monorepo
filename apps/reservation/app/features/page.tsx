"use client";

import { motion } from 'framer-motion';
import {
    CalendarRange,
    LayoutGrid,
    Palette,
    Bell,
    BarChart3,
    Settings,
    Users,
    Clock,
    Mail,
    Shield,
    Smartphone,
    Globe,
    Zap,
    Check,
    ArrowRight,
    MessageSquare,
    Calendar,
    QrCode,
    Download
} from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number = 0) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }
    })
};

const staggerContainer = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1 } }
};

const features = [
    {
        category: "Gestion des réservations",
        icon: CalendarRange,
        color: "#ff6b00",
        items: [
            {
                name: "Réservations illimitées",
                description: "Acceptez autant de réservations que vous le souhaitez, sans limite mensuelle",
                icon: Check
            },
            {
                name: "Gestion multi-services",
                description: "Créez différents services (midi, soir, brunch) avec leurs propres horaires",
                icon: Clock
            },
            {
                name: "Gestion des salles",
                description: "Organisez vos espaces et tables avec notre éditeur visuel intuitif",
                icon: LayoutGrid
            },
            {
                name: "Plans de salle interactifs",
                description: "Créez et modifiez vos plans de salle en glisser-déposer",
                icon: Users
            },
            {
                name: "Cahier de réservations",
                description: "Vue d'ensemble claire de toutes vos réservations du jour",
                icon: Calendar
            },
            {
                name: "Modification en temps réel",
                description: "Déplacez, modifiez ou annulez des réservations instantanément",
                icon: Zap
            }
        ]
    },
    {
        category: "Page de réservation",
        icon: Globe,
        color: "#ff6b00",
        items: [
            {
                name: "Page personnalisable",
                description: "Personnalisez couleurs, logo et style pour matcher votre identité",
                icon: Palette
            },
            {
                name: "URL unique",
                description: "Obtenez une URL courte et mémorable (ex: orizonsapp.com/votre-resto)",
                icon: Globe
            },
            {
                name: "Responsive mobile",
                description: "Interface optimisée pour tous les appareils (mobile, tablette, desktop)",
                icon: Smartphone
            },
            {
                name: "Disponibilité en temps réel",
                description: "Vos clients voient les créneaux disponibles instantanément",
                icon: Clock
            },
            {
                name: "Formulaire simplifié",
                description: "Processus de réservation rapide en quelques clics seulement",
                icon: Check
            },
            {
                name: "Code QR",
                description: "Générez un QR code à afficher dans votre restaurant",
                icon: QrCode
            }
        ]
    },
    {
        category: "Communication",
        icon: Mail,
        color: "#ff6b00",
        items: [
            {
                name: "Emails automatiques",
                description: "Confirmations envoyées automatiquement à vos clients",
                icon: Mail
            },
            {
                name: "Notifications restaurant",
                description: "Recevez une notification pour chaque nouvelle réservation",
                icon: Bell
            },
            {
                name: "Rappels clients",
                description: "Emails de rappel automatiques avant la réservation",
                icon: Clock
            },
            {
                name: "Templates personnalisables",
                description: "Personnalisez le contenu de vos emails automatiques",
                icon: Settings
            },
            {
                name: "Multi-destinataires",
                description: "Envoyez les notifications à plusieurs adresses email",
                icon: Users
            },
            {
                name: "Confirmations clients",
                description: "Vos clients peuvent confirmer leur venue en un clic",
                icon: MessageSquare
            }
        ]
    },
    {
        category: "Statistiques & Rapports",
        icon: BarChart3,
        color: "#ff6b00",
        items: [
            {
                name: "Tableau de bord analytique",
                description: "Vue d'ensemble de votre activité avec graphiques et métriques",
                icon: BarChart3
            },
            {
                name: "Taux d'occupation",
                description: "Suivez le remplissage de vos tables en temps réel",
                icon: Users
            },
            {
                name: "Historique des réservations",
                description: "Accédez à toutes vos réservations passées et futures",
                icon: Calendar
            },
            {
                name: "Export de données",
                description: "Exportez vos statistiques en CSV pour analyse",
                icon: Download
            },
            {
                name: "Analyse par service",
                description: "Comparez les performances de vos différents services",
                icon: Clock
            },
            {
                name: "Métriques de performance",
                description: "Taux de confirmation, annulation, et no-shows",
                icon: BarChart3
            }
        ]
    },
    {
        category: "Paramètres & Personnalisation",
        icon: Settings,
        color: "#ff6b00",
        items: [
            {
                name: "Thèmes prédéfinis",
                description: "Choisissez parmi plusieurs thèmes de couleurs élégants",
                icon: Palette
            },
            {
                name: "Branding personnalisé",
                description: "Ajoutez votre logo et vos couleurs de marque",
                icon: Shield
            },
            {
                name: "Horaires flexibles",
                description: "Définissez vos horaires d'ouverture par jour et par service",
                icon: Clock
            },
            {
                name: "Durée des réservations",
                description: "Configurez la durée moyenne d'une réservation",
                icon: Clock
            },
            {
                name: "Capacité par table",
                description: "Définissez le nombre de couverts pour chaque table",
                icon: Users
            },
            {
                name: "Paramètres avancés",
                description: "Configurez les détails de votre système de réservation",
                icon: Settings
            }
        ]
    },
    {
        category: "Sécurité & Support",
        icon: Shield,
        color: "#ff6b00",
        items: [
            {
                name: "Données sécurisées",
                description: "Vos données sont hébergées de manière sécurisée et chiffrées",
                icon: Shield
            },
            {
                name: "Sauvegardes automatiques",
                description: "Vos données sont sauvegardées quotidiennement",
                icon: Check
            },
            {
                name: "Support prioritaire",
                description: "Obtenez de l'aide rapidement par email",
                icon: MessageSquare
            },
            {
                name: "Mises à jour gratuites",
                description: "Profitez de toutes les nouvelles fonctionnalités gratuitement",
                icon: Zap
            },
            {
                name: "99.9% de disponibilité",
                description: "Service disponible 24/7 avec une fiabilité maximale",
                icon: Check
            },
            {
                name: "Conformité RGPD",
                description: "Totalement conforme aux règlements européens sur les données",
                icon: Shield
            }
        ]
    }
];

export default function FeaturesPage() {
    return (
        <div className="min-h-screen bg-rich-black">
            <Header />

            <main className="pt-24 pb-20">
                {/* Hero Section */}
                <section className="py-20 px-4 sm:px-6 relative overflow-hidden">
                    <div className="absolute inset-0 bg-mesh-gradient pointer-events-none" />
                    <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none" />
                    <div className="absolute inset-0 noise-overlay pointer-events-none" />

                    <div className="max-w-5xl mx-auto text-center relative z-10">
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={staggerContainer}
                        >
                            <motion.span variants={fadeUp} custom={0} className="text-neon-orange text-xs font-mono uppercase tracking-[0.3em]">
                                Fonctionnalités
                            </motion.span>
                            <motion.h1 variants={fadeUp} custom={1} className="font-display text-4xl sm:text-5xl lg:text-7xl text-white uppercase mt-4 mb-6">
                                Tout ce dont vous avez besoin
                            </motion.h1>
                            <motion.p variants={fadeUp} custom={2} className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto">
                                Une solution complète pour gérer vos réservations de restaurant.
                                Sans commission. Sans limites. À 40€ par mois.
                            </motion.p>
                        </motion.div>
                    </div>
                </section>

                {/* Features Sections */}
                {features.map((section, sectionIndex) => (
                    <section key={sectionIndex} className="py-16 px-4 sm:px-6 relative border-t border-white/[0.06]">
                        <div className="absolute inset-0 noise-overlay pointer-events-none opacity-30" />
                        <div className="max-w-6xl mx-auto relative z-10">
                            <motion.div
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
                                variants={staggerContainer}
                            >
                                {/* Section Header */}
                                <div className="flex items-center gap-4 mb-12">
                                    <div
                                        className="w-14 h-14 rounded-xl flex items-center justify-center"
                                        style={{ backgroundColor: `${section.color}15` }}
                                    >
                                        <section.icon className="h-7 w-7" style={{ color: section.color }} />
                                    </div>
                                    <div>
                                        <h2 className="font-display text-3xl text-white uppercase tracking-wider">
                                            {section.category}
                                        </h2>
                                    </div>
                                </div>

                                {/* Features Grid */}
                                <motion.div
                                    variants={staggerContainer}
                                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                                >
                                    {section.items.map((feature, featureIndex) => (
                                        <motion.div
                                            key={featureIndex}
                                            variants={fadeUp}
                                            custom={featureIndex}
                                            whileHover={{ y: -4, transition: { duration: 0.2 } }}
                                            className="group p-6 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:border-neon-orange/30 hover:bg-neon-orange/[0.03] transition-all duration-300"
                                        >
                                            <div
                                                className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
                                                style={{ backgroundColor: `${section.color}10` }}
                                            >
                                                <feature.icon className="h-5 w-5" style={{ color: section.color }} />
                                            </div>
                                            <h3 className="font-display text-lg text-white uppercase mb-2 tracking-wide">
                                                {feature.name}
                                            </h3>
                                            <p className="text-slate-400 text-sm leading-relaxed">
                                                {feature.description}
                                            </p>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            </motion.div>
                        </div>
                    </section>
                ))}

                {/* CTA Section */}
                <section className="py-24 px-4 sm:px-6 relative overflow-hidden border-t border-white/[0.06]">
                    <div className="absolute inset-0 bg-mesh-gradient pointer-events-none" />
                    <div className="absolute inset-0 noise-overlay pointer-events-none" />

                    {/* Living orbs */}
                    <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-[#ff6b00]/[0.06] orb pointer-events-none" />
                    <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-violet-600/[0.04] orb orb-2 pointer-events-none" />

                    <div className="max-w-4xl mx-auto text-center relative z-10">
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={staggerContainer}
                        >
                            <motion.h2 variants={fadeUp} custom={0} className="font-display text-4xl sm:text-5xl lg:text-6xl text-white uppercase mb-6">
                                Prêt à démarrer ?
                            </motion.h2>
                            <motion.p variants={fadeUp} custom={1} className="text-slate-400 text-lg mb-10">
                                40€ par mois. Sans commission. Résiliable à tout moment.
                            </motion.p>
                            <motion.div variants={fadeUp} custom={2}>
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} className="inline-block">
                                    <Link
                                        href="/signup"
                                        className="group inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-[#ff6b00] to-[#ff8533] text-black font-bold text-sm uppercase tracking-widest rounded-xl btn-magnetic shimmer-hover"
                                    >
                                        Créer mon compte
                                        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                                    </Link>
                                </motion.div>
                            </motion.div>
                        </motion.div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
