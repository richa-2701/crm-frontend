// activity-card.tsx
"use client"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/date-format"; 
// --- START OF CHANGE: Import Timer icon ---
import { Clock, CheckCircle, Phone, Mail, MessageSquare, Eye, LucideIcon, MoreHorizontal, Edit, Trash2, Timer } from "lucide-react";
// --- END OF CHANGE ---
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { UnifiedActivity } from "@/app/dashboard/activity/page";

interface ActivityCardProps {
    activity: UnifiedActivity;
    onMarkAsDone: (activity: UnifiedActivity) => void;
    onViewDetails: (activity: UnifiedActivity) => void;
    onViewPastActivities: (leadId: number, leadName: string) => void;
    onEdit: (activity: UnifiedActivity) => void;
    onCancel: (activity: UnifiedActivity) => void;
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
    Overdue: "destructive",
    "Meeting Done": "outline",
    "Demo Done": "outline",
    "Discussion Done": "outline",
};

export function ActivityCard({ activity, onMarkAsDone, onViewDetails, onViewPastActivities, onEdit, onCancel }: ActivityCardProps) {
    const isActionable = activity.isActionable;
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
                {/* --- START OF FIX: Updated footer to include duration --- */}
                <div className="text-xs text-muted-foreground flex items-center flex-wrap gap-x-3 gap-y-1">
                    <div className="flex items-center gap-1.5">
                        {activity.logged_or_scheduled === 'Scheduled' ? (
                            <Clock className="h-3.5 w-3.5" />
                        ) : (
                            <CheckCircle className="h-3.5 w-3.5" />
                        )}
                        <span>{formatDateTime(activity.date)}</span>
                    </div>

                    {activity.duration_minutes && activity.duration_minutes > 0 && (
                        <div className="flex items-center gap-1.5">
                            <Timer className="h-3.5 w-3.5" />
                            <span>{activity.duration_minutes} min</span>
                        </div>
                    )}
                </div>
                {/* --- END OF FIX --- */}

                <div className="flex items-center gap-1">
                    {isActionable ? (
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
                                <span>{activity.logged_or_scheduled === 'Scheduled' ? 'Cancel' : 'Delete'}</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardFooter>
        </Card>
    );
} 