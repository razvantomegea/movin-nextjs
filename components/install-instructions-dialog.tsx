'use client';

import { useState, useEffect } from 'react';
import {
  Smartphone,
  Share,
  Plus,
  Download,
  MoreHorizontal,
  Monitor,
  Menu,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface PlatformInfo {
  isIOS: boolean;
  isMacOS: boolean;
  isAndroid: boolean;
  isWindows: boolean;
  isLinux: boolean;
  browser: 'safari' | 'chrome' | 'firefox' | 'edge' | 'brave' | 'other';
  isMobile: boolean;
  isDesktop: boolean;
}

interface InstallInstructionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function InstallInstructionsDialog({
  open,
  onOpenChange,
}: InstallInstructionsDialogProps) {
  const [platformInfo, setPlatformInfo] = useState<PlatformInfo>({
    isIOS: false,
    isMacOS: false,
    isAndroid: false,
    isWindows: false,
    isLinux: false,
    browser: 'other',
    isMobile: false,
    isDesktop: false,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const userAgent = navigator.userAgent;

    // Detect operating systems
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isMacOS = /Macintosh|Mac OS X/.test(userAgent) && !isIOS;
    const isAndroid = /Android/i.test(userAgent);
    const isWindows = /Windows/.test(userAgent);
    const isLinux = /Linux/.test(userAgent) && !isAndroid;

    // Detect browsers
    let browser: PlatformInfo['browser'] = 'other';
    if (userAgent.includes('Brave')) {
      browser = 'brave';
    } else if (userAgent.includes('Edg')) {
      browser = 'edge';
    } else if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
      browser = 'chrome';
    } else if (userAgent.includes('Firefox')) {
      browser = 'firefox';
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      browser = 'safari';
    }

    // Detect device type
    const isMobile = /Mobi|Android/i.test(userAgent) || isIOS;
    const isDesktop = !isMobile;

    setPlatformInfo({
      isIOS,
      isMacOS,
      isAndroid,
      isWindows,
      isLinux,
      browser,
      isMobile,
      isDesktop,
    });
  }, []);

  const getInstructions = () => {
    const { isIOS, isMacOS, isAndroid, browser, isMobile, isDesktop } = platformInfo;

    // Safari iOS/iPadOS
    if (isIOS && browser === 'safari') {
      return {
        title: 'Add to Home Screen',
        steps: [
          {
            icon: Share,
            title: 'Step 1',
            description: 'Tap the Share button (box with arrow up) at the bottom of Safari',
          },
          {
            icon: Plus,
            title: 'Step 2',
            description: 'Scroll down and tap "Add to Home Screen"',
          },
          {
            icon: Download,
            title: 'Step 3',
            description: 'Edit the name if desired, then tap "Add"',
          },
        ],
      };
    }

    // Safari macOS
    if (isMacOS && browser === 'safari') {
      return {
        title: 'Add to Dock',
        steps: [
          {
            icon: Monitor,
            title: 'Step 1',
            description: 'Click "File" in the Safari menu bar',
          },
          {
            icon: Plus,
            title: 'Step 2',
            description: 'Select "Add to Dock" from the dropdown menu',
          },
          {
            icon: Download,
            title: 'Step 3',
            description: 'Edit the name and icon if desired, then click "Add"',
          },
        ],
      };
    }

    // Chrome Android
    if (isAndroid && browser === 'chrome') {
      return {
        title: 'Add to Home Screen',
        steps: [
          {
            icon: MoreHorizontal,
            title: 'Step 1',
            description: 'Tap the three-dot menu in the top or bottom right',
          },
          {
            icon: Download,
            title: 'Step 2',
            description: 'Tap "Add to Home screen"',
          },
          {
            icon: Plus,
            title: 'Step 3',
            description: 'Edit the name, then tap "Add"',
          },
        ],
      };
    }

    // Firefox Android
    if (isAndroid && browser === 'firefox') {
      return {
        title: 'Add to Home Screen',
        steps: [
          {
            icon: MoreHorizontal,
            title: 'Step 1',
            description: 'Tap the three-dot menu in the bottom right',
          },
          {
            icon: Download,
            title: 'Step 2',
            description: 'Tap "Add to Home screen"',
          },
          {
            icon: Plus,
            title: 'Step 3',
            description: 'Tap "Add" to confirm',
          },
        ],
      };
    }

    // Edge Android
    if (isAndroid && browser === 'edge') {
      return {
        title: 'Add to Home Screen',
        steps: [
          {
            icon: MoreHorizontal,
            title: 'Step 1',
            description: 'Tap the three-dot menu in the center of the navigation bar',
          },
          {
            icon: Smartphone,
            title: 'Step 2',
            description: 'Tap "Add to Phone"',
          },
          {
            icon: Download,
            title: 'Step 3',
            description: 'Tap "Add to Home screen"',
          },
        ],
      };
    }

    // Brave Android
    if (isAndroid && browser === 'brave') {
      return {
        title: 'Add to Home Screen',
        steps: [
          {
            icon: MoreHorizontal,
            title: 'Step 1',
            description: 'Tap the three-dot menu in the bottom right',
          },
          {
            icon: Download,
            title: 'Step 2',
            description: 'Tap "Add to Home screen"',
          },
          {
            icon: Plus,
            title: 'Step 3',
            description: 'Edit the name, then tap "Add"',
          },
        ],
      };
    }

    // Chrome Desktop
    if (isDesktop && browser === 'chrome') {
      return {
        title: 'Install App',
        steps: [
          {
            icon: Download,
            title: 'Step 1',
            description: 'Look for the "Install app" icon in the address bar',
          },
          {
            icon: Plus,
            title: 'Step 2',
            description: 'Click the icon and follow the prompt to install',
          },
        ],
      };
    }

    // Edge Desktop
    if (isDesktop && browser === 'edge') {
      return {
        title: 'Install App',
        steps: [
          {
            icon: Download,
            title: 'Step 1',
            description: 'Look for the "Install app" icon in the address bar',
          },
          {
            icon: Plus,
            title: 'Step 2',
            description: 'Click the icon and follow the prompt to install',
          },
        ],
      };
    }

    // Brave Desktop
    if (isDesktop && browser === 'brave') {
      return {
        title: 'Install App',
        steps: [
          {
            icon: Download,
            title: 'Step 1',
            description: 'Look for the "Install app" icon in the address bar',
          },
          {
            icon: Plus,
            title: 'Step 2',
            description: 'Click the icon and follow the prompt to install',
          },
        ],
      };
    }

    // Firefox Desktop (limited PWA support)
    if (isDesktop && browser === 'firefox') {
      return {
        title: 'Create Desktop Shortcut',
        steps: [
          {
            icon: Menu,
            title: 'Step 1',
            description: 'Click the menu button (≡) in the top right',
          },
          {
            icon: FileText,
            title: 'Step 2',
            description: 'Look for "Create Shortcut" or similar option in the menu',
          },
        ],
      };
    }

    // Generic mobile fallback
    if (isMobile) {
      return {
        title: 'Add to Home Screen',
        steps: [
          {
            icon: MoreHorizontal,
            title: 'Step 1',
            description: 'Tap the menu button (⋮ or ⋯) in your browser',
          },
          {
            icon: Download,
            title: 'Step 2',
            description: 'Look for "Add to Home screen" or "Install app" option',
          },
          {
            icon: Plus,
            title: 'Step 3',
            description: 'Tap "Add" to install the app on your home screen',
          },
        ],
      };
    }

    // Generic desktop fallback
    return {
      title: 'Install App',
      steps: [
        {
          icon: Download,
          title: 'Step 1',
          description: 'Look for the "Install" icon in the browser\'s address bar',
        },
        {
          icon: Plus,
          title: 'Step 2',
          description: 'Click the icon and follow the prompt to install the app',
        },
      ],
    };
  };

  const instructions = getInstructions();
  const { browser } = platformInfo;

  const getBrowserName = () => {
    switch (browser) {
      case 'safari':
        return 'Safari';
      case 'chrome':
        return 'Chrome';
      case 'firefox':
        return 'Firefox';
      case 'edge':
        return 'Edge';
      case 'brave':
        return 'Brave';
      default:
        return 'Browser';
    }
  };

  const getDeviceType = () => {
    if (platformInfo.isIOS) return 'iOS';
    if (platformInfo.isMacOS) return 'macOS';
    if (platformInfo.isAndroid) return 'Android';
    if (platformInfo.isWindows) return 'Windows';
    if (platformInfo.isLinux) return 'Linux';
    return platformInfo.isMobile ? 'Mobile' : 'Desktop';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            {instructions.title}
          </DialogTitle>
          <DialogDescription>
            Install Movin on {getBrowserName()} for {getDeviceType()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {instructions.steps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg"
              >
                <IconComponent className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">{step.title}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{step.description}</p>
                </div>
              </div>
            );
          })}

          {/* Special note for Firefox desktop */}
          {platformInfo.isDesktop && browser === 'firefox' && (
            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
              <p className="text-sm text-amber-700 dark:text-amber-300">
                <strong>Note:</strong> Firefox doesn&apos;t fully support PWA installation on
                desktop. You can create a website shortcut instead.
              </p>
            </div>
          )}

          {/* Fallback note for unsupported browsers */}
          {browser === 'other' && (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-950/20 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Your browser may have limited PWA support. Try looking for &quot;Add to Home
                Screen&quot; or &quot;Install&quot; options in your browser menu.
              </p>
            </div>
          )}
        </div>

        <Button onClick={() => onOpenChange(false)} className="w-full">
          Got it
        </Button>
      </DialogContent>
    </Dialog>
  );
}
