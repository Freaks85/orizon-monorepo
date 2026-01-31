import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authenticate, requirePermission, requireRole, getRestaurantMember } from '@/lib/auth-middleware';
import { checkCsrfToken } from '@/lib/csrf';

// Validate service role key exists
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
}

// Create a Supabase client with service role to bypass RLS
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

export async function DELETE(request: NextRequest) {
    try {
        // Check CSRF token
        const csrfError = checkCsrfToken(request);
        if (csrfError) return csrfError;

        const { searchParams } = new URL(request.url);
        const member_id = searchParams.get('id');

        if (!member_id) {
            return NextResponse.json(
                { error: 'Member ID is required' },
                { status: 400 }
            );
        }

        // Authenticate user
        const { context, error: authError } = await authenticate(request);
        if (authError) return authError;

        // Get member to delete
        const { data: memberToDelete, error: memberError } = await supabaseAdmin
            .from('restaurant_members')
            .select('role, restaurant_id')
            .eq('id', member_id)
            .single();

        if (memberError || !memberToDelete) {
            return NextResponse.json(
                { error: 'Member not found' },
                { status: 404 }
            );
        }

        // Prevent deleting owner
        if (memberToDelete.role === 'owner') {
            return NextResponse.json(
                { error: 'Cannot remove the restaurant owner' },
                { status: 403 }
            );
        }

        // Get current user's membership and check permissions
        const { member, error: memberCheckError } = await getRestaurantMember(
            context!.user.id,
            memberToDelete.restaurant_id
        );

        if (memberCheckError) return memberCheckError;

        // Check if user has permission to manage team
        const permissionError = requirePermission(member, 'team', 'manage');
        if (permissionError) return permissionError;

        // Check if user has required role (staff cannot remove members)
        const roleError = requireRole(member, ['owner', 'admin', 'manager']);
        if (roleError) return roleError;

        // Delete member using admin client
        const { error: deleteError } = await supabaseAdmin
            .from('restaurant_members')
            .delete()
            .eq('id', member_id);

        if (deleteError) {
            console.error('Error deleting member:', deleteError);
            return NextResponse.json(
                { error: 'Failed to delete member' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error in DELETE member API:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
