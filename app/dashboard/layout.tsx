'use client';

import type React from 'react';

import { useEffect, useMemo, useState } from 'react';
import { useAppKitAccount, useDisconnect } from '@reown/appkit/react';
import {
  Activity,
  Gift,
  Menu,
  Settings,
  User,
  X,
  Crown,
  Bolt,
  Flame,
  ExternalLink,
  Coins,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { AdSenseBanner } from '@/components/ui/adsense-banner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { useMovinEarn } from '@/lib/hooks/useMovinEarn';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { fetchProfile } from '@/lib/redux/slices/profileSlice';

interface DashboardLayoutProps {
  children: React.ReactNode;
  onRefresh?: () => Promise<void>;
  isLoading?: boolean;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { address } = useAppKitAccount();
  const { disconnect } = useDisconnect();
  const addressLower = useMemo(() => address?.toLowerCase(), [address]);
  const { profile } = useAppSelector((state) => state.profile);
  const dispatch = useAppDispatch();
  const { isConnecting } = useAccount();
  const [lastPath, setLastPath] = useState(pathname);
  const { usePremiumStatus } = useMovinEarn();
  const { isPremiumActive } = usePremiumStatus();
  const isPremium = isPremiumActive();

  const isActive = (path: string) => {
    return pathname === path;
  };

  const tabs = [
    { name: 'Movin', path: '/dashboard', icon: <Activity className="h-5 w-5" /> },
    ...(isPremium
      ? [{ name: 'Energy', path: '/dashboard/energy', icon: <Bolt className="h-5 w-5" /> }]
      : []),
    { name: 'Rewards', path: '/dashboard/rewards', icon: <Gift className="h-5 w-5" /> },
    // { name: 'Social', path: '/dashboard/social', icon: <Users className="h-5 w-5" /> },
    { name: 'More', path: '#', icon: <Menu className="h-5 w-5" /> },
  ];

  const sideNavLinks = [
    {
      name: 'Profile',
      path: '/dashboard/profile',
      icon: <User className="h-6 w-6 mr-4 text-blue-400" />,
    },
    {
      name: 'Settings',
      path: '/dashboard/settings',
      icon: <Settings className="h-6 w-6 mr-4 text-blue-400" />,
    },
    // {
    //   name: 'Goals',
    //   path: '/dashboard/goals',
    //   icon: <Target className="h-6 w-6 mr-4 text-blue-400" />,
    // },
    {
      name: 'Subscription',
      path: '/dashboard/subscription',
      icon: <Crown className="h-6 w-6 mr-4 text-blue-400" />,
    },
  ];

  useEffect(() => {
    if (pathname !== lastPath && pathname !== '/' && addressLower) {
      setLastPath(pathname);
    }
  }, [pathname, lastPath, addressLower]);

  useEffect(() => {
    if (!addressLower && !isConnecting) {
      router.push('/');

      return;
    }

    if (addressLower) {
      if (!profile) {
        dispatch(fetchProfile(addressLower));
      }

      if (pathname === '/') {
        router.push(lastPath);
      }
    }
  }, [addressLower, profile, dispatch, router, isConnecting, lastPath, pathname]);

  const handleNavigate = (path: string) => () => {
    router.push(path);
  };

  const handleLogout = async () => {
    setIsSheetOpen(false);
    await disconnect();
    router.push('/');
  };

  const content = (
    <div
      className="flex flex-col min-h-screen"
      style={{ '--wui-spacing-xs': '0px' } as React.CSSProperties}
    >
      {/* Header */}
      <header className="glass-effect sticky top-0 z-10 pwa-header px-4 py-3 flex items-center justify-between border-b dark:border-gray-800 border-gray-200 safe-left safe-right">
        <div className="flex items-center">
          <Image src="/images/logo.png" alt="Movin Logo" width={28} height={28} className="mr-2" />
          <span className="font-bold text-lg">Movin</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Streak Display */}
          {profile && (
            <Badge
              variant="secondary"
              className="flex items-center gap-1 h-8 px-2 bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-500/30 text-orange-600 dark:text-orange-400 hover:from-orange-500/30 hover:to-red-500/30 transition-all duration-200 cursor-pointer"
              onClick={() => router.push('/dashboard/profile')}
            >
              <Flame className="h-3 w-3 text-orange-500 animate-pulse" />
              <span className="font-semibold">{profile.streak_days}</span>
              <span className="hidden sm:inline">day{profile.streak_days !== 1 ? 's' : ''}</span>
            </Badge>
          )}
          {/* <PremiumBadge /> */}
          {/* <ThemeToggle /> */}
          <Link href="/dashboard/profile">
            <Avatar className="h-8 w-8 border border-blue-500 cursor-pointer">
              <AvatarImage
                src={profile?.avatar_url || '/placeholder.svg?height=32&width=32'}
                alt="User"
              />
              <AvatarFallback className=" dark:bg-blue-900 dark:text-blue-100 bg-blue-100 text-blue-900">
                UN
              </AvatarFallback>
            </Avatar>
          </Link>

          <appkit-button size="sm" balance="hide" />
        </div>
      </header>

      {/* AdSense Banner - Only show for free users */}
      {!isPremium && (
        <div className="w-full px-4 py-2 border-b border-gray-200 dark:border-gray-800 safe-left safe-right">
          <AdSenseBanner className="w-full max-w-full mx-auto" format="auto" responsive={true} />
        </div>
      )}

      {/* Main content */}
      <main
        className="flex-1 safe-bottom"
        style={{ paddingBottom: 'max(5rem, calc(env(safe-area-inset-bottom) + 5rem))' }}
      >
        {children}
      </main>

      {/* Bottom navigation */}
      <nav className="glass-effect fixed bottom-0 w-full border-t border-gray-800 safe-bottom safe-left safe-right">
        <div className="flex items-center justify-around">
          {tabs.map((tab, index) =>
            tab.path === '#' ? (
              <Sheet key={index} open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    className={`flex flex-col items-center py-4 px-5 rounded-none h-16 hover:bg-transparent focus:bg-transparent ${
                      isActive(tab.path) ? 'text-blue-400 font-medium' : 'text-gray-400'
                    }`}
                    style={{ backgroundColor: 'transparent' }}
                    onClick={() => setIsSheetOpen(true)}
                  >
                    <span className="mb-0.5">{tab.icon}</span>
                    <span className="text-xs">{tab.name}</span>
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="z-50 w-full sm:w-[350px] md:w-[400px] bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 p-0 text-gray-900 dark:text-white safe-area"
                >
                  <SheetTitle className="sr-only">Menu</SheetTitle>
                  <div className="flex flex-col h-full">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                      <h2 className="text-xl font-semibold">Menu</h2>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full"
                        onClick={() => setIsSheetOpen(false)}
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>

                    <div className="flex-1 overflow-auto">
                      <div className="p-4 sm:p-6">
                        <div className="mb-8">
                          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
                            Account
                          </h3>
                          <ul className="space-y-3">
                            {sideNavLinks.map((link) => (
                              <li key={link.path}>
                                <Link
                                  href={link.path}
                                  className="flex items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                                  onClick={() => setIsSheetOpen(false)}
                                >
                                  {link.icon}
                                  <span className="text-base">{link.name}</span>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="mb-8">
                          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
                            Tokens
                          </h3>
                          <ul className="space-y-3">
                            <li>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <button className="flex items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 w-full text-left">
                                    <Coins className="h-6 w-6 mr-4 text-blue-400" />
                                    <span className="text-base">Get MVN</span>
                                  </button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                  <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                      <Coins className="h-6 w-6 text-blue-500" />
                                      Get MVN Tokens
                                    </DialogTitle>
                                    <DialogDescription>
                                      Choose how you want to get MVN tokens on Uniswap
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4 pt-4">
                                    <div className="grid gap-3">
                                      <Button
                                        asChild
                                        variant="outline"
                                        className="h-12 justify-start"
                                      >
                                        <a
                                          href="https://app.uniswap.org/explore/tokens/base/0x3082c5301afD22543866Fe510C0fB351E3CfF561"
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-3"
                                        >
                                          <div className="flex flex-col items-start">
                                            <span className="font-medium">Swap for MVN</span>
                                            <span className="text-sm text-gray-500">
                                              Buy MVN tokens directly
                                            </span>
                                          </div>
                                          <ExternalLink className="h-4 w-4 ml-auto" />
                                        </a>
                                      </Button>

                                      <Button
                                        asChild
                                        variant="outline"
                                        className="h-12 justify-start"
                                      >
                                        <a
                                          href="https://app.uniswap.org/positions/v4/base/69532"
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-3"
                                        >
                                          <div className="flex flex-col items-start">
                                            <span className="font-medium">Add Liquidity</span>
                                            <span className="text-sm text-gray-500">
                                              Provide liquidity and earn fees
                                            </span>
                                          </div>
                                          <ExternalLink className="h-4 w-4 ml-auto" />
                                        </a>
                                      </Button>
                                    </div>

                                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                                      <p className="text-sm text-blue-700 dark:text-blue-300">
                                        💡 <strong>Tip:</strong> Adding liquidity earns you trading
                                        fees while holding MVN tokens!
                                      </p>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </li>
                          </ul>
                        </div>

                        <div className="p-6 border-t border-gray-200 dark:border-gray-800 mt-auto">
                          <Button
                            variant="outline"
                            className="w-full py-6 text-base"
                            onClick={handleLogout}
                          >
                            Log Out
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            ) : (
              <Button
                key={index}
                variant="ghost"
                className={`flex flex-col items-center py-4 px-5 rounded-none h-16 hover:bg-transparent focus:bg-transparent ${
                  isActive(tab.path) ? 'text-blue-400 font-medium' : 'text-gray-400'
                }`}
                style={{ backgroundColor: 'transparent' }}
                onClick={handleNavigate(tab.path)}
              >
                <span className="mb-0.5">{tab.icon}</span>
                <span className="text-xs">{tab.name}</span>
              </Button>
            ),
          )}
        </div>
      </nav>
    </div>
  );

  // Always return content directly without PullToRefresh
  return content;
}
