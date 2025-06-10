import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClientServer } from '@/lib/supabase/createServerClient';
import {
  deactivatePushSubscription,
  deletePushSubscription,
} from '@/lib/supabase/pushSubscriptions';

export async function POST(request: NextRequest) {
  try {
    const { endpoint, address, permanent = false } = await request.json();

    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint is required' }, { status: 400 });
    }

    if (!address) {
      return NextResponse.json({ error: 'User address is required' }, { status: 400 });
    }

    // Create server client
    const client = await createSupabaseClientServer();

    let result;

    if (permanent) {
      // Permanently delete the subscription
      await deletePushSubscription({
        address,
        endpoint,
        client,
      });

      console.log('Push subscription deleted permanently:', {
        address,
        endpoint,
      });

      result = {
        success: true,
        message: 'Subscription deleted permanently',
        action: 'deleted',
      };
    } else {
      // Just deactivate the subscription (soft delete)
      const deactivatedSubscription = await deactivatePushSubscription({
        address,
        endpoint,
        client,
      });

      if (!deactivatedSubscription) {
        return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
      }

      console.log('Push subscription deactivated:', {
        id: deactivatedSubscription.id,
        address: deactivatedSubscription.address,
        endpoint: endpoint,
      });

      result = {
        success: true,
        message: 'Subscription deactivated successfully',
        action: 'deactivated',
        subscriptionId: deactivatedSubscription.id,
      };
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error handling push unsubscription:', error);

    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes('required')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      // Database or other server errors
      return NextResponse.json(
        { error: 'Failed to process unsubscription. Please try again.' },
        { status: 500 },
      );
    }

    return NextResponse.json({ error: 'Failed to process unsubscription' }, { status: 500 });
  }
}
