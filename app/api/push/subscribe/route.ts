import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClientServer } from '@/lib/supabase/createServerClient';
import { upsertPushSubscription, IPushSubscriptionPayload } from '@/lib/supabase/pushSubscriptions';

export async function POST(request: NextRequest) {
  try {
    const { subscription, address } = await request.json();

    // Validate required data
    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: 'Invalid subscription data' }, { status: 400 });
    }

    if (!address) {
      return NextResponse.json({ error: 'User address is required' }, { status: 400 });
    }

    if (!subscription.keys?.p256dh || !subscription.keys?.auth) {
      return NextResponse.json({ error: 'Invalid subscription keys' }, { status: 400 });
    }

    // Get user agent for tracking
    const userAgent = request.headers.get('user-agent') || undefined;

    // Create server client
    const client = await createSupabaseClientServer();

    // Prepare subscription data
    const subscriptionData: IPushSubscriptionPayload = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    };

    // Save subscription to database
    const savedSubscription = await upsertPushSubscription({
      address,
      subscriptionData,
      userAgent,
      client,
    });

    console.log('Push subscription saved:', {
      id: savedSubscription.id,
      address: savedSubscription.address,
      endpoint: subscription.endpoint,
    });

    return NextResponse.json({
      success: true,
      message: 'Subscription saved successfully',
      subscriptionId: savedSubscription.id,
    });
  } catch (error) {
    console.error('Error handling push subscription:', error);

    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes('required')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      if (error.message.includes('Invalid')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      // Database or other server errors
      return NextResponse.json(
        { error: 'Failed to save subscription. Please try again.' },
        { status: 500 },
      );
    }

    return NextResponse.json({ error: 'Failed to process subscription' }, { status: 500 });
  }
}
