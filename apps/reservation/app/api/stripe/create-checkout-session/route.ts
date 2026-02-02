import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { restaurant_id } = await request.json();

    if (!restaurant_id) {
      return NextResponse.json({ error: 'Missing restaurant_id' }, { status: 400 });
    }

    // Vérifier que l'utilisateur est owner du restaurant
    const { data: membership } = await supabaseAdmin
      .from('restaurant_members')
      .select('role')
      .eq('restaurant_id', restaurant_id)
      .eq('user_id', user.id)
      .single();

    if (!membership || membership.role !== 'owner') {
      return NextResponse.json({ error: 'Only owners can manage subscriptions' }, { status: 403 });
    }

    // Vérifier si une subscription existe déjà
    const { data: existingSubscription } = await supabaseAdmin
      .from('subscriptions')
      .select('stripe_customer_id, stripe_subscription_id, status')
      .eq('restaurant_id', restaurant_id)
      .single();

    let customerId: string;

    if (existingSubscription?.stripe_customer_id) {
      customerId = existingSubscription.stripe_customer_id;

      // Si la subscription est active, rediriger vers le portal
      if (['trialing', 'active'].includes(existingSubscription.status)) {
        return NextResponse.json({
          error: 'Active subscription exists',
          redirect: 'portal'
        }, { status: 400 });
      }
    } else {
      // Récupérer les infos du restaurant
      const { data: restaurant } = await supabaseAdmin
        .from('restaurants')
        .select('name, email')
        .eq('id', restaurant_id)
        .single();

      // Créer un nouveau customer Stripe
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        name: restaurant?.name || undefined,
        metadata: {
          restaurant_id,
          user_id: user.id
        }
      });

      customerId = customer.id;

      // Créer l'entrée subscription (incomplète)
      await supabaseAdmin
        .from('subscriptions')
        .upsert({
          restaurant_id,
          stripe_customer_id: customerId,
          status: 'incomplete'
        }, {
          onConflict: 'restaurant_id'
        });
    }

    // Créer la session Checkout avec essai de 7 jours
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{
        price: process.env.STRIPE_PRICE_ID!,
        quantity: 1
      }],
      subscription_data: {
        trial_period_days: 7,
        metadata: {
          restaurant_id
        }
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscription=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscription=canceled`,
      metadata: {
        restaurant_id,
        user_id: user.id
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      customer_update: {
        address: 'auto',
        name: 'auto'
      }
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout session error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
