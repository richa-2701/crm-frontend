"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import { LayoutDashboard, Menu, Calendar, FileText, Monitor, ClipboardList } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ChevronRight, ChevronLeft } from "lucide-react"

interface SidebarProps {
  userRole: "admin" | "user"
  currentUser: {
    id: string
    username: string
    usernumber: string
    email: string
    department: string
    role: string
  }
  isCollapsed?: boolean
  onToggle?: () => void
}

const navigationItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Create Lead",
    href: "/dashboard/create-lead",
    icon: Menu,
  },
  {
    title: "Schedule Meeting",
    href: "/dashboard/schedule-meeting",
    icon: Calendar,
  },
  {
    title: "Post Meeting",
    href: "/dashboard/post-meeting",
    icon: FileText,
  },
  {
    title: "Schedule Demo",
    href: "/dashboard/schedule-demo",
    icon: Monitor,
  },
  {
    title: "Post Demo",
    href: "/dashboard/post-demo",
    icon: ClipboardList,
  },
]

function SidebarContent({
  userRole,
  currentUser,
  onItemClick,
  isCollapsed = false,
}: SidebarProps & { onItemClick?: () => void }) {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-auto py-4">
        <nav className="space-y-1 px-3">
          {navigationItems
            .filter((item) => item.href !== "/dashboard/leads") // Removed Lead Details from sidebar
            .map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              const linkContent = (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onItemClick}
                  className={cn(
                    "flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isCollapsed ? "justify-center" : "space-x-3",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!isCollapsed && <span className="truncate">{item.title}</span>}
                </Link>
              )

              if (isCollapsed) {
                return (
                  <TooltipProvider key={item.href}>
                    <Tooltip>
                      <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                      <TooltipContent side="right">
                        <p>{item.title}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )
              }

              return linkContent
            })}
        </nav>
      </div>

      <div className="border-t p-4">
        <div className={cn("flex items-center", isCollapsed ? "justify-center" : "space-x-3")}>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
            {(currentUser.username || "U").charAt(0).toUpperCase()}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{currentUser.username}</p>
              <p className="text-xs text-muted-foreground capitalize">{currentUser.role}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function Sidebar({ userRole, currentUser, isCollapsed = false, onToggle }: SidebarProps) {
  const isMobile = useIsMobile()
  const [mobileOpen, setMobileOpen] = useState(false)

  if (isMobile) {
    return (
      <>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="fixed top-4 left-4 z-40 md:hidden">
              {/* Menu icon remains unchanged */}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SidebarContent userRole={userRole} currentUser={currentUser} onItemClick={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
      </>
    )
  }

  return (
    <>
      <div
        className={cn(
          "hidden md:flex md:flex-col md:fixed md:inset-y-16 md:z-30 transition-all duration-300",
          isCollapsed ? "md:w-16" : "md:w-64",
        )}
      >
        <div className="flex flex-col flex-1 min-h-0 border-r bg-card">
          <SidebarContent userRole={userRole} currentUser={currentUser} isCollapsed={isCollapsed} />
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="absolute -right-3 top-6 z-40 h-6 w-6 rounded-full border bg-background shadow-md hover:bg-accent"
        >
          {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
          <span className="sr-only">Toggle sidebar</span>
        </Button>
      </div>
    </>
  )
}
