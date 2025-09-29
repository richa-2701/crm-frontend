// frontend/lib/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://4adc3d24dcb8.ngrok-free.app";


export interface ApiMasterData {
  id: number;
  category: string;
  value: string;
  is_active: boolean;
}

export interface ApiUser {
  id: number;
  username: string;
  company_name: string;
  usernumber: string;
  email?: string;
  department?: string;
  created_at?: string;
  role?: string;
}

export interface Contact {
  id?: number;
  lead_id?: number;
  contact_name: string;
  phone: string;
  email: string | null;
  designation: string | null;
  linkedIn?: string | null;
  pan?: string | null;
}

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
  id: number;
  company_name: string;
  email?: string;
  website?: string;
  linkedIn?: string;
  address?: string;
  address_2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  source: string;
  segment?: string;
  team_size?: string;
  remark?: string;
  status: string;
  assigned_to: string;
  created_by: string;
  created_at: string;
  updated_at?: string;
  phone_2?: string;
  turnover?: string;
  current_system?: string;
  machine_specification?: string;
  challenges?: string;
  lead_type?: string;
  opportunity_business?: string;
  target_closing_date?: string;
  contacts?: Contact[];
}

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
  database_type?: string | null;
  amc?: string | null;
  gst?: string | null;
  converted_date: string;
  created_at: string;
  updated_at?: string | null;
  contacts?: ClientContact[];
}

export interface ApiReportKpiSummary {
  new_leads_assigned: number;
  meetings_completed: number;
  demos_completed: number;
  activities_logged: number;
  deals_won: number;
  conversion_rate: number;
}

export interface ApiReportData {
  kpi_summary: ApiReportKpiSummary;
  visualizations: {
    activity_volume: { name: string; value: number }[];
    lead_outcome: { name: string; value: number }[];
  };
  tables: {
    deals_won: {
      client_name: string;
      converted_date: string;
      source: string;
      time_to_close: number;
    }[];
  };
}

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
  converted_date?: string;
  contacts?: ClientContact[];
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
    phase: string;
}

export interface ApiEventReschedulePayload {
    start_time: string;
    end_time: string;
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
  id: number;
  lead_id: number;
  details: string;
  phase: string;
  created_at: string;
  attachment_path?: string;
}

export interface ApiMeeting {
  id: number;
  lead_id: number;
  assigned_to: string;
  event_type: string;
  meeting_type?: string;
  event_time: string;
  event_end_time: string;
  created_by: string;
  remark?: string;
  created_at: string;
}

export interface ApiDemo {
  id: number;
  lead_id: number;
  scheduled_by: string;
  assigned_to: string;
  start_time: string;
  event_end_time: string;
  phase: string;
  remark?: string;
  created_at: string;
  updated_at: string;
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

export interface ApiMessageMasterUpdatePayload {
  message_name: string;
  message_content?: string | null;
  message_type: 'text' | 'media' | 'document';
  existing_attachment_path?: string | null;
}

export interface ApiDripSequenceStep {
  id: number;
  message_id: number;
  day_to_send: number;
  time_to_send: string;
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
    time_to_send: string;
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
    is_hidden_from_activity_log: boolean;
}

export interface ApiBulkUploadResponse {
  status: string;
  successful_imports: number;
  errors: string[];
}

export interface ApiScheduleActivityPayload {
    lead_id: number;
    details: string;
    activity_type: string;
    created_by_user_id: number;
}

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
  converted_date?: string;
  contacts?: ClientContact[];
}


async function fetcher<T>(url: string, options: RequestInit = {}): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not defined in your .env.local file.");
  }

  const defaultHeaders: Record<string, string> = {
    "ngrok-skip-browser-warning": "true",
  };

  if (options.body && !(options.body instanceof FormData)) {
    defaultHeaders["Content-Type"] = "application/json";
  }

  if (typeof window !== "undefined") {
    const userString = localStorage.getItem("user");
    if (userString) {
      try {
        const user: ApiUser = JSON.parse(userString);
        if (user && user.company_name) {
          defaultHeaders["X-Company-Name"] = user.company_name;
        }
      } catch (e) {
        console.error("Failed to parse user from localStorage", e);
      }
    }
  }

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
    console.error(`Fetch failed for URL: ${url}`, error);
    throw error;
  }
}

const unifiedApi = {
  // --- Auth ---
  login: (username: string, password: string, company_name: string): Promise<ApiUser> => {
    return fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
      body: JSON.stringify({ username, password, company_name }),
    }).then(async (res) => {
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Login failed");
      }
      return res.json();
    });
  },
  register: (userData: Omit<ApiUser, 'id' | 'created_at' | 'updated_at'> & { password?: string }): Promise<ApiUser> => {
    return fetch(`${API_BASE_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
      body: JSON.stringify(userData),
    }).then(async (res) => {
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Registration failed");
      }
      return res.json();
    });
  },
  changePassword: (data: { username: string, old_password: string, new_password: string }) => {
    return fetcher(`/change-password`, { method: 'POST', body: JSON.stringify(data) });
  },

  // --- Users ---
  getUsers: (): Promise<ApiUser[]> => fetcher('/users'),
  updateUser: (userId: number, userData: Partial<ApiUser>): Promise<ApiUser> => {
    return fetcher(`/web/users/${userId}`, { method: 'PUT', body: JSON.stringify(userData) });
  },
  deleteUser: (userId: number): Promise<void> => fetcher(`/web/users/${userId}`, { method: 'DELETE' }),

  // --- Leads ---
  getAllLeads: (): Promise<ApiLead[]> => fetcher('/web/leads'),
  getLeadsByUser: (userId: string): Promise<ApiLead[]> => fetcher(`/leads/${userId}`),
  getLeadById: (leadId: number): Promise<ApiLead> => fetcher(`/web/leads/${leadId}`),
  createLead: (leadData: Partial<ApiLead>): Promise<ApiLead> => {
    return fetcher('/web/leads', { method: 'POST', body: JSON.stringify(leadData) });
  },
  updateLead: (leadId: number, leadData: Partial<ApiLead> & { activity_type?: string; activity_details?: string; }): Promise<ApiLead> => {
    return fetcher(`/web/leads/${leadId}`, { method: 'PUT', body: JSON.stringify(leadData) });
  },
  convertToClient: (leadId: number, payload: ConvertLeadToClientPayload): Promise<ApiClient> => {
    return fetcher(`/web/leads/${leadId}/convert-to-client`, { method: "POST", body: JSON.stringify(payload) });
  },
  getUserPerformanceReport: (userId: number, startDate: string, endDate: string): Promise<ApiReportData> => {
    return fetcher('/web/reports/user-performance', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        start_date: startDate,
        end_date: endDate
      }),
    });
  },
  exportLeads: async (leadIds: number[]): Promise<Blob> => {
    const userString = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    const companyName = userString ? JSON.parse(userString).company_name : '';
    const response = await fetch(`${API_BASE_URL}/web/leads/export-excel`, {
      method: "POST",
      headers: { 
        'Content-Type': 'application/json', 
        'X-Company-Name': companyName, 
        "ngrok-skip-browser-warning": "true" 
      },
      body: JSON.stringify(leadIds),
    });
    if (!response.ok) throw new Error("Failed to export leads.");
    return response.blob();
  },
  uploadBulkLeads: (file: File): Promise<ApiBulkUploadResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    return fetcher('/web/leads/upload-bulk', { method: 'POST', body: formData });
  },
  assignDripToLead: (leadId: number, dripSequenceId: number): Promise<any> => {
    return fetcher('/web/leads/assign-drip', { method: 'POST', body: JSON.stringify({ lead_id: leadId, drip_sequence_id: dripSequenceId }) });
  },

  getAllClients: (): Promise<ApiClient[]> => fetcher("/web/clients"),
  getClientById: (clientId: number): Promise<ApiClient> => fetcher(`/web/clients/${clientId}`),
  updateClient: (clientId: number, clientData: ApiClientUpdatePayload): Promise<ApiClient> => {
    return fetcher(`/web/clients/${clientId}`, { method: "PUT", body: JSON.stringify(clientData) });
  },
  
  getActivities: (leadId: number): Promise<ApiActivity[]> => fetcher(`/activities/${leadId}`),
  getHistory: (leadId: number): Promise<any> => fetcher(`/history/${leadId}`),
  addActivityWithAttachment: (leadId: number, details: string, file?: File): Promise<ApiActivity> => {
    const formData = new FormData();
    formData.append("details", details);
    if (file) formData.append("file", file);
    return fetcher(`/web/leads/${leadId}/activity`, { method: "POST", body: formData });
  },
  getAllActivities: (username: string): Promise<ApiUnifiedActivity[]> => fetcher(`/web/activities/all/${username}`),
  getPendingActivities: (): Promise<ApiReminder[]> => fetcher("/web/activities/pending"),
  logActivity: (payload: ApiActivityLogCreatePayload): Promise<ApiActivity> => fetcher("/web/activities/log", { method: "POST", body: JSON.stringify(payload) }),
  scheduleActivity: (payload: ApiScheduleActivityPayload): Promise<ApiReminder> => fetcher("/web/activities/schedule", { method: "POST", body: JSON.stringify(payload) }),
  markActivityDone: (reminderId: number, notes: string, updatedBy: string): Promise<{ status: string; message: string }> => {
    return fetcher(`/web/activities/scheduled/${reminderId}/complete`, { method: "POST", body: JSON.stringify({ notes, updated_by: updatedBy }) });
  },
  updateActivity: (activityId: number, payload: ApiActivityUpdatePayload): Promise<ApiActivity> => fetcher(`/web/activities/log/${activityId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteLoggedActivity: (activityId: number): Promise<void> => fetcher(`/web/activities/log/${activityId}`, { method: 'DELETE' }),
  cancelScheduledActivity: (reminderId: number): Promise<void> => fetcher(`/web/activities/scheduled/${reminderId}`, { method: 'DELETE' }),

  scheduleMeeting: (payload: any): Promise<ApiMeeting> => fetcher('/web/meetings/schedule', { method: 'POST', body: JSON.stringify(payload) }),
  scheduleDemo: (payload: any): Promise<ApiDemo> => fetcher('/web/demos/schedule', { method: 'POST', body: JSON.stringify(payload) }),
  getScheduledMeetings: (): Promise<ApiMeeting[]> => fetcher("/web/meetings"),
  getAllMeetings: (): Promise<ApiMeeting[]> => fetcher("/web/meetings/all"),
  getScheduledDemos: (): Promise<ApiDemo[]> => fetcher("/web/demos"),
  getAllDemos: (): Promise<ApiDemo[]> => fetcher("/web/demos/all"),
  getAllCalendarEvents: (): Promise<any[]> => fetcher("/web/calendar/events/all"),
  rescheduleEvent: (type: 'meeting' | 'demo', id: number, payload: ApiEventReschedulePayload): Promise<ApiMeeting | ApiDemo> => fetcher(`/web/${type}s/${id}/reschedule`, { method: "PUT", body: JSON.stringify(payload) }),
  reassignEvent: (type: 'meeting' | 'demo', id: number, payload: ApiEventReassignPayload): Promise<ApiMeeting | ApiDemo> => fetcher(`/web/${type}s/${id}/reassign`, { method: "PUT", body: JSON.stringify(payload) }),
  cancelEvent: (type: 'meeting' | 'demo', id: number, payload: ApiEventCancelPayload): Promise<ApiMeeting | ApiDemo> => fetcher(`/web/${type}s/${id}/cancel`, { method: "POST", body: JSON.stringify(payload) }),
  updateEventNotes: (type: 'meeting' | 'demo', id: number, payload: ApiEventNotesUpdatePayload): Promise<ApiMeeting | ApiDemo> => fetcher(`/web/${type}s/${id}/notes`, { method: "PUT", body: JSON.stringify(payload) }),
  completeMeeting: (payload: { meeting_id: number, notes: string, updated_by: string }): Promise<{ status: string; message: string }> => {
    return fetcher('/web/meetings/complete', { method: 'POST', body: JSON.stringify(payload) });
  },
  completeDemo: (payload: { demo_id: number, notes: string, updated_by: string }): Promise<{ status: string; message: string }> => {
    return fetcher('/web/demos/complete', { method: 'POST', body: JSON.stringify(payload) });
  },

  getMasterData: (category: string): Promise<ApiMasterData[]> => fetcher(`/web/master-data/${category}`),
  getByCategory: (category: string): Promise<ApiMasterData[]> => fetcher(`/web/master-data/${category}`),
  createMasterData: (item: { category: string; value: string }): Promise<ApiMasterData> => fetcher("/web/master-data", { method: "POST", body: JSON.stringify(item) }),
  create: (item: { category: string; value: string }): Promise<ApiMasterData> => fetcher("/web/master-data", { method: "POST", body: JSON.stringify(item) }),
  deleteMasterData: (itemId: number): Promise<void> => fetcher(`/web/master-data/${itemId}`, { method: "DELETE" }),
  
  getMessages: (): Promise<ApiMessageMaster[]> => fetcher("/web/messages"),
  createMessage: (data: ApiMessageMasterCreatePayload, file?: File | null): Promise<ApiMessageMaster> => {
      const formData = new FormData();
      formData.append('message_name', data.message_name);
      formData.append('message_content', data.message_content || '');
      formData.append('message_type', data.message_type);
      formData.append('created_by', data.created_by);
      if (file) formData.append('file', file);
      return fetcher('/web/messages', { method: 'POST', body: formData });
  },
  updateMessage: (id: number, data: ApiMessageMasterUpdatePayload, file?: File | null): Promise<ApiMessageMaster> => {
      const formData = new FormData();
      formData.append('message_name', data.message_name);
      formData.append('message_content', data.message_content || '');
      formData.append('message_type', data.message_type);
      if (data.existing_attachment_path) formData.append('existing_attachment_path', data.existing_attachment_path);
      if (file) formData.append('file', file);
      return fetcher(`/web/messages/${id}`, { method: 'PUT', body: formData });
  },
  deleteMessage: (id: number): Promise<void> => fetcher(`/web/messages/${id}`, { method: 'DELETE' }),

  getDripSequences: (): Promise<ApiDripSequenceList[]> => fetcher("/web/drip-sequences"),
  getDripSequenceById: (id: number): Promise<ApiDripSequence> => fetcher(`/web/drip-sequences/${id}`),
  createDripSequence: (data: ApiDripSequenceCreatePayload): Promise<ApiDripSequence> => fetcher("/web/drip-sequences", { method: "POST", body: JSON.stringify(data) }),
  updateDripSequence: (id: number, data: ApiDripSequenceCreatePayload): Promise<ApiDripSequence> => fetcher(`/web/drip-sequences/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteDripSequence: (id: number): Promise<void> => fetcher(`/web/drip-sequences/${id}`, { method: 'DELETE' }),
  
  sendMessage: (message: string, userPhone: string): Promise<{ status: string; reply: string }> => {
      return fetcher('/app', { method: 'POST', body: JSON.stringify({ user_phone: userPhone, message }) });
  },
  getUserTasks: (username: string): Promise<any> => fetcher(`/tasks/${username}`),
};

export const api = unifiedApi;

export const masterDataApi = {
    getByCategory: unifiedApi.getByCategory,
    create: unifiedApi.create,
    delete: unifiedApi.deleteMasterData,
};

export const authApi = {
  login: unifiedApi.login,
  register: unifiedApi.register,
  changePassword: unifiedApi.changePassword,
};

export const userApi = {
  getUsers: unifiedApi.getUsers,
  updateUser: unifiedApi.updateUser,
  deleteUser: unifiedApi.deleteUser,
};

export const leadApi = {
  getAllLeads: unifiedApi.getAllLeads,
  getLeadsByUser: unifiedApi.getLeadsByUser,
  getLeadById: unifiedApi.getLeadById,
  createLead: unifiedApi.createLead,
  updateLead: unifiedApi.updateLead,
  exportLeads: unifiedApi.exportLeads,
  getActivities: unifiedApi.getActivities,
  getHistory: unifiedApi.getHistory,
  addActivityWithAttachment: unifiedApi.addActivityWithAttachment,
  uploadBulkLeads: unifiedApi.uploadBulkLeads,
  assignDripToLead: unifiedApi.assignDripToLead,
  convertToClient: unifiedApi.convertToClient,
};

export const clientApi = {
  getAllClients: unifiedApi.getAllClients,
  getClientById: unifiedApi.getClientById,
  updateClient: unifiedApi.updateClient,
};

export const messageMasterApi = {
  getMessages: unifiedApi.getMessages,
  createMessage: unifiedApi.createMessage,
  updateMessage: unifiedApi.updateMessage,
  deleteMessage: unifiedApi.deleteMessage,
};

export const activityApi = {
  getActivities: unifiedApi.getActivities,
  getAllActivities: unifiedApi.getAllActivities,
  getPendingActivities: unifiedApi.getPendingActivities,
  logActivity: unifiedApi.logActivity,
  scheduleActivity: unifiedApi.scheduleActivity,
  markActivityDone: unifiedApi.markActivityDone,
  updateActivity: unifiedApi.updateActivity,
  deleteLoggedActivity: unifiedApi.deleteLoggedActivity,
  cancelScheduledActivity: unifiedApi.cancelScheduledActivity,
  addActivityWithAttachment: unifiedApi.addActivityWithAttachment,
};

export const dripSequenceApi = {
  getDripSequences: unifiedApi.getDripSequences,
  getDripSequenceById: unifiedApi.getDripSequenceById,
  createDripSequence: unifiedApi.createDripSequence,
  updateDripSequence: unifiedApi.updateDripSequence,
  deleteDripSequence: unifiedApi.deleteDripSequence,
};

export const chatApi = {
  sendMessage: unifiedApi.sendMessage,
};

export const taskApi = {
  getUserTasks: unifiedApi.getUserTasks,
};

export const meetingsApi = {
  scheduleMeeting: unifiedApi.scheduleMeeting,
  scheduleDemo: unifiedApi.scheduleDemo,
  getScheduledMeetings: unifiedApi.getScheduledMeetings,
  getAllMeetings: unifiedApi.getAllMeetings,
  getScheduledDemos: unifiedApi.getScheduledDemos,
  getAllDemos: unifiedApi.getAllDemos,
  completeMeeting: unifiedApi.completeMeeting,
};

export const demosApi = {
    completeDemo: unifiedApi.completeDemo,
};

export const reportApi = {
    getUserPerformanceReport: unifiedApi.getUserPerformanceReport,
};