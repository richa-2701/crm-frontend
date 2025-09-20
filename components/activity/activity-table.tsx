// activity-table.tssx
"use client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ApiUnifiedActivity } from "@/lib/api";
import { formatDateTime } from "@/lib/date-format"; // Only one formatter is needed
import { Phone, Mail, MessageSquare, CheckCircle, LucideIcon, Eye, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ActivityTableProps {
    activities: ApiUnifiedActivity[];
    onMarkAsDone: (activity: ApiUnifiedActivity) => void;
    onViewDetails: (activity: ApiUnifiedActivity) => void;
    onViewPastActivities: (leadId: number, leadName: string) => void;
    onEdit: (activity: ApiUnifiedActivity) => void;
    onCancel: (activity: ApiUnifiedActivity) => void;
}

const statusVariantMap: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
    pending: "secondary",
    sent: "secondary",
    completed: "default",
    new: "default",
    qualified: "secondary",
    unqualified: "destructive",
    not_our_segment: "destructive",
    "Meeting Done": "outline",
    "Demo Done": "outline",
    "Discussion Done": "outline",
};

const activityTypeIcons: { [key: string]: LucideIcon } = {
    Call: Phone,
    Email: Mail,
    WhatsApp: MessageSquare,
    'Follow-up': Phone,
};

const ActivityTypeIcon = ({ type }: { type: string }) => {
    const Icon = activityTypeIcons[type] || CheckCircle;
    return <Icon className="h-4 w-4" />;
};

export function ActivityTable({ activities, onMarkAsDone, onViewDetails, onViewPastActivities, onEdit, onCancel }: ActivityTableProps) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Lead</TableHead>
                    <TableHead>Activity Type</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Logged/Scheduled</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {activities.map((activity) => {
                    const isActionableReminder = activity.type === 'reminder' && activity.status !== 'completed';

                    return (
                        <TableRow
                            key={`${activity.type}-${activity.id}`}
                            onDoubleClick={() => onViewDetails(activity)}
                            className="cursor-pointer hover:bg-muted/50"
                        >
                            <TableCell className="font-medium">{activity.company_name}</TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <ActivityTypeIcon type={activity.activity_type} />
                                    <span>{activity.activity_type}</span>
                                </div>
                            </TableCell>
                            <TableCell className="max-w-[300px] truncate">{activity.details}</TableCell>
                            <TableCell>
                                <Badge variant={activity.type === 'reminder' ? "outline" : "secondary"}>
                                    {activity.type === 'reminder' ? 'Scheduled' : 'Logged'}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <Badge variant={statusVariantMap[activity.status] || "default"} className="capitalize">
                                    {activity.status.replace(/_/g, ' ')}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                {/* --- THIS IS THE FIX --- */}
                                {/* Consistently use formatDateTime for both types to ensure correct local time conversion */}
                                {activity.type === 'reminder' && activity.scheduled_for
                                    ? formatDateTime(activity.scheduled_for)
                                    : formatDateTime(activity.created_at)}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                    {isActionableReminder && (
                                        <Button
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onMarkAsDone(activity);
                                            }}
                                        >
                                            Mark as Done
                                        </Button>
                                    )}

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={(e) => e.stopPropagation()}
                                                className="h-8 w-8"
                                            >
                                                <MoreHorizontal className="h-4 w-4" />
                                                <span className="sr-only">More actions</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                            <DropdownMenuItem onClick={() => onViewPastActivities(activity.lead_id, activity.company_name)}>
                                                <Eye className="mr-2 h-4 w-4" />
                                                <span>View History</span>
                                            </DropdownMenuItem>
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
                            </TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
}