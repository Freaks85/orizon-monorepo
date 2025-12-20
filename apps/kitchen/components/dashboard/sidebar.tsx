"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Thermometer,
    Truck,
    ClipboardList,
    AlertTriangle,
    Settings,
    Settings2,
    SprayCan,
    LogOut,
    ShieldCheck,
    X,
    ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useEmployee } from '@/contexts/employee-context';

const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: Thermometer, label: 'Températures', href: '/dashboard/temperatures' },
    { icon: Truck, label: 'Réception', href: '/dashboard/reception' },
    { icon: SprayCan, label: 'Nettoyage', href: '/dashboard/cleaning' },
    { icon: ClipboardList, label: 'Traçabilité', href: '/dashboard/traceability' },
    { icon: AlertTriangle, label: 'Alertes', href: '/dashboard/alerts' },
    { icon: Settings2, label: 'Gérer', href: '/dashboard/manage', adminOnly: true },
    { icon: Settings, label: 'Paramètres', href: '/dashboard/settings', adminOnly: true },
];

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
    const pathname = usePathname();
    const { activeEmployee } = useEmployee();
    const [isHovered, setIsHovered] = useState(false);

    const filteredMenuItems = menuItems.filter(item => {
        if (item.adminOnly) {
            const role = activeEmployee?.role?.toLowerCase().trim();
            if (role !== 'manager' && role !== 'admin') {
                return false;
            }
        }
        return true;
    });

    const handleLinkClick = () => {
        if (onClose) {
            onClose();
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = '/login';
    };

    // Desktop sidebar content with hover expansion
    const desktopSidebarContent = (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="h-16 flex items-center border-b border-white/10 px-4 overflow-hidden">
                <div className="flex items-center gap-3 min-w-max">
                    <div className="border border-[#00ff9d]/30 p-1.5 bg-[#00ff9d]/5 rounded-lg">
                        <ShieldCheck className="h-6 w-6 text-[#00ff9d]" />
                    </div>
                    <motion.div
                        initial={false}
                        animate={{
                            opacity: isHovered ? 1 : 0,
                            width: isHovered ? 'auto' : 0
                        }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="overflow-hidden whitespace-nowrap"
                    >
                        <span className="font-display font-bold text-lg tracking-widest text-white uppercase">
                            Orizon<span className="text-[#00ff9d]">Kitchen</span>
                        </span>
                    </motion.div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto overflow-x-hidden">
                {filteredMenuItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={handleLinkClick}
                            className={`flex items-center gap-3 h-12 px-3 rounded-xl transition-all duration-200 group relative overflow-hidden ${
                                isActive
                                    ? 'bg-gradient-to-r from-[#00ff9d]/20 to-[#00ff9d]/5 text-[#00ff9d] border-l-2 border-[#00ff9d]'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <div className={`flex-shrink-0 w-6 h-6 flex items-center justify-center ${
                                isActive ? 'text-[#00ff9d]' : 'text-slate-500 group-hover:text-white'
                            }`}>
                                <item.icon className="h-5 w-5" />
                            </div>
                            <motion.span
                                initial={false}
                                animate={{
                                    opacity: isHovered ? 1 : 0,
                                    x: isHovered ? 0 : -10
                                }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                className="font-mono text-xs uppercase tracking-wider font-bold whitespace-nowrap"
                            >
                                {item.label}
                            </motion.span>
                            {isActive && (
                                <motion.div
                                    layoutId="activeSidebarIndicator"
                                    className="absolute right-2 w-1.5 h-1.5 rounded-full bg-[#00ff9d] shadow-[0_0_10px_#00ff9d]"
                                    initial={false}
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Logout Button */}
            <div className="p-3 border-t border-white/10">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 h-12 px-3 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 border border-transparent hover:border-red-500/20"
                >
                    <LogOut className="h-5 w-5 flex-shrink-0" />
                    <motion.span
                        initial={false}
                        animate={{
                            opacity: isHovered ? 1 : 0,
                            x: isHovered ? 0 : -10
                        }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="font-mono text-xs uppercase tracking-wider font-bold whitespace-nowrap"
                    >
                        Déconnexion
                    </motion.span>
                </button>
            </div>
        </div>
    );

    // Full sidebar content for mobile
    const fullSidebarContent = (
        <>
            {/* Logo Area */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <div className="border border-[#00ff9d]/30 p-1.5 bg-[#00ff9d]/5 rounded-lg">
                        <ShieldCheck className="h-5 w-5 text-[#00ff9d]" />
                    </div>
                    <span className="font-display font-bold text-lg tracking-widest text-white uppercase">
                        Orizon<span className="text-[#00ff9d]">Kitchen</span>
                    </span>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 text-slate-400 hover:text-white transition-colors rounded-xl hover:bg-white/5"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
                {filteredMenuItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={handleLinkClick}
                            className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all group relative overflow-hidden ${
                                isActive
                                    ? 'bg-gradient-to-r from-[#00ff9d]/20 to-[#00ff9d]/5 text-[#00ff9d] border-l-2 border-[#00ff9d]'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <item.icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-[#00ff9d]' : 'text-slate-500 group-hover:text-white'}`} />
                            <span className="font-mono text-sm uppercase tracking-wider font-bold">{item.label}</span>
                            {isActive && (
                                <ChevronRight className="h-4 w-4 ml-auto text-[#00ff9d]" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-white/10">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-3 text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors rounded-xl border border-transparent hover:border-red-500/20"
                >
                    <LogOut className="h-5 w-5" />
                    <span className="font-mono text-xs uppercase tracking-wider font-bold">Déconnexion</span>
                </button>
            </div>
        </>
    );

    return (
        <>
            {/* Sidebar Desktop - Expandable on hover */}
            <motion.aside
                initial={false}
                animate={{ width: isHovered ? 260 : 72 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="fixed left-0 top-0 h-screen bg-[#0a0a0a]/95 backdrop-blur-xl border-r border-white/10 z-40 hidden md:flex flex-col shadow-2xl shadow-black/50"
            >
                {desktopSidebarContent}
            </motion.aside>

            {/* Sidebar Mobile - Full overlay with animation */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden"
                        />
                        {/* Sidebar Mobile */}
                        <motion.aside
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed left-0 top-0 h-screen w-72 bg-[#0a0a0a]/95 backdrop-blur-xl border-r border-white/10 flex flex-col z-50 md:hidden shadow-2xl shadow-black/50"
                        >
                            {fullSidebarContent}
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
