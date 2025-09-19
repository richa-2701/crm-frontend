
"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { api, type ApiUser } from "@/lib/api"
import { Loader2, Copy, Info, ExternalLink } from "lucide-react" // Added ExternalLink icon
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { format } from "date-fns"

export default function GoogleCalendarPage() {
    const { toast } = useToast();
    const [allEvents, setAllEvents] = useState<any[]>([]);
    const [currentUser, setCurrentUser] = useState<ApiUser | null>(null);
    const [allUsers, setAllUsers] = useState<ApiUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [subscriptionUrl, setSubscriptionUrl] = useState("");
    const [userLegend, setUserLegend] = useState<Record<string, string>>({});
    const [selectedUserFilter, setSelectedUserFilter] = useState<string>("all");

    const stringToColor = (str: string) => {
        if (!str) return '#808080';
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        let color = '#';
        for (let i = 0; i < 3; i++) {
            const value = (hash >> (i * 8)) & 0xFF;
            color += ('00' + value.toString(16)).substr(-2);
        }
        return color;
    }

    const fetchCalendarData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [eventData, usersData] = await Promise.all([
                api.getAllCalendarEvents(), // This fetches all CRM events for display
                api.getUsers()
            ]);

            setAllUsers(usersData);
            const legend: Record<string, string> = {};
            const formattedEvents = eventData.map(event => {
                const assignee = event.extendedProps.assignee;
                if (assignee) {
                    const color = stringToColor(assignee);
                    if (!legend[assignee]) {
                        legend[assignee] = color;
                    }
                    return { ...event, backgroundColor: color, borderColor: color };
                }
                return event;
            });
            setAllEvents(formattedEvents);
            setUserLegend(legend);
        } catch (err) {
            console.error("Failed to fetch calendar data:", err);
            toast({
                title: "Error",
                description: "Could not load calendar data.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        const userJson = localStorage.getItem("user");
        if(userJson) {
            const user = JSON.parse(userJson);
            setCurrentUser(user);
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
            // Ensure this URL is correctly pointing to your backend's ICS feed
            setSubscriptionUrl(`${apiUrl}/web/calendar/subscribe/${user.id}`);
        }
        fetchCalendarData();
    }, [fetchCalendarData]);
    
    const filteredEvents = useMemo(() => {
        if (selectedUserFilter === "all") {
            return allEvents;
        }
        return allEvents.filter((event: any) => event.extendedProps.assignee === selectedUserFilter);
    }, [allEvents, selectedUserFilter]);

    const handleCopyUrl = () => {
        navigator.clipboard.writeText(subscriptionUrl);
        toast({ title: "Success", description: "Subscription URL copied to clipboard!" });
    };

    // New function to open Google Calendar "Add by URL"
    const handleAddToGoogleCalendar = () => {
        const googleCalendarUrl = `https://calendar.google.com/calendar/r/settings/addbyurl?url=${encodeURIComponent(subscriptionUrl)}`;
        window.open(googleCalendarUrl, '_blank');
    };
    
    const renderEventContent = (eventInfo: any) => {
        const { event } = eventInfo;
        const { extendedProps } = event;

        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="fc-event-main-frame w-full overflow-hidden whitespace-nowrap">
                        <div className="fc-event-time">{eventInfo.timeText}</div>
                        <div className="fc-event-title-container">
                            <div className="fc-event-title fc-sticky">{event.title}</div>
                        </div>
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p className="font-bold">{event.title}</p>
                    <p><strong>Assignee:</strong> {extendedProps.assignee}</p>
                    {event.start && event.end &&
                        <p>
                            <strong>Time: </strong>
                            {format(event.start, "p")} - {format(event.end, "p")}
                        </p>
                    }
                </TooltipContent>
            </Tooltip>
        );
    };

    if (isLoading && !allEvents.length) {
        return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <TooltipProvider>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Team Calendar</h1>
                    <p className="text-muted-foreground">View all scheduled meetings and demos for your team.</p>
                </div>
                
                <Card>
                    <CardHeader>
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                            {/* Left Side: Legend and Filter */}
                            <div className="flex-1 space-y-4">
                                <div>
                                    <CardTitle className="text-base mb-2">User Legend</CardTitle>
                                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                                        {Object.entries(userLegend).map(([username, color]) => (
                                            <div key={username} className="flex items-center gap-2 text-sm">
                                                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                                                <span>{username}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="w-full md:w-48">
                                    <Label>Filter by User</Label>
                                     <Select value={selectedUserFilter} onValueChange={setSelectedUserFilter}>
                                        <SelectTrigger><SelectValue/></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Users</SelectItem>
                                            {allUsers.map(user => (
                                                <SelectItem key={user.id} value={user.username}>{user.username}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            
                            {/* Right Side: Sync instructions, now in a details accordion */}
                            <details className="text-sm border rounded-lg p-3 md:max-w-md">
                                <summary className="cursor-pointer font-medium text-primary flex items-center gap-2">
                                    <Info className="h-4 w-4" />
                                    <span>Sync Your Personal CRM Schedule to Google Calendar</span>
                                </summary>
                                <div className="mt-3 space-y-3">
                                     <AlertDescription className="text-gray-700">
                                        Copy your unique subscription URL below. This URL provides *your* assigned CRM meetings and demos.
                                        <br/><br/>
                                        **How to add to Google Calendar:**
                                        <ol className="list-decimal list-inside pl-4 mt-2 space-y-1">
                                            <li>Copy the URL.</li>
                                            <li>Go to Google Calendar.</li>
                                            <li>Under "Other calendars", click the <span className="font-bold">+</span> icon.</li>
                                            <li>Select "From URL" and paste the link.</li>
                                            <li>**Important:** Google Calendar may take several hours to refresh. If events are out of sync, you may need to **remove and re-add** the calendar in Google to force an update.</li>
                                        </ol>
                                      </AlertDescription>
                                    <div className="flex items-center gap-2">
                                        <Input value={subscriptionUrl} readOnly className="h-8" />
                                        <Button onClick={handleCopyUrl} size="icon" variant="outline" className="h-8 w-8 flex-shrink-0">
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <Button onClick={handleAddToGoogleCalendar} variant="secondary" className="w-full">
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                        Add to Google Calendar (beta)
                                    </Button>
                                </div>
                            </details>
                        </div>
                    </CardHeader>
                    <CardContent className="p-2 md:p-4">
                        {isLoading ? (
                           <div className="flex justify-center items-center h-48">
                               <Loader2 className="h-6 w-6 animate-spin" />
                           </div>
                        ) : (
                           <FullCalendar
                                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                                initialView="dayGridMonth"
                                headerToolbar={{
                                    left: 'prev,next today',
                                    center: 'title',
                                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                                }}
                                events={filteredEvents}
                                eventContent={renderEventContent}
                                eventTimeFormat={{
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    meridiem: 'short'
                                }}
                                height="auto"
                            />
                        )}
                    </CardContent>
                </Card>
            </div>
        </TooltipProvider>
    );
}