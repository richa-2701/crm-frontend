interface User {
  id: string
  name: string
  email: string
  role: "admin" | "user"
}

interface Lead {
  id: string
  company_name: string
  contact_name: string
  assigned_to: string
  status: string
  [key: string]: any
}

interface Meeting {
  id: string
  lead_id: string
  assigned_to: string
  start_time: string
  end_time: string
  type: "meeting" | "demo"
}

export function filterLeadsByRole(leads: Lead[], user: User): Lead[] {
  if (user.role === "admin") {
    return leads
  }

  // Company users only see leads assigned to them
  return leads.filter((lead) => lead.assigned_to === user.id)
}

export function filterMeetingsByRole(meetings: Meeting[], user: User): Meeting[] {
  if (user.role === "admin") {
    return meetings
  }

  // Company users only see meetings assigned to them
  return meetings.filter((meeting) => meeting.assigned_to === user.id)
}

export function canViewAllData(user: User): boolean {
  return user.role === "admin"
}

export function canManageAllLeads(user: User): boolean {
  return user.role === "admin"
}

export function canAssignToOthers(user: User): boolean {
  return user.role === "admin"
}
