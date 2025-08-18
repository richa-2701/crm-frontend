const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://4adc3d24dcb8.ngrok-free.app"

// API Response Types
export interface ApiUser {
  id: number
  username: string
  usernumber: string
  email?: string
  department?: string
  created_at?: string
}

export interface ApiLead {
  id: number
  company_name: string
  contact_name: string
  phone: string
  email?: string
  address?: string
  source: string
  segment?: string
  team_size?: string
  remark?: string
  status: string
  assigned_to: string
  created_by: string
  created_at: string
  updated_at?: string
  phone_2?: string
  turnover?: string
  current_system?: string
  machine_specification?: string
  challenges?: string
  lead_type?: string
}

export interface ApiActivity {
  id: number
  lead_id: number
  details: string
  phase: string
  created_at: string
}

export interface ApiMeeting {
  id: number
  lead_id: number
  assigned_to: string
  event_type: string
  event_time: string
  event_end_time: string
  created_by: string
  remark?: string
  created_at: string
}

export interface ApiDemo {
  id: number
  lead_id: number
  scheduled_by: string
  assigned_to: string
  start_time: string
  event_end_time: string
  phase: string
  remark?: string
  created_at: string
  updated_at: string
}

// Authentication APIs
export const authApi = {
  async login(username: string, password: string): Promise<ApiUser> {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    })
    if (!response.ok) throw new Error("Login failed")
    return response.json()
  },

  async register(userData: {
    username: string
    password: string
    usernumber: string
    email?: string
    department?: string
  }): Promise<ApiUser> {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    })
    if (!response.ok) throw new Error("Registration failed")
    return response.json()
  },

  async changePassword(data: {
    username: string
    old_password: string
    new_password: string
  }): Promise<{ status: string; message: string }> {
    const response = await fetch(`${API_BASE_URL}/change-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error("Password change failed")
    return response.json()
  },
}

// User Management APIs
export const userApi = {
  async getUsers(): Promise<ApiUser[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true", // Skip ngrok browser warning
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] API Error Response:", errorText)
        throw new Error(`Failed to fetch users: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log("[v0] Users fetched successfully:", data)
      return data
    } catch (error) {
      console.error("[v0] Error fetching users:", error)
      throw error
    }
  },
}

// Lead Management APIs
export const leadApi = {
  async getAllLeads(): Promise<ApiLead[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/web/leads`, {
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] API Error Response:", errorText)
        throw new Error(`Failed to fetch all leads: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log("[v0] All leads fetched successfully:", data)
      return data
    } catch (error) {
      console.error("[v0] Error fetching all leads:", error)
      throw error
    }
  },

  async getLeadsByUser(userId: string): Promise<ApiLead[]> {
    try {
      if (!userId) {
        console.warn("[v0] No userId provided, cannot fetch leads from API")
        throw new Error("User ID is required")
      }

      const response = await fetch(`${API_BASE_URL}/leads/${userId}`, {
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] API Error Response:", errorText)
        throw new Error(`Failed to fetch leads: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log("[v0] Leads fetched successfully:", data)
      return data
    } catch (error) {
      console.error("[v0] Error fetching leads:", error)
      throw error
    }
  },

  async getLeadById(leadId: number): Promise<ApiLead> {
    try {
      const response = await fetch(`${API_BASE_URL}/leads/${leadId}`, {
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] API Error Response:", errorText)
        throw new Error(`Failed to fetch lead: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log("[v0] Lead fetched successfully:", data)
      return data
    } catch (error) {
      console.error("[v0] Error fetching lead:", error)
      throw error
    }
  },

  async createLead(leadData: {
    company_name: string
    contact_name: string
    phone: string
    email?: string
    address?: string
    source: string
    segment?: string
    team_size?: string
    assigned_to: string
    created_by: string
    remark?: string
    phone_2?: string
    turnover?: string
    current_system?: string
    machine_specification?: string
    challenges?: string
    lead_type?: string
  }): Promise<ApiLead> {
    try {
      const response = await fetch(`${API_BASE_URL}/web/leads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify(leadData),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] API Error Response:", errorText)
        throw new Error(`Failed to create lead: ${response.status}`)
      }

      const data = await response.json()
      console.log("[v0] Lead created successfully:", data)
      return data
    } catch (error) {
      console.error("[v0] Error creating lead:", error)
      throw error
    }
  },

  async getActivities(leadId: number): Promise<ApiActivity[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/activities/${leadId}`, {
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] API Error Response:", errorText)
        throw new Error(`Failed to fetch activities: ${response.status} ${response.statusText}`)
      }

      return response.json()
    } catch (error) {
      console.error("[v0] Error fetching activities:", error)
      throw error
    }
  },

  async getHistory(leadId: number) {
    try {
      const response = await fetch(`${API_BASE_URL}/history/${leadId}`, {
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] API Error Response:", errorText)
        throw new Error(`Failed to fetch history: ${response.status} ${response.statusText}`)
      }

      return response.json()
    } catch (error) {
      console.error("[v0] Error fetching history:", error)
      throw error
    }
  },

  async updateLead(
    leadId: number,
    leadData: Partial<{
      company_name: string
      contact_name: string
      phone: string
      email?: string
      address?: string
      source: string
      segment?: string
      team_size?: string
      assigned_to: string
      remark?: string
      phone_2?: string
      turnover?: string
      current_system?: string
      machine_specification?: string
      challenges?: string
      lead_type?: string
    }>,
  ): Promise<ApiLead> {
    try {
      console.log("[v0] Attempting to update lead:", leadId, "with data:", leadData)
      console.log("[v0] API URL:", `${API_BASE_URL}/web/leads/${leadId}`)

      const response = await fetch(`${API_BASE_URL}/web/leads/${leadId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify(leadData),
      })

      console.log("[v0] Response status:", response.status)
      console.log("[v0] Response ok:", response.ok)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] API Error Response:", errorText)
        console.error("[v0] Response headers:", Object.fromEntries(response.headers.entries()))
        throw new Error(`Failed to update lead: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const data = await response.json()
      console.log("[v0] Lead updated successfully:", data)
      return data
    } catch (error) {
      console.error("[v0] Error updating lead:", error)
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error(`Network error: Unable to connect to API at ${API_BASE_URL}. Please check your connection.`)
      }
      throw error
    }
  },
}

// Chat Assistant API
export const chatApi = {
  async sendMessage(message: string, userPhone: string): Promise<{ status: string; reply: string }> {
    const response = await fetch(`${API_BASE_URL}/app`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_phone: userPhone,
        message: message,
      }),
    })
    if (!response.ok) throw new Error("Failed to send message")
    return response.json()
  },
}

// Task API
export const taskApi = {
  async getUserTasks(username: string) {
    const response = await fetch(`${API_BASE_URL}/tasks/${username}`)
    if (!response.ok) throw new Error("Failed to fetch tasks")
    return response.json()
  },
}

// Meetings and Demos APIs
export const meetingsApi = {
  async getScheduledMeetings(): Promise<ApiMeeting[]> {
    try {
      console.log("[v0] Fetching scheduled meetings from API...")
      const response = await fetch(`${API_BASE_URL}/web/meetings`, {
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] API Error Response:", errorText)
        throw new Error(`Failed to fetch meetings: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log("[v0] Meetings fetched successfully:", data.length, "meetings")

      // Map the API response to our expected format
      return data.map((meeting: any) => ({
        id: meeting.id,
        lead_id: meeting.lead_id,
        assigned_to: meeting.assigned_to,
        event_type: "Meeting",
        event_time: meeting.start_time,
        event_end_time: meeting.event_end_time,
        created_by: meeting.scheduled_by,
        remark: meeting.remark,
        created_at: meeting.created_at,
      }))
    } catch (error) {
      console.error("[v0] Error fetching meetings:", error)
      return []
    }
  },

  async getScheduledDemos(): Promise<ApiDemo[]> {
    try {
      console.log("[v0] Fetching scheduled demos from API...")
      const response = await fetch(`${API_BASE_URL}/web/demos`, {
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] API Error Response:", errorText)
        throw new Error(`Failed to fetch demos: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log("[v0] Demos fetched successfully:", data.length, "demos")

      // Map the API response to our expected format
      return data.map((demo: any) => ({
        id: demo.id,
        lead_id: demo.lead_id,
        scheduled_by: demo.created_by,
        assigned_to: demo.assigned_to,
        start_time: demo.event_time,
        event_end_time: demo.event_end_time,
        phase: "Scheduled",
        remark: demo.remark,
        created_at: demo.created_at,
        updated_at: demo.created_at,
      }))
    } catch (error) {
      console.error("[v0] Error fetching demos:", error)
      return []
    }
  },
}

// Unified API export that combines all individual API objects
export const api = {
  // Authentication methods
  login: authApi.login,
  register: authApi.register,
  changePassword: authApi.changePassword,

  // User management methods
  getUsers: userApi.getUsers,

  // Lead management methods
  getAllLeads: leadApi.getAllLeads,
  getLeadsByUser: leadApi.getLeadsByUser,
  getLeadById: leadApi.getLeadById,
  createLead: leadApi.createLead,
  updateLead: leadApi.updateLead,
  getActivities: leadApi.getActivities,
  getHistory: leadApi.getHistory,

  // Chat methods
  sendMessage: chatApi.sendMessage,

  // Task methods
  getUserTasks: taskApi.getUserTasks,

  // Meetings and demos methods
  getScheduledMeetings: meetingsApi.getScheduledMeetings,
  getScheduledDemos: meetingsApi.getScheduledDemos,
}
