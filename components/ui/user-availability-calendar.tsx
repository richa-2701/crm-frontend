"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Users, Monitor } from "lucide-react"
import { api } from "@/lib/api"

interface Meeting {
  id: string
  lead_id: string
  assigned_to: string
  event_time: string
  event_end_time?: string
  type: "meeting"
}

interface Demo {
  id: string
  lead_id: string
  assigned_to: string
  start_time: string
  event_end_time?: string
  type: "demo"
}

interface UserEvent {
  id: string
  type: "meeting" | "demo"
  title: string
  start_time: string
  end_time: string
  assigned_to: string
}

interface Lead {
  id: number
  company_name: string
  contact_name: string
}

interface UserAvailabilityCalendarProps {
  className?: string
  showAllUsers?: boolean
  selectedDate?: Date
  selectedUser?: string
}

export function UserAvailabilityCalendar({
  className = "",
  showAllUsers = false,
  selectedDate = new Date(),
  selectedUser,
}: UserAvailabilityCalendarProps) {
  const [events, setEvents] = useState<UserEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<any[]>([])
  const [leads, setLeads] = useState<Lead[]>([])

  useEffect(() => {
    const fetchUserAvailability = async () => {
      try {
        setLoading(true)

        const [meetingsData, demosData, usersData, leadsData] = await Promise.all([
          api.getScheduledMeetings(),
          api.getScheduledDemos(),
          api.getUsers(),
          api.getLeads(),
        ])

        setUsers(usersData)
        setLeads(leadsData)

        const getLeadName = (leadId: string) => {
          const lead = leadsData.find((l: Lead) => l.id.toString() === leadId.toString())
          return lead ? lead.company_name : `Lead #${leadId}`
        }

        // Convert to unified format
        const allEvents: UserEvent[] = [
          ...meetingsData.map((meeting: Meeting) => ({
            id: meeting.id,
            type: "meeting" as const,
            title: `Meeting - ${getLeadName(meeting.lead_id)}`,
            start_time: meeting.event_time,
            end_time: meeting.event_end_time || meeting.event_time,
            assigned_to: meeting.assigned_to,
          })),
          ...demosData.map((demo: Demo) => ({
            id: demo.id,
            type: "demo" as const,
            title: `Demo - ${getLeadName(demo.lead_id)}`,
            start_time: demo.start_time,
            end_time: demo.event_end_time || demo.start_time,
            assigned_to: demo.assigned_to,
          })),
        ]

        setEvents(allEvents)
      } catch (error) {
        console.error("[v0] Error fetching user availability:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserAvailability()
  }, [])

  const getEventsForDate = (date: Date) => {
    const dateString = date.toDateString()
    let filteredEvents = events.filter((event) => new Date(event.start_time).toDateString() === dateString)

    if (selectedUser) {
      filteredEvents = filteredEvents.filter((event) => event.assigned_to === selectedUser)
    }

    return filteredEvents
  }

  const getBusyUsers = (date: Date) => {
    const dayEvents = getEventsForDate(date)
    const busyUserMap = new Map<string, UserEvent[]>()

    dayEvents.forEach((event) => {
      if (!busyUserMap.has(event.assigned_to)) {
        busyUserMap.set(event.assigned_to, [])
      }
      busyUserMap.get(event.assigned_to)!.push(event)
    })

    return busyUserMap
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const busyUsers = getBusyUsers(selectedDate)

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm">User Availability</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          {selectedUser
            ? `${selectedUser}'s Schedule - ${selectedDate.toLocaleDateString()}`
            : `User Availability - ${selectedDate.toLocaleDateString()}`}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {busyUsers.size === 0 ? (
          <p className="text-sm text-muted-foreground">
            {selectedUser ? `${selectedUser} is available` : "All users are available"}
          </p>
        ) : (
          <div className="space-y-3">
            {Array.from(busyUsers.entries()).map(([username, userEvents]) => (
              <div key={username} className="border rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-medium">
                    {username.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-sm">{username}</span>
                  <Badge variant="destructive" className="text-xs">
                    Busy
                  </Badge>
                </div>
                <div className="space-y-1">
                  {userEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center gap-2 text-xs p-2 rounded"
                      style={{ backgroundColor: event.type === "meeting" ? "#dbeafe" : "#dcfce7" }}
                    >
                      {event.type === "meeting" ? (
                        <Users className="h-3 w-3 text-blue-600" />
                      ) : (
                        <Monitor className="h-3 w-3 text-green-600" />
                      )}
                      <span className="flex-1 font-medium">{event.title}</span>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span className="font-medium">
                          {formatTime(event.start_time)} - {formatTime(event.end_time)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
