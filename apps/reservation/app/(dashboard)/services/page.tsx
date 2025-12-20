"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Clock, Users, Edit2, Trash2, Calendar } from 'lucide-react';
import { useRestaurant } from '@/contexts/restaurant-context';
import { supabase } from '@/lib/supabase';

interface Service {
    id: string;
    name: string;
    start_time: string;
    end_time: string;
    max_covers: number;
    days_of_week: number[];
    is_active: boolean;
}

const DAYS = [
    { value: 1, label: 'Lun' },
    { value: 2, label: 'Mar' },
    { value: 3, label: 'Mer' },
    { value: 4, label: 'Jeu' },
    { value: 5, label: 'Ven' },
    { value: 6, label: 'Sam' },
    { value: 0, label: 'Dim' },
];

export default function ServicesPage() {
    const { restaurant } = useRestaurant();
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [saving, setSaving] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [startTime, setStartTime] = useState('12:00');
    const [endTime, setEndTime] = useState('14:00');
    const [maxCovers, setMaxCovers] = useState(20);
    const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1, 2, 3, 4, 5, 6, 0]);

    useEffect(() => {
        if (restaurant?.id) {
            fetchServices();
        }
    }, [restaurant?.id]);

    const fetchServices = async () => {
        if (!restaurant?.id) return;

        try {
            const { data, error } = await supabase
                .from('services')
                .select('*')
                .eq('restaurant_id', restaurant.id)
                .order('start_time');

            if (error) throw error;
            setServices(data || []);
        } catch (error) {
            console.error('Error fetching services:', error);
        } finally {
            setLoading(false);
        }
    };

    const openModal = (service?: Service) => {
        if (service) {
            setEditingService(service);
            setName(service.name);
            setStartTime(service.start_time);
            setEndTime(service.end_time);
            setMaxCovers(service.max_covers);
            setDaysOfWeek(service.days_of_week);
        } else {
            setEditingService(null);
            setName('');
            setStartTime('12:00');
            setEndTime('14:00');
            setMaxCovers(20);
            setDaysOfWeek([1, 2, 3, 4, 5, 6, 0]);
        }
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!restaurant?.id) return;

        setSaving(true);
        try {
            const serviceData = {
                name,
                start_time: startTime,
                end_time: endTime,
                max_covers: maxCovers,
                days_of_week: daysOfWeek,
                restaurant_id: restaurant.id
            };

            if (editingService) {
                const { error } = await supabase
                    .from('services')
                    .update(serviceData)
                    .eq('id', editingService.id);

                if (error) throw error;

                setServices(services.map(s =>
                    s.id === editingService.id ? { ...s, ...serviceData } : s
                ));
            } else {
                const { data, error } = await supabase
                    .from('services')
                    .insert(serviceData)
                    .select()
                    .single();

                if (error) throw error;
                setServices([...services, data]);
            }

            setShowModal(false);
        } catch (error) {
            console.error('Error saving service:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (serviceId: string) => {
        if (!confirm('Supprimer ce service ?')) return;

        try {
            const { error } = await supabase
                .from('services')
                .delete()
                .eq('id', serviceId);

            if (error) throw error;
            setServices(services.filter(s => s.id !== serviceId));
        } catch (error) {
            console.error('Error deleting service:', error);
        }
    };

    const toggleDay = (day: number) => {
        if (daysOfWeek.includes(day)) {
            setDaysOfWeek(daysOfWeek.filter(d => d !== day));
        } else {
            setDaysOfWeek([...daysOfWeek, day]);
        }
    };

    const formatTime = (time: string) => {
        return time.slice(0, 5);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="h-12 w-12 border-2 border-[#00ff9d] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="font-display text-2xl md:text-3xl font-bold text-white uppercase tracking-wider">
                        Services
                    </h1>
                    <p className="text-slate-500 text-sm font-mono mt-1">
                        Configurez vos créneaux de réservation
                    </p>
                </div>

                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#00ff9d] text-black font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-white transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    Nouveau service
                </button>
            </div>

            {/* Services Grid */}
            {services.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#0a0a0a] border border-white/10 rounded-xl p-12 text-center"
                >
                    <Clock className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                    <h3 className="font-display text-lg font-bold text-white uppercase tracking-wider mb-2">
                        Aucun service
                    </h3>
                    <p className="text-slate-500 font-mono text-sm mb-6">
                        Créez vos services (déjeuner, dîner...) pour définir vos créneaux de réservation
                    </p>
                    <button
                        onClick={() => openModal()}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#00ff9d] text-black font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-white transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        Créer un service
                    </button>
                </motion.div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {services.map((service, index) => (
                        <motion.div
                            key={service.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6 group hover:border-[#00ff9d]/30 transition-colors"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-[#00ff9d]/10 rounded-lg">
                                        <Clock className="h-5 w-5 text-[#00ff9d]" />
                                    </div>
                                    <div>
                                        <h3 className="font-display text-lg font-bold text-white uppercase tracking-wider">
                                            {service.name}
                                        </h3>
                                        <p className="text-[#00ff9d] text-sm font-mono">
                                            {formatTime(service.start_time)} - {formatTime(service.end_time)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 text-xs text-slate-500 font-mono mb-4">
                                <span className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    {service.max_covers} couverts max
                                </span>
                            </div>

                            <div className="flex flex-wrap gap-1 mb-4">
                                {DAYS.map(day => (
                                    <span
                                        key={day.value}
                                        className={`px-2 py-1 rounded text-[10px] font-mono uppercase ${
                                            service.days_of_week.includes(day.value)
                                                ? 'bg-[#00ff9d]/10 text-[#00ff9d]'
                                                : 'bg-white/5 text-slate-600'
                                        }`}
                                    >
                                        {day.label}
                                    </span>
                                ))}
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => openModal(service)}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-colors"
                                >
                                    <Edit2 className="h-4 w-4" />
                                    Modifier
                                </button>
                                <button
                                    onClick={() => handleDelete(service.id)}
                                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowModal(false)}
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
                                    {editingService ? 'Modifier le service' : 'Nouveau service'}
                                </h2>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                                            Nom du service
                                        </label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00ff9d]/50 font-mono text-sm"
                                            placeholder="Ex: Déjeuner, Dîner..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                                                Début
                                            </label>
                                            <input
                                                type="time"
                                                value={startTime}
                                                onChange={(e) => setStartTime(e.target.value)}
                                                required
                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#00ff9d]/50 font-mono text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                                                Fin
                                            </label>
                                            <input
                                                type="time"
                                                value={endTime}
                                                onChange={(e) => setEndTime(e.target.value)}
                                                required
                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#00ff9d]/50 font-mono text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                                            Maximum de couverts
                                        </label>
                                        <input
                                            type="number"
                                            min={1}
                                            max={500}
                                            value={maxCovers}
                                            onChange={(e) => setMaxCovers(parseInt(e.target.value) || 20)}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#00ff9d]/50 font-mono text-sm"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                                            Jours actifs
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {DAYS.map(day => (
                                                <button
                                                    key={day.value}
                                                    type="button"
                                                    onClick={() => toggleDay(day.value)}
                                                    className={`px-3 py-2 rounded-lg text-xs font-mono uppercase transition-colors ${
                                                        daysOfWeek.includes(day.value)
                                                            ? 'bg-[#00ff9d] text-black'
                                                            : 'bg-white/5 text-slate-400 hover:bg-white/10'
                                                    }`}
                                                >
                                                    {day.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowModal(false)}
                                            className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-colors"
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={saving || !name.trim()}
                                            className="flex-1 px-4 py-2.5 bg-[#00ff9d] text-black font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {saving ? (
                                                <div className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                editingService ? 'Enregistrer' : 'Créer'
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
