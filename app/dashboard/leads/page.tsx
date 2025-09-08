//frontend/app/dashboard/leads/page.tsx
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
} from "lucide-react"
import Link from "next/link"
import { ReassignLeadModal } from "@/components/leads/reassign-lead-modal"
import { EditLeadModal } from "@/components/leads/edit-lead-modal"
import { LeadActivitiesModal } from "@/components/leads/lead-activities-modal"
import { LeadHistoryModal } from "@/components/leads/lead-history-modal"
import { AssignDripModal } from "@/components/leads/assign-drip-modal";
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

interface Contact { id: number; lead_id: number; contact_name: string; phone: string; email: string | null; designation: string | null; }
interface Lead { id: string; company_name: string; contacts: Contact[]; phone_2?: string; email: string; address?: string; team_size?: string; turnover?: string; source?: string; segment?: string; assigned_to: string; current_system?: string; machine_specification?: string; challenges?: string; remark?: string; lead_type?: string; status: string; created_at: string; updated_at: string; last_activity?: ApiActivity | null; }

interface LoggedInUser { id: string; username: string; email: string; role: string; }
interface CompanyUser { id: string; name: string; email: string; role: string; }

const statusColors = { new: "default", qualified: "secondary", unqualified: "destructive", not_our_segment: "destructive", "Meeting Done": "outline", "Demo Done": "outline" } as const;
const leadTypes = ["Hot Lead", "Cold Lead","Warm Lead"];
interface ColumnConfig { id: string; label: string; key: keyof Lead | "actions" | "contact_name" | "phone" | "last_activity"; render?: (lead: Lead) => React.ReactNode; }
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
            <Badge variant={statusColors[lead.status as keyof typeof statusColors] || "default"}>{capitalize(lead.status)}</Badge>
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

const ALL_COLUMNS: ColumnConfig[] = [
    { id: "company_name", label: "Lead Name", key: "company_name" },
    { id: "contact_name", label: "Contact Name", key: "contact_name" },
    { id: "phone", label: "Phone", key: "phone" },
    { id: "email", label: "Email", key: "email" },
    { id: "source", label: "Source", key: "source" },
    { id: "address", label: "Address", key: "address" },
    { id: "lead_type", label: "Lead Type", key: "lead_type" },
    { id: "assigned_to", label: "Assigned To", key: "assigned_to" },
    { id: "status", label: "Status", key: "status" },
    { id: "last_activity", label: "Last Activity", key: "last_activity" },
    { id: "actions", label: "Actions", key: "actions" },
];

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
    { id: "contact_name", label: "Contact Name", key: "contact_name" },
    { id: "phone", label: "Phone", key: "phone" },
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
    source: true,
    address: false,
    lead_type: false,
    assigned_to: false,
    status: true,
    last_activity: true,
    actions: true,
  });

  const [isExporting, setIsExporting] = useState(false);
  const statusOptions = Object.keys(statusColors);
  const [dripSequences, setDripSequences] = useState<ApiDripSequenceList[]>([]);
  const [showAssignDripModal, setShowAssignDripModal] = useState(false);
  const [filters, setFilters] = useState({ address: "", lead_type: "", status: "", assigned_to: "" });
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
        const [usersData, allLeadsData, dripsData] = await Promise.all([
          userApi.getUsers(),
          api.getAllLeads(),
          api.getDripSequences()
        ]);
        const transformedLeads: Lead[] = allLeadsData.map((lead: ApiLead & { last_activity?: ApiActivity | null }) => ({
          id: lead.id.toString(), company_name: lead.company_name, contacts: lead.contacts || [], phone_2: lead.phone_2, email: lead.email || "", address: lead.address, team_size: lead.team_size, turnover: lead.turnover, source: lead.source, segment: lead.segment, assigned_to: lead.assigned_to, current_system: lead.current_system, machine_specification: lead.machine_specification, challenges: lead.challenges, remark: lead.remark, lead_type: lead.lead_type, status: lead.status, created_at: lead.created_at, updated_at: lead.updated_at || lead.created_at,
          last_activity: lead.last_activity || null,
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
    
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      leadsToProcess = leadsToProcess.filter(
        (lead) =>
          (lead.company_name && lead.company_name.toLowerCase().includes(lowerCaseSearchTerm)) ||
          (lead.contacts && lead.contacts.some(c => c && c.contact_name && c.contact_name.toLowerCase().includes(lowerCaseSearchTerm))) ||
          (lead.email && lead.email.toLowerCase().includes(lowerCaseSearchTerm)) ||
          (lead.last_activity && lead.last_activity.details.toLowerCase().includes(lowerCaseSearchTerm))
      );
    }
    
    Object.entries(columnFilters).forEach(([key, value]) => {
      if (value) {
        const filterValue = value.toLowerCase();
        leadsToProcess = leadsToProcess.filter(lead => {
          if (key === 'contact_name' || key === 'phone') {
            return lead.contacts?.some(c => c[key as keyof Contact]?.toString().toLowerCase().includes(filterValue));
          }
          if (key === 'last_activity') {
            return lead.last_activity?.details.toLowerCase().includes(filterValue);
          }
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
  
  const handleExport = async () => {
    if (filteredLeads.length === 0) {
      toast({ title: "No leads to export", description: "Your current filter settings result in zero leads." });
      return;
    }
    setIsExporting(true);
    try {
      const leadIdsToExport = filteredLeads.map(lead => Number(lead.id));
      const blob = await api.exportLeads(leadIdsToExport);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "leads_export.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast({ title: "Export Started", description: `${filteredLeads.length} leads are being downloaded.` });
    } catch (error) {
      console.error("Failed to export leads:", error);
      toast({ title: "Export Failed", description: error instanceof Error ? error.message : "An unknown error occurred.", variant: "destructive" });
    } finally {
      setIsExporting(false);
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

  const handleFilterChange = (key: keyof typeof filters, value: string) => { setFilters(prev => ({ ...prev, [key]: value })); };
  const clearFilters = () => { setFilters({ address: "", lead_type: "", status: "", assigned_to: "" }); };
  const removeFilter = (key: keyof typeof filters) => { handleFilterChange(key, ""); };
  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  
  const handleColumnFilterChange = (key: string, value: string) => {
    setColumnFilters(prev => ({...prev, [key]: value}));
    setCurrentPage(1);
  };

  const handleAssignDrip = (lead: Lead) => { setSelectedLead(lead); setShowAssignDripModal(true); };
  
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
      ["Company", lead.company_name], ["Status", lead.status], ["Assigned To", getUserName(lead.assigned_to)], ["Source", lead.source || "N/A"],
      ["Lead Type", lead.lead_type || "N/A"], ["Email", lead.email || "N/A"], ["Address", lead.address || "N/A"], ["Team Size", lead.team_size || "N/A"],
      ["Turnover", lead.turnover || "N/A"], ["Current System", lead.current_system || "N/A"], ["Challenges", lead.challenges || "N/A"], ["Machine Spec.", lead.machine_specification || "N/A"],
    ];
    autoTable(doc, { startY: 30, head: [["Field", "Value"]], body: leadData, theme: "grid", headStyles: { fillColor: [41, 128, 185] } });
    let lastY = (doc as any).lastAutoTable.finalY;
    if (lead.contacts && lead.contacts.length > 0) {
      doc.setFontSize(14);
      doc.text("Contact Persons", 14, lastY + 15);
      const contactData = lead.contacts.map((c) => [c.contact_name, c.phone, c.email || "N/A", c.designation || "N/A"]);
      autoTable(doc, { startY: lastY + 20, head: [["Name", "Phone", "Email", "Designation"]], body: contactData, theme: "striped", headStyles: { fillColor: [41, 128, 185] } });
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
            <Button onClick={handleExport} variant="outline" disabled={isExporting || filteredLeads.length === 0}>
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
                  <div className="space-y-2"><Label htmlFor="lead_type">Lead Type</Label><Select value={filters.lead_type} onValueChange={(value) => handleFilterChange("lead_type", value)}><SelectTrigger><SelectValue placeholder="All types" /></SelectTrigger><SelectContent>{leadTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-2"><Label htmlFor="status">Status</Label><Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}><SelectTrigger><SelectValue placeholder="All statuses" /></SelectTrigger><SelectContent>{Object.keys(statusColors).map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-2"><Label htmlFor="assigned_to">Assigned To</Label><Select value={filters.assigned_to} onValueChange={(value) => handleFilterChange("assigned_to", value)}><SelectTrigger><SelectValue placeholder="All users" /></SelectTrigger><SelectContent>{companyUsers.map(u => <SelectItem key={u.id} value={u.name}>{u.name}</SelectItem>)}</SelectContent></Select></div>
                  <Button onClick={clearFilters} variant="ghost" className="w-full">Clear All Filters</Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          {activeFilterCount > 0 && (
            <div className="flex items-center gap-2 pt-4 flex-wrap">
              <span className="text-sm font-medium">Active Filters:</span>
              {Object.entries(filters).map(([key, value]) => value ? (<Badge key={key} variant="secondary" className="flex items-center gap-1">{value}<button onClick={() => removeFilter(key as keyof typeof filters)} className="rounded-full hover:bg-muted-foreground/20 p-0.5"><XIcon className="h-3 w-3" /></button></Badge>) : null)}
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
    </div>
  );
}