import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, role, restaurant_id } = body;

        // Validate required fields
        if (!email || !role || !restaurant_id) {
            return NextResponse.json(
                { error: 'Email, role and restaurant_id are required' },
                { status: 400 }
            );
        }

        // Validate role
        const validRoles = ['admin', 'manager', 'staff'];
        if (!validRoles.includes(role)) {
            return NextResponse.json(
                { error: 'Invalid role. Must be admin, manager, or staff' },
                { status: 400 }
            );
        }

        // Get current user
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const token = authHeader.replace('Bearer ', '');

        // Create a Supabase client with the user's token for RLS
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                global: {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            }
        );

        const { data: { user }, error: userError } = await supabase.auth.getUser(token);

        if (userError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Check if user has permission to invite
        const { data: member, error: memberError } = await supabase
            .from('restaurant_members')
            .select('role, permissions')
            .eq('restaurant_id', restaurant_id)
            .eq('user_id', user.id)
            .single();

        console.log('Permission check:', {
            restaurant_id,
            user_id: user.id,
            member,
            memberError,
            hasError: !!memberError
        });

        if (memberError || !member || !['owner', 'admin', 'manager'].includes(member.role)) {
            console.error('Permission denied:', memberError);
            return NextResponse.json(
                { error: 'You do not have permission to invite team members' },
                { status: 403 }
            );
        }

        // Check if email already has a pending invitation
        const { data: existingInvitation } = await supabase
            .from('invitations')
            .select('id, expires_at')
            .eq('restaurant_id', restaurant_id)
            .eq('email', email)
            .is('accepted_at', null)
            .maybeSingle();

        if (existingInvitation) {
            const expiresAt = new Date(existingInvitation.expires_at);
            if (expiresAt > new Date()) {
                return NextResponse.json(
                    { error: 'Une invitation est déjà en attente pour cet email' },
                    { status: 400 }
                );
            }
        }

        // Generate secure token
        const invitationToken = randomBytes(32).toString('hex');

        // Set expiration to 7 days from now
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        // Create invitation
        const { data: invitation, error: invitationError } = await supabase
            .from('invitations')
            .insert({
                restaurant_id,
                invited_by: user.id,
                email,
                role,
                token: invitationToken,
                expires_at: expiresAt.toISOString()
            })
            .select()
            .single();

        if (invitationError) {
            console.error('Error creating invitation:', invitationError);
            return NextResponse.json(
                { error: 'Failed to create invitation' },
                { status: 500 }
            );
        }

        // Get restaurant details for email
        const { data: restaurant } = await supabase
            .from('restaurants')
            .select('name')
            .eq('id', restaurant_id)
            .single();

        // Send invitation email (using Supabase Auth will be configured with Resend SMTP)
        const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://reservation.orizonsapp.com'}/invitation/${invitationToken}`;

        // TODO: Send email via Supabase Auth email template
        // For now, return the invitation data
        return NextResponse.json({
            success: true,
            invitation: {
                id: invitation.id,
                email: invitation.email,
                role: invitation.role,
                expires_at: invitation.expires_at,
                invitation_url: invitationUrl
            },
            restaurant_name: restaurant?.name
        });

    } catch (error) {
        console.error('Error in invitation API:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        // Get current user
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const token = authHeader.replace('Bearer ', '');

        // Create a Supabase client with the user's token for RLS
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                global: {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            }
        );

        const { data: { user }, error: userError } = await supabase.auth.getUser(token);

        if (userError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get restaurant_id from query params
        const { searchParams } = new URL(request.url);
        const restaurant_id = searchParams.get('restaurant_id');

        if (!restaurant_id) {
            return NextResponse.json(
                { error: 'Restaurant ID is required' },
                { status: 400 }
            );
        }

        // Check if user is a member
        const { data: member, error: memberError } = await supabase
            .from('restaurant_members')
            .select('role')
            .eq('restaurant_id', restaurant_id)
            .eq('user_id', user.id)
            .single();

        console.log('GET Permission check:', {
            restaurant_id,
            user_id: user.id,
            member,
            memberError
        });

        if (memberError || !member || !['owner', 'admin', 'manager'].includes(member.role)) {
            console.error('GET Permission denied:', memberError);
            return NextResponse.json(
                { error: 'You do not have permission to view invitations' },
                { status: 403 }
            );
        }

        // Get all pending invitations for this restaurant
        const { data: invitations, error } = await supabase
            .from('invitations')
            .select('*')
            .eq('restaurant_id', restaurant_id)
            .is('accepted_at', null)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching invitations:', error);
            return NextResponse.json(
                { error: 'Failed to fetch invitations' },
                { status: 500 }
            );
        }

        return NextResponse.json({ invitations });

    } catch (error) {
        console.error('Error in GET invitation API:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const invitation_id = searchParams.get('id');

        if (!invitation_id) {
            return NextResponse.json(
                { error: 'Invitation ID is required' },
                { status: 400 }
            );
        }

        // Get current user
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const token = authHeader.replace('Bearer ', '');

        // Create a Supabase client with the user's token for RLS
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                global: {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            }
        );

        const { data: { user }, error: userError } = await supabase.auth.getUser(token);

        if (userError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Delete invitation (RLS will check permissions)
        const { error } = await supabase
            .from('invitations')
            .delete()
            .eq('id', invitation_id);

        if (error) {
            console.error('Error deleting invitation:', error);
            return NextResponse.json(
                { error: 'Failed to delete invitation' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error in DELETE invitation API:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
