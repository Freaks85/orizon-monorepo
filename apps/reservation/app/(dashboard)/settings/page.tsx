"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Globe, Bell, Clock } from 'lucide-react';
import { useRestaurant } from '@/contexts/restaurant-context';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface ReservationSettings {
    id: string;
    is_enabled: boolean;
    slug: string | null;
    min_party_size: number;
    max_party_size: number;
    advance_booking_days: number;
    min_notice_hours: number;
}

export default function SettingsPage() {
    const { restaurant } = useRestaurant();
    const [settings, setSettings] = useState<ReservationSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form state
    const [isEnabled, setIsEnabled] = useState(false);
    const [slug, setSlug] = useState('');
    const [minPartySize, setMinPartySize] = useState(1);
    const [maxPartySize, setMaxPartySize] = useState(20);
    const [advanceBookingDays, setAdvanceBookingDays] = useState(30);
    const [minNoticeHours, setMinNoticeHours] = useState(2);

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
                // Create settings if not exist
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
                setIsEnabled(data.is_enabled);
                setSlug(data.slug || '');
                setMinPartySize(data.min_party_size);
                setMaxPartySize(data.max_party_size);
                setAdvanceBookingDays(data.advance_booking_days);
                setMinNoticeHours(data.min_notice_hours);
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
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
                    min_notice_hours: minNoticeHours
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
                min_notice_hours: minNoticeHours
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
                <div className="h-12 w-12 border-2 border-[#00ff9d] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="font-display text-2xl md:text-3xl font-bold text-white uppercase tracking-wider">
                    Paramètres
                </h1>
                <p className="text-slate-500 text-sm font-mono mt-1">
                    Configurez votre système de réservation
                </p>
            </div>

            {/* Enable/Disable */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-[#00ff9d]/10 rounded-lg">
                            <Globe className="h-6 w-6 text-[#00ff9d]" />
                        </div>
                        <div>
                            <h2 className="font-display text-lg font-bold text-white uppercase tracking-wider">
                                Page de réservation
                            </h2>
                            <p className="text-slate-500 text-sm font-mono">
                                Activer les réservations en ligne
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsEnabled(!isEnabled)}
                        className={`relative w-14 h-8 rounded-full transition-colors ${
                            isEnabled ? 'bg-[#00ff9d]' : 'bg-white/10'
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
                    <div className="mt-4 p-3 bg-[#00ff9d]/5 border border-[#00ff9d]/20 rounded-lg">
                        <p className="text-sm text-slate-400">
                            Votre page est accessible à :
                        </p>
                        <a
                            href={`/${slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#00ff9d] font-mono text-sm hover:underline"
                        >
                            reservation.orizonapp.com/{slug}
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
                    URL personnalisée
                </h2>
                <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                        Identifiant de page
                    </label>
                    <div className="flex items-center gap-2">
                        <span className="text-slate-500 font-mono text-sm">reservation.orizonapp.com/</span>
                        <input
                            type="text"
                            value={slug}
                            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#00ff9d]/50"
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
                <h2 className="font-display text-lg font-bold text-white uppercase tracking-wider mb-4">
                    Paramètres de réservation
                </h2>

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
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#00ff9d]/50"
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
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#00ff9d]/50"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                            Jours à l'avance max
                        </label>
                        <input
                            type="number"
                            min={1}
                            max={365}
                            value={advanceBookingDays}
                            onChange={(e) => setAdvanceBookingDays(parseInt(e.target.value) || 30)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#00ff9d]/50"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                            Délai minimum (heures)
                        </label>
                        <input
                            type="number"
                            min={0}
                            max={72}
                            value={minNoticeHours}
                            onChange={(e) => setMinNoticeHours(parseInt(e.target.value) || 2)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#00ff9d]/50"
                        />
                    </div>
                </div>
            </motion.div>

            {/* Page Builder Link */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <Link
                    href="/dashboard/settings/page-builder"
                    className="block bg-[#0a0a0a] border border-white/10 rounded-xl p-6 hover:border-[#00ff9d]/30 transition-colors"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-500/10 rounded-lg">
                                <Globe className="h-6 w-6 text-purple-400" />
                            </div>
                            <div>
                                <h2 className="font-display text-lg font-bold text-white uppercase tracking-wider">
                                    Personnaliser la page
                                </h2>
                                <p className="text-slate-500 text-sm font-mono">
                                    Couleurs, messages et informations affichées
                                </p>
                            </div>
                        </div>
                        <span className="text-[#00ff9d] text-xs font-mono uppercase">Configurer →</span>
                    </div>
                </Link>
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
                        Enregistrer les modifications
                    </>
                )}
            </button>
        </div>
    );
}
