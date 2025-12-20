"use client";

import { useState, useEffect, useMemo } from 'react';
import { useEmployee } from '@/contexts/employee-context';
import { useRestaurant } from '@/contexts/restaurant-context';
import { Bell, Users, Menu, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { NotificationPanel } from './notification-panel';
import { supabase } from '@/lib/supabase';

interface TopNavProps {
    onMenuClick?: () => void;
}

export function TopNav({ onMenuClick }: TopNavProps) {
    const { activeEmployee, setActiveEmployee } = useEmployee();
    const { restaurant } = useRestaurant();
    const [notificationOpen, setNotificationOpen] = useState(false);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const [score, setScore] = useState(100);

    // Fetch score data
    useEffect(() => {
        if (restaurant?.id) {
            fetchScoreData();
            const interval = setInterval(fetchScoreData, 30000); // Update every 30s
            return () => clearInterval(interval);
        }
    }, [restaurant?.id]);

    const fetchScoreData = async () => {
        if (!restaurant?.id) return;

        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayISO = today.toISOString();

            const [tempLogsRes, cleaningPostsRes, cleaningRecordsRes, dlcProductsRes] = await Promise.all([
                supabase
                    .from('temperature_logs')
                    .select('temperature, min_temp, max_temp, temperature_zones(temperature_types(min_temp, max_temp))')
                    .eq('restaurant_id', restaurant.id)
                    .gte('created_at', todayISO),
                supabase
                    .from('cleaning_posts')
                    .select('id, cleaning_frequency')
                    .eq('restaurant_id', restaurant.id)
                    .eq('is_active', true),
                supabase
                    .from('cleaning_records')
                    .select('post_id, is_clean, created_at')
                    .eq('restaurant_id', restaurant.id)
                    .gte('created_at', todayISO),
                supabase
                    .from('dlc_products')
                    .select('dlc_date')
                    .eq('restaurant_id', restaurant.id)
                    .eq('status', 'active')
            ]);

            let calculatedScore = 100;

            // Temperature conformity
            const tempLogs = tempLogsRes.data || [];
            if (tempLogs.length > 0) {
                let conforme = 0;
                tempLogs.forEach((log: any) => {
                    const minTemp = log.min_temp ?? log.temperature_zones?.temperature_types?.min_temp ?? -Infinity;
                    const maxTemp = log.max_temp ?? log.temperature_zones?.temperature_types?.max_temp ?? Infinity;
                    if (log.temperature >= minTemp && log.temperature <= maxTemp) conforme++;
                });
                const tempConformity = (conforme / tempLogs.length) * 100;
                if (tempConformity < 100) calculatedScore -= (100 - tempConformity) * 0.4;
            }

            // Cleaning rate
            const posts = cleaningPostsRes.data || [];
            const records = cleaningRecordsRes.data || [];
            const activePosts = posts.filter((p: any) => p.cleaning_frequency !== 'on_demand');
            if (activePosts.length > 0) {
                const cleanedPostIds = new Set(records.filter((r: any) => r.is_clean).map((r: any) => r.post_id));
                const cleaningRate = (cleanedPostIds.size / activePosts.length) * 100;
                if (cleaningRate < 100) calculatedScore -= (100 - cleaningRate) * 0.3;
            }

            // DLC issues
            const dlcProducts = dlcProductsRes.data || [];
            const now = new Date();
            let dlcExpired = 0;
            let dlcCritical = 0;
            dlcProducts.forEach((product: any) => {
                const dlcDate = new Date(product.dlc_date);
                const daysUntilExpiry = Math.ceil((dlcDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                if (daysUntilExpiry < 0) dlcExpired++;
                else if (daysUntilExpiry <= 1) dlcCritical++;
            });
            if (dlcExpired > 0) calculatedScore -= dlcExpired * 10;
            if (dlcCritical > 0) calculatedScore -= dlcCritical * 5;

            setScore(Math.max(0, Math.round(calculatedScore)));
        } catch (error) {
            console.error('Error fetching score:', error);
        }
    };

    const scoreColor = useMemo(() => {
        if (score >= 90) return 'text-[#00ff9d]';
        if (score >= 70) return 'text-yellow-500';
        return 'text-red-500';
    }, [score]);

    const scoreBgColor = useMemo(() => {
        if (score >= 90) return 'from-[#00ff9d]/20 to-[#00ff9d]/5 border-[#00ff9d]/30';
        if (score >= 70) return 'from-yellow-500/20 to-yellow-500/5 border-yellow-500/30';
        return 'from-red-500/20 to-red-500/5 border-red-500/30';
    }, [score]);

    return (
        <>
            <header className="h-14 md:h-16 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-3 sm:px-4 md:px-6 sticky top-0 z-30">
                {/* Left: Menu Button (Mobile) + Logo/Title */}
                <div className="flex items-center gap-3">
                    {/* Bouton Menu Hamburger - Mobile uniquement */}
                    <button
                        onClick={onMenuClick}
                        className="md:hidden p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                    >
                        <Menu className="h-5 w-5" />
                    </button>

                    {/* Page Title - Desktop */}
                    <div className="hidden md:block">
                        <h1 className="font-display text-lg font-bold text-white uppercase tracking-wider">
                            Orizon<span className="text-[#00ff9d]">Kitchen</span>
                        </h1>
                    </div>
                </div>

                {/* Right: Score + Notifications & Profile */}
                <div className="flex items-center gap-2 sm:gap-3">
                    {/* Score Badge */}
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-br ${scoreBgColor} border`}>
                        <div className="relative w-7 h-7 flex items-center justify-center">
                            <svg className="absolute inset-0 w-full h-full -rotate-90">
                                <circle
                                    cx="14"
                                    cy="14"
                                    r="12"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    className="text-white/10"
                                />
                                <circle
                                    cx="14"
                                    cy="14"
                                    r="12"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeDasharray={`${score * 0.754} 75.4`}
                                    className={scoreColor}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <span className={`text-[10px] font-bold font-mono ${scoreColor}`}>
                                {score}
                            </span>
                        </div>
                        <span className={`text-[10px] font-mono font-bold uppercase hidden sm:block ${scoreColor}`}>
                            {score >= 90 ? 'Excellent' : score >= 70 ? 'Attention' : 'Urgent'}
                        </span>
                    </div>

                    {/* Notification Bell */}
                    <button
                        onClick={() => setNotificationOpen(true)}
                        className="relative p-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                    >
                        <Bell className="h-5 w-5" />
                        <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-[#0a0a0a] animate-pulse"></span>
                    </button>

                    <div className="h-8 w-[1px] bg-white/10 hidden sm:block"></div>

                    {/* User Profile Section */}
                    <div className="relative">
                        <button
                            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                            className="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 rounded-xl hover:bg-white/5 transition-colors"
                        >
                            {/* User Avatar */}
                            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-[#00ff9d]/20 to-[#00ff9d]/5 border border-[#00ff9d]/30 flex items-center justify-center">
                                <span className="text-sm font-bold text-[#00ff9d]">
                                    {activeEmployee ? `${activeEmployee.first_name[0]}${activeEmployee.last_name[0]}` : '?'}
                                </span>
                            </div>

                            {/* User Info - Desktop */}
                            <div className="text-left hidden sm:block">
                                <div className="text-white text-sm font-medium truncate max-w-[140px]">
                                    {activeEmployee ? `${activeEmployee.first_name} ${activeEmployee.last_name}` : 'Non connecté'}
                                </div>
                                <div className="text-[#00ff9d] text-[10px] font-mono uppercase tracking-wider">
                                    {activeEmployee?.role || 'Invité'}
                                </div>
                            </div>

                            <ChevronDown className={`h-4 w-4 text-slate-400 hidden sm:block transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Profile Dropdown Menu */}
                        <AnimatePresence>
                            {profileMenuOpen && (
                                <>
                                    {/* Backdrop */}
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setProfileMenuOpen(false)}
                                    />

                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute right-0 top-full mt-2 w-64 bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 z-50 overflow-hidden"
                                    >
                                        {/* User Info Header */}
                                        <div className="p-4 border-b border-white/10 bg-gradient-to-br from-[#00ff9d]/5 to-transparent">
                                            <div className="flex items-center gap-3">
                                                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#00ff9d]/20 to-[#00ff9d]/5 border border-[#00ff9d]/30 flex items-center justify-center">
                                                    <span className="text-lg font-bold text-[#00ff9d]">
                                                        {activeEmployee ? `${activeEmployee.first_name[0]}${activeEmployee.last_name[0]}` : '?'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="text-white font-medium">
                                                        {activeEmployee ? `${activeEmployee.first_name} ${activeEmployee.last_name}` : 'Non connecté'}
                                                    </p>
                                                    <p className="text-[#00ff9d] text-xs font-mono uppercase">
                                                        {activeEmployee?.role || 'Invité'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Menu Items */}
                                        <div className="p-2">
                                            <button
                                                onClick={() => {
                                                    setActiveEmployee(null);
                                                    setProfileMenuOpen(false);
                                                }}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                                            >
                                                <Users className="h-4 w-4" />
                                                <span className="text-sm">Changer d'employé</span>
                                            </button>
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </header>

            {/* Notification Panel */}
            <NotificationPanel
                isOpen={notificationOpen}
                onClose={() => setNotificationOpen(false)}
            />
        </>
    );
}
