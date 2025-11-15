"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Users, Calendar, Search, AlertCircle, Loader2, Check, LayoutGrid, List, User, Clock, FileText, MoreHorizontal, Edit, Calendar as CalendarIcon, XCircle, FileEdit, Timer } from "lucide-react"
import { api, type ApiLead, type ApiMeeting, type ApiDemo, type ApiUser, type ApiEventReschedulePayload } from "@/lib/api"
import { formatDateTime, parseAsUTCDate } from "@/lib/date-format" 
import { useToast } from "@/hooks/use-toast"

const convertLocalStringToUtcIso = (localString: string): string => {
    if (!localString) return "";
    
    const [datePart, timePart] = localString.split('T');
    if (!datePart || !timePart) {
        console.warn("Invalid datetime-local string format:", localString);
        return new Date(localString).toISOString(); 
    }

    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute] = timePart.split(':').map(Number);
    
    const localDate = new Date(year, month - 1, day, hour, minute);
    
    return localDate.toISOString();
};


const getStatusBadgeVariant = (status: EnhancedEvent['status']) => {
  switch (status) {
    case 'Completed': return 'default';
    case 'Pending': return 'secondary';
    case 'Overdue': return 'destructive';
    case 'Canceled': return 'outline';
    case 'Rescheduled': return 'outline';
    default: return 'outline';
  }
}
interface EnhancedEvent {
  id: string;
  numericId: number;
  type: 'meeting' | 'demo';
  meeting_type?: string;
  lead_id: string;
  company_name: string;
  contact_name: string;
  assigned_to: string;
  start_time: string;
  end_time: string;
  status: 'Pending' | 'Completed' | 'Overdue' | 'Canceled' | 'Rescheduled';
  createdAt: string;
  createdBy: string;
  remark?: string;
  attendees: string[];
  duration_minutes?: number;
}

type StatusFilter = 'all' | 'pending' | 'completed' | 'overdue' | 'canceled' | 'rescheduled';
type ViewMode = 'grid' | 'list';

const getEventStatus = (event: { start_time: string; phase?: string }): 'Pending' | 'Completed' | 'Overdue' | 'Canceled' | 'Rescheduled' => {
  if (event.phase === 'Completed' || event.phase === 'Done') return 'Completed';
  if (event.phase === 'Canceled') return 'Canceled';
  if (event.phase === 'Rescheduled') return 'Rescheduled';
  
  const eventDate = parseAsUTCDate(event.start_time);
  if (!eventDate) return 'Pending';
  
  if (eventDate < new Date()) return 'Overdue';

  return 'Pending';
}


// --- MODAL COMPONENTS ---

function RescheduleModal({ isOpen, onClose, event, onSuccess, currentUser }: { isOpen: boolean, onClose: () => void, event: EnhancedEvent | null, onSuccess: () => void, currentUser: ApiUser | null }) {
    const { toast } = useToast();
    const [startTime, setStartTime] = useState("");
    const [duration, setDuration] = useState("60");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (event?.start_time) {
            const date = parseAsUTCDate(event.start_time);
            if (date) {
                date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
                setStartTime(date.toISOString().slice(0, 16));
            }
        }
    }, [event]);

    if (!isOpen || !event || !currentUser) return null;

    const handleSubmit = async () => {
        if (!startTime || !duration) {
            toast({ title: "Error", description: "Please fill in all fields.", variant: "destructive" });
            return;
        }
        setIsLoading(true);
        
        const startUtc = convertLocalStringToUtcIso(startTime);
        
        const end = new Date(startTime);
        end.setMinutes(end.getMinutes() + parseInt(duration, 10));
        const endUtc = end.toISOString();

        try {
            await api.rescheduleEvent(event.type, event.numericId, {
                start_time: startUtc,
                end_time: endUtc,
                updated_by: currentUser.username,
            });

            toast({ title: "Success", description: "Event has been rescheduled." });
            onSuccess();
        } catch (error) {
            toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader><DialogTitle>Reschedule {event.type}</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="start_time">New Start Date & Time</Label>
                        <Input id="start_time" type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="duration">Duration (minutes)</Label>
                        <Input id="duration" type="number" value={duration} onChange={e => setDuration(e.target.value)} />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function ReassignModal({ isOpen, onClose, event, onSuccess, currentUser, users }: { isOpen: boolean, onClose: () => void, event: EnhancedEvent | null, onSuccess: () => void, currentUser: ApiUser | null, users: ApiUser[] }) {
  const { toast } = useToast();
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen || !event || !currentUser) return null;

  const availableUsers = users.filter(user => user.username !== event.assigned_to);

  const handleSubmit = async () => {
    if (!selectedUserId) {
      toast({ title: "Error", description: "Please select a user to reassign to.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      await api.reassignEvent(event.type, event.numericId, {
        assigned_to_user_id: parseInt(selectedUserId),
        updated_by: currentUser.username
      });
      toast({ title: "Success", description: "Event has been reassigned." });
      onSuccess();
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Reassign {event.type}</DialogTitle></DialogHeader>
        <div className="py-4">
          <Label htmlFor="assign-to">New Assignee</Label>
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger><SelectValue placeholder="Select a team member" /></SelectTrigger>
            <SelectContent>
              {availableUsers.map(user => (
                <SelectItem key={user.id} value={String(user.id)}>{user.username}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Reassign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CancelEventModal({ isOpen, onClose, event, onSuccess, currentUser }: { isOpen: boolean, onClose: () => void, event: EnhancedEvent | null, onSuccess: () => void, currentUser: ApiUser | null }) {
  const { toast } = useToast();
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen || !event || !currentUser) return null;

  const handleSubmit = async () => {
    if (!reason) {
      toast({ title: "Error", description: "Please provide a reason for cancellation.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      await api.cancelEvent(event.type, event.numericId, { reason, updated_by: currentUser.username });
      toast({ title: "Success", description: "Event has been canceled." });
      onSuccess();
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Cancel {event.type}</DialogTitle></DialogHeader>
        <div className="py-4">
          <Label htmlFor="reason">Reason for Cancellation</Label>
          <Textarea id="reason" value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g., Client is unavailable..." />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Back</Button>
          <Button variant="destructive" onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Confirm Cancellation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditNotesModal({ isOpen, onClose, event, onSuccess, currentUser }: { isOpen: boolean, onClose: () => void, event: EnhancedEvent | null, onSuccess: () => void, currentUser: ApiUser | null }) {
  const { toast } = useToast();
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setNotes(event?.remark || "");
  }, [event]);

  if (!isOpen || !event || !currentUser) return null;

  const handleSubmit = async () => {
    if (!notes) {
      toast({ title: "Error", description: "Notes cannot be empty.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      await api.updateEventNotes(event.type, event.numericId, { notes, updated_by: currentUser.username });
      toast({ title: "Success", description: "Event notes have been updated." });
      onSuccess();
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit Notes for Completed {event.type}</DialogTitle></DialogHeader>
        <div className="py-4 max-h-[60vh] overflow-y-auto pr-4">
          <Label htmlFor="notes">Post-Event Notes</Label>
          <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={10} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function EventsPage() {
  const [allEvents, setAllEvents] = useState<EnhancedEvent[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<ApiUser | null>(null);
  const [users, setUsers] = useState<ApiUser[]>([]);

  const [eventToEdit, setEventToEdit] = useState<EnhancedEvent | null>(null);
  const [modalType, setModalType] = useState<'reschedule' | 'reassign' | 'cancel' | 'editNotes' | null>(null);

  const [selectedEvent, setSelectedEvent] = useState<EnhancedEvent | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [meetingsData, demosData, leadsData, usersData] = await Promise.all([
        api.getAllMeetings(),
        api.getAllDemos(),
        api.getAllLeads(),
        api.getUsers(),
      ]);
      setUsers(usersData);

      const leadsMap = new Map<string, ApiLead>(
        leadsData.map(lead => [String(lead.id), lead])
      );

      const userNumberToNameMap = new Map<string, string>(
        usersData.map(user => [user.usernumber, user.username])
      );
      
      const mapApiEventToEnhancedEvent = (event: (ApiMeeting | ApiDemo) & { phase?: string; attendees?: string }, type: 'meeting' | 'demo'): EnhancedEvent => {
          const isMeeting = type === 'meeting';
          const meeting = event as ApiMeeting;
          const demo = event as ApiDemo;

          const startTime = isMeeting ? meeting.event_time : demo.start_time;
          
          const attendeesString = (event.attendees || "").toString();
          const attendees = attendeesString ? attendeesString.split(',').filter(name => name.trim() !== '') : [];

          return {
              id: `${type}-${event.id}`,
              numericId: event.id,
              type: type,
              meeting_type: isMeeting ? meeting.meeting_type : undefined,
              lead_id: String(event.lead_id),
              company_name: leadsMap.get(String(event.lead_id))?.company_name || 'Unknown Lead',
              contact_name: leadsMap.get(String(event.lead_id))?.contacts?.[0]?.contact_name || 'N/A',
              assigned_to: isMeeting ? meeting.assigned_to : userNumberToNameMap.get(demo.assigned_to) || demo.assigned_to,
              start_time: startTime,
              end_time: isMeeting ? meeting.event_end_time : demo.event_end_time,
              status: getEventStatus({ start_time: startTime, phase: event.phase }),
              createdAt: event.created_at,
              createdBy: isMeeting ? meeting.created_by : demo.scheduled_by,
              remark: event.remark,
              attendees: attendees,
              duration_minutes: event.duration_minutes,
          };
      };

      const combinedEvents: EnhancedEvent[] = [
        ...meetingsData.filter(m => m && m.id).map(m => mapApiEventToEnhancedEvent(m, 'meeting')),
        ...demosData.filter(d => d && d.id).map(d => mapApiEventToEnhancedEvent(d, 'demo')),
      ];
      
      combinedEvents.sort((a, b) => {
        const dateA = parseAsUTCDate(a.start_time) ?? new Date(0);
        const dateB = parseAsUTCDate(b.start_time) ?? new Date(0);
        return dateB.getTime() - dateA.getTime();
      });

      setAllEvents(combinedEvents);
    } catch (err) {
      console.error("Failed to load events:", err);
      setError("Failed to load events. Please try refreshing the page.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    loadEvents();
  }, [loadEvents]);

  const handleAction = (event: EnhancedEvent, action: 'reschedule' | 'reassign' | 'cancel' | 'editNotes') => {
    setEventToEdit(event);
    setModalType(action);
  };

  const handleSuccess = () => {
    setEventToEdit(null);
    setModalType(null);
    loadEvents();
  }

  const filteredEvents = useMemo(() => {
    return allEvents
      .filter(event => {
        if (statusFilter === 'all') return true;
        return event.status.toLowerCase() === statusFilter;
      })
      .filter(event => {
        const search = searchTerm.toLowerCase();
        if (!search) return true;
        return (
          event.company_name.toLowerCase().includes(search) ||
          event.contact_name.toLowerCase().includes(search)
        );
      });
  }, [allEvents, statusFilter, searchTerm]);

  const pageCount = Math.ceil(filteredEvents.length / pagination.pageSize);
  const paginatedEvents = filteredEvents.slice(
    pagination.pageIndex * pagination.pageSize,
    (pagination.pageIndex + 1) * pagination.pageSize
  );

  const handleEventDoubleClick = (event: EnhancedEvent) => {
    setSelectedEvent(event);
    setIsDetailModalOpen(true);
  };
  
  const renderActionMenu = (event: EnhancedEvent) => {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0" onClick={e => e.stopPropagation()}>
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={e => e.stopPropagation()}>
          <DropdownMenuItem onClick={() => handleAction(event, 'reschedule')}>
            <CalendarIcon className="mr-2 h-4 w-4" /> Reschedule
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAction(event, 'reassign')}>
            <User className="mr-2 h-4 w-4" /> Reassign
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAction(event, 'cancel')} className="text-destructive focus:text-destructive">
            <XCircle className="mr-2 h-4 w-4" /> Cancel Event
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Loading events...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Meeting & Demo Summary</h1>
        <p className="text-muted-foreground">View, filter, and manage all scheduled events. Double-click an event for more details.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by company or contact..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <RadioGroup
                defaultValue="all"
                value={statusFilter}
                onValueChange={(value: StatusFilter) => setStatusFilter(value)}
                className="flex items-center gap-2 sm:gap-4 flex-wrap"
              >
                <div className="flex items-center space-x-2"><RadioGroupItem value="all" id="all" /><Label htmlFor="all">All</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="pending" id="pending" /><Label htmlFor="pending">Pending</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="completed" id="completed" /><Label htmlFor="completed">Completed</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="overdue" id="overdue" /><Label htmlFor="overdue">Overdue</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="rescheduled" id="rescheduled" /><Label htmlFor="rescheduled">Rescheduled</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="canceled" id="canceled" /><Label htmlFor="canceled">Canceled</Label></div>
              </RadioGroup>

              <div className="flex items-center gap-2">
                <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('grid')}>
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('list')}>
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {paginatedEvents.length > 0 ? (
            <>
              {viewMode === 'grid' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {paginatedEvents.map(event => {
                    const linkHref = event.type === 'meeting'
                      ? `/dashboard/post-meeting?leadId=${event.lead_id}&meetingId=${event.numericId}`
                      : `/dashboard/post-demo?leadId=${event.lead_id}&demoId=${event.numericId}`;
                    const isActionable = ['Pending', 'Rescheduled', 'Overdue'].includes(event.status);

                    return (
                      // --- START OF FIX: Redesigned Card for better space efficiency ---
                      <Card key={event.id} onDoubleClick={() => handleEventDoubleClick(event)} className="flex flex-col justify-between h-full cursor-pointer hover:shadow-md transition-shadow">
                        <div className="flex-grow">
                          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                              <div>
                                  <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                                    {event.type === 'meeting' ? event.meeting_type || 'Meeting' : 'Demo'}
                                  </p>
                                  <CardTitle className="text-lg pt-1">{event.company_name}</CardTitle>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <Badge variant={getStatusBadgeVariant(event.status)}>{event.status}</Badge>
                                {(isActionable || event.status === 'Completed') && renderActionMenu(event)}
                              </div>
                          </CardHeader>
                          <CardContent className="text-sm space-y-3">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                  <User className="h-4 w-4" />
                                  <span>{event.assigned_to}</span>
                              </div>
                               <div className="flex items-center gap-2 text-muted-foreground">
                                  <CalendarIcon className="h-4 w-4" />
                                  <span>{formatDateTime(event.start_time)}</span>
                              </div>
                              {event.status === 'Completed' && event.duration_minutes && event.duration_minutes > 0 && (
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                      <Timer className="h-4 w-4" />
                                      <span>{event.duration_minutes} minutes</span>
                                  </div>
                              )}
                          </CardContent>
                        </div>
                        {isActionable && (
                          <CardFooter>
                            <Button asChild className="w-full" onClick={e => e.stopPropagation()}><Link href={linkHref}><Check className="mr-2 h-4 w-4" />Mark as Done</Link></Button>
                          </CardFooter>
                        )}
                      </Card>
                      // --- END OF FIX ---
                    );
                  })}
                </div>
              )}

              {viewMode === 'list' && (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Lead</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Assigned To</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Time Taken</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedEvents.map(event => {
                        const linkHref = event.type === 'meeting'
                          ? `/dashboard/post-meeting?leadId=${event.lead_id}&meetingId=${event.numericId}`
                          : `/dashboard/post-demo?leadId=${event.lead_id}&demoId=${event.numericId}`;
                        const isActionable = ['Pending', 'Rescheduled', 'Overdue'].includes(event.status);
                        return (
                          <TableRow key={event.id} onDoubleClick={() => handleEventDoubleClick(event)} className="cursor-pointer hover:bg-muted/50">
                            <TableCell>
                              <div className="font-medium">{event.company_name}</div>
                              <div className="text-sm text-muted-foreground">{event.contact_name}</div>
                            </TableCell>
                            <TableCell>
                              <div className="capitalize">{event.type === 'meeting' ? event.meeting_type || 'Meeting' : 'Demo'}</div>
                            </TableCell>
                            <TableCell>{event.assigned_to}</TableCell>
                            <TableCell>{formatDateTime(event.start_time)}</TableCell>
                             <TableCell>
                                {event.status === 'Completed' && event.duration_minutes && event.duration_minutes > 0 ? (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Timer className="h-4 w-4 text-muted-foreground" />
                                        <span>{event.duration_minutes} min</span>
                                    </div>
                                ) : (
                                    <span className="text-muted-foreground text-center block">—</span>
                                )}
                            </TableCell>
                            <TableCell><Badge variant={getStatusBadgeVariant(event.status)}>{event.status}</Badge></TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end items-center gap-2">
                                {isActionable && (
                                  <Button asChild size="sm" onClick={e => e.stopPropagation()}>
                                    <Link href={linkHref}>Mark as Done</Link>
                                  </Button>
                                )}
                                {isActionable && renderActionMenu(event)}
                                {event.status === 'Completed' && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0" onClick={e => e.stopPropagation()}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" onClick={e => e.stopPropagation()}>
                                      <DropdownMenuItem onClick={() => handleAction(event, 'editNotes')}><FileEdit className="mr-2 h-4 w-4" /> Edit Notes</DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground">No events match your current filters.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {pageCount > 1 && (
        <div className="flex items-center justify-between pt-4">
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

      <EventDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        event={selectedEvent}
      />

      <RescheduleModal
        isOpen={modalType === 'reschedule'}
        onClose={() => setModalType(null)}
        event={eventToEdit}
        onSuccess={handleSuccess}
        currentUser={currentUser}
      />
      <ReassignModal
        isOpen={modalType === 'reassign'}
        onClose={() => setModalType(null)}
        event={eventToEdit}
        onSuccess={handleSuccess}
        currentUser={currentUser}
        users={users}
      />
      <CancelEventModal
        isOpen={modalType === 'cancel'}
        onClose={() => setModalType(null)}
        event={eventToEdit}
        onSuccess={handleSuccess}
        currentUser={currentUser}
      />
      <EditNotesModal
        isOpen={modalType === 'editNotes'}
        onClose={() => setModalType(null)}
        event={eventToEdit}
        onSuccess={handleSuccess}
        currentUser={currentUser}
      />
    </div>
  )
}

interface EventDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EnhancedEvent | null;
}

const EventDetailModal = ({ isOpen, onClose, event }: EventDetailModalProps) => {
  if (!event) return null;

  const allParticipants = Array.from(new Set([event.assigned_to, ...event.attendees]));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl capitalize">{event.type} Details</DialogTitle>
          <DialogDescription>
            For {event.company_name}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-4">
          <div className="grid grid-cols-3 items-center gap-4">
            <Label className="text-right font-semibold">Status</Label>
            <div className="col-span-2">
              <Badge variant={getStatusBadgeVariant(event.status)}>{event.status}</Badge>
            </div>
          </div>
          {event.type === 'meeting' && event.meeting_type && (
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="meeting-type" className="text-right font-semibold flex items-center justify-end gap-2">
                Meeting Type
              </Label>
              <p id="meeting-type" className="col-span-2">{event.meeting_type}</p>
            </div>
          )}
          
          <div className="grid grid-cols-3 items-center gap-4">
            <Label htmlFor="scheduled-by" className="text-right font-semibold flex items-center justify-end gap-2">
              <User className="h-4 w-4" /> Scheduled By
            </Label>
            <p id="scheduled-by" className="col-span-2">{event.createdBy}</p>
          </div>
         
           <div className="grid grid-cols-3 items-start gap-4">
            <Label htmlFor="attendees" className="text-right font-semibold flex items-start justify-end gap-2 pt-1">
              <Users className="h-4 w-4" /> Attendees
            </Label>
            <div id="attendees" className="col-span-2 flex flex-wrap gap-1">
              {allParticipants.map(attendee => (
                <Badge key={attendee} variant="secondary" className="font-normal">{attendee}</Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 items-center gap-4">
            <Label htmlFor="created-at" className="text-right font-semibold flex items-center justify-end gap-2">
              <Clock className="h-4 w-4" /> Scheduled On
            </Label>
            <p id="created-at" className="col-span-2">{formatDateTime(event.createdAt)}</p>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <Label htmlFor="event-time" className="text-right font-semibold flex items-center justify-end gap-2">
              <Calendar className="h-4 w-4" /> Event Time
            </Label>
            <p id="event-time" className="col-span-2">{formatDateTime(event.start_time)}</p>
          </div>

          {event.status === 'Completed' && event.duration_minutes && event.duration_minutes > 0 && (
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="duration" className="text-right font-semibold flex items-center justify-end gap-2">
                <Timer className="h-4 w-4" /> Time Taken
              </Label>
              <p id="duration" className="col-span-2">{event.duration_minutes} minutes</p>
            </div>
          )}

          {event.status === 'Completed' && event.remark && (
            <div className="grid grid-cols-3 items-start gap-4 pt-4 border-t">
              <Label htmlFor="notes" className="text-right font-semibold flex items-start justify-end gap-2 pt-1">
                <FileText className="h-4 w-4" /> Post-Event Notes
              </Label>
              <p id="notes" className="col-span-2 text-sm bg-muted/70 p-3 rounded-md whitespace-pre-wrap">{event.remark}</p>
            </div>
          )}

          {event.status === 'Canceled' && event.remark && (
            <div className="grid grid-cols-3 items-start gap-4 pt-4 border-t">
              <Label htmlFor="cancellation-reason" className="text-right font-semibold flex items-start justify-end gap-2 pt-1 text-destructive">
                <XCircle className="h-4 w-4" /> Cancellation Reason
              </Label>
              <p id="cancellation-reason" className="col-span-2 text-sm bg-muted/70 p-3 rounded-md whitespace-pre-wrap">{event.remark}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}