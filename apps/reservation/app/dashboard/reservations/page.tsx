"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Users, Phone, Mail, Check, X, Filter, Search, ChevronDown, Table2 } from 'lucide-react';
import { useRestaurant } from '@/contexts/restaurant-context';
import { supabase } from '@/lib/supabase';
import { format, subDays, addDays } from 'date-fns';
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
    created_at: string;
    services?: { name: string } | null;
    tables?: { table_number: string } | null;
}

interface Table {
    id: string;
    table_number: string;
    capacity: number;
    rooms?: { name: string } | null;
}

type StatusFilter = 'all' | 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';

export default function ReservationsListPage() {
    const { restaurant } = useRestaurant();
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [tables, setTables] = useState<Table[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
    const [showTableModal, setShowTableModal] = useState(false);

    useEffect(() => {
        if (restaurant?.id) {
            fetchData();
        }
    }, [restaurant?.id]);

    const fetchData = async () => {
        if (!restaurant?.id) return;

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
                    .order('created_at', { ascending: false }),
                supabase
                    .from('tables')
                    .select('*, rooms(name)')
                    .eq('restaurant_id', restaurant.id)
                    .eq('is_active', true)
            ]);

            if (reservationsRes.error) throw reservationsRes.error;
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
            // For confirmation, use the API that sends the email
            if (status === 'confirmed') {
                const response = await fetch(`/api/reservations/${reservationId}/confirm`, {
                    method: 'POST',
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || 'Failed to confirm reservation');
                }
            } else {
                // For other status changes, update directly
                const { error } = await supabase
                    .from('reservations')
                    .update({ status })
                    .eq('id', reservationId);

                if (error) throw error;
            }

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

    const filteredReservations = reservations.filter(r => {
        // Status filter
        if (statusFilter !== 'all' && r.status !== statusFilter) return false;

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                r.customer_name.toLowerCase().includes(query) ||
                r.customer_phone.includes(query) ||
                (r.customer_email && r.customer_email.toLowerCase().includes(query))
            );
        }

        return true;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'confirmed':
                return 'bg-[#ff6b00]/10 text-[#ff6b00]';
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
            case 'confirmed': return 'Confirme';
            case 'pending': return 'En attente';
            case 'cancelled': return 'Annule';
            case 'completed': return 'Termine';
            case 'no_show': return 'Absent';
            default: return status;
        }
    };

    const statusCounts = {
        all: reservations.length,
        pending: reservations.filter(r => r.status === 'pending').length,
        confirmed: reservations.filter(r => r.status === 'confirmed').length,
        cancelled: reservations.filter(r => r.status === 'cancelled').length,
        completed: reservations.filter(r => r.status === 'completed').length,
        no_show: reservations.filter(r => r.status === 'no_show').length,
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="h-12 w-12 border-2 border-[#ff6b00] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="font-display text-2xl md:text-3xl font-bold text-white uppercase tracking-wider">
                        Reservations
                    </h1>
                    <p className="text-slate-500 text-sm font-mono mt-1">
                        {filteredReservations.length} reservation{filteredReservations.length !== 1 ? 's' : ''}
                    </p>
                </div>

                {/* Search */}
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Rechercher un client..."
                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#ff6b00]/50 font-mono text-sm"
                    />
                </div>
            </div>

            {/* Status Filters */}
            <div className="flex flex-wrap gap-2">
                {(['all', 'pending', 'confirmed', 'completed', 'cancelled', 'no_show'] as StatusFilter[]).map((status) => (
                    <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider transition-all ${
                            statusFilter === status
                                ? 'bg-[#ff6b00] text-black font-bold'
                                : 'bg-[#0a0a0a] border border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                        }`}
                    >
                        {status === 'all' ? 'Toutes' : getStatusLabel(status)} ({statusCounts[status]})
                    </button>
                ))}
            </div>

            {/* Reservations List */}
            {filteredReservations.length === 0 ? (
                <div className="bg-[#0a0a0a] border border-white/10 p-8 sm:p-12 rounded-xl text-center">
                    <Calendar className="h-10 w-10 sm:h-12 sm:w-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-500 font-mono text-sm">Aucune reservation trouvee</p>
                </div>
            ) : (
                <>
                    {/* Mobile: Card View */}
                    <div className="md:hidden space-y-3">
                        {filteredReservations.map((reservation, index) => (
                            <motion.div
                                key={reservation.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.02 }}
                                className="bg-[#0a0a0a] border border-white/10 rounded-xl p-4"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="text-center">
                                            <p className="text-[#ff6b00] font-mono text-lg font-bold">{reservation.reservation_time.slice(0, 5)}</p>
                                            <p className="text-slate-500 font-mono text-xs">{format(new Date(reservation.reservation_date), 'dd/MM')}</p>
                                        </div>
                                        <div className="w-px h-10 bg-white/10" />
                                        <div>
                                            <p className="text-white font-bold">{reservation.customer_name}</p>
                                            <p className="text-slate-500 text-xs font-mono">{reservation.customer_phone}</p>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-mono uppercase ${getStatusBadge(reservation.status)}`}>
                                        {getStatusLabel(reservation.status)}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2 flex-wrap mb-3">
                                    <span className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded text-xs font-mono text-slate-400">
                                        <Users className="h-3 w-3" />
                                        {reservation.party_size} pers.
                                    </span>
                                    {reservation.services?.name && (
                                        <span className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded text-xs font-mono text-slate-400">
                                            <Clock className="h-3 w-3" />
                                            {reservation.services.name}
                                        </span>
                                    )}
                                    {reservation.table_id ? (
                                        <span className="flex items-center gap-1 px-2 py-1 bg-[#ff6b00]/10 border border-[#ff6b00]/30 rounded text-[#ff6b00] text-xs font-mono font-bold">
                                            <Table2 className="h-3 w-3" />
                                            {reservation.tables?.table_number}
                                        </span>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                setSelectedReservation(reservation);
                                                setShowTableModal(true);
                                            }}
                                            className="flex items-center gap-1 px-2 py-1 bg-white/5 border border-white/10 rounded text-slate-400 text-xs font-mono hover:border-[#ff6b00]/30 hover:text-[#ff6b00] transition-all"
                                        >
                                            <Table2 className="h-3 w-3" />
                                            Placer
                                        </button>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 pt-3 border-t border-white/10">
                                    {reservation.status === 'pending' && (
                                        <>
                                            <button
                                                onClick={() => handleStatusChange(reservation.id, 'confirmed')}
                                                className="flex-1 flex items-center justify-center gap-2 py-2 bg-[#ff6b00]/10 text-[#ff6b00] rounded-lg hover:bg-[#ff6b00]/20 transition-colors text-xs font-bold uppercase"
                                            >
                                                <Check className="h-4 w-4" />
                                                Confirmer
                                            </button>
                                            <button
                                                onClick={() => handleStatusChange(reservation.id, 'cancelled')}
                                                className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors text-xs font-bold uppercase"
                                            >
                                                <X className="h-4 w-4" />
                                                Annuler
                                            </button>
                                        </>
                                    )}
                                    {reservation.status === 'confirmed' && (
                                        <button
                                            onClick={() => handleStatusChange(reservation.id, 'completed')}
                                            className="flex-1 py-2 bg-blue-500/10 text-blue-400 rounded-lg text-xs font-mono uppercase hover:bg-blue-500/20 transition-colors"
                                        >
                                            Marquer termine
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Desktop: Table View */}
                    <div className="hidden md:block bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left px-4 py-3 text-xs font-mono uppercase tracking-wider text-slate-500">Date</th>
                                    <th className="text-left px-4 py-3 text-xs font-mono uppercase tracking-wider text-slate-500">Heure</th>
                                    <th className="text-left px-4 py-3 text-xs font-mono uppercase tracking-wider text-slate-500">Client</th>
                                    <th className="text-left px-4 py-3 text-xs font-mono uppercase tracking-wider text-slate-500">Couverts</th>
                                    <th className="text-left px-4 py-3 text-xs font-mono uppercase tracking-wider text-slate-500">Service</th>
                                    <th className="text-left px-4 py-3 text-xs font-mono uppercase tracking-wider text-slate-500">Table</th>
                                    <th className="text-left px-4 py-3 text-xs font-mono uppercase tracking-wider text-slate-500">Statut</th>
                                    <th className="text-right px-4 py-3 text-xs font-mono uppercase tracking-wider text-slate-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredReservations.map((reservation, index) => (
                                    <motion.tr
                                        key={reservation.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: index * 0.02 }}
                                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                                    >
                                        <td className="px-4 py-4">
                                            <span className="text-white font-mono text-sm">
                                                {format(new Date(reservation.reservation_date), 'dd/MM/yyyy')}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="text-[#ff6b00] font-mono text-sm font-bold">
                                                {reservation.reservation_time.slice(0, 5)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div>
                                                <p className="text-white font-bold text-sm">{reservation.customer_name}</p>
                                                <p className="text-slate-500 text-xs font-mono">{reservation.customer_phone}</p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="text-slate-400 font-mono text-sm">
                                                {reservation.party_size} pers.
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="text-slate-400 text-sm">
                                                {reservation.services?.name || '-'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            {reservation.table_id ? (
                                                <span className="flex items-center gap-1.5 px-2 py-1 bg-[#ff6b00]/10 border border-[#ff6b00]/30 rounded text-[#ff6b00] text-xs font-mono font-bold w-fit">
                                                    <Table2 className="h-3 w-3" />
                                                    {reservation.tables?.table_number}
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        setSelectedReservation(reservation);
                                                        setShowTableModal(true);
                                                    }}
                                                    className="flex items-center gap-1.5 px-2 py-1 bg-white/5 border border-white/10 rounded text-slate-400 text-xs font-mono hover:border-[#ff6b00]/30 hover:text-[#ff6b00] transition-all"
                                                >
                                                    <Table2 className="h-3 w-3" />
                                                    Placer
                                                </button>
                                            )}
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-mono uppercase ${getStatusBadge(reservation.status)}`}>
                                                {getStatusLabel(reservation.status)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            {reservation.status === 'pending' && (
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleStatusChange(reservation.id, 'confirmed')}
                                                        className="p-2 bg-[#ff6b00]/10 text-[#ff6b00] rounded-lg hover:bg-[#ff6b00]/20 transition-colors"
                                                        title="Confirmer"
                                                    >
                                                        <Check className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusChange(reservation.id, 'cancelled')}
                                                        className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors"
                                                        title="Annuler"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            )}
                                            {reservation.status === 'confirmed' && (
                                                <button
                                                    onClick={() => handleStatusChange(reservation.id, 'completed')}
                                                    className="px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-lg text-xs font-mono uppercase hover:bg-blue-500/20 transition-colors"
                                                >
                                                    Terminer
                                                </button>
                                            )}
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
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
                            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg mx-4"
                        >
                            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
                                <h2 className="font-display text-xl font-bold text-white uppercase tracking-wider mb-2">
                                    Assigner une table
                                </h2>
                                <p className="text-slate-500 text-sm font-mono mb-6">
                                    {selectedReservation.customer_name} - {selectedReservation.party_size} personnes a {selectedReservation.reservation_time.slice(0, 5)}
                                </p>

                                <div className="grid grid-cols-4 gap-3 max-h-60 overflow-y-auto">
                                    {tables
                                        .filter(t => t.capacity >= selectedReservation.party_size)
                                        .map(table => (
                                            <button
                                                key={table.id}
                                                onClick={() => handleTableAssign(table.id)}
                                                className="p-4 rounded-xl text-center transition-all bg-white/5 border border-white/10 hover:border-[#ff6b00]/50 hover:bg-[#ff6b00]/10"
                                            >
                                                <p className="font-mono text-lg font-bold text-white">
                                                    {table.table_number}
                                                </p>
                                                <p className="text-xs text-slate-500">{table.capacity} pers.</p>
                                                {table.rooms?.name && (
                                                    <p className="text-[10px] text-slate-600 mt-1">{table.rooms.name}</p>
                                                )}
                                            </button>
                                        ))}
                                </div>

                                {tables.filter(t => t.capacity >= selectedReservation.party_size).length === 0 && (
                                    <p className="text-center text-slate-500 py-4">
                                        Aucune table disponible pour {selectedReservation.party_size} personnes
                                    </p>
                                )}

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
