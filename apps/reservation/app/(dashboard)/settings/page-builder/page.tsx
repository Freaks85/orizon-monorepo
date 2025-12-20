"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Palette, MessageSquare, ArrowLeft, Eye } from 'lucide-react';
import { useRestaurant } from '@/contexts/restaurant-context';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface ReservationSettings {
    id: string;
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    welcome_message: string | null;
    confirmation_message: string | null;
    display_phone: string | null;
    display_email: string | null;
    display_address: string | null;
    slug: string | null;
}

const COLOR_PALETTES = [
    { name: 'Neon', primary: '#00ff9d', secondary: '#0a0a0a', accent: '#ffffff' },
    { name: 'Ocean', primary: '#0ea5e9', secondary: '#0c1524', accent: '#ffffff' },
    { name: 'Sunset', primary: '#f97316', secondary: '#1c0a04', accent: '#ffffff' },
    { name: 'Rose', primary: '#ec4899', secondary: '#1a0612', accent: '#ffffff' },
    { name: 'Gold', primary: '#eab308', secondary: '#1a1506', accent: '#ffffff' },
    { name: 'Purple', primary: '#a855f7', secondary: '#12061a', accent: '#ffffff' },
];

export default function PageBuilderPage() {
    const { restaurant } = useRestaurant();
    const [settings, setSettings] = useState<ReservationSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form state
    const [primaryColor, setPrimaryColor] = useState('#00ff9d');
    const [secondaryColor, setSecondaryColor] = useState('#0a0a0a');
    const [accentColor, setAccentColor] = useState('#ffffff');
    const [welcomeMessage, setWelcomeMessage] = useState('');
    const [confirmationMessage, setConfirmationMessage] = useState('');
    const [displayPhone, setDisplayPhone] = useState('');
    const [displayEmail, setDisplayEmail] = useState('');
    const [displayAddress, setDisplayAddress] = useState('');

    useEffect(() => {
        if (restaurant?.id) {
            fetchSettings();
        }
    }, [restaurant?.id]);

    const fetchSettings = async () => {
        if (!restaurant?.id) return;

        try {
            const { data, error } = await supabase
                .from('restaurant_reservation_settings')
                .select('*')
                .eq('restaurant_id', restaurant.id)
                .single();

            if (error) throw error;

            if (data) {
                setSettings(data);
                setPrimaryColor(data.primary_color);
                setSecondaryColor(data.secondary_color);
                setAccentColor(data.accent_color);
                setWelcomeMessage(data.welcome_message || '');
                setConfirmationMessage(data.confirmation_message || '');
                setDisplayPhone(data.display_phone || '');
                setDisplayEmail(data.display_email || '');
                setDisplayAddress(data.display_address || '');
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePaletteSelect = (palette: typeof COLOR_PALETTES[0]) => {
        setPrimaryColor(palette.primary);
        setSecondaryColor(palette.secondary);
        setAccentColor(palette.accent);
    };

    const handleSave = async () => {
        if (!settings) return;

        setSaving(true);
        try {
            const { error } = await supabase
                .from('restaurant_reservation_settings')
                .update({
                    primary_color: primaryColor,
                    secondary_color: secondaryColor,
                    accent_color: accentColor,
                    welcome_message: welcomeMessage || null,
                    confirmation_message: confirmationMessage || null,
                    display_phone: displayPhone || null,
                    display_email: displayEmail || null,
                    display_address: displayAddress || null
                })
                .eq('id', settings.id);

            if (error) throw error;
        } catch (error) {
            console.error('Error saving settings:', error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="h-12 w-12 border-2 border-[#00ff9d] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard/settings"
                        className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="font-display text-2xl font-bold text-white uppercase tracking-wider">
                            Page Builder
                        </h1>
                        <p className="text-slate-500 text-sm font-mono">
                            Personnalisez votre page de réservation
                        </p>
                    </div>
                </div>

                {settings?.slug && (
                    <a
                        href={`/${settings.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-colors"
                    >
                        <Eye className="h-4 w-4" />
                        Prévisualiser
                    </a>
                )}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Settings */}
                <div className="space-y-6">
                    {/* Color Palettes */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <Palette className="h-5 w-5 text-[#00ff9d]" />
                            <h2 className="font-display text-lg font-bold text-white uppercase tracking-wider">
                                Palette de couleurs
                            </h2>
                        </div>

                        <div className="grid grid-cols-3 gap-3 mb-6">
                            {COLOR_PALETTES.map((palette) => (
                                <button
                                    key={palette.name}
                                    onClick={() => handlePaletteSelect(palette)}
                                    className={`p-3 rounded-lg border transition-all ${
                                        primaryColor === palette.primary
                                            ? 'border-white/50 ring-2 ring-white/20'
                                            : 'border-white/10 hover:border-white/20'
                                    }`}
                                    style={{ backgroundColor: palette.secondary }}
                                >
                                    <div
                                        className="h-6 rounded mb-2"
                                        style={{ backgroundColor: palette.primary }}
                                    />
                                    <p className="text-xs text-center text-slate-400">
                                        {palette.name}
                                    </p>
                                </button>
                            ))}
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                                    Principale
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={primaryColor}
                                        onChange={(e) => setPrimaryColor(e.target.value)}
                                        className="w-10 h-10 rounded cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={primaryColor}
                                        onChange={(e) => setPrimaryColor(e.target.value)}
                                        className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-white font-mono text-xs"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                                    Fond
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={secondaryColor}
                                        onChange={(e) => setSecondaryColor(e.target.value)}
                                        className="w-10 h-10 rounded cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={secondaryColor}
                                        onChange={(e) => setSecondaryColor(e.target.value)}
                                        className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-white font-mono text-xs"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                                    Accent
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={accentColor}
                                        onChange={(e) => setAccentColor(e.target.value)}
                                        className="w-10 h-10 rounded cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={accentColor}
                                        onChange={(e) => setAccentColor(e.target.value)}
                                        className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-white font-mono text-xs"
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Messages */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <MessageSquare className="h-5 w-5 text-[#00ff9d]" />
                            <h2 className="font-display text-lg font-bold text-white uppercase tracking-wider">
                                Messages
                            </h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                                    Message de bienvenue
                                </label>
                                <textarea
                                    value={welcomeMessage}
                                    onChange={(e) => setWelcomeMessage(e.target.value)}
                                    rows={2}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#00ff9d]/50 resize-none"
                                    placeholder="Bienvenue, réservez votre table en quelques clics !"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                                    Message de confirmation
                                </label>
                                <textarea
                                    value={confirmationMessage}
                                    onChange={(e) => setConfirmationMessage(e.target.value)}
                                    rows={2}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#00ff9d]/50 resize-none"
                                    placeholder="Nous avons hâte de vous accueillir !"
                                />
                            </div>
                        </div>
                    </motion.div>

                    {/* Contact Override */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6"
                    >
                        <h2 className="font-display text-lg font-bold text-white uppercase tracking-wider mb-4">
                            Informations affichées
                        </h2>
                        <p className="text-slate-500 text-sm mb-4">
                            Laissez vide pour utiliser les informations du restaurant
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                                    Adresse
                                </label>
                                <input
                                    type="text"
                                    value={displayAddress}
                                    onChange={(e) => setDisplayAddress(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#00ff9d]/50"
                                    placeholder="123 Rue Example, 75001 Paris"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                                        Téléphone
                                    </label>
                                    <input
                                        type="tel"
                                        value={displayPhone}
                                        onChange={(e) => setDisplayPhone(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#00ff9d]/50"
                                        placeholder="01 23 45 67 89"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={displayEmail}
                                        onChange={(e) => setDisplayEmail(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#00ff9d]/50"
                                        placeholder="contact@restaurant.fr"
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Save Button */}
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-[#00ff9d] text-black font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-white transition-colors disabled:opacity-50"
                    >
                        {saving ? (
                            <div className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <Save className="h-4 w-4" />
                                Enregistrer
                            </>
                        )}
                    </button>
                </div>

                {/* Preview */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="hidden lg:block"
                >
                    <div className="sticky top-24">
                        <h3 className="font-display text-sm font-bold text-white uppercase tracking-wider mb-4">
                            Aperçu
                        </h3>
                        <div
                            className="rounded-xl overflow-hidden border border-white/10"
                            style={{ backgroundColor: secondaryColor }}
                        >
                            {/* Preview Header */}
                            <div className="p-6 border-b border-white/10 text-center">
                                <h4 className="text-xl font-bold text-white mb-1">
                                    {restaurant?.name}
                                </h4>
                                {welcomeMessage && (
                                    <p className="text-sm text-slate-400">{welcomeMessage}</p>
                                )}
                            </div>

                            {/* Preview Content */}
                            <div className="p-6">
                                <div className="bg-black/20 rounded-lg p-4 space-y-4">
                                    <div
                                        className="h-10 rounded-lg"
                                        style={{ backgroundColor: `${primaryColor}20` }}
                                    />
                                    <div className="grid grid-cols-3 gap-2">
                                        {[1, 2, 3].map((i) => (
                                            <div
                                                key={i}
                                                className="h-12 rounded-lg"
                                                style={{
                                                    backgroundColor: i === 2 ? primaryColor : `${primaryColor}20`
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <button
                                        className="w-full py-3 rounded-lg font-bold text-sm"
                                        style={{
                                            backgroundColor: primaryColor,
                                            color: secondaryColor
                                        }}
                                    >
                                        Réserver
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
