"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Autocomplete } from "@/components/ui/autocomplete"
import { api } from "@/lib/api"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"

interface Lead {
  id: string
  company_name: string
  contact_name: string
}

interface Meeting {
  id: string
  lead_id: string
  event_type: string
}

export default function PostMeetingPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [leads, setLeads] = useState<Lead[]>([])
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [confirmationMessage, setConfirmationMessage] = useState("")

  const [formData, setFormData] = useState({
    meeting_id: "",
    lead_id: "",
    remark: "",
  })

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const leadsData = await api.getAllLeads()
        console.log("[v0] Fetched leads for post meeting:", leadsData.length)
        setLeads(leadsData)

        const storedMeetings = JSON.parse(localStorage.getItem("meetings") || "[]")
        const scheduledMeetings = storedMeetings.filter((m: any) => m.type === "meeting")
        console.log("[v0] Loaded scheduled meetings:", scheduledMeetings.length)
        setMeetings(scheduledMeetings)
      } catch (error) {
        console.error("[v0] Failed to fetch leads:", error)
        toast({
          title: "Error",
          description: "Failed to load leads. Please refresh the page.",
          variant: "destructive",
        })
      }
    }

    fetchLeads()
  }, [toast])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    if (field === "lead_id") {
      const meeting = meetings.find((m) => m.lead_id === value)
      if (meeting) {
        setFormData((prev) => ({ ...prev, meeting_id: meeting.id }))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const meetingData = {
        meeting_id: Number.parseInt(formData.meeting_id),
        notes: formData.remark,
        updated_by: "richa", // Get from current user context/auth
      }

      console.log("[v0] Completing meeting with data:", meetingData)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/web/meetings/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(meetingData),
      })

      if (!response.ok) {
        throw new Error(`Failed to complete meeting: ${response.statusText}`)
      }

      const result = await response.json()
      console.log("[v0] Meeting completed successfully:", result)

      setConfirmationMessage("Meeting is marked done")
      setShowConfirmation(true)
    } catch (error) {
      console.error("[v0] Failed to complete meeting:", error)
      toast({
        title: "Error",
        description: "Failed to save meeting notes. Please try again.",
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

  const leadsWithMeetings = leads.filter((lead) => meetings.some((meeting) => meeting.lead_id === lead.id))

  const leadOptions = leadsWithMeetings.map((lead) => ({
    value: lead.id,
    label: `${lead.company_name} (${lead.contact_name})`,
  }))

  return (
    <div className="space-y-3 sm:space-y-6">
      <div className="px-1">
        <h1 className="text-xl sm:text-3xl font-bold tracking-tight">Post Meeting</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Record meeting outcome and notes</p>
      </div>

      <Card className="border-0 sm:border shadow-none sm:shadow-sm">
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-lg sm:text-xl">Meeting Outcome</CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-6">
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
                className="h-8 sm:h-10 text-sm w-full"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="remark" className="text-xs sm:text-sm">
                Meeting Notes *
              </Label>
              <Textarea
                id="remark"
                placeholder="Enter meeting notes and outcomes..."
                value={formData.remark}
                onChange={(e) => handleInputChange("remark", e.target.value)}
                rows={3}
                required
                className="text-sm resize-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={isLoading} className="flex-1 h-9 text-sm">
                {isLoading ? "Saving..." : "Save Notes"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()} className="h-9 text-sm px-4">
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

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
