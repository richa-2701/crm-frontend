"use client"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ApiUnifiedActivity } from "@/lib/api";
import { formatDate, formatDateTime } from "@/lib/date-format";
// --- MODIFIED: Import new icons and dropdown components ---
import { Clock, CheckCircle, Phone, Mail, MessageSquare, Eye, LucideIcon, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// --- MODIFIED: The props interface is updated to accept new handlers ---
interface ActivityCardProps {
    activity: ApiUnifiedActivity;
    onMarkAsDone: (activity: ApiUnifiedActivity) => void;
    onViewDetails: (activity: ApiUnifiedActivity) => void;
    onViewPastActivities: (leadId: number, leadName: string) => void;
    onEdit: (activity: ApiUnifiedActivity) => void;
    onCancel: (activity: ApiUnifiedActivity) => void;
}

// These utility maps are kept as they are efficient and correct
const activityTypeIcons: { [key: string]: LucideIcon } = {
    Call: Phone,
    Email: Mail,
    WhatsApp: MessageSquare,
    'Follow-up': Phone,
    default: CheckCircle
};

const statusVariantMap: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
    pending: "secondary",
    completed: "default",
    sent: "default",
    new: "default",
    qualified: "secondary",
    unqualified: "destructive",
    Canceled: "destructive",
    not_our_segment: "destructive",
    "Meeting Done": "outline",
    "Demo Done": "outline",
    "Discussion Done": "outline",
};

// --- MODIFIED: The entire component is updated with the new structure ---
export function ActivityCard({ activity, onMarkAsDone, onViewDetails, onViewPastActivities, onEdit, onCancel }: ActivityCardProps) {
    const isPendingReminder = activity.type === 'reminder' && activity.status === 'pending';
    const Icon = activityTypeIcons[activity.activity_type as keyof typeof activityTypeIcons] || activityTypeIcons.default;

    return (
        <Card className="flex flex-col justify-between min-h-[220px] shadow-sm hover:shadow-lg transition-shadow duration-200 border rounded-lg overflow-hidden">
            {/* Main content section */}
            <div className="flex-grow">
                <CardHeader className="p-4">
                    <div className="flex items-start justify-between gap-3">
                        {/* Left side: Prominent Icon */}
                        <div className="flex-shrink-0 bg-primary/10 text-primary p-2.5 rounded-full">
                            <Icon className="h-5 w-5" />
                        </div>

                        {/* Middle: Title and Description */}
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

                        {/* Right side: Status Badge */}
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

            {/* Footer with consistent layout for actions and metadata */}
            <CardFooter className="flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50 py-2.5 px-4 border-t">
                {/* Left side: Date/Time Info */}
                <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                    {activity.type === 'reminder' && activity.scheduled_for ? (
                        <>
                            <Clock className="h-3.5 w-3.5" />
                            <span>{formatDateTime(activity.scheduled_for)}</span>
                        </>
                    ) : (
                        <>
                            <CheckCircle className="h-3.5 w-3.5" />
                            <span>{formatDate(activity.created_at)}</span>
                        </>
                    )}
                </div>

                {/* Right side: Action Buttons */}
                <div className="flex items-center gap-1">
                    {isPendingReminder ? (
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