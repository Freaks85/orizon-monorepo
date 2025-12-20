"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Calendar, Clock, Users, Phone, Mail, User, Check, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { format, addDays, isBefore, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ReservationSettings {
    id: string;
    restaurant_id: string;
    is_enabled: boolean;
    slug: string;
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    min_party_size: number;
    max_party_size: number;
    advance_booking_days: number;
    min_notice_hours: number;
    welcome_message: string | null;
    confirmation_message: string | null;
    display_phone: string | null;
    display_email: string | null;
    display_address: string | null;
}

interface Restaurant {
    id: string;
    name: string;
    address: string | null;
    phone: string | null;
    email: string | null;
}

interface Service {
    id: string;
    name: string;
    start_time: string;
    end_time: string;
    max_covers: number;
    days_of_week: number[];
}

export default function PublicBookingPage() {
    const params = useParams();
    const slug = params.slug as string;

    const [settings, setSettings] = useState<ReservationSettings | null>(null);
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Form state
    const [step, setStep] = useState(1);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [selectedTime, setSelectedTime] = useState('');
    const [partySize, setPartySize] = useState(2);
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        fetchData();
    }, [slug]);

    const fetchData = async () => {
        try {
            // Fetch settings with restaurant
            const { data: settingsData, error: settingsError } = await supabase
                .from('restaurant_reservation_settings')
                .select('*')
                .eq('slug', slug)
                .eq('is_enabled', true)
                .single();

            if (settingsError || !settingsData) {
                setError('Page de réservation non trouvée');
                setLoading(false);
                return;
            }

            setSettings(settingsData);

            // Fetch restaurant
            const { data: restaurantData } = await supabase
                .from('restaurants')
                .select('*')
                .eq('id', settingsData.restaurant_id)
                .single();

            setRestaurant(restaurantData);

            // Fetch services
            const { data: servicesData } = await supabase
                .from('services')
                .select('*')
                .eq('restaurant_id', settingsData.restaurant_id)
                .eq('is_active', true)
                .order('start_time');

            setServices(servicesData || []);
        } catch (err) {
            setError('Erreur lors du chargement');
        } finally {
            setLoading(false);
        }
    };

    const getAvailableDates = () => {
        if (!settings) return [];

        const dates: Date[] = [];
        const today = startOfDay(new Date());

        for (let i = 0; i <= settings.advance_booking_days; i++) {
            const date = addDays(today, i);
            dates.push(date);
        }

        return dates;
    };

    const getAvailableServices = (date: Date) => {
        const dayOfWeek = date.getDay();
        return services.filter(s => s.days_of_week.includes(dayOfWeek));
    };

    const getTimeSlots = (service: Service) => {
        const slots: string[] = [];
        const [startHour, startMin] = service.start_time.split(':').map(Number);
        const [endHour, endMin] = service.end_time.split(':').map(Number);

        let hour = startHour;
        let min = startMin;

        while (hour < endHour || (hour === endHour && min < endMin)) {
            slots.push(`${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`);
            min += 30;
            if (min >= 60) {
                min = 0;
                hour++;
            }
        }

        return slots;
    };

    const handleSubmit = async () => {
        if (!settings || !selectedDate || !selectedService || !selectedTime) return;

        setSubmitting(true);
        try {
            const { error } = await supabase
                .from('reservations')
                .insert({
                    restaurant_id: settings.restaurant_id,
                    service_id: selectedService.id,
                    reservation_date: format(selectedDate, 'yyyy-MM-dd'),
                    reservation_time: selectedTime,
                    party_size: partySize,
                    customer_name: customerName,
                    customer_phone: customerPhone,
                    customer_email: customerEmail || null,
                    notes: notes || null,
                    status: 'pending'
                });

            if (error) throw error;
            setSuccess(true);
        } catch (err) {
            console.error('Error submitting reservation:', err);
            alert('Erreur lors de la réservation. Veuillez réessayer.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <div className="h-12 w-12 border-2 border-[#00ff9d] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error || !settings || !restaurant) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-white mb-2">Page non trouvée</h1>
                    <p className="text-slate-500">Cette page de réservation n'existe pas ou n'est pas active.</p>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div
                className="min-h-screen flex items-center justify-center p-4"
                style={{ backgroundColor: settings.secondary_color }}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center max-w-md"
                >
                    <div
                        className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                        style={{ backgroundColor: `${settings.primary_color}20` }}
                    >
                        <Check className="h-10 w-10" style={{ color: settings.primary_color }} />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-4">Réservation envoyée !</h1>
                    <p className="text-slate-400 mb-2">
                        Merci {customerName}, votre demande de réservation a bien été reçue.
                    </p>
                    <p className="text-slate-500 text-sm">
                        {format(selectedDate!, 'EEEE d MMMM yyyy', { locale: fr })} à {selectedTime} pour {partySize} personne{partySize > 1 ? 's' : ''}
                    </p>
                    {settings.confirmation_message && (
                        <p className="text-slate-400 mt-6 text-sm italic">
                            {settings.confirmation_message}
                        </p>
                    )}
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen" style={{ backgroundColor: settings.secondary_color }}>
            {/* Header */}
            <header className="border-b border-white/10 py-8">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h1 className="text-4xl font-bold text-white mb-2">{restaurant.name}</h1>
                    {settings.welcome_message && (
                        <p className="text-slate-400">{settings.welcome_message}</p>
                    )}
                    <div className="flex justify-center gap-4 mt-4 text-sm text-slate-500">
                        {(settings.display_address || restaurant.address) && (
                            <span className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {settings.display_address || restaurant.address}
                            </span>
                        )}
                        {(settings.display_phone || restaurant.phone) && (
                            <span className="flex items-center gap-1">
                                <Phone className="h-4 w-4" />
                                {settings.display_phone || restaurant.phone}
                            </span>
                        )}
                    </div>
                </div>
            </header>

            {/* Booking Form */}
            <main className="max-w-2xl mx-auto px-6 py-12">
                <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-8">
                    <h2 className="text-2xl font-bold text-white mb-6 text-center">
                        Réserver une table
                    </h2>

                    {/* Progress */}
                    <div className="flex items-center justify-center gap-2 mb-8">
                        {[1, 2, 3].map((s) => (
                            <div
                                key={s}
                                className={`h-2 w-16 rounded-full transition-colors ${
                                    step >= s ? '' : 'bg-white/10'
                                }`}
                                style={{
                                    backgroundColor: step >= s ? settings.primary_color : undefined
                                }}
                            />
                        ))}
                    </div>

                    {/* Step 1: Date & Service */}
                    {step === 1 && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-6"
                        >
                            <div>
                                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-3">
                                    Nombre de personnes
                                </label>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setPartySize(Math.max(settings.min_party_size, partySize - 1))}
                                        className="w-12 h-12 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors font-bold text-xl"
                                    >
                                        -
                                    </button>
                                    <div className="flex-1 text-center">
                                        <span className="text-3xl font-bold text-white">{partySize}</span>
                                        <span className="text-slate-500 ml-2">personne{partySize > 1 ? 's' : ''}</span>
                                    </div>
                                    <button
                                        onClick={() => setPartySize(Math.min(settings.max_party_size, partySize + 1))}
                                        className="w-12 h-12 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors font-bold text-xl"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-3">
                                    Choisir une date
                                </label>
                                <div className="grid grid-cols-4 md:grid-cols-7 gap-2 max-h-48 overflow-y-auto">
                                    {getAvailableDates().slice(0, 14).map((date) => {
                                        const isSelected = selectedDate && format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                                        const hasServices = getAvailableServices(date).length > 0;

                                        return (
                                            <button
                                                key={date.toISOString()}
                                                onClick={() => {
                                                    setSelectedDate(date);
                                                    setSelectedService(null);
                                                }}
                                                disabled={!hasServices}
                                                className={`p-3 rounded-lg text-center transition-all ${
                                                    isSelected
                                                        ? 'text-black'
                                                        : hasServices
                                                        ? 'bg-white/5 text-white hover:bg-white/10'
                                                        : 'bg-white/5 text-slate-600 cursor-not-allowed'
                                                }`}
                                                style={{
                                                    backgroundColor: isSelected ? settings.primary_color : undefined
                                                }}
                                            >
                                                <div className="text-[10px] uppercase">
                                                    {format(date, 'EEE', { locale: fr })}
                                                </div>
                                                <div className="text-lg font-bold">
                                                    {format(date, 'd')}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {selectedDate && (
                                <div>
                                    <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-3">
                                        Choisir un service
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {getAvailableServices(selectedDate).map((service) => (
                                            <button
                                                key={service.id}
                                                onClick={() => setSelectedService(service)}
                                                className={`p-4 rounded-lg text-left transition-all ${
                                                    selectedService?.id === service.id
                                                        ? 'text-black'
                                                        : 'bg-white/5 text-white hover:bg-white/10'
                                                }`}
                                                style={{
                                                    backgroundColor: selectedService?.id === service.id ? settings.primary_color : undefined
                                                }}
                                            >
                                                <div className="font-bold">{service.name}</div>
                                                <div className="text-sm opacity-70">
                                                    {service.start_time.slice(0, 5)} - {service.end_time.slice(0, 5)}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={() => setStep(2)}
                                disabled={!selectedDate || !selectedService}
                                className="w-full py-4 rounded-lg font-bold uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{
                                    backgroundColor: settings.primary_color,
                                    color: settings.secondary_color
                                }}
                            >
                                Continuer
                            </button>
                        </motion.div>
                    )}

                    {/* Step 2: Time */}
                    {step === 2 && selectedService && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-6"
                        >
                            <div>
                                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-3">
                                    Choisir une heure
                                </label>
                                <div className="grid grid-cols-4 gap-2">
                                    {getTimeSlots(selectedService).map((time) => (
                                        <button
                                            key={time}
                                            onClick={() => setSelectedTime(time)}
                                            className={`p-3 rounded-lg font-mono transition-all ${
                                                selectedTime === time
                                                    ? 'text-black'
                                                    : 'bg-white/5 text-white hover:bg-white/10'
                                            }`}
                                            style={{
                                                backgroundColor: selectedTime === time ? settings.primary_color : undefined
                                            }}
                                        >
                                            {time}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setStep(1)}
                                    className="flex-1 py-4 bg-white/5 border border-white/10 rounded-lg text-white font-bold uppercase tracking-widest hover:bg-white/10 transition-colors"
                                >
                                    Retour
                                </button>
                                <button
                                    onClick={() => setStep(3)}
                                    disabled={!selectedTime}
                                    className="flex-1 py-4 rounded-lg font-bold uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{
                                        backgroundColor: settings.primary_color,
                                        color: settings.secondary_color
                                    }}
                                >
                                    Continuer
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 3: Contact Info */}
                    {step === 3 && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-4"
                        >
                            <div>
                                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                                    Nom complet *
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                                    <input
                                        type="text"
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2"
                                        style={{ '--tw-ring-color': settings.primary_color } as any}
                                        placeholder="Jean Dupont"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                                    Téléphone *
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                                    <input
                                        type="tel"
                                        value={customerPhone}
                                        onChange={(e) => setCustomerPhone(e.target.value)}
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2"
                                        style={{ '--tw-ring-color': settings.primary_color } as any}
                                        placeholder="06 12 34 56 78"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                                    Email (optionnel)
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                                    <input
                                        type="email"
                                        value={customerEmail}
                                        onChange={(e) => setCustomerEmail(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2"
                                        style={{ '--tw-ring-color': settings.primary_color } as any}
                                        placeholder="jean@email.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                                    Notes (optionnel)
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={3}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 resize-none"
                                    style={{ '--tw-ring-color': settings.primary_color } as any}
                                    placeholder="Allergie, anniversaire, demande spéciale..."
                                />
                            </div>

                            {/* Summary */}
                            <div className="bg-white/5 rounded-lg p-4 mt-6">
                                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Récapitulatif</h3>
                                <div className="text-sm text-slate-400 space-y-1">
                                    <p>{format(selectedDate!, 'EEEE d MMMM yyyy', { locale: fr })}</p>
                                    <p>{selectedService?.name} à {selectedTime}</p>
                                    <p>{partySize} personne{partySize > 1 ? 's' : ''}</p>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setStep(2)}
                                    className="flex-1 py-4 bg-white/5 border border-white/10 rounded-lg text-white font-bold uppercase tracking-widest hover:bg-white/10 transition-colors"
                                >
                                    Retour
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting || !customerName || !customerPhone}
                                    className="flex-1 py-4 rounded-lg font-bold uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                    style={{
                                        backgroundColor: settings.primary_color,
                                        color: settings.secondary_color
                                    }}
                                >
                                    {submitting ? (
                                        <div className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        'Confirmer'
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </div>
            </main>
        </div>
    );
}
