"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Globe, Palette, MessageSquare, Eye, Settings, Users, Clock } from 'lucide-react';
import { useRestaurant } from '@/contexts/restaurant-context';
import { supabase } from '@/lib/supabase';

interface ReservationSettings {
    id: string;
    is_enabled: boolean;
    slug: string | null;
    min_party_size: number;
    max_party_size: number;
    advance_booking_days: number;
    min_notice_hours: number;
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    welcome_message: string | null;
    confirmation_message: string | null;
    display_phone: string | null;
    display_email: string | null;
    display_address: string | null;
}

const COLOR_PALETTES = [
    { name: 'Neon', primary: '#ff6b00', secondary: '#0a0a0a', accent: '#ffffff' },
    { name: 'Ocean', primary: '#0ea5e9', secondary: '#0c1524', accent: '#ffffff' },
    { name: 'Sunset', primary: '#f97316', secondary: '#1c0a04', accent: '#ffffff' },
    { name: 'Rose', primary: '#ec4899', secondary: '#1a0612', accent: '#ffffff' },
    { name: 'Gold', primary: '#eab308', secondary: '#1a1506', accent: '#ffffff' },
    { name: 'Purple', primary: '#a855f7', secondary: '#12061a', accent: '#ffffff' },
];

type Tab = 'general' | 'design';

export default function SettingsPage() {
    const { restaurant } = useRestaurant();
    const [settings, setSettings] = useState<ReservationSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>('general');

    // General settings
    const [isEnabled, setIsEnabled] = useState(false);
    const [slug, setSlug] = useState('');
    const [minPartySize, setMinPartySize] = useState(1);
    const [maxPartySize, setMaxPartySize] = useState(20);
    const [advanceBookingDays, setAdvanceBookingDays] = useState(30);
    const [minNoticeHours, setMinNoticeHours] = useState(2);

    // Design settings
    const [primaryColor, setPrimaryColor] = useState('#ff6b00');
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
            let { data, error } = await supabase
                .from('restaurant_reservation_settings')
                .select('*')
                .eq('restaurant_id', restaurant.id)
                .single();

            if (error && error.code === 'PGRST116') {
                const defaultSlug = restaurant.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
                const { data: newData, error: insertError } = await supabase
                    .from('restaurant_reservation_settings')
                    .insert({
                        restaurant_id: restaurant.id,
                        slug: defaultSlug,
                        is_enabled: false
                    })
                    .select()
                    .single();

                if (insertError) throw insertError;
                data = newData;
            } else if (error) {
                throw error;
            }

            if (data) {
                setSettings(data);
                // General
                setIsEnabled(data.is_enabled);
                setSlug(data.slug || '');
                setMinPartySize(data.min_party_size);
                setMaxPartySize(data.max_party_size);
                setAdvanceBookingDays(data.advance_booking_days);
                setMinNoticeHours(data.min_notice_hours);
                // Design
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
                    is_enabled: isEnabled,
                    slug,
                    min_party_size: minPartySize,
                    max_party_size: maxPartySize,
                    advance_booking_days: advanceBookingDays,
                    min_notice_hours: minNoticeHours,
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

            setSettings({
                ...settings,
                is_enabled: isEnabled,
                slug,
                min_party_size: minPartySize,
                max_party_size: maxPartySize,
                advance_booking_days: advanceBookingDays,
                min_notice_hours: minNoticeHours,
                primary_color: primaryColor,
                secondary_color: secondaryColor,
                accent_color: accentColor,
                welcome_message: welcomeMessage || null,
                confirmation_message: confirmationMessage || null,
                display_phone: displayPhone || null,
                display_email: displayEmail || null,
                display_address: displayAddress || null
            });
        } catch (error) {
            console.error('Error saving settings:', error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="h-12 w-12 border-2 border-[#ff6b00] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="font-display text-2xl md:text-3xl font-bold text-white uppercase tracking-wider">
                        Page de reservation
                    </h1>
                    <p className="text-slate-500 text-sm font-mono mt-1">
                        Configurez et personnalisez votre page publique
                    </p>
                </div>

                {isEnabled && slug && (
                    <a
                        href={`/${slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#ff6b00] text-black font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-white transition-colors"
                    >
                        <Eye className="h-4 w-4" />
                        Voir la page
                    </a>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 bg-[#0a0a0a] border border-white/10 rounded-xl p-1.5">
                <button
                    onClick={() => setActiveTab('general')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                        activeTab === 'general'
                            ? 'bg-[#ff6b00] text-black'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                    <Settings className="h-4 w-4" />
                    Parametres
                </button>
                <button
                    onClick={() => setActiveTab('design')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                        activeTab === 'design'
                            ? 'bg-[#ff6b00] text-black'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                    <Palette className="h-4 w-4" />
                    Design
                </button>
            </div>

            {/* General Tab */}
            {activeTab === 'general' && (
                <div className="space-y-6">
                    {/* Enable/Disable */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-[#ff6b00]/10 rounded-lg">
                                    <Globe className="h-6 w-6 text-[#ff6b00]" />
                                </div>
                                <div>
                                    <h2 className="font-display text-lg font-bold text-white uppercase tracking-wider">
                                        Page de reservation
                                    </h2>
                                    <p className="text-slate-500 text-sm font-mono">
                                        Activer les reservations en ligne
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsEnabled(!isEnabled)}
                                className={`relative w-14 h-8 rounded-full transition-colors ${
                                    isEnabled ? 'bg-[#ff6b00]' : 'bg-white/10'
                                }`}
                            >
                                <div
                                    className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${
                                        isEnabled ? 'left-7' : 'left-1'
                                    }`}
                                />
                            </button>
                        </div>

                        {isEnabled && slug && (
                            <div className="mt-4 p-3 bg-[#ff6b00]/5 border border-[#ff6b00]/20 rounded-lg">
                                <p className="text-sm text-slate-400">
                                    Votre page est accessible a :
                                </p>
                                <a
                                    href={`/${slug}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[#ff6b00] font-mono text-sm hover:underline"
                                >
                                    {typeof window !== 'undefined' ? window.location.origin : ''}/{slug}
                                </a>
                            </div>
                        )}
                    </motion.div>

                    {/* Slug */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6"
                    >
                        <h2 className="font-display text-lg font-bold text-white uppercase tracking-wider mb-4">
                            URL personnalisee
                        </h2>
                        <div>
                            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                                Identifiant de page
                            </label>
                            <div className="flex items-center gap-2">
                                <span className="text-slate-500 font-mono text-sm hidden md:block">.../</span>
                                <input
                                    type="text"
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6b00]/50"
                                    placeholder="mon-restaurant"
                                />
                            </div>
                        </div>
                    </motion.div>

                    {/* Booking Settings */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <Users className="h-5 w-5 text-[#ff6b00]" />
                            <h2 className="font-display text-lg font-bold text-white uppercase tracking-wider">
                                Limites de reservation
                            </h2>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                                    Personnes minimum
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    max={maxPartySize}
                                    value={minPartySize}
                                    onChange={(e) => setMinPartySize(parseInt(e.target.value) || 1)}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6b00]/50"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                                    Personnes maximum
                                </label>
                                <input
                                    type="number"
                                    min={minPartySize}
                                    max={100}
                                    value={maxPartySize}
                                    onChange={(e) => setMaxPartySize(parseInt(e.target.value) || 20)}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6b00]/50"
                                />
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Design Tab */}
            {activeTab === 'design' && (
                <div className="grid lg:grid-cols-2 gap-6">
                    <div className="space-y-6">
                        {/* Color Palettes */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <Palette className="h-5 w-5 text-[#ff6b00]" />
                                <h2 className="font-display text-lg font-bold text-white uppercase tracking-wider">
                                    Palette de couleurs
                                </h2>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
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

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-3">
                                <div>
                                    <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                                        Principale
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={primaryColor}
                                            onChange={(e) => setPrimaryColor(e.target.value)}
                                            className="w-10 h-10 rounded cursor-pointer flex-shrink-0"
                                        />
                                        <input
                                            type="text"
                                            value={primaryColor}
                                            onChange={(e) => setPrimaryColor(e.target.value)}
                                            className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-2 text-white font-mono text-xs"
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
                                            className="w-10 h-10 rounded cursor-pointer flex-shrink-0"
                                        />
                                        <input
                                            type="text"
                                            value={secondaryColor}
                                            onChange={(e) => setSecondaryColor(e.target.value)}
                                            className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-2 text-white font-mono text-xs"
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
                                            className="w-10 h-10 rounded cursor-pointer flex-shrink-0"
                                        />
                                        <input
                                            type="text"
                                            value={accentColor}
                                            onChange={(e) => setAccentColor(e.target.value)}
                                            className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-2 text-white font-mono text-xs"
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
                                <MessageSquare className="h-5 w-5 text-[#ff6b00]" />
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
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6b00]/50 resize-none"
                                        placeholder="Bienvenue, reservez votre table !"
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
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6b00]/50 resize-none"
                                        placeholder="Nous avons hate de vous accueillir !"
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
                            <h2 className="font-display text-lg font-bold text-white uppercase tracking-wider mb-2">
                                Informations affichees
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
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6b00]/50"
                                        placeholder="123 Rue Example, 75001 Paris"
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                                            Telephone
                                        </label>
                                        <input
                                            type="tel"
                                            value={displayPhone}
                                            onChange={(e) => setDisplayPhone(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6b00]/50"
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
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6b00]/50"
                                            placeholder="contact@restaurant.fr"
                                        />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Preview */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="hidden lg:block"
                    >
                        <div className="sticky top-24">
                            <h3 className="font-display text-sm font-bold text-white uppercase tracking-wider mb-4">
                                Apercu
                            </h3>
                            <div
                                className="rounded-xl overflow-hidden border border-white/10"
                                style={{ backgroundColor: secondaryColor }}
                            >
                                <div className="p-6 border-b border-white/10 text-center">
                                    <h4 className="text-xl font-bold text-white mb-1">
                                        {restaurant?.name}
                                    </h4>
                                    {welcomeMessage && (
                                        <p className="text-sm text-slate-400">{welcomeMessage}</p>
                                    )}
                                </div>

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
                                            Reserver
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Save Button */}
            <button
                onClick={handleSave}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-[#ff6b00] text-black font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-white transition-colors disabled:opacity-50"
            >
                {saving ? (
                    <div className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                    <>
                        <Save className="h-4 w-4" />
                        Enregistrer les modifications
                    </>
                )}
            </button>
        </div>
    );
}
