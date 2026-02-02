import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { resend } from '@/lib/resend';

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
}

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Générer un code à 6 chiffres
function generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
    try {
        const { type, newEmail } = await request.json();

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

        // Valider le type
        if (!['email_change', 'password_change'].includes(type)) {
            return NextResponse.json({ error: 'Type de vérification invalide' }, { status: 400 });
        }

        // Pour le changement d'email, vérifier que le nouvel email est fourni
        if (type === 'email_change' && !newEmail) {
            return NextResponse.json({ error: 'Nouvel email requis' }, { status: 400 });
        }

        // Supprimer les anciens codes non utilisés pour cet utilisateur et ce type
        await supabaseAdmin
            .from('verification_codes')
            .delete()
            .eq('user_id', user.id)
            .eq('type', type);

        // Générer le nouveau code
        const code = generateCode();

        // Expiration dans 10 minutes
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 10);

        // Sauvegarder le code
        const { error: insertError } = await supabaseAdmin
            .from('verification_codes')
            .insert({
                user_id: user.id,
                email: user.email,
                code,
                type,
                new_value: type === 'email_change' ? newEmail : null,
                expires_at: expiresAt.toISOString()
            });

        if (insertError) {
            console.error('Error inserting verification code:', insertError);
            return NextResponse.json({ error: 'Erreur lors de la création du code' }, { status: 500 });
        }

        // Envoyer l'email
        if (resend) {
            const subject = type === 'email_change'
                ? 'Code de vérification - Changement d\'email'
                : 'Code de vérification - Changement de mot de passe';

            const actionText = type === 'email_change'
                ? 'changer votre adresse email'
                : 'changer votre mot de passe';

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
                        <h1 style="color: #fff; margin: 15px 0 0 0; font-size: 24px; font-weight: 600;">Code de vérification</h1>
                    </div>

                    <!-- Content -->
                    <div style="background: #1a1a1a; padding: 40px 30px;">
                        <p style="font-size: 16px; margin-bottom: 20px; color: #e5e5e5;">Bonjour,</p>

                        <p style="font-size: 15px; margin-bottom: 30px; color: #ccc; line-height: 1.7;">
                            Vous avez demandé à <strong style="color: #ff6b00;">${actionText}</strong>. Utilisez le code ci-dessous pour confirmer votre demande :
                        </p>

                        <!-- Code Box -->
                        <div style="text-align: center; margin: 40px 0;">
                            <div style="display: inline-block; background: #0a0a0a; border: 2px solid #ff6b00; border-radius: 12px; padding: 20px 40px;">
                                <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #ff6b00; font-family: monospace;">
                                    ${code}
                                </span>
                            </div>
                        </div>

                        <!-- Expiration Notice -->
                        <div style="margin-top: 30px; padding: 15px; background: #0a0a0a; border: 1px solid #333; border-radius: 6px;">
                            <p style="font-size: 13px; color: #999; text-align: center; margin: 0;">
                                Ce code expire dans <strong style="color: #ff6b00;">10 minutes</strong>.
                            </p>
                        </div>

                        <p style="font-size: 14px; margin-top: 30px; color: #666; line-height: 1.7;">
                            Si vous n'avez pas fait cette demande, vous pouvez ignorer cet email. Votre compte restera sécurisé.
                        </p>
                    </div>

                    <!-- Footer -->
                    <div style="background: #0a0a0a; padding: 25px 30px; text-align: center; border-top: 1px solid #333;">
                        <p style="font-size: 11px; color: #666; margin: 0;">
                            &copy; 2026 <strong style="color: #ff6b00;">Orizon Reservations</strong>. Tous droits réservés.
                        </p>
                    </div>
                </body>
                </html>
            `;

            try {
                await resend.emails.send({
                    from: 'Orizon Reservations <noreply@orizonsapp.com>',
                    to: user.email!,
                    subject,
                    html: emailHtml,
                });
            } catch (emailError) {
                console.error('Error sending verification email:', emailError);
                return NextResponse.json({ error: 'Erreur lors de l\'envoi de l\'email' }, { status: 500 });
            }
        } else {
            console.warn('Resend is not configured. Code:', code);
        }

        return NextResponse.json({
            success: true,
            message: 'Code envoyé par email',
            expiresAt: expiresAt.toISOString()
        });

    } catch (error) {
        console.error('Error in send-code API:', error);
        return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
    }
}
