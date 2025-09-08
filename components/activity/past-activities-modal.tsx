// frontend/components/activity/past-activities-modal.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { api, type ApiActivity } from "@/lib/api";
import { Loader2, Calendar } from "lucide-react";
import { formatDateTime } from "@/lib/date-format";
import { Badge } from "@/components/ui/badge";

interface PastActivitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: number | null;
  leadName: string | null;
}

export function PastActivitiesModal({ isOpen, onClose, leadId, leadName }: PastActivitiesModalProps) {
  const [activities, setActivities] = useState<ApiActivity[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Fetch activities only when the modal is open and a valid leadId is provided
    if (isOpen && leadId) {
      setIsLoading(true);
      api.getActivities(leadId)
        .then((data) => {
          // The API returns activities; we'll sort them to show the most recent first
          setActivities(data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
        })
        .catch((error) => {
          console.error("Failed to fetch past activities:", error);
          // You can add a toast notification here for the error if desired
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen, leadId]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Activity History for {leadName}</DialogTitle>
          <DialogDescription>
            A complete history of all logged activities for this lead, showing the most recent first.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto pr-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : activities.length > 0 ? (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="p-4 rounded-lg border bg-muted/50">
                  <div className="flex justify-between items-center mb-2">
                    <Badge variant="secondary" className="font-semibold text-sm capitalize">{activity.phase}</Badge>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      {formatDateTime(activity.created_at)}
                    </div>
                  </div>
                  <p className="resize-y break-all pr-10">{activity.details}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              No past activities have been logged for this lead yet.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}