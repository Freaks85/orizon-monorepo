"use client";

import { useState } from 'react';
import { Menu, ChevronDown, CalendarRange, Plus, X, Loader2, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRestaurant } from '@/contexts/restaurant-context';
import { supabase } from '@/lib/supabase';

interface TopNavProps {
    onMenuClick: () => void;
}

export function TopNav({ onMenuClick }: TopNavProps) {
    const { restaurant, restaurants, isOwnerOfAny, switchRestaurant, refreshRestaurant } = useRestaurant();
    const [showRestaurantDropdown, setShowRestaurantDropdown] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState('');
    const [newRestaurantName, setNewRestaurantName] = useState('');

    const handleCreateRestaurant = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!newRestaurantName.trim() || newRestaurantName.trim().length < 2) {
            setError('Le nom doit contenir au moins 2 caractères');
            return;
        }

        setCreating(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setError('Vous devez être connecté');
                setCreating(false);
                return;
            }

            const response = await fetch('/api/restaurants', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    name: newRestaurantName.trim()
                })
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Une erreur est survenue');
                setCreating(false);
                return;
            }

            // Refresh the restaurant list and switch to the new restaurant
            if (data.restaurant?.id) {
                await refreshRestaurant(data.restaurant.id);
            } else {
                await refreshRestaurant();
            }

            // Close modal and reset
            setShowCreateModal(false);
            setNewRestaurantName('');
            setShowRestaurantDropdown(false);

        } catch (err) {
            console.error('Error creating restaurant:', err);
            setError('Une erreur est survenue');
        } finally {
            setCreating(false);
        }
    };

    return (
        <>
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
                            Orizons<span className="text-[#ff6b00]">Resa</span>
                        </span>
                    </div>
                </div>

                {/* Right side */}
                <div className="flex items-center gap-3">
                    {/* Restaurant Selector - Always show if restaurants exist */}
                    <div className="relative">
                        <button
                            onClick={() => setShowRestaurantDropdown(!showRestaurantDropdown)}
                            className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white hover:bg-white/10 transition-colors max-w-[160px] sm:max-w-none"
                        >
                            <span className="font-mono text-xs uppercase tracking-wider truncate">
                                {restaurant?.name || 'Sélectionner'}
                            </span>
                            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${showRestaurantDropdown ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {showRestaurantDropdown && (
                                <>
                                    {/* Backdrop to close dropdown */}
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setShowRestaurantDropdown(false)}
                                    />
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute right-0 top-full mt-2 w-56 bg-[#0a0a0a] border border-white/10 rounded-lg shadow-xl overflow-hidden z-50"
                                    >
                                        {/* Restaurants list */}
                                        <div className="max-h-64 overflow-y-auto">
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
                                        </div>

                                        {/* Add new restaurant button - only for owners */}
                                        {isOwnerOfAny && (
                                            <>
                                                <div className="border-t border-white/10" />
                                                <button
                                                    onClick={() => {
                                                        setShowRestaurantDropdown(false);
                                                        setShowCreateModal(true);
                                                    }}
                                                    className="w-full px-4 py-3 text-left text-sm font-mono uppercase tracking-wider text-[#ff6b00] hover:bg-[#ff6b00]/10 transition-colors flex items-center gap-2"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                    Ajouter un restaurant
                                                </button>
                                            </>
                                        )}
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </header>

            {/* Create Restaurant Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                        onClick={() => setShowCreateModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-[#0a0a0a] border border-white/10 rounded-xl w-full max-w-md overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-white/10">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-[#ff6b00]/10 rounded-lg">
                                        <Building2 className="h-5 w-5 text-[#ff6b00]" />
                                    </div>
                                    <h3 className="font-display text-lg font-bold text-white uppercase tracking-wider">
                                        Nouveau restaurant
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="p-2 text-slate-400 hover:text-white transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleCreateRestaurant} className="p-4 space-y-4">
                                <div>
                                    <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                                        Nom du restaurant *
                                    </label>
                                    <input
                                        type="text"
                                        value={newRestaurantName}
                                        onChange={(e) => setNewRestaurantName(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#ff6b00] transition-colors"
                                        placeholder="Mon nouveau restaurant"
                                        autoFocus
                                    />
                                </div>

                                {error && (
                                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                                        <p className="text-red-400 text-sm">{error}</p>
                                    </div>
                                )}

                                <p className="text-slate-500 text-xs">
                                    Vous pourrez configurer les autres informations (adresse, téléphone, etc.) dans les paramètres du restaurant.
                                </p>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="flex-1 px-4 py-3 bg-white/5 border border-white/10 text-white font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-white/10 transition-colors"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={creating || !newRestaurantName.trim()}
                                        className="flex-1 px-4 py-3 bg-[#ff6b00] text-black font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-[#ff8533] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {creating ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Création...
                                            </>
                                        ) : (
                                            <>
                                                <Plus className="h-4 w-4" />
                                                Créer
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
