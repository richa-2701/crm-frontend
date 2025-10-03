// frontend/app/dashboard/leads/recycle-bin/page.tsx
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
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MoreHorizontal, Search, User, Users, Loader2, Filter, XIcon, ArrowLeft, History } from "lucide-react"
import { api, userApi, leadApi, type ApiLead, type ApiUser, type ApiActivity } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { formatDateTime } from "@/lib/date-format";
import React from "react"

interface Contact { id: number; lead_id: number; contact_name: string; phone: string; email: string | null; designation: string | null; }
interface Lead { id: string; company_name: string; contacts: Contact[]; assigned_to: string; status: string; created_at: string; updated_at: string; }

interface LoggedInUser { id: string; username: string; email: string; role: string; }
interface CompanyUser { id: string; name: string; email: string; role: string; }
const leadTypes = ["Hot Lead", "Cold Lead", "Warm Lead"];

interface LeadsPageFilters {
    address: string;
    lead_type: string;
    status: string;
    assigned_to: string;
}

export default function RecycleBinPage() {
  const router = useRouter()
  const { toast } = useToast();

  const [user, setUser] = useState<LoggedInUser | null>(null)
  const [deletedLeads, setDeletedLeads] = useState<Lead[]>([])
  const [companyUsers, setCompanyUsers] = useState<CompanyUser[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [filters, setFilters] = useState<LeadsPageFilters>({ address: "", lead_type: "", status: "", assigned_to: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(30);
  
  const statusOptions = useMemo(() => {
    if (!deletedLeads) return [];
    return [...new Set(deletedLeads.map(lead => lead.status))];
  }, [deletedLeads]);


  const fetchData = useCallback(async () => {
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
      const [usersData, deletedLeadsData] = await Promise.all([
        userApi.getUsers(),
        leadApi.getDeletedLeads(),
      ]);
      const transformedLeads: Lead[] = deletedLeadsData.map((lead: ApiLead) => ({
        id: lead.id.toString(),
        company_name: lead.company_name,
        contacts: lead.contacts || [],
        assigned_to: lead.assigned_to || 'N/A',
        status: lead.status || 'N/A',
        created_at: lead.created_at,
        updated_at: lead.updated_at || lead.created_at,
      }));
      const transformedUsers: CompanyUser[] = usersData.map((user: ApiUser) => ({
        id: user.id.toString(), name: user.username, email: user.email || `${user.username}@company.com`, role: user.role || "user",
      }));
      setDeletedLeads(transformedLeads);
      setCompanyUsers(transformedUsers);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load deleted leads.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredLeads = useMemo(() => {
    let leadsToProcess = deletedLeads;
    if (filters.lead_type) { leadsToProcess = leadsToProcess.filter(lead => (lead as any).lead_type === filters.lead_type); }
    if (filters.status) { leadsToProcess = leadsToProcess.filter(lead => lead.status === filters.status); }
    if (filters.assigned_to) { leadsToProcess = leadsToProcess.filter(lead => lead.assigned_to === filters.assigned_to); }

    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      leadsToProcess = leadsToProcess.filter(
        (lead) =>
          (lead.company_name && lead.company_name.toLowerCase().includes(lowerCaseSearchTerm)) ||
          (lead.contacts && lead.contacts.some(c => c && c.contact_name && c.contact_name.toLowerCase().includes(lowerCaseSearchTerm)))
      );
    }
    return leadsToProcess;
  }, [deletedLeads, filters, searchTerm]);

  const paginatedLeads = useMemo(() => {
      const startIndex = (currentPage - 1) * rowsPerPage;
      const endIndex = startIndex + rowsPerPage;
      return filteredLeads.slice(startIndex, endIndex);
  }, [filteredLeads, currentPage, rowsPerPage]);

  const handleRestoreLead = async (lead: Lead) => {
    try {
        await leadApi.restoreLead(parseInt(lead.id, 10));
        setDeletedLeads(prev => prev.filter(l => l.id !== lead.id));
        toast({
            title: "Lead Restored",
            description: `${lead.company_name} has been successfully restored.`,
        });
    } catch (error) {
        toast({
            title: "Error",
            description: "Failed to restore the lead.",
            variant: "destructive",
        });
    }
  };

  const getUserName = (userId: string) => {
    const foundUser = companyUsers.find((u) => u.name === userId || u.id === userId)
    return foundUser ? foundUser.name : userId
  }

  const handleFilterChange = (key: keyof LeadsPageFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value === "all" ? "" : value }));
    setCurrentPage(1);
  };
  const clearFilters = () => {
    setFilters({ address: "", lead_type: "", status: "", assigned_to: "" });
    setCurrentPage(1);
  };
  const removeFilter = (key: keyof LeadsPageFilters) => { handleFilterChange(key, ""); };
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  if (isLoading) { return ( <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" /><span className="ml-2">Loading recycle bin...</span></div> )}
  if (error) { return ( <div className="flex items-center justify-center h-64"><div className="text-center"><p className="text-red-500 mb-4">{error}</p><Button onClick={() => window.location.reload()}>Retry</Button></div></div> )}
  if (!user) { return <div>Loading...</div> }

  return (
    <>
      <div className="flex h-full flex-col space-y-4">
        <div className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
               <Button variant="outline" size="icon" onClick={() => router.back()} aria-label="Go back">
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Recycle Bin</h1>
                    <p className="text-muted-foreground">Manage and restore deleted leads.</p>
                </div>
            </div>
          </div>
        </div>

        <Card className="flex flex-1 flex-col overflow-hidden">
          <CardHeader className="flex-shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle>
                Deleted Leads
                <span className="ml-2 text-sm font-normal text-muted-foreground">({filteredLeads.length} items)</span>
              </CardTitle>
            </div>
            <div className="flex items-center space-x-2 pt-4">
              <div className="relative flex-grow">
                <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by company or contact name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8 w-full"/>
              </div>
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
                    <div className="space-y-2"><Label htmlFor="lead_type">Lead Type</Label><Select value={filters.lead_type === "" ? "all" : filters.lead_type} onValueChange={(value) => handleFilterChange("lead_type", value)}><SelectTrigger><SelectValue placeholder="All types" /></SelectTrigger><SelectContent><SelectItem value="all">All Types</SelectItem>{leadTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select></div>
                    <div className="space-y-2"><Label htmlFor="status">Status</Label><Select value={filters.status === "" ? "all" : filters.status} onValueChange={(value) => handleFilterChange("status", value)}><SelectTrigger><SelectValue placeholder="All statuses" /></SelectTrigger><SelectContent><SelectItem value="all">All Statuses</SelectItem>{statusOptions.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent></Select></div>
                    <div className="space-y-2"><Label htmlFor="assigned_to">Assigned To</Label><Select value={filters.assigned_to === "" ? "all" : filters.assigned_to} onValueChange={(value) => handleFilterChange("assigned_to", value)}><SelectTrigger><SelectValue placeholder="All users" /></SelectTrigger><SelectContent><SelectItem value="all">All Users</SelectItem>{companyUsers.map(u => <SelectItem key={u.id} value={u.name}>{u.name}</SelectItem>)}</SelectContent></Select></div>
                    <Button onClick={clearFilters} variant="ghost" className="w-full">Clear All Filters</Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            {activeFilterCount > 0 && (
              <div className="flex items-center gap-2 pt-4 flex-wrap">
                <span className="text-sm font-medium">Active Filters:</span>
                {Object.entries(filters).map(([key, value]) => value ? (<Badge key={key} variant="secondary" className="flex items-center gap-1">{key.replace(/_/g, " ")}: {value}<button onClick={() => removeFilter(key as keyof LeadsPageFilters)} className="rounded-full hover:bg-muted-foreground/20 p-0.5"><XIcon className="h-3 w-3" /></button></Badge>) : null)}
              </div>
            )}
          </CardHeader>

          <CardContent className="flex flex-1 flex-col min-h-0">
            <div className="relative flex-1 overflow-auto rounded-md border">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-background">
                  <TableRow>
                    <TableHead>Lead Name</TableHead>
                    <TableHead>Contact Person</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date Deleted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedLeads.map((lead) => (
                    <TableRow key={lead.id}>
                        <TableCell className="font-medium">{lead.company_name}</TableCell>
                        <TableCell>{lead.contacts[0]?.contact_name || "N/A"}</TableCell>
                        <TableCell>{getUserName(lead.assigned_to)}</TableCell>
                        <TableCell><Badge variant="outline">{lead.status}</Badge></TableCell>
                        <TableCell>{formatDateTime(lead.updated_at)}</TableCell>
                        <TableCell className="text-right">
                           <Button size="sm" onClick={() => handleRestoreLead(lead)}>
                             <History className="mr-2 h-4 w-4" /> Restore
                           </Button>
                        </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredLeads.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-muted-foreground">The recycle bin is empty or no items match your search.</p>
                </div>
              )}
            </div>

            <div className="flex-shrink-0 pt-4">
              <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                      <Label htmlFor="rows-per-page" className="text-sm text-muted-foreground">Rows per page</Label>
                      <Select value={String(rowsPerPage)} onValueChange={(value) => { setRowsPerPage(Number(value)); setCurrentPage(1); }}>
                          <SelectTrigger className="w-20 h-9"><SelectValue /></SelectTrigger>
                          <SelectContent>{[10, 30, 50, 100].map(size => (<SelectItem key={size} value={String(size)}>{size}</SelectItem>))}</SelectContent>
                      </Select>
                  </div>
                  <div className="flex items-center space-x-4">
                      <span className="text-sm text-muted-foreground">
                          Page {currentPage} of {Math.ceil(filteredLeads.length / rowsPerPage) || 1}
                      </span>
                      <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>Previous</Button>
                          <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => prev + 1)} disabled={currentPage >= Math.ceil(filteredLeads.length / rowsPerPage)}>Next</Button>
                      </div>
                  </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}