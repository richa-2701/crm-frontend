//frontend/app/dashboard/activity/page.tsx
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { PastActivitiesModal } from "@/components/activity/past-activities-modal";
import { ApiUser, ApiActivity, ApiReminder, api, ApiMeeting, ApiDemo, ApiLead } from "@/lib/api";
import { Loader2, PlusCircle, CalendarPlus, LayoutGrid, List, Search, Filter, Eye, Phone, CheckCircle, MessageSquare } from "lucide-react";
import { ActivityCard } from "@/components/activity/activity-card";
import { ActivityTable } from "@/components/activity/activity-table";
import { MarkAsDoneModal } from "@/components/activity/mark-as-done-modal";
import { LogActivityModal } from "@/components/activity/log-activity-modal";
import { ScheduleActivityModal } from "@/components/activity/schedule-activity-modal";
import { ActivityDetailModal } from "@/components/activity/activity-detail-modal";
import { formatDateTime, parseAsUTCDate } from "@/lib/date-format";


export interface UnifiedActivity {
    id: string; 
    type: 'log' | 'reminder' | 'meeting' | 'demo';
    lead_id: number;
    company_name: string;
    activity_type: string;
    details: string;
    logged_or_scheduled: 'Logged' | 'Scheduled';
    status: string;
    date: string;
    creation_date: string;
    isActionable: boolean; 
    raw_activity: ApiActivity | ApiReminder | ApiMeeting | ApiDemo;
    duration_minutes?: number;
}

function EditActivityModal({
    isOpen,
    onClose,
    activity,
    onSuccess,
}: {
    isOpen: boolean;
    onClose: () => void;
    activity: UnifiedActivity | null;
    onSuccess: () => void;
}) {
    const [details, setDetails] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (activity) {
            setDetails(activity.details);
        }
    }, [activity]);

    const handleSubmit = async () => {
        if (!activity || !details.trim()) {
            toast({ title: "Error", description: "Details cannot be empty.", variant: "destructive" });
            return;
        }

        if (activity.type !== 'log') {
            toast({ title: "Action Not Supported", description: "Only logged activities can be edited." });
            return;
        }
        
        setIsLoading(true);
        try {
            await api.updateLoggedActivity((activity.raw_activity as ApiActivity).id, { details });
            toast({ title: "Success", description: "Activity has been updated." });
            onSuccess();
        } catch (error) {
            console.error("Failed to update activity:", error);
            const errorMessage = error instanceof Error ? error.message : "Could not update the activity.";
            toast({ title: "Error", description: errorMessage, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen || !activity) return null;

    const canBeEdited = activity.type === 'log';

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Activity</DialogTitle>
                    <DialogDescription>
                        {canBeEdited 
                            ? `Update the details for the activity with ${activity.company_name}.`
                            : `This activity type (${activity.type}) cannot be edited directly.`}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="activity-details">Activity Details</Label>
                        <Textarea 
                            id="activity-details" 
                            value={details} 
                            onChange={(e) => setDetails(e.target.value)} 
                            rows={5} 
                            placeholder="Enter the updated activity notes..."
                            disabled={!canBeEdited}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={isLoading || !canBeEdited}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function CancelActivityModal({
    isOpen,
    onClose,
    activity,
    onSuccess,
}: {
    isOpen: boolean;
    onClose: () => void;
    activity: UnifiedActivity | null;
    onSuccess: () => void;
}) {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const [reason, setReason] = useState("");

    if (!isOpen || !activity) return null;

    const isScheduled = activity.type === 'reminder' || activity.type === 'meeting' || activity.type === 'demo';
    const title = isScheduled ? "Cancel Scheduled Activity" : "Delete Logged Activity";
    const description = `Are you sure you want to ${isScheduled ? 'cancel this activity' : 'delete this activity log'} for ${activity.company_name}? This action cannot be undone.`;

    const handleConfirm = async () => {
        setIsLoading(true);
        try {
            if (activity.type === 'reminder' && typeof activity.raw_activity.id === 'number') {
                await api.cancelReminder(activity.raw_activity.id);
            } else if (activity.type === 'log' && typeof activity.raw_activity.id === 'number') {
                await api.deleteLoggedActivity(activity.raw_activity.id, reason || "No reason provided");
            } else {
                toast({ title: "Not Implemented", description: "Canceling this activity type is not yet supported." });
            }
            toast({ title: "Success", description: "Activity has been removed." });
            onSuccess();
        } catch (error) {
            console.error("Failed to remove activity:", error);
            const errorMessage = error instanceof Error ? error.message : "Could not remove the activity.";
            toast({ title: "Error", description: errorMessage, variant: "destructive" });
        } finally {
            setIsLoading(false);
            setReason("");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                {activity.type === 'log' && (
                    <div className="py-4">
                        <Label htmlFor="delete-reason">Reason for Deletion (Optional)</Label>
                        <Textarea id="delete-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g., Logged in error." />
                    </div>
                )}
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>No, keep it</Button>
                    <Button variant="destructive" onClick={handleConfirm} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Yes, {isScheduled ? 'Cancel It' : 'Delete It'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


export default function ActivityPage() {
    const [user, setUser] = useState<ApiUser | null>(null);
    const [allActivities, setAllActivities] = useState<UnifiedActivity[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activityToComplete, setActivityToComplete] = useState<ApiReminder | null>(null);
    const [isLogModalOpen, setLogModalOpen] = useState(false);
    const [activityToView, setActivityToView] = useState<UnifiedActivity | null>(null);
    const [isScheduleModalOpen, setScheduleModalOpen] = useState(false);
    const [isDoneModalOpen, setDoneModalOpen] = useState(false);
    const [isDetailModalOpen, setDetailModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'card'>('list'); 
    const [activeFilter, setActiveFilter] = useState<"all" | "today" | "scheduled" | "completed" | "overdue" | "canceled">('all');
    const [searchTerm, setSearchTerm] = useState("");
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const router = useRouter();
    const { toast } = useToast();
    const [isPastActivitiesModalOpen, setPastActivitiesModalOpen] = useState(false);
    const [selectedLeadForHistory, setSelectedLeadForHistory] = useState<{ id: number; name: string } | null>(null);
    const [activityToEdit, setActivityToEdit] = useState<UnifiedActivity | null>(null);
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [activityToCancel, setActivityToCancel] = useState<UnifiedActivity | null>(null);
    const [isCancelModalOpen, setCancelModalOpen] = useState(false);

    const fetchDataForUser = useCallback(async () => {
        setIsLoading(true);
        try {
            const [
                loggedActivitiesData,
                remindersData,
                leadsData,
            ] = await Promise.all([
                api.getAllActivities(),
                api.getAllReminders(),
                api.getAllLeads(),
            ]);

            const leadsMap = new Map(leadsData.map((l: ApiLead) => [l.id, l.company_name]));
            const now = new Date();
            const unifiedList: UnifiedActivity[] = [];

            (loggedActivitiesData || []).forEach((log: ApiActivity) => {
                // --- START OF FIX: Skip auto-generated activities ---
                if (log.activity_type === 'auto-schedule' || log.activity_type === 'auto-complete') {
                    return; // Do not add this activity to the list
                }
                // --- END OF FIX ---
                if (!log.created_at) return;
                unifiedList.push({
                    id: `log-${log.id}`,
                    type: 'log',
                    lead_id: log.lead_id,
                    company_name: log.company_name || leadsMap.get(log.lead_id) || 'Unknown Lead',
                    activity_type: log.activity_type,
                    details: log.details,
                    logged_or_scheduled: 'Logged',
                    status: log.phase || 'Activity Logged',
                    date: log.created_at,
                    creation_date: log.created_at,
                    isActionable: false,
                    raw_activity: log,
                    duration_minutes: log.duration_minutes,
                });
            });

            (remindersData || []).forEach((rem: ApiReminder) => {
                if (rem.is_hidden_from_activity_log) {
                    return; 
                }

                const scheduledDate = parseAsUTCDate(rem.remind_time);
                if (!scheduledDate || !rem.created_at) return;
                
                let displayStatus = rem.status;
                let isNowActionable = false;
                const statusLower = rem.status.toLowerCase();
                const pendingStatuses = ['pending', 'sent', 'failed'];

                if (pendingStatuses.includes(statusLower)) {
                    if (scheduledDate < now) {
                        displayStatus = 'Overdue';
                    } else {
                        displayStatus = 'Scheduled';
                    }
                }

                if (statusLower !== 'completed' && statusLower !== 'canceled') {
                    isNowActionable = true;
                }

                unifiedList.push({
                    id: `reminder-${rem.id}`,
                    type: 'reminder',
                    lead_id: rem.lead_id,
                    company_name: leadsMap.get(rem.lead_id) || 'Unknown Lead',
                    activity_type: rem.activity_type || 'Follow-up',
                    details: rem.message,
                    logged_or_scheduled: 'Scheduled',
                    status: displayStatus,
                    date: rem.remind_time,
                    creation_date: rem.created_at,
                    isActionable: isNowActionable,
                    raw_activity: rem,
                });
            });

            unifiedList.sort((a, b) => parseAsUTCDate(b.creation_date)!.getTime() - parseAsUTCDate(a.creation_date)!.getTime());

            setAllActivities(unifiedList);

        } catch (error) {
            console.error("Detailed Fetch Error:", error);
            const errorMessage = error instanceof Error ? error.message : "Could not retrieve activities.";
            toast({ title: "Error Fetching Data", description: errorMessage, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        const userDataString = localStorage.getItem("user");
        if (!userDataString) {
            router.push("/login");
            return;
        }
        const loggedInUser = JSON.parse(userDataString);
        setUser(loggedInUser);
        fetchDataForUser();
    }, [router, fetchDataForUser]);

    const filteredActivities = useMemo(() => {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        return allActivities
            .filter(act => {
                const primaryDate = parseAsUTCDate(act.date);
                if (!primaryDate) return false;
                const statusLower = act.status ? act.status.toLowerCase() : "";
                
                switch (activeFilter) {
                    case 'today':
                        return primaryDate.toDateString() === todayStart.toDateString();
                    case 'scheduled':
                        return act.logged_or_scheduled === 'Scheduled' && (statusLower === 'pending' || statusLower === 'scheduled');
                    case 'completed':
                        return statusLower.includes('completed') || statusLower.includes('done') || statusLower.includes('logged');
                    case 'canceled':
                        return statusLower === 'canceled';
                    case 'overdue':
                        return statusLower === 'overdue';
                    default: // 'all'
                        return true;
                }
            })
            .filter(act => {
                const search = searchTerm.toLowerCase();
                if (!search) return true;
                return (
                    act.company_name.toLowerCase().includes(search) ||
                    act.details.toLowerCase().includes(search)
                );
            });
    }, [allActivities, activeFilter, searchTerm]);

    const pageCount = Math.ceil(filteredActivities.length / pagination.pageSize);
    const paginatedActivities = filteredActivities.slice(
        pagination.pageIndex * pagination.pageSize,
        (pagination.pageIndex + 1) * pagination.pageSize
    );

    const handleMarkAsDoneClick = (activity: UnifiedActivity) => {
        if (activity.type === 'reminder') {
            setActivityToComplete(activity.raw_activity as ApiReminder);
            setDoneModalOpen(true);
        } else {
            toast({ title: "Action Not Applicable", description: "This type of activity cannot be marked as done from here." });
        }
    };

    const handleViewDetailsClick = (activity: UnifiedActivity) => {
        setActivityToView(activity);
        setDetailModalOpen(true);
    };

    const handleViewPastActivitiesClick = (leadId: number, leadName: string) => {
        setSelectedLeadForHistory({ id: leadId, name: leadName });
        setPastActivitiesModalOpen(true);
    };
    
    const handleEditClick = (activity: UnifiedActivity) => {
        if (activity.type !== 'log') {
            toast({
                title: "Action Not Available",
                description: "Only logged activities can be edited. Scheduled activities must be rescheduled or canceled.",
                variant: "default"
            });
            return;
        }
        setActivityToEdit(activity);
        setEditModalOpen(true);
    };

    const handleCancelClick = (activity: UnifiedActivity) => {
        setActivityToCancel(activity);
        setCancelModalOpen(true);
    };


    const handleSuccess = () => {
        setLogModalOpen(false);
        setScheduleModalOpen(false);
        setDoneModalOpen(false);
        setEditModalOpen(false);
        setCancelModalOpen(false);
        fetchDataForUser();
    };

    if (isLoading || !user) {
        return (
            <div className="space-y-4 md:space-y-6 px-3 sm:px-4 md:px-0">
                {/* Page header skeleton */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
                        <div className="h-8 w-48 bg-muted rounded animate-pulse"></div>
                        <div className="h-4 w-80 bg-muted rounded animate-pulse"></div>
                    </div>
                    <div className="flex gap-2">
                        <div className="h-9 w-32 bg-muted rounded animate-pulse"></div>
                        <div className="h-9 w-40 bg-muted rounded animate-pulse"></div>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex flex-col md:flex-row md:flex-wrap md:items-center md:justify-between gap-4">
                            {/* Search bar skeleton */}
                            <div className="h-9 flex-1 max-w-sm bg-muted rounded animate-pulse"></div>

                            {/* Desktop filters skeleton */}
                            <div className="hidden md:flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className="h-4 w-16 bg-muted rounded animate-pulse"></div>
                                    ))}
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-9 w-9 bg-muted rounded animate-pulse"></div>
                                    <div className="h-9 w-9 bg-muted rounded animate-pulse"></div>
                                </div>
                            </div>

                            {/* Mobile filter button skeleton */}
                            <div className="md:hidden flex justify-end">
                                <div className="h-9 w-24 bg-muted rounded animate-pulse"></div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {/* Card view skeleton */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="border rounded-lg p-4 space-y-3 bg-card">
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="flex-1 space-y-2">
                                            <div className="h-5 w-3/4 bg-muted rounded animate-pulse"></div>
                                            <div className="h-4 w-1/2 bg-muted rounded animate-pulse"></div>
                                        </div>
                                        <div className="h-6 w-20 bg-muted rounded animate-pulse"></div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="h-4 w-full bg-muted rounded animate-pulse"></div>
                                        <div className="h-4 w-5/6 bg-muted rounded animate-pulse"></div>
                                    </div>
                                    <div className="flex justify-between items-center pt-2">
                                        <div className="h-3 w-32 bg-muted rounded animate-pulse"></div>
                                        <div className="h-8 w-24 bg-muted rounded animate-pulse"></div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination skeleton */}
                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                            <div className="h-4 w-32 bg-muted rounded animate-pulse"></div>
                            <div className="flex gap-2">
                                <div className="h-9 w-24 bg-muted rounded animate-pulse"></div>
                                <div className="h-9 w-24 bg-muted rounded animate-pulse"></div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Activity Management</h1>
                        <p className="text-muted-foreground">Log, schedule, and complete activities with your leads.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setLogModalOpen(true)}><PlusCircle className="mr-2 h-4 w-4" />Log an Activity</Button>
                        <Button onClick={() => setScheduleModalOpen(true)}><CalendarPlus className="mr-2 h-4 w-4" />Schedule a Reminder</Button>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex flex-col md:flex-row md:flex-wrap md:items-center md:justify-between gap-4">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by company or details..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-8"
                                />
                            </div>

                            <div className="hidden md:flex flex-wrap items-center justify-between gap-4">
                                <RadioGroup value={activeFilter} onValueChange={(value) => setActiveFilter(value as any)} className="flex items-center gap-4">
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="all" id="all-desktop" /><Label htmlFor="all-desktop">All</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="today" id="today-desktop" /><Label htmlFor="today-desktop">Today</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="scheduled" id="scheduled-desktop" /><Label htmlFor="scheduled-desktop">Scheduled</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="completed" id="completed-desktop" /><Label htmlFor="completed-desktop">Completed</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="overdue" id="overdue-desktop" /><Label htmlFor="overdue-desktop">Overdue</Label></div>
                                </RadioGroup>
                                <div className="flex items-center gap-2">
                                    <Button variant={viewMode === 'card' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('card')}><LayoutGrid className="h-4 w-4" /></Button>
                                    <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('list')}><List className="h-4 w-4" /></Button>
                                </div>
                            </div>

                            <div className="md:hidden flex justify-end">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline"><Filter className="mr-2 h-4 w-4" /> Filters</Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-4" align="end">
                                        <div className="grid gap-4">
                                            <div className="space-y-2">
                                                <h4 className="font-medium leading-none">Status</h4>
                                                <RadioGroup value={activeFilter} onValueChange={(value) => setActiveFilter(value as any)} className="flex flex-col space-y-2">
                                                    <div className="flex items-center space-x-2"><RadioGroupItem value="all" id="all-mobile" /><Label htmlFor="all-mobile">All</Label></div>
                                                    <div className="flex items-center space-x-2"><RadioGroupItem value="today" id="today-mobile" /><Label htmlFor="today-mobile">Today</Label></div>
                                                    <div className="flex items-center space-x-2"><RadioGroupItem value="scheduled" id="scheduled-mobile" /><Label htmlFor="scheduled-mobile">Scheduled</Label></div>
                                                    <div className="flex items-center space-x-2"><RadioGroupItem value="completed" id="completed-mobile" /><Label htmlFor="completed-mobile">Completed</Label></div>
                                                    <div className="flex items-center space-x-2"><RadioGroupItem value="overdue" id="overdue-mobile" /><Label htmlFor="overdue-mobile">Overdue</Label></div>
                                                </RadioGroup>
                                            </div>
                                            <div className="space-y-2">
                                                <h4 className="font-medium leading-none">View</h4>
                                                <div className="flex items-center gap-2">
                                                    <Button className="flex-1" variant={viewMode === 'card' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('card')}><LayoutGrid className="mr-2 h-4 w-4" />Card</Button>
                                                    <Button className="flex-1" variant={viewMode === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('list')}><List className="mr-2 h-4 w-4" />List</Button>
                                                </div>
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
                        ) : filteredActivities.length === 0 ? (
                            <div className="text-center py-16 text-muted-foreground">No activities match your current filters.</div>
                        ) : viewMode === 'list' ? (
                            <div className="overflow-x-auto">
                                <ActivityTable
                                    activities={paginatedActivities}
                                    onMarkAsDone={handleMarkAsDoneClick}
                                    onViewDetails={handleViewDetailsClick}
                                    onViewPastActivities={handleViewPastActivitiesClick}
                                    onEdit={handleEditClick}
                                    onCancel={handleCancelClick}
                                />
                            </div>
                        ) : (
                            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {paginatedActivities.map(activity => (
                                    <ActivityCard
                                        key={activity.id}
                                        activity={activity}
                                        onMarkAsDone={handleMarkAsDoneClick}
                                        onViewDetails={handleViewDetailsClick}
                                        onViewPastActivities={handleViewPastActivitiesClick}
                                        onEdit={handleEditClick}
                                        onCancel={handleCancelClick}
                                    />
                                ))}
                            </div>
                        )}
                        {pageCount > 1 && (
                            <div className="flex items-center justify-between pt-6">
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="page-size" className="text-sm text-muted-foreground">Items per page</Label>
                                    <Select
                                        value={String(pagination.pageSize)}
                                        onValueChange={(value) => {
                                            setPagination({ pageIndex: 0, pageSize: Number(value) });
                                        }}
                                    >
                                        <SelectTrigger id="page-size" className="w-20 h-9">
                                            <SelectValue placeholder={pagination.pageSize} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {[10, 30, 100, 200].map(size => (
                                                <SelectItem key={size} value={String(size)}>{size}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="text-sm text-muted-foreground">Page {pagination.pageIndex + 1} of {pageCount}</div>
                                    <Button variant="outline" size="sm" onClick={() => setPagination(p => ({ ...p, pageIndex: p.pageIndex - 1 }))} disabled={pagination.pageIndex === 0}>Previous</Button>
                                    <Button variant="outline" size="sm" onClick={() => setPagination(p => ({ ...p, pageIndex: p.pageIndex + 1 }))} disabled={pagination.pageIndex >= pageCount - 1}>Next</Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {user && (
                <>
                    <LogActivityModal currentUser={user} isOpen={isLogModalOpen} onClose={() => setLogModalOpen(false)} onSuccess={handleSuccess} />
                    <ScheduleActivityModal currentUser={user} isOpen={isScheduleModalOpen} onClose={() => setScheduleModalOpen(false)} onSuccess={handleSuccess} />
                    <MarkAsDoneModal activity={activityToComplete} currentUser={user} isOpen={isDoneModalOpen} onClose={() => setDoneModalOpen(false)} onSuccess={handleSuccess} />
                    <ActivityDetailModal
                        activity={activityToView}
                        isOpen={isDetailModalOpen}
                        onClose={() => setDetailModalOpen(false)}
                    />
                    <PastActivitiesModal
                        isOpen={isPastActivitiesModalOpen}
                        onClose={() => setPastActivitiesModalOpen(false)}
                        leadId={selectedLeadForHistory?.id ?? null}
                        leadName={selectedLeadForHistory?.name ?? null}
                    />
                    <EditActivityModal
                        isOpen={isEditModalOpen}
                        onClose={() => setEditModalOpen(false)}
                        activity={activityToEdit}
                        onSuccess={handleSuccess}
                    />
                    <CancelActivityModal
                        isOpen={isCancelModalOpen}
                        onClose={() => setCancelModalOpen(false)}
                        activity={activityToCancel}
                        onSuccess={handleSuccess}
                    />
                </>
            )}
        </>
    );
}