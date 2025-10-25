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
import { api, ApiLead, ApiUser } from "@/lib/api"
// --- FIX: Import a debounce utility. If you don't have one, you can use lodash or create a simple one. ---
import { debounce } from "lodash"; // Example using lodash. `npm install lodash @types/lodash` if not already installed.


interface ModalProps {
  currentUser: ApiUser;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function LogActivityModal({ currentUser, isOpen, onClose, onSuccess }: ModalProps) {
    const { toast } = useToast();
    const [leads, setLeads] = useState<ApiLead[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingLeads, setIsFetchingLeads] = useState(false); // State for lead search
    const [formData, setFormData] = useState({ leadId: "", details: "", activityType: "" });
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

    // --- OPTIMIZATION: Fetch activity types on mount, not leads. ---
    useEffect(() => {
        if (isOpen) {
            setFormData({ leadId: "", details: "", activityType: "" });
            setOtherActivityType("");
            resetTranscript();
            setLeads([]); // Clear previous lead list
            
            api.getByCategory("activity_type")
                .then((activityTypesData) => {
                    const types = activityTypesData.map(item => item.value);
                    setActivityTypeOptions([...types, "Other"]);
                    if (types.length > 0) {
                        setFormData(prev => ({ ...prev, activityType: types[0] }));
                    }
                }).catch(() => toast({ title: "Error", description: "Failed to fetch activity types." }));
        }
    }, [isOpen, toast, resetTranscript]);

    // --- OPTIMIZATION: Debounced function to search leads ---
    const searchLeads = useCallback(
        debounce(async (searchTerm: string) => {
            if (searchTerm.length < 2) {
                setLeads([]);
                return;
            }
            setIsFetchingLeads(true);
            try {
                // Assuming your backend can filter leads by name. If not, this still fetches all,
                // but the debounce prevents it from happening on every keystroke.
                // A better backend would be `api.searchLeads({ company_name: searchTerm })`
                const allLeads = await api.getAllLeads();
                const filteredLeads = allLeads.filter(lead => 
                    lead.company_name.toLowerCase().includes(searchTerm.toLowerCase())
                );
                setLeads(filteredLeads);
            } catch (error) {
                toast({ title: "Error", description: "Could not search for leads." });
            } finally {
                setIsFetchingLeads(false);
            }
        }, 300), // 300ms delay after user stops typing
        [toast]
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

        try {
            let attachmentPath: string | null = null;
            if (selectedFile) {
                const uploadResponse = await api.uploadActivityAttachment(selectedFile);
                // --- START OF FIX: Check for 'file_path' (snake_case) instead of 'filePath' (camelCase) ---
                if (uploadResponse && uploadResponse.file_path) {
                    attachmentPath = uploadResponse.file_path;
                } else {
                    throw new Error("File upload failed to return a path.");
                }
                // --- END OF FIX ---
            }
            
            const payload = {
                lead_id: Number(formData.leadId),
                details: formData.details,
                phase: "Activity Logged",
                activity_type: finalActivityType,
                attachment_path: attachmentPath,
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
                    <div >
                        <div className="space-y-2">
                            <Label>Lead Name *</Label>
                            {/* --- OPTIMIZATION: Changed to a searchable Select component --- */}
                            <Select
                                required
                                value={formData.leadId}
                                onValueChange={(value) => setFormData({ ...formData, leadId: value })}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Type to search for a lead..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <div className="p-2">
                                        <Input
                                            placeholder="Search by company name..."
                                            onChange={(e) => searchLeads(e.target.value)}
                                            autoFocus
                                        />
                                    </div>
                                    {isFetchingLeads && (
                                        <div className="flex items-center justify-center p-2">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        </div>
                                    )}
                                    {leads.length > 0 ? (
                                        leads.map(lead => <SelectItem key={lead.id} value={String(lead.id)}>{lead.company_name}</SelectItem>)
                                    ) : (
                                        !isFetchingLeads && <div className="p-2 text-center text-sm text-muted-foreground">No leads found.</div>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Activity Type *</Label>
                            <Select value={formData.activityType} onValueChange={(value) => setFormData({ ...formData, activityType: value })}>
                                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {activityTypeOptions.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
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