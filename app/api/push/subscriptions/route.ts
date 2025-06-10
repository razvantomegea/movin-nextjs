import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClientServer } from '@/lib/supabase/createServerClient';
import {
  getUserPushSubscriptions,
  getAllUserPushSubscriptions,
  reactivatePushSubscription,
  getUserPushSubscriptionCount,
} from '@/lib/supabase/pushSubscriptions';

// GET: Get user's push subscriptions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const includeInactive = searchParams.get('includeInactive') === 'true';

    if (!address) {
      return NextResponse.json({ error: 'User address is required' }, { status: 400 });
    }

    // Create server client
    const client = await createSupabaseClientServer();

    // Get subscriptions based on includeInactive flag
    const subscriptions = includeInactive
      ? await getAllUserPushSubscriptions({ address, client })
      : await getUserPushSubscriptions({ address, client });

    // Get count of active subscriptions
    const activeCount = await getUserPushSubscriptionCount({ address, client });

    return NextResponse.json({
      success: true,
      data: {
        subscriptions,
        activeCount,
        totalCount: subscriptions.length,
      },
    });
  } catch (error) {
    console.error('Error fetching push subscriptions:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: 'Failed to fetch subscriptions. Please try again.' },
        { status: 500 },
      );
    }

    return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
  }
}

// PATCH: Reactivate a push subscription
export async function PATCH(request: NextRequest) {
  try {
    const { address, endpoint } = await request.json();

    if (!address || !endpoint) {
      return NextResponse.json({ error: 'Address and endpoint are required' }, { status: 400 });
    }

    // Create server client
    const client = await createSupabaseClientServer();

    // Reactivate the subscription
    const reactivatedSubscription = await reactivatePushSubscription({
      address,
      endpoint,
      client,
    });

    if (!reactivatedSubscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    console.log('Push subscription reactivated:', {
      id: reactivatedSubscription.id,
      address: reactivatedSubscription.address,
      endpoint: endpoint,
    });

    return NextResponse.json({
      success: true,
      message: 'Subscription reactivated successfully',
      data: reactivatedSubscription,
    });
  } catch (error) {
    console.error('Error reactivating push subscription:', error);

    if (error instanceof Error) {
      if (error.message.includes('required')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json(
        { error: 'Failed to reactivate subscription. Please try again.' },
        { status: 500 },
      );
    }

    return NextResponse.json({ error: 'Failed to reactivate subscription' }, { status: 500 });
  }
}
