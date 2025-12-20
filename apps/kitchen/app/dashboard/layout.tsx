"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, X } from 'lucide-react';
import { Sidebar } from '@/components/dashboard/sidebar';
import { TopNav } from '@/components/dashboard/top-nav';
import { supabase } from '@/lib/supabase';
import { EmployeeProvider, useEmployee } from '@/contexts/employee-context';
import { RestaurantProvider } from '@/contexts/restaurant-context';
import { AlertWorkflowProvider, useAlertWorkflow } from '@/contexts/alert-workflow-context';
import KioskSelector from '@/components/dashboard/kiosk-selector';

// Alert Workflow Bar Component
function AlertWorkflowBar() {
    const { isWorkflowActive, alerts, currentAlertIndex, currentAlert, isTransitioning, nextAlert, skipAlert, exitWorkflow } = useAlertWorkflow();

    if (!isWorkflowActive || !currentAlert) return null;

    return (
        <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 md:left-[72px] bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-[#00ff9d]/30 p-4 z-50"
        >
            <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    {/* Progress bar */}
                    <div className="flex items-center gap-2">
                        <div className="bg-[#00ff9d]/10 px-3 py-1 rounded-sm">
                            <span className="text-xs font-mono text-[#00ff9d] font-bold">
                                {currentAlertIndex + 1} / {alerts.length}
                            </span>
                        </div>
                        {/* Mini progress dots */}
                        <div className="hidden sm:flex items-center gap-1">
                            {alerts.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`h-2 w-2 rounded-full transition-all duration-300 ${
                                        idx < currentAlertIndex
                                            ? 'bg-[#00ff9d]'
                                            : idx === currentAlertIndex
                                                ? 'bg-[#00ff9d] scale-125'
                                                : 'bg-white/20'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="hidden sm:block">
                        <motion.div
                            key={currentAlert.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <p className="text-sm text-white font-medium">{currentAlert.title}</p>
                            <p className="text-xs text-slate-500">{currentAlert.message}</p>
                        </motion.div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={skipAlert}
                        disabled={isTransitioning}
                        className="px-3 py-2 text-xs font-bold uppercase text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                    >
                        Passer
                    </button>
                    <button
                        onClick={exitWorkflow}
                        disabled={isTransitioning}
                        className="p-2 text-slate-400 hover:text-red-400 transition-colors disabled:opacity-50"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

// Transition overlay component
function TransitionOverlay() {
    const { isTransitioning, currentAlert } = useAlertWorkflow();

    return (
        <AnimatePresence>
            {isTransitioning && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="fixed inset-0 z-40 bg-[#050505]/80 backdrop-blur-sm flex items-center justify-center md:ml-[72px]"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="text-center"
                    >
                        <div className="h-8 w-8 border-2 border-[#00ff9d] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                        <p className="font-mono text-xs text-[#00ff9d] uppercase tracking-widest">
                            {currentAlert ? 'Alerte suivante...' : 'Terminé !'}
                        </p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

function DashboardContent({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { activeEmployee } = useEmployee();
    const { isWorkflowActive } = useAlertWorkflow();

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/login');
            } else {
                setLoading(false);
            }
        };
        checkUser();
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 border-2 border-[#00ff9d] border-t-transparent rounded-full animate-spin"></div>
                    <p className="font-mono text-[#00ff9d] text-xs uppercase tracking-widest animate-pulse">Initialisation Séquence...</p>
                </div>
            </div>
        );
    }

    // Kiosk Mode: If no employee selected, show the selector
    if (!activeEmployee) {
        return <KioskSelector />;
    }

    // Dashboard Mode: Show Sidebar and Content
    return (
        <div className="min-h-screen bg-[#050505] text-white flex font-sans selection:bg-[#00ff9d] selection:text-black">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="flex-1 flex flex-col md:ml-[72px] transition-all duration-300">
                <TopNav onMenuClick={() => setSidebarOpen(true)} />
                <main className={`flex-1 p-3 sm:p-4 md:p-6 lg:p-8 overflow-x-hidden ${isWorkflowActive ? 'pb-24' : ''}`}>
                    {children}
                </main>
            </div>

            {/* Alert Workflow Bar */}
            <AnimatePresence>
                <AlertWorkflowBar />
            </AnimatePresence>

            {/* Transition Overlay */}
            <TransitionOverlay />
        </div>
    );
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <RestaurantProvider>
            <EmployeeProvider>
                <AlertWorkflowProvider>
                    <DashboardContent>
                        {children}
                    </DashboardContent>
                </AlertWorkflowProvider>
            </EmployeeProvider>
        </RestaurantProvider>
    );
}
