"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRestaurant } from './restaurant-context';
import { supabase } from '@/lib/supabase';

export type Permission = {
    view?: boolean;
    create?: boolean;
    update?: boolean;
    delete?: boolean;
    invite?: boolean;
    manage?: boolean;
};

export type Permissions = {
    reservations: Permission;
    analytics: Permission;
    settings: Permission;
    services: Permission;
    rooms: Permission;
    team: Permission;
};

export type UserRole = 'owner' | 'admin' | 'manager' | 'staff';

interface PermissionContextType {
    role: UserRole | null;
    permissions: Permissions | null;
    loading: boolean;
    hasPermission: (module: keyof Permissions, action: keyof Permission) => boolean;
    canAccessPage: (page: string) => boolean;
    refreshPermissions: () => Promise<void>;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

const DEFAULT_PERMISSIONS: Permissions = {
    reservations: { view: false, create: false, update: false, delete: false },
    analytics: { view: false },
    settings: { view: false, update: false },
    services: { view: false, create: false, update: false, delete: false },
    rooms: { view: false, create: false, update: false, delete: false },
    team: { view: false, invite: false, manage: false }
};

export function PermissionProvider({ children }: { children: ReactNode }) {
    const { restaurant } = useRestaurant();
    const [role, setRole] = useState<UserRole | null>(null);
    const [permissions, setPermissions] = useState<Permissions | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchPermissions = async () => {
        if (!restaurant?.id) {
            setPermissions(null);
            setRole(null);
            setLoading(false);
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setPermissions(null);
                setRole(null);
                setLoading(false);
                return;
            }

            const { data: member, error } = await supabase
                .from('restaurant_members')
                .select('role, permissions')
                .eq('restaurant_id', restaurant.id)
                .eq('user_id', user.id)
                .single();

            console.log('🔍 Permission Context Debug:', {
                restaurant_id: restaurant.id,
                user_id: user.id,
                member,
                error,
                errorDetails: error ? JSON.stringify(error) : null
            });

            if (error || !member) {
                console.error('❌ Error fetching permissions:', error);
                setPermissions(DEFAULT_PERMISSIONS);
                setRole(null);
                setLoading(false);
                return;
            }

            setRole(member.role as UserRole);
            setPermissions(member.permissions as Permissions);
        } catch (error) {
            console.error('Error in fetchPermissions:', error);
            setPermissions(DEFAULT_PERMISSIONS);
            setRole(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPermissions();
    }, [restaurant?.id]);

    const hasPermission = (module: keyof Permissions, action: keyof Permission): boolean => {
        if (!permissions) return false;
        const modulePermissions = permissions[module];
        if (!modulePermissions) return false;
        return modulePermissions[action] === true;
    };

    const canAccessPage = (page: string): boolean => {
        if (!permissions) return false;

        switch (page) {
            case '/dashboard':
            case '/dashboard/analytics':
                return hasPermission('analytics', 'view');

            case '/dashboard/settings':
                return hasPermission('settings', 'view');

            case '/dashboard/services':
                return hasPermission('services', 'view');

            case '/dashboard/rooms':
            case '/dashboard/rooms/[id]':
                return hasPermission('rooms', 'view');

            case '/dashboard/reservations':
            case '/dashboard/cahier':
                return hasPermission('reservations', 'view');

            case '/dashboard/team':
                return hasPermission('team', 'view');

            default:
                return true; // Allow access to unknown pages by default
        }
    };

    const refreshPermissions = async () => {
        setLoading(true);
        await fetchPermissions();
    };

    return (
        <PermissionContext.Provider
            value={{
                role,
                permissions,
                loading,
                hasPermission,
                canAccessPage,
                refreshPermissions
            }}
        >
            {children}
        </PermissionContext.Provider>
    );
}

export function usePermissions() {
    const context = useContext(PermissionContext);
    if (context === undefined) {
        throw new Error('usePermissions must be used within a PermissionProvider');
    }
    return context;
}
