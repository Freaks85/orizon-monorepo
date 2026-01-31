import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';
import { resend } from '../../../lib/resend';
import { authorizeRequest } from '@/lib/auth-middleware';
import { checkCsrfToken } from '@/lib/csrf';
import { invitationSchema } from '@/lib/validations';
import { ZodError } from 'zod';

// Validate service role key exists
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
}

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    try {
        // Check CSRF token
        const csrfError = checkCsrfToken(request);
        if (csrfError) return csrfError;

        const rawBody = await request.json();

        // Validate input with Zod
        let validatedData;
        try {
            validatedData = invitationSchema.parse(rawBody);
        } catch (error) {
            if (error instanceof ZodError) {
                return NextResponse.json(
                    {
                        error: 'Données invalides',
                        details: error.errors.map(e => ({
                            field: e.path.join('.'),
                            message: e.message
                        }))
                    },
                    { status: 400 }
                );
            }
            throw error;
        }

        const { email, role, restaurant_id } = validatedData;

        // Authenticate and authorize
        const { context, error: authError } = await authorizeRequest(request, {
            restaurantId: restaurant_id,
            module: 'team',
            action: 'invite'
        });

        if (authError) return authError;

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

        // Create invitation using admin client
        const { data: invitation, error: invitationError } = await supabaseAdmin
            .from('invitations')
            .insert({
                restaurant_id,
                invited_by: context!.user.id,
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
        const { data: restaurant } = await supabaseAdmin
            .from('restaurants')
            .select('name')
            .eq('id', restaurant_id)
            .single();

        // Send invitation email
        const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://reservation.orizonsapp.com'}/invitation/${invitationToken}`;

        // Send email via Resend
        if (resend) {
            try {
                const emailHtml = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    </head>
                    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #e5e5e5; max-width: 600px; margin: 0 auto; padding: 0; background-color: #0a0a0a;">
                        <!-- Header -->
                        <div style="background: #0a0a0a; padding: 30px; text-align: center; border-bottom: 3px solid #ff6b00;">
                            <div style="display: inline-block; background: #ff6b00; padding: 12px 20px; border-radius: 8px; margin-bottom: 15px;">
                                <span style="color: #000; font-weight: bold; font-size: 24px; letter-spacing: 2px; text-transform: uppercase;">
                                    Orizon<span style="color: #fff;">Resa</span>
                                </span>
                            </div>
                            <h1 style="color: #fff; margin: 15px 0 0 0; font-size: 26px; font-weight: 600;">Invitation à rejoindre l'équipe</h1>
                        </div>

                        <!-- Content -->
                        <div style="background: #1a1a1a; padding: 40px 30px;">
                            <div style="background: #0a0a0a; border: 1px solid #333; border-left: 4px solid #ff6b00; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                                <p style="font-size: 15px; color: #ff6b00; margin: 0 0 10px 0; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">
                                    ${restaurant?.name || 'Notre restaurant'}
                                </p>
                                <p style="font-size: 14px; color: #999; margin: 0;">
                                    Rôle : <strong style="color: #e5e5e5;">${role === 'admin' ? 'Administrateur' : role === 'manager' ? 'Manager' : 'Personnel'}</strong>
                                </p>
                            </div>

                            <p style="font-size: 16px; margin-bottom: 20px; color: #e5e5e5;">Bonjour,</p>

                            <p style="font-size: 15px; margin-bottom: 20px; color: #ccc; line-height: 1.7;">
                                Vous avez été invité(e) à rejoindre <strong style="color: #ff6b00;">${restaurant?.name || 'notre restaurant'}</strong> sur la plateforme Orizon Reservations.
                            </p>

                            <p style="font-size: 15px; margin-bottom: 30px; color: #ccc; line-height: 1.7;">
                                Cette invitation est valable pendant <strong>7 jours</strong>. Cliquez sur le bouton ci-dessous pour accepter l'invitation et créer votre compte :
                            </p>

                            <!-- CTA Button -->
                            <div style="text-align: center; margin: 40px 0;">
                                <a href="${invitationUrl}"
                                   style="background: linear-gradient(135deg, #ff6b00 0%, #ff8533 100%);
                                          color: #000;
                                          padding: 16px 45px;
                                          text-decoration: none;
                                          border-radius: 6px;
                                          font-weight: bold;
                                          font-size: 15px;
                                          text-transform: uppercase;
                                          letter-spacing: 1px;
                                          display: inline-block;
                                          box-shadow: 0 4px 15px rgba(255, 107, 0, 0.3);">
                                    Accepter l'invitation
                                </a>
                            </div>

                            <!-- Alternative Link -->
                            <div style="background: #0a0a0a; border: 1px solid #333; padding: 20px; border-radius: 8px; margin-top: 30px;">
                                <p style="font-size: 13px; color: #999; margin: 0 0 10px 0;">
                                    Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :
                                </p>
                                <p style="margin: 0;">
                                    <a href="${invitationUrl}" style="color: #ff6b00; word-break: break-all; font-size: 12px; text-decoration: underline;">${invitationUrl}</a>
                                </p>
                            </div>

                            <!-- Expiration Notice -->
                            <div style="margin-top: 30px; padding: 15px; background: #0a0a0a; border: 1px solid #333; border-radius: 6px;">
                                <p style="font-size: 12px; color: #666; text-align: center; margin: 0;">
                                    ⏰ Cette invitation expirera le <strong style="color: #ff6b00;">${expiresAt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong>
                                </p>
                            </div>
                        </div>

                        <!-- Footer -->
                        <div style="background: #0a0a0a; padding: 25px 30px; text-align: center; border-top: 1px solid #333;">
                            <p style="font-size: 11px; color: #666; margin: 0 0 5px 0;">
                                Si vous n'avez pas demandé cette invitation, vous pouvez ignorer cet email.
                            </p>
                            <p style="font-size: 11px; color: #666; margin: 0;">
                                &copy; 2026 <strong style="color: #ff6b00;">Orizon Reservations</strong>. Tous droits réservés.
                            </p>
                        </div>
                    </body>
                    </html>
                `;

                await resend.emails.send({
                    from: 'Orizon Reservations <noreply@orizonsapp.com>',
                    to: email,
                    subject: `Invitation à rejoindre ${restaurant?.name || 'notre restaurant'}`,
                    html: emailHtml,
                });

                console.log('Invitation email sent successfully to:', email);
            } catch (emailError) {
                console.error('Error sending invitation email:', emailError);
                // Don't fail the request if email fails, but log it
            }
        } else {
            console.warn('Resend is not configured. Email not sent.');
        }

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
        // Get restaurant_id from query params
        const { searchParams } = new URL(request.url);
        const restaurant_id = searchParams.get('restaurant_id');

        if (!restaurant_id) {
            return NextResponse.json(
                { error: 'Restaurant ID is required' },
                { status: 400 }
            );
        }

        // Authenticate and authorize
        const { context, error: authError } = await authorizeRequest(request, {
            restaurantId: restaurant_id,
            module: 'team',
            action: 'view'
        });

        if (authError) return authError;

        // Get all pending invitations for this restaurant using admin client
        const { data: invitations, error } = await supabaseAdmin
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
        // Check CSRF token
        const csrfError = checkCsrfToken(request);
        if (csrfError) return csrfError;

        const { searchParams } = new URL(request.url);
        const invitation_id = searchParams.get('id');

        if (!invitation_id) {
            return NextResponse.json(
                { error: 'Invitation ID is required' },
                { status: 400 }
            );
        }

        // First, get the invitation to know which restaurant it belongs to
        const { data: invitation, error: invitationError } = await supabaseAdmin
            .from('invitations')
            .select('restaurant_id')
            .eq('id', invitation_id)
            .single();

        if (invitationError || !invitation) {
            return NextResponse.json(
                { error: 'Invitation not found' },
                { status: 404 }
            );
        }

        // Authenticate and authorize
        const { context, error: authError } = await authorizeRequest(request, {
            restaurantId: invitation.restaurant_id,
            module: 'team',
            action: 'manage'
        });

        if (authError) return authError;

        // Delete invitation using admin client
        const { error } = await supabaseAdmin
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
