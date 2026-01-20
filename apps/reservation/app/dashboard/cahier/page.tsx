"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar,
    Clock,
    Users,
    Phone,
    X,
    BookOpen,
    UserCheck,
    ChevronLeft,
    ChevronRight,
    MapPin,
    Eye,
    EyeOff,
    AlertCircle,
    Check,
    User,
    Mail,
    MessageSquare
} from 'lucide-react';
import { useRestaurant } from '@/contexts/restaurant-context';
import { supabase } from '@/lib/supabase';
import { format, addDays, subDays, isToday, isTomorrow, isYesterday } from 'date-fns';
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
    tables?: { table_number: string; rooms?: { name: string } | null } | null;
}

interface Service {
    id: string;
    name: string;
    start_time: string;
    end_time: string;
}

interface Room {
    id: string;
    name: string;
    grid_width: number;
    grid_height: number;
}

interface Table {
    id: string;
    room_id: string;
    table_number: string;
    capacity: number;
    position_x: number;
    position_y: number;
    shape: 'square' | 'round' | 'rectangle';
}

export default function CahierPage() {
    const { restaurant } = useRestaurant();
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [tables, setTables] = useState<Table[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedService, setSelectedService] = useState<string | null>(null);
    const [showPlan, setShowPlan] = useState(false);
    const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

    const dateStr = format(selectedDate, 'yyyy-MM-dd');

    useEffect(() => {
        if (restaurant?.id) {
            fetchStaticData();
        }
    }, [restaurant?.id]);

    useEffect(() => {
        if (restaurant?.id) {
            fetchReservations();
        }
    }, [restaurant?.id, dateStr]);

    const fetchStaticData = async () => {
        if (!restaurant?.id) return;

        try {
            const [servicesRes, roomsRes, tablesRes] = await Promise.all([
                supabase
                    .from('services')
                    .select('*')
                    .eq('restaurant_id', restaurant.id)
                    .eq('is_active', true)
                    .order('start_time'),
                supabase
                    .from('rooms')
                    .select('*')
                    .eq('restaurant_id', restaurant.id)
                    .order('display_order'),
                supabase
                    .from('tables')
                    .select('*')
                    .eq('restaurant_id', restaurant.id)
                    .eq('is_active', true)
            ]);

            setServices(servicesRes.data || []);
            setRooms(roomsRes.data || []);
            setTables(tablesRes.data || []);

            if (servicesRes.data && servicesRes.data.length > 0) {
                setSelectedService(servicesRes.data[0].id);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchReservations = async () => {
        if (!restaurant?.id) return;

        try {
            const { data } = await supabase
                .from('reservations')
                .select(`*, services (name), tables (table_number, rooms (name))`)
                .eq('restaurant_id', restaurant.id)
                .eq('reservation_date', dateStr)
                .in('status', ['pending', 'confirmed'])
                .order('reservation_time');

            setReservations(data || []);
        } catch (error) {
            console.error('Error fetching reservations:', error);
        }
    };

    const handleStatusChange = async (reservationId: string, status: 'completed' | 'cancelled' | 'no_show') => {
        try {
            const { error } = await supabase
                .from('reservations')
                .update({ status })
                .eq('id', reservationId);

            if (error) throw error;
            setReservations(reservations.filter(r => r.id !== reservationId));
            setSelectedReservation(null);
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const goToPreviousDay = () => setSelectedDate(subDays(selectedDate, 1));
    const goToNextDay = () => setSelectedDate(addDays(selectedDate, 1));
    const goToToday = () => setSelectedDate(new Date());

    // Filtrer les réservations par service sélectionné
    const filteredReservations = selectedService
        ? reservations.filter(r => r.service_id === selectedService)
        : reservations;

    // Grouper par heure
    const reservationsByHour = filteredReservations.reduce((acc, res) => {
        const hour = res.reservation_time.slice(0, 5);
        if (!acc[hour]) acc[hour] = [];
        acc[hour].push(res);
        return acc;
    }, {} as Record<string, Reservation[]>);

    const sortedHours = Object.keys(reservationsByHour).sort();

    const totalReservations = reservations.length;
    const totalCovers = reservations.reduce((sum, r) => sum + r.party_size, 0);
    const serviceReservations = filteredReservations.length;
    const serviceCovers = filteredReservations.reduce((sum, r) => sum + r.party_size, 0);
    const pendingCount = filteredReservations.filter(r => r.status === 'pending').length;

    // Formater la date de manière lisible
    const getDateLabel = () => {
        if (isToday(selectedDate)) return "Aujourd'hui";
        if (isTomorrow(selectedDate)) return "Demain";
        if (isYesterday(selectedDate)) return "Hier";
        return format(selectedDate, 'EEEE d MMMM', { locale: fr });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="h-12 w-12 border-2 border-[#ff6b00] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
            {/* Header avec stats */}
            <div className="bg-gradient-to-r from-[#ff6b00]/10 to-transparent border border-[#ff6b00]/20 rounded-2xl p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 sm:p-3 bg-[#ff6b00] rounded-xl">
                            <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-black" />
                        </div>
                        <div>
                            <h1 className="font-display text-xl sm:text-2xl font-bold text-white uppercase tracking-wider">
                                Cahier du jour
                            </h1>
                            <p className="text-slate-400 text-xs sm:text-sm font-mono">
                                {restaurant?.name}
                            </p>
                        </div>
                    </div>

                    {/* Stats globales du jour */}
                    <div className="flex items-center gap-4 sm:gap-6">
                        <div className="text-center">
                            <p className="text-2xl sm:text-3xl font-bold text-[#ff6b00]">{totalReservations}</p>
                            <p className="text-[10px] sm:text-xs text-slate-500 font-mono uppercase">Résa</p>
                        </div>
                        <div className="w-px h-10 bg-white/10" />
                        <div className="text-center">
                            <p className="text-2xl sm:text-3xl font-bold text-white">{totalCovers}</p>
                            <p className="text-[10px] sm:text-xs text-slate-500 font-mono uppercase">Couverts</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation par date */}
            <div className="flex items-center justify-between bg-[#0a0a0a] border border-white/10 rounded-xl p-2 sm:p-3">
                <button
                    onClick={goToPreviousDay}
                    className="p-2 sm:p-2.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                    <ChevronLeft className="h-5 w-5" />
                </button>

                <div className="flex items-center gap-2 sm:gap-4">
                    {!isToday(selectedDate) && (
                        <button
                            onClick={goToToday}
                            className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                        >
                            Aujourd'hui
                        </button>
                    )}
                    <div className="text-center">
                        <p className={`text-base sm:text-lg font-bold capitalize ${isToday(selectedDate) ? 'text-[#ff6b00]' : 'text-white'}`}>
                            {getDateLabel()}
                        </p>
                        {!isToday(selectedDate) && !isTomorrow(selectedDate) && !isYesterday(selectedDate) && (
                            <p className="text-[10px] sm:text-xs text-slate-500 font-mono">
                                {format(selectedDate, 'yyyy')}
                            </p>
                        )}
                    </div>
                </div>

                <button
                    onClick={goToNextDay}
                    className="p-2 sm:p-2.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                    <ChevronRight className="h-5 w-5" />
                </button>
            </div>

            {/* Onglets services */}
            {services.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
                    {services.map(service => {
                        const count = reservations.filter(r => r.service_id === service.id).length;
                        const isActive = selectedService === service.id;
                        return (
                            <button
                                key={service.id}
                                onClick={() => setSelectedService(service.id)}
                                className={`relative flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all whitespace-nowrap flex-shrink-0 ${
                                    isActive
                                        ? 'bg-[#ff6b00] text-black shadow-lg shadow-[#ff6b00]/20'
                                        : 'bg-[#0a0a0a] border border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                                }`}
                            >
                                <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                {service.name}
                                {count > 0 && (
                                    <span className={`ml-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold ${
                                        isActive ? 'bg-black/20 text-black' : 'bg-white/10 text-white'
                                    }`}>
                                        {count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Alerte réservations en attente */}
            {pendingCount > 0 && (
                <div className="flex items-center gap-3 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                    <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0" />
                    <p className="text-sm text-amber-200">
                        <span className="font-bold">{pendingCount} réservation{pendingCount > 1 ? 's' : ''}</span> en attente de confirmation
                    </p>
                </div>
            )}

            {/* Stats du service */}
            {selectedService && serviceReservations > 0 && (
                <div className="flex items-center justify-between px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-xl">
                    <div className="flex items-center gap-4 text-sm">
                        <span className="text-slate-400">
                            <span className="font-bold text-white">{serviceReservations}</span> résa
                        </span>
                        <span className="text-slate-600">•</span>
                        <span className="text-slate-400">
                            <span className="font-bold text-white">{serviceCovers}</span> couverts
                        </span>
                    </div>
                    <button
                        onClick={() => setShowPlan(!showPlan)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                            showPlan
                                ? 'bg-[#ff6b00] text-black'
                                : 'bg-white/5 text-slate-400 hover:text-white'
                        }`}
                    >
                        {showPlan ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        <span className="hidden sm:inline">Plan</span>
                    </button>
                </div>
            )}

            {/* Plan de salle (optionnel) */}
            <AnimatePresence>
                {showPlan && rooms.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <RoomPlanView
                            rooms={rooms}
                            tables={tables}
                            reservations={filteredReservations}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Liste des réservations par heure */}
            {sortedHours.length > 0 ? (
                <div className="space-y-3">
                    {sortedHours.map(hour => (
                        <div key={hour} className="bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden">
                            {/* Header de l'heure */}
                            <div className="flex items-center gap-3 px-4 py-2.5 bg-white/5 border-b border-white/10">
                                <Clock className="h-4 w-4 text-[#ff6b00]" />
                                <span className="font-mono text-lg font-bold text-[#ff6b00]">{hour}</span>
                                <span className="text-xs text-slate-500 font-mono">
                                    {reservationsByHour[hour].length} résa • {reservationsByHour[hour].reduce((s, r) => s + r.party_size, 0)} couverts
                                </span>
                            </div>

                            {/* Réservations de cette heure */}
                            <div className="divide-y divide-white/5">
                                {reservationsByHour[hour].map(reservation => (
                                    <ReservationCard
                                        key={reservation.id}
                                        reservation={reservation}
                                        rooms={rooms}
                                        onStatusChange={handleStatusChange}
                                        onSelect={() => setSelectedReservation(reservation)}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-[#0a0a0a] border border-white/10 p-8 sm:p-12 rounded-xl text-center">
                    <Calendar className="h-12 w-12 text-slate-700 mx-auto mb-4" />
                    <p className="text-slate-400 font-medium mb-1">Aucune réservation</p>
                    <p className="text-slate-600 text-sm">
                        {services.find(s => s.id === selectedService)?.name} du {format(selectedDate, 'd MMMM', { locale: fr })}
                    </p>
                </div>
            )}

            {/* Modal détail réservation */}
            <AnimatePresence>
                {selectedReservation && (
                    <ReservationDetailModal
                        reservation={selectedReservation}
                        rooms={rooms}
                        tables={tables}
                        onClose={() => setSelectedReservation(null)}
                        onStatusChange={handleStatusChange}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// Composant carte réservation
function ReservationCard({
    reservation,
    rooms,
    onStatusChange,
    onSelect
}: {
    reservation: Reservation;
    rooms: Room[];
    onStatusChange: (id: string, status: 'completed' | 'cancelled' | 'no_show') => void;
    onSelect: () => void;
}) {
    const isPending = reservation.status === 'pending';
    const roomName = rooms.length > 1 && reservation.tables?.rooms?.name;

    return (
        <div
            className={`px-4 py-3 hover:bg-white/5 transition-colors cursor-pointer ${
                isPending ? 'border-l-2 border-l-amber-500' : ''
            }`}
            onClick={onSelect}
        >
            <div className="flex items-center justify-between gap-3">
                {/* Info client */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                        isPending ? 'bg-amber-500/20 text-amber-500' : 'bg-[#ff6b00]/20 text-[#ff6b00]'
                    }`}>
                        {reservation.party_size}
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-white truncate">{reservation.customer_name}</span>
                            {isPending && (
                                <span className="flex-shrink-0 px-1.5 py-0.5 bg-amber-500/20 text-amber-500 rounded text-[10px] font-bold uppercase">
                                    En attente
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mt-0.5">
                            <Phone className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{reservation.customer_phone}</span>
                        </div>
                    </div>
                </div>

                {/* Table assignée */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    {reservation.tables?.table_number ? (
                        <div className="text-right">
                            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#ff6b00]/10 text-[#ff6b00] rounded-lg">
                                <MapPin className="h-3.5 w-3.5" />
                                <span className="font-mono font-bold text-sm">{reservation.tables.table_number}</span>
                            </div>
                            {roomName && (
                                <p className="text-[10px] text-slate-500 mt-0.5 text-right">{roomName}</p>
                            )}
                        </div>
                    ) : (
                        <span className="px-2.5 py-1.5 bg-white/5 text-slate-500 rounded-lg text-xs font-mono">
                            Sans table
                        </span>
                    )}
                </div>

                {/* Actions rapides (desktop) */}
                <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onStatusChange(reservation.id, 'completed');
                        }}
                        className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500/20 transition-colors"
                        title="Client arrivé"
                    >
                        <Check className="h-4 w-4" />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onStatusChange(reservation.id, 'no_show');
                        }}
                        className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors"
                        title="No-show"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Notes si présentes */}
            {reservation.notes && (
                <div className="mt-2 ml-13 flex items-start gap-2 text-xs text-slate-400 bg-white/5 rounded-lg px-3 py-2">
                    <MessageSquare className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-1">{reservation.notes}</span>
                </div>
            )}
        </div>
    );
}

// Modal détail réservation
function ReservationDetailModal({
    reservation,
    rooms,
    tables,
    onClose,
    onStatusChange
}: {
    reservation: Reservation;
    rooms: Room[];
    tables: Table[];
    onClose: () => void;
    onStatusChange: (id: string, status: 'completed' | 'cancelled' | 'no_show') => void;
}) {
    const roomName = rooms.length > 1 && reservation.tables?.rooms?.name;

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 top-1/2 -translate-y-1/2 z-50 w-auto sm:w-full sm:max-w-md"
            >
                <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-[#ff6b00]/20 flex items-center justify-center">
                                <span className="text-xl font-bold text-[#ff6b00]">{reservation.party_size}</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-lg">{reservation.customer_name}</h3>
                                <p className="text-sm text-slate-400 font-mono">{reservation.reservation_time.slice(0, 5)}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Infos */}
                    <div className="p-5 space-y-4">
                        {/* Contact */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-3 text-sm">
                                <Phone className="h-4 w-4 text-slate-500" />
                                <a href={`tel:${reservation.customer_phone}`} className="text-white hover:text-[#ff6b00] transition-colors">
                                    {reservation.customer_phone}
                                </a>
                            </div>
                            {reservation.customer_email && (
                                <div className="flex items-center gap-3 text-sm">
                                    <Mail className="h-4 w-4 text-slate-500" />
                                    <a href={`mailto:${reservation.customer_email}`} className="text-white hover:text-[#ff6b00] transition-colors truncate">
                                        {reservation.customer_email}
                                    </a>
                                </div>
                            )}
                        </div>

                        {/* Table */}
                        <div className="flex items-center justify-between py-3 px-4 bg-white/5 rounded-xl">
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                                <MapPin className="h-4 w-4" />
                                <span>Table</span>
                            </div>
                            {reservation.tables?.table_number ? (
                                <div className="text-right">
                                    <span className="font-mono font-bold text-[#ff6b00]">{reservation.tables.table_number}</span>
                                    {roomName && <span className="text-slate-500 text-sm ml-2">({roomName})</span>}
                                </div>
                            ) : (
                                <span className="text-slate-500">Non assignée</span>
                            )}
                        </div>

                        {/* Notes */}
                        {reservation.notes && (
                            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                                <div className="flex items-start gap-2">
                                    <MessageSquare className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                                    <p className="text-sm text-amber-200">{reservation.notes}</p>
                                </div>
                            </div>
                        )}

                        {/* Status */}
                        {reservation.status === 'pending' && (
                            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-amber-500" />
                                <span className="text-sm text-amber-200">En attente de confirmation</span>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="p-5 pt-0 grid grid-cols-2 gap-3">
                        <button
                            onClick={() => onStatusChange(reservation.id, 'completed')}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 text-white rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-emerald-400 transition-colors"
                        >
                            <UserCheck className="h-4 w-4" />
                            Arrivé
                        </button>
                        <button
                            onClick={() => onStatusChange(reservation.id, 'no_show')}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-red-500/20 text-red-500 rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-red-500/30 transition-colors"
                        >
                            <X className="h-4 w-4" />
                            No-show
                        </button>
                    </div>
                </div>
            </motion.div>
        </>
    );
}

// Composant plan de salle simplifié
function RoomPlanView({
    rooms,
    tables,
    reservations
}: {
    rooms: Room[];
    tables: Table[];
    reservations: Reservation[];
}) {
    const [selectedRoom, setSelectedRoom] = useState(rooms[0]?.id);
    const currentRoom = rooms.find(r => r.id === selectedRoom);
    const roomTables = tables.filter(t => t.room_id === selectedRoom);
    const cellSize = 50;

    const getTableReservation = (tableId: string) => {
        return reservations.find(r => r.table_id === tableId);
    };

    if (!currentRoom) return null;

    return (
        <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-4 space-y-4">
            {/* Room tabs */}
            {rooms.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                    {rooms.map(room => (
                        <button
                            key={room.id}
                            onClick={() => setSelectedRoom(room.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                                selectedRoom === room.id
                                    ? 'bg-white text-black'
                                    : 'bg-white/5 text-slate-400 hover:text-white'
                            }`}
                        >
                            {room.name}
                        </button>
                    ))}
                </div>
            )}

            {/* Plan */}
            <div className="overflow-auto">
                <div
                    className="relative bg-[#050505] rounded-xl mx-auto"
                    style={{
                        width: currentRoom.grid_width * cellSize,
                        height: currentRoom.grid_height * cellSize,
                        minWidth: currentRoom.grid_width * cellSize,
                    }}
                >
                    {/* Grid */}
                    <div
                        className="absolute inset-0 pointer-events-none opacity-30"
                        style={{
                            backgroundSize: `${cellSize}px ${cellSize}px`,
                            backgroundImage: `
                                linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
                                linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)
                            `
                        }}
                    />

                    {/* Tables */}
                    {roomTables.map(table => {
                        const reservation = getTableReservation(table.id);
                        const hasReservation = !!reservation;
                        const size = cellSize - 10;

                        return (
                            <div
                                key={table.id}
                                className={`absolute flex flex-col items-center justify-center transition-all ${
                                    table.shape === 'round' ? 'rounded-full' : 'rounded-lg'
                                } ${
                                    hasReservation
                                        ? 'bg-[#ff6b00] text-black shadow-md shadow-[#ff6b00]/30'
                                        : 'bg-white/10 text-white/40 border border-white/10'
                                }`}
                                style={{
                                    left: table.position_x * cellSize + 5,
                                    top: table.position_y * cellSize + 5,
                                    width: size,
                                    height: size,
                                }}
                            >
                                <span className="font-mono text-xs font-bold">{table.table_number}</span>
                                {hasReservation && (
                                    <span className="text-[9px] opacity-80">{reservation.party_size}p</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Légende */}
            <div className="flex items-center justify-center gap-6 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#ff6b00]" />
                    <span>Réservée</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-white/10 border border-white/20" />
                    <span>Libre</span>
                </div>
            </div>
        </div>
    );
}
