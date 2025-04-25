"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Award, Flame, History, Users } from "lucide-react"
import { Progress } from "@/components/ui/progress"

export function RewardsDashboard() {
  const [activeTab, setActiveTab] = useState("activity")

  return (
    <DashboardLayout>
      <div className="p-4">
        <Tabs defaultValue="activity" onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Rewards</h1>
            <TabsList className="grid grid-cols-3 h-10 p-0.5">
              <TabsTrigger value="activity" className="px-4">
                Activity
              </TabsTrigger>
              <TabsTrigger value="staking" className="px-4">
                Staking
              </TabsTrigger>
              <TabsTrigger value="referrals" className="px-4">
                Referrals
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="activity" className="mt-0">
            <div className="space-y-6">
              <Card className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 border-gray-300 dark:border-gray-700">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold text-center mb-6">Activity Rewards</h2>

                  <div className="flex flex-col items-center mb-8">
                    <div className="flex items-center mb-2">
                      <Flame className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-2" />
                      <span className="text-4xl font-bold text-blue-600 dark:text-blue-400">1.78</span>
                      <span className="text-xl ml-2 text-gray-500 dark:text-gray-400">MVN</span>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Total earned this week</span>
                  </div>

                  <Button className="w-full py-6 text-lg bg-blue-500 hover:bg-blue-600">Claim Rewards</Button>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium">Reward Breakdown</h2>
                  <Button variant="ghost" size="sm" className="text-gray-400">
                    <History className="h-4 w-4 mr-1" />
                    History
                  </Button>
                </div>

                <Card className="bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-800">
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm">Steps</span>
                          <span className="font-medium">0.85 MVN</span>
                        </div>
                        <Progress value={48} className="h-2" />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm">Workouts</span>
                          <span className="font-medium">0.62 MVN</span>
                        </div>
                        <Progress value={35} className="h-2" />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm">Daily Goals</span>
                          <span className="font-medium">0.31 MVN</span>
                        </div>
                        <Progress value={17} className="h-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <h2 className="text-lg font-medium">Upcoming Rewards</h2>
                <Card className="bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-800">
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      <div className="flex items-center p-2 bg-gray-200/70 dark:bg-gray-800/50 rounded-lg">
                        <div className="bg-blue-500/20 p-2 rounded-full mr-3">
                          <Award className="h-4 w-4 text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <span className="font-medium">Weekly Challenge</span>
                            <span className="text-blue-400 font-medium">+0.5 MVN</span>
                          </div>
                          <div className="text-sm text-gray-400 mt-1">Complete 50,000 steps this week</div>
                          <Progress value={65} className="h-1.5 mt-2" />
                        </div>
                      </div>

                      <div className="flex items-center p-2 bg-gray-200/70 dark:bg-gray-800/50 rounded-lg">
                        <div className="bg-blue-500/20 p-2 rounded-full mr-3">
                          <Award className="h-4 w-4 text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <span className="font-medium">Streak Bonus</span>
                            <span className="text-blue-400 font-medium">+0.3 MVN</span>
                          </div>
                          <div className="text-sm text-gray-400 mt-1">Maintain activity for 7 consecutive days</div>
                          <Progress value={85} className="h-1.5 mt-2" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="staking" className="mt-0">
            <div className="space-y-6">
              <Card className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 border-gray-300 dark:border-gray-700">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold text-center mb-6">Staking Rewards</h2>

                  <div className="flex flex-col items-center mb-8">
                    <div className="flex items-center mb-2">
                      <Flame className="h-6 w-6 text-blue-400 mr-2" />
                      <span className="text-4xl font-bold text-blue-400">30.85</span>
                      <span className="text-xl ml-2 text-gray-400">MVN</span>
                    </div>
                    <span className="text-sm text-gray-400">Total staking rewards</span>
                  </div>

                  <Button className="w-full py-6 text-lg bg-blue-500 hover:bg-blue-600">Claim Rewards</Button>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <h2 className="text-lg font-medium">Your Stake</h2>
                <Card className="bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-800">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <span className="text-sm text-gray-400">Total Staked</span>
                        <div className="flex items-center">
                          <span className="text-2xl font-bold">250</span>
                          <span className="text-sm ml-1 text-gray-400">MVN</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-sm text-gray-400">APY</span>
                        <div className="text-2xl font-bold text-green-500">12.4%</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-6">
                      <Button className="bg-blue-500 hover:bg-blue-600">Stake More</Button>
                      <Button variant="outline" className="border-blue-500 text-blue-400 hover:bg-blue-500/10">
                        Unstake
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <h2 className="text-lg font-medium">Staking History</h2>
                <Card className="bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-800">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {[
                        { type: "Reward", amount: "+2.5 MVN", date: "Apr 20, 2025" },
                        { type: "Stake", amount: "+50 MVN", date: "Apr 15, 2025" },
                        { type: "Reward", amount: "+2.1 MVN", date: "Apr 13, 2025" },
                      ].map((item, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-2 border-b border-gray-800 last:border-0"
                        >
                          <div>
                            <div className="font-medium">{item.type}</div>
                            <div className="text-xs text-gray-400">{item.date}</div>
                          </div>
                          <div className={`font-medium ${item.type === "Reward" ? "text-green-500" : "text-blue-400"}`}>
                            {item.amount}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="referrals" className="mt-0">
            <div className="space-y-6">
              <Card className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 border-gray-300 dark:border-gray-700">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold text-center mb-6">Referral Rewards</h2>

                  <div className="flex flex-col items-center mb-8">
                    <div className="flex items-center mb-2">
                      <Users className="h-6 w-6 text-blue-400 mr-2" />
                      <span className="text-4xl font-bold text-blue-400">3</span>
                    </div>
                    <span className="text-sm text-gray-400">Total referrals</span>

                    <div className="flex items-center mt-4">
                      <span className="text-2xl font-bold text-blue-400">4.5</span>
                      <span className="text-sm ml-1 text-gray-400">MVN earned</span>
                    </div>
                  </div>

                  <Button className="w-full py-6 text-lg bg-blue-500 hover:bg-blue-600">Invite Friends</Button>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <h2 className="text-lg font-medium">Your Referral Code</h2>
                <Card className="bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-800">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="font-mono text-lg font-medium bg-gray-800 p-2 rounded flex-1 text-center">
                        MOVIN123
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="ml-3 border-blue-500 text-blue-400 hover:bg-blue-500/10"
                      >
                        Copy
                      </Button>
                    </div>

                    <div className="mt-4 text-sm text-gray-400 text-center">
                      Earn 1.5 MVN for each friend who joins and completes their first activity
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <h2 className="text-lg font-medium">Referral Activity</h2>
                <Card className="bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-800">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {[
                        { name: "Alex S.", status: "Active", reward: "+1.5 MVN", date: "Apr 18, 2025" },
                        { name: "Jamie T.", status: "Active", reward: "+1.5 MVN", date: "Apr 10, 2025" },
                        { name: "Taylor M.", status: "Active", reward: "+1.5 MVN", date: "Mar 28, 2025" },
                      ].map((item, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-2 border-b border-gray-800 last:border-0"
                        >
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center mr-3">
                              <span className="text-blue-400 font-medium">{item.name.charAt(0)}</span>
                            </div>
                            <div>
                              <div className="font-medium">{item.name}</div>
                              <div className="text-xs text-gray-400">{item.date}</div>
                            </div>
                          </div>
                          <div>
                            <div className="text-green-500 text-right font-medium">{item.reward}</div>
                            <div className="text-xs text-gray-400">{item.status}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
