"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Users,
    Mail,
    UserPlus,
    Shield,
    Trash2,
    Check,
    X,
    Loader2,
    Copy,
    ExternalLink,
    AlertCircle
} from 'lucide-react';
import { useRestaurant } from '@/contexts/restaurant-context';
import { usePermissions } from '@/contexts/permission-context';
import { supabase } from '@/lib/supabase';

interface TeamMember {
    id: string;
    user_id: string;
    role: string;
    permissions: any;
    created_at: string;
    user: {
        email: string;
        raw_user_meta_data: {
            first_name?: string;
            last_name?: string;
        };
    };
}

interface Invitation {
    id: string;
    email: string;
    role: string;
    token: string;
    expires_at: string;
    created_at: string;
}

export default function TeamPage() {
    const { restaurant } = useRestaurant();
    const { hasPermission, role } = usePermissions();
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [loading, setLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);

    // Invite form state
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('staff');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (restaurant?.id) {
            fetchTeamData();
        }
    }, [restaurant?.id]);

    const fetchTeamData = async () => {
        if (!restaurant?.id) return;

        try {
            // Fetch team members using RPC function to bypass auth.users JOIN issue
            const { data: membersData, error: membersError } = await supabase
                .rpc('get_team_members', { p_restaurant_id: restaurant.id });

            if (membersError) {
                console.error('Error fetching team members:', membersError);
            }

            // Transform data to match expected format
            const transformedMembers = (membersData || []).map((member: any) => ({
                id: member.id,
                user_id: member.user_id,
                role: member.role,
                permissions: member.permissions,
                created_at: member.created_at,
                user: {
                    email: member.email,
                    raw_user_meta_data: {
                        first_name: member.first_name,
                        last_name: member.last_name
                    }
                }
            }));

            setMembers(transformedMembers);

            // Fetch pending invitations if user has permission
            if (hasPermission('team', 'invite')) {
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    const response = await fetch(
                        `/api/invitations?restaurant_id=${restaurant.id}`,
                        {
                            headers: {
                                'Authorization': `Bearer ${session.access_token}`
                            }
                        }
                    );

                    if (response.ok) {
                        const data = await response.json();
                        setInvitations(data.invitations || []);
                    }
                }
            }
        } catch (err) {
            console.error('Error fetching team data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSubmitting(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setError('Vous devez être connecté');
                setSubmitting(false);
                return;
            }

            const response = await fetch('/api/invitations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    email: inviteEmail,
                    role: inviteRole,
                    restaurant_id: restaurant!.id
                })
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Erreur lors de l\'envoi de l\'invitation');
                setSubmitting(false);
                return;
            }

            setSuccess('Invitation envoyée avec succès !');
            setInviteEmail('');
            setInviteRole('staff');

            // Refresh invitations list
            await fetchTeamData();

            // Close modal after 2 seconds
            setTimeout(() => {
                setShowInviteModal(false);
                setSuccess('');
            }, 2000);

        } catch (err) {
            console.error('Error sending invitation:', err);
            setError('Une erreur est survenue');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCopyInviteLink = async (token: string) => {
        const link = `${window.location.origin}/invitation/${token}`;
        await navigator.clipboard.writeText(link);
        setSuccess('Lien copié dans le presse-papiers !');
        setTimeout(() => setSuccess(''), 3000);
    };

    const handleDeleteInvitation = async (id: string) => {
        if (!confirm('Êtes-vous sûr de vouloir annuler cette invitation ?')) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const response = await fetch(`/api/invitations?id=${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });

            if (response.ok) {
                setSuccess('Invitation annulée');
                await fetchTeamData();
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            console.error('Error deleting invitation:', err);
        }
    };

    const handleRemoveMember = async (memberId: string, memberEmail: string) => {
        if (!confirm(`Êtes-vous sûr de vouloir retirer ${memberEmail} de l'équipe ?`)) return;

        try {
            const { error } = await supabase
                .from('restaurant_members')
                .delete()
                .eq('id', memberId);

            if (error) throw error;

            setSuccess('Membre retiré de l\'équipe');
            await fetchTeamData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Error removing member:', err);
            setError('Erreur lors de la suppression');
        }
    };

    if (!hasPermission('team', 'view')) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
                <Shield className="h-16 w-16 text-red-500/20 mb-6" />
                <h1 className="font-display text-3xl text-white uppercase mb-4">
                    Accès Refusé
                </h1>
                <p className="text-slate-400 text-center max-w-md">
                    Vous n'avez pas les permissions nécessaires pour accéder à la gestion d'équipe.
                </p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 text-[#ff6b00] animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-display text-3xl text-white uppercase tracking-wider">
                        Gestion d'équipe
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Gérez les membres de votre équipe et leurs permissions
                    </p>
                </div>

                {hasPermission('team', 'invite') && (
                    <button
                        onClick={() => setShowInviteModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#ff6b00] to-[#ff8533] text-black font-bold text-sm uppercase tracking-wider rounded-lg hover:opacity-90 transition-opacity"
                    >
                        <UserPlus className="h-4 w-4" />
                        Inviter un membre
                    </button>
                )}
            </div>

            {/* Success/Error Messages */}
            {success && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-500" />
                    <p className="text-green-400">{success}</p>
                </div>
            )}

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <p className="text-red-400">{error}</p>
                </div>
            )}

            {/* Team Members */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h2 className="font-display text-xl text-white uppercase mb-4 flex items-center gap-2">
                    <Users className="h-5 w-5 text-[#ff6b00]" />
                    Membres de l'équipe ({members.length})
                </h2>

                <div className="space-y-3">
                    {members.map((member) => {
                        const fullName = member.user?.raw_user_meta_data?.first_name && member.user?.raw_user_meta_data?.last_name
                            ? `${member.user.raw_user_meta_data.first_name} ${member.user.raw_user_meta_data.last_name}`
                            : null;

                        const canRemove = hasPermission('team', 'manage') &&
                                        member.role !== 'owner' &&
                                        role !== 'staff';

                        return (
                            <div
                                key={member.id}
                                className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-[#ff6b00]/20 flex items-center justify-center">
                                        <span className="text-[#ff6b00] font-bold text-sm uppercase">
                                            {(fullName || member.user?.email || 'U')[0]}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">
                                            {fullName || member.user?.email}
                                        </p>
                                        <p className="text-slate-400 text-sm">
                                            {member.user?.email}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <span className={`px-3 py-1 rounded-full text-xs font-mono uppercase ${
                                        member.role === 'owner' ? 'bg-purple-500/20 text-purple-400' :
                                        member.role === 'admin' ? 'bg-blue-500/20 text-blue-400' :
                                        member.role === 'manager' ? 'bg-green-500/20 text-green-400' :
                                        'bg-slate-500/20 text-slate-400'
                                    }`}>
                                        {member.role}
                                    </span>

                                    {canRemove && (
                                        <button
                                            onClick={() => handleRemoveMember(member.id, member.user?.email)}
                                            className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Pending Invitations */}
            {hasPermission('team', 'invite') && invitations.length > 0 && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <h2 className="font-display text-xl text-white uppercase mb-4 flex items-center gap-2">
                        <Mail className="h-5 w-5 text-[#ff6b00]" />
                        Invitations en attente ({invitations.length})
                    </h2>

                    <div className="space-y-3">
                        {invitations.map((invitation) => (
                            <div
                                key={invitation.id}
                                className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg"
                            >
                                <div>
                                    <p className="text-white font-medium">{invitation.email}</p>
                                    <p className="text-slate-400 text-sm">
                                        Expire le {new Date(invitation.expires_at).toLocaleDateString('fr-FR')}
                                    </p>
                                </div>

                                <div className="flex items-center gap-3">
                                    <span className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs font-mono uppercase">
                                        {invitation.role}
                                    </span>

                                    <button
                                        onClick={() => handleCopyInviteLink(invitation.token)}
                                        className="p-2 text-[#ff6b00] hover:bg-[#ff6b00]/10 rounded-lg transition-colors"
                                        title="Copier le lien d'invitation"
                                    >
                                        <Copy className="h-4 w-4" />
                                    </button>

                                    <button
                                        onClick={() => handleDeleteInvitation(invitation.id)}
                                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                        title="Annuler l'invitation"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Invite Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6 max-w-md w-full"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-display text-xl text-white uppercase">
                                Inviter un membre
                            </h3>
                            <button
                                onClick={() => setShowInviteModal(false)}
                                className="p-2 text-slate-400 hover:text-white transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleInvite} className="space-y-4">
                            <div>
                                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#ff6b00] transition-colors"
                                    placeholder="jean@example.com"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                                    Rôle *
                                </label>
                                <select
                                    value={inviteRole}
                                    onChange={(e) => setInviteRole(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6b00]/50 focus:border-[#ff6b00] transition-all hover:border-[#ff6b00]/30 cursor-pointer"
                                    style={{
                                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ff6b00' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                                        backgroundRepeat: 'no-repeat',
                                        backgroundPosition: 'right 1rem center',
                                        backgroundSize: '12px',
                                        appearance: 'none'
                                    }}
                                >
                                    <option value="staff" className="bg-[#0a0a0a] text-white py-2">👤 Staff - Accès réservations uniquement</option>
                                    <option value="manager" className="bg-[#0a0a0a] text-white py-2">📊 Manager - Accès opérationnel complet</option>
                                    {role === 'owner' && <option value="admin" className="bg-[#0a0a0a] text-white py-2">⚡ Admin - Accès administrateur complet</option>}
                                </select>
                            </div>

                            <div className="bg-[#ff6b00]/10 border border-[#ff6b00]/20 rounded-lg p-3">
                                <p className="text-[#ff6b00] text-sm font-mono">
                                    ✉️ Une invitation sera envoyée à cette adresse email avec un lien pour créer un compte.
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowInviteModal(false)}
                                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 text-white font-bold text-sm uppercase rounded-lg hover:bg-white/10 transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-[#ff6b00] to-[#ff8533] text-black font-bold text-sm uppercase rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Envoi...
                                        </>
                                    ) : (
                                        <>
                                            <Mail className="h-4 w-4" />
                                            Envoyer
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
