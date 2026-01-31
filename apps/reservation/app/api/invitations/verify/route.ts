import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with service role to bypass RLS
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.json(
                { error: 'Token is required' },
                { status: 400 }
            );
        }

        // Fetch invitation with restaurant and invited_by details
        const { data: invitation, error } = await supabaseAdmin
            .from('invitations')
            .select(`
                id,
                email,
                role,
                expires_at,
                accepted_at,
                restaurant_id,
                invited_by
            `)
            .eq('token', token)
            .is('accepted_at', null)
            .maybeSingle();

        if (error || !invitation) {
            console.error('Error fetching invitation:', error);
            return NextResponse.json(
                { error: 'Invitation invalide ou expirée' },
                { status: 404 }
            );
        }

        // Check if expired
        const expiresAt = new Date(invitation.expires_at);
        if (expiresAt < new Date()) {
            return NextResponse.json(
                { error: 'Cette invitation a expiré' },
                { status: 410 }
            );
        }

        // Get restaurant details
        const { data: restaurant } = await supabaseAdmin
            .from('restaurants')
            .select('name')
            .eq('id', invitation.restaurant_id)
            .single();

        // Get invited_by user details
        let invitedByName = 'Un membre de l\'équipe';
        if (invitation.invited_by) {
            const { data: invitedByUser } = await supabaseAdmin.auth.admin.getUserById(
                invitation.invited_by
            );

            if (invitedByUser?.user?.user_metadata) {
                const { first_name, last_name } = invitedByUser.user.user_metadata;
                if (first_name && last_name) {
                    invitedByName = `${first_name} ${last_name}`;
                }
            }
        }

        // Return invitation data
        return NextResponse.json({
            id: invitation.id,
            email: invitation.email,
            role: invitation.role,
            restaurant_name: restaurant?.name || 'le restaurant',
            restaurant_id: invitation.restaurant_id,
            invited_by_name: invitedByName,
            expires_at: invitation.expires_at,
        });

    } catch (error) {
        console.error('Error in verify invitation API:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
