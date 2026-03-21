"use client"

import { useState, useEffect, useCallback } from "react"
import { tallyApi, type TallyOutstandingRow } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { Loader2, RefreshCw, Search, IndianRupee, AlertCircle, CheckCircle2 } from "lucide-react"

export default function TallyReportPage() {
  const { toast } = useToast()

  const [data, setData]           = useState<TallyOutstandingRow[]>([])
  const [isSyncing, setIsSyncing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [lastSynced, setLastSynced] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  // ── Load from TallyPaymentSummary cache (fast, works offline) ──
  const loadReport = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await tallyApi.getOutstandingReport()
      console.log("[Tally] getOutstandingReport raw:", result)
      const rows: TallyOutstandingRow[] = Array.isArray(result)
        ? result
        : typeof result === "string"
          ? JSON.parse(result)
          : ((result as any).Data ?? (result as any))
      console.log("[Tally] Report rows:", rows)
      setData(rows || [])
    } catch (err) {
      console.error("[Tally] loadReport error:", err)
      toast({ title: "Error", description: "Could not load outstanding report.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => { loadReport() }, [loadReport])

  // ── Sync live from Tally → updates TallyPaymentSummary cache ──
  const handleSync = async () => {
    setIsSyncing(true)
    try {
      const result = await tallyApi.syncFromTally()
      console.log("[Tally] Sync result:", result)
      setLastSynced(result.SyncedAt)
      await loadReport()
      toast({ title: "Synced", description: `${result.Synced ?? 0} client(s) updated from Tally.` })
    } catch (err: any) {
      console.error("[Tally] Sync error:", err)
      toast({ title: "Sync Failed", description: err?.message ?? "Could not connect to Tally. Make sure Tally is running.", variant: "destructive" })
    } finally {
      setIsSyncing(false)
    }
  }

  // ── Derived stats ──
  const totalOutstanding = data.reduce((s, r) => s + (r.IsOutstanding ? r.OutstandingAmount : 0), 0)
  const clearedCount     = data.filter(r => r.PaymentClear).length
  const pendingCount     = data.filter(r => r.IsOutstanding).length

  const filtered = data.filter(r =>
    r.CRMCompanyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.TallyLedgerName?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Tally Outstanding Report</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Payment status for all mapped clients.
            {lastSynced && <span className="ml-2 text-xs">Last synced: {lastSynced}</span>}
          </p>
        </div>
        <Button onClick={handleSync} disabled={isSyncing} size="sm">
          {isSyncing
            ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            : <RefreshCw className="h-4 w-4 mr-2" />}
          Sync from Tally
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-500">{fmt(totalOutstanding)}</p>
            <p className="text-xs text-muted-foreground mt-1">{pendingCount} client(s) with pending payments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Payments Clear</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{clearedCount}</p>
            <p className="text-xs text-muted-foreground mt-1">clients fully paid</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Mapped Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.length}</p>
            <p className="text-xs text-muted-foreground mt-1">linked to Tally ledgers</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search client..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground space-y-2">
          <IndianRupee className="h-10 w-10 mx-auto opacity-30" />
          <p className="text-sm">No data yet. Click <strong>Sync from Tally</strong> to load payment data.</p>
          <p className="text-xs">Make sure clients are mapped first in <a href="/dashboard/tally-mapping" className="underline">Client Mapping</a>.</p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Tally Ledger</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Outstanding Amount</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(row => (
                  <TableRow key={row.CRMClientId}>
                    <TableCell className="font-medium">{row.CRMCompanyName}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{row.TallyLedgerName}</TableCell>
                    <TableCell>
                      <Badge variant={row.TallyLedgerType === "Debtor" ? "default" : "secondary"}>
                        {row.TallyLedgerType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {row.OutstandingAmount > 0
                        ? <span className={row.IsOutstanding ? "text-orange-500 font-semibold" : ""}>
                            {fmt(row.OutstandingAmount)}
                            <span className="ml-1 text-xs text-muted-foreground">{row.BalanceType}</span>
                          </span>
                        : <span className="text-muted-foreground">—</span>
                      }
                    </TableCell>
                    <TableCell className="text-center">
                      {row.PaymentClear ? (
                        <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Clear
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-orange-500 text-xs font-medium">
                          <AlertCircle className="h-3.5 w-3.5" /> Pending
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
