"use client";

import { useState } from 'react';
import { useSubscription } from '@/contexts/subscription-context';
import { usePermissions } from '@/contexts/permission-context';
import {
    CreditCard,
    Calendar,
    ExternalLink,
    CheckCircle,
    Sparkles,
    AlertCircle,
    Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function BillingPage() {
    const {
        subscription,
        isTrialing,
        isPastDue,
        isExpired,
        isValid,
        trialDaysRemaining,
        loading,
        startCheckout,
        openBillingPortal
    } = useSubscription();
    const { role } = usePermissions();
    const [actionLoading, setActionLoading] = useState(false);

    const handleManageBilling = async () => {
        setActionLoading(true);
        try {
            await openBillingPortal();
        } catch (error) {
            console.error('Portal error:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleStartSubscription = async () => {
        setActionLoading(true);
        try {
            await startCheckout();
        } catch (error) {
            console.error('Checkout error:', error);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="h-12 w-12 border-2 border-[#ff6b00] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // Seuls les owners peuvent accéder à cette page
    if (role !== 'owner') {
        return (
            <div className="max-w-lg mx-auto text-center py-20">
                <div className="p-4 bg-slate-500/10 rounded-2xl w-fit mx-auto mb-6">
                    <AlertCircle className="h-12 w-12 text-slate-400" />
                </div>
                <h2 className="font-display text-2xl text-white uppercase mb-4">
                    Accès restreint
                </h2>
                <p className="text-slate-400">
                    Seul le propriétaire du restaurant peut gérer la facturation.
                </p>
            </div>
        );
    }

    const getStatusDisplay = () => {
        if (isTrialing) {
            return {
                label: 'Essai gratuit',
                color: 'bg-blue-500/20 text-blue-400',
                icon: Sparkles
            };
        }
        if (isPastDue) {
            return {
                label: 'Paiement en attente',
                color: 'bg-red-500/20 text-red-400',
                icon: AlertCircle
            };
        }
        if (subscription?.status === 'active') {
            return {
                label: 'Actif',
                color: 'bg-green-500/20 text-green-400',
                icon: CheckCircle
            };
        }
        if (isExpired) {
            return {
                label: 'Expiré',
                color: 'bg-slate-500/20 text-slate-400',
                icon: Clock
            };
        }
        return {
            label: 'Non actif',
            color: 'bg-slate-500/20 text-slate-400',
            icon: Clock
        };
    };

    const status = getStatusDisplay();
    const StatusIcon = status.icon;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="font-display text-2xl md:text-3xl font-bold text-white uppercase tracking-wider">
                    Facturation
                </h1>
                <p className="text-slate-500 text-sm font-mono mt-1">
                    Gérez votre abonnement et vos paiements
                </p>
            </div>

            {/* Current Plan Card */}
            <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="font-display text-lg font-bold text-white uppercase tracking-wider">
                        Plan actuel
                    </h2>
                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${status.color}`}>
                        <StatusIcon className="h-3.5 w-3.5" />
                        {status.label}
                    </span>
                </div>

                <div className="flex items-center gap-6 mb-6">
                    <div className="p-4 bg-gradient-to-br from-[#ff6b00]/20 to-[#ff6b00]/5 rounded-xl border border-[#ff6b00]/20">
                        <CreditCard className="h-8 w-8 text-[#ff6b00]" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-display text-white uppercase">Orizons Pro</h3>
                        <p className="text-slate-400">40€ / mois • Réservations illimitées</p>
                    </div>
                </div>

                {/* Trial Info */}
                {isTrialing && subscription?.trial_end && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6">
                        <div className="flex items-center gap-3">
                            <Sparkles className="h-5 w-5 text-blue-400 flex-shrink-0" />
                            <div>
                                <p className="text-blue-400 font-bold text-sm">
                                    Essai gratuit • {trialDaysRemaining} jour{trialDaysRemaining > 1 ? 's' : ''} restant{trialDaysRemaining > 1 ? 's' : ''}
                                </p>
                                <p className="text-blue-400/70 text-xs">
                                    Se termine le {format(new Date(subscription.trial_end), 'd MMMM yyyy', { locale: fr })}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Past Due Warning */}
                {isPastDue && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                            <div>
                                <p className="text-red-400 font-bold text-sm">
                                    Paiement en attente
                                </p>
                                <p className="text-red-400/70 text-xs">
                                    Veuillez mettre à jour votre méthode de paiement pour continuer.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Next Billing Date */}
                {subscription?.current_period_end && isValid && !isTrialing && (
                    <div className="flex items-center gap-2 text-slate-400 text-sm mb-6">
                        <Calendar className="h-4 w-4" />
                        <span>
                            {subscription.cancel_at_period_end
                                ? `Se termine le ${format(new Date(subscription.current_period_end), 'd MMMM yyyy', { locale: fr })}`
                                : `Prochain paiement le ${format(new Date(subscription.current_period_end), 'd MMMM yyyy', { locale: fr })}`
                            }
                        </span>
                    </div>
                )}

                {/* Cancellation Notice */}
                {subscription?.cancel_at_period_end && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-6">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                            <div>
                                <p className="text-yellow-400 font-bold text-sm">
                                    Annulation programmée
                                </p>
                                <p className="text-yellow-400/70 text-xs">
                                    Votre abonnement se terminera à la fin de la période en cours.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                    {subscription?.stripe_subscription_id ? (
                        <button
                            onClick={handleManageBilling}
                            disabled={actionLoading}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 text-white font-bold text-sm uppercase tracking-widest rounded-xl hover:bg-white/10 transition-colors disabled:opacity-50"
                        >
                            {actionLoading ? (
                                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <ExternalLink className="h-4 w-4" />
                                    Gérer l'abonnement
                                </>
                            )}
                        </button>
                    ) : (
                        <button
                            onClick={handleStartSubscription}
                            disabled={actionLoading}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-[#ff6b00] text-black font-bold text-sm uppercase tracking-widest rounded-xl hover:bg-white transition-colors disabled:opacity-50"
                        >
                            {actionLoading ? (
                                <div className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <CreditCard className="h-4 w-4" />
                                    Commencer l'essai gratuit
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Features Card */}
            <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6">
                <h2 className="font-display text-lg font-bold text-white uppercase tracking-wider mb-6">
                    Inclus dans votre plan
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                    {[
                        'Réservations illimitées',
                        'Salles et tables illimitées',
                        'Membres d\'équipe illimités',
                        'Page de réservation personnalisée',
                        'Notifications email automatiques',
                        'Statistiques et rapports',
                        'Données sécurisées & RGPD',
                        'Support prioritaire'
                    ].map((feature, i) => (
                        <div key={i} className="flex items-center gap-3 text-slate-300">
                            <CheckCircle className="h-4 w-4 text-[#ff6b00] flex-shrink-0" />
                            <span className="text-sm">{feature}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Help Section */}
            <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6">
                <h2 className="font-display text-lg font-bold text-white uppercase tracking-wider mb-4">
                    Besoin d'aide ?
                </h2>
                <p className="text-slate-400 text-sm mb-4">
                    Pour toute question concernant votre abonnement ou votre facturation,
                    contactez notre équipe support.
                </p>
                <a
                    href="mailto:support@orizons.fr"
                    className="text-[#ff6b00] text-sm font-bold hover:text-white transition-colors"
                >
                    support@orizons.fr
                </a>
            </div>
        </div>
    );
}
