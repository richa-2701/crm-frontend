"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { leadApi } from "@/lib/api"
import { Loader2, PlusCircle, Trash2 } from "lucide-react"

interface Contact {
  id?: number
  contact_name: string
  phone: string
  email: string | null
  designation: string | null
}

interface Lead {
  id: string
  company_name: string
  contacts: Contact[]
  email: string
  phone_2?: string
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
}

interface User {
  id: string
  name: string
}

interface EditLeadModalProps {
  lead: Lead | null
  isOpen: boolean
  onClose: () => void
  onSave: (leadId: string, updatedData: Partial<Lead>) => void
  users: User[]
}

const leadTypes = ["Hot Lead", "Cold Lead", "Not Our Segment"]

export function EditLeadModal({ lead, isOpen, onClose, onSave, users }: EditLeadModalProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState<Omit<Lead, 'contacts' | 'id'>>({
    company_name: "",
    email: "",
    assigned_to: "",
    status: "",
    // Initialize other properties to avoid uncontrolled component warnings
    phone_2: "",
    team_size: "",
    turnover: "",
    source: "",
    segment: "",
    current_system: "",
    machine_specification: "",
    challenges: "",
    remark: "",
    lead_type: "",
  })
  const [contacts, setContacts] = useState<Contact[]>([{ contact_name: "", phone: "", email: "", designation: "" }])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (lead) {
      const { contacts, id, ...leadData } = lead
      setFormData(leadData)
      if (contacts && contacts.length > 0) {
        setContacts(JSON.parse(JSON.stringify(contacts))) // Deep copy to prevent direct state mutation
      } else {
        setContacts([{ contact_name: "", phone: "", email: "", designation: "" }])
      }
    }
  }, [lead])

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleContactChange = (index: number, field: keyof Contact, value: string) => {
    const newContacts = [...contacts]
    newContacts[index] = { ...newContacts[index], [field]: value }
    setContacts(newContacts)
  }

  const addContact = () => {
    setContacts([...contacts, { contact_name: "", phone: "", email: "", designation: "" }])
  }

  const removeContact = (index: number) => {
    if (contacts.length > 1) {
      setContacts(contacts.filter((_, i) => i !== index))
    } else {
      toast({
        title: "Cannot Remove",
        description: "A lead must have at least one contact person.",
        variant: "destructive"
      })
    }
  }

  const handleSave = async () => {
    if (!lead) return
    setIsLoading(true)

    // Construct the payload with all fields the backend expects
    const updatedData = {
      ...formData,
      contacts: contacts.map(({ id, ...rest }) => rest), // Remove 'id' from contacts before sending, as backend expects ContactCreate schema
    }

    try {
      // The API call to the backend
      await leadApi.updateLead(parseInt(lead.id, 10), updatedData)
      
      toast({
        title: "Lead Updated",
        description: `${lead.company_name} has been successfully updated.`,
      })
      
      // Call the onSave prop to update the parent component's state immediately
      onSave(lead.id, {
        ...lead, // Pass the original lead data
        ...updatedData, // Override with the new data
        contacts: contacts, // Ensure the contacts are fully updated in the parent state
      });

      onClose()
    } catch (error) {
      console.error("Failed to update lead:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update the lead. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  if (!lead) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Lead - {lead.company_name}</DialogTitle>
          <DialogDescription>Update the details for this lead.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Company *</Label>
              <Input
                id="company_name"
                value={formData.company_name || ""}
                onChange={(e) => handleInputChange("company_name", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Company Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ""}
                onChange={(e) => handleInputChange("email", e.target.value)}
              />
            </div>
          </div>

           {/* Dynamic Contact Persons Section */}
           <div className="space-y-4 rounded-md border p-4">
              <h3 className="text-md font-semibold">Contact Persons</h3>
              {contacts.map((contact, index) => (
                <div key={index} className="space-y-3 rounded-md border p-3 relative">
                  <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6"
                      onClick={() => removeContact(index)}
                      disabled={contacts.length <= 1}
                    >
                      <Trash2 className="h-4 w-4" />
                  </Button>
                  <div className="grid gap-3 grid-cols-2">
                    <div className="space-y-1">
                      <Label htmlFor={`contact_name_${index}`}>Full Name *</Label>
                      <Input
                        id={`contact_name_${index}`}
                        value={contact.contact_name}
                        onChange={(e) => handleContactChange(index, "contact_name", e.target.value)}
                        required
                      />
                    </div>
                     <div className="space-y-1">
                      <Label htmlFor={`designation_${index}`}>Designation</Label>
                      <Input
                        id={`designation_${index}`}
                        value={contact.designation || ""}
                        onChange={(e) => handleContactChange(index, "designation", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 grid-cols-2">
                    <div className="space-y-1">
                      <Label htmlFor={`phone_${index}`}>Phone *</Label>
                      <Input
                        id={`phone_${index}`}
                        type="tel"
                        value={contact.phone}
                        onChange={(e) => handleContactChange(index, "phone", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`contact_email_${index}`}>Email</Label>
                      <Input
                        id={`contact_email_${index}`}
                        type="email"
                        value={contact.email || ""}
                        onChange={(e) => handleContactChange(index, "email", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addContact} className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                Add Another Contact
              </Button>
            </div>


          <div className="grid grid-cols-4 gap-4">
             <div className="space-y-2">
              <Label htmlFor="phone_2">Phone 2</Label>
              <Input id="phone_2" value={formData.phone_2 || ""} onChange={(e) => handleInputChange("phone_2", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team_size">Team Size</Label>
              <Input id="team_size" value={formData.team_size || ""} onChange={(e) => handleInputChange("team_size", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="turnover">Turnover</Label>
              <Input id="turnover" value={formData.turnover || ""} onChange={(e) => handleInputChange("turnover", e.target.value)} />
            </div>
          </div>

           <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <Input id="source" value={formData.source || ""} onChange={(e) => handleInputChange("source", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="segment">Segment</Label>
              <Input id="segment" value={formData.segment || ""} onChange={(e) => handleInputChange("segment", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lead_type">Lead Type</Label>
               <Select value={formData.lead_type || ""} onValueChange={(value) => handleInputChange("lead_type", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {leadTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
             <div className="space-y-2">
              <Label htmlFor="assigned_to">Assigned To *</Label>
               <Select value={formData.assigned_to || ""} onValueChange={(value) => handleInputChange("assigned_to", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.name}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            </div>
          </div>
          
           <div className="space-y-2">
              <Label htmlFor="current_system">Current System</Label>
              <Input id="current_system" value={formData.current_system || ""} onChange={(e) => handleInputChange("current_system", e.target.value)} />
            </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <Label htmlFor="machine_specification">Machine Spec</Label>
                <Textarea
                  id="machine_specification"
                  value={formData.machine_specification || ""}
                  onChange={(e) => handleInputChange("machine_specification", e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="challenges">Challenges</Label>
                <Textarea
                  id="challenges"
                  value={formData.challenges || ""}
                  onChange={(e) => handleInputChange("challenges", e.target.value)}
                  rows={3}
                />
              </div>
          </div>
           <div className="space-y-2">
              <Label htmlFor="remark">Remark</Label>
              <Textarea
                id="remark"
                value={formData.remark || ""}
                onChange={(e) => handleInputChange("remark", e.target.value)}
                rows={3}
              />
            </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Lead
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}