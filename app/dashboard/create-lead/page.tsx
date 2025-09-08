//frontend/app/dashboard/create-lead/page.tsx
"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
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
import { leadApi, userApi, type ApiUser } from "@/lib/api"
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
}

const leadTypes = ["Hot Lead", "Cold Lead", "Warm Lead", "Not Our Segment"]
const namePrefixes = ["Mr.", "Mrs.", "Ms."]

export default function CreateLeadPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [companyUsers, setCompanyUsers] = useState<User[]>([])
  const [contacts, setContacts] = useState<Contact[]>([
    { prefix: "Mr.", first_name: "", last_name: "", phone: "", email: "", designation: "" },
  ])
  const [formData, setFormData] = useState({
    company_name: "",
    phone_2: "",
    email: "", // Main company email
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
    assigned_to: "",
    current_system: "",
    machine_specification: "",
    challenges: "",
    remark: "",
    lead_type: "",
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

          let transformedUsers: User[] = []

          try {
            const usersData = await userApi.getUsers()
            transformedUsers = usersData.map((user: ApiUser) => ({
              id: user.id.toString(),
              username: user.username,
              email: user.email || `${user.username}@company.com`,
              role: user.role || "Company User",
            }))
          } catch (apiError) {
            console.error("[v0] Failed to load users from API:", apiError)
            toast({
              title: "Error",
              description: "Failed to load users from backend. Please check your connection.",
              variant: "destructive",
            })
          }

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
          setFormData(prev => ({ ...prev, assigned_to: parsedUser.username }))
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
    if (field === "phone_2") {
        const formattedPhone = value.startsWith('+') ? value : `+${value}`;
        setFormData(prev => ({ ...prev, [field]: formattedPhone }));
        return; // Important: exit after handling the special case
    }
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleContactChange = (index: number, field: keyof Omit<Contact, "phone">, value: string) => {
    const newContacts = [...contacts]
    newContacts[index][field] = value
    setContacts(newContacts)
  }

  const handleContactPhoneChange = (index: number, phoneValue: string) => {
    const newContacts = [...contacts]
    const formattedPhone = phoneValue.startsWith('+') ? phoneValue : `+${phoneValue}`;
    newContacts[index].phone = formattedPhone;
    setContacts(newContacts)
  }

  const addContact = () => {
    setContacts([...contacts, { prefix: "Mr.", first_name: "", last_name: "", phone: "", email: "", designation: "" }])
  }

  const removeContact = (index: number) => {
    if (contacts.length > 1) {
      const newContacts = contacts.filter((_, i) => i !== index)
      setContacts(newContacts)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.company_name || !formData.assigned_to) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in Company Name and select a user for 'Assigned To'.",
        variant: "destructive",
      })
      return
    }

    for (const [index, contact] of contacts.entries()) {
      if (!contact.first_name || !contact.last_name) {
        toast({
          title: `Missing Name for Contact ${index + 1}`,
          description: "Please provide a first name and last name for all contact persons.",
          variant: "destructive",
        })
        return
      }
      if (!contact.phone) {
        toast({
          title: `Missing Phone for Contact ${index + 1}`,
          description: "Please provide a phone number for all contact persons.",
          variant: "destructive",
        })
        return
      }
      // if (contact.phone.startsWith("+91") && contact.phone.length !== 13) {
      //   toast({
      //     title: `Invalid Phone Number for Contact ${index + 1}`,
      //     description: "Indian phone numbers must have 10 digits after the country code.",
      //     variant: "destructive",
      //   })
      //   return
      // }
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
      }))

      const leadData = {
        ...formData,
        assigned_to: assignedUser?.username || formData.assigned_to,
        country: countryName || formData.country,
        state: stateName || formData.state,
        created_by: user?.username || "unknown",
        source: formData.source || "Manual Entry",
        contacts: processedContacts,
      }

      await leadApi.createLead(leadData)

      toast({
        title: "Lead Created",
        description: "The lead has been successfully created. Redirecting...",
      })
      
      // --- THE FIX: Use window.location.href for a guaranteed redirect and page refresh ---
      window.location.href = "/dashboard/leads"

    } catch (error) {
      console.error("[v0] Failed to create lead:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create lead. Please check your connection.",
        variant: "destructive",
      })
      // Stop the loading indicator if an error occurs
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
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="company_name">Company *</Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={e => handleInputChange("company_name", e.target.value)}
                  required
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
                    <div className="space-y-1">
                      <Label htmlFor={`first_name_${index}`}>First Name *</Label>
                      <Input
                        id={`first_name_${index}`}
                        value={contact.first_name}
                        onChange={e => handleContactChange(index, "first_name", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`last_name_${index}`}>Last Name *</Label>
                      <Input
                        id={`last_name_${index}`}
                        value={contact.last_name}
                        onChange={e => handleContactChange(index, "last_name", e.target.value)}
                        required
                      />
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
                        inputProps={{
                          id: `phone_${index}`,
                          required: true,
                        }}
                        containerClass="w-full"
                        inputClass="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`designation_${index}`}>Designation</Label>
                      <Input
                        id={`designation_${index}`}
                        value={contact.designation}
                        onChange={e => handleContactChange(index, "designation", e.target.value)}
                      />
                    </div>
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
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
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

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1">
                <Label htmlFor="phone_2">Company Phone 2</Label>
                <PhoneInput
                  country={"in"}
                  value={formData.phone_2}
                  onChange={phone => handleInputChange("phone_2", phone)}
                  enableSearch={true}
                  inputProps={{ id: "phone_2" }}
                  containerClass="w-full"
                  inputClass="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
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

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1">
                <Label htmlFor="source">Source</Label>
                <Input
                  id="source"
                  placeholder="e.g., Website"
                  value={formData.source}
                  onChange={e => handleInputChange("source", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="segment">Segment</Label>
                <Input
                  id="segment"
                  placeholder="e.g., IT"
                  value={formData.segment}
                  onChange={e => handleInputChange("segment", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="lead_type">Lead Type</Label>
                <Select value={formData.lead_type} onValueChange={value => handleInputChange("lead_type", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {leadTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="assigned_to">Assigned To *</Label>
                <Select value={formData.assigned_to} onValueChange={value => handleInputChange("assigned_to", value)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {companyUsers.map(user => (
                      <SelectItem key={user.id} value={user.username}>
                        {user.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="current_system">Current System</Label>
              <Input
                id="current_system"
                placeholder="e.g., Excel"
                value={formData.current_system}
                onChange={e => handleInputChange("current_system", e.target.value)}
              />
            </div>

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="machine_specification">Machine Specification</Label>
                <Textarea
                  id="machine_specification"
                  value={formData.machine_specification}
                  onChange={e => handleInputChange("machine_specification", e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="challenges">Challenges</Label>
                <Textarea
                  id="challenges"
                  value={formData.challenges}
                  onChange={e => handleInputChange("challenges", e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="remark">Remark</Label>
              <Textarea
                id="remark"
                value={formData.remark}
                onChange={e => handleInputChange("remark", e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="flex gap-4 pt-2">
              <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Lead"
                )}
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