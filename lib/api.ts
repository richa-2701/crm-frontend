// frontend/lib/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://4adc3d24dcb8.ngrok-free.app"

// API Response Types
export interface ApiUser {
  id: number
  username: string
  usernumber: string
  email?: string
  department?: string
  created_at?: string
  role?: string
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
  contacts?: Contact[]
}

interface Contact {
  id: number
  lead_id: number
  contact_name: string
  phone: string
  email: string | null
  designation: string | null
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

export interface ApiMessageMaster {
  id: number;
  message_code: string;
  message_name: string;
  message_content: string | null;
  message_type: 'text' | 'media' | 'document';
  attachment_path: string | null;
  created_at: string;
  created_by: string;
}

export interface ApiMessageMasterCreatePayload {
  message_name: string;
  message_content?: string;
  message_type: 'text' | 'media' | 'document';
  created_by: string;
}

export interface ApiDripSequenceStep {
  id: number;
  message_id: number;
  day_to_send: number;
  time_to_send: string; // "HH:MM:SS"
  sequence_order: number;
  message: ApiMessageMaster;
}

export interface ApiDripSequence {
  id: number;
  drip_code: string;
  drip_name: string;
  created_at: string;
  created_by: string;
  steps: ApiDripSequenceStep[];
}

export interface ApiDripSequenceList {
  id: number;
  drip_code: string;
  drip_name: string;
  created_at: string;
  created_by: string;
}

export interface ApiDripSequenceCreatePayload {
  drip_name: string;
  created_by: string;
  steps: {
    message_id: number;
    day_to_send: number;
    time_to_send: string; // "HH:MM"
    sequence_order: number;
  }[];
}

export interface ApiReminder {
    id: number;
    lead_id: number;
    remind_time: string;
    message: string;
    assigned_to: string;
    status: string;
    created_at: string;
}

async function fetcher<T>(url: string, options: RequestInit = {}): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not defined in your .env.local file.");
  }

  const defaultHeaders = {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  };

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers: { ...defaultHeaders, ...options.headers },
    });

    if (!response.ok) {
      let errorDetail = "An unknown error occurred.";
      try {
        const errorData = await response.json();
        errorDetail = errorData.detail || JSON.stringify(errorData);
      } catch (e) {
        errorDetail = await response.text();
      }
      throw new Error(`API request failed: ${response.status} - ${errorDetail}`);
    }

    if (response.status === 204) {
      return null as T;
    }

    return response.json();
  } catch (error) {
    console.error("Fetch failed:", error);
    throw error;
  }
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

  async updateUser(
    userId: number,
    userData: {
      username?: string
      usernumber?: string
      email?: string
      department?: string
      role?: string
    },
  ): Promise<ApiUser> {
    try {
      const response = await fetch(`${API_BASE_URL}/web/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify(userData),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] API Error Response:", errorText)
        throw new Error(`Failed to update user: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log("[v0] User updated successfully:", data)
      return data
    } catch (error) {
      console.error("[v0] Error updating user:", error)
      throw error
    }
  },

  async deleteUser(userId: number): Promise<{ status: string; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/web/users/${userId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] API Error Response:", errorText)
        throw new Error(`Failed to delete user: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log("[v0] User deleted successfully:", data)
      return data
    } catch (error) {
      console.error("[v0] Error deleting user:", error)
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
      // The URL now correctly includes the `/web` prefix to match the backend router.
      const response = await fetch(`${API_BASE_URL}/web/leads/${leadId}`, {
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


export const messageMasterApi = {
    getMessages(): Promise<ApiMessageMaster[]> {
        return fetcher("/web/messages");
    },
    createMessage(data: ApiMessageMasterCreatePayload): Promise<ApiMessageMaster> {
        return fetcher("/web/messages", { method: "POST", body: JSON.stringify(data) });
    },
    updateMessage(id: number, data: Partial<ApiMessageMasterCreatePayload>): Promise<ApiMessageMaster> {
        return fetcher(`/web/messages/${id}`, { method: "PUT", body: JSON.stringify(data) });
    },
    deleteMessage(id: number): Promise<void> {
        return fetcher(`/web/messages/${id}`, { method: "DELETE" });
    },
};
// --- END NEW API OBJECT ---

// --- NEW: Drip Sequence API Object ---
export const dripSequenceApi = {
    getDripSequences(): Promise<ApiDripSequenceList[]> {
        return fetcher("/web/drip-sequences");
    },
    getDripSequenceById(id: number): Promise<ApiDripSequence> {
        return fetcher(`/web/drip-sequences/${id}`);
    },
    createDripSequence(data: ApiDripSequenceCreatePayload): Promise<ApiDripSequence> {
        return fetcher("/web/drip-sequences", { method: "POST", body: JSON.stringify(data) });
    },
    updateDripSequence(id: number, data: ApiDripSequenceCreatePayload): Promise<ApiDripSequence> {
        return fetcher(`/web/drip-sequences/${id}`, { method: "PUT", body: JSON.stringify(data) });
    },
    deleteDripSequence(id: number): Promise<void> {
        return fetcher(`/web/drip-sequences/${id}`, { method: "DELETE" });
    },
};
// --- END NEW API OBJECT ---



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

      return data.map((meeting: any) => ({
        id: meeting.id,
        lead_id: meeting.lead_id,
        assigned_to: meeting.assigned_to,
        event_type: meeting.event_type || "Meeting",
        event_time: meeting.event_time,
        event_end_time: meeting.event_end_time,
        created_by: meeting.created_by,
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

      return data.map((demo: any) => ({
        id: demo.id,
        lead_id: demo.lead_id,
        scheduled_by: demo.scheduled_by,
        assigned_to: demo.assigned_to,
        start_time: demo.start_time,
        event_end_time: demo.event_end_time,
        phase: demo.phase || "Scheduled",
        remark: demo.remark,
        created_at: demo.created_at,
        updated_at: demo.updated_at,
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
  updateUser: userApi.updateUser,
  deleteUser: userApi.deleteUser,

  // Lead management methods
  getLeads: leadApi.getAllLeads,
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
  getMessages: messageMasterApi.getMessages,
  createMessage: messageMasterApi.createMessage,
  updateMessage: messageMasterApi.updateMessage,
  deleteMessage: messageMasterApi.deleteMessage,
  
  getDripSequences: dripSequenceApi.getDripSequences,
  getDripSequenceById: dripSequenceApi.getDripSequenceById,
  createDripSequence: dripSequenceApi.createDripSequence,
  updateDripSequence: dripSequenceApi.updateDripSequence,
  deleteDripSequence: dripSequenceApi.deleteDripSequence,
  getPendingDiscussions: (): Promise<ApiReminder[]> => fetcher("/web/discussions/pending"),
}


