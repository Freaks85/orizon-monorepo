"use client";

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Circle, Square, RectangleHorizontal } from 'lucide-react';

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

interface Room {
    id: string;
    name: string;
    grid_width: number;
    grid_height: number;
}

interface GridEditorProps {
    room: Room;
    tables: Table[];
    onTableAdd: (table: Partial<Table>) => void;
    onTableUpdate: (id: string, updates: Partial<Table>) => void;
    onTableDelete: (id: string) => void;
    selectedTableId: string | null;
    onTableSelect: (id: string | null) => void;
}

export function GridEditor({
    room,
    tables,
    onTableAdd,
    onTableUpdate,
    onTableDelete,
    selectedTableId,
    onTableSelect
}: GridEditorProps) {
    const [placementMode, setPlacementMode] = useState(false);
    const gridCellSize = 60;

    const handleCellClick = useCallback((x: number, y: number) => {
        if (placementMode) {
            const isOccupied = tables.some(
                t => t.position_x === x && t.position_y === y
            );

            if (!isOccupied) {
                const tableNumber = `T${tables.length + 1}`;
                onTableAdd({
                    room_id: room.id,
                    table_number: tableNumber,
                    capacity: 2,
                    position_x: x,
                    position_y: y,
                    width: 1,
                    height: 1,
                    shape: 'square'
                });
                setPlacementMode(false);
            }
        } else {
            onTableSelect(null);
        }
    }, [placementMode, tables, room.id, onTableAdd, onTableSelect]);

    const handleTableDragEnd = useCallback((tableId: string, event: any, info: any) => {
        const table = tables.find(t => t.id === tableId);
        if (!table) return;

        const newX = Math.round((table.position_x * gridCellSize + info.offset.x) / gridCellSize);
        const newY = Math.round((table.position_y * gridCellSize + info.offset.y) / gridCellSize);

        const x = Math.max(0, Math.min(newX, room.grid_width - 1));
        const y = Math.max(0, Math.min(newY, room.grid_height - 1));

        const isOccupied = tables.some(
            t => t.id !== tableId && t.position_x === x && t.position_y === y
        );

        if (!isOccupied) {
            onTableUpdate(tableId, { position_x: x, position_y: y });
        }
    }, [room, tables, onTableUpdate, gridCellSize]);

    const getShapeClass = (shape: string) => {
        switch (shape) {
            case 'round': return 'rounded-full';
            case 'rectangle': return 'rounded-lg';
            default: return 'rounded-lg';
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Toolbar */}
            <div className="flex items-center gap-3 p-4 border-b border-white/10 bg-[#0a0a0a]">
                <button
                    onClick={() => setPlacementMode(!placementMode)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                        placementMode
                            ? 'bg-[#00ff9d] text-black'
                            : 'bg-white/5 text-white border border-white/10 hover:bg-white/10'
                    }`}
                >
                    <Plus className="h-4 w-4" />
                    {placementMode ? 'Cliquez pour placer' : 'Ajouter une table'}
                </button>

                {selectedTableId && (
                    <button
                        onClick={() => {
                            onTableDelete(selectedTableId);
                            onTableSelect(null);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-red-500/20 transition-all"
                    >
                        <Trash2 className="h-4 w-4" />
                        Supprimer
                    </button>
                )}

                <div className="ml-auto text-xs text-slate-500 font-mono">
                    {tables.length} table{tables.length !== 1 ? 's' : ''} | Grille {room.grid_width}x{room.grid_height}
                </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-auto p-6 bg-[#050505]">
                <div
                    className="relative bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden"
                    style={{
                        width: room.grid_width * gridCellSize,
                        height: room.grid_height * gridCellSize,
                    }}
                >
                    {/* Grid lines */}
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            backgroundSize: `${gridCellSize}px ${gridCellSize}px`,
                            backgroundImage: `
                                linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
                                linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)
                            `
                        }}
                    />

                    {/* Clickable cells */}
                    {Array.from({ length: room.grid_width * room.grid_height }).map((_, i) => {
                        const x = i % room.grid_width;
                        const y = Math.floor(i / room.grid_width);
                        const isOccupied = tables.some(t => t.position_x === x && t.position_y === y);

                        return (
                            <div
                                key={`cell-${x}-${y}`}
                                className={`absolute transition-colors ${
                                    placementMode && !isOccupied
                                        ? 'cursor-pointer hover:bg-[#00ff9d]/20'
                                        : ''
                                }`}
                                style={{
                                    left: x * gridCellSize,
                                    top: y * gridCellSize,
                                    width: gridCellSize,
                                    height: gridCellSize,
                                }}
                                onClick={() => handleCellClick(x, y)}
                            />
                        );
                    })}

                    {/* Tables */}
                    {tables.map((table) => (
                        <motion.div
                            key={table.id}
                            drag
                            dragMomentum={false}
                            dragElastic={0}
                            onDragEnd={(e, info) => handleTableDragEnd(table.id, e, info)}
                            onClick={(e) => {
                                e.stopPropagation();
                                onTableSelect(table.id);
                            }}
                            className={`absolute cursor-move flex items-center justify-center text-xs font-bold transition-all ${
                                getShapeClass(table.shape)
                            } ${
                                selectedTableId === table.id
                                    ? 'bg-[#00ff9d] text-black ring-2 ring-[#00ff9d] ring-offset-2 ring-offset-[#0a0a0a] z-20'
                                    : 'bg-white/10 text-white border border-white/20 hover:border-[#00ff9d]/50'
                            }`}
                            style={{
                                left: table.position_x * gridCellSize + 4,
                                top: table.position_y * gridCellSize + 4,
                                width: table.width * gridCellSize - 8,
                                height: table.height * gridCellSize - 8,
                            }}
                            whileHover={{ scale: 1.02 }}
                            whileDrag={{ scale: 1.1, zIndex: 50 }}
                        >
                            <div className="text-center">
                                <div className="font-mono text-sm">{table.table_number}</div>
                                <div className="text-[10px] opacity-70">{table.capacity} pers.</div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
