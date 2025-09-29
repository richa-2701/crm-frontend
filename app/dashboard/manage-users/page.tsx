// frontend/app/dashboard/manage-users/page.tsx
"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Users, Search, Plus, MoreHorizontal, Edit, Trash2, AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { EditUserModal } from "@/components/users/edit-user-modal"
import { CreateUserModal } from "@/components/users/create-user-modal"
import { DeleteUserModal } from "@/components/users/delete-user-modal"
import { userApi, type ApiUser } from "@/lib/api"

// This interface is only used on the frontend, ApiUser is from the backend
interface User {
  id: string
  name: string
  email: string
  role: "admin" | "user"
  phone?: string
  department?: string
  createdAt?: string
  company_name: string; // Add company_name to the local User type
}

export default function ManageUsersPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true)
      setError("")

      const usersData = await userApi.getUsers()
      const transformedUsers: User[] = usersData.map((user: ApiUser) => ({
        id: user.id.toString(),
        name: user.username,
        email: user.email || `${user.username}@company.com`,
        role: user.role?.toLowerCase() === "admin" ? "admin" : "user",
        phone: user.usernumber,
        department: user.department || "N/A",
        createdAt: user.created_at,
        company_name: user.company_name, // Map the company name
      }))

      setUsers(transformedUsers)
      setFilteredUsers(transformedUsers)
    } catch (err) {
      console.error("Failed to load users:", err)
      setError("Failed to load users. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/login")
      return
    }

    const parsedUser: ApiUser = JSON.parse(userData)
    if (parsedUser.role?.toLowerCase() !== "admin") {
      router.push("/dashboard")
      return
    }

    // Transform the current user to the local User type as well
    setCurrentUser({
        id: parsedUser.id.toString(),
        name: parsedUser.username,
        email: parsedUser.email || "",
        role: parsedUser.role?.toLowerCase() === "admin" ? "admin" : "user",
        phone: parsedUser.usernumber,
        department: parsedUser.department,
        createdAt: parsedUser.created_at,
        company_name: parsedUser.company_name
    })
    loadUsers()
  }, [router, loadUsers])

  useEffect(() => {
    const filtered = users.filter(
      (user) =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.department?.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredUsers(filtered)
  }, [searchTerm, users])

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setIsEditModalOpen(true)
  }

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user)
    setIsDeleteModalOpen(true)
  }

  const handleUserUpdated = async (updatedUser: User) => {
    try {
      await userApi.updateUser(Number.parseInt(updatedUser.id), {
        username: updatedUser.name,
        usernumber: updatedUser.phone,
        role: updatedUser.role,
        email: updatedUser.email,
        department: updatedUser.department,
      })
      
      setSuccess("User updated successfully!")
      setTimeout(() => setSuccess(""), 3000)
      loadUsers(); // Reload to ensure data is fresh from the server
    } catch (error) {
      console.error("Failed to update user:", error)
      setError("Failed to update user. Please try again.")
      setTimeout(() => setError(""), 3000)
    }
  }

  const handleUserCreated = () => {
    setSuccess("User created successfully!")
    setTimeout(() => setSuccess(""), 3000)
    loadUsers() // The best way to show the new user is to reload the list
  }

  const handleUserDeleted = async (userId: string) => {
    try {
      await userApi.deleteUser(Number.parseInt(userId))

      const updatedUsers = users.filter((user) => user.id !== userId)
      setUsers(updatedUsers)
      setSuccess("User deleted successfully!")
      setTimeout(() => setSuccess(""), 3000)
    } catch (error) {
      console.error("Failed to delete user:", error)
      setError("Failed to delete user. Please try again.")
      setTimeout(() => setError(""), 3000)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (isLoading || !currentUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manage Users</h1>
          <p className="text-muted-foreground">View and manage all system users</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Users ({filteredUsers.length})
          </CardTitle>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                          {user.role === "admin" ? "Administrator" : "Company User"}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.department || "N/A"}</TableCell>
                      <TableCell>{user.phone || "N/A"}</TableCell>
                      <TableCell>{formatDate(user.createdAt)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditUser(user)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            {user.id !== currentUser.id && (
                              <DropdownMenuItem onClick={() => handleDeleteUser(user)} className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <EditUserModal
        user={selectedUser}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedUser(null)
        }}
        onUserUpdated={handleUserUpdated}
      />

      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onUserCreated={handleUserCreated}
        currentUser={currentUser}
      />

      <DeleteUserModal
        user={selectedUser}
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setSelectedUser(null)
        }}
        onUserDeleted={handleUserDeleted}
      />
    </div>
  )
}