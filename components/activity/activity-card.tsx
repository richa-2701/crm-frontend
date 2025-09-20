// activity-card.tsx
"use client"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ApiUnifiedActivity } from "@/lib/api";
// --- THIS IS THE CRITICAL IMPORT ---
// We must use formatDateTime for both scheduled and logged activities to ensure correct timezone conversion.
import { formatDateTime } from "@/lib/date-format"; 
import { Clock, CheckCircle, Phone, Mail, MessageSquare, Eye, LucideIcon, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ActivityCardProps {
    activity: ApiUnifiedActivity;
    onMarkAsDone: (activity: ApiUnifiedActivity) => void;
    onViewDetails: (activity: ApiUnifiedActivity) => void;
    onViewPastActivities: (leadId: number, leadName: string) => void;
    onEdit: (activity: ApiUnifiedActivity) => void;
    onCancel: (activity: ApiUnifiedActivity) => void;
}

const activityTypeIcons: { [key: string]: LucideIcon } = {
    Call: Phone,
    Email: Mail,
    WhatsApp: MessageSquare,
    'Follow-up': Phone,
    default: CheckCircle
};

const statusVariantMap: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
    pending: "secondary",
    sent: "secondary",
    completed: "default",
    new: "default",
    qualified: "secondary",
    unqualified: "destructive",
    Canceled: "destructive",
    not_our_segment: "destructive",
    "Meeting Done": "outline",
    "Demo Done": "outline",
    "Discussion Done": "outline",
};

export function ActivityCard({ activity, onMarkAsDone, onViewDetails, onViewPastActivities, onEdit, onCancel }: ActivityCardProps) {
    const isActionableReminder = activity.type === 'reminder' && activity.status !== 'completed';
    const Icon = activityTypeIcons[activity.activity_type as keyof typeof activityTypeIcons] || activityTypeIcons.default;

    return (
        <Card className="flex flex-col justify-between min-h-[220px] shadow-sm hover:shadow-lg transition-shadow duration-200 border rounded-lg overflow-hidden">
            <div className="flex-grow">
                <CardHeader className="p-4">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-shrink-0 bg-primary/10 text-primary p-2.5 rounded-full">
                            <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-grow min-w-0">
                            <CardTitle
                                className="text-base font-semibold truncate cursor-pointer hover:underline"
                                onClick={() => onViewDetails(activity)}
                                title={activity.company_name}
                            >
                                {activity.company_name}
                            </CardTitle>
                            <CardDescription className="text-xs capitalize">
                                {activity.activity_type}
                            </CardDescription>
                        </div>
                        <div className="flex-shrink-0">
                             <Badge variant={statusVariantMap[activity.status] || "default"} className="capitalize text-xs font-medium">
                                {activity.status.replace(/_/g, ' ')}
                            </Badge>
                        </div>
                    </div>
                </CardHeader>

                <CardContent
                    className="px-4 pb-4 cursor-pointer"
                    onClick={() => onViewDetails(activity)}
                >
                    <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                        {activity.details}
                    </p>
                </CardContent>
            </div>

            <CardFooter className="flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50 py-2.5 px-4 border-t">
                {/* --- THIS IS THE DEFINITIVE FIX --- */}
                {/* This logic now correctly chooses which date to display and then formats it */}
                {/* using the function that handles UTC-to-local conversion. */}
                <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                    {(() => {
                        const isReminder = activity.type === 'reminder' && activity.scheduled_for;
                        const dateToFormat = isReminder ? activity.scheduled_for : activity.created_at;
                        const IconToUse = isReminder ? Clock : CheckCircle;

                        return (
                            <>
                                <IconToUse className="h-3.5 w-3.5" />
                                <span>{formatDateTime(dateToFormat)}</span>
                            </>
                        );
                    })()}
                </div>
                {/* --- END FIX --- */}

                <div className="flex items-center gap-1">
                    {isActionableReminder ? (
                        <Button size="sm" onClick={() => onMarkAsDone(activity)} className="h-8 text-xs px-3">
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Mark as Done
                        </Button>
                    ) : (
                         <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => onViewPastActivities(activity.lead_id, activity.company_name)}
                            aria-label="View past activities"
                        >
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View History</span>
                        </Button>
                    )}
                    
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">More actions</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {activity.type === 'log' && (
                                <DropdownMenuItem onClick={() => onEdit(activity)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    <span>Edit</span>
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => onCancel(activity)} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>{activity.type === 'reminder' ? 'Cancel' : 'Delete'}</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardFooter>
        </Card>
    );
}