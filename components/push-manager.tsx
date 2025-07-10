'use client';

import { useEffect, useState } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { Bell, BellOff } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { Button } from '@/components/ui/button';
import { showSuccessToast, showErrorToast } from '@/lib/redux/slices/toastSlice';
import {
  checkPushNotificationSupport,
  setupPushNotifications,
  teardownPushNotifications,
  getCurrentPushSubscription,
  type PushNotificationSupport,
} from '@/utils/pwa/pushNotifications';

interface PushManagerProps {
  onSubscriptionChange?: (subscription: PushSubscription | null) => void;
}

export default function PushManager({ onSubscriptionChange }: PushManagerProps) {
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [loading, setLoading] = useState(false);
  const [support, setSupport] = useState<PushNotificationSupport>({
    supported: false,
    serviceWorkerSupported: false,
    pushManagerSupported: false,
    notificationSupported: false,
    vapidConfigured: false,
  });
  const { address, isConnected } = useAppKitAccount();
  const dispatch = useDispatch();

  useEffect(() => {
    // Check support and existing subscription
    const checkSupportAndSubscription = async () => {
      const currentSupport = checkPushNotificationSupport();
      setSupport(currentSupport);

      if (currentSupport.supported) {
        try {
          const existingSubscription = await getCurrentPushSubscription();
          if (existingSubscription) {
            setSubscription(existingSubscription);
            onSubscriptionChange?.(existingSubscription);
          }
        } catch (error) {
          console.error('Error checking existing subscription:', error);
        }
      }
    };

    checkSupportAndSubscription();
  }, [onSubscriptionChange]);

  const subscribe = async () => {
    if (!support.supported) {
      const issues = [];
      if (!support.serviceWorkerSupported) issues.push('Service Workers');
      if (!support.pushManagerSupported) issues.push('Push Manager');
      if (!support.notificationSupported) issues.push('Notifications');
      if (!support.vapidConfigured) issues.push('Push configuration');

      dispatch(
        showErrorToast({
          title: 'Not Supported',
          description: `Missing support for: ${issues.join(', ')}`,
        }),
      );
      return;
    }

    if (!isConnected || !address) {
      dispatch(
        showErrorToast({
          title: 'Wallet Not Connected',
          description: 'Please connect your wallet to enable push notifications.',
        }),
      );
      return;
    }

    setLoading(true);

    try {
      const result = await setupPushNotifications(address);

      if (result.success && result.subscription) {
        setSubscription(result.subscription);
        onSubscriptionChange?.(result.subscription);

        dispatch(
          showSuccessToast({
            title: 'Notifications Enabled',
            description: "You'll now receive push notifications for important updates.",
          }),
        );
      } else {
        dispatch(
          showErrorToast({
            title: 'Subscription Failed',
            description: result.error || 'Unable to enable push notifications. Please try again.',
          }),
        );
      }
    } catch (error) {
      console.error('Subscription failed:', error);
      dispatch(
        showErrorToast({
          title: 'Subscription Failed',
          description: 'Unable to enable push notifications. Please try again.',
        }),
      );
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async () => {
    if (!subscription) return;

    setLoading(true);

    try {
      const success = await teardownPushNotifications(address);

      if (success) {
        setSubscription(null);
        onSubscriptionChange?.(null);

        dispatch(
          showSuccessToast({
            title: 'Notifications Disabled',
            description: 'You will no longer receive push notifications.',
          }),
        );
      } else {
        dispatch(
          showErrorToast({
            title: 'Error',
            description: 'Failed to disable notifications. Please try again.',
          }),
        );
      }
    } catch (error) {
      console.error('Unsubscription failed:', error);
      dispatch(
        showErrorToast({
          title: 'Error',
          description: 'Failed to disable notifications. Please try again.',
        }),
      );
    } finally {
      setLoading(false);
    }
  };

  if (!support.supported) {
    const issues = [];
    if (!support.serviceWorkerSupported) issues.push('Service Workers');
    if (!support.pushManagerSupported) issues.push('Push Manager');
    if (!support.notificationSupported) issues.push('Notifications');
    if (!support.vapidConfigured) issues.push('Push configuration');

    return (
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Push notifications not supported: Missing {issues.join(', ')}
      </div>
    );
  }

  return (
    <Button
      onClick={subscription ? unsubscribe : subscribe}
      disabled={loading}
      variant={subscription ? 'outline' : 'default'}
      className="flex items-center gap-2"
    >
      {loading ? (
        <>
          <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
          {subscription ? 'Disabling...' : 'Enabling...'}
        </>
      ) : subscription ? (
        <>
          <BellOff className="h-4 w-4" />
          Disable Notifications
        </>
      ) : (
        <>
          <Bell className="h-4 w-4" />
          Enable Notifications
        </>
      )}
    </Button>
  );
}
