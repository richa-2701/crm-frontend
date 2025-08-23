// frontend/components/layout/dashboard-shell.tsx
"use client"
import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "./navbar"
import { Sidebar } from "./sidebar"
import { BottomNav } from "./bottom-nav"
import { CRMChatbot, FloatingChatbotButton } from "@/components/chatbot/crm-chatbot"
import { ApiUser } from "@/lib/api"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null)
  const [isChatbotOpen, setIsChatbotOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />
      <div className="flex">
        <Sidebar
          currentUser={user}
          isCollapsed={isSidebarCollapsed}
          onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
        {/* --- CORRECTED: This main element is now correctly positioned relative to the sidebar --- */}
        <main
          className={cn(
            "flex-1 overflow-auto transition-all duration-300 pt-16", // pt-16 to account for navbar height
            isSidebarCollapsed ? "md:ml-16" : "md:ml-64"
          )}
        >
          <div className="p-3 sm:p-4 md:p-6 pb-20 md:pb-6">
            <div className="mx-auto max-w-7xl">{children}</div>
          </div>
        </main>
      </div>

      {isMobile && <BottomNav />}

      {!isChatbotOpen && <FloatingChatbotButton onClick={() => setIsChatbotOpen(true)} />}

      <CRMChatbot
        currentUser={user}
        isOpen={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)}
      />
    </div>
  )
}