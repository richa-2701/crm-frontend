// frontend/lib/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://4adc3d24dcb8.ngrok-free.app"

export interface ApiMasterData {
  id: number;
  category: string;
  value: string;
  is_active: boolean;
}

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

// Updated Contact Interface
export interface Contact {
  id?: number // Optional for creation, present for existing
  lead_id?: number // Optional for creation, present for existing
  contact_name: string
  phone: string
  email: string | null
  designation: string | null
  linkedIn?: string | null // New field
  pan?: string | null // New field
}

// Updated ClientContact Interface (for Client-specific contacts)
export interface ClientContact {
  id?: number;
  client_id?: number;
  contact_name?: string | null;
  phone?: string | null;
  email?: string | null;
  designation?: string | null;
  linkedIn?: string | null;
  pan?: string | null;
}

export interface ApiLead {
  id: number
  company_name: string
  email?: string
  website?: string // New field
  linkedIn?: string // New field
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
  opportunity_business?: string;
  target_closing_date?: string; // Will be a string in YYYY-MM-DD format
  contacts?: Contact[]
}

// New Client Interface
export interface ApiClient {
  id: number;
  company_name: string;
  website?: string | null;
  linkedIn?: string | null;
  company_email?: string | null;
  company_phone_2?: string | null;
  address?: string | null;
  address_2?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  country?: string | null;
  segment?: string | null;
  verticles?: string | null;
  team_size?: string | null;
  turnover?: string | null;
  current_system?: string | null;
  machine_specification?: string | null;
  challenges?: string | null;
  version?: string | null;
  database_type?: string | null; // Renamed from 'Database'
  amc?: string | null;
  gst?: string | null;
  converted_date: string; // ISO date string
  created_at: string;
  updated_at?: string | null;
  contacts?: ClientContact[];
}

// NEW: Client Update Payload
export interface ApiClientUpdatePayload {
  company_name?: string;
  website?: string | null;
  linkedIn?: string | null;
  company_email?: string | null;
  company_phone_2?: string | null;
  address?: string | null;
  address_2?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  country?: string | null;
  segment?: string | null;
  verticles?: string | null;
  team_size?: string | number | null;
  turnover?: string | null;
  current_system?: string | null;
  machine_specification?: string | null;
  challenges?: string | null;
  version?: string | null;
  database_type?: string | null;
  amc?: string | null;
  gst?: string | null;
  converted_date?: string; // ISO date string
  contacts?: ClientContact[]; // Using ClientContact for updates as well
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
  meeting_type?: string;
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
    is_hidden_from_activity_log: boolean; // <--- NEW FIELD
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

// New Conversion Payload
export interface ConvertLeadToClientPayload {
  company_name?: string;
  website?: string | null;
  linkedIn?: string | null;
  company_email?: string | null;
  company_phone_2?: string | null;
  address?: string | null;
  address_2?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  country?: string | null;
  segment?: string | null;
  verticles?: string | null;
  team_size?: string | number | null;
  turnover?: string | null;
  current_system?: string | null;
  machine_specification?: string | null;
  challenges?: string | null;
  version?: string | null;
  database_type?: string | null;
  amc?: string | null;
  gst?: string | null;
  converted_date?: string; // ISO date string
  contacts?: ClientContact[];
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


export const masterDataApi = {
    async getByCategory(category: string): Promise<ApiMasterData[]> {
        return fetcher(`/web/master-data/${category}`);
    },
    async create(item: { category: string; value: string }): Promise<ApiMasterData> {
        return fetcher("/web/master-data", {
            method: "POST",
            body: JSON.stringify(item),
        });
    },
    async delete(itemId: number): Promise<void> {
        return fetcher(`/web/master-data/${itemId}`, { method: "DELETE" });
    },
};


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
          "ngrok-skip-browser-warning": "true",
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

  async createLead(leadData: Partial<ApiLead>): Promise<ApiLead> {
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
      body: JSON.stringify(leadIds),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to export leads.");
    }

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

      if (!response.ok) {
        if (response.status === 404) {
          console.log(`[v0] No activities found for lead ${leadId}, returning empty array.`);
          return [];
        }
        const errorText = await response.text();
        console.error("[v0] API Error Response:", errorText);
        throw new Error(`Failed to fetch activities: ${response.status} ${response.statusText}`);
      }

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
    leadData: Partial<ApiLead> & {
      activity_type?: string;
      activity_details?: string;
    },
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

  // New conversion API call
  async convertToClient(leadId: number, payload: ConvertLeadToClientPayload): Promise<ApiClient> {
    return fetcher(`/web/leads/${leadId}/convert-to-client`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
}


// New Client APIs
export const clientApi = {
  async getAllClients(): Promise<ApiClient[]> {
    return fetcher("/web/clients");
  },
  async getClientById(clientId: number): Promise<ApiClient> {
    return fetcher(`/web/clients/${clientId}`);
  },
  // NEW: Update Client API function
  async updateClient(clientId: number, clientData: ApiClientUpdatePayload): Promise<ApiClient> {
    return fetcher(`/web/clients/${clientId}`, {
      method: "PUT",
      body: JSON.stringify(clientData),
    });
  },
};


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

export const activityApi = {
    async markActivityDone(reminderId: number, notes: string, updatedBy: string): Promise<{ status: string; message: string }> {
        return fetcher(`/web/activities/scheduled/${reminderId}/complete`, {
            method: "POST",
            body: JSON.stringify({
                notes: notes,
                updated_by: updatedBy,
            }),
        });
    },
};

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

export const taskApi = {
  async getUserTasks(username: string) {
    const response = await fetch(`${API_BASE_URL}/tasks/${username}`)
    if (!response.ok) throw new Error("Failed to fetch tasks")
    return response.json()
  },
}

export const meetingsApi = {
  async getScheduledMeetings(): Promise<ApiMeeting[]> {
    return fetcher("/web/meetings");
  },

  async getAllMeetings(): Promise<ApiMeeting[]> {
    try {
      console.log("[v0] Fetching ALL meetings from API...");
      const data: any[] = await fetcher("/web/meetings/all");
      console.log("[v0] All meetings fetched successfully:", data.length);
      return data.map((meeting: any) => ({
        id: meeting.id,
        lead_id: meeting.lead_id,
        assigned_to: meeting.assigned_to,
        event_type: meeting.event_type || "Meeting",
        meeting_type: meeting.meeting_type,
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
      return [];
    }
  },

  async getAllDemos(): Promise<ApiDemo[]> {
    try {
      console.log("[v0] Fetching ALL demos from API...");
      const data: any[] = await fetcher("/web/demos/all");
      console.log("[v0] All demos fetched successfully:", data.length);
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
  ...authApi,
  ...userApi,
  ...leadApi,
  ...clientApi, // New client APIs
  ...chatApi,
  ...taskApi,
  ...meetingsApi,
  ...messageMasterApi,
  ...dripSequenceApi,
  ...activityApi,
  ...masterDataApi,
  getAllDemos: (): Promise<ApiDemo[]> => fetcher("/web/demos/all"),
  getAllCalendarEvents: (): Promise<any[]> => fetcher("/web/calendar/events/all"),
  getAllActivities: (username: string): Promise<ApiUnifiedActivity[]> => fetcher(`/web/activities/all/${username}`),
  getPendingActivities: (): Promise<ApiReminder[]> => fetcher("/web/activities/pending"),
  logActivity: async (payload: ApiActivityLogCreatePayload) => fetcher("/web/activities/log", { method: "POST", body: JSON.stringify(payload) }),
  scheduleActivity: async (payload: ApiScheduleActivityPayload) => fetcher("/web/activities/schedule", { method: "POST", body: JSON.stringify(payload) }),
  rescheduleEvent: async (type: 'meeting' | 'demo', id: number, payload: ApiEventReschedulePayload) => fetcher(type === 'meeting' ? `/web/meetings/${id}/reschedule` : `/web/demos/${id}/reschedule`, { method: "PUT", body: JSON.stringify(payload) }),
  reassignEvent: async (type: 'meeting' | 'demo', id: number, payload: ApiEventReassignPayload) => fetcher(type === 'meeting' ? `/web/meetings/${id}/reassign` : `/web/demos/${id}/reassign`, { method: "PUT", body: JSON.stringify(payload) }),
  cancelEvent: async (type: 'meeting' | 'demo', id: number, payload: ApiEventCancelPayload) => fetcher(type === 'meeting' ? `/web/meetings/${id}/cancel` : `/web/demos/${id}/cancel`, { method: "POST", body: JSON.stringify(payload) }),
  updateEventNotes: async (type: 'meeting' | 'demo', id: number, payload: ApiEventNotesUpdatePayload) => fetcher(type === 'meeting' ? `/web/meetings/${id}/notes` : `/web/demos/${id}/notes`, { method: "PUT", body: JSON.stringify(payload) }),
  updateActivity: async (activityId: number) => fetcher(`/web/activities/log/${activityId}`, { method: 'PUT', body: JSON.stringify({}) }), // Placeholder for now, no payload needed.
  deleteLoggedActivity: async (activityId: number) => fetcher(`/web/activities/log/${activityId}`, { method: 'DELETE' }),
  cancelScheduledActivity: async (reminderId: number) => fetcher(`/web/activities/scheduled/${reminderId}`, { method: 'DELETE' }),
};