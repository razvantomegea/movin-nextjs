"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Edit, Camera, Award, Trophy, Star, Flame, Activity, Save, AlertCircle } from "lucide-react"
import { motion } from "framer-motion"
import { showSuccessToast, showErrorToast } from "@/lib/redux/slices/toastSlice"
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import { RefreshButton } from "@/components/refresh-button"
import { ProfilePageSkeleton } from "@/components/skeletons/profile-page-skeleton"
import { fetchProfile, updateProfile, clearProfileError } from "@/lib/redux/slices/profileSlice"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

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
  const dispatch = useAppDispatch()
  const { profile, isLoading, isUpdating, error } = useAppSelector((state) => state.profile)

  const [editing, setEditing] = useState(false)
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    dispatch(fetchProfile())
  }, [dispatch])

  useEffect(() => {
    if (profile) {
      setUsername(profile.username)
      setEmail(profile.email)
    }
  }, [profile])

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setAvatarFile(file)

      // Create a preview URL for the selected image
      const previewUrl = URL.createObjectURL(file)
      setAvatarPreview(previewUrl)

      // Automatically start editing mode if not already editing
      if (!editing) {
        setEditing(true)
      }
    }
  }

  const handleRefresh = async () => {
    try {
      await dispatch(fetchProfile()).unwrap()
      dispatch(
        showSuccessToast({
          title: "Profile Refreshed",
          description: "Your profile data has been updated",
        }),
      )
    } catch (error) {
      dispatch(
        showErrorToast({
          title: "Refresh Failed",
          description: (error as string) || "Please try again later",
        }),
      )
    }
  }

  const handleSave = async () => {
    if (!profile) return

    try {
      // In a real app, you would upload the avatar file to a server
      // and get back a URL. For now, we'll simulate this.
      let avatarUrl = profile.avatar_url

      if (avatarFile) {
        // Simulate uploading and getting a URL
        // In a real app, you would use FormData and fetch to upload the file
        avatarUrl = avatarPreview
      }

      await dispatch(
        updateProfile({
          username,
          email,
          avatar_url: avatarUrl,
        }),
      ).unwrap()

      setEditing(false)
      setAvatarFile(null) // Clear the file after saving

      dispatch(
        showSuccessToast({
          title: "Profile Updated",
          description: "Your profile has been successfully updated",
        }),
      )
    } catch (error) {
      dispatch(
        showErrorToast({
          title: "Update Failed",
          description: (error as string) || "Please try again later",
        }),
      )
    }
  }

  useEffect(() => {
    // Cleanup function for the avatar preview URL
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview)
      }
    }
  }, [avatarPreview])

  const handleDismissError = () => {
    dispatch(clearProfileError())
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <ProfilePageSkeleton />
      </DashboardLayout>
    )
  }

  if (!profile && error) {
    return (
      <DashboardLayout>
        <div className="p-4">
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error loading profile</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={handleRefresh}>Try Again</Button>
        </div>
      </DashboardLayout>
    )
  }

  if (!profile) {
    return (
      <DashboardLayout>
        <div className="p-4">
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No profile found</AlertTitle>
            <AlertDescription>We couldn't find your profile information.</AlertDescription>
          </Alert>
          <Button onClick={handleRefresh}>Refresh</Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout onRefresh={handleRefresh} isLoading={isLoading}>
      {error && (
        <Alert variant="destructive" className="mb-4 mx-4 mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="flex justify-between items-center">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={handleDismissError}>
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <motion.div className="p-4" initial="hidden" animate="show" variants={container}>
        <motion.div className="mb-6" variants={item}>
          <div className="flex items-center">
            <h1 className="text-2xl font-bold mr-2">Profile</h1>
            <RefreshButton onRefresh={handleRefresh} isLoading={isLoading} />
          </div>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your account and view achievements</p>
        </motion.div>

        <div className="space-y-6">
          <motion.div variants={item}>
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col items-center sm:flex-row sm:items-start">
                  <div className="relative mb-4 sm:mb-0 sm:mr-6">
                    <Avatar className="h-24 w-24 border-4 border-blue-500">
                      <AvatarImage
                        src={avatarPreview || profile.avatar_url || "/placeholder.svg?height=96&width=96"}
                        alt="User"
                      />
                      <AvatarFallback className="text-2xl bg-blue-900 text-blue-100 dark:bg-blue-900 dark:text-blue-100 bg-blue-100 text-blue-900">
                        {profile.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                      onClick={handleAvatarClick}
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleAvatarChange}
                      accept="image/*"
                      className="hidden"
                      aria-label="Upload avatar"
                    />
                  </div>

                  <div className="flex-1 text-center sm:text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h2 className="text-2xl font-bold">{profile.username}</h2>
                        <p className="text-gray-500 dark:text-gray-400">{profile.email}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 sm:mt-0"
                        onClick={() => setEditing(!editing)}
                        disabled={isUpdating}
                      >
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
                        Level {profile.level}
                      </Badge>
                      <Badge variant="secondary" className="flex items-center">
                        <Flame className="h-3 w-3 mr-1 text-orange-500" />
                        {profile.streak_days} Day Streak
                      </Badge>
                      <Badge variant="secondary" className="flex items-center">
                        <Activity className="h-3 w-3 mr-1 text-blue-500" />
                        {profile.mvn_tokens} MVN
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
                          disabled={isUpdating}
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
                          disabled={isUpdating}
                        />
                      </div>
                      <Button
                        onClick={handleSave}
                        disabled={isUpdating || (username === profile.username && email === profile.email)}
                        className="w-full"
                      >
                        {isUpdating ? (
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
                        <div className="text-2xl font-bold">{profile.streak_days} days</div>
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
