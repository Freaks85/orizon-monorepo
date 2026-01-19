"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Users, Phone, X, BookOpen, UserCheck, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { useRestaurant } from '@/contexts/restaurant-context';
import { supabase } from '@/lib/supabase';
import { format, addDays, subDays, isToday } from 'date-fns';
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
    const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
    const [selectedService, setSelectedService] = useState<string | null>(null);

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

            if (roomsRes.data && roomsRes.data.length > 0) {
                setSelectedRoom(roomsRes.data[0].id);
            }
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
                .select(`*, services (name), tables (table_number)`)
                .eq('restaurant_id', restaurant.id)
                .eq('reservation_date', dateStr)
                .in('status', ['pending', 'confirmed'])
                .order('reservation_time');

            setReservations(data || []);
        } catch (error) {
            console.error('Error fetching reservations:', error);
        }
    };

    const handleStatusChange = async (reservationId: string, status: 'completed' | 'cancelled') => {
        try {
            const { error } = await supabase
                .from('reservations')
                .update({ status })
                .eq('id', reservationId);

            if (error) throw error;
            setReservations(reservations.filter(r => r.id !== reservationId));
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

    const totalReservations = reservations.length;
    const totalCovers = reservations.reduce((sum, r) => sum + r.party_size, 0);

    // Obtenir la réservation pour une table donnée
    const getTableReservation = (tableId: string) => {
        return filteredReservations.find(r => r.table_id === tableId);
    };

    // Taille de la table selon capacité
    const getTableSize = (capacity: number, shape: string, cellSize: number) => {
        const baseSize = cellSize - 8;
        if (shape === 'rectangle') {
            if (capacity <= 4) return { width: cellSize * 2 - 8, height: baseSize };
            if (capacity <= 6) return { width: cellSize * 2.5 - 8, height: baseSize };
            return { width: cellSize * 3 - 8, height: cellSize * 1.5 - 8 };
        }
        if (capacity <= 2) return { width: baseSize, height: baseSize };
        if (capacity <= 4) return { width: baseSize * 1.3, height: baseSize * 1.3 };
        if (capacity <= 6) return { width: baseSize * 1.6, height: baseSize * 1.6 };
        return { width: baseSize * 1.9, height: baseSize * 1.9 };
    };

    const getShapeClass = (shape: string) => {
        return shape === 'round' ? 'rounded-full' : 'rounded-xl';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="h-12 w-12 border-2 border-[#ff6b00] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const currentRoom = rooms.find(r => r.id === selectedRoom);
    const roomTables = tables.filter(t => t.room_id === selectedRoom);
    const cellSize = 60;

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-[#ff6b00]/10 rounded-xl">
                        <BookOpen className="h-6 w-6 text-[#ff6b00]" />
                    </div>
                    <div>
                        <h1 className="font-display text-2xl md:text-3xl font-bold text-white uppercase tracking-wider">
                            Cahier
                        </h1>
                        <p className="text-slate-500 text-sm font-mono mt-1">
                            Plan de salle & reservations
                        </p>
                    </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-[#ff6b00]">{totalReservations}</p>
                        <p className="text-[10px] text-slate-500 font-mono uppercase">Resa</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-white">{totalCovers}</p>
                        <p className="text-[10px] text-slate-500 font-mono uppercase">Couverts</p>
                    </div>
                </div>
            </div>

            {/* Date Navigation */}
            <div className="flex items-center justify-between bg-[#0a0a0a] border border-white/10 rounded-xl p-3">
                <button
                    onClick={goToPreviousDay}
                    className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                    <ChevronLeft className="h-5 w-5" />
                </button>

                <div className="flex items-center gap-4">
                    <button
                        onClick={goToToday}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                            isToday(selectedDate)
                                ? 'bg-[#ff6b00] text-black'
                                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                        }`}
                    >
                        Aujourd'hui
                    </button>
                    <div className="text-center">
                        <p className="text-lg font-bold text-white capitalize">
                            {format(selectedDate, 'EEEE d MMMM', { locale: fr })}
                        </p>
                        <p className="text-xs text-slate-500 font-mono">
                            {format(selectedDate, 'yyyy')}
                        </p>
                    </div>
                </div>

                <button
                    onClick={goToNextDay}
                    className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                    <ChevronRight className="h-5 w-5" />
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                {/* Room selector */}
                {rooms.length > 1 && (
                    <div className="flex gap-2">
                        {rooms.map(room => (
                            <button
                                key={room.id}
                                onClick={() => setSelectedRoom(room.id)}
                                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                                    selectedRoom === room.id
                                        ? 'bg-[#ff6b00] text-black'
                                        : 'bg-[#0a0a0a] border border-white/10 text-slate-400 hover:text-white'
                                }`}
                            >
                                {room.name}
                            </button>
                        ))}
                    </div>
                )}

                {/* Service selector */}
                <div className="flex gap-2 ml-auto">
                    {services.map(service => (
                        <button
                            key={service.id}
                            onClick={() => setSelectedService(service.id)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                                selectedService === service.id
                                    ? 'bg-white text-black'
                                    : 'bg-[#0a0a0a] border border-white/10 text-slate-400 hover:text-white'
                            }`}
                        >
                            {service.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Room Plan */}
            {currentRoom ? (
                <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6 overflow-auto">
                    <div
                        className="relative bg-[#050505] border border-white/10 rounded-xl mx-auto"
                        style={{
                            width: currentRoom.grid_width * cellSize,
                            height: currentRoom.grid_height * cellSize,
                        }}
                    >
                        {/* Grid */}
                        <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                                backgroundSize: `${cellSize}px ${cellSize}px`,
                                backgroundImage: `
                                    linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
                                    linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)
                                `
                            }}
                        />

                        {/* Tables */}
                        {roomTables.map(table => {
                            const reservation = getTableReservation(table.id);
                            const size = getTableSize(table.capacity, table.shape, cellSize);
                            const hasReservation = !!reservation;

                            return (
                                <motion.div
                                    key={table.id}
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className={`absolute flex flex-col items-center justify-center transition-all cursor-default ${
                                        getShapeClass(table.shape)
                                    } ${
                                        hasReservation
                                            ? 'bg-[#ff6b00] text-black shadow-lg shadow-[#ff6b00]/30'
                                            : 'bg-white/10 text-white/50 border border-white/20'
                                    }`}
                                    style={{
                                        left: table.position_x * cellSize + (cellSize - size.width) / 2,
                                        top: table.position_y * cellSize + (cellSize - size.height) / 2,
                                        width: size.width,
                                        height: size.height,
                                    }}
                                >
                                    {hasReservation ? (
                                        <div className="text-center px-1">
                                            <div className="font-mono text-[10px] font-bold opacity-70">
                                                {table.table_number}
                                            </div>
                                            <div className="font-bold text-xs truncate max-w-full">
                                                {reservation.customer_name.split(' ')[0]}
                                            </div>
                                            <div className="text-[10px] font-mono opacity-80">
                                                {reservation.party_size}p • {reservation.reservation_time.slice(0, 5)}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <div className="font-mono text-sm font-bold">{table.table_number}</div>
                                            <div className="text-[10px] opacity-60">{table.capacity}p</div>
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Legend */}
                    <div className="mt-4 flex items-center justify-center gap-6 text-xs text-slate-500 font-mono">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-[#ff6b00]" />
                            <span>Reservee</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-white/10 border border-white/20" />
                            <span>Libre</span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-[#0a0a0a] border border-white/10 p-12 rounded-xl text-center">
                    <Calendar className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-500 font-mono">Aucune salle configuree</p>
                </div>
            )}

            {/* Reservations List */}
            {filteredReservations.length > 0 && (
                <div className="bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-white/10 bg-white/5">
                        <h3 className="font-display text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                            <Clock className="h-4 w-4 text-[#ff6b00]" />
                            {services.find(s => s.id === selectedService)?.name} - {filteredReservations.length} reservation{filteredReservations.length > 1 ? 's' : ''}
                        </h3>
                    </div>
                    <div className="divide-y divide-white/5">
                        {filteredReservations.map(reservation => (
                            <div
                                key={reservation.id}
                                className="px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <span className="font-mono text-lg text-[#ff6b00] font-bold min-w-[50px]">
                                        {reservation.reservation_time.slice(0, 5)}
                                    </span>
                                    <div className="w-px h-8 bg-white/10" />
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-white font-bold">{reservation.customer_name}</span>
                                            <span className="flex items-center gap-1 px-2 py-0.5 bg-white/10 rounded text-xs font-mono text-white">
                                                <Users className="h-3 w-3" />
                                                {reservation.party_size}
                                            </span>
                                            {reservation.tables?.table_number && (
                                                <span className="flex items-center gap-1 px-2 py-0.5 bg-[#ff6b00]/10 text-[#ff6b00] rounded text-xs font-mono font-bold">
                                                    <MapPin className="h-3 w-3" />
                                                    {reservation.tables.table_number}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mt-1">
                                            <Phone className="h-3 w-3" />
                                            {reservation.customer_phone}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleStatusChange(reservation.id, 'completed')}
                                        className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500/20 transition-colors font-bold text-xs uppercase tracking-wider"
                                    >
                                        <UserCheck className="h-4 w-4" />
                                        Arrive
                                    </button>
                                    <button
                                        onClick={() => handleStatusChange(reservation.id, 'cancelled')}
                                        className="flex items-center gap-2 px-3 py-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors font-bold text-xs uppercase tracking-wider"
                                    >
                                        <X className="h-4 w-4" />
                                        Annuler
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {filteredReservations.length === 0 && (
                <div className="bg-[#0a0a0a] border border-white/10 p-8 rounded-xl text-center">
                    <p className="text-slate-500 font-mono">
                        Aucune reservation pour le {services.find(s => s.id === selectedService)?.name?.toLowerCase()}
                    </p>
                </div>
            )}
        </div>
    );
}
