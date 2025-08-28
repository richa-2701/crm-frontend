//frontend/app/dashboard/schedule-demo/page.tsx
"use client"

import type React from "react"
import { UserAvailabilityCalendar } from "@/components/ui/user-availability-calendar"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { Autocomplete } from "@/components/ui/autocomplete"
import { api } from "@/lib/api"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"

interface Lead {
  id: string
  company_name: string
  contact_name: string
}

interface User {
  id: string
  username: string
  email: string
  role: string
}

interface Meeting {
  id: string
  lead_id: string
  assigned_to: string
  start_time: string
  end_time: string
  type: "meeting" | "demo"
}

export default function ScheduleDemoPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [leads, setLeads] = useState<Lead[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [availabilityError, setAvailabilityError] = useState<string | null>(null)
  const [showCalendar, setShowCalendar] = useState(false)
  const [busySlots, setBusySlots] = useState<{ start: string; end: string }[]>([])
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [confirmationMessage, setConfirmationMessage] = useState("")

  const [formData, setFormData] = useState({
    lead_id: "",
    assigned_to: "",
    start_time: "",
    end_time: "",
    duration: "120", // Default demo duration: 120 minutes
  })

  // Effect to automatically calculate end_time when start_time or duration changes
  useEffect(() => {
    if (formData.start_time && formData.duration) {
      const durationInMinutes = parseInt(formData.duration, 10)
      if (!isNaN(durationInMinutes) && durationInMinutes > 0) {
        const start = new Date(formData.start_time)
        const end = new Date(start.getTime() + durationInMinutes * 60 * 1000)
        const endTimeString = end.toISOString().slice(0, 16)

        // To prevent potential infinite loops, only update if the value has changed
        if (formData.end_time !== endTimeString) {
          setFormData((prev) => ({
            ...prev,
            end_time: endTimeString,
          }))
        }
      }
    }
  }, [formData.start_time, formData.duration, formData.end_time])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [leadsData, usersData] = await Promise.all([api.getAllLeads(), api.getUsers()])

        console.log("[v0] Fetched leads for demo scheduling:", leadsData.length)
        console.log("[v0] Fetched users for demo scheduling:", usersData.length)

        setLeads(leadsData.map((lead: any) => ({
          id: lead.id.toString(),
          company_name: lead.company_name,
          contact_name: lead.contact_name,
        })))
        setUsers(usersData.map((user: any) => ({
          id: user.id.toString(),
          username: user.username,
          email: user.email,
          role: user.role,
        })))

        // Load meetings from localStorage (until backend endpoint is available)
        const storedMeetings = JSON.parse(localStorage.getItem("meetings") || "[]")
        setMeetings(storedMeetings)
      } catch (error) {
        console.error("[v0] Failed to fetch data:", error)
        toast({
          title: "Error",
          description: "Failed to load data. Please refresh the page.",
          variant: "destructive",
        })
      }
    }

    fetchData()
  }, [toast])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setAvailabilityError(null)
    setShowCalendar(false)
  }

  const checkAvailability = (assignedTo: string, startTime: string, endTime: string): boolean => {
    if (!startTime || !endTime) return true // Don't check if time is not set yet
    const start = new Date(startTime)
    const end = new Date(endTime)

    const conflicts = meetings.filter((meeting) => {
      if (meeting.assigned_to !== assignedTo) return false

      const meetingStart = new Date(meeting.start_time)
      const meetingEnd = new Date(meeting.end_time)

      return (
        (start >= meetingStart && start < meetingEnd) ||
        (end > meetingStart && end <= meetingEnd) ||
        (start <= meetingStart && end >= meetingEnd)
      )
    })

    if (conflicts.length > 0) {
      setBusySlots(
        conflicts.map((meeting) => ({
          start: meeting.start_time,
          end: meeting.end_time,
        })),
      )
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Check availability
      const isAvailable = checkAvailability(formData.assigned_to, formData.start_time, formData.end_time)

      if (!isAvailable) {
        const assignedUser = users.find((u) => u.username === formData.assigned_to)
        setAvailabilityError(`${assignedUser?.username} is unavailable at the selected time.`)
        setShowCalendar(true)
        setIsLoading(false)
        return
      }

      const assignedUser = users.find((u) => u.username === formData.assigned_to)
      const currentUser = users.find((u) => u.username === "richa") // Get current user from context/auth

      const demoData = {
        lead_id: Number.parseInt(formData.lead_id),
        assigned_to_user_id: Number.parseInt(assignedUser?.id || "1"),
        start_time: formData.start_time,
        end_time: formData.end_time,
        created_by_user_id: Number.parseInt(currentUser?.id || "1"),
      }

      console.log("[v0] Scheduling demo with data:", demoData)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/web/demos/schedule`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(demoData),
      })

      if (!response.ok) {
        throw new Error(`Failed to schedule demo: ${response.statusText}`)
      }

      const result = await response.json()
      console.log("[v0] Demo scheduled successfully:", result)

      // Update local storage for UI consistency
      const newDemo = {
        id: result.id.toString(),
        lead_id: formData.lead_id,
        assigned_to: formData.assigned_to,
        start_time: formData.start_time,
        end_time: formData.end_time,
        type: "demo",
      }

      const updatedMeetings = [...meetings, newDemo]
      localStorage.setItem("meetings", JSON.stringify(updatedMeetings))

      setConfirmationMessage("Demo has scheduled")
      setShowConfirmation(true)
    } catch (error) {
      console.error("[v0] Failed to schedule demo:", error)
      toast({
        title: "Error",
        description: "Failed to schedule demo. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirmation = () => {
    setShowConfirmation(false)
    router.push("/dashboard")
  }

  const getUserName = (username: string) => {
    const user = users.find((u) => u.username === username)
    return user ? user.username : ""
  }

  const leadOptions = leads.map((lead) => ({
    value: lead.id,
    label: `${lead.company_name} (${lead.contact_name})`,
  }))

  return (
    <div className="space-y-3 sm:space-y-6">
      <div className="px-1">
        <h1 className="text-xl sm:text-3xl font-bold tracking-tight">Schedule Demo</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Schedule a product demo with a lead</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="border-0 sm:border shadow-none sm:shadow-sm">
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-lg sm:text-xl">Demo Details</CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-6">
                <div className="grid gap-3 grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="lead_id" className="text-xs sm:text-sm">
                      Lead Name *
                    </Label>
                    <Autocomplete
                      options={leadOptions}
                      value={formData.lead_id}
                      onValueChange={(value) => handleInputChange("lead_id", value)}
                      placeholder="Search and select a lead..."
                      searchPlaceholder="Type to search leads..."
                      emptyMessage="No leads found."
                      className="h-8 sm:h-10 text-sm w-full min-w-0 overflow-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="assigned_to" className="text-xs sm:text-sm">
                      Assigned To *
                    </Label>
                    <Select
                      value={formData.assigned_to}
                      onValueChange={(value) => handleInputChange("assigned_to", value)}
                    >
                      <SelectTrigger className="h-8 sm:h-10 text-sm">
                        <SelectValue placeholder="Select user" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.username}>
                            {user.username}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="start_time" className="text-xs sm:text-sm">
                      Start Date & Time *
                    </Label>
                    <Input
                      id="start_time"
                      type="datetime-local"
                      value={formData.start_time}
                      onChange={(e) => handleInputChange("start_time", e.target.value)}
                      required
                      className="h-8 sm:h-10 text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="duration" className="text-xs sm:text-sm">
                      Duration (minutes) *
                    </Label>
                    <Input
                      id="duration"
                      type="number"
                      value={formData.duration}
                      onChange={(e) => handleInputChange("duration", e.target.value)}
                      required
                      min="1"
                      className="h-8 sm:h-10 text-sm"
                    />
                  </div>
                </div>

                {availabilityError && (
                  <Alert variant="destructive" className="py-2">
                    <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />
                    <AlertDescription className="text-xs sm:text-sm">{availabilityError}</AlertDescription>
                  </Alert>
                )}

                {showCalendar && busySlots.length > 0 && (
                  <Card className="border-0 sm:border">
                    <CardHeader className="pb-2 sm:pb-4">
                      <CardTitle className="text-sm sm:text-lg">
                        {getUserName(formData.assigned_to)}'s Busy Schedule
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 sm:px-6">
                      <div className="space-y-2">
                        <p className="text-xs sm:text-sm text-muted-foreground">Existing meetings/demos:</p>
                        {busySlots.map((slot, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-muted rounded text-xs sm:text-sm"
                          >
                            <span>
                              {new Date(slot.start).toLocaleString()} - {new Date(slot.end).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex gap-2 pt-2">
                  <Button type="submit" disabled={isLoading} className="flex-1 h-9 text-sm">
                    {isLoading ? "Scheduling..." : "Schedule Demo"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => router.back()} className="h-9 text-sm px-4">
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <UserAvailabilityCalendar
            selectedDate={formData.start_time ? new Date(formData.start_time) : new Date()}
            selectedUser={formData.assigned_to}
            className="h-fit"
          />
        </div>
      </div>

      <ConfirmationDialog
        open={showConfirmation}
        onOpenChange={setShowConfirmation}
        title="Success"
        message={confirmationMessage}
        onConfirm={handleConfirmation}
      />
    </div>
  )
}