"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Plus, Package, CheckCircle2, Clock, AlertTriangle,
    Trash2, Calendar, MapPin, ChevronDown, X,
    Archive, RefreshCw, ArrowRight, AlertOctagon
} from 'lucide-react';
import { format, differenceInDays, isAfter, isBefore, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useRestaurant } from '@/contexts/restaurant-context';
import { useEmployee } from '@/contexts/employee-context';

interface DLCProduct {
    id: string;
    product_name: string;
    preparation_date: string;
    dlc_date: string;
    storage_location: string | null;
    quantity: number;
    unit: string;
    status: 'active' | 'used' | 'discarded' | 'expired';
    notes: string | null;
    created_at: string;
}

type FilterType = 'all' | 'critical' | 'warning' | 'ok' | 'expired';

export default function TraceabilityPage() {
    const { restaurant } = useRestaurant();
    const { activeEmployee } = useEmployee();

    const [products, setProducts] = useState<DLCProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showActionModal, setShowActionModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<DLCProduct | null>(null);
    const [filter, setFilter] = useState<FilterType>('all');

    const [newProduct, setNewProduct] = useState({
        product_name: '',
        preparation_date: format(new Date(), 'yyyy-MM-dd'),
        dlc_date: '',
        storage_location: '',
        quantity: '1',
        unit: 'unité',
        notes: ''
    });

    const [actionData, setActionData] = useState({
        action_type: '' as 'used' | 'discarded' | 'extended' | 'moved' | '',
        reason: '',
        quantity_affected: '',
        new_dlc_date: '',
        new_location: ''
    });

    // Alert thresholds (in days)
    const WARNING_DAYS = 2;
    const CRITICAL_DAYS = 1;

    useEffect(() => {
        if (restaurant?.id) {
            fetchProducts();
        }
    }, [restaurant?.id]);

    const fetchProducts = async () => {
        try {
            if (!restaurant?.id) return;

            const { data, error } = await supabase
                .from('dlc_products')
                .select('*')
                .eq('restaurant_id', restaurant.id)
                .in('status', ['active', 'expired'])
                .order('dlc_date', { ascending: true });

            if (error) throw error;
            setProducts(data || []);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const getDLCStatus = (dlcDate: string): { status: 'ok' | 'warning' | 'critical' | 'expired'; daysLeft: number; label: string; color: string } => {
        const today = startOfDay(new Date());
        const dlc = startOfDay(new Date(dlcDate));
        const daysLeft = differenceInDays(dlc, today);

        if (daysLeft < 0) {
            return { status: 'expired', daysLeft, label: 'PÉRIMÉ', color: 'bg-black text-red-500 border-red-500' };
        }
        if (daysLeft <= CRITICAL_DAYS) {
            return { status: 'critical', daysLeft, label: 'CRITIQUE', color: 'bg-red-500/10 text-red-500 border-red-500/20' };
        }
        if (daysLeft <= WARNING_DAYS) {
            return { status: 'warning', daysLeft, label: 'SURVEILLER', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' };
        }
        return { status: 'ok', daysLeft, label: 'OK', color: 'bg-[#00ff9d]/10 text-[#00ff9d] border-[#00ff9d]/20' };
    };

    const handleAddProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!restaurant?.id) return;

            const { error } = await supabase.from('dlc_products').insert({
                restaurant_id: restaurant.id,
                employee_id: activeEmployee?.id || null,
                product_name: newProduct.product_name,
                preparation_date: newProduct.preparation_date,
                dlc_date: newProduct.dlc_date,
                storage_location: newProduct.storage_location || null,
                quantity: parseFloat(newProduct.quantity),
                unit: newProduct.unit,
                notes: newProduct.notes || null,
                status: 'active'
            });

            if (error) throw error;

            // Log the creation action
            // Note: We'd need to get the inserted ID to log, simplified here

            setShowModal(false);
            setNewProduct({
                product_name: '',
                preparation_date: format(new Date(), 'yyyy-MM-dd'),
                dlc_date: '',
                storage_location: '',
                quantity: '1',
                unit: 'unité',
                notes: ''
            });
            fetchProducts();
        } catch (error) {
            console.error('Error adding product:', error);
        }
    };

    const handleAction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProduct || !actionData.action_type) return;

        try {
            // Update product based on action
            let updateData: any = {};

            if (actionData.action_type === 'used' || actionData.action_type === 'discarded') {
                updateData.status = actionData.action_type;
                updateData.updated_at = new Date().toISOString();
            } else if (actionData.action_type === 'extended') {
                updateData.dlc_date = actionData.new_dlc_date;
                updateData.updated_at = new Date().toISOString();
            } else if (actionData.action_type === 'moved') {
                updateData.storage_location = actionData.new_location;
                updateData.updated_at = new Date().toISOString();
            }

            const { error: updateError } = await supabase
                .from('dlc_products')
                .update(updateData)
                .eq('id', selectedProduct.id);

            if (updateError) throw updateError;

            // Log the action
            const { error: actionError } = await supabase.from('dlc_actions').insert({
                product_id: selectedProduct.id,
                employee_id: activeEmployee?.id || null,
                action_type: actionData.action_type,
                reason: actionData.reason || null,
                quantity_affected: actionData.quantity_affected ? parseFloat(actionData.quantity_affected) : null,
                new_dlc_date: actionData.new_dlc_date || null,
                new_location: actionData.new_location || null
            });

            if (actionError) throw actionError;

            setShowActionModal(false);
            setSelectedProduct(null);
            setActionData({
                action_type: '',
                reason: '',
                quantity_affected: '',
                new_dlc_date: '',
                new_location: ''
            });
            fetchProducts();
        } catch (error) {
            console.error('Error performing action:', error);
        }
    };

    const openActionModal = (product: DLCProduct, action: 'used' | 'discarded' | 'extended' | 'moved') => {
        setSelectedProduct(product);
        setActionData({
            action_type: action,
            reason: '',
            quantity_affected: product.quantity.toString(),
            new_dlc_date: '',
            new_location: product.storage_location || ''
        });
        setShowActionModal(true);
    };

    // Filter products
    const filteredProducts = products.filter(p => {
        if (filter === 'all') return true;
        const { status } = getDLCStatus(p.dlc_date);
        return status === filter;
    });

    // Statistics
    const stats = {
        active: products.filter(p => p.status === 'active').length,
        critical: products.filter(p => getDLCStatus(p.dlc_date).status === 'critical').length,
        warning: products.filter(p => getDLCStatus(p.dlc_date).status === 'warning').length,
        expired: products.filter(p => getDLCStatus(p.dlc_date).status === 'expired').length
    };

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6 sm:mb-8">
                <div>
                    <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-white uppercase tracking-wider mb-1 sm:mb-2">
                        Traçabilité & DLC
                    </h1>
                    <p className="font-mono text-[10px] sm:text-xs text-slate-500">
                        Suivi des dates limites • FIFO
                    </p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#00ff9d] hover:bg-white text-black px-4 py-2.5 sm:py-3 rounded-sm transition-colors text-xs font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(0,255,157,0.3)]"
                >
                    <Plus className="h-4 w-4" /> Nouveau Produit
                </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-2 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
                <div className="bg-[#0a0a0a] border border-white/10 p-3 sm:p-4 md:p-6 rounded-sm">
                    <div className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1 sm:mb-2">Actifs</div>
                    <div className="text-xl sm:text-2xl md:text-3xl font-display text-white font-bold">{stats.active}</div>
                </div>
                <div className="bg-[#0a0a0a] border border-yellow-500/20 p-3 sm:p-4 md:p-6 rounded-sm">
                    <div className="text-yellow-500 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1 sm:mb-2 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Surveiller
                    </div>
                    <div className="text-xl sm:text-2xl md:text-3xl font-display text-yellow-500 font-bold">{stats.warning}</div>
                </div>
                <div className="bg-[#0a0a0a] border border-red-500/20 p-3 sm:p-4 md:p-6 rounded-sm">
                    <div className="text-red-500 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1 sm:mb-2 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Critiques
                    </div>
                    <div className="text-xl sm:text-2xl md:text-3xl font-display text-red-500 font-bold animate-pulse">{stats.critical}</div>
                </div>
                <div className="bg-[#0a0a0a] border border-red-500/50 p-3 sm:p-4 md:p-6 rounded-sm">
                    <div className="text-red-600 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1 sm:mb-2 flex items-center gap-1">
                        <AlertOctagon className="h-3 w-3" /> Périmés
                    </div>
                    <div className="text-xl sm:text-2xl md:text-3xl font-display text-red-600 font-bold">{stats.expired}</div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-4">
                {[
                    { key: 'all', label: 'Tous', count: products.length },
                    { key: 'critical', label: 'Critiques', count: stats.critical },
                    { key: 'warning', label: 'À surveiller', count: stats.warning },
                    { key: 'ok', label: 'OK', count: stats.active - stats.critical - stats.warning - stats.expired },
                    { key: 'expired', label: 'Périmés', count: stats.expired }
                ].map(f => (
                    <button
                        key={f.key}
                        onClick={() => setFilter(f.key as FilterType)}
                        className={`px-3 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-sm transition-all ${
                            filter === f.key
                                ? 'bg-[#00ff9d] text-black'
                                : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/10'
                        }`}
                    >
                        {f.label} ({f.count})
                    </button>
                ))}
            </div>

            {/* Products List */}
            <div className="space-y-3">
                {loading ? (
                    <div className="bg-[#0a0a0a] border border-white/10 p-8 rounded-sm text-center text-slate-500 uppercase font-mono animate-pulse">
                        Chargement...
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="bg-[#0a0a0a] border border-white/10 p-8 rounded-sm text-center text-slate-500 uppercase font-mono">
                        Aucun produit dans cette catégorie.
                    </div>
                ) : (
                    filteredProducts.map((product) => {
                        const dlcInfo = getDLCStatus(product.dlc_date);
                        return (
                            <div
                                key={product.id}
                                className={`bg-[#0a0a0a] border rounded-sm overflow-hidden ${
                                    dlcInfo.status === 'expired' ? 'border-red-500/50' :
                                    dlcInfo.status === 'critical' ? 'border-red-500/30' :
                                    dlcInfo.status === 'warning' ? 'border-yellow-500/30' :
                                    'border-white/10'
                                }`}
                            >
                                <div className="p-4">
                                    <div className="flex flex-col sm:flex-row justify-between gap-3">
                                        {/* Product Info */}
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between sm:justify-start gap-3 mb-2">
                                                <h3 className="text-base sm:text-lg font-bold text-white uppercase">
                                                    {product.product_name}
                                                </h3>
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase border ${dlcInfo.color}`}>
                                                    {dlcInfo.status === 'expired' && <AlertOctagon className="h-3 w-3" />}
                                                    {dlcInfo.status === 'critical' && <AlertTriangle className="h-3 w-3 animate-pulse" />}
                                                    {dlcInfo.status === 'warning' && <Clock className="h-3 w-3" />}
                                                    {dlcInfo.status === 'ok' && <CheckCircle2 className="h-3 w-3" />}
                                                    {dlcInfo.label}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-xs">
                                                <div>
                                                    <span className="text-slate-500 font-mono text-[10px] uppercase">DLC</span>
                                                    <div className={`font-bold font-mono ${
                                                        dlcInfo.status === 'expired' ? 'text-red-500' :
                                                        dlcInfo.status === 'critical' ? 'text-red-400' :
                                                        dlcInfo.status === 'warning' ? 'text-yellow-400' :
                                                        'text-white'
                                                    }`}>
                                                        {format(new Date(product.dlc_date), "dd/MM/yyyy")}
                                                    </div>
                                                    <div className="text-[10px] text-slate-600 font-mono">
                                                        {dlcInfo.daysLeft === 0 ? "Aujourd'hui" :
                                                         dlcInfo.daysLeft < 0 ? `${Math.abs(dlcInfo.daysLeft)}j dépassé` :
                                                         `${dlcInfo.daysLeft}j restant${dlcInfo.daysLeft > 1 ? 's' : ''}`}
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className="text-slate-500 font-mono text-[10px] uppercase">Quantité</span>
                                                    <div className="font-bold text-white font-mono">
                                                        {product.quantity} {product.unit}
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className="text-slate-500 font-mono text-[10px] uppercase">Préparé le</span>
                                                    <div className="font-mono text-slate-300">
                                                        {format(new Date(product.preparation_date), "dd/MM/yy")}
                                                    </div>
                                                </div>
                                                {product.storage_location && (
                                                    <div>
                                                        <span className="text-slate-500 font-mono text-[10px] uppercase">Stockage</span>
                                                        <div className="text-slate-300 flex items-center gap-1">
                                                            <MapPin className="h-3 w-3" />
                                                            {product.storage_location}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex sm:flex-col gap-2 sm:gap-1">
                                            <button
                                                onClick={() => openActionModal(product, 'used')}
                                                className="flex-1 sm:flex-none flex items-center justify-center gap-1 bg-[#00ff9d]/10 hover:bg-[#00ff9d]/20 text-[#00ff9d] px-3 py-2 sm:py-1.5 rounded-sm transition-colors text-[10px] font-bold uppercase border border-[#00ff9d]/20"
                                            >
                                                <CheckCircle2 className="h-3 w-3" /> Utilisé
                                            </button>
                                            <button
                                                onClick={() => openActionModal(product, 'discarded')}
                                                className="flex-1 sm:flex-none flex items-center justify-center gap-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 px-3 py-2 sm:py-1.5 rounded-sm transition-colors text-[10px] font-bold uppercase border border-red-500/20"
                                            >
                                                <Trash2 className="h-3 w-3" /> Jeté
                                            </button>
                                            <button
                                                onClick={() => openActionModal(product, 'extended')}
                                                className="flex-1 sm:flex-none flex items-center justify-center gap-1 bg-white/5 hover:bg-white/10 text-slate-400 px-3 py-2 sm:py-1.5 rounded-sm transition-colors text-[10px] font-bold uppercase border border-white/10"
                                            >
                                                <RefreshCw className="h-3 w-3" /> Prolonger
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Add Product Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-[#0a0a0a] border border-white/10 w-full sm:max-w-md p-6 sm:p-8 rounded-t-lg sm:rounded-sm shadow-2xl relative max-h-[90vh] overflow-y-auto">
                        <h3 className="font-display text-lg sm:text-xl text-white uppercase mb-4 sm:mb-6 flex items-center gap-2">
                            <Package className="h-5 w-5 text-[#00ff9d]" />
                            Nouveau Produit
                        </h3>

                        <form onSubmit={handleAddProduct} className="space-y-4">
                            <div>
                                <label className="block text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Nom du produit *</label>
                                <input
                                    type="text"
                                    required
                                    value={newProduct.product_name}
                                    onChange={(e) => setNewProduct({ ...newProduct, product_name: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-[#00ff9d] transition-colors font-mono text-sm rounded-sm"
                                    placeholder="Ex: Sauce tomate maison"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Date préparation</label>
                                    <input
                                        type="date"
                                        value={newProduct.preparation_date}
                                        onChange={(e) => setNewProduct({ ...newProduct, preparation_date: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 text-white px-3 py-2.5 focus:outline-none focus:border-[#00ff9d] transition-colors font-mono text-sm rounded-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">DLC *</label>
                                    <input
                                        type="date"
                                        required
                                        value={newProduct.dlc_date}
                                        onChange={(e) => setNewProduct({ ...newProduct, dlc_date: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 text-white px-3 py-2.5 focus:outline-none focus:border-[#00ff9d] transition-colors font-mono text-sm rounded-sm"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="col-span-2">
                                    <label className="block text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Quantité</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={newProduct.quantity}
                                        onChange={(e) => setNewProduct({ ...newProduct, quantity: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 text-white px-3 py-2.5 focus:outline-none focus:border-[#00ff9d] transition-colors font-mono text-sm rounded-sm"
                                        placeholder="1"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Unité</label>
                                    <select
                                        value={newProduct.unit}
                                        onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                                        className="w-full bg-[#050505] border border-white/10 text-white px-2 py-2.5 focus:outline-none focus:border-[#00ff9d] transition-colors font-mono text-sm rounded-sm"
                                    >
                                        <option value="unité">unité</option>
                                        <option value="kg">kg</option>
                                        <option value="g">g</option>
                                        <option value="L">L</option>
                                        <option value="portion">portion</option>
                                        <option value="barquette">barquette</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Lieu de stockage</label>
                                <input
                                    type="text"
                                    value={newProduct.storage_location}
                                    onChange={(e) => setNewProduct({ ...newProduct, storage_location: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-[#00ff9d] transition-colors font-mono text-sm rounded-sm"
                                    placeholder="Chambre froide, Étagère 2..."
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Notes</label>
                                <textarea
                                    value={newProduct.notes}
                                    onChange={(e) => setNewProduct({ ...newProduct, notes: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-[#00ff9d] transition-colors font-mono text-sm h-16 resize-none rounded-sm"
                                    placeholder="Observations..."
                                />
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 bg-white/5 text-white font-bold uppercase tracking-widest py-3 hover:bg-white/10 transition-colors text-xs rounded-sm"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-[#00ff9d] text-black font-bold uppercase tracking-widest py-3 hover:bg-white transition-colors text-xs rounded-sm"
                                >
                                    Enregistrer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Action Modal */}
            {showActionModal && selectedProduct && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-[#0a0a0a] border border-white/10 w-full sm:max-w-md p-6 sm:p-8 rounded-t-lg sm:rounded-sm shadow-2xl relative max-h-[90vh] overflow-y-auto">
                        <h3 className="font-display text-lg sm:text-xl text-white uppercase mb-2 flex items-center gap-2">
                            {actionData.action_type === 'used' && <CheckCircle2 className="h-5 w-5 text-[#00ff9d]" />}
                            {actionData.action_type === 'discarded' && <Trash2 className="h-5 w-5 text-red-500" />}
                            {actionData.action_type === 'extended' && <RefreshCw className="h-5 w-5 text-yellow-500" />}
                            {actionData.action_type === 'moved' && <ArrowRight className="h-5 w-5 text-blue-500" />}
                            {actionData.action_type === 'used' && 'Marquer comme utilisé'}
                            {actionData.action_type === 'discarded' && 'Marquer comme jeté'}
                            {actionData.action_type === 'extended' && 'Prolonger la DLC'}
                            {actionData.action_type === 'moved' && 'Déplacer'}
                        </h3>
                        <p className="text-sm text-slate-400 mb-6">{selectedProduct.product_name}</p>

                        <form onSubmit={handleAction} className="space-y-4">
                            {(actionData.action_type === 'used' || actionData.action_type === 'discarded') && (
                                <>
                                    <div>
                                        <label className="block text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                                            Raison {actionData.action_type === 'discarded' && '*'}
                                        </label>
                                        <select
                                            required={actionData.action_type === 'discarded'}
                                            value={actionData.reason}
                                            onChange={(e) => setActionData({ ...actionData, reason: e.target.value })}
                                            className="w-full bg-[#050505] border border-white/10 text-white px-3 py-2.5 focus:outline-none focus:border-[#00ff9d] transition-colors font-mono text-sm rounded-sm"
                                        >
                                            <option value="">Sélectionner...</option>
                                            {actionData.action_type === 'used' ? (
                                                <>
                                                    <option value="cuisine">Utilisé en cuisine</option>
                                                    <option value="service">Servi au client</option>
                                                    <option value="preparation">Préparation</option>
                                                </>
                                            ) : (
                                                <>
                                                    <option value="dlc_depassee">DLC dépassée</option>
                                                    <option value="qualite">Problème de qualité</option>
                                                    <option value="endommage">Produit endommagé</option>
                                                    <option value="contamination">Risque contamination</option>
                                                    <option value="autre">Autre</option>
                                                </>
                                            )}
                                        </select>
                                    </div>
                                </>
                            )}

                            {actionData.action_type === 'extended' && (
                                <div>
                                    <label className="block text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Nouvelle DLC *</label>
                                    <input
                                        type="date"
                                        required
                                        value={actionData.new_dlc_date}
                                        onChange={(e) => setActionData({ ...actionData, new_dlc_date: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 text-white px-3 py-2.5 focus:outline-none focus:border-[#00ff9d] transition-colors font-mono text-sm rounded-sm"
                                    />
                                    <p className="text-[10px] text-yellow-500 mt-2 font-mono">
                                        <AlertTriangle className="h-3 w-3 inline mr-1" />
                                        Attention: La prolongation de DLC doit être justifiée
                                    </p>
                                </div>
                            )}

                            {actionData.action_type === 'moved' && (
                                <div>
                                    <label className="block text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Nouveau lieu de stockage *</label>
                                    <input
                                        type="text"
                                        required
                                        value={actionData.new_location}
                                        onChange={(e) => setActionData({ ...actionData, new_location: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 text-white px-3 py-2.5 focus:outline-none focus:border-[#00ff9d] transition-colors font-mono text-sm rounded-sm"
                                        placeholder="Nouveau emplacement..."
                                    />
                                </div>
                            )}

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowActionModal(false);
                                        setSelectedProduct(null);
                                    }}
                                    className="flex-1 bg-white/5 text-white font-bold uppercase tracking-widest py-3 hover:bg-white/10 transition-colors text-xs rounded-sm"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className={`flex-1 font-bold uppercase tracking-widest py-3 transition-colors text-xs rounded-sm ${
                                        actionData.action_type === 'discarded'
                                            ? 'bg-red-500 hover:bg-red-400 text-white'
                                            : 'bg-[#00ff9d] hover:bg-white text-black'
                                    }`}
                                >
                                    Confirmer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
