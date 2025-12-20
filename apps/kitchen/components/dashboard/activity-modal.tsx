"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { X, Activity, Thermometer, SprayCan, Truck, Calendar } from 'lucide-react';

interface ActivityItem {
    id: string;
    time: string;
    action: string;
    status: 'OK' | 'WARN' | 'CRITICAL';
    user: string;
    type: 'temperature' | 'cleaning' | 'reception' | 'dlc';
}

interface ActivityModalProps {
    isOpen: boolean;
    onClose: () => void;
    activities: ActivityItem[];
}

export function ActivityModal({ isOpen, onClose, activities }: ActivityModalProps) {
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
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed inset-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-lg sm:max-h-[80vh] bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-2xl z-50 flex flex-col shadow-2xl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-[#00ff9d]/10">
                                    <Activity className="h-5 w-5 text-[#00ff9d]" />
                                </div>
                                <div>
                                    <h2 className="font-display text-lg font-bold text-white uppercase tracking-wider">
                                        Toutes les activités
                                    </h2>
                                    <p className="text-xs text-slate-500 font-mono">{activities.length} activités aujourd'hui</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Activities List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {activities.length === 0 ? (
                                <div className="text-center py-12">
                                    <Activity className="h-8 w-8 text-slate-700 mx-auto mb-3" />
                                    <p className="text-slate-600 text-sm font-mono">Aucune activité aujourd'hui</p>
                                </div>
                            ) : (
                                activities.map((log, index) => (
                                    <motion.div
                                        key={log.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.03 }}
                                        className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] hover:bg-white/5 transition-colors border border-transparent hover:border-white/5"
                                    >
                                        <span className="font-mono text-[10px] text-slate-600 w-12 flex-shrink-0">{log.time}</span>
                                        <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                            log.type === 'temperature' ? 'bg-blue-500/10' :
                                            log.type === 'cleaning' ? 'bg-purple-500/10' :
                                            log.type === 'reception' ? 'bg-green-500/10' : 'bg-orange-500/10'
                                        }`}>
                                            {log.type === 'temperature' && <Thermometer className="h-4 w-4 text-blue-400" />}
                                            {log.type === 'cleaning' && <SprayCan className="h-4 w-4 text-purple-400" />}
                                            {log.type === 'reception' && <Truck className="h-4 w-4 text-green-400" />}
                                            {log.type === 'dlc' && <Calendar className="h-4 w-4 text-orange-400" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-white truncate font-medium">{log.action}</p>
                                            <p className="text-[10px] text-slate-500">{log.user}</p>
                                        </div>
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${
                                            log.status === 'OK' ? 'bg-[#00ff9d]/10 text-[#00ff9d]' :
                                            log.status === 'WARN' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'
                                        }`}>
                                            {log.status}
                                        </span>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
