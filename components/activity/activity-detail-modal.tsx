//frontend/components/activity/activity-detail-modal.tsx
"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/date-format";
import { Phone, Mail, MessageSquare, CheckCircle, Download, FileText } from "lucide-react";
// --- FIX: Import the UnifiedActivity interface from the page component ---
import type { UnifiedActivity } from "@/app/dashboard/activity/page"; 

interface ActivityDetailModalProps {
    activity: UnifiedActivity | null;
    isOpen: boolean;
    onClose: () => void;
}

const activityTypeIcons: { [key: string]: React.ElementType } = {
    Call: Phone,
    Email: Mail,
    WhatsApp: MessageSquare,
    'Follow-up': Phone,
    default: CheckCircle
};

// --- START OF FIX: Use a more comprehensive check for files the browser can preview in an iframe ---
const isBrowserPreviewable = (filePath: string) => {
    const extension = filePath.split('.').pop()?.toLowerCase() || '';
    // This list includes common image formats, PDFs, and text files that are safe to embed.
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'pdf', 'txt'].includes(extension);
};
// --- END OF FIX ---

// You might need your API's base URL if it's different from the frontend URL
const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, "") || "http://localhost:57214";

export function ActivityDetailModal({ activity, isOpen, onClose }: ActivityDetailModalProps) {
    if (!activity) return null;

    const Icon = activityTypeIcons[activity.activity_type] || activityTypeIcons.default;
    const isScheduled = activity.logged_or_scheduled === 'Scheduled';
    const attachmentPath = activity.raw_activity.attachment_path;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Icon className="h-5 w-5 text-primary" />
                        Activity Details for {activity.company_name}
                    </DialogTitle>
                    <DialogDescription>
                        {isScheduled ? "Details of the scheduled activity." : "Details of the logged activity."}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-[120px_1fr] gap-y-4 py-4 text-sm max-h-[60vh] overflow-y-auto pr-4">
                    <span className="font-semibold text-right pr-4">Status</span>
                    <Badge variant={activity.status.toLowerCase() === 'pending' || activity.status.toLowerCase() === 'scheduled' ? 'secondary' : 'default'} className="capitalize w-fit">
                        {activity.status.replace(/_/g, ' ')}
                    </Badge>
                    
                    <span className="font-semibold text-right pr-4">Activity Type</span>
                    <span>{activity.activity_type}</span>

                    <span className="font-semibold text-right pr-4">
                        {isScheduled ? "Scheduled For" : "Logged On"}
                    </span>
                    <span>{formatDateTime(activity.date)}</span>
                    
                    {isScheduled && activity.raw_activity.created_at && (
                        <>
                            <span className="font-semibold text-right pr-4">Created On</span>
                            <span>{formatDateTime(activity.raw_activity.created_at)}</span>
                        </>
                    )}
                    
                    <span className="font-semibold text-right pr-4 self-start">Details</span>
                    <p className="bg-muted/50 p-2 rounded-md col-span-1">{activity.details}</p>
                    
                    {attachmentPath && (
                        <>
                            <span className="font-semibold text-right pr-4 self-start">Attachment</span>
                            <div className="col-span-1 space-y-2">
                                {/* --- START OF FIX: Render previewable files in an iframe --- */}
                                {isBrowserPreviewable(attachmentPath) ? (
                                    <iframe
                                        src={`${API_URL}${attachmentPath}`}
                                        title="Attachment Preview"
                                        className="w-full h-48 rounded-md border bg-white" // Added bg-white for better PDF viewing in dark mode
                                    />
                                ) : (
                                    // Fallback for non-previewable files (e.g., .docx, .xlsx)
                                    <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50 border">
                                        <FileText className="h-5 w-5 flex-shrink-0" />
                                        <span className="text-sm truncate">{attachmentPath.split('/').pop()}</span>
                                    </div>
                                )}
                                {/* --- END OF FIX --- */}
                                <Button asChild variant="secondary" size="sm">
                                    <a href={`${API_URL}${attachmentPath}`} download>
                                        <Download className="mr-2 h-4 w-4" />
                                        Download
                                    </a>
                                </Button>
                            </div>
                        </>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}