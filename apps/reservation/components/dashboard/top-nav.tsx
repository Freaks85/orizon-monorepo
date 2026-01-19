"use client";

import { useState } from 'react';
import { Menu, Bell, ChevronDown, CalendarRange } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRestaurant } from '@/contexts/restaurant-context';

interface TopNavProps {
    onMenuClick: () => void;
}

export function TopNav({ onMenuClick }: TopNavProps) {
    const { restaurant, restaurants, switchRestaurant } = useRestaurant();
    const [showRestaurantDropdown, setShowRestaurantDropdown] = useState(false);

    return (
        <header className="h-16 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
            {/* Left side */}
            <div className="flex items-center gap-4">
                {/* Mobile menu button */}
                <button
                    onClick={onMenuClick}
                    className="md:hidden p-2 text-slate-400 hover:text-white transition-colors"
                >
                    <Menu className="h-6 w-6" />
                </button>

                {/* Mobile logo */}
                <div className="flex items-center gap-2 md:hidden">
                    <CalendarRange className="h-5 w-5 text-[#ff6b00]" />
                    <span className="font-display font-bold text-sm tracking-widest text-white uppercase">
                        Orizon<span className="text-[#ff6b00]">Resa</span>
                    </span>
                </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
                {/* Restaurant Selector */}
                {restaurants.length > 1 && (
                    <div className="relative">
                        <button
                            onClick={() => setShowRestaurantDropdown(!showRestaurantDropdown)}
                            className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white hover:bg-white/10 transition-colors"
                        >
                            <span className="font-mono text-xs uppercase tracking-wider">
                                {restaurant?.name || 'Sélectionner'}
                            </span>
                            <ChevronDown className="h-4 w-4 text-slate-400" />
                        </button>

                        <AnimatePresence>
                            {showRestaurantDropdown && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute right-0 top-full mt-2 w-48 bg-[#0a0a0a] border border-white/10 rounded-lg shadow-xl overflow-hidden z-50"
                                >
                                    {restaurants.map((r) => (
                                        <button
                                            key={r.id}
                                            onClick={() => {
                                                switchRestaurant(r.id);
                                                setShowRestaurantDropdown(false);
                                            }}
                                            className={`w-full px-4 py-3 text-left text-sm font-mono uppercase tracking-wider transition-colors ${
                                                r.id === restaurant?.id
                                                    ? 'bg-[#ff6b00]/10 text-[#ff6b00]'
                                                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                            }`}
                                        >
                                            {r.name}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}

                {/* Notifications */}
                <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-[#ff6b00] rounded-full"></span>
                </button>
            </div>
        </header>
    );
}
