"use client";

import React, { useState, useCallback, useRef } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';

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

// Taille visuelle en pixels selon la capacité
function getTablePixelSize(capacity: number, shape: string, cellSize: number): { width: number; height: number } {
    const baseSize = cellSize - 12;

    if (shape === 'rectangle') {
        if (capacity <= 4) return { width: cellSize * 2 - 12, height: baseSize };
        if (capacity <= 6) return { width: cellSize * 2.5 - 12, height: baseSize };
        if (capacity <= 8) return { width: cellSize * 3 - 12, height: cellSize * 1.5 - 12 };
        return { width: cellSize * 3.5 - 12, height: cellSize * 2 - 12 };
    }

    // Pour carré et rond - taille proportionnelle
    if (capacity <= 2) return { width: baseSize, height: baseSize };
    if (capacity <= 4) return { width: baseSize * 1.3, height: baseSize * 1.3 };
    if (capacity <= 6) return { width: baseSize * 1.6, height: baseSize * 1.6 };
    if (capacity <= 8) return { width: baseSize * 1.9, height: baseSize * 1.9 };
    return { width: baseSize * 2.2, height: baseSize * 2.2 };
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
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const gridRef = useRef<HTMLDivElement>(null);
    const gridCellSize = 70;

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
                    shape: 'round'
                });
                setPlacementMode(false);
            }
        } else {
            onTableSelect(null);
        }
    }, [placementMode, tables, room.id, onTableAdd, onTableSelect]);

    const handleMouseDown = useCallback((e: React.MouseEvent, tableId: string) => {
        e.preventDefault();
        e.stopPropagation();

        const table = tables.find(t => t.id === tableId);
        if (!table || !gridRef.current) return;

        const gridRect = gridRef.current.getBoundingClientRect();
        const tableX = table.position_x * gridCellSize;
        const tableY = table.position_y * gridCellSize;

        setDraggingId(tableId);
        setDragOffset({
            x: e.clientX - gridRect.left - tableX,
            y: e.clientY - gridRect.top - tableY
        });
        onTableSelect(tableId);
    }, [tables, gridCellSize, onTableSelect]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!draggingId || !gridRef.current) return;

        const gridRect = gridRef.current.getBoundingClientRect();
        const x = e.clientX - gridRect.left - dragOffset.x;
        const y = e.clientY - gridRect.top - dragOffset.y;

        // Calculer la position en grille
        const gridX = Math.round(x / gridCellSize);
        const gridY = Math.round(y / gridCellSize);

        // Limiter aux bords
        const clampedX = Math.max(0, Math.min(gridX, room.grid_width - 1));
        const clampedY = Math.max(0, Math.min(gridY, room.grid_height - 1));

        const table = tables.find(t => t.id === draggingId);
        if (table && (table.position_x !== clampedX || table.position_y !== clampedY)) {
            // Vérifier si la position est libre
            const isOccupied = tables.some(
                t => t.id !== draggingId && t.position_x === clampedX && t.position_y === clampedY
            );

            if (!isOccupied) {
                onTableUpdate(draggingId, { position_x: clampedX, position_y: clampedY });
            }
        }
    }, [draggingId, dragOffset, gridCellSize, room, tables, onTableUpdate]);

    const handleMouseUp = useCallback(() => {
        setDraggingId(null);
    }, []);

    const handleMouseLeave = useCallback(() => {
        setDraggingId(null);
    }, []);

    const getShapeClass = (shape: string) => {
        switch (shape) {
            case 'round': return 'rounded-full';
            case 'rectangle': return 'rounded-xl';
            default: return 'rounded-xl';
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
                            ? 'bg-[#ff6b00] text-black'
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
                    {tables.length} table{tables.length !== 1 ? 's' : ''} | Glissez pour deplacer
                </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-auto p-6 bg-[#050505]">
                <div
                    ref={gridRef}
                    className="relative bg-[#0a0a0a] border border-white/10 rounded-xl select-none"
                    style={{
                        width: room.grid_width * gridCellSize,
                        height: room.grid_height * gridCellSize,
                    }}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                >
                    {/* Grid cells */}
                    {Array.from({ length: room.grid_width * room.grid_height }).map((_, i) => {
                        const x = i % room.grid_width;
                        const y = Math.floor(i / room.grid_width);
                        const isOccupied = tables.some(t => t.position_x === x && t.position_y === y);
                        const isDragTarget = draggingId && !isOccupied;

                        return (
                            <div
                                key={`cell-${x}-${y}`}
                                className={`absolute border border-white/5 transition-colors ${
                                    placementMode && !isOccupied
                                        ? 'cursor-pointer hover:bg-[#ff6b00]/20 hover:border-[#ff6b00]/50'
                                        : isDragTarget
                                        ? 'bg-white/5'
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
                    {tables.map((table) => {
                        const size = getTablePixelSize(table.capacity, table.shape, gridCellSize);
                        const isSelected = selectedTableId === table.id;
                        const isDragging = draggingId === table.id;

                        return (
                            <div
                                key={table.id}
                                onMouseDown={(e) => handleMouseDown(e, table.id)}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (!draggingId) onTableSelect(table.id);
                                }}
                                className={`absolute flex items-center justify-center font-bold transition-all duration-100 ${
                                    getShapeClass(table.shape)
                                } ${
                                    isSelected
                                        ? 'bg-[#ff6b00] text-black shadow-lg shadow-[#ff6b00]/40 z-20'
                                        : 'bg-white/10 text-white border-2 border-white/30 hover:border-[#ff6b00]/50'
                                } ${
                                    isDragging
                                        ? 'cursor-grabbing z-50 scale-105 shadow-2xl'
                                        : 'cursor-grab hover:scale-102'
                                }`}
                                style={{
                                    left: table.position_x * gridCellSize + (gridCellSize - size.width) / 2,
                                    top: table.position_y * gridCellSize + (gridCellSize - size.height) / 2,
                                    width: size.width,
                                    height: size.height,
                                }}
                            >
                                <div className="text-center select-none pointer-events-none">
                                    <div className="font-mono text-sm font-bold">{table.table_number}</div>
                                    <div className={`text-[10px] ${isSelected ? 'text-black/70' : 'text-white/60'}`}>
                                        {table.capacity}p
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Legend */}
                <div className="mt-4 flex items-center gap-6 text-xs text-slate-500 font-mono">
                    <span>Taille selon capacite:</span>
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-white/10 border border-white/20" />
                        <span>2p</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20" />
                        <span>4p</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20" />
                        <span>6-8p</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
