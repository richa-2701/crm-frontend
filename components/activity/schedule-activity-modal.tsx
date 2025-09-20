//frontend/components/activity/schedule-activity-modal.tsx
"use client";
import { useState, useEffect } from "react";
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogDescription, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { api, ApiLead, ApiUser } from "@/lib/api";
import { Loader2, Mic, MicOff } from "lucide-react";

interface ModalProps {
    currentUser: ApiUser;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function ScheduleActivityModal({ currentUser, isOpen, onClose, onSuccess }: ModalProps) {
    const { toast } = useToast();
    const [leads, setLeads] = useState<ApiLead[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({ leadId: "", details: "", activityType: "" });
    const [otherActivityType, setOtherActivityType] = useState("");
    const [textBeforeListening, setTextBeforeListening] = useState("");
    const [activityTypeOptions, setActivityTypeOptions] = useState<string[]>([]);

    const {
        transcript,
        listening,
        resetTranscript,
        browserSupportsSpeechRecognition
    } = useSpeechRecognition();

    useEffect(() => {
        if (isOpen) {
            setFormData({ leadId: "", details: "", activityType: "" });
            setOtherActivityType("");
            resetTranscript();
            Promise.all([
                api.getAllLeads(),
                api.getByCategory("activity_type")
            ]).then(([leadsData, activityTypesData]) => {
                setLeads(leadsData);
                const types = activityTypesData.map(item => item.value);
                setActivityTypeOptions([...types, "Other"]);
                if (types.length > 0) {
                    setFormData(prev => ({ ...prev, activityType: types[0] }));
                }
            }).catch(() => toast({ title: "Error", description: "Failed to fetch initial data for modal." }));
        }
    }, [isOpen, toast, resetTranscript]);

    useEffect(() => {
        if (listening) {
            const combinedText = [textBeforeListening, transcript]
                .filter(Boolean)
                .join(' ');
            setFormData(prev => ({ ...prev, details: combinedText }));
        }
    }, [transcript, listening, textBeforeListening]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.leadId || !formData.details.trim()) {
            toast({ title: "Error", description: "Please fill out all required fields.", variant: "destructive" });
            return;
        }

        const finalActivityType = formData.activityType === 'Other' ? otherActivityType.trim() : formData.activityType;
        if (!finalActivityType) {
            toast({ title: "Error", description: "Please specify the custom activity type.", variant: "destructive" });
            return;
        }

        setIsLoading(true);

        try {
            const payload = {
                lead_id: Number(formData.leadId),
                details: formData.details.trim(),
                activity_type: finalActivityType,
                created_by_user_id: currentUser.id,
            };

            await api.scheduleActivity(payload);
            toast({ title: "Success", description: "Activity has been scheduled successfully." });
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
            setTextBeforeListening(formData.details);
            resetTranscript();
            SpeechRecognition.startListening({ continuous: true });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Schedule a Future Activity</DialogTitle>
                    <DialogDescription>
                        This will create a pending activity. If you don't include a date/time, it defaults to tomorrow at 12:00 PM.
                    </DialogDescription>
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
                                <SelectContent>{activityTypeOptions.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                    </div>
                    {formData.activityType === 'Other' && (
                        <div className="space-y-2">
                            <Label>Custom Activity Type</Label>
                            <Input
                                value={otherActivityType}
                                onChange={(e) => setOtherActivityType(e.target.value)}
                                placeholder="e.g., Site Visit"
                                required
                            />
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="details-schedule">Activity Details & Time *</Label>
                        <div className="relative">
                            <Textarea
                                id="details-schedule"
                                placeholder="e.g., Follow up on tomorrow at 3 PM to discuss the proposal. Or click the mic to speak."
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
                        <div className="flex justify-between items-center mt-1">
                            <p className="text-xs text-muted-foreground">You must include a date and time using "on" or "at".</p>
                            {listening && <p className="text-xs text-muted-foreground animate-pulse">Listening...</p>}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Schedule Activity
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}