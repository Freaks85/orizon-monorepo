"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Table2,
    Clock,
    CalendarCheck,
    BookOpen,
    Settings,
    LogOut,
    CalendarRange,
    X,
    ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: CalendarCheck, label: 'Reservations', href: '/dashboard/reservations' },
    { icon: BookOpen, label: 'Cahier Resa', href: '/dashboard/cahier' },
    { icon: Table2, label: 'Salles', href: '/dashboard/rooms' },
    { icon: Clock, label: 'Services', href: '/dashboard/services' },
    { icon: Settings, label: 'Parametres', href: '/dashboard/settings' },
];

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
    const pathname = usePathname();
    const [isHovered, setIsHovered] = useState(false);

    const handleLinkClick = () => {
        if (onClose) {
            onClose();
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = '/login';
    };

    const desktopSidebarContent = (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="h-16 flex items-center border-b border-white/10 px-4 overflow-hidden">
                <div className="flex items-center gap-3 min-w-max">
                    <div className="border border-[#ff6b00]/30 p-1.5 bg-[#ff6b00]/5 rounded-lg">
                        <CalendarRange className="h-6 w-6 text-[#ff6b00]" />
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
                            Orizons<span className="text-[#ff6b00]">Reservation</span>
                        </span>
                    </motion.div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto overflow-x-hidden">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== '/dashboard' && pathname?.startsWith(item.href));
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={handleLinkClick}
                            className={`flex items-center gap-3 h-12 px-3 rounded-xl transition-all duration-200 group relative overflow-hidden ${
                                isActive
                                    ? 'bg-gradient-to-r from-[#ff6b00]/20 to-[#ff6b00]/5 text-[#ff6b00] border-l-2 border-[#ff6b00]'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <div className={`flex-shrink-0 w-6 h-6 flex items-center justify-center ${
                                isActive ? 'text-[#ff6b00]' : 'text-slate-500 group-hover:text-white'
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
                                    className="absolute right-2 w-1.5 h-1.5 rounded-full bg-[#ff6b00] shadow-[0_0_10px_#ff6b00]"
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

    const fullSidebarContent = (
        <>
            <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <div className="border border-[#ff6b00]/30 p-1.5 bg-[#ff6b00]/5 rounded-lg">
                        <CalendarRange className="h-5 w-5 text-[#ff6b00]" />
                    </div>
                    <span className="font-display font-bold text-lg tracking-widest text-white uppercase">
                        Orizons<span className="text-[#ff6b00]">Reservation</span>
                    </span>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 text-slate-400 hover:text-white transition-colors rounded-xl hover:bg-white/5"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>

            <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== '/dashboard' && pathname?.startsWith(item.href));
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={handleLinkClick}
                            className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all group relative overflow-hidden ${
                                isActive
                                    ? 'bg-gradient-to-r from-[#ff6b00]/20 to-[#ff6b00]/5 text-[#ff6b00] border-l-2 border-[#ff6b00]'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <item.icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-[#ff6b00]' : 'text-slate-500 group-hover:text-white'}`} />
                            <span className="font-mono text-sm uppercase tracking-wider font-bold">{item.label}</span>
                            {isActive && (
                                <ChevronRight className="h-4 w-4 ml-auto text-[#ff6b00]" />
                            )}
                        </Link>
                    );
                })}
            </nav>

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
            {/* Desktop Sidebar */}
            <motion.aside
                initial={false}
                animate={{ width: isHovered ? 280 : 72 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="fixed left-0 top-0 h-screen bg-[#0a0a0a]/95 backdrop-blur-xl border-r border-white/10 z-40 hidden md:flex flex-col shadow-2xl shadow-black/50"
            >
                {desktopSidebarContent}
            </motion.aside>

            {/* Mobile Sidebar */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden"
                        />
                        <motion.aside
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed left-0 top-0 h-screen w-[80vw] max-w-72 bg-[#0a0a0a]/95 backdrop-blur-xl border-r border-white/10 flex flex-col z-50 md:hidden shadow-2xl shadow-black/50"
                        >
                            {fullSidebarContent}
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
