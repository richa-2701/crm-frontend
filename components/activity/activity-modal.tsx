//frontend/components/activity/activity-modal.tsx
"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { api, ApiLead, ApiUser } from "@/lib/api";
import { Loader2 } from "lucide-react";

interface ModalProps {
  currentUser: ApiUser;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ActivityModal({ currentUser, isOpen, onClose, onSuccess }: ModalProps) {
    const { toast } = useToast();
    const [leads, setLeads] = useState<ApiLead[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({ leadId: "", details: "" });

    useEffect(() => {
        if (isOpen) {
            api.getLeads().then(setLeads).catch(() => toast({ title: "Error", description: "Failed to fetch leads." }));
        }
    }, [isOpen, toast]);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.leadId || !formData.details.trim()) {
            toast({ title: "Error", description: "Please select a lead and provide details.", variant: "destructive" });
            return;
        }
        setIsLoading(true);

        const selectedLead = leads.find(lead => String(lead.id) === formData.leadId);
        if (!selectedLead) { setIsLoading(false); return; }

        // Determine if it's a schedule or a log based on keywords
        const detailsLower = formData.details.toLowerCase();
        const hasTimeKeyword = detailsLower.includes(" on ") || detailsLower.includes(" at ");
        
        let message = "";
        if (hasTimeKeyword) {
            // It's a SCHEDULE command
            const detailsParts = formData.details.split(/( on | at )/i);
            const action = detailsParts[0].trim();
            const timeInfo = formData.details.substring(action.length).trim();
            message = `Remind me to ${action} for ${selectedLead.company_name} ${timeInfo}`;
        } else {
            // It's a LOG command
            message = `add activity for ${selectedLead.company_name}, ${formData.details}`;
        }

        try {
            const response = await api.sendMessage(message, currentUser.usernumber);
            if (response.reply.startsWith("✅") || response.reply.startsWith("👍")) {
                toast({ title: "Success", description: response.reply });
                setFormData({ leadId: "", details: "" });
                onSuccess();
                onClose();
            } else {
                toast({ title: "Error from Bot", description: response.reply, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: error instanceof Error ? error.message : "An error occurred.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Log or Schedule Activity</DialogTitle>
                    <DialogDescription>Log a past event or schedule a future one. Include a date/time with "on" or "at" to schedule.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                    <div className="space-y-2">
                        <Label>Lead Name *</Label>
                        <Select required value={formData.leadId} onValueChange={(value) => setFormData({ ...formData, leadId: value })}>
                            <SelectTrigger><SelectValue placeholder="Select a lead..." /></SelectTrigger>
                            <SelectContent>{leads.map(lead => <SelectItem key={lead.id} value={String(lead.id)}>{lead.company_name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Activity Details *</Label>
                        <Textarea placeholder="e.g., Called the client... OR Follow up on tomorrow at 3pm." rows={4} required value={formData.details} onChange={(e) => setFormData({ ...formData, details: e.target.value })} />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Activity
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}