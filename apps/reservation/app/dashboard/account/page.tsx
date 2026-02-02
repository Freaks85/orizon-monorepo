"use client";

import { useState, useEffect, useRef } from 'react';
import { User, Lock, Building2, Save, AlertCircle, Check, X, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRestaurant } from '@/contexts/restaurant-context';
import { usePermissions } from '@/contexts/permission-context';
import { motion, AnimatePresence } from 'framer-motion';

interface UserData {
    firstName: string;
    lastName: string;
    email: string;
}

interface RestaurantData {
    name: string;
    address: string;
    phone: string;
    email: string;
    siret: string;
}

interface VerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'email_change' | 'password_change';
    onSuccess: () => void;
    newEmail?: string;
    newPassword?: string;
    userEmail: string;
}

function VerificationModal({ isOpen, onClose, type, onSuccess, newEmail, newPassword, userEmail }: VerificationModalProps) {
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [codeSent, setCodeSent] = useState(false);
    const [sendingCode, setSendingCode] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setCode(['', '', '', '', '', '']);
            setError('');
            setCodeSent(false);
            setCountdown(0);
        }
    }, [isOpen]);

    // Countdown timer
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
        return undefined;
    }, [countdown]);

    const sendCode = async () => {
        setSendingCode(true);
        setError('');

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setError('Session expirée');
                setSendingCode(false);
                return;
            }

            const response = await fetch('/api/account/send-code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    type,
                    newEmail: type === 'email_change' ? newEmail : undefined
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors de l\'envoi du code');
            }

            setCodeSent(true);
            setCountdown(60);
            setTimeout(() => inputRefs.current[0]?.focus(), 100);
        } catch (err: any) {
            setError(err.message || 'Une erreur est survenue');
        } finally {
            setSendingCode(false);
        }
    };

    const handleCodeChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return; // Only digits

        const newCode = [...code];
        newCode[index] = value.slice(-1); // Only last character
        setCode(newCode);

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        const newCode = [...code];
        for (let i = 0; i < pastedData.length; i++) {
            newCode[i] = pastedData[i];
        }
        setCode(newCode);
        if (pastedData.length === 6) {
            inputRefs.current[5]?.focus();
        }
    };

    const verifyCode = async () => {
        const fullCode = code.join('');
        if (fullCode.length !== 6) {
            setError('Veuillez entrer le code complet');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setError('Session expirée');
                return;
            }

            const response = await fetch('/api/account/verify-code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    code: fullCode,
                    type,
                    newPassword: type === 'password_change' ? newPassword : undefined
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Code invalide');
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message);
            setCode(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6 w-full max-w-md"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-[#ff6b00]/10 rounded-lg">
                                <Mail className="h-5 w-5 text-[#ff6b00]" />
                            </div>
                            <h2 className="font-display text-lg text-white uppercase tracking-wider">
                                Vérification
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-white transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {!codeSent ? (
                        // Step 1: Send code
                        <div className="text-center">
                            <p className="text-slate-400 mb-6">
                                Pour {type === 'email_change' ? 'changer votre email' : 'changer votre mot de passe'}, nous allons envoyer un code de vérification à :
                            </p>
                            <p className="text-white font-mono text-lg mb-6 bg-white/5 py-3 px-4 rounded-lg">
                                {userEmail}
                            </p>
                            <button
                                onClick={sendCode}
                                disabled={sendingCode}
                                className="w-full bg-[#ff6b00] text-black font-bold text-xs uppercase tracking-widest py-4 rounded-lg hover:bg-white transition-colors disabled:opacity-50"
                            >
                                {sendingCode ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                        Envoi en cours...
                                    </div>
                                ) : (
                                    'Envoyer le code'
                                )}
                            </button>
                        </div>
                    ) : (
                        // Step 2: Enter code
                        <div>
                            <p className="text-slate-400 text-center mb-6">
                                Entrez le code à 6 chiffres envoyé à <span className="text-white">{userEmail}</span>
                            </p>

                            {/* Code inputs */}
                            <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
                                {code.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={(el) => { inputRefs.current[index] = el; }}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleCodeChange(index, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(index, e)}
                                        className="w-12 h-14 text-center text-2xl font-mono font-bold bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ff6b00]/50 focus:border-[#ff6b00]/50"
                                    />
                                ))}
                            </div>

                            {error && (
                                <div className="flex items-center justify-center gap-2 text-red-400 text-sm mb-4">
                                    <AlertCircle className="h-4 w-4" />
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={verifyCode}
                                disabled={loading || code.join('').length !== 6}
                                className="w-full bg-[#ff6b00] text-black font-bold text-xs uppercase tracking-widest py-4 rounded-lg hover:bg-white transition-colors disabled:opacity-50 mb-4"
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                        Vérification...
                                    </div>
                                ) : (
                                    'Vérifier le code'
                                )}
                            </button>

                            {/* Resend code */}
                            <p className="text-center text-sm text-slate-500">
                                Vous n'avez pas reçu le code ?{' '}
                                {countdown > 0 ? (
                                    <span className="text-slate-400">Renvoyer dans {countdown}s</span>
                                ) : (
                                    <button
                                        onClick={sendCode}
                                        disabled={sendingCode}
                                        className="text-[#ff6b00] hover:underline"
                                    >
                                        Renvoyer
                                    </button>
                                )}
                            </p>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export default function AccountPage() {
    const { restaurant, refreshRestaurant } = useRestaurant();
    const { role } = usePermissions();
    const isOwner = role === 'owner';

    // User data
    const [userData, setUserData] = useState<UserData>({
        firstName: '',
        lastName: '',
        email: ''
    });
    const [originalEmail, setOriginalEmail] = useState('');
    const [userLoading, setUserLoading] = useState(false);
    const [userSuccess, setUserSuccess] = useState(false);
    const [userError, setUserError] = useState('');

    // Password
    const [passwordData, setPasswordData] = useState({
        current: '',
        new: '',
        confirm: ''
    });
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordSuccess, setPasswordSuccess] = useState(false);
    const [passwordError, setPasswordError] = useState('');

    // Restaurant data (owner only)
    const [restaurantData, setRestaurantData] = useState<RestaurantData>({
        name: '',
        address: '',
        phone: '',
        email: '',
        siret: ''
    });
    const [restaurantLoading, setRestaurantLoading] = useState(false);
    const [restaurantSuccess, setRestaurantSuccess] = useState(false);
    const [restaurantError, setRestaurantError] = useState('');

    // Verification modal
    const [verificationModal, setVerificationModal] = useState<{
        isOpen: boolean;
        type: 'email_change' | 'password_change';
        newEmail?: string;
        newPassword?: string;
    }>({
        isOpen: false,
        type: 'email_change'
    });

    // Charger les données utilisateur
    useEffect(() => {
        const loadUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserData({
                    firstName: user.user_metadata?.first_name || '',
                    lastName: user.user_metadata?.last_name || '',
                    email: user.email || ''
                });
                setOriginalEmail(user.email || '');
            }
        };
        loadUser();
    }, []);

    // Charger les données restaurant (owner only)
    useEffect(() => {
        if (restaurant && isOwner) {
            setRestaurantData({
                name: restaurant.name || '',
                address: restaurant.address || '',
                phone: restaurant.phone || '',
                email: restaurant.email || '',
                siret: restaurant.siret || ''
            });
        }
    }, [restaurant, isOwner]);

    // Sauvegarder les infos utilisateur (nom, prénom uniquement)
    const handleSaveUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setUserLoading(true);
        setUserError('');
        setUserSuccess(false);

        try {
            // Mettre à jour nom et prénom
            const { error } = await supabase.auth.updateUser({
                data: {
                    first_name: userData.firstName,
                    last_name: userData.lastName
                }
            });

            if (error) throw error;

            // Si l'email a changé, ouvrir la modal de vérification
            if (userData.email !== originalEmail) {
                setVerificationModal({
                    isOpen: true,
                    type: 'email_change',
                    newEmail: userData.email
                });
                setUserLoading(false);
                return;
            }

            setUserSuccess(true);
            setTimeout(() => setUserSuccess(false), 3000);
        } catch (err: any) {
            setUserError(err.message || 'Erreur lors de la mise à jour');
        } finally {
            setUserLoading(false);
        }
    };

    // Demander changement de mot de passe
    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess(false);

        if (!passwordData.current) {
            setPasswordError('Veuillez entrer votre mot de passe actuel');
            return;
        }

        if (passwordData.new !== passwordData.confirm) {
            setPasswordError('Les nouveaux mots de passe ne correspondent pas');
            return;
        }

        if (passwordData.new.length < 6) {
            setPasswordError('Le nouveau mot de passe doit contenir au moins 6 caractères');
            return;
        }

        if (passwordData.new === passwordData.current) {
            setPasswordError('Le nouveau mot de passe doit être différent de l\'ancien');
            return;
        }

        setPasswordLoading(true);

        try {
            // Vérifier l'ancien mot de passe
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: originalEmail,
                password: passwordData.current
            });

            if (signInError) {
                setPasswordError('Mot de passe actuel incorrect');
                setPasswordLoading(false);
                return;
            }

            // Ouvrir la modal de vérification
            setVerificationModal({
                isOpen: true,
                type: 'password_change',
                newPassword: passwordData.new
            });
        } catch (err: any) {
            setPasswordError(err.message || 'Erreur');
        } finally {
            setPasswordLoading(false);
        }
    };

    // Callback après vérification réussie
    const handleVerificationSuccess = () => {
        if (verificationModal.type === 'email_change') {
            setOriginalEmail(userData.email);
            setUserSuccess(true);
            setTimeout(() => setUserSuccess(false), 3000);
        } else {
            setPasswordSuccess(true);
            setPasswordData({ current: '', new: '', confirm: '' });
            setTimeout(() => setPasswordSuccess(false), 3000);
        }
    };

    // Sauvegarder les infos restaurant
    const handleSaveRestaurant = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!restaurant?.id) return;

        setRestaurantLoading(true);
        setRestaurantError('');
        setRestaurantSuccess(false);

        try {
            const { error } = await supabase
                .from('restaurants')
                .update({
                    name: restaurantData.name,
                    address: restaurantData.address,
                    phone: restaurantData.phone,
                    email: restaurantData.email,
                    siret: restaurantData.siret,
                    updated_at: new Date().toISOString()
                })
                .eq('id', restaurant.id);

            if (error) throw error;

            setRestaurantSuccess(true);
            refreshRestaurant?.();
            setTimeout(() => setRestaurantSuccess(false), 3000);
        } catch (err: any) {
            setRestaurantError(err.message || 'Erreur lors de la mise à jour');
        } finally {
            setRestaurantLoading(false);
        }
    };

    const inputClass = "w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#ff6b00]/50 focus:border-[#ff6b00]/50 font-mono text-sm";
    const labelClass = "block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2";

    return (
        <>
            <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="font-display text-2xl md:text-3xl text-white uppercase tracking-wider">
                        Mon compte
                    </h1>
                    <p className="text-slate-500 text-sm font-mono mt-2">
                        Gérez vos informations personnelles et vos paramètres de sécurité
                    </p>
                </div>

                <div className="space-y-6">
                    {/* Informations personnelles */}
                    <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-[#ff6b00]/10 rounded-lg">
                                <User className="h-5 w-5 text-[#ff6b00]" />
                            </div>
                            <h2 className="font-display text-lg text-white uppercase tracking-wider">
                                Informations personnelles
                            </h2>
                        </div>

                        <form onSubmit={handleSaveUser} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Prénom</label>
                                    <input
                                        type="text"
                                        value={userData.firstName}
                                        onChange={(e) => setUserData({ ...userData, firstName: e.target.value })}
                                        className={inputClass}
                                        placeholder="Votre prénom"
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Nom</label>
                                    <input
                                        type="text"
                                        value={userData.lastName}
                                        onChange={(e) => setUserData({ ...userData, lastName: e.target.value })}
                                        className={inputClass}
                                        placeholder="Votre nom"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>Email</label>
                                <input
                                    type="email"
                                    value={userData.email}
                                    onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                                    className={inputClass}
                                    placeholder="votre@email.com"
                                />
                                {userData.email !== originalEmail && (
                                    <p className="text-[#ff6b00] text-xs mt-1 flex items-center gap-1">
                                        <Mail className="h-3 w-3" />
                                        Un code de vérification sera envoyé pour confirmer le changement
                                    </p>
                                )}
                            </div>

                            {userError && (
                                <div className="flex items-center gap-2 text-red-400 text-sm">
                                    <AlertCircle className="h-4 w-4" />
                                    {userError}
                                </div>
                            )}

                            {userSuccess && (
                                <div className="flex items-center gap-2 text-green-400 text-sm">
                                    <Check className="h-4 w-4" />
                                    Informations mises à jour
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={userLoading}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-[#ff6b00] text-black font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-white transition-colors disabled:opacity-50"
                            >
                                {userLoading ? (
                                    <div className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4" />
                                )}
                                Enregistrer
                            </button>
                        </form>
                    </div>

                    {/* Sécurité */}
                    <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-[#ff6b00]/10 rounded-lg">
                                <Lock className="h-5 w-5 text-[#ff6b00]" />
                            </div>
                            <h2 className="font-display text-lg text-white uppercase tracking-wider">
                                Sécurité
                            </h2>
                        </div>

                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <div>
                                <label className={labelClass}>Mot de passe actuel</label>
                                <input
                                    type="password"
                                    value={passwordData.current}
                                    onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                                    className={inputClass}
                                    placeholder="••••••••"
                                />
                            </div>

                            <div>
                                <label className={labelClass}>Nouveau mot de passe</label>
                                <input
                                    type="password"
                                    value={passwordData.new}
                                    onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                                    className={inputClass}
                                    placeholder="••••••••"
                                    minLength={6}
                                />
                            </div>

                            <div>
                                <label className={labelClass}>Confirmer le nouveau mot de passe</label>
                                <input
                                    type="password"
                                    value={passwordData.confirm}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                                    className={inputClass}
                                    placeholder="••••••••"
                                    minLength={6}
                                />
                            </div>

                            <p className="text-slate-500 text-xs flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                Un code de vérification sera envoyé par email pour confirmer le changement
                            </p>

                            {passwordError && (
                                <div className="flex items-center gap-2 text-red-400 text-sm">
                                    <AlertCircle className="h-4 w-4" />
                                    {passwordError}
                                </div>
                            )}

                            {passwordSuccess && (
                                <div className="flex items-center gap-2 text-green-400 text-sm">
                                    <Check className="h-4 w-4" />
                                    Mot de passe modifié
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={passwordLoading || !passwordData.current || !passwordData.new || !passwordData.confirm}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50 border border-white/10"
                            >
                                {passwordLoading ? (
                                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <Lock className="h-4 w-4" />
                                )}
                                Changer le mot de passe
                            </button>
                        </form>
                    </div>

                    {/* Restaurant (owner only) */}
                    {isOwner && (
                        <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-[#ff6b00]/10 rounded-lg">
                                    <Building2 className="h-5 w-5 text-[#ff6b00]" />
                                </div>
                                <h2 className="font-display text-lg text-white uppercase tracking-wider">
                                    Informations du restaurant
                                </h2>
                            </div>

                            <form onSubmit={handleSaveRestaurant} className="space-y-4">
                                <div>
                                    <label className={labelClass}>Nom du restaurant</label>
                                    <input
                                        type="text"
                                        value={restaurantData.name}
                                        onChange={(e) => setRestaurantData({ ...restaurantData, name: e.target.value })}
                                        className={inputClass}
                                        placeholder="Le nom de votre établissement"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className={labelClass}>Adresse</label>
                                    <input
                                        type="text"
                                        value={restaurantData.address}
                                        onChange={(e) => setRestaurantData({ ...restaurantData, address: e.target.value })}
                                        className={inputClass}
                                        placeholder="123 rue de la Paix, 75001 Paris"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>Téléphone</label>
                                        <input
                                            type="tel"
                                            value={restaurantData.phone}
                                            onChange={(e) => setRestaurantData({ ...restaurantData, phone: e.target.value })}
                                            className={inputClass}
                                            placeholder="01 23 45 67 89"
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Email</label>
                                        <input
                                            type="email"
                                            value={restaurantData.email}
                                            onChange={(e) => setRestaurantData({ ...restaurantData, email: e.target.value })}
                                            className={inputClass}
                                            placeholder="contact@restaurant.com"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className={labelClass}>SIRET</label>
                                    <input
                                        type="text"
                                        value={restaurantData.siret}
                                        onChange={(e) => setRestaurantData({ ...restaurantData, siret: e.target.value })}
                                        className={inputClass}
                                        placeholder="123 456 789 00001"
                                    />
                                </div>

                                {restaurantError && (
                                    <div className="flex items-center gap-2 text-red-400 text-sm">
                                        <AlertCircle className="h-4 w-4" />
                                        {restaurantError}
                                    </div>
                                )}

                                {restaurantSuccess && (
                                    <div className="flex items-center gap-2 text-green-400 text-sm">
                                        <Check className="h-4 w-4" />
                                        Informations du restaurant mises à jour
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={restaurantLoading}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#ff6b00] text-black font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-white transition-colors disabled:opacity-50"
                                >
                                    {restaurantLoading ? (
                                        <div className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Save className="h-4 w-4" />
                                    )}
                                    Enregistrer
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>

            {/* Verification Modal */}
            <VerificationModal
                isOpen={verificationModal.isOpen}
                onClose={() => setVerificationModal({ ...verificationModal, isOpen: false })}
                type={verificationModal.type}
                onSuccess={handleVerificationSuccess}
                newEmail={verificationModal.newEmail}
                newPassword={verificationModal.newPassword}
                userEmail={originalEmail}
            />
        </>
    );
}
