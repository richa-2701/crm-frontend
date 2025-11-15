//frontend/app/dashboard/schedule/page.tsx
"use client"

import type React from "react"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { UserAvailabilityCalendar } from "@/components/ui/user-availability-calendar"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Calendar, Monitor, Loader2, Check, ChevronsUpDown, X } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { api, ApiUser, ApiMeeting, ApiDemo, type ApiLeadSearchResult } from "@/lib/api"
import { format } from 'date-fns';
import { debounce } from "lodash";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"


interface User extends ApiUser {}
interface Meeting extends Omit<ApiMeeting, 'type' | 'lead_id'> {
    type: "meeting" | "demo";
    lead_id: string | null;
    start_time: string;
    end_time: string;
    phase: string; 
    attendees?: string[];
}

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


export default function SchedulePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allLeads, setAllLeads] = useState<ApiLeadSearchResult[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<ApiLeadSearchResult[]>([]);
  const [hasFetchedInitialLeads, setHasFetchedInitialLeads] = useState(false);
  const [users, setUsers] = useState<User[]>([])
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFetchingLeads, setIsFetchingLeads] = useState(false)
  const [availabilityError, setAvailabilityError] = useState<string | null>(null)
  const [showCalendar, setShowCalendar] = useState(false)
  const [busySlots, setBusySlots] = useState<{ start: string; end: string }[]>([])
  // --- START OF FIX: Removed confirmation dialog state ---
  // const [showConfirmation, setShowConfirmation] = useState(false)
  // const [confirmationMessage, setConfirmationMessage] = useState("")
  // --- END OF FIX ---
  const [scheduleType, setScheduleType] = useState<"meeting" | "demo">("meeting")
  const [meetingTypeOptions, setMeetingTypeOptions] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    lead_id: "",
    assigned_to: "",
    start_time: "",
    duration: "60",
    meeting_type: "Discussion",
    attendees: [] as string[],
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

  // --- START OF FIX: Split data fetching for faster perceived load time ---
  useEffect(() => {
    if (!currentUser) return;

    // Fetch essential data for form rendering first
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const [usersData, meetingTypesData] = await Promise.all([
            api.getUsers(),
            api.getByCategory("meeting_type"),
        ]);
        
        // Sort users alphabetically before setting state
        const sortedUsers = usersData.sort((a, b) => a.username.localeCompare(b.username));
        setUsers(sortedUsers.map((user: any) => ({ ...user, id: user.id.toString() })));
        
        const meetingTypes = meetingTypesData.map(item => item.value);
        setMeetingTypeOptions(meetingTypes);
        if (meetingTypes.length > 0) {
            setFormData(prev => ({ ...prev, meeting_type: meetingTypes[0] }));
        }

      } catch (error) {
        console.error("Failed to fetch initial page data:", error);
        toast({ title: "Error", description: "Failed to load essential page data. Please refresh."});
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [currentUser, toast]);

  // Fetch non-essential availability data in the background
  useEffect(() => {
    if (!currentUser) return;

    const fetchAvailabilityData = async () => {
        try {
            const [meetingsData, demosData] = await Promise.all([
                api.getAllMeetings(),
                api.getAllDemos(),
            ]);

            const allEvents = [
              ...meetingsData.map(m => ({...m, start_time: m.event_time, end_time: m.event_end_time, type: 'meeting' as const})),
              ...demosData.map(d => ({...d, start_time: d.start_time, end_time: d.event_end_time, type: 'demo' as const}))
            ];
            
            setMeetings(allEvents.map(e => ({
              ...e,
              id: e.id.toString(),
              lead_id: e.lead_id ? e.lead_id.toString() : null,
              phase: e.phase, 
            })));
        } catch (error) {
            console.error("Failed to fetch availability data in background:", error);
            // Optionally show a non-blocking toast
            toast({ title: "Warning", description: "Could not load user availability data.", variant: "default" });
        }
    };
    
    fetchAvailabilityData();
  }, [currentUser, toast]);
  // --- END OF FIX ---

  const handleLeadDropdownOpen = async (open: boolean) => {
    if (open && !hasFetchedInitialLeads) {
        setIsFetchingLeads(true);
        try {
            const results = await api.searchLeads("");
            setAllLeads(results);
            setFilteredLeads(results);
            setHasFetchedInitialLeads(true);
        } catch (error) {
            toast({ title: "Error", description: "Could not fetch the list of leads." });
        } finally {
            setIsFetchingLeads(false);
        }
    }
  };

  const searchLeads = useCallback(
      debounce((searchTerm: string) => {
          if (!searchTerm) {
              setFilteredLeads(allLeads);
              return;
          }
          const filtered = allLeads.filter(lead => 
              lead.company_name.toLowerCase().includes(searchTerm.toLowerCase())
          );
          setFilteredLeads(filtered);
      }, 200),
      [allLeads]
  );
  
  const handleInputChange = (field: string, value: string | string[]) => {
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
      const isActive = meeting.phase === 'Scheduled' || meeting.phase === 'Rescheduled';
      if (!isActive) {
          return false; 
      }
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

  // --- START OF FIX: Reworked handleSubmit for immediate navigation ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true); // Show loader on button immediately

    if (!calculatedEndTime) {
        toast({ title: "Error", description: "Invalid start time or duration.", variant: "destructive" });
        setIsSubmitting(false);
        return;
    }
    setAvailabilityError(null);

    const assignedUser = users.find((u) => u.username === formData.assigned_to);
    if (!assignedUser || !currentUser || !formData.lead_id) {
      toast({ title: "Error", description: "Missing required form data.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }

    if (!checkAvailability(formData.assigned_to, formData.start_time, calculatedEndTime)) {
      setAvailabilityError(`${formData.assigned_to} is unavailable at the selected time.`);
      setShowCalendar(true);
      setIsSubmitting(false);
      return;
    }
    
    // Navigate immediately
    router.push("/dashboard/events");
    toast({ title: "Scheduling...", description: `Your ${scheduleType} is being scheduled in the background.` });
    
    // Perform API call in the background
    const scheduleInBackground = async () => {
        try {
            const utcStartTime = convertLocalStringToUtcIso(formData.start_time);
            const utcEndTime = convertLocalStringToUtcIso(calculatedEndTime);
            
            const allAttendees = Array.from(new Set([assignedUser.username, ...formData.attendees]));
            
            const companyAuthName = api.getCompanyAuthName();
            if (!companyAuthName) {
                throw new Error("Could not identify the company. Please log in again.");
            }

            const payload = {
                lead_id: Number.parseInt(formData.lead_id),
                assigned_to: assignedUser.username,
                event_time: utcStartTime,
                event_end_time: utcEndTime,
                created_by: currentUser.username,
                attendees: allAttendees, 
                company_auth_name: companyAuthName,
            };

            if (scheduleType === "meeting") {
                await api.scheduleMeeting({ ...payload, meeting_type: formData.meeting_type });
            } else {
                await api.scheduleDemo({ 
                    lead_id: payload.lead_id,
                    assigned_to: payload.assigned_to,
                    start_time: payload.event_time,
                    event_end_time: payload.event_end_time,
                    scheduled_by: payload.created_by,
                    attendees: allAttendees,
                    company_auth_name: companyAuthName,
                });
            }
            
            toast({ title: "Success!", description: `The ${scheduleType} has been scheduled successfully.` });

        } catch (error) {
            console.error(`Failed to schedule ${scheduleType} in background:`, error);
            const errorMessage = error instanceof Error ? error.message : `An unknown error occurred.`;
            toast({ title: "Scheduling Failed", description: `The ${scheduleType} could not be scheduled. ${errorMessage}`, variant: "destructive" });
        }
    };
    
    scheduleInBackground();
  }
  // --- END OF FIX ---


  if (isLoading) {
    return (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
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
                      <Select
                          value={formData.lead_id}
                          onValueChange={(value) => handleInputChange("lead_id", value)}
                          onOpenChange={handleLeadDropdownOpen}
                      >
                          <SelectTrigger className="h-8 sm:h-10 text-sm w-full min-w-0 overflow-hidden">
                              <SelectValue placeholder="Select or search for a lead..." />
                          </SelectTrigger>
                          <SelectContent>
                              <div className="p-2">
                                  <Input
                                      placeholder="Search by company name..."
                                      onChange={(e) => searchLeads(e.target.value)}
                                      onKeyDown={(e) => e.stopPropagation()}
                                      autoFocus
                                  />
                              </div>
                              <ScrollArea className="h-[200px]">
                                {isFetchingLeads ? (
                                    <div className="flex items-center justify-center p-2"><Loader2 className="h-4 w-4 animate-spin" /></div>
                                ) : filteredLeads.length > 0 ? (
                                    filteredLeads.map(lead => <SelectItem key={lead.id} value={String(lead.id)}>{lead.company_name}</SelectItem>)
                                ) : (
                                    <div className="p-2 text-center text-sm text-muted-foreground">No leads found.</div>
                                )}
                              </ScrollArea>
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

                    <div className="space-y-1">
                      <Label className="text-xs sm:text-sm">Other Attendees</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between h-auto min-h-[2.5rem]"
                          >
                            <div className="flex gap-1 flex-wrap">
                                {formData.attendees.length === 0 && <span className="font-normal text-muted-foreground">Select attendees...</span>}
                                {formData.attendees.map(username => (
                                    <Badge
                                    variant="secondary"
                                    key={username}
                                    className="mr-1"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleInputChange("attendees", formData.attendees.filter(u => u !== username));
                                    }}
                                    >
                                    {username}
                                    <X className="ml-1 h-3 w-3" />
                                    </Badge>
                                ))}
                            </div>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                          <Command>
                            <CommandInput placeholder="Search users..." />
                            <CommandEmpty>No user found.</CommandEmpty>
                            <CommandGroup>
                                <ScrollArea className="h-[200px]">
                                {users
                                    .filter(u => u.username !== formData.assigned_to)
                                    .map((user) => (
                                    <CommandItem
                                        key={user.id}
                                        value={user.username}
                                        onSelect={(currentValue) => {
                                        const newAttendees = formData.attendees.includes(currentValue)
                                            ? formData.attendees.filter(u => u !== currentValue)
                                            : [...formData.attendees, currentValue];
                                        handleInputChange("attendees", newAttendees);
                                        }}
                                    >
                                        <Check className={cn("mr-2 h-4 w-4", formData.attendees.includes(user.username) ? "opacity-100" : "opacity-0")} />
                                        {user.username}
                                    </CommandItem>
                                    ))}
                                </ScrollArea>
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
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
                      <Button type="submit" disabled={isSubmitting || !formData.lead_id || !formData.assigned_to || !formData.start_time} className="flex-1 h-9 text-sm">
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : `Schedule ${scheduleType === "meeting" ? "Meeting" : "Demo"}`}
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
    
        </div>
      )
}