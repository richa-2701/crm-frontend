// frontend/app/leads/page.tsx
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
  Plus,
  Eye,
  UserCheck,
  Edit,
  Users,
  User,
  Loader2,
  Upload as ExportIcon,
  Activity,
  History,
  FileText as QuotationIcon,
  FileDown,
  MessageSquareQuote,
  XIcon,
  Filter,
  Workflow as DripIcon,
  Columns,
  Handshake, // New icon for 'Convert to Client'
} from "lucide-react"
import Link from "next/link"
import { ReassignLeadModal } from "@/components/leads/reassign-lead-modal"
import { EditLeadModal } from "@/components/leads/edit-lead-modal"
import { LeadActivitiesModal } from "@/components/leads/lead-activities-modal"
import { LeadHistoryModal } from "@/components/leads/lead-history-modal"
import { AssignDripModal } from "@/components/leads/assign-drip-modal";
import { ConvertLeadToClientModal } from "@/components/leads/convert-lead-to-client-modal"; // New import
import { api, userApi, type ApiLead, type ApiUser, type ApiDripSequenceList, type ApiActivity } from "@/lib/api"
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
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { formatDateTime } from "@/lib/date-format";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox" // Assuming this component path

interface Contact { id: number; lead_id: number; contact_name: string; phone: string; email: string | null; designation: string | null; linkedIn?: string | null; pan?: string | null; }
interface Lead { id: string; company_name: string; contacts: Contact[]; phone_2?: string; email: string; website?: string; linkedIn?: string; address?: string; address_2?: string; city?:string; state?:string; country?:string; pincode?:string; team_size?: string; turnover?: string; source?: string; segment?: string; verticles?: string; remark?: string; machine_specification?: string; challenges?: string; assigned_to: string; current_system?: string; lead_type?: string; status: string; created_at: string; updated_at: string; last_activity?: ApiActivity | null; opportunity_business?: string; target_closing_date?: string;}

interface LoggedInUser { id: string; username: string; email: string; role: string; }
interface CompanyUser { id: string; name: string; email: string; role: string; }

const statusColors = { new: "default", qualified: "secondary", unqualified: "destructive", not_our_segment: "destructive", "Meeting Done": "outline", "Demo Done": "outline", "Won/Deal Done": "success", Lost: "destructive" } as const;
const leadTypes = ["Hot Lead", "Cold Lead","Warm Lead"];
// Updated ColumnConfig to reflect the possibility of 'designation' and 'contact_email' keys
interface ColumnConfig { id: string; label: string; key: keyof Lead | "actions" | "contact_name" | "phone" | "last_activity" | "designation" | "contact_email" | "contact_linkedin" | "contact_pan"; render?: (lead: Lead) => React.ReactNode; }
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

function TableRowComponent({
  lead,
  columns,
  getUserName,
  handleViewDetails,
  handleViewActivities,
  handleViewHistory,
  handleReassignLead,
  handleEditLead,
  handleDownloadPdf,
  handleAssignDrip,
  handleConvertLeadToClient,
  canManageAllLeads: canManage,
}: {
  lead: Lead
  columns: ColumnConfig[]
  getUserName: (userId: string) => string
  handleViewDetails: (lead: Lead) => void
  handleViewActivities: (lead: Lead) => void
  handleViewHistory: (lead: Lead) => void
  handleReassignLead: (lead: Lead) => void
  handleEditLead: (lead: Lead) => void
  handleDownloadPdf: (lead: Lead) => void
  handleAssignDrip: (lead: Lead) => void
  handleConvertLeadToClient: (lead: Lead) => void
  canManageAllLeads: boolean
}) {

  const renderCell = (column: ColumnConfig) => {
    if (column.render) {
      return column.render(lead)
    }

    const primaryContact = lead.contacts && lead.contacts.length > 0 ? lead.contacts[0] : null

    switch (column.key) {
      case "company_name":
        return <TableCell className="font-medium">{lead.company_name}</TableCell>
      case "contact_name":
        return <TableCell>{primaryContact?.contact_name || "N/A"}</TableCell>
      case "phone":
        return <TableCell>{primaryContact?.phone || "N/A"}</TableCell>
      case "designation": // Added new case for designation
        return <TableCell>{primaryContact?.designation || "N/A"}</TableCell>
      case "contact_email": // Added new case for contact email
        return <TableCell>{primaryContact?.email || "N/A"}</TableCell>
      case "website": // New field
        return <TableCell>{lead.website || "N/A"}</TableCell>
      case "linkedIn": // New field (company LinkedIn)
        return <TableCell>{lead.linkedIn || "N/A"}</TableCell>
      case "contact_linkedin": // New field (contact LinkedIn)
        return <TableCell>{primaryContact?.linkedIn || "N/A"}</TableCell>
      case "contact_pan": // New field (contact PAN)
        return <TableCell>{primaryContact?.pan || "N/A"}</TableCell>
      case "last_activity":
        return (
            <TableCell>
                {lead.last_activity ? (
                    <div className="flex flex-col text-xs max-w-[200px]">
                        <span className="text-muted-foreground font-semibold">
                            {formatDateTime(lead.last_activity.created_at)}
                        </span>
                        <p className="truncate text-foreground" title={lead.last_activity.details}>
                            {lead.last_activity.details}
                        </p>
                    </div>
                ) : (
                    <span className="text-xs text-muted-foreground">No activity</span>
                )}
            </TableCell>
        );
      case "lead_type":
        return (
          <TableCell>
            {lead.lead_type ? (
              <Badge
                variant={lead.lead_type === "Hot Lead" ? "destructive" : "outline"}
                className={lead.lead_type === "Hot Lead" ? "bg-red-100 text-red-800 border-red-300 font-semibold" : ""}
              >
                {lead.lead_type}
              </Badge>
            ) : (
              <span className="text-muted-foreground text-sm">Not set</span>
            )}
          </TableCell>
        )
      case "assigned_to":
        return <TableCell>{getUserName(lead.assigned_to)}</TableCell>
      case "status":
        return (
          <TableCell>
            {/* CORRECTED: Applied direct Tailwind classes for green status and changed text to "Won" */}
            <Badge
              variant={statusColors[lead.status as keyof typeof statusColors] || "default"}
              className={lead.status === "Won/Deal Done" ? "bg-green-600 text-white font-semibold" : ""}
            >
              {lead.status === "Won/Deal Done" ? "Won" : capitalize(lead.status)}
            </Badge>
          </TableCell>
        )
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
                <DropdownMenuItem onClick={() => handleViewDetails(lead)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Full Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleViewActivities(lead)}>
                  <Activity className="mr-2 h-4 w-4" />
                  Activities
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleViewHistory(lead)}>
                  <History className="mr-2 h-4 w-4" />
                  History
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/view-quotations/${lead.id}`}>
                    <QuotationIcon className="mr-2 h-4 w-4" />
                    <span>View Quotations</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownloadPdf(lead)}>
                  <FileDown className="mr-2 h-4 w-4" />
                  Download PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAssignDrip(lead)}>
                  <DripIcon className="mr-2 h-4 w-4" />
                  <span>Assign Drip Sequence</span>
                </DropdownMenuItem>
                {lead.status !== "Won/Deal Done" && ( // Only show if not already converted
                    <DropdownMenuItem onClick={() => handleConvertLeadToClient(lead)}>
                      <Handshake className="mr-2 h-4 w-4" />
                      <span>Convert to Client</span>
                    </DropdownMenuItem>
                )}
                {canManage && (
                  <DropdownMenuItem onClick={() => handleReassignLead(lead)}>
                    <UserCheck className="mr-2 h-4 w-4" />
                    Reassign Lead
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => handleEditLead(lead)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit/Update Lead
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        )
      default:
        const key = column.key as keyof Lead
        const cellValue = lead[key]
        return <TableCell>{typeof cellValue === "string" || typeof cellValue === "number" ? cellValue : ""}</TableCell>
    }
  }

  return (
    <TableRow onClick={() => handleViewDetails(lead)} className="cursor-pointer hover:bg-muted/50">
      {columns.map((column) => (<React.Fragment key={column.id}>{renderCell(column)}</React.Fragment>))}
    </TableRow>
  )
}

function canManageAllLeads(user: LoggedInUser): boolean {
  return user.role === "admin";
}

// DEFINING ALL_COLUMNS with explicit keys for export
const ALL_COLUMNS: ColumnConfig[] = [
    { id: "company_name", label: "Lead Name", key: "company_name" },
    { id: "contact_name", label: "Contact Person Name", key: "contact_name" }, // Changed label
    { id: "phone", label: "Contact Person Phone", key: "phone" }, // Changed label
    { id: "email", label: "Company Email", key: "email" }, // Key for lead's main email
    { id: "website", label: "Website", key: "website" },
    { id: "linkedIn", label: "Company LinkedIn", key: "linkedIn" },
    { id: "contact_email", label: "Contact Person Email", key: "contact_email" }, // Changed label
    { id: "designation", label: "Contact Person Designation", key: "designation" }, // Changed label
    { id: "contact_linkedin", label: "Contact Person LinkedIn", key: "contact_linkedin" },
    { id: "contact_pan", label: "Contact Person PAN", key: "contact_pan" },
    { id: "source", label: "Source", key: "source" },
    { id: "address", label: "Address Line 1", key: "address" },
    { id: "address_2", label: "Address Line 2", key: "address_2" },
    { id: "city", label: "City", key: "city" },
    { id: "state", label: "State", key: "state" },
    { id: "country", label: "Country", key: "country" },
    { id: "pincode", label: "Pincode", key: "pincode" },
    { id: "team_size", label: "Team Size", key: "team_size" },
    { id: "turnover", label: "Turnover", key: "turnover" },
    { id: "segment", label: "Segment", key: "segment" },
    { id: "verticles", label: "Verticals", key: "verticles" },
    { id: "current_system", label: "Current System", key: "current_system" },
    { id: "machine_specification", label: "Machine Specification", key: "machine_specification" },
    { id: "challenges", label: "Challenges", key: "challenges" },
    { id: "remark", label: "Remark", key: "remark" },
    { id: "lead_type", label: "Lead Type", key: "lead_type" },
    { id: "assigned_to", label: "Assigned To", key: "assigned_to" },
    { id: "status", label: "Status", key: "status" },
    { id: "opportunity_business", label: "Opportunity Business", key: "opportunity_business" },
    { id: "target_closing_date", label: "Target Closing Date", key: "target_closing_date" },
    { id: "last_activity", label: "Last Activity", key: "last_activity" }, // Key for last activity object
    { id: "actions", label: "Actions", key: "actions" },
];

// Define a more robust type for leads page filters, including date range
interface LeadsPageFilters {
    address: string;
    lead_type: string;
    status: string;
    assigned_to: string;
    created_at_start: string; // YYYY-MM-DD format
    created_at_end: string;   // YYYY-MM-DD format
}


// New component for Export Options Modal
interface ExportOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (filters: LeadsPageFilters, columnKeys: string[]) => void;
  allColumns: ColumnConfig[];
  currentTableFilters: LeadsPageFilters; // Pass current table filters to pre-populate
  allLeadTypes: string[];
  allStatuses: string[];
  allCompanyUsers: CompanyUser[];
  isExporting: boolean; // Pass isExporting state for button
}

function ExportOptionsModal({
  isOpen,
  onClose,
  onConfirm,
  allColumns,
  currentTableFilters,
  allLeadTypes,
  allStatuses,
  allCompanyUsers,
  isExporting,
}: ExportOptionsModalProps) {
  const [exportFilters, setExportFilters] = useState<LeadsPageFilters>(currentTableFilters);
  const [exportSelectedColumns, setExportSelectedColumns] = useState<Record<string, boolean>>(() =>
    allColumns.filter(col => col.key !== 'actions').reduce((acc, col) => ({ ...acc, [col.key]: true }), {}) // All non-action columns selected by default
  );

  useEffect(() => {
      if (isOpen) {
          // Reset filters and columns when modal opens, pre-populating with current table filters
          setExportFilters(currentTableFilters);
          // Default to all non-action columns selected for export when modal opens
          setExportSelectedColumns(allColumns.filter(col => col.key !== 'actions').reduce((acc, col) => ({ ...acc, [col.key]: true }), {}));
      }
  }, [isOpen, allColumns, currentTableFilters]);

  const handleFilterChange = (key: keyof LeadsPageFilters, value: string) => {
    setExportFilters(prev => ({
        ...prev,
        [key]: value === "all" ? "" : value // Convert "all" selection to empty string for filtering logic
    }));
  };

  const handleColumnToggle = (columnKey: string, checked: boolean) => {
    setExportSelectedColumns(prev => ({ ...prev, [columnKey]: checked }));
  };

  const handleSubmit = () => {
    const selectedKeys = Object.entries(exportSelectedColumns)
      .filter(([, checked]) => checked)
      .map(([key]) => key);
    onConfirm(exportFilters, selectedKeys);
  };

  const hasSelectedColumns = Object.values(exportSelectedColumns).some(Boolean);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Export Leads to Excel</DialogTitle>
          <DialogDescription>
            Select columns and apply additional filters for the export.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Select Columns to Export</Label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-md p-2">
              {allColumns.filter(col => col.key !== 'actions').map((column) => (
                <div key={column.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`export-col-${column.id}`}
                    checked={exportSelectedColumns[column.key]}
                    onCheckedChange={(checked) => handleColumnToggle(column.key, !!checked)}
                  />
                  <label
                    htmlFor={`export-col-${column.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {column.label}
                  </label>
                </div>
              ))}
            </div>
            {!hasSelectedColumns && <p className="text-destructive text-sm mt-1">Please select at least one column to export.</p>}
          </div>

          <div className="grid gap-2">
            <Label>Apply Export Filters</Label>
            <div className="space-y-2">
              <Label htmlFor="export-address">Area / Address</Label>
              <Input
                id="export-address"
                placeholder="e.g., Indore"
                value={exportFilters.address}
                onChange={(e) => handleFilterChange("address", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="export-lead_type">Lead Type</Label>
              <Select value={exportFilters.lead_type === "" ? "all" : exportFilters.lead_type} onValueChange={(value) => handleFilterChange("lead_type", value)}>
                <SelectTrigger id="export-lead_type"><SelectValue placeholder="All types" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {allLeadTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="export-status">Status</Label>
              <Select value={exportFilters.status === "" ? "all" : exportFilters.status} onValueChange={(value) => handleFilterChange("status", value)}>
                <SelectTrigger id="export-status"><SelectValue placeholder="All statuses" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {allStatuses.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="export-assigned_to">Assigned To</Label>
              <Select value={exportFilters.assigned_to === "" ? "all" : exportFilters.assigned_to} onValueChange={(value) => handleFilterChange("assigned_to", value)}>
                <SelectTrigger id="export-assigned-to"><SelectValue placeholder="All users" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {allCompanyUsers.map(u => <SelectItem key={u.id} value={u.name}>{u.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                    <Label htmlFor="export-created_at_start">Created After</Label>
                    <Input
                        id="export-created_at_start"
                        type="date"
                        value={exportFilters.created_at_start}
                        onChange={(e) => handleFilterChange("created_at_start", e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="export-created_at_end">Created Before</Label>
                    <Input
                        id="export-created_at_end"
                        type="date"
                        value={exportFilters.created_at_end}
                        onChange={(e) => handleFilterChange("created_at_end", e.target.value)}
                    />
                </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isExporting || !hasSelectedColumns}>
            {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ExportIcon className="mr-2 h-4 w-4" />}
            Confirm Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


export default function LeadsPage() {
  const router = useRouter()
  const { toast } = useToast();

  const [user, setUser] = useState<LoggedInUser | null>(null)
  const [allLeads, setAllLeads] = useState<Lead[]>([])
  const [companyUsers, setCompanyUsers] = useState<CompanyUser[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<"my" | "all">("my")
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [showReassignModal, setShowReassignModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showActivitiesModal, setShowActivitiesModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPdfDialog, setShowPdfDialog] = useState(false)
  const [leadForPdf, setLeadForPdf] = useState<Lead | null>(null)

  const [visibleColumns, setVisibleColumns] = useState<ColumnConfig[]>([
    { id: "company_name", label: "Lead Name", key: "company_name" },
    { id: "contact_name", label: "Contact Person Name", key: "contact_name" },
    { id: "phone", label: "Contact Person Phone", key: "phone" },
    { id: "source", label: "Source", key: "source" },
    { id: "status", label: "Status", key: "status" },
    { id: "last_activity", label: "Last Activity", key: "last_activity" },
    { id: "actions", label: "Actions", key: "actions" },
  ])

  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({
    company_name: true,
    contact_name: true,
    phone: true,
    email: false,
    website: false,
    linkedIn: false,
    contact_email: false,
    designation: false,
    contact_linkedin: false,
    contact_pan: false,
    source: true,
    address: false,
    address_2: false,
    city: false,
    state: false,
    country: false,
    pincode: false,
    team_size: false,
    turnover: false,
    segment: false,
    verticles: false,
    current_system: false,
    machine_specification: false,
    challenges: false,
    remark: false,
    lead_type: false,
    assigned_to: false,
    status: true,
    opportunity_business: false,
    target_closing_date: false,
    last_activity: true,
    actions: true,
  });

  const [isExporting, setIsExporting] = useState(false);
  const statusOptions = Object.keys(statusColors);
  const [dripSequences, setDripSequences] = useState<ApiDripSequenceList[]>([]);
  const [showAssignDripModal, setShowAssignDripModal] = useState(false);
  const [showConvertLeadToClientModal, setShowConvertLeadToClientModal] = useState(false); // New state for conversion modal

  // Updated to use the LeadsPageFilters interface
  const [filters, setFilters] = useState<LeadsPageFilters>({
    address: "", lead_type: "", status: "", assigned_to: "",
    created_at_start: "", created_at_end: ""
  });
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(30);

  // New state for controlling the Export Options Modal
  const [showExportOptionsModal, setShowExportOptionsModal] = useState(false);

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
        const [usersData, allLeadsData, dripsData] = await Promise.all([
          userApi.getUsers(),
          api.getAllLeads(),
          api.getDripSequences()
        ]);
        const transformedLeads: Lead[] = allLeadsData.map((lead: ApiLead & { last_activity?: ApiActivity | null }) => ({
          id: lead.id.toString(), company_name: lead.company_name, contacts: lead.contacts || [], phone_2: lead.phone_2, email: lead.email || "", website: lead.website, linkedIn: lead.linkedIn, address: lead.address, address_2: lead.address_2, city: lead.city, state: lead.state, country: lead.country, pincode: lead.pincode, team_size: lead.team_size, turnover: lead.turnover, source: lead.source, segment: lead.segment, verticles: lead.verticles, remark: lead.remark, machine_specification: lead.machine_specification, challenges: lead.challenges, assigned_to: lead.assigned_to, current_system: lead.current_system, lead_type: lead.lead_type, status: lead.status, created_at: lead.created_at, updated_at: lead.updated_at || lead.created_at,
          last_activity: lead.last_activity || null,
          opportunity_business: lead.opportunity_business,
          target_closing_date: lead.target_closing_date,
        }));
        const transformedUsers: CompanyUser[] = usersData.map((user: ApiUser) => ({
          id: user.id.toString(), name: user.username, email: user.email || `${user.username}@company.com`, role: user.role || "user",
        }));
        setAllLeads(transformedLeads);
        setCompanyUsers(transformedUsers);
        setDripSequences(dripsData);
        if (parsedUser.role !== "admin") {
          setViewMode("my");
        } else {
          setViewMode("all");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load leads.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const newVisibleColumns = ALL_COLUMNS.filter(col => columnVisibility[col.id]);
    setVisibleColumns(newVisibleColumns);
  }, [columnVisibility]);

  const filteredLeads = useMemo(() => {
    let leadsToProcess = (viewMode === "my" && user)
      ? allLeads.filter((lead) => lead.assigned_to === user.username)
      : allLeads;

    if (filters.address) { leadsToProcess = leadsToProcess.filter(lead => lead.address?.toLowerCase().includes(filters.address.toLowerCase())); }
    if (filters.lead_type) { leadsToProcess = leadsToProcess.filter(lead => lead.lead_type === filters.lead_type); }
    if (filters.status) { leadsToProcess = leadsToProcess.filter(lead => lead.status === filters.status); }
    if (filters.assigned_to) { leadsToProcess = leadsToProcess.filter(lead => lead.assigned_to === filters.assigned_to); }

    // Apply created_at date range filters
    if (filters.created_at_start) {
        const startDate = new Date(filters.created_at_start);
        leadsToProcess = leadsToProcess.filter(lead => new Date(lead.created_at) >= startDate);
    }
    if (filters.created_at_end) {
        const endDate = new Date(filters.created_at_end);
        // Set end date to end of the day to include leads created on the end date
        endDate.setHours(23, 59, 59, 999);
        leadsToProcess = leadsToProcess.filter(lead => new Date(lead.created_at) <= endDate);
    }


    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      leadsToProcess = leadsToProcess.filter(
        (lead) =>
          (lead.company_name && lead.company_name.toLowerCase().includes(lowerCaseSearchTerm)) ||
          (lead.contacts && lead.contacts.some(c => c && c.contact_name && c.contact_name.toLowerCase().includes(lowerCaseSearchTerm))) ||
          (lead.email && lead.email.toLowerCase().includes(lowerCaseSearchTerm)) ||
          (lead.website && lead.website.toLowerCase().includes(lowerCaseSearchTerm)) || // New search field
          (lead.linkedIn && lead.linkedIn.toLowerCase().includes(lowerCaseSearchTerm)) || // New search field
          (lead.address && lead.address.toLowerCase().includes(lowerCaseSearchTerm)) || // Search address
          (lead.address_2 && lead.address_2.toLowerCase().includes(lowerCaseSearchTerm)) || // Search address 2
          (lead.city && lead.city.toLowerCase().includes(lowerCaseSearchTerm)) || // Search city
          (lead.state && lead.state.toLowerCase().includes(lowerCaseSearchTerm)) || // Search state
          (lead.country && lead.country.toLowerCase().includes(lowerCaseSearchTerm)) || // Search country
          (lead.pincode && lead.pincode.toLowerCase().includes(lowerCaseSearchTerm)) || // Search pincode
          (lead.phone_2 && lead.phone_2.toLowerCase().includes(lowerCaseSearchTerm)) || // Search company phone 2
          (lead.contacts && lead.contacts.some(c => c && c.phone && c.phone.toLowerCase().includes(lowerCaseSearchTerm))) || // Search contact phone
          (lead.contacts && lead.contacts.some(c => c && c.email && c.email.toLowerCase().includes(lowerCaseSearchTerm))) || // Search contact email
          (lead.contacts && lead.contacts.some(c => c && c.designation && c.designation.toLowerCase().includes(lowerCaseSearchTerm))) || // Search contact designation
          (lead.contacts && lead.contacts.some(c => c && c.linkedIn && c.linkedIn.toLowerCase().includes(lowerCaseSearchTerm))) || // Search contact linkedIn
          (lead.contacts && lead.contacts.some(c => c && c.pan && c.pan.toLowerCase().includes(lowerCaseSearchTerm))) || // Search contact pan
          (lead.last_activity && lead.last_activity.details.toLowerCase().includes(lowerCaseSearchTerm))
      );
    }

    Object.entries(columnFilters).forEach(([key, value]) => {
      if (value) {
        const filterValue = value.toLowerCase();
        leadsToProcess = leadsToProcess.filter(lead => {
          // Handle specific keys that are nested or require special logic for filtering
          if (key === 'contact_name') {
            return lead.contacts?.some(c => c.contact_name?.toLowerCase().includes(filterValue));
          }
          if (key === 'phone') {
            return lead.contacts?.some(c => c.phone?.toLowerCase().includes(filterValue));
          }
          if (key === 'designation') { // Filter by contact designation
            return lead.contacts?.some(c => c.designation?.toLowerCase().includes(filterValue));
          }
          if (key === 'contact_email') { // Filter by contact email
            return lead.contacts?.some(c => c.email?.toLowerCase().includes(filterValue));
          }
          if (key === 'contact_linkedin') { // Filter by contact LinkedIn
            return lead.contacts?.some(c => c.linkedIn?.toLowerCase().includes(filterValue));
          }
          if (key === 'contact_pan') { // Filter by contact PAN
            return lead.contacts?.some(c => c.pan?.toLowerCase().includes(filterValue));
          }
          if (key === 'last_activity') {
            return lead.last_activity?.details.toLowerCase().includes(filterValue);
          }
          // For other direct properties
          const leadValue = (lead as any)[key];
          return leadValue?.toString().toLowerCase().includes(filterValue);
        });
      }
    });

    return leadsToProcess;
  }, [allLeads, user, viewMode, filters, searchTerm, columnFilters]);

  const paginatedLeads = useMemo(() => {
      const startIndex = (currentPage - 1) * rowsPerPage;
      const endIndex = startIndex + rowsPerPage;
      return filteredLeads.slice(startIndex, endIndex);
  }, [filteredLeads, currentPage, rowsPerPage]);

  const getUserName = (userId: string) => {
    const foundUser = companyUsers.find((u) => u.name === userId || u.id === userId)
    return foundUser ? foundUser.name : userId
  }
  const handleViewDetails = (lead: Lead) => { router.push(`/dashboard/leads/${lead.id}`) }
  const handleReassignLead = (lead: Lead) => { setSelectedLead(lead); setShowReassignModal(true); }
  const handleEditLead = (lead: Lead) => { setSelectedLead(lead); setShowEditModal(true); }
  const handleViewActivities = (lead: Lead) => { setSelectedLead(lead); setShowActivitiesModal(true); }

  // Opens the ExportOptionsModal
  const handleOpenExportModal = () => {
    setShowExportOptionsModal(true);
  };

  // Helper to escape CSV values
  const escapeCsvValue = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined) return '';
    let stringValue = String(value);
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  // Handles the confirmed export action from the modal
  const handleConfirmExport = async (exportFilters: LeadsPageFilters, selectedColumnKeys: string[]) => {
    if (selectedColumnKeys.length === 0) {
      toast({ title: "No columns selected", description: "Please select at least one column to export.", variant: "destructive" });
      return;
    }

    setIsExporting(true);
    try {
      // Apply export-specific filters to all leads
      let leadsToExport = allLeads;

      // If viewMode is 'my' for the table, apply that filter here unless specifically overridden in export filters
      // For now, we'll re-apply the viewMode filter if it's 'my'
      if (viewMode === "my" && user) {
        leadsToExport = leadsToExport.filter((lead) => lead.assigned_to === user.username);
      }

      // Apply the selected export filters
      if (exportFilters.address) { leadsToExport = leadsToExport.filter(lead => lead.address?.toLowerCase().includes(filters.address.toLowerCase())); }
      if (exportFilters.lead_type) { leadsToExport = leadsToExport.filter(lead => lead.lead_type === filters.lead_type); }
      if (exportFilters.status) { leadsToExport = leadsToExport.filter(lead => lead.status === filters.status); }
      if (exportFilters.assigned_to) { leadsToExport = leadsToExport.filter(lead => filters.assigned_to === "all" ? true : lead.assigned_to === filters.assigned_to); } // Handle "all" explicitly

      // Apply created_at date range filters for export
      if (exportFilters.created_at_start) {
          const startDate = new Date(filters.created_at_start);
          leadsToExport = leadsToExport.filter(lead => new Date(lead.created_at) >= startDate);
      }
      if (exportFilters.created_at_end) {
          const endDate = new Date(filters.created_at_end);
          endDate.setHours(23, 59, 59, 999); // Set to end of day
          leadsToExport = leadsToExport.filter(lead => new Date(lead.created_at) <= endDate);
      }


      if (leadsToExport.length === 0) {
        toast({ title: "No leads to export", description: "The applied export filters result in zero leads." });
        return;
      }

      // --- Frontend CSV Generation Logic ---
      const headers = selectedColumnKeys.map(key => {
        const column = ALL_COLUMNS.find(c => c.key === key);
        return escapeCsvValue(column ? column.label : capitalize(key.replace(/_/g, ' ')));
      }).join(',');

      const rows = leadsToExport.map(lead => {
        return selectedColumnKeys.map(key => {
          const primaryContact = lead.contacts && lead.contacts.length > 0 ? lead.contacts[0] : null;
          let value: string | number | null | undefined;

          switch (key) {
            case 'contact_name':
              value = primaryContact?.contact_name;
              break;
            case 'phone':
              value = primaryContact?.phone;
              break;
            case 'designation':
              value = primaryContact?.designation;
              break;
            case 'contact_email':
              value = primaryContact?.email;
              break;
            case 'linkedIn':
              value = lead.linkedIn;
              break;
            case 'website':
              value = lead.website;
              break;
            case 'contact_linkedin':
              value = primaryContact?.linkedIn;
              break;
            case 'contact_pan':
              value = primaryContact?.pan;
              break;
            case 'last_activity':
              value = lead.last_activity
                ? `${formatDateTime(lead.last_activity.created_at)}: ${lead.last_activity.details}`
                : "N/A";
              break;
            case 'target_closing_date':
                value = lead.target_closing_date ? lead.target_closing_date.split('T')[0] : '';
                break;
            default:
              value = (lead as any)[key as keyof Lead];
              break;
          }
          return escapeCsvValue(value);
        }).join(',');
      }).join('\n');

      const csvContent = `${headers}\n${rows}`;
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "leads_export.csv"; // Changed to .csv
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast({ title: "Export Started", description: `${leadsToExport.length} leads are being downloaded with selected columns.` });
    } catch (error) {
      console.error("Failed to export leads:", error);
      toast({ title: "Export Failed", description: error instanceof Error ? error.message : "An unknown error occurred during export. Please try again.", variant: "destructive" });
    } finally {
      setIsExporting(false);
      setShowExportOptionsModal(false); // Close modal after action
    }
  };

  const handleViewHistory = (lead: Lead) => { setSelectedLead(lead); setShowHistoryModal(true); }

  const handleReassignComplete = async (leadId: string, newUserId: string) => {
    const newUser = companyUsers.find((u) => u.id === newUserId)
    if (!newUser) {
      toast({ title: "Error", description: "Selected user not found.", variant: "destructive" });
      return;
    }
    try {
      await api.updateLead(Number(leadId), { assigned_to: newUser.name });
      const updatedAllLeads = allLeads.map((lead) =>
        lead.id === leadId ? { ...lead, assigned_to: newUser.name, updated_at: new Date().toISOString() } : lead,
      );
      setAllLeads(updatedAllLeads);
      toast({ title: "Success!", description: `Lead has been reassigned to ${newUser.name}.` });
    } catch (error) {
      console.error("Failed to reassign lead:", error);
      toast({ title: "Reassignment Failed", description: error instanceof Error ? error.message : "An unknown error occurred.", variant: "destructive" });
    } finally {
      setShowReassignModal(false);
    }
  }

  const handleEditComplete = async (leadId: string, updatedData: Partial<Lead>) => {
    try {
      await api.updateLead(Number(leadId), updatedData);
      const updatedAllLeads = allLeads.map((lead) =>
        lead.id === leadId ? { ...lead, ...updatedData, updated_at: new Date().toISOString() } : lead
      );
      setAllLeads(updatedAllLeads);
      toast({ title: "Success", description: "Lead details have been updated." });
    } catch (error) {
      console.error("Failed to update lead:", error);
      toast({ title: "Update Failed", description: error instanceof Error ? error.message : "Could not save changes.", variant: "destructive" });
    } finally {
      setShowEditModal(false);
    }
  };

  const handleFilterChange = (key: keyof LeadsPageFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value === "all" ? "" : value }));
    setCurrentPage(1); // Reset to first page on filter change
  };
  const clearFilters = () => {
    setFilters({ address: "", lead_type: "", status: "", assigned_to: "", created_at_start: "", created_at_end: "" });
    setCurrentPage(1); // Reset to first page on clear filters
  };
  const removeFilter = (key: keyof LeadsPageFilters) => { handleFilterChange(key, ""); };
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const handleColumnFilterChange = (key: string, value: string) => {
    setColumnFilters(prev => ({...prev, [key]: value}));
    setCurrentPage(1);
  };

  const handleAssignDrip = (lead: Lead) => { setSelectedLead(lead); setShowAssignDripModal(true); };

  const handleConvertLeadToClient = (lead: Lead) => {
    setSelectedLead(lead);
    setShowConvertLeadToClientModal(true);
  };

  const handleConversionSuccess = (convertedLeadId: string) => {
    // Update the status of the converted lead in the local state
    const updatedAllLeads = allLeads.map(lead =>
      lead.id === convertedLeadId ? { ...lead, status: "Won/Deal Done", updated_at: new Date().toISOString() } : lead
    );
    setAllLeads(updatedAllLeads); // Update the local state
    toast({ title: "Lead Converted", description: "The lead has been successfully converted to a client." });
    setShowConvertLeadToClientModal(false);
    router.refresh(); // Invalidate the cache for the current page and re-fetch data
    router.push('/dashboard/clients'); // Then navigate to the clients page
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

  const handleDownloadPdf = (lead: Lead) => { setLeadForPdf(lead); setShowPdfDialog(true); }

  const downloadLeadAsPdf = (lead: Lead, includeRemark: boolean) => {
    const doc = new jsPDF()
    doc.setFontSize(20);
    doc.text(`Lead Details: ${lead.company_name}`, 14, 22);
    const leadData = [
      ["Company", lead.company_name], ["Website", lead.website || "N/A"], ["Company LinkedIn", lead.linkedIn || "N/A"],
      ["Status", lead.status], ["Assigned To", getUserName(lead.assigned_to)], ["Source", lead.source || "N/A"],
      ["Lead Type", lead.lead_type || "N/A"], ["Company Email", lead.email || "N/A"], ["Company Phone 2", lead.phone_2 || "N/A"],
      ["Address Line 1", lead.address || "N/A"], ["Address Line 2", lead.address_2 || "N/A"],
      ["City", lead.city || "N/A"], ["State", lead.state || "N/A"], ["Country", lead.country || "N/A"], ["Pincode", lead.pincode || "N/A"],
      ["Team Size", lead.team_size || "N/A"], ["Turnover", lead.turnover || "N/A"],
      ["Current System", lead.current_system || "N/A"], ["Challenges", lead.challenges || "N/A"], ["Machine Spec.", lead.machine_specification || "N/A"],
      ["Opportunity Business", lead.opportunity_business || "N/A"], ["Target Closing Date", lead.target_closing_date || "N/A"],
      ["Verticals", lead.verticles || "N/A"]
    ];
    autoTable(doc, { startY: 30, head: [["Field", "Value"]], body: leadData, theme: "grid", headStyles: { fillColor: [41, 128, 185] } });
    let lastY = (doc as any).lastAutoTable.finalY;
    if (lead.contacts && lead.contacts.length > 0) {
      doc.setFontSize(14);
      doc.text("Contact Persons", 14, lastY + 15);
      const contactData = lead.contacts.map((c) => [c.contact_name, c.phone, c.email || "N/A", c.designation || "N/A", c.linkedIn || "N/A", c.pan || "N/A"]); // Include new fields
      autoTable(doc, { startY: lastY + 20, head: [["Name", "Phone", "Email", "Designation", "LinkedIn", "PAN"]], body: contactData, theme: "striped", headStyles: { fillColor: [41, 128, 185] } });
      lastY = (doc as any).lastAutoTable.finalY;
    }
    if (includeRemark && lead.remark) {
      doc.setFontSize(14);
      doc.text("Remarks", 14, lastY + 15);
      const splitRemark = doc.splitTextToSize(lead.remark, 180);
      doc.setFontSize(10);
      doc.text(splitRemark, 14, lastY + 22);
    }
    doc.save(`Lead_${lead.company_name.replace(/\s/g, "_")}.pdf`);
    setShowPdfDialog(false);
    setLeadForPdf(null);
  }

  if (isLoading) { return ( <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" /><span className="ml-2">Loading leads...</span></div> )}
  if (error) { return ( <div className="flex items-center justify-center h-64"><div className="text-center"><p className="text-red-500 mb-4">{error}</p><Button onClick={() => window.location.reload()}>Retry</Button></div></div> )}
  if (!user) { return <div>Loading...</div> }

   return (
    <div className="flex h-full flex-col space-y-4">
      <div className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Lead Details</h1>
            <p className="text-muted-foreground">{viewMode === "all" ? "Manage and track all leads" : "Manage and track your assigned leads"}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={handleOpenExportModal} variant="outline" disabled={isExporting}>
              {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ExportIcon className="mr-2 h-4 w-4" />}
              Export to Excel
            </Button>
            <Link href="/dashboard/create-lead"><Button><Plus className="mr-2 h-4 w-4" />Create Lead</Button></Link>
          </div>
        </div>
      </div>

      <Card className="flex flex-1 flex-col overflow-hidden">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle>
              {viewMode === "all" ? "All Leads" : "My Assigned Leads"}
              <span className="ml-2 text-sm font-normal text-muted-foreground">({filteredLeads.length} leads)</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button variant={viewMode === "my" ? "default" : "outline"} size="sm" onClick={() => setViewMode("my")} className="flex items-center space-x-2"><User className="h-4 w-4" /><span>My Leads</span></Button>
              <Button variant={viewMode === "all" ? "default" : "outline"} size="sm" onClick={() => setViewMode("all")} className="flex items-center space-x-2"><Users className="h-4 w-4" /><span>All Leads</span></Button>
            </div>
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
                    {ALL_COLUMNS.filter(col => col.key !== 'actions').map((column) => (
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
                  <div className="space-y-2"><Label htmlFor="address">Area / Address</Label><Input id="address" placeholder="e.g., Indore" value={filters.address} onChange={(e) => handleFilterChange("address", e.target.value)} /></div>
                  <div className="space-y-2"><Label htmlFor="lead_type">Lead Type</Label><Select value={filters.lead_type === "" ? "all" : filters.lead_type} onValueChange={(value) => handleFilterChange("lead_type", value)}><SelectTrigger><SelectValue placeholder="All types" /></SelectTrigger><SelectContent><SelectItem value="all">All Types</SelectItem>{leadTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-2"><Label htmlFor="status">Status</Label><Select value={filters.status === "" ? "all" : filters.status} onValueChange={(value) => handleFilterChange("status", value)}><SelectTrigger><SelectValue placeholder="All statuses" /></SelectTrigger><SelectContent><SelectItem value="all">All Statuses</SelectItem>{Object.keys(statusColors).map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-2"><Label htmlFor="assigned_to">Assigned To</Label><Select value={filters.assigned_to === "" ? "all" : filters.assigned_to} onValueChange={(value) => handleFilterChange("assigned_to", value)}><SelectTrigger><SelectValue placeholder="All users" /></SelectTrigger><SelectContent><SelectItem value="all">All Users</SelectItem>{companyUsers.map(u => <SelectItem key={u.id} value={u.name}>{u.name}</SelectItem>)}</SelectContent></Select></div>
                  <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                          <Label htmlFor="created_at_start">Created After</Label>
                          <Input
                              id="created_at_start"
                              type="date"
                              value={filters.created_at_start}
                              onChange={(e) => handleFilterChange("created_at_start", e.target.value)}
                          />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="created_at_end">Created Before</Label>
                          <Input
                              id="created_at_end"
                              type="date"
                              value={filters.created_at_end}
                              onChange={(e) => handleFilterChange("created_at_end", e.target.value)}
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
              {Object.entries(filters).map(([key, value]) => value ? (<Badge key={key} variant="secondary" className="flex items-center gap-1">{key.replace(/_/g, " ").replace("created at", "Created")}: {value}<button onClick={() => removeFilter(key as keyof LeadsPageFilters)} className="rounded-full hover:bg-muted-foreground/20 p-0.5"><XIcon className="h-3 w-3" /></button></Badge>) : null)}
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
                  {paginatedLeads.map((lead) => (
                    <TableRowComponent
                      key={lead.id}
                      lead={lead}
                      columns={visibleColumns}
                      getUserName={getUserName}
                      handleViewDetails={handleViewDetails}
                      handleViewActivities={handleViewActivities}
                      handleViewHistory={handleViewHistory}
                      handleReassignLead={handleReassignLead}
                      handleEditLead={handleEditLead}
                      handleDownloadPdf={handleDownloadPdf}
                      handleAssignDrip={handleAssignDrip}
                      handleConvertLeadToClient={handleConvertLeadToClient}
                      canManageAllLeads={canManageAllLeads(user)}
                    />
                  ))}
                </TableBody>
              </Table>
            </DndContext>
            {filteredLeads.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-muted-foreground">
                  {viewMode === "all" ? "No leads found matching your search criteria." : "No leads assigned to you yet."}
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
                        Page {currentPage} of {Math.ceil(filteredLeads.length / rowsPerPage) || 1}
                    </span>
                    <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
                            Previous
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => prev + 1)} disabled={currentPage >= Math.ceil(filteredLeads.length / rowsPerPage)}>
                            Next
                        </Button>
                    </div>
                </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <AssignDripModal lead={selectedLead as ApiLead | null} dripSequences={dripSequences} isOpen={showAssignDripModal} onClose={() => setShowAssignDripModal(false)} onSuccess={() => { setShowAssignDripModal(false); }} />
      {selectedLead && (
        <>
          <LeadActivitiesModal lead={selectedLead} isOpen={showActivitiesModal} onClose={() => setShowActivitiesModal(false)} />
          <LeadHistoryModal lead={selectedLead} isOpen={showHistoryModal} onClose={() => setShowHistoryModal(false)} />
          {canManageAllLeads(user) && (<ReassignLeadModal lead={selectedLead} isOpen={showReassignModal} onClose={() => setShowReassignModal(false)} onReassign={handleReassignComplete} users={companyUsers} />)}
          <EditLeadModal lead={selectedLead} isOpen={showEditModal} onClose={() => setShowEditModal(false)} onSave={handleEditComplete} users={companyUsers} statusOptions={statusOptions} />
          <ConvertLeadToClientModal // New modal
            lead={selectedLead}
            isOpen={showConvertLeadToClientModal}
            onClose={() => setShowConvertLeadToClientModal(false)}
            onSuccess={handleConversionSuccess}
          />
        </>
      )}
      {showPdfDialog && leadForPdf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Download Lead PDF</CardTitle><Button variant="ghost" size="icon" onClick={() => setShowPdfDialog(false)}><XIcon className="h-4 w-4" /></Button></CardHeader>
            <CardContent>
              <p className="mb-6">Do you want to include the "Remarks" section in the PDF for <strong>{leadForPdf.company_name}</strong>?</p>
              <div className="flex justify-end space-x-4">
                <Button variant="outline" onClick={() => downloadLeadAsPdf(leadForPdf, false)}><FileDown className="mr-2 h-4 w-4" />Without Remarks</Button>
                <Button onClick={() => downloadLeadAsPdf(leadForPdf, true)}><MessageSquareQuote className="mr-2 h-4 w-4" />With Remarks</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Export Options Modal */}
      <ExportOptionsModal
        isOpen={showExportOptionsModal}
        onClose={() => setShowExportOptionsModal(false)}
        onConfirm={handleConfirmExport}
        allColumns={ALL_COLUMNS}
        currentTableFilters={filters}
        allLeadTypes={leadTypes}
        allStatuses={statusOptions}
        allCompanyUsers={companyUsers}
        isExporting={isExporting}
      />
    </div>
  );
}