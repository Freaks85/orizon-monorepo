"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Shield, CreditCard, Users, Plus, Trash2, Key, ChevronDown } from 'lucide-react';
import { Digicode } from '@/components/ui/digicode';

import { useEmployee } from '@/contexts/employee-context';
import { useRestaurant } from '@/contexts/restaurant-context';

export default function SettingsPage() {
    const { activeEmployee } = useEmployee();
    const { restaurant } = useRestaurant();
    const [activeTab, setActiveTab] = useState('team');
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newEmployee, setNewEmployee] = useState({ firstName: '', lastName: '', role: 'staff', pinCode: '' });
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const normalizedRole = activeEmployee?.role?.toLowerCase().trim();
    if (activeEmployee && normalizedRole !== 'manager' && normalizedRole !== 'admin') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                <Shield className="h-16 w-16 sm:h-24 sm:w-24 text-red-500/20 mb-4 sm:mb-6" />
                <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-white uppercase tracking-wider mb-2">Accès Refusé</h1>
                <p className="font-mono text-xs sm:text-sm text-slate-500 mb-4 sm:mb-6">Seuls les managers et administrateurs peuvent accéder à cette section.</p>
                <div className="text-[10px] sm:text-xs font-mono text-red-400 bg-red-500/10 px-3 sm:px-4 py-2 rounded-sm border border-red-500/20">
                    Niveau d'accréditation insuffisant: {activeEmployee.role.toUpperCase()}
                </div>
            </div>
        );
    }

    useEffect(() => {
        if (restaurant?.id) {
            fetchEmployees();
        }
    }, [restaurant?.id]);

    const fetchEmployees = async () => {
        try {
            if (!restaurant?.id) return;

            const { data, error } = await supabase
                .from('employees')
                .select('*')
                .eq('restaurant_id', restaurant.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setEmployees(data || []);
        } catch (error) {
            console.error('Error fetching employees:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddEmployee = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || !restaurant?.id) return;

            const { error } = await supabase.from('employees').insert({
                restaurant_id: restaurant.id,
                manager_id: user.id,
                first_name: newEmployee.firstName,
                last_name: newEmployee.lastName,
                role: newEmployee.role,
                pin_code: newEmployee.pinCode
            });

            if (error) throw error;

            setShowAddModal(false);
            setNewEmployee({ firstName: '', lastName: '', role: 'staff', pinCode: '' });
            fetchEmployees();
        } catch (error) {
            console.error('Error adding employee:', error);
            alert('Erreur lors de l\'ajout.');
        }
    };

    const handleDeleteEmployee = async (id: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cet employé ?')) return;
        const { error } = await supabase.from('employees').delete().eq('id', id);
        if (!error) fetchEmployees();
    };

    const tabs = [
        { id: 'team', label: 'Équipe & Accès', icon: Users },
        { id: 'profile', label: 'Mon Profil', icon: User },
        { id: 'subscription', label: 'Abonnement', icon: CreditCard },
        { id: 'security', label: 'Sécurité', icon: Shield },
    ];

    const activeTabData = tabs.find(t => t.id === activeTab);

    return (
        <div className="max-w-6xl mx-auto">
            <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-white uppercase tracking-wider mb-4 sm:mb-6 md:mb-8">Paramètres</h1>

            <div className="grid grid-cols-12 gap-4 sm:gap-6 md:gap-8">
                {/* Mobile Tab Selector */}
                <div className="col-span-12 md:hidden">
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-sm text-white"
                    >
                        <div className="flex items-center gap-3">
                            {activeTabData && <activeTabData.icon className="h-4 w-4 text-[#00ff9d]" />}
                            <span className="text-sm font-bold uppercase tracking-wider">{activeTabData?.label}</span>
                        </div>
                        <ChevronDown className={`h-4 w-4 transition-transform ${mobileMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {mobileMenuOpen && (
                        <div className="mt-2 bg-[#0a0a0a] border border-white/10 rounded-sm overflow-hidden">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => {
                                        setActiveTab(tab.id);
                                        setMobileMenuOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === tab.id
                                        ? 'bg-white/5 text-[#00ff9d]'
                                        : 'text-slate-500 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <tab.icon className="h-4 w-4" />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Desktop Settings Navigation */}
                <div className="hidden md:block col-span-3">
                    <div className="bg-[#0a0a0a] border border-white/10 rounded-sm overflow-hidden">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-4 text-sm font-bold uppercase tracking-wider transition-colors border-l-2 ${activeTab === tab.id
                                    ? 'bg-white/5 text-[#00ff9d] border-[#00ff9d]'
                                    : 'text-slate-500 hover:text-white border-transparent hover:bg-white/5'
                                    }`}
                            >
                                <tab.icon className="h-4 w-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <div className="col-span-12 md:col-span-9">
                    {/* Team Tab */}
                    {activeTab === 'team' && (
                        <div className="bg-[#0a0a0a] border border-white/10 p-4 sm:p-6 md:p-8 rounded-sm">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
                                <div>
                                    <h2 className="font-display text-lg sm:text-xl text-white uppercase mb-1">Gestion d'Équipe</h2>
                                    <p className="text-slate-500 text-[10px] sm:text-xs font-mono">Gérez les accès et les codes PIN de votre personnel.</p>
                                </div>
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#00ff9d] hover:bg-white text-black px-4 py-2.5 rounded-sm transition-colors text-xs font-bold uppercase tracking-widest"
                                >
                                    <Plus className="h-4 w-4" /> Ajouter
                                </button>
                            </div>

                            {loading ? (
                                <div className="text-center py-8 sm:py-12 text-slate-500 font-mono animate-pulse text-sm">Chargement des données...</div>
                            ) : employees.length === 0 ? (
                                <div className="text-center py-8 sm:py-12 border border-dashed border-white/10 rounded-sm">
                                    <p className="text-slate-500 font-mono mb-4 text-xs sm:text-sm">Aucun employé configuré.</p>
                                </div>
                            ) : (
                                <div className="grid gap-3 sm:gap-4">
                                    {employees.map((emp) => (
                                        <div key={emp.id} className="flex items-center justify-between p-3 sm:p-4 bg-white/5 border border-white/5 rounded-sm hover:border-white/10 transition-colors">
                                            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                                                <div className={`h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center font-bold text-black uppercase text-xs sm:text-sm flex-shrink-0 ${emp.role === 'admin' ? 'bg-red-500' : emp.role === 'manager' ? 'bg-[#00ff9d]' : 'bg-slate-400'
                                                    }`}>
                                                    {emp.first_name[0]}{emp.last_name[0]}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-white font-bold text-xs sm:text-sm uppercase tracking-wide truncate">{emp.first_name} {emp.last_name}</p>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className={`text-[10px] uppercase font-mono px-1.5 sm:px-2 py-0.5 rounded-sm ${emp.role === 'admin' ? 'bg-red-500/20 text-red-500' : 'bg-slate-500/20 text-slate-400'
                                                            }`}>
                                                            {emp.role}
                                                        </span>
                                                        {emp.pin_code && (
                                                            <span className="hidden sm:flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                                                                <Key className="h-3 w-3" /> PIN
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteEmployee(emp.id)}
                                                className="text-slate-600 hover:text-red-500 transition-colors p-2 flex-shrink-0"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab !== 'team' && (
                        <div className="bg-[#0a0a0a] border border-white/10 p-8 sm:p-12 rounded-sm text-center">
                            <p className="text-slate-500 font-mono uppercase text-xs sm:text-sm">Module en cours de développement</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Employee Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-[#0a0a0a] border border-white/10 w-full sm:max-w-md p-6 sm:p-8 rounded-t-lg sm:rounded-sm shadow-2xl relative max-h-[90vh] overflow-y-auto">
                        <h3 className="font-display text-lg sm:text-xl text-white uppercase mb-4 sm:mb-6">Nouvel Employé</h3>

                        <form onSubmit={handleAddEmployee} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                <div>
                                    <label className="block text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Prénom</label>
                                    <input
                                        type="text"
                                        required
                                        value={newEmployee.firstName}
                                        onChange={(e) => setNewEmployee({ ...newEmployee, firstName: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 text-white px-3 sm:px-4 py-2.5 sm:py-2 focus:outline-none focus:border-[#00ff9d] transition-colors font-mono text-sm rounded-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Nom</label>
                                    <input
                                        type="text"
                                        required
                                        value={newEmployee.lastName}
                                        onChange={(e) => setNewEmployee({ ...newEmployee, lastName: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 text-white px-3 sm:px-4 py-2.5 sm:py-2 focus:outline-none focus:border-[#00ff9d] transition-colors font-mono text-sm rounded-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Rôle</label>
                                <select
                                    value={newEmployee.role}
                                    onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value })}
                                    className="w-full bg-[#050505] border border-white/10 text-white px-3 sm:px-4 py-2.5 sm:py-2 focus:outline-none focus:border-[#00ff9d] transition-colors font-mono text-sm uppercase rounded-sm"
                                >
                                    <option value="staff" className="bg-[#050505]">Équipier (Staff)</option>
                                    <option value="manager" className="bg-[#050505]">Manager</option>
                                    <option value="admin" className="bg-[#050505]">Admin</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 sm:mb-4 text-center">Code PIN (4 Chiffres)</label>
                                <div className="flex justify-center mb-2">
                                    <Digicode
                                        value={newEmployee.pinCode}
                                        onChange={(val) => setNewEmployee({ ...newEmployee, pinCode: val })}
                                        maxLength={4}
                                    />
                                </div>
                                <p className="text-[10px] text-slate-500 text-center">Requis pour la connexion simplifiée.</p>
                            </div>

                            <div className="flex gap-3 mt-6 sm:mt-8">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 bg-white/5 text-white font-bold uppercase tracking-widest py-3 hover:bg-white/10 transition-colors text-xs rounded-sm"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-[#00ff9d] text-black font-bold uppercase tracking-widest py-3 hover:bg-white transition-colors text-xs rounded-sm"
                                >
                                    Créer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
