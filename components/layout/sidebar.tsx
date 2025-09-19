// frontend/components/layout/sidebar.tsx
"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Menu, Calendar, FileText, Mail, Workflow, MessageSquare, Upload, UploadCloud, ListChecks, Database, Calendar as CalendarIcon, Briefcase  } from "lucide-react" // --- CHANGE: IMPORTED DATABASE ICON, BRIEFCASE ICON ---
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ChevronRight, ChevronLeft } from "lucide-react"
import { ApiUser } from "@/lib/api"

interface SidebarProps {
  currentUser: ApiUser
  isCollapsed?: boolean
  onToggle?: () => void
  onItemClick?: () => void
}

const navigationItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, adminOnly: false },
  { title: "Leads", href: "/dashboard/leads", icon: ListChecks, adminOnly: false },
  { title: "Clients", href: "/dashboard/clients", icon: Briefcase, adminOnly: false }, // New Clients Link
  { title: "Create Lead", href: "/dashboard/create-lead", icon: Menu, adminOnly: false },
  { title: "Schedule Meeting/Demo", href: "/dashboard/schedule", icon: Calendar, adminOnly: false },
  { title: "Events", href: "/dashboard/events", icon: FileText, adminOnly: false },
  { title: "Activity", href: "/dashboard/activity", icon: MessageSquare, adminOnly: false },
  { title: "Google Calendar", href: "/dashboard/google-calendar", icon: CalendarIcon, adminOnly: false },
  { title: "Add Quotation", href: "/dashboard/add-quotation", icon: Upload, adminOnly: false },
  { title: "Bulk Upload Leads", href: "/dashboard/bulk-upload", icon: UploadCloud, adminOnly: false },
  { title: "Masters", href: "/dashboard/masters", icon: Database, adminOnly: true },
]

function DripSequenceMenu({ isCollapsed, onItemClick }: { isCollapsed?: boolean, onItemClick?: () => void }) {
    const pathname = usePathname();
    const isDripActive = pathname.startsWith("/dashboard/message-master") || pathname.startsWith("/dashboard/drip-sequence");
    const triggerContent = (
        <div className={cn("flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer w-full", isCollapsed ? "justify-center" : "space-x-3", isDripActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground")}>
            <Workflow className="h-4 w-4 shrink-0" />
            {!isCollapsed && <span className="truncate">Drip Sequence</span>}
        </div>
    );
    const trigger = isCollapsed ? ( <TooltipProvider><Tooltip><TooltipTrigger asChild>{triggerContent}</TooltipTrigger><TooltipContent side="right"><p>Drip Sequence</p></TooltipContent></Tooltip></TooltipProvider> ) : ( triggerContent );
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start" className="ml-2">
                <DropdownMenuItem asChild><Link href="/dashboard/message-master" onClick={onItemClick}><Mail className="mr-2 h-4 w-4" /><span>Message Master</span></Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link href="/dashboard/drip-sequence" onClick={onItemClick}><Workflow className="mr-2 h-4 w-4" /><span>Drip Master</span></Link></DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export function SidebarContent({ currentUser, onItemClick, isCollapsed = false }: SidebarProps) {
  const pathname = usePathname()

  // --- CHANGE: FILTER NAVIGATION ITEMS BASED ON USER ROLE ---
  const accessibleNavItems = navigationItems.filter(item =>
      !item.adminOnly || (item.adminOnly && currentUser.role === 'admin')
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-auto py-4">
        <nav className="space-y-1 px-3">
          {accessibleNavItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            const linkContent = (
              <Link key={item.href} href={item.href} onClick={onItemClick}
                className={cn("flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors", isCollapsed ? "justify-center" : "space-x-3", isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground")}>
                <Icon className="h-4 w-4 shrink-0" />
                {!isCollapsed && <span className="truncate">{item.title}</span>}
              </Link>
            )
            if (isCollapsed) { return ( <TooltipProvider key={item.href}><Tooltip><TooltipTrigger asChild>{linkContent}</TooltipTrigger><TooltipContent side="right"><p>{item.title}</p></TooltipContent></Tooltip></TooltipProvider> ) }
            return linkContent
          })}
          <DripSequenceMenu isCollapsed={isCollapsed} onItemClick={onItemClick} />
        </nav>
      </div>
      <div className="border-t p-4">
        <div className={cn("flex items-center", isCollapsed ? "justify-center" : "space-x-3")}>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">{(currentUser.username || "U").charAt(0).toUpperCase()}</div>
          {!isCollapsed && (<div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{currentUser.username}</p><p className="text-xs text-muted-foreground capitalize">{currentUser.role}</p></div>)}
        </div>
      </div>
    </div>
  )
}

export function Sidebar({ currentUser, isCollapsed = false, onToggle }: SidebarProps) {
  return (
    <aside className={cn("hidden md:fixed md:inset-y-0 md:flex md:flex-col md:z-30 transition-all duration-300", isCollapsed ? "md:w-16" : "md:w-64")}>
      <div className="flex flex-col flex-1 min-h-0 border-r bg-card pt-16">
        <SidebarContent currentUser={currentUser} isCollapsed={isCollapsed} />
      </div>
      <Button variant="ghost" size="icon" onClick={onToggle} className="absolute -right-3 top-20 z-40 h-6 w-6 rounded-full border bg-background shadow-md hover:bg-accent">
        {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        <span className="sr-only">Toggle sidebar</span>
      </Button>
    </aside>
  )
}