// frontend/components/discussions/discussion-done-form.tsx
"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { api, ApiLead, ApiUser, ApiReminder } from "@/lib/api"
// --- REMOVED: useRouter is no longer needed ---

interface FormProps {
  currentUser: ApiUser;
}

interface PendingDiscussion {
    leadId: number;
    companyName: string;
    message: string;
}

export function DiscussionDoneForm({ currentUser }: FormProps) {
    const { toast } = useToast();
    // --- REMOVED: router is no longer needed ---
    const [pendingDiscussions, setPendingDiscussions] = useState<PendingDiscussion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({ leadCompanyName: "", details: "" });

    // --- Renamed to be more descriptive ---
    const fetchAndSetPendingDiscussions = async () => {
        setIsLoading(true);
        try {
            const [reminders, leads] = await Promise.all([api.getPendingDiscussions(), api.getLeads()]);
            const leadMap = new Map<number, string>();
            leads.forEach(lead => leadMap.set(lead.id, lead.company_name));
            const discussions = reminders.map(reminder => ({
                leadId: reminder.lead_id,
                companyName: leadMap.get(reminder.lead_id) || `Lead ID ${reminder.lead_id}`,
                message: reminder.message,
            }));
            const uniqueDiscussions = Array.from(new Map(discussions.map(d => [d.leadId, d])).values());
            setPendingDiscussions(uniqueDiscussions);
        } catch (error) {
            toast({ title: "Error", description: "Failed to fetch pending discussions." });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAndSetPendingDiscussions();
    }, [toast]);
    
    // --- THIS IS THE CORRECTED FUNCTION ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.leadCompanyName || !formData.details.trim()) {
            toast({ title: "Error", description: "Please select a discussion and provide outcome details.", variant: "destructive" });
            return;
        }
        setIsLoading(true);

        const message = `discussion done for ${formData.leadCompanyName}, ${formData.details}`;

        try {
            const response = await api.sendMessage(message, currentUser.usernumber);
            toast({ title: "Success", description: response.reply });
            
            // Clear the form
            setFormData({ leadCompanyName: "", details: "" });

            // Refresh the list of pending discussions since one was just completed
            fetchAndSetPendingDiscussions();

        } catch (error) {
            toast({ title: "Error", description: error instanceof Error ? error.message : "An error occurred.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };
    // --- END CORRECTION ---

    return (
        <Card>
            <CardHeader><CardTitle>Mark Discussion as Done</CardTitle></CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label>Scheduled Discussion *</Label>
                        <Select required value={formData.leadCompanyName} onValueChange={(value) => setFormData({ ...formData, leadCompanyName: value })}>
                            <SelectTrigger>
                                <SelectValue placeholder={isLoading ? "Loading discussions..." : "Select a scheduled discussion..."} />
                            </SelectTrigger>
                            <SelectContent>
                                {pendingDiscussions.length > 0 ? (
                                    pendingDiscussions.map(discussion => (
                                        <SelectItem key={discussion.leadId} value={discussion.companyName}>
                                            <div className="flex flex-col">
                                                <span className="font-semibold">{discussion.companyName}</span>
                                                <span className="text-xs text-muted-foreground truncate">{discussion.message}</span>
                                            </div>
                                        </SelectItem>
                                    ))
                                ) : (
                                    <div className="p-4 text-center text-sm text-muted-foreground">No pending discussions found.</div>
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Outcome / Notes *</Label>
                        <Textarea placeholder="e.g., They have agreed to a product demo next week." rows={4} required value={formData.details} onChange={(e) => setFormData({ ...formData, details: e.target.value })} />
                        <p className="text-xs text-muted-foreground">This will log the outcome and mark the scheduled reminder as complete.</p>
                    </div>
                    <Button type="submit" disabled={isLoading || pendingDiscussions.length === 0} className="w-full">{isLoading ? "Saving..." : "Mark as Done"}</Button>
                </form>
            </CardContent>
        </Card>
    );
}