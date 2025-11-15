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
import { Phone, Mail, MessageSquare, CheckCircle, Download, FileText, Timer } from "lucide-react";
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

const isBrowserPreviewable = (filePath: string) => {
    const extension = filePath.split('.').pop()?.toLowerCase() || '';
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'pdf', 'txt'].includes(extension);
};

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, "") || "http://localhost:57214";

export function ActivityDetailModal({ activity, isOpen, onClose }: ActivityDetailModalProps) {
    if (!activity) return null;

    const Icon = activityTypeIcons[activity.activity_type] || activityTypeIcons.default;
    const isScheduled = activity.logged_or_scheduled === 'Scheduled';
    const attachmentPath = (activity.raw_activity as any).attachment_path;

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
                {/* --- START OF FIX: Removed max-h and overflow classes from the main grid container --- */}
                <div className="grid grid-cols-[120px_1fr] gap-y-4 py-4 text-sm pr-4">
                {/* --- END OF FIX --- */}
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
                    
                    {activity.type === 'log' && activity.duration_minutes && activity.duration_minutes > 0 && (
                         <>
                            <span className="font-semibold text-right pr-4 flex items-center justify-end gap-2">
                                <Timer className="h-4 w-4 text-muted-foreground" />
                                Time Taken
                            </span>
                            <span>{activity.duration_minutes} minutes</span>
                        </>
                    )}
                    
                    <span className="font-semibold text-right pr-4 self-start">Details</span>
                    {/* --- START OF FIX: Wrapped the details <p> in a scrollable div --- */}
                    <div className="bg-muted/50 p-2 rounded-md col-span-1 max-h-48 overflow-y-auto">
                         <p className="whitespace-pre-wrap break-words">
                            {activity.details}
                        </p>
                    </div>
                    {/* --- END OF FIX --- */}
                    
                    {attachmentPath && (
                        <>
                            <span className="font-semibold text-right pr-4 self-start">Attachment</span>
                            <div className="col-span-1 space-y-2">
                                {isBrowserPreviewable(attachmentPath) ? (
                                    <iframe
                                        src={`${API_URL}${attachmentPath}`}
                                        title="Attachment Preview"
                                        className="w-full h-48 rounded-md border bg-white"
                                    />
                                ) : (
                                    <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50 border">
                                        <FileText className="h-5 w-5 flex-shrink-0" />
                                        <span className="text-sm truncate">{attachmentPath.split('/').pop()}</span>
                                    </div>
                                )}
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