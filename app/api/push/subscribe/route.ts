import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { subscription } = await request.json();

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: 'Invalid subscription data' }, { status: 400 });
    }

    // Here you would typically:
    // 1. Store the subscription in your database
    // 2. Associate it with the current user
    // 3. Handle any existing subscriptions for the same user

    console.log('Push subscription received:', {
      endpoint: subscription.endpoint,
      keys: subscription.keys,
    });

    // For now, we'll just acknowledge the subscription
    // In production, you'd save this to your database
    // Example:
    // await saveSubscriptionToDatabase(subscription, userId);

    return NextResponse.json({
      success: true,
      message: 'Subscription saved successfully',
    });
  } catch (error) {
    console.error('Error handling push subscription:', error);

    return NextResponse.json({ error: 'Failed to process subscription' }, { status: 500 });
  }
}
