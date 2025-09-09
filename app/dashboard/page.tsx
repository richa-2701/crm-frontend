"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"
import { Calendar, Clock, Users, Phone, FileText, CheckCircle, MessageSquare, User as UserIcon, Monitor } from "lucide-react"
import { formatDate, formatTime } from "@/lib/date-format"
import { api, ApiUnifiedActivity, ApiUser } from "@/lib/api"
import { MarkAsDoneModal } from "@/components/activity/mark-as-done-modal"


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
  contacts: Contact[]
  assigned_to: string
  status: string
  [key: string]: any
}

interface UnifiedTask {
  id: string;
  numericId: number;
  lead_id: string;
  type: 'meeting' | 'demo' | 'reminder';
  activity_type_display: string;
  title: string;
  companyName: string;
  contactName: string;
  assignedTo: string;
  startTime: string;
  endTime: string;
  details: string;
}

const chartConfig = {
  new: { label: "New Leads", color: "hsl(220, 85%, 55%)" },
  "In Progress": { label: "In Progress", color: "hsl(45, 95%, 50%)" },
  "Meeting Scheduled": { label: "Meeting Scheduled", color: "hsl(180, 85%, 45%)" },
  "Demo Scheduled": { label: "Demo Scheduled", color: "hsl(195, 90%, 50%)" },
  "Meeting Done": { label: "Meeting Done", color: "hsl(142, 85%, 45%)" },
  "Demo Done": { label: "Demo Done", color: "hsl(262, 90%, 65%)" },
  Qualified: { label: "Qualified", color: "hsl(25, 95%, 53%)" },
  Won: { label: "Won/Closed", color: "hsl(120, 85%, 40%)" },
  Lost: { label: "Lost", color: "hsl(0, 90%, 65%)" },
  not_our_segment: { label: "Not Our Segment", color: "hsl(0, 0%, 60%)" },
}

function TaskTypeIcon({ type }: { type: string }) {
  const lowerType = type.toLowerCase();
  if (lowerType.includes("meeting")) return <Users className="h-4 w-4 text-blue-500" />;
  if (lowerType.includes("demo")) return <Monitor className="h-4 w-4 text-purple-500" />;
  if (lowerType.includes("follow-up") || lowerType.includes("call")) return <Phone className="h-4 w-4 text-green-500" />;
  if (lowerType.includes("whatsapp")) return <MessageSquare className="h-4 w-4 text-teal-500" />;
  return <CheckCircle className="h-4 w-4 text-gray-500" />;
}

function TaskCard({ task, onClick, isUpcoming = false }: { task: UnifiedTask; onClick: () => void; isUpcoming?: boolean }) {
  const timeString = task.endTime && new Date(task.startTime).getTime() !== new Date(task.endTime).getTime()
    ? `${formatTime(task.startTime)} - ${formatTime(task.endTime)}`
    : formatTime(task.startTime);

  return (
    <div
      key={task.id}
      className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors text-sm"
      onClick={onClick}
    >
      <TaskTypeIcon type={task.activity_type_display} />
      <div className="flex-1 min-w-0 space-y-1">
        <p className="font-semibold truncate" title={task.title}>{task.title}</p>
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex items-center gap-1.5">
            <UserIcon className="h-3 w-3" />
            <span className="truncate" title={task.contactName}>Contact: {task.contactName || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="h-3 w-3" />
            <span className="truncate" title={task.assignedTo}>Assignee: {task.assignedTo}</span>
          </div>
        </div>
      </div>
      <div className="text-xs font-semibold text-muted-foreground text-right flex-shrink-0">
        {isUpcoming ? (
          <div className="flex flex-col items-end">
            <span>{formatDate(task.startTime)}</span>
            <span className="font-normal text-gray-500 dark:text-gray-400">{timeString}</span>
          </div>
        ) : (
          <span>{timeString}</span>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [allTasks, setAllTasks] = useState<UnifiedTask[]>([])
  const [totalMeetings, setTotalMeetings] = useState(0);
  const [totalDemos, setTotalDemos] = useState(0);
  const [leadStatusData, setLeadStatusData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [activityToComplete, setActivityToComplete] = useState<ApiUnifiedActivity | null>(null);
  const [isDoneModalOpen, setDoneModalOpen] = useState(false);

  const loadDashboardData = useCallback(async (currentUser: User) => {
    try {
      setLoading(true);
      const [leadsData, allMeetings, allDemos, allActivities] = await Promise.all([
        api.getAllLeads(),
        api.getAllMeetings(),
        api.getAllDemos(),
        api.getAllActivities(currentUser.username)
      ]);

      const leadsMap = new Map<string, Lead>(leadsData.map(lead => [String(lead.id), { ...lead, id: String(lead.id), contacts: lead.contacts ?? [] }]));
      const filteredLeads = currentUser.role === "admin" ? leadsData : leadsData.filter(lead => lead.assigned_to === currentUser.username);
      setLeads(filteredLeads.map(lead => ({ ...lead, id: String(lead.id), contacts: lead.contacts ?? [] })));

      const pendingMeetings = allMeetings.filter(e => e.phase === "Scheduled" || e.phase === "Rescheduled");
      const pendingDemos = allDemos.filter(e => e.phase === "Scheduled" || e.phase === "Rescheduled");
      const pendingActivities = allActivities.filter(a => a.type === 'reminder' && a.status === 'pending');
      const combinedTasks: UnifiedTask[] = [];

      pendingMeetings.forEach(m => {
        const lead = leadsMap.get(String(m.lead_id));
        combinedTasks.push({
          id: `meeting-${m.id}`, numericId: m.id, lead_id: String(m.lead_id), type: 'meeting',
          activity_type_display: "Meeting", title: `${lead?.company_name || 'N/A'}`,
          companyName: lead?.company_name || 'Unknown Lead', contactName: lead?.contacts?.[0]?.contact_name || 'N/A',
          assignedTo: m.assigned_to, startTime: m.event_time, endTime: m.event_end_time,
          details: `Scheduled meeting with ${lead?.contacts?.[0]?.contact_name || 'contact'} at ${lead?.company_name || 'company'}.`
        });
      });

      pendingDemos.forEach(d => {
        const lead = leadsMap.get(String(d.lead_id));
        combinedTasks.push({
          id: `demo-${d.id}`, numericId: d.id, lead_id: String(d.lead_id), type: 'demo',
          activity_type_display: "Demo", title: `${lead?.company_name || 'N/A'}`,
          companyName: lead?.company_name || 'Unknown Lead', contactName: lead?.contacts?.[0]?.contact_name || 'N/A',
          assignedTo: d.assigned_to, startTime: d.start_time, endTime: d.event_end_time,
          details: `Scheduled demo with ${lead?.contacts?.[0]?.contact_name || 'contact'} at ${lead?.company_name || 'company'}.`
        });
      });

      pendingActivities.forEach(a => {
        const lead = leadsMap.get(String(a.lead_id));
        combinedTasks.push({
          id: `reminder-${a.id}`, numericId: a.id, lead_id: String(a.lead_id), type: 'reminder',
          activity_type_display: a.activity_type, title: `${a.activity_type}: ${lead?.company_name || 'N/A'}`,
          companyName: lead?.company_name || 'Unknown Lead', contactName: lead?.contacts?.[0]?.contact_name || 'N/A',
          assignedTo: a.details.split('assigned to ')[1] || currentUser.username,
          startTime: a.scheduled_for || new Date().toISOString(), endTime: a.scheduled_for || new Date().toISOString(),
          details: a.details
        });
      });

      combinedTasks.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
      setAllTasks(combinedTasks);
      
      setTotalMeetings(allMeetings.length);
      setTotalDemos(allDemos.length);

      const statusCounts = filteredLeads.reduce((acc, lead) => {
          const status = lead.status || "Unknown";
          acc[status] = (acc[status] || 0) + 1;
          return acc;
      }, {} as Record<string, number>);

      const chartData = Object.entries(statusCounts).map(([status, count]) => ({
          name: status, value: count,
          fill: chartConfig[status as keyof typeof chartConfig]?.color || "hsl(var(--muted))",
          label: chartConfig[status as keyof typeof chartConfig]?.label || status,
      }));

      setLeadStatusData(chartData)
    } catch (error) {
      console.error("[v0] Error loading dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }, []);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      setLoading(false);
      router.push("/login");
      return;
    }
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    loadDashboardData(parsedUser);
  }, [loadDashboardData, router]);
  
  const handleSuccess = () => {
    setDoneModalOpen(false);
    if(user) loadDashboardData(user);
  }

  const handleTaskClick = (task: UnifiedTask) => {
    if (task.type === 'meeting') {
        router.push(`/dashboard/post-meeting?leadId=${task.lead_id}&meetingId=${task.numericId}`);
    } else if (task.type === 'demo') {
        router.push(`/dashboard/post-demo?leadId=${task.lead_id}&demoId=${task.numericId}`);
    } else if (task.type === 'reminder') {
        setActivityToComplete({
            id: task.numericId, type: 'reminder', lead_id: parseInt(task.lead_id),
            company_name: task.companyName, activity_type: task.activity_type_display,
            details: task.details, status: 'pending', created_at: new Date().toISOString(),
            scheduled_for: task.startTime,
        });
        setDoneModalOpen(true);
    }
  };

  // --- REFINED FILTERING LOGIC ---
   const today = new Date();
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0); // Set to the beginning of tomorrow.

  const endOfNextWeek = new Date(today);
  endOfNextWeek.setDate(endOfNextWeek.getDate() + 7);
  endOfNextWeek.setHours(23, 59, 59, 999); // Set to the end of the 7th day.

  const todaysTasks = allTasks.filter(task => 
    new Date(task.startTime).toDateString() === today.toDateString()
  );

  const upcomingTasks = allTasks.filter(task => {
    const taskDate = new Date(task.startTime);
    // Task date is on or after tomorrow and within the next week.
    return taskDate >= tomorrow && taskDate <= endOfNextWeek;
  });

  // Today's tasks broken down by type
  const todaysMeetings = todaysTasks.filter(t => t.type === 'meeting');
  const todaysDemos = todaysTasks.filter(t => t.type === 'demo');
  const todaysActivities = todaysTasks.filter(t => t.type === 'reminder');

  // Upcoming tasks broken down by type
  const upcomingMeetings = upcomingTasks.filter(t => t.type === 'meeting');
  const upcomingDemos = upcomingTasks.filter(t => t.type === 'demo');
  const upcomingActivities = upcomingTasks.filter(t => t.type === 'reminder');


  if (loading || !user) {
    return <div className="flex h-screen items-center justify-center">Loading dashboard data...</div>
  }

  return (
    <>
      <div className="space-y-6 pb-6 px-2 md:px-0">
        <div className="mb-3">
          <h1 className="text-xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-xs md:text-base text-muted-foreground">
            Welcome back, {user.username}!{user.role === "admin" ? " (Admin)" : ""}
          </p>
        </div>

        {/* --- NEW LAYOUT: TASKS OVERVIEW IS NOW AT THE TOP --- */}
        <Card>
            <CardHeader>
                <CardTitle>Tasks Overview</CardTitle>
                <CardDescription>Click on any task to take action.</CardDescription>
            </CardHeader>
            <CardContent>
                {/* --- The main grid is now 3 columns on large screens --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Column 1: Meetings */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 px-1">
                            <Users className="h-5 w-5 text-blue-500" />
                            <h3 className="text-lg font-semibold">Meetings</h3>
                        </div>
                        <div className="space-y-4 rounded-lg border p-2">
                            <div>
                                <h4 className="text-sm font-semibold text-muted-foreground px-2 pb-2">Today</h4>
                                <div className="space-y-2 h-40 overflow-y-auto pr-2">
                                    {todaysMeetings.length > 0 ? (
                                        todaysMeetings.map((task) => (
                                            <TaskCard key={task.id} task={task} onClick={() => handleTaskClick(task)} />
                                        ))
                                    ) : (
                                        <p className="text-xs text-muted-foreground p-2 h-full flex items-center justify-center">No meetings today.</p>
                                    )}
                                </div>
                            </div>
                            <div className="pt-2">
                                <h4 className="text-sm font-semibold text-muted-foreground px-2 pb-2">Upcoming</h4>
                                <div className="space-y-2 h-40 overflow-y-auto pr-2">
                                    {upcomingMeetings.length > 0 ? (
                                        upcomingMeetings.map((task) => (
                                            <TaskCard key={task.id} task={task} onClick={() => handleTaskClick(task)} isUpcoming={true} />
                                        ))
                                    ) : (
                                        <p className="text-xs text-muted-foreground p-2 h-full flex items-center justify-center">No upcoming meetings.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Column 2: Demos */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 px-1">
                            <Monitor className="h-5 w-5 text-purple-500" />
                            <h3 className="text-lg font-semibold">Demos</h3>
                        </div>
                        <div className="space-y-4 rounded-lg border p-2">
                            <div>
                                <h4 className="text-sm font-semibold text-muted-foreground px-2 pb-2">Today</h4>
                                <div className="space-y-2 h-40 overflow-y-auto pr-2">
                                    {todaysDemos.length > 0 ? (
                                        todaysDemos.map((task) => (
                                            <TaskCard key={task.id} task={task} onClick={() => handleTaskClick(task)} />
                                        ))
                                    ) : (
                                        <p className="text-xs text-muted-foreground p-2 h-full flex items-center justify-center">No demos today.</p>
                                    )}
                                </div>
                            </div>
                            <div className="pt-2">
                                <h4 className="text-sm font-semibold text-muted-foreground px-2 pb-2">Upcoming</h4>
                                <div className="space-y-2 h-40 overflow-y-auto pr-2">
                                    {upcomingDemos.length > 0 ? (
                                        upcomingDemos.map((task) => (
                                            <TaskCard key={task.id} task={task} onClick={() => handleTaskClick(task)} isUpcoming={true}/>
                                        ))
                                    ) : (
                                        <p className="text-xs text-muted-foreground p-2 h-full flex items-center justify-center">No upcoming demos.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Column 3: Activities */}
                    <div className="space-y-4">
                         <div className="flex items-center gap-2 px-1">
                            <Phone className="h-5 w-5 text-green-500" />
                            <h3 className="text-lg font-semibold">Activities</h3>
                        </div>
                        <div className="space-y-4 rounded-lg border p-2">
                            <div>
                                <h4 className="text-sm font-semibold text-muted-foreground px-2 pb-2">Today</h4>
                                <div className="space-y-2 h-40 overflow-y-auto pr-2">
                                    {todaysActivities.length > 0 ? (
                                        todaysActivities.map((task) => (
                                            <TaskCard key={task.id} task={task} onClick={() => handleTaskClick(task)} />
                                        ))
                                    ) : (
                                        <p className="text-xs text-muted-foreground p-2 h-full flex items-center justify-center">No activities today.</p>
                                    )}
                                </div>
                            </div>
                            <div className="pt-2">
                                <h4 className="text-sm font-semibold text-muted-foreground px-2 pb-2">Upcoming</h4>
                                <div className="space-y-2 h-40 overflow-y-auto pr-2">
                                    {upcomingActivities.length > 0 ? (
                                        upcomingActivities.map((task) => (
                                            <TaskCard key={task.id} task={task} onClick={() => handleTaskClick(task)} isUpcoming={true}/>
                                        ))
                                    ) : (
                                        <p className="text-xs text-muted-foreground p-2 h-full flex items-center justify-center">No upcoming activities.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>

        {/* --- SUMMARY SECTION IS NOW SECOND --- */}
        <div className="grid gap-4 pt-4 grid-cols-1 lg:grid-cols-5">
            <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                <CardTitle className="text-sm md:text-lg">Lead Status Distribution</CardTitle>
                <CardDescription className="text-xs hidden md:block">
                    {user.role === "admin" ? "Distribution of all leads" : "Distribution of your leads"}
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
                                const data = payload[0].payload;
                                return (
                                <div className="bg-background border rounded-lg p-2 shadow-lg text-sm">
                                    {data.label}: <span className="font-bold">{data.value}</span>
                                </div>
                                );
                            }
                            return null;
                            }}
                        />
                        <Pie data={leadStatusData} dataKey="value" nameKey="label" cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={2}>
                            {leadStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    </ChartContainer>
                    <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 md:space-y-1 md:grid-cols-1">
                    {leadStatusData.map((item) => (
                        <div key={item.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.fill }} />
                            <span className="truncate">{item.label}</span>
                        </div>
                        <span className="font-bold">{item.value}</span>
                        </div>
                    ))}
                    </div>
                </div>
                </CardContent>
            </Card>

            <div className="lg:col-span-3 grid grid-cols-2 gap-4">
                <Link href="/dashboard/leads" className="block">
                    <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                        <CardTitle className="text-sm font-medium">{user.role === "admin" ? "Total Leads" : "My Leads"}</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="pb-2">
                        <div className="text-2xl font-bold">{leads.length}</div>
                        <p className="text-xs text-muted-foreground">{user.role === "admin" ? "All leads in system" : "Leads assigned to you"}</p>
                    </CardContent>
                    </Card>
                </Link>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                    <CardTitle className="text-sm font-medium">Today's Tasks</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="pb-2">
                    <div className="text-2xl font-bold">{todaysTasks.length}</div>
                    <p className="text-xs text-muted-foreground">Meetings, Demos & Activities</p>
                    </CardContent>
                </Card>
                <Link href="/dashboard/events" className="block">
                    <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                        <CardTitle className="text-sm font-medium">Events</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="pb-2">
                        <div className="flex divide-x">
                        <div className="pr-3 flex-1">
                            <div className="text-2xl font-bold">{totalMeetings}</div>
                            <p className="text-xs text-muted-foreground">Meetings</p>
                        </div>
                        <div className="pl-3 flex-1">
                            <div className="text-2xl font-bold">{totalDemos}</div>
                            <p className="text-xs text-muted-foreground">Demos</p>
                        </div>
                        </div>
                    </CardContent>
                    </Card>
                </Link>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                    <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="pb-2">
                    <div className="text-2xl font-bold">
                        {leads.length > 0 ? Math.round((leads.filter((l) => l.status === "Won").length / leads.length) * 100) : 0}%
                    </div>
                    <p className="text-xs text-muted-foreground">Based on your leads</p>
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>
      
      <MarkAsDoneModal
        activity={activityToComplete}
        currentUser={user}
        isOpen={isDoneModalOpen}
        onClose={() => setDoneModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </>
  )
}