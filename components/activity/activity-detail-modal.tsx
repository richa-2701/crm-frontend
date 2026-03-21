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
import { Phone, Mail, MessageSquare, CheckCircle, Download, FileText, Timer, CalendarCheck } from "lucide-react";
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
const resolveAttachmentUrl = (path: string) => path.startsWith("https://") ? path : `${API_URL}${path}`;

export function ActivityDetailModal({ activity, isOpen, onClose }: ActivityDetailModalProps) {
    if (!activity) return null;

    const Icon = activityTypeIcons[activity.activity_type] || activityTypeIcons.default;
    const isCompleted = !!activity.outcome; // combined completed-reminder log
    const isScheduled = !isCompleted && activity.logged_or_scheduled === 'Scheduled';
    const attachmentPath = (activity.raw_activity as any).attachment_path;

    const statusBadgeVariant = ['pending', 'scheduled', 'overdue'].includes(activity.status.toLowerCase()) ? 'secondary' : 'default';

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {isCompleted ? <CalendarCheck className="h-5 w-5 text-primary" /> : <Icon className="h-5 w-5 text-primary" />}
                        Activity Details for {activity.company_name}
                    </DialogTitle>
                    <DialogDescription>
                        {isCompleted ? "Details of the logged activity." : isScheduled ? "Details of the scheduled activity." : "Details of the logged activity."}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-[130px_1fr] gap-y-4 py-4 text-sm pr-2">
                    <span className="font-semibold text-right pr-4">Status</span>
                    <Badge variant={statusBadgeVariant} className="capitalize w-fit">
                        {isCompleted ? 'Completed' : activity.status.replace(/_/g, ' ')}
                    </Badge>

                    <span className="font-semibold text-right pr-4">Activity Type</span>
                    <span>{activity.activity_type}</span>

                    {/* Scheduled For */}
                    <span className="font-semibold text-right pr-4">Scheduled For</span>
                    <span>{formatDateTime(isCompleted ? activity.scheduled_for! : activity.date)}</span>

                    {/* Created On */}
                    <span className="font-semibold text-right pr-4">Created On</span>
                    <span>{formatDateTime(activity.creation_date)}</span>

                    {/* Created By */}
                    {(isCompleted ? activity.scheduled_by : (activity.raw_activity as any).created_by || (activity.raw_activity as any).assigned_to) && (
                        <>
                            <span className="font-semibold text-right pr-4">Created By</span>
                            <span>{isCompleted ? activity.scheduled_by : ((activity.raw_activity as any).created_by || (activity.raw_activity as any).assigned_to)}</span>
                        </>
                    )}

                    {/* Completed On — only for completed reminder logs */}
                    {isCompleted && activity.completed_on && (
                        <>
                            <span className="font-semibold text-right pr-4">Completed On</span>
                            <span>{formatDateTime(activity.completed_on)}</span>
                        </>
                    )}

                    {/* Duration */}
                    {activity.duration_minutes && activity.duration_minutes > 0 && (
                        <>
                            <span className="font-semibold text-right pr-4 flex items-center justify-end gap-1">
                                <Timer className="h-4 w-4 text-muted-foreground" />
                                Time Taken
                            </span>
                            <span>{activity.duration_minutes} min</span>
                        </>
                    )}

                    {/* Details — original task message */}
                    <span className="font-semibold text-right pr-4 self-start">Details</span>
                    <div className="bg-muted/50 p-2 rounded-md max-h-32 overflow-y-auto">
                        <p className="whitespace-pre-wrap break-words">
                            {isCompleted ? activity.original_details : activity.details}
                        </p>
                    </div>

                    {/* Outcome — only for completed reminder logs */}
                    {isCompleted && (
                        <>
                            <span className="font-semibold text-right pr-4 self-start">Outcome</span>
                            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-2 rounded-md max-h-32 overflow-y-auto">
                                <p className="whitespace-pre-wrap break-words text-green-900 dark:text-green-100">
                                    {activity.outcome}
                                </p>
                            </div>
                        </>
                    )}

                    {/* Attachment */}
                    {attachmentPath && (
                        <>
                            <span className="font-semibold text-right pr-4 self-start">Attachment</span>
                            <div className="col-span-1 space-y-2">
                                {isBrowserPreviewable(attachmentPath) ? (
                                    <iframe src={resolveAttachmentUrl(attachmentPath)} title="Attachment Preview" className="w-full h-48 rounded-md border bg-white" />
                                ) : (
                                    <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50 border">
                                        <FileText className="h-5 w-5 flex-shrink-0" />
                                        <span className="text-sm truncate">{attachmentPath.split('/').pop()}</span>
                                    </div>
                                )}
                                <Button asChild variant="secondary" size="sm">
                                    <a href={resolveAttachmentUrl(attachmentPath)} target="_blank" rel="noopener noreferrer" download>
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