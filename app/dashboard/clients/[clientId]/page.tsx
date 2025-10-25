//frontend/app/dashboard/clients/[clientId]/page.tsx

"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
// --- START OF FIX: Import clientApi specifically ---
import { clientApi, type ApiClient } from "@/lib/api"
// --- END OF FIX ---
import { format } from "date-fns"

// MODULAR COMPONENTS
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import {
    Loader2, ArrowLeft, Mail, Phone, User, Building, Globe, MapPin,
    Tag, Users, TrendingUp, FileText, Briefcase, MessageSquare, CalendarCheck, DollarSign,
    Code, HardDrive, Wrench, Receipt, Bug, Edit
} from "lucide-react"

// Import EditClientModal
import { EditClientModal } from "@/components/clients/edit-client-modal"
import { parseAsUTCDate } from "@/lib/date-format"

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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://4adc3d24dcb8.ngrok-free.app";

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.clientId as string

  const [client, setClient] = useState<ApiClient | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    if (clientId) {
      // --- START OF FIX: Call the correct, existing function from clientApi ---
      clientApi.getClientById(Number(clientId))
        .then((clientData) => {
          if (!clientData) {
              throw new Error("Client not found.");
          }
          
          // Parse nested JSON strings to prevent runtime errors
          const parsedClientData: ApiClient = {
              ...clientData,
              contacts: typeof clientData.contacts === 'string' 
                  ? JSON.parse(clientData.contacts) 
                  : clientData.contacts || [],
              attachments: typeof clientData.attachments === 'string' 
                  ? JSON.parse(clientData.attachments) 
                  : clientData.attachments || [],
          };

          console.log("Fetched and Parsed Client Data:", parsedClientData);
          setClient(parsedClientData);
        })
        .catch((err) => {
          console.error("Failed to fetch client details:", err)
          setError("Could not load client details. The client may not exist or an error occurred.")
        })
        .finally(() => {
          setIsLoading(false)
        })
      // --- END OF FIX ---
    }
  }, [clientId])

  const handleEditComplete = (updatedClientId: string, updatedData: ApiClient) => {
    if (client && client.id.toString() === updatedClientId) {
      setClient(updatedData);
    }
    setShowEditModal(false);
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
        <Button onClick={() => router.push("/dashboard/clients")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Clients
        </Button>
      </div>
    )
  }

  if (!client) return null
  
  const convertedDate = parseAsUTCDate(client.converted_date);

  return (
    <>
      <div className="space-y-6">
          <header className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                  <Button variant="outline" size="icon" onClick={() => router.back()} aria-label="Go back">
                      <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div>
                      <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{client.company_name}</h1>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span>Client Since: <Badge>{convertedDate ? format(convertedDate, "MMM d, yyyy") : 'N/A'}</Badge></span>
                      </div>
                  </div>
              </div>
              <div className="flex items-center gap-2">
                  <Button onClick={() => setShowEditModal(true)}>
                      <Edit className="mr-2 h-4 w-4" />Edit Client
                  </Button>
              </div>
          </header>

          <Tabs defaultValue="overview" className="w-full">
              <TabsContent value="overview" className="mt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                      <div className="lg:col-span-2 space-y-6">
                          <Card>
                              <CardHeader><CardTitle>Contact Information</CardTitle></CardHeader>
                              <CardContent className="space-y-6">
                                  {client.contacts && client.contacts.length > 0 ? (
                                    client.contacts.map(contact => (
                                      <div key={contact.id} className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                        <IconInfoField label="Contact Person" value={contact.contact_name} icon={User} />
                                        <IconInfoField label="Designation" value={contact.designation} icon={Briefcase} />
                                        <IconInfoField label="Email" value={contact.email} icon={Mail} />
                                        <IconInfoField label="Phone" value={contact.phone} icon={Phone} />
                                        <IconInfoField label="LinkedIn" value={contact.linkedIn} icon={Globe} />
                                        <IconInfoField label="PAN" value={contact.pan} icon={FileText} />
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-sm text-muted-foreground">No contacts available.</p>
                                  )}
                                  <Separator />
                                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                       <IconInfoField label="Company Email" value={client.company_email} icon={Building} />
                                       <IconInfoField label="Company Phone 2" value={client.company_phone_2} icon={Phone} />
                                       <IconInfoField label="Website" value={client.website} icon={Globe} />
                                       <IconInfoField label="Company LinkedIn" value={client.linkedIn} icon={Globe} />
                                   </div>
                              </CardContent>
                          </Card>
                          <Card>
                              <CardHeader><CardTitle>Address Details</CardTitle></CardHeader>
                              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <IconInfoField label="Address" value={`${client.address || ''} ${client.address_2 || ''}`.trim()} icon={MapPin} />
                                <IconInfoField label="City" value={client.city} icon={MapPin} />
                                <IconInfoField label="State" value={client.state} icon={MapPin} />
                                <IconInfoField label="Country" value={client.country} icon={Globe} />
                                <IconInfoField label="Pincode" value={client.pincode} icon={MapPin} />
                              </CardContent>
                          </Card>
                          
                          {client.attachments && client.attachments.length > 0 && (
                            <Card>
                                <CardHeader><CardTitle>Attachments</CardTitle></CardHeader>
                                <CardContent>
                                    <ul className="space-y-3">
                                        {client.attachments.map((attachment) => {
                                            const uploadedAtDate = parseAsUTCDate(attachment.uploaded_at);
                                            return (
                                                <li key={attachment.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 border">
                                                    <div className="flex items-center gap-3 truncate">
                                                        <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                                        <div className="flex flex-col truncate">
                                                            <a
                                                                href={`${API_BASE_URL}/web/attachments/preview/${attachment.file_path}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-sm font-medium text-primary hover:underline truncate"
                                                                title={attachment.original_file_name}
                                                            >
                                                                {attachment.original_file_name}
                                                            </a>
                                                            <p className="text-xs text-muted-foreground">
                                                                Uploaded by {attachment.uploaded_by} on {uploadedAtDate ? format(uploadedAtDate, "MMM d, yyyy") : 'N/A'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </CardContent>
                            </Card>
                          )}
                      </div>

                      <div className="space-y-6">
                          <Card>
                              <CardHeader><CardTitle>Client Classification</CardTitle></CardHeader>
                              <CardContent className="space-y-5">
                                  <IconInfoField label="Segment" value={client.segment} icon={Building} />
                                  <IconInfoField label="Verticals" value={client.verticles} icon={Tag} />
                                  <IconInfoField label="Team Size" value={client.team_size} icon={Users} />
                                  <IconInfoField label="Turnover" value={client.turnover} icon={TrendingUp} />
                                  <IconInfoField label="GST" value={client.gst} icon={Receipt} />
                                  <IconInfoField label="AMC" value={client.amc} icon={CalendarCheck} />
                              </CardContent>
                          </Card>
                           <Card>
                              <CardHeader><CardTitle>System & Remarks</CardTitle></CardHeader>
                              <CardContent className="space-y-5">
                                  <IconInfoField label="Current System" value={client.current_system} icon={FileText} />
                                  <IconInfoField label="Machine Specification" value={client.machine_specification} icon={Wrench} />
                                  <IconInfoField label="Challenges" value={client.challenges} icon={Bug} />
                                  <IconInfoField label="Version" value={client.version} icon={Code} />
                                  <IconInfoField label="Database Type" value={client.database_type} icon={HardDrive} />
                              </CardContent>
                          </Card>
                      </div>
                  </div>
              </TabsContent>
          </Tabs>
      </div>

      {client && (
        <EditClientModal
          client={client}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={handleEditComplete}
        />
      )}
    </>
  )
}