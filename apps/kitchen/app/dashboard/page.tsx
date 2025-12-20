"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
    CheckCircle2,
    Thermometer,
    Activity,
    Truck,
    SprayCan,
    AlertTriangle,
    Calendar,
    ChevronRight,
    Zap,
    Shield,
    Clock,
    ChevronDown
} from 'lucide-react';
import { useEmployee } from '@/contexts/employee-context';
import { useRestaurant } from '@/contexts/restaurant-context';
import { useAlertWorkflow, WorkflowAlert } from '@/contexts/alert-workflow-context';
import { supabase } from '@/lib/supabase';
import { WeeklyChart } from '@/components/dashboard/weekly-chart';
import { ActivityModal } from '@/components/dashboard/activity-modal';

interface DashboardStats {
    temperatureConformity: number;
    temperatureTotal: number;
    temperatureConforme: number;
    cleaningPending: number;
    cleaningTotal: number;
    cleaningDone: number;
    dlcCritical: number;
    dlcWarning: number;
    dlcExpired: number;
    receptionToday: number;
    lastSync: string;
}

interface ActivityItem {
    id: string;
    time: string;
    action: string;
    status: 'OK' | 'WARN' | 'CRITICAL';
    user: string;
    type: 'temperature' | 'cleaning' | 'reception' | 'dlc';
}

interface CriticalAlert extends WorkflowAlert { }

interface AlertsByCategory {
    temperature: CriticalAlert[];
    cleaning: CriticalAlert[];
    dlc: CriticalAlert[];
}

export default function DashboardPage() {
    const { activeEmployee } = useEmployee();
    const { restaurant } = useRestaurant();
    const { startWorkflow } = useAlertWorkflow();

    const [stats, setStats] = useState<DashboardStats>({
        temperatureConformity: 0,
        temperatureTotal: 0,
        temperatureConforme: 0,
        cleaningPending: 0,
        cleaningTotal: 0,
        cleaningDone: 0,
        dlcCritical: 0,
        dlcWarning: 0,
        dlcExpired: 0,
        receptionToday: 0,
        lastSync: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    });

    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [alertsByCategory, setAlertsByCategory] = useState<AlertsByCategory>({
        temperature: [],
        cleaning: [],
        dlc: []
    });
    const [loading, setLoading] = useState(true);
    const [allAlerts, setAllAlerts] = useState<CriticalAlert[]>([]);
    const [activityModalOpen, setActivityModalOpen] = useState(false);
    const [weeklyData, setWeeklyData] = useState<{ day: string; temperature: number; cleaning: number; conformity: number; }[]>([]);

    // For smooth real-time updates
    const dataRef = useRef<{
        stats: DashboardStats | null;
        activities: ActivityItem[];
        alerts: AlertsByCategory;
    }>({ stats: null, activities: [], alerts: { temperature: [], cleaning: [], dlc: [] } });

    const isFirstLoad = useRef(true);
    const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Smooth data update function - updates only changed values
    const updateDataSmoothly = useCallback((newData: {
        stats: DashboardStats;
        activities: ActivityItem[];
        alertsByCategory: AlertsByCategory;
        allAlerts: CriticalAlert[];
    }) => {
        // Update stats atomically without full re-render
        setStats(prev => {
            const changed = JSON.stringify(prev) !== JSON.stringify(newData.stats);
            return changed ? newData.stats : prev;
        });

        setActivities(prev => {
            const changed = JSON.stringify(prev) !== JSON.stringify(newData.activities);
            return changed ? newData.activities : prev;
        });

        setAlertsByCategory(prev => {
            const changed = JSON.stringify(prev) !== JSON.stringify(newData.alertsByCategory);
            return changed ? newData.alertsByCategory : prev;
        });

        setAllAlerts(prev => {
            const changed = JSON.stringify(prev) !== JSON.stringify(newData.allAlerts);
            return changed ? newData.allAlerts : prev;
        });
    }, []);

    useEffect(() => {
        if (restaurant?.id) {
            fetchDashboardData();

            // Real-time refresh every 15 seconds - smooth updates
            refreshIntervalRef.current = setInterval(() => {
                fetchDashboardData(true);
            }, 15000);

            return () => {
                if (refreshIntervalRef.current) {
                    clearInterval(refreshIntervalRef.current);
                }
            };
        }
    }, [restaurant?.id]);

    const fetchDashboardData = async (isBackgroundRefresh = false) => {
        if (!restaurant?.id) return;

        if (!isBackgroundRefresh && isFirstLoad.current) {
            setLoading(true);
        }

        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayISO = today.toISOString();

            const [
                temperatureLogsRes,
                temperatureZonesRes,
                cleaningPostsRes,
                cleaningRecordsRes,
                dlcProductsRes,
                receptionRes
            ] = await Promise.all([
                supabase
                    .from('temperature_logs')
                    .select('*, temperature_zones(name, temperature_types(min_temp, max_temp))')
                    .eq('restaurant_id', restaurant.id)
                    .gte('created_at', todayISO)
                    .order('created_at', { ascending: false }),
                supabase
                    .from('temperature_zones')
                    .select('id, name')
                    .eq('restaurant_id', restaurant.id),
                supabase
                    .from('cleaning_posts')
                    .select('id, name, cleaning_frequency, area_id, cleaning_areas(name)')
                    .eq('restaurant_id', restaurant.id)
                    .eq('is_active', true),
                supabase
                    .from('cleaning_records')
                    .select('id, post_id, is_clean, created_at, employees(first_name, last_name)')
                    .eq('restaurant_id', restaurant.id)
                    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
                    .order('created_at', { ascending: false }),
                supabase
                    .from('dlc_products')
                    .select('id, product_name, dlc_date, status')
                    .eq('restaurant_id', restaurant.id)
                    .eq('status', 'active'),
                supabase
                    .from('reception_records')
                    .select('id, created_at, is_compliant, suppliers(name), employees(first_name, last_name)')
                    .eq('restaurant_id', restaurant.id)
                    .gte('created_at', todayISO)
                    .order('created_at', { ascending: false })
            ]);

            // Calculate temperature conformity
            const tempLogs = temperatureLogsRes.data || [];
            let tempConforme = 0;
            tempLogs.forEach(log => {
                const minTemp = log.min_temp ?? log.temperature_zones?.temperature_types?.min_temp ?? -Infinity;
                const maxTemp = log.max_temp ?? log.temperature_zones?.temperature_types?.max_temp ?? Infinity;
                if (log.temperature >= minTemp && log.temperature <= maxTemp) {
                    tempConforme++;
                }
            });
            const tempConformity = tempLogs.length > 0 ? Math.round((tempConforme / tempLogs.length) * 100) : 100;

            // Calculate cleaning status with all frequencies
            const posts = cleaningPostsRes.data || [];
            const records = cleaningRecordsRes.data || [];

            const checkIfCleaningNeeded = (post: any): boolean => {
                if (post.cleaning_frequency === 'on_demand') return false;

                const postRecords = records.filter((r: any) => r.post_id === post.id);
                if (postRecords.length === 0) return true;

                const lastRecord = postRecords[0];
                const lastRecordDate = new Date(lastRecord.created_at);
                const now = new Date();

                switch (post.cleaning_frequency) {
                    case 'daily':
                        return lastRecordDate.toDateString() !== now.toDateString();
                    case 'weekly':
                        const daysSinceLastWeekly = Math.floor((now.getTime() - lastRecordDate.getTime()) / (1000 * 60 * 60 * 24));
                        return daysSinceLastWeekly >= 7;
                    case 'monthly':
                        const daysSinceLastMonthly = Math.floor((now.getTime() - lastRecordDate.getTime()) / (1000 * 60 * 60 * 24));
                        return daysSinceLastMonthly >= 30;
                    default:
                        return false;
                }
            };

            const activeCleaningPosts = posts.filter((p: any) => p.cleaning_frequency !== 'on_demand');
            const postsNeedingCleaning = activeCleaningPosts.filter(checkIfCleaningNeeded);
            const cleaningDone = activeCleaningPosts.length - postsNeedingCleaning.length;
            const cleaningPending = postsNeedingCleaning.length;

            // Calculate DLC status
            const dlcProducts = dlcProductsRes.data || [];
            const now = new Date();
            let dlcCritical = 0;
            let dlcWarning = 0;
            let dlcExpired = 0;

            dlcProducts.forEach(product => {
                const dlcDate = new Date(product.dlc_date);
                const daysUntilExpiry = Math.ceil((dlcDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                if (daysUntilExpiry < 0) dlcExpired++;
                else if (daysUntilExpiry <= 1) dlcCritical++;
                else if (daysUntilExpiry <= 2) dlcWarning++;
            });

            // Build activity log
            const activityItems: ActivityItem[] = [];

            tempLogs.slice(0, 5).forEach(log => {
                const minTemp = log.min_temp ?? log.temperature_zones?.temperature_types?.min_temp ?? -Infinity;
                const maxTemp = log.max_temp ?? log.temperature_zones?.temperature_types?.max_temp ?? Infinity;
                const isConforme = log.temperature >= minTemp && log.temperature <= maxTemp;
                activityItems.push({
                    id: `temp-${log.id}`,
                    time: new Date(log.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                    action: `T° ${log.temperature_zones?.name || 'Zone'}`,
                    status: isConforme ? 'OK' : 'WARN',
                    user: log.temperature + '°C',
                    type: 'temperature'
                });
            });

            const todayRecords = records.filter((r: any) =>
                new Date(r.created_at).toDateString() === new Date().toDateString()
            );
            todayRecords.slice(0, 5).forEach((record: any) => {
                const employee = record.employees as any;
                activityItems.push({
                    id: `clean-${record.id}`,
                    time: new Date(record.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                    action: 'Nettoyage',
                    status: record.is_clean ? 'OK' : 'WARN',
                    user: employee ? `${employee.first_name}` : 'Employé',
                    type: 'cleaning'
                });
            });

            const receptions = receptionRes.data || [];
            receptions.slice(0, 3).forEach(rec => {
                const supplier = rec.suppliers as any;
                activityItems.push({
                    id: `rec-${rec.id}`,
                    time: new Date(rec.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                    action: supplier?.name || 'Réception',
                    status: rec.is_compliant ? 'OK' : 'WARN',
                    user: 'Livraison',
                    type: 'reception'
                });
            });

            activityItems.sort((a, b) => b.time.localeCompare(a.time));

            // Build alerts
            const tempAlerts: CriticalAlert[] = [];
            const cleanAlerts: CriticalAlert[] = [];
            const dlcAlerts: CriticalAlert[] = [];

            // Temperature alerts - zones without reading today
            const tempZones = temperatureZonesRes.data || [];
            const zonesWithReadingToday = new Set(tempLogs.map(log => log.zone_id));
            const zonesWithoutReading = tempZones.filter(zone => !zonesWithReadingToday.has(zone.id));

            zonesWithoutReading.forEach((zone) => {
                tempAlerts.push({
                    id: `temp-missing-${zone.id}`,
                    type: 'temperature',
                    title: `Relevé manquant: ${zone.name}`,
                    message: `Aucun relevé aujourd'hui`,
                    severity: 'warning',
                    actionUrl: `/dashboard/temperatures?zone=${zone.id}`,
                    targetId: zone.id
                });
            });

            // Temperature alerts - non-conforme readings
            const nonConformeLogs = tempLogs.filter(log => {
                const minTemp = log.min_temp ?? log.temperature_zones?.temperature_types?.min_temp ?? -Infinity;
                const maxTemp = log.max_temp ?? log.temperature_zones?.temperature_types?.max_temp ?? Infinity;
                return log.temperature < minTemp || log.temperature > maxTemp;
            });

            nonConformeLogs.forEach((log) => {
                tempAlerts.push({
                    id: `temp-alert-${log.id}`,
                    type: 'temperature',
                    title: `T° hors norme: ${log.temperature_zones?.name || 'Zone'}`,
                    message: `${log.temperature}°C détecté`,
                    severity: 'critical',
                    actionUrl: `/dashboard/temperatures?zone=${log.zone_id}`,
                    targetId: log.zone_id
                });
            });

            // Cleaning alerts
            postsNeedingCleaning.forEach((post: any) => {
                const area = (post as any).cleaning_areas;
                const frequencyLabel = post.cleaning_frequency === 'daily' ? 'Quotidien' :
                    post.cleaning_frequency === 'weekly' ? 'Hebdo' : 'Mensuel';
                cleanAlerts.push({
                    id: `clean-alert-${post.id}`,
                    type: 'cleaning',
                    title: `${post.name}`,
                    message: area?.name ? `${area.name} (${frequencyLabel})` : frequencyLabel,
                    severity: postsNeedingCleaning.length > 3 ? 'critical' : 'warning',
                    actionUrl: `/dashboard/cleaning?post=${post.id}`,
                    targetId: post.id,
                    areaId: post.area_id
                });
            });

            // DLC alerts
            dlcProducts.forEach(product => {
                const dlcDate = new Date(product.dlc_date);
                const daysUntilExpiry = Math.ceil((dlcDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                if (daysUntilExpiry < 0) {
                    dlcAlerts.push({
                        id: `dlc-expired-${product.id}`,
                        type: 'dlc',
                        title: product.product_name,
                        message: `Expiré depuis ${Math.abs(daysUntilExpiry)}j`,
                        severity: 'critical',
                        actionUrl: `/dashboard/traceability?product=${product.id}`,
                        targetId: product.id
                    });
                } else if (daysUntilExpiry <= 1) {
                    dlcAlerts.push({
                        id: `dlc-critical-${product.id}`,
                        type: 'dlc',
                        title: product.product_name,
                        message: daysUntilExpiry === 0 ? 'Expire aujourd\'hui' : 'Expire demain',
                        severity: 'critical',
                        actionUrl: `/dashboard/traceability?product=${product.id}`,
                        targetId: product.id
                    });
                }
            });

            const newAlertsByCategory = { temperature: tempAlerts, cleaning: cleanAlerts, dlc: dlcAlerts };
            const combinedAlerts = [...tempAlerts, ...cleanAlerts, ...dlcAlerts];

            const newStats = {
                temperatureConformity: tempConformity,
                temperatureTotal: tempLogs.length,
                temperatureConforme: tempConforme,
                cleaningPending,
                cleaningTotal: activeCleaningPosts.length,
                cleaningDone,
                dlcCritical,
                dlcWarning,
                dlcExpired,
                receptionToday: receptions.length,
                lastSync: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
            };

            // Smooth update without flickering
            updateDataSmoothly({
                stats: newStats,
                activities: activityItems.slice(0, 8),
                alertsByCategory: newAlertsByCategory,
                allAlerts: combinedAlerts
            });

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            if (isFirstLoad.current) {
                setLoading(false);
                isFirstLoad.current = false;
            }
        }
    };

    const handleStartWorkflow = useCallback((category?: 'temperature' | 'cleaning' | 'dlc') => {
        let alertsToProcess = allAlerts;
        if (category) {
            alertsToProcess = alertsByCategory[category];
        }
        if (alertsToProcess.length === 0) return;
        startWorkflow(alertsToProcess);
    }, [allAlerts, alertsByCategory, startWorkflow]);

    const totalAlerts = useMemo(() =>
        alertsByCategory.temperature.length + alertsByCategory.cleaning.length + alertsByCategory.dlc.length,
        [alertsByCategory]
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="h-12 w-12 border-2 border-[#00ff9d] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-500 font-mono text-sm">Chargement des données...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white uppercase tracking-wider mb-2">
                        Dashboard
                    </h1>
                    <div className="flex items-center gap-3 text-slate-500">
                        <Clock className="h-4 w-4" />
                        <span className="font-mono text-xs sm:text-sm">Mise à jour: {stats.lastSync}</span>
                        <div className="h-2 w-2 rounded-full bg-[#00ff9d] animate-pulse shadow-[0_0_10px_#00ff9d]" />
                    </div>
                </div>
            </div>

            {/* Main Grid Layout */}
            <div className="grid grid-cols-12 gap-6">
                {/* Left Column - KPI Cards & Alerts */}
                <div className="col-span-12 lg:col-span-8 space-y-6">
                    {/* KPI Cards Row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* Temperature Card */}
                        <Link href="/dashboard/temperatures">
                            <motion.div
                                className="group relative bg-gradient-to-br from-[#0a0a0a] to-[#0f0f0f] border border-white/10 p-5 rounded-2xl hover:border-blue-500/50 transition-all duration-300 overflow-hidden"
                                whileHover={{ scale: 1.02, y: -2 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className={`p-2.5 rounded-xl ${stats.temperatureConformity >= 90 ? 'bg-blue-500/10' : stats.temperatureConformity >= 70 ? 'bg-yellow-500/10' : 'bg-red-500/10'}`}>
                                            <Thermometer className={`h-5 w-5 ${stats.temperatureConformity >= 90 ? 'text-blue-400' : stats.temperatureConformity >= 70 ? 'text-yellow-500' : 'text-red-500'}`} />
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                                    </div>
                                    <div className="flex items-baseline gap-1 mb-1">
                                        <span className={`text-3xl font-display font-bold ${stats.temperatureConformity >= 90 ? 'text-white' : stats.temperatureConformity >= 70 ? 'text-yellow-500' : 'text-red-500'}`}>
                                            {stats.temperatureConformity}
                                        </span>
                                        <span className="text-lg text-slate-500">%</span>
                                    </div>
                                    <p className="text-xs font-mono text-slate-500 uppercase tracking-wider">Températures</p>
                                    <p className="text-[10px] text-slate-600 font-mono mt-2">
                                        {stats.temperatureConforme}/{stats.temperatureTotal} conformes
                                    </p>
                                </div>
                            </motion.div>
                        </Link>

                        {/* Cleaning Card */}
                        <Link href="/dashboard/cleaning">
                            <motion.div
                                className="group relative bg-gradient-to-br from-[#0a0a0a] to-[#0f0f0f] border border-white/10 p-5 rounded-2xl hover:border-purple-500/50 transition-all duration-300 overflow-hidden"
                                whileHover={{ scale: 1.02, y: -2 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className={`p-2.5 rounded-xl ${stats.cleaningPending === 0 ? 'bg-purple-500/10' : stats.cleaningPending <= 2 ? 'bg-yellow-500/10' : 'bg-red-500/10'}`}>
                                            <SprayCan className={`h-5 w-5 ${stats.cleaningPending === 0 ? 'text-purple-400' : stats.cleaningPending <= 2 ? 'text-yellow-500' : 'text-red-500'}`} />
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                                    </div>
                                    <div className="flex items-baseline gap-1 mb-1">
                                        <span className="text-3xl font-display font-bold text-white">{stats.cleaningDone}</span>
                                        <span className="text-lg text-slate-500">/{stats.cleaningTotal}</span>
                                    </div>
                                    <p className="text-xs font-mono text-slate-500 uppercase tracking-wider">Nettoyages</p>
                                    <p className={`text-[10px] font-mono mt-2 ${stats.cleaningPending > 0 ? 'text-yellow-500' : 'text-[#00ff9d]'}`}>
                                        {stats.cleaningPending > 0 ? `${stats.cleaningPending} en attente` : 'Tout est fait'}
                                    </p>
                                </div>
                            </motion.div>
                        </Link>

                        {/* Reception Card */}
                        <Link href="/dashboard/reception">
                            <motion.div
                                className="group relative bg-gradient-to-br from-[#0a0a0a] to-[#0f0f0f] border border-white/10 p-5 rounded-2xl hover:border-green-500/50 transition-all duration-300 overflow-hidden"
                                whileHover={{ scale: 1.02, y: -2 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-2.5 rounded-xl bg-green-500/10">
                                            <Truck className="h-5 w-5 text-green-400" />
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                                    </div>
                                    <div className="flex items-baseline gap-1 mb-1">
                                        <span className="text-3xl font-display font-bold text-white">{stats.receptionToday}</span>
                                    </div>
                                    <p className="text-xs font-mono text-slate-500 uppercase tracking-wider">Réceptions</p>
                                    <p className="text-[10px] text-slate-600 font-mono mt-2">aujourd'hui</p>
                                </div>
                            </motion.div>
                        </Link>

                        {/* DLC Card */}
                        <Link href="/dashboard/traceability">
                            <motion.div
                                className="group relative bg-gradient-to-br from-[#0a0a0a] to-[#0f0f0f] border border-white/10 p-5 rounded-2xl hover:border-orange-500/50 transition-all duration-300 overflow-hidden"
                                whileHover={{ scale: 1.02, y: -2 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className={`p-2.5 rounded-xl ${stats.dlcExpired > 0 ? 'bg-red-500/10' : stats.dlcCritical > 0 ? 'bg-orange-500/10' : 'bg-orange-500/10'}`}>
                                            <Calendar className={`h-5 w-5 ${stats.dlcExpired > 0 ? 'text-red-500' : stats.dlcCritical > 0 ? 'text-orange-400' : 'text-orange-400'}`} />
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                                    </div>
                                    <div className="flex items-baseline gap-1 mb-1">
                                        <span className={`text-3xl font-display font-bold ${stats.dlcExpired > 0 ? 'text-red-500' : stats.dlcCritical > 0 ? 'text-orange-400' : 'text-white'}`}>
                                            {stats.dlcCritical + stats.dlcExpired}
                                        </span>
                                    </div>
                                    <p className="text-xs font-mono text-slate-500 uppercase tracking-wider">DLC Critiques</p>
                                    <p className="text-[10px] text-slate-600 font-mono mt-2">
                                        {stats.dlcWarning > 0 ? `+${stats.dlcWarning} à surveiller` : 'produits'}
                                    </p>
                                </div>
                            </motion.div>
                        </Link>
                    </div>

                    {/* Alerts Section */}
                    {totalAlerts > 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gradient-to-br from-[#0a0a0a] to-[#0f0f0f] border border-white/10 rounded-2xl overflow-hidden"
                        >
                            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-orange-500/5 to-transparent">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 rounded-xl bg-orange-500/10">
                                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                                    </div>
                                    <div>
                                        <span className="font-display text-lg font-bold text-white uppercase tracking-wider">
                                            Alertes Actives
                                        </span>
                                        <p className="text-xs text-slate-500 font-mono">{totalAlerts} actions requises</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleStartWorkflow()}
                                    className="bg-gradient-to-r from-[#00ff9d] to-[#00cc7d] hover:from-white hover:to-[#00ff9d] text-black px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-300 rounded-xl flex items-center gap-2 shadow-lg shadow-[#00ff9d]/20"
                                >
                                    <Zap className="h-4 w-4" />
                                    Traiter tout
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/5">
                                {/* Temperature Alerts */}
                                <div className="p-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <Thermometer className="h-4 w-4 text-blue-400" />
                                            <span className="text-xs font-mono text-slate-400 uppercase">Températures</span>
                                        </div>
                                        {alertsByCategory.temperature.length > 0 && (
                                            <span className="text-xs font-bold text-blue-400 bg-blue-400/10 px-2.5 py-1 rounded-full">
                                                {alertsByCategory.temperature.length}
                                            </span>
                                        )}
                                    </div>
                                    {alertsByCategory.temperature.length === 0 ? (
                                        <p className="text-xs text-slate-600 font-mono flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-[#00ff9d]" /> Tout est conforme
                                        </p>
                                    ) : (
                                        <div className="space-y-2">
                                            {alertsByCategory.temperature.slice(0, 3).map(alert => (
                                                <div
                                                    key={alert.id}
                                                    onClick={() => handleStartWorkflow('temperature')}
                                                    className="text-sm text-slate-300 hover:text-white cursor-pointer transition-colors truncate py-1 px-2 rounded-lg hover:bg-white/5"
                                                >
                                                    {alert.title}
                                                </div>
                                            ))}
                                            {alertsByCategory.temperature.length > 3 && (
                                                <p className="text-[10px] text-slate-500 pl-2">+{alertsByCategory.temperature.length - 3} autres</p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Cleaning Alerts */}
                                <div className="p-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <SprayCan className="h-4 w-4 text-purple-400" />
                                            <span className="text-xs font-mono text-slate-400 uppercase">Nettoyages</span>
                                        </div>
                                        {alertsByCategory.cleaning.length > 0 && (
                                            <span className="text-xs font-bold text-purple-400 bg-purple-400/10 px-2.5 py-1 rounded-full">
                                                {alertsByCategory.cleaning.length}
                                            </span>
                                        )}
                                    </div>
                                    {alertsByCategory.cleaning.length === 0 ? (
                                        <p className="text-xs text-slate-600 font-mono flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-[#00ff9d]" /> Tout est fait
                                        </p>
                                    ) : (
                                        <div className="space-y-2">
                                            {alertsByCategory.cleaning.slice(0, 3).map(alert => (
                                                <div
                                                    key={alert.id}
                                                    onClick={() => handleStartWorkflow('cleaning')}
                                                    className="text-sm text-slate-300 hover:text-white cursor-pointer transition-colors truncate py-1 px-2 rounded-lg hover:bg-white/5"
                                                >
                                                    {alert.title}
                                                </div>
                                            ))}
                                            {alertsByCategory.cleaning.length > 3 && (
                                                <p className="text-[10px] text-slate-500 pl-2">+{alertsByCategory.cleaning.length - 3} autres</p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* DLC Alerts */}
                                <div className="p-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-orange-400" />
                                            <span className="text-xs font-mono text-slate-400 uppercase">DLC</span>
                                        </div>
                                        {alertsByCategory.dlc.length > 0 && (
                                            <span className="text-xs font-bold text-orange-400 bg-orange-400/10 px-2.5 py-1 rounded-full">
                                                {alertsByCategory.dlc.length}
                                            </span>
                                        )}
                                    </div>
                                    {alertsByCategory.dlc.length === 0 ? (
                                        <p className="text-xs text-slate-600 font-mono flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-[#00ff9d]" /> Aucun produit critique
                                        </p>
                                    ) : (
                                        <div className="space-y-2">
                                            {alertsByCategory.dlc.slice(0, 3).map(alert => (
                                                <div
                                                    key={alert.id}
                                                    onClick={() => handleStartWorkflow('dlc')}
                                                    className="text-sm text-slate-300 hover:text-white cursor-pointer transition-colors truncate py-1 px-2 rounded-lg hover:bg-white/5"
                                                >
                                                    {alert.title}
                                                </div>
                                            ))}
                                            {alertsByCategory.dlc.length > 3 && (
                                                <p className="text-[10px] text-slate-500 pl-2">+{alertsByCategory.dlc.length - 3} autres</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-gradient-to-br from-[#00ff9d]/10 to-[#00ff9d]/5 border border-[#00ff9d]/30 p-8 rounded-2xl flex items-center gap-6"
                        >
                            <div className="p-4 rounded-2xl bg-[#00ff9d]/10">
                                <Shield className="h-10 w-10 text-[#00ff9d]" />
                            </div>
                            <div>
                                <h3 className="font-display text-xl font-bold text-[#00ff9d] uppercase tracking-wider mb-1">
                                    Tout est conforme
                                </h3>
                                <p className="text-sm text-slate-400 font-mono">Aucune alerte en cours - continuez comme ça!</p>
                            </div>
                        </motion.div>
                    )}

                    {/* Weekly Chart */}
                    <WeeklyChart data={weeklyData} />

                </div>

                {/* Right Column - Activity Log */}
                <div className="col-span-12 lg:col-span-4">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-gradient-to-br from-[#0a0a0a] to-[#0f0f0f] border border-white/10 rounded-2xl flex flex-col"
                    >
                        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-[#00ff9d]/10">
                                    <Activity className="h-5 w-5 text-[#00ff9d]" />
                                </div>
                                <div>
                                    <span className="font-display text-base font-bold text-white uppercase tracking-wider">Activité</span>
                                    <p className="text-[10px] text-slate-500 font-mono">Temps réel</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-[#00ff9d] animate-pulse shadow-[0_0_10px_#00ff9d]" />
                                <span className="text-[10px] text-slate-500 font-mono uppercase">Live</span>
                            </div>
                        </div>
                        <div className="p-4 space-y-2">
                            {activities.length === 0 ? (
                                <div className="text-center py-8">
                                    <Activity className="h-8 w-8 text-slate-700 mx-auto mb-3" />
                                    <p className="text-slate-600 text-sm font-mono">Aucune activité aujourd'hui</p>
                                </div>
                            ) : (
                                <>
                                    {activities.slice(0, 5).map((log, index) => (
                                        <motion.div
                                            key={log.id}
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/5 transition-colors border border-transparent hover:border-white/5"
                                        >
                                            <span className="font-mono text-[10px] text-slate-600 w-10 flex-shrink-0">{log.time}</span>
                                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                                log.type === 'temperature' ? 'bg-blue-500/10' :
                                                log.type === 'cleaning' ? 'bg-purple-500/10' :
                                                log.type === 'reception' ? 'bg-green-500/10' : 'bg-orange-500/10'
                                            }`}>
                                                {log.type === 'temperature' && <Thermometer className="h-3.5 w-3.5 text-blue-400" />}
                                                {log.type === 'cleaning' && <SprayCan className="h-3.5 w-3.5 text-purple-400" />}
                                                {log.type === 'reception' && <Truck className="h-3.5 w-3.5 text-green-400" />}
                                                {log.type === 'dlc' && <Calendar className="h-3.5 w-3.5 text-orange-400" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs text-white truncate font-medium">{log.action}</p>
                                                <p className="text-[10px] text-slate-500">{log.user}</p>
                                            </div>
                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                                                log.status === 'OK' ? 'bg-[#00ff9d]/10 text-[#00ff9d]' :
                                                log.status === 'WARN' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'
                                            }`}>
                                                {log.status}
                                            </span>
                                        </motion.div>
                                    ))}

                                    {/* Show More Button */}
                                    {activities.length > 5 && (
                                        <button
                                            onClick={() => setActivityModalOpen(true)}
                                            className="w-full mt-2 py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-2 group"
                                        >
                                            <span className="text-xs font-mono text-slate-400 group-hover:text-white transition-colors">
                                                Voir tout ({activities.length})
                                            </span>
                                            <ChevronDown className="h-4 w-4 text-slate-500 group-hover:text-white transition-colors" />
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Activity Modal */}
            <ActivityModal
                isOpen={activityModalOpen}
                onClose={() => setActivityModalOpen(false)}
                activities={activities}
            />
        </div>
    );
}
