// frontend/components/users/delete-user-modal.tsx
"use client"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, AlertCircle } from "lucide-react"
import { userApi } from "@/lib/api" // Import the API library

interface User {
  id: string
  name: string
  email: string
  role: "admin" | "user"
  phone?: string
  department?: string
  createdAt?: string
}

interface DeleteUserModalProps {
  user: User | null
  isOpen: boolean
  onClose: () => void
  onUserDeleted: (userId: string) => void
}

export function DeleteUserModal({ user, isOpen, onClose, onUserDeleted }: DeleteUserModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleDelete = async () => {
    if (!user) return

    setIsLoading(true)
    setError("")

    try {
      // Make the actual API call to delete the user
      await userApi.deleteUser(Number.parseInt(user.id))

      onUserDeleted(user.id)
      onClose()
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || "Failed to delete user. Please try again."
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setError("")
    onClose()
  }

  if (!user) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Delete User
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the user account and remove all associated data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">User to be deleted:</h4>
            <div className="space-y-1 text-sm">
              <p>
                <strong>Name:</strong> {user.name}
              </p>
              <p>
                <strong>Email:</strong> {user.email}
              </p>
              <p>
                <strong>Role:</strong> {user.role === "admin" ? "Administrator" : "Company User"}
              </p>
              {user.department && (
                <p>
                  <strong>Department:</strong> {user.department}
                </p>
              )}
            </div>
          </div>

          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Warning:</strong> Deleting this user will permanently remove their account and all associated
              data. This action cannot be undone.
            </AlertDescription>
          </Alert>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
              {isLoading ? "Deleting..." : "Delete User"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}