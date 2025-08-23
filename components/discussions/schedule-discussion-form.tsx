// frontend/components/discussions/schedule-discussion-form.tsx
"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { api, ApiLead, ApiUser } from "@/lib/api"
// --- REMOVED: useRouter is no longer needed ---

interface FormProps {
  currentUser: ApiUser;
}

export function ScheduleDiscussionForm({ currentUser }: FormProps) {
    const { toast } = useToast();
    // --- REMOVED: router is no longer needed ---
    const [leads, setLeads] = useState<ApiLead[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({ leadId: "", details: "" });

    useEffect(() => {
        api.getLeads().then(setLeads).catch(() => toast({ title: "Error", description: "Failed to fetch leads." }));
    }, [toast]);

    // --- THIS IS THE CORRECTED FUNCTION ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.leadId || !formData.details.trim()) {
            toast({ title: "Error", description: "Please select a lead and provide scheduling details.", variant: "destructive" });
            return;
        }
        setIsLoading(true);

        const selectedLead = leads.find(lead => String(lead.id) === formData.leadId);
        if (!selectedLead) {
            setIsLoading(false);
            return;
        }

        const message = `schedule discussion for ${selectedLead.company_name}, ${formData.details}`;

        try {
            const response = await api.sendMessage(message, currentUser.usernumber);
            toast({ title: "Success", description: response.reply });

            // Clear the form for the next entry
            setFormData({ leadId: "", details: "" });

        } catch (error) {
            toast({ title: "Error", description: error instanceof Error ? error.message : "An error occurred.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };
    // --- END CORRECTION ---

    return (
        <Card>
            <CardHeader><CardTitle>Schedule Future Discussion</CardTitle></CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label>Lead Name *</Label>
                        <Select required value={formData.leadId} onValueChange={(value) => setFormData({ ...formData, leadId: value })}>
                            <SelectTrigger><SelectValue placeholder="Select a lead..." /></SelectTrigger>
                            <SelectContent>{leads.map(lead => <SelectItem key={lead.id} value={String(lead.id)}>{lead.company_name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Discussion Details & Time *</Label>
                        <Textarea placeholder="e.g., Follow up with them tomorrow at 3 PM to discuss the proposal." rows={4} required value={formData.details} onChange={(e) => setFormData({ ...formData, details: e.target.value })} />
                        <p className="text-xs text-muted-foreground">Include a date and time (e.g., "next Friday at 11am") to automatically set a reminder.</p>
                    </div>
                    <Button type="submit" disabled={isLoading} className="w-full">{isLoading ? "Scheduling..." : "Schedule Discussion"}</Button>
                </form>
            </CardContent>
        </Card>
    );
}