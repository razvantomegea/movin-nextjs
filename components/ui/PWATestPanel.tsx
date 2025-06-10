'use client';

import { useState, useEffect } from 'react';
import {
  Wifi,
  WifiOff,
  Download,
  Bell,
  Smartphone,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import useOfflineSync from '@/lib/hooks/useOfflineSync';
import usePushNotifications from '@/lib/hooks/usePushNotifications';

// Interface for the install prompt event
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Extend Navigator interface to include standalone property for iOS
interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

export default function PWATestPanel() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  // Offline sync hook
  const { isOnline, isSyncing, addOfflineItem, syncData } = useOfflineSync();

  // Push notifications hook
  const {
    isSupported: isPushSupported,
    permissionState,
    subscription,
    isVapidConfigured,
    subscribe,
    sendTestNotification,
  } = usePushNotifications();

  useEffect(() => {
    // Check if app is already installed
    const checkInstallStatus = () => {
      if (
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as NavigatorWithStandalone)?.standalone === true
      ) {
        setIsInstalled(true);
      }
    };

    checkInstallStatus();

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Install PWA
  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        toast.success('App installed successfully!');
        setIsInstalled(true);
      } else {
        toast.info('Installation cancelled');
      }

      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  };

  // Test offline sync
  const testOfflineSync = async () => {
    try {
      const testData = {
        title: 'Test Activity',
        description: `Test sync performed at ${new Date().toISOString()}`,
        created_at: new Date().toISOString(),
        calories_burned: 100,
        duration_minutes: 30,
        activity_type: 'test',
      };

      const id = await addOfflineItem('activity', testData);
      toast.success(`Test data stored offline (ID: ${id.slice(0, 8)}...)`);

      if (isOnline) {
        toast.info('Triggering sync...');
        setTimeout(() => syncData(), 1000);
      } else {
        toast.info('Data will sync when back online');
      }
    } catch (error) {
      toast.error('Failed to store test data');
      console.error('Offline sync test error:', error);
    }
  };

  // Test push notifications
  const testPushNotifications = async () => {
    try {
      if (!subscription) {
        toast.info('Subscribing to notifications...');
        const success = await subscribe();
        if (!success) {
          toast.error('Failed to subscribe to notifications');
          return;
        }
        toast.success('Successfully subscribed to notifications');
      }

      toast.info('Sending test notification...');
      const success = await sendTestNotification();
      if (success) {
        toast.success('Test notification sent! Check your browser notifications.');
      } else {
        toast.error('Failed to send test notification. Check console for details.');
      }
    } catch (error) {
      toast.error('Push notification test failed');
      console.error('Push notification test error:', error);
    }
  };

  // Force manual sync
  const handleManualSync = async () => {
    const success = await syncData();
    if (success) {
      toast.success('Manual sync completed');
    } else {
      toast.error('Manual sync failed');
    }
  };

  const getStatusIcon = (condition: boolean) => {
    return condition ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getWarningIcon = () => <AlertCircle className="h-4 w-4 text-yellow-500" />;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          PWA Features Test Panel
        </CardTitle>
        <CardDescription>Test and verify Progressive Web App functionality</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Installation Status */}
        <div className="space-y-3">
          <h3 className="font-medium flex items-center gap-2">
            <Download className="h-4 w-4" />
            Installation
          </h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(isInstalled)}
              <span className="text-sm">
                {isInstalled ? 'App is installed' : 'App not installed'}
              </span>
            </div>
            {isInstallable && !isInstalled && (
              <Button size="sm" onClick={handleInstall}>
                Install App
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(isInstallable || isInstalled)}
            <span className="text-sm">PWA Installation Ready</span>
          </div>
        </div>

        {/* Network Status */}
        <div className="space-y-3">
          <h3 className="font-medium flex items-center gap-2">
            {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
            Network & Offline Support
          </h3>
          <div className="flex items-center gap-2">
            <Badge variant={isOnline ? 'default' : 'destructive'}>
              {isOnline ? 'Online' : 'Offline'}
            </Badge>
            {isSyncing && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Syncing...
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={testOfflineSync}>
              Test Offline Storage
            </Button>
            <Button size="sm" variant="outline" onClick={handleManualSync}>
              Manual Sync
            </Button>
          </div>
        </div>

        {/* Push Notifications */}
        <div className="space-y-3">
          <h3 className="font-medium flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Push Notifications
          </h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {getStatusIcon(isPushSupported)}
              <span className="text-sm">Browser Support</span>
            </div>
            <div className="flex items-center gap-2">
              {isVapidConfigured ? getStatusIcon(true) : getWarningIcon()}
              <span className="text-sm">Server Configuration</span>
              {!isVapidConfigured && (
                <Badge variant="secondary">
                  VAPID Keys Missing - Set NEXT_PUBLIC_VAPID_PUBLIC_KEY
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(permissionState === 'granted')}
              <span className="text-sm">Permission Status</span>
              <Badge
                variant={
                  permissionState === 'granted'
                    ? 'default'
                    : permissionState === 'denied'
                    ? 'destructive'
                    : 'secondary'
                }
              >
                {permissionState}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(Boolean(subscription))}
              <span className="text-sm">Subscription Active</span>
            </div>
          </div>
          {isPushSupported && isVapidConfigured && (
            <Button
              size="sm"
              onClick={testPushNotifications}
              disabled={permissionState === 'denied'}
            >
              Test Push Notification
            </Button>
          )}
        </div>

        {/* Service Worker Status */}
        <div className="space-y-3">
          <h3 className="font-medium">Service Worker</h3>
          <div className="flex items-center gap-2">
            {getStatusIcon('serviceWorker' in navigator)}
            <span className="text-sm">Service Worker Support</span>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon('SyncManager' in window)}
            <span className="text-sm">Background Sync Support</span>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon('caches' in window)}
            <span className="text-sm">Cache API Support</span>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon('indexedDB' in window)}
            <span className="text-sm">IndexedDB Support</span>
          </div>
        </div>

        {/* Overall Status */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">PWA Score</span>
            <Badge variant="default" className="text-lg px-3 py-1">
              {
                [
                  isInstalled || isInstallable,
                  'serviceWorker' in navigator,
                  isPushSupported && isVapidConfigured,
                  'caches' in window,
                  'indexedDB' in window,
                  isOnline,
                ].filter(Boolean).length
              }
              /6
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
