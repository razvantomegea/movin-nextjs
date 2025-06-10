import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import webpush from 'web-push';

// Check if VAPID keys are available
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidMailto = process.env.VAPID_MAILTO || 'mailto:example@example.com';

// Only set VAPID details if all keys are available
if (vapidPublicKey && vapidPrivateKey) {
  try {
    webpush.setVapidDetails(vapidMailto, vapidPublicKey, vapidPrivateKey);
  } catch (error) {
    console.error('Failed to set VAPID details:', error);
  }
}

export async function POST(request: Request) {
  try {
    // Check if VAPID keys are available
    if (!vapidPublicKey || !vapidPrivateKey) {
      return NextResponse.json(
        { error: 'Push notifications are not configured. Missing VAPID keys.' },
        { status: 500 },
      );
    }

    const body = await request.json();
    const { title, message, userId, tag, url } = body;

    if (!title || !message) {
      return NextResponse.json({ error: 'Title and message are required' }, { status: 400 });
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Query to get subscriptions
    let query = supabase.from('push_subscriptions').select('*');

    // If userId is provided, filter by user
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: subscriptions, error } = await query;

    if (error) {
      console.error('Error fetching push subscriptions:', error);
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ message: 'No subscriptions found' }, { status: 404 });
    }

    // Prepare notification payload
    const notificationPayload = {
      title,
      body: message,
      tag: tag || 'default',
      data: {
        url: url || '/',
      },
    };

    // Send notifications to all subscriptions
    const results = await Promise.allSettled(
      subscriptions.map(async (subscription) => {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
        };

        try {
          await webpush.sendNotification(pushSubscription, JSON.stringify(notificationPayload));
          return { success: true, endpoint: subscription.endpoint };
        } catch (error) {
          console.error('Error sending notification:', error);

          // If subscription is no longer valid, remove it
          if (error instanceof Error && error.message.includes('subscription has unsubscribed')) {
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('endpoint', subscription.endpoint);
          }

          return { success: false, endpoint: subscription.endpoint, error };
        }
      }),
    );

    const successful = results.filter(
      (result) => result.status === 'fulfilled' && result.value.success,
    ).length;

    return NextResponse.json(
      {
        message: `Notifications sent successfully to ${successful} out of ${subscriptions.length} subscribers`,
        results,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Push notification send error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
