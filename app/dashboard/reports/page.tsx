"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart" 
// --- FIX: Import LabelList for the bar chart ---
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LabelList } from "recharts" 
import { Calendar as CalendarIcon, Users, Target, Activity, CheckCircle, Percent, Handshake, Download, FileSpreadsheet, Loader2, Search } from "lucide-react"
import { DateRange } from "react-day-picker"
import { format, subDays } from "date-fns"
import { api, reportApi, ApiUser, ApiReportData } from "@/lib/api"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/use-toast"
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable' 
import html2canvas from 'html2canvas'
import * as XLSX from 'xlsx';

// --- Detail Modal Component ---
interface ReportDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: { id?: number; client_id?: number; company_name: string }[] | null;
}

function ReportDetailModal({ isOpen, onClose, title, data }: ReportDetailModalProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredData = useMemo(() => {
    if (!data) return [];
    return data.filter(item => 
      item.company_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  useEffect(() => {
    setSearchTerm("");
  }, [isOpen, data]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            List of companies for the selected period. Found {filteredData.length} of {data?.length || 0} records.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter by company name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="max-h-[400px] overflow-y-auto pr-2">
            {filteredData.length > 0 ? (
              <ul className="space-y-2">
                {filteredData.map((item, index) => (
                  <li key={item.id || item.client_id || index} className="text-sm p-2 bg-muted/50 rounded-md">
                    {item.company_name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-sm text-muted-foreground py-8">No matching companies found.</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


// --- KPI Card Component (Clickable) ---
function KpiCard({ title, value, icon: Icon, description, onClick }: { title: string, value: string | number, icon: React.ElementType, description: string, onClick?: () => void }) {
  const isClickable = !!onClick;
  return (
    <Card 
      onClick={onClick} 
      className={isClickable ? "cursor-pointer hover:bg-muted/50 transition-colors" : ""}
    >
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isDetailModalOpen, setDetailModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<{ title: string; data: any[] | null }>({ title: '', data: null });

  const [isPdfExporting, setIsPdfExporting] = useState(false);
  const [isExcelExporting, setIsExcelExporting] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportDateRange, setExportDateRange] = useState<DateRange | undefined>({ from: subDays(new Date(), 29), to: new Date() });

  const totalLeadsInPeriod = useMemo(() => {
    if (!reportData?.visualizations?.lead_outcome) return 0;
    return reportData.visualizations.lead_outcome.reduce((sum, item) => sum + item.value, 0);
  }, [reportData]);
  
  const chartConfig = {
      "Deals Won": { label: "Deals Won", color: "hsl(142.1, 76.2%, 41.2%)" },
      "Leads Lost": { label: "Leads Lost", color: "hsl(0, 84.2%, 60.2%)" },
      "In Progress": { label: "In Progress", color: "hsl(221.2, 83.2%, 53.3%)" },
  };

  useEffect(() => {
    if (authLoading) return;
    async function fetchUsers() {
      try {
        const userList = await api.getUsers();
        setUsers(userList);
        
        if (currentUser?.role !== 'admin' && currentUser?.id) {
            setSelectedUserId(String(currentUser.id));
        } else if (userList.length > 0) {
            setSelectedUserId(String(userList[0].id));
        } else {
            setLoading(false);
        }
      } catch (err) {
        setError("Failed to load users list.");
        toast({ title: "Error", description: "Could not fetch the list of users.", variant: "destructive"});
        setLoading(false);
      }
    }
    fetchUsers();
  }, [currentUser, authLoading, toast]);

  const generateReport = useCallback(async () => {
    if (!selectedUserId || !dateRange?.from || !dateRange?.to) {
      return;
    }
    setLoading(true);
    setError(null);
    setReportData(null);
    try {
      const data = await api.getUserPerformanceReport(
        parseInt(selectedUserId),
        format(dateRange.from, "yyyy-MM-dd"),
        format(dateRange.to, "yyyy-MM-dd")
      );
      setReportData(data);
    } catch (err: any) {
      const errorMessage = err.message || "An unknown error occurred while generating the report.";
      setError(errorMessage);
      toast({ title: "Report Generation Failed", description: errorMessage, variant: "destructive"});
      setReportData(null);
    } finally {
      setLoading(false);
    }
  }, [selectedUserId, dateRange, toast]);

  useEffect(() => {
    if (selectedUserId && dateRange?.from && dateRange?.to) {
      generateReport();
    }
  }, [selectedUserId, dateRange, generateReport]);

  const handleKpiCardClick = (title: string, data: any[] | null) => {
    if (!data || data.length === 0) {
      toast({ title: "No Data", description: `There are no items to show for "${title}".` });
      return;
    }
    setModalContent({ title, data });
    setDetailModalOpen(true);
  };
  
  const handleExportToPDF = async () => {
    if (!reportData) return;
    setIsPdfExporting(true);
    toast({ title: "Generating PDF...", description: "This may take a moment." });

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      let currentY = 15;
      const pageMargin = 15;
      const pageWidth = pdf.internal.pageSize.getWidth() - pageMargin * 2;
      
      const selectedUserName = users.find(u => u.id === parseInt(selectedUserId))?.username || 'N/A';
      pdf.setFontSize(20).setFont("helvetica", "bold");
      pdf.text('User Performance Report', pdf.internal.pageSize.getWidth() / 2, currentY, { align: 'center' });
      currentY += 10;
      
      pdf.setFontSize(11).setFont("helvetica", "normal");
      pdf.text(`User: ${selectedUserName}`, pageMargin, currentY);
      pdf.text(`Period: ${format(dateRange!.from!, 'dd MMM, yyyy')} - ${format(dateRange!.to!, 'dd MMM, yyyy')}`, pdf.internal.pageSize.getWidth() - pageMargin, currentY, { align: 'right' });
      currentY += 15;

      const kpiSection = document.getElementById('kpi-summary-section');
      if (kpiSection) {
        const canvas = await html2canvas(kpiSection, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const imgHeight = (canvas.height * pageWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', pageMargin, currentY, pageWidth, imgHeight);
        currentY += imgHeight + 10;
      }
      
      const chartSection = document.getElementById('charts-section');
      if (chartSection) {
        const canvas = await html2canvas(chartSection, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const imgHeight = (canvas.height * pageWidth) / canvas.width;
        if (currentY + imgHeight > pdf.internal.pageSize.getHeight() - 20) {
            pdf.addPage();
            currentY = 15;
        }
        pdf.addImage(imgData, 'PNG', pageMargin, currentY, pageWidth, imgHeight);
        currentY += imgHeight + 10;
      }
      
      if (reportData.tables.deals_won.length > 0) {
        if (currentY > pdf.internal.pageSize.getHeight() - 40) {
          pdf.addPage();
          currentY = 15;
        }
        autoTable(pdf, {
          startY: currentY,
          head: [['Client Name', 'Source', 'Converted Date', 'Time to Close (Days)']],
          body: reportData.tables.deals_won.map(deal => [
            deal.company_name,
            deal.source,
            format(new Date(deal.converted_date), "dd MMM, y"),
            deal.time_to_close
          ]),
          margin: { left: pageMargin, right: pageMargin },
          theme: 'striped',
          headStyles: { fillColor: [41, 128, 185] }
        });
      }

      const fileName = `Report_${selectedUserName}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      pdf.save(fileName);
      toast({ title: "Success", description: "PDF has been downloaded." });
    } catch (e) {
      console.error("PDF Export Error:", e);
      toast({ title: "Error", description: "Failed to generate PDF.", variant: "destructive" });
    } finally {
      setIsPdfExporting(false);
    }
  };
  
  const handleExportToExcel = async (exportRange: DateRange | undefined) => {
    if (!exportRange?.from || !exportRange?.to) {
      toast({ title: "Error", description: "Please select a valid date range for the export.", variant: "destructive" });
      return;
    }
    setIsExcelExporting(true);
    toast({ title: "Generating Excel...", description: "Fetching summary data for all users." });

    try {
      const summaryData = await reportApi.exportSummaryReport(
        format(exportRange.from, "yyyy-MM-dd"),
        format(exportRange.to, "yyyy-MM-dd")
      );

      if (!summaryData || summaryData.length === 0) {
        toast({ title: "No Data", description: "No summary data found for the selected period." });
        return;
      }
      
      const worksheet = XLSX.utils.json_to_sheet(summaryData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "User Performance Summary");

      const columnWidths = Object.keys(summaryData[0]).map(key => ({
          wch: Math.max(key.length, ...summaryData.map((row: any) => (row[key] || '').toString().length)) + 2
      }));
      worksheet["!cols"] = columnWidths;
      
      const fileName = `User_Performance_Summary_${format(exportRange.from, "yyyy-MM-dd")}_to_${format(exportRange.to, "yyyy-MM-dd")}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast({ title: "Export Successful", description: "The performance summary has been downloaded." });
    } catch (err: any) {
      const errorMessage = err.message || "An unknown error occurred.";
      toast({ title: "Export Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsExcelExporting(false);
      setIsExportModalOpen(false);
    }
  };

  if (authLoading && !currentUser) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
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
                    <Button onClick={() => setIsExportModalOpen(true)} disabled={isExcelExporting}>
                        <FileSpreadsheet className="mr-2 h-4 w-4" /> Export Summary (Excel)
                    </Button>
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
              <Select value={selectedUserId} onValueChange={setSelectedUserId} disabled={!currentUser || currentUser.role !== 'admin'}>
                <SelectTrigger><SelectValue placeholder="Select a user" /></SelectTrigger>
                <SelectContent>
                  {users.map(u => (<SelectItem key={u.id} value={String(u.id)}>{u.username}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-1 block">Date Range</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (dateRange.to ? `${format(dateRange.from, "LLL dd, y")} - ${format(dateRange.to, "LLL dd, y")}` : format(dateRange.from, "LLL dd, y")) : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="range" selected={dateRange} onSelect={setDateRange} initialFocus numberOfMonths={2}/>
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>
        
        {loading && <div className="text-center p-16 flex flex-col items-center justify-center"><Loader2 className="h-8 w-8 animate-spin mb-4" /><p>Generating Report...</p></div>}
        {error && <div className="text-center p-16 text-destructive bg-destructive/10 rounded-lg">{error}</div>}

        {reportData && !loading && (
          <div className="space-y-6">
            <div id="kpi-summary-section" className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <KpiCard title="New Leads Assigned" value={kpis?.new_leads_assigned ?? 0} icon={Users} description="Total leads assigned in period" onClick={() => handleKpiCardClick('New Leads Assigned', reportData.details.new_leads_assigned)} />
              <KpiCard title="Meetings Completed" value={kpis?.meetings_completed ?? 0} icon={Handshake} description="Total meetings marked 'Done'" onClick={() => handleKpiCardClick('Meetings Completed', reportData.details.meetings_completed)} />
              <KpiCard title="Demos Completed" value={kpis?.demos_completed ?? 0} icon={CheckCircle} description="Total demos marked 'Done'" onClick={() => handleKpiCardClick('Demos Completed', reportData.details.demos_completed)} />
              <KpiCard title="Activities Logged" value={kpis?.activities_logged ?? 0} icon={Activity} description="Calls, notes, and follow-ups" onClick={() => handleKpiCardClick('Activities Logged', reportData.details.activities_logged)} />
              <KpiCard title="Deals Won" value={kpis?.deals_won ?? 0} icon={Target} description="Leads converted to clients" onClick={() => handleKpiCardClick('Deals Won', reportData.tables.deals_won)} />
              <KpiCard title="Conversion Rate" value={`${kpis?.conversion_rate ?? 0}%`} icon={Percent} description="Deals won vs. deals closed" />
            </div>

            <div id="charts-section" className="grid gap-6 lg:grid-cols-5">
              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle>Activity Volume</CardTitle>
                  <CardDescription>Comparison of key activities performed in the period.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={{}} className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={reportData.visualizations.activity_volume} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis allowDecimals={false} />
                          <Tooltip content={<ChartTooltipContent />} cursor={{ fill: 'hsl(var(--muted))' }} />
                          <Bar dataKey="value" fill="hsl(220, 85%, 55%)" radius={[4, 4, 0, 0]}>
                            {/* THIS IS THE FIX: This LabelList component renders the value on top of each bar. */}
                            <LabelList dataKey="value" position="top" style={{ fill: "hsl(var(--foreground))", fontSize: 12 }} />
                          </Bar>
                      </BarChart>
                      </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Lead Outcome</CardTitle>
                  <CardDescription>Status of all leads handled in the period.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col items-center justify-center pb-6">
                  <ChartContainer config={chartConfig} className="mx-auto aspect-square h-[200px]">
                      <PieChart>
                          <Tooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                          <Pie data={reportData.visualizations.lead_outcome} dataKey="value" nameKey="name" innerRadius={60} outerRadius={80} strokeWidth={2}>
                            {reportData.visualizations.lead_outcome.map((entry) => (<Cell key={`cell-${entry.name}`} fill={chartConfig[entry.name as keyof typeof chartConfig]?.color || "#cccccc"} />))}
                          </Pie>
                          <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-2xl font-bold">{totalLeadsInPeriod.toLocaleString()}</text>
                          <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" dy="20" className="fill-muted-foreground text-sm">Leads</text>
                      </PieChart>
                  </ChartContainer>
                  <div className="flex items-center justify-center flex-wrap gap-x-4 gap-y-2 text-sm font-medium pt-4">
                      {reportData.visualizations.lead_outcome.map((entry) => (
                          entry.value > 0 && (
                            <div key={entry.name} className="flex items-center gap-2">
                                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: chartConfig[entry.name as keyof typeof chartConfig].color }} />
                                {chartConfig[entry.name as keyof typeof chartConfig].label} ({entry.value})
                            </div>
                          )
                      ))}
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
                              reportData.tables.deals_won.map((deal) => (
                                  <TableRow key={deal.client_id}>
                                      <TableCell className="font-medium">{deal.company_name}</TableCell>
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

      <ReportDetailModal 
        isOpen={isDetailModalOpen} 
        onClose={() => setDetailModalOpen(false)} 
        title={modalContent.title}
        data={modalContent.data}
      />
      
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
            <Button onClick={() => handleExportToExcel(exportDateRange)} disabled={isExcelExporting || !exportDateRange?.from || !exportDateRange?.to}>
              {isExcelExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Confirm Export
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}