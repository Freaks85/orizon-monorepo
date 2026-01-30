"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CalendarRange, Check, X, Loader2, Mail, Lock, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface InvitationData {
    id: string;
    email: string;
    role: string;
    restaurant_name: string;
    invited_by_name: string;
    expires_at: string;
    accepted: boolean;
}

export default function InvitationPage() {
    const params = useParams();
    const router = useRouter();
    const token = params.token as string;

    const [invitation, setInvitation] = useState<InvitationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        fetchInvitation();
    }, [token]);

    const fetchInvitation = async () => {
        try {
            const { data, error } = await supabase
                .from('invitations')
                .select(`
                    id,
                    email,
                    role,
                    expires_at,
                    accepted_at,
                    restaurants:restaurant_id (name),
                    invited_by:invited_by (
                        raw_user_meta_data
                    )
                `)
                .eq('token', token)
                .is('accepted_at', null)
                .single();

            if (error || !data) {
                setError('Invitation invalide ou expirée');
                setLoading(false);
                return;
            }

            // Check if expired
            const expiresAt = new Date(data.expires_at);
            if (expiresAt < new Date()) {
                setError('Cette invitation a expiré');
                setLoading(false);
                return;
            }

            // Handle invited_by which can be an array or object
            const invitedByData = Array.isArray(data.invited_by) ? data.invited_by[0] : data.invited_by;
            const invitedByName = invitedByData?.raw_user_meta_data?.first_name && invitedByData?.raw_user_meta_data?.last_name
                ? `${invitedByData.raw_user_meta_data.first_name} ${invitedByData.raw_user_meta_data.last_name}`
                : 'Un membre de l\'équipe';

            setInvitation({
                id: data.id,
                email: data.email,
                role: data.role,
                restaurant_name: (data.restaurants as any)?.name || 'le restaurant',
                invited_by_name: invitedByName,
                expires_at: data.expires_at,
                accepted: !!data.accepted_at
            });

        } catch (err) {
            console.error('Error fetching invitation:', err);
            setError('Une erreur est survenue');
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptInvitation = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!firstName || !lastName || !password) {
            setError('Tous les champs sont requis');
            return;
        }

        if (password !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas');
            return;
        }

        if (password.length < 6) {
            setError('Le mot de passe doit contenir au moins 6 caractères');
            return;
        }

        setSubmitting(true);

        try {
            // Create user account
            const { data: authData, error: signUpError } = await supabase.auth.signUp({
                email: invitation!.email,
                password: password,
                options: {
                    data: {
                        first_name: firstName,
                        last_name: lastName,
                        role: invitation!.role,
                        invitation_token: token
                    },
                    emailRedirectTo: `${window.location.origin}/dashboard/cahier`
                }
            });

            if (signUpError) {
                setError(signUpError.message);
                setSubmitting(false);
                return;
            }

            // Wait a bit for the trigger to create restaurant_member
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Mark invitation as accepted
            const { error: updateError } = await supabase
                .from('invitations')
                .update({ accepted_at: new Date().toISOString() })
                .eq('id', invitation!.id);

            if (updateError) {
                console.error('Error updating invitation:', updateError);
            }

            // Redirect to login with success message
            router.push('/login?invitation_accepted=true');

        } catch (err: any) {
            console.error('Error accepting invitation:', err);
            setError('Une erreur est survenue lors de la création du compte');
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-rich-black flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-[#ff6b00] animate-spin" />
            </div>
        );
    }

    if (error && !invitation) {
        return (
            <div className="min-h-screen bg-rich-black flex items-center justify-center p-6">
                <div className="max-w-md w-full text-center">
                    <X className="h-16 w-16 text-red-500 mx-auto mb-6" />
                    <h1 className="font-display text-3xl text-white uppercase mb-4">
                        Invitation invalide
                    </h1>
                    <p className="text-slate-400 mb-8">{error}</p>
                    <Link
                        href="/"
                        className="inline-block px-6 py-3 bg-[#ff6b00] text-black font-bold text-sm uppercase tracking-widest rounded-lg hover:bg-[#ff8533] transition-colors"
                    >
                        Retour à l'accueil
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-rich-black">
            <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none" />
            <div className="absolute inset-0 noise-overlay pointer-events-none" />

            <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-md w-full"
                >
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <div className="flex items-center justify-center gap-2 mb-4">
                                <div className="w-10 h-10 bg-[#ff6b00] rounded-lg flex items-center justify-center">
                                    <CalendarRange className="h-6 w-6 text-black" />
                                </div>
                                <span className="font-display font-bold text-2xl tracking-wider text-white uppercase">
                                    Orizons<span className="text-[#ff6b00]">Resa</span>
                                </span>
                            </div>
                            <h1 className="font-display text-2xl text-white uppercase tracking-wider mb-2">
                                Invitation à rejoindre
                            </h1>
                            <p className="text-[#ff6b00] font-bold text-lg">
                                {invitation?.restaurant_name}
                            </p>
                        </div>

                        {/* Invitation Info */}
                        <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-6">
                            <p className="text-slate-300 text-sm mb-2">
                                <span className="text-slate-500">Invité par:</span> {invitation?.invited_by_name}
                            </p>
                            <p className="text-slate-300 text-sm mb-2">
                                <span className="text-slate-500">Rôle:</span>{' '}
                                <span className="capitalize">{invitation?.role}</span>
                            </p>
                            <p className="text-slate-300 text-sm">
                                <span className="text-slate-500">Email:</span> {invitation?.email}
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleAcceptInvitation} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                                        Prénom *
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                                        <input
                                            type="text"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            required
                                            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#ff6b00] transition-colors"
                                            placeholder="Jean"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                                        Nom *
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                                        <input
                                            type="text"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            required
                                            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#ff6b00] transition-colors"
                                            placeholder="Dupont"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                                    Mot de passe *
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        minLength={6}
                                        className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#ff6b00] transition-colors"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                                    Confirmer le mot de passe *
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        minLength={6}
                                        className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#ff6b00] transition-colors"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                                    <p className="text-red-400 text-sm">{error}</p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-4 bg-gradient-to-r from-[#ff6b00] to-[#ff8533] text-black font-bold text-sm uppercase tracking-widest rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Création du compte...
                                    </>
                                ) : (
                                    <>
                                        <Check className="h-4 w-4" />
                                        Accepter l'invitation
                                    </>
                                )}
                            </button>
                        </form>

                        <p className="text-xs text-slate-500 text-center mt-6">
                            En acceptant, vous aurez accès au dashboard de {invitation?.restaurant_name}
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
