import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
        const { token, firstName, lastName, password } = body;

        // Validate required fields
        if (!token || !firstName || !lastName || !password) {
            return NextResponse.json(
                { error: 'Tous les champs sont requis' },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: 'Le mot de passe doit contenir au moins 6 caractères' },
                { status: 400 }
            );
        }

        // Fetch invitation
        const { data: invitation, error: invError } = await supabaseAdmin
            .from('invitations')
            .select('id, email, role, restaurant_id, expires_at, accepted_at')
            .eq('token', token)
            .is('accepted_at', null)
            .maybeSingle();

        if (invError || !invitation) {
            console.error('Error fetching invitation:', invError);
            return NextResponse.json(
                { error: 'Invitation invalide ou déjà utilisée' },
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

        // Try to create user - if it fails with email_exists, delete and retry
        let userId: string;

        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: invitation.email,
            password: password,
            email_confirm: true,
            user_metadata: {
                first_name: firstName,
                last_name: lastName,
                role: invitation.role,
                invitation_token: token
            }
        });

        if (createError) {
            console.log('First createUser attempt failed:', createError.message, 'code:', (createError as any).code);

            // If user already exists, find and delete them, then retry
            if ((createError as any).code === 'email_exists' || createError.message.includes('already been registered')) {
                console.log(`User with email ${invitation.email} already exists, attempting to find and delete...`);

                // Try to find user by email using RPC or direct query
                let existingUserId: string | null = null;

                // Method 1: Try getUserById with email lookup via raw SQL
                const { data: userFromDb, error: dbError } = await supabaseAdmin.rpc('get_user_id_by_email', {
                    user_email: invitation.email
                }).maybeSingle();

                if (!dbError && userFromDb) {
                    existingUserId = typeof userFromDb === 'string' ? userFromDb : (userFromDb as { id?: string })?.id || null;
                    console.log(`Found user via RPC: ${existingUserId}`);
                } else {
                    console.log('RPC not available or failed, trying listUsers with pagination...');

                    // Method 2: Paginate through users with smaller page size
                    let page = 1;
                    const perPage = 50;

                    while (!existingUserId && page <= 20) {
                        const { data: listResult, error: listError } = await supabaseAdmin.auth.admin.listUsers({
                            page: page,
                            perPage: perPage
                        });

                        if (listError) {
                            console.error(`Error listing users page ${page}:`, listError);
                            break;
                        }

                        console.log(`Page ${page}: found ${listResult?.users?.length || 0} users`);

                        const foundUser = listResult?.users?.find(u => u.email?.toLowerCase() === invitation.email.toLowerCase());
                        if (foundUser) {
                            existingUserId = foundUser.id;
                            console.log(`Found user on page ${page}: ${existingUserId}`);
                            break;
                        }

                        // If we got fewer results than perPage, we've reached the end
                        if (!listResult?.users || listResult.users.length < perPage) {
                            console.log('Reached end of user list');
                            break;
                        }

                        page++;
                    }
                }

                if (existingUserId) {
                    // Check if already member of this restaurant
                    const { data: existingMember } = await supabaseAdmin
                        .from('restaurant_members')
                        .select('id')
                        .eq('user_id', existingUserId)
                        .eq('restaurant_id', invitation.restaurant_id)
                        .maybeSingle();

                    if (existingMember) {
                        return NextResponse.json(
                            { error: 'Vous êtes déjà membre de ce restaurant. Veuillez vous connecter.' },
                            { status: 409 }
                        );
                    }

                    // Delete the orphan user
                    console.log(`Deleting user ${existingUserId}...`);
                    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(existingUserId);

                    if (deleteError) {
                        console.error('Error deleting user:', deleteError);
                        return NextResponse.json(
                            { error: 'Un compte existe déjà avec cette adresse email. Veuillez contacter le support.' },
                            { status: 409 }
                        );
                    }

                    console.log(`User deleted successfully, waiting before retry...`);
                    await new Promise(resolve => setTimeout(resolve, 2000));

                    // Retry creating user
                    const { data: retryUser, error: retryError } = await supabaseAdmin.auth.admin.createUser({
                        email: invitation.email,
                        password: password,
                        email_confirm: true,
                        user_metadata: {
                            first_name: firstName,
                            last_name: lastName,
                            role: invitation.role,
                            invitation_token: token
                        }
                    });

                    if (retryError || !retryUser.user) {
                        console.error('Retry createUser failed:', retryError);
                        return NextResponse.json(
                            { error: retryError?.message || 'Erreur lors de la création du compte après suppression' },
                            { status: 500 }
                        );
                    }

                    userId = retryUser.user.id;
                    console.log(`User created successfully on retry: ${userId}`);
                } else {
                    console.error('Could not find existing user to delete');
                    return NextResponse.json(
                        { error: 'Un compte existe déjà avec cette adresse email mais ne peut pas être trouvé. Veuillez contacter le support.' },
                        { status: 409 }
                    );
                }
            } else {
                console.error('Unexpected error creating user:', createError);
                return NextResponse.json(
                    { error: createError.message || 'Erreur lors de la création du compte' },
                    { status: 500 }
                );
            }
        } else if (newUser.user) {
            userId = newUser.user.id;
            console.log(`User created successfully: ${userId}`);
        } else {
            return NextResponse.json(
                { error: 'Erreur inattendue lors de la création du compte' },
                { status: 500 }
            );
        }

        // Create restaurant_member entry
        const { error: memberError } = await supabaseAdmin
            .from('restaurant_members')
            .insert({
                user_id: userId,
                restaurant_id: invitation.restaurant_id,
                role: invitation.role
            });

        if (memberError) {
            console.error('Error creating restaurant member:', memberError);
        }

        // Mark invitation as accepted
        const { error: updateError } = await supabaseAdmin
            .from('invitations')
            .update({ accepted_at: new Date().toISOString() })
            .eq('id', invitation.id);

        if (updateError) {
            console.error('Error updating invitation:', updateError);
        }

        return NextResponse.json({
            success: true,
            message: 'Compte créé avec succès ! Vous pouvez maintenant vous connecter.',
            email: invitation.email
        });

    } catch (error) {
        console.error('Error in accept invitation API:', error);
        return NextResponse.json(
            { error: 'Erreur interne du serveur' },
            { status: 500 }
        );
    }
}
