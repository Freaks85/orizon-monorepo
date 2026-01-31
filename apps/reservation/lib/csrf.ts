import { randomBytes, createHmac } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

// Secret for signing CSRF tokens (should be in env)
const CSRF_SECRET = process.env.CSRF_SECRET || randomBytes(32).toString('hex');

if (!process.env.CSRF_SECRET) {
    console.warn('⚠️  CSRF_SECRET not set. Using random secret (will invalidate tokens on restart)');
}

/**
 * Generate a CSRF token
 */
export function generateCsrfToken(): string {
    const token = randomBytes(32).toString('hex');
    const signature = createHmac('sha256', CSRF_SECRET)
        .update(token)
        .digest('hex');

    return `${token}.${signature}`;
}

/**
 * Verify a CSRF token
 */
export function verifyCsrfToken(token: string): boolean {
    if (!token || typeof token !== 'string') {
        return false;
    }

    const [tokenPart, signaturePart] = token.split('.');

    if (!tokenPart || !signaturePart) {
        return false;
    }

    const expectedSignature = createHmac('sha256', CSRF_SECRET)
        .update(tokenPart)
        .digest('hex');

    // Constant-time comparison to prevent timing attacks
    return timingSafeEqual(signaturePart, expectedSignature);
}

/**
 * Timing-safe string comparison
 */
function timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
        return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
}

/**
 * Middleware to check CSRF token on state-changing requests
 */
export function checkCsrfToken(request: NextRequest): NextResponse | null {
    const method = request.method.toUpperCase();

    // Only check on state-changing requests
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        return null;
    }

    // Get token from header
    const csrfToken = request.headers.get('x-csrf-token');

    if (!csrfToken) {
        return NextResponse.json(
            { error: 'CSRF token missing' },
            {
                status: 403,
                headers: {
                    'X-CSRF-Protection': 'required'
                }
            }
        );
    }

    if (!verifyCsrfToken(csrfToken)) {
        return NextResponse.json(
            { error: 'Invalid CSRF token' },
            {
                status: 403,
                headers: {
                    'X-CSRF-Protection': 'invalid'
                }
            }
        );
    }

    return null; // Token is valid
}

/**
 * API route handler to get CSRF token
 * GET /api/csrf-token
 */
export function getCsrfTokenHandler(): NextResponse {
    const token = generateCsrfToken();

    return NextResponse.json(
        { csrfToken: token },
        {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate',
                'X-Content-Type-Options': 'nosniff'
            }
        }
    );
}
