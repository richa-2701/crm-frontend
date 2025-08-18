"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, History, Edit, UserCheck, Calendar } from "lucide-react"
import { leadApi } from "@/lib/api"

interface Lead {
  id: string
  company_name: string
  contact_name: string
}

interface HistoryItem {
  timestamp: string
  event_type: string
  details: string
  user: string
}

interface LeadHistoryModalProps {
  lead: Lead
  isOpen: boolean
  onClose: () => void
}

const actionIcons = {
  created: Edit,
  updated: Edit,
  assigned: UserCheck,
  status_changed: Calendar,
  default: History,
}

const actionColors = {
  created: "bg-green-100 text-green-800",
  updated: "bg-blue-100 text-blue-800",
  assigned: "bg-purple-100 text-purple-800",
  status_changed: "bg-orange-100 text-orange-800",
  default: "bg-gray-100 text-gray-800",
}

export function LeadHistoryModal({ lead, isOpen, onClose }: LeadHistoryModalProps) {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && lead) {
      fetchHistory()
    }
  }, [isOpen, lead])

  const fetchHistory = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await leadApi.getHistory(lead.id)
      setHistory(data)
    } catch (err) {
      console.error("Failed to fetch history:", err)
      setError("Failed to load history")
    } finally {
      setIsLoading(false)
    }
  }

  const getActionIcon = (eventType: string) => {
    const type = eventType.toLowerCase().includes("creation")
      ? "created"
      : eventType.toLowerCase().includes("reassignment")
        ? "assigned"
        : eventType.toLowerCase().includes("status")
          ? "status_changed"
          : "updated"
    const IconComponent = actionIcons[type as keyof typeof actionIcons] || actionIcons.default
    return <IconComponent className="h-4 w-4" />
  }

  const getActionColor = (eventType: string) => {
    const type = eventType.toLowerCase().includes("creation")
      ? "created"
      : eventType.toLowerCase().includes("reassignment")
        ? "assigned"
        : eventType.toLowerCase().includes("status")
          ? "status_changed"
          : "updated"
    return actionColors[type as keyof typeof actionColors] || actionColors.default
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString()
    } catch (error) {
      return "Invalid Date"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            History - {lead.company_name}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading history...
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : (
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4">
              {history.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No history found for this lead.</div>
              ) : (
                history.map((item) => (
                  <div key={`${item.timestamp}-${item.user}`} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={getActionColor(item.event_type)}>
                          {getActionIcon(item.event_type)}
                          <span className="ml-1">{item.event_type}</span>
                        </Badge>
                        {item.user && <span className="text-sm text-muted-foreground">by {item.user}</span>}
                      </div>
                      <span className="text-sm text-muted-foreground">{formatDate(item.timestamp)}</span>
                    </div>
                    <p className="text-sm">{item.details}</p>
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
