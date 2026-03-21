"use client"

import { useState, useEffect, useCallback } from "react"
import { tallyApi, type TallyOutstandingRow, type TallyLedger, type TallyMapping } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import {
  RefreshCw, Settings, Link2, Link2Off, Zap, CheckCircle2,
  AlertCircle, Clock, IndianRupee, Search, ChevronDown, Loader2, Save,
  Database, AlertTriangle, ExternalLink, Check,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

// ── helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(n ?? 0)

const fmtDate = (s: string | null | undefined) => {
  if (!s) return "Never"
  try {
    return new Date(s).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
  } catch { return s }
}

// ─────────────────────────────────────────────────────────────────────────────
export default function TallyReportPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("outstanding")

  // ── Settings ──
  const [companyName, setCompanyName] = useState("")
  const [tallyHost, setTallyHost]     = useState("localhost")
  const [tallyPort, setTallyPort]     = useState("9000")
  const [settingsIds, setSettingsIds] = useState<any>({})
  const [showSettings, setShowSettings]     = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)
  const [isConfigured, setIsConfigured]     = useState(false)

  // ── Outstanding tab ──
  const [outstanding, setOutstanding]     = useState<TallyOutstandingRow[]>([])
  const [loadingReport, setLoadingReport] = useState(false)
  const [syncing, setSyncing]             = useState(false)
  const [lastSyncedAt, setLastSyncedAt]   = useState<string | null>(null)
  const [outSearch, setOutSearch]         = useState("")

  // ── Mapping tab ──
  const [mappings, setMappings]               = useState<TallyMapping[]>([])
  const [ledgers, setLedgers]                 = useState<TallyLedger[]>([])
  const [loadingMappings, setLoadingMappings] = useState(false)
  const [autoMapping, setAutoMapping]         = useState(false)
  const [fetchingLedgers, setFetchingLedgers] = useState(false)
  const [mapSearch, setMapSearch]             = useState("")
  const [manualDropdown, setManualDropdown]   = useState<Record<number, string>>({})
  const [savingMap, setSavingMap]             = useState<Record<number, boolean>>({})

  // ── Pagination ──
  const [page, setPage]         = useState(1)
  const [pageSize, setPageSize] = useState(25)

  // ─────────────────────────────────────────────────────────
  // Init
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    loadSettings()
    loadOutstandingReport()
  }, [])

  const loadSettings = async () => {
    try {
      const s = await tallyApi.getSettingsWithIds()
      setCompanyName(s.companyName || "")
      setTallyHost(s.host || "localhost")
      setTallyPort(s.port || "9000")
      setSettingsIds({ companyNameId: s.companyNameId, hostId: s.hostId, portId: s.portId })
      setIsConfigured(!!(s.companyName || "").trim())
    } catch { /* ignore */ }
  }

  const handleSaveSettings = async () => {
    if (!companyName.trim()) {
      toast({ title: "Tally Company Name is required.", variant: "destructive" })
      return
    }
    setSavingSettings(true)
    try {
      await tallyApi.saveSettings(companyName.trim(), tallyHost.trim() || "localhost", tallyPort.trim() || "9000", settingsIds)
      toast({ title: "Tally settings saved!" })
      setIsConfigured(true)
      setShowSettings(false)
    } catch (e: any) {
      toast({ title: "Failed to save settings", description: e?.message, variant: "destructive" })
    } finally { setSavingSettings(false) }
  }

  // ─────────────────────────────────────────────────────────
  // Outstanding report
  // ─────────────────────────────────────────────────────────
  const loadOutstandingReport = useCallback(async () => {
    setLoadingReport(true)
    try {
      const result = await tallyApi.getOutstandingReport()
      const rows: TallyOutstandingRow[] = Array.isArray(result) ? result
        : typeof result === "string" ? JSON.parse(result)
        : ((result as any).Data ?? result)
      setOutstanding(rows || [])
      if (rows?.length > 0 && rows[0].LastSyncedAt) setLastSyncedAt(rows[0].LastSyncedAt as any)
    } catch { /* empty table ok */ }
    finally { setLoadingReport(false) }
  }, [])

  const handleSync = async () => {
    if (!isConfigured) { setShowSettings(true); toast({ title: "Configure Tally settings first.", variant: "destructive" }); return }
    setSyncing(true)
    try {
      const res = await tallyApi.syncFromTally()
      toast({ title: "Sync complete", description: `${res.Synced ?? 0} client(s) updated from Tally.` })
      setLastSyncedAt(res.SyncedAt)
      await loadOutstandingReport()
    } catch (e: any) {
      const msg = e?.message ?? "Sync failed"
      if (msg.includes("400") || msg.toLowerCase().includes("company name")) {
        toast({ title: "Tally configuration missing. Opening settings.", variant: "destructive" })
        setShowSettings(true)
      } else if (msg.toLowerCase().includes("503") || msg.includes("connect")) {
        toast({ title: "Cannot reach Tally", description: "Ensure Tally is open with HTTP Gateway enabled.", variant: "destructive" })
      } else {
        toast({ title: "Sync Failed", description: msg, variant: "destructive" })
      }
    } finally { setSyncing(false) }
  }

  // ─────────────────────────────────────────────────────────
  // Mapping tab
  // ─────────────────────────────────────────────────────────
  const loadMappings = useCallback(async () => {
    setLoadingMappings(true)
    try {
      const data = await tallyApi.getMappings()
      setMappings(Array.isArray(data) ? data : typeof data === "string" ? JSON.parse(data) : [])
    } catch { toast({ title: "Failed to load client mappings.", variant: "destructive" }) }
    finally { setLoadingMappings(false) }
  }, [toast])

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setPage(1)
    if (tab === "mapping" && mappings.length === 0) loadMappings()
  }

  const fetchLedgers = async () => {
    if (!isConfigured) { setShowSettings(true); toast({ title: "Configure Tally settings first.", variant: "destructive" }); return }
    loadMappings()
    setFetchingLedgers(true)
    try {
      const res = await tallyApi.fetchLedgers()
      const raw: TallyLedger[] = res.Ledgers || res.ledgers || []
      const seen = new Set<string>()
      const deduped = raw.filter(l => { if (seen.has(l.LedgerName)) return false; seen.add(l.LedgerName); return true })
      setLedgers(deduped)
      toast({ title: `Fetched ${deduped.length} Tally ledgers.` })
    } catch (e: any) {
      toast({ title: "Cannot fetch ledgers", description: e?.message, variant: "destructive" })
    } finally { setFetchingLedgers(false) }
  }

  const handleAutoMap = async () => {
    if (!isConfigured) { setShowSettings(true); toast({ title: "Configure Tally settings first.", variant: "destructive" }); return }
    setAutoMapping(true)
    try {
      const res = await tallyApi.autoMap()
      toast({ title: "Auto-map complete", description: `By GST: ${res.MatchedByGST} | By Name: ${res.MatchedByName} | Unmatched: ${res.Unmatched}` })
      await loadMappings()
    } catch (e: any) {
      toast({ title: "Auto-map failed", description: e?.message, variant: "destructive" })
    } finally { setAutoMapping(false) }
  }

  const handleSaveMapping = async (clientId: number) => {
    const ledgerName = manualDropdown[clientId]
    if (!ledgerName) { toast({ title: "Select a Tally ledger first.", variant: "destructive" }); return }
    const ledger = ledgers.find(l => l.LedgerName === ledgerName)
    setSavingMap(prev => ({ ...prev, [clientId]: true }))
    try {
      await tallyApi.saveMapping({ CRMClientId: clientId, TallyLedgerName: ledgerName, TallyLedgerType: ledger?.LedgerType ?? "Debtor" })
      toast({ title: "Mapping saved." })
      await loadMappings()
    } catch (e: any) {
      toast({ title: "Save failed", description: e?.message, variant: "destructive" })
    } finally { setSavingMap(prev => ({ ...prev, [clientId]: false })) }
  }

  const handleUnlink = async (clientId: number) => {
    try {
      await tallyApi.deleteMapping(clientId)
      toast({ title: "Mapping removed." })
      await loadMappings()
    } catch { toast({ title: "Failed to remove mapping.", variant: "destructive" }) }
  }

  // ─────────────────────────────────────────────────────────
  // Derived
  // ─────────────────────────────────────────────────────────
  const filteredOutstanding = outstanding.filter(r =>
    r.CRMCompanyName?.toLowerCase().includes(outSearch.toLowerCase()) ||
    r.TallyLedgerName?.toLowerCase().includes(outSearch.toLowerCase())
  )
  const filteredMappings = mappings.filter(m =>
    m.CRMCompanyName?.toLowerCase().includes(mapSearch.toLowerCase()) ||
    (m.TallyLedgerName ?? "")?.toLowerCase().includes(mapSearch.toLowerCase())
  )

  const totalOutstandingAmt = outstanding.reduce((s, r) => s + (Number(r.OutstandingAmount) || 0), 0)
  const clearCount          = outstanding.filter(r => r.PaymentClear === 1 || (r.PaymentClear as any) === true).length

  const totalItems = activeTab === "outstanding" ? filteredOutstanding.length : filteredMappings.length
  const totalPages = Math.ceil(totalItems / pageSize) || 1
  const paginatedOutstanding = filteredOutstanding.slice((page - 1) * pageSize, page * pageSize)
  const paginatedMappings    = filteredMappings.slice((page - 1) * pageSize, page * pageSize)

  const PaginationControls = () => (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t mt-4">
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>Rows per page:</span>
        <Select value={pageSize.toString()} onValueChange={v => { setPageSize(Number(v)); setPage(1) }}>
          <SelectTrigger className="h-8 w-16"><SelectValue /></SelectTrigger>
          <SelectContent>{[10, 25, 50, 100].map(v => <SelectItem key={v} value={v.toString()}>{v}</SelectItem>)}</SelectContent>
        </Select>
        <span className="hidden sm:block">Showing {Math.min((page - 1) * pageSize + 1, totalItems)}–{Math.min(page * pageSize, totalItems)} of {totalItems}</span>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
          <ChevronDown className="h-4 w-4 rotate-90" />
        </Button>
        <span className="px-3 h-8 flex items-center text-xs font-semibold bg-muted rounded-md">
          {page} / {totalPages}
        </span>
        <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
          <ChevronDown className="h-4 w-4 -rotate-90" />
        </Button>
      </div>
    </div>
  )

  // ─────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-6 space-y-6 min-h-screen">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tally Integration</h1>
          <p className="text-sm text-muted-foreground">Link CRM clients with Tally ledgers to track collections.</p>
        </div>
        <div className="flex items-center gap-2">
          {!isConfigured && (
            <Badge variant="destructive" className="animate-pulse flex items-center gap-1.5 py-1 px-3">
              <AlertTriangle className="h-3 w-3" /> Not Configured
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={() => setShowSettings(true)}>
            <Settings className="h-4 w-4 mr-2" /> Tally Settings
          </Button>
        </div>
      </div>

      <Tabs defaultValue="outstanding" onValueChange={handleTabChange}>
        <TabsList className="mb-4">
          <TabsTrigger value="outstanding" className="gap-2">
            <IndianRupee className="h-4 w-4" /> Outstanding Report
          </TabsTrigger>
          <TabsTrigger value="mapping" className="gap-2">
            <Link2 className="h-4 w-4" /> Client Mapping
          </TabsTrigger>
        </TabsList>

        {/* ── OUTSTANDING REPORT ── */}
        <TabsContent value="outstanding" className="space-y-6">

          {/* 4 stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-5">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Outstanding</p>
                <p className="text-2xl font-black text-orange-600 mt-1">₹ {fmt(totalOutstandingAmt)}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Across all mapped accounts</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Payments Clear</p>
                <p className="text-2xl font-black text-green-600 mt-1">{clearCount} / {outstanding.length}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Clients with zero balance</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Mapped Clients</p>
                <p className="text-2xl font-black text-blue-600 mt-1">{outstanding.length}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Linked to Tally</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Last Sync</p>
                <p className="text-base font-bold mt-1 truncate">{fmtDate(lastSyncedAt)}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Server timestamp</p>
              </CardContent>
            </Card>
          </div>

          {/* Search + actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search client or ledger..." value={outSearch} onChange={e => setOutSearch(e.target.value)} className="pl-9" />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button variant="outline" size="sm" onClick={loadOutstandingReport} disabled={loadingReport}>
                <RefreshCw className={cn("h-4 w-4 mr-2", loadingReport && "animate-spin")} /> Refresh
              </Button>
              <Button size="sm" onClick={handleSync} disabled={syncing}>
                {syncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
                Sync from Tally
              </Button>
            </div>
          </div>

          {/* Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              {loadingReport ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="text-sm">Loading report...</span>
                </div>
              ) : filteredOutstanding.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
                  <Clock className="h-8 w-8 opacity-40" />
                  <p className="text-sm font-medium">No outstanding data yet.</p>
                  <p className="text-xs">Click <strong>Sync from Tally</strong> to load payment data.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10 text-[10px] font-bold uppercase">#</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase">CRM Client</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase">Tally Ledger</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase text-right">Total Amount</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase text-right text-green-600">Received</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase text-right text-orange-600">Pending</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase text-center">Status</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase text-right w-16">Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedOutstanding.map((row, i) => (
                      <TableRow key={row.CRMClientId}>
                        <TableCell className="text-xs text-muted-foreground font-mono">{(page - 1) * pageSize + i + 1}</TableCell>
                        <TableCell className="font-semibold text-sm max-w-[200px] truncate">{row.CRMCompanyName}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[160px] truncate">{row.TallyLedgerName}</TableCell>
                        <TableCell className="text-right font-medium text-sm">₹ {fmt(row.TotalAmount)}</TableCell>
                        <TableCell className="text-right font-medium text-sm text-green-600">₹ {fmt(row.ReceivedAmount)}</TableCell>
                        <TableCell className="text-right font-bold text-sm text-orange-600">₹ {fmt(row.OutstandingAmount)}</TableCell>
                        <TableCell className="text-center">
                          {row.PaymentClear ? (
                            <Badge variant="outline" className="text-[9px] font-black bg-green-50 text-green-700 border-green-200">
                              <CheckCircle2 className="h-3 w-3 mr-1" /> CLEAR
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[9px] font-black bg-orange-50 text-orange-700 border-orange-200">
                              <AlertCircle className="h-3 w-3 mr-1" /> PENDING
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary" className={cn("text-[10px] font-bold",
                            row.BalanceType === "Dr" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700")}>
                            {row.BalanceType || "—"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </Card>
          {filteredOutstanding.length > pageSize && <PaginationControls />}
        </TabsContent>

        {/* ── CLIENT MAPPING ── */}
        <TabsContent value="mapping" className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Filter clients..." value={mapSearch} onChange={e => setMapSearch(e.target.value)} className="pl-9" />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button variant="outline" size="sm" onClick={fetchLedgers} disabled={fetchingLedgers}>
                <Database className={cn("h-4 w-4 mr-2", fetchingLedgers && "animate-spin")} />
                Fetch Tally Ledgers
              </Button>
              <Button size="sm" onClick={handleAutoMap} disabled={autoMapping}>
                <Zap className={cn("h-4 w-4 mr-2", autoMapping && "animate-spin")} />
                Auto Map
              </Button>
            </div>
          </div>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              {loadingMappings ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="text-sm">Loading clients...</span>
                </div>
              ) : filteredMappings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
                  <Link2Off className="h-8 w-8 opacity-40" />
                  <p className="text-sm font-medium">No CRM clients available.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10 text-[10px] font-bold uppercase">#</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase">CRM Client</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase">GST No.</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase">Tally Ledger</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase w-20">Method</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase text-right w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedMappings.map((m, i) => (
                      <TableRow key={m.CRMClientId} className={cn(!m.IsMapped && "bg-muted/20")}>
                        <TableCell className="text-xs text-muted-foreground font-mono">{(page - 1) * pageSize + i + 1}</TableCell>
                        <TableCell className="font-semibold text-sm max-w-[200px] truncate">{m.CRMCompanyName}</TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">{m.CRMGst || "—"}</TableCell>
                        <TableCell>
                          {m.IsMapped ? (
                            <div className="flex items-center gap-2">
                              <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                <Check className="h-3 w-3 text-green-700" />
                              </div>
                              <span className="text-sm font-semibold">{m.TallyLedgerName}</span>
                            </div>
                          ) : (
                            <Select
                              value={manualDropdown[m.CRMClientId] || ""}
                              onValueChange={val => setManualDropdown(prev => ({ ...prev, [m.CRMClientId]: val }))}
                            >
                              <SelectTrigger className="w-full min-w-[240px] h-8 text-xs">
                                <SelectValue placeholder={ledgers.length === 0 ? "Click 'Fetch Tally Ledgers' first" : "Select ledger..."} />
                              </SelectTrigger>
                              <SelectContent className="max-h-[280px]">
                                {ledgers.map((l, li) => (
                                  <SelectItem key={li} value={l.LedgerName} className="text-xs py-2">
                                    <div className="flex flex-col gap-0.5">
                                      <span className="font-semibold">{l.LedgerName}</span>
                                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                        <span>{l.LedgerType}</span>
                                        {l.Gst && <span className="font-mono">{l.Gst}</span>}
                                      </div>
                                    </div>
                                  </SelectItem>
                                ))}
                                {ledgers.length === 0 && (
                                  <div className="p-4 text-center text-xs text-muted-foreground">No ledgers fetched yet.</div>
                                )}
                              </SelectContent>
                            </Select>
                          )}
                        </TableCell>
                        <TableCell>
                          {m.MappedVia && (
                            <Badge variant="secondary" className="text-[9px] font-bold uppercase">{m.MappedVia}</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {m.IsMapped ? (
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleUnlink(m.CRMClientId)}>
                              <Link2Off className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button size="sm" className="h-8 px-4 text-xs font-bold"
                              disabled={savingMap[m.CRMClientId] || !manualDropdown[m.CRMClientId]}
                              onClick={() => handleSaveMapping(m.CRMClientId)}>
                              {savingMap[m.CRMClientId] ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Save className="h-3 w-3 mr-1" />}
                              Link
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </Card>
          {filteredMappings.length > pageSize && <PaginationControls />}
        </TabsContent>
      </Tabs>

      {/* ── SETTINGS DIALOG ── */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden rounded-2xl">
          <div className="bg-slate-900 p-7 text-white">
            <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 mb-4">
              <Settings className="h-5 w-5 text-white" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-white">Tally Configuration</DialogTitle>
              <DialogDescription className="text-slate-400 text-sm">
                Enter your Tally server details exactly as shown in TallyPrime.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-7 space-y-5 bg-white">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Company Name in Tally <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Database className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-10 h-11 font-semibold rounded-xl" placeholder="e.g. My Company Private Limited"
                  value={companyName} onChange={e => setCompanyName(e.target.value)} />
              </div>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1 bg-muted/50 px-2 py-1.5 rounded-lg">
                <AlertCircle className="h-3 w-3 text-blue-500 shrink-0" />
                Must match exactly as shown in Gateway of Tally.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Host</Label>
                <Input className="h-10 font-mono rounded-xl" placeholder="localhost"
                  value={tallyHost} onChange={e => setTallyHost(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Port</Label>
                <Input className="h-10 font-mono rounded-xl" placeholder="9000"
                  value={tallyPort} onChange={e => setTallyPort(e.target.value)} />
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
              <ExternalLink className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-blue-800 leading-relaxed">
                In Tally: <strong>Gateway of Tally → F12 Configure → Enable TallyPrime Gateway</strong> (port 9000 by default).
              </p>
            </div>

            <DialogFooter className="pt-1">
              <Button variant="ghost" className="rounded-xl" onClick={() => setShowSettings(false)}>Cancel</Button>
              <Button className="rounded-xl px-7 font-bold bg-slate-900 hover:bg-slate-800" onClick={handleSaveSettings} disabled={savingSettings}>
                {savingSettings ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Configuration
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
