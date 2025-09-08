//frontend/app/dashboard/leads/[leadId]/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { api, userApi, type ApiLead, type ApiUser } from "@/lib/api"

// MODULAR COMPONENTS
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// MODALS (These will now be functional)
import { EditLeadModal } from "@/components/leads/edit-lead-modal"
import { LeadActivitiesModal } from "@/components/leads/lead-activities-modal"
import { useToast } from "@/hooks/use-toast"

// --- THIS IS THE FIX ---
// Add MessageSquare to the import list
import { 
    Loader2, ArrowLeft, Edit, Activity, Mail, Phone, User, Building, Globe, MapPin, 
    Tag, Users, TrendingUp, FileText, Briefcase, History, MessageSquare
} from "lucide-react"

// A reusable component for displaying fields with icons.
const IconInfoField = ({ 
    label, 
    value, 
    icon: Icon 
}: { 
    label: string; 
    value?: string | number | null;
    icon: React.ElementType 
}) => {
    if (!value) return null;
    return (
        <div className="flex items-start">
            <Icon className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="ml-4">
                <h4 className="text-xs font-semibold text-muted-foreground">{label}</h4>
                <p className="text-sm">{value}</p>
            </div>
        </div>
    );
};

export default function LeadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const leadId = params.leadId as string

  const [lead, setLead] = useState<ApiLead | null>(null)
  const [users, setUsers] = useState<{ id: string; name: string }[]>([])
  const [statusOptions, setStatusOptions] = useState<string[]>(["new", "qualified", "unqualified"])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // --- STATE FOR MODALS ---
  const [showEditModal, setShowEditModal] = useState(false)
  const [showActivitiesModal, setShowActivitiesModal] = useState(false)
  // Add more modal states here if needed (e.g., history)

  useEffect(() => {
    if (leadId) {
      // Fetch both lead details and the list of users for the edit modal
      Promise.all([
        api.getLeadById(Number(leadId)),
        userApi.getUsers()
      ]).then(([leadData, usersData]) => {
          setLead(leadData)
          setUsers(usersData.map(u => ({ id: u.id.toString(), name: u.username })))
      }).catch((err) => {
          console.error("Failed to fetch lead details:", err)
          setError("Could not load lead details. The lead may not exist or an error occurred.")
      }).finally(() => {
          setIsLoading(false)
      })
    }
  }, [leadId])

  // --- CALLBACK FUNCTION TO UPDATE LEAD DATA AFTER EDITING ---
  const handleEditComplete = (updatedLeadId: string, updatedData: Partial<ApiLead>) => {
    if (lead && lead.id.toString() === updatedLeadId) {
      setLead({ ...lead, ...updatedData });
    }
    // Optionally, you could re-fetch the lead data here for guaranteed consistency
    // api.getLeadById(Number(leadId)).then(setLead);
    setShowEditModal(false); // Close the modal
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-xl text-destructive mb-4">{error}</p>
        <Button onClick={() => router.push("/dashboard/leads")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Leads
        </Button>
      </div>
    )
  }

  if (!lead) return null

  return (
    <>
      <div className="space-y-6">
          {/* ======================= HEADER SECTION ======================= */}
          <header className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                  <Button variant="outline" size="icon" onClick={() => router.back()} aria-label="Go back">
                      <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div>
                      <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{lead.company_name}</h1>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span>Status: <Badge>{lead.status}</Badge></span>
                          <Separator orientation="vertical" className="h-4" />
                          <span>Assigned to: {lead.assigned_to}</span>
                      </div>
                  </div>
              </div>
              <div className="flex items-center gap-2">
                  {/* --- FUNCTIONAL BUTTONS --- */}
                  <Button variant="outline" onClick={() => setShowActivitiesModal(true)}>
                      <Activity className="mr-2 h-4 w-4" />View Activities
                  </Button>
                  <Button onClick={() => setShowEditModal(true)}>
                      <Edit className="mr-2 h-4 w-4" />Edit Lead
                  </Button>
              </div>
          </header>

          {/* ======================= TABBED INTERFACE ======================= */}
          <Tabs defaultValue="overview" className="w-full">
              
              
              {/* --- OVERVIEW TAB CONTENT --- */}
              <TabsContent value="overview" className="mt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                      {/* Left Column */}
                      <div className="lg:col-span-2 space-y-6">
                          <Card>
                              <CardHeader><CardTitle>Contact Information</CardTitle></CardHeader>
                              <CardContent className="space-y-6">
                                  {lead.contacts && lead.contacts.map(contact => (
                                    <div key={contact.id} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      <IconInfoField label="Contact Person" value={contact.contact_name} icon={User} />
                                      <IconInfoField label="Designation" value={contact.designation} icon={Briefcase} />
                                      <IconInfoField label="Email" value={contact.email} icon={Mail} />
                                      <IconInfoField label="Phone" value={contact.phone} icon={Phone} />
                                    </div>
                                  ))}
                                  <Separator />
                                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                       <IconInfoField label="Company Email" value={lead.email} icon={Building} />
                                       <IconInfoField label="Company Phone 2" value={lead.phone_2} icon={Phone} />
                                   </div>
                              </CardContent>
                          </Card>
                          <Card>
                              <CardHeader><CardTitle>Address Details</CardTitle></CardHeader>
                              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <IconInfoField label="Address" value={`${lead.address || ''} ${lead.address_2 || ''}`.trim()} icon={MapPin} />
                                <IconInfoField label="City" value={lead.city} icon={MapPin} />
                                <IconInfoField label="State" value={lead.state} icon={MapPin} />
                                <IconInfoField label="Country" value={lead.country} icon={Globe} />
                                <IconInfoField label="Pincode" value={lead.pincode} icon={MapPin} />
                              </CardContent>
                          </Card>
                      </div>

                      {/* Right Column */}
                      <div className="space-y-6">
                          <Card>
                              <CardHeader><CardTitle>Lead Classification</CardTitle></CardHeader>
                              <CardContent className="space-y-5">
                                  <IconInfoField label="Source" value={lead.source} icon={Globe} />
                                  <IconInfoField label="Segment" value={lead.segment} icon={Building} />
                                  <IconInfoField label="Lead Type" value={lead.lead_type} icon={Tag} />
                                  <IconInfoField label="Team Size" value={lead.team_size} icon={Users} />
                                  <IconInfoField label="Turnover" value={lead.turnover} icon={TrendingUp} />
                              </CardContent>
                          </Card>
                           <Card>
                              <CardHeader><CardTitle>System & Remarks</CardTitle></CardHeader>
                              <CardContent className="space-y-5">
                                  <IconInfoField label="Current System" value={lead.current_system} icon={FileText} />
                                  <IconInfoField label="Remarks" value={lead.remark} icon={MessageSquare} />
                              </CardContent>
                          </Card>
                      </div>
                  </div>
              </TabsContent>
              {/* --- ACTIVITIES TAB CONTENT (Placeholder) --- */}
              <TabsContent value="activities">
                  <Card><CardHeader><CardTitle>Coming Soon</CardTitle></CardHeader><CardContent><p>This is where the list of activities will be displayed.</p></CardContent></Card>
              </TabsContent>
              {/* --- HISTORY TAB CONTENT (Placeholder) --- */}
              <TabsContent value="history">
                   <Card><CardHeader><CardTitle>Coming Soon</CardTitle></CardHeader><CardContent><p>This is where the lead's history timeline will be displayed.</p></CardContent></Card>
              </TabsContent>
          </Tabs>
      </div>

      {/* ======================= MODALS ======================= */}
      {/* These modals are now controlled by the state on this page */}
      <EditLeadModal
        lead={lead as any} // Cast as any to match prop type, since we know it's not null here
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleEditComplete}
        users={users}
        statusOptions={statusOptions}
      />

      <LeadActivitiesModal
        lead={lead}
        isOpen={showActivitiesModal}
        onClose={() => setShowActivitiesModal(false)}
      />
    </>
  )
}