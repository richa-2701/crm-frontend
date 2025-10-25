// frontend/components/leads/lead-activities-modal.tsx
"use client"

import { useEffect, useState, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Activity, Calendar, Phone, Mail, MessageSquare, Video, Info } from "lucide-react"
import { api, type ApiLead, type ApiActivity, type ApiReminder, type ApiMeeting, type ApiDemo } from "@/lib/api"
import { formatDateTime } from "@/lib/date-format";

interface LeadActivitiesModalProps {
  lead: ApiLead | null
  isOpen: boolean
  onClose: () => void
}

// --- START OF FIX: Define a unified activity type to handle all sources ---
interface UnifiedTimelineActivity {
  id: string;
  type: 'log' | 'reminder' | 'meeting' | 'demo';
  date: string; // The primary date for sorting and display (creation date)
  scheduled_date?: string; // The future date for scheduled items
  details: string;
  status?: string;
  created_by?: string;
}
// --- END OF FIX ---

const activityIcons = {
  log: Info,
  reminder: MessageSquare,
  meeting: Calendar,
  demo: Video,
  call: Phone,
  email: Mail,
  default: Activity,
};

const activityColors = {
  log: "bg-gray-100 text-gray-800",
  reminder: "bg-orange-100 text-orange-800",
  meeting: "bg-purple-100 text-purple-800",
  demo: "bg-indigo-100 text-indigo-800",
  call: "bg-blue-100 text-blue-800",
  email: "bg-green-100 text-green-800",
  default: "bg-gray-100 text-gray-800",
};

export function LeadActivitiesModal({ lead, isOpen, onClose }: LeadActivitiesModalProps) {
  // --- START OF FIX: Change state to hold the unified activity type ---
  const [activities, setActivities] = useState<UnifiedTimelineActivity[]>([])
  // --- END OF FIX ---
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAllActivities = useCallback(async (leadId: number) => {
    try {
      setIsLoading(true);
      setError(null);

      // --- START OF FIX: Fetch from all four data sources in parallel ---
      const [
        loggedActivities,
        reminders,
        meetings,
        demos
      ] = await Promise.all([
        api.getActivitiesByLead(leadId).catch(() => []), // Ignore errors if none found
        api.getAllReminders({ LeadId: leadId }).catch(() => []),
        api.getAllMeetings({ leadId }).catch(() => []),
        api.getAllDemos({ leadId }).catch(() => []),
      ]);

      const unifiedTimeline: UnifiedTimelineActivity[] = [];

      // Map Logged Activities
      if (Array.isArray(loggedActivities)) {
        loggedActivities.forEach((act: ApiActivity) => unifiedTimeline.push({
          id: `log-${act.id}`,
          type: 'log',
          date: act.created_at,
          details: act.details,
          created_by: act.created_by,
          status: act.phase,
        }));
      }

      // Map Reminders
      if (Array.isArray(reminders)) {
        reminders.forEach((rem: ApiReminder) => {
            if (!rem.is_hidden_from_activity_log) { // Important: Exclude hidden reminders
                unifiedTimeline.push({
                    id: `reminder-${rem.id}`,
                    type: 'reminder',
                    date: rem.created_at,
                    scheduled_date: rem.remind_time,
                    details: rem.message,
                    created_by: 'System', // Or rem.created_by if available
                    status: rem.status,
                });
            }
        });
      }

      // Map Meetings
      if (Array.isArray(meetings)) {
        meetings.forEach((meet: ApiMeeting) => unifiedTimeline.push({
          id: `meeting-${meet.id}`,
          type: 'meeting',
          date: meet.created_at,
          scheduled_date: meet.event_time,
          details: `Meeting scheduled with ${meet.assigned_to}. Notes: ${meet.remark || 'N/A'}`,
          created_by: meet.created_by,
          status: meet.phase,
        }));
      }
      
      // Map Demos
      if (Array.isArray(demos)) {
          demos.forEach((demo: ApiDemo) => unifiedTimeline.push({
              id: `demo-${demo.id}`,
              type: 'demo',
              date: demo.created_at,
              scheduled_date: demo.start_time,
              details: `Demo scheduled with ${demo.assigned_to}. Notes: ${demo.remark || 'N/A'}`,
              created_by: demo.scheduled_by,
              status: demo.phase,
          }));
      }
      // --- END OF FIX ---

      // Sort the final combined list by the creation date
      unifiedTimeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setActivities(unifiedTimeline);

    } catch (err) {
      console.error("Failed to fetch activities:", err);
      setError("Failed to load a complete activity history for this lead.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && lead) {
      fetchAllActivities(Number(lead.id));
    }
  }, [isOpen, lead, fetchAllActivities]);


  // --- START OF FIX: Update icon and color logic for the new unified types ---
  const getActivityIcon = (activity: UnifiedTimelineActivity) => {
    let iconKey: keyof typeof activityIcons = activity.type;
    
    // For logs, be more specific if possible
    if (activity.type === 'log' && activity.status) {
        const statusLower = activity.status.toLowerCase();
        if (statusLower.includes("call")) iconKey = "call";
        else if (statusLower.includes("email")) iconKey = "email";
    }

    const IconComponent = activityIcons[iconKey] || activityIcons.default;
    return <IconComponent className="h-4 w-4" />;
  };

  const getActivityColor = (activity: UnifiedTimelineActivity) => {
    let colorKey: keyof typeof activityColors = activity.type;

    if (activity.type === 'log' && activity.status) {
        const statusLower = activity.status.toLowerCase();
        if (statusLower.includes("call")) colorKey = "call";
        else if (statusLower.includes("email")) colorKey = "email";
    }
    
    return activityColors[colorKey] || activityColors.default;
  };
  
  const getActivityTitle = (activity: UnifiedTimelineActivity) => {
    if (activity.type === 'log' && activity.status) {
        return activity.status.replace(/_/g, ' ');
    }
    return activity.type;
  }
  // --- END OF FIX ---


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
            Loading complete activity history...
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : (
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 p-1">
              {activities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No activities found for this lead.</div>
              ) : (
                // --- START OF FIX: Update rendering logic for the new data structure ---
                activities.map((activity) => (
                  <div key={activity.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge className={getActivityColor(activity)}>
                          {getActivityIcon(activity)}
                          <span className="ml-1 capitalize">{getActivityTitle(activity)}</span>
                        </Badge>
                        {activity.status && (
                            <Badge variant="secondary" className="font-normal">{activity.status}</Badge>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground" title={`Created on ${formatDateTime(activity.date)}`}>
                        {formatDateTime(activity.date)}
                      </span>
                    </div>
                    
                    <p className="whitespace-pre-wrap text-sm">{activity.details}</p>

                    {activity.scheduled_date && (
                        <div className="text-xs text-muted-foreground pt-1">
                            <strong>Scheduled for:</strong> {formatDateTime(activity.scheduled_date)}
                        </div>
                    )}
                  </div>
                ))
                // --- END OF FIX ---
              )}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  )
}