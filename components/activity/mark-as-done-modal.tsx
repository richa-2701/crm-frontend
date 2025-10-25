// frontend/components/activity/mark-as-done-modal.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
// --- FIX: Import the full 'api' object and ApiReminder type ---
import { api, ApiReminder, ApiUser } from "@/lib/api";
import { Loader2 } from "lucide-react";

interface MarkAsDoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  // --- FIX: The activity prop is a Reminder, not a generic UnifiedActivity ---
  activity: ApiReminder | null;
  currentUser: ApiUser | null;
}

export function MarkAsDoneModal({
  isOpen,
  onClose,
  onSuccess,
  activity,
  currentUser,
}: MarkAsDoneModalProps) {
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen) {
      setNotes("");
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!activity || !currentUser || !notes) {
      toast({
        title: "Missing Information",
        description: "Please provide outcome notes before completing the task.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // --- START OF FIX: Call the new, correct API endpoint ---
      // This will update the reminder AND create a new activity log in one step.
      await api.completeAndLogReminder(activity.id, notes, currentUser.username);
      // --- END OF FIX ---
      
      toast({
        title: "Success!",
        description: "The activity has been marked as complete and logged.",
      });
      onSuccess();
    } catch (error) {
      console.error("Failed to mark activity as done:", error);
      toast({
        title: "Error",
        description: "Could not complete the activity. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !activity) {
    return null;
  }

  // Find the lead name from the activity object if it exists (it might not if fetched from reminders list)
  // In a real app, the activity object would ideally contain the company name.
  const companyName = (activity as any).company_name || "the lead";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Scheduled Activity</DialogTitle>
          <DialogDescription>
            Log the outcome for your scheduled activity with {companyName}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="original-task">Original Task:</Label>
            <div
              id="original-task"
              className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md border min-h-[60px]"
            >
              {activity.message} {/* Use 'message' for reminders */}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="outcome-notes">Outcome / Notes *</Label>
            <Textarea
              id="outcome-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Client agreed to the proposal and will send the PO by EOD."
              rows={4}
              required
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !notes}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Mark as Done & Log
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}