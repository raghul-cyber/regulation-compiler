import { auth } from '@clerk/nextjs/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';

async function getAuthToken() {
  const { getToken } = await auth();
  const token = await getToken();
  if (!token) throw new Error("Unauthorized");
  return token;
}

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const { getToken } = await auth();
  const token = await getToken();
  
  if (!token) {
    throw new Error("Unauthorized");
  }

  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function getRegulations() {
  return fetchWithAuth('/regulations');
}

export async function getDashboardSummary(regulationId: string) {
  return fetchWithAuth(`/regulations/${regulationId}/dashboard-summary`);
}

export async function getRecentActivity(regulationId: string) {
  return fetchWithAuth(`/regulations/${regulationId}/activity`);
}


export async function getRequirements(regulationId: string, searchParams?: Record<string, string>) {
  const query = new URLSearchParams();
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value) query.append(key, value);
    });
  }
  const queryString = query.toString() ? `?${query.toString()}` : '';
  return fetchWithAuth(`/regulations/${regulationId}/requirements${queryString}`);
}

export async function updateRequirementStatus(requirementId: string, status: string, note?: string) {
  const { getToken } = await auth();
  const token = await getToken();
  
  if (!token) throw new Error("Unauthorized");

  const response = await fetch(`${API_BASE_URL}/requirements/${requirementId}/status`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status, reviewer_note: note }),
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}


export async function getRegulationDiff(regulationId: string, oldVersionId?: string, newVersionId?: string) {
  const query = new URLSearchParams();
  if (oldVersionId) query.append('old_version_id', oldVersionId);
  if (newVersionId) query.append('new_version_id', newVersionId);
  
  const queryString = query.toString() ? `?${query.toString()}` : '';
  return fetchWithAuth(`/regulations/${regulationId}/diff${queryString}`);
}


export async function getReports(regulationId: string) {
  return fetchWithAuth(`/reports/${regulationId}`);
}

export async function getApiKeys() {
  return fetchWithAuth(`/api-keys`);
}


// --- Compliance Hub API Methods ---

export async function getPolicies() {
  const token = await getAuthToken();
  const res = await fetch(`${API_BASE_URL}/api/v1/policies`, {
    headers: {
      Authorization: `Bearer ${token}`
    },
    cache: 'no-store'
  });
  if (!res.ok) throw new Error("Failed to fetch policies");
  const data = await res.json();
  return data.data;
}

export async function createPolicy(regulation_version_id: string) {
  const token = await getAuthToken();
  const res = await fetch(`${API_BASE_URL}/api/v1/policies`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ regulation_version_id })
  });
  if (!res.ok) throw new Error("Failed to create policy");
  const data = await res.json();
  return data.data;
}

export async function getComplianceDashboard() {
  const token = await getAuthToken();
  const res = await fetch(`${API_BASE_URL}/api/v1/compliance/dashboard`, {
    headers: {
      Authorization: `Bearer ${token}`
    },
    cache: 'no-store'
  });
  if (!res.ok) throw new Error("Failed to fetch dashboard");
  const data = await res.json();
  return data.data;
}

export async function getGapAnalysis() {
  const token = await getAuthToken();
  const res = await fetch(`${API_BASE_URL}/api/v1/compliance/gap-analysis`, {
    headers: {
      Authorization: `Bearer ${token}`
    },
    cache: 'no-store'
  });
  if (!res.ok) throw new Error("Failed to fetch gap analysis");
  const data = await res.json();
  return data.data;
}

export async function getComplianceChecklist() {
  const token = await getAuthToken();
  const res = await fetch(`${API_BASE_URL}/api/v1/compliance/checklist`, {
    headers: {
      Authorization: `Bearer ${token}`
    },
    cache: 'no-store'
  });
  if (!res.ok) throw new Error("Failed to fetch checklist");
  const data = await res.json();
  return data.data;
}

export async function remediateCompliance(compliance_check_id: string, requirement_id: string, remediation_payload: any) {
  const token = await getAuthToken();
  const res = await fetch(`${API_BASE_URL}/api/v1/compliance/remediate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ compliance_check_id, requirement_id, remediation_payload })
  });
  if (!res.ok) throw new Error("Failed to remediate violation");
  const data = await res.json();
  return data.data;
}

export async function evaluateCompliance(policy_id: string, system_payload: any) {
  const token = await getAuthToken();
  const res = await fetch(`${API_BASE_URL}/api/v1/compliance/evaluate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ policy_id, system_payload })
  });
  if (!res.ok) throw new Error("Failed to evaluate compliance");
  const data = await res.json();
  return data.data;
}
