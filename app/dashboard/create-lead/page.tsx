"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { leadApi, userApi, type ApiUser } from "@/lib/api"
import { Loader2 } from "lucide-react"

interface User {
  id: string
  username: string
  email: string
  role: string
}

const leadTypes = ["Hot Lead", "Cold Lead", "Not Our Segment"]

export default function CreateLeadPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [companyUsers, setCompanyUsers] = useState<User[]>([])
  const [formData, setFormData] = useState({
    company_name: "",
    contact_name: "",
    phone: "",
    phone_2: "",
    email: "",
    address: "",
    team_size: "",
    turnover: "",
    source: "",
    segment: "",
    assigned_to: "",
    current_system: "",
    machine_specification: "",
    challenges: "",
    remark: "",
    lead_type: "", // Added lead_type field
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = localStorage.getItem("user")
        if (userData) {
          const parsedUser = JSON.parse(userData)
          setUser(parsedUser)

          let transformedUsers: User[] = []

          try {
            const usersData = await userApi.getUsers()
            transformedUsers = usersData.map((user: ApiUser) => ({
              id: user.id.toString(),
              username: user.username,
              email: user.email || `${user.username}@company.com`,
              role: user.role || "Company User",
            }))

            const currentUserExists = transformedUsers.some(
              (u) => u.username === parsedUser.username || u.id === parsedUser.id?.toString(),
            )

            if (!currentUserExists) {
              transformedUsers.push({
                id: parsedUser.id?.toString() || "current",
                username: parsedUser.username || "Current User",
                email: parsedUser.email || `${parsedUser.username}@company.com`,
                role: parsedUser.role || "Company User",
              })
            }

            console.log("[v0] Successfully loaded users from API:", transformedUsers)
          } catch (apiError) {
            console.error("[v0] Failed to load users from API:", apiError)
            toast({
              title: "Error",
              description: "Failed to load users from backend. Please check your connection.",
              variant: "destructive",
            })

            transformedUsers = [
              {
                id: parsedUser.id?.toString() || "current",
                username: parsedUser.username || "Current User",
                email: parsedUser.email || `${parsedUser.username}@company.com`,
                role: parsedUser.role || "Company User",
              },
            ]
          }

          setCompanyUsers(transformedUsers)

          setFormData((prev) => ({ ...prev, assigned_to: parsedUser.username }))
        }
      } catch (error) {
        console.error("[v0] Failed to fetch users:", error)
        toast({
          title: "Error",
          description: "Failed to initialize form. Please refresh the page.",
          variant: "destructive",
        })
      }
    }

    fetchData()
  }, [toast])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const assignedUser = companyUsers.find(
        (u) => u.id === formData.assigned_to || u.username === formData.assigned_to,
      )
      const leadData = {
        ...formData,
        assigned_to: assignedUser?.username || formData.assigned_to,
        created_by: user?.username || user?.id || "unknown",
        source: formData.source || "Website",
      }

      try {
        await leadApi.createLead(leadData)
        console.log("[v0] Lead created successfully via API")

        toast({
          title: "Lead Created",
          description: "The lead has been successfully created.",
        })

        router.push("/dashboard/leads")
      } catch (apiError) {
        console.error("[v0] API failed for lead creation:", apiError)
        throw new Error(
          `Failed to create lead: ${apiError instanceof Error ? apiError.message : "Backend connection failed"}`,
        )
      }
    } catch (error) {
      console.error("[v0] Failed to create lead:", error)
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create lead. Please check your backend connection.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-3 sm:space-y-6">
      <div className="px-1">
        <h1 className="text-xl sm:text-3xl font-bold tracking-tight">Create Lead</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Add a new lead to your CRM system</p>
      </div>

      <Card className="border-0 sm:border shadow-none sm:shadow-sm">
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-lg sm:text-xl">Lead Information</CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-6">
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1">
                <Label htmlFor="company_name" className="text-xs sm:text-sm">
                  Company *
                </Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => handleInputChange("company_name", e.target.value)}
                  required
                  className="h-8 sm:h-10 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="contact_name" className="text-xs sm:text-sm">
                  Concern Person Name *
                </Label>
                <Input
                  id="contact_name"
                  value={formData.contact_name}
                  onChange={(e) => handleInputChange("contact_name", e.target.value)}
                  required
                  className="h-8 sm:h-10 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="email" className="text-xs sm:text-sm">
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                  className="h-8 sm:h-10 text-sm"
                />
              </div>
            </div>

            <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1">
                <Label htmlFor="phone" className="text-xs sm:text-sm">
                  Phone *
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  required
                  className="h-8 sm:h-10 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="phone_2" className="text-xs sm:text-sm">
                  Phone 2
                </Label>
                <Input
                  id="phone_2"
                  type="tel"
                  value={formData.phone_2}
                  onChange={(e) => handleInputChange("phone_2", e.target.value)}
                  className="h-8 sm:h-10 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="team_size" className="text-xs sm:text-sm">
                  Team Size
                </Label>
                <Input
                  id="team_size"
                  type="number"
                  value={formData.team_size}
                  onChange={(e) => handleInputChange("team_size", e.target.value)}
                  className="h-8 sm:h-10 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="turnover" className="text-xs sm:text-sm">
                  Turnover
                </Label>
                <Input
                  id="turnover"
                  placeholder="1 Cr"
                  value={formData.turnover}
                  onChange={(e) => handleInputChange("turnover", e.target.value)}
                  className="h-8 sm:h-10 text-sm"
                />
              </div>
            </div>

            <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1">
                <Label htmlFor="source" className="text-xs sm:text-sm">
                  Source
                </Label>
                <Input
                  id="source"
                  placeholder="Website"
                  value={formData.source}
                  onChange={(e) => handleInputChange("source", e.target.value)}
                  className="h-8 sm:h-10 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="segment" className="text-xs sm:text-sm">
                  Segment
                </Label>
                <Input
                  id="segment"
                  placeholder="IT"
                  value={formData.segment}
                  onChange={(e) => handleInputChange("segment", e.target.value)}
                  className="h-8 sm:h-10 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="lead_type" className="text-xs sm:text-sm">
                  Lead Type
                </Label>
                <Select value={formData.lead_type} onValueChange={(value) => handleInputChange("lead_type", value)}>
                  <SelectTrigger className="h-8 sm:h-10 text-sm">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {leadTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="assigned_to" className="text-xs sm:text-sm">
                  Assigned To *
                </Label>
                <Select value={formData.assigned_to} onValueChange={(value) => handleInputChange("assigned_to", value)}>
                  <SelectTrigger className="h-8 sm:h-10 text-sm">
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {companyUsers.map((user) => (
                      <SelectItem key={user.id} value={user.username}>
                        {user.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="current_system" className="text-xs sm:text-sm">
                Current System
              </Label>
              <Input
                id="current_system"
                placeholder="Excel"
                value={formData.current_system}
                onChange={(e) => handleInputChange("current_system", e.target.value)}
                className="h-8 sm:h-10 text-sm"
              />
            </div>

            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="machine_specification" className="text-xs sm:text-sm">
                  Machine Spec
                </Label>
                <Textarea
                  id="machine_specification"
                  value={formData.machine_specification}
                  onChange={(e) => handleInputChange("machine_specification", e.target.value)}
                  rows={2}
                  className="text-sm resize-none"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="challenges" className="text-xs sm:text-sm">
                  Challenges
                </Label>
                <Textarea
                  id="challenges"
                  value={formData.challenges}
                  onChange={(e) => handleInputChange("challenges", e.target.value)}
                  rows={2}
                  className="text-sm resize-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="remark" className="text-xs sm:text-sm">
                Remark
              </Label>
              <Textarea
                id="remark"
                value={formData.remark}
                onChange={(e) => handleInputChange("remark", e.target.value)}
                rows={2}
                className="text-sm resize-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={isLoading} className="flex-1 h-9 text-sm">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Lead"
                )}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()} className="h-9 text-sm px-4">
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
