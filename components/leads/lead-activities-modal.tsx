// frontend/components/leads/lead-activities-modal.tsx
"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Activity, Calendar, Phone, Mail, MessageSquare } from "lucide-react"
import { api, type ApiLead, type ApiActivity } from "@/lib/api"
import { formatDateTime } from "@/lib/date-format";

interface LeadActivitiesModalProps {
  lead: ApiLead | null
  isOpen: boolean
  onClose: () => void
}

const activityIcons = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  message: MessageSquare,
  default: Activity,
}

const activityColors = {
  call: "bg-blue-100 text-blue-800",
  email: "bg-green-100 text-green-800",
  meeting: "bg-purple-100 text-purple-800",
  message: "bg-orange-100 text-orange-800",
  default: "bg-gray-100 text-gray-800",
}

export function LeadActivitiesModal({ lead, isOpen, onClose }: LeadActivitiesModalProps) {
  const [activities, setActivities] = useState<ApiActivity[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && lead) {
      const fetchActivities = async () => {
        try {
          setIsLoading(true)
          setError(null)
          const data = await api.getActivities(Number(lead.id))
          setActivities(data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
        } catch (err) {
          // Handle cases where a lead might have no activities (which returns a 404)
          if (err instanceof Error && err.message.includes("404")) {
            setActivities([]);
          } else {
            console.error("Failed to fetch activities:", err)
            setError("Failed to load activities for this lead.")
          }
        } finally {
          setIsLoading(false)
        }
      }
      fetchActivities()
    }
  }, [isOpen, lead])

  const getActivityIcon = (phase: string) => {
    const type = phase.toLowerCase().includes("call") ? "call"
      : phase.toLowerCase().includes("email") ? "email"
      : phase.toLowerCase().includes("meeting") ? "meeting"
      : phase.toLowerCase().includes("demo") ? "meeting"
      : "default"
    const IconComponent = activityIcons[type as keyof typeof activityIcons] || activityIcons.default
    return <IconComponent className="h-4 w-4" />
  }

  const getActivityColor = (phase: string) => {
    const type = phase.toLowerCase().includes("call") ? "call"
      : phase.toLowerCase().includes("email") ? "email"
      : phase.toLowerCase().includes("meeting") ? "meeting"
      : phase.toLowerCase().includes("demo") ? "meeting"
      : "default"
    return activityColors[type as keyof typeof activityColors] || activityColors.default
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activities - {lead?.company_name}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading activities...
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : (
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 p-1">
              {activities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No activities found for this lead.</div>
              ) : (
                activities.map((activity) => (
                  <div key={activity.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={getActivityColor(activity.phase)}>
                          {getActivityIcon(activity.phase)}
                          <span className="ml-1 capitalize">{activity.phase.replace(/_/g, ' ')}</span>
                        </Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">{formatDateTime(activity.created_at)}</span>
                    </div>
                    <p className="whitespace-pre-wrap">{activity.details}</p>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  )
}