"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ApiUnifiedActivity } from "@/lib/api";
import { formatDateTime } from "@/lib/date-format";
import { Phone, Mail, MessageSquare, CheckCircle, Clock } from "lucide-react";

interface ActivityDetailModalProps {
    activity: ApiUnifiedActivity | null;
    isOpen: boolean;
    onClose: () => void;
}

const activityTypeIcons = {
    Call: Phone,
    Email: Mail,
    WhatsApp: MessageSquare,
    'Follow-up': Phone,
    default: CheckCircle
};

export function ActivityDetailModal({ activity, isOpen, onClose }: ActivityDetailModalProps) {
    if (!activity) return null;

    const Icon = activityTypeIcons[activity.activity_type as keyof typeof activityTypeIcons] || activityTypeIcons.default;
    const isScheduled = activity.type === 'reminder';

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Icon className="h-5 w-5 text-primary" />
                        Activity Details for {activity.company_name}
                    </DialogTitle>
                    <DialogDescription>
                        {isScheduled ? "Details of the scheduled activity." : "Details of the logged activity."}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4 text-sm">
                    <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                        <span className="text-muted-foreground">Status</span>
                        <Badge variant={activity.status === 'pending' ? 'secondary' : 'default'} className="capitalize w-fit">
                            {activity.status.replace(/_/g, ' ')}
                        </Badge>
                    </div>
                    <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                        <span className="text-muted-foreground">Activity Type</span>
                        <span>{activity.activity_type}</span>
                    </div>

                    {isScheduled && activity.scheduled_for && (
                         <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                            <span className="text-muted-foreground">Scheduled For</span>
                            <span>{formatDateTime(activity.scheduled_for)}</span>
                        </div>
                    )}
                     <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                        <span className="text-muted-foreground">Created On</span>
                        <span>{formatDateTime(activity.created_at)}</span>
                    </div>
                    
                    <div className="grid grid-cols-[100px_1fr] items-start gap-4">
                         <span className="text-muted-foreground">Details</span>
                         <p className="resize-y break-all">{activity.details}</p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}