"use client";
import { useState, useEffect, useCallback } from "react";
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogDescription, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { api, ApiUser, ApiLeadSearchResult  } from "@/lib/api";
import { Loader2, Mic, MicOff } from "lucide-react";
import { debounce } from "lodash";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ModalProps {
    currentUser: ApiUser;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const getDefaultDateTimeLocal = () => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 1);
    targetDate.setHours(12, 0, 0, 0);
    const timezoneOffset = targetDate.getTimezoneOffset();
    const adjustedDate = new Date(targetDate.getTime() - (timezoneOffset * 60 * 1000));
    return adjustedDate.toISOString().slice(0, 16);
};

const convertLocalStringToUtcIso = (localString: string): string => {
    if (!localString) return "";

    const [datePart, timePart] = localString.split('T');
    if (!datePart || !timePart) {
        console.warn("Invalid datetime-local string format:", localString);
        return new Date(localString).toISOString();
    }

    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute] = timePart.split(':').map(Number);
    
    const localDate = new Date(year, month - 1, day, hour, minute);

    return localDate.toISOString();
};

export function ScheduleActivityModal({ currentUser, isOpen, onClose, onSuccess }: ModalProps) {
    const { toast } = useToast();
    const [allLeads, setAllLeads] = useState<ApiLeadSearchResult[]>([]);
    const [filteredLeads, setFilteredLeads] = useState<ApiLeadSearchResult[]>([]);
    const [hasFetchedInitialLeads, setHasFetchedInitialLeads] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingData, setIsFetchingData] = useState(false);
    const [isFetchingLeads, setIsFetchingLeads] = useState(false);
    
    const [formData, setFormData] = useState({ 
        leadId: "", 
        details: "", 
        activityType: "",
        remindDateTime: getDefaultDateTimeLocal()
    });

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
            setFormData({ 
                leadId: "", 
                details: "", 
                activityType: "",
                remindDateTime: getDefaultDateTimeLocal()
            });
            setOtherActivityType("");
            resetTranscript();
            setFilteredLeads([]); 
            setHasFetchedInitialLeads(false); 

            setIsFetchingData(true);
            api.getByCategory("activity_type")
                .then((activityTypesData) => {
                    const types = activityTypesData.map(item => item.value);
                    setActivityTypeOptions([...types, "Other"]);
                    if (types.length > 0) {
                        setFormData(prev => ({ ...prev, activityType: types[0] }));
                    }
                }).catch(() => toast({ title: "Error", description: "Failed to fetch activity types." }))
                .finally(() => setIsFetchingData(false));
        }
    }, [isOpen, toast, resetTranscript]);
    
    const handleLeadDropdownOpen = async (open: boolean) => {
        if (open && !hasFetchedInitialLeads) {
            setIsFetchingLeads(true);
            try {
                const results = await api.searchLeads("");
                setAllLeads(results);
                setFilteredLeads(results);
                setHasFetchedInitialLeads(true);
            } catch (error) {
                toast({ title: "Error", description: "Could not fetch the list of leads." });
            } finally {
                setIsFetchingLeads(false);
            }
        }
    };

    const searchLeads = useCallback(
        debounce((searchTerm: string) => {
            if (!searchTerm) {
                setFilteredLeads(allLeads);
                return;
            }
            const filtered = allLeads.filter(lead => 
                lead.company_name.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredLeads(filtered);
        }, 200),
        [allLeads]
    );

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
        if (!formData.leadId || !formData.details.trim() || !formData.remindDateTime) {
            toast({ title: "Error", description: "Please fill out all required fields.", variant: "destructive" });
            return;
        }

        const finalActivityType = formData.activityType === 'Other' ? otherActivityType.trim() : formData.activityType;
        if (!finalActivityType) {
            toast({ title: "Error", description: "Please specify the activity type.", variant: "destructive" });
            return;
        }

        setIsLoading(true);

        try {
            const utcIsoString = convertLocalStringToUtcIso(formData.remindDateTime);
            if (!utcIsoString) {
                toast({ title: "Error", description: "The provided date and time is invalid.", variant: "destructive" });
                setIsLoading(false);
                return;
            }

            const payload = {
                lead_id: Number(formData.leadId),
                message: formData.details.trim(),
                activity_type: finalActivityType,
                user_id: currentUser.id,
                assigned_to: currentUser.username,
                remind_time: utcIsoString,
                status: "Pending"
            };

            await api.scheduleReminder(payload);
            toast({ title: "Success", description: "Reminder has been scheduled successfully." });
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
                        This will create a pending reminder for you to complete later.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                    <div className="space-y-2 ">
                        <Label>Lead Name *</Label>
                        <Select
                            required
                            value={formData.leadId}
                            onValueChange={(value) => setFormData({ ...formData, leadId: value })}
                            onOpenChange={handleLeadDropdownOpen}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Type to search for a lead..." />
                            </SelectTrigger>
                            <SelectContent>
                                <div className="p-2">
                                    <Input
                                        placeholder="Search by company name..."
                                        onChange={(e) => searchLeads(e.target.value)}
                                        onKeyDown={(e) => e.stopPropagation()}
                                        autoFocus
                                    />
                                </div>
                                <ScrollArea className="h-[200px]">
                                    {isFetchingLeads ? (
                                        <div className="flex items-center justify-center p-2">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        </div>
                                    ) : filteredLeads.length > 0 ? (
                                        filteredLeads.map(lead => <SelectItem key={lead.id} value={String(lead.id)}>{lead.company_name}</SelectItem>)
                                    ) : (
                                        !isFetchingLeads && <div className="p-2 text-center text-sm text-muted-foreground">No leads found.</div>
                                    )}
                                </ScrollArea>
                            </SelectContent>
                        </Select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Activity Type *</Label>
                            <Select value={formData.activityType} onValueChange={(value) => setFormData({ ...formData, activityType: value })}>
                                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                <SelectContent>{activityTypeOptions.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                            </Select>
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
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="remind-datetime">Date & Time *</Label>
                        <Input
                            id="remind-datetime"
                            type="datetime-local"
                            value={formData.remindDateTime}
                            onChange={(e) => setFormData({...formData, remindDateTime: e.target.value})}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="details-schedule">Reminder Details *</Label>
                        <div className="relative">
                            {/* --- START OF FIX: Added max-h-24 class to make the Textarea scrollable --- */}
                            <Textarea
                                id="details-schedule"
                                placeholder="e.g., Follow up on the proposal. Or click the mic to speak."
                                rows={4}
                                required
                                value={formData.details}
                                onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                                className="resize-y break-all pr-10 max-h-24"
                            />
                            {/* --- END OF FIX --- */}
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
                        <Button type="submit" disabled={isLoading || isFetchingData}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Schedule Reminder
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}