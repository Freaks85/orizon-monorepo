"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRestaurant } from '@/contexts/restaurant-context';
import { supabase } from '@/lib/supabase';

type Subscription = {
    id: string;
    restaurant_id: string;
    stripe_customer_id: string;
    stripe_subscription_id: string | null;
    stripe_price_id: string | null;
    status: 'incomplete' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete_expired' | 'paused';
    trial_start: string | null;
    trial_end: string | null;
    current_period_start: string | null;
    current_period_end: string | null;
    cancel_at_period_end: boolean;
    canceled_at: string | null;
    created_at: string;
    updated_at: string;
};

type SubscriptionContextType = {
    subscription: Subscription | null;
    loading: boolean;
    isValid: boolean;
    isTrialing: boolean;
    isPastDue: boolean;
    isExpired: boolean;
    trialDaysRemaining: number;
    canCreateReservations: boolean;
    canAccessFeatures: boolean;
    canViewReservations: boolean;
    isPublicPageEnabled: boolean;
    hasSubscription: boolean;
    refresh: () => Promise<void>;
    startCheckout: () => Promise<void>;
    openBillingPortal: () => Promise<void>;
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
    const { restaurant, loading: restaurantLoading } = useRestaurant();
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [, setSubscriptionLoading] = useState(false);
    const [hasFetched, setHasFetched] = useState(false);
    const [subscriptionStatus, setSubscriptionStatus] = useState({
        isValid: false,
        isTrialing: false,
        isPastDue: false,
        isExpired: false,
        trialDaysRemaining: 0,
        canCreateReservations: false,
        canAccessFeatures: false,
        canViewReservations: true,
        isPublicPageEnabled: false,
        hasSubscription: false
    });

    // Loading is true when restaurant is loading OR when we haven't fetched subscription yet but have a restaurant
    const loading = restaurantLoading || (!!restaurant?.id && !hasFetched);

    const fetchSubscription = useCallback(async (showLoading = true) => {
        if (!restaurant?.id) {
            return;
        }

        if (showLoading) {
            setSubscriptionLoading(true);
        }

        try {
            const response = await fetch(`/api/subscription?restaurant_id=${restaurant.id}`);
            const data = await response.json();

            if (response.ok) {
                setSubscription(data.subscription);
                setSubscriptionStatus({
                    isValid: data.isValid,
                    isTrialing: data.isTrialing,
                    isPastDue: data.isPastDue,
                    isExpired: data.isExpired,
                    trialDaysRemaining: data.trialDaysRemaining,
                    canCreateReservations: data.canCreateReservations,
                    canAccessFeatures: data.canAccessFeatures,
                    canViewReservations: data.canViewReservations,
                    isPublicPageEnabled: data.isPublicPageEnabled,
                    hasSubscription: data.hasSubscription
                });
            }
        } catch (error) {
            console.error('Error fetching subscription:', error);
        } finally {
            setSubscriptionLoading(false);
            setHasFetched(true);
        }
    }, [restaurant?.id]);

    useEffect(() => {
        if (restaurant?.id) {
            setHasFetched(false);
            fetchSubscription(true);
        }
    }, [restaurant?.id]);

    const startCheckout = useCallback(async () => {
        if (!restaurant?.id) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) {
                throw new Error('Not authenticated');
            }

            const response = await fetch('/api/stripe/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ restaurant_id: restaurant.id })
            });

            const data = await response.json();

            if (data.error) {
                if (data.redirect === 'portal') {
                    await openBillingPortal();
                    return;
                }
                throw new Error(data.error);
            }

            if (data.url) {
                window.location.href = data.url;
            }
        } catch (error) {
            console.error('Checkout error:', error);
            throw error;
        }
    }, [restaurant?.id]);

    const openBillingPortal = useCallback(async () => {
        if (!restaurant?.id) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) {
                throw new Error('Not authenticated');
            }

            const response = await fetch('/api/stripe/create-portal-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ restaurant_id: restaurant.id })
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            if (data.url) {
                window.location.href = data.url;
            }
        } catch (error) {
            console.error('Portal error:', error);
            throw error;
        }
    }, [restaurant?.id]);

    return (
        <SubscriptionContext.Provider value={{
            subscription,
            loading,
            ...subscriptionStatus,
            refresh: fetchSubscription,
            startCheckout,
            openBillingPortal
        }}>
            {children}
        </SubscriptionContext.Provider>
    );
}

export function useSubscription() {
    const context = useContext(SubscriptionContext);
    if (context === undefined) {
        throw new Error('useSubscription must be used within a SubscriptionProvider');
    }
    return context;
}
