"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useLenis } from 'lenis/react';

export function ScrollToTop() {
    const pathname = usePathname();
    const lenis = useLenis();

    useEffect(() => {
        // Scroll to top on route change using Lenis
        if (lenis) {
            lenis.scrollTo(0, { immediate: true });
        } else {
            // Fallback if Lenis not available
            window.scrollTo(0, 0);
        }
    }, [pathname, lenis]);

    return null;
}
