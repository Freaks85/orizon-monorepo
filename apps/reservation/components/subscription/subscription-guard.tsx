"use client";

import { useSubscription } from '@/contexts/subscription-context';
import { CreditCard, Lock, Sparkles } from 'lucide-react';
import { useState } from 'react';

interface SubscriptionGuardProps {
    children: React.ReactNode;
    requiresFeatureAccess?: boolean;
}

export function SubscriptionGuard({ children, requiresFeatureAccess = true }: SubscriptionGuardProps) {
    const {
        subscription,
        loading,
        isExpired,
        hasSubscription,
        startCheckout
    } = useSubscription();
    const [checkoutLoading, setCheckoutLoading] = useState(false);

    const handleStartTrial = async () => {
        setCheckoutLoading(true);
        try {
            await startCheckout();
        } catch (error) {
            console.error('Error starting checkout:', error);
        } finally {
            setCheckoutLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 border-2 border-[#ff6b00] border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-500 font-mono text-xs uppercase tracking-wider">
                        Chargement...
                    </p>
                </div>
            </div>
        );
    }

    // Pas de subscription du tout - montrer la page d'activation
    if (!hasSubscription || (subscription?.status === 'incomplete')) {
        return (
            <div className="max-w-lg mx-auto text-center py-12 md:py-20 px-4">
                <div className="p-4 bg-gradient-to-br from-[#ff6b00]/20 to-[#ff6b00]/5 rounded-2xl w-fit mx-auto mb-6 border border-[#ff6b00]/20">
                    <Sparkles className="h-12 w-12 text-[#ff6b00]" />
                </div>
                <h2 className="font-display text-2xl md:text-3xl text-white uppercase tracking-wider mb-4">
                    Commencez votre essai gratuit
                </h2>
                <p className="text-slate-400 mb-8 max-w-md mx-auto">
                    Profitez de 7 jours d'essai gratuit pour découvrir toutes les fonctionnalités d'Orizons Reservation.
                </p>

                <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6 mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <span className="font-display text-lg text-white uppercase">Plan Illimité</span>
                        <div className="text-right">
                            <span className="text-3xl font-display text-[#ff6b00]">40€</span>
                            <span className="text-slate-500 text-sm">/mois</span>
                        </div>
                    </div>
                    <ul className="space-y-2 text-left text-sm text-slate-400">
                        <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#ff6b00]" />
                            Réservations illimitées
                        </li>
                        <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#ff6b00]" />
                            Salles et tables illimitées
                        </li>
                        <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#ff6b00]" />
                            Page de réservation personnalisée
                        </li>
                        <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#ff6b00]" />
                            Statistiques avancées
                        </li>
                        <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#ff6b00]" />
                            Support prioritaire
                        </li>
                    </ul>
                </div>

                <button
                    onClick={handleStartTrial}
                    disabled={checkoutLoading}
                    className="inline-flex items-center gap-3 px-8 py-4 bg-[#ff6b00] text-black font-bold text-sm uppercase tracking-widest rounded-xl hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {checkoutLoading ? (
                        <div className="h-5 w-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <CreditCard className="h-5 w-5" />
                    )}
                    Démarrer l'essai gratuit
                </button>
                <p className="text-slate-600 text-xs mt-4">
                    Carte bancaire requise. Annulez à tout moment.
                </p>
            </div>
        );
    }

    // Subscription expirée - accès limité
    if (isExpired && requiresFeatureAccess) {
        return (
            <div className="max-w-lg mx-auto text-center py-12 md:py-20 px-4">
                <div className="p-4 bg-slate-500/10 rounded-2xl w-fit mx-auto mb-6 border border-slate-500/20">
                    <Lock className="h-12 w-12 text-slate-400" />
                </div>
                <h2 className="font-display text-2xl md:text-3xl text-white uppercase tracking-wider mb-4">
                    Abonnement expiré
                </h2>
                <p className="text-slate-400 mb-8">
                    Votre abonnement a expiré. Réactivez-le pour accéder à toutes les fonctionnalités.
                </p>
                <button
                    onClick={handleStartTrial}
                    disabled={checkoutLoading}
                    className="inline-flex items-center gap-3 px-8 py-4 bg-[#ff6b00] text-black font-bold text-sm uppercase tracking-widest rounded-xl hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {checkoutLoading ? (
                        <div className="h-5 w-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <CreditCard className="h-5 w-5" />
                    )}
                    Réactiver l'abonnement
                </button>
            </div>
        );
    }

    // Accès normal (avec warning si past_due)
    return <>{children}</>;
}
