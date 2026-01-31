import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { resend, getFromEmail } from '@/lib/resend';
import { NewReservationNotificationEmail } from '@/lib/email-templates/new-reservation-notification';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { reservationSchema, checkRateLimit, sanitizeHtml } from '@/lib/validations';
import { ZodError } from 'zod';

// Validate service role key exists
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
}

// Create admin Supabase client for server-side operations
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Delay function for rate limiting (Resend free tier: 1 email/second)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface ReservationRequest {
    slug: string;
    reservation_date: string;
    reservation_time: string;
    party_size: number;
    customer_name: string;
    customer_phone?: string | null;
    customer_email: string;
    notes?: string | null;
    service_id: string;
}

export async function POST(request: NextRequest) {
    try {
        // Get client IP for rate limiting
        const clientIp = request.headers.get('x-forwarded-for') ||
                         request.headers.get('x-real-ip') ||
                         'unknown';

        // Check rate limit: max 5 reservations per hour per IP
        const rateLimit = checkRateLimit(`reservation:${clientIp}`, 5, 3600000);
        if (!rateLimit.allowed) {
            return NextResponse.json(
                {
                    error: 'Trop de tentatives. Veuillez réessayer plus tard.',
                    resetAt: new Date(rateLimit.resetAt).toISOString()
                },
                {
                    status: 429,
                    headers: {
                        'X-RateLimit-Limit': '5',
                        'X-RateLimit-Remaining': '0',
                        'X-RateLimit-Reset': rateLimit.resetAt.toString()
                    }
                }
            );
        }

        const rawBody = await request.json();

        // Validate and sanitize input
        let validatedData;
        try {
            validatedData = reservationSchema.parse(rawBody);
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

        const body = validatedData;

        // Get restaurant settings by slug
        const { data: settings, error: settingsError } = await supabaseAdmin
            .from('restaurant_reservation_settings')
            .select('*')
            .eq('slug', body.slug)
            .eq('is_enabled', true)
            .single();

        if (settingsError || !settings) {
            return NextResponse.json(
                { error: 'Restaurant not found or reservations disabled' },
                { status: 404 }
            );
        }

        // Get restaurant info
        const { data: restaurant, error: restaurantError } = await supabaseAdmin
            .from('restaurants')
            .select('*')
            .eq('id', settings.restaurant_id)
            .single();

        if (restaurantError || !restaurant) {
            return NextResponse.json(
                { error: 'Restaurant not found' },
                { status: 404 }
            );
        }

        // Get service info
        const { data: service, error: serviceError } = await supabaseAdmin
            .from('services')
            .select('*')
            .eq('id', body.service_id)
            .single();

        if (serviceError || !service) {
            return NextResponse.json(
                { error: 'Service not found' },
                { status: 404 }
            );
        }

        // Insert reservation
        const { data: reservation, error: reservationError } = await supabaseAdmin
            .from('reservations')
            .insert({
                restaurant_id: settings.restaurant_id,
                service_id: body.service_id,
                reservation_date: body.reservation_date,
                reservation_time: body.reservation_time,
                party_size: body.party_size,
                customer_name: body.customer_name,
                customer_phone: body.customer_phone || null,
                customer_email: body.customer_email,
                notes: body.notes || null,
                status: 'pending'
            })
            .select()
            .single();

        if (reservationError) {
            console.error('Error inserting reservation:', reservationError);
            return NextResponse.json(
                { error: 'Failed to create reservation' },
                { status: 500 }
            );
        }

        // Format date for emails
        const formattedDate = format(new Date(body.reservation_date), 'EEEE d MMMM yyyy', { locale: fr });
        const fromEmail = getFromEmail(body.slug);
        const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://reservation.orizonsapp.com'}/dashboard/reservations`;

        // Send notification emails to staff if Resend is configured
        // Note: Customer confirmation email is sent when reservation is confirmed from dashboard
        if (resend) {
            try {
                // Get notification emails (from settings or fallback to restaurant email)
                const notificationEmails: string[] = settings.notification_emails?.length > 0
                    ? settings.notification_emails
                    : (restaurant.email ? [restaurant.email] : []);

                // Send notification to each recipient with delay between emails
                for (let i = 0; i < notificationEmails.length; i++) {
                    const recipientEmail = notificationEmails[i];

                    await resend.emails.send({
                        from: `Orizons Reservation <${fromEmail}>`,
                        to: recipientEmail,
                        subject: `Nouvelle réservation - ${body.customer_name} (${body.party_size} pers.)`,
                        react: NewReservationNotificationEmail({
                            restaurantName: restaurant.name,
                            customerName: body.customer_name,
                            customerPhone: body.customer_phone || '',
                            customerEmail: body.customer_email || '',
                            reservationDate: formattedDate,
                            reservationTime: body.reservation_time,
                            partySize: body.party_size,
                            serviceName: service.name,
                            notes: body.notes || '',
                            dashboardUrl,
                            // Couleurs personnalisées du restaurant
                            primaryColor: settings.primary_color,
                            secondaryColor: settings.secondary_color,
                        }),
                    });
                    console.log(`Notification email sent to ${recipientEmail}`);

                    // Delay between emails (except for the last one)
                    if (i < notificationEmails.length - 1) {
                        await delay(1100);
                    }
                }
            } catch (emailError) {
                // Log email error but don't fail the reservation
                console.error('Error sending emails:', emailError);
            }
        } else {
            console.log('Resend not configured, skipping emails');
        }

        return NextResponse.json({
            success: true,
            reservation: {
                id: reservation.id,
                date: body.reservation_date,
                time: body.reservation_time,
                partySize: body.party_size,
            }
        });

    } catch (error) {
        console.error('Reservation API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
