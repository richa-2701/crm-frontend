//components/leads/convert-to-proposal-modal.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
import { useToast } from "@/hooks/use-toast"
import { api, proposalApi, type ApiLead } from "@/lib/api"
import { Loader2, PlusCircle, Trash2 } from "lucide-react"
import PhoneInput from "react-phone-input-2"
import "react-phone-input-2/lib/style.css"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface Contact {
  id?: number;
  prefix: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string | null;
  designation: string | null;
  linkedIn: string | null;
  pan: string | null;
}

interface ConvertToProposalModalProps {
  lead: ApiLead | null
  isOpen: boolean
  onClose: () => void
  onSuccess: (convertedLeadId: number) => void
}

const namePrefixes = ["Mr.", "Mrs.", "Ms."];

const splitFullName = (fullName: string | null | undefined) => {
  if (!fullName || typeof fullName !== 'string') {
    return { prefix: "Mr.", first_name: "", last_name: "" };
  }
  
  const parts = fullName.trim().split(" ")
  let prefix = ""
  let firstName = ""
  let lastName = ""

  if (parts.length > 0 && namePrefixes.includes(parts[0])) {
    prefix = parts.shift() || ""
  }

  if (parts.length > 0) {
    firstName = parts.shift() || ""
  }
  lastName = parts.join(" ")

  return { prefix: prefix || "Mr.", first_name: firstName, last_name: lastName }
}

export function ConvertToProposalModal({ lead, isOpen, onClose, onSuccess }: ConvertToProposalModalProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [formData, setFormData] = useState({
    company_name: "",
    email: "",
    website: "",
    linkedIn: "",
    phone_2: "",
    address: "",
    address_2: "",
    city: "",
    state: "",
    pincode: "",
    country: "",
    source: "",
    segment: "",
    team_size: "",
    turnover: "",
    remark: "",
    current_system: "",
    machine_specification: "",
    challenges: "",
    lead_type: "",
    opportunity_business: "",
    target_closing_date: "",
    gst: "",
    company_pan: "",
    version: "",
    database_type: "",
    amc: "",
  })
  const [contacts, setContacts] = useState<Contact[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{ gst?: string }>({});
  
  const [versionOptions, setVersionOptions] = useState<string[]>([]);
  
  useEffect(() => {
    if (isOpen) {
        const fetchMasterData = async () => {
            try {
                const versionData = await api.getByCategory("version");
                setVersionOptions(versionData.map(item => item.value));
            } catch (err) {
                console.error("Failed to fetch version master data:", err);
                toast({ title: "Error", description: "Could not load version options.", variant: "destructive" });
            }
        };
        fetchMasterData();
    }
  }, [isOpen, toast]);

  useEffect(() => {
    if (lead) {
      setFormData({
        company_name: lead.company_name || "",
        email: lead.email || "",
        website: lead.website || "",
        linkedIn: lead.linkedIn || "",
        phone_2: lead.phone_2 || "",
        address: lead.address || "",
        address_2: lead.address_2 || "",
        city: lead.city || "",
        state: lead.state || "",
        pincode: lead.pincode || "",
        country: lead.country || "",
        source: lead.source || "",
        segment: lead.segment || "",
        team_size: lead.team_size || "",
        turnover: lead.turnover || "",
        remark: lead.remark || "",
        current_system: lead.current_system || "",
        machine_specification: lead.machine_specification || "",
        challenges: lead.challenges || "",
        lead_type: lead.lead_type || "",
        opportunity_business: lead.opportunity_business || "",
        target_closing_date: lead.target_closing_date?.split('T')[0] || "",
        gst: lead.gst || "",
        company_pan: lead.company_pan || "",
        version: lead.version || "",
        database_type: lead.database_type || "",
        amc: lead.amc || "",
      });
      if (lead.contacts && lead.contacts.length > 0) {
        setContacts(lead.contacts.map(c => ({
            ...splitFullName(c.contact_name),
            id: c.id,
            phone: c.phone,
            email: c.email,
            designation: c.designation,
            linkedIn: c.linkedIn || null,
            pan: c.pan || null,
        })))
      } else {
        setContacts([{ prefix: "Mr.", first_name: "", last_name: "", phone: "", email: "", designation: "", linkedIn: "", pan: "" }])
      }
    }
  }, [lead, isOpen])

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    if (field === 'gst') {
        setErrors(prev => ({...prev, gst: undefined}));
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  }

  const handleContactChange = (index: number, field: keyof Omit<Contact, "phone">, value: string) => {
    const nc = [...contacts];
    nc[index] = { ...nc[index], [field]: value };
    setContacts(nc);
  }
  
  const handleContactPhoneChange = (index: number, value: string) => {
    const nc = [...contacts];
    nc[index].phone = value;
    setContacts(nc);
  }

  const addContact = () => setContacts([...contacts, { prefix: "Mr.", first_name: "", last_name: "", phone: "", email: "", designation: "", linkedIn: "", pan: "" }])
  const removeContact = (index: number) => { if (contacts.length > 1) setContacts(contacts.filter((_, i) => i !== index)) }

  const validate = () => {
    if (!formData.gst || formData.gst.trim() === "") {
        setErrors({ gst: "GST Number is mandatory for conversion." });
        return false;
    }
    setErrors({});
    return true;
  }

  const handleSave = async () => {
    if (!lead || !validate()) return;
    
    setIsLoading(true);

    const processedContacts = contacts.map(c => ({
        contact_name: `${c.prefix} ${c.first_name} ${c.last_name}`.trim(),
        phone: c.phone,
        email: c.email,
        designation: c.designation,
        linkedIn: c.linkedIn,
        pan: c.pan
    }));

    const payload = { ...formData, contacts: processedContacts };

    try {
      await proposalApi.convertLeadToProposal(lead.id, payload);
      toast({ title: "Conversion Successful", description: `${lead.company_name} has been moved to Proposals.` });
      onSuccess(lead.id);
      onClose();
    } catch (error: any) {
      if (error.message && error.message.includes("409")) {
        let message = "This lead has already been converted.";
        try {
            // Extract the JSON part of the message for a more specific error
            const jsonString = error.message.substring(error.message.indexOf('{'));
            const parsed = JSON.parse(jsonString);
            message = parsed.Message || message;
        } catch (e) {
            // Could not parse, use default or a simplified message from the API response
            const simpleMessage = error.message.split(':').slice(1).join(':').trim();
            message = simpleMessage || message;
        }
        toast({ title: "Already Converted", description: message, variant: "default" });
        
        // Redirect based on the conflict message
        if (message.includes("Client")) {
            router.push('/dashboard/clients');
        } else {
            router.push('/dashboard/proposals');
        }
        onClose();
      } else {
        toast({ title: "Error", description: error instanceof Error ? error.message : "Conversion failed.", variant: "destructive" });
      }
    } finally {
        setIsLoading(false);
    }
  }

  if (!lead) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
            <DialogTitle>Convert to Proposal Sent: {lead.company_name}</DialogTitle>
            <DialogDescription>Update details before converting. GST Number is mandatory.</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
            <div className="space-y-4 rounded-md border p-4">
                <h3 className="text-md font-semibold">Company Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1"><Label htmlFor="company_name">Company Name *</Label><Input id="company_name" value={formData.company_name} onChange={e => handleInputChange("company_name", e.target.value)} required /></div>
                    <div className="space-y-1"><Label htmlFor="email">Company Email</Label><Input id="email" type="email" value={formData.email} onChange={e => handleInputChange("email", e.target.value)} /></div>
                    <div className="space-y-1"><Label htmlFor="phone_2">Company Phone 2</Label><Input id="phone_2" value={formData.phone_2} onChange={e => handleInputChange("phone_2", e.target.value)} /></div>
                    <div className="space-y-1"><Label htmlFor="website">Website</Label><Input id="website" value={formData.website} onChange={e => handleInputChange("website", e.target.value)} /></div>
                    <div className="space-y-1"><Label htmlFor="linkedIn">LinkedIn</Label><Input id="linkedIn" value={formData.linkedIn} onChange={e => handleInputChange("linkedIn", e.target.value)} /></div>
                </div>
            </div>

            <div className="space-y-4 rounded-md border p-4">
              <h3 className="text-md font-semibold">Contact Persons</h3>
              {contacts.map((contact, index) => (
                <div key={contact.id || index} className="space-y-3 rounded-md border p-3 relative bg-background">
                  {contacts.length > 1 && (<Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => removeContact(index)}><Trash2 className="h-4 w-4" /></Button>)}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="space-y-1"><Label htmlFor={`prefix_${index}`}>Prefix *</Label><Select value={contact.prefix} onValueChange={v => handleContactChange(index, "prefix", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{namePrefixes.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>
                    <div className="space-y-1"><Label htmlFor={`first_name_${index}`}>First Name *</Label><Input id={`first_name_${index}`} value={contact.first_name} onChange={e => handleContactChange(index, "first_name", e.target.value)} required /></div>
                    <div className="space-y-1"><Label htmlFor={`last_name_${index}`}>Last Name *</Label><Input id={`last_name_${index}`} value={contact.last_name} onChange={e => handleContactChange(index, "last_name", e.target.value)} required /></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1"><Label htmlFor={`phone_${index}`}>Phone *</Label><PhoneInput country={"in"} value={contact.phone} onChange={v => handleContactPhoneChange(index, v)} inputProps={{ id: `phone_${index}`, required: true }} containerClass="w-full" inputClass="!w-full !flex !h-10 !rounded-md !border !border-input !bg-background !pl-10 !px-3 !py-2 !text-sm" /></div>
                    <div className="space-y-1"><Label htmlFor={`designation_${index}`}>Designation</Label><Input id={`designation_${index}`} value={contact.designation || ""} onChange={e => handleContactChange(index, "designation", e.target.value)} /></div>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addContact} className="flex items-center gap-2"><PlusCircle className="h-4 w-4" /> Add Another Contact</Button>
            </div>

            <div className="space-y-4 rounded-md border p-4">
                <h3 className="text-md font-semibold">Address Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1"><Label htmlFor="address">Address Line 1</Label><Input id="address" value={formData.address} onChange={e => handleInputChange("address", e.target.value)} /></div>
                    <div className="space-y-1"><Label htmlFor="address_2">Address Line 2</Label><Input id="address_2" value={formData.address_2} onChange={e => handleInputChange("address_2", e.target.value)} /></div>
                    <div className="space-y-1"><Label htmlFor="city">City</Label><Input id="city" value={formData.city} onChange={e => handleInputChange("city", e.target.value)} /></div>
                    <div className="space-y-1"><Label htmlFor="state">State</Label><Input id="state" value={formData.state} onChange={e => handleInputChange("state", e.target.value)} /></div>
                    <div className="space-y-1"><Label htmlFor="pincode">Pincode</Label><Input id="pincode" value={formData.pincode} onChange={e => handleInputChange("pincode", e.target.value)} /></div>
                    <div className="space-y-1"><Label htmlFor="country">Country</Label><Input id="country" value={formData.country} onChange={e => handleInputChange("country", e.target.value)} /></div>
                </div>
            </div>

            <div className="space-y-4 rounded-md border p-4">
                <h3 className="text-md font-semibold">Lead Classification</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1"><Label htmlFor="source">Source</Label><Input id="source" value={formData.source} onChange={e => handleInputChange("source", e.target.value)} /></div>
                    <div className="space-y-1"><Label htmlFor="lead_type">Lead Type</Label><Input id="lead_type" value={formData.lead_type} onChange={e => handleInputChange("lead_type", e.target.value)} /></div>
                    <div className="space-y-1"><Label htmlFor="segment">Segment</Label><Input id="segment" value={formData.segment} onChange={e => handleInputChange("segment", e.target.value)} /></div>
                    <div className="space-y-1"><Label htmlFor="team_size">Team Size</Label><Input id="team_size" value={formData.team_size} onChange={e => handleInputChange("team_size", e.target.value)} /></div>
                    <div className="space-y-1"><Label htmlFor="turnover">Turnover</Label><Input id="turnover" value={formData.turnover} onChange={e => handleInputChange("turnover", e.target.value)} /></div>
                </div>
            </div>

            <div className="space-y-4 rounded-md border p-4">
                <h3 className="text-md font-semibold">Business & Technical Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1"><Label htmlFor="opportunity_business">Opportunity Business</Label><Input id="opportunity_business" value={formData.opportunity_business} onChange={e => handleInputChange("opportunity_business", e.target.value)} /></div>
                    <div className="space-y-1"><Label htmlFor="target_closing_date">Target Closing Date</Label><Input id="target_closing_date" type="date" value={formData.target_closing_date} onChange={e => handleInputChange("target_closing_date", e.target.value)} /></div>
                    <div className="space-y-1 col-span-2"><Label htmlFor="current_system">Current System</Label><Textarea id="current_system" value={formData.current_system} onChange={e => handleInputChange("current_system", e.target.value)} /></div>
                    <div className="space-y-1 col-span-2"><Label htmlFor="machine_specification">Machine Specification</Label><Textarea id="machine_specification" value={formData.machine_specification} onChange={e => handleInputChange("machine_specification", e.target.value)} /></div>
                    <div className="space-y-1 col-span-2"><Label htmlFor="challenges">Challenges</Label><Textarea id="challenges" value={formData.challenges} onChange={e => handleInputChange("challenges", e.target.value)} /></div>
                    <div className="space-y-1 col-span-2"><Label htmlFor="remark">Remark</Label><Textarea id="remark" value={formData.remark} onChange={e => handleInputChange("remark", e.target.value)} /></div>
                </div>
            </div>

            <div className="space-y-4 rounded-md border p-4">
                <h3 className="text-md font-semibold">Financial & Versioning</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div className="space-y-1">
                        <Label htmlFor="gst">GST Number *</Label>
                        <Input id="gst" value={formData.gst} onChange={e => handleInputChange("gst", e.target.value)} className={errors.gst ? "border-red-500" : ""} />
                        {errors.gst && <p className="text-sm text-red-500 mt-1">{errors.gst}</p>}
                    </div>
                    <div className="space-y-1"><Label htmlFor="company_pan">Company PAN</Label><Input id="company_pan" value={formData.company_pan} onChange={e => handleInputChange("company_pan", e.target.value)} /></div>
                    
                    

                    <div className="space-y-1"><Label htmlFor="database_type">Database Type</Label><Input id="database_type" value={formData.database_type} onChange={e => handleInputChange("database_type", e.target.value)} /></div>
                    <div className="space-y-1"><Label htmlFor="amc">AMC</Label><Input id="amc" value={formData.amc} onChange={e => handleInputChange("amc", e.target.value)} /></div>
                    <div className="space-y-1">
                        <Label htmlFor="version">Version</Label>
                        <Select value={formData.version} onValueChange={v => handleInputChange("version", v)}>
                            <SelectTrigger id="version">
                                <SelectValue placeholder="Select version..." />
                            </SelectTrigger>
                            <SelectContent>
                                {versionOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>
        </div>
        
        <DialogFooter className="pt-6">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={isLoading}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Convert & Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}