import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { createSupabaseClientServer } from '@/lib/supabase/createServerClient';
import { getUserPushSubscriptions } from '@/lib/supabase/pushSubscriptions';

// Configure web-push with VAPID keys
if (
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
  process.env.VAPID_PRIVATE_KEY &&
  process.env.VAPID_EMAIL
) {
  // Ensure VAPID subject is properly formatted (must be URL or mailto: email)
  const vapidSubject = process.env.VAPID_EMAIL.startsWith('mailto:')
    ? process.env.VAPID_EMAIL
    : `mailto:${process.env.VAPID_EMAIL}`;

  webpush.setVapidDetails(
    vapidSubject,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );
}

export async function POST(request: NextRequest) {
  try {
    const {
      address,
      title,
      body,
      icon,
      badge,
      data,
      url,
      tag = 'movin-notification',
    } = await request.json();

    // Validate required fields
    if (!address || !title || !body) {
      return NextResponse.json({ error: 'Address, title, and body are required' }, { status: 400 });
    }

    // Check VAPID configuration
    if (
      !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
      !process.env.VAPID_PRIVATE_KEY ||
      !process.env.VAPID_EMAIL
    ) {
      return NextResponse.json({ error: 'VAPID keys not configured' }, { status: 500 });
    }

    // Get server client
    const client = await createSupabaseClientServer();

    // Get user's active push subscriptions
    const subscriptions = await getUserPushSubscriptions({
      address: address.toLowerCase(),
      client,
    });

    if (subscriptions.length === 0) {
      return NextResponse.json(
        { error: 'No active push subscriptions found for this user' },
        { status: 404 },
      );
    }

    // Prepare notification payload
    const payload = JSON.stringify({
      title,
      body,
      icon: icon || '/icons/icon-192.webp',
      badge: badge || '/icons/icon-96.webp',
      tag,
      data: {
        url: url || '/dashboard',
        timestamp: Date.now(),
        ...data,
      },
      actions: [
        {
          action: 'open',
          title: 'Open App',
        },
      ],
      requireInteraction: false,
      vibrate: [200, 100, 200],
    });

    const pushPromises = subscriptions.map(async (subscription) => {
      try {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
        };

        await webpush.sendNotification(pushSubscription, payload);
        return { success: true, endpoint: subscription.endpoint };
      } catch (error) {
        console.error(`Failed to send notification to ${subscription.endpoint}:`, error);

        // Handle expired subscriptions
        if (error instanceof Error && error.message.includes('410')) {
          // TODO: Mark subscription as inactive in database
          console.log('Subscription expired, should mark as inactive');
        }

        return {
          success: false,
          endpoint: subscription.endpoint,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });

    const results = await Promise.allSettled(pushPromises);
    const successful = results.filter(
      (result) => result.status === 'fulfilled' && result.value.success,
    ).length;

    return NextResponse.json({
      success: true,
      message: `Notification sent to ${successful}/${subscriptions.length} subscriptions`,
      results: results.map((result) =>
        result.status === 'fulfilled'
          ? result.value
          : { success: false, error: 'Promise rejected' },
      ),
    });
  } catch (error) {
    console.error('Error sending push notification:', error);
    return NextResponse.json({ error: 'Failed to send push notification' }, { status: 500 });
  }
}
