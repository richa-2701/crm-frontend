//frontend/components/activity/mark-as-done-modal.tsx
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
import { ApiUnifiedActivity, ApiUser, api } from "@/lib/api";
import { Loader2 } from "lucide-react";

interface MarkAsDoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  activity: ApiUnifiedActivity | null;
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

  // Clear notes when a new activity is selected or modal is closed
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
      await api.markActivityDone(activity.id, notes, currentUser.username);
      toast({
        title: "Success!",
        description: "The activity has been marked as complete.",
      });
      onSuccess(); // This will close the modal and refresh the parent component's data
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Scheduled Activity</DialogTitle>
          <DialogDescription>
            Log the outcome for your scheduled activity with {activity.company_name}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* --- THIS IS THE FIX --- */}
          {/* We now display the original task's details in a styled, read-only block. */}
          <div className="space-y-2">
            <Label htmlFor="original-task">Original Task:</Label>
            <div
              id="original-task"
              className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md border min-h-[60px]"
            >
              {activity.details}
            </div>
          </div>
          {/* --- END FIX --- */}

          <div className="space-y-2">
            <Label htmlFor="outcome-notes">Outcome / Notes *</Label>
            <Textarea
              id="outcome-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Client agreed to the proposal..."
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
            Mark as Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}