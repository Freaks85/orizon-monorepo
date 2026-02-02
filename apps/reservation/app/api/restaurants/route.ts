import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authenticate } from '@/lib/auth-middleware';

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

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, address, phone, email } = body;

        // Validate required fields
        if (!name || name.trim().length < 2) {
            return NextResponse.json(
                { error: 'Le nom du restaurant est requis (minimum 2 caractères)' },
                { status: 400 }
            );
        }

        // Authenticate user
        const { context, error: authError } = await authenticate(request);
        if (authError) return authError;

        const userId = context!.user.id;

        // Check if user is owner of at least one restaurant
        const { data: ownerMemberships, error: ownerError } = await supabaseAdmin
            .from('restaurant_members')
            .select('id, restaurant_id')
            .eq('user_id', userId)
            .eq('role', 'owner');

        if (ownerError) {
            console.error('Error checking owner status:', ownerError);
            return NextResponse.json(
                { error: 'Erreur lors de la vérification des permissions' },
                { status: 500 }
            );
        }

        if (!ownerMemberships || ownerMemberships.length === 0) {
            return NextResponse.json(
                { error: 'Vous devez être propriétaire d\'un restaurant pour en créer un nouveau' },
                { status: 403 }
            );
        }

        // Check if user has an active subscription on at least one of their restaurants
        const restaurantIds = ownerMemberships.map(m => m.restaurant_id);
        const { data: subscriptions, error: subError } = await supabaseAdmin
            .from('subscriptions')
            .select('id, status, restaurant_id')
            .in('restaurant_id', restaurantIds)
            .in('status', ['active', 'trialing']);

        if (subError) {
            console.error('Error checking subscription:', subError);
            return NextResponse.json(
                { error: 'Erreur lors de la vérification de l\'abonnement' },
                { status: 500 }
            );
        }

        if (!subscriptions || subscriptions.length === 0) {
            return NextResponse.json(
                { error: 'Un abonnement actif est requis pour créer un nouveau restaurant' },
                { status: 403 }
            );
        }

        // Generate a unique slug from the name
        const baseSlug = name.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove accents
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

        // Check if slug exists and make it unique if needed
        let slug = baseSlug;
        let slugExists = true;
        let counter = 0;

        while (slugExists) {
            const { data: existingSlug } = await supabaseAdmin
                .from('restaurants')
                .select('id')
                .eq('slug', slug)
                .maybeSingle();

            if (!existingSlug) {
                slugExists = false;
            } else {
                counter++;
                slug = `${baseSlug}-${counter}`;
            }
        }

        // Create the restaurant
        const { data: restaurant, error: createError } = await supabaseAdmin
            .from('restaurants')
            .insert({
                name: name.trim(),
                owner_id: userId,
                address: address?.trim() || null,
                phone: phone?.trim() || null,
                email: email?.trim() || null,
                slug: slug
            })
            .select()
            .single();

        if (createError) {
            console.error('Error creating restaurant:', createError);
            return NextResponse.json(
                { error: 'Erreur lors de la création du restaurant' },
                { status: 500 }
            );
        }

        // Create restaurant_member entry for the owner
        const { error: memberError } = await supabaseAdmin
            .from('restaurant_members')
            .insert({
                restaurant_id: restaurant.id,
                user_id: userId,
                role: 'owner',
                permissions: {
                    team: { view: true, invite: true, manage: true },
                    rooms: { view: true, create: true, update: true, delete: true },
                    services: { view: true, create: true, update: true, delete: true },
                    settings: { view: true, update: true },
                    analytics: { view: true },
                    reservations: { view: true, create: true, update: true, delete: true }
                }
            });

        if (memberError) {
            console.error('Error creating restaurant member:', memberError);
            // Rollback: delete the restaurant
            await supabaseAdmin.from('restaurants').delete().eq('id', restaurant.id);
            return NextResponse.json(
                { error: 'Erreur lors de la configuration du restaurant' },
                { status: 500 }
            );
        }

        // Create default reservation settings
        const { error: settingsError } = await supabaseAdmin
            .from('restaurant_reservation_settings')
            .insert({
                restaurant_id: restaurant.id,
                slug: slug,
                is_enabled: false
            });

        if (settingsError) {
            console.error('Error creating reservation settings:', settingsError);
            // Non-critical, don't rollback
        }

        return NextResponse.json({
            success: true,
            restaurant: restaurant
        });

    } catch (error) {
        console.error('Error in create restaurant API:', error);
        return NextResponse.json(
            { error: 'Erreur interne du serveur' },
            { status: 500 }
        );
    }
}
