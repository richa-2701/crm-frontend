//frontend/app/dashboard/leads/page.tsx
"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  MoreHorizontal,
  Search,
  Plus,
  Eye,
  Calendar,
  Monitor,
  UserCheck,
  Edit,
  Users,
  User,
  Loader2,
  Activity,
  History,
} from "lucide-react"
import Link from "next/link"
import { LeadDetailsModal } from "@/components/leads/lead-details-modal"
import { ReassignLeadModal } from "@/components/leads/reassign-lead-modal"
import { EditLeadModal } from "@/components/leads/edit-lead-modal"
import { LeadActivitiesModal } from "@/components/leads/lead-activities-modal"
import { LeadHistoryModal } from "@/components/leads/lead-history-modal"
import { canManageAllLeads } from "@/lib/rbac"
import { leadApi, userApi, type ApiLead, type ApiUser } from "@/lib/api"
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
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import React from "react"

interface Contact {
  id: number
  lead_id: number
  contact_name: string
  phone: string
  email: string | null
  designation: string | null
}

interface Lead {
  id: string
  company_name: string
  contacts: Contact[]
  phone_2?: string
  email: string
  address?: string
  team_size?: string
  turnover?: string
  source?: string
  segment?: string
  assigned_to: string
  current_system?: string
  machine_specification?: string
  challenges?: string
  remark?: string
  lead_type?: string
  status: string
  created_at: string
  updated_at: string
}

interface CompanyUser {
  id: string
  name: string
  email: string
  role: "admin" | "user"
}

const statusColors = {
  New: "default",
  "Meeting Scheduled": "secondary",
  "Meeting Done": "outline",
  "Demo Scheduled": "secondary",
  "Demo Done": "outline",
  Won: "default",
  Lost: "destructive",
} as const

interface ColumnConfig {
  id: string
  label: string
  key: keyof Lead | "actions" | "contact_name" | "phone"
  render?: (lead: Lead) => React.ReactNode
}

function SortableTableHeader({ column }: { column: ColumnConfig }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: column.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  }

  return (
    <TableHead
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`cursor-move select-none ${isDragging ? "bg-muted/50" : ""} ${column.id === "actions" ? "text-right" : ""}`}
    >
      {column.label}
    </TableHead>
  )
}

function SortableTableRow({
  lead,
  columns,
  getUserName,
  handleViewDetails,
  handleViewActivities,
  handleViewHistory,
  handleReassignLead,
  handleEditLead,
  canManageAllLeads: canManage,
  user,
}: {
  lead: Lead
  columns: ColumnConfig[]
  getUserName: (userId: string) => string
  handleViewDetails: (lead: Lead) => void
  handleViewActivities: (lead: Lead) => void
  handleViewHistory: (lead: Lead) => void
  handleReassignLead: (lead: Lead) => void
  handleEditLead: (lead: Lead) => void
  canManageAllLeads: boolean
  user: CompanyUser
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lead.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const renderCell = (column: ColumnConfig) => {
    if (column.render) {
      return column.render(lead)
    }

    // Get primary contact for display in table
    const primaryContact = lead.contacts && lead.contacts.length > 0 ? lead.contacts[0] : null

    switch (column.key) {
      case "company_name":
        return <TableCell className="font-medium">{lead.company_name}</TableCell>
      case "contact_name":
        return <TableCell>{primaryContact?.contact_name || "N/A"}</TableCell>
      case "phone":
        return <TableCell>{primaryContact?.phone || "N/A"}</TableCell>
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
            <Badge variant={statusColors[lead.status as keyof typeof statusColors] || "default"}>{lead.status}</Badge>
          </TableCell>
        )
      case "actions":
        return (
          <TableCell className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                onPointerDown={(e) => e.stopPropagation()} // <-- THE FIX IS HERE
              >
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
                {lead.status === "Meeting Scheduled" && (
                  <DropdownMenuItem>
                    <Calendar className="mr-2 h-4 w-4" />
                    Reschedule Meeting
                  </DropdownMenuItem>
                )}
                {lead.status === "Demo Scheduled" && (
                  <DropdownMenuItem>
                    <Monitor className="mr-2 h-4 w-4" />
                    Reschedule Demo
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
        // Fallback for any other keys, safely accessing lead properties
        const key = column.key as keyof Lead
        const cellValue = lead[key]
        // Ensure we don't try to render objects directly
        return <TableCell>{typeof cellValue === "string" || typeof cellValue === "number" ? cellValue : ""}</TableCell>
    }
  }

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`cursor-move ${isDragging ? "bg-muted/50" : ""}`}
    >
      {columns.map((column) => (
        <React.Fragment key={column.id}>{renderCell(column)}</React.Fragment>
      ))}
    </TableRow>
  )
}

export default function LeadsPage() {
  const [user, setUser] = useState<CompanyUser | null>(null)
  const [allLeads, setAllLeads] = useState<Lead[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<"my" | "all">("my")
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showReassignModal, setShowReassignModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showActivitiesModal, setShowActivitiesModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [companyUsers, setCompanyUsers] = useState<CompanyUser[]>([])
  const [columns, setColumns] = useState<ColumnConfig[]>([
    { id: "company_name", label: "Lead Name", key: "company_name" },
    { id: "contact_name", label: "Contact Name", key: "contact_name" },
    { id: "phone", label: "Phone", key: "phone" },
    { id: "lead_type", label: "Lead Type", key: "lead_type" },
    { id: "assigned_to", label: "Assigned To", key: "assigned_to" },
    { id: "status", label: "Status", key: "status" },
    { id: "actions", label: "Actions", key: "actions" },
  ])

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

        let transformedLeads: Lead[] = []
        let transformedUsers: CompanyUser[] = []

        try {
          const [usersData, allLeadsData] = await Promise.all([userApi.getUsers(), leadApi.getAllLeads()])

          transformedLeads = allLeadsData.map((lead: ApiLead) => ({
            id: lead.id.toString(),
            company_name: lead.company_name,
            contacts: lead.contacts || [],
            phone_2: lead.phone_2,
            email: lead.email || "",
            address: lead.address,
            team_size: lead.team_size,
            turnover: lead.turnover,
            source: lead.source,
            segment: lead.segment,
            assigned_to: lead.assigned_to,
            current_system: lead.current_system,
            machine_specification: lead.machine_specification,
            challenges: lead.challenges,
            remark: lead.remark,
            lead_type: lead.lead_type,
            status: lead.status,
            created_at: lead.created_at,
            updated_at: lead.updated_at || lead.created_at,
          }))

          transformedUsers = usersData.map((user: ApiUser) => ({
            id: user.id.toString(),
            name: user.username,
            email: user.email || `${user.username}@company.com`,
            role: "user" as "admin" | "user",
          }))

          const currentUserExists = transformedUsers.some(
            (u) => u.name === parsedUser.username || u.id === parsedUser.id?.toString(),
          )

          if (!currentUserExists) {
            transformedUsers.push({
              id: parsedUser.id?.toString() || "current",
              name: parsedUser.username || parsedUser.name || "Current User",
              email: parsedUser.email || `${parsedUser.username}@company.com`,
              role: parsedUser.role || "user",
            })
          }

          setAllLeads(transformedLeads)
          setCompanyUsers(transformedUsers)

          console.log("[v0] Successfully loaded data from API")

          if (parsedUser.role === "admin") {
            setViewMode("all")
            setLeads(transformedLeads)
            setFilteredLeads(transformedLeads)
          } else {
            setViewMode("my")
            const userIdentifier = parsedUser.username || parsedUser.name || parsedUser.id?.toString()
            const myLeads = transformedLeads.filter(
              (lead) =>
                lead.assigned_to === userIdentifier ||
                lead.assigned_to === parsedUser.username ||
                lead.assigned_to === parsedUser.id?.toString(),
            )
            setLeads(myLeads)
            setFilteredLeads(myLeads)
          }
        } catch (apiError) {
          console.error("[v0] API failed:", apiError)
          throw new Error(
            `Failed to connect to backend API: ${apiError instanceof Error ? apiError.message : "Unknown error"}`,
          )
        }
      } catch (err) {
        console.error("[v0] Failed to fetch data:", err)
        setError(err instanceof Error ? err.message : "Failed to load leads. Please check your backend connection.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // frontend/app/dashboard/leads/page.tsx

useEffect(() => {
    if (user) {
      if (viewMode === "my") {
        // CORRECTED: The user object from localStorage has a 'username' property,
        // not a 'name' property. We must access the correct property.
        // We cast to `any` to bypass the incorrect TypeScript type definition for `CompanyUser`.
        const currentUsername = (user as any).username;
        const currentUserId = user.id?.toString();

        const myLeads = allLeads.filter(
          (lead) => 
            (currentUsername && lead.assigned_to === currentUsername) || 
            (currentUserId && lead.assigned_to === currentUserId)
        );
        setLeads(myLeads);
      } else {
        setLeads(allLeads);
      }
    }
}, [viewMode, user, allLeads]);

  useEffect(() => {
    const filtered = leads.filter(
      (lead) =>
        lead.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.contacts && lead.contacts.some(c => c.contact_name.toLowerCase().includes(searchTerm.toLowerCase()))) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredLeads(filtered)
  }, [searchTerm, leads])

  const getUserName = (userId: string) => {
    const foundUser = companyUsers.find((u) => u.name === userId || u.id === userId)
    return foundUser ? foundUser.name : userId
  }

  const handleViewDetails = (lead: Lead) => {
    setSelectedLead(lead)
    setShowDetailsModal(true)
  }

  const handleReassignLead = (lead: Lead) => {
    setSelectedLead(lead)
    setShowReassignModal(true)
  }

  const handleEditLead = (lead: Lead) => {
    setSelectedLead(lead)
    setShowEditModal(true)
  }

  const handleViewActivities = (lead: Lead) => {
    setSelectedLead(lead)
    setShowActivitiesModal(true)
  }

  const handleViewHistory = (lead: Lead) => {
    setSelectedLead(lead)
    setShowHistoryModal(true)
  }

  const handleReassignComplete = async (leadId: string, newUserId: string) => {
    try {
      const newUser = companyUsers.find((u) => u.id === newUserId)
      if (!newUser) return

      const updatedAllLeads = allLeads.map((lead) =>
        lead.id === leadId ? { ...lead, assigned_to: newUser.name, updated_at: new Date().toISOString() } : lead,
      )
      setAllLeads(updatedAllLeads)
      setShowReassignModal(false)
    } catch (error) {
      console.error("Failed to reassign lead:", error)
    }
  }

  const handleEditComplete = async (leadId: string, updatedData: Partial<Lead>) => {
    try {
      const updatedAllLeads = allLeads.map((lead) =>
        lead.id === leadId ? { ...lead, ...updatedData, updated_at: new Date().toISOString() } : lead,
      )
      setAllLeads(updatedAllLeads)
      setShowEditModal(false)
    } catch (error) {
      console.error("Failed to update lead:", error)
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (active.id !== over?.id) {
      const isColumnDrag = columns.some((col) => col.id === active.id)

      if (isColumnDrag) {
        setColumns((items) => {
          const oldIndex = items.findIndex((item) => item.id === active.id)
          const newIndex = items.findIndex((item) => item.id === over?.id)
          return arrayMove(items, oldIndex, newIndex)
        })
      } else {
        setFilteredLeads((items) => {
          const oldIndex = items.findIndex((item) => item.id === active.id)
          const newIndex = items.findIndex((item) => item.id === over?.id)

          const newOrder = arrayMove(items, oldIndex, newIndex)
          setLeads(newOrder) // Also update the base 'leads' array to maintain order across searches
          return newOrder
        })
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading leads...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    )
  }

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lead Details</h1>
          <p className="text-muted-foreground">
            {viewMode === "all" ? "Manage and track all leads" : "Manage and track your assigned leads"}
          </p>
        </div>
        <Link href="/dashboard/create-lead">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Lead
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {viewMode === "all" ? "All Leads" : "My Assigned Leads"}
              <span className="ml-2 text-sm font-normal text-muted-foreground">({filteredLeads.length} leads)</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === "my" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("my")}
                className="flex items-center space-x-2"
              >
                <User className="h-4 w-4" />
                <span>My Leads</span>
              </Button>
              <Button
                variant={viewMode === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("all")}
                className="flex items-center space-x-2"
              >
                <Users className="h-4 w-4" />
                <span>All Leads</span>
              </Button>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <Table>
              <TableHeader>
                <SortableContext items={columns.map((col) => col.id)} strategy={horizontalListSortingStrategy}>
                  <TableRow>
                    {columns.map((column) => (
                      <SortableTableHeader key={column.id} column={column} />
                    ))}
                  </TableRow>
                </SortableContext>
              </TableHeader>
              <SortableContext items={filteredLeads.map((lead) => lead.id)} strategy={verticalListSortingStrategy}>
                <TableBody>
                  {filteredLeads.map((lead) => (
                    <SortableTableRow
                      key={lead.id}
                      lead={lead}
                      columns={columns}
                      getUserName={getUserName}
                      handleViewDetails={handleViewDetails}
                      handleViewActivities={handleViewActivities}
                      handleViewHistory={handleViewHistory}
                      handleReassignLead={handleReassignLead}
                      handleEditLead={handleEditLead}
                      canManageAllLeads={canManageAllLeads(user)}
                      user={user}
                    />
                  ))}
                </TableBody>
              </SortableContext>
            </Table>
          </DndContext>

          {filteredLeads.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {viewMode === "all"
                  ? "No leads found matching your search criteria."
                  : "No leads assigned to you yet. Contact your admin to get leads assigned."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedLead && (
        <>
          <LeadDetailsModal
            lead={selectedLead}
            isOpen={showDetailsModal}
            onClose={() => setShowDetailsModal(false)}
            getUserName={getUserName}
          />
          <LeadActivitiesModal
            lead={selectedLead}
            isOpen={showActivitiesModal}
            onClose={() => setShowActivitiesModal(false)}
          />
          <LeadHistoryModal lead={selectedLead} isOpen={showHistoryModal} onClose={() => setShowHistoryModal(false)} />
          {canManageAllLeads(user) && (
            <ReassignLeadModal
              lead={selectedLead}
              isOpen={showReassignModal}
              onClose={() => setShowReassignModal(false)}
              onReassign={handleReassignComplete}
              users={companyUsers}
            />
          )}
          <EditLeadModal
            lead={selectedLead}
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            onSave={handleEditComplete}
            users={companyUsers}
          />
        </>
      )}
    </div>
  )
}