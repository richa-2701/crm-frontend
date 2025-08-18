"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Menu, Calendar, FileText, Monitor, ClipboardList } from "lucide-react"

const navItems = [
  {
    title: "Create",
    href: "/dashboard/create-lead",
    icon: Menu,
  },
  {
    title: "Meeting",
    href: "/dashboard/schedule-meeting",
    icon: Calendar,
  },
  {
    title: "Post Meet",
    href: "/dashboard/post-meeting",
    icon: FileText,
  },
  {
    title: "Demo",
    href: "/dashboard/schedule-demo",
    icon: Monitor,
  },
  {
    title: "Post Demo",
    href: "/dashboard/post-demo",
    icon: ClipboardList,
  },
]

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
      </nav>
    </div>
  )
}
