"use client";

import { useSubscription } from '@/contexts/subscription-context';
import { Sparkles, AlertCircle, X } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

export function SubscriptionBanner() {
    const {
        isTrialing,
        isPastDue,
        trialDaysRemaining,
        openBillingPortal
    } = useSubscription();
    const [dismissed, setDismissed] = useState(false);
    const [portalLoading, setPortalLoading] = useState(false);

    const handleOpenPortal = async () => {
        setPortalLoading(true);
        try {
            await openBillingPortal();
        } catch (error) {
            console.error('Error opening portal:', error);
        } finally {
            setPortalLoading(false);
        }
    };

    // Banner pour paiement en attente (toujours visible)
    if (isPastDue) {
        return (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-red-500/20 rounded-lg flex-shrink-0">
                        <AlertCircle className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-red-400 font-bold text-sm">
                            Paiement en attente
                        </p>
                        <p className="text-red-400/70 text-xs">
                            Veuillez mettre à jour votre méthode de paiement pour continuer à utiliser le service.
                        </p>
                    </div>
                    <button
                        onClick={handleOpenPortal}
                        disabled={portalLoading}
                        className="flex-shrink-0 px-4 py-2 bg-red-500 text-white font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-red-400 transition-colors disabled:opacity-50"
                    >
                        {portalLoading ? (
                            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            'Payer'
                        )}
                    </button>
                </div>
            </div>
        );
    }

    // Banner pour période d'essai
    if (isTrialing && !dismissed) {
        return (
            <div className="bg-gradient-to-r from-[#ff6b00]/20 to-[#ff6b00]/5 border border-[#ff6b00]/20 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-[#ff6b00]/20 rounded-lg flex-shrink-0">
                        <Sparkles className="h-5 w-5 text-[#ff6b00]" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-sm">
                            Essai gratuit • {trialDaysRemaining} jour{trialDaysRemaining > 1 ? 's' : ''} restant{trialDaysRemaining > 1 ? 's' : ''}
                        </p>
                        <p className="text-slate-400 text-xs">
                            Votre carte sera débitée après la période d'essai.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <Link
                            href="/dashboard/billing"
                            className="px-4 py-2 bg-[#ff6b00] text-black font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-white transition-colors"
                        >
                            Gérer
                        </Link>
                        <button
                            onClick={() => setDismissed(true)}
                            className="p-2 text-slate-500 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Rien à afficher si abonnement actif
    return null;
}
