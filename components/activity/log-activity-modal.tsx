//frontend/components/activity/log-activity-modal.tsx 
"use client"
import { useState, useEffect, useCallback } from "react"
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Mic, MicOff, Paperclip, XCircle } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area";
import { api, ApiUser, ApiLeadSearchResult } from "@/lib/api"
import { debounce } from "lodash";

interface ModalProps {
  currentUser: ApiUser;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function LogActivityModal({ currentUser, isOpen, onClose, onSuccess }: ModalProps) {
    const { toast } = useToast();
    const [allLeads, setAllLeads] = useState<ApiLeadSearchResult[]>([]);
    const [filteredLeads, setFilteredLeads] = useState<ApiLeadSearchResult[]>([]);
    const [hasFetchedInitialLeads, setHasFetchedInitialLeads] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingData, setIsFetchingData] = useState(false);
    const [isFetchingLeads, setIsFetchingLeads] = useState(false);
    const [formData, setFormData] = useState({ leadId: "", details: "", activityType: "", duration_minutes: "" });
    const [otherActivityType, setOtherActivityType] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
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
            setFormData({ leadId: "", details: "", activityType: "", duration_minutes: "" });
            setOtherActivityType("");
            setSelectedFile(null);
            resetTranscript();
            setFilteredLeads([]);
            setHasFetchedInitialLeads(false);
            
            const fetchData = async () => {
                setIsFetchingData(true);
                try {
                    const activityTypesData = await api.getByCategory("activity_type");
                    const types = activityTypesData.map(item => item.value);
                    setActivityTypeOptions([...types, "Other"]);
                    if (types.length > 0) {
                        setFormData(prev => ({ ...prev, activityType: types[0] }));
                    }
                } catch (error) {
                    toast({ title: "Error", description: "Failed to fetch activity types." });
                } finally {
                    setIsFetchingData(false);
                }
            };
            fetchData();
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
        if (!formData.leadId || !formData.details.trim() || !formData.duration_minutes) {
            toast({ title: "Error", description: "Please complete all required fields, including duration.", variant: "destructive" });
            return;
        }
        setIsLoading(true);

        const finalActivityType = formData.activityType === 'Other' ? otherActivityType.trim() : formData.activityType;
        if (!finalActivityType) {
            toast({ title: "Error", description: "Please specify the activity type.", variant: "destructive" });
            setIsLoading(false);
            return;
        }

        const duration = Number.parseInt(formData.duration_minutes, 10);
        if (isNaN(duration) || duration <= 0) {
            toast({ title: "Error", description: "Please enter a valid, positive number for the duration.", variant: "destructive" });
            setIsLoading(false);
            return;
        }

        try {
            let attachmentPath: string | null = null;
            if (selectedFile) {
                const uploadResponse = await api.uploadActivityAttachment(selectedFile);
                if (uploadResponse && uploadResponse.file_path) {
                    attachmentPath = uploadResponse.file_path;
                } else {
                    throw new Error("File upload failed to return a path.");
                }
            }
            
            // --- START OF FIX: Add created_by to the payload ---
            const payload = {
                lead_id: Number(formData.leadId),
                details: formData.details,
                phase: "Activity Logged",
                activity_type: finalActivityType,
                created_by: currentUser.username, // This line sends the logged-in user's name
                attachment_path: attachmentPath,
                duration_minutes: duration,
            };
            // --- END OF FIX ---

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
            setTextBeforeListening(formData.details);
            resetTranscript();
            SpeechRecognition.startListening({ continuous: true });
        }
    };
    
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedFile(file);
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
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Lead Name *</Label>
                            <Select
                                required
                                value={formData.leadId}
                                onValueChange={(value) => setFormData({ ...formData, leadId: value })}
                                onOpenChange={handleLeadDropdownOpen}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select or search for a lead..." />
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
                                            <div className="flex items-center justify-center p-2"><Loader2 className="h-4 w-4 animate-spin" /></div>
                                        ) : filteredLeads.length > 0 ? (
                                            filteredLeads.map(lead => <SelectItem key={lead.id} value={String(lead.id)}>{lead.company_name}</SelectItem>)
                                        ) : (
                                            <div className="p-2 text-center text-sm text-muted-foreground">No leads found.</div>
                                        )}
                                    </ScrollArea>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Label>Activity Type *</Label>
                                <Select value={formData.activityType} onValueChange={(value) => setFormData({ ...formData, activityType: value })}>
                                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {activityTypeOptions.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="duration_minutes">Time Taken (minutes) *</Label>
                                <Input
                                    id="duration_minutes"
                                    type="number"
                                    placeholder="e.g., 30"
                                    value={formData.duration_minutes}
                                    onChange={(e) => setFormData(prev => ({...prev, duration_minutes: e.target.value }))}
                                    required
                                    min="1"
                                />
                            </div>
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
                                placeholder="e.g., Called the client... Or click the mic to speak."
                                rows={4}
                                required
                                value={formData.details}
                                onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                                className="resize-y max-h-24 pr-10"
                            />
                            {browserSupportsSpeechRecognition && (
                                <Button type="button" variant="ghost" size="icon" onClick={handleMicClick} className="absolute bottom-2 right-2 h-7 w-7">
                                    {listening ? <MicOff className="h-4 w-4 text-red-500" /> : <Mic className="h-4 w-4" />}
                                    <span className="sr-only">Toggle microphone</span>
                                </Button>
                            )}
                        </div>
                         {listening && <p className="text-xs text-muted-foreground animate-pulse mt-1">Listening...</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="attachment">Attachment (Optional)</Label>
                        {!selectedFile ? (
                            <div className="relative flex items-center">
                                <Paperclip className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="attachment"
                                    type="file"
                                    onChange={handleFileChange}
                                    className="pl-9 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                                />
                            </div>
                        ) : (
                            <div className="flex items-center justify-between p-2 border rounded-md bg-muted/50">
                                <span className="text-sm font-medium truncate">{selectedFile.name}</span>
                                <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedFile(null)}>
                                    <XCircle className="h-4 w-4 text-muted-foreground" />
                                </Button>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={isLoading || isFetchingData}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Log Activity
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}