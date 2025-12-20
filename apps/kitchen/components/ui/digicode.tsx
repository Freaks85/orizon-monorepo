"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { Delete, Check } from 'lucide-react';

interface DigicodeProps {
    value: string;
    onChange: (value: string) => void;
    onValid?: () => void; // Triggered when "Enter" equivalent is pressed or auto-submit
    maxLength?: number;
}

export function Digicode({ value, onChange, onValid, maxLength = 6 }: DigicodeProps) {
    const handleNumberClick = (num: number) => {
        if (value.length < maxLength) {
            const newValue = value + num.toString();
            onChange(newValue);
        }
    };

    const handleDelete = () => {
        onChange(value.slice(0, -1));
    };

    return (
        <div className="w-full max-w-[280px] mx-auto">
            {/* Display */}
            <div className="flex justify-center gap-4 mb-8 h-12">
                {[...Array(maxLength)].map((_, i) => (
                    <div
                        key={i}
                        className={`w-4 h-4 rounded-full border border-white/20 transition-all duration-300 ${i < value.length
                                ? 'bg-[#00ff9d] border-[#00ff9d] shadow-[0_0_10px_rgba(0,255,157,0.5)]'
                                : 'bg-transparent'
                            }`}
                    />
                ))}
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <motion.button
                        key={num}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleNumberClick(num)}
                        className="h-16 w-16 mx-auto rounded-full bg-white/5 border border-white/10 text-white font-mono text-xl font-bold hover:bg-[#00ff9d]/20 hover:border-[#00ff9d] hover:text-[#00ff9d] transition-colors flex items-center justify-center"
                    >
                        {num}
                    </motion.button>
                ))}

                {/* Empty bottom left */}
                <div className="h-16 w-16"></div>

                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleNumberClick(0)}
                    className="h-16 w-16 mx-auto rounded-full bg-white/5 border border-white/10 text-white font-mono text-xl font-bold hover:bg-[#00ff9d]/20 hover:border-[#00ff9d] hover:text-[#00ff9d] transition-colors flex items-center justify-center"
                >
                    0
                </motion.button>

                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleDelete}
                    className="h-16 w-16 mx-auto rounded-full bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 flex items-center justify-center transition-colors"
                >
                    <Delete className="h-6 w-6" />
                </motion.button>
            </div>
        </div>
    );
}
