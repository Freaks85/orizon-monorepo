import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
}

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    try {
        const { code, type, newPassword } = await request.json();

        // Récupérer le token d'authentification
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

        if (userError || !user) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        // Valider les entrées
        if (!code || !type) {
            return NextResponse.json({ error: 'Code et type requis' }, { status: 400 });
        }

        if (type === 'password_change' && !newPassword) {
            return NextResponse.json({ error: 'Nouveau mot de passe requis' }, { status: 400 });
        }

        // Rechercher le code valide
        const { data: verificationCode, error: codeError } = await supabaseAdmin
            .from('verification_codes')
            .select('*')
            .eq('user_id', user.id)
            .eq('code', code)
            .eq('type', type)
            .is('verified_at', null)
            .gt('expires_at', new Date().toISOString())
            .single();

        if (codeError || !verificationCode) {
            return NextResponse.json({ error: 'Code invalide ou expiré' }, { status: 400 });
        }

        // Marquer le code comme vérifié
        await supabaseAdmin
            .from('verification_codes')
            .update({ verified_at: new Date().toISOString() })
            .eq('id', verificationCode.id);

        // Appliquer le changement selon le type
        if (type === 'email_change') {
            // Changer l'email
            const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
                user.id,
                { email: verificationCode.new_value }
            );

            if (updateError) {
                console.error('Error updating email:', updateError);
                return NextResponse.json({ error: 'Erreur lors du changement d\'email' }, { status: 500 });
            }

            return NextResponse.json({
                success: true,
                message: 'Email modifié avec succès'
            });
        }

        if (type === 'password_change') {
            // Changer le mot de passe
            const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
                user.id,
                { password: newPassword }
            );

            if (updateError) {
                console.error('Error updating password:', updateError);
                return NextResponse.json({ error: 'Erreur lors du changement de mot de passe' }, { status: 500 });
            }

            return NextResponse.json({
                success: true,
                message: 'Mot de passe modifié avec succès'
            });
        }

        return NextResponse.json({ error: 'Type non supporté' }, { status: 400 });

    } catch (error) {
        console.error('Error in verify-code API:', error);
        return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
    }
}
