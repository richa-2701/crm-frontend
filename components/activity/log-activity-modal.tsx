// frontend/components/activity/log-activity-modal.tsx
"use client"
import { useState, useEffect } from "react"
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Mic, MicOff } from "lucide-react"
import { api, ApiLead, ApiUser } from "@/lib/api"

interface ModalProps {
  currentUser: ApiUser;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const activityTypes = ["Call", "Message", "WhatsApp", "Email", "Other"];

export function LogActivityModal({ currentUser, isOpen, onClose, onSuccess }: ModalProps) {
    const { toast } = useToast();
    const [leads, setLeads] = useState<ApiLead[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({ leadId: "", details: "", activityType: "Call" });
    const [otherActivityType, setOtherActivityType] = useState("");
    const [textBeforeListening, setTextBeforeListening] = useState("");

    const {
        transcript,
        listening,
        resetTranscript,
        browserSupportsSpeechRecognition
    } = useSpeechRecognition();

    useEffect(() => {
        if (isOpen) {
            setFormData({ leadId: "", details: "", activityType: "Call" });
            setOtherActivityType("");
            resetTranscript();
            api.getAllLeads()
               .then(setLeads)
               .catch(() => toast({ title: "Error", description: "Failed to fetch leads." }));
        }
    }, [isOpen, toast, resetTranscript]);

    // This effect now combines previous text with the live transcript
    useEffect(() => {
        if (listening) {
            const combinedText = [textBeforeListening, transcript]
                .filter(Boolean) // Removes any empty strings
                .join(' ');     // Joins with a space
            setFormData(prev => ({ ...prev, details: combinedText }));
        }
    }, [transcript, listening, textBeforeListening]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.leadId || !formData.details.trim()) {
            toast({ title: "Error", description: "Please select a lead and provide activity details.", variant: "destructive" });
            return;
        }
        setIsLoading(true);

        const finalActivityType = formData.activityType === 'Other' ? otherActivityType.trim() : formData.activityType;
        if (!finalActivityType) {
            toast({ title: "Error", description: "Please specify the activity type.", variant: "destructive" });
            setIsLoading(false);
            return;
        }

        const selectedLead = leads.find(lead => String(lead.id) === formData.leadId);
        if (!selectedLead) {
            toast({ title: "Error", description: "Selected lead not found.", variant: "destructive" });
            setIsLoading(false);
            return;
        }

        try {
            const payload = {
                lead_id: selectedLead.id,
                details: formData.details,
                phase: "Activity Logged",
                activity_type: finalActivityType
            };

            await api.logActivity(payload);
            toast({ title: "Success", description: "Activity logged successfully." });
            onSuccess();
            onClose();
        } catch (error) {
            toast({ title: "Error", description: error instanceof Error ? error.message : "An error occurred.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleMicClick = () => {
        if (listening) {
            SpeechRecognition.stopListening();
        } else {
            // Before starting, save the current text and clear the old transcript
            setTextBeforeListening(formData.details);
            resetTranscript();
            SpeechRecognition.startListening({ continuous: true });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Log a Past Activity</DialogTitle>
                    <DialogDescription>Record the details of a completed interaction with a lead.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Lead Name *</Label>
                            <Select required value={formData.leadId} onValueChange={(value) => setFormData({ ...formData, leadId: value })}>
                                <SelectTrigger><SelectValue placeholder="Select a lead..." /></SelectTrigger>
                                <SelectContent>{leads.map(lead => <SelectItem key={lead.id} value={String(lead.id)}>{lead.company_name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Activity Type *</Label>
                            <Select value={formData.activityType} onValueChange={(value) => setFormData({ ...formData, activityType: value })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {activityTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {formData.activityType === 'Other' && (
                        <div className="space-y-2">
                            <Label>Custom Activity Type *</Label>
                            <Input
                                value={otherActivityType}
                                onChange={(e) => setOtherActivityType(e.target.value)}
                                placeholder="e.g., Site Visit"
                                required
                            />
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="details">Activity Details / Outcome *</Label>
                        <div className="relative">
                            <Textarea
                                id="details"
                                placeholder="e.g., Called the client, they are interested in the premium package. Or click the mic to speak."
                                rows={4}
                                required
                                value={formData.details}
                                onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                                className="resize-y break-all pr-10"
                            />
                            {browserSupportsSpeechRecognition && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleMicClick}
                                    className="absolute bottom-2 right-2 h-7 w-7"
                                >
                                    {listening ? <MicOff className="h-4 w-4 text-red-500" /> : <Mic className="h-4 w-4" />}
                                    <span className="sr-only">Toggle microphone</span>
                                </Button>
                            )}
                        </div>
                         {listening && <p className="text-xs text-muted-foreground animate-pulse mt-1">Listening...</p>}
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Log Activity
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}