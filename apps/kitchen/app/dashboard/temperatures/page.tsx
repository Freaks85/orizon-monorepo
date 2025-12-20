"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
    Thermometer, AlertTriangle, CheckCircle2, Settings2,
    Trash2, ChevronRight, Plus, Minus
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useRestaurant } from '@/contexts/restaurant-context';
import { useEmployee } from '@/contexts/employee-context';
import { useAlertWorkflow } from '@/contexts/alert-workflow-context';

interface TemperatureType {
    id: string;
    name: string;
    min_temp: number;
    max_temp: number;
}

interface TemperatureZone {
    id: string;
    type_id: string;
    name: string;
    temperature_types?: { name: string; min_temp: number; max_temp: number };
}

interface TemperatureLog {
    id: string;
    equipment_name: string;
    temperature: number;
    status: string;
    notes: string | null;
    created_at: string;
    zone_id?: string;
    min_temp?: number;
    max_temp?: number;
}

export default function TemperaturesPage() {
    const searchParams = useSearchParams();
    const { restaurant } = useRestaurant();
    const { activeEmployee } = useEmployee();
    const { isWorkflowActive, currentAlert, getTargetForPage, markCurrentAsResolved, workflowKey, isTransitioning } = useAlertWorkflow();

    const [logs, setLogs] = useState<TemperatureLog[]>([]);
    const [types, setTypes] = useState<TemperatureType[]>([]);
    const [zones, setZones] = useState<TemperatureZone[]>([]);
    const [loading, setLoading] = useState(true);
    const [showSettingsModal, setShowSettingsModal] = useState(false);

    // Selection state (like cleaning page)
    const [selectedZone, setSelectedZone] = useState<TemperatureZone | null>(null);
    const [temperature, setTemperature] = useState<string>('');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Settings form state
    const [newType, setNewType] = useState({ name: '', min_temp: '', max_temp: '' });
    const [newZone, setNewZone] = useState({ name: '', type_id: '' });

    // Track which workflow key we've handled
    const [handledWorkflowKey, setHandledWorkflowKey] = useState<number | null>(null);

    useEffect(() => {
        if (restaurant?.id) {
            fetchData();
        }
    }, [restaurant?.id]);

    // Handle workflow target selection - triggers when workflowKey changes
    useEffect(() => {
        // Wait for data to load and avoid handling same workflow key twice
        if (loading || zones.length === 0 || isTransitioning) return;
        if (handledWorkflowKey === workflowKey) return;

        // Check URL params first (from workflow)
        const zoneIdFromUrl = searchParams.get('zone');

        // Or get from workflow context
        const workflowTarget = getTargetForPage('temperature');
        const targetZoneId = zoneIdFromUrl || workflowTarget?.targetId;

        if (targetZoneId) {
            const targetZone = zones.find(z => z.id === targetZoneId);
            if (targetZone) {
                // Check if this zone already has a reading today
                const todayStr = format(new Date(), 'yyyy-MM-dd');
                const hasReadingToday = logs.some(l =>
                    l.zone_id === targetZone.id &&
                    format(new Date(l.created_at), 'yyyy-MM-dd') === todayStr
                );

                if (hasReadingToday && isWorkflowActive) {
                    // Zone already has reading, skip to next alert
                    setHandledWorkflowKey(workflowKey);
                    setTimeout(() => markCurrentAsResolved(), 100);
                    return;
                }

                // Select the zone and pre-fill temperature
                setSelectedZone(targetZone);

                // Pre-select temperature: middle value between min and max
                if (targetZone.temperature_types) {
                    const { min_temp, max_temp } = targetZone.temperature_types;
                    const midTemp = ((min_temp + max_temp) / 2).toFixed(1);
                    setTemperature(midTemp);
                }
                setNotes('');

                // Scroll to zone
                setTimeout(() => {
                    const zoneElement = document.getElementById(`zone-${targetZone.id}`);
                    if (zoneElement) {
                        zoneElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }, 150);

                setHandledWorkflowKey(workflowKey);
            }
        }
    }, [loading, zones, logs, searchParams, getTargetForPage, isWorkflowActive, markCurrentAsResolved, workflowKey, handledWorkflowKey, isTransitioning]);

    const fetchData = async () => {
        try {
            if (!restaurant?.id) return;

            const [logsRes, typesRes, zonesRes] = await Promise.all([
                supabase
                    .from('temperature_logs')
                    .select('*')
                    .eq('restaurant_id', restaurant.id)
                    .order('created_at', { ascending: false })
                    .limit(50),
                supabase
                    .from('temperature_types')
                    .select('*')
                    .eq('restaurant_id', restaurant.id)
                    .order('name'),
                supabase
                    .from('temperature_zones')
                    .select('*, temperature_types(name, min_temp, max_temp)')
                    .eq('restaurant_id', restaurant.id)
                    .order('name')
            ]);

            if (logsRes.error) throw logsRes.error;
            if (typesRes.error) throw typesRes.error;
            if (zonesRes.error) throw zonesRes.error;

            setLogs(logsRes.data || []);
            setTypes(typesRes.data || []);
            setZones(zonesRes.data || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateStatus = (temp: number, minTemp: number, maxTemp: number): string => {
        if (temp < minTemp || temp > maxTemp) {
            const deviation = Math.max(minTemp - temp, temp - maxTemp);
            if (deviation > 3) return 'critical';
            return 'warning';
        }
        return 'correct';
    };

    // Check if zone needs reading today
    const needsReading = useCallback((zone: TemperatureZone): boolean => {
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        return !logs.some(l =>
            l.zone_id === zone.id &&
            format(new Date(l.created_at), 'yyyy-MM-dd') === todayStr
        );
    }, [logs]);

    // Get last reading for a zone
    const getLastReading = (zoneId: string): TemperatureLog | undefined => {
        return logs.find(l => l.zone_id === zoneId);
    };

    // Check if zone is workflow target
    const isTargetZone = (zoneId: string) => {
        if (!isWorkflowActive) return false;
        const target = getTargetForPage('temperature');
        return target?.targetId === zoneId;
    };

    // Handle zone selection with pre-fill
    const handleZoneSelect = (zone: TemperatureZone) => {
        setSelectedZone(zone);
        setNotes('');

        // Pre-select temperature: middle value between min and max
        if (zone.temperature_types) {
            const { min_temp, max_temp } = zone.temperature_types;
            const midTemp = ((min_temp + max_temp) / 2).toFixed(1);
            setTemperature(midTemp);
        } else {
            setTemperature('');
        }
    };

    // Adjust temperature by increment
    const adjustTemperature = (delta: number) => {
        const current = parseFloat(temperature) || 0;
        setTemperature((current + delta).toFixed(1));
    };

    // Handle submit
    const handleSubmit = async () => {
        if (!selectedZone || !temperature || !restaurant?.id || isTransitioning) return;
        if (!selectedZone.temperature_types) return;

        setSubmitting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const tempValue = parseFloat(temperature);
            const { min_temp, max_temp } = selectedZone.temperature_types;
            const computedStatus = calculateStatus(tempValue, min_temp, max_temp);

            const { data: newLog, error } = await supabase.from('temperature_logs').insert({
                restaurant_id: restaurant.id,
                user_id: user.id,
                employee_id: activeEmployee?.id || null,
                equipment_name: selectedZone.name,
                temperature: tempValue,
                status: computedStatus,
                notes: notes || null,
                zone_id: selectedZone.id,
                min_temp: min_temp,
                max_temp: max_temp
            }).select().single();

            if (error) throw error;

            // Instant update: add new log to local state immediately
            if (newLog) {
                setLogs(prev => [newLog, ...prev]);
            }

            // If in workflow mode, mark alert as resolved and move to next
            if (isWorkflowActive && currentAlert?.type === 'temperature') {
                // Reset form first
                setSelectedZone(null);
                setTemperature('');
                setNotes('');
                // Then trigger next alert
                setTimeout(() => markCurrentAsResolved(), 50);
            } else {
                // Reset form
                setSelectedZone(null);
                setTemperature('');
                setNotes('');
            }
        } catch (error) {
            console.error('Error adding log:', error);
            alert('Erreur lors de l\'enregistrement');
        } finally {
            setSubmitting(false);
        }
    };

    const handleAddType = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!restaurant?.id) return;

            const { error } = await supabase.from('temperature_types').insert({
                restaurant_id: restaurant.id,
                name: newType.name,
                min_temp: parseFloat(newType.min_temp),
                max_temp: parseFloat(newType.max_temp)
            });

            if (error) throw error;
            setNewType({ name: '', min_temp: '', max_temp: '' });
            fetchData();
        } catch (error) {
            console.error('Error adding type:', error);
        }
    };

    const handleAddZone = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!restaurant?.id) return;

            const { error } = await supabase.from('temperature_zones').insert({
                restaurant_id: restaurant.id,
                type_id: newZone.type_id,
                name: newZone.name
            });

            if (error) throw error;
            setNewZone({ name: '', type_id: '' });
            fetchData();
        } catch (error) {
            console.error('Error adding zone:', error);
        }
    };

    const handleDeleteType = async (id: string) => {
        if (!confirm('Supprimer ce type et toutes ses zones ?')) return;
        try {
            const { error } = await supabase.from('temperature_types').delete().eq('id', id);
            if (error) throw error;
            fetchData();
        } catch (error) {
            console.error('Error deleting type:', error);
        }
    };

    const handleDeleteZone = async (id: string) => {
        if (!confirm('Supprimer cette zone ?')) return;
        try {
            const { error } = await supabase.from('temperature_zones').delete().eq('id', id);
            if (error) throw error;
            fetchData();
        } catch (error) {
            console.error('Error deleting zone:', error);
        }
    };

    // Stats
    const todayLogs = logs.filter(l =>
        format(new Date(l.created_at), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
    );

    const avgTemp = todayLogs.length > 0
        ? (todayLogs.reduce((sum, l) => sum + l.temperature, 0) / todayLogs.length).toFixed(1)
        : '--';

    const conformityRate = todayLogs.length > 0
        ? Math.round((todayLogs.filter(l => l.status === 'correct').length / todayLogs.length) * 100)
        : 100;

    const zonesNeedingReading = zones.filter(zone => needsReading(zone));

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-slate-500 font-mono animate-pulse">Chargement...</div>
            </div>
        );
    }

    if (zones.length === 0) {
        return (
            <div className="max-w-4xl mx-auto">
                <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-3">
                    <Thermometer className="h-6 w-6 sm:h-8 sm:w-8 text-[#00ff9d]" />
                    Températures
                </h1>
                <div className="bg-[#0a0a0a] border border-white/10 p-8 sm:p-12 rounded-sm text-center">
                    <Thermometer className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-500 font-mono text-sm mb-4">Aucune zone configurée</p>
                    <button
                        onClick={() => setShowSettingsModal(true)}
                        className="bg-[#00ff9d] text-black font-bold uppercase tracking-widest px-4 py-2 text-xs rounded-sm"
                    >
                        Configurer les zones
                    </button>
                </div>

                {/* Settings Modal */}
                {showSettingsModal && renderSettingsModal()}
            </div>
        );
    }

    function renderSettingsModal() {
        return (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                <div className="bg-[#0a0a0a] border border-white/10 w-full sm:max-w-lg p-6 sm:p-8 rounded-t-lg sm:rounded-sm shadow-2xl relative max-h-[90vh] overflow-y-auto">
                    <h3 className="font-display text-lg sm:text-xl text-white uppercase mb-6">
                        Configuration Températures
                    </h3>

                    {/* Add Type */}
                    <div className="mb-6">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                            Nouveau Type d'Équipement
                        </h4>
                        <form onSubmit={handleAddType} className="space-y-3">
                            <input
                                type="text"
                                required
                                value={newType.name}
                                onChange={(e) => setNewType({ ...newType, name: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 text-white px-3 py-2.5 focus:outline-none focus:border-[#00ff9d] transition-colors font-mono text-sm rounded-sm"
                                placeholder="Ex: Chambre froide positive"
                            />
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    type="number"
                                    step="0.1"
                                    required
                                    value={newType.min_temp}
                                    onChange={(e) => setNewType({ ...newType, min_temp: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 text-white px-3 py-2 focus:outline-none focus:border-[#00ff9d] transition-colors font-mono text-xs rounded-sm"
                                    placeholder="T° Min (ex: 0)"
                                />
                                <input
                                    type="number"
                                    step="0.1"
                                    required
                                    value={newType.max_temp}
                                    onChange={(e) => setNewType({ ...newType, max_temp: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 text-white px-3 py-2 focus:outline-none focus:border-[#00ff9d] transition-colors font-mono text-xs rounded-sm"
                                    placeholder="T° Max (ex: 4)"
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-[#00ff9d] text-black font-bold uppercase tracking-widest py-2.5 hover:bg-white transition-colors text-xs rounded-sm"
                            >
                                Ajouter Type
                            </button>
                        </form>
                    </div>

                    {/* Existing Types */}
                    <div className="mb-6 pt-4 border-t border-white/10">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                            Types existants
                        </h4>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                            {types.length === 0 ? (
                                <p className="text-xs text-slate-500 font-mono">Aucun type configuré</p>
                            ) : (
                                types.map(type => (
                                    <div key={type.id} className="flex items-center justify-between bg-white/5 px-3 py-2 rounded-sm">
                                        <div>
                                            <span className="text-sm text-white">{type.name}</span>
                                            <span className="text-[10px] text-slate-500 font-mono ml-2">
                                                {type.min_temp}° / {type.max_temp}°
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteType(type.id)}
                                            className="text-red-500 hover:text-red-400 p-1"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Add Zone */}
                    <div className="mb-6 pt-4 border-t border-white/10">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                            Nouvelle Zone
                        </h4>
                        <form onSubmit={handleAddZone} className="space-y-3">
                            <select
                                required
                                value={newZone.type_id}
                                onChange={(e) => setNewZone({ ...newZone, type_id: e.target.value })}
                                className="w-full bg-[#050505] border border-white/10 text-white px-3 py-2.5 focus:outline-none focus:border-[#00ff9d] transition-colors font-mono text-sm rounded-sm"
                            >
                                <option value="">Type d'équipement...</option>
                                {types.map(type => (
                                    <option key={type.id} value={type.id}>{type.name}</option>
                                ))}
                            </select>
                            <input
                                type="text"
                                required
                                value={newZone.name}
                                onChange={(e) => setNewZone({ ...newZone, name: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 text-white px-3 py-2.5 focus:outline-none focus:border-[#00ff9d] transition-colors font-mono text-sm rounded-sm"
                                placeholder="Ex: Frigo légumes"
                            />
                            <button
                                type="submit"
                                disabled={types.length === 0}
                                className="w-full bg-[#00ff9d] text-black font-bold uppercase tracking-widest py-2.5 hover:bg-white transition-colors text-xs rounded-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Ajouter Zone
                            </button>
                        </form>
                    </div>

                    {/* Existing Zones */}
                    <div className="pt-4 border-t border-white/10">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                            Zones existantes ({zones.length})
                        </h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                            {zones.length === 0 ? (
                                <p className="text-xs text-slate-500 font-mono">Aucune zone configurée</p>
                            ) : (
                                zones.map(zone => (
                                    <div key={zone.id} className="flex items-center justify-between bg-white/5 px-3 py-2 rounded-sm">
                                        <div>
                                            <span className="text-sm text-white">{zone.name}</span>
                                            <span className="text-[10px] text-slate-500 font-mono ml-2">
                                                ({zone.temperature_types?.name})
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteZone(zone.id)}
                                            className="text-red-500 hover:text-red-400 p-1"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowSettingsModal(false)}
                        className="w-full mt-6 bg-white/5 text-white font-bold uppercase tracking-widest py-3 hover:bg-white/10 transition-colors text-xs rounded-sm"
                    >
                        Fermer
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            {/* Workflow indicator */}
            {isWorkflowActive && currentAlert?.type === 'temperature' && (
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-sm p-4 mb-6 flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0" />
                    <div className="flex-1">
                        <p className="text-sm font-bold text-orange-500">{currentAlert.title}</p>
                        <p className="text-xs text-slate-400">{currentAlert.message}</p>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-white uppercase tracking-wider flex items-center gap-3">
                        <Thermometer className="h-6 w-6 sm:h-8 sm:w-8 text-[#00ff9d]" />
                        Températures
                    </h1>
                    <p className="text-slate-500 text-xs font-mono mt-1">Protocole HACCP - Relevés quotidiens</p>
                </div>
                <button
                    onClick={() => setShowSettingsModal(true)}
                    className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-3 py-2.5 rounded-sm transition-colors text-xs font-bold uppercase tracking-widest border border-white/10"
                >
                    <Settings2 className="h-4 w-4" /> Config
                </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
                <div className="bg-[#0a0a0a] border border-white/10 p-3 sm:p-4 rounded-sm">
                    <div className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1">Moyenne</div>
                    <div className="text-xl sm:text-2xl font-display text-white font-bold">{avgTemp}°C</div>
                    <div className="text-[10px] text-slate-600 font-mono mt-1">aujourd'hui</div>
                </div>
                <div className="bg-[#0a0a0a] border border-white/10 p-3 sm:p-4 rounded-sm">
                    <div className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1">Relevés</div>
                    <div className="text-xl sm:text-2xl font-display text-white font-bold">
                        {todayLogs.length}/{zones.length}
                    </div>
                    <div className="text-[10px] text-slate-600 font-mono mt-1">effectués</div>
                </div>
                <div className="bg-[#0a0a0a] border border-white/10 p-3 sm:p-4 rounded-sm">
                    <div className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1">Conformité</div>
                    <div className={`text-xl sm:text-2xl font-display font-bold ${conformityRate === 100 ? 'text-[#00ff9d]' : conformityRate >= 80 ? 'text-yellow-500' : 'text-red-500'}`}>
                        {conformityRate}%
                    </div>
                    <div className="text-[10px] text-slate-600 font-mono mt-1">{todayLogs.length} relevés</div>
                </div>
            </div>

            {/* Alert Banner for zones without reading */}
            {zonesNeedingReading.length > 0 && !isWorkflowActive && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-sm p-4 mb-6 flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                    <div className="flex-1">
                        <p className="text-yellow-500 font-bold text-sm uppercase">
                            {zonesNeedingReading.length} zone{zonesNeedingReading.length > 1 ? 's' : ''} sans relevé
                        </p>
                        <p className="text-yellow-500/70 text-xs font-mono mt-1">
                            {zonesNeedingReading.map(z => z.name).join(', ')}
                        </p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Zones Grid */}
                <div className="bg-[#0a0a0a] border border-white/10 p-4 sm:p-6 rounded-sm">
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4">Zones</h3>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {zones.map(zone => {
                            const lastReading = getLastReading(zone.id);
                            const hasReadingToday = lastReading && format(new Date(lastReading.created_at), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                            const isSelected = selectedZone?.id === zone.id;
                            const isTarget = isTargetZone(zone.id);

                            return (
                                <button
                                    key={zone.id}
                                    id={`zone-${zone.id}`}
                                    onClick={() => handleZoneSelect(zone)}
                                    className={`relative p-3 rounded-sm text-left transition-all ${
                                        isSelected
                                            ? 'bg-[#00ff9d]/20 border-2 border-[#00ff9d]'
                                            : isTarget
                                                ? 'bg-orange-500/20 border-2 border-orange-500 animate-pulse'
                                                : hasReadingToday && lastReading?.status === 'correct'
                                                    ? 'bg-green-500/10 border border-green-500/30 hover:border-green-500/50'
                                                    : hasReadingToday && lastReading?.status === 'warning'
                                                        ? 'bg-yellow-500/10 border border-yellow-500/30 hover:border-yellow-500/50'
                                                        : hasReadingToday && lastReading?.status === 'critical'
                                                            ? 'bg-red-500/10 border border-red-500/30 hover:border-red-500/50'
                                                            : 'bg-white/5 border border-white/10 hover:border-white/20'
                                    }`}
                                >
                                    {/* Status Icon */}
                                    <div className={`absolute top-2 right-2 h-5 w-5 rounded-full flex items-center justify-center ${
                                        hasReadingToday && lastReading?.status === 'correct'
                                            ? 'bg-green-500 text-black'
                                            : hasReadingToday && lastReading?.status === 'warning'
                                                ? 'bg-yellow-500 text-black'
                                                : hasReadingToday && lastReading?.status === 'critical'
                                                    ? 'bg-red-500 text-white'
                                                    : 'bg-slate-600 text-white'
                                    }`}>
                                        {hasReadingToday ? (
                                            lastReading?.status === 'correct' ? (
                                                <CheckCircle2 className="h-3 w-3" />
                                            ) : (
                                                <AlertTriangle className="h-3 w-3" />
                                            )
                                        ) : (
                                            <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
                                        )}
                                    </div>

                                    <p className="text-white text-sm font-medium pr-6 mb-1">{zone.name}</p>

                                    {hasReadingToday && lastReading ? (
                                        <span className="text-lg font-mono font-bold text-white">
                                            {lastReading.temperature}°C
                                        </span>
                                    ) : (
                                        <span className="text-xs font-mono text-slate-500">En attente</span>
                                    )}

                                    {zone.temperature_types && (
                                        <p className="text-[10px] font-mono text-slate-500 mt-1">
                                            {zone.temperature_types.min_temp}° - {zone.temperature_types.max_temp}°
                                        </p>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Recording Form */}
                <div className="bg-[#0a0a0a] border border-white/10 p-4 sm:p-6 rounded-sm">
                    {selectedZone ? (
                        <>
                            <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                                <ChevronRight className="h-4 w-4 text-[#00ff9d]" />
                                {selectedZone.name}
                            </h3>

                            {selectedZone.temperature_types && (
                                <div className="bg-white/5 border border-white/10 p-3 rounded-sm mb-6">
                                    <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Limites acceptées</p>
                                    <p className="font-mono text-lg text-white">
                                        {selectedZone.temperature_types.min_temp}°C - {selectedZone.temperature_types.max_temp}°C
                                    </p>
                                </div>
                            )}

                            <div className="space-y-6">
                                {/* Temperature Input with +/- buttons */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                                        Température relevée
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => adjustTemperature(-0.5)}
                                            className="h-14 w-14 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-sm transition-colors"
                                        >
                                            <Minus className="h-6 w-6" />
                                        </button>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={temperature}
                                            onChange={(e) => setTemperature(e.target.value)}
                                            className="flex-1 bg-white/5 border border-white/10 text-white px-4 py-3 text-center text-3xl font-mono font-bold focus:outline-none focus:border-[#00ff9d] transition-colors rounded-sm"
                                            placeholder="0.0"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => adjustTemperature(0.5)}
                                            className="h-14 w-14 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-sm transition-colors"
                                        >
                                            <Plus className="h-6 w-6" />
                                        </button>
                                    </div>

                                    {/* Status preview */}
                                    {temperature && selectedZone.temperature_types && (
                                        <div className="mt-3">
                                            {(() => {
                                                const temp = parseFloat(temperature);
                                                const { min_temp, max_temp } = selectedZone.temperature_types!;
                                                const status = calculateStatus(temp, min_temp, max_temp);
                                                return (
                                                    <div className={`flex items-center gap-2 p-3 rounded-sm ${
                                                        status === 'correct' ? 'bg-green-500/10 border border-green-500/30' :
                                                        status === 'warning' ? 'bg-yellow-500/10 border border-yellow-500/30' :
                                                        'bg-red-500/10 border border-red-500/30'
                                                    }`}>
                                                        {status === 'correct' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                                                        {status === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
                                                        {status === 'critical' && <AlertTriangle className="h-5 w-5 text-red-500" />}
                                                        <span className={`text-sm font-bold ${
                                                            status === 'correct' ? 'text-green-500' :
                                                            status === 'warning' ? 'text-yellow-500' :
                                                            'text-red-500'
                                                        }`}>
                                                            {status === 'correct' ? 'Conforme' :
                                                             status === 'warning' ? 'Attention - hors limite' :
                                                             'CRITIQUE - hors limite'}
                                                        </span>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    )}
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                                        Notes (optionnel)
                                    </label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        rows={2}
                                        className="w-full bg-white/5 border border-white/10 text-white px-3 py-2 text-sm font-mono rounded-sm focus:outline-none focus:border-[#00ff9d] resize-none"
                                        placeholder="Observations..."
                                    />
                                </div>

                                {/* Submit */}
                                <button
                                    onClick={handleSubmit}
                                    disabled={!temperature || submitting}
                                    className="w-full flex items-center justify-center gap-2 bg-[#00ff9d] hover:bg-white text-black px-4 py-3 rounded-sm transition-colors text-sm font-bold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Thermometer className="h-4 w-4" />
                                    {submitting ? 'Enregistrement...' : isWorkflowActive ? 'Valider et continuer' : 'Enregistrer le relevé'}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Thermometer className="h-12 w-12 text-slate-600 mb-4" />
                            <p className="text-slate-500 font-mono text-sm mb-1">Sélectionnez une zone</p>
                            <p className="text-slate-600 font-mono text-xs">pour enregistrer un relevé</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Logs */}
            {todayLogs.length > 0 && (
                <div className="mt-6 bg-[#0a0a0a] border border-white/10 p-4 sm:p-6 rounded-sm">
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4">Relevés du jour</h3>
                    <div className="space-y-2">
                        {todayLogs.slice(0, 5).map(log => (
                            <div key={log.id} className="flex items-center justify-between p-3 bg-white/5 rounded-sm">
                                <div className="flex items-center gap-3">
                                    <div className={`h-8 w-8 rounded-sm flex items-center justify-center ${
                                        log.status === 'correct' ? 'bg-green-500/20' :
                                        log.status === 'warning' ? 'bg-yellow-500/20' :
                                        'bg-red-500/20'
                                    }`}>
                                        <Thermometer className={`h-4 w-4 ${
                                            log.status === 'correct' ? 'text-green-500' :
                                            log.status === 'warning' ? 'text-yellow-500' :
                                            'text-red-500'
                                        }`} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white">{log.equipment_name}</p>
                                        <p className="text-[10px] font-mono text-slate-500">
                                            {format(new Date(log.created_at), 'HH:mm', { locale: fr })}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-mono font-bold text-white">{log.temperature}°C</p>
                                    <p className={`text-[10px] font-bold uppercase ${
                                        log.status === 'correct' ? 'text-green-500' :
                                        log.status === 'warning' ? 'text-yellow-500' :
                                        'text-red-500'
                                    }`}>
                                        {log.status === 'correct' ? 'OK' : log.status === 'warning' ? 'Attention' : 'Critique'}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Settings Modal */}
            {showSettingsModal && renderSettingsModal()}
        </div>
    );
}
