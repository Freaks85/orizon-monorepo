import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const restaurantId = session.metadata?.restaurant_id;

  if (!restaurantId) {
    console.error('Missing restaurant_id in checkout session metadata');
    return;
  }

  // La subscription sera mise à jour via l'event subscription.created
  console.log('Checkout completed for restaurant:', restaurantId);
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const restaurantId = subscription.metadata?.restaurant_id;

  if (!restaurantId) {
    // Essayer de retrouver via le customer
    const customer = await stripe.customers.retrieve(subscription.customer as string);
    if ('deleted' in customer) return;

    const metaRestaurantId = customer.metadata?.restaurant_id;
    if (!metaRestaurantId) {
      console.error('Cannot find restaurant_id for subscription:', subscription.id);
      return;
    }

    await updateSubscriptionInDb(metaRestaurantId, subscription);
    return;
  }

  await updateSubscriptionInDb(restaurantId, subscription);
}

async function updateSubscriptionInDb(restaurantId: string, subscription: Stripe.Subscription) {
  // Get period dates from subscription items (new Stripe API structure)
  const subscriptionItem = subscription.items.data[0];
  const currentPeriodStart = subscriptionItem?.current_period_start || (subscription as any).current_period_start;
  const currentPeriodEnd = subscriptionItem?.current_period_end || (subscription as any).current_period_end;

  const { error } = await supabaseAdmin
    .from('subscriptions')
    .upsert({
      restaurant_id: restaurantId,
      stripe_customer_id: subscription.customer as string,
      stripe_subscription_id: subscription.id,
      stripe_price_id: subscriptionItem?.price.id || null,
      status: subscription.status,
      trial_start: subscription.trial_start
        ? new Date(subscription.trial_start * 1000).toISOString()
        : null,
      trial_end: subscription.trial_end
        ? new Date(subscription.trial_end * 1000).toISOString()
        : null,
      current_period_start: currentPeriodStart
        ? new Date(currentPeriodStart * 1000).toISOString()
        : null,
      current_period_end: currentPeriodEnd
        ? new Date(currentPeriodEnd * 1000).toISOString()
        : null,
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'restaurant_id'
    });

  if (error) {
    console.error('Error updating subscription in DB:', error);
    throw error;
  }

  console.log('Subscription updated for restaurant:', restaurantId, 'Status:', subscription.status);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const restaurantId = subscription.metadata?.restaurant_id;

  if (!restaurantId) {
    // Retrouver via stripe_subscription_id
    const { data: existingSub } = await supabaseAdmin
      .from('subscriptions')
      .select('restaurant_id')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    if (existingSub) {
      await supabaseAdmin
        .from('subscriptions')
        .update({
          status: 'canceled',
          canceled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('restaurant_id', existingSub.restaurant_id);

      console.log('Subscription canceled for restaurant:', existingSub.restaurant_id);
    }
    return;
  }

  await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('restaurant_id', restaurantId);

  console.log('Subscription canceled for restaurant:', restaurantId);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = (invoice as any).subscription;
  if (!subscriptionId) return;

  const { data: existingSub } = await supabaseAdmin
    .from('subscriptions')
    .select('restaurant_id')
    .eq('stripe_subscription_id', subscriptionId as string)
    .single();

  if (existingSub) {
    await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'past_due',
        updated_at: new Date().toISOString()
      })
      .eq('restaurant_id', existingSub.restaurant_id);

    console.log('Payment failed, marked as past_due for restaurant:', existingSub.restaurant_id);
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const subscriptionId = (invoice as any).subscription;
  if (!subscriptionId) return;

  // Récupérer la subscription mise à jour
  const subscription = await stripe.subscriptions.retrieve(subscriptionId as string);

  const { data: existingSub } = await supabaseAdmin
    .from('subscriptions')
    .select('restaurant_id')
    .eq('stripe_subscription_id', subscription.id)
    .single();

  if (existingSub) {
    await updateSubscriptionInDb(existingSub.restaurant_id, subscription);
    console.log('Invoice paid, subscription updated for restaurant:', existingSub.restaurant_id);
  }
}
