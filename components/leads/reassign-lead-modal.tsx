//frontend/components/leads/reassign-lead-modal.tsx
"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface Lead {
  id: string
  company_name: string
  assigned_to: string
}

interface User {
  id: string
  name: string
  email: string
}

interface ReassignLeadModalProps {
  lead: Lead
  isOpen: boolean
  onClose: () => void
  onReassign: (leadId: string, newUserId: string) => void
  users: User[]
}

export function ReassignLeadModal({ lead, isOpen, onClose, onReassign, users }: ReassignLeadModalProps) {
  const [selectedUserId, setSelectedUserId] = useState("")

  const handleReassign = () => {
    if (selectedUserId) {
      onReassign(lead.id, selectedUserId)
      setSelectedUserId("")
    }
  }

  const handleClose = () => {
    setSelectedUserId("")
    onClose()
  }
  
  const currentlyAssignedUser = users.find(user => user.name === lead.assign_to);
  const availableUsers = users.filter(user => user.id !== currentlyAssignedUser?.id);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reassign Lead</DialogTitle>
          <DialogDescription>Reassign "{lead.company_name}" to a different team member.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="assign-to">Assign To</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a team member" />
              </SelectTrigger>
              <SelectContent>
                {/* Use the new filtered list */}
                {availableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleReassign} disabled={!selectedUserId}>
            Reassign Lead
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}