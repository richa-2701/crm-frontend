// frontend/app/dashboard/clients/page.tsx
"use client"

import { useEffect, useState, useMemo } from "react"
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
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  MoreHorizontal,
  Search,
  Eye,
  Loader2,
  XIcon,
  Filter,
  Columns,
  Edit // Import Edit icon
} from "lucide-react"
import Link from "next/link"
import { api, type ApiClient, type ClientContact } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
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
import { format } from "date-fns"
import { EditClientModal } from "@/components/clients/edit-client-modal" // Import new modal

interface Client {
  id: string;
  company_name: string;
  website?: string | null;
  linkedIn?: string | null;
  company_email?: string | null;
  company_phone_2?: string | null;
  address?: string | null;
  address_2?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  country?: string | null;
  segment?: string | null;
  verticles?: string | null;
  team_size?: string | null;
  turnover?: string | null;
  current_system?: string | null;
  machine_specification?: string | null;
  challenges?: string | null;
  version?: string | null;
  database_type?: string | null;
  amc?: string | null;
  gst?: string | null;
  converted_date: string;
  created_at: string;
  updated_at?: string | null;
  contacts?: ClientContact[];
}

interface LoggedInUser { id: string; username: string; email: string; role: string; }

const capitalize = (s: string) => {
  if (typeof s !== 'string' || !s) return ''
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function SortableTableHeader({ column }: { column: ColumnConfig }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: column.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.7 : 1, };
  return (
    <TableHead ref={setNodeRef} style={style} {...attributes} {...listeners} className={`cursor-move select-none whitespace-nowrap ${isDragging ? "bg-muted/50" : ""} ${column.id === "actions" ? "text-right" : ""}`}>
      {column.label}
    </TableHead>
  )
}

interface ColumnConfig {
  id: string;
  label: string;
  key: keyof Client | "actions" | "contact_name" | "contact_phone" | "contact_email" | "contact_designation" | "contact_linkedin" | "contact_pan";
  render?: (client: Client) => React.ReactNode;
}

const ALL_CLIENT_COLUMNS: ColumnConfig[] = [
    { id: "company_name", label: "Company Name", key: "company_name" },
    { id: "contact_name", label: "Contact Person", key: "contact_name" },
    { id: "contact_phone", label: "Contact Phone", key: "contact_phone" },
    { id: "company_email", label: "Company Email", key: "company_email" },
    { id: "website", label: "Website", key: "website" },
    { id: "linkedIn", label: "Company LinkedIn", key: "linkedIn" },
    { id: "contact_email", label: "Contact Email", key: "contact_email" },
    { id: "contact_designation", label: "Contact Designation", key: "contact_designation" },
    { id: "contact_linkedin", label: "Contact LinkedIn", key: "contact_linkedin" },
    { id: "contact_pan", label: "Contact PAN", key: "contact_pan" },
    { id: "company_phone_2", label: "Company Phone 2", key: "company_phone_2" },
    { id: "address", label: "Address Line 1", key: "address" },
    { id: "city", label: "City", key: "city" },
    { id: "state", label: "State", key: "state" },
    { id: "country", label: "Country", key: "country" },
    { id: "pincode", label: "Pincode", key: "pincode" },
    { id: "segment", label: "Segment", key: "segment" },
    { id: "verticles", label: "Verticals", key: "verticles" },
    { id: "team_size", label: "Team Size", key: "team_size" },
    { id: "turnover", label: "Turnover", key: "turnover" },
    { id: "current_system", label: "Current System", key: "current_system" },
    { id: "machine_specification", label: "Machine Spec", key: "machine_specification" },
    { id: "challenges", label: "Challenges", key: "challenges" },
    { id: "version", label: "Version", key: "version" },
    { id: "database_type", label: "Database Type", key: "database_type" },
    { id: "amc", label: "AMC", key: "amc" },
    { id: "gst", label: "GST", key: "gst" },
    { id: "converted_date", label: "Converted Date", key: "converted_date" },
    { id: "created_at", label: "Created At", key: "created_at" },
    { id: "actions", label: "Actions", key: "actions" },
];

interface ClientsPageFilters {
    company_name: string;
    city: string;
    segment: string;
    converted_date_start: string;
    converted_date_end: string;
}

function TableRowComponent({
  client,
  columns,
  handleViewDetails,
  handleEditClient, // New prop
}: {
  client: Client
  columns: ColumnConfig[]
  handleViewDetails: (client: Client) => void
  handleEditClient: (client: Client) => void // New prop
}) {

  const renderCell = (column: ColumnConfig) => {
    if (column.render) {
      return column.render(client)
    }

    const primaryContact = client.contacts && client.contacts.length > 0 ? client.contacts[0] : null

    switch (column.key) {
      case "company_name":
        return <TableCell className="font-medium">{client.company_name}</TableCell>
      case "contact_name":
        return <TableCell>{primaryContact?.contact_name || "N/A"}</TableCell>
      case "contact_phone":
        return <TableCell>{primaryContact?.phone || "N/A"}</TableCell>
      case "contact_email":
        return <TableCell>{primaryContact?.email || "N/A"}</TableCell>
      case "contact_designation":
        return <TableCell>{primaryContact?.designation || "N/A"}</TableCell>
      case "contact_linkedin":
        return <TableCell>{primaryContact?.linkedIn || "N/A"}</TableCell>
      case "contact_pan":
        return <TableCell>{primaryContact?.pan || "N/A"}</TableCell>
      case "converted_date":
        return <TableCell>{client.converted_date ? format(new Date(client.converted_date), "MMM d, yyyy") : "N/A"}</TableCell>
      case "created_at":
        return <TableCell>{client.created_at ? format(new Date(client.created_at), "MMM d, yyyy HH:mm") : "N/A"}</TableCell>
      case "actions":
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
                <DropdownMenuItem onClick={() => handleEditClient(client)}> {/* New Edit option */}
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Client
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        )
      default:
        const key = column.key as keyof Client
        const cellValue = client[key]
        return <TableCell>{typeof cellValue === "string" || typeof cellValue === "number" ? cellValue : ""}</TableCell>
    }
  }

  return (
    <TableRow onClick={() => handleViewDetails(client)} className="cursor-pointer hover:bg-muted/50">
      {columns.map((column) => (<React.Fragment key={column.id}>{renderCell(column)}</React.Fragment>))}
    </TableRow>
  )
}

export default function ClientsPage() {
  const router = useRouter()
  const { toast } = useToast();

  const [user, setUser] = useState<LoggedInUser | null>(null)
  const [allClients, setAllClients] = useState<Client[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedClient, setSelectedClient] = useState<Client | null>(null); // New state for selected client
  const [showEditModal, setShowEditModal] = useState(false); // New state for edit modal

  const [visibleColumns, setVisibleColumns] = useState<ColumnConfig[]>([
    { id: "company_name", label: "Company Name", key: "company_name" },
    { id: "contact_name", label: "Contact Person", key: "contact_name" },
    { id: "contact_phone", label: "Contact Phone", key: "contact_phone" },
    { id: "website", label: "Website", key: "website" },
    { id: "city", label: "City", key: "city" },
    { id: "converted_date", label: "Converted Date", key: "converted_date" },
    { id: "actions", label: "Actions", key: "actions" },
  ])

  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() =>
    ALL_CLIENT_COLUMNS.reduce((acc, col) => ({ ...acc, [col.id]: (
      col.id === "company_name" || col.id === "contact_name" || col.id === "contact_phone" ||
      col.id === "website" || col.id === "city" || col.id === "converted_date" || col.id === "actions"
    ) }), {})
  );

  const [filters, setFilters] = useState<ClientsPageFilters>({
    company_name: "", city: "", segment: "",
    converted_date_start: "", converted_date_end: ""
  });
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(30);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const userData = localStorage.getItem("user")
        if (!userData) {
          setError("User not found. Please log in again.")
          return
        }
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)

        const clientsData = await api.getAllClients(); // Corrected: Directly call getAllClients on api object
        const transformedClients: Client[] = clientsData.map((client: ApiClient) => ({
          id: client.id.toString(),
          company_name: client.company_name,
          website: client.website,
          linkedIn: client.linkedIn,
          company_email: client.company_email,
          company_phone_2: client.company_phone_2,
          address: client.address,
          address_2: client.address_2,
          city: client.city,
          state: client.state,
          pincode: client.pincode,
          country: client.country,
          segment: client.segment,
          verticles: client.verticles,
          team_size: String(client.team_size),
          turnover: client.turnover,
          current_system: client.current_system,
          machine_specification: client.machine_specification,
          challenges: client.challenges,
          version: client.version,
          database_type: client.database_type,
          amc: client.amc,
          gst: client.gst,
          converted_date: client.converted_date,
          created_at: client.created_at,
          updated_at: client.updated_at,
          contacts: client.contacts || [],
        }));
        setAllClients(transformedClients);

      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load clients.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const newVisibleColumns = ALL_CLIENT_COLUMNS.filter(col => columnVisibility[col.id]);
    setVisibleColumns(newVisibleColumns);
  }, [columnVisibility]);


  const filteredClients = useMemo(() => {
    let clientsToProcess = allClients;

    if (filters.company_name) { clientsToProcess = clientsToProcess.filter(client => client.company_name?.toLowerCase().includes(filters.company_name.toLowerCase())); }
    if (filters.city) { clientsToProcess = clientsToProcess.filter(client => client.city?.toLowerCase().includes(filters.city.toLowerCase())); }
    if (filters.segment) { clientsToProcess = clientsToProcess.filter(client => client.segment?.toLowerCase().includes(filters.segment.toLowerCase())); }

    // Date filters for converted_date
    if (filters.converted_date_start) {
      const startDate = new Date(filters.converted_date_start);
      clientsToProcess = clientsToProcess.filter(client => new Date(client.converted_date) >= startDate);
    }
    if (filters.converted_date_end) {
      const endDate = new Date(filters.converted_date_end);
      endDate.setHours(23, 59, 59, 999); // End of day
      clientsToProcess = clientsToProcess.filter(client => new Date(client.converted_date) <= endDate);
    }

    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      clientsToProcess = clientsToProcess.filter(
        (client) =>
          (client.company_name && client.company_name.toLowerCase().includes(lowerCaseSearchTerm)) ||
          (client.company_email && client.company_email.toLowerCase().includes(lowerCaseSearchTerm)) ||
          (client.website && client.website.toLowerCase().includes(lowerCaseSearchTerm)) ||
          (client.linkedIn && client.linkedIn.toLowerCase().includes(lowerCaseSearchTerm)) ||
          (client.city && client.city.toLowerCase().includes(lowerCaseSearchTerm)) ||
          (client.state && client.state.toLowerCase().includes(lowerCaseSearchTerm)) || // Search state
          (client.country && client.country.toLowerCase().includes(lowerCaseSearchTerm)) || // Search country
          (client.pincode && client.pincode.toLowerCase().includes(lowerCaseSearchTerm)) || // Search pincode
          (client.segment && client.segment.toLowerCase().includes(lowerCaseSearchTerm)) ||
          (client.verticles && client.verticles.toLowerCase().includes(lowerCaseSearchTerm)) || // Search verticals
          (client.team_size && client.team_size.toLowerCase().includes(lowerCaseSearchTerm)) || // Search team size
          (client.turnover && client.turnover.toLowerCase().includes(lowerCaseSearchTerm)) || // Search turnover
          (client.current_system && client.current_system.toLowerCase().includes(lowerCaseSearchTerm)) || // Search current system
          (client.machine_specification && client.machine_specification.toLowerCase().includes(lowerCaseSearchTerm)) || // Search machine spec
          (client.challenges && client.challenges.toLowerCase().includes(lowerCaseSearchTerm)) || // Search challenges
          (client.version && client.version.toLowerCase().includes(lowerCaseSearchTerm)) || // Search version
          (client.database_type && client.database_type.toLowerCase().includes(lowerCaseSearchTerm)) || // Search database type
          (client.amc && client.amc.toLowerCase().includes(lowerCaseSearchTerm)) || // Search AMC
          (client.gst && client.gst.toLowerCase().includes(lowerCaseSearchTerm)) || // Search GST
          (client.contacts && client.contacts.some(c => c && c.contact_name && c.contact_name.toLowerCase().includes(lowerCaseSearchTerm))) ||
          (client.contacts && client.contacts.some(c => c && c.phone && c.phone.toLowerCase().includes(lowerCaseSearchTerm))) ||
          (client.contacts && client.contacts.some(c => c && c.email && c.email.toLowerCase().includes(lowerCaseSearchTerm)))
      );
    }

    Object.entries(columnFilters).forEach(([key, value]) => {
      if (value) {
        const filterValue = value.toLowerCase();
        clientsToProcess = clientsToProcess.filter(client => {
          if (key.startsWith('contact_')) {
            const contactKey = key.replace('contact_', ''); // e.g., 'name', 'phone'
            return client.contacts?.some((c: any) => c[contactKey]?.toString().toLowerCase().includes(filterValue));
          }
          const clientValue = (client as any)[key];
          return clientValue?.toString().toLowerCase().includes(filterValue);
        });
      }
    });

    return clientsToProcess;
  }, [allClients, filters, searchTerm, columnFilters]);

  const paginatedClients = useMemo(() => {
      const startIndex = (currentPage - 1) * rowsPerPage;
      const endIndex = startIndex + rowsPerPage;
      return filteredClients.slice(startIndex, endIndex);
  }, [filteredClients, currentPage, rowsPerPage]);


  const handleViewDetails = (client: Client) => { router.push(`/dashboard/clients/${client.id}`) }

  const handleEditClient = (client: Client) => { // New handler
    setSelectedClient(client);
    setShowEditModal(true);
  };

  const handleEditClientComplete = (clientId: string, updatedClient: ApiClient) => { // New handler
    setAllClients(prevClients =>
      prevClients.map(client => (client.id === clientId ? { ...client, ...updatedClient, id: updatedClient.id.toString() } : client))
    );
    setShowEditModal(false);
    setSelectedClient(null); // Clear selected client after edit
  };

  const handleFilterChange = (key: keyof ClientsPageFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value === "all" ? "" : value }));
    setCurrentPage(1);
  };
  const clearFilters = () => {
    setFilters({ company_name: "", city: "", segment: "", converted_date_start: "", converted_date_end: "" });
    setCurrentPage(1);
  };
  const removeFilter = (key: keyof ClientsPageFilters) => { handleFilterChange(key, ""); };
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const handleColumnFilterChange = (key: string, value: string) => {
    setColumnFilters(prev => ({...prev, [key]: value}));
    setCurrentPage(1);
  };

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates, }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return;
    if (active.id !== over.id) {
      setVisibleColumns((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  if (isLoading) { return ( <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" /><span className="ml-2">Loading clients...</span></div> )}
  if (error) { return ( <div className="flex items-center justify-center h-64"><div className="text-center"><p className="text-red-500 mb-4">{error}</p><Button onClick={() => window.location.reload()}>Retry</Button></div></div> )}
  if (!user) { return <div>Loading...</div> }

   return (
    <div className="flex h-full flex-col space-y-4">
      <div className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
            <p className="text-muted-foreground">Manage and track your valuable clients</p>
          </div>
          {/* No create client button as clients are converted from leads */}
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
              <Input placeholder="Search all columns..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8 w-full"/>
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline"><Columns className="mr-2 h-4 w-4" />Columns</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {ALL_CLIENT_COLUMNS.filter(col => col.key !== 'actions').map((column) => (
                        <DropdownMenuCheckboxItem
                            key={column.id}
                            className="capitalize"
                            checked={columnVisibility[column.id]}
                            onCheckedChange={(value) => setColumnVisibility(prev => ({ ...prev, [column.id]: !!value }))}
                        >
                            {column.label}
                        </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="relative">
                  <Filter className="mr-2 h-4 w-4" />
                  Filters
                  {activeFilterCount > 0 && (<Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 justify-center p-0">{activeFilterCount}</Badge>)}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                  <h4 className="font-medium leading-none">Apply Filters</h4>
                  <div className="space-y-2"><Label htmlFor="company_name">Company Name</Label><Input id="company_name" placeholder="e.g., Acme Corp" value={filters.company_name} onChange={(e) => handleFilterChange("company_name", e.target.value)} /></div>
                  <div className="space-y-2"><Label htmlFor="city">City</Label><Input id="city" placeholder="e.g., Indore" value={filters.city} onChange={(e) => handleFilterChange("city", e.target.value)} /></div>
                  <div className="space-y-2"><Label htmlFor="segment">Segment</Label><Input id="segment" placeholder="e.g., Manufacturing" value={filters.segment} onChange={(e) => handleFilterChange("segment", e.target.value)} /></div>
                  <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                          <Label htmlFor="converted_date_start">Converted After</Label>
                          <Input
                              id="converted_date_start"
                              type="date"
                              value={filters.converted_date_start}
                              onChange={(e) => handleFilterChange("converted_date_start", e.target.value)}
                          />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="converted_date_end">Converted Before</Label>
                          <Input
                              id="converted_date_end"
                              type="date"
                              value={filters.converted_date_end}
                              onChange={(e) => handleFilterChange("converted_date_end", e.target.value)}
                          />
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
              {Object.entries(filters).map(([key, value]) => value ? (<Badge key={key} variant="secondary" className="flex items-center gap-1">{key.replace(/_/g, " ").replace("converted date", "Converted Date")}: {value}<button onClick={() => removeFilter(key as keyof ClientsPageFilters)} className="rounded-full hover:bg-muted-foreground/20 p-0.5"><XIcon className="h-3 w-3" /></button></Badge>) : null)}
            </div>
          )}
        </CardHeader>

        <CardContent className="flex flex-1 flex-col min-h-0">
          <div className="relative flex-1 overflow-auto rounded-md border">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-background">
                  <SortableContext items={visibleColumns.map((col) => col.id)} strategy={horizontalListSortingStrategy}>
                    <TableRow>
                      {visibleColumns.map((column) => (<SortableTableHeader key={column.id} column={column} />))}
                    </TableRow>
                  </SortableContext>
                  <TableRow>
                      {visibleColumns.map((column) => (
                          <TableCell key={`${column.id}-filter`} className="p-1 align-top bg-background">
                              {column.key !== "actions" && (
                                  <Input
                                      placeholder={`Filter ${column.label}...`}
                                      value={columnFilters[column.key] || ""}
                                      onChange={(e) => handleColumnFilterChange(column.key, e.target.value)}
                                      className="h-8 text-xs"
                                  />
                              )}
                          </TableCell>
                      ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedClients.map((client) => (
                    <TableRowComponent
                      key={client.id}
                      client={client}
                      columns={visibleColumns}
                      handleViewDetails={handleViewDetails}
                      handleEditClient={handleEditClient} // Pass the handler
                    />
                  ))}
                </TableBody>
              </Table>
            </DndContext>
            {filteredClients.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-muted-foreground">
                  No clients found matching your search criteria.
                </p>
              </div>
            )}
          </div>

          <div className="flex-shrink-0 pt-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <Label htmlFor="rows-per-page" className="text-sm text-muted-foreground">Rows per page</Label>
                    <Select value={String(rowsPerPage)} onValueChange={(value) => { setRowsPerPage(Number(value)); setCurrentPage(1); }}>
                        <SelectTrigger className="w-20 h-9">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {[10, 30, 50, 100, 200].map(size => (
                                <SelectItem key={size} value={String(size)}>{size}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center space-x-4">
                    <span className="text-sm text-muted-foreground">
                        Page {currentPage} of {Math.ceil(filteredClients.length / rowsPerPage) || 1}
                    </span>
                    <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
                            Previous
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => prev + 1)} disabled={currentPage >= Math.ceil(filteredClients.length / rowsPerPage)}>
                            Next
                        </Button>
                    </div>
                </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedClient && (
        <EditClientModal
          client={selectedClient}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={handleEditClientComplete}
        />
      )}
    </div>
  );
}