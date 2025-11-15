// frontend/App/dashboard/leads/[leadId]/page.tsx
"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { api, userApi, leadApi, type ApiLead, type ApiUser, LeadAttachment } from "@/lib/api"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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


// MODALS
import { EditLeadModal } from "@/components/leads/edit-lead-modal"
import { LeadActivitiesModal } from "@/components/leads/lead-activities-modal"
import { useToast } from "@/hooks/use-toast"

import {
    Loader2, ArrowLeft, Edit, Activity, Mail, Phone, User, Building, Globe, MapPin,
    Tag, Users, TrendingUp, FileText, Briefcase, History, MessageSquare, CalendarCheck,
    DollarSign, Upload, File, Trash2, Download, Database
} from "lucide-react"

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
                <p className="text-sm break-words">{value}</p>
            </div>
        </div>
    );
};

export default function LeadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { user: currentUser } = useAuth();
  const leadId = params.leadId as string
  const fileInputRef = useRef<HTMLInputElement>(null);


  const [lead, setLead] = useState<ApiLead | null>(null)
  const [users, setUsers] = useState<{ id: string; name: string }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showEditModal, setShowEditModal] = useState(false)
  const [showActivitiesModal, setShowActivitiesModal] = useState(false)
  const [isUploading, setIsUploading] = useState(false);
  const [attachmentToDelete, setAttachmentToDelete] = useState<LeadAttachment | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null); // State to track which file is downloading

  const fetchLeadData = useCallback(() => {
    if (leadId) {
        setIsLoading(true);
        Promise.all([
            api.getLeadById(Number(leadId)),
            userApi.getUsers()
        ]).then(([leadData, usersData]) => {
            setLead(leadData);
            setUsers(usersData.map(u => ({ id: u.id.toString(), name: u.username })));
        }).catch((err) => {
            console.error("Failed to fetch lead details:", err);
            setError("Could not load lead details. The lead may not exist or an error occurred.");
        }).finally(() => {
            setIsLoading(false);
        });
    }
  }, [leadId]);

  useEffect(() => {
    fetchLeadData();
  }, [fetchLeadData]);

  const handleEditComplete = (updatedLeadId: string, updatedData: Partial<ApiLead>) => {
    if (lead && lead.id.toString() === updatedLeadId) {
      setLead({ ...lead, ...updatedData });
    }
    setShowEditModal(false);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!lead || !currentUser) return;
    setIsUploading(true);
    try {
      await leadApi.uploadLeadAttachment(lead.id, file);
      toast({ title: "Success", description: "File uploaded successfully." });
      fetchLeadData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to upload file.", variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteAttachment = async () => {
    if (!attachmentToDelete || !lead) return;
    try {
        await leadApi.deleteLeadAttachment(attachmentToDelete.id);
        setLead(prevLead => prevLead ? {
            ...prevLead,
            attachments: prevLead.attachments.filter(att => att.id !== attachmentToDelete.id)
        } : null);
        toast({ title: "Success", description: "Attachment deleted." });
    } catch (error) {
        toast({ title: "Error", description: "Failed to delete attachment.", variant: "destructive" });
    } finally {
        setAttachmentToDelete(null);
    }
  };

  // --- START OF FIX: Create a handler for authenticated downloads ---
  const handleDownloadAttachment = async (attachment: LeadAttachment) => {
    setDownloadingId(attachment.id); // Set loading state for this specific button
    try {
        const fileBlob = await leadApi.downloadLeadAttachment(attachment.id);
        
        // Create a temporary URL for the blob
        const url = window.URL.createObjectURL(fileBlob);
        
        // Create a temporary link element to trigger the download
        const a = document.createElement('a');
        a.href = url;
        a.download = attachment.original_file_name; // Use the original filename
        document.body.appendChild(a);
        a.click();
        
        // Clean up by removing the link and revoking the URL
        a.remove();
        window.URL.revokeObjectURL(url);

    } catch (error: any) {
        toast({ title: "Error", description: error.message || "Could not download file.", variant: "destructive" });
    } finally {
        setDownloadingId(null); // Clear loading state
    }
  };
  // --- END OF FIX ---


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

  const creator = users.find(u => u.id === lead?.created_by.toString());
  const creatorName = creator ? creator.name : lead?.created_by;

  return (
    <>
      <div className="space-y-6">
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
                  <Button variant="outline" onClick={() => setShowActivitiesModal(true)}>
                      <Activity className="mr-2 h-4 w-4" />View Activities
                  </Button>
                  <Button onClick={() => setShowEditModal(true)}>
                      <Edit className="mr-2 h-4 w-4" />Edit Lead
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
                                  {lead.contacts && lead.contacts.map(contact => (
                                    <div key={contact.id} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      <IconInfoField label="Contact Person" value={contact.contact_name} icon={User} />
                                      <IconInfoField label="Designation" value={contact.designation} icon={Briefcase} />
                                      <IconInfoField label="Email" value={contact.email} icon={Mail} />
                                      <IconInfoField label="Phone" value={contact.phone} icon={Phone} />
                                      <IconInfoField label="LinkedIn" value={contact.linkedIn} icon={Users} />
                                      <IconInfoField label="PAN" value={contact.pan} icon={FileText} />
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
                           <Card>
                                <CardHeader>
                                    <CardTitle>Attachments</CardTitle>
                                    <CardDescription>Upload and manage related documents for this lead.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                                            <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                                                {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4" />}
                                                Upload File
                                            </Button>
                                        </div>
                                        {lead.attachments && lead.attachments.length > 0 ? (
                                            <ul className="space-y-3 pt-2">
                                                {lead.attachments.map(att => (
                                                    <li key={att.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-sm p-3 rounded-md border bg-muted/50">
                                                        <div className="flex items-center gap-3 truncate">
                                                            <File className="h-5 w-5 flex-shrink-0 text-primary" />
                                                            <div className="truncate">
                                                                <p className="font-medium truncate" title={att.original_file_name}>{att.original_file_name}</p>
                                                                {/* --- START OF FIX: Conditionally render the uploader's name --- */}
                                                                {att.uploaded_by && (
                                                                    <p className="text-xs text-muted-foreground">Uploaded by {att.uploaded_by}</p>
                                                                )}
                                                                {/* --- END OF FIX --- */}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 self-end sm:self-center">
                                                            {/* --- START OF FIX: Use a Button with an onClick handler --- */}
                                                            <Button variant="outline" size="sm" onClick={() => handleDownloadAttachment(att)} disabled={downloadingId === att.id}>
                                                                {downloadingId === att.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Download className="mr-2 h-4 w-4" />}
                                                                Download
                                                            </Button>
                                                            {/* --- END OF FIX --- */}
                                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setAttachmentToDelete(att)}>
                                                                <Trash2 className="h-4 w-4 text-destructive" />
                                                            </Button>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-sm text-muted-foreground text-center py-4">No attachments uploaded yet.</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                      </div>

                      <div className="space-y-6">
                          <Card>
                              <CardHeader><CardTitle>Lead Classification</CardTitle></CardHeader>
                              <CardContent className="space-y-5">
                                  <IconInfoField label="Source" value={lead.source} icon={Globe} />
                                  <IconInfoField label="Created By" value={creatorName} icon={User} />
                                  <IconInfoField label="Segment" value={lead.segment} icon={Building} />
                                  <IconInfoField label="Lead Type" value={lead.lead_type} icon={Tag} />
                                  <IconInfoField label="Team Size" value={lead.team_size} icon={Users} />
                                  <IconInfoField label="Turnover" value={lead.turnover} icon={TrendingUp} />
                                  <IconInfoField label="Opportunity Business" value={lead.opportunity_business} icon={DollarSign} />
                                  <IconInfoField label="Target Closing Date" value={lead.target_closing_date} icon={CalendarCheck} />
                              </CardContent>
                          </Card>
                           <Card>
                              <CardHeader><CardTitle>System & Remarks</CardTitle></CardHeader>
                              <CardContent className="space-y-5">
                                  <IconInfoField label="Current System" value={lead.current_system} icon={FileText} />
                                  <IconInfoField label="Remarks" value={lead.remark} icon={MessageSquare} />
                              </CardContent>
                          </Card>
                          <Card>
                              <CardHeader><CardTitle>Technical & Financial Details</CardTitle></CardHeader>
                              <CardContent className="space-y-5">
                                  <IconInfoField label="Version" value={lead.version} icon={Tag} />
                                  <IconInfoField label="Database Type" value={lead.database_type} icon={Database} />
                                  <IconInfoField label="AMC" value={lead.amc} icon={FileText} />
                                  <IconInfoField label="Company GST" value={lead.gst} icon={FileText} />
                                  <IconInfoField label="Company PAN" value={lead.company_pan} icon={FileText} />
                              </CardContent>
                          </Card>
                      </div>
                  </div>
              </TabsContent>
          </Tabs>
      </div>

      <EditLeadModal
        lead={lead as any}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleEditComplete}
        users={users}
      />

      <LeadActivitiesModal
        lead={lead}
        isOpen={showActivitiesModal}
        onClose={() => setShowActivitiesModal(false)}
      />

      <AlertDialog open={!!attachmentToDelete} onOpenChange={(open) => !open && setAttachmentToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will permanently delete the attachment "{attachmentToDelete?.original_file_name}". This action cannot be undone.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAttachment} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}