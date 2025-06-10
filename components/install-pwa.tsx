'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone, Share, Plus, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface InstallPWAProps {
  variant?: 'button' | 'banner' | 'card';
  showBanner?: boolean;
  onInstall?: () => void;
  onDismiss?: () => void;
}

export default function InstallPWA({
  variant = 'button',
  showBanner = false,
  onInstall,
  onDismiss,
}: InstallPWAProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showBannerState, setShowBanner] = useState(showBanner);

  useEffect(() => {
    // Check if running as standalone app
    const isStandaloneApp =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(isStandaloneApp);

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Handle beforeinstallprompt event
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Hide banner if already installed
    if (isStandaloneApp) {
      setShowBanner(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // Show manual instructions for iOS or unsupported browsers
      setShowInstructions(true);
      return;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowBanner(false);
        onInstall?.();
      }
    } catch (error) {
      console.error('Installation failed:', error);
      setShowInstructions(true);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    onDismiss?.();
  };

  // Don't show if already installed
  if (isStandalone) {
    return null;
  }

  const InstallButton = () => (
    <Button
      onClick={handleInstall}
      className="flex items-center gap-2"
      variant={variant === 'banner' ? 'default' : 'outline'}
    >
      <Download className="h-4 w-4" />
      Install App
    </Button>
  );

  const ManualInstructionsDialog = () => (
    <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Add to Home Screen
          </DialogTitle>
          <DialogDescription>
            Follow these steps to install the app on your device
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isIOS ? (
            <>
              <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <Share className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">Step 1</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Tap the Share button at the bottom of your Safari browser
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <Plus className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">Step 2</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Scroll down and tap &quot;Add to Home Screen&quot;
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <Download className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">Step 3</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Tap &quot;Add&quot; to install the app on your home screen
                  </p>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <MoreHorizontal className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">Step 1</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Tap the menu button (⋮) in your browser
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <Download className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">Step 2</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Look for &quot;Add to Home screen&quot; or &quot;Install app&quot; option
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        <Button onClick={() => setShowInstructions(false)} className="w-full">
          Got it
        </Button>
      </DialogContent>
    </Dialog>
  );

  if (variant === 'banner' && showBannerState) {
    return (
      <>
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-0 left-0 right-0 z-50 p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
          >
            <div className="flex items-center justify-between max-w-md mx-auto">
              <div className="flex items-center gap-3">
                <Download className="h-5 w-5" />
                <div>
                  <p className="font-medium text-sm">Install Movin App</p>
                  <p className="text-xs opacity-90">Get the full experience</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="secondary" onClick={handleInstall} className="text-xs">
                  Install
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDismiss}
                  className="text-white hover:bg-white/20 p-1"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
        <ManualInstructionsDialog />
      </>
    );
  }

  if (variant === 'card') {
    return (
      <>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-blue-500" />
              Install App
            </CardTitle>
            <CardDescription>Install Movin on your device for the best experience</CardDescription>
          </CardHeader>
          <CardContent>
            <InstallButton />
          </CardContent>
        </Card>
        <ManualInstructionsDialog />
      </>
    );
  }

  return (
    <>
      <InstallButton />
      <ManualInstructionsDialog />
    </>
  );
}
