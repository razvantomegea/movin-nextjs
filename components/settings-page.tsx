'use client';

import { useState } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ThemeToggle } from '@/components/theme-toggle';
import { Bell, Trash2, Download, Upload, RefreshCw, Shield, Smartphone, Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/lib/redux/hooks';

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
  const { theme, setTheme } = useTheme();
  const { isPremium } = useAppSelector((state) => state.subscription);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [backgroundSync, setBackgroundSync] = useState(true);
  const [dataCollection, setDataCollection] = useState(true);
  const [stepGoal, setStepGoal] = useState(10000);
  const [distanceUnit, setDistanceUnit] = useState('km');
  const [clearingData, setClearingData] = useState(false);

  const handleClearData = () => {
    setClearingData(true);
    // Simulate clearing data
    setTimeout(() => {
      setClearingData(false);
    }, 2000);
  };

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
                    Enable Notifications
                  </Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Receive updates about your activity
                  </p>
                </div>
                <Switch checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />
              </div>

              {notificationsEnabled && (
                <div className="pt-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Daily Reminders</Label>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Goal Achievements</Label>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Reward Updates</Label>
                    <Switch defaultChecked />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card>
            <CardHeader>
              <CardTitle>Fitness Goals</CardTitle>
              <CardDescription>Set your daily fitness targets</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Daily Step Goal: {stepGoal.toLocaleString()} steps</Label>
                </div>
                <Slider
                  value={[stepGoal]}
                  min={1000}
                  max={20000}
                  step={500}
                  onValueChange={(value) => setStepGoal(value[0])}
                />
              </div>

              <div className="space-y-2">
                <Label>Distance Unit</Label>
                <Select value={distanceUnit} onValueChange={setDistanceUnit}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="km">Kilometers (km)</SelectItem>
                    <SelectItem value="mi">Miles (mi)</SelectItem>
                  </SelectContent>
                </Select>
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
              <div className="flex items-center justify-between">
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
              </div>

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
                  <Button variant="outline" size="sm">
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
                  <Button variant="outline" size="sm">
                    Import
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="flex items-center text-red-500">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear All Data
                    </Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Delete all your activity data (cannot be undone)
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleClearData}
                    disabled={clearingData}
                  >
                    {clearingData ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Clearing...
                      </>
                    ) : (
                      'Clear'
                    )}
                  </Button>
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
                <span className="text-sm">1.0.0</span>
              </div>
              <div className="flex items-center justify-between">
                <Label>Build</Label>
                <span className="text-sm">2023.04.25</span>
              </div>
              <div className="flex items-center justify-between">
                <Label>Device</Label>
                <span className="text-sm flex items-center">
                  <Smartphone className="h-3 w-3 mr-1" />
                  Web App
                </span>
              </div>
              <div className="pt-2">
                <Button variant="outline" className="w-full" size="sm">
                  Check for Updates
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
