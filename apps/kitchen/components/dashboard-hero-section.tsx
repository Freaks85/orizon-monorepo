"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

// Types pour les marqueurs
interface MarkerData {
    id: number;
    title: string;
    description: string;
    // Position en pourcentage (responsive)
    x: number;
    y: number;
}

// Données des marqueurs
const markers: MarkerData[] = [
    {
        id: 1,
        title: "Vue d'Ensemble des Performances",
        description: "Suivez l'évolution de vos indicateurs clés de performance (KPI) en temps réel avec ce graphique dynamique.",
        x: 55, // Position en % depuis la gauche
        y: 35, // Position en % depuis le haut
    },
    {
        id: 2,
        title: "Créer un Projet Instantané",
        description: "Cliquez ici pour lancer un nouveau projet, rapport ou campagne en quelques secondes.",
        x: 85,
        y: 15,
    },
    {
        id: 3,
        title: "Navigation Rapide",
        description: "Accédez à toutes les sections de l'application (Statistiques, Paramètres, Facturation, Support) facilement.",
        x: 8,
        y: 50,
    },
    {
        id: 4,
        title: "Alertes en Temps Réel",
        description: "Visualisez et gérez toutes vos alertes critiques depuis ce panneau centralisé.",
        x: 75,
        y: 65,
    },
    {
        id: 5,
        title: "Profil Utilisateur",
        description: "Gérez vos informations personnelles, préférences et paramètres de compte.",
        x: 92,
        y: 8,
    },
];

// Composant Marqueur
interface MarkerProps {
    marker: MarkerData;
    isActive: boolean;
    onClick: () => void;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    isMobile: boolean;
}

const Marker: React.FC<MarkerProps> = ({
    marker,
    isActive,
    onClick,
    onMouseEnter,
    onMouseLeave,
    isMobile,
}) => {
    return (
        <motion.button
            className={`absolute z-20 flex items-center justify-center cursor-pointer
                ${isMobile ? 'w-10 h-10' : 'w-8 h-8'}
                rounded-full border-2
                ${isActive
                    ? 'bg-neon-green border-neon-green text-black'
                    : 'bg-black/80 border-neon-green/70 text-neon-green hover:bg-neon-green/20'
                }
                transition-all duration-300 backdrop-blur-sm
                shadow-[0_0_15px_rgba(0,255,157,0.3)]
                hover:shadow-[0_0_25px_rgba(0,255,157,0.5)]
            `}
            style={{
                left: `${marker.x}%`,
                top: `${marker.y}%`,
                transform: 'translate(-50%, -50%)',
            }}
            onClick={onClick}
            onMouseEnter={!isMobile ? onMouseEnter : undefined}
            onMouseLeave={!isMobile ? onMouseLeave : undefined}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: marker.id * 0.15, duration: 0.4, type: "spring" }}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.95 }}
            aria-label={`Marqueur ${marker.id}: ${marker.title}`}
        >
            <span className="font-mono font-bold text-sm">{marker.id}</span>

            {/* Pulse animation */}
            {!isActive && (
                <span className="absolute inset-0 rounded-full border-2 border-neon-green/50 animate-ping" />
            )}
        </motion.button>
    );
};

// Composant Tooltip/Panneau d'information
interface TooltipProps {
    marker: MarkerData;
    onClose: () => void;
    isMobile: boolean;
}

const InfoTooltip: React.FC<TooltipProps> = ({ marker, onClose, isMobile }) => {
    const tooltipRef = useRef<HTMLDivElement>(null);

    // Calcul de la position du tooltip
    const getPosition = () => {
        const padding = 16;
        let left = marker.x;
        let top = marker.y;

        // Ajustement horizontal
        if (marker.x > 70) {
            left = marker.x - 5;
        } else if (marker.x < 30) {
            left = marker.x + 5;
        }

        // Ajustement vertical - toujours en dessous du marqueur
        top = marker.y + 8;

        return { left: `${left}%`, top: `${top}%` };
    };

    const position = getPosition();

    return (
        <motion.div
            ref={tooltipRef}
            className={`absolute z-30 ${isMobile ? 'w-[280px]' : 'w-[320px]'}`}
            style={{
                left: position.left,
                top: position.top,
                transform: marker.x > 70 ? 'translateX(-90%)' : marker.x < 30 ? 'translateX(-10%)' : 'translateX(-50%)',
            }}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
        >
            {/* Flèche du tooltip */}
            <div
                className="absolute -top-2 w-4 h-4 bg-dark-gunmetal border-l border-t border-neon-green/50 rotate-45"
                style={{
                    left: marker.x > 70 ? '85%' : marker.x < 30 ? '15%' : '50%',
                    transform: 'translateX(-50%) rotate(45deg)',
                }}
            />

            {/* Contenu du tooltip */}
            <div className="relative bg-dark-gunmetal border border-neon-green/50 backdrop-blur-md shadow-[0_0_30px_rgba(0,255,157,0.15)]">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/10 p-4">
                    <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-neon-green text-black font-mono font-bold text-sm">
                            {marker.id}
                        </span>
                        <h4 className="font-display text-lg text-white uppercase tracking-wide">
                            {marker.title}
                        </h4>
                    </div>
                    {isMobile && (
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-white/10 rounded transition-colors"
                            aria-label="Fermer"
                        >
                            <X className="w-5 h-5 text-slate-400" />
                        </button>
                    )}
                </div>

                {/* Description */}
                <div className="p-4">
                    <p className="font-mono text-sm text-slate-300 leading-relaxed">
                        {marker.description}
                    </p>
                </div>

                {/* Footer decoratif */}
                <div className="h-1 w-full bg-gradient-to-r from-transparent via-neon-green/50 to-transparent" />
            </div>
        </motion.div>
    );
};

// Composant principal
export const DashboardHeroSection: React.FC = () => {
    const [activeMarker, setActiveMarker] = useState<number | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Détection mobile
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Fermer le tooltip en cliquant en dehors
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setActiveMarker(null);
            }
        };

        if (activeMarker !== null) {
            document.addEventListener('click', handleClickOutside);
        }

        return () => document.removeEventListener('click', handleClickOutside);
    }, [activeMarker]);

    const handleMarkerClick = (markerId: number) => {
        setActiveMarker(activeMarker === markerId ? null : markerId);
    };

    const handleMarkerHover = (markerId: number | null) => {
        if (!isMobile) {
            setActiveMarker(markerId);
        }
    };

    return (
        <section className="relative py-24 md:py-32 bg-rich-black overflow-hidden">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />

            {/* Contenu */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                {/* Titre de la section */}
                <motion.div
                    className="text-center mb-12 md:mb-16"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <span className="inline-block border border-neon-green/50 text-neon-green px-4 py-1 text-[10px] font-bold tracking-[0.3em] uppercase bg-neon-green/5 mb-6">
                        Interface Intuitive
                    </span>
                    <h2 className="font-display text-4xl md:text-6xl lg:text-7xl text-white uppercase tracking-tight">
                        Découvrez votre <span className="text-stroke-green">Puissance</span>
                    </h2>
                    <p className="mt-4 font-mono text-sm md:text-base text-slate-400 uppercase tracking-wider max-w-2xl mx-auto">
                        Le Tableau de Bord en Action
                    </p>
                </motion.div>

                {/* Container de l'image avec marqueurs */}
                <motion.div
                    ref={containerRef}
                    className="relative mx-auto max-w-6xl"
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                >
                    {/* Cadre décoratif */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-neon-green/20 via-transparent to-neon-green/20 opacity-50" />
                    <div className="absolute -inset-px bg-gradient-to-b from-neon-green/30 via-transparent to-neon-green/30 opacity-30" />

                    {/* Container image */}
                    <div className="relative border border-white/10 bg-dark-gunmetal p-2 md:p-3">
                        {/* Image du dashboard - À remplacer par votre image */}
                        <div className="relative aspect-[16/10] bg-rich-black overflow-hidden">
                            {/* Image du dashboard - Remplacez par votre propre capture d'écran si nécessaire */}
                            <img
                                src="/images/dashboard-preview.svg"
                                alt="Aperçu du tableau de bord OrizonKitchen"
                                className="w-full h-full object-cover object-top"
                                onError={(e) => {
                                    // Fallback si l'image n'existe pas
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                }}
                            />

                            {/* Placeholder si pas d'image */}
                            <div className="hidden absolute inset-0 bg-gradient-to-br from-dark-gunmetal to-rich-black flex items-center justify-center">
                                <div className="text-center">
                                    <div className="w-24 h-24 mx-auto mb-4 border-2 border-dashed border-neon-green/30 rounded-lg flex items-center justify-center">
                                        <span className="text-neon-green/50 text-4xl">+</span>
                                    </div>
                                    <p className="text-slate-500 font-mono text-sm">
                                        Ajoutez votre image de dashboard<br/>
                                        <code className="text-xs text-neon-green/50">/public/images/dashboard-preview.svg</code>
                                    </p>
                                </div>
                            </div>

                            {/* Overlay léger */}
                            <div className="absolute inset-0 bg-gradient-to-t from-rich-black/20 via-transparent to-transparent pointer-events-none" />

                            {/* Marqueurs */}
                            {markers.map((marker) => (
                                <Marker
                                    key={marker.id}
                                    marker={marker}
                                    isActive={activeMarker === marker.id}
                                    onClick={() => handleMarkerClick(marker.id)}
                                    onMouseEnter={() => handleMarkerHover(marker.id)}
                                    onMouseLeave={() => handleMarkerHover(null)}
                                    isMobile={isMobile}
                                />
                            ))}

                            {/* Tooltips */}
                            <AnimatePresence>
                                {activeMarker !== null && (
                                    <InfoTooltip
                                        marker={markers.find(m => m.id === activeMarker)!}
                                        onClose={() => setActiveMarker(null)}
                                        isMobile={isMobile}
                                    />
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Barre d'état en bas */}
                        <div className="mt-2 md:mt-3 flex items-center justify-between px-2 py-2 bg-rich-black/50 border-t border-white/5">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
                                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                                    {isMobile ? 'Appuyez' : 'Survolez'} les marqueurs pour découvrir les fonctionnalités
                                </span>
                            </div>
                            <span className="text-[10px] font-mono text-neon-green/70">
                                {markers.length} zones interactives
                            </span>
                        </div>
                    </div>

                    {/* Coins décoratifs */}
                    <div className="absolute -top-2 -left-2 w-6 h-6 border-l-2 border-t-2 border-neon-green/50" />
                    <div className="absolute -top-2 -right-2 w-6 h-6 border-r-2 border-t-2 border-neon-green/50" />
                    <div className="absolute -bottom-2 -left-2 w-6 h-6 border-l-2 border-b-2 border-neon-green/50" />
                    <div className="absolute -bottom-2 -right-2 w-6 h-6 border-r-2 border-b-2 border-neon-green/50" />
                </motion.div>

                {/* Légende des marqueurs (mobile) */}
                <motion.div
                    className="mt-8 md:mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                >
                    {markers.slice(0, 3).map((marker) => (
                        <button
                            key={marker.id}
                            onClick={() => handleMarkerClick(marker.id)}
                            className={`flex items-start gap-3 p-4 border transition-all duration-300 text-left
                                ${activeMarker === marker.id
                                    ? 'border-neon-green/50 bg-neon-green/5'
                                    : 'border-white/10 hover:border-white/20 bg-transparent'
                                }
                            `}
                        >
                            <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-neon-green/10 text-neon-green font-mono font-bold text-xs border border-neon-green/30">
                                {marker.id}
                            </span>
                            <div>
                                <h5 className="font-display text-sm text-white uppercase tracking-wide mb-1">
                                    {marker.title}
                                </h5>
                                <p className="text-xs text-slate-500 font-mono leading-relaxed line-clamp-2">
                                    {marker.description}
                                </p>
                            </div>
                        </button>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};

export default DashboardHeroSection;
