"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Shield, Plus, Trash2, Thermometer, Truck, SprayCan, Edit2, Check, X, Settings2, ChevronRight } from 'lucide-react';
import { useEmployee } from '@/contexts/employee-context';
import { useRestaurant } from '@/contexts/restaurant-context';

interface TemperatureType {
    id: string;
    name: string;
    min_temp: number;
    max_temp: number;
}

interface TemperatureZone {
    id: string;
    type_id: string;
    name: string;
    temperature_types?: { name: string; min_temp: number; max_temp: number };
}

interface Supplier {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
}

interface SupplierProduct {
    id: string;
    supplier_id: string;
    name: string;
}

interface CleaningArea {
    id: string;
    name: string;
    is_active: boolean;
}

interface CleaningPost {
    id: string;
    area_id: string;
    name: string;
    cleaning_frequency: 'daily' | 'weekly' | 'monthly' | 'on_demand';
    is_active: boolean;
    cleaning_areas?: { name: string };
}

const FREQUENCY_OPTIONS = [
    { value: 'daily', label: 'Quotidien' },
    { value: 'weekly', label: 'Hebdomadaire' },
    { value: 'monthly', label: 'Mensuel' },
    { value: 'on_demand', label: 'Sur demande' }
];

export default function ManagePage() {
    const { activeEmployee } = useEmployee();
    const { restaurant } = useRestaurant();

    // Section toggle
    const [activeSection, setActiveSection] = useState<'temperatures' | 'reception' | 'cleaning'>('temperatures');

    // Selected category/type
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
    const [selectedArea, setSelectedArea] = useState<string | null>(null);

    // Data states
    const [temperatureTypes, setTemperatureTypes] = useState<TemperatureType[]>([]);
    const [temperatureZones, setTemperatureZones] = useState<TemperatureZone[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [products, setProducts] = useState<SupplierProduct[]>([]);
    const [cleaningAreas, setCleaningAreas] = useState<CleaningArea[]>([]);
    const [cleaningPosts, setCleaningPosts] = useState<CleaningPost[]>([]);
    const [loading, setLoading] = useState(true);

    // Edit states
    const [editingType, setEditingType] = useState<string | null>(null);
    const [editingZone, setEditingZone] = useState<string | null>(null);
    const [editingSupplier, setEditingSupplier] = useState<string | null>(null);
    const [editingProduct, setEditingProduct] = useState<string | null>(null);
    const [editingArea, setEditingArea] = useState<string | null>(null);
    const [editingPost, setEditingPost] = useState<string | null>(null);

    // New item states
    const [newType, setNewType] = useState({ name: '', min_temp: '', max_temp: '' });
    const [newZone, setNewZone] = useState({ name: '' });
    const [newSupplier, setNewSupplier] = useState({ name: '', phone: '', email: '' });
    const [newProduct, setNewProduct] = useState({ name: '' });
    const [newArea, setNewArea] = useState({ name: '' });
    const [newPost, setNewPost] = useState({ name: '', cleaning_frequency: 'daily' });

    // Temp edit values
    const [editValues, setEditValues] = useState<any>({});

    // Adding mode
    const [isAddingType, setIsAddingType] = useState(false);
    const [isAddingSupplier, setIsAddingSupplier] = useState(false);
    const [isAddingArea, setIsAddingArea] = useState(false);

    const normalizedRole = activeEmployee?.role?.toLowerCase().trim();

    // Access control - only managers and admins
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
            fetchData();
        }
    }, [restaurant?.id]);

    // Auto-select first item when data loads or section changes
    useEffect(() => {
        if (activeSection === 'temperatures' && temperatureTypes.length > 0 && !selectedType) {
            setSelectedType(temperatureTypes[0].id);
        }
        if (activeSection === 'reception' && suppliers.length > 0 && !selectedSupplier) {
            setSelectedSupplier(suppliers[0].id);
        }
        if (activeSection === 'cleaning' && cleaningAreas.length > 0 && !selectedArea) {
            setSelectedArea(cleaningAreas[0].id);
        }
    }, [activeSection, temperatureTypes, suppliers, cleaningAreas]);

    const fetchData = async () => {
        try {
            if (!restaurant?.id) return;
            setLoading(true);

            const [typesRes, zonesRes, suppliersRes, productsRes, areasRes, postsRes] = await Promise.all([
                supabase.from('temperature_types').select('*').eq('restaurant_id', restaurant.id).order('name'),
                supabase.from('temperature_zones').select('*, temperature_types(name, min_temp, max_temp)').eq('restaurant_id', restaurant.id).order('name'),
                supabase.from('suppliers').select('*').eq('restaurant_id', restaurant.id).order('name'),
                supabase.from('supplier_products').select('*').eq('restaurant_id', restaurant.id).order('name'),
                supabase.from('cleaning_areas').select('*').eq('restaurant_id', restaurant.id).order('name'),
                supabase.from('cleaning_posts').select('*, cleaning_areas(name)').eq('restaurant_id', restaurant.id).order('name')
            ]);

            if (typesRes.data) setTemperatureTypes(typesRes.data);
            if (zonesRes.data) setTemperatureZones(zonesRes.data);
            if (suppliersRes.data) setSuppliers(suppliersRes.data);
            if (productsRes.data) setProducts(productsRes.data);
            if (areasRes.data) setCleaningAreas(areasRes.data);
            if (postsRes.data) setCleaningPosts(postsRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Temperature Type CRUD
    const handleAddType = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!restaurant?.id) return;
        const { data, error } = await supabase.from('temperature_types').insert({
            restaurant_id: restaurant.id,
            name: newType.name,
            min_temp: parseFloat(newType.min_temp),
            max_temp: parseFloat(newType.max_temp)
        }).select().single();
        if (!error && data) {
            setNewType({ name: '', min_temp: '', max_temp: '' });
            setIsAddingType(false);
            fetchData();
            setSelectedType(data.id);
        }
    };

    const handleUpdateType = async (id: string) => {
        const { error } = await supabase.from('temperature_types').update({
            name: editValues.name,
            min_temp: parseFloat(editValues.min_temp),
            max_temp: parseFloat(editValues.max_temp)
        }).eq('id', id);
        if (!error) {
            setEditingType(null);
            fetchData();
        }
    };

    const handleDeleteType = async (id: string) => {
        if (!confirm('Supprimer ce type et toutes ses zones ?')) return;
        const { error } = await supabase.from('temperature_types').delete().eq('id', id);
        if (!error) {
            if (selectedType === id) setSelectedType(null);
            fetchData();
        }
    };

    // Temperature Zone CRUD
    const handleAddZone = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!restaurant?.id || !selectedType) return;
        const { error } = await supabase.from('temperature_zones').insert({
            restaurant_id: restaurant.id,
            type_id: selectedType,
            name: newZone.name
        });
        if (!error) {
            setNewZone({ name: '' });
            fetchData();
        }
    };

    const handleUpdateZone = async (id: string) => {
        const { error } = await supabase.from('temperature_zones').update({
            name: editValues.name
        }).eq('id', id);
        if (!error) {
            setEditingZone(null);
            fetchData();
        }
    };

    const handleDeleteZone = async (id: string) => {
        if (!confirm('Supprimer cette zone ?')) return;
        const { error } = await supabase.from('temperature_zones').delete().eq('id', id);
        if (!error) fetchData();
    };

    // Supplier CRUD
    const handleAddSupplier = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!restaurant?.id) return;
        const { data, error } = await supabase.from('suppliers').insert({
            restaurant_id: restaurant.id,
            name: newSupplier.name,
            phone: newSupplier.phone || null,
            email: newSupplier.email || null
        }).select().single();
        if (!error && data) {
            setNewSupplier({ name: '', phone: '', email: '' });
            setIsAddingSupplier(false);
            fetchData();
            setSelectedSupplier(data.id);
        }
    };

    const handleUpdateSupplier = async (id: string) => {
        const { error } = await supabase.from('suppliers').update({
            name: editValues.name,
            phone: editValues.phone || null,
            email: editValues.email || null
        }).eq('id', id);
        if (!error) {
            setEditingSupplier(null);
            fetchData();
        }
    };

    const handleDeleteSupplier = async (id: string) => {
        if (!confirm('Supprimer ce fournisseur et tous ses produits ?')) return;
        const { error } = await supabase.from('suppliers').delete().eq('id', id);
        if (!error) {
            if (selectedSupplier === id) setSelectedSupplier(null);
            fetchData();
        }
    };

    // Product CRUD
    const handleAddProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!restaurant?.id || !selectedSupplier) return;
        const { error } = await supabase.from('supplier_products').insert({
            restaurant_id: restaurant.id,
            supplier_id: selectedSupplier,
            name: newProduct.name
        });
        if (!error) {
            setNewProduct({ name: '' });
            fetchData();
        }
    };

    const handleUpdateProduct = async (id: string) => {
        const { error } = await supabase.from('supplier_products').update({
            name: editValues.name
        }).eq('id', id);
        if (!error) {
            setEditingProduct(null);
            fetchData();
        }
    };

    const handleDeleteProduct = async (id: string) => {
        if (!confirm('Supprimer ce produit ?')) return;
        const { error } = await supabase.from('supplier_products').delete().eq('id', id);
        if (!error) fetchData();
    };

    // Cleaning Area CRUD
    const handleAddArea = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!restaurant?.id) return;
        const { data, error } = await supabase.from('cleaning_areas').insert({
            restaurant_id: restaurant.id,
            name: newArea.name
        }).select().single();
        if (!error && data) {
            setNewArea({ name: '' });
            setIsAddingArea(false);
            fetchData();
            setSelectedArea(data.id);
        }
    };

    const handleUpdateArea = async (id: string) => {
        const { error } = await supabase.from('cleaning_areas').update({
            name: editValues.name
        }).eq('id', id);
        if (!error) {
            setEditingArea(null);
            fetchData();
        }
    };

    const handleDeleteArea = async (id: string) => {
        if (!confirm('Supprimer cette zone et tous ses postes ?')) return;
        const { error } = await supabase.from('cleaning_areas').delete().eq('id', id);
        if (!error) {
            if (selectedArea === id) setSelectedArea(null);
            fetchData();
        }
    };

    // Cleaning Post CRUD
    const handleAddPost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!restaurant?.id || !selectedArea) return;
        const { error } = await supabase.from('cleaning_posts').insert({
            restaurant_id: restaurant.id,
            area_id: selectedArea,
            name: newPost.name,
            cleaning_frequency: newPost.cleaning_frequency
        });
        if (!error) {
            setNewPost({ name: '', cleaning_frequency: 'daily' });
            fetchData();
        }
    };

    const handleUpdatePost = async (id: string) => {
        const { error } = await supabase.from('cleaning_posts').update({
            name: editValues.name,
            cleaning_frequency: editValues.cleaning_frequency
        }).eq('id', id);
        if (!error) {
            setEditingPost(null);
            fetchData();
        }
    };

    const handleDeletePost = async (id: string) => {
        if (!confirm('Supprimer ce poste ?')) return;
        const { error } = await supabase.from('cleaning_posts').delete().eq('id', id);
        if (!error) fetchData();
    };

    const startEditing = (type: string, item: any) => {
        setEditValues({ ...item });
        if (type === 'type') setEditingType(item.id);
        if (type === 'zone') setEditingZone(item.id);
        if (type === 'supplier') setEditingSupplier(item.id);
        if (type === 'product') setEditingProduct(item.id);
        if (type === 'area') setEditingArea(item.id);
        if (type === 'post') setEditingPost(item.id);
    };

    // Get filtered items for right panel
    const filteredZones = temperatureZones.filter(z => z.type_id === selectedType);
    const filteredProducts = products.filter(p => p.supplier_id === selectedSupplier);
    const filteredPosts = cleaningPosts.filter(p => p.area_id === selectedArea);

    // Get selected items
    const selectedTypeData = temperatureTypes.find(t => t.id === selectedType);
    const selectedSupplierData = suppliers.find(s => s.id === selectedSupplier);
    const selectedAreaData = cleaningAreas.find(a => a.id === selectedArea);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-slate-500 font-mono animate-pulse">Chargement...</div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-white uppercase tracking-wider flex items-center gap-3">
                        <Settings2 className="h-6 w-6 sm:h-8 sm:w-8 text-[#00ff9d]" />
                        Gérer
                    </h1>
                    <p className="text-slate-500 text-xs font-mono mt-1">Sélectionnez une catégorie à gauche pour voir ses éléments</p>
                </div>
            </div>

            {/* Section Selector */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                <button
                    onClick={() => { setActiveSection('temperatures'); setSelectedType(temperatureTypes[0]?.id || null); }}
                    className={`flex-shrink-0 flex items-center justify-center gap-2 px-4 py-3 rounded-sm font-bold uppercase text-xs tracking-widest transition-all ${
                        activeSection === 'temperatures'
                            ? 'bg-[#00ff9d] text-black shadow-[0_0_20px_rgba(0,255,157,0.3)]'
                            : 'bg-[#0a0a0a] border border-white/10 text-slate-400 hover:text-white'
                    }`}
                >
                    <Thermometer className="h-4 w-4" /> Températures
                </button>
                <button
                    onClick={() => { setActiveSection('reception'); setSelectedSupplier(suppliers[0]?.id || null); }}
                    className={`flex-shrink-0 flex items-center justify-center gap-2 px-4 py-3 rounded-sm font-bold uppercase text-xs tracking-widest transition-all ${
                        activeSection === 'reception'
                            ? 'bg-[#00ff9d] text-black shadow-[0_0_20px_rgba(0,255,157,0.3)]'
                            : 'bg-[#0a0a0a] border border-white/10 text-slate-400 hover:text-white'
                    }`}
                >
                    <Truck className="h-4 w-4" /> Réception
                </button>
                <button
                    onClick={() => { setActiveSection('cleaning'); setSelectedArea(cleaningAreas[0]?.id || null); }}
                    className={`flex-shrink-0 flex items-center justify-center gap-2 px-4 py-3 rounded-sm font-bold uppercase text-xs tracking-widest transition-all ${
                        activeSection === 'cleaning'
                            ? 'bg-[#00ff9d] text-black shadow-[0_0_20px_rgba(0,255,157,0.3)]'
                            : 'bg-[#0a0a0a] border border-white/10 text-slate-400 hover:text-white'
                    }`}
                >
                    <SprayCan className="h-4 w-4" /> Nettoyage
                </button>
            </div>

            {/* Main Content - Split View */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* LEFT PANEL - Categories/Types */}
                <div className="bg-[#0a0a0a] border border-white/10 rounded-sm overflow-hidden">
                    <div className="p-4 border-b border-white/10 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                            {activeSection === 'temperatures' && <><Thermometer className="h-4 w-4 text-[#00ff9d]" /> Types</>}
                            {activeSection === 'reception' && <><Truck className="h-4 w-4 text-[#00ff9d]" /> Fournisseurs</>}
                            {activeSection === 'cleaning' && <><SprayCan className="h-4 w-4 text-[#00ff9d]" /> Zones</>}
                        </h3>
                        <button
                            onClick={() => {
                                if (activeSection === 'temperatures') setIsAddingType(true);
                                if (activeSection === 'reception') setIsAddingSupplier(true);
                                if (activeSection === 'cleaning') setIsAddingArea(true);
                            }}
                            className="p-2 bg-[#00ff9d] text-black rounded-sm hover:bg-white transition-colors"
                        >
                            <Plus className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="max-h-[500px] overflow-y-auto">
                        {/* Add New Type Form */}
                        {activeSection === 'temperatures' && isAddingType && (
                            <form onSubmit={handleAddType} className="p-3 bg-[#00ff9d]/10 border-b border-[#00ff9d]/30">
                                <input
                                    type="text"
                                    required
                                    autoFocus
                                    value={newType.name}
                                    onChange={(e) => setNewType({ ...newType, name: e.target.value })}
                                    className="w-full bg-black border border-[#00ff9d] text-white px-3 py-2 text-sm font-mono rounded-sm mb-2"
                                    placeholder="Nom du type"
                                />
                                <div className="flex gap-2 mb-2">
                                    <input
                                        type="number"
                                        step="0.1"
                                        required
                                        value={newType.min_temp}
                                        onChange={(e) => setNewType({ ...newType, min_temp: e.target.value })}
                                        className="flex-1 bg-black border border-[#00ff9d] text-white px-3 py-2 text-sm font-mono rounded-sm"
                                        placeholder="Min °C"
                                    />
                                    <input
                                        type="number"
                                        step="0.1"
                                        required
                                        value={newType.max_temp}
                                        onChange={(e) => setNewType({ ...newType, max_temp: e.target.value })}
                                        className="flex-1 bg-black border border-[#00ff9d] text-white px-3 py-2 text-sm font-mono rounded-sm"
                                        placeholder="Max °C"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button type="submit" className="flex-1 bg-[#00ff9d] text-black py-2 rounded-sm text-xs font-bold uppercase">Ajouter</button>
                                    <button type="button" onClick={() => setIsAddingType(false)} className="px-4 py-2 text-slate-400 hover:text-white"><X className="h-4 w-4" /></button>
                                </div>
                            </form>
                        )}

                        {/* Add New Supplier Form */}
                        {activeSection === 'reception' && isAddingSupplier && (
                            <form onSubmit={handleAddSupplier} className="p-3 bg-[#00ff9d]/10 border-b border-[#00ff9d]/30">
                                <input
                                    type="text"
                                    required
                                    autoFocus
                                    value={newSupplier.name}
                                    onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                                    className="w-full bg-black border border-[#00ff9d] text-white px-3 py-2 text-sm font-mono rounded-sm mb-2"
                                    placeholder="Nom du fournisseur"
                                />
                                <input
                                    type="text"
                                    value={newSupplier.phone}
                                    onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                                    className="w-full bg-black border border-[#00ff9d] text-white px-3 py-2 text-sm font-mono rounded-sm mb-2"
                                    placeholder="Téléphone (optionnel)"
                                />
                                <div className="flex gap-2">
                                    <button type="submit" className="flex-1 bg-[#00ff9d] text-black py-2 rounded-sm text-xs font-bold uppercase">Ajouter</button>
                                    <button type="button" onClick={() => setIsAddingSupplier(false)} className="px-4 py-2 text-slate-400 hover:text-white"><X className="h-4 w-4" /></button>
                                </div>
                            </form>
                        )}

                        {/* Add New Area Form */}
                        {activeSection === 'cleaning' && isAddingArea && (
                            <form onSubmit={handleAddArea} className="p-3 bg-[#00ff9d]/10 border-b border-[#00ff9d]/30">
                                <input
                                    type="text"
                                    required
                                    autoFocus
                                    value={newArea.name}
                                    onChange={(e) => setNewArea({ name: e.target.value })}
                                    className="w-full bg-black border border-[#00ff9d] text-white px-3 py-2 text-sm font-mono rounded-sm mb-2"
                                    placeholder="Nom de la zone"
                                />
                                <div className="flex gap-2">
                                    <button type="submit" className="flex-1 bg-[#00ff9d] text-black py-2 rounded-sm text-xs font-bold uppercase">Ajouter</button>
                                    <button type="button" onClick={() => setIsAddingArea(false)} className="px-4 py-2 text-slate-400 hover:text-white"><X className="h-4 w-4" /></button>
                                </div>
                            </form>
                        )}

                        {/* Temperature Types List */}
                        {activeSection === 'temperatures' && (
                            temperatureTypes.length === 0 ? (
                                <p className="text-slate-500 text-xs font-mono text-center py-8">Aucun type configuré</p>
                            ) : temperatureTypes.map(type => (
                                <div
                                    key={type.id}
                                    onClick={() => setSelectedType(type.id)}
                                    className={`flex items-center gap-3 p-4 cursor-pointer border-b border-white/5 transition-all group ${
                                        selectedType === type.id ? 'bg-[#00ff9d]/10 border-l-2 border-l-[#00ff9d]' : 'hover:bg-white/5'
                                    }`}
                                >
                                    {editingType === type.id ? (
                                        <div className="flex-1 flex flex-col gap-2" onClick={e => e.stopPropagation()}>
                                            <input type="text" value={editValues.name} onChange={(e) => setEditValues({ ...editValues, name: e.target.value })} className="w-full bg-black border border-[#00ff9d] text-white px-2 py-1 text-sm font-mono rounded-sm" />
                                            <div className="flex gap-2">
                                                <input type="number" step="0.1" value={editValues.min_temp} onChange={(e) => setEditValues({ ...editValues, min_temp: e.target.value })} className="w-20 bg-black border border-[#00ff9d] text-white px-2 py-1 text-xs font-mono rounded-sm" placeholder="Min" />
                                                <input type="number" step="0.1" value={editValues.max_temp} onChange={(e) => setEditValues({ ...editValues, max_temp: e.target.value })} className="w-20 bg-black border border-[#00ff9d] text-white px-2 py-1 text-xs font-mono rounded-sm" placeholder="Max" />
                                                <button onClick={() => handleUpdateType(type.id)} className="p-1 text-[#00ff9d]"><Check className="h-4 w-4" /></button>
                                                <button onClick={() => setEditingType(null)} className="p-1 text-red-500"><X className="h-4 w-4" /></button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex-1">
                                                <span className="text-white text-sm font-medium block">{type.name}</span>
                                                <span className="text-xs font-mono text-slate-500">{type.min_temp}°C — {type.max_temp}°C</span>
                                            </div>
                                            <span className="text-[10px] font-mono text-slate-600 bg-white/5 px-2 py-1 rounded-sm">
                                                {temperatureZones.filter(z => z.type_id === type.id).length} zones
                                            </span>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                                                <button onClick={() => startEditing('type', type)} className="p-1 text-slate-500 hover:text-white"><Edit2 className="h-3 w-3" /></button>
                                                <button onClick={() => handleDeleteType(type.id)} className="p-1 text-slate-500 hover:text-red-500"><Trash2 className="h-3 w-3" /></button>
                                            </div>
                                            <ChevronRight className={`h-4 w-4 transition-colors ${selectedType === type.id ? 'text-[#00ff9d]' : 'text-slate-600'}`} />
                                        </>
                                    )}
                                </div>
                            ))
                        )}

                        {/* Suppliers List */}
                        {activeSection === 'reception' && (
                            suppliers.length === 0 ? (
                                <p className="text-slate-500 text-xs font-mono text-center py-8">Aucun fournisseur configuré</p>
                            ) : suppliers.map(supplier => (
                                <div
                                    key={supplier.id}
                                    onClick={() => setSelectedSupplier(supplier.id)}
                                    className={`flex items-center gap-3 p-4 cursor-pointer border-b border-white/5 transition-all group ${
                                        selectedSupplier === supplier.id ? 'bg-[#00ff9d]/10 border-l-2 border-l-[#00ff9d]' : 'hover:bg-white/5'
                                    }`}
                                >
                                    {editingSupplier === supplier.id ? (
                                        <div className="flex-1 flex flex-col gap-2" onClick={e => e.stopPropagation()}>
                                            <input type="text" value={editValues.name} onChange={(e) => setEditValues({ ...editValues, name: e.target.value })} className="w-full bg-black border border-[#00ff9d] text-white px-2 py-1 text-sm font-mono rounded-sm" />
                                            <input type="text" value={editValues.phone || ''} onChange={(e) => setEditValues({ ...editValues, phone: e.target.value })} className="w-full bg-black border border-[#00ff9d] text-white px-2 py-1 text-xs font-mono rounded-sm" placeholder="Téléphone" />
                                            <div className="flex gap-2">
                                                <button onClick={() => handleUpdateSupplier(supplier.id)} className="p-1 text-[#00ff9d]"><Check className="h-4 w-4" /></button>
                                                <button onClick={() => setEditingSupplier(null)} className="p-1 text-red-500"><X className="h-4 w-4" /></button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex-1">
                                                <span className="text-white text-sm font-medium block">{supplier.name}</span>
                                                {supplier.phone && <span className="text-xs font-mono text-slate-500">{supplier.phone}</span>}
                                            </div>
                                            <span className="text-[10px] font-mono text-slate-600 bg-white/5 px-2 py-1 rounded-sm">
                                                {products.filter(p => p.supplier_id === supplier.id).length} produits
                                            </span>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                                                <button onClick={() => startEditing('supplier', supplier)} className="p-1 text-slate-500 hover:text-white"><Edit2 className="h-3 w-3" /></button>
                                                <button onClick={() => handleDeleteSupplier(supplier.id)} className="p-1 text-slate-500 hover:text-red-500"><Trash2 className="h-3 w-3" /></button>
                                            </div>
                                            <ChevronRight className={`h-4 w-4 transition-colors ${selectedSupplier === supplier.id ? 'text-[#00ff9d]' : 'text-slate-600'}`} />
                                        </>
                                    )}
                                </div>
                            ))
                        )}

                        {/* Cleaning Areas List */}
                        {activeSection === 'cleaning' && (
                            cleaningAreas.length === 0 ? (
                                <p className="text-slate-500 text-xs font-mono text-center py-8">Aucune zone configurée</p>
                            ) : cleaningAreas.map(area => (
                                <div
                                    key={area.id}
                                    onClick={() => setSelectedArea(area.id)}
                                    className={`flex items-center gap-3 p-4 cursor-pointer border-b border-white/5 transition-all group ${
                                        selectedArea === area.id ? 'bg-[#00ff9d]/10 border-l-2 border-l-[#00ff9d]' : 'hover:bg-white/5'
                                    } ${!area.is_active ? 'opacity-50' : ''}`}
                                >
                                    {editingArea === area.id ? (
                                        <div className="flex-1 flex gap-2" onClick={e => e.stopPropagation()}>
                                            <input type="text" value={editValues.name} onChange={(e) => setEditValues({ ...editValues, name: e.target.value })} className="flex-1 bg-black border border-[#00ff9d] text-white px-2 py-1 text-sm font-mono rounded-sm" />
                                            <button onClick={() => handleUpdateArea(area.id)} className="p-1 text-[#00ff9d]"><Check className="h-4 w-4" /></button>
                                            <button onClick={() => setEditingArea(null)} className="p-1 text-red-500"><X className="h-4 w-4" /></button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex-1">
                                                <span className="text-white text-sm font-medium block">{area.name}</span>
                                                {!area.is_active && <span className="text-[10px] font-mono text-red-400">Désactivée</span>}
                                            </div>
                                            <span className="text-[10px] font-mono text-slate-600 bg-white/5 px-2 py-1 rounded-sm">
                                                {cleaningPosts.filter(p => p.area_id === area.id).length} postes
                                            </span>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                                                <button onClick={() => startEditing('area', area)} className="p-1 text-slate-500 hover:text-white"><Edit2 className="h-3 w-3" /></button>
                                                <button onClick={() => handleDeleteArea(area.id)} className="p-1 text-slate-500 hover:text-red-500"><Trash2 className="h-3 w-3" /></button>
                                            </div>
                                            <ChevronRight className={`h-4 w-4 transition-colors ${selectedArea === area.id ? 'text-[#00ff9d]' : 'text-slate-600'}`} />
                                        </>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* RIGHT PANEL - Items */}
                <div className="bg-[#0a0a0a] border border-white/10 rounded-sm overflow-hidden">
                    <div className="p-4 border-b border-white/10">
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest">
                            {activeSection === 'temperatures' && (selectedTypeData ? `Zones — ${selectedTypeData.name}` : 'Sélectionnez un type')}
                            {activeSection === 'reception' && (selectedSupplierData ? `Produits — ${selectedSupplierData.name}` : 'Sélectionnez un fournisseur')}
                            {activeSection === 'cleaning' && (selectedAreaData ? `Postes — ${selectedAreaData.name}` : 'Sélectionnez une zone')}
                        </h3>
                    </div>

                    <div className="max-h-[500px] overflow-y-auto">
                        {/* Temperature Zones */}
                        {activeSection === 'temperatures' && selectedType && (
                            <>
                                <form onSubmit={handleAddZone} className="p-3 border-b border-white/10 flex gap-2">
                                    <input
                                        type="text"
                                        required
                                        value={newZone.name}
                                        onChange={(e) => setNewZone({ name: e.target.value })}
                                        className="flex-1 bg-white/5 border border-white/10 text-white px-3 py-2 text-sm font-mono rounded-sm focus:outline-none focus:border-[#00ff9d]"
                                        placeholder="Ajouter une zone..."
                                    />
                                    <button type="submit" className="bg-[#00ff9d] text-black px-4 py-2 rounded-sm text-xs font-bold uppercase hover:bg-white transition-colors">
                                        <Plus className="h-4 w-4" />
                                    </button>
                                </form>
                                <div className="p-2">
                                    {filteredZones.length === 0 ? (
                                        <p className="text-slate-500 text-xs font-mono text-center py-8">Aucune zone pour ce type</p>
                                    ) : filteredZones.map(zone => (
                                        <div key={zone.id} className="flex items-center gap-2 p-3 hover:bg-white/5 rounded-sm group">
                                            {editingZone === zone.id ? (
                                                <>
                                                    <input type="text" value={editValues.name} onChange={(e) => setEditValues({ ...editValues, name: e.target.value })} className="flex-1 bg-black border border-[#00ff9d] text-white px-2 py-1 text-sm font-mono rounded-sm" />
                                                    <button onClick={() => handleUpdateZone(zone.id)} className="p-1 text-[#00ff9d]"><Check className="h-4 w-4" /></button>
                                                    <button onClick={() => setEditingZone(null)} className="p-1 text-red-500"><X className="h-4 w-4" /></button>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="flex-1 text-white text-sm">{zone.name}</span>
                                                    <button onClick={() => startEditing('zone', zone)} className="p-1 text-slate-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"><Edit2 className="h-4 w-4" /></button>
                                                    <button onClick={() => handleDeleteZone(zone.id)} className="p-1 text-slate-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="h-4 w-4" /></button>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* Products */}
                        {activeSection === 'reception' && selectedSupplier && (
                            <>
                                <form onSubmit={handleAddProduct} className="p-3 border-b border-white/10 flex gap-2">
                                    <input
                                        type="text"
                                        required
                                        value={newProduct.name}
                                        onChange={(e) => setNewProduct({ name: e.target.value })}
                                        className="flex-1 bg-white/5 border border-white/10 text-white px-3 py-2 text-sm font-mono rounded-sm focus:outline-none focus:border-[#00ff9d]"
                                        placeholder="Ajouter un produit..."
                                    />
                                    <button type="submit" className="bg-[#00ff9d] text-black px-4 py-2 rounded-sm text-xs font-bold uppercase hover:bg-white transition-colors">
                                        <Plus className="h-4 w-4" />
                                    </button>
                                </form>
                                <div className="p-2">
                                    {filteredProducts.length === 0 ? (
                                        <p className="text-slate-500 text-xs font-mono text-center py-8">Aucun produit pour ce fournisseur</p>
                                    ) : filteredProducts.map(product => (
                                        <div key={product.id} className="flex items-center gap-2 p-3 hover:bg-white/5 rounded-sm group">
                                            {editingProduct === product.id ? (
                                                <>
                                                    <input type="text" value={editValues.name} onChange={(e) => setEditValues({ ...editValues, name: e.target.value })} className="flex-1 bg-black border border-[#00ff9d] text-white px-2 py-1 text-sm font-mono rounded-sm" />
                                                    <button onClick={() => handleUpdateProduct(product.id)} className="p-1 text-[#00ff9d]"><Check className="h-4 w-4" /></button>
                                                    <button onClick={() => setEditingProduct(null)} className="p-1 text-red-500"><X className="h-4 w-4" /></button>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="flex-1 text-white text-sm">{product.name}</span>
                                                    <button onClick={() => startEditing('product', product)} className="p-1 text-slate-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"><Edit2 className="h-4 w-4" /></button>
                                                    <button onClick={() => handleDeleteProduct(product.id)} className="p-1 text-slate-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="h-4 w-4" /></button>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* Cleaning Posts */}
                        {activeSection === 'cleaning' && selectedArea && (
                            <>
                                <form onSubmit={handleAddPost} className="p-3 border-b border-white/10 flex gap-2">
                                    <input
                                        type="text"
                                        required
                                        value={newPost.name}
                                        onChange={(e) => setNewPost({ ...newPost, name: e.target.value })}
                                        className="flex-1 bg-white/5 border border-white/10 text-white px-3 py-2 text-sm font-mono rounded-sm focus:outline-none focus:border-[#00ff9d]"
                                        placeholder="Ajouter un poste..."
                                    />
                                    <select
                                        value={newPost.cleaning_frequency}
                                        onChange={(e) => setNewPost({ ...newPost, cleaning_frequency: e.target.value })}
                                        className="w-32 bg-[#050505] border border-white/10 text-white px-2 py-2 text-xs font-mono rounded-sm"
                                    >
                                        {FREQUENCY_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                                    </select>
                                    <button type="submit" className="bg-[#00ff9d] text-black px-4 py-2 rounded-sm text-xs font-bold uppercase hover:bg-white transition-colors">
                                        <Plus className="h-4 w-4" />
                                    </button>
                                </form>
                                <div className="p-2">
                                    {filteredPosts.length === 0 ? (
                                        <p className="text-slate-500 text-xs font-mono text-center py-8">Aucun poste pour cette zone</p>
                                    ) : filteredPosts.map(post => (
                                        <div key={post.id} className={`flex items-center gap-2 p-3 hover:bg-white/5 rounded-sm group ${!post.is_active ? 'opacity-50' : ''}`}>
                                            {editingPost === post.id ? (
                                                <>
                                                    <input type="text" value={editValues.name} onChange={(e) => setEditValues({ ...editValues, name: e.target.value })} className="flex-1 bg-black border border-[#00ff9d] text-white px-2 py-1 text-sm font-mono rounded-sm" />
                                                    <select value={editValues.cleaning_frequency} onChange={(e) => setEditValues({ ...editValues, cleaning_frequency: e.target.value })} className="w-28 bg-black border border-[#00ff9d] text-white px-2 py-1 text-xs font-mono rounded-sm">
                                                        {FREQUENCY_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                                                    </select>
                                                    <button onClick={() => handleUpdatePost(post.id)} className="p-1 text-[#00ff9d]"><Check className="h-4 w-4" /></button>
                                                    <button onClick={() => setEditingPost(null)} className="p-1 text-red-500"><X className="h-4 w-4" /></button>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="flex-1 text-white text-sm">{post.name}</span>
                                                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-sm ${
                                                        post.cleaning_frequency === 'daily' ? 'bg-blue-500/20 text-blue-400' :
                                                        post.cleaning_frequency === 'weekly' ? 'bg-purple-500/20 text-purple-400' :
                                                        post.cleaning_frequency === 'monthly' ? 'bg-orange-500/20 text-orange-400' :
                                                        'bg-slate-500/20 text-slate-400'
                                                    }`}>
                                                        {FREQUENCY_OPTIONS.find(f => f.value === post.cleaning_frequency)?.label}
                                                    </span>
                                                    <button onClick={() => startEditing('post', post)} className="p-1 text-slate-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"><Edit2 className="h-4 w-4" /></button>
                                                    <button onClick={() => handleDeletePost(post.id)} className="p-1 text-slate-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="h-4 w-4" /></button>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* Empty state when nothing selected */}
                        {((activeSection === 'temperatures' && !selectedType) ||
                          (activeSection === 'reception' && !selectedSupplier) ||
                          (activeSection === 'cleaning' && !selectedArea)) && (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <ChevronRight className="h-12 w-12 text-slate-700 mb-4" />
                                <p className="text-slate-500 text-sm font-mono">
                                    Sélectionnez un élément à gauche<br />pour voir son contenu
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
