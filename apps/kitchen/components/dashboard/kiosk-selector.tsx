"use client";
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useEmployee } from '@/contexts/employee-context';
import { useRestaurant } from '@/contexts/restaurant-context';
import { Digicode } from '@/components/ui/digicode';

export default function KioskSelector() {
    const { setActiveEmployee } = useEmployee();
    const { restaurant, loading: restaurantLoading } = useRestaurant();
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [pendingEmployee, setPendingEmployee] = useState<any>(null);
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);
    const [pinInput, setPinInput] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Attendre que le restaurant soit chargé
        if (restaurantLoading) return;

        if (restaurant?.id) {
            fetchEmployees();
        } else {
            // Pas de restaurant = pas d'employés à charger
            setLoading(false);
        }
    }, [restaurant?.id, restaurantLoading]);

    const fetchEmployees = async () => {
        try {
            if (!restaurant?.id) return;

            const { data, error } = await supabase
                .from('employees')
                .select('*')
                .eq('restaurant_id', restaurant.id);

            if (error) throw error;
            setEmployees(data || []);
        } catch (error) {
            console.error('Error fetching employees:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEmployeeClick = (emp: any) => {
        if (emp.pin_code) {
            setPendingEmployee(emp);
            setIsPinModalOpen(true);
            setPinInput('');
            setError(null);
        } else {
            setActiveEmployee(emp);
        }
    };

    const verifyPin = (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (pendingEmployee && pinInput === pendingEmployee.pin_code) {
            setActiveEmployee(pendingEmployee);
            setIsPinModalOpen(false);
            setPendingEmployee(null);
        } else {
            setError('Code PIN incorrect');
            setPinInput('');
        }
    };

    // Auto-validate if 4 digits entered
    useEffect(() => {
        if (pinInput.length === 4) {
            const timer = setTimeout(() => {
                verifyPin();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [pinInput]);

    return (
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00ff9d]/20 to-transparent"></div>
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00ff9d]/20 to-transparent"></div>

            <div className="relative z-10 w-full max-w-4xl">
                <div className="text-center mb-8 sm:mb-12 md:mb-16">
                    <h1 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white uppercase tracking-wider mb-2 sm:mb-4">
                        Identification
                    </h1>
                    <p className="font-mono text-xs sm:text-sm text-slate-500 px-4">
                        Sélectionnez votre profil pour commencer.
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-[#00ff9d] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : employees.length === 0 ? (
                    <div className="text-center border border-dashed border-white/10 p-6 sm:p-8 md:p-12 rounded-sm bg-white/5 mx-2">
                        <p className="text-slate-400 mb-4 sm:mb-6 font-mono text-xs sm:text-sm">Aucun employé n'est configuré pour cet établissement.</p>
                        <a href="/dashboard/settings" className="inline-block bg-[#00ff9d] text-black font-bold uppercase tracking-widest px-4 sm:px-6 py-2.5 sm:py-3 text-[10px] sm:text-xs hover:bg-white transition-colors">
                            Configurer les équipes
                        </a>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                        {employees.map((emp) => (
                            <motion.div
                                key={emp.id}
                                whileHover={{ scale: 1.03, borderColor: 'rgba(0, 255, 157, 0.5)' }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => handleEmployeeClick(emp)}
                                className="bg-[#0a0a0a] border border-white/10 p-4 sm:p-6 md:p-8 rounded-sm flex flex-col items-center gap-3 sm:gap-4 md:gap-6 cursor-pointer group transition-colors shadow-2xl shadow-black/50"
                            >
                                <div className={`h-14 w-14 sm:h-18 sm:w-18 md:h-24 md:w-24 rounded-full flex items-center justify-center text-xl sm:text-2xl md:text-3xl font-bold border-2 transition-colors ${emp.role === 'admin' ? 'bg-red-500/10 border-red-500 text-red-500' :
                                        emp.role === 'manager' ? 'bg-[#00ff9d]/10 border-[#00ff9d] text-[#00ff9d]' :
                                            'bg-slate-500/10 border-slate-500 text-slate-400'
                                    }`}>
                                    {emp.first_name[0]}{emp.last_name[0]}
                                </div>
                                <div className="text-center">
                                    <h3 className="font-display text-sm sm:text-base md:text-lg font-bold text-white uppercase mb-1 group-hover:text-[#00ff9d] transition-colors truncate max-w-full">{emp.first_name}</h3>
                                    <span className={`text-[8px] sm:text-[10px] font-mono px-1.5 sm:px-2 py-0.5 rounded-sm uppercase ${emp.role === 'admin' ? 'bg-red-500/20 text-red-500' :
                                            emp.role === 'manager' ? 'bg-[#00ff9d]/20 text-[#00ff9d]' :
                                                'bg-slate-800 text-slate-500'
                                        }`}>
                                        {emp.role}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* PIN Modal */}
            {isPinModalOpen && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 50 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        className="bg-[#0a0a0a] border border-white/10 p-6 sm:p-8 rounded-t-lg sm:rounded-sm w-full sm:max-w-sm text-center relative"
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-[#00ff9d]"></div>
                        <h3 className="font-display text-lg sm:text-xl text-white uppercase mb-6 sm:mb-8 tracking-wider">Code PIN Requis</h3>

                        <div className="mb-4 sm:mb-6">
                            <Digicode
                                value={pinInput}
                                onChange={setPinInput}
                                maxLength={4}
                            />
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-2 sm:p-3 mb-4 sm:mb-6 text-[10px] sm:text-xs font-mono animate-shake">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                            <button
                                type="button"
                                onClick={() => setIsPinModalOpen(false)}
                                className="py-3 sm:py-4 border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 font-bold uppercase text-[10px] sm:text-xs tracking-widest transition-colors rounded-sm"
                            >
                                Annuler
                            </button>
                            <button
                                type="button"
                                onClick={() => verifyPin()}
                                className="py-3 sm:py-4 bg-[#00ff9d] text-black font-bold uppercase text-[10px] sm:text-xs tracking-widest hover:bg-white transition-colors rounded-sm"
                            >
                                Valider
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
