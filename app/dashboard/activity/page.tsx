//file: frontend/app/dashboard/activity/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
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
import { ApiUser, ApiUnifiedActivity, api } from "@/lib/api";
import { Loader2, PlusCircle, CalendarPlus, LayoutGrid, List, Search, Filter, Eye, Phone, CheckCircle, MessageSquare } from "lucide-react";
import { ActivityCard } from "@/components/activity/activity-card";
import { ActivityTable } from "@/components/activity/activity-table";
import { MarkAsDoneModal } from "@/components/activity/mark-as-done-modal";
import { LogActivityModal } from "@/components/activity/log-activity-modal";
import { ScheduleActivityModal } from "@/components/activity/schedule-activity-modal";
import { formatDateTime } from "@/lib/date-format";


type ViewMode = 'card' | 'grid';
type FilterType = 'all' | 'today' | 'scheduled' | 'completed' | 'canceled' | 'overdue';

function ActivityDetailModal({
    isOpen,
    onClose,
    activity,
}: {
    isOpen: boolean;
    onClose: () => void;
    activity: ApiUnifiedActivity | null;
}) {
    if (!isOpen || !activity) return null;

    const activityTypeIcons: { [key: string]: React.ElementType } = {
        Call: Phone,
        Email: MessageSquare, // Assuming Email uses MessageSquare
        WhatsApp: MessageSquare,
        'Follow-up': Phone,
        default: CheckCircle
    };
    const Icon = activityTypeIcons[activity.activity_type] || activityTypeIcons.default;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Icon className="h-5 w-5" />
                        Activity Details for {activity.company_name}
                    </DialogTitle>
                    <DialogDescription>
                        Details of the scheduled activity.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-3 gap-y-4 py-4 text-sm">
                    <Label className="font-semibold text-right pr-4">Status</Label>
                    <div className="col-span-2"><Badge variant={activity.status === 'pending' ? 'secondary' : 'default'}>{activity.status}</Badge></div>

                    <Label className="font-semibold text-right pr-4">Activity Type</Label>
                    <p className="col-span-2">{activity.activity_type}</p>

                    <Label className="font-semibold text-right pr-4">Scheduled For</Label>
                    <p className="col-span-2">{formatDateTime(activity.scheduled_for)}</p>

                    <Label className="font-semibold text-right pr-4">Created On</Label>
                    <p className="col-span-2">{formatDateTime(activity.created_at)}</p>

                    <Label className="font-semibold text-right pr-4 self-start">Details</Label>
                    <p className="col-span-2 bg-muted/50 p-2 rounded-md">{activity.details}</p>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


function EditActivityModal({
    isOpen,
    onClose,
    activity,
    onSuccess,
}: {
    isOpen: boolean;
    onClose: () => void;
    activity: ApiUnifiedActivity | null;
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
        if (!activity || !details) {
            toast({ title: "Error", description: "Details cannot be empty.", variant: "destructive" });
            return;
        }
        setIsLoading(true);
        try {
            await api.updateActivity(activity.id, { details });
            toast({ title: "Success", description: "Activity has been updated." });
            onSuccess();
        } catch (error) {
            console.error("Failed to update activity:", error);
            toast({ title: "Error", description: "Could not update the activity.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen || !activity) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Activity</DialogTitle>
                    <DialogDescription>Update the details for the activity with {activity.company_name}.</DialogDescription>
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
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={isLoading}>
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
    activity: ApiUnifiedActivity | null;
    onSuccess: () => void;
}) {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    if (!isOpen || !activity) return null;

    const isScheduled = activity.type === 'reminder';
    const title = isScheduled ? "Cancel Scheduled Activity" : "Delete Logged Activity";
    const description = `Are you sure you want to ${isScheduled ? 'cancel' : 'delete'} this activity for ${activity.company_name}? This action cannot be undone.`;

    const handleConfirm = async () => {
        setIsLoading(true);
        try {
            if (isScheduled) {
                await api.cancelScheduledActivity(activity.id);
            } else {
                await api.deleteLoggedActivity(activity.id);
            }
            toast({ title: "Success", description: "Activity has been removed." });
            onSuccess();
        } catch (error) {
            console.error("Failed to remove activity:", error);
            toast({ title: "Error", description: "Could not remove the activity.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>No, keep it</Button>
                    <Button variant="destructive" onClick={handleConfirm} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Yes, {isScheduled ? 'Cancel It' : 'Delete It'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}


export default function ActivityPage() {
    const [user, setUser] = useState<ApiUser | null>(null);
    const [allActivities, setAllActivities] = useState<ApiUnifiedActivity[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activityToComplete, setActivityToComplete] = useState<ApiUnifiedActivity | null>(null);
    const [isLogModalOpen, setLogModalOpen] = useState(false);
    const [activityToView, setActivityToView] = useState<ApiUnifiedActivity | null>(null);
    const [isScheduleModalOpen, setScheduleModalOpen] = useState(false);
    const [isDoneModalOpen, setDoneModalOpen] = useState(false);
    const [isDetailModalOpen, setDetailModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('card');
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');
    const [searchTerm, setSearchTerm] = useState("");
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const router = useRouter();
    const { toast } = useToast();
    const [isPastActivitiesModalOpen, setPastActivitiesModalOpen] = useState(false);
    const [selectedLeadForHistory, setSelectedLeadForHistory] = useState<{ id: number; name: string } | null>(null);
    const [activityToEdit, setActivityToEdit] = useState<ApiUnifiedActivity | null>(null);
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [activityToCancel, setActivityToCancel] = useState<ApiUnifiedActivity | null>(null);
    const [isCancelModalOpen, setCancelModalOpen] = useState(false);

    const fetchDataForUser = async (username: string) => {
        setIsLoading(true);
        try {
            const activities = await api.getAllActivities(username);
            setAllActivities(activities);
        } catch (error) {
            console.error("Detailed Fetch Error:", error);
            toast({
                title: "Error Fetching Data",
                description: "Could not retrieve activities. Please check the backend server connection.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const userDataString = localStorage.getItem("user");
        if (!userDataString) {
            router.push("/login");
            return;
        }
        const loggedInUser = JSON.parse(userDataString);
        setUser(loggedInUser);
        fetchDataForUser(loggedInUser.username);
    }, [router]);


    const filteredActivities = useMemo(() => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        return allActivities
            .filter(act => {
                const scheduledDate = act.scheduled_for ? new Date(act.scheduled_for) : null;
                switch (activeFilter) {
                    case 'today': return scheduledDate && scheduledDate.toDateString() === today.toDateString() && act.status === 'pending';
                    case 'scheduled': return act.type === 'reminder' && act.status === 'pending';
                    case 'completed': return act.status !== 'pending';
                    case 'canceled': return act.status === 'canceled';
                    case 'overdue': return scheduledDate && scheduledDate < now && act.status === 'pending';
                    default: return true;
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

    const handleMarkAsDoneClick = (activity: ApiUnifiedActivity) => {
        setActivityToComplete(activity);
        setDoneModalOpen(true);
    };

    const handleViewDetailsClick = (activity: ApiUnifiedActivity) => {
        setActivityToView(activity);
        setDetailModalOpen(true);
    };

    const handleViewPastActivitiesClick = (leadId: number, leadName: string) => {
        setSelectedLeadForHistory({ id: leadId, name: leadName });
        setPastActivitiesModalOpen(true);
    };

    const handleEditClick = (activity: ApiUnifiedActivity) => {
        if (activity.type === 'log') {
            setActivityToEdit(activity);
            setEditModalOpen(true);
        } else {
            toast({
                title: "Action Not Available",
                description: "To change a scheduled activity, please cancel it and create a new one.",
                variant: "default"
            });
        }
    };

    const handleCancelClick = (activity: ApiUnifiedActivity) => {
        setActivityToCancel(activity);
        setCancelModalOpen(true);
    };


    const handleSuccess = () => {
        setLogModalOpen(false);
        setScheduleModalOpen(false);
        setDoneModalOpen(false);
        setEditModalOpen(false);
        setCancelModalOpen(false);

        if (user) {
            fetchDataForUser(user.username);
        }
    };

    if (!user) { return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>; }

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
                        <Button onClick={() => setScheduleModalOpen(true)}><CalendarPlus className="mr-2 h-4 w-4" />Schedule an Activity</Button>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by company or details..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-8"
                                />
                            </div>

                            <div className="hidden md:flex items-center justify-between gap-4">
                                <RadioGroup value={activeFilter} onValueChange={(value) => setActiveFilter(value as FilterType)} className="flex items-center gap-4">
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="all" id="all-desktop" /><Label htmlFor="all-desktop">All</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="today" id="today-desktop" /><Label htmlFor="today-desktop">Today</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="scheduled" id="scheduled-desktop" /><Label htmlFor="scheduled-desktop">Scheduled</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="completed" id="completed-desktop" /><Label htmlFor="completed-desktop">Completed</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="canceled" id="canceled-desktop" /><Label htmlFor="canceled-desktop">Canceled</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="overdue" id="overdue-desktop" /><Label htmlFor="overdue-desktop">Overdue</Label></div>
                                </RadioGroup>
                                <div className="flex items-center gap-2">
                                    <Button variant={viewMode === 'card' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('card')}><LayoutGrid className="h-4 w-4" /></Button>
                                    <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('grid')}><List className="h-4 w-4" /></Button>
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
                                                <RadioGroup value={activeFilter} onValueChange={(value) => setActiveFilter(value as FilterType)} className="flex flex-col space-y-2">
                                                    <div className="flex items-center space-x-2"><RadioGroupItem value="all" id="all-mobile" /><Label htmlFor="all-mobile">All</Label></div>
                                                    <div className="flex items-center space-x-2"><RadioGroupItem value="today" id="today-mobile" /><Label htmlFor="today-mobile">Today</Label></div>
                                                    <div className="flex items-center space-x-2"><RadioGroupItem value="scheduled" id="scheduled-mobile" /><Label htmlFor="scheduled-mobile">Scheduled</Label></div>
                                                    <div className="flex items-center space-x-2"><RadioGroupItem value="completed" id="completed-mobile" /><Label htmlFor="completed-mobile">Completed</Label></div>
                                                    <div className="flex items-center space-x-2"><RadioGroupItem value="canceled" id="canceled-mobile" /><Label htmlFor="canceled-mobile">Canceled</Label></div>
                                                    <div className="flex items-center space-x-2"><RadioGroupItem value="overdue" id="overdue-mobile" /><Label htmlFor="overdue-mobile">Overdue</Label></div>
                                                </RadioGroup>
                                            </div>
                                            <div className="space-y-2">
                                                <h4 className="font-medium leading-none">View</h4>
                                                <div className="flex items-center gap-2">
                                                    <Button className="flex-1" variant={viewMode === 'card' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('card')}><LayoutGrid className="mr-2 h-4 w-4" />Card</Button>
                                                    <Button className="flex-1" variant={viewMode === 'grid' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('grid')}><List className="mr-2 h-4 w-4" />List</Button>
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
                        ) : viewMode === 'grid' ? (
                            <ActivityTable
                                activities={paginatedActivities}
                                onMarkAsDone={handleMarkAsDoneClick}
                                onViewDetails={handleViewDetailsClick}
                                onViewPastActivities={handleViewPastActivitiesClick}
                                onEdit={handleEditClick}
                                onCancel={handleCancelClick}
                            />
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {paginatedActivities.map(activity => (
                                    <ActivityCard
                                        key={`${activity.type}-${activity.id}`}
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

            {/* Render Modals */}
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