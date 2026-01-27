"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Globe, Palette, MessageSquare, Eye, Settings, Users, Clock, Mail, Plus, X } from 'lucide-react';
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
    notification_emails: string[];
}

const COLOR_PALETTES = [
    // Classiques
    { name: 'Neon', category: 'Classiques', primary: '#ff6b00', secondary: '#0a0a0a', accent: '#ffffff' },
    { name: 'Ocean', category: 'Classiques', primary: '#0ea5e9', secondary: '#0c1524', accent: '#ffffff' },
    { name: 'Sunset', category: 'Classiques', primary: '#f97316', secondary: '#1c0a04', accent: '#ffffff' },
    { name: 'Rose', category: 'Classiques', primary: '#ec4899', secondary: '#1a0612', accent: '#ffffff' },
    { name: 'Gold', category: 'Classiques', primary: '#eab308', secondary: '#1a1506', accent: '#ffffff' },
    { name: 'Purple', category: 'Classiques', primary: '#a855f7', secondary: '#12061a', accent: '#ffffff' },
    // Elegance
    { name: 'Bordeaux', category: 'Elegance', primary: '#9f1239', secondary: '#0a0506', accent: '#f5f0eb' },
    { name: 'Champagne', category: 'Elegance', primary: '#d4a574', secondary: '#1a1410', accent: '#faf5ef' },
    { name: 'Emeraude', category: 'Elegance', primary: '#059669', secondary: '#041a12', accent: '#f0fdf4' },
    { name: 'Saphir', category: 'Elegance', primary: '#2563eb', secondary: '#050d1e', accent: '#eff6ff' },
    { name: 'Noir & Or', category: 'Elegance', primary: '#d4af37', secondary: '#0a0a0a', accent: '#ffffff' },
    { name: 'Ivoire', category: 'Elegance', primary: '#92400e', secondary: '#faf5ef', accent: '#1a1207' },
    // Moderne
    { name: 'Menthe', category: 'Moderne', primary: '#10b981', secondary: '#0a0a0a', accent: '#ffffff' },
    { name: 'Corail', category: 'Moderne', primary: '#f43f5e', secondary: '#0f0507', accent: '#ffffff' },
    { name: 'Lavande', category: 'Moderne', primary: '#8b5cf6', secondary: '#0d0719', accent: '#f5f3ff' },
    { name: 'Cyan', category: 'Moderne', primary: '#06b6d4', secondary: '#061217', accent: '#ecfeff' },
    { name: 'Lime', category: 'Moderne', primary: '#84cc16', secondary: '#0a0f04', accent: '#ffffff' },
    { name: 'Fuchsia', category: 'Moderne', primary: '#d946ef', secondary: '#140518', accent: '#fdf4ff' },
    // Nature
    { name: 'Foret', category: 'Nature', primary: '#166534', secondary: '#050e08', accent: '#dcfce7' },
    { name: 'Terre', category: 'Nature', primary: '#a16207', secondary: '#120e04', accent: '#fefce8' },
    { name: 'Ciel', category: 'Nature', primary: '#0284c7', secondary: '#041928', accent: '#e0f2fe' },
    { name: 'Automne', category: 'Nature', primary: '#c2410c', secondary: '#140804', accent: '#fff7ed' },
    { name: 'Olive', category: 'Nature', primary: '#4d7c0f', secondary: '#0a0e04', accent: '#f7fee7' },
    { name: 'Ardoise', category: 'Nature', primary: '#475569', secondary: '#0f1117', accent: '#f1f5f9' },
    // Clair
    { name: 'Blanc Epure', category: 'Clair', primary: '#2563eb', secondary: '#ffffff', accent: '#1e293b' },
    { name: 'Blanc Rose', category: 'Clair', primary: '#e11d48', secondary: '#fff1f2', accent: '#1a1a2e' },
    { name: 'Blanc Vert', category: 'Clair', primary: '#16a34a', secondary: '#f0fdf4', accent: '#14532d' },
    { name: 'Creme', category: 'Clair', primary: '#b45309', secondary: '#fffbeb', accent: '#451a03' },
    { name: 'Gris Clair', category: 'Clair', primary: '#6366f1', secondary: '#f8fafc', accent: '#1e1b4b' },
    { name: 'Blanc Violet', category: 'Clair', primary: '#9333ea', secondary: '#faf5ff', accent: '#3b0764' },
];

const PALETTE_CATEGORIES = ['Classiques', 'Elegance', 'Moderne', 'Nature', 'Clair'] as const;

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
    const [notificationEmails, setNotificationEmails] = useState<string[]>([]);
    const [newEmail, setNewEmail] = useState('');
    const [showPaletteModal, setShowPaletteModal] = useState(false);

    useEffect(() => {
        if (showPaletteModal) {
            document.body.style.overflow = 'hidden';
            document.documentElement.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
        };
    }, [showPaletteModal]);

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
                setNotificationEmails(data.notification_emails || []);
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
                    notification_emails: notificationEmails,
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
                notification_emails: notificationEmails,
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

                    {/* Notification Emails */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <Mail className="h-5 w-5 text-[#ff6b00]" />
                            <h2 className="font-display text-lg font-bold text-white uppercase tracking-wider">
                                Notifications email
                            </h2>
                        </div>
                        <p className="text-slate-500 text-sm mb-4">
                            Ces adresses recevront une notification a chaque nouvelle reservation
                        </p>

                        {/* Liste des emails */}
                        {notificationEmails.length > 0 && (
                            <div className="space-y-2 mb-4">
                                {notificationEmails.map((email, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-4 py-3"
                                    >
                                        <span className="text-white font-mono text-sm">{email}</span>
                                        <button
                                            onClick={() => {
                                                setNotificationEmails(prev => prev.filter((_, i) => i !== index));
                                            }}
                                            className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Ajouter un email */}
                        <div className="flex gap-2">
                            <input
                                type="email"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && newEmail && newEmail.includes('@')) {
                                        e.preventDefault();
                                        if (!notificationEmails.includes(newEmail)) {
                                            setNotificationEmails(prev => [...prev, newEmail]);
                                            setNewEmail('');
                                        }
                                    }
                                }}
                                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6b00]/50"
                                placeholder="manager@restaurant.fr"
                            />
                            <button
                                onClick={() => {
                                    if (newEmail && newEmail.includes('@') && !notificationEmails.includes(newEmail)) {
                                        setNotificationEmails(prev => [...prev, newEmail]);
                                        setNewEmail('');
                                    }
                                }}
                                disabled={!newEmail || !newEmail.includes('@')}
                                className="px-4 py-3 bg-[#ff6b00] text-black font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Plus className="h-4 w-4" />
                            </button>
                        </div>

                        {notificationEmails.length === 0 && (
                            <p className="text-slate-600 text-xs mt-3 font-mono">
                                Aucun email configure. Les notifications seront envoyees a l'email du restaurant.
                            </p>
                        )}
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

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                                {COLOR_PALETTES.slice(0, 6).map((palette) => (
                                    <button
                                        key={palette.name}
                                        onClick={() => handlePaletteSelect(palette)}
                                        className={`p-3 rounded-lg border transition-all ${
                                            primaryColor === palette.primary && secondaryColor === palette.secondary
                                                ? 'border-white/50 ring-2 ring-white/20'
                                                : 'border-white/10 hover:border-white/20'
                                        }`}
                                        style={{ backgroundColor: palette.secondary }}
                                    >
                                        <div
                                            className="h-6 rounded mb-2"
                                            style={{ backgroundColor: palette.primary }}
                                        />
                                        <p className="text-xs text-center" style={{ color: `${palette.accent}80` }}>
                                            {palette.name}
                                        </p>
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setShowPaletteModal(true)}
                                className="w-full py-2.5 mb-6 text-xs font-bold uppercase tracking-widest text-slate-400 border border-white/10 rounded-lg hover:bg-white/5 hover:text-white transition-all"
                            >
                                Voir plus de palettes
                            </button>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-[10px] sm:text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                                        Principale
                                    </label>
                                    <div className="flex flex-col sm:flex-row items-center gap-2">
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
                                            className="w-full bg-white/5 border border-white/10 rounded px-1.5 sm:px-2 py-2 text-white font-mono text-[10px] sm:text-xs"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] sm:text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                                        Fond
                                    </label>
                                    <div className="flex flex-col sm:flex-row items-center gap-2">
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
                                            className="w-full bg-white/5 border border-white/10 rounded px-1.5 sm:px-2 py-2 text-white font-mono text-[10px] sm:text-xs"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] sm:text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                                        Accent
                                    </label>
                                    <div className="flex flex-col sm:flex-row items-center gap-2">
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
                                            className="w-full bg-white/5 border border-white/10 rounded px-1.5 sm:px-2 py-2 text-white font-mono text-[10px] sm:text-xs"
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
                                {/* Header */}
                                <div className="p-6 border-b border-white/10 text-center">
                                    <h4 className="text-xl font-bold mb-1" style={{ color: accentColor }}>
                                        {restaurant?.name}
                                    </h4>
                                    {welcomeMessage && (
                                        <p className="text-sm" style={{ color: `${accentColor}99` }}>{welcomeMessage}</p>
                                    )}
                                </div>

                                {/* Form card */}
                                <div className="p-6">
                                    <div
                                        className="rounded-lg p-4 space-y-4 border"
                                        style={{
                                            backgroundColor: `${primaryColor}08`,
                                            borderColor: `${accentColor}15`
                                        }}
                                    >
                                        {/* Party size */}
                                        <div className="flex items-center justify-between">
                                            <div
                                                className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                                                style={{ backgroundColor: `${accentColor}10`, color: accentColor }}
                                            >
                                                −
                                            </div>
                                            <span className="text-lg font-bold" style={{ color: accentColor }}>2 personnes</span>
                                            <div
                                                className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                                                style={{ backgroundColor: `${accentColor}10`, color: accentColor }}
                                            >
                                                +
                                            </div>
                                        </div>

                                        {/* Date buttons */}
                                        <div className="grid grid-cols-3 gap-2">
                                            {['Lun', 'Mar', 'Mer'].map((day, i) => (
                                                <div
                                                    key={day}
                                                    className="py-2 rounded-lg text-center text-xs font-bold"
                                                    style={{
                                                        backgroundColor: i === 1 ? primaryColor : `${accentColor}10`,
                                                        color: i === 1 ? secondaryColor : `${accentColor}80`
                                                    }}
                                                >
                                                    <div className="text-[9px] opacity-70">{day}</div>
                                                    <div>{27 + i}</div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* CTA */}
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

            {/* Palette Modal */}
            <AnimatePresence>
                {showPaletteModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-hidden"
                        onClick={() => setShowPaletteModal(false)}
                        onWheel={(e) => e.stopPropagation()}
                        onTouchMove={(e) => e.stopPropagation()}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-[#0a0a0a] border border-white/10 rounded-xl w-full max-w-lg max-h-[80vh] overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between p-4 border-b border-white/10">
                                <h3 className="font-display text-lg font-bold text-white uppercase tracking-wider">
                                    Palettes de couleurs
                                </h3>
                                <button
                                    onClick={() => setShowPaletteModal(false)}
                                    className="p-2 text-slate-400 hover:text-white transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <div className="overflow-y-auto p-4 space-y-6 max-h-[calc(80vh-64px)] overscroll-contain">
                                {PALETTE_CATEGORIES.map((category) => (
                                    <div key={category}>
                                        <h4 className="text-xs font-mono uppercase tracking-widest text-slate-500 mb-3">
                                            {category}
                                        </h4>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                            {COLOR_PALETTES.filter(p => p.category === category).map((palette) => (
                                                <button
                                                    key={palette.name}
                                                    onClick={() => {
                                                        handlePaletteSelect(palette);
                                                        setShowPaletteModal(false);
                                                    }}
                                                    className={`p-3 rounded-lg border transition-all ${
                                                        primaryColor === palette.primary && secondaryColor === palette.secondary
                                                            ? 'border-white/50 ring-2 ring-white/20'
                                                            : 'border-white/10 hover:border-white/20'
                                                    }`}
                                                    style={{ backgroundColor: palette.secondary }}
                                                >
                                                    <div
                                                        className="h-6 rounded mb-2"
                                                        style={{ backgroundColor: palette.primary }}
                                                    />
                                                    <p className="text-xs text-center" style={{ color: `${palette.accent}80` }}>
                                                        {palette.name}
                                                    </p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

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
