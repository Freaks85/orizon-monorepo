import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Validate service role key exists
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
}

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface AuthContext {
    user: {
        id: string;
        email: string;
        user_metadata?: any;
    };
    member?: {
        id: string;
        restaurant_id: string;
        role: string;
        permissions: any;
    };
}

/**
 * Authenticate request and get user from JWT token
 */
export async function authenticate(request: NextRequest): Promise<{ context?: AuthContext; error?: NextResponse }> {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return {
            error: NextResponse.json(
                { error: 'Unauthorized - Missing or invalid token' },
                { status: 401 }
            )
        };
    }

    const token = authHeader.replace('Bearer ', '');

    try {
        // Verify JWT token
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return {
                error: NextResponse.json(
                    { error: 'Unauthorized - Invalid token' },
                    { status: 401 }
                )
            };
        }

        return {
            context: {
                user: {
                    id: user.id,
                    email: user.email!,
                    user_metadata: user.user_metadata
                }
            }
        };
    } catch (error) {
        console.error('Authentication error:', error);
        return {
            error: NextResponse.json(
                { error: 'Authentication failed' },
                { status: 500 }
            )
        };
    }
}

/**
 * Get restaurant member and check if user belongs to restaurant
 */
export async function getRestaurantMember(
    userId: string,
    restaurantId: string
): Promise<{ member?: any; error?: NextResponse }> {
    try {
        const { data: member, error } = await supabaseAdmin
            .from('restaurant_members')
            .select('id, restaurant_id, role, permissions')
            .eq('user_id', userId)
            .eq('restaurant_id', restaurantId)
            .single();

        if (error || !member) {
            return {
                error: NextResponse.json(
                    { error: 'Forbidden - Not a member of this restaurant' },
                    { status: 403 }
                )
            };
        }

        return { member };
    } catch (error) {
        console.error('Error fetching member:', error);
        return {
            error: NextResponse.json(
                { error: 'Failed to verify membership' },
                { status: 500 }
            )
        };
    }
}

/**
 * Check if user has specific permission
 */
export function checkPermission(
    member: any,
    module: string,
    action: string
): boolean {
    // Owner always has all permissions
    if (member.role === 'owner') {
        return true;
    }

    // Check permissions object
    const permissions = member.permissions || {};
    const modulePermissions = permissions[module];

    if (!modulePermissions) {
        return false;
    }

    return modulePermissions[action] === true;
}

/**
 * Require specific permission or return error
 */
export function requirePermission(
    member: any,
    module: string,
    action: string
): NextResponse | null {
    if (!checkPermission(member, module, action)) {
        return NextResponse.json(
            {
                error: 'Forbidden - Insufficient permissions',
                required: { module, action }
            },
            { status: 403 }
        );
    }
    return null;
}

/**
 * Require specific role(s) or return error
 */
export function requireRole(
    member: any,
    allowedRoles: string[]
): NextResponse | null {
    if (!allowedRoles.includes(member.role)) {
        return NextResponse.json(
            {
                error: 'Forbidden - Insufficient role',
                required_roles: allowedRoles,
                current_role: member.role
            },
            { status: 403 }
        );
    }
    return null;
}

/**
 * Complete authentication + authorization check
 */
export async function authorizeRequest(
    request: NextRequest,
    options: {
        restaurantId: string;
        module: string;
        action: string;
    }
): Promise<{ context?: AuthContext; error?: NextResponse }> {
    // Step 1: Authenticate user
    const { context, error: authError } = await authenticate(request);
    if (authError) return { error: authError };

    // Step 2: Get restaurant member
    const { member, error: memberError } = await getRestaurantMember(
        context!.user.id,
        options.restaurantId
    );
    if (memberError) return { error: memberError };

    // Step 3: Check permissions
    const permissionError = requirePermission(member, options.module, options.action);
    if (permissionError) return { error: permissionError };

    // Success - add member to context
    context!.member = member;
    return { context };
}

/**
 * Extract restaurant ID from query params or body
 */
export async function getRestaurantIdFromRequest(
    request: NextRequest,
    source: 'query' | 'body' = 'query',
    paramName: string = 'restaurant_id'
): Promise<string | null> {
    if (source === 'query') {
        const { searchParams } = new URL(request.url);
        return searchParams.get(paramName);
    } else {
        try {
            const body = await request.json();
            return body[paramName] || null;
        } catch {
            return null;
        }
    }
}
