import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const restaurantId = searchParams.get('restaurant_id');

  if (!restaurantId) {
    return NextResponse.json({ error: 'Missing restaurant_id' }, { status: 400 });
  }

  const { data: subscription, error } = await supabaseAdmin
    .from('subscriptions')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .single();

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Déterminer les états d'accès
  const isValid = subscription && ['trialing', 'active'].includes(subscription.status);
  const isTrialing = subscription?.status === 'trialing';
  const isPastDue = subscription?.status === 'past_due';
  const isExpired = subscription && ['canceled', 'unpaid', 'incomplete_expired'].includes(subscription.status);

  // Calculer les jours restants d'essai
  let trialDaysRemaining = 0;
  if (subscription?.trial_end && isTrialing) {
    const trialEnd = new Date(subscription.trial_end);
    const now = new Date();
    trialDaysRemaining = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  }

  // Permissions basées sur le statut
  const canCreateReservations = isValid || isPastDue;
  const canAccessFeatures = isValid || isPastDue;
  const canViewReservations = true; // Toujours accessible
  const isPublicPageEnabled = isValid || isPastDue;

  return NextResponse.json({
    subscription,
    isValid: !!isValid,
    isTrialing: !!isTrialing,
    isPastDue: !!isPastDue,
    isExpired: !!isExpired,
    trialDaysRemaining,
    canCreateReservations,
    canAccessFeatures,
    canViewReservations,
    isPublicPageEnabled,
    hasSubscription: !!subscription
  });
}
