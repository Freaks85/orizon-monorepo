"use client";

import { Shield } from 'lucide-react';
import { usePermissions, Permission, Permissions } from '@/contexts/permission-context';
import { ReactNode } from 'react';

interface PermissionGuardProps {
    module: keyof Permissions;
    action: keyof Permission;
    children: ReactNode;
    fallback?: ReactNode;
}

export function PermissionGuard({ module, action, children, fallback }: PermissionGuardProps) {
    const { hasPermission, loading } = usePermissions();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="h-8 w-8 border-2 border-[#ff6b00] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!hasPermission(module, action)) {
        if (fallback) {
            return <>{fallback}</>;
        }

        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
                <Shield className="h-16 w-16 text-red-500/20 mb-6" />
                <h1 className="font-display text-3xl text-white uppercase mb-4">
                    Accès Refusé
                </h1>
                <p className="text-slate-400 text-center max-w-md">
                    Vous n'avez pas les permissions nécessaires pour accéder à cette page.
                </p>
            </div>
        );
    }

    return <>{children}</>;
}
