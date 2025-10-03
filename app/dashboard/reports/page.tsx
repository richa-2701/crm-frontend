// frontend/app/dashboard/reports/page.tsx
"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, } from "@/components/ui/dialog"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend } from "@/components/ui/chart" 
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts" 
import { Calendar as CalendarIcon, Users, Target, Activity, CheckCircle, Percent, Handshake, Download, FileSpreadsheet, Loader2 } from "lucide-react"
import { DateRange } from "react-day-picker"
import { format, subDays } from "date-fns"
import { api, reportApi, ApiUser, ApiReportData } from "@/lib/api"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/use-toast"


import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable' 
import html2canvas from 'html2canvas'

const PIE_CHART_COLORS = ["hsl(122, 40%, 50%)", "hsl(2, 80%, 60%)", "hsl(220, 5%, 60%)"];

// --- KPI Card Component ---
function KpiCard({ title, value, icon: Icon, description }: { title: string, value: string | number, icon: React.ElementType, description: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

// --- Main Report Page Component ---
export default function ReportsPage() {
  const { user: currentUser, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

  const [reportData, setReportData] = useState<ApiReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPdfExporting, setIsPdfExporting] = useState(false);
  const [isExcelExporting, setIsExcelExporting] = useState(false);

  // --- START: New state for the export modal ---
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportDateRange, setExportDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });
  // --- END: New state for the export modal ---

  const totalLeadsInPeriod = useMemo(() => {
    if (!reportData) return 0;
    return reportData.visualizations.lead_outcome.reduce((sum, item) => sum + item.value, 0);
  }, [reportData]);

  const chartConfig = {
      "Deals Won": { label: "Deals Won", color: "hsl(142.1, 76.2%, 41.2%)" },
      "Leads Lost": { label: "Leads Lost", color: "hsl(0, 84.2%, 60.2%)" },
      "In Progress": { label: "In Progress", color: "hsl(221.2, 83.2%, 53.3%)" },
  }

  useEffect(() => {
    if (authLoading || !currentUser) return;

    async function fetchUsers() {
      try {
        const userList = await api.getUsers();
        setUsers(userList);
        
        if (currentUser.role !== 'admin') {
            setSelectedUserId(String(currentUser.id));
        } else if (userList.length > 0) {
            setSelectedUserId(String(userList[0].id));
        }
      } catch (err) {
        setError("Failed to load users.");
      }
    }
    fetchUsers();
  }, [currentUser, authLoading]);

  const generateReport = useCallback(async () => {
    if (!selectedUserId || !dateRange?.from || !dateRange?.to) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await api.getUserPerformanceReport(
        parseInt(selectedUserId),
        format(dateRange.from, "yyyy-MM-dd"),
        format(dateRange.to, "yyyy-MM-dd")
      );
      setReportData(data);
    } catch (err) {
      setError("Failed to generate the report. Please try again.");
      setReportData(null);
    } finally {
      setLoading(false);
    }
  }, [selectedUserId, dateRange]);

  useEffect(() => {
    if (selectedUserId && dateRange?.from && dateRange?.to) {
      generateReport();
    }
  }, [selectedUserId, dateRange, generateReport]);

  const handleExportToPDF = async () => {
    if (!reportData) return;
    setIsPdfExporting(true);

    const pdf = new jsPDF('p', 'mm', 'a4');
    let currentY = 20;
    const pageMargin = 15;
    const pageWidth = pdf.internal.pageSize.getWidth() - pageMargin * 2;
    
    const selectedUser = users.find(u => u.id === parseInt(selectedUserId));
    pdf.setFontSize(22).setFont("helvetica", "bold");
    pdf.text('User Performance Report', pdf.internal.pageSize.getWidth() / 2, currentY, { align: 'center' });
    currentY += 15;
    
    pdf.setFontSize(12).setFont("helvetica", "normal");
    pdf.text(`User: ${selectedUser?.username || 'N/A'}`, pageMargin, currentY);
    pdf.text(`Period: ${format(dateRange!.from!, 'dd/MM/yyyy')} - ${format(dateRange!.to!, 'dd/MM/yyyy')}`, pdf.internal.pageSize.getWidth() - pageMargin, currentY, { align: 'right' });
    currentY += 15;

    const kpiSection = document.getElementById('kpi-summary-section');
    if (kpiSection) {
        const canvas = await html2canvas(kpiSection, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const imgHeight = (canvas.height * pageWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', pageMargin, currentY, pageWidth, imgHeight);
        currentY += imgHeight + 10;
    }

    const activityChartSection = document.getElementById('activity-volume-chart');
    if (activityChartSection) {
        const canvas = await html2canvas(activityChartSection, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const imgHeight = (canvas.height * pageWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', pageMargin, currentY, pageWidth, imgHeight);
        currentY += imgHeight + 10;
    }
    
    if (currentY > 200) { // Check if we need a new page
        pdf.addPage();
        currentY = 20;
    }

    const outcomeChartSection = document.getElementById('lead-outcome-chart');
    if (outcomeChartSection) {
        const canvas = await html2canvas(outcomeChartSection, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const chartWidth = pageWidth;
        const imgHeight = (canvas.height * chartWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', pageMargin, currentY, chartWidth, imgHeight);
        currentY += imgHeight + 15;
    }

    if (reportData.tables.deals_won.length > 0) {
      if (currentY > 220) { // Check if table needs a new page
          pdf.addPage();
          currentY = 20;
      }
      
      pdf.setFontSize(16).setFont("helvetica", "bold");
      pdf.text('Deals Won Details', pageMargin, currentY);
      
      const tableStartY = currentY + 8;

      const tableHead = [['Client Name', 'Source', 'Converted Date', 'Time to Close (Days)']];
      const tableBody = reportData.tables.deals_won.map(deal => [
        deal.client_name,
        deal.source,
        format(new Date(deal.converted_date), "LLL dd, y"),
        deal.time_to_close
      ]);

      autoTable(pdf, {
        head: tableHead,
        body: tableBody,
        startY: tableStartY,
        margin: { left: pageMargin, right: pageMargin },
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] }
      });
    }

    const fileName = `Report_${selectedUser?.username}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    pdf.save(fileName);
    setIsPdfExporting(false);
  };
  
  // --- START: Modified function to accept a date range ---
  const handleExportToExcel = async (exportRange: DateRange) => {
    if (!exportRange?.from || !exportRange?.to) {
      toast({ title: "Error", description: "Please select a valid date range for the export.", variant: "destructive" });
      return;
    }
    setIsExcelExporting(true);
    try {
      const blob = await reportApi.exportSummaryReport(
        format(exportRange.from, "yyyy-MM-dd"),
        format(exportRange.to, "yyyy-MM-dd")
      );
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `User_Performance_Summary_${format(exportRange.from, "yyyy-MM-dd")}_to_${format(exportRange.to, "yyyy-MM-dd")}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      toast({ title: "Export Successful", description: "The performance summary has been downloaded." });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      toast({ title: "Export Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsExcelExporting(false);
      setIsExportModalOpen(false); // Close the modal
    }
  };
  // --- END: Modified function ---


  if (authLoading) {
    return <div className="flex h-screen items-center justify-center">Authenticating...</div>
  }
  
  const kpis = reportData?.kpi_summary;

  return (
    <>
      <div className="space-y-6 pb-6 px-2 md:px-0">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3 gap-2">
          <div>
            <h1 className="text-xl md:text-3xl font-bold tracking-tight">User Performance Report</h1>
            <p className="text-xs md:text-base text-muted-foreground">
              Analyze user performance for a selected time period.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleExportToPDF} disabled={!reportData || isPdfExporting || loading} variant="outline">
              {isPdfExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Export to PDF
            </Button>
            {currentUser?.role === 'admin' && (
              // --- START: This button now opens the modal ---
              <Button onClick={() => setIsExportModalOpen(true)} disabled={isExcelExporting || loading}>
                {isExcelExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSpreadsheet className="mr-2 h-4 w-4" />}
                Export Summary (Excel)
              </Button>
              // --- END: Button modification ---
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Select a user and a date range to generate the report.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-1 block">User</label>
              <Select
                value={selectedUserId}
                onValueChange={setSelectedUserId}
                disabled={!currentUser || currentUser.role !== 'admin'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(u => (
                    <SelectItem key={u.id} value={String(u.id)}>{u.username}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-1 block">Date Range</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        `${format(dateRange.from, "LLL dd, y")} - ${format(dateRange.to, "LLL dd, y")}`
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={setDateRange}
                    initialFocus
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>
        
        {loading && <div className="text-center p-8">Generating Report...</div>}
        {error && <div className="text-center p-8 text-destructive">{error}</div>}

        {reportData && !loading && (
          <div className="space-y-6">
            <div id="kpi-summary-section" className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <KpiCard title="New Leads Assigned" value={kpis?.new_leads_assigned ?? 0} icon={Users} description="Total leads assigned in period" />
              <KpiCard title="Meetings Completed" value={kpis?.meetings_completed ?? 0} icon={Handshake} description="Total meetings marked 'Done'" />
              <KpiCard title="Demos Completed" value={kpis?.demos_completed ?? 0} icon={CheckCircle} description="Total demos marked 'Done'" />
              <KpiCard title="Activities Logged" value={kpis?.activities_logged ?? 0} icon={Activity} description="Calls, notes, and follow-ups" />
              <KpiCard title="Deals Won" value={kpis?.deals_won ?? 0} icon={Target} description="Leads converted to clients" />
              <KpiCard title="Conversion Rate" value={`${kpis?.conversion_rate ?? 0}%`} icon={Percent} description="Deals won vs. deals closed" />
            </div>

            <div className="grid gap-6 lg:grid-cols-5">
              <Card className="lg:col-span-3" id="activity-volume-chart">
                <CardHeader>
                  <CardTitle>Activity Volume</CardTitle>
                  <CardDescription>Comparison of key activities performed.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={{}} className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={reportData.visualizations.activity_volume} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="value" fill="hsl(220, 85%, 55%)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                      </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
              <Card className="lg:col-span-2" id="lead-outcome-chart">
                <CardHeader>
                  <CardTitle>Lead Outcome</CardTitle>
                  <CardDescription>Status of leads assigned in the period.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col items-center justify-center pb-6">
                  <ChartContainer
                      config={chartConfig}
                      className="mx-auto aspect-square h-[200px]"
                  >
                      <PieChart>
                          <Tooltip
                              cursor={false}
                              content={<ChartTooltipContent hideLabel />}
                          />
                          <Pie
                              data={reportData.visualizations.lead_outcome}
                              dataKey="value"
                              nameKey="name"
                              innerRadius={60}
                              outerRadius={80}
                              strokeWidth={2}
                          >
                            {reportData.visualizations.lead_outcome.map((entry) => (
                                  <Cell key={`cell-${entry.name}`} fill={chartConfig[entry.name as keyof typeof chartConfig]?.color} />
                              ))}
                          </Pie>
                          <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-2xl font-bold">
                              {totalLeadsInPeriod.toLocaleString()}
                          </text>
                          <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" dy="20" className="fill-muted-foreground text-sm">
                              Leads
                          </text>
                      </PieChart>
                  </ChartContainer>
                  <div className="flex items-center justify-center gap-4 text-sm font-medium pt-4">
                      {reportData.visualizations.lead_outcome.map((entry) => {
                          if (entry.value > 0) {
                              return (
                                  <div key={entry.name} className="flex items-center gap-2">
                                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: chartConfig[entry.name as keyof typeof chartConfig].color }} />
                                      {chartConfig[entry.name as keyof typeof chartConfig].label} ({entry.value})
                                  </div>
                              )
                          }
                          return null;
                      })}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                  <CardTitle>Deals Won Details</CardTitle>
                  <CardDescription>A list of all leads converted to clients in this period.</CardDescription>
              </CardHeader>
              <CardContent>
                  <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead>Client Name</TableHead>
                              <TableHead>Source</TableHead>
                              <TableHead>Converted Date</TableHead>
                              <TableHead className="text-right">Time to Close (Days)</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {reportData.tables.deals_won.length > 0 ? (
                              reportData.tables.deals_won.map((deal, index) => (
                                  <TableRow key={index}>
                                      <TableCell className="font-medium">{deal.client_name}</TableCell>
                                      <TableCell>{deal.source}</TableCell>
                                      <TableCell>{format(new Date(deal.converted_date), "LLL dd, y")}</TableCell>
                                      <TableCell className="text-right">{deal.time_to_close}</TableCell>
                                  </TableRow>
                              ))
                          ) : (
                              <TableRow>
                                  <TableCell colSpan={4} className="h-24 text-center">No deals were won in this period.</TableCell>
                              </TableRow>
                          )}
                      </TableBody>
                  </Table>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* --- START: New Export Summary Modal --- */}
      <Dialog open={isExportModalOpen} onOpenChange={setIsExportModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Export Performance Summary</DialogTitle>
            <DialogDescription>
              Select the time period for the Excel summary report. The report will include all users.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="grid gap-2">
                <label className="text-sm font-medium">Date Range for Export</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {exportDateRange?.from ? (
                        exportDateRange.to ? (
                          `${format(exportDateRange.from, "LLL dd, y")} - ${format(exportDateRange.to, "LLL dd, y")}`
                        ) : (
                          format(exportDateRange.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={exportDateRange}
                      onSelect={setExportDateRange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExportModalOpen(false)}>Cancel</Button>
            <Button onClick={() => handleExportToExcel(exportDateRange!)} disabled={isExcelExporting || !exportDateRange?.from || !exportDateRange?.to}>
              {isExcelExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Confirm Export
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* --- END: New Export Summary Modal --- */}
    </>
  );
}