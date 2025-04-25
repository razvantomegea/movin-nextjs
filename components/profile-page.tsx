"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Edit, Camera, Award, Trophy, Star, Flame, Activity, Save } from "lucide-react"
import { motion } from "framer-motion"

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export function ProfilePage() {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [username, setUsername] = useState("username")
  const [email, setEmail] = useState("user@example.com")

  const handleSave = () => {
    setSaving(true)
    // Simulate saving
    setTimeout(() => {
      setSaving(false)
      setEditing(false)
    }, 1000)
  }

  return (
    <DashboardLayout>
      <motion.div className="p-4" initial="hidden" animate="show" variants={container}>
        <motion.div className="mb-6" variants={item}>
          <h1 className="text-2xl font-bold">Profile</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your account and view achievements</p>
        </motion.div>

        <div className="space-y-6">
          <motion.div variants={item}>
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col items-center sm:flex-row sm:items-start">
                  <div className="relative mb-4 sm:mb-0 sm:mr-6">
                    <Avatar className="h-24 w-24 border-4 border-blue-500">
                      <AvatarImage src="/placeholder.svg?height=96&width=96" alt="User" />
                      <AvatarFallback className="text-2xl bg-blue-900 text-blue-100 dark:bg-blue-900 dark:text-blue-100 bg-blue-100 text-blue-900">
                        {username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <Button size="icon" variant="secondary" className="absolute bottom-0 right-0 h-8 w-8 rounded-full">
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex-1 text-center sm:text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h2 className="text-2xl font-bold">{username}</h2>
                        <p className="text-gray-500 dark:text-gray-400">{email}</p>
                      </div>
                      <Button variant="outline" size="sm" className="mt-2 sm:mt-0" onClick={() => setEditing(!editing)}>
                        {editing ? (
                          "Cancel"
                        ) : (
                          <>
                            <Edit className="h-4 w-4 mr-2" /> Edit Profile
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-4">
                      <Badge variant="secondary" className="flex items-center">
                        <Trophy className="h-3 w-3 mr-1 text-yellow-500" />
                        Level 5
                      </Badge>
                      <Badge variant="secondary" className="flex items-center">
                        <Flame className="h-3 w-3 mr-1 text-orange-500" />7 Day Streak
                      </Badge>
                      <Badge variant="secondary" className="flex items-center">
                        <Activity className="h-3 w-3 mr-1 text-blue-500" />
                        15.2 MVN
                      </Badge>
                    </div>
                  </div>
                </div>

                {editing && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-6 border-t pt-4 border-gray-200 dark:border-gray-800"
                  >
                    <div className="space-y-4">
                      <div className="grid gap-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="Username"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Email"
                        />
                      </div>
                      <Button onClick={handleSave} disabled={saving} className="w-full">
                        {saving ? (
                          <>
                            <Save className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Tabs defaultValue="achievements">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="achievements">Achievements</TabsTrigger>
                <TabsTrigger value="stats">Stats</TabsTrigger>
              </TabsList>
              <TabsContent value="achievements" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Your Achievements</CardTitle>
                    <CardDescription>Badges and rewards you've earned</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {[
                        { name: "Early Bird", icon: <Star className="h-6 w-6 text-yellow-500" />, date: "Apr 20" },
                        {
                          name: "Step Master",
                          icon: <Trophy className="h-6 w-6 text-blue-500" />,
                          date: "Apr 18",
                        },
                        {
                          name: "Week Warrior",
                          icon: <Flame className="h-6 w-6 text-orange-500" />,
                          date: "Apr 15",
                        },
                        {
                          name: "Goal Crusher",
                          icon: <Award className="h-6 w-6 text-purple-500" />,
                          date: "Apr 10",
                        },
                        {
                          name: "First Workout",
                          icon: <Activity className="h-6 w-6 text-green-500" />,
                          date: "Apr 5",
                        },
                      ].map((achievement, i) => (
                        <motion.div
                          key={i}
                          whileHover={{ scale: 1.05 }}
                          className="flex flex-col items-center p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-center"
                        >
                          <div className="bg-gray-200 dark:bg-gray-700 p-3 rounded-full mb-2">{achievement.icon}</div>
                          <span className="font-medium text-sm">{achievement.name}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{achievement.date}</span>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="stats" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Your Stats</CardTitle>
                    <CardDescription>Your activity statistics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                          <div className="text-sm text-gray-500 dark:text-gray-400">Total Steps</div>
                          <div className="text-2xl font-bold">124,568</div>
                        </div>
                        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                          <div className="text-sm text-gray-500 dark:text-gray-400">Total Distance</div>
                          <div className="text-2xl font-bold">87.3 km</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                          <div className="text-sm text-gray-500 dark:text-gray-400">Workouts</div>
                          <div className="text-2xl font-bold">32</div>
                        </div>
                        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                          <div className="text-sm text-gray-500 dark:text-gray-400">Calories</div>
                          <div className="text-2xl font-bold">15,420</div>
                        </div>
                      </div>

                      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                        <div className="text-sm text-gray-500 dark:text-gray-400">Best Streak</div>
                        <div className="text-2xl font-bold">14 days</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </motion.div>
    </DashboardLayout>
  )
}
