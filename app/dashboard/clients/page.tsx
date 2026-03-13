//frontend/app/dashboard/clients/page.tsx
"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  MoreHorizontal,
  Search,
  Eye,
  Loader2,
  Upload as ExportIcon,
  Activity,
  XIcon,
  Filter,
  Columns,
} from "lucide-react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import React from "react"
import { clientApi, userApi, type ApiClient, type ApiUser, type ApiLead } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { LeadActivitiesModal } from "@/components/leads/lead-activities-modal"
import { format } from "date-fns"
import { parseAsUTCDate } from "@/lib/date-format"

interface ClientRow {
  id: string
  company_name: string
  contact_name: string
  phone: string
  company_email: string
  segment: string
  city: string
  state: string
  address: string
  address_2: string
  country: string
  pincode: string
  team_size: string
  turnover: string
  verticles: string
  current_system: string
  machine_specification: string
  challenges: string
  website: string
  linkedIn: string
  converted_date: string
  created_at: string
  _raw: ApiClient
}

interface LoggedInUser { id: string; username: string; email: string; role: string }
interface CompanyUser { id: string; name: string; email: string; role: string }

interface ColumnConfig {
  id: string
  label: string
  key: keyof ClientRow | "actions"
}

const ALL_COLUMNS: ColumnConfig[] = [
  { id: "company_name",        label: "Client Name",              key: "company_name" },
  { id: "contact_name",        label: "Contact Person",           key: "contact_name" },
  { id: "phone",               label: "Contact Phone",            key: "phone" },
  { id: "company_email",       label: "Company Email",            key: "company_email" },
  { id: "segment",             label: "Segment",                  key: "segment" },
  { id: "city",                label: "City",                     key: "city" },
  { id: "state",               label: "State",                    key: "state" },
  { id: "address",             label: "Address Line 1",           key: "address" },
  { id: "address_2",           label: "Address Line 2",           key: "address_2" },
  { id: "country",             label: "Country",                  key: "country" },
  { id: "pincode",             label: "Pincode",                  key: "pincode" },
  { id: "team_size",           label: "Team Size",                key: "team_size" },
  { id: "turnover",            label: "Turnover",                 key: "turnover" },
  { id: "verticles",           label: "Verticals",                key: "verticles" },
  { id: "current_system",      label: "Current System",           key: "current_system" },
  { id: "machine_specification", label: "Machine Specification",  key: "machine_specification" },
  { id: "challenges",          label: "Challenges",               key: "challenges" },
  { id: "website",             label: "Website",                  key: "website" },
  { id: "linkedIn",            label: "LinkedIn",                 key: "linkedIn" },
  { id: "converted_date",      label: "Converted On",             key: "converted_date" },
  { id: "actions",             label: "Actions",                  key: "actions" },
]

interface ClientFilters {
  address: string
  segment: string
  converted_start: string
  converted_end: string
}

function SortableTableHeader({ column }: { column: ColumnConfig }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: column.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.7 : 1 }
  return (
    <TableHead
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`cursor-move select-none whitespace-nowrap ${isDragging ? "bg-muted/50" : ""} ${column.id === "actions" ? "text-right" : ""}`}
    >
      {column.label}
    </TableHead>
  )
}

function TableRowComponent({
  client,
  columns,
  handleViewDetails,
  handleViewActivities,
}: {
  client: ClientRow
  columns: ColumnConfig[]
  handleViewDetails: (c: ClientRow) => void
  handleViewActivities: (c: ClientRow) => void
}) {
  const renderCell = (column: ColumnConfig) => {
    if (column.key === "actions") {
      return (
        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleViewDetails(client)}>
                <Eye className="mr-2 h-4 w-4" />
                View Full Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleViewActivities(client)}>
                <Activity className="mr-2 h-4 w-4" />
                Activities
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      )
    }
    if (column.key === "segment" && client.segment) {
      return <TableCell><Badge variant="outline">{client.segment}</Badge></TableCell>
    }
    if (column.key === "converted_date") {
      const d = parseAsUTCDate(client.converted_date)
      return <TableCell>{d ? format(d, "MMM d, yyyy") : "N/A"}</TableCell>
    }
    const val = client[column.key as keyof ClientRow]
    return <TableCell>{typeof val === "string" || typeof val === "number" ? val || "" : ""}</TableCell>
  }

  return (
    <TableRow onClick={() => handleViewDetails(client)} className="cursor-pointer hover:bg-muted/50">
      {columns.map((col) => <React.Fragment key={col.id}>{renderCell(col)}</React.Fragment>)}
    </TableRow>
  )
}

function toClientRow(client: ApiClient): ClientRow {
  const contacts = Array.isArray(client.contacts) ? client.contacts : []
  const primary = contacts[0]
  return {
    id: client.id.toString(),
    company_name:        client.company_name || "",
    contact_name:        primary?.contact_name || "",
    phone:               primary?.phone || "",
    company_email:       client.company_email || "",
    segment:             client.segment || "",
    city:                client.city || "",
    state:               client.state || "",
    address:             client.address || "",
    address_2:           client.address_2 || "",
    country:             client.country || "",
    pincode:             client.pincode || "",
    team_size:           client.team_size || "",
    turnover:            client.turnover || "",
    verticles:           client.verticles || "",
    current_system:      client.current_system || "",
    machine_specification: client.machine_specification || "",
    challenges:          client.challenges || "",
    website:             client.website || "",
    linkedIn:            client.linkedIn || "",
    converted_date:      client.converted_date || "",
    created_at:          client.created_at || "",
    _raw:                client,
  }
}

function toApiLead(client: ClientRow): ApiLead {
  return {
    id: Number(client.id),
    company_name: client.company_name,
    contacts: client._raw.contacts?.map(c => ({
      id: c.id ?? 0,
      lead_id: Number(client.id),
      contact_name: c.contact_name ?? "",
      phone: c.phone ?? "",
      email: c.email ?? null,
      designation: c.designation ?? null,
      linkedIn: c.linkedIn ?? null,
      pan: c.pan ?? null,
    })) || [],
    email: client.company_email,
    address: client.address,
    city: client.city,
    state: client.state,
    country: client.country,
    segment: client.segment,
    assigned_to: "",
    status: "Won/Deal Done",
    created_at: client.created_at,
  } as unknown as ApiLead
}

export default function ClientsPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [user, setUser] = useState<LoggedInUser | null>(null)
  const [allClients, setAllClients] = useState<ClientRow[]>([])
  const [companyUsers, setCompanyUsers] = useState<CompanyUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState<ClientFilters>({ address: "", segment: "", converted_start: "", converted_end: "" })
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(30)
  const [isExporting, setIsExporting] = useState(false)
  const [selectedClient, setSelectedClient] = useState<ClientRow | null>(null)
  const [showActivitiesModal, setShowActivitiesModal] = useState(false)
  const [visibleColumns, setVisibleColumns] = useState<ColumnConfig[]>([
    { id: "company_name",  label: "Client Name",    key: "company_name" },
    { id: "contact_name",  label: "Contact Person", key: "contact_name" },
    { id: "phone",         label: "Contact Phone",  key: "phone" },
    { id: "company_email", label: "Company Email",  key: "company_email" },
    { id: "segment",       label: "Segment",        key: "segment" },
    { id: "city",          label: "City",           key: "city" },
    { id: "state",         label: "State",          key: "state" },
    { id: "converted_date", label: "Converted On",  key: "converted_date" },
    { id: "actions",       label: "Actions",        key: "actions" },
  ])
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() =>
    ALL_COLUMNS.reduce((acc, col) => ({
      ...acc,
      [col.id]: ["company_name","contact_name","phone","company_email","segment","city","state","converted_date","actions"].includes(col.id)
    }), {})
  )

  const allSegments = useMemo(() => [...new Set(allClients.map(c => c.segment).filter(Boolean))], [allClients])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const userData = localStorage.getItem("user")
        if (!userData) { setError("User not found. Please log in again."); return }
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
        const [clientsData, usersData] = await Promise.all([
          clientApi.getAllClients(),
          userApi.getUsers(),
        ])
        const parsed = clientsData.map((c: ApiClient) => ({
          ...c,
          contacts: typeof c.contacts === "string" ? JSON.parse(c.contacts) : c.contacts,
          attachments: typeof c.attachments === "string" ? JSON.parse(c.attachments) : c.attachments,
        }))
        setAllClients(parsed.map(toClientRow))
        setCompanyUsers(usersData.map((u: ApiUser) => ({ id: u.id.toString(), name: u.username, email: u.email || "", role: u.role || "user" })))
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load clients.")
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    setVisibleColumns(ALL_COLUMNS.filter(col => columnVisibility[col.id]))
  }, [columnVisibility])

  const filteredClients = useMemo(() => {
    let list = [...allClients]
    if (filters.address) list = list.filter(c => (c.address + " " + c.city + " " + c.state).toLowerCase().includes(filters.address.toLowerCase()))
    if (filters.segment) list = list.filter(c => c.segment === filters.segment)
    if (filters.converted_start) { const d = new Date(`${filters.converted_start}T00:00:00`); list = list.filter(c => new Date(c.converted_date) >= d) }
    if (filters.converted_end)   { const d = new Date(`${filters.converted_end}T23:59:59`);   list = list.filter(c => new Date(c.converted_date) <= d) }
    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      list = list.filter(c =>
        c.company_name.toLowerCase().includes(q) ||
        c.contact_name.toLowerCase().includes(q) ||
        c.company_email.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q)
      )
    }
    Object.entries(columnFilters).forEach(([key, value]) => {
      if (value) {
        const q = value.toLowerCase()
        list = list.filter(c => (c[key as keyof ClientRow] as string)?.toString().toLowerCase().includes(q))
      }
    })
    return list
  }, [allClients, filters, searchTerm, columnFilters])

  const paginatedClients = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filteredClients.slice(start, start + rowsPerPage)
  }, [filteredClients, currentPage, rowsPerPage])

  const handleViewDetails = (c: ClientRow) => router.push(`/dashboard/clients/${c.id}`)
  const handleViewActivities = (c: ClientRow) => { setSelectedClient(c); setShowActivitiesModal(true) }

  const handleFilterChange = (key: keyof ClientFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value === "all" ? "" : value }))
    setCurrentPage(1)
  }
  const clearFilters = () => { setFilters({ address: "", segment: "", converted_start: "", converted_end: "" }); setCurrentPage(1) }
  const removeFilter = (key: keyof ClientFilters) => handleFilterChange(key, "")
  const activeFilterCount = Object.values(filters).filter(Boolean).length
  const handleColumnFilterChange = (key: string, value: string) => { setColumnFilters(prev => ({ ...prev, [key]: value })); setCurrentPage(1) }

  const escapeCsv = (v: string | number | null | undefined) => {
    if (v == null) return ""
    const s = String(v)
    return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const cols = ALL_COLUMNS.filter(c => c.key !== "actions")
      const headers = cols.map(c => escapeCsv(c.label)).join(",")
      const rows = filteredClients.map(c =>
        cols.map(col => escapeCsv(c[col.key as keyof ClientRow] as string)).join(",")
      ).join("\n")
      const blob = new Blob([`${headers}\n${rows}`], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a"); a.href = url; a.download = "clients_export.csv"; a.click(); a.remove()
      URL.revokeObjectURL(url)
      toast({ title: "Export Started", description: `${filteredClients.length} clients exported.` })
    } catch {
      toast({ title: "Export Failed", variant: "destructive" })
    } finally {
      setIsExporting(false)
    }
  }

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setVisibleColumns(items => {
      const oldIndex = items.findIndex(i => i.id === active.id)
      const newIndex = items.findIndex(i => i.id === over.id)
      return arrayMove(items, oldIndex, newIndex)
    })
  }

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" /><span className="ml-2">Loading clients...</span></div>
  if (error) return <div className="flex items-center justify-center h-64"><div className="text-center"><p className="text-red-500 mb-4">{error}</p><Button onClick={() => window.location.reload()}>Retry</Button></div></div>
  if (!user) return <div>Loading...</div>

  return (
    <div className="flex h-full flex-col space-y-4">
      <div className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">All active clients converted from leads.</p>
          <Button onClick={handleExport} variant="outline" disabled={isExporting}>
            {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ExportIcon className="mr-2 h-4 w-4" />}
            Export to Excel
          </Button>
        </div>
      </div>

      <Card className="flex flex-1 flex-col overflow-hidden">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle>
              All Clients
              <span className="ml-2 text-sm font-normal text-muted-foreground">({filteredClients.length} clients)</span>
            </CardTitle>
          </div>

          <div className="flex items-center space-x-2 pt-4">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search all columns..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8 w-full" />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline"><Columns className="mr-2 h-4 w-4" />Columns</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {ALL_COLUMNS.filter(col => col.key !== "actions").map((col) => (
                  <DropdownMenuCheckboxItem
                    key={col.id}
                    checked={columnVisibility[col.id]}
                    onCheckedChange={(v) => setColumnVisibility(prev => ({ ...prev, [col.id]: !!v }))}
                  >
                    {col.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="relative">
                  <Filter className="mr-2 h-4 w-4" />
                  Filters
                  {activeFilterCount > 0 && <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 justify-center p-0">{activeFilterCount}</Badge>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                  <h4 className="font-medium leading-none">Apply Filters</h4>
                  <div className="space-y-2">
                    <Label>Area / Address</Label>
                    <Input placeholder="e.g., Mumbai" value={filters.address} onChange={(e) => handleFilterChange("address", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Segment</Label>
                    <Select value={filters.segment === "" ? "all" : filters.segment} onValueChange={(v) => handleFilterChange("segment", v)}>
                      <SelectTrigger><SelectValue placeholder="All segments" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Segments</SelectItem>
                        {allSegments.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label>Converted After</Label>
                      <Input type="date" value={filters.converted_start} onChange={(e) => handleFilterChange("converted_start", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Converted Before</Label>
                      <Input type="date" value={filters.converted_end} onChange={(e) => handleFilterChange("converted_end", e.target.value)} />
                    </div>
                  </div>
                  <Button onClick={clearFilters} variant="ghost" className="w-full">Clear All Filters</Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {activeFilterCount > 0 && (
            <div className="flex items-center gap-2 pt-4 flex-wrap">
              <span className="text-sm font-medium">Active Filters:</span>
              {Object.entries(filters).map(([key, value]) =>
                value ? (
                  <Badge key={key} variant="secondary" className="flex items-center gap-1">
                    {key.replace(/_/g, " ")}: {value}
                    <button onClick={() => removeFilter(key as keyof ClientFilters)} className="rounded-full hover:bg-muted-foreground/20 p-0.5">
                      <XIcon className="h-3 w-3" />
                    </button>
                  </Badge>
                ) : null
              )}
            </div>
          )}
        </CardHeader>

        <CardContent className="flex flex-1 flex-col min-h-0">
          <div className="relative flex-1 overflow-auto rounded-md border">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-background">
                  <SortableContext items={visibleColumns.map(c => c.id)} strategy={horizontalListSortingStrategy}>
                    <TableRow>
                      {visibleColumns.map(col => <SortableTableHeader key={col.id} column={col} />)}
                    </TableRow>
                  </SortableContext>
                  <TableRow>
                    {visibleColumns.map(col => (
                      <TableCell key={`${col.id}-filter`} className="p-1 align-top bg-background">
                        {col.key !== "actions" && (
                          <Input
                            placeholder={`Filter ${col.label}...`}
                            value={columnFilters[col.key] || ""}
                            onChange={(e) => handleColumnFilterChange(col.key, e.target.value)}
                            className="h-8 text-xs"
                          />
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedClients.map(client => (
                    <TableRowComponent
                      key={client.id}
                      client={client}
                      columns={visibleColumns}
                      handleViewDetails={handleViewDetails}
                      handleViewActivities={handleViewActivities}
                    />
                  ))}
                </TableBody>
              </Table>
            </DndContext>
            {filteredClients.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-muted-foreground">No clients found.</p>
              </div>
            )}
          </div>

          <div className="flex-shrink-0 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Label className="text-sm text-muted-foreground">Rows per page</Label>
                <Select value={String(rowsPerPage)} onValueChange={(v) => { setRowsPerPage(Number(v)); setCurrentPage(1) }}>
                  <SelectTrigger className="w-20 h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[10, 30, 50, 100, 200].map(s => <SelectItem key={s} value={String(s)}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {Math.ceil(filteredClients.length / rowsPerPage) || 1}
                </span>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>Previous</Button>
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= Math.ceil(filteredClients.length / rowsPerPage)}>Next</Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedClient && (
        <LeadActivitiesModal
          lead={toApiLead(selectedClient)}
          isOpen={showActivitiesModal}
          onClose={() => setShowActivitiesModal(false)}
        />
      )}
    </div>
  )
}
