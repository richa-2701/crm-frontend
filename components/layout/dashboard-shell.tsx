// frontend/components/layout/dashboard-shell.tsx
"use client"
import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "./navbar"
import { Sidebar, SidebarContent } from "./sidebar" 
import { CRMChatbot, FloatingChatbotButton } from "@/components/chatbot/crm-chatbot"
import { ApiUser } from "@/lib/api"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null)
  const [isChatbotOpen, setIsChatbotOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const router = useRouter()
  const isMobile = useIsMobile()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/login")
      return
    }
    try {
      setUser(JSON.parse(userData))
    } catch (error) {
      console.error("Error parsing user data from localStorage:", error)
      localStorage.removeItem("user")
      router.push("/login")
    }
  }, [router])

  if (!user) {
    return <div className="flex h-screen w-full items-center justify-center">Loading...</div>
  }
  
  const MobileSidebar = (
    <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden h-8 w-8">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="p-4 border-b">
            <SheetTitle>INDUS CRM</SheetTitle>
            {/* <SheetDescription>
                Navigate through the CRM application.
            </SheetDescription> */}
        </SheetHeader>
        <SidebarContent currentUser={user} onItemClick={() => setMobileSidebarOpen(false)} />
      </SheetContent>
    </Sheet>
  )

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user}>
        {isMobile && MobileSidebar}
      </Navbar>
      <div className="flex">
        <Sidebar
          currentUser={user}
          isCollapsed={isSidebarCollapsed}
          onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
        <main
          className={cn(
            "flex-1 overflow-auto transition-all duration-300 pt-16", 
            isSidebarCollapsed ? "md:ml-16" : "md:ml-64"
          )}
        >
          <div className="pt-0 pl-2 pb-4 md:px-6 md:pb-6">
            <div className="mx-auto max-w-7xl">{children}</div>
          </div>
        </main>
      </div>

      {!isChatbotOpen && <FloatingChatbotButton onClick={() => setIsChatbotOpen(true)} />}

      <CRMChatbot
        currentUser={user}
        isOpen={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)}
      />
    </div>
  )
}