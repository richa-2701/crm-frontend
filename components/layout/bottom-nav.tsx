// frontend/components/layout/bottom-nav.tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
// --- CORRECTED: Imported necessary icons and dropdown components ---
import { Menu, Calendar, FileText, Workflow, Mail, MessageSquare } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
// --- END CORRECTION ---

const navItems = [
  {
    title: "Create",
    href: "/dashboard/create-lead",
    icon: Menu,
  },
  {
    title: "Schedule",
    href: "/dashboard/schedule",
    icon: Calendar,
  },
  {
    title: "Post Event",
    href: "/dashboard/post-event",
    icon: FileText,
  },
  {
    title: "Discussion",
    href: "/dashboard/discussion",
    icon: MessageSquare,
  },
]

// --- NEW: Component for the Drip Sequence Dropdown ---
function DripSequenceBottomNav() {
    const pathname = usePathname();
    const isDripActive = pathname.startsWith("/dashboard/message-master") || pathname.startsWith("/dashboard/drip-sequence");

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <div
                    className={cn(
                        "flex flex-col items-center justify-center gap-1 px-1 py-1 rounded-lg transition-colors min-w-0 flex-1 cursor-pointer",
                        isDripActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-accent",
                    )}
                >
                    <Workflow className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-medium truncate leading-tight">Drip</span>
                </div>
            </DropdownMenuTrigger>
            {/* The `align="center"` prop helps position the menu nicely above the button */}
            <DropdownMenuContent align="center" className="mb-2">
                <DropdownMenuItem asChild>
                    <Link href="/dashboard/message-master">
                        <Mail className="mr-2 h-4 w-4" />
                        <span>Message Master</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/dashboard/drip-sequence">
                        <Workflow className="mr-2 h-4 w-4" />
                        <span>Drip Master</span>
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
// --- END NEW COMPONENT ---


export function BottomNav() {
  const pathname = usePathname()

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t md:hidden">
      <nav className="flex items-center justify-around px-1 py-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-1 py-1 rounded-lg transition-colors min-w-0 flex-1",
                isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-accent",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="text-[10px] font-medium truncate leading-tight">{item.title}</span>
            </Link>
          )
        })}
        
        {/* --- CORRECTED: Added the new Drip Sequence menu component to the navigation bar --- */}
        <DripSequenceBottomNav />
        {/* --- END CORRECTION --- */}
      </nav>
    </div>
  )
}