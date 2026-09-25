import { auth } from '@clerk/nextjs/server';

function getCandidateBaseUrls(): string[] {
  const pubUrl = process.env.NEXT_PUBLIC_API_URL;
  const isProd = process.env.VERCEL || process.env.NODE_ENV === 'production';
  const list: string[] = [];

  // 1. If explicit valid external URL is configured, use it first
  if (pubUrl && !pubUrl.includes('127.0.0.1') && !pubUrl.includes('localhost')) {
    list.push(pubUrl.replace(/\/+$/, ''));
  }

  // 2. Production Render cloud deployment
  list.push('https://regulation-compiler.onrender.com/api/v1');

  // 3. Local URL (first in dev mode, last resort in production)
  const localUrl = (pubUrl || 'http://127.0.0.1:8080/api/v1').replace(/\/+$/, '');
  if (!isProd) {
    list.unshift(localUrl);
  } else {
    list.push(localUrl);
  }

  return Array.from(new Set(list));
}

async function getAuthToken() {
  try {
    const session = await auth();
    if (session && typeof session.getToken === 'function') {
      return await session.getToken();
    }
  } catch {
    // Session unavailable in current context
  }
  return null;
}

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = await getAuthToken();

  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const candidateUrls = getCandidateBaseUrls();

  for (const baseUrl of candidateUrls) {
    try {
      const response = await fetch(`${baseUrl}${cleanEndpoint}`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(6500),
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (err: any) {
      if (err?.digest === 'DYNAMIC_SERVER_USAGE') {
        throw err;
      }
      // Continue to next candidate URL
    }
  }

  return null;
}


export async function getRegulations() {
  const res = await fetchWithAuth('/regulations');
  if (Array.isArray(res)) return res;
  if (res && Array.isArray(res.data)) return res.data;
  return [];
}


export async function getRegulation(regulationId: string) {
  const res = await fetchWithAuth(`/regulations/${regulationId}`);
  if (res && res.id) return res;

  // Fallback 1: Query global regulations list and match by ID or Name
  try {
    const allRegs = await getRegulations();
    if (Array.isArray(allRegs) && allRegs.length > 0) {
      const matched = allRegs.find((r: any) => 
        r.id === regulationId || 
        r.name?.toLowerCase().includes(regulationId.toLowerCase()) ||
        regulationId.toLowerCase().includes((r.jurisdiction || '').toLowerCase())
      );
      if (matched) return matched;
    }
  } catch {}

  // Fallback 2: Direct compliance signal resolution
  const sigRes = await fetchWithAuth(`/compliance/signals/${regulationId}`);
  if (sigRes && sigRes.regulation_id) {
    const regRes = await fetchWithAuth(`/regulations/${sigRes.regulation_id}`);
    if (regRes && regRes.id) return regRes;
  }

  return res;
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

  // 1. Direct regulation requirements
  const res = await fetchWithAuth(`/regulations/${regulationId}/requirements${queryString}`);
  if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
    return res;
  }

  // 2. Direct signal endpoints
  const sigRes = await fetchWithAuth(`/signals/${regulationId}/requirements${queryString}`);
  if (sigRes?.data && Array.isArray(sigRes.data) && sigRes.data.length > 0) {
    return sigRes;
  }

  const compRes = await fetchWithAuth(`/compliance/signals/${regulationId}/requirements${queryString}`);
  if (compRes?.data && Array.isArray(compRes.data) && compRes.data.length > 0) {
    return compRes;
  }

  return res || sigRes || compRes || { data: [], next_cursor: null };
}

export async function updateRequirementStatus(requirementId: string, status: string, note?: string) {
  return fetchWithAuth(`/requirements/${requirementId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, reviewer_note: note }),
  });
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
  return fetchWithAuth('/api-keys');
}

export async function getPolicies() {
  const res = await fetchWithAuth('/policies');
  return res?.data || [];
}

export async function createPolicy(regulation_version_id: string) {
  const res = await fetchWithAuth('/policies', {
    method: 'POST',
    body: JSON.stringify({ regulation_version_id })
  });
  return res?.data || null;
}

export async function getComplianceDashboard() {
  const res = await fetchWithAuth('/compliance/dashboard');
  return res?.data || null;
}

export async function getGapAnalysis() {
  const res = await fetchWithAuth('/compliance/gap-analysis');
  return res?.data || [];
}

export async function getComplianceChecklist() {
  const res = await fetchWithAuth('/compliance/checklist');
  return res?.data || [];
}

export async function remediateCompliance(compliance_check_id: string, requirement_id: string, remediation_payload: any) {
  const res = await fetchWithAuth('/compliance/remediate', {
    method: 'POST',
    body: JSON.stringify({ compliance_check_id, requirement_id, remediation_payload })
  });
  return res?.data || null;
}

export async function evaluateCompliance(policy_id: string, system_payload: any) {
  const res = await fetchWithAuth('/compliance/evaluate', {
    method: 'POST',
    body: JSON.stringify({ policy_id, system_payload })
  });
  return res?.data || null;
}
