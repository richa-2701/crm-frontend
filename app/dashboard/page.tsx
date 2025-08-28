//frontend/app/dashboard/page.tsx
"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"
import { Calendar, Clock, Users, Phone } from "lucide-react"
import { formatDate, formatTime, formatDateTime } from "@/lib/date-format"
import { api } from "@/lib/api"

interface User {
  id: number
  username: string
  email: string
  role: string
  department: string
  usernumber: string
}

interface Contact {
  id: number
  contact_name: string
  phone: string
  email: string | null
  designation: string | null
}

interface Lead {
  id: string
  company_name: string
  contacts: Contact[] // Updated to an array of contacts
  assigned_to: string
  status: string
  [key: string]: any
}

interface Meeting {
  id: string
  lead_id: string
  assigned_to: string
  event_time: string
  event_end_time?: string
  type: "meeting"
}

interface Demo {
  id: string
  lead_id: string
  assigned_to: string
  start_time: string
  event_end_time?: string
  type: "demo"
}

interface UnifiedEvent {
  id: string
  lead_id: string
  assigned_to: string
  start_time: string
  end_time: string
  type: "meeting" | "demo"
}

const chartConfig = {
  new: { // Changed from "New"
    label: "New Leads",
    color: "hsl(220, 85%, 55%)",
  },
  "In Progress": {
    label: "In Progress",
    color: "hsl(45, 95%, 50%)",
  },
  "Meeting Done": { // Changed from "Meeting Completed"
    label: "Meeting Done",
    color: "hsl(142, 85%, 45%)",
  },
  "Demo Done": { // Changed from "Demo Completed"
    label: "Demo Done",
    color: "hsl(262, 90%, 65%)",
  },
  Qualified: { // Added this new status based on your screenshot
    label: "Qualified",
    color: "hsl(25, 95%, 53%)", // Example color (orange)
  },
  Won: {
    label: "Won/Closed",
    color: "hsl(120, 85%, 40%)",
  },
  Lost: {
    label: "Lost",
    color: "hsl(0, 90%, 65%)",
  },
}

function TaskTypeIcon({ type }: { type: string }) {
  switch (type) {
    case "meeting":
      return <Users className="h-4 w-4" />
    case "demo":
      return <Calendar className="h-4 w-4" />
    case "follow-up":
      return <Phone className="h-4 w-4" />
    default:
      return <Clock className="h-4 w-4" />
  }
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [events, setEvents] = useState<UnifiedEvent[]>([])
  const [leadStatusData, setLeadStatusData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAllUpcoming, setShowAllUpcoming] = useState(false)
  const [showAllToday, setShowAllToday] = useState(false) // Added state for today's tasks

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const userData = localStorage.getItem("user")
        if (!userData) {
          setLoading(false)
          return
        }

        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)

        console.log("[v0] Fetching leads for dashboard...")
        const leadsData = await api.getAllLeads()
        console.log("[v0] All leads fetched successfully:", leadsData)

        // Filter leads for current user if not admin
        const filteredLeads =
          parsedUser.role === "admin"
            ? leadsData
            : leadsData.filter((lead) => lead.assigned_to === parsedUser.username)

        // Convert id to string for type compatibility
        setLeads(filteredLeads.map((lead) => ({
          ...lead,
          id: lead.id.toString(),
          contacts: lead.contacts ?? []
        })))

        console.log("[v0] Fetching meetings and demos from API...")
        try {
          console.log("[v0] Fetching scheduled meetings from API...")
          console.log("[v0] Fetching scheduled demos from API...")
          const [meetingsDataRaw, demosDataRaw] = await Promise.all([api.getScheduledMeetings(), api.getScheduledDemos()])

          console.log("[v0] Meetings fetched successfully:", meetingsDataRaw.length, "meetings")
          console.log("[v0] Demos fetched successfully:", demosDataRaw.length, "demos")

          // Transform meetingsDataRaw to Meeting[]
          const meetingsData: Meeting[] = meetingsDataRaw.map((meeting: any) => ({
            id: meeting.id.toString(),
            lead_id: meeting.lead_id.toString(),
            assigned_to: meeting.assigned_to,
            event_time: meeting.event_time,
            event_end_time: meeting.event_end_time,
            type: "meeting",
          }))

          // Transform demosDataRaw to Demo[]
          const demosData: Demo[] = demosDataRaw.map((demo: any) => ({
            id: demo.id.toString(),
            lead_id: demo.lead_id.toString(),
            assigned_to: demo.assigned_to,
            start_time: demo.start_time,
            event_end_time: demo.event_end_time,
            type: "demo",
          }))

          const allEvents: UnifiedEvent[] = [
            ...meetingsData.map((meeting) => ({
              id: meeting.id,
              lead_id: meeting.lead_id.toString(), // Ensure lead_id is string for consistent matching
              assigned_to: meeting.assigned_to,
              start_time: meeting.event_time,
              end_time: meeting.event_end_time || meeting.event_time,
              type: "meeting" as const,
            })),
            ...demosData.map((demo) => ({
              id: demo.id,
              lead_id: demo.lead_id.toString(), // Ensure lead_id is string for consistent matching
              assigned_to: demo.assigned_to,
              start_time: demo.start_time,
              end_time: demo.event_end_time || demo.start_time,
              type: "demo" as const,
            })),
          ]

          const filteredEvents =
            parsedUser.role === "admin"
              ? allEvents
              : allEvents.filter((event) => {
                  // Handle both username and phone number formats in assigned_to
                  return (
                    event.assigned_to === parsedUser.username ||
                    event.assigned_to === parsedUser.usernumber ||
                    event.assigned_to.toLowerCase().includes(parsedUser.username.toLowerCase())
                  )
                })

          console.log("[v0] Filtered events for user:", filteredEvents.length, "events")
          setEvents(filteredEvents)
        } catch (error) {
          console.error("[v0] Error fetching meetings/demos:", error)
          setEvents([])
        }

        // Calculate lead status data for pie chart
        const statusCounts = filteredLeads.reduce((acc, lead) => {
            const status = lead.status || "Unknown";
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const chartData = Object.entries(statusCounts).map(([status, count]) => ({
            name: status,
            value: count,
            // The `fill` property is what the <Cell> component uses directly.
            fill: chartConfig[status as keyof typeof chartConfig]?.color || "hsl(var(--muted))",
            label: chartConfig[status as keyof typeof chartConfig]?.label || status,
        }));

        setLeadStatusData(chartData)
      } catch (error) {
        console.error("[v0] Error loading dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  const getTodaysTasks = () => {
    const today = new Date();
    const todayString = today.toDateString();

    return events
      .filter((event) => {
        // Correct logic: check if the event's date is the same as today's date
        const eventDate = new Date(event.start_time);
        return eventDate.toDateString() === todayString;
      })
      .map((event) => {
        const lead = leads.find((l) => l.id.toString() === event.lead_id.toString());
        const primaryContact = lead?.contacts && lead.contacts.length > 0 ? lead.contacts[0] : null;
        
        const timeLabel = `${formatTime(event.start_time)} - ${formatTime(event.end_time)}`;
        
        return {
          id: event.id,
          type: event.type,
          title: `${event.type === "meeting" ? "Meeting" : "Demo"} - ${lead?.company_name || `Lead #${event.lead_id}`}`,
          time: timeLabel,
          contact: primaryContact?.contact_name || "Contact Info Pending",
        };
      });
  }

  const getUpcomingTasks = () => {
    const today = new Date()
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

    return events
      .filter((event) => {
        const eventDate = new Date(event.start_time)
        return eventDate > today && eventDate <= nextWeek
      })
      .map((event) => {
        const lead = leads.find((l) => l.id.toString() === event.lead_id.toString())
        // Safely get the first contact
        const primaryContact = lead?.contacts && lead.contacts.length > 0 ? lead.contacts[0] : null
        const eventDate = new Date(event.start_time)
        const endTime = new Date(event.end_time)
        const isToday = eventDate.toDateString() === today.toDateString()
        const isTomorrow = eventDate.toDateString() === new Date(today.getTime() + 24 * 60 * 60 * 1000).toDateString()

        let dateLabel = eventDate.toLocaleDateString()
        if (isToday) dateLabel = "Today"
        else if (isTomorrow) dateLabel = "Tomorrow"

        return {
          id: event.id,
          type: event.type,
          title: `${event.type === "meeting" ? "Meeting" : "Demo"} - ${lead?.company_name || `Lead #${event.lead_id}`}`, // Show lead ID instead of "Unknown"
          date: dateLabel,
          time: `${eventDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${endTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
          contact: primaryContact?.contact_name || "Contact Info Pending", // More descriptive fallback
        }
      })
  }

  const todaysTasks = getTodaysTasks()
  const upcomingTasks = getUpcomingTasks()

  if (!user) {
    return <div>Loading...</div>
  }

  if (loading) {
    return <div>Loading dashboard data...</div>
  }

  return (
    <div className="space-y-3 pb-20 md:pb-6 px-2 md:px-0">
      <div className="mb-3">
        <h1 className="text-xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-xs md:text-base text-muted-foreground">
          Welcome back, {user.username}!{user.role === "admin" ? " (Admin)" : " (User)"}
        </p>
      </div>

      <div className="grid gap-2 md:gap-4 grid-cols-1 lg:grid-cols-3">
        {/* Lead Status Pie Chart */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm md:text-lg">Lead Status Distribution</CardTitle>
            <CardDescription className="text-xs hidden md:block">
              {user.role === "admin"
                ? "Distribution of all leads by status"
                : "Distribution of your assigned leads by status"}
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="flex flex-col md:block">
              <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[150px] md:max-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <ChartTooltip
                      cursor={false}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload
                          const total = leadStatusData.reduce((sum, item) => sum + item.value, 0)
                          const percentage = total > 0 ? Math.round((data.value / total) * 100) : 0
                          return (
                            <div className="bg-background border border-border rounded-lg p-2 shadow-lg">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color }} />
                                <span className="font-medium text-sm">{data.label}</span>
                              </div>
                              <div className="text-sm text-muted-foreground mt-1">
                                Count: <span className="font-medium text-foreground">{data.value}</span>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Percentage: <span className="font-medium text-foreground">{percentage}%</span>
                              </div>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Pie
                      data={leadStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={60}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ value, percent }) => `${value} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                      labelLine={false}
                    >
                      {leadStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
              <div className="mt-2 grid grid-cols-2 gap-1 md:space-y-1 md:grid-cols-1">
                {leadStatusData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                      <span className="truncate text-xs font-medium" style={{ color: item.color }}>
                        {item.label}
                      </span>
                    </div>
                    <span className="font-bold text-xs bg-muted px-1 rounded">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm md:text-lg">Tasks Overview</CardTitle>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Today's Tasks */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-3 w-3" />
                  <h3 className="text-xs font-medium">Today</h3>
                </div>
                <div className="space-y-1 h-[180px] md:h-[280px] overflow-y-auto">
                  {todaysTasks.length > 0 ? (
                    <>
                      {(showAllToday ? todaysTasks : todaysTasks.slice(0, 5)).map((task) => (
                        <div key={task.id} className="flex items-center gap-2 rounded border p-1.5">
                          <TaskTypeIcon type={task.type} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{task.title}</p>
                            <div className="flex items-center justify-between">
                              <p className="text-xs text-muted-foreground truncate">{task.contact}</p>
                              <span className="text-xs text-muted-foreground">{task.time}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                      {todaysTasks.length > 5 && (
                        <button
                          onClick={() => setShowAllToday(!showAllToday)}
                          className="w-full text-xs text-blue-600 hover:text-blue-800 text-center py-1 hover:bg-blue-50 rounded transition-colors"
                        >
                          {showAllToday ? "Show Less" : `Show More (+${todaysTasks.length - 5} more)`}
                        </button>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">No tasks today</p>
                  )}
                </div>
              </div>

              {/* Upcoming Tasks (Next 7 Days) */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-3 w-3" />
                  <h3 className="text-xs font-medium">Upcoming (Next 7 Days)</h3>
                </div>
                <div className="space-y-1 h-[180px] md:h-[280px] overflow-y-auto">
                  {upcomingTasks.length > 0 ? (
                    <>
                      {(showAllUpcoming ? upcomingTasks : upcomingTasks.slice(0, 5)).map((task) => (
                        <div key={task.id} className="flex items-center gap-2 rounded border p-1.5">
                          <TaskTypeIcon type={task.type} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{task.title}</p>
                            <div className="flex items-center justify-between">
                              <p className="text-xs text-muted-foreground truncate">{task.contact}</p>
                              <span className="text-xs text-muted-foreground">
                                {task.date} {task.time}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                      {upcomingTasks.length > 5 && (
                        <button
                          onClick={() => setShowAllUpcoming(!showAllUpcoming)}
                          className="w-full text-xs text-blue-600 hover:text-blue-800 text-center py-1 hover:bg-blue-50 rounded transition-colors"
                        >
                          {showAllUpcoming ? "Show Less" : `Show More (+${upcomingTasks.length - 5} more)`}
                        </button>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">No upcoming tasks</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-2 md:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs font-medium">
              {user.role === "admin" ? "Total Leads" : "My Leads"}
            </CardTitle>
            <Users className="h-3 w-3 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-2">
            <div className="text-lg md:text-2xl font-bold">{leads.length}</div>
            <p className="text-xs text-muted-foreground">{user.role === "admin" ? "All leads" : "Assigned"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs font-medium">Today</CardTitle>
            <Calendar className="h-3 w-3 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-2">
            <div className="text-lg md:text-2xl font-bold">
              {todaysTasks.filter((t) => t.type === "meeting").length}
            </div>
            <p className="text-xs text-muted-foreground">Meetings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs font-medium">Demos</CardTitle>
            <Calendar className="h-3 w-3 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-2">
            <div className="text-lg md:text-2xl font-bold">{events.filter((e) => e.type === "demo").length}</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs font-medium">Rate</CardTitle>
            <Users className="h-3 w-3 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-2">
            <div className="text-lg md:text-2xl font-bold">
              {leads.length > 0 ? Math.round((leads.filter((l) => l.status === "Won").length / leads.length) * 100) : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">Conversion</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}