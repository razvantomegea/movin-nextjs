"use client"

import type React from "react"

import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Activity, Award, Flame, Gift, Menu, Settings, User, X } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import Image from "next/image"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isActive = (path: string) => {
    return pathname === path
  }

  const tabs = [
    { name: "Movin", path: "/dashboard", icon: <Activity className="h-5 w-5" /> },
    { name: "Rewards", path: "/dashboard/rewards", icon: <Gift className="h-5 w-5" /> },
    { name: "More", path: "#", icon: <Menu className="h-5 w-5" /> },
  ]

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="glass-effect sticky top-0 z-10 p-4 flex items-center justify-between border-b border-gray-800 dark:border-gray-800 border-gray-200">
        <div className="flex items-center">
          <Image src="/images/logo.png" alt="Movin Logo" width={28} height={28} className="mr-2" />
          <span className="font-bold text-lg">Movin</span>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Avatar className="h-8 w-8 border border-blue-500">
            <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
            <AvatarFallback className="bg-blue-900 text-blue-100 dark:bg-blue-900 dark:text-blue-100 bg-blue-100 text-blue-900">
              UN
            </AvatarFallback>
          </Avatar>
          <span className="text-blue-400 text-sm font-medium">username</span>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 pb-20">{children}</main>

      {/* Bottom navigation */}
      <nav className="glass-effect fixed bottom-0 w-full border-t border-gray-800">
        <div className="flex items-center justify-around">
          {tabs.map((tab, index) =>
            tab.path === "#" ? (
              <Sheet key={index}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    className={`flex flex-col items-center py-3 px-5 rounded-none ${isActive(tab.path) ? "text-blue-400" : "text-gray-400"}`}
                  >
                    {tab.icon}
                    <span className="text-xs mt-1">{tab.name}</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="p-0 w-[280px] bg-gray-900 border-l border-gray-800">
                  <div className="flex flex-col h-full">
                    <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                      <h2 className="font-semibold">Menu</h2>
                      <Button variant="ghost" size="icon" className="rounded-full">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex-1 overflow-auto">
                      <div className="p-4">
                        <div className="mb-6">
                          <h3 className="text-sm font-medium text-gray-400 mb-3">Account</h3>
                          <ul className="space-y-2">
                            <li>
                              <Link
                                href="/dashboard/profile"
                                className="flex items-center p-2 rounded-lg hover:bg-gray-800"
                              >
                                <User className="h-5 w-5 mr-3 text-blue-400" />
                                <span>Profile</span>
                              </Link>
                            </li>
                            <li>
                              <Link
                                href="/dashboard/settings"
                                className="flex items-center p-2 rounded-lg hover:bg-gray-800"
                              >
                                <Settings className="h-5 w-5 mr-3 text-blue-400" />
                                <span>Settings</span>
                              </Link>
                            </li>
                          </ul>
                        </div>

                        <div>
                          <h3 className="text-sm font-medium text-gray-400 mb-3">Rewards</h3>
                          <ul className="space-y-2">
                            <li>
                              <Link
                                href="/dashboard/rewards/activity"
                                className="flex items-center p-2 rounded-lg hover:bg-gray-800"
                              >
                                <Activity className="h-5 w-5 mr-3 text-blue-400" />
                                <span>Activity Rewards</span>
                              </Link>
                            </li>
                            <li>
                              <Link
                                href="/dashboard/rewards/staking"
                                className="flex items-center p-2 rounded-lg hover:bg-gray-800"
                              >
                                <Flame className="h-5 w-5 mr-3 text-blue-400" />
                                <span>Staking</span>
                              </Link>
                            </li>
                            <li>
                              <Link
                                href="/dashboard/rewards/referrals"
                                className="flex items-center p-2 rounded-lg hover:bg-gray-800"
                              >
                                <Award className="h-5 w-5 mr-3 text-blue-400" />
                                <span>Referrals</span>
                              </Link>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border-t border-gray-800">
                      <Button variant="outline" className="w-full">
                        Log Out
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            ) : (
              <Button
                key={index}
                variant="ghost"
                className={`flex flex-col items-center py-3 px-5 rounded-none ${isActive(tab.path) ? "text-blue-400" : "text-gray-400"}`}
                onClick={() => router.push(tab.path)}
              >
                {tab.icon}
                <span className="text-xs mt-1">{tab.name}</span>
                {isActive(tab.path) && <div className="absolute bottom-0 w-12 h-0.5 bg-blue-500"></div>}
              </Button>
            ),
          )}
        </div>
      </nav>
    </div>
  )
}
