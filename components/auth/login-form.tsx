// frontend/components/auth/login-form.tsx
"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
// --- START OF FIX: Import the unified `api` object instead of `authApi` ---
import { api } from "@/lib/api"
// --- END OF FIX ---

export function LoginForm() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!companyName) {
        setError("Please select a company to log in.")
        return;
    }

    setIsLoading(true)
    setError("")

    try {
      // --- START OF FIX: Use the unified `api` object ---
      const userData = await api.login(username, password, companyName)
      // --- END OF FIX ---
      
      localStorage.setItem("user", JSON.stringify(userData))
      
      toast({
        title: "Login Successful",
        description: `Welcome back, ${userData.username}!`,
      });

      router.push("/dashboard")
    } catch (err) {
      console.error("[v0] Login error:", err)
      setError(err instanceof Error ? err.message : "Login failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Login</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="companyName">Company</Label>
            <Select value={companyName} onValueChange={setCompanyName}>
                <SelectTrigger id="companyName">
                    <SelectValue placeholder="Select your company" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Indas Analytics">Indas Analytics</SelectItem>
                    <SelectItem value="Amar Ujala">Amar Ujala</SelectItem>
                </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/register" className="font-medium text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}