"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, Thermometer, SprayCan, Calendar, Truck, Check, Trash2 } from 'lucide-react';
import { useRestaurant } from '@/contexts/restaurant-context';
import { supabase } from '@/lib/supabase';

interface Notification {
    id: string;
    type: 'temperature' | 'cleaning' | 'dlc' | 'reception' | 'system';
    title: string;
    message: string;
    time: string;
    read: boolean;
    severity: 'info' | 'warning' | 'critical';
}

interface NotificationPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
    const { restaurant } = useRestaurant();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && restaurant?.id) {
            fetchNotifications();
        }
    }, [isOpen, restaurant?.id]);

    const fetchNotifications = async () => {
        if (!restaurant?.id) return;
        setLoading(true);

        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayISO = today.toISOString();

            // Fetch all data
            const [tempLogsRes, dlcProductsRes, cleaningPostsRes, cleaningRecordsRes] = await Promise.all([
                supabase
                    .from('temperature_logs')
                    .select('*, temperature_zones(name, temperature_types(min_temp, max_temp))')
                    .eq('restaurant_id', restaurant.id)
                    .gte('created_at', todayISO)
                    .order('created_at', { ascending: false }),
                supabase
                    .from('dlc_products')
                    .select('id, product_name, dlc_date, status')
                    .eq('restaurant_id', restaurant.id)
                    .eq('status', 'active'),
                supabase
                    .from('cleaning_posts')
                    .select('id, name, cleaning_frequency, cleaning_areas(name)')
                    .eq('restaurant_id', restaurant.id)
                    .eq('is_active', true),
                // Get cleaning records from today only for daily tasks
                supabase
                    .from('cleaning_records')
                    .select('id, post_id, created_at, is_clean')
                    .eq('restaurant_id', restaurant.id)
                    .gte('created_at', todayISO)
                    .order('created_at', { ascending: false })
            ]);

            const notifs: Notification[] = [];
            const now = new Date();

            // Temperature non-conforme alerts
            const tempLogs = tempLogsRes.data || [];
            tempLogs.forEach(log => {
                const minTemp = log.min_temp ?? log.temperature_zones?.temperature_types?.min_temp ?? -Infinity;
                const maxTemp = log.max_temp ?? log.temperature_zones?.temperature_types?.max_temp ?? Infinity;
                if (log.temperature < minTemp || log.temperature > maxTemp) {
                    notifs.push({
                        id: `temp-${log.id}`,
                        type: 'temperature',
                        title: 'Température hors norme',
                        message: `${log.temperature_zones?.name || 'Zone'}: ${log.temperature}°C`,
                        time: new Date(log.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                        read: false,
                        severity: 'critical'
                    });
                }
            });

            // DLC alerts
            const dlcProducts = dlcProductsRes.data || [];
            dlcProducts.forEach(product => {
                const dlcDate = new Date(product.dlc_date);
                const daysUntilExpiry = Math.ceil((dlcDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                if (daysUntilExpiry < 0) {
                    notifs.push({
                        id: `dlc-exp-${product.id}`,
                        type: 'dlc',
                        title: 'Produit expiré',
                        message: `${product.product_name} - Expiré depuis ${Math.abs(daysUntilExpiry)}j`,
                        time: 'Urgent',
                        read: false,
                        severity: 'critical'
                    });
                } else if (daysUntilExpiry <= 1) {
                    notifs.push({
                        id: `dlc-crit-${product.id}`,
                        type: 'dlc',
                        title: 'DLC critique',
                        message: `${product.product_name} - ${daysUntilExpiry === 0 ? "Expire aujourd'hui" : 'Expire demain'}`,
                        time: 'Attention',
                        read: false,
                        severity: 'warning'
                    });
                }
            });

            // Cleaning alerts - only for posts that haven't been cleaned TODAY
            const posts = cleaningPostsRes.data || [];
            const todayRecords = cleaningRecordsRes.data || [];

            // Create a Set of post_ids that have been cleaned today
            const cleanedTodayPostIds = new Set(
                todayRecords
                    .filter((r: any) => r.is_clean === true)
                    .map((r: any) => r.post_id)
            );

            posts.forEach((post: any) => {
                // Skip on-demand cleaning
                if (post.cleaning_frequency === 'on_demand') return;

                // Skip if already cleaned today
                if (cleanedTodayPostIds.has(post.id)) return;

                // Only show notification for daily tasks that need to be done today
                if (post.cleaning_frequency === 'daily') {
                    notifs.push({
                        id: `clean-${post.id}`,
                        type: 'cleaning',
                        title: 'Nettoyage requis',
                        message: `${post.name}${post.cleaning_areas?.name ? ` - ${post.cleaning_areas.name}` : ''}`,
                        time: 'À faire',
                        read: false,
                        severity: 'warning'
                    });
                }
            });

            setNotifications(notifs);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const removeNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const clearAll = () => {
        setNotifications([]);
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    const getIcon = (type: string) => {
        switch (type) {
            case 'temperature': return <Thermometer className="h-4 w-4" />;
            case 'cleaning': return <SprayCan className="h-4 w-4" />;
            case 'dlc': return <Calendar className="h-4 w-4" />;
            case 'reception': return <Truck className="h-4 w-4" />;
            default: return <Bell className="h-4 w-4" />;
        }
    };

    const getIconColor = (type: string, severity: string) => {
        if (severity === 'critical') return 'text-red-400 bg-red-500/10';
        if (severity === 'warning') return 'text-orange-400 bg-orange-500/10';
        switch (type) {
            case 'temperature': return 'text-blue-400 bg-blue-500/10';
            case 'cleaning': return 'text-purple-400 bg-purple-500/10';
            case 'dlc': return 'text-orange-400 bg-orange-500/10';
            case 'reception': return 'text-green-400 bg-green-500/10';
            default: return 'text-slate-400 bg-slate-500/10';
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-full w-full sm:w-96 bg-[#0a0a0a]/95 backdrop-blur-xl border-l border-white/10 z-50 flex flex-col shadow-2xl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-[#00ff9d]/10">
                                    <Bell className="h-5 w-5 text-[#00ff9d]" />
                                </div>
                                <div>
                                    <h2 className="font-display text-lg font-bold text-white uppercase tracking-wider">
                                        Notifications
                                    </h2>
                                    <p className="text-xs text-slate-500 font-mono">
                                        {unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'Tout est lu'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Actions */}
                        {notifications.length > 0 && (
                            <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
                                <button
                                    onClick={markAllAsRead}
                                    className="text-xs font-mono text-slate-400 hover:text-[#00ff9d] transition-colors flex items-center gap-1"
                                >
                                    <Check className="h-3 w-3" />
                                    Tout marquer comme lu
                                </button>
                                <button
                                    onClick={clearAll}
                                    className="text-xs font-mono text-slate-400 hover:text-red-400 transition-colors flex items-center gap-1"
                                >
                                    <Trash2 className="h-3 w-3" />
                                    Effacer tout
                                </button>
                            </div>
                        )}

                        {/* Notifications List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="h-8 w-8 border-2 border-[#00ff9d] border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <div className="p-4 rounded-2xl bg-white/5 mb-4">
                                        <Bell className="h-8 w-8 text-slate-600" />
                                    </div>
                                    <p className="text-slate-400 font-medium mb-1">Aucune notification</p>
                                    <p className="text-xs text-slate-600 font-mono">Tout est sous contrôle</p>
                                </div>
                            ) : (
                                <AnimatePresence>
                                    {notifications.map((notif, index) => (
                                        <motion.div
                                            key={notif.id}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ delay: index * 0.05 }}
                                            onClick={() => markAsRead(notif.id)}
                                            className={`group relative p-4 rounded-xl border transition-all cursor-pointer ${
                                                notif.read
                                                    ? 'bg-white/[0.02] border-white/5 opacity-60'
                                                    : 'bg-white/5 border-white/10 hover:border-white/20'
                                            }`}
                                        >
                                            <div className="flex gap-3">
                                                <div className={`p-2 rounded-lg ${getIconColor(notif.type, notif.severity)}`}>
                                                    {getIcon(notif.type)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <h3 className={`text-sm font-medium ${
                                                            notif.severity === 'critical' ? 'text-red-400' :
                                                            notif.severity === 'warning' ? 'text-orange-400' : 'text-white'
                                                        }`}>
                                                            {notif.title}
                                                        </h3>
                                                        <span className="text-[10px] font-mono text-slate-500 flex-shrink-0">
                                                            {notif.time}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-400 mt-1 truncate">
                                                        {notif.message}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Delete button on hover */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeNotification(notif.id);
                                                }}
                                                className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500/10 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>

                                            {/* Unread indicator */}
                                            {!notif.read && (
                                                <div className="absolute top-4 left-1 w-1.5 h-1.5 rounded-full bg-[#00ff9d]" />
                                            )}
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
