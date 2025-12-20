"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../client';
import type { Restaurant } from '../types';

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
                        created_at,
                        updated_at
                    )
                `)
                .eq('user_id', user.id);

            if (error) throw error;

            const restaurantList = data
                ?.map(rm => rm.restaurants as unknown as Restaurant)
                .filter(Boolean) || [];

            setRestaurants(restaurantList);

            const savedRestaurantId = typeof window !== 'undefined'
                ? localStorage.getItem('activeRestaurantId')
                : null;
            const activeRestaurant = restaurantList.find(r => r.id === savedRestaurantId)
                || restaurantList[0]
                || null;

            setRestaurant(activeRestaurant);
            if (activeRestaurant && typeof window !== 'undefined') {
                localStorage.setItem('activeRestaurantId', activeRestaurant.id);
            }
        } catch (error) {
            console.error('Error fetching restaurants:', error);
        } finally {
            setLoading(false);
        }
    };

    const switchRestaurant = (restaurantId: string) => {
        const newRestaurant = restaurants.find(r => r.id === restaurantId);
        if (newRestaurant) {
            setRestaurant(newRestaurant);
            if (typeof window !== 'undefined') {
                localStorage.setItem('activeRestaurantId', restaurantId);
            }
        }
    };

    const refreshRestaurant = async () => {
        await fetchRestaurants();
    };

    useEffect(() => {
        fetchRestaurants();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
            fetchRestaurants();
        });

        return () => subscription.unsubscribe();
    }, []);

    return {
        value: {
            restaurant,
            restaurants,
            loading,
            switchRestaurant,
            refreshRestaurant
        },
        children
    };
}

export { RestaurantContext };

export function useRestaurant() {
    const context = useContext(RestaurantContext);
    if (context === undefined) {
        throw new Error('useRestaurant must be used within a RestaurantProvider');
    }
    return context;
}
