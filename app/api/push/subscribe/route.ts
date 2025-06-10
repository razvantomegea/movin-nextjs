import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Push subscription validation interface
interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// Validate push subscription structure
function validatePushSubscription(subscription: unknown): subscription is PushSubscription {
  if (!subscription || typeof subscription !== 'object') {
    return false;
  }

  const sub = subscription as Record<string, unknown>;

  if (!sub.endpoint || typeof sub.endpoint !== 'string' || sub.endpoint.trim() === '') {
    return false;
  }

  if (!sub.keys || typeof sub.keys !== 'object') {
    return false;
  }

  const keys = sub.keys as Record<string, unknown>;

  if (!keys.p256dh || typeof keys.p256dh !== 'string' || keys.p256dh.trim() === '') {
    return false;
  }

  if (!keys.auth || typeof keys.auth !== 'string' || keys.auth.trim() === '') {
    return false;
  }

  return true;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { subscription } = body;

    // Validate subscription object structure
    if (!validatePushSubscription(subscription)) {
      return NextResponse.json(
        {
          error:
            'Invalid push subscription data. Required: endpoint, keys.p256dh, and keys.auth as non-empty strings',
        },
        { status: 400 },
      );
    }

    // Validate environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || supabaseUrl.trim() === '') {
      console.error('NEXT_PUBLIC_SUPABASE_URL environment variable is not defined or empty');
      return NextResponse.json(
        {
          error: 'Server configuration error: Supabase URL not configured',
        },
        { status: 500 },
      );
    }

    if (!supabaseKey || supabaseKey.trim() === '') {
      console.error('SUPABASE_SERVICE_ROLE_KEY environment variable is not defined or empty');
      return NextResponse.json(
        {
          error: 'Server configuration error: Supabase service key not configured',
        },
        { status: 500 },
      );
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Store the subscription in the database
    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        user_id: body.userId || null, // If you have user authentication
        created_at: new Date().toISOString(),
      },
      { onConflict: 'endpoint' },
    );

    if (error) {
      console.error('Error storing push subscription:', error);
      return NextResponse.json({ error: 'Failed to store subscription' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Subscription saved successfully' }, { status: 201 });
  } catch (error) {
    console.error('Push subscription error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
