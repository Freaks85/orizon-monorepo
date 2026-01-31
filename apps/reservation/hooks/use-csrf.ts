import { useState, useEffect } from 'react';

let cachedToken: string | null = null;
let tokenPromise: Promise<string> | null = null;

/**
 * Hook to get CSRF token for API requests
 */
export function useCsrfToken() {
    const [token, setToken] = useState<string | null>(cachedToken);
    const [loading, setLoading] = useState(!cachedToken);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (cachedToken) {
            return;
        }

        const fetchToken = async () => {
            // If already fetching, wait for that promise
            if (tokenPromise) {
                try {
                    const t = await tokenPromise;
                    setToken(t);
                    setLoading(false);
                } catch (err) {
                    setError(err as Error);
                    setLoading(false);
                }
                return;
            }

            // Start new fetch
            tokenPromise = fetch('/api/csrf-token')
                .then(res => {
                    if (!res.ok) throw new Error('Failed to fetch CSRF token');
                    return res.json();
                })
                .then(data => {
                    cachedToken = data.csrfToken;
                    return data.csrfToken;
                });

            try {
                const t = await tokenPromise;
                setToken(t);
                setLoading(false);
            } catch (err) {
                setError(err as Error);
                setLoading(false);
            } finally {
                tokenPromise = null;
            }
        };

        fetchToken();
    }, []);

    return { token, loading, error };
}

/**
 * Get headers with CSRF token for fetch requests
 */
export function getCsrfHeaders(token: string | null): Record<string, string> {
    if (!token) {
        return {};
    }

    return {
        'X-CSRF-Token': token
    };
}

/**
 * Invalidate cached CSRF token (e.g., after logout)
 */
export function invalidateCsrfToken() {
    cachedToken = null;
    tokenPromise = null;
}
