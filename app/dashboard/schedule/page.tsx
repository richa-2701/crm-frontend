"use client"

import type React from "react"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { UserAvailabilityCalendar } from "@/components/ui/user-availability-calendar"
import { useState, useEffect, useCallback } from "react" // Import useCallback
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Calendar, Monitor, Loader2 } from "lucide-react" // Import Loader2
import { api, ApiLead, ApiUser, ApiMeeting, ApiDemo } from "@/lib/api"
import { format } from 'date-fns';
import { debounce } from "lodash"; // Import debounce

interface Lead extends ApiLead {}
interface User extends ApiUser {}
interface Meeting extends Omit<ApiMeeting, 'type' | 'lead_id'> {
    type: "meeting" | "demo";
    lead_id: string | null;
    start_time: string;
    end_time: string;
}

export default function SchedulePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [leads, setLeads] = useState<Lead[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingLeads, setIsFetchingLeads] = useState(false) // State for lead search
  const [availabilityError, setAvailabilityError] = useState<string | null>(null)
  const [showCalendar, setShowCalendar] = useState(false)
  const [busySlots, setBusySlots] = useState<{ start: string; end: string }[]>([])
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [confirmationMessage, setConfirmationMessage] = useState("")

  const [scheduleType, setScheduleType] = useState<"meeting" | "demo">("meeting")
  
  const [meetingTypeOptions, setMeetingTypeOptions] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    lead_id: "",
    assigned_to: "",
    start_time: "",
    duration: "60",
    meeting_type: "Discussion",
  })

  const calculatedEndTime = (() => {
     if (formData.start_time && formData.duration) {
         const durationInMinutes = parseInt(formData.duration, 10);
         if (!isNaN(durationInMinutes) && durationInMinutes > 0) {
             const start = new Date(formData.start_time);
             const end = new Date(start.getTime() + durationInMinutes * 60 * 1000);
             return format(end, "yyyy-MM-dd'T'HH:mm");
         }
     }
     return "";
   })();

  useEffect(() => {
    const storedUserData = localStorage.getItem("user");
    if (storedUserData) {
      setCurrentUser(JSON.parse(storedUserData));
    } else {
      router.push("/login");
    }
  }, [router]);

  // --- OPTIMIZATION: Fetch data without all leads initially ---
  useEffect(() => {
    if (!currentUser) {
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [usersData, meetingsData, demosData, meetingTypesData] = await Promise.all([
            api.getUsers(),
            api.getAllMeetings(),
            api.getAllDemos(),
            api.getByCategory("meeting_type")
        ]);

        setUsers(usersData.map((user: any) => ({ ...user, id: user.id.toString() })));
        
        const meetingTypes = meetingTypesData.map(item => item.value);
        setMeetingTypeOptions(meetingTypes);
        if (meetingTypes.length > 0 && !meetingTypes.includes(formData.meeting_type)) {
            setFormData(prev => ({ ...prev, meeting_type: meetingTypes[0] }));
        }

        const allEvents = [
          ...meetingsData.map(m => ({...m, start_time: m.event_time, end_time: m.event_end_time, type: 'meeting' as const})),
          ...demosData.map(d => ({...d, start_time: d.start_time, end_time: d.event_end_time, type: 'demo' as const}))
        ];
        
        setMeetings(allEvents.map(e => ({
          ...e,
          id: e.id.toString(),
          lead_id: e.lead_id ? e.lead_id.toString() : null,
        })));

      } catch (error) {
        console.error("Failed to fetch initial data:", error);
        toast({
          title: "Error",
          description: "Failed to load page data. Please refresh.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentUser, toast]);

  // --- OPTIMIZATION: Debounced function to search for leads ---
  const searchLeads = useCallback(
      debounce(async (searchTerm: string) => {
          if (searchTerm.length < 2) {
              setLeads([]);
              return;
          }
          setIsFetchingLeads(true);
          try {
              const allLeads = await api.getAllLeads();
              const filteredLeads = allLeads.filter(lead => 
                  lead.company_name.toLowerCase().includes(searchTerm.toLowerCase())
              );
              setLeads(filteredLeads.map(lead => ({ ...lead, id: lead.id.toString() })));
          } catch (error) {
              toast({ title: "Error", description: "Could not search for leads." });
          } finally {
              setIsFetchingLeads(false);
          }
      }, 300),
      [toast]
  );

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setAvailabilityError(null)
    setShowCalendar(false)
  }

  const checkAvailability = (assignedToUsername: string, startTime: string, endTime: string): boolean => {
    if (!startTime || !endTime) return true;
    const start = new Date(startTime);
    const end = new Date(endTime);
    const assignedUser = users.find(u => u.username === assignedToUsername);
    if (!assignedUser) {
        console.warn("Could not find user to check availability.");
        return true;
    }
    const conflicts = meetings.filter((meeting) => {
      const isAssigned = meeting.assigned_to === assignedUser.username || meeting.assigned_to === assignedUser.usernumber;
      if (!isAssigned) return false;
      const meetingStart = new Date(meeting.start_time);
      const meetingEnd = new Date(meeting.end_time);
      return start < meetingEnd && end > meetingStart;
    });
    if (conflicts.length > 0) {
      setBusySlots(conflicts.map(m => ({ start: m.start_time, end: m.end_time })));
      return false;
    }
    return true;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!calculatedEndTime) {
        toast({ title: "Error", description: "Invalid start time or duration.", variant: "destructive" });
        return;
    }
    setIsLoading(true);
    setAvailabilityError(null);

    const assignedUser = users.find((u) => u.username === formData.assigned_to);
    if (!assignedUser || !currentUser || !formData.lead_id) {
      toast({ title: "Error", description: "Missing required form data.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    try {
      if (!checkAvailability(formData.assigned_to, formData.start_time, calculatedEndTime)) {
        setAvailabilityError(`${formData.assigned_to} is unavailable at the selected time.`);
        setShowCalendar(true);
        setIsLoading(false);
        return;
      }
      
      const payload = {
        lead_id: Number.parseInt(formData.lead_id),
        assigned_to_user_id: Number.parseInt(assignedUser.id),
        start_time: new Date(formData.start_time).toISOString(),
        end_time: new Date(calculatedEndTime).toISOString(),
        created_by_user_id: currentUser.id,
      };

      if (scheduleType === "meeting") {
        await api.scheduleMeeting({ ...payload, meeting_type: formData.meeting_type });
      } else {
        await api.scheduleDemo(payload);
      }
      
      const selectedLead = leads.find(l => l.id === formData.lead_id);
      setConfirmationMessage(`${scheduleType === "meeting" ? "Meeting" : "Demo"} has been scheduled successfully for ${selectedLead?.company_name}.`);
      setShowConfirmation(true);

    } catch (error) {
      console.error(`Failed to schedule ${scheduleType}:`, error);
      const errorMessage = error instanceof Error ? error.message : `An unknown error occurred.`;
      
      setAvailabilityError(errorMessage);
      if (errorMessage.includes("unavailable") || errorMessage.includes("booked")) {
          setShowCalendar(true); 
      }
      
      toast({
        title: "Scheduling Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleConfirmation = () => {
    setShowConfirmation(false)
    router.push("/dashboard/events");
  }

  return (
    <div className="space-y-3 sm:space-y-6">
          <div className="px-1">
            <h1 className="text-xl sm:text-3xl font-bold tracking-tight">Schedule Meeting/Demo</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Schedule a meeting or demo with a lead</p>
          </div>
    
          <Card className="border-0 sm:border shadow-none sm:shadow-sm">
            <CardContent className="px-3 sm:px-6 pt-6">
              <div className="flex gap-2">
                <Button type="button" variant={scheduleType === "meeting" ? "default" : "outline"} onClick={() => setScheduleType("meeting")} className="flex-1 h-9 text-sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Meeting
                </Button>
                <Button type="button" variant={scheduleType === "demo" ? "default" : "outline"} onClick={() => setScheduleType("demo")} className="flex-1 h-9 text-sm">
                  <Monitor className="h-4 w-4 mr-2" />
                  Schedule Demo
                </Button>
              </div>
            </CardContent>
          </Card>
    
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card className="border-0 sm:border shadow-none sm:shadow-sm">
                <CardHeader className="pb-3 sm:pb-6">
                  <CardTitle className="text-lg sm:text-xl">
                    {scheduleType === "meeting" ? "Meeting" : "Demo"} Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 sm:px-6">
                  <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-6">
                    <div className="space-y-1">
                      <Label htmlFor="lead_id" className="text-xs sm:text-sm">Lead Name *</Label>
                      {/* --- OPTIMIZATION: Replaced Autocomplete with searchable Select --- */}
                      <Select
                          value={formData.lead_id}
                          onValueChange={(value) => handleInputChange("lead_id", value)}
                      >
                          <SelectTrigger className="h-8 sm:h-10 text-sm w-full min-w-0 overflow-hidden">
                              <SelectValue placeholder="Type to search for a lead..." />
                          </SelectTrigger>
                          <SelectContent>
                              <div className="p-2">
                                  <Input
                                      placeholder="Search by company name..."
                                      onChange={(e) => searchLeads(e.target.value)}
                                      autoFocus
                                  />
                              </div>
                              {isFetchingLeads && (
                                  <div className="flex items-center justify-center p-2">
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                  </div>
                              )}
                              {leads.length > 0 ? (
                                  leads.map(lead => <SelectItem key={lead.id} value={String(lead.id)}>{lead.company_name}</SelectItem>)
                              ) : (
                                  !isFetchingLeads && <div className="p-2 text-center text-sm text-muted-foreground">No leads found.</div>
                              )}
                          </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-3 grid-cols-2">
                      <div className="space-y-1">
                        <Label htmlFor="assigned_to" className="text-xs sm:text-sm">Assigned To *</Label>
                        <Select value={formData.assigned_to} onValueChange={(value) => handleInputChange("assigned_to", value)}>
                          <SelectTrigger className="h-8 sm:h-10 text-sm"><SelectValue placeholder="Select user" /></SelectTrigger>
                          <SelectContent>{users.map((user) => (<SelectItem key={user.id} value={user.username}>{user.username}</SelectItem>))}</SelectContent>
                        </Select>
                      </div>

                      {scheduleType === "meeting" && (
                        <div className="space-y-1">
                          <Label htmlFor="meeting_type" className="text-xs sm:text-sm">Meeting Type *</Label>
                          <Select value={formData.meeting_type} onValueChange={(value) => handleInputChange("meeting_type", value)}>
                            <SelectTrigger className="h-8 sm:h-10 text-sm"><SelectValue placeholder="Select type" /></SelectTrigger>
                            <SelectContent>{meetingTypeOptions.map(opt => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}</SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
    
                    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label htmlFor="start_time" className="text-xs sm:text-sm">Start Date & Time *</Label>
                        <Input id="start_time" type="datetime-local" value={formData.start_time} onChange={(e) => handleInputChange("start_time", e.target.value)} required className="h-8 sm:h-10 text-sm" />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="duration" className="text-xs sm:text-sm">Duration (minutes) *</Label>
                        <Input id="duration" type="number" value={formData.duration} onChange={(e) => handleInputChange("duration", e.target.value)} required min="1" className="h-8 sm:h-10 text-sm" />
                      </div>
                    </div>
                    
                    {calculatedEndTime && (<div className="text-sm text-muted-foreground">Calculated End Time: {new Date(calculatedEndTime).toLocaleString()}</div>)}
    
                    {availabilityError && (<Alert variant="destructive" className="py-2"><AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" /><AlertDescription className="text-xs sm:text-sm">{availabilityError}</AlertDescription></Alert>)}
    
                    {showCalendar && busySlots.length > 0 && (
                      <Card className="border-0 sm:border">
                        <CardHeader className="pb-2 sm:pb-4"><CardTitle className="text-sm sm:text-lg">{formData.assigned_to}'s Busy Schedule</CardTitle></CardHeader>
                        <CardContent className="px-3 sm:px-6">
                          <div className="space-y-2">
                            <p className="text-xs sm:text-sm text-muted-foreground">Existing meetings/demos:</p>
                            {busySlots.map((slot, index) => (<div key={index} className="flex items-center justify-between p-2 bg-muted rounded text-xs sm:text-sm"><span>{new Date(slot.start).toLocaleString()} - {new Date(slot.end).toLocaleString()}</span></div>))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
    
                    <div className="flex gap-2 pt-2">
                      <Button type="submit" disabled={isLoading || !formData.lead_id || !formData.assigned_to || !formData.start_time} className="flex-1 h-9 text-sm">
                        {isLoading ? "Scheduling..." : `Schedule ${scheduleType === "meeting" ? "Meeting" : "Demo"}`}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => router.back()} className="h-9 text-sm px-4">Cancel</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
    
            <div className="lg:col-span-1">
              <UserAvailabilityCalendar selectedDate={formData.start_time ? new Date(formData.start_time) : new Date()} selectedUser={formData.assigned_to} className="h-fit" />
            </div>
          </div>
    
          <ConfirmationDialog open={showConfirmation} onOpenChange={setShowConfirmation} title="Success" message={confirmationMessage} onConfirm={handleConfirmation} />
        </div>
      )
}