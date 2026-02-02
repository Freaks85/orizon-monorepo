"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

type Restaurant = {
    id: string;
    name: string;
    owner_id: string;
    address?: string;
    phone?: string;
    email?: string;
    siret?: string;
    slug?: string;
    created_at: string;
};

type RestaurantContextType = {
    restaurant: Restaurant | null;
    restaurants: Restaurant[];
    loading: boolean;
    switchRestaurant: (restaurantId: string) => void;
    refreshRestaurant: () => Promise<void>;
};

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export function RestaurantProvider({ children }: { children: ReactNode }) {
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRestaurants = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('restaurant_members')
                .select(`
                    restaurant_id,
                    role,
                    restaurants:restaurant_id (
                        id,
                        name,
                        owner_id,
                        address,
                        phone,
                        email,
                        siret,
                        slug,
                        created_at
                    )
                `)
                .eq('user_id', user.id);

            console.log('🏢 Restaurant Context Debug:', {
                user_id: user.id,
                user_email: user.email,
                data,
                error,
                errorDetails: error ? JSON.stringify(error) : null
            });

            if (error) throw error;

            const restaurantList = data
                ?.map(rm => rm.restaurants as unknown as Restaurant)
                .filter(Boolean) || [];

            setRestaurants(restaurantList);

            const savedRestaurantId = localStorage.getItem('activeRestaurantId');
            const activeRestaurant = restaurantList.find(r => r.id === savedRestaurantId)
                || restaurantList[0]
                || null;

            setRestaurant(activeRestaurant);
            if (activeRestaurant) {
                localStorage.setItem('activeRestaurantId', activeRestaurant.id);
            }
        } catch (error) {
            console.error('❌ Error fetching restaurants:', error);
            console.error('Error details:', JSON.stringify(error, null, 2));
        } finally {
            setLoading(false);
        }
    };

    const switchRestaurant = (restaurantId: string) => {
        const newRestaurant = restaurants.find(r => r.id === restaurantId);
        if (newRestaurant) {
            setRestaurant(newRestaurant);
            localStorage.setItem('activeRestaurantId', restaurantId);
        }
    };

    const refreshRestaurant = async () => {
        await fetchRestaurants();
    };

    useEffect(() => {
        let isMounted = true;

        fetchRestaurants();

        // Subscribe to auth changes - skip initial SIGNED_IN since we already fetch on mount
        let isInitialEvent = true;
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
            // Skip the initial SIGNED_IN event since we already fetch on mount
            if (isInitialEvent && event === 'SIGNED_IN') {
                isInitialEvent = false;
                return;
            }
            isInitialEvent = false;

            if (!isMounted) return;

            if (event === 'TOKEN_REFRESHED') {
                await fetchRestaurants();
            } else if (event === 'SIGNED_OUT') {
                setRestaurants([]);
                setRestaurant(null);
                setLoading(false);
            }
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);

    return (
        <RestaurantContext.Provider value={{
            restaurant,
            restaurants,
            loading,
            switchRestaurant,
            refreshRestaurant
        }}>
            {children}
        </RestaurantContext.Provider>
    );
}

export function useRestaurant() {
    const context = useContext(RestaurantContext);
    if (context === undefined) {
        throw new Error('useRestaurant must be used within a RestaurantProvider');
    }
    return context;
}
