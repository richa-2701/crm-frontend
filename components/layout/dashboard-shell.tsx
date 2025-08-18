"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "./navbar"
import { Sidebar } from "./sidebar"
import { BottomNav } from "./bottom-nav"
import { CRMChatbot, FloatingChatbotButton } from "@/components/chatbot/crm-chatbot"

interface User {
  id: string
  username: string
  email: string
  role: string
  usernumber?: string
  department?: string
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isChatbotOpen, setIsChatbotOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/login")
      return
    }
    try {
      setUser(JSON.parse(userData))
    } catch (error) {
      console.error("[v0] Error parsing user data:", error)
      localStorage.removeItem("user")
      router.push("/login")
    }
  }, [router])

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />
      <div className="flex h-[calc(100vh-4rem)]">
        <div className="hidden md:block">
          <Sidebar
            userRole={user.role}
            currentUser={user}
            isCollapsed={isSidebarCollapsed}
            onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />
        </div>
        <main
          className={`flex-1 overflow-auto transition-all duration-300 ${
            isSidebarCollapsed ? "md:ml-16" : "md:ml-64"
          } md:ml-0`}
        >
          <div className="p-3 sm:p-4 md:p-6 pb-20 md:pb-6">
            <div className="mx-auto max-w-7xl">{children}</div>
          </div>
        </main>
      </div>

      <BottomNav />

      <FloatingChatbotButton onClick={() => setIsChatbotOpen(true)} />

      <CRMChatbot
        userRole={user.role}
        currentUser={user}
        isOpen={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)}
      />
    </div>
  )
}
