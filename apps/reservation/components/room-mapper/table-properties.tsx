"use client";

import { useState, useEffect } from 'react';
import { Circle, Square, RectangleHorizontal, Users, Hash } from 'lucide-react';

interface Table {
    id: string;
    table_number: string;
    capacity: number;
    shape: 'square' | 'round' | 'rectangle';
}

interface TablePropertiesProps {
    table: Table;
    onUpdate: (updates: Partial<Table>) => void;
}

export function TableProperties({ table, onUpdate }: TablePropertiesProps) {
    const [tableNumber, setTableNumber] = useState(table.table_number);
    const [capacity, setCapacity] = useState(table.capacity);
    const [shape, setShape] = useState(table.shape);

    useEffect(() => {
        setTableNumber(table.table_number);
        setCapacity(table.capacity);
        setShape(table.shape);
    }, [table]);

    const handleUpdate = (field: string, value: any) => {
        onUpdate({ [field]: value });
    };

    const shapes = [
        { value: 'square', icon: Square, label: 'Carré' },
        { value: 'round', icon: Circle, label: 'Rond' },
        { value: 'rectangle', icon: RectangleHorizontal, label: 'Rectangle' },
    ];

    return (
        <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-4 space-y-4">
            <h3 className="font-display text-sm font-bold text-white uppercase tracking-wider">
                Propriétés de la table
            </h3>

            {/* Table Number */}
            <div>
                <label className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                    <Hash className="h-3 w-3" />
                    Numéro
                </label>
                <input
                    type="text"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    onBlur={() => handleUpdate('table_number', tableNumber)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6b00]/50"
                />
            </div>

            {/* Capacity */}
            <div>
                <label className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                    <Users className="h-3 w-3" />
                    Capacité
                </label>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            const newCapacity = Math.max(1, capacity - 1);
                            setCapacity(newCapacity);
                            handleUpdate('capacity', newCapacity);
                        }}
                        className="w-10 h-10 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors font-bold"
                    >
                        -
                    </button>
                    <input
                        type="number"
                        min={1}
                        max={20}
                        value={capacity}
                        onChange={(e) => {
                            const val = parseInt(e.target.value) || 1;
                            setCapacity(val);
                            handleUpdate('capacity', val);
                        }}
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white font-mono text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#ff6b00]/50"
                    />
                    <button
                        onClick={() => {
                            const newCapacity = Math.min(20, capacity + 1);
                            setCapacity(newCapacity);
                            handleUpdate('capacity', newCapacity);
                        }}
                        className="w-10 h-10 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors font-bold"
                    >
                        +
                    </button>
                </div>
            </div>

            {/* Shape */}
            <div>
                <label className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2 block">
                    Forme
                </label>
                <div className="grid grid-cols-3 gap-2">
                    {shapes.map(({ value, icon: Icon, label }) => (
                        <button
                            key={value}
                            onClick={() => {
                                setShape(value as 'square' | 'round' | 'rectangle');
                                handleUpdate('shape', value);
                            }}
                            className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${
                                shape === value
                                    ? 'bg-[#ff6b00]/10 border-[#ff6b00]/50 text-[#ff6b00]'
                                    : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                            }`}
                        >
                            <Icon className="h-5 w-5" />
                            <span className="text-[10px] font-mono uppercase">{label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
