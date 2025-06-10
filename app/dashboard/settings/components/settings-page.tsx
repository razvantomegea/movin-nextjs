'use client';

import { motion } from 'framer-motion';
import { Trash2, Download, Upload, Shield, Crown, ExternalLink, Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useMovinEarn } from '@/lib/hooks/useMovinEarn';
import usePushNotifications from '@/lib/hooks/usePushNotifications';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';

// Dynamically import PWA test panel to avoid SSR issues
const PWATestPanel = dynamic(() => import('@/components/ui/PWATestPanel'), {
  ssr: false,
});

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function SettingsPage() {
  const router = useRouter();
  const { usePremiumStatus } = useMovinEarn();
  const { isPremiumActive } = usePremiumStatus();
  const isPremium = isPremiumActive();

  // Push notification state
  const {
    isSupported: isPushSupported,
    permissionState,
    subscription,
    isSubscribing,
    isVapidConfigured,
    subscribe,
    unsubscribe,
  } = usePushNotifications();

  const [dailyReminders, setDailyReminders] = useState(true);
  const [goalAchievements, setGoalAchievements] = useState(true);
  const [rewardUpdates, setRewardUpdates] = useState(true);
  const [showPWATestPanel, setShowPWATestPanel] = useState(false);

  // Compute notifications enabled state from subscription - no local state needed
  const notificationsEnabled = Boolean(subscription);

  // Debug log when subscription changes
  useEffect(() => {
    console.log('Subscription state changed:', {
      subscription: !!subscription,
      notificationsEnabled,
      permissionState,
    });
  }, [subscription, notificationsEnabled, permissionState]);

  // Handle notification toggle
  const handleNotificationToggle = async (enabled: boolean) => {
    console.log('Notification toggle triggered:', { enabled, currentSubscription: !!subscription });

    if (enabled) {
      const success = await subscribe();
      console.log('Subscribe result:', success);

      if (success) {
        toast.success('Notifications enabled successfully');
      } else {
        console.error('Failed to subscribe to notifications');
        toast.error('Failed to enable notifications. Please try again.');
      }
    } else {
      const success = await unsubscribe();
      console.log('Unsubscribe result:', success);

      if (success) {
        toast.success('Notifications disabled successfully');
      } else {
        console.error('Failed to unsubscribe from notifications');
        toast.error('Failed to disable notifications. Please try again.');
      }
    }
  };

  // Check if notifications can be enabled
  const canEnableNotifications =
    isPushSupported && isVapidConfigured && permissionState !== 'denied';

  return (
    <motion.div className="p-4" initial="hidden" animate="show" variants={container}>
      <motion.div className="mb-6" variants={item}>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your app preferences</p>
      </motion.div>

      <div className="space-y-6">
        <motion.div variants={item}>
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize how the app looks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Theme</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Choose between light and dark mode
                  </p>
                </div>
                <ThemeToggle />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Crown className="h-5 w-5 text-yellow-400 mr-2" />
                Subscription
              </CardTitle>
              <CardDescription>Manage your subscription plan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Current Plan</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {isPremium ? 'Premium' : 'Free'} plan
                  </p>
                </div>
                <Button onClick={() => router.push('/dashboard/subscription')}>
                  {isPremium ? 'Manage' : 'Upgrade'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Manage your notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center">
                    <Bell className="h-4 w-4 mr-2 text-blue-500" />
                    Enable Push Notifications
                  </Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Receive updates about your activity and achievements
                  </p>
                  {!canEnableNotifications && (
                    <p className="text-sm text-destructive">
                      {!isPushSupported && 'Push notifications not supported in this browser'}
                      {!isVapidConfigured && 'Push notifications not configured on server'}
                      {permissionState === 'denied' && 'Notifications blocked in browser settings'}
                    </p>
                  )}
                </div>
                <Switch
                  checked={notificationsEnabled}
                  onCheckedChange={handleNotificationToggle}
                  disabled={!canEnableNotifications || isSubscribing}
                />
              </div>

              {notificationsEnabled && (
                <div className="pt-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Daily Reminders</Label>
                    <Switch checked={dailyReminders} onCheckedChange={setDailyReminders} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Goal Achievements</Label>
                    <Switch checked={goalAchievements} onCheckedChange={setGoalAchievements} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Reward Updates</Label>
                    <Switch checked={rewardUpdates} onCheckedChange={setRewardUpdates} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* PWA Test Panel - Only show in development or for testing */}
        {(process.env.NODE_ENV === 'development' || showPWATestPanel) && (
          <motion.div variants={item}>
            <PWATestPanel />
          </motion.div>
        )}

        {/* PWA Test Panel Toggle for production */}
        {process.env.NODE_ENV !== 'development' && (
          <motion.div variants={item}>
            <Card>
              <CardHeader>
                <CardTitle>Developer Tools</CardTitle>
                <CardDescription>Advanced settings for testing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>PWA Test Panel</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Show advanced PWA testing features
                    </p>
                  </div>
                  <Switch checked={showPWATestPanel} onCheckedChange={setShowPWATestPanel} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <motion.div variants={item}>
          <Card>
            <CardHeader>
              <CardTitle>Data & Privacy</CardTitle>
              <CardDescription>Manage your data and privacy settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="pt-2 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="flex items-center">
                      <Download className="h-4 w-4 mr-2 text-blue-500" />
                      Export Data
                    </Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Download all your activity data
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/dashboard/settings/export-data')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="flex items-center">
                      <Upload className="h-4 w-4 mr-2 text-blue-500" />
                      Import Data
                    </Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Upload previously exported data
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/dashboard/settings/import-data')}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="flex items-center text-red-500">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete All Data
                    </Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Permanently delete all your data from our systems (cannot be undone)
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => router.push('/dashboard/settings/delete-data')}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Data
                  </Button>
                </div>

                <hr className="my-4" />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="flex items-center">
                        <Shield className="h-4 w-4 mr-2 text-blue-500" />
                        Privacy Policy
                      </Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Learn how we protect your privacy
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        window.open(
                          'https://app.termly.io/policy-viewer/policy.html?policyUUID=32f320cc-d83f-43ec-b602-dfb98321a82c',
                          '_blank',
                        )
                      }
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="flex items-center">
                        <Shield className="h-4 w-4 mr-2 text-blue-500" />
                        Terms of Service
                      </Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Review our terms and conditions
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        window.open(
                          'https://app.termly.io/policy-viewer/policy.html?policyUUID=09b69da0-1641-4776-bbbd-32060e7b8bc6',
                          '_blank',
                        )
                      }
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="flex items-center">
                        <Shield className="h-4 w-4 mr-2 text-blue-500" />
                        Cookies Policy
                      </Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Understand our cookie usage
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        window.open(
                          'https://app.termly.io/policy-viewer/policy.html?policyUUID=b1b24ed6-3efe-42b2-9328-4699a7d430b0',
                          '_blank',
                        )
                      }
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card>
            <CardHeader>
              <CardTitle>App Information</CardTitle>
              <CardDescription>Details about your app</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Version</Label>
                <span className="text-sm">1.3.1</span>
              </div>
              <div className="flex items-center justify-between">
                <Label>Build</Label>
                <span className="text-sm">2025.06.10</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
