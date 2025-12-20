"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CalendarCheck, Clock, Users, Table2, TrendingUp, AlertCircle } from 'lucide-react';
import { useRestaurant } from '@/contexts/restaurant-context';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';

interface Stats {
    todayReservations: number;
    pendingReservations: number;
    confirmedReservations: number;
    totalCovers: number;
    totalTables: number;
    totalRooms: number;
}

export default function DashboardPage() {
    const { restaurant } = useRestaurant();
    const [stats, setStats] = useState<Stats>({
        todayReservations: 0,
        pendingReservations: 0,
        confirmedReservations: 0,
        totalCovers: 0,
        totalTables: 0,
        totalRooms: 0
    });
    const [recentReservations, setRecentReservations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (restaurant?.id) {
            fetchData();
        }
    }, [restaurant?.id]);

    const fetchData = async () => {
        if (!restaurant?.id) return;

        const today = format(new Date(), 'yyyy-MM-dd');

        try {
            const [reservationsRes, tablesRes, roomsRes] = await Promise.all([
                supabase
                    .from('reservations')
                    .select('*')
                    .eq('restaurant_id', restaurant.id)
                    .eq('reservation_date', today),
                supabase
                    .from('tables')
                    .select('id')
                    .eq('restaurant_id', restaurant.id)
                    .eq('is_active', true),
                supabase
                    .from('rooms')
                    .select('id')
                    .eq('restaurant_id', restaurant.id)
                    .eq('is_active', true)
            ]);

            const reservations = reservationsRes.data || [];
            const pending = reservations.filter(r => r.status === 'pending').length;
            const confirmed = reservations.filter(r => r.status === 'confirmed').length;
            const covers = reservations
                .filter(r => r.status !== 'cancelled' && r.status !== 'no_show')
                .reduce((sum, r) => sum + r.party_size, 0);

            setStats({
                todayReservations: reservations.length,
                pendingReservations: pending,
                confirmedReservations: confirmed,
                totalCovers: covers,
                totalTables: tablesRes.data?.length || 0,
                totalRooms: roomsRes.data?.length || 0
            });

            // Get recent reservations
            const { data: recent } = await supabase
                .from('reservations')
                .select('*')
                .eq('restaurant_id', restaurant.id)
                .order('created_at', { ascending: false })
                .limit(5);

            setRecentReservations(recent || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        {
            label: "Réservations aujourd'hui",
            value: stats.todayReservations,
            icon: CalendarCheck,
            color: 'text-[#00ff9d]',
            bgColor: 'bg-[#00ff9d]/10'
        },
        {
            label: 'En attente',
            value: stats.pendingReservations,
            icon: Clock,
            color: 'text-yellow-500',
            bgColor: 'bg-yellow-500/10'
        },
        {
            label: 'Couverts prévus',
            value: stats.totalCovers,
            icon: Users,
            color: 'text-blue-400',
            bgColor: 'bg-blue-500/10'
        },
        {
            label: 'Tables configurées',
            value: stats.totalTables,
            icon: Table2,
            color: 'text-purple-400',
            bgColor: 'bg-purple-500/10'
        }
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="h-12 w-12 border-2 border-[#00ff9d] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="font-display text-2xl md:text-3xl font-bold text-white uppercase tracking-wider">
                        Dashboard
                    </h1>
                    <p className="text-slate-500 text-sm font-mono mt-1">
                        {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {statCards.map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-[#0a0a0a] border border-white/10 rounded-xl p-4"
                    >
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                            </div>
                            <div>
                                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                                <p className="text-xs text-slate-500 font-mono uppercase">{stat.label}</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Quick Actions & Recent */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Quick Actions */}
                <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6">
                    <h2 className="font-display text-lg font-bold text-white uppercase tracking-wider mb-4">
                        Actions rapides
                    </h2>
                    <div className="grid grid-cols-2 gap-3">
                        <Link
                            href="/dashboard/rooms"
                            className="flex flex-col items-center gap-2 p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-[#00ff9d]/30 transition-all group"
                        >
                            <Table2 className="h-6 w-6 text-slate-400 group-hover:text-[#00ff9d] transition-colors" />
                            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 group-hover:text-white">
                                Gérer les salles
                            </span>
                        </Link>
                        <Link
                            href="/dashboard/services"
                            className="flex flex-col items-center gap-2 p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-[#00ff9d]/30 transition-all group"
                        >
                            <Clock className="h-6 w-6 text-slate-400 group-hover:text-[#00ff9d] transition-colors" />
                            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 group-hover:text-white">
                                Services
                            </span>
                        </Link>
                        <Link
                            href="/dashboard/reservations"
                            className="flex flex-col items-center gap-2 p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-[#00ff9d]/30 transition-all group"
                        >
                            <CalendarCheck className="h-6 w-6 text-slate-400 group-hover:text-[#00ff9d] transition-colors" />
                            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 group-hover:text-white">
                                Réservations
                            </span>
                        </Link>
                        <Link
                            href="/dashboard/settings/page-builder"
                            className="flex flex-col items-center gap-2 p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-[#00ff9d]/30 transition-all group"
                        >
                            <TrendingUp className="h-6 w-6 text-slate-400 group-hover:text-[#00ff9d] transition-colors" />
                            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 group-hover:text-white">
                                Page publique
                            </span>
                        </Link>
                    </div>
                </div>

                {/* Recent Reservations */}
                <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-display text-lg font-bold text-white uppercase tracking-wider">
                            Dernières réservations
                        </h2>
                        <Link
                            href="/dashboard/reservations"
                            className="text-xs font-mono uppercase tracking-wider text-[#00ff9d] hover:underline"
                        >
                            Voir tout
                        </Link>
                    </div>

                    {recentReservations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <AlertCircle className="h-8 w-8 text-slate-600 mb-2" />
                            <p className="text-slate-500 font-mono text-sm">Aucune réservation</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {recentReservations.map((reservation) => (
                                <div
                                    key={reservation.id}
                                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                                >
                                    <div>
                                        <p className="text-white font-medium text-sm">
                                            {reservation.customer_name}
                                        </p>
                                        <p className="text-slate-500 text-xs font-mono">
                                            {format(new Date(reservation.reservation_date), 'dd/MM')} - {reservation.party_size} pers.
                                        </p>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-mono uppercase ${
                                        reservation.status === 'confirmed'
                                            ? 'bg-[#00ff9d]/10 text-[#00ff9d]'
                                            : reservation.status === 'pending'
                                            ? 'bg-yellow-500/10 text-yellow-500'
                                            : 'bg-red-500/10 text-red-500'
                                    }`}>
                                        {reservation.status === 'confirmed' ? 'Confirmé' :
                                         reservation.status === 'pending' ? 'En attente' : 'Annulé'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Setup Notice if no rooms */}
            {stats.totalRooms === 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#00ff9d]/5 border border-[#00ff9d]/20 rounded-xl p-6"
                >
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-[#00ff9d]/10 rounded-lg">
                            <AlertCircle className="h-6 w-6 text-[#00ff9d]" />
                        </div>
                        <div>
                            <h3 className="font-display text-lg font-bold text-white uppercase tracking-wider mb-1">
                                Configuration requise
                            </h3>
                            <p className="text-slate-400 text-sm mb-4">
                                Commencez par créer vos salles et vos tables pour pouvoir gérer vos réservations.
                            </p>
                            <Link
                                href="/dashboard/rooms"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-[#00ff9d] text-black font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-white transition-colors"
                            >
                                <Table2 className="h-4 w-4" />
                                Créer ma première salle
                            </Link>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
