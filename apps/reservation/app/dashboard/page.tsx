"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    BarChart3,
    TrendingUp,
    Users,
    Calendar,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    ArrowUp,
    ArrowDown
} from 'lucide-react';
import { useRestaurant } from '@/contexts/restaurant-context';
import { PermissionGuard } from '@/components/permission-guard';
import { supabase } from '@/lib/supabase';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DayStats {
    date: string;
    reservations: number;
    covers: number;
}

interface Stats {
    totalReservations: number;
    totalCovers: number;
    confirmedReservations: number;
    pendingReservations: number;
    cancelledReservations: number;
    noShowReservations: number;
    averagePartySize: number;
    confirmationRate: number;
}

export default function AnalysePage() {
    const { restaurant } = useRestaurant();
    const [period, setPeriod] = useState<'week' | 'month'>('week');
    const [stats, setStats] = useState<Stats>({
        totalReservations: 0,
        totalCovers: 0,
        confirmedReservations: 0,
        pendingReservations: 0,
        cancelledReservations: 0,
        noShowReservations: 0,
        averagePartySize: 0,
        confirmationRate: 0
    });
    const [chartData, setChartData] = useState<DayStats[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (restaurant?.id) {
            fetchAnalytics();
        }
    }, [restaurant?.id, period]);

    const fetchAnalytics = async () => {
        if (!restaurant?.id) return;
        setLoading(true);

        const now = new Date();
        const startDate = period === 'week'
            ? startOfWeek(now, { weekStartsOn: 1 })
            : startOfMonth(now);
        const endDate = period === 'week'
            ? endOfWeek(now, { weekStartsOn: 1 })
            : endOfMonth(now);

        try {
            // Fetch all reservations for the period
            const { data: reservations } = await supabase
                .from('reservations')
                .select('*')
                .eq('restaurant_id', restaurant.id)
                .gte('reservation_date', format(startDate, 'yyyy-MM-dd'))
                .lte('reservation_date', format(endDate, 'yyyy-MM-dd'));

            const allReservations = reservations || [];

            // Calculate stats
            const confirmed = allReservations.filter(r => r.status === 'confirmed').length;
            const pending = allReservations.filter(r => r.status === 'pending').length;
            const cancelled = allReservations.filter(r => r.status === 'cancelled').length;
            const noShow = allReservations.filter(r => r.status === 'no_show').length;
            const totalCovers = allReservations
                .filter(r => r.status !== 'cancelled')
                .reduce((sum, r) => sum + r.party_size, 0);
            const avgPartySize = allReservations.length > 0
                ? totalCovers / allReservations.length
                : 0;
            const confirmationRate = allReservations.length > 0
                ? (confirmed / allReservations.length) * 100
                : 0;

            setStats({
                totalReservations: allReservations.length,
                totalCovers,
                confirmedReservations: confirmed,
                pendingReservations: pending,
                cancelledReservations: cancelled,
                noShowReservations: noShow,
                averagePartySize: Math.round(avgPartySize * 10) / 10,
                confirmationRate: Math.round(confirmationRate)
            });

            // Prepare chart data
            const days = eachDayOfInterval({ start: startDate, end: endDate });
            const dayData: DayStats[] = days.map(day => {
                const dayStr = format(day, 'yyyy-MM-dd');
                const dayReservations = allReservations.filter(r => r.reservation_date === dayStr);
                const dayCovers = dayReservations
                    .filter(r => r.status !== 'cancelled')
                    .reduce((sum, r) => sum + r.party_size, 0);

                return {
                    date: format(day, 'EEE d', { locale: fr }),
                    reservations: dayReservations.length,
                    covers: dayCovers
                };
            });

            setChartData(dayData);
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const maxReservations = Math.max(...chartData.map(d => d.reservations), 1);
    const maxCovers = Math.max(...chartData.map(d => d.covers), 1);

    const statCards = [
        {
            label: "Total Réservations",
            value: stats.totalReservations,
            icon: Calendar,
            color: "#ff6b00",
            trend: null
        },
        {
            label: "Total Couverts",
            value: stats.totalCovers,
            icon: Users,
            color: "#00ff9d",
            trend: null
        },
        {
            label: "Taux de Confirmation",
            value: `${stats.confirmationRate}%`,
            icon: CheckCircle,
            color: "#00ff9d",
            trend: null
        },
        {
            label: "Taille Moyenne",
            value: stats.averagePartySize,
            icon: Users,
            color: "#ff6b00",
            trend: null
        }
    ];

    const statusCards = [
        {
            label: "Confirmées",
            value: stats.confirmedReservations,
            icon: CheckCircle,
            color: "#00ff9d"
        },
        {
            label: "En Attente",
            value: stats.pendingReservations,
            icon: Clock,
            color: "#ff6b00"
        },
        {
            label: "Annulées",
            value: stats.cancelledReservations,
            icon: XCircle,
            color: "#ef4444"
        },
        {
            label: "No-Show",
            value: stats.noShowReservations,
            icon: AlertCircle,
            color: "#f59e0b"
        }
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-slate-400">Chargement des analyses...</div>
            </div>
        );
    }

    return (
        <PermissionGuard module="analytics" action="view">
            <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="font-display text-3xl text-white uppercase tracking-wider">
                        Analyse
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Statistiques et tendances de vos réservations
                    </p>
                </div>

                {/* Period Selector */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setPeriod('week')}
                        className={`px-4 py-2 rounded-lg font-mono text-xs uppercase tracking-wider transition-all ${
                            period === 'week'
                                ? 'bg-[#ff6b00] text-black'
                                : 'bg-white/5 text-slate-400 hover:bg-white/10'
                        }`}
                    >
                        Semaine
                    </button>
                    <button
                        onClick={() => setPeriod('month')}
                        className={`px-4 py-2 rounded-lg font-mono text-xs uppercase tracking-wider transition-all ${
                            period === 'month'
                                ? 'bg-[#ff6b00] text-black'
                                : 'bg-white/5 text-slate-400 hover:bg-white/10'
                        }`}
                    >
                        Mois
                    </button>
                </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((card, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-6 rounded-xl border border-white/10 bg-white/5"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div
                                className="w-12 h-12 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: `${card.color}15` }}
                            >
                                <card.icon className="h-6 w-6" style={{ color: card.color }} />
                            </div>
                        </div>
                        <div className="text-3xl font-display font-bold text-white">
                            {card.value}
                        </div>
                        <div className="text-sm text-slate-400 uppercase tracking-wider font-mono mt-1">
                            {card.label}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statusCards.map((card, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + index * 0.1 }}
                        className="p-4 rounded-xl border border-white/10 bg-white/5"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <card.icon className="h-5 w-5" style={{ color: card.color }} />
                            <span className="text-xs text-slate-400 uppercase tracking-wider font-mono">
                                {card.label}
                            </span>
                        </div>
                        <div className="text-2xl font-display font-bold text-white">
                            {card.value}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Reservations Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="p-6 rounded-xl border border-white/10 bg-white/5"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <BarChart3 className="h-5 w-5 text-[#ff6b00]" />
                        <h3 className="font-display text-lg text-white uppercase tracking-wider">
                            Réservations par jour
                        </h3>
                    </div>
                    <div className="space-y-4">
                        {chartData.map((day, index) => (
                            <div key={index}>
                                <div className="flex items-center justify-between text-xs mb-1">
                                    <span className="text-slate-400 font-mono uppercase">{day.date}</span>
                                    <span className="text-white font-bold">{day.reservations}</span>
                                </div>
                                <div className="w-full bg-white/10 rounded-full h-2">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(day.reservations / maxReservations) * 100}%` }}
                                        transition={{ delay: 0.9 + index * 0.05, duration: 0.5 }}
                                        className="h-full rounded-full bg-gradient-to-r from-[#ff6b00] to-[#ff8533]"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Covers Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="p-6 rounded-xl border border-white/10 bg-white/5"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <Users className="h-5 w-5 text-[#00ff9d]" />
                        <h3 className="font-display text-lg text-white uppercase tracking-wider">
                            Couverts par jour
                        </h3>
                    </div>
                    <div className="space-y-4">
                        {chartData.map((day, index) => (
                            <div key={index}>
                                <div className="flex items-center justify-between text-xs mb-1">
                                    <span className="text-slate-400 font-mono uppercase">{day.date}</span>
                                    <span className="text-white font-bold">{day.covers}</span>
                                </div>
                                <div className="w-full bg-white/10 rounded-full h-2">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(day.covers / maxCovers) * 100}%` }}
                                        transition={{ delay: 0.9 + index * 0.05, duration: 0.5 }}
                                        className="h-full rounded-full bg-gradient-to-r from-[#00ff9d] to-[#00cc7d]"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
        </PermissionGuard>
    );
}
