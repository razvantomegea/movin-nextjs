'use client';

import type React from 'react';

import { useEffect, useState } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { Activity, Bolt, Gift, Menu, Settings, Target, User, X, Users, Crown } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { PremiumBadge } from '@/components/premium-badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAppSelector } from '@/lib/redux/hooks';

interface DashboardLayoutProps {
  children: React.ReactNode;
  onRefresh?: () => Promise<void>;
  isLoading?: boolean;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { isConnected } = useAppKitAccount();
  const { profile } = useAppSelector((state) => state.profile);

  const isActive = (path: string) => {
    return pathname === path;
  };

  const tabs = [
    { name: 'Movin', path: '/dashboard', icon: <Activity className="h-5 w-5" /> },
    { name: 'Energy', path: '/dashboard/energy', icon: <Bolt className="h-5 w-5" /> },
    { name: 'Rewards', path: '/dashboard/rewards', icon: <Gift className="h-5 w-5" /> },
    { name: 'Social', path: '/dashboard/social', icon: <Users className="h-5 w-5" /> },
    { name: 'More', path: '#', icon: <Menu className="h-5 w-5" /> },
  ];

  useEffect(() => {
    if (!isConnected) {
      router.push('/');
    }
  }, [isConnected, router]);

  const content = (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="glass-effect sticky top-0 z-10 p-4 flex items-center justify-between border-b dark:border-gray-800 border-gray-200">
        <div className="flex items-center">
          <Image src="/images/logo.png" alt="Movin Logo" width={28} height={28} className="mr-2" />
          <span className="font-bold text-lg">Movin</span>
        </div>

        <div className="flex items-center gap-2">
          <PremiumBadge />
          <ThemeToggle />
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
          <appkit-button />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 pb-20">{children}</main>

      {/* Bottom navigation */}
      <nav className="glass-effect fixed bottom-0 w-full border-t border-gray-800">
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
                  className="z-50 w-full sm:w-[350px] md:w-[400px] bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 p-0 text-gray-900 dark:text-white"
                >
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
                            <li>
                              <Link
                                href="/dashboard/profile"
                                className="flex items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                                onClick={() => setIsSheetOpen(false)}
                              >
                                <User className="h-6 w-6 mr-4 text-blue-400" />
                                <span className="text-base">Profile</span>
                              </Link>
                            </li>
                            <li>
                              <Link
                                href="/dashboard/settings"
                                className="flex items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                                onClick={() => setIsSheetOpen(false)}
                              >
                                <Settings className="h-6 w-6 mr-4 text-blue-400" />
                                <span className="text-base">Settings</span>
                              </Link>
                            </li>
                            <li>
                              <Link
                                href="/dashboard/goals"
                                className="flex items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                                onClick={() => setIsSheetOpen(false)}
                              >
                                <Target className="h-6 w-6 mr-4 text-blue-400" />
                                <span className="text-base">Goals</span>
                              </Link>
                            </li>
                            <li>
                              <Link
                                href="/dashboard/subscription"
                                className="flex items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                                onClick={() => setIsSheetOpen(false)}
                              >
                                <Crown className="h-6 w-6 mr-4 text-blue-400" />
                                <span className="text-base">Subscription</span>
                              </Link>
                            </li>
                          </ul>
                        </div>

                        <div className="p-6 border-t border-gray-200 dark:border-gray-800 mt-auto">
                          <Button
                            variant="outline"
                            className="w-full py-6 text-base"
                            onClick={() => setIsSheetOpen(false)}
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
                onClick={() => router.push(tab.path)}
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
