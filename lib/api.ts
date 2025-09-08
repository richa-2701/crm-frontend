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
  email?: string
  address?: string
  address_2?: string
  city?: string
  state?: string
  pincode?: string
  country?: string
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

export interface ApiUnifiedActivity {
    id: number;
    type: 'log' | 'reminder';
    lead_id: number;
    company_name: string;
    activity_type: string;
    details: string;
    status: string;
    created_at: string;
    scheduled_for?: string;
}


export interface ApiActivityLogCreatePayload {
    lead_id: number;
    details: string;
    phase: string; // e.g., "Completed", "Discussion Done"
}

interface Contact {
  id: number
  lead_id: number
  contact_name: string
  phone: string
  email: string | null
  designation: string | null
}

export interface ApiEventReschedulePayload {
    start_time: string; // ISO format string
    end_time: string; // ISO format string
    updated_by: string;
}

export interface ApiEventReassignPayload {
    assigned_to_user_id: number;
    updated_by: string;
}

export interface ApiEventCancelPayload {
    reason: string;
    updated_by: string;
}

export interface ApiEventNotesUpdatePayload {
    notes: string;
    updated_by: string;
}

export interface ApiActivityUpdatePayload {
    details: string;
    activity_type?: string;
}


export interface ApiActivity {
  id: number
  lead_id: number
  details: string
  phase: string
  created_at: string
  attachment_path?: string
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

export interface ApiBulkUploadResponse {
  status: string
  successful_imports: number
  errors: string[]
}

export interface ApiScheduleActivityPayload {
    lead_id: number;
    details: string;
    activity_type: string;
    created_by_user_id: number;
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
    email?: string
    address?: string
    address_2?: string
    city?: string
    state?: string
    pincode?: string
    country?: string
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
    contacts?: {
        contact_name: string;
        phone: string;
        email?: string;
        designation?: string;
    }[];
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

  async exportLeads(leadIds: number[]): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/web/leads/export-excel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify(leadIds), // Send the array of lead IDs
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to export leads.");
    }
    
    // The response is the file itself, so we return it as a binary "Blob"
    return response.blob();
  },


  async getActivities(leadId: number): Promise<ApiActivity[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/activities/${leadId}`, {
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
      });

      // If the response is NOT ok, we check if it's a 404
      if (!response.ok) {
        // A 404 is an expected outcome (no activities), so we return an empty array.
        if (response.status === 404) {
          console.log(`[v0] No activities found for lead ${leadId}, returning empty array.`);
          return []; 
        }
        // For all other errors (like 500), we still throw an error.
        const errorText = await response.text();
        console.error("[v0] API Error Response:", errorText);
        throw new Error(`Failed to fetch activities: ${response.status} ${response.statusText}`);
      }

      // If the response was ok (200), we return the JSON data.
      return response.json();

    } catch (error) {
      console.error("[v0] Error fetching activities:", error);
      throw error;
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
      company_name: string;
      email: string;
      address: string;
      address_2: string;
      city: string;
      state: string;
      pincode: string;
      country: string;
      team_size: string | number;
      source: string;
      segment: string;
      remark: string;
      product: string;
      phone_2: string;
      turnover: string;
      current_system: string;
      machine_specification: string;
      challenges: string;
      lead_type: string;
      assigned_to: string;
      status: string;
      contacts: Array<{
        id?: number;
        contact_name: string;
        phone: string;
        email?: string;
        designation?: string;
      }>;
      // New activity fields
      activity_type: string;
      activity_details: string;
    }>,
  ): Promise<ApiLead> {
    try {
      console.log("[v0] Attempting to update lead:", leadId, "with data:", leadData)
      const response = await fetch(`${API_BASE_URL}/web/leads/${leadId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify(leadData),
      })
      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] API Error Response:", errorText)
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
   async addActivityWithAttachment(
    leadId: number,
    details: string,
    file?: File,
  ): Promise<ApiActivity> {
    const formData = new FormData()
    formData.append("details", details)
    if (file) {
      formData.append("file", file)
    }

    const response = await fetch(`${API_BASE_URL}/web/leads/${leadId}/activity`, {
      method: "POST",
      headers: { "ngrok-skip-browser-warning": "true" },
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to add activity: ${response.status} - ${errorText}`)
    }
    return response.json()
  },

  
  async uploadBulkLeads(file: File): Promise<ApiBulkUploadResponse> {
    const formData = new FormData()
    formData.append("file", file)

    const response = await fetch(`${API_BASE_URL}/web/leads/upload-bulk`, {
      method: "POST",
      headers: { "ngrok-skip-browser-warning": "true" },
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || "Failed to upload file.")
    }
    return response.json()
  },

  async assignDripToLead(leadId: number, dripSequenceId: number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/web/leads/assign-drip`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lead_id: leadId,
        drip_sequence_id: dripSequenceId,
      }),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to assign drip sequence.");
    }
    return response.json();
  },

// ...
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

export const activityApi = {
    async markActivityDone(reminderId: number, notes: string, updatedBy: string): Promise<{ status: string; message: string }> {
        // This URL matches the new endpoint we just created
        return fetcher(`/web/activities/scheduled/${reminderId}/complete`, {
            method: "POST",
            body: JSON.stringify({
                notes: notes,
                updated_by: updatedBy,
            }),
        });
    },
};

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
    return fetcher("/web/meetings");
  },

  // --- THIS IS THE CORRECTED FUNCTION ---
  async getAllMeetings(): Promise<ApiMeeting[]> {
    try {
      console.log("[v0] Fetching ALL meetings from API...");
      const data: any[] = await fetcher("/web/meetings/all");
      console.log("[v0] All meetings fetched successfully:", data.length);
      // The placeholder is replaced with the ACTUAL mapping logic.
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
        phase: meeting.phase,
      }));
    } catch (error) {
      console.error("[v0] Error fetching all meetings:", error);
      return [];
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

  async getAllDemos(): Promise<ApiDemo[]> {
    try {
      console.log("[v0] Fetching ALL demos from API...");
      const data: any[] = await fetcher("/web/demos/all");
      console.log("[v0] All demos fetched successfully:", data.length);
      // The placeholder is replaced with the ACTUAL mapping logic.
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
      }));
    } catch (error) {
      console.error("[v0] Error fetching all demos:", error);
      return [];
    }
  },
};


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
  getAllDemos: (): Promise<ApiDemo[]> => fetcher("/web/demos/all"),
  // Lead management methods
  getLeads: leadApi.getAllLeads,
  getAllLeads: leadApi.getAllLeads,
  getLeadsByUser: leadApi.getLeadsByUser,
  getLeadById: leadApi.getLeadById,
  createLead: leadApi.createLead,
  updateLead: leadApi.updateLead,
  getActivities: leadApi.getActivities,
  exportLeads: leadApi.exportLeads,
  addActivityWithAttachment: leadApi.addActivityWithAttachment,
  uploadBulkLeads: leadApi.uploadBulkLeads,
  getHistory: leadApi.getHistory,

  // Chat methods
  sendMessage: chatApi.sendMessage,

  // Task methods
  getUserTasks: taskApi.getUserTasks,
  markActivityDone: activityApi.markActivityDone,

  logActivity: async (payload: ApiActivityLogCreatePayload): Promise<ApiActivityLogOut> => {
        return fetcher("/web/activities/log", {
            method: "POST",
            body: JSON.stringify(payload),
        });
    },

  scheduleActivity: async (payload: ApiScheduleActivityPayload): Promise<ApiReminder> => {
        return fetcher("/web/activities/schedule", {
            method: "POST",
            body: JSON.stringify(payload),
        });
    },

  rescheduleEvent: async (
    type: 'meeting' | 'demo', 
    id: number, 
    payload: ApiEventReschedulePayload
  ): Promise<ApiMeeting | ApiDemo> => {
    const endpoint = type === 'meeting' ? `/web/meetings/${id}/reschedule` : `/web/demos/${id}/reschedule`;
    return fetcher(endpoint, { method: "PUT", body: JSON.stringify(payload) });
  },

  reassignEvent: async (
    type: 'meeting' | 'demo', 
    id: number, 
    payload: ApiEventReassignPayload
  ): Promise<ApiMeeting | ApiDemo> => {
    const endpoint = type === 'meeting' ? `/web/meetings/${id}/reassign` : `/web/demos/${id}/reassign`;
    return fetcher(endpoint, { method: "PUT", body: JSON.stringify(payload) });
  },

  cancelEvent: async (
    type: 'meeting' | 'demo', 
    id: number, 
    payload: ApiEventCancelPayload
  ): Promise<ApiMeeting | ApiDemo> => {
    const endpoint = type === 'meeting' ? `/web/meetings/${id}/cancel` : `/web/demos/${id}/cancel`;
    return fetcher(endpoint, { method: "POST", body: JSON.stringify(payload) });
  },

  updateEventNotes: async (
    type: 'meeting' | 'demo', 
    id: number, 
    payload: ApiEventNotesUpdatePayload
  ): Promise<ApiMeeting | ApiDemo> => {
    const endpoint = type === 'meeting' ? `/web/meetings/${id}/notes` : `/web/demos/${id}/notes`;
    return fetcher(endpoint, { method: "PUT", body: JSON.stringify(payload) });
  },

  // --- NEW: Methods for managing activities ---
  updateActivity: async (
      activityId: number, 
      payload: ApiActivityUpdatePayload
  ): Promise<ApiUnifiedActivity> => {
      return fetcher(`/web/activities/log/${activityId}`, { method: 'PUT', body: JSON.stringify(payload) });
  },

  deleteLoggedActivity: async (activityId: number): Promise<void> => {
      return fetcher(`/web/activities/log/${activityId}`, { method: 'DELETE' });
  },

  cancelScheduledActivity: async (reminderId: number): Promise<void> => {
      return fetcher(`/web/activities/scheduled/${reminderId}`, { method: 'DELETE' });
  },
  
  // Meetings and demos methods
  getScheduledMeetings: meetingsApi.getScheduledMeetings,
  getAllMeetings: meetingsApi.getAllMeetings,
  getScheduledDemos: meetingsApi.getScheduledDemos,
  getMessages: messageMasterApi.getMessages,
  createMessage: messageMasterApi.createMessage,
  updateMessage: messageMasterApi.updateMessage,
  deleteMessage: messageMasterApi.deleteMessage,
  getAllActivities: (username: string): Promise<ApiUnifiedActivity[]> => fetcher(`/web/activities/all/${username}`),
  getDripSequences: dripSequenceApi.getDripSequences,
  getDripSequenceById: dripSequenceApi.getDripSequenceById,
  createDripSequence: dripSequenceApi.createDripSequence,
  updateDripSequence: dripSequenceApi.updateDripSequence,
  deleteDripSequence: dripSequenceApi.deleteDripSequence,
  getPendingActivities: (): Promise<ApiReminder[]> => fetcher("/web/activities/pending"),
  assignDripToLead: leadApi.assignDripToLead,
}


