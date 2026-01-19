"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Table2, Trash2, LayoutGrid } from 'lucide-react';
import { useRestaurant } from '@/contexts/restaurant-context';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface Room {
    id: string;
    name: string;
    grid_width: number;
    grid_height: number;
    is_active: boolean;
    display_order: number;
    tables_count?: number;
}

export default function RoomsPage() {
    const { restaurant } = useRestaurant();
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newRoomName, setNewRoomName] = useState('');
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        if (restaurant?.id) {
            fetchRooms();
        }
    }, [restaurant?.id]);

    const fetchRooms = async () => {
        if (!restaurant?.id) return;

        try {
            const { data, error } = await supabase
                .from('rooms')
                .select(`
                    *,
                    tables:tables(count)
                `)
                .eq('restaurant_id', restaurant.id)
                .order('display_order');

            if (error) throw error;

            const roomsWithCount = data?.map(room => ({
                ...room,
                tables_count: room.tables?.[0]?.count || 0
            })) || [];

            setRooms(roomsWithCount);
        } catch (error) {
            console.error('Error fetching rooms:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!restaurant?.id || !newRoomName.trim()) return;

        setCreating(true);
        try {
            const { data, error } = await supabase
                .from('rooms')
                .insert({
                    restaurant_id: restaurant.id,
                    name: newRoomName.trim(),
                    grid_width: 10,
                    grid_height: 8,
                    display_order: rooms.length
                })
                .select()
                .single();

            if (error) throw error;

            setRooms([...rooms, { ...data, tables_count: 0 }]);
            setShowCreateModal(false);
            setNewRoomName('');
        } catch (error) {
            console.error('Error creating room:', error);
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteRoom = async (roomId: string) => {
        if (!confirm('Supprimer cette salle et toutes ses tables ?')) return;

        try {
            const { error } = await supabase
                .from('rooms')
                .delete()
                .eq('id', roomId);

            if (error) throw error;

            setRooms(rooms.filter(r => r.id !== roomId));
        } catch (error) {
            console.error('Error deleting room:', error);
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
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="font-display text-2xl md:text-3xl font-bold text-white uppercase tracking-wider">
                        Salles
                    </h1>
                    <p className="text-slate-500 text-sm font-mono mt-1">
                        Gérez vos salles et configurez vos tables
                    </p>
                </div>

                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#ff6b00] text-black font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-white transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    Nouvelle salle
                </button>
            </div>

            {/* Rooms Grid */}
            {rooms.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#0a0a0a] border border-white/10 rounded-xl p-12 text-center"
                >
                    <Table2 className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                    <h3 className="font-display text-lg font-bold text-white uppercase tracking-wider mb-2">
                        Aucune salle
                    </h3>
                    <p className="text-slate-500 font-mono text-sm mb-6">
                        Créez votre première salle pour commencer à placer vos tables
                    </p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#ff6b00] text-black font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-white transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        Créer une salle
                    </button>
                </motion.div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {rooms.map((room, index) => (
                        <motion.div
                            key={room.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6 group hover:border-[#ff6b00]/30 transition-colors"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-[#ff6b00]/10 rounded-lg">
                                        <Table2 className="h-5 w-5 text-[#ff6b00]" />
                                    </div>
                                    <div>
                                        <h3 className="font-display text-lg font-bold text-white uppercase tracking-wider">
                                            {room.name}
                                        </h3>
                                        <p className="text-slate-500 text-xs font-mono">
                                            {room.tables_count} table{room.tables_count !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleDeleteRoom(room.id)}
                                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mb-4">
                                <span>Grille {room.grid_width}x{room.grid_height}</span>
                            </div>

                            <Link
                                href={`/dashboard/rooms/${room.id}`}
                                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-[#ff6b00]/10 border border-[#ff6b00]/30 rounded-lg text-[#ff6b00] font-bold text-xs uppercase tracking-widest hover:bg-[#ff6b00]/20 transition-colors"
                            >
                                <LayoutGrid className="h-4 w-4" />
                                Gerer les tables
                            </Link>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Create Room Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowCreateModal(false)}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md mx-4"
                        >
                            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
                                <h2 className="font-display text-xl font-bold text-white uppercase tracking-wider mb-6">
                                    Nouvelle salle
                                </h2>

                                <form onSubmit={handleCreateRoom} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                                            Nom de la salle
                                        </label>
                                        <input
                                            type="text"
                                            value={newRoomName}
                                            onChange={(e) => setNewRoomName(e.target.value)}
                                            required
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#ff6b00]/50 focus:border-[#ff6b00]/50 font-mono text-sm"
                                            placeholder="Ex: Salle principale, Terrasse..."
                                        />
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowCreateModal(false)}
                                            className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-colors"
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={creating || !newRoomName.trim()}
                                            className="flex-1 px-4 py-2.5 bg-[#ff6b00] text-black font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {creating ? (
                                                <div className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                'Créer'
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
