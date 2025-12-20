"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Settings2 } from 'lucide-react';
import { useRestaurant } from '@/contexts/restaurant-context';
import { supabase } from '@/lib/supabase';
import { GridEditor } from '@/components/room-mapper/grid-editor';
import { TableProperties } from '@/components/room-mapper/table-properties';
import Link from 'next/link';

interface Room {
    id: string;
    name: string;
    grid_width: number;
    grid_height: number;
    restaurant_id: string;
}

interface Table {
    id: string;
    room_id: string;
    restaurant_id: string;
    table_number: string;
    capacity: number;
    position_x: number;
    position_y: number;
    width: number;
    height: number;
    shape: 'square' | 'round' | 'rectangle';
    is_active: boolean;
}

export default function RoomEditorPage() {
    const params = useParams();
    const router = useRouter();
    const { restaurant } = useRestaurant();
    const roomId = params.roomId as string;

    const [room, setRoom] = useState<Room | null>(null);
    const [tables, setTables] = useState<Table[]>([]);
    const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [roomName, setRoomName] = useState('');
    const [gridWidth, setGridWidth] = useState(10);
    const [gridHeight, setGridHeight] = useState(8);

    useEffect(() => {
        if (roomId && restaurant?.id) {
            fetchRoom();
        }
    }, [roomId, restaurant?.id]);

    const fetchRoom = async () => {
        try {
            const [roomRes, tablesRes] = await Promise.all([
                supabase
                    .from('rooms')
                    .select('*')
                    .eq('id', roomId)
                    .single(),
                supabase
                    .from('tables')
                    .select('*')
                    .eq('room_id', roomId)
                    .eq('is_active', true)
            ]);

            if (roomRes.error) throw roomRes.error;

            setRoom(roomRes.data);
            setRoomName(roomRes.data.name);
            setGridWidth(roomRes.data.grid_width);
            setGridHeight(roomRes.data.grid_height);
            setTables(tablesRes.data || []);
        } catch (error) {
            console.error('Error fetching room:', error);
            router.push('/dashboard/rooms');
        } finally {
            setLoading(false);
        }
    };

    const handleTableAdd = useCallback(async (tableData: Partial<Table>) => {
        if (!restaurant?.id || !room) return;

        try {
            const { data, error } = await supabase
                .from('tables')
                .insert({
                    ...tableData,
                    restaurant_id: restaurant.id,
                    room_id: room.id
                })
                .select()
                .single();

            if (error) throw error;

            setTables(prev => [...prev, data]);
            setSelectedTableId(data.id);
        } catch (error) {
            console.error('Error adding table:', error);
        }
    }, [restaurant?.id, room]);

    const handleTableUpdate = useCallback(async (tableId: string, updates: Partial<Table>) => {
        try {
            const { error } = await supabase
                .from('tables')
                .update(updates)
                .eq('id', tableId);

            if (error) throw error;

            setTables(prev => prev.map(t =>
                t.id === tableId ? { ...t, ...updates } : t
            ));
        } catch (error) {
            console.error('Error updating table:', error);
        }
    }, []);

    const handleTableDelete = useCallback(async (tableId: string) => {
        try {
            const { error } = await supabase
                .from('tables')
                .delete()
                .eq('id', tableId);

            if (error) throw error;

            setTables(prev => prev.filter(t => t.id !== tableId));
            setSelectedTableId(null);
        } catch (error) {
            console.error('Error deleting table:', error);
        }
    }, []);

    const handleSaveRoomSettings = async () => {
        if (!room) return;

        setSaving(true);
        try {
            const { error } = await supabase
                .from('rooms')
                .update({
                    name: roomName,
                    grid_width: gridWidth,
                    grid_height: gridHeight
                })
                .eq('id', room.id);

            if (error) throw error;

            setRoom(prev => prev ? {
                ...prev,
                name: roomName,
                grid_width: gridWidth,
                grid_height: gridHeight
            } : null);
            setShowSettings(false);
        } catch (error) {
            console.error('Error saving room:', error);
        } finally {
            setSaving(false);
        }
    };

    const selectedTable = tables.find(t => t.id === selectedTableId);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="h-12 w-12 border-2 border-[#00ff9d] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!room) {
        return null;
    }

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard/rooms"
                        className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="font-display text-xl font-bold text-white uppercase tracking-wider">
                            {room.name}
                        </h1>
                        <p className="text-slate-500 text-xs font-mono">
                            {tables.length} table{tables.length !== 1 ? 's' : ''} configurée{tables.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => setShowSettings(!showSettings)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                        showSettings
                            ? 'bg-[#00ff9d] text-black'
                            : 'bg-white/5 text-white border border-white/10 hover:bg-white/10'
                    }`}
                >
                    <Settings2 className="h-4 w-4" />
                    Paramètres
                </button>
            </div>

            {/* Main content */}
            <div className="flex-1 flex gap-4 min-h-0">
                {/* Grid Editor */}
                <div className="flex-1 bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden">
                    <GridEditor
                        room={room}
                        tables={tables}
                        onTableAdd={handleTableAdd}
                        onTableUpdate={handleTableUpdate}
                        onTableDelete={handleTableDelete}
                        selectedTableId={selectedTableId}
                        onTableSelect={setSelectedTableId}
                    />
                </div>

                {/* Side Panel */}
                <div className="w-80 flex-shrink-0 space-y-4">
                    {/* Room Settings */}
                    {showSettings && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-[#0a0a0a] border border-white/10 rounded-xl p-4 space-y-4"
                        >
                            <h3 className="font-display text-sm font-bold text-white uppercase tracking-wider">
                                Paramètres de la salle
                            </h3>

                            <div>
                                <label className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2 block">
                                    Nom
                                </label>
                                <input
                                    type="text"
                                    value={roomName}
                                    onChange={(e) => setRoomName(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#00ff9d]/50"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2 block">
                                        Largeur
                                    </label>
                                    <input
                                        type="number"
                                        min={5}
                                        max={20}
                                        value={gridWidth}
                                        onChange={(e) => setGridWidth(parseInt(e.target.value) || 10)}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#00ff9d]/50"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2 block">
                                        Hauteur
                                    </label>
                                    <input
                                        type="number"
                                        min={5}
                                        max={20}
                                        value={gridHeight}
                                        onChange={(e) => setGridHeight(parseInt(e.target.value) || 8)}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#00ff9d]/50"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleSaveRoomSettings}
                                disabled={saving}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#00ff9d] text-black font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-white transition-colors disabled:opacity-50"
                            >
                                {saving ? (
                                    <div className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Save className="h-4 w-4" />
                                        Enregistrer
                                    </>
                                )}
                            </button>
                        </motion.div>
                    )}

                    {/* Table Properties */}
                    {selectedTable && (
                        <TableProperties
                            table={selectedTable}
                            onUpdate={(updates) => handleTableUpdate(selectedTable.id, updates)}
                        />
                    )}

                    {/* Help */}
                    {!selectedTable && !showSettings && (
                        <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-4">
                            <h3 className="font-display text-sm font-bold text-white uppercase tracking-wider mb-3">
                                Aide
                            </h3>
                            <ul className="space-y-2 text-xs text-slate-400 font-mono">
                                <li>• Cliquez sur "Ajouter une table" puis sur une case</li>
                                <li>• Glissez les tables pour les déplacer</li>
                                <li>• Cliquez sur une table pour modifier ses propriétés</li>
                                <li>• Utilisez les paramètres pour modifier la taille de la grille</li>
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
