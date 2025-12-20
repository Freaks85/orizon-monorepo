"use client";

import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Plus, Truck, Package, CheckCircle2, XCircle,
    Thermometer, Calendar, Hash, MapPin, ChevronDown,
    AlertTriangle, Settings2, Camera, X, Image, Trash2, Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useRestaurant } from '@/contexts/restaurant-context';
import { useEmployee } from '@/contexts/employee-context';

interface Supplier {
    id: string;
    name: string;
}

interface SupplierProduct {
    id: string;
    name: string;
    supplier_id: string;
}

interface ReceptionPhoto {
    id: string;
    photo_url: string;
    photo_type: string;
    notes: string | null;
}

interface ReceptionRecord {
    id: string;
    supplier_id: string;
    product_id: string;
    lot_number: string;
    dlc_date: string;
    reception_date: string;
    quantity: number;
    unit: string;
    storage_location: string;
    temperature_on_arrival: number | null;
    is_compliant: boolean;
    non_compliance_reason: string | null;
    notes: string | null;
    created_at: string;
    suppliers?: { name: string };
    supplier_products?: { name: string };
    reception_photos?: ReceptionPhoto[];
}

export default function ReceptionPage() {
    const { restaurant } = useRestaurant();
    const { activeEmployee } = useEmployee();

    const [records, setRecords] = useState<ReceptionRecord[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [products, setProducts] = useState<SupplierProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showSupplierModal, setShowSupplierModal] = useState(false);
    const [showPhotoModal, setShowPhotoModal] = useState(false);
    const [showQuickPhotoModal, setShowQuickPhotoModal] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<ReceptionRecord | null>(null);
    const [filterSupplier, setFilterSupplier] = useState<string>('all');

    // Quick photo states
    const [quickPhoto, setQuickPhoto] = useState<string | null>(null);
    const [quickPhotoData, setQuickPhotoData] = useState({
        supplier_id: '',
        product_id: '',
        temperature: '',
        notes: ''
    });
    const [quickPhotoCapturing, setQuickPhotoCapturing] = useState(false);
    const quickVideoRef = useRef<HTMLVideoElement>(null);
    const quickCanvasRef = useRef<HTMLCanvasElement>(null);
    const quickStreamRef = useRef<MediaStream | null>(null);

    const [newSupplier, setNewSupplier] = useState({ name: '', contact_name: '', phone: '', email: '' });
    const [newProduct, setNewProduct] = useState({ name: '', supplier_id: '', category: '' });

    const [newRecord, setNewRecord] = useState({
        supplier_id: '',
        product_id: '',
        lot_number: '',
        dlc_date: '',
        reception_date: format(new Date(), 'yyyy-MM-dd'),
        quantity: '',
        unit: 'kg',
        storage_location: '',
        temperature_on_arrival: '',
        is_compliant: true,
        non_compliance_reason: '',
        notes: ''
    });

    // Photo states
    const [capturedPhotos, setCapturedPhotos] = useState<{ dataUrl: string; type: string }[]>([]);
    const [isCapturing, setIsCapturing] = useState(false);
    const [photoType, setPhotoType] = useState<string>('delivery');
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        if (restaurant?.id) {
            fetchData();
        }
    }, [restaurant?.id]);

    // Cleanup camera on unmount
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (quickStreamRef.current) {
                quickStreamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const fetchData = async () => {
        try {
            if (!restaurant?.id) return;

            const [recordsRes, suppliersRes, productsRes] = await Promise.all([
                supabase
                    .from('reception_records')
                    .select('*, suppliers(name), supplier_products(name), reception_photos(id, photo_url, photo_type, notes)')
                    .eq('restaurant_id', restaurant.id)
                    .order('created_at', { ascending: false }),
                supabase
                    .from('suppliers')
                    .select('*')
                    .eq('restaurant_id', restaurant.id)
                    .order('name'),
                supabase
                    .from('supplier_products')
                    .select('*')
                    .eq('restaurant_id', restaurant.id)
                    .order('name')
            ]);

            if (recordsRes.error) throw recordsRes.error;
            if (suppliersRes.error) throw suppliersRes.error;
            if (productsRes.error) throw productsRes.error;

            setRecords(recordsRes.data || []);
            setSuppliers(suppliersRes.data || []);
            setProducts(productsRes.data || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setIsCapturing(true);
        } catch (error) {
            console.error('Error accessing camera:', error);
            alert('Impossible d\'accéder à la caméra. Vérifiez les permissions.');
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsCapturing(false);
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                setCapturedPhotos([...capturedPhotos, { dataUrl, type: photoType }]);
            }
        }
    };

    const removePhoto = (index: number) => {
        setCapturedPhotos(capturedPhotos.filter((_, i) => i !== index));
    };

    // Quick photo functions
    const startQuickCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
            });
            quickStreamRef.current = stream;
            if (quickVideoRef.current) {
                quickVideoRef.current.srcObject = stream;
            }
            setQuickPhotoCapturing(true);
        } catch (error) {
            console.error('Error accessing camera:', error);
            alert('Impossible d\'accéder à la caméra. Vérifiez les permissions.');
        }
    };

    const stopQuickCamera = () => {
        if (quickStreamRef.current) {
            quickStreamRef.current.getTracks().forEach(track => track.stop());
            quickStreamRef.current = null;
        }
        setQuickPhotoCapturing(false);
    };

    const captureQuickPhoto = () => {
        if (quickVideoRef.current && quickCanvasRef.current) {
            const video = quickVideoRef.current;
            const canvas = quickCanvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                setQuickPhoto(dataUrl);
                stopQuickCamera();
            }
        }
    };

    const handleQuickPhotoSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!restaurant?.id || !quickPhoto) return;

            // Convert base64 to blob
            const response = await fetch(quickPhoto);
            const blob = await response.blob();

            // Generate unique filename
            const fileName = `${restaurant.id}/quick/${Date.now()}.jpg`;

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('reception-photos')
                .upload(fileName, blob, { contentType: 'image/jpeg' });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('reception-photos')
                .getPublicUrl(fileName);

            // Save quick photo record
            const { error } = await supabase.from('quick_reception_photos').insert({
                restaurant_id: restaurant.id,
                employee_id: activeEmployee?.id || null,
                supplier_id: quickPhotoData.supplier_id || null,
                product_id: quickPhotoData.product_id || null,
                photo_url: publicUrl,
                temperature: quickPhotoData.temperature ? parseFloat(quickPhotoData.temperature) : null,
                notes: quickPhotoData.notes || null
            });

            if (error) throw error;

            // Reset and close
            stopQuickCamera();
            setShowQuickPhotoModal(false);
            setQuickPhoto(null);
            setQuickPhotoData({
                supplier_id: '',
                product_id: '',
                temperature: '',
                notes: ''
            });
        } catch (error) {
            console.error('Error saving quick photo:', error);
        }
    };

    const handleAddSupplier = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!restaurant?.id) return;

            const { error } = await supabase.from('suppliers').insert({
                restaurant_id: restaurant.id,
                name: newSupplier.name,
                contact_name: newSupplier.contact_name || null,
                phone: newSupplier.phone || null,
                email: newSupplier.email || null
            });

            if (error) throw error;

            setShowSupplierModal(false);
            setNewSupplier({ name: '', contact_name: '', phone: '', email: '' });
            fetchData();
        } catch (error) {
            console.error('Error adding supplier:', error);
        }
    };

    const handleAddProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!restaurant?.id) return;

            const { error } = await supabase.from('supplier_products').insert({
                restaurant_id: restaurant.id,
                supplier_id: newProduct.supplier_id,
                name: newProduct.name,
                category: newProduct.category || null
            });

            if (error) throw error;

            setNewProduct({ name: '', supplier_id: '', category: '' });
            fetchData();
        } catch (error) {
            console.error('Error adding product:', error);
        }
    };

    const handleSubmitReception = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!restaurant?.id) return;

            // Insert the reception record
            const { data: receptionData, error: receptionError } = await supabase
                .from('reception_records')
                .insert({
                    restaurant_id: restaurant.id,
                    employee_id: activeEmployee?.id || null,
                    supplier_id: newRecord.supplier_id,
                    product_id: newRecord.product_id,
                    lot_number: newRecord.lot_number,
                    dlc_date: newRecord.dlc_date,
                    reception_date: newRecord.reception_date,
                    quantity: parseFloat(newRecord.quantity),
                    unit: newRecord.unit,
                    storage_location: newRecord.storage_location || null,
                    temperature_on_arrival: newRecord.temperature_on_arrival ? parseFloat(newRecord.temperature_on_arrival) : null,
                    is_compliant: newRecord.is_compliant,
                    non_compliance_reason: !newRecord.is_compliant ? newRecord.non_compliance_reason : null,
                    notes: newRecord.notes || null
                })
                .select()
                .single();

            if (receptionError) throw receptionError;

            // Upload photos if any
            if (capturedPhotos.length > 0 && receptionData) {
                for (const photo of capturedPhotos) {
                    // Convert base64 to blob
                    const response = await fetch(photo.dataUrl);
                    const blob = await response.blob();

                    // Generate unique filename
                    const fileName = `${restaurant.id}/${receptionData.id}/${Date.now()}.jpg`;

                    // Upload to Supabase Storage
                    const { data: uploadData, error: uploadError } = await supabase.storage
                        .from('reception-photos')
                        .upload(fileName, blob, { contentType: 'image/jpeg' });

                    if (uploadError) {
                        console.error('Error uploading photo:', uploadError);
                        continue;
                    }

                    // Get public URL
                    const { data: { publicUrl } } = supabase.storage
                        .from('reception-photos')
                        .getPublicUrl(fileName);

                    // Save photo record
                    await supabase.from('reception_photos').insert({
                        reception_id: receptionData.id,
                        restaurant_id: restaurant.id,
                        employee_id: activeEmployee?.id || null,
                        photo_url: publicUrl,
                        photo_type: photo.type
                    });
                }
            }

            stopCamera();
            setShowModal(false);
            setCapturedPhotos([]);
            setNewRecord({
                supplier_id: '',
                product_id: '',
                lot_number: '',
                dlc_date: '',
                reception_date: format(new Date(), 'yyyy-MM-dd'),
                quantity: '',
                unit: 'kg',
                storage_location: '',
                temperature_on_arrival: '',
                is_compliant: true,
                non_compliance_reason: '',
                notes: ''
            });
            fetchData();
        } catch (error) {
            console.error('Error adding reception:', error);
        }
    };

    const openPhotoViewer = (record: ReceptionRecord) => {
        setSelectedRecord(record);
        setShowPhotoModal(true);
    };

    const filteredRecords = filterSupplier === 'all'
        ? records
        : records.filter(r => r.supplier_id === filterSupplier);

    const filteredProducts = newRecord.supplier_id
        ? products.filter(p => p.supplier_id === newRecord.supplier_id)
        : products;

    const todayReceptions = records.filter(r =>
        format(new Date(r.reception_date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
    ).length;

    const nonCompliantToday = records.filter(r =>
        format(new Date(r.reception_date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') && !r.is_compliant
    ).length;

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6 sm:mb-8">
                <div>
                    <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-white uppercase tracking-wider mb-1 sm:mb-2">
                        Réception Marchandises
                    </h1>
                    <p className="font-mono text-[10px] sm:text-xs text-slate-500">
                        Traçabilité HACCP • Contrôle à réception
                    </p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <button
                        onClick={() => setShowSupplierModal(true)}
                        className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white px-3 py-2.5 sm:py-3 rounded-sm transition-colors text-[10px] sm:text-xs font-bold uppercase tracking-widest border border-white/10"
                    >
                        <Settings2 className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Gérer</span>
                    </button>
                    <button
                        onClick={() => {
                            setShowQuickPhotoModal(true);
                            setTimeout(() => startQuickCamera(), 100);
                        }}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#00ff9d] hover:bg-white text-black px-4 py-2.5 sm:py-3 rounded-sm transition-colors text-xs font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(0,255,157,0.3)]"
                    >
                        <Camera className="h-4 w-4" />
                        <span className="hidden sm:inline">Réception</span> Photo
                    </button>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white px-3 py-2.5 sm:py-3 rounded-sm transition-colors text-[10px] sm:text-xs font-bold uppercase tracking-widest border border-white/10"
                    >
                        <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Réception</span> Manuel
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
                <div className="bg-[#0a0a0a] border border-white/10 p-3 sm:p-4 md:p-6 rounded-sm">
                    <div className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1 sm:mb-2">Aujourd'hui</div>
                    <div className="text-xl sm:text-2xl md:text-3xl font-display text-white font-bold">{todayReceptions}</div>
                    <div className="text-[10px] text-slate-600 font-mono mt-1">réceptions</div>
                </div>
                <div className="bg-[#0a0a0a] border border-white/10 p-3 sm:p-4 md:p-6 rounded-sm">
                    <div className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1 sm:mb-2">Fournisseurs</div>
                    <div className="text-xl sm:text-2xl md:text-3xl font-display text-white font-bold">{suppliers.length}</div>
                    <div className="text-[10px] text-slate-600 font-mono mt-1">actifs</div>
                </div>
                <div className="bg-[#0a0a0a] border border-white/10 p-3 sm:p-4 md:p-6 rounded-sm">
                    <div className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1 sm:mb-2">Non-conf.</div>
                    <div className={`text-xl sm:text-2xl md:text-3xl font-display font-bold ${nonCompliantToday > 0 ? 'text-red-500' : 'text-[#00ff9d]'}`}>
                        {nonCompliantToday}
                    </div>
                    <div className="text-[10px] text-slate-600 font-mono mt-1">aujourd'hui</div>
                </div>
            </div>

            {/* Filter */}
            <div className="flex gap-2 mb-4">
                <div className="relative flex-1 sm:flex-none sm:w-48">
                    <select
                        value={filterSupplier}
                        onChange={(e) => setFilterSupplier(e.target.value)}
                        className="w-full bg-[#0a0a0a] border border-white/10 text-white px-3 py-2 pr-8 text-xs font-mono uppercase rounded-sm appearance-none focus:outline-none focus:border-[#00ff9d]"
                    >
                        <option value="all">Tous les fournisseurs</option>
                        {suppliers.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                </div>
            </div>

            {/* Records List */}
            <div className="bg-[#0a0a0a] border border-white/10 overflow-hidden rounded-sm">
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/10">
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Date</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Fournisseur</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Produit</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">N° Lot</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">DLC</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Qté</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">T°</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Photos</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Statut</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr><td colSpan={9} className="p-8 text-center text-slate-500 uppercase font-mono animate-pulse">Chargement...</td></tr>
                            ) : filteredRecords.length === 0 ? (
                                <tr><td colSpan={9} className="p-8 text-center text-slate-500 uppercase font-mono">Aucune réception enregistrée.</td></tr>
                            ) : (
                                filteredRecords.map((record) => (
                                    <tr key={record.id} className="hover:bg-white/5 transition-colors">
                                        <td className="p-4 text-sm font-mono text-slate-300">
                                            {format(new Date(record.reception_date), "dd/MM/yy", { locale: fr })}
                                        </td>
                                        <td className="p-4 text-sm font-bold text-white uppercase">
                                            {record.suppliers?.name || '-'}
                                        </td>
                                        <td className="p-4 text-sm text-slate-300">
                                            {record.supplier_products?.name || '-'}
                                        </td>
                                        <td className="p-4 text-xs font-mono text-slate-400">
                                            {record.lot_number}
                                        </td>
                                        <td className="p-4 text-sm font-mono text-slate-300">
                                            {format(new Date(record.dlc_date), "dd/MM/yy")}
                                        </td>
                                        <td className="p-4 text-sm font-mono text-white">
                                            {record.quantity} {record.unit}
                                        </td>
                                        <td className="p-4 text-sm font-mono text-slate-300">
                                            {record.temperature_on_arrival !== null ? `${record.temperature_on_arrival}°C` : '-'}
                                        </td>
                                        <td className="p-4">
                                            {record.reception_photos && record.reception_photos.length > 0 ? (
                                                <button
                                                    onClick={() => openPhotoViewer(record)}
                                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-sm bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
                                                >
                                                    <Image className="h-3 w-3" /> {record.reception_photos.length}
                                                </button>
                                            ) : (
                                                <span className="text-slate-600 text-xs">-</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            {record.is_compliant ? (
                                                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-sm bg-[#00ff9d]/10 text-[#00ff9d] text-[10px] font-bold uppercase tracking-wide border border-[#00ff9d]/20">
                                                    <CheckCircle2 className="h-3 w-3" /> Conforme
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-sm bg-red-500/10 text-red-500 text-[10px] font-bold uppercase tracking-wide border border-red-500/20">
                                                    <XCircle className="h-3 w-3" /> Non-conf.
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden divide-y divide-white/5">
                    {loading ? (
                        <div className="p-6 text-center text-slate-500 uppercase font-mono animate-pulse text-sm">Chargement...</div>
                    ) : filteredRecords.length === 0 ? (
                        <div className="p-6 text-center text-slate-500 uppercase font-mono text-sm">Aucune réception enregistrée.</div>
                    ) : (
                        filteredRecords.map((record) => (
                            <div key={record.id} className="p-4 hover:bg-white/5 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="text-sm font-bold text-white uppercase mb-0.5">
                                            {record.suppliers?.name}
                                        </div>
                                        <div className="text-xs text-slate-400">
                                            {record.supplier_products?.name}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {record.reception_photos && record.reception_photos.length > 0 && (
                                            <button
                                                onClick={() => openPhotoViewer(record)}
                                                className="p-1 rounded-sm bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                            >
                                                <Image className="h-4 w-4" />
                                            </button>
                                        )}
                                        {record.is_compliant ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-[#00ff9d]/10 text-[#00ff9d] text-[10px] font-bold uppercase border border-[#00ff9d]/20">
                                                <CheckCircle2 className="h-3 w-3" /> OK
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-red-500/10 text-red-500 text-[10px] font-bold uppercase border border-red-500/20">
                                                <XCircle className="h-3 w-3" /> NC
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-500">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {format(new Date(record.reception_date), "dd/MM/yy")}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Hash className="h-3 w-3" />
                                        {record.lot_number}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Package className="h-3 w-3" />
                                        {record.quantity} {record.unit}
                                    </div>
                                    {record.temperature_on_arrival !== null && (
                                        <div className="flex items-center gap-1">
                                            <Thermometer className="h-3 w-3" />
                                            {record.temperature_on_arrival}°C
                                        </div>
                                    )}
                                </div>
                                <div className="mt-2 text-[10px] text-slate-600">
                                    DLC: {format(new Date(record.dlc_date), "dd/MM/yyyy")}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Add Reception Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-[#0a0a0a] border border-white/10 w-full sm:max-w-lg p-6 sm:p-8 rounded-t-lg sm:rounded-sm shadow-2xl relative max-h-[90vh] overflow-y-auto">
                        <h3 className="font-display text-lg sm:text-xl text-white uppercase mb-4 sm:mb-6 flex items-center gap-2">
                            <Truck className="h-5 w-5 text-[#00ff9d]" />
                            Réception Manuel
                        </h3>

                        <form onSubmit={handleSubmitReception} className="space-y-4">
                            {/* Supplier & Product */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Fournisseur *</label>
                                    <select
                                        required
                                        value={newRecord.supplier_id}
                                        onChange={(e) => setNewRecord({ ...newRecord, supplier_id: e.target.value, product_id: '' })}
                                        className="w-full bg-[#050505] border border-white/10 text-white px-3 py-2.5 focus:outline-none focus:border-[#00ff9d] transition-colors font-mono text-sm rounded-sm"
                                    >
                                        <option value="">Sélectionner...</option>
                                        {suppliers.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Produit *</label>
                                    <select
                                        required
                                        value={newRecord.product_id}
                                        onChange={(e) => setNewRecord({ ...newRecord, product_id: e.target.value })}
                                        className="w-full bg-[#050505] border border-white/10 text-white px-3 py-2.5 focus:outline-none focus:border-[#00ff9d] transition-colors font-mono text-sm rounded-sm"
                                        disabled={!newRecord.supplier_id}
                                    >
                                        <option value="">Sélectionner...</option>
                                        {filteredProducts.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Lot & DLC */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">N° de Lot *</label>
                                    <input
                                        type="text"
                                        required
                                        value={newRecord.lot_number}
                                        onChange={(e) => setNewRecord({ ...newRecord, lot_number: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 text-white px-3 py-2.5 focus:outline-none focus:border-[#00ff9d] transition-colors font-mono text-sm rounded-sm"
                                        placeholder="LOT-2024-XXX"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">DLC *</label>
                                    <input
                                        type="date"
                                        required
                                        value={newRecord.dlc_date}
                                        onChange={(e) => setNewRecord({ ...newRecord, dlc_date: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 text-white px-3 py-2.5 focus:outline-none focus:border-[#00ff9d] transition-colors font-mono text-sm rounded-sm"
                                    />
                                </div>
                            </div>

                            {/* Quantity & Unit */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="col-span-2">
                                    <label className="block text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Quantité *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={newRecord.quantity}
                                        onChange={(e) => setNewRecord({ ...newRecord, quantity: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 text-white px-3 py-2.5 focus:outline-none focus:border-[#00ff9d] transition-colors font-mono text-sm rounded-sm"
                                        placeholder="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Unité</label>
                                    <select
                                        value={newRecord.unit}
                                        onChange={(e) => setNewRecord({ ...newRecord, unit: e.target.value })}
                                        className="w-full bg-[#050505] border border-white/10 text-white px-3 py-2.5 focus:outline-none focus:border-[#00ff9d] transition-colors font-mono text-sm rounded-sm"
                                    >
                                        <option value="kg">kg</option>
                                        <option value="g">g</option>
                                        <option value="L">L</option>
                                        <option value="cL">cL</option>
                                        <option value="unité">unité</option>
                                        <option value="carton">carton</option>
                                        <option value="palette">palette</option>
                                    </select>
                                </div>
                            </div>

                            {/* Temperature & Storage */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">T° à réception</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={newRecord.temperature_on_arrival}
                                        onChange={(e) => setNewRecord({ ...newRecord, temperature_on_arrival: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 text-white px-3 py-2.5 focus:outline-none focus:border-[#00ff9d] transition-colors font-mono text-sm rounded-sm"
                                        placeholder="°C"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Stockage</label>
                                    <input
                                        type="text"
                                        value={newRecord.storage_location}
                                        onChange={(e) => setNewRecord({ ...newRecord, storage_location: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 text-white px-3 py-2.5 focus:outline-none focus:border-[#00ff9d] transition-colors font-mono text-sm rounded-sm"
                                        placeholder="Chambre froide 1"
                                    />
                                </div>
                            </div>

                            {/* Photo Section */}
                            <div className="bg-white/5 border border-white/10 p-4 rounded-sm">
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Camera className="h-4 w-4" /> Photos de réception
                                    </label>
                                    {!isCapturing && (
                                        <button
                                            type="button"
                                            onClick={startCamera}
                                            className="px-3 py-1.5 bg-[#00ff9d]/10 text-[#00ff9d] text-[10px] font-bold uppercase rounded-sm border border-[#00ff9d]/20 hover:bg-[#00ff9d]/20 transition-colors"
                                        >
                                            Ouvrir Caméra
                                        </button>
                                    )}
                                </div>

                                {/* Camera View */}
                                {isCapturing && (
                                    <div className="space-y-3">
                                        <div className="relative bg-black rounded-sm overflow-hidden">
                                            <video
                                                ref={videoRef}
                                                autoPlay
                                                playsInline
                                                className="w-full h-48 object-cover"
                                            />
                                            <canvas ref={canvasRef} className="hidden" />
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <select
                                                value={photoType}
                                                onChange={(e) => setPhotoType(e.target.value)}
                                                className="flex-1 bg-[#050505] border border-white/10 text-white px-2 py-1.5 text-[10px] font-mono uppercase rounded-sm"
                                            >
                                                <option value="delivery">Livraison</option>
                                                <option value="product">Produit</option>
                                                <option value="label">Étiquette</option>
                                                <option value="damage">Dommage</option>
                                                <option value="other">Autre</option>
                                            </select>
                                            <button
                                                type="button"
                                                onClick={capturePhoto}
                                                className="flex-1 flex items-center justify-center gap-1 bg-[#00ff9d] text-black px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase hover:bg-white transition-colors"
                                            >
                                                <Camera className="h-3 w-3" /> Capturer
                                            </button>
                                            <button
                                                type="button"
                                                onClick={stopCamera}
                                                className="p-1.5 bg-red-500/10 text-red-500 rounded-sm border border-red-500/20 hover:bg-red-500/20 transition-colors"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Captured Photos */}
                                {capturedPhotos.length > 0 && (
                                    <div className="mt-3">
                                        <div className="text-[10px] text-slate-500 font-mono mb-2">{capturedPhotos.length} photo(s) capturée(s)</div>
                                        <div className="grid grid-cols-4 gap-2">
                                            {capturedPhotos.map((photo, index) => (
                                                <div key={index} className="relative group">
                                                    <img
                                                        src={photo.dataUrl}
                                                        alt={`Photo ${index + 1}`}
                                                        className="w-full h-16 object-cover rounded-sm border border-white/10"
                                                    />
                                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => removePhoto(index)}
                                                            className="p-1 bg-red-500 rounded-sm"
                                                        >
                                                            <Trash2 className="h-3 w-3 text-white" />
                                                        </button>
                                                    </div>
                                                    <span className="absolute bottom-0 left-0 right-0 bg-black/70 text-[8px] text-white text-center py-0.5 uppercase">
                                                        {photo.type}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Compliance */}
                            <div className="bg-white/5 border border-white/10 p-4 rounded-sm">
                                <div
                                    className="flex items-center cursor-pointer group"
                                    onClick={() => setNewRecord({ ...newRecord, is_compliant: !newRecord.is_compliant })}
                                >
                                    <div className={`w-5 h-5 border flex items-center justify-center transition-all ${
                                        newRecord.is_compliant
                                            ? 'bg-[#00ff9d] border-[#00ff9d]'
                                            : 'bg-white/5 border-white/10 group-hover:border-[#00ff9d]/50'
                                    }`}>
                                        {newRecord.is_compliant && <CheckCircle2 className="h-3.5 w-3.5 text-black stroke-[3]" />}
                                    </div>
                                    <span className="ml-3 text-sm text-slate-300 group-hover:text-white transition-colors select-none">
                                        Réception conforme
                                    </span>
                                </div>

                                {!newRecord.is_compliant && (
                                    <div className="mt-3">
                                        <label className="block text-[10px] font-bold text-red-400 uppercase tracking-widest mb-2">
                                            <AlertTriangle className="h-3 w-3 inline mr-1" />
                                            Motif de non-conformité *
                                        </label>
                                        <select
                                            required={!newRecord.is_compliant}
                                            value={newRecord.non_compliance_reason}
                                            onChange={(e) => setNewRecord({ ...newRecord, non_compliance_reason: e.target.value })}
                                            className="w-full bg-[#050505] border border-red-500/30 text-white px-3 py-2 focus:outline-none focus:border-red-500 transition-colors font-mono text-sm rounded-sm"
                                        >
                                            <option value="">Sélectionner...</option>
                                            <option value="temperature">Température hors norme</option>
                                            <option value="emballage">Emballage endommagé</option>
                                            <option value="dlc">DLC trop courte/dépassée</option>
                                            <option value="qualite">Problème de qualité visuelle</option>
                                            <option value="quantite">Quantité incorrecte</option>
                                            <option value="autre">Autre</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Notes</label>
                                <textarea
                                    value={newRecord.notes}
                                    onChange={(e) => setNewRecord({ ...newRecord, notes: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 text-white px-3 py-2.5 focus:outline-none focus:border-[#00ff9d] transition-colors font-mono text-sm h-16 resize-none rounded-sm"
                                    placeholder="Observations..."
                                />
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        stopCamera();
                                        setShowModal(false);
                                        setCapturedPhotos([]);
                                    }}
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

            {/* Photo Viewer Modal */}
            {showPhotoModal && selectedRecord && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#0a0a0a] border border-white/10 w-full max-w-2xl p-6 rounded-sm shadow-2xl relative max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-display text-lg text-white uppercase flex items-center gap-2">
                                <Image className="h-5 w-5 text-[#00ff9d]" />
                                Photos - {selectedRecord.suppliers?.name}
                            </h3>
                            <button
                                onClick={() => setShowPhotoModal(false)}
                                className="p-2 text-slate-400 hover:text-white transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="text-xs text-slate-500 font-mono mb-4">
                            {selectedRecord.supplier_products?.name} • Lot: {selectedRecord.lot_number}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {selectedRecord.reception_photos?.map((photo) => (
                                <div key={photo.id} className="relative">
                                    <img
                                        src={photo.photo_url}
                                        alt="Photo de réception"
                                        className="w-full h-48 object-cover rounded-sm border border-white/10"
                                    />
                                    <span className="absolute top-2 left-2 px-2 py-1 bg-black/70 text-[10px] text-white uppercase font-bold rounded-sm">
                                        {photo.photo_type}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => setShowPhotoModal(false)}
                            className="w-full mt-6 bg-white/5 text-white font-bold uppercase tracking-widest py-3 hover:bg-white/10 transition-colors text-xs rounded-sm"
                        >
                            Fermer
                        </button>
                    </div>
                </div>
            )}

            {/* Add Supplier Modal */}
            {showSupplierModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-[#0a0a0a] border border-white/10 w-full sm:max-w-md p-6 sm:p-8 rounded-t-lg sm:rounded-sm shadow-2xl relative max-h-[90vh] overflow-y-auto">
                        <h3 className="font-display text-lg sm:text-xl text-white uppercase mb-4 sm:mb-6">
                            Gestion Fournisseurs & Produits
                        </h3>

                        {/* Add Supplier Form */}
                        <form onSubmit={handleAddSupplier} className="space-y-3 mb-6">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nouveau Fournisseur</h4>
                            <input
                                type="text"
                                required
                                value={newSupplier.name}
                                onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 text-white px-3 py-2.5 focus:outline-none focus:border-[#00ff9d] transition-colors font-mono text-sm rounded-sm"
                                placeholder="Nom du fournisseur"
                            />
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    type="text"
                                    value={newSupplier.phone}
                                    onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 text-white px-3 py-2 focus:outline-none focus:border-[#00ff9d] transition-colors font-mono text-xs rounded-sm"
                                    placeholder="Téléphone"
                                />
                                <input
                                    type="email"
                                    value={newSupplier.email}
                                    onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 text-white px-3 py-2 focus:outline-none focus:border-[#00ff9d] transition-colors font-mono text-xs rounded-sm"
                                    placeholder="Email"
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-[#00ff9d] text-black font-bold uppercase tracking-widest py-2.5 hover:bg-white transition-colors text-xs rounded-sm"
                            >
                                Ajouter Fournisseur
                            </button>
                        </form>

                        {/* Add Product Form */}
                        <form onSubmit={handleAddProduct} className="space-y-3 mb-6 pt-6 border-t border-white/10">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nouveau Produit</h4>
                            <select
                                required
                                value={newProduct.supplier_id}
                                onChange={(e) => setNewProduct({ ...newProduct, supplier_id: e.target.value })}
                                className="w-full bg-[#050505] border border-white/10 text-white px-3 py-2.5 focus:outline-none focus:border-[#00ff9d] transition-colors font-mono text-sm rounded-sm"
                            >
                                <option value="">Fournisseur...</option>
                                {suppliers.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                            <input
                                type="text"
                                required
                                value={newProduct.name}
                                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 text-white px-3 py-2.5 focus:outline-none focus:border-[#00ff9d] transition-colors font-mono text-sm rounded-sm"
                                placeholder="Nom du produit"
                            />
                            <button
                                type="submit"
                                className="w-full bg-[#00ff9d] text-black font-bold uppercase tracking-widest py-2.5 hover:bg-white transition-colors text-xs rounded-sm"
                            >
                                Ajouter Produit
                            </button>
                        </form>

                        {/* Existing Suppliers List */}
                        <div className="pt-4 border-t border-white/10">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Fournisseurs existants</h4>
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                {suppliers.length === 0 ? (
                                    <p className="text-xs text-slate-500 font-mono">Aucun fournisseur</p>
                                ) : (
                                    suppliers.map(s => (
                                        <div key={s.id} className="flex items-center justify-between bg-white/5 px-3 py-2 rounded-sm">
                                            <span className="text-sm text-white">{s.name}</span>
                                            <span className="text-[10px] text-slate-500 font-mono">
                                                {products.filter(p => p.supplier_id === s.id).length} produits
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowSupplierModal(false)}
                            className="w-full mt-6 bg-white/5 text-white font-bold uppercase tracking-widest py-3 hover:bg-white/10 transition-colors text-xs rounded-sm"
                        >
                            Fermer
                        </button>
                    </div>
                </div>
            )}

            {/* Quick Photo Modal */}
            {showQuickPhotoModal && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-[#0a0a0a] border border-white/10 w-full sm:max-w-md p-4 sm:p-6 rounded-t-lg sm:rounded-sm shadow-2xl relative max-h-[95vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-display text-lg text-white uppercase flex items-center gap-2">
                                <Camera className="h-5 w-5 text-blue-400" />
                                Réception Photo
                            </h3>
                            <button
                                onClick={() => {
                                    stopQuickCamera();
                                    setShowQuickPhotoModal(false);
                                    setQuickPhoto(null);
                                    setQuickPhotoData({ supplier_id: '', product_id: '', temperature: '', notes: '' });
                                }}
                                className="p-2 text-slate-400 hover:text-white transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleQuickPhotoSubmit} className="space-y-4">
                            {/* Camera / Photo Preview */}
                            <div className="bg-black rounded-sm overflow-hidden">
                                {quickPhotoCapturing ? (
                                    <div className="relative">
                                        <video
                                            ref={quickVideoRef}
                                            autoPlay
                                            playsInline
                                            className="w-full h-64 object-cover"
                                        />
                                        <canvas ref={quickCanvasRef} className="hidden" />
                                        <button
                                            type="button"
                                            onClick={captureQuickPhoto}
                                            className="absolute bottom-4 left-1/2 -translate-x-1/2 w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
                                        >
                                            <div className="w-12 h-12 bg-white border-4 border-black rounded-full" />
                                        </button>
                                    </div>
                                ) : quickPhoto ? (
                                    <div className="relative">
                                        <img
                                            src={quickPhoto}
                                            alt="Photo capturée"
                                            className="w-full h-64 object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setQuickPhoto(null);
                                                startQuickCamera();
                                            }}
                                            className="absolute top-2 right-2 p-2 bg-black/70 text-white rounded-sm hover:bg-black transition-colors"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                        <div className="absolute bottom-2 left-2 px-2 py-1 bg-[#00ff9d] text-black text-[10px] font-bold uppercase rounded-sm">
                                            Photo OK
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-64 flex items-center justify-center">
                                        <button
                                            type="button"
                                            onClick={startQuickCamera}
                                            className="flex flex-col items-center gap-2 text-slate-500 hover:text-white transition-colors"
                                        >
                                            <Camera className="h-12 w-12" />
                                            <span className="text-xs uppercase font-bold">Activer la caméra</span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Optional: Supplier & Product */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Fournisseur</label>
                                    <select
                                        value={quickPhotoData.supplier_id}
                                        onChange={(e) => setQuickPhotoData({ ...quickPhotoData, supplier_id: e.target.value, product_id: '' })}
                                        className="w-full bg-[#050505] border border-white/10 text-white px-2 py-2 focus:outline-none focus:border-blue-400 transition-colors font-mono text-xs rounded-sm"
                                    >
                                        <option value="">Optionnel...</option>
                                        {suppliers.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Produit</label>
                                    <select
                                        value={quickPhotoData.product_id}
                                        onChange={(e) => setQuickPhotoData({ ...quickPhotoData, product_id: e.target.value })}
                                        className="w-full bg-[#050505] border border-white/10 text-white px-2 py-2 focus:outline-none focus:border-blue-400 transition-colors font-mono text-xs rounded-sm"
                                        disabled={!quickPhotoData.supplier_id}
                                    >
                                        <option value="">Optionnel...</option>
                                        {products.filter(p => p.supplier_id === quickPhotoData.supplier_id).map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Temperature */}
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                    <Thermometer className="h-3 w-3" /> Température à réception
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={quickPhotoData.temperature}
                                    onChange={(e) => setQuickPhotoData({ ...quickPhotoData, temperature: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-blue-400 transition-colors font-mono text-lg font-bold rounded-sm text-center"
                                    placeholder="°C"
                                />
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Commentaire (optionnel)</label>
                                <textarea
                                    value={quickPhotoData.notes}
                                    onChange={(e) => setQuickPhotoData({ ...quickPhotoData, notes: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 text-white px-3 py-2 focus:outline-none focus:border-blue-400 transition-colors font-mono text-sm h-16 resize-none rounded-sm"
                                    placeholder="Observations..."
                                />
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        stopQuickCamera();
                                        setShowQuickPhotoModal(false);
                                        setQuickPhoto(null);
                                        setQuickPhotoData({ supplier_id: '', product_id: '', temperature: '', notes: '' });
                                    }}
                                    className="flex-1 bg-white/5 text-white font-bold uppercase tracking-widest py-3 hover:bg-white/10 transition-colors text-xs rounded-sm"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={!quickPhoto}
                                    className="flex-1 bg-blue-500 text-white font-bold uppercase tracking-widest py-3 hover:bg-blue-400 transition-colors text-xs rounded-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    <Camera className="h-4 w-4" /> Enregistrer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
