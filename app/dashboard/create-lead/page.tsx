// frontend/app/dashboard/create-lead/page.tsx
"use client"

import type React from "react"
import { useState, useEffect, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { leadApi, userApi, type ApiUser, api } from "@/lib/api"
import { Loader2, PlusCircle, Trash2 } from "lucide-react"
import { Country, State, City } from "country-state-city"
import { Combobox } from "@/components/ui/combobox"
import PhoneInput from "react-phone-input-2"
import "react-phone-input-2/lib/style.css"

interface User {
  id: string
  username: string
  email: string
  role: string
}

interface Contact {
  prefix: string
  first_name: string
  last_name: string
  phone: string
  email: string
  designation: string
  linkedIn: string
  pan: string
}

const namePrefixes = ["Mr.", "Mrs.", "Ms."];

interface MasterDataOptions {
    source: string[];
    segment: string[];
    verticles: string[];
    lead_type: string[];
    current_system: string[];
}

type ValidationErrors = {
  [key: string]: string | undefined; // General form fields
  contacts?: { // Nested errors for contacts
    [index: number]: {
      first_name?: string;
      last_name?: string;
      phone?: string;
    }
  }
}

export default function CreateLeadPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [companyUsers, setCompanyUsers] = useState<User[]>([])
  const [contacts, setContacts] = useState<Contact[]>([
    { prefix: "Mr.", first_name: "", last_name: "", phone: "", email: "", designation: "", linkedIn: "", pan: "" },
  ])

  const [errors, setErrors] = useState<ValidationErrors>({});
  const formRef = useRef<HTMLFormElement>(null);

  const [masterOptions, setMasterOptions] = useState<MasterDataOptions>({
      source: [], segment: [], verticles: [], lead_type: [], current_system: []
  });

  const [formData, setFormData] = useState({
    company_name: "",
    website: "",
    linkedIn: "",
    phone_2: "",
    email: "",
    address: "",
    address_2: "",
    country: "",
    state: "",
    city: "",
    pincode: "",
    team_size: "",
    turnover: "",
    source: "",
    segment: "",
    verticles: "",
    assigned_to: "",
    current_system: "",
    machine_specification: "",
    challenges: "",
    remark: "",
    lead_type: "",
    opportunity_business: "",
    target_closing_date: "",
    // --- START: NEW FIELDS ---
    version: "",
    database_type: "",
    amc: "",
    gst: "",
    company_pan: "",
    // --- END: NEW FIELDS ---
  })

  const [selectedCountry, setSelectedCountry] = useState<string | undefined>()
  const [selectedState, setSelectedState] = useState<string | undefined>()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = localStorage.getItem("user")
        if (userData) {
          const parsedUser = JSON.parse(userData)
          setUser(parsedUser)

          const [usersData, sourceData, segmentData, verticlesData, leadTypeData, currentSystemData] = await Promise.all([
              userApi.getUsers(),
              api.getByCategory("source"),
              api.getByCategory("segment"),
              api.getByCategory("verticles"),
              api.getByCategory("lead_type"),
              api.getByCategory("current_system")
          ]);

          const sources = sourceData.map(item => item.value);
          const segments = segmentData.map(item => item.value);
          const verticles = verticlesData.map(item => item.value);
          const lead_types = leadTypeData.map(item => item.value);
          const current_systems = currentSystemData.map(item => item.value);

          setMasterOptions({
              source: sources,
              segment: segments,
              verticles: verticles,
              lead_type: lead_types,
              current_system: current_systems,
          });

          const transformedUsers = usersData.map((user: ApiUser) => ({
            id: user.id.toString(),
            username: user.username,
            email: user.email || `${user.username}@company.com`,
            role: user.role || "Company User",
          }))

          const currentUserExists = transformedUsers.some(u => u.username === parsedUser.username)
          if (!currentUserExists) {
            transformedUsers.push({
              id: parsedUser.id?.toString() || "current",
              username: parsedUser.username,
              email: parsedUser.email || "",
              role: parsedUser.role || "Company User",
            })
          }

          setCompanyUsers(transformedUsers)

          setFormData(prev => ({
              ...prev,
              assigned_to: parsedUser.username,
              source: "",
              segment: "",
              verticles: "",
              lead_type: "",
              current_system: "",
          }));
        }
      } catch (error) {
        console.error("[v0] Failed to initialize form:", error)
        toast({
          title: "Error",
          description: "Failed to initialize form. Please refresh the page.",
          variant: "destructive",
        })
      }
    }

    fetchData()
  }, [toast])

  const countryOptions = useMemo(() => Country.getAllCountries().map(c => ({ value: c.isoCode, label: c.name })), [])
  const stateOptions = useMemo(() => selectedCountry ? State.getStatesOfCountry(selectedCountry).map(s => ({ value: s.isoCode, label: s.name })) : [], [selectedCountry])
  const cityOptions = useMemo(() => (selectedCountry && selectedState) ? City.getCitiesOfState(selectedCountry, selectedState).map(c => ({ value: c.name, label: c.name })) : [], [selectedCountry, selectedState])

  const handleInputChange = (field: string, value: string) => {
    setErrors(prev => ({...prev, [field]: undefined}));

    if (field === "phone_2") {
        const formattedPhone = value.startsWith('+') ? value : `+${value}`;
        setFormData(prev => ({ ...prev, [field]: formattedPhone }));
        return;
    }
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleContactChange = (index: number, field: keyof Omit<Contact, "phone">, value: string) => {
    setErrors(prev => ({
      ...prev,
      contacts: {
        ...prev.contacts,
        [index]: { ...prev.contacts?.[index], [field]: undefined }
      }
    }));
    const newContacts = [...contacts]
    newContacts[index][field] = value
    setContacts(newContacts)
  }

  const handleContactPhoneChange = (index: number, phoneValue: string) => {
    setErrors(prev => ({
      ...prev,
      contacts: {
        ...prev.contacts,
        [index]: { ...prev.contacts?.[index], phone: undefined }
      }
    }));
    const newContacts = [...contacts]
    const formattedPhone = phoneValue.startsWith('+') ? phoneValue : `+${phoneValue}`;
    newContacts[index].phone = formattedPhone;
    setContacts(newContacts)
  }

  const addContact = () => {
    setContacts([...contacts, { prefix: "Mr.", first_name: "", last_name: "", phone: "", email: "", designation: "", linkedIn: "", pan: "" }])
  }

  const removeContact = (index: number) => {
    if (contacts.length > 1) {
      const newContacts = contacts.filter((_, i) => i !== index)
      setContacts(newContacts)
    }
  }
  
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};
    let firstErrorId: string | null = null;

    if (!formData.company_name.trim()) {
      newErrors.company_name = "Company Name is required.";
      if (!firstErrorId) firstErrorId = "company_name";
    }
    if (!formData.assigned_to.trim()) {
      newErrors.assigned_to = "'Assigned To' is required.";
      if (!firstErrorId) firstErrorId = "assigned_to";
    }

    const contactErrors: ValidationErrors['contacts'] = {};
    contacts.forEach((contact, index) => {
        const currentContactErrors: {first_name?: string; last_name?: string; phone?: string;} = {};
        if (!contact.first_name.trim()) {
            currentContactErrors.first_name = "First Name is required.";
            if (!firstErrorId) firstErrorId = `first_name_${index}`;
        }
        if (!contact.last_name.trim()) {
            currentContactErrors.last_name = "Last Name is required.";
            if (!firstErrorId) firstErrorId = `last_name_${index}`;
        }
        if (!contact.phone || contact.phone.length <= 3) {
            currentContactErrors.phone = "Phone number is required.";
            if (!firstErrorId) firstErrorId = `phone_${index}`;
        }
        if (Object.keys(currentContactErrors).length > 0) {
            contactErrors[index] = currentContactErrors;
        }
    });

    if (Object.keys(contactErrors).length > 0) {
        newErrors.contacts = contactErrors;
    }

    setErrors(newErrors);

    if (firstErrorId) {
        const errorElement = formRef.current?.querySelector(`#${firstErrorId}`);
        errorElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        toast({
            title: "Missing Required Fields",
            description: "Please fill in all the highlighted fields.",
            variant: "destructive",
        });
    }

    return Object.keys(newErrors).length === 0;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return;
    }

    setIsLoading(true)

    try {
      const assignedUser = companyUsers.find(u => u.username === formData.assigned_to)
      const countryName = Country.getCountryByCode(formData.country)?.name
      const stateName = State.getStateByCodeAndCountry(formData.state, formData.country)?.name

      const processedContacts = contacts.map(contact => ({
        contact_name: `${contact.prefix} ${contact.first_name} ${contact.last_name}`.trim(),
        phone: contact.phone,
        email: contact.email,
        designation: contact.designation,
        linkedIn: contact.linkedIn,
        pan: contact.pan,
      }))

      const leadData = {
        ...formData,
        target_closing_date: formData.target_closing_date || null,
        assigned_to: assignedUser?.username || formData.assigned_to,
        country: countryName || formData.country,
        state: stateName || formData.state,
        created_by: user?.username || "unknown",
        source: formData.source || "Manual Entry",
        contacts: processedContacts,
      }

      const newLead = await leadApi.createLead(leadData);

      toast({
        title: "Lead Created",
        description: "The lead has been successfully created. Redirecting...",
      })

      router.push(`/dashboard/leads/${newLead.id}`);

    } catch (error) {
      console.error("[v0] Failed to create lead:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create lead. Please check your connection.",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-3 sm:space-y-6">
      <div className="px-1">
        <h1 className="text-xl sm:text-3xl font-bold tracking-tight">Create Lead</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Add a new lead to your CRM system</p>
      </div>

      <Card className="border-0 sm:border shadow-none sm:shadow-sm">
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-lg sm:text-xl">Lead Information</CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          <form onSubmit={handleSubmit} className="space-y-6" ref={formRef}>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="company_name">Company *</Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={e => handleInputChange("company_name", e.target.value)}
                  className={errors.company_name ? "border-red-500" : ""}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="email">Company Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={e => handleInputChange("email", e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={e => handleInputChange("website", e.target.value)}
                  placeholder="e.g., https://www.example.com"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="linkedIn">Company LinkedIn</Label>
                <Input
                  id="linkedIn"
                  type="url"
                  value={formData.linkedIn}
                  onChange={e => handleInputChange("linkedIn", e.target.value)}
                  placeholder="e.g., https://linkedin.com/company/example"
                />
              </div>
            </div>

            <div className="space-y-4 rounded-md border p-4">
              <h3 className="text-md font-semibold">Contact Persons</h3>
              {contacts.map((contact, index) => (
                <div key={index} className="space-y-3 rounded-md border p-3 relative">
                  {contacts.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6"
                      onClick={() => removeContact(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-3 items-end">
                    <div className="space-y-1">
                      <Label htmlFor={`prefix_${index}`}>Prefix *</Label>
                      <Select
                        value={contact.prefix}
                        onValueChange={value => handleContactChange(index, "prefix", value)}
                      >
                        <SelectTrigger id={`prefix_${index}`}>
                          <SelectValue placeholder="Select prefix" />
                        </SelectTrigger>
                        <SelectContent>
                          {namePrefixes.map(p => (
                            <SelectItem key={p} value={p}>
                              {p}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:col-span-2">
                      <div className="space-y-1">
                        <Label htmlFor={`first_name_${index}`}>First Name *</Label>
                        <Input
                          id={`first_name_${index}`}
                          value={contact.first_name}
                          onChange={e => handleContactChange(index, "first_name", e.target.value)}
                          className={errors.contacts?.[index]?.first_name ? "border-red-500" : ""}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`last_name_${index}`}>Last Name *</Label>
                        <Input
                          id={`last_name_${index}`}
                          value={contact.last_name}
                          onChange={e => handleContactChange(index, "last_name", e.target.value)}
                          className={errors.contacts?.[index]?.last_name ? "border-red-500" : ""}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label htmlFor={`phone_${index}`}>Phone *</Label>
                      <PhoneInput
                        country={"in"}
                        value={contact.phone}
                        onChange={phone => handleContactPhoneChange(index, phone)}
                        enableSearch={true}
                        inputProps={{ id: `phone_${index}` }}
                        containerClass="w-full"
                        inputClass={`!w-full !flex !h-10 !rounded-md !border !bg-background !pl-10 !px-3 !py-2 !text-sm ${errors.contacts?.[index]?.phone ? "!border-red-500" : "!border-input"}`}
                      />
                    </div>
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label htmlFor={`designation_${index}`}>Designation</Label>
                        <Input
                          id={`designation_${index}`}
                          value={contact.designation}
                          onChange={e => handleContactChange(index, "designation", e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`contact_email_${index}`}>Email</Label>
                        <Input
                          id={`contact_email_${index}`}
                          type="email"
                          value={contact.email}
                          onChange={e => handleContactChange(index, "email", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label htmlFor={`contact_linkedin_${index}`}>LinkedIn Profile</Label>
                      <Input
                        id={`contact_linkedin_${index}`}
                        type="url"
                        value={contact.linkedIn}
                        onChange={e => handleContactChange(index, "linkedIn", e.target.value)}
                        placeholder="e.g., https://linkedin.com/in/john-doe"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`contact_pan_${index}`}>PAN</Label>
                      <Input
                        id={`contact_pan_${index}`}
                        value={contact.pan}
                        onChange={e => handleContactChange(index, "pan", e.target.value)}
                        placeholder="e.g., ABCDE1234F"
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

            <div className="space-y-4 rounded-md border p-4">
              <h3 className="text-md font-semibold">Address Details</h3>
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <div>
                  <Label htmlFor="address">Address Line 1</Label>
                  <Input id="address" value={formData.address} onChange={e => handleInputChange("address", e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="address_2">Address Line 2</Label>
                  <Input id="address_2" value={formData.address_2} onChange={e => handleInputChange("address_2", e.target.value)} />
                </div>
              </div>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Combobox
                    options={countryOptions}
                    value={formData.country}
                    onChange={value => {
                      handleInputChange("country", value)
                      setSelectedCountry(value)
                      handleInputChange("state", "")
                      setSelectedState(undefined)
                      handleInputChange("city", "")
                    }}
                    placeholder="Select country..."
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Combobox
                    options={stateOptions}
                    value={formData.state}
                    onChange={value => {
                      handleInputChange("state", value)
                      setSelectedState(value)
                      handleInputChange("city", "")
                    }}
                    placeholder="Select state..."
                    disabled={!selectedCountry}
                  />
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Combobox options={cityOptions} value={formData.city} onChange={value => handleInputChange("city", value)} placeholder="Select city..." disabled={!selectedState} />
                </div>
                <div>
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input id="pincode" value={formData.pincode} onChange={e => handleInputChange("pincode", e.target.value)} />
                </div>
              </div>
            </div>

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 ">
              <div className="space-y-1">
                <Label htmlFor="phone_2">Company Phone 2</Label>
                <PhoneInput
                  country={"in"}
                  value={formData.phone_2}
                  onChange={phone => handleInputChange("phone_2", phone)}
                  enableSearch={true}
                  inputProps={{ id: "phone_2" }}
                  containerClass="w-full"
                  inputClass="!w-full !flex !h-10 !rounded-md !border !border-input !bg-background !pl-10 !px-3 !py-2 !text-sm"
                />
              </div>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:col-span-1 lg:col-span-2">
                <div className="space-y-1">
                  <Label htmlFor="team_size">Team Size</Label>
                  <Input
                    id="team_size"
                    type="number"
                    value={formData.team_size}
                    onChange={e => handleInputChange("team_size", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="turnover">Turnover</Label>
                  <Input
                    id="turnover"
                    placeholder="e.g., 1 Cr"
                    value={formData.turnover}
                    onChange={e => handleInputChange("turnover", e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 rounded-md border p-4">
                <h3 className="text-md font-semibold">Opportunity Details</h3>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                    <div className="space-y-1">
                        <Label htmlFor="opportunity_business">Opportunity Business</Label>
                        <Input
                            id="opportunity_business"
                            placeholder="e.g., 5 Lakhs, $10,000"
                            value={formData.opportunity_business}
                            onChange={e => handleInputChange("opportunity_business", e.target.value)}
                        />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="target_closing_date">Target Closing Date</Label>
                        <Input
                            id="target_closing_date"
                            type="date"
                            value={formData.target_closing_date}
                            onChange={e => handleInputChange("target_closing_date", e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* --- START: NEW SECTION FOR NEW FIELDS --- */}
            <div className="space-y-4 rounded-md border p-4">
                <h3 className="text-md font-semibold">Technical & Financial Details</h3>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                    <div className="space-y-1">
                        <Label htmlFor="version">Version</Label>
                        <Input id="version" value={formData.version} onChange={e => handleInputChange("version", e.target.value)} />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="database_type">Database Type</Label>
                        <Input id="database_type" value={formData.database_type} onChange={e => handleInputChange("database_type", e.target.value)} />
                    </div>
                     <div className="space-y-1">
                        <Label htmlFor="amc">AMC</Label>
                        <Input id="amc" value={formData.amc} onChange={e => handleInputChange("amc", e.target.value)} />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="gst">Company GST</Label>
                        <Input id="gst" value={formData.gst} onChange={e => handleInputChange("gst", e.target.value)} />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="company_pan">Company PAN</Label>
                        <Input id="company_pan" value={formData.company_pan} onChange={e => handleInputChange("company_pan", e.target.value)} />
                    </div>
                </div>
            </div>
            {/* --- END: NEW SECTION --- */}

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              <div className="space-y-1">
                <Label htmlFor="source">Source</Label>
                <Select value={formData.source} onValueChange={value => handleInputChange("source", value)}>
                  <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
                  <SelectContent>{masterOptions.source.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="segment">Segment</Label>
                <Select value={formData.segment} onValueChange={value => handleInputChange("segment", value)}>
                  <SelectTrigger><SelectValue placeholder="Select segment" /></SelectTrigger>
                  <SelectContent>{masterOptions.segment.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="verticles">Verticals</Label>
                <Select value={formData.verticles} onValueChange={value => handleInputChange("verticles", value)}>
                  <SelectTrigger><SelectValue placeholder="Select vertical" /></SelectTrigger>
                  <SelectContent>{masterOptions.verticles.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="lead_type">Lead Type</Label>
                <Select value={formData.lead_type} onValueChange={value => handleInputChange("lead_type", value)}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>{masterOptions.lead_type.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="assigned_to">Assigned To *</Label>
                <Select value={formData.assigned_to} onValueChange={value => handleInputChange("assigned_to", value)}>
                  <SelectTrigger id="assigned_to" className={errors.assigned_to ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>{companyUsers.map(user => <SelectItem key={user.id} value={user.username}>{user.username}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
              <Label htmlFor="current_system">Current System</Label>
              <Select value={formData.current_system} onValueChange={value => handleInputChange("current_system", value)}>
                  <SelectTrigger><SelectValue placeholder="Select system" /></SelectTrigger>
                  <SelectContent>{masterOptions.current_system.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            </div>

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="machine_specification">Machine Specification</Label>
                <Textarea id="machine_specification" value={formData.machine_specification} onChange={e => handleInputChange("machine_specification", e.target.value)} rows={3} className="resize-none" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="challenges">Challenges</Label>
                <Textarea id="challenges" value={formData.challenges} onChange={e => handleInputChange("challenges", e.target.value)} rows={3} className="resize-none" />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="remark">Remark</Label>
              <Textarea id="remark" value={formData.remark} onChange={e => handleInputChange("remark", e.target.value)} rows={3} className="resize-none" />
            </div>

            <div className="flex gap-4 pt-2">
              <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                {isLoading ? ( <> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving... </> ) : ( "Save Lead" )}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()} className="w-full sm:w-auto">
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}