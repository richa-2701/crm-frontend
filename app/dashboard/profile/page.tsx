"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { AlertCircle, CheckCircle, User, Lock, Settings } from "lucide-react"
import Link from "next/link"

interface UserData {
  id: string
  username: string
  email: string
  role: "admin" | "user" | "Administrator" | "Company User"
  phone?: string
  usernumber?: string
  department?: string
  createdAt?: string
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserData | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/login")
      return
    }

    const parsedUser = JSON.parse(userData)
    setUser(parsedUser)
    setFormData({
      name: parsedUser.username || "",
      email: parsedUser.email || "",
      phone: parsedUser.usernumber || "",
      department: parsedUser.department || "",
    })
  }, [router])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const updatedUser = {
        ...user,
        ...formData,
      }

      localStorage.setItem("user", JSON.stringify(updatedUser))
      setUser(updatedUser)
      setIsEditing(false)
      setSuccess("Profile updated successfully!")
    } catch (err) {
      setError("Failed to update profile. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("New passwords do not match")
      setIsLoading(false)
      return
    }

    if (passwordData.newPassword.length < 6) {
      setError("Password must be at least 6 characters long")
      setIsLoading(false)
      return
    }

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
      setIsChangingPassword(false)
      setSuccess("Password changed successfully!")
    } catch (err) {
      setError("Failed to change password. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground">Manage your account settings and preferences</p>
        </div>
        {user.role === "admin" && (
          <Link href="/dashboard/manage-users">
            <Button>
              <Settings className="h-4 w-4 mr-2" />
              Manage Users
            </Button>
          </Link>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg">{(user.username || "U").charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold">{user.username}</h3>
                <p className="text-muted-foreground">{user.email}</p>
                <Badge
                  variant={user.role === "admin" || user.role === "Administrator" ? "default" : "secondary"}
                  className="mt-1"
                >
                  {user.role === "admin" || user.role === "Administrator" ? "Administrator" : "Company User"}
                </Badge>
              </div>
            </div>

            <Separator />

            {!isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                    <p className="text-sm">{user.username}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                    <p className="text-sm">{user.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                    <p className="text-sm">{user.usernumber || user.phone || "Not provided"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Department</Label>
                    <p className="text-sm">{user.department || "Not provided"}</p>
                  </div>
                </div>
                <Button onClick={() => setIsEditing(true)} className="w-full">
                  Edit Profile
                </Button>
              </div>
            ) : (
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!isChangingPassword ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Keep your account secure by using a strong password and changing it regularly.
                </p>
                <Button onClick={() => setIsChangingPassword(true)} className="w-full">
                  Change Password
                </Button>
              </div>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Changing..." : "Change Password"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsChangingPassword(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
