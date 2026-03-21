"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { tallyApi, type TallyLedger, type TallyMapping } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Settings, RefreshCw, Zap, Link2, Unlink, Search } from "lucide-react"

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

interface TallySettings {
  companyName: string
  host: string
  port: string
  companyNameId: number | null
  hostId: number | null
  portId: number | null
}

type CardType = "all" | "mapped" | "unmapped" | "ledgers"

interface CardModal {
  open: boolean
  title: string
  type: CardType
}

// ─────────────────────────────────────────────────────────────
// CARD DETAIL POPUP
// ─────────────────────────────────────────────────────────────

function CardDetailModal({
  modal, onClose, mappings, tallyLedgers,
}: {
  modal: CardModal
  onClose: () => void
  mappings: TallyMapping[]
  tallyLedgers: TallyLedger[]
}) {
  const [search, setSearch] = useState("")

  useEffect(() => { if (modal.open) setSearch("") }, [modal.open])

  const rows = useMemo(() => {
    const q = search.toLowerCase()
    if (modal.type === "all")
      return mappings.filter(m =>
        m.CRMCompanyName?.toLowerCase().includes(q) ||
        m.TallyLedgerName?.toLowerCase().includes(q)
      )
    if (modal.type === "mapped")
      return mappings.filter(m => m.IsMapped && (
        m.CRMCompanyName?.toLowerCase().includes(q) ||
        m.TallyLedgerName?.toLowerCase().includes(q)
      ))
    if (modal.type === "unmapped")
      return mappings.filter(m => !m.IsMapped &&
        m.CRMCompanyName?.toLowerCase().includes(q)
      )
    // ledgers
    return tallyLedgers.filter(l =>
      l.LedgerName?.toLowerCase().includes(q) ||
      l.LedgerType?.toLowerCase().includes(q)
    )
  }, [modal.type, mappings, tallyLedgers, search])

  const totalCount = modal.type === "ledgers"
    ? tallyLedgers.length
    : modal.type === "all" ? mappings.length
    : modal.type === "mapped" ? mappings.filter(m => m.IsMapped).length
    : mappings.filter(m => !m.IsMapped).length

  return (
    <Dialog open={modal.open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{modal.title}</DialogTitle>
          <DialogDescription>
            Showing {rows.length} of {totalCount} records.
            {modal.type === "unmapped" && (
              <span className="ml-1 text-orange-500">
                These clients exist in CRM but are not yet linked to any Tally ledger.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>

          <div className="max-h-[60vh] overflow-y-auto pr-1 space-y-2">
            {rows.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">No records found.</p>
            ) : modal.type === "ledgers" ? (
              (rows as TallyLedger[]).map((l, i) => (
                <div key={i} className="flex items-center justify-between text-sm p-3 bg-muted/50 rounded-md border">
                  <span className="font-medium">{l.LedgerName}</span>
                  <div className="flex items-center gap-2">
                    {l.Gst && <span className="text-xs text-muted-foreground">GST: {l.Gst}</span>}
                    <Badge variant={l.LedgerType === "Debtor" ? "default" : "secondary"} className="text-xs">
                      {l.LedgerType}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              (rows as TallyMapping[]).map((m) => (
                <div key={m.CRMClientId} className="text-sm p-3 bg-muted/50 rounded-md border space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{m.CRMCompanyName}</p>
                    {m.IsMapped ? (
                      <Badge variant="outline" className="border-green-400 text-green-600 text-xs">Mapped</Badge>
                    ) : (
                      <Badge variant="outline" className="border-orange-400 text-orange-500 text-xs">Unmapped</Badge>
                    )}
                  </div>
                  {m.CRMGst && (
                    <p className="text-xs text-muted-foreground">GST: {m.CRMGst}</p>
                  )}
                  {m.IsMapped && (
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-xs text-muted-foreground">Tally Ledger:</span>
                      <span className="text-xs font-medium">{m.TallyLedgerName}</span>
                      <Badge variant={m.TallyLedgerType === "Debtor" ? "default" : "secondary"} className="text-xs">
                        {m.TallyLedgerType}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          m.MappedVia === "GST"  ? "border-blue-400 text-blue-600" :
                          m.MappedVia === "Name" ? "border-purple-400 text-purple-600" :
                          "border-gray-400 text-gray-600"
                        }`}
                      >
                        via {m.MappedVia}
                      </Badge>
                    </div>
                  )}
                </div>
              ))
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

export default function TallyMappingPage() {
  const { toast } = useToast()

  // ── State ──
  const [mappings, setMappings] = useState<TallyMapping[]>([])
  const [tallyLedgers, setTallyLedgers] = useState<TallyLedger[]>([])
  const [pendingSelections, setPendingSelections] = useState<Record<number, string>>({})
  const [searchTerm, setSearchTerm] = useState("")

  const [isLoadingMappings, setIsLoadingMappings] = useState(false)
  const [isFetchingLedgers, setIsFetchingLedgers] = useState(false)
  const [isAutoMapping, setIsAutoMapping] = useState(false)
  const [savingId, setSavingId] = useState<number | null>(null)
  const [unlinkingId, setUnlinkingId] = useState<number | null>(null)

  // Card detail popup
  const [cardModal, setCardModal] = useState<CardModal>({ open: false, title: "", type: "all" })

  // Settings dialog
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settings, setSettings] = useState<TallySettings>({
    companyName: "", host: "localhost", port: "9000",
    companyNameId: null, hostId: null, portId: null,
  })
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [isLoadingSettings, setIsLoadingSettings] = useState(false)

  // ── Load mappings on mount ──
  const loadMappings = useCallback(async () => {
    setIsLoadingMappings(true)
    try {
      const data = await tallyApi.getMappings()
      const parsed: TallyMapping[] = typeof data === "string" ? JSON.parse(data) : data
      setMappings(parsed || [])
    } catch {
      toast({ title: "Error", description: "Could not load client mappings.", variant: "destructive" })
    } finally {
      setIsLoadingMappings(false)
    }
  }, [toast])

  useEffect(() => { loadMappings() }, [loadMappings])

  // ── Card click handler ──
  const handleCardClick = (type: CardType, title: string) => {
    if (type === "ledgers" && tallyLedgers.length === 0) {
      toast({ title: "No Ledgers", description: "Click \"Fetch from Tally\" first to load ledgers." })
      return
    }
    const count = type === "all" ? mappings.length
      : type === "mapped" ? mappings.filter(m => m.IsMapped).length
      : type === "unmapped" ? mappings.filter(m => !m.IsMapped).length
      : tallyLedgers.length
    if (count === 0) {
      toast({ title: "No Data", description: `No records to show for "${title}".` })
      return
    }
    setCardModal({ open: true, title, type })
  }

  // ── Open settings dialog ──
  const openSettings = async () => {
    setSettingsOpen(true)
    setIsLoadingSettings(true)
    try {
      const data = await tallyApi.getSettingsWithIds()
      setSettings(data)
    } catch {
      toast({ title: "Error", description: "Could not load Tally settings.", variant: "destructive" })
    } finally {
      setIsLoadingSettings(false)
    }
  }

  // ── Save settings ──
  const handleSaveSettings = async () => {
    if (!settings.companyName.trim()) {
      toast({ title: "Required", description: "Company name in Tally cannot be empty.", variant: "destructive" })
      return
    }
    setIsSavingSettings(true)
    try {
      const result = await tallyApi.saveSettings(
        settings.companyName.trim(),
        settings.host.trim() || "localhost",
        settings.port.trim() || "9000",
        { companyNameId: settings.companyNameId, hostId: settings.hostId, portId: settings.portId }
      )
      if (result.success) {
        toast({ title: "Saved", description: "Tally settings saved successfully." })
        setSettingsOpen(false)
      } else {
        toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" })
    } finally {
      setIsSavingSettings(false)
    }
  }

  // ── Fetch ledgers from Tally ──
  const handleFetchLedgers = async () => {
    setIsFetchingLedgers(true)
    try {
      const result = await tallyApi.fetchLedgers()
      console.log("[Tally] FetchLedgers raw result:", result)
      const rawLedgers: TallyLedger[] = result.Ledgers || (result as any).ledgers || []
      // Deduplicate by LedgerName (Tally may return same ledger from both queries)
      const seen = new Set<string>()
      const ledgers = rawLedgers.filter(l => {
        if (seen.has(l.LedgerName)) return false
        seen.add(l.LedgerName)
        return true
      })
      console.log("[Tally] Deduplicated ledgers:", ledgers)
      setTallyLedgers(ledgers)
      toast({ title: "Fetched", description: `Loaded ${ledgers.length} ledgers from Tally.` })
    } catch (err: any) {
      console.error("[Tally] FetchLedgers error:", err)
      toast({ title: "Tally Error", description: err?.message || "Could not fetch ledgers.", variant: "destructive" })
    } finally {
      setIsFetchingLedgers(false)
    }
  }

  // ── Auto-map ──
  const handleAutoMap = async () => {
    setIsAutoMapping(true)
    try {
      const result = await tallyApi.autoMap()
      toast({
        title: "Auto-Map Complete",
        description: `GST: ${result.MatchedByGST} | Name: ${result.MatchedByName} | Unmatched: ${result.Unmatched}`,
      })
      await loadMappings()
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Auto-map failed.", variant: "destructive" })
    } finally {
      setIsAutoMapping(false)
    }
  }

  // ── Save manual mapping ──
  const handleSaveManual = async (crmClientId: number) => {
    const ledgerName = pendingSelections[crmClientId]
    if (!ledgerName) { toast({ title: "Select a ledger first", variant: "destructive" }); return }
    const ledger = tallyLedgers.find(l => l.LedgerName === ledgerName)
    setSavingId(crmClientId)
    try {
      await tallyApi.saveMapping({ CRMClientId: crmClientId, TallyLedgerName: ledgerName, TallyLedgerType: ledger?.LedgerType ?? "Debtor" })
      toast({ title: "Mapped", description: "Client linked to Tally ledger." })
      setPendingSelections(prev => { const n = { ...prev }; delete n[crmClientId]; return n })
      await loadMappings()
    } catch {
      toast({ title: "Error", description: "Could not save mapping.", variant: "destructive" })
    } finally {
      setSavingId(null)
    }
  }

  // ── Unlink mapping ──
  const handleUnlink = async (crmClientId: number) => {
    setUnlinkingId(crmClientId)
    try {
      await tallyApi.deleteMapping(crmClientId)
      toast({ title: "Unlinked", description: "Tally mapping removed." })
      await loadMappings()
    } catch {
      toast({ title: "Error", description: "Could not remove mapping.", variant: "destructive" })
    } finally {
      setUnlinkingId(null)
    }
  }

  // ── Filtered rows for main table ──
  const filtered = mappings.filter(m =>
    m.CRMCompanyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.TallyLedgerName?.toLowerCase().includes(searchTerm.toLowerCase())
  )
  const mapped   = filtered.filter(m => m.IsMapped)
  const unmapped = filtered.filter(m => !m.IsMapped)

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Tally Client Mapping</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Link your CRM clients to their Tally ledger (debtor / creditor) to track payments.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={openSettings}>
            <Settings className="h-4 w-4 mr-2" />Tally Settings
          </Button>
          <Button variant="outline" size="sm" onClick={handleFetchLedgers} disabled={isFetchingLedgers}>
            {isFetchingLedgers ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Fetch from Tally
          </Button>
          <Button size="sm" onClick={handleAutoMap} disabled={isAutoMapping}>
            {isAutoMapping ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
            Auto-Map
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search client or ledger..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* ── Clickable Stat Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { type: "all" as CardType,     label: "Total Clients",       value: mappings.length,                          color: "" },
          { type: "mapped" as CardType,  label: "Mapped",              value: mappings.filter(m => m.IsMapped).length,  color: "text-green-600" },
          { type: "unmapped" as CardType,label: "Unmapped",            value: mappings.filter(m => !m.IsMapped).length, color: "text-orange-500" },
          { type: "ledgers" as CardType, label: "Tally Ledgers Loaded",value: tallyLedgers.length,                      color: "" },
        ].map(card => (
          <Card
            key={card.type}
            onClick={() => handleCardClick(card.type, card.label)}
            className="cursor-pointer hover:shadow-md hover:border-primary/40 transition-all"
          >
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">{card.label}</p>
              <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
              <p className="text-xs text-muted-foreground mt-1 opacity-60">Click to view</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Main Tables ── */}
      {isLoadingMappings ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-6">

          {/* UNMAPPED */}
          {unmapped.length > 0 && (
            <div className="rounded-lg border">
              <div className="px-4 py-3 border-b flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-orange-400" />
                <span className="text-sm font-semibold">Unmapped Clients ({unmapped.length})</span>
                <span className="text-xs text-muted-foreground ml-1">
                  — {tallyLedgers.length === 0
                    ? 'Click "Fetch from Tally" first, then assign each client.'
                    : "Select a Tally ledger for each client and click Save."}
                </span>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>CRM Client</TableHead>
                    <TableHead>GST No.</TableHead>
                    <TableHead>Tally Ledger</TableHead>
                    <TableHead className="w-24">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unmapped.map(row => (
                    <TableRow key={row.CRMClientId}>
                      <TableCell className="font-medium">{row.CRMCompanyName}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {row.CRMGst || <span className="italic">No GST</span>}
                      </TableCell>
                      <TableCell>
                        {tallyLedgers.length === 0 ? (
                          <span className="text-xs text-muted-foreground italic">Fetch ledgers first</span>
                        ) : (
                          <Select
                            value={pendingSelections[row.CRMClientId] ?? ""}
                            onValueChange={val => setPendingSelections(prev => ({ ...prev, [row.CRMClientId]: val }))}
                          >
                            <SelectTrigger className="w-56 h-8 text-sm">
                              <SelectValue placeholder="Select ledger..." />
                            </SelectTrigger>
                            <SelectContent>
                              {tallyLedgers.map((l, i) => (
                                <SelectItem key={`${l.LedgerName}-${i}`} value={l.LedgerName}>
                                  {l.LedgerName}
                                  {l.LedgerType && <span className="ml-2 text-xs text-muted-foreground">({l.LedgerType})</span>}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm" variant="outline" className="h-7 text-xs"
                          disabled={!pendingSelections[row.CRMClientId] || savingId === row.CRMClientId}
                          onClick={() => handleSaveManual(row.CRMClientId)}
                        >
                          {savingId === row.CRMClientId
                            ? <Loader2 className="h-3 w-3 animate-spin" />
                            : <><Link2 className="h-3 w-3 mr-1" />Save</>}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* MAPPED */}
          {mapped.length > 0 && (
            <div className="rounded-lg border">
              <div className="px-4 py-3 border-b flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-sm font-semibold">Mapped Clients ({mapped.length})</span>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>CRM Client</TableHead>
                    <TableHead>Tally Ledger</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Mapped Via</TableHead>
                    <TableHead className="w-24">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mapped.map(row => (
                    <TableRow key={row.CRMClientId}>
                      <TableCell className="font-medium">{row.CRMCompanyName}</TableCell>
                      <TableCell>{row.TallyLedgerName}</TableCell>
                      <TableCell>
                        <Badge variant={row.TallyLedgerType === "Debtor" ? "default" : "secondary"}>
                          {row.TallyLedgerType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          row.MappedVia === "GST"  ? "border-blue-400 text-blue-600" :
                          row.MappedVia === "Name" ? "border-purple-400 text-purple-600" :
                          "border-gray-400 text-gray-600"
                        }>
                          {row.MappedVia}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm" variant="ghost"
                          className="h-7 text-xs text-destructive hover:text-destructive"
                          disabled={unlinkingId === row.CRMClientId}
                          onClick={() => handleUnlink(row.CRMClientId)}
                        >
                          {unlinkingId === row.CRMClientId
                            ? <Loader2 className="h-3 w-3 animate-spin" />
                            : <><Unlink className="h-3 w-3 mr-1" />Unlink</>}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {mappings.length === 0 && !isLoadingMappings && (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-sm">No clients found. Add clients in the CRM first.</p>
            </div>
          )}
        </div>
      )}

      {/* ── CARD DETAIL POPUP ── */}
      <CardDetailModal
        modal={cardModal}
        onClose={() => setCardModal(m => ({ ...m, open: false }))}
        mappings={mappings}
        tallyLedgers={tallyLedgers}
      />

      {/* ── TALLY SETTINGS DIALOG ── */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tally Settings</DialogTitle>
          </DialogHeader>
          {isLoadingSettings ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="space-y-1">
                <Label htmlFor="tally-company">Company Name in Tally <span className="text-destructive">*</span></Label>
                <Input
                  id="tally-company"
                  placeholder="e.g. My Company Pvt Ltd"
                  value={settings.companyName}
                  onChange={e => setSettings(s => ({ ...s, companyName: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Must exactly match the company name shown in Tally (Gateway of Tally).
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="tally-host">Tally Host</Label>
                  <Input id="tally-host" placeholder="localhost" value={settings.host}
                    onChange={e => setSettings(s => ({ ...s, host: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="tally-port">Tally Port</Label>
                  <Input id="tally-port" placeholder="9000" value={settings.port}
                    onChange={e => setSettings(s => ({ ...s, port: e.target.value }))} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground rounded-md bg-muted p-2">
                To enable Tally HTTP server: Open Tally → Gateway of Tally → F12 (Configure) → Enable Tally.ERP 9 Gateway.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveSettings} disabled={isSavingSettings || isLoadingSettings}>
              {isSavingSettings && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
