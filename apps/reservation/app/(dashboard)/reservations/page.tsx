"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Users, Phone, Mail, Check, X, Table2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRestaurant } from '@/contexts/restaurant-context';
import { supabase } from '@/lib/supabase';
import { format, addDays, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Reservation {
    id: string;
    reservation_date: string;
    reservation_time: string;
    party_size: number;
    customer_name: string;
    customer_phone: string;
    customer_email: string | null;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
    notes: string | null;
    table_id: string | null;
    service_id: string | null;
    services?: { name: string } | null;
    tables?: { table_number: string } | null;
}

interface Table {
    id: string;
    table_number: string;
    capacity: number;
    rooms?: { name: string } | null;
}

export default function ReservationsPage() {
    const { restaurant } = useRestaurant();
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [tables, setTables] = useState<Table[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
    const [showTableModal, setShowTableModal] = useState(false);

    useEffect(() => {
        if (restaurant?.id) {
            fetchData();
        }
    }, [restaurant?.id, selectedDate]);

    const fetchData = async () => {
        if (!restaurant?.id) return;

        const dateStr = format(selectedDate, 'yyyy-MM-dd');

        try {
            const [reservationsRes, tablesRes] = await Promise.all([
                supabase
                    .from('reservations')
                    .select(`
                        *,
                        services (name),
                        tables (table_number)
                    `)
                    .eq('restaurant_id', restaurant.id)
                    .eq('reservation_date', dateStr)
                    .order('reservation_time'),
                supabase
                    .from('tables')
                    .select('*, rooms(name)')
                    .eq('restaurant_id', restaurant.id)
                    .eq('is_active', true)
            ]);

            setReservations(reservationsRes.data || []);
            setTables(tablesRes.data || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (reservationId: string, status: Reservation['status']) => {
        try {
            const { error } = await supabase
                .from('reservations')
                .update({ status })
                .eq('id', reservationId);

            if (error) throw error;

            setReservations(reservations.map(r =>
                r.id === reservationId ? { ...r, status } : r
            ));
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const handleTableAssign = async (tableId: string) => {
        if (!selectedReservation) return;

        try {
            const { error } = await supabase
                .from('reservations')
                .update({ table_id: tableId })
                .eq('id', selectedReservation.id);

            if (error) throw error;

            const table = tables.find(t => t.id === tableId);
            setReservations(reservations.map(r =>
                r.id === selectedReservation.id
                    ? { ...r, table_id: tableId, tables: { table_number: table?.table_number || '' } }
                    : r
            ));
            setShowTableModal(false);
            setSelectedReservation(null);
        } catch (error) {
            console.error('Error assigning table:', error);
        }
    };

    const pendingCount = reservations.filter(r => r.status === 'pending').length;
    const confirmedCount = reservations.filter(r => r.status === 'confirmed').length;
    const totalCovers = reservations
        .filter(r => r.status !== 'cancelled' && r.status !== 'no_show')
        .reduce((sum, r) => sum + r.party_size, 0);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'confirmed':
                return 'bg-[#00ff9d]/10 text-[#00ff9d]';
            case 'pending':
                return 'bg-yellow-500/10 text-yellow-500';
            case 'cancelled':
                return 'bg-red-500/10 text-red-500';
            case 'completed':
                return 'bg-blue-500/10 text-blue-400';
            case 'no_show':
                return 'bg-slate-500/10 text-slate-400';
            default:
                return 'bg-white/10 text-white';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'confirmed': return 'Confirmé';
            case 'pending': return 'En attente';
            case 'cancelled': return 'Annulé';
            case 'completed': return 'Terminé';
            case 'no_show': return 'Absent';
            default: return status;
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
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="font-display text-2xl md:text-3xl font-bold text-white uppercase tracking-wider">
                        Réservations
                    </h1>
                    <p className="text-slate-500 text-sm font-mono mt-1">
                        Gérez les réservations de votre restaurant
                    </p>
                </div>

                {/* Date Navigation */}
                <div className="flex items-center gap-2 bg-[#0a0a0a] border border-white/10 rounded-lg p-1">
                    <button
                        onClick={() => setSelectedDate(subDays(selectedDate, 1))}
                        className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <div className="px-4 py-2 text-white font-mono text-sm min-w-[180px] text-center">
                        {format(selectedDate, 'EEEE d MMMM', { locale: fr })}
                    </div>
                    <button
                        onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                        className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-[#0a0a0a] border border-white/10 p-4 rounded-xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-yellow-500/10">
                            <Clock className="h-5 w-5 text-yellow-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-yellow-500">{pendingCount}</p>
                            <p className="text-xs text-slate-500 font-mono uppercase">En attente</p>
                        </div>
                    </div>
                </div>
                <div className="bg-[#0a0a0a] border border-white/10 p-4 rounded-xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-[#00ff9d]/10">
                            <Check className="h-5 w-5 text-[#00ff9d]" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-[#00ff9d]">{confirmedCount}</p>
                            <p className="text-xs text-slate-500 font-mono uppercase">Confirmées</p>
                        </div>
                    </div>
                </div>
                <div className="bg-[#0a0a0a] border border-white/10 p-4 rounded-xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/10">
                            <Users className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-blue-400">{totalCovers}</p>
                            <p className="text-xs text-slate-500 font-mono uppercase">Couverts</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reservations List */}
            {reservations.length === 0 ? (
                <div className="bg-[#0a0a0a] border border-white/10 p-12 rounded-xl text-center">
                    <Calendar className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-500 font-mono">Aucune réservation pour cette date</p>
                </div>
            ) : (
                <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                        {reservations.map((reservation, index) => (
                            <motion.div
                                key={reservation.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-[#0a0a0a] border border-white/10 rounded-xl p-4 hover:border-white/20 transition-colors"
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    {/* Info */}
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-white/5 rounded-lg">
                                            <Clock className="h-5 w-5 text-[#00ff9d]" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="font-bold text-white">{reservation.customer_name}</h3>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase ${getStatusBadge(reservation.status)}`}>
                                                    {getStatusLabel(reservation.status)}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 font-mono">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {reservation.reservation_time.slice(0, 5)}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Users className="h-3 w-3" />
                                                    {reservation.party_size} pers.
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Phone className="h-3 w-3" />
                                                    {reservation.customer_phone}
                                                </span>
                                                {reservation.services?.name && (
                                                    <span className="text-[#00ff9d]">{reservation.services.name}</span>
                                                )}
                                                {reservation.tables?.table_number && (
                                                    <span className="flex items-center gap-1">
                                                        <Table2 className="h-3 w-3" />
                                                        {reservation.tables.table_number}
                                                    </span>
                                                )}
                                            </div>
                                            {reservation.notes && (
                                                <p className="text-xs text-slate-500 mt-2 italic">
                                                    "{reservation.notes}"
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 ml-auto">
                                        {reservation.status === 'pending' && (
                                            <>
                                                <button
                                                    onClick={() => handleStatusChange(reservation.id, 'confirmed')}
                                                    className="flex items-center gap-1 px-3 py-2 bg-[#00ff9d]/10 text-[#00ff9d] border border-[#00ff9d]/20 rounded-lg text-xs font-bold uppercase hover:bg-[#00ff9d]/20 transition-colors"
                                                >
                                                    <Check className="h-4 w-4" />
                                                    Confirmer
                                                </button>
                                                <button
                                                    onClick={() => handleStatusChange(reservation.id, 'cancelled')}
                                                    className="flex items-center gap-1 px-3 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg text-xs font-bold uppercase hover:bg-red-500/20 transition-colors"
                                                >
                                                    <X className="h-4 w-4" />
                                                    Refuser
                                                </button>
                                            </>
                                        )}
                                        {!reservation.table_id && reservation.status !== 'cancelled' && (
                                            <button
                                                onClick={() => {
                                                    setSelectedReservation(reservation);
                                                    setShowTableModal(true);
                                                }}
                                                className="flex items-center gap-1 px-3 py-2 bg-white/5 text-white border border-white/10 rounded-lg text-xs font-bold uppercase hover:bg-white/10 transition-colors"
                                            >
                                                <Table2 className="h-4 w-4" />
                                                Table
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Table Assignment Modal */}
            <AnimatePresence>
                {showTableModal && selectedReservation && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowTableModal(false)}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md mx-4"
                        >
                            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
                                <h2 className="font-display text-xl font-bold text-white uppercase tracking-wider mb-2">
                                    Assigner une table
                                </h2>
                                <p className="text-slate-500 text-sm font-mono mb-6">
                                    {selectedReservation.customer_name} - {selectedReservation.party_size} personnes
                                </p>

                                <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                                    {tables
                                        .filter(t => t.capacity >= selectedReservation.party_size)
                                        .map(table => (
                                            <button
                                                key={table.id}
                                                onClick={() => handleTableAssign(table.id)}
                                                className="p-3 bg-white/5 border border-white/10 rounded-lg hover:border-[#00ff9d]/50 hover:bg-[#00ff9d]/10 transition-all text-center"
                                            >
                                                <p className="font-mono text-white font-bold">{table.table_number}</p>
                                                <p className="text-xs text-slate-500">{table.capacity} pers.</p>
                                            </button>
                                        ))}
                                </div>

                                <button
                                    onClick={() => setShowTableModal(false)}
                                    className="w-full mt-4 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-colors"
                                >
                                    Annuler
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
