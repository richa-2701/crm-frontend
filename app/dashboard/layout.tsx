import type React from "react"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { ChatAssistant } from "@/components/chat/chat-assistant"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <DashboardShell>{children}</DashboardShell>
      <ChatAssistant />
    </>
  )
}
