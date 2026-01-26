import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { resend, getFromEmail } from '@/lib/resend';
import { ReservationConfirmationEmail } from '@/lib/email-templates/reservation-confirmation';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Create admin Supabase client for server-side operations
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Delay function for rate limiting (Resend free tier: 1 email/second)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Simple in-memory queue to handle multiple confirmations
let emailQueue: Promise<void> = Promise.resolve();

async function sendConfirmationEmail(reservationId: string): Promise<{ success: boolean; error?: string }> {
    try {
        // Get reservation with related data
        const { data: reservation, error: reservationError } = await supabaseAdmin
            .from('reservations')
            .select(`
                *,
                services (name),
                restaurants (id, name, phone, email, address, slug)
            `)
            .eq('id', reservationId)
            .single();

        if (reservationError || !reservation) {
            return { success: false, error: 'Reservation not found' };
        }

        // Check if customer has email
        if (!reservation.customer_email) {
            // No email to send, but still mark as confirmed
            await supabaseAdmin
                .from('reservations')
                .update({ status: 'confirmed' })
                .eq('id', reservationId);
            return { success: true };
        }

        // Get restaurant settings
        const { data: settings } = await supabaseAdmin
            .from('restaurant_reservation_settings')
            .select('*')
            .eq('restaurant_id', reservation.restaurant_id)
            .single();

        const restaurant = reservation.restaurants;
        const service = reservation.services;

        if (!restaurant) {
            return { success: false, error: 'Restaurant not found' };
        }

        // Update status to confirmed
        const { error: updateError } = await supabaseAdmin
            .from('reservations')
            .update({ status: 'confirmed' })
            .eq('id', reservationId);

        if (updateError) {
            return { success: false, error: 'Failed to update reservation status' };
        }

        // Send confirmation email if Resend is configured
        if (resend) {
            const formattedDate = format(new Date(reservation.reservation_date), 'EEEE d MMMM yyyy', { locale: fr });
            const fromEmail = getFromEmail(settings?.slug || restaurant.slug || 'reservation');

            await resend.emails.send({
                from: `${restaurant.name} <${fromEmail}>`,
                to: reservation.customer_email,
                subject: `Confirmation de réservation - ${restaurant.name}`,
                react: ReservationConfirmationEmail({
                    customerName: reservation.customer_name,
                    restaurantName: restaurant.name,
                    reservationDate: formattedDate,
                    reservationTime: reservation.reservation_time,
                    partySize: reservation.party_size,
                    serviceName: service?.name || '',
                    confirmationMessage: settings?.confirmation_message,
                    restaurantPhone: settings?.display_phone || restaurant.phone,
                    restaurantEmail: settings?.display_email || restaurant.email,
                    restaurantAddress: settings?.display_address || restaurant.address,
                    primaryColor: settings?.primary_color,
                    secondaryColor: settings?.secondary_color,
                    accentColor: settings?.accent_color,
                }),
            });

            console.log(`Confirmation email sent to ${reservation.customer_email} for reservation ${reservationId}`);
        }

        return { success: true };
    } catch (error) {
        console.error('Error sending confirmation email:', error);
        return { success: false, error: 'Failed to send confirmation email' };
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json(
                { error: 'Reservation ID is required' },
                { status: 400 }
            );
        }

        // Queue the email to respect rate limits
        // Each email waits for previous ones + 1.1s delay
        const result = await new Promise<{ success: boolean; error?: string }>((resolve) => {
            emailQueue = emailQueue
                .then(() => delay(100)) // Small delay to ensure queue order
                .then(() => sendConfirmationEmail(id))
                .then((res) => {
                    resolve(res);
                    return delay(1100); // Delay after sending for rate limit
                })
                .catch((err) => {
                    console.error('Queue error:', err);
                    resolve({ success: false, error: 'Queue processing error' });
                    return delay(1100);
                });
        });

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || 'Failed to confirm reservation' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Confirm reservation API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
