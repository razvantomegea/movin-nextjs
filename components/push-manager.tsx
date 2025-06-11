'use client';

import { useEffect, useState } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { useAppKitAccount } from '@reown/appkit/react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

interface PushManagerProps {
  onSubscriptionChange?: (subscription: PushSubscription | null) => void;
}

export default function PushManager({ onSubscriptionChange }: PushManagerProps) {
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const { address, isConnected } = useAppKitAccount();
  const { toast } = useToast();

  useEffect(() => {
    // Enhanced browser compatibility checks
    const supported =
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window &&
      'showNotification' in ServiceWorkerRegistration.prototype;

    setIsSupported(supported);
    setPermission(Notification.permission);

    if (supported) {
      const checkExistingSubscription = async () => {
        try {
          // Wait for service worker to be ready (registered by InstallPWA)
          const registration = await navigator.serviceWorker.ready;
          const existingSubscription = await registration.pushManager.getSubscription();

          if (existingSubscription) {
            setSubscription(existingSubscription);
            onSubscriptionChange?.(existingSubscription);
          }
        } catch (error) {
          console.error('Error checking subscription:', error);
        }
      };

      // Check for existing subscription after a brief delay to ensure service worker is ready
      setTimeout(checkExistingSubscription, 1000);
    }
  }, [onSubscriptionChange]);

  const urlBase64ToUint8Array = (base64String: string) => {
    if (!base64String?.trim()) {
      throw new Error('Invalid VAPID public key');
    }

    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribe = async () => {
    if (!isSupported) {
      toast({
        title: 'Not Supported',
        description: 'Push notifications are not supported in this browser.',
        variant: 'destructive',
      });
      return;
    }

    if (!isConnected || !address) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to enable push notifications.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    let createdSubscription: PushSubscription | null = null;

    try {
      // Request permission
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission === 'denied') {
        toast({
          title: 'Permission Blocked',
          description: 'Please enable notifications in your browser settings and try again.',
          variant: 'destructive',
        });
        return;
      }

      if (permission !== 'granted') {
        toast({
          title: 'Permission Denied',
          description: 'Notifications permission is required to receive updates.',
          variant: 'destructive',
        });
        return;
      }

      // Use the service worker registration (should already be ready from InstallPWA)
      const registration = await navigator.serviceWorker.ready;
      console.log('Using service worker registration:', registration);

      // Check if VAPID key is configured
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      if (!vapidPublicKey?.trim()) {
        toast({
          title: 'Configuration Error',
          description: 'Push notifications are not properly configured. Please contact support.',
          variant: 'destructive',
        });
        console.error('VAPID public key is not configured in environment variables');
        return;
      }

      createdSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      setSubscription(createdSubscription);
      onSubscriptionChange?.(createdSubscription);

      // Send subscription to your server
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: createdSubscription.toJSON(),
          address: address.toLowerCase(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save subscription: ${response.status}`);
      }

      toast({
        title: 'Notifications Enabled',
        description: "You'll now receive push notifications for important updates.",
      });
    } catch (error) {
      console.error('Subscription failed:', error);

      // Cleanup failed subscription
      if (createdSubscription) {
        try {
          await createdSubscription.unsubscribe();
          setSubscription(null);
          onSubscriptionChange?.(null);
        } catch (cleanupError) {
          console.warn('Failed to cleanup subscription:', cleanupError);
        }
      }

      let errorMessage = 'Unable to enable push notifications. Please try again.';

      if (error instanceof Error) {
        if (error.message.includes('VAPID') || error.message.includes('Invalid')) {
          errorMessage = 'Push notifications are not properly configured.';
        } else if (error.message.includes('not supported')) {
          errorMessage = 'Push notifications are not supported on this device.';
        } else if (error.message.includes('aborted') || error.message.includes('Service Worker')) {
          errorMessage = 'Service worker not ready. Please try again in a moment.';
        }
      }

      toast({
        title: 'Subscription Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async () => {
    if (!subscription) return;

    setLoading(true);

    try {
      await subscription.unsubscribe();

      // Remove subscription from your server
      const response = await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
        }),
      });

      if (!response.ok) {
        console.warn(`Failed to remove subscription from server: ${response.status}`);
        // Continue with local cleanup even if server cleanup fails
      }

      setSubscription(null);
      onSubscriptionChange?.(null);

      toast({
        title: 'Notifications Disabled',
        description: 'You will no longer receive push notifications.',
      });
    } catch (error) {
      console.error('Unsubscription failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to disable notifications. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Push notifications are not supported in this browser
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
