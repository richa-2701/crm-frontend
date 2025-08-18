"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { leadApi } from "@/lib/api"

interface Lead {
  id: string
  company_name: string
  contact_name: string
  phone: string
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

interface User {
  id: string
  name: string
  email: string
}

interface EditLeadModalProps {
  lead: Lead
  isOpen: boolean
  onClose: () => void
  onSave: (leadId: string, updatedData: Partial<Lead>) => void
  users: User[]
}

const leadTypes = ["Hot Lead", "Cold Lead", "Not Our Segment"]

export function EditLeadModal({ lead, isOpen, onClose, onSave, users }: EditLeadModalProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    company_name: "",
    contact_name: "",
    phone: "",
    phone_2: "",
    email: "",
    address: "",
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

  useEffect(() => {
    if (lead) {
      setFormData({
        company_name: lead.company_name || "",
        contact_name: lead.contact_name || "",
        phone: lead.phone || "",
        phone_2: lead.phone_2 || "",
        email: lead.email || "",
        address: lead.address || "",
        team_size: lead.team_size || "",
        turnover: lead.turnover || "",
        source: lead.source || "",
        segment: lead.segment || "",
        assigned_to: lead.assigned_to || "",
        current_system: lead.current_system || "",
        machine_specification: lead.machine_specification || "",
        challenges: lead.challenges || "",
        remark: lead.remark || "",
        lead_type: lead.lead_type || "",
      })
    }
  }, [lead])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      console.log("[v0] Updating lead with data:", formData)
      const updatedLead = await leadApi.updateLead(Number.parseInt(lead.id), formData)
      console.log("[v0] Lead update response:", updatedLead)

      onSave(lead.id, formData)

      toast({
        title: "Lead Updated",
        description: "The lead has been successfully updated.",
      })

      onClose()
    } catch (error) {
      console.error("[v0] Error updating lead:", error)
      toast({
        title: "Error",
        description: "Failed to update lead. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Lead - {lead?.company_name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor="edit_company_name" className="text-sm">
                Company *
              </Label>
              <Input
                id="edit_company_name"
                value={formData.company_name}
                onChange={(e) => handleInputChange("company_name", e.target.value)}
                required
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit_contact_name" className="text-sm">
                Contact *
              </Label>
              <Input
                id="edit_contact_name"
                value={formData.contact_name}
                onChange={(e) => handleInputChange("contact_name", e.target.value)}
                required
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit_email" className="text-sm">
                Email *
              </Label>
              <Input
                id="edit_email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                required
                className="h-9 text-sm"
              />
            </div>
          </div>

          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <Label htmlFor="edit_phone" className="text-sm">
                Phone *
              </Label>
              <Input
                id="edit_phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                required
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit_phone_2" className="text-sm">
                Phone 2
              </Label>
              <Input
                id="edit_phone_2"
                type="tel"
                value={formData.phone_2}
                onChange={(e) => handleInputChange("phone_2", e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit_team_size" className="text-sm">
                Team Size
              </Label>
              <Input
                id="edit_team_size"
                type="number"
                value={formData.team_size}
                onChange={(e) => handleInputChange("team_size", e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit_turnover" className="text-sm">
                Turnover
              </Label>
              <Input
                id="edit_turnover"
                placeholder="1 Cr"
                value={formData.turnover}
                onChange={(e) => handleInputChange("turnover", e.target.value)}
                className="h-9 text-sm"
              />
            </div>
          </div>

          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <Label htmlFor="edit_source" className="text-sm">
                Source
              </Label>
              <Input
                id="edit_source"
                placeholder="Website"
                value={formData.source}
                onChange={(e) => handleInputChange("source", e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit_segment" className="text-sm">
                Segment
              </Label>
              <Input
                id="edit_segment"
                placeholder="IT"
                value={formData.segment}
                onChange={(e) => handleInputChange("segment", e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit_lead_type" className="text-sm">
                Lead Type
              </Label>
              <Select value={formData.lead_type} onValueChange={(value) => handleInputChange("lead_type", value)}>
                <SelectTrigger className="h-9 text-sm">
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
            <div className="space-y-1">
              <Label htmlFor="edit_assigned_to" className="text-sm">
                Assigned To *
              </Label>
              <Select value={formData.assigned_to} onValueChange={(value) => handleInputChange("assigned_to", value)}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="edit_current_system" className="text-sm">
              Current System
            </Label>
            <Input
              id="edit_current_system"
              placeholder="Excel"
              value={formData.current_system}
              onChange={(e) => handleInputChange("current_system", e.target.value)}
              className="h-9 text-sm"
            />
          </div>

          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="edit_machine_specification" className="text-sm">
                Machine Spec
              </Label>
              <Textarea
                id="edit_machine_specification"
                value={formData.machine_specification}
                onChange={(e) => handleInputChange("machine_specification", e.target.value)}
                rows={2}
                className="text-sm resize-none"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit_challenges" className="text-sm">
                Challenges
              </Label>
              <Textarea
                id="edit_challenges"
                value={formData.challenges}
                onChange={(e) => handleInputChange("challenges", e.target.value)}
                rows={2}
                className="text-sm resize-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="edit_remark" className="text-sm">
              Remark
            </Label>
            <Textarea
              id="edit_remark"
              value={formData.remark}
              onChange={(e) => handleInputChange("remark", e.target.value)}
              rows={2}
              className="text-sm resize-none"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? "Updating..." : "Update Lead"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
