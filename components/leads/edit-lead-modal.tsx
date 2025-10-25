// frontend/components/leads/edit-lead-modal.tsx
"use client"

import { useState, useEffect, useMemo } from "react"
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
import { leadApi, api } from "@/lib/api"
import { Loader2, PlusCircle, Trash2 } from "lucide-react"

import PhoneInput from "react-phone-input-2"
import "react-phone-input-2/lib/style.css"
import { Country, State, City } from "country-state-city"
import { Combobox } from "@/components/ui/combobox"

interface Contact {
  id?: number
  prefix: string
  first_name: string
  last_name: string
  phone: string
  email: string | null
  designation: string | null
  linkedIn: string | null;
  pan: string | null;
}

interface Lead {
  id: string
  company_name: string
  contacts: {
    id?: number
    contact_name: string
    phone: string
    email: string | null
    designation: string | null
    linkedIn: string | null
    pan: string | null
  }[]
  email: string
  address?: string
  address_2?: string
  city?: string
  state?: string
  pincode?: string
  country?: string
  phone_2?: string
  team_size?: string
  turnover?: string
  source?: string
  segment?: string
  verticles?: string;
  assigned_to: string
  current_system?: string
  machine_specification?: string
  challenges?: string
  remark?: string
  lead_type?: string
  status: string
  opportunity_business?: string
  target_closing_date?: string
  version?: string;
  database_type?: string;
  amc?: string;
  gst?: string;
  company_pan?: string;
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

const namePrefixes = ["Mr.", "Mrs.", "Ms."]

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

// --- START OF FIX: Added 'version' to the master data options ---
interface MasterDataOptions {
    source: string[];
    segment: string[];
    verticles: string[];
    lead_type: string[];
    status: string[];
    current_system: string[];
    version: string[];
}
// --- END OF FIX ---

export function EditLeadModal({ lead, isOpen, onClose, onSave, users }: EditLeadModalProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    company_name: "", email: "", address: "", address_2: "", country: "", state: "", city: "",
    pincode: "", phone_2: "", team_size: "", turnover: "", source: "", segment: "", verticles: "", assigned_to: "",
    current_system: "", machine_specification: "", challenges: "", remark: "", lead_type: "", status: "",
    opportunity_business: "", target_closing_date: "",
    version: "", database_type: "", amc: "", gst: "", company_pan: "",
  })
  const [selectedCountry, setSelectedCountry] = useState<string | undefined>()
  const [selectedState, setSelectedState] = useState<string | undefined>()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [isLoading, setIsLoading] = useState(false)
  
  // --- START OF FIX: Initialized state to include 'version' ---
  const [masterOptions, setMasterOptions] = useState<MasterDataOptions>({
      source: [], segment: [], verticles: [], lead_type: [], status: [], current_system: [], version: []
  });
  // --- END OF FIX ---

  const countryOptions = useMemo(() => Country.getAllCountries().map(c => ({ value: c.isoCode, label: c.name })), [])
  const stateOptions = useMemo(() => selectedCountry ? State.getStatesOfCountry(selectedCountry).map(s => ({ value: s.isoCode, label: s.name })) : [], [selectedCountry])
  const cityOptions = useMemo(() => (selectedCountry && selectedState) ? City.getCitiesOfState(selectedCountry, selectedState).map(c => ({ value: c.name, label: c.name })) : [], [selectedCountry, selectedState])

  useEffect(() => {
    if (isOpen) {
        // --- START OF FIX: Fetch master data for 'version' along with other categories ---
        Promise.all([
            api.getByCategory("source"),
            api.getByCategory("segment"),
            api.getByCategory("verticles"),
            api.getByCategory("lead_type"),
            api.getByCategory("status"),
            api.getByCategory("current_system"),
            api.getByCategory("version") 
        ]).then(([sourceData, segmentData, verticlesData, leadTypeData, statusData, currentSystemData, versionData]) => {
            setMasterOptions({
                source: sourceData.map(item => item.value),
                segment: segmentData.map(item => item.value),
                verticles: verticlesData.map(item => item.value),
                lead_type: leadTypeData.map(item => item.value),
                status: statusData.map(item => item.value),
                current_system: currentSystemData.map(item => item.value),
                version: versionData.map(item => item.value),
            });
        }).catch(err => {
            console.error("Failed to fetch master data for modal", err);
            toast({ title: "Error", description: "Could not load dropdown options.", variant: "destructive" });
        });
        // --- END OF FIX ---
    }
  }, [isOpen, toast]);

  useEffect(() => {
    if (lead) {
      const countryObj = countryOptions.find(c => c.label === lead.country)
      const stateObj = countryObj ? State.getStatesOfCountry(countryObj.value).find(s => s.name === lead.state) : undefined
      setSelectedCountry(countryObj?.value)
      setSelectedState(stateObj?.isoCode)

      // --- START OF FIX: Ensure all fields including 'gst' and 'company_pan' are populated ---
      setFormData({
        company_name: lead.company_name || "", email: lead.email || "", address: lead.address || "",
        address_2: lead.address_2 || "", country: countryObj?.value || "", state: stateObj?.isoCode || "",
        city: lead.city || "", pincode: lead.pincode || "", phone_2: lead.phone_2 || "",
        team_size: lead.team_size || "", turnover: lead.turnover || "", source: lead.source || "",
        segment: lead.segment || "", verticles: lead.verticles || "", assigned_to: lead.assigned_to || "",
        current_system: lead.current_system || "", machine_specification: lead.machine_specification || "", 
        challenges: lead.challenges || "", remark: lead.remark || "", lead_type: lead.lead_type || "", 
        status: lead.status || "",
        opportunity_business: lead.opportunity_business || "",
        target_closing_date: lead.target_closing_date ? lead.target_closing_date.split('T')[0] : "",
        version: lead.version || "",
        database_type: lead.database_type || "",
        amc: lead.amc || "",
        gst: lead.gst || "",
        company_pan: lead.company_pan || "",
      })
      // --- END OF FIX ---

      if (lead.contacts && lead.contacts.length > 0) {
        setContacts(lead.contacts.map(c => ({ ...c, ...splitFullName(c.contact_name), linkedIn: c.linkedIn || null, pan: c.pan || null })))
      } else {
        setContacts([{ prefix: "Mr.", first_name: "", last_name: "", phone: "", email: "", designation: "", linkedIn: "", pan: "" }])
      }
    }
  }, [lead, countryOptions, isOpen])

  const handleInputChange = (field: keyof typeof formData, value: string) => setFormData(prev => ({ ...prev, [field]: value }))
  const handleContactChange = (index: number, field: keyof Omit<Contact, "phone">, value: string) => { const nc = [...contacts]; nc[index] = { ...nc[index], [field]: value }; setContacts(nc); }
  const handleContactPhoneChange = (index: number, value: string) => { const nc = [...contacts]; nc[index].phone = value; setContacts(nc); }
  const addContact = () => setContacts([...contacts, { prefix: "Mr.", first_name: "", last_name: "", phone: "", email: "", designation: "", linkedIn: "", pan: "" }])
  const removeContact = (index: number) => { if (contacts.length > 1) setContacts(contacts.filter((_, i) => i !== index)) }

  const handleSave = async () => {
    if (!lead) return
    setIsLoading(true)
    const pc = contacts.map(c => ({ id: c.id, contact_name: `${c.prefix} ${c.first_name} ${c.last_name}`.trim(), phone: c.phone, email: c.email, designation: c.designation, linkedIn: c.linkedIn, pan: c.pan }))
    const countryName = Country.getCountryByCode(formData.country)?.name
    const stateName = State.getStateByCodeAndCountry(formData.state, formData.country)?.name
    const payload = { ...formData, target_closing_date: formData.target_closing_date || null, country: countryName || formData.country, state: stateName || formData.state, contacts: pc }
    try {
      await leadApi.updateLead(parseInt(lead.id, 10), payload)
      toast({ title: "Lead Updated", description: `${lead.company_name} has been updated.` })
      onSave(lead.id, { ...lead, ...payload, contacts: pc })
      onClose()
    } catch (error) {
      console.error("Failed to update lead:", error)
      toast({ title: "Error", description: error instanceof Error ? error.message : "Update failed.", variant: "destructive" })
    } finally {
        setIsLoading(false)
    }
  }

  if (!lead) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Edit Lead - {lead.company_name}</DialogTitle><DialogDescription>Update lead details and save your changes.</DialogDescription></DialogHeader>
        
        <div className="space-y-6 py-4">

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Company Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div className="space-y-2"><Label htmlFor="company_name">Company Name *</Label><Input id="company_name" value={formData.company_name} onChange={e => handleInputChange("company_name", e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="email">Company Email</Label><Input id="email" type="email" value={formData.email} onChange={e => handleInputChange("email", e.target.value)} /></div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Contact Persons</h3>
            {contacts.map((contact, index) => (
              <div key={contact.id || index} className="space-y-4 rounded-lg border bg-muted/50 p-4 relative">
                {contacts.length > 1 && (<Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => removeContact(index)}><Trash2 className="h-4 w-4 text-red-500" /></Button>)}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                    <div className="space-y-2"><Label htmlFor={`prefix_${index}`}>Prefix *</Label><Select value={contact.prefix} onValueChange={v => handleContactChange(index, "prefix", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{namePrefixes.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>
                    <div className="space-y-2"><Label htmlFor={`first_name_${index}`}>First Name *</Label><Input id={`first_name_${index}`} value={contact.first_name} onChange={e => handleContactChange(index, "first_name", e.target.value)} required /></div>
                    <div className="space-y-2"><Label htmlFor={`last_name_${index}`}>Last Name *</Label><Input id={`last_name_${index}`} value={contact.last_name} onChange={e => handleContactChange(index, "last_name", e.target.value)} required /></div>
                </div>
                    <div className="space-y-2"><Label htmlFor={`phone_${index}`}>Phone *</Label><PhoneInput country={"in"} value={contact.phone} onChange={v => handleContactPhoneChange(index, v)} inputProps={{ id: `phone_${index}`, required: true }} containerClass="w-full" inputClass="!w-full !flex !h-10 !rounded-md !border !border-input !bg-background !pl-10 !px-3 !py-2 !text-sm" /></div>
                    <div className="space-y-2"><Label htmlFor={`designation_${index}`}>Designation</Label><Input id={`designation_${index}`} value={contact.designation || ""} onChange={e => handleContactChange(index, "designation", e.target.value)} /></div>
                
                <div className="space-y-2"><Label htmlFor={`contact_email_${index}`}>Contact Email</Label><Input id={`contact_email_${index}`} type="email" value={contact.email || ""} onChange={e => handleContactChange(index, "email", e.target.value)} /></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <div className="space-y-2"><Label htmlFor={`contact_linkedin_${index}`}>LinkedIn</Label><Input id={`contact_linkedin_${index}`} value={contact.linkedIn || ""} onChange={e => handleContactChange(index, "linkedIn", e.target.value)} /></div>
                    <div className="space-y-2"><Label htmlFor={`contact_pan_${index}`}>PAN</Label><Input id={`contact_pan_${index}`} value={contact.pan || ""} onChange={e => handleContactChange(index, "pan", e.target.value)} /></div>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addContact} className="flex items-center gap-2"><PlusCircle className="h-4 w-4" /> Add Another Contact</Button>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Address Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div className="space-y-2"><Label htmlFor="address">Address Line 1</Label><Input id="address" value={formData.address} onChange={e => handleInputChange("address", e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="address_2">Address Line 2</Label><Input id="address_2" value={formData.address_2} onChange={e => handleInputChange("address_2", e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="country">Country</Label><Combobox options={countryOptions} value={formData.country} onChange={v => { handleInputChange("country", v); setSelectedCountry(v); handleInputChange("state", ""); handleInputChange("city", ""); }} placeholder="Select country..." /></div>
              <div className="space-y-2"><Label htmlFor="state">State</Label><Combobox options={stateOptions} value={formData.state} onChange={v => { handleInputChange("state", v); setSelectedState(v); handleInputChange("city", ""); }} placeholder="Select state..." disabled={!selectedCountry} /></div>
              <div className="space-y-2"><Label htmlFor="city">City</Label><Combobox options={cityOptions} value={formData.city} onChange={v => handleInputChange("city", v)} placeholder="Select city..." disabled={!selectedState} /></div>
              <div className="space-y-2"><Label htmlFor="pincode">Pincode</Label><Input id="pincode" value={formData.pincode} onChange={e => handleInputChange("pincode", e.target.value)} /></div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Lead Classification & Details</h3>
            <div className="space-y-2"><Label htmlFor="phone_2">Company Phone 2</Label><PhoneInput country={"in"} value={formData.phone_2} onChange={v => handleInputChange("phone_2", v)} inputProps={{ id: 'phone_2' }} containerClass="w-full" inputClass="!w-full !flex !h-10 !rounded-md !border !border-input !bg-background !pl-10 !px-3 !py-2 !text-sm" /></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div className="space-y-2"><Label htmlFor="team_size">Team Size</Label><Input id="team_size" value={formData.team_size} onChange={e => handleInputChange("team_size", e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="turnover">Turnover</Label><Input id="turnover" value={formData.turnover} onChange={e => handleInputChange("turnover", e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="opportunity_business">Opportunity Business</Label><Input id="opportunity_business" value={formData.opportunity_business} onChange={e => handleInputChange("opportunity_business", e.target.value)} placeholder="e.g., 5 Lakhs"/></div>
              <div className="space-y-2"><Label htmlFor="target_closing_date">Target Closing Date</Label><Input id="target_closing_date" type="date" value={formData.target_closing_date} onChange={e => handleInputChange("target_closing_date", e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="source">Source</Label><Select value={formData.source} onValueChange={v => handleInputChange("source", v)}><SelectTrigger><SelectValue placeholder="Select a source" /></SelectTrigger><SelectContent>{masterOptions.source.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label htmlFor="segment">Segment</Label><Select value={formData.segment} onValueChange={v => handleInputChange("segment", v)}><SelectTrigger><SelectValue placeholder="Select a segment" /></SelectTrigger><SelectContent>{masterOptions.segment.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label htmlFor="verticles">Verticals</Label><Select value={formData.verticles} onValueChange={v => handleInputChange("verticles", v)}><SelectTrigger><SelectValue placeholder="Select a vertical" /></SelectTrigger><SelectContent>{masterOptions.verticles.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label htmlFor="lead_type">Lead Type</Label><Select value={formData.lead_type} onValueChange={v => handleInputChange("lead_type", v)}><SelectTrigger><SelectValue placeholder="Select a type" /></SelectTrigger><SelectContent>{masterOptions.lead_type.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label htmlFor="assigned_to">Assigned To *</Label><Select value={formData.assigned_to} onValueChange={v => handleInputChange("assigned_to", v)}><SelectTrigger><SelectValue placeholder="Select a user" /></SelectTrigger><SelectContent>{users.map(u => <SelectItem key={u.id} value={u.name}>{u.name}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label htmlFor="status">Lead Status</Label><Select value={formData.status} onValueChange={v => handleInputChange("status", v)}><SelectTrigger id="status"><SelectValue placeholder="Select a status" /></SelectTrigger><SelectContent>{masterOptions.status.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent></Select></div>
            </div>
          </div>
          
           <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Technical & Financial Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                    {/* --- START OF FIX: Changed Version from Input to Select dropdown --- */}
                    <div className="space-y-2">
                        <Label htmlFor="version">Version</Label>
                        <Select value={formData.version} onValueChange={v => handleInputChange("version", v)}>
                            <SelectTrigger id="version"><SelectValue placeholder="Select a version" /></SelectTrigger>
                            <SelectContent>{masterOptions.version.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    {/* --- END OF FIX --- */}
                    <div className="space-y-2"><Label htmlFor="database_type">Database Type</Label><Input id="database_type" value={formData.database_type} onChange={e => handleInputChange("database_type", e.target.value)} /></div>
                    <div className="space-y-2"><Label htmlFor="amc">AMC</Label><Input id="amc" value={formData.amc} onChange={e => handleInputChange("amc", e.target.value)} /></div>
                    <div className="space-y-2"><Label htmlFor="gst">Company GST</Label><Input id="gst" value={formData.gst} onChange={e => handleInputChange("gst", e.target.value)} /></div>
                    <div className="space-y-2"><Label htmlFor="company_pan">Company PAN</Label><Input id="company_pan" value={formData.company_pan} onChange={e => handleInputChange("company_pan", e.target.value)} /></div>
                </div>
            </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">System & Remarks</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div className="md:col-span-2 space-y-2"><Label htmlFor="current_system">Current System</Label><Select value={formData.current_system} onValueChange={v => handleInputChange("current_system", v)}><SelectTrigger><SelectValue placeholder="Select a system" /></SelectTrigger><SelectContent>{masterOptions.current_system.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label htmlFor="machine_specification">Machine Specification</Label><Textarea id="machine_specification" value={formData.machine_specification} onChange={e => handleInputChange("machine_specification", e.target.value)} rows={3} /></div>
                <div className="space-y-2"><Label htmlFor="challenges">Challenges Faced</Label><Textarea id="challenges" value={formData.challenges} onChange={e => handleInputChange("challenges", e.target.value)} rows={3} /></div>
                <div className="md:col-span-2 space-y-2"><Label htmlFor="remark">Remark</Label><Textarea id="remark" value={formData.remark} onChange={e => handleInputChange("remark", e.target.value)} rows={3} /></div>
            </div>
          </div>
        </div>
        
        <DialogFooter className="pt-6">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={isLoading}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Update Lead</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}