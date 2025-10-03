// frontend/app/dashboard/page.tsx
"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"
import { Calendar, Clock, Users, Phone, FileText, CheckCircle, MessageSquare, User as UserIcon, Monitor, Building } from "lucide-react"
import { formatDate, formatTime } from "@/lib/date-format"
import { api, ApiUnifiedActivity, ApiUser, ApiMeeting, type ApiProposalSent, type ApiDemo } from "@/lib/api"
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
  lead_id: string | null;
  proposal_id?: string | null;
  original_lead_id?: number; // For navigating from a proposal task
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

const BASE_CHART_CONFIG = {
  new: { label: "New Leads", color: "hsl(220, 85%, 55%)" },
  "Meeting Scheduled": { label: "Meeting Scheduled", color: "hsl(180, 85%, 45%)" },
  "Demo Scheduled": { label: "Demo Scheduled", color: "hsl(195, 90%, 50%)" },
  "Meeting Done": { label: "Meeting Done", color: "hsl(142, 85%, 45%)" },
  "Demo Done": { label: "Demo Done", color: "hsl(280, 80%, 60%)" },
  "Won/Deal Done": { label: "Won/Closed", color: "hsl(120, 85%, 40%)" },
  Lost: { label: "Lost", color: "hsl(0, 90%, 65%)" },
  not_our_segment: { label: "Not Our Segment", color: "hsl(0, 0%, 60%)" },
  "Sales Proposal Send": { label: "Sales Proposal Send", color: "hsl(330, 85%, 60%)" },
  "4 Phase Meeting Done": { label: "4 Phase Meeting Done", color: "hsl(170, 75%, 40%)" },
  "4 Phase Meeting Pending": { label: "4 Phase Meeting Pending", color: "hsl(170, 60%, 65%)" },
  "Conversation Selling Discussion Done": { label: "Conv. Selling Done", color: "hsl(30, 90%, 55%)" },
  "Conversation Selling Discussion Pending": { label: "Conv. Selling Pending", color: "hsl(30, 80%, 70%)" },
  "Demo Pending": { label: "Demo Pending", color: "hsl(262, 70%, 75%)" },
}

const generateColorFromString = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 70%, 55%)`;
};

// --- START: NEW ANIMATED SKELETON LOADER COMPONENT ---
function DashboardSkeleton() {
  const SkeletonCard = () => <div className="h-full w-full bg-muted rounded-lg animate-pulse"></div>;
  const SkeletonTask = () => (
    <div className="flex items-start gap-3 p-2">
      <div className="h-5 w-5 bg-muted-foreground/20 rounded-md animate-pulse mt-1"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 w-3/4 bg-muted-foreground/20 rounded animate-pulse"></div>
        <div className="h-3 w-1/2 bg-muted-foreground/20 rounded animate-pulse"></div>
      </div>
      <div className="h-4 w-12 bg-muted-foreground/20 rounded animate-pulse"></div>
    </div>
  );

  return (
    <div className="space-y-6 pb-6 px-2 md:px-0">
      {/* Header Skeleton */}
      <div className="mb-3 space-y-2">
        <div className="h-8 w-48 bg-muted rounded animate-pulse"></div>
        <div className="h-5 w-64 bg-muted rounded animate-pulse"></div>
      </div>

      {/* Tasks Overview Skeleton */}
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 w-40 bg-muted rounded"></div>
          <div className="h-4 w-56 bg-muted rounded mt-1"></div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-4">
                <div className="h-6 w-24 bg-muted rounded"></div>
                <div className="space-y-4 rounded-lg border p-2">
                  <div>
                    <div className="h-4 w-16 bg-muted rounded mx-2 mb-2"></div>
                    <div className="space-y-2 h-48 pr-2">
                      <SkeletonTask />
                      <SkeletonTask />
                      <SkeletonTask />
                    </div>
                  </div>
                  <div className="pt-2">
                    <div className="h-4 w-20 bg-muted rounded mx-2 mb-2"></div>
                    <div className="space-y-2 h-48 pr-2">
                       <SkeletonTask />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary Section Skeleton */}
      <div className="grid gap-4 pt-4 grid-cols-1 lg:grid-cols-5">
        <div className="lg:col-span-2 h-[400px] bg-muted rounded-lg animate-pulse"></div>
        <div className="lg:col-span-3 grid grid-cols-2 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    </div>
  );
}
// --- END: NEW ANIMATED SKELETON LOADER COMPONENT ---


function TaskTypeIcon({ type }: { type: string }) {
  const lowerType = type.toLowerCase();
  if (lowerType.includes("meeting")) return <Users className="h-4 w-4 text-blue-500 mt-1" />;
  if (lowerType.includes("demo")) return <Monitor className="h-4 w-4 text-purple-500 mt-1" />;
  if (lowerType.includes("follow-up") || lowerType.includes("call")) return <Phone className="h-4 w-4 text-green-500 mt-1" />;
  if (lowerType.includes("whatsapp")) return <MessageSquare className="h-4 w-4 text-teal-500 mt-1" />;
  return <CheckCircle className="h-4 w-4 text-gray-500 mt-1" />;
}

function TaskCard({ task, onClick, isUpcoming = false }: { task: UnifiedTask; onClick: () => void; isUpcoming?: boolean }) {
  const timeString = task.endTime && new Date(task.startTime).getTime() !== new Date(task.endTime).getTime()
    ? `${formatTime(task.startTime)} - ${formatTime(task.endTime)}`
    : formatTime(task.startTime);

  return (
    <div
      key={task.id}
      className="flex items-start gap-3 rounded-lg border p-2 cursor-pointer hover:bg-muted/50 transition-colors text-sm"
      onClick={onClick}
    >
      <TaskTypeIcon type={task.title} />
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate text-sm" title={task.companyName}>{task.companyName}</p>
        <p className="text-xs text-primary font-medium truncate" title={task.activity_type_display}>{task.activity_type_display}</p>

        <div className="text-xs text-muted-foreground mt-1.5 space-y-1">
          <div className="flex items-center gap-1.5">
            <UserIcon className="h-3 w-3" />
            <span className="truncate" title={task.contactName}> {task.contactName || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="h-3 w-3" />
            <span className="truncate" title={task.assignedTo}>{task.assignedTo}</span>
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
  const [dynamicChartConfig, setDynamicChartConfig] = useState(BASE_CHART_CONFIG);

  const [activityToComplete, setActivityToComplete] = useState<ApiUnifiedActivity | null>(null);
  const [isDoneModalOpen, setDoneModalOpen] = useState(false);

  const loadDashboardData = useCallback(async (currentUser: User) => {
    try {
      setLoading(true);
      // --- START: FIX - Fetch proposals as well ---
      const [leadsData, proposalsData, allMeetings, allDemos, allActivities] = await Promise.all([
        api.getAllLeads(),
        api.getAllProposals(),
        api.getAllMeetings(),
        api.getAllDemos(),
        api.getAllActivities(currentUser.username)
      ]);

      const leadsMap = new Map<string, Lead>(leadsData.map(lead => [String(lead.id), { ...lead, id: String(lead.id), contacts: lead.contacts ?? [] }]));
      const proposalsMap = new Map<string, ApiProposalSent>(proposalsData.map(p => [String(p.id), p]));
      // --- END: FIX ---

      const filteredLeads = currentUser.role === "admin" ? leadsData : leadsData.filter(lead => lead.assigned_to === currentUser.username);
      setLeads(filteredLeads.map(lead => ({ ...lead, id: String(lead.id), contacts: lead.contacts ?? [] })));

      const pendingMeetings = allMeetings.filter(e => e.phase === "Scheduled" || e.phase === "Rescheduled");
      const pendingDemos = allDemos.filter(e => e.phase === "Scheduled" || e.phase === "Rescheduled");
      const pendingActivities = allActivities.filter(a => a.type === 'reminder' && a.status === 'pending');
      const combinedTasks: UnifiedTask[] = [];

      // --- START: FIX - Handle meetings linked to leads OR proposals ---
      pendingMeetings.forEach(m => {
        let parent: Lead | ApiProposalSent | undefined;
        if (m.lead_id) {
            parent = leadsMap.get(String(m.lead_id));
        } else if (m.proposal_id) {
            parent = proposalsMap.get(String(m.proposal_id));
        }

        combinedTasks.push({
          id: `meeting-${m.id}`, numericId: m.id, 
          lead_id: m.lead_id ? String(m.lead_id) : null,
          proposal_id: m.proposal_id ? String(m.proposal_id) : null,
          original_lead_id: (parent as ApiProposalSent)?.original_lead_id,
          type: 'meeting',
          title: "Meeting",
          activity_type_display: m.meeting_type || "General Meeting",
          companyName: parent?.company_name || 'Unknown',
          contactName: parent?.contacts?.[0]?.contact_name || 'N/A',
          assignedTo: m.assigned_to, startTime: m.event_time, endTime: m.event_end_time,
          details: `Scheduled meeting with ${parent?.contacts?.[0]?.contact_name || 'contact'} at ${parent?.company_name || 'company'}.`
        });
      });

      pendingDemos.forEach(d => {
        let parent: Lead | ApiProposalSent | undefined;
        if (d.lead_id) {
            parent = leadsMap.get(String(d.lead_id));
        } else if (d.proposal_id) {
            parent = proposalsMap.get(String(d.proposal_id));
        }

        combinedTasks.push({
          id: `demo-${d.id}`, numericId: d.id,
          lead_id: d.lead_id ? String(d.lead_id) : null,
          proposal_id: d.proposal_id ? String(d.proposal_id) : null,
          original_lead_id: (parent as ApiProposalSent)?.original_lead_id,
          type: 'demo',
          title: "Demo",
          activity_type_display: "Product Demo",
          companyName: parent?.company_name || 'Unknown',
          contactName: parent?.contacts?.[0]?.contact_name || 'N/A',
          assignedTo: d.assigned_to, startTime: d.start_time, endTime: d.event_end_time,
          details: `Scheduled demo with ${parent?.contacts?.[0]?.contact_name || 'contact'} at ${parent?.company_name || 'company'}.`
        });
      });
      // --- END: FIX ---

      pendingActivities.forEach(a => {
        const lead = leadsMap.get(String(a.lead_id));
        if (lead) { // Only process reminders for active leads
            combinedTasks.push({
              id: `reminder-${a.id}`, numericId: a.id, lead_id: String(a.lead_id), type: 'reminder',
              title: a.activity_type,
              activity_type_display: a.details,
              companyName: lead.company_name,
              contactName: lead.contacts?.[0]?.contact_name || 'N/A',
              assignedTo: a.details.split('assigned to ')[1] || currentUser.username,
              startTime: a.scheduled_for || new Date().toISOString(), endTime: a.scheduled_for || new Date().toISOString(),
              details: a.details
            });
        }
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

      const finalChartConfig = { ...BASE_CHART_CONFIG };
      const chartData = Object.entries(statusCounts).map(([status, count]) => {
        let configEntry = finalChartConfig[status as keyof typeof finalChartConfig];

        if (!configEntry) {
          const newColor = generateColorFromString(status);
          configEntry = { label: status, color: newColor };
          finalChartConfig[status as keyof typeof finalChartConfig] = configEntry;
        }

        return {
          name: status,
          value: count,
          fill: configEntry.color,
          label: configEntry.label,
        };
      });

      setLeadStatusData(chartData);
      setDynamicChartConfig(finalChartConfig);

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
    // --- START: FIX - Handle navigation for proposal-linked tasks ---
    const leadIdForNav = task.original_lead_id || task.lead_id;

    if (task.type === 'meeting') {
        router.push(`/dashboard/post-meeting?leadId=${leadIdForNav}&meetingId=${task.numericId}`);
    } else if (task.type === 'demo') {
        router.push(`/dashboard/post-demo?leadId=${leadIdForNav}&demoId=${task.numericId}`);
    } else if (task.type === 'reminder' && task.lead_id) { // Reminders should always have a lead_id
        setActivityToComplete({
            id: task.numericId, type: 'reminder', lead_id: parseInt(task.lead_id),
            company_name: task.companyName, activity_type: task.activity_type_display,
            details: task.details, status: 'pending', created_at: new Date().toISOString(),
            scheduled_for: task.startTime,
        });
        setDoneModalOpen(true);
    }
    // --- END: FIX ---
  };

   const today = new Date();

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const endOfNextWeek = new Date(today);
  endOfNextWeek.setDate(endOfNextWeek.getDate() + 7);
  endOfNextWeek.setHours(23, 59, 59, 999);

  const todaysTasks = allTasks.filter(task =>
    new Date(task.startTime).toDateString() === today.toDateString()
  );

  const upcomingTasks = allTasks.filter(task => {
    const taskDate = new Date(task.startTime);
    return taskDate >= tomorrow && taskDate <= endOfNextWeek;
  });

  const todaysMeetings = todaysTasks.filter(t => t.type === 'meeting');
  const todaysDemos = todaysTasks.filter(t => t.type === 'demo');
  const todaysActivities = todaysTasks.filter(t => t.type === 'reminder');

  const upcomingMeetings = upcomingTasks.filter(t => t.type === 'meeting');
  const upcomingDemos = upcomingTasks.filter(t => t.type === 'demo');
  const upcomingActivities = upcomingTasks.filter(t => t.type === 'reminder');


  // --- START: CHANGE - RENDER SKELETON WHILE LOADING ---
  if (loading || !user) {
    // This now renders our attractive skeleton loader instead of just text
    return <DashboardSkeleton />;
  }
  // --- END: CHANGE ---

  return (
    <>
      <div className="space-y-6 pb-6 px-2 md:px-0">
        <div className="mb-3">
          <h1 className="text-xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-xs md:text-base text-muted-foreground">
            Welcome back, {user.username}!{user.role === "admin" ? " (Admin)" : ""}
          </p>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Tasks Overview</CardTitle>
                <CardDescription>Click on any task to take action.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    <div className="space-y-4">
                        <div className="flex items-center gap-2 px-1">
                            <Users className="h-5 w-5 text-blue-500" />
                            <h3 className="text-lg font-semibold">Meetings</h3>
                        </div>
                        <div className="space-y-4 rounded-lg border p-2">
                            <div>
                                <h4 className="text-sm font-semibold text-muted-foreground px-2 pb-2">Today</h4>
                                <div className="space-y-2 h-48 overflow-y-auto pr-2">
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
                                <div className="space-y-2 h-48 overflow-y-auto pr-2">
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

                    <div className="space-y-4">
                        <div className="flex items-center gap-2 px-1">
                            <Monitor className="h-5 w-5 text-purple-500" />
                            <h3 className="text-lg font-semibold">Demos</h3>
                        </div>
                        <div className="space-y-4 rounded-lg border p-2">
                            <div>
                                <h4 className="text-sm font-semibold text-muted-foreground px-2 pb-2">Today</h4>
                                <div className="space-y-2 h-48 overflow-y-auto pr-2">
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
                                <div className="space-y-2 h-48 overflow-y-auto pr-2">
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

                    <div className="space-y-4">
                         <div className="flex items-center gap-2 px-1">
                            <Phone className="h-5 w-5 text-green-500" />
                            <h3 className="text-lg font-semibold">Activities</h3>
                        </div>
                        <div className="space-y-4 rounded-lg border p-2">
                            <div>
                                <h4 className="text-sm font-semibold text-muted-foreground px-2 pb-2">Today</h4>
                                <div className="space-y-2 h-48 overflow-y-auto pr-2">
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
                                <div className="space-y-2 h-48 overflow-y-auto pr-2">
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
                    <ChartContainer config={dynamicChartConfig} className="mx-auto aspect-square max-h-[150px] md:max-h-[250px]">
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
                        {leads.length > 0 ? `${((leads.filter((l) => l.status === "Won/Deal Done").length / leads.length) * 100).toFixed(1)}%` : "0%"}
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