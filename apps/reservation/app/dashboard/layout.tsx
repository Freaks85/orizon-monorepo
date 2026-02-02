"use client";

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from '@/components/dashboard/sidebar';
import { TopNav } from '@/components/dashboard/top-nav';
import { RestaurantProvider, useRestaurant } from '@/contexts/restaurant-context';
import { PermissionProvider } from '@/contexts/permission-context';
import { SubscriptionProvider } from '@/contexts/subscription-context';
import { SubscriptionBanner } from '@/components/subscription/subscription-banner';
import { SubscriptionGuard } from '@/components/subscription/subscription-guard';
import { supabase } from '@/lib/supabase';

// Pages qui ne nécessitent pas un abonnement actif
const SUBSCRIPTION_EXEMPT_PATHS = ['/dashboard/billing'];

// Pages avec accès lecture seule même si expiré
const READ_ONLY_PATHS = ['/dashboard/reservations', '/dashboard/cahier'];

function DashboardContent({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { loading } = useRestaurant();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/login');
            }
        };
        checkAuth();
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 border-2 border-[#ff6b00] border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-500 font-mono text-sm uppercase tracking-wider">
                        Chargement...
                    </p>
                </div>
            </div>
        );
    }

    // Vérifier si la page actuelle est exemptée de la vérification d'abonnement
    const isExemptPath = SUBSCRIPTION_EXEMPT_PATHS.some(path => pathname?.startsWith(path));
    const isReadOnlyPath = READ_ONLY_PATHS.some(path => pathname?.startsWith(path));

    return (
        <div className="min-h-screen bg-[#050505]">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="md:ml-[72px] min-h-screen flex flex-col">
                <TopNav onMenuClick={() => setSidebarOpen(true)} />

                <main className="flex-1 p-4 md:p-6">
                    <SubscriptionBanner />
                    {isExemptPath ? (
                        children
                    ) : (
                        <SubscriptionGuard requiresFeatureAccess={!isReadOnlyPath}>
                            {children}
                        </SubscriptionGuard>
                    )}
                </main>
            </div>
        </div>
    );
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <RestaurantProvider>
            <PermissionProvider>
                <SubscriptionProvider>
                    <DashboardContent>{children}</DashboardContent>
                </SubscriptionProvider>
            </PermissionProvider>
        </RestaurantProvider>
    );
}
