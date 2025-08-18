"use client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Moon, Sun, LogOut, Menu, User, Settings } from "lucide-react"
import { useTheme } from "next-themes"
import Link from "next/link"

interface NavbarProps {
  user: {
    id: string
    username: string
    email: string
    role: string
  }
}

export function Navbar({ user }: NavbarProps) {
  const { theme, setTheme } = useTheme()
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem("user")
    router.push("/login")
  }

  const toggleTheme = () => {
    if (theme === "dark") {
      setTheme("light")
    } else if (theme === "light") {
      setTheme("dark")
    } else {
      setTheme("dark")
    }
  }

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center">
          <Link href="/dashboard" className="hover:opacity-80 transition-opacity">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight cursor-pointer">INDUS CRM</h1>
          </Link>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          <Link href="/dashboard/leads">
            <Button variant="ghost" size="sm" className="h-8 px-3">
              <Menu className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Leads</span>
            </Button>
          </Link>

          <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-8 w-8 sm:h-9 sm:w-9">
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">{(user.username || "U").charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48 sm:w-56" align="end" forceMount>
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium text-sm">{user.username}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              {user.role === "admin" && (
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/manage-users">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Manage Users</span>
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  )
}
