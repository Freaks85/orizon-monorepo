"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/dashboard/sidebar';
import { TopNav } from '@/components/dashboard/top-nav';
import { RestaurantProvider, useRestaurant } from '@/contexts/restaurant-context';
import { supabase } from '@/lib/supabase';

function DashboardContent({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { loading } = useRestaurant();
    const router = useRouter();

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
                    <div className="h-12 w-12 border-2 border-[#00ff9d] border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-500 font-mono text-sm uppercase tracking-wider">
                        Chargement...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505]">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="md:ml-[72px] min-h-screen flex flex-col">
                <TopNav onMenuClick={() => setSidebarOpen(true)} />

                <main className="flex-1 p-4 md:p-6">
                    {children}
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
            <DashboardContent>{children}</DashboardContent>
        </RestaurantProvider>
    );
}
