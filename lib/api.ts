// ======================================================
// FILE: frontend/lib/api.ts
// PURPOSE: Unified API layer with Basic Auth + Error Handling
// ======================================================

import { AlertDialog } from "@radix-ui/react-alert-dialog";
import { Dialog } from "@radix-ui/react-dialog";
import { toast } from "sonner";

const CSHARP_API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:57214/api/indas";
const PYTHON_API_BASE_URL = process.env.NEXT_PUBLIC_PYTHON_API_URL?.replace(/\/$/, "");

// 🧠 Helper: Get saved company credentials
function getCompanyAuthHeader(): string | null {
  if (typeof window === "undefined") return null;
  const creds = localStorage.getItem("companyAuth");
  return creds ? `Basic ${creds}` : null;
}

function getCompanyAuthName(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("companyName");
}

// 🧠 Helper: Save company credentials
function saveCompanyCredentials(companyName: string, companyPassword: string) {
  const encoded = btoa(`${companyName}:${companyPassword}`);
  localStorage.setItem("companyAuth", encoded);
  localStorage.setItem("companyName", companyName);
  localStorage.setItem("companyPassword", companyPassword);
}

// 🧠 Helper: Convert snake_case object keys to PascalCase for C# backend
const toPascalCase = (str: string) => str.replace(/_([a-z])/g, g => g[1].toUpperCase()).replace(/^(.)/, (match) => match.toUpperCase());

const mapKeysToPascalCase = (obj: any): any => {
    if (Array.isArray(obj)) {
        return obj.map(v => mapKeysToPascalCase(v));
    } else if (obj !== null && typeof obj === 'object' && obj.constructor === Object) {
        return Object.keys(obj).reduce((result, key) => {
            const newKey = toPascalCase(key);
            result[newKey] = mapKeysToPascalCase(obj[key]);
            return result;
        }, {} as any);
    }
    return obj;
};

// 🧠 Helper: Convert PascalCase keys from C# to snake_case for frontend
const toSnakeCase = (str: string) => str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`).replace(/^_/, '');

const mapKeysToSnakeCase = (obj: any): any => {
    if (Array.isArray(obj)) {
        return obj.map(v => mapKeysToSnakeCase(v));
    } else if (obj !== null && typeof obj === 'object' && obj.constructor === Object) {
        return Object.keys(obj).reduce((result, key) => {
            const newKey = toSnakeCase(key);
            result[newKey] = mapKeysToSnakeCase(obj[key]);
            return result;
        }, {} as any);
    }
    return obj;
};

function parseMicrosoftDate(dateString: string | null | undefined): Date | null {
    if (!dateString) {
        return null;
    }
    const msDateMatch = dateString.match(/\/Date\((\d+)\)\//);
    if (msDateMatch && msDateMatch[1]) {
        const timestamp = parseInt(msDateMatch[1], 10);
        return new Date(timestamp);
    }
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
        return date;
    }
    return null;
}


// --------------------------------------------------------------
// INTERFACES
// --------------------------------------------------------------
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

export interface LeadAttachment {
  id: number;
  file_path: string;
  original_file_name: string;
  uploaded_by: string;
  uploaded_at: string;
}

export interface ApiActivityFilterPayload {
  lead_id: number;
  activity_type?: string;
  start_date?: string;
  end_date?: string;
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
  status: string | null;
  assigned_to: string | null;
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
  version?: string;
  database_type?: string;
  amc?: string;
  gst?: string;
  company_pan?: string;
  isActive: boolean;
  attachments: LeadAttachment[];
  verticles?: string | null;
}

export interface ProposalSentContact {
  id: number;
  proposal_id: number;
  contact_name: string;
  phone: string;
  email: string | null;
  designation: string | null;
  linkedIn: string | null;
  pan: string | null;
}

export interface ApiProposalSent
  extends Omit<ApiLead, "id" | "contacts" | "isActive" | "attachments"> {
  id: number;
  original_lead_id: number;
  converted_at: string;
  contacts: ProposalSentContact[];
  gst: string;
}

export interface ConvertToProposalPayload {
  company_name?: string;
  email?: string;
  gst: string;
  company_pan?: string;
  version?: string;
  database_type?: string;
  amc?: string;
  contacts: Omit<Contact, "id" | "lead_id">[];
  website?: string;
  linkedIn?: string;
  address?: string;
  address_2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  source?: string;
  segment?: string;
  team_size?: string;
  remark?: string;
  phone_2?: string;
  turnover?: string;
  current_system?: string;
  machine_specification?: string;
  challenges?: string;
  lead_type?: string;
  opportunity_business?: string;
  target_closing_date?: string;
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
  attachments?: LeadAttachment[];
}



export interface ApiReportKpiSummary {
  new_leads_assigned: number;
  meetings_completed: number;
  demos_completed: number;
  activities_logged: number;
  deals_won: number;
  tasks_created: number;
  tasks_completed: number;
  conversion_rate: number;
  total_meeting_duration: number;
  total_demo_duration: number;
  total_activity_duration: number;
  total_task_duration: number;
}


export interface ReportNewLeadDetail {
    id: number;
    company_name: string;
    source: string;
    status: string;
    created_at: string;
    contact_name: string | null;
    contact_phone: string | null;
}

export interface ReportMeetingDetail {
    id: number;
    company_name: string;
    meeting_type: string;
    event_time: string;
    remark: string;
    duration_minutes?: number;
}

export interface ReportDemoDetail {
    id: number;
    company_name: string;
    start_time: string;
    remark: string;
    duration_minutes?: number;
}

export interface ReportActivityDetail {
    id: number;
    company_name: string;
    activity_type: string;
    details: string;
    created_at: string;
    duration_minutes?: number;
}

export interface ReportTaskDetail {
    id: number;
    title: string;
    details: string;
    company_names: string | null;
    status: string;
    completed_at: string;
    duration_minutes?: number;
    created_at: string;
    due_date: string;
}

export interface ReportDealsWonDetail {
    client_id: number;
    company_name: string;
    source: string;
    converted_date: string;
    time_to_close: number;
}

export interface ApiLeadSearchResult {
  id: number;
  company_name: string;
}

interface ReportDetailItem {
  id: number;
  company_name: string;
}


export interface ApiReportData {
  kpi_summary: ApiReportKpiSummary;
  visualizations: {
    activity_volume: { name: string; value: number }[];
    lead_outcome: { name: string; value: number }[];
    time_allocation: { name: string; value: number }[];
  };
  tables: {
    deals_won: ReportDealsWonDetail[];
  };
  details: {
    new_leads_assigned: ReportNewLeadDetail[];
    meetings_completed: ReportMeetingDetail[];
    demos_completed: ReportDemoDetail[];
    activities_logged: ReportActivityDetail[];
    tasks_completed: ReportTaskDetail[];
  }
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
  type: "log" | "reminder";
  lead_id: number;
  company_name: string;
  activity_type: string;
  details: string;
  status: string;
  created_at: string;
  scheduled_for?: string;
}

export interface ApiActivityLogCreatePayload {
  LeadId: number;
  Details: string;
  Phase: string;
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
  company_name: string;
  details: string;
  phase: string;
  created_at: string;
  created_by: string;
  attachment_path?: string;
  duration_minutes?: number;
  activity_type: string;
}

export interface ApiMeeting {
  id: number;
  lead_id: number;
  proposal_id?: number;
  client_id?: number;
  assigned_to: string;
  event_type: string;
  meeting_type?: string;
  event_time: string;
  event_end_time: string;
  created_by: string;
  phase: string;
  remark?: string;
  created_at: string;
  attendees?: string[];
  duration_minutes?: number;
}

export interface ApiDemo {
  id: number;
  lead_id: number;
  proposal_id?: number;
  client_id?: number;
  scheduled_by: string;
  assigned_to: string;
  start_time: string;
  event_end_time: string;
  phase: string;
  remark?: string;
  created_at: string;
  updated_at: string;
  attendees?: string[];
  duration_minutes?: number;
}


export interface ApiMessageMaster {
  id: number;
  message_code: string;
  message_name: string;
  message_content: string | null;
  message_type: "text" | "media" | "document";
  attachment_path: string | null;
  created_at: string;
  created_by: string;
}

export interface ApiMessageMasterCreatePayload {
  message_name: string;
  message_content?: string;
  message_type: "text" | "media" | "document";
  created_by: string;
}

export interface ApiMessageMasterUpdatePayload {
  message_name: string;
  message_content?: string | null;
  message_type: "text" | "media" | "document";
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
  activity_type?: string;
}

export interface ApiBulkUploadResponse {
  status: string;
  successful_imports: number;
  errors: string[];
}

export interface ApiScheduleActivityPayload {
  lead_id?: number;
  proposal_id?: number;
  details: string;
  activity_type: string;
  created_by_user_id: number;
}

export interface ApiExcelSummaryRow {
  "User": string;
  "New Leads Assigned": number;
  "Meetings Scheduled": number;
  "Demos Scheduled": number;
  "Meetings Completed": number;
  "Demos Completed": number;
  "Activities Logged": number;
  "Deals Won": number;
  "Leads Lost": number;
  "Conversion Rate (%)": number;
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

// --- NEW: Task Interfaces ---
export interface ApiTask {
  id: number;
  title: string;
  details?: string;
  lead_ids?: string;
  company_names?: string;
  assigned_to_user_id: number;
  assigned_to_username: string;
  created_by_user_id: number;
  created_by_username: string;
  due_date: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  created_at: string;
  updated_at: string;
  completed_at?: string;
  started_at?: string;
  duration_minutes?: number;
  remark?: string;
}

export interface ApiTaskCreatePayload {
  title: string;
  details?: string;
  lead_ids?: number[]; 
  created_by_user_id: number;
  assigned_to_user_id: number;
  due_date: string; 
}

export interface ApiTaskCompletePayload {
  task_id: number;
  activity_ids?: number[];
  remark?: string;
}

// --------------------------------------------------------------
// FETCHERS
// --------------------------------------------------------------
async function fetcher<T>(
  url: string,
  options: RequestInit = {},
  target: 'csharp' | 'python' = 'csharp'
): Promise<T> {
  const baseUrl = target === 'csharp' ? CSHARP_API_BASE_URL : PYTHON_API_BASE_URL;
  if (!baseUrl) {
    throw new Error(`API base URL for '${target}' is not configured.`);
  }

  const defaultHeaders: Record<string, string> = {
    "ngrok-skip-browser-warning": "true",
  };

  if (target === 'csharp') {
      const authHeader = getCompanyAuthHeader();
      if (authHeader) defaultHeaders["Authorization"] = authHeader;
  }

  if (options.body && !(options.body instanceof FormData))
    defaultHeaders["Content-Type"] = "application/json";

  try {
    const fullUrl = `${baseUrl}/${url}`;
    
    const response = await fetch(fullUrl, {
      ...options,
      headers: { ...defaultHeaders, ...options.headers },
    });

    if (!response.ok) {
      const text = await response.text();
      if (response.status === 409) {
        console.warn(`[API Conflict]`, response.status, text);
      } else {
        console.error("[API Error]", response.status, text);
      }
      throw new Error(`API ${response.status}: ${text}`);
    }

    const contentType = response.headers.get("content-type");
    const disposition = response.headers.get("content-disposition");

    if ((disposition && disposition.includes('attachment')) || contentType?.includes('application/octet-stream') || contentType?.includes("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")) {
        return response.blob() as Promise<T>;
    }
    
    if (contentType?.includes("application/json")) {
        const jsonText = await response.text();
        if (!jsonText) return null as T;

        try {
            const parsedJson = JSON.parse(jsonText);
            if (typeof parsedJson === 'string') {
                try {
                    return mapKeysToSnakeCase(JSON.parse(parsedJson));
                } catch {
                    return { message: parsedJson } as T;
                }
            }
            return mapKeysToSnakeCase(parsedJson) as T;
        } catch (e) {
            console.warn("Failed to parse JSON response, checking for plain text success. Response:", jsonText);
            if (jsonText.toLowerCase().includes("success")) {
                return { message: jsonText } as T;
            }
            throw new Error("Invalid JSON response from server.");
        }
    }
    
    return response.text() as unknown as T;
  } catch (error: any) {
    if (error && error.message && error.message.includes("409")) {
        console.warn("[Network Fetch Conflict]", url, error.message);
    } else {
        console.error("[Network Fetch Failed]", url, error);
    }
    throw error;
  }
}

// --------------------------------------------------------------
// MAIN UNIFIED API WRAPPER
// --------------------------------------------------------------
const unifiedApi = {
  // 🔐 Authentication
  companyAuthenticate: (companyName: string, companyPassword: string): Promise<{ message: string }> => {
    const authHeader = "Basic " + btoa(`${companyName}:${companyPassword}`);
    return fetcher(`companyauthenticate`, {
      method: "POST",
      headers: {
        "Authorization": authHeader,
      },
      body: JSON.stringify({ company_name: companyName, company_password: companyPassword }),
    }).then((res: any) => {
      if (res.message === "Success") {
        saveCompanyCredentials(companyName, companyPassword);
      }
      return res;
    });
  },

  userAuthenticate: async (username: string, password: string, companyName: string): Promise<ApiUser> => {
    const userDetails = await fetcher<Omit<ApiUser, 'company_name'>>(`userauthenticate`, {
      method: "POST",
      headers: { "X-Company-Name": companyName },
      body: JSON.stringify({ Username: username, Password: password }),
    });

    return {
      ...userDetails,
      company_name: companyName,
    };
  },
  
  // 👥 Users
  getUsers: async (): Promise<ApiUser[]> => {
      const response: any = await fetcher("GetCRMUserMasterList", { method: "GET" });
      if (response && response.data && typeof response.data === 'string') {
        const parsedData = JSON.parse(response.data);
        return mapKeysToSnakeCase(parsedData);
      }
      return Array.isArray(response) ? mapKeysToSnakeCase(response) : [];
  },
  createUser: (userData: Partial<ApiUser>): Promise<{status: string, message: string}> =>
    fetcher(`CreateCrmUser`, { method: "POST", body: JSON.stringify(mapKeysToPascalCase(userData))}),
  updateUser: (email: string, userData: Partial<ApiUser>): Promise<{status: string, message: string}> =>
    fetcher(`UpdateCrmUser`, { method: "POST", body: JSON.stringify(mapKeysToPascalCase({ ...userData, Email: email })) }),
  deleteUser: (email: string): Promise<{status: string, message: string}> => 
    fetcher(`DeleteCrmUser`, { method: "POST", body: JSON.stringify({ Email: email }) }),

  // 📊 Leads
  getAllLeads: async (): Promise<ApiLead[]> => {
    const response: any = await fetcher("Leads/GetAll", { method: "POST", body: JSON.stringify({}) });
    if (response && response.data && typeof response.data === 'string') {
        const parsedData = JSON.parse(response.data);
        return mapKeysToSnakeCase(parsedData);
    }
    return Array.isArray(response) ? mapKeysToSnakeCase(response) : [];
  },

  searchLeads: (searchTerm: string): Promise<ApiLeadSearchResult[]> => 
    fetcher("Leads/Search", { 
      method: "POST", 
      body: JSON.stringify({ SearchTerm: searchTerm }) 
    }),
  
  getLeadById: (leadId: number): Promise<ApiLead> => {
      return fetcher("Leads/GetLeadDetails", {
          method: "POST",
          body: JSON.stringify({ LeadId: leadId }),
      });
  },
  createLead: (leadData: Partial<ApiLead>): Promise<{message: string; id: number}> =>
    fetcher("Leads/Create", { method: "POST", body: JSON.stringify(mapKeysToPascalCase(leadData)) }),
  updateLead: (leadId: number, leadData: Partial<ApiLead>): Promise<{message: string}> =>
    fetcher("Leads/Update", { method: "POST", body: JSON.stringify(mapKeysToPascalCase({ id: leadId, ...leadData })) }),
  softDeleteLead: (leadId: number): Promise<{message: string}> =>
    fetcher("Leads/Delete", { method: "POST", body: JSON.stringify({ LeadId: leadId }) }),
  getDeletedLeads: (): Promise<ApiLead[]> => fetcher("Leads/GetDeletedLeads", { method: "POST", body: JSON.stringify({}) }),
  restoreLead: (leadId: number): Promise<{message: string}> =>
    fetcher("Leads/RestoreLead", { method: "POST", body: JSON.stringify({ LeadId: leadId }) }),
  
  uploadLeadAttachment: (leadId: number, file: File): Promise<{ message: string; attachment: LeadAttachment }> => {
    const formData = new FormData();
    formData.append("leadId", leadId.toString());
    formData.append("file", file);
    return fetcher("Leads/UploadAttachment", {
      method: "POST",
      body: formData,
    });
  },
  deleteLeadAttachment: (attachmentId: number): Promise<{message: string}> =>
    fetcher(`Leads/DeleteAttachment`, { method: "POST", body: JSON.stringify({ AttachmentId: attachmentId }) }),

  downloadLeadAttachment: (attachmentId: number): Promise<Blob> => {
    return fetcher(`Leads/DownloadAttachment/${attachmentId}`, { method: 'GET' });
  },
  
  // 💼 Proposals
  convertLeadToProposal: (leadId: number, payload: ConvertToProposalPayload): Promise<{message: string}> => 
    fetcher(`ProposalSent/Convert`, { 
      method: "POST", 
      body: JSON.stringify({ 
        LeadId: leadId, 
        ...mapKeysToPascalCase(payload) 
      }) 
    }),
  getAllProposals: (): Promise<ApiProposalSent[]> => fetcher("ProposalSent/GetAll", { method: "POST", body: JSON.stringify({}) }),
  updateProposal: (proposalId: number, proposalData: any, contactsData: any[]): Promise<{message: string}> => fetcher("ProposalSent/Update", { method: "POST", body: JSON.stringify({ Id: proposalId, Proposal: proposalData, Contacts: contactsData }) }),

  // 🧾 Clients
  convertToClient: (leadId: number | null, proposalId: number | null, payload: ConvertLeadToClientPayload): Promise<{ message: string }> => {
    const body = {
        LeadId: leadId,
        ProposalId: proposalId,
        ...mapKeysToPascalCase(payload)
    };
    return fetcher(`Client/Convert`, { method: "POST", body: JSON.stringify(body) });
  },
  getAllClients: (): Promise<ApiClient[]> => fetcher("Client/GetAll", { method: "GET" }),
  
  getClientById: (clientId: number): Promise<ApiClient> =>
    fetcher(`Client/GetById`, { method: "POST", body: JSON.stringify({ ClientId: clientId }) })
    .then(data => (Array.isArray(data) ? data[0] : data)),
  
  updateClient: (clientId: number, clientData: ApiClientUpdatePayload): Promise<ApiClient> =>
    fetcher(`Client/Update`, { method: "POST", body: JSON.stringify({ Id: clientId, Client: mapKeysToPascalCase(clientData), Contacts: mapKeysToPascalCase(clientData.contacts) }) }),

  // 📁 Bulk Upload
  uploadBulkLeads: (file: File): Promise<ApiBulkUploadResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    return fetcher("Leads/BulkUpload", { method: "POST", body: formData });
  },
  
  // 🕓 Activities & Reminders
  getAllActivities: (filters: { leadId?: number } = {}): Promise<ApiActivity[]> =>
    fetcher("Activity/GetAllActivities", { method: "POST", body: JSON.stringify(mapKeysToPascalCase(filters)) }),
  
  getActivitiesByLead: (leadId: number): Promise<ApiActivity[]> =>
    fetcher("Activity/GetByLead", { method: "POST", body: JSON.stringify({ LeadId: leadId })}),
  
  getFilteredActivitiesForLead: (payload: ApiActivityFilterPayload): Promise<ApiActivity[]> =>
    fetcher("Activity/GetFilteredActivities", { method: "POST", body: JSON.stringify(mapKeysToPascalCase(payload)) }),

  logActivity: (payload: { 
    lead_id: number; 
    details: string; 
    phase: string; 
    activity_type: string; 
    created_by: string; 
    attachment_path?: string | null; 
    duration_minutes?: number;
  }): Promise<{message: string}> =>
    fetcher("Activity/AddManualActivity", { method: "POST", body: JSON.stringify(mapKeysToPascalCase(payload)) }),
  
  updateLoggedActivity: (activityId: number, payload: { details: string }): Promise<{ message: string }> =>
    fetcher("Activity/Update", { 
        method: "POST", 
        body: JSON.stringify({ ActivityId: activityId, Details: payload.details }) 
    }),

  deleteLoggedActivity: (activityId: number, reason: string): Promise<{message: string}> => 
    fetcher(`Activity/Delete`, { method: "POST", body: JSON.stringify({ ActivityId: activityId, Reason: reason }) }),
  
  getAllReminders: (filters: { leadId?: number } = {}): Promise<ApiReminder[]> => 
    fetcher("Reminders/GetAll", { method: "POST", body: JSON.stringify(mapKeysToPascalCase(filters))}),
  
  getUpcomingReminders: (): Promise<ApiReminder[]> =>
    fetcher("Reminders/GetUpcoming", {method: 'POST', body: JSON.stringify({})}),
  scheduleReminder: (payload: any): Promise<{message: string}> =>
    fetcher("Reminders/Create", { method: "POST", body: JSON.stringify(mapKeysToPascalCase(payload)) }),
  markReminderDone: (reminderId: number): Promise<{ message: string }> =>
    fetcher(`Reminders/UpdateStatus`, { method: "POST", body: JSON.stringify({ ReminderId: reminderId, Status: "Completed" }) }),
  completeAndLogReminder: (reminderId: number, outcomeNotes: string, completedBy: string, durationMinutes: number): Promise<{ message: string }> => 
    fetcher(`Reminders/CompleteAndLog`, { 
        method: "POST", 
        body: JSON.stringify({ ReminderId: reminderId, OutcomeNotes: outcomeNotes, CompletedBy: completedBy, DurationMinutes: durationMinutes }) 
    }),
  cancelReminder: (reminderId: number): Promise<{message: string}> => 
    fetcher(`Reminders/Delete`, { method: "POST", body: JSON.stringify({ ReminderId: reminderId }) }),
  
  uploadActivityAttachment: (file: File): Promise<{ file_path: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    return fetcher("Activity/UploadAttachment", {
      method: "POST",
      body: formData,
    });
  },

  addActivityWithAttachment: async (leadId: number, details: string, file: File, createdBy: string): Promise<{ message: string }> => {
    const uploadResponse = await unifiedApi.uploadActivityAttachment(file);
    const attachmentPath = uploadResponse.file_path;

    if (!attachmentPath) {
      throw new Error("File upload was successful but did not return a valid path.");
    }

    return unifiedApi.logActivity({
      lead_id: leadId,
      details: details,
      phase: 'Quotation',
      activity_type: 'Quotation',
      attachment_path: attachmentPath,
      created_by: createdBy
    });
  },
  
  scheduleMeeting: async (payload: {
    lead_id: number;
    assigned_to: string;
    event_time: string;
    event_end_time: string;
    created_by: string;
    meeting_type: string;
    attendees: string[];
    company_auth_name: string | null;
  }): Promise<ApiMeeting> => {
    const leadDetails = await unifiedApi.getLeadById(payload.lead_id);
    if (!leadDetails || !leadDetails.company_name) {
      throw new Error(`Could not find company name for lead ID: ${payload.lead_id}`);
    }
    const companyName = leadDetails.company_name;

    const csharpResponse = await fetcher("Meetings/Create", { 
      method: "POST", 
      body: JSON.stringify(mapKeysToPascalCase(payload)) 
    });

    if (csharpResponse && payload.company_auth_name) {
      const pythonPayload = {
        event_type: "Meeting",
        company_name: companyName,
        start_time_utc: payload.event_time,
        end_time_utc: payload.event_end_time,
        scheduled_by: payload.created_by,
        attendee_usernames: payload.attendees,
        company_auth_name: payload.company_auth_name,
      };

      try {
        console.log("Attempting to send email notification via Python API with payload:", pythonPayload);
        await fetcher(
          'internal/send-event-email',
          {
            method: 'POST',
            body: JSON.stringify(pythonPayload)
          },
          'python'
        );
        console.log("Python API notification request sent successfully.");
      } catch (error) {
        console.error("Failed to send email notification via Python API:", error);
        toast.error("Meeting was scheduled, but failed to send email notifications.");
      }
    }
    
    return csharpResponse as ApiMeeting;
  },

  scheduleDemo: async (payload: {
    lead_id: number;
    assigned_to: string;
    start_time: string;
    event_end_time: string;
    scheduled_by: string;
    attendees: string[];
    company_auth_name: string | null;
  }): Promise<ApiDemo> => {
    const leadDetails = await unifiedApi.getLeadById(payload.lead_id);
    if (!leadDetails || !leadDetails.company_name) {
      throw new Error(`Could not find company name for lead ID: ${payload.lead_id}`);
    }
    const companyName = leadDetails.company_name;

    const csharpResponse = await fetcher("Demos/Create", { 
      method: "POST", 
      body: JSON.stringify(mapKeysToPascalCase({ ...payload, event_time: payload.start_time })) 
    });

    if (csharpResponse && payload.company_auth_name) {
      const pythonPayload = {
        event_type: "Demo",
        company_name: companyName,
        start_time_utc: payload.start_time,
        end_time_utc: payload.event_end_time,
        scheduled_by: payload.scheduled_by,
        attendee_usernames: payload.attendees,
        company_auth_name: payload.company_auth_name,
      };
      
      try {
        console.log("Attempting to send demo notification via Python API with payload:", pythonPayload);
        await fetcher(
          'internal/send-event-email',
          {
            method: 'POST',
            body: JSON.stringify(pythonPayload)
          },
          'python'
        );
        console.log("Python API demo notification sent successfully.");
      } catch (error) {
        console.error("Failed to send demo notification via Python API:", error);
        toast.error("Demo was scheduled, but failed to send email notifications.");
      }
    }

    return csharpResponse as ApiDemo;
  },

  getAllMeetings: async (filters: { leadId?: number } = {}): Promise<ApiMeeting[]> => {
    const response: any = await fetcher("Meetings/GetAll", { method: "POST", body: JSON.stringify(mapKeysToPascalCase(filters)) });
    if (response && typeof response === 'string') {
        const parsedData = JSON.parse(response);
        return mapKeysToSnakeCase(parsedData);
    }
    return Array.isArray(response) ? mapKeysToSnakeCase(response) : [];
  },
  getScheduledMeetings: async (): Promise<ApiMeeting[]> => {
    const allMeetings = await unifiedApi.getAllMeetings();
    return allMeetings.filter(m => m.phase === 'Scheduled' || m.phase === 'Rescheduled');
  },

  getAllDemos: async (filters: { leadId?: number } = {}): Promise<ApiDemo[]> => {
    const response: any = await fetcher("Demos/GetAll", { method: "POST", body: JSON.stringify(mapKeysToPascalCase(filters)) });
     if (response && typeof response === 'string') {
        const parsedData = JSON.parse(response);
        return mapKeysToSnakeCase(parsedData);
    }
    return Array.isArray(response) ? mapKeysToSnakeCase(response) : [];
  },

  getScheduledDemos: async (): Promise<ApiDemo[]> => {
    const allDemos = await unifiedApi.getAllDemos();
    return allDemos.filter(d => d.phase === 'Scheduled' || d.phase === 'Rescheduled');
  },

  completeMeeting: (payload: { MeetingId: number; Remark: string; DurationMinutes?: number }): Promise<{ message: string }> =>
    fetcher("Meetings/Complete", { method: "POST", body: JSON.stringify(payload) }),
  completeDemo: (payload: { DemoId: number; Remark: string; DurationMinutes?: number }): Promise<{ message: string }> =>
    fetcher("Demos/Complete", { method: "POST", body: JSON.stringify(payload) }),
  
  rescheduleMeeting: (meetingId: number, payload: ApiEventReschedulePayload): Promise<{ message: string }> =>
    fetcher(`Meetings/Reschedule`, {
      method: "POST",
      body: JSON.stringify({
        MeetingId: meetingId,
        EventTime: payload.start_time,
        EventEndTime: payload.end_time,
      }),
    }),
  rescheduleDemo: (demoId: number, payload: ApiEventReschedulePayload): Promise<{ message: string }> =>
    fetcher(`Demos/Reschedule`, {
      method: "POST",
      body: JSON.stringify({
        DemoId: demoId,
        StartTime: payload.start_time,
        EventEndTime: payload.end_time,
      }),
    }),
  rescheduleEvent: (type: 'meeting' | 'demo', id: number, payload: ApiEventReschedulePayload): Promise<{ message: string }> => {
    if (type === 'meeting') {
      return unifiedApi.rescheduleMeeting(id, payload);
    } else {
      return unifiedApi.rescheduleDemo(id, payload);
    }
  },
  reassignEvent: (type: 'meeting' | 'demo', id: number, payload: ApiEventReassignPayload): Promise<{ message: string }> => {
    const endpoint = type === 'meeting' ? 'Meetings/Reassign' : 'Demos/Reassign';
    const idKey = type === 'meeting' ? 'MeetingId' : 'DemoId';
    const body = {
      [idKey]: id,
      AssignedToUserId: payload.assigned_to_user_id,
      UpdatedBy: payload.updated_by
    };
    return fetcher(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },
  cancelEvent: (type: 'meeting' | 'demo', id: number, payload: ApiEventCancelPayload): Promise<{ message: string }> => {
    const endpoint = type === 'meeting' ? 'Meetings/Cancel' : 'Demos/Cancel';
    const idKey = type === 'meeting' ? 'MeetingId' : 'DemoId';
    const body = {
      [idKey]: id,
      Reason: payload.reason,
      UpdatedBy: payload.updated_by
    };
    return fetcher(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },
  updateEventNotes: (type: 'meeting' | 'demo', id: number, payload: ApiEventNotesUpdatePayload): Promise<{ message: string }> => {
    const endpoint = type === 'meeting' ? 'Meetings/UpdateNotes' : 'Demos/UpdateNotes';
    const body = {
        Id: id,
        Notes: payload.notes,
        UpdatedBy: payload.updated_by
    };
    return fetcher(endpoint, {
        method: 'POST',
        body: JSON.stringify(body)
    });
  },

  getAllCalendarEvents: async (): Promise<any[]> => {
    try {
        const users = await unifiedApi.getUsers();
        const leads = await unifiedApi.getAllLeads();
        const meetings = await unifiedApi.getAllMeetings();
        const demos = await unifiedApi.getAllDemos();

        const leadMap = new Map((leads || []).map(lead => [lead.id, lead.company_name]));
        const userMap = new Map((users || []).map(user => [user.usernumber, user.username]));
        const calendarEvents: any[] = [];
        const statusesToShow = ['Scheduled', 'Rescheduled', 'Done', 'Completed'];

        (meetings || []).filter(m => statusesToShow.includes(m.phase)).forEach(meeting => {
            const startTime = parseMicrosoftDate(meeting.event_time);
            if (!meeting.lead_id || !startTime) {
                 return;
            }
           
            let endTime = parseMicrosoftDate(meeting.event_end_time);
            if (!endTime) {
                endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
            }

            if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
                console.warn(`Skipping invalid meeting event:`, meeting);
                return;
            }

            calendarEvents.push({
                id: `meeting-${meeting.id}`,
                title: `Meeting: ${leadMap.get(meeting.lead_id) || 'Unknown Lead'}`,
                start: startTime,
                end: endTime,
                extendedProps: {
                    type: 'Meeting',
                    status: meeting.phase,
                    assignee: meeting.assigned_to,
                    details: meeting.remark || 'No remarks.'
                }
            });
        });

        (demos || []).filter(d => statusesToShow.includes(d.phase)).forEach(demo => {
            const startTime = parseMicrosoftDate(demo.start_time);
            if (!demo.lead_id || !startTime) {
                 return;
            }
            
            let endTime = parseMicrosoftDate(demo.event_end_time);
            if (!endTime) {
                endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
            }
            
            if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
                console.warn(`Skipping invalid demo event:`, demo);
                return;
            }
            
            const assigneeName = userMap.get(demo.assigned_to) || demo.scheduled_by || 'Unknown User';
            calendarEvents.push({
                id: `demo-${demo.id}`,
                title: `Demo: ${leadMap.get(demo.lead_id) || 'Unknown Lead'}`,
                start: startTime,
                end: endTime,
                extendedProps: {
                    type: 'Demo',
                    status: demo.phase,
                    assignee: assigneeName,
                    details: demo.remark || 'No remarks.'
                }
            });
        });
        
        console.log(`Consolidated ${calendarEvents.length} valid calendar events.`);
        return calendarEvents;
    } catch (error) {
        console.error("Error consolidating calendar events:", error);
        throw error; 
    }
  },

  // 🧠 Master Data
  getByCategory: (category: string): Promise<ApiMasterData[]> => fetcher(`MasterData/GetByCategory`, { method: "POST", body: JSON.stringify({ Category: category }) }),
  createMasterData: (item: { category: string; value: string }): Promise<ApiMasterData> =>
    fetcher("MasterData/Create", { method: "POST", body: JSON.stringify({ ...item, IsActive: true }) }),
  deleteMasterData: (itemId: number): Promise<{message: string}> =>
    fetcher(`MasterData/Delete`, { method: "POST", body: JSON.stringify({ Id: itemId }) }),
  updateMasterData: (item: { id: number; category: string; value: string; is_active: boolean }): Promise<{message: string}> =>
    fetcher("MasterData/Update", { method: "POST", body: JSON.stringify({ Id: item.id, Category: item.category, Value: item.value, IsActive: item.is_active }) }),

  // 📧 SMTP Settings (stored in MasterData)
  getSmtpSettings: async (): Promise<{ email: string | null; password: string | null; emailId: number | null; passwordId: number | null }> => {
    const emailData = await fetcher(`MasterData/GetByCategory`, { method: "POST", body: JSON.stringify({ Category: "SMTP_SENDER_EMAIL" }) }) as ApiMasterData[];
    const passwordData = await fetcher(`MasterData/GetByCategory`, { method: "POST", body: JSON.stringify({ Category: "SMTP_PASSWORD" }) }) as ApiMasterData[];
    return {
      email: emailData.length > 0 ? emailData[0].value : null,
      password: passwordData.length > 0 ? passwordData[0].value : null,
      emailId: emailData.length > 0 ? emailData[0].id : null,
      passwordId: passwordData.length > 0 ? passwordData[0].id : null,
    };
  },
  saveSmtpSettings: async (email: string, password: string, existingEmailId: number | null, existingPasswordId: number | null): Promise<{ success: boolean }> => {
    try {
      // Save or update SMTP_SENDER_EMAIL
      if (existingEmailId) {
        await fetcher("MasterData/Update", { method: "POST", body: JSON.stringify({ Id: existingEmailId, Category: "SMTP_SENDER_EMAIL", Value: email, IsActive: true }) });
      } else {
        await fetcher("MasterData/Create", { method: "POST", body: JSON.stringify({ Category: "SMTP_SENDER_EMAIL", Value: email, IsActive: true }) });
      }
      // Save or update SMTP_PASSWORD
      if (existingPasswordId) {
        await fetcher("MasterData/Update", { method: "POST", body: JSON.stringify({ Id: existingPasswordId, Category: "SMTP_PASSWORD", Value: password, IsActive: true }) });
      } else {
        await fetcher("MasterData/Create", { method: "POST", body: JSON.stringify({ Category: "SMTP_PASSWORD", Value: password, IsActive: true }) });
      }
      return { success: true };
    } catch (error) {
      console.error("Error saving SMTP settings:", error);
      return { success: false };
    }
  },

  // ✉️ Message Master
  getMessages: (): Promise<ApiMessageMaster[]> => 
    fetcher("MessageMaster/GetAll", { method: 'GET' }),
  
  createMessage: (payload: ApiMessageMasterCreatePayload, file: File | null): Promise<ApiMessageMaster> => {
    const formData = new FormData();
    formData.append('message_name', payload.message_name);
    formData.append('message_content', payload.message_content || '');
    formData.append('message_type', payload.message_type);
    formData.append('created_by', payload.created_by);
    if (file) {
      formData.append('file', file);
    }
    return fetcher("MessageMaster/Create", { method: "POST", body: formData });
  },

  updateMessage: (id: number, payload: ApiMessageMasterUpdatePayload, file: File | null): Promise<{message: string}> => {
    const formData = new FormData();
    formData.append('message_name', payload.message_name);
    formData.append('message_content', payload.message_content || '');
    formData.append('message_type', payload.message_type);
    formData.append('existing_attachment_path', payload.existing_attachment_path || '');
    if (file) {
      formData.append('file', file);
    }
    return fetcher(`MessageMaster/Update/${id}`, { method: "POST", body: formData });
  },

  deleteMessage: (id: number): Promise<{message: string}> => 
    fetcher(`MessageMaster/Delete/${id}`, { method: "POST" }),
    

  // 💧 Drip Sequences
  getDripSequences: (): Promise<ApiDripSequenceList[]> => 
    fetcher("DripSequence/GetAll", { method: 'GET' }), 

  getDripSequenceById: (id: number): Promise<ApiDripSequence> =>
    fetcher(`DripSequence/GetById/${id}`, { method: 'GET' }),

  createDripSequence: (payload: ApiDripSequenceCreatePayload): Promise<{message: string}> =>
    fetcher("DripSequence/Create", { method: "POST", body: JSON.stringify(payload) }),

  updateDripSequence: (id: number, payload: ApiDripSequenceCreatePayload): Promise<{message: string}> =>
    fetcher(`DripSequence/Update/${id}`, { method: "POST", body: JSON.stringify(payload) }),

  deleteDripSequence: (id: number): Promise<{message: string}> =>
    fetcher(`DripSequence/Delete/${id}`, { method: "POST" }),

  assignDripToLead: (leadId: number, dripSequenceId: number): Promise<{message: string}> =>
    fetcher("DripSequence/AssignToLead", { method: "POST", body: JSON.stringify({ LeadId: leadId, DripSequenceId: dripSequenceId, StartDate: new Date().toISOString(), IsActive: true }) }),

  // ✅ Tasks
  createTask: (payload: ApiTaskCreatePayload): Promise<{message: string}> =>
    fetcher(`Tasks/Create`, { method: "POST", body: JSON.stringify(mapKeysToPascalCase(payload)) }),
  getTasksForUser: (userId?: number): Promise<ApiTask[]> =>
    fetcher(`Tasks/GetForUser`, { method: "POST", body: JSON.stringify({ UserId: userId }) }),
  
  getActivitiesForTask: (taskId: number): Promise<ApiActivity[]> =>
    fetcher(`Tasks/GetActivitiesForTask`, { method: "POST", body: JSON.stringify({ TaskId: taskId }) }),

  syncTaskActivities: (taskId: number, activityIds: number[]): Promise<{message: string}> =>
    fetcher(`Tasks/SyncTaskActivities`, { method: "POST", body: JSON.stringify({ TaskId: taskId, ActivityIds: activityIds }) }),


  updateTaskStatus: (taskId: number, status: 'Pending' | 'In Progress' | 'Completed'): Promise<{message: string}> =>
    fetcher(`Tasks/UpdateStatus`, { method: "POST", body: JSON.stringify({ TaskId: taskId, Status: status }) }),
  completeTask: (payload: ApiTaskCompletePayload): Promise<{message: string}> =>
    fetcher(`Tasks/Complete`, { method: "POST", body: JSON.stringify(mapKeysToPascalCase(payload)) }),
  
  
  // 📈 Reports
  getUserPerformanceReport: (userId: number, startDate: string, endDate: string): Promise<ApiReportData> => 
    fetcher(`Reports/GetUserPerformance`, { 
      method: "POST", 
      body: JSON.stringify({ UserId: userId, StartDate: startDate, EndDate: endDate }) 
    }),
    
  exportSummaryReport: (startDate: string, endDate: string): Promise<any> => 
    fetcher(`Reports/ExportSummary`, { 
      method: "POST", 
      body: JSON.stringify({ StartDate: startDate, EndDate: endDate }) 
    }),
};

// --------------------------------------------------------------
// EXPORTED API GROUPS
// --------------------------------------------------------------
export const api = { ...unifiedApi, getCompanyAuthName };


export const masterDataApi = {
  getByCategory: unifiedApi.getByCategory,
  create: unifiedApi.createMasterData,
  delete: unifiedApi.deleteMasterData,
};

export const authApi = {
  companyAuthenticate: unifiedApi.companyAuthenticate,
  userAuthenticate: unifiedApi.userAuthenticate,
};

export const userApi = { 
    getUsers: unifiedApi.getUsers,
    createUser: unifiedApi.createUser,
    updateUser: unifiedApi.updateUser,
    deleteUser: unifiedApi.deleteUser
};

export const leadApi = {
  getAllLeads: unifiedApi.getAllLeads,
  getLeadById: unifiedApi.getLeadById,
  searchLeads: unifiedApi.searchLeads,
  createLead: unifiedApi.createLead,
  updateLead: unifiedApi.updateLead,
  softDeleteLead: unifiedApi.softDeleteLead,
  getDeletedLeads: unifiedApi.getDeletedLeads,
  restoreLead: unifiedApi.restoreLead,
  uploadLeadAttachment: unifiedApi.uploadLeadAttachment,
  deleteLeadAttachment: unifiedApi.deleteLeadAttachment,
  assignDripToLead: unifiedApi.assignDripToLead,
  uploadBulkLeads: unifiedApi.uploadBulkLeads,
  downloadLeadAttachment: unifiedApi.downloadLeadAttachment,
};

export const proposalApi = {
  getAllProposals: unifiedApi.getAllProposals,
  updateProposal: unifiedApi.updateProposal,
  convertLeadToProposal: unifiedApi.convertLeadToProposal,
};

export const clientApi = {
  getAllClients: unifiedApi.getAllClients,
  getClientById: unifiedApi.getClientById,
  updateClient: unifiedApi.updateClient,
  convertToClient: unifiedApi.convertToClient,
};

export const activityApi = {
  getAllActivities: unifiedApi.getAllActivities,
  getActivitiesByLead: unifiedApi.getActivitiesByLead,
  getFilteredActivitiesForLead: unifiedApi.getFilteredActivitiesForLead,
  logActivity: unifiedApi.logActivity,
  addActivityWithAttachment: unifiedApi.addActivityWithAttachment,
  deleteLoggedActivity: unifiedApi.deleteLoggedActivity,
  getAllReminders: unifiedApi.getAllReminders,
  getUpcomingReminders: unifiedApi.getUpcomingReminders,
  scheduleReminder: unifiedApi.scheduleReminder,
  markReminderDone: unifiedApi.markReminderDone,
  cancelReminder: unifiedApi.cancelReminder,
};

export const meetingsApi = {
  scheduleMeeting: unifiedApi.scheduleMeeting,
  getAllMeetings: unifiedApi.getAllMeetings,
  getScheduledMeetings: unifiedApi.getScheduledMeetings,
  completeMeeting: unifiedApi.completeMeeting,
};

export const demosApi = {
  scheduleDemo: unifiedApi.scheduleDemo,
  getAllDemos: unifiedApi.getAllDemos,
  getScheduledDemos: unifiedApi.getScheduledDemos,
  completeDemo: unifiedApi.completeDemo,
};

export const messageMasterApi = {
  getMessages: unifiedApi.getMessages,
  createMessage: unifiedApi.createMessage,
  updateMessage: unifiedApi.updateMessage,
  deleteMessage: unifiedApi.deleteMessage,
};

export const dripSequenceApi = {
  getDripSequences: unifiedApi.getDripSequences,
  getDripSequenceById: unifiedApi.getDripSequenceById,
  createDripSequence: unifiedApi.createDripSequence,
  updateDripSequence: unifiedApi.updateDripSequence,
  deleteDripSequence: unifiedApi.deleteDripSequence,
  assignDripToLead: unifiedApi.assignDripToLead,
};

export const reportApi = {
  getUserPerformanceReport: unifiedApi.getUserPerformanceReport,
  exportSummaryReport: unifiedApi.exportSummaryReport,
};

export const chatApi = {
  sendMessage: (message: string, userPhone: string): Promise<{ reply: string }> => {
    return fetcher(
      "app", 
      {
        method: "POST",
        body: JSON.stringify({
          message: message,
          user_phone: userPhone,
        }),
      },
      'python' 
    );
  },
};

export const taskApi = {
  createTask: unifiedApi.createTask,
  getTasksForUser: unifiedApi.getTasksForUser,
  updateTaskStatus: unifiedApi.updateTaskStatus,
  //linkActivitiesToTask: unifiedApi.linkActivitiesToTask, This function does not exist
  completeTask: unifiedApi.completeTask,
};