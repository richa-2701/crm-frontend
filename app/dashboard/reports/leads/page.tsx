"use client"

import { useState, useCallback } from "react"
import { reportApi } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import {
  Calendar as CalendarIcon,
  Loader2,
  BarChart2,
  Search,
  TrendingUp,
  UserCheck,
  Clock,
  XCircle,
} from "lucide-react"
import { DateRange } from "react-day-picker"
import { format, subDays } from "date-fns"

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

interface LeadItem {
  Id: number
  CompanyName: string
  Source: string
  Status: string
  AssignedTo: string
  CreatedAt: string
  Segment: string
  IsConverted: boolean
}

interface LeadsReportData {
  TotalLeads: number
  Converted: number
  InProgress: number
  Lost: number
  AllLeads: LeadItem[]
  ConvertedList: LeadItem[]
  InProgressList: LeadItem[]
  LostList: LeadItem[]
}

// ─────────────────────────────────────────────────────────────
// LEAD DETAIL MODAL
// ─────────────────────────────────────────────────────────────

function LeadDetailModal({
  open,
  onClose,
  title,
  leads,
}: {
  open: boolean
  onClose: () => void
  title: string
  leads: LeadItem[]
}) {
  const [search, setSearch] = useState("")

  const filtered = leads.filter(
    l =>
      l.CompanyName?.toLowerCase().includes(search.toLowerCase()) ||
      l.AssignedTo?.toLowerCase().includes(search.toLowerCase()) ||
      l.Source?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {leads.length === 0
              ? "No leads in this category for the selected date range."
              : `Showing ${filtered.length} of ${leads.length} lead(s).`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {leads.length > 0 && (
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter by company, user or source..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          )}

          <div className="max-h-[55vh] overflow-y-auto pr-1">
            {leads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground gap-2">
                <XCircle className="h-8 w-8 opacity-30" />
                <p className="text-sm">No leads in this category for the selected period.</p>
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">No records match your filter.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(lead => (
                    <TableRow key={lead.Id}>
                      <TableCell className="font-medium">{lead.CompanyName}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{lead.Source || "—"}</TableCell>
                      <TableCell className="text-sm">{lead.AssignedTo || "—"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            lead.Status === "Converted" ? "default" :
                            lead.Status === "Lost"      ? "destructive" :
                            "secondary"
                          }
                          className="text-xs"
                        >
                          {lead.Status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {lead.CreatedAt ? format(new Date(lead.CreatedAt), "dd MMM yyyy") : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────

export default function LeadsReportPage() {
  const { toast } = useToast()

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  })
  const [calOpen, setCalOpen] = useState(false)

  const [reportData, setReportData] = useState<LeadsReportData | null>(null)
  const [loading, setLoading] = useState(false)

  const [modal, setModal] = useState<{
    open: boolean
    title: string
    leads: LeadItem[]
  }>({ open: false, title: "", leads: [] })

  const generateReport = useCallback(async () => {
    if (!dateRange?.from || !dateRange?.to) {
      toast({ title: "Select a date range first", variant: "destructive" })
      return
    }
    setLoading(true)
    setReportData(null)
    try {
      const result = await reportApi.getLeadsReport(
        format(dateRange.from, "yyyy-MM-dd"),
        format(dateRange.to, "yyyy-MM-dd")
      )
      setReportData(result)
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to load leads report.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [dateRange, toast])

  const openModal = (title: string, leads: LeadItem[]) => {
    setModal({ open: true, title, leads: leads || [] })
  }

  const cards = reportData
    ? [
        {
          label: "Total Leads",
          value: reportData.TotalLeads,
          icon: BarChart2,
          color: "text-foreground",
          leads: reportData.AllLeads,
        },
        {
          label: "Converted to Client",
          value: reportData.Converted,
          icon: UserCheck,
          color: "text-green-600",
          leads: reportData.ConvertedList,
        },
        {
          label: "In Progress",
          value: reportData.InProgress,
          icon: Clock,
          color: "text-blue-500",
          leads: reportData.InProgressList,
        },
        {
          label: "Lost",
          value: reportData.Lost,
          icon: XCircle,
          color: "text-destructive",
          leads: reportData.LostList,
        },
      ]
    : []

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Leads Report</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Overview of lead activity — total, converted, in-progress, and lost.
          </p>
        </div>

        {/* Date range + Generate */}
        <div className="flex items-center gap-2 flex-wrap">
          <Popover open={calOpen} onOpenChange={setCalOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="min-w-[220px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to
                    ? `${format(dateRange.from, "dd MMM yyyy")} – ${format(dateRange.to, "dd MMM yyyy")}`
                    : format(dateRange.from, "dd MMM yyyy")
                ) : (
                  <span className="text-muted-foreground">Pick date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={val => { setDateRange(val); if (val?.from && val?.to) setCalOpen(false) }}
                numberOfMonths={2}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Button size="sm" onClick={generateReport} disabled={loading || !dateRange?.from || !dateRange?.to}>
            {loading
              ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              : <TrendingUp className="h-4 w-4 mr-2" />}
            Generate
          </Button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading report...</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && !reportData && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BarChart2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">Ready to generate</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Select a date range and click <strong>Generate</strong> to view the report.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stat Cards */}
      {!loading && reportData && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {cards.map(card => (
              <Card
                key={card.label}
                onClick={() => openModal(card.label, card.leads)}
                className="cursor-pointer hover:shadow-md hover:border-primary/40 transition-all"
              >
                <CardHeader className="pb-2 pt-4 px-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-medium text-muted-foreground">{card.label}</CardTitle>
                    <card.icon className={`h-4 w-4 ${card.color}`} />
                  </div>
                </CardHeader>
                <CardContent className="pb-4 px-4">
                  <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
                  <p className="text-xs text-muted-foreground mt-1 opacity-60">Click to view</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Summary Banner */}
          {reportData.TotalLeads > 0 && (
            <Card className="bg-muted/40">
              <CardContent className="py-4 px-5">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                  <div className="flex items-center gap-2 shrink-0">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Conversion Rate:</span>
                    <span className="text-sm font-bold text-green-600">
                      {((reportData.Converted / reportData.TotalLeads) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>
                      <span className="font-semibold text-foreground">{reportData.TotalLeads}</span> total leads
                    </span>
                    <span className="text-green-600">
                      <span className="font-semibold">{reportData.Converted}</span> converted
                    </span>
                    <span className="text-blue-500">
                      <span className="font-semibold">{reportData.InProgress}</span> in progress
                    </span>
                    <span className="text-destructive">
                      <span className="font-semibold">{reportData.Lost}</span> lost
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Lead Detail Modal */}
      <LeadDetailModal
        open={modal.open}
        onClose={() => setModal(m => ({ ...m, open: false }))}
        title={modal.title}
        leads={modal.leads}
      />
    </div>
  )
}
