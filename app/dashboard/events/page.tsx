//frontend/frontend/app/dashboard/events/page.tsx
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
import { Users, Calendar, Search, AlertCircle, Loader2, Check, LayoutGrid, List, User, Clock, FileText, MoreHorizontal, Edit, Calendar as CalendarIcon, XCircle, FileEdit, Timer, MapPin, Link as LinkIcon, Volume2, Mic, MicOff, Trash2, Play, Mail, Fingerprint, ShieldCheck, Send } from "lucide-react"
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
    case 'Cancelled': return 'outline';
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
  status: 'Pending' | 'Completed' | 'Overdue' | 'Cancelled' | 'Rescheduled';
  createdAt: string;
  createdBy: string;
  remark?: string;
  attendees: string[];
  duration_minutes?: number;
  meeting_agenda?: string;
  meeting_link?: string;
  location_text?: string;
  latitude?: number;
  longitude?: number;
  mom_audio_path?: string;
  actual_start_time?: string;
  actual_end_time?: string;
  phone?: string;
  email?: string;
  end_location_text?: string;
}

type StatusFilter = 'all' | 'pending' | 'completed' | 'overdue' | 'cancelled' | 'rescheduled';
type ViewMode = 'grid' | 'list';

const getEventStatus = (event: { start_time: string; phase?: string }): 'Pending' | 'Completed' | 'Overdue' | 'Cancelled' | 'Rescheduled' => {
  if (event.phase === 'Completed' || event.phase === 'Done') return 'Completed';
  if (event.phase === 'Cancelled') return 'Cancelled';
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

    const oldTimeUtc = event.start_time; // capture before update
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

      // Best-effort: send reschedule notification emails
      const pythonBaseUrl = process.env.NEXT_PUBLIC_PYTHON_API_URL?.replace(/\/$/, "");
      const companyAuthName = typeof window !== "undefined" ? localStorage.getItem("companyName") : null;
      if (pythonBaseUrl && companyAuthName) {
        fetch(`${pythonBaseUrl}/internal/send-reschedule-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event_type: event.type === "meeting" ? "Meeting" : "Demo",
            company_name: event.company_name,
            salesperson_username: event.assigned_to,
            old_time_utc: oldTimeUtc,
            new_time_utc: startUtc,
            contact_email: event.email || null,
            company_auth_name: companyAuthName,
          }),
        }).catch(() => {}); // fire-and-forget
      }

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
      toast({ title: "Success", description: "Event has been cancelled." });
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

// --- NEW: OTP & Email Modals ---

function OTPVerificationModal({ isOpen, onClose, event, onVerify }: { isOpen: boolean, onClose: () => void, event: EnhancedEvent | null, onVerify: (otp: string) => Promise<void> }) {
    const [otp, setOtp] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen || !event) return null;

    const handleSubmit = async () => {
        if (!otp) return;
        setIsLoading(true);
        try {
            await onVerify(otp);
            setOtp("");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-blue-100 rounded-full">
                            <Fingerprint className="h-8 w-8 text-blue-600" />
                        </div>
                    </div>
                    <DialogTitle className="text-center text-xl">Enter Verification OTP</DialogTitle>
                    <DialogDescription className="text-center">
                        An OTP has been sent to the client at <strong>{event.email || "their registered email"}</strong>. 
                        Please enter it to start the {event.type}.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 flex justify-center">
                    <Input 
                        value={otp} 
                        onChange={e => setOtp(e.target.value)} 
                        placeholder="6-digit OTP" 
                        className="text-center text-2xl tracking-widest h-12"
                        maxLength={6}
                    />
                </div>
                <DialogFooter className="sm:justify-center">
                    <Button onClick={handleSubmit} disabled={isLoading || otp.length < 4} className="w-full">
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
                        Verify & Start
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function ClientEmailModal({ isOpen, onClose, event, onSubmit }: { isOpen: boolean, onClose: () => void, event: EnhancedEvent | null, onSubmit: (email: string) => Promise<void> }) {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen || !event) return null;

    const handleSubmit = async () => {
        if (!email || !email.includes('@')) return;
        setIsLoading(true);
        try {
            await onSubmit(email);
            setEmail("");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-orange-100 rounded-full">
                            <Mail className="h-8 w-8 text-orange-600" />
                        </div>
                    </div>
                    <DialogTitle className="text-center text-xl">Missing Client Email</DialogTitle>
                    <DialogDescription className="text-center">
                        OTP cannot be sent because the client email is missing. Please provide it to continue.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Label htmlFor="client-email">Client Email Address</Label>
                    <Input 
                        id="client-email"
                        type="email"
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        placeholder="client@example.com" 
                        className="mt-1"
                    />
                </div>
                <DialogFooter className="sm:justify-center">
                    <Button onClick={handleSubmit} disabled={isLoading || !email.includes('@')} className="w-full">
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                        Confirm & Send OTP
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function EventsPage() {
  const { toast } = useToast();
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
  const [startingEvents, setStartingEvents] = useState<Set<string>>(new Set());
  
  // OTP related state
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [otpTargetEvent, setOtpTargetEvent] = useState<EnhancedEvent | null>(null);

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

      const mapApiEventToEnhancedEvent = (event: (ApiMeeting | ApiDemo) & { phase?: string; attendees?: any }, type: 'meeting' | 'demo'): EnhancedEvent => {
        const isMeeting = type === 'meeting';
        const meeting = event as ApiMeeting;
        const demo = event as ApiDemo;

        const startTime = isMeeting ? meeting.event_time : demo.start_time;

        const attendeesString = (event.attendees || "").toString();
        const attendees = attendeesString ? attendeesString.split(',').filter((name: string) => name.trim() !== '') : [];

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
          meeting_agenda: (event as any).meeting_agenda,
          meeting_link: (event as any).meeting_link,
          location_text: (event as any).location_text,
          latitude: (event as any).latitude,
          longitude: (event as any).longitude,
          mom_audio_path: (event as any).mom_audio_path,
          actual_start_time: (event as any).actual_start_time,
          actual_end_time: (event as any).actual_end_time,
          phone: leadsMap.get(String(event.lead_id))?.contacts?.[0]?.phone || '',
          email: leadsMap.get(String(event.lead_id))?.email || '',
          end_location_text: (event as any).end_location_text,
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
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
    loadEvents();
  }

  const captureGPS = () => new Promise<{ latitude: number; longitude: number }>((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error("Geolocation not supported by this browser.")); return; }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => reject(new Error("Could not get location. Please allow location access.")),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });

   const handleStartEvent = async (event: EnhancedEvent) => {
    setStartingEvents(prev => new Set([...prev, event.id]));
    try {
      // 1. Check if OTP is required for this user
      const { isOtpRequired } = await api.checkIsEventOTP(event.numericId, event.type);
      
      if (isOtpRequired) {
        setOtpTargetEvent(event);
        if (!event.email) {
          setIsEmailModalOpen(true);
        } else {
          await api.generateEventOTP(event.numericId, event.type);
          setIsOtpModalOpen(true);
          toast({ title: "OTP Sent", description: `Verification code sent to ${event.email}` });
        }
        return;
      }

      // 2. If no OTP, proceed with location capture
      await startEventLocationCapture(event);
    } catch (err) {
      toast({ title: "Action Failed", description: (err as Error).message, variant: "destructive" });
    } finally {
      if (!isOtpModalOpen && !isEmailModalOpen) {
        setStartingEvents(prev => { const next = new Set(prev); next.delete(event.id); return next; });
      }
    }
  };

  const startEventLocationCapture = async (event: EnhancedEvent) => {
      try {
          const coords = await captureGPS();
          const payload = { Latitude: coords.latitude, Longitude: coords.longitude };
          
          let response;
          if (event.type === 'meeting') response = await api.saveMeetingLocation(event.numericId, payload);
          else response = await api.saveDemoLocation(event.numericId, payload);
          
          const address = response?.location_text || "";
          toast({ title: "Event Started", description: `Check-in at ${address || "captured location"}` });
          loadEvents();
      } catch (err) {
          toast({ title: "Capture Failed", description: (err as Error).message, variant: "destructive" });
      }
  };

  const handleVerifyOTP = async (otp: string) => {
    if (!otpTargetEvent) return;
    try {
      const res = await api.verifyEventOTP(otpTargetEvent.numericId, otpTargetEvent.type, otp);
      if (res.success) {
        setIsOtpModalOpen(false);
        await startEventLocationCapture(otpTargetEvent);
        setOtpTargetEvent(null);
      } else {
        toast({ title: "Verification Failed", description: res.message || "Invalid OTP", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
    } finally {
        setStartingEvents(prev => { const next = new Set(prev); if(otpTargetEvent) next.delete(otpTargetEvent.id); return next; });
    }
  };

  const handleEmailSubmit = async (newEmail: string) => {
      if (!otpTargetEvent) return;
      try {
          // Update client email first
          await api.updateClient(parseInt(otpTargetEvent.lead_id), { company_email: newEmail });
          toast({ title: "Email Updated", description: "Client email has been saved." });
          
          // Refresh event data to include new email
          const updatedEvent = { ...otpTargetEvent, email: newEmail };
          setOtpTargetEvent(updatedEvent);
          setIsEmailModalOpen(false);

          // Generate and send OTP
          await api.generateEventOTP(updatedEvent.numericId, updatedEvent.type);
          setIsOtpModalOpen(true);
          toast({ title: "OTP Sent", description: `Verification code sent to ${newEmail}` });
      } catch (err) {
          toast({ title: "Failed to Update", description: (err as Error).message, variant: "destructive" });
      }
  };

  const handleEndEvent = async (event: EnhancedEvent) => {
    if (event.actual_end_time) {
      toast({ title: "Already Ended", description: "This event has already been ended." });
      return;
    }
    setStartingEvents(prev => new Set([...prev, event.id]));
    try {
      const coords = await captureGPS();
      const payload = { Latitude: coords.latitude, Longitude: coords.longitude };

      let response;
      if (event.type === 'meeting') response = await api.endMeeting(event.numericId, payload);
      else response = await api.endDemo(event.numericId, payload);

      const address = response?.location_text || "";
      toast({ title: "Event Ended", description: `Check-out at ${address || "captured location"}` });
      loadEvents();
    } catch (err) {
      toast({ title: "End Failed", description: (err as Error).message, variant: "destructive" });
    } finally {
      setStartingEvents(prev => { const next = new Set(prev); next.delete(event.id); return next; });
    }
  };

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
          {event.status === 'Completed' && (
            <DropdownMenuItem onClick={() => handleAction(event, 'editNotes')}>
              <FileEdit className="mr-2 h-4 w-4" /> Edit Notes
            </DropdownMenuItem>
          )}
          {['Pending', 'Rescheduled', 'Overdue'].includes(event.status) && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleAction(event, 'cancel')} className="text-destructive focus:text-destructive">
                <XCircle className="mr-2 h-4 w-4" /> Cancel Event
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4 md:space-y-6 px-3 sm:px-4 md:px-0">
        {/* Page header skeleton */}
        <div className="space-y-2">
          <div className="h-8 w-64 bg-muted rounded animate-pulse"></div>
          <div className="h-4 w-96 bg-muted rounded animate-pulse"></div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              {/* Search bar skeleton */}
              <div className="h-9 flex-1 max-w-sm bg-muted rounded animate-pulse"></div>

              {/* Filters and view mode skeleton */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-4 w-16 bg-muted rounded animate-pulse"></div>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 bg-muted rounded animate-pulse"></div>
                  <div className="h-9 w-9 bg-muted rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {/* Grid view skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="border rounded-lg overflow-hidden bg-card">
                  <div className="p-4 space-y-3">
                    {/* Header with title and badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-20 bg-muted rounded animate-pulse"></div>
                        <div className="h-5 w-3/4 bg-muted rounded animate-pulse"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-6 w-20 bg-muted rounded animate-pulse"></div>
                        <div className="h-8 w-8 bg-muted rounded animate-pulse"></div>
                      </div>
                    </div>

                    {/* Content details */}
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 bg-muted rounded animate-pulse"></div>
                        <div className="h-4 flex-1 bg-muted rounded animate-pulse"></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 bg-muted rounded animate-pulse"></div>
                        <div className="h-4 flex-1 bg-muted rounded animate-pulse"></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 bg-muted rounded animate-pulse"></div>
                        <div className="h-4 flex-1 bg-muted rounded animate-pulse"></div>
                      </div>
                    </div>
                  </div>

                  {/* Footer button */}
                  <div className="px-4 pb-4">
                    <div className="h-9 w-full bg-muted rounded animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination skeleton */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
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
        {/* <h1 className="text-2xl font-bold tracking-tight">Meeting & Demo Summary</h1>
        <p className="text-muted-foreground">View, filter, and manage all scheduled events. Double-click an event for more details.</p> */}
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
                <div className="flex items-center space-x-2"><RadioGroupItem value="cancelled" id="cancelled" /><Label htmlFor="cancelled">Cancelled</Label></div>
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
                          <CardContent className="text-sm space-y-2">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <User className="h-4 w-4 shrink-0" />
                              <span className="truncate">{event.assigned_to}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <CalendarIcon className="h-4 w-4 shrink-0" />
                              <span>{formatDateTime(event.start_time)}</span>
                            </div>
                            {event.phone && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="h-4 w-4 shrink-0" />
                                <span>{event.phone}</span>
                              </div>
                            )}
                            {event.actual_start_time && (
                              <div className="flex items-center gap-2 text-orange-600">
                                <Play className="h-4 w-4 shrink-0" />
                                <span className="text-xs">Started: {formatDateTime(event.actual_start_time)}</span>
                              </div>
                            )}
                            {event.actual_end_time && (
                              <div className="flex items-center gap-2 text-green-600">
                                <Check className="h-4 w-4 shrink-0" />
                                <span className="text-xs">Ended: {formatDateTime(event.actual_end_time)}</span>
                              </div>
                            )}
                            {event.actual_start_time && !event.actual_end_time && isActionable && (
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-600">
                                  <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                                  In Progress
                                </span>
                              </div>
                            )}
                            {event.status === 'Completed' && event.duration_minutes && event.duration_minutes > 0 && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Timer className="h-4 w-4 shrink-0" />
                                <span>{event.duration_minutes} minutes</span>
                              </div>
                            )}
                          </CardContent>
                        </div>
                        {isActionable && (
                          <CardFooter className="flex gap-2 pt-3">
                            {!event.actual_start_time ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 border-green-500 text-green-600 hover:bg-green-50"
                                disabled={startingEvents.has(event.id)}
                                onClick={e => { e.stopPropagation(); handleStartEvent(event); }}
                              >
                                {startingEvents.has(event.id) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="mr-1 h-4 w-4" />}
                                Start
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 border-red-500 text-red-600 hover:bg-red-50"
                                disabled={startingEvents.has(event.id) || !!event.actual_end_time}
                                onClick={e => { e.stopPropagation(); handleEndEvent(event); }}
                              >
                                {startingEvents.has(event.id) ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="mr-1 h-4 w-4" />}
                                End
                              </Button>
                            )}
                            <Button asChild size="sm" className="flex-1" onClick={e => e.stopPropagation()}>
                              <Link href={linkHref}><Check className="mr-1 h-4 w-4" />Done</Link>
                            </Button>
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
                                {isActionable && !event.actual_start_time && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-green-500 text-green-600 hover:bg-green-50"
                                    disabled={startingEvents.has(event.id)}
                                    onClick={e => { e.stopPropagation(); handleStartEvent(event); }}
                                  >
                                    {startingEvents.has(event.id) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="mr-1 h-4 w-4" />}
                                    Start
                                  </Button>
                                )}
                                {isActionable && event.actual_start_time && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-red-500 text-red-600 hover:bg-red-50"
                                    disabled={startingEvents.has(event.id) || !!event.actual_end_time}
                                    onClick={e => { e.stopPropagation(); handleEndEvent(event); }}
                                  >
                                    {startingEvents.has(event.id) ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="mr-1 h-4 w-4" />}
                                    End
                                  </Button>
                                )}
                                {isActionable && (
                                  <Button asChild size="sm" onClick={e => e.stopPropagation()}>
                                    <Link href={linkHref}><Check className="mr-1 h-4 w-4" />Done</Link>
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

      <OTPVerificationModal 
        isOpen={isOtpModalOpen}
        onClose={() => setIsOtpModalOpen(false)}
        event={otpTargetEvent}
        onVerify={handleVerifyOTP}
      />

      <ClientEmailModal 
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        event={otpTargetEvent}
        onSubmit={handleEmailSubmit}
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
  const [momUrl, setMomUrl] = useState<string | null>(null);
  const [momLoading, setMomLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !event) { setMomUrl(null); return; }
    setMomLoading(true);
    const fetch = event.type === 'meeting'
      ? api.getMeetingMOM(event.numericId)
      : api.getDemoMOM(event.numericId);
    fetch.then(r => setMomUrl(r.url)).catch(() => { }).finally(() => setMomLoading(false));
  }, [isOpen, event]);

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

          {event.actual_start_time && (
            <div className="grid grid-cols-3 items-center gap-4">
              <Label className="text-right font-semibold flex items-center justify-end gap-2 text-orange-600">
                <Play className="h-4 w-4" /> Actual Start
              </Label>
              <p className="col-span-2 text-orange-600">{formatDateTime(event.actual_start_time)}</p>
            </div>
          )}

          {event.actual_end_time && (
            <div className="grid grid-cols-3 items-center gap-4">
              <Label className="text-right font-semibold flex items-center justify-end gap-2 text-green-600">
                <Check className="h-4 w-4" /> Actual End
              </Label>
              <p className="col-span-2 text-green-600">{formatDateTime(event.actual_end_time)}</p>
            </div>
          )}

          {event.location_text && (
            <div className="grid grid-cols-3 items-start gap-4">
              <div className="flex items-start gap-2 justify-self-end pt-1">
                <MapPin className="h-4 w-4 shrink-0 mt-[2px] text-muted-foreground" />
                <span className="font-semibold text-sm leading-tight text-right text-foreground max-w-[110px]">
                  Check-In Location
                </span>
              </div>
              <div className="col-span-2 text-sm">{event.location_text}</div>
            </div>
          )}

          {event.end_location_text && (
            <div className="grid grid-cols-3 items-start gap-4">
              <div className="flex items-start gap-2 justify-self-end pt-1">
                <MapPin className="h-4 w-4 shrink-0 mt-[2px] text-muted-foreground" />
                <span className="font-semibold text-sm leading-tight text-right text-foreground max-w-[110px]">
                  End Location
                </span>
              </div>
              <div className="col-span-2 text-sm">{event.end_location_text}</div>
            </div>
          )}

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

          {event.status === 'Cancelled' && event.remark && (
            <div className="grid grid-cols-3 items-start gap-4 pt-4 border-t">
              <Label htmlFor="cancellation-reason" className="text-right font-semibold flex items-start justify-end gap-2 pt-1 text-destructive">
                <XCircle className="h-4 w-4" /> Cancellation Reason
              </Label>
              <p id="cancellation-reason" className="col-span-2 text-sm bg-muted/70 p-3 rounded-md whitespace-pre-wrap">{event.remark}</p>
            </div>
          )}

          {event.meeting_agenda && (
            <div className="grid grid-cols-3 items-start gap-4 pt-4 border-t">
              <Label className="text-right font-semibold flex items-start justify-end gap-2 pt-1">
                <FileText className="h-4 w-4" /> Agenda
              </Label>
              <p className="col-span-2 text-sm bg-muted/70 p-3 rounded-md whitespace-pre-wrap">{event.meeting_agenda}</p>
            </div>
          )}

          {event.meeting_link && (
            <div className="grid grid-cols-3 items-center gap-4">
              <Label className="text-right font-semibold flex items-center justify-end gap-2">
                <LinkIcon className="h-4 w-4" /> Meeting Link
              </Label>
              <a href={event.meeting_link} target="_blank" rel="noopener noreferrer"
                className="col-span-2 text-sm text-blue-600 underline truncate hover:text-blue-800">
                {event.meeting_link}
              </a>
            </div>
          )}



          {(momLoading || momUrl) && (
            <div className="grid grid-cols-3 items-start gap-4 pt-4 border-t">
              <Label className="text-right font-semibold flex items-start justify-end gap-2 pt-1">
                <Volume2 className="h-4 w-4" /> MOM Audio
              </Label>
              <div className="col-span-2">
                {momLoading
                  ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  : <audio controls src={momUrl!} className="w-full h-10" />}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}