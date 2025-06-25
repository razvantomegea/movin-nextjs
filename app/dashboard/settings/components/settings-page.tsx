'use client';

import { motion } from 'framer-motion';
import { Trash2, Download, Upload, Shield, Crown, ExternalLink, Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';
import InstallPWA from '@/components/install-pwa';
import PushManager from '@/components/push-manager';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useMovinEarn } from '@/lib/hooks/useMovinEarn';

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
                    Push Notifications
                  </Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Receive updates about your activity and achievements
                  </p>
                </div>
                <PushManager />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card>
            <CardHeader>
              <CardTitle>Data & Privacy</CardTitle>
              <CardDescription>Manage your data and privacy settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center">
                    <RefreshCw className="h-4 w-4 mr-2 text-blue-500" />
                    Background Sync
                  </Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Sync data when app is closed
                  </p>
                </div>
                <Switch checked={backgroundSync} onCheckedChange={setBackgroundSync} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center">
                    <Shield className="h-4 w-4 mr-2 text-blue-500" />
                    Data Collection
                  </Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Help improve the app with usage data
                  </p>
                </div>
                <Switch checked={dataCollection} onCheckedChange={setDataCollection} />
              </div> */}

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
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Version</Label>
                <span className="text-sm">1.4.10</span>
              </div>
              <div className="flex items-center justify-between">
                <Label>Build</Label>
                <span className="text-sm">2025.06.25</span>
              </div>

              <hr className="my-4" />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center">
                    <Download className="h-4 w-4 mr-2 text-blue-500" />
                    Install PWA
                  </Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Add Movin to your home screen for quick access
                  </p>
                </div>
                <InstallPWA showInstalledState={true} />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
