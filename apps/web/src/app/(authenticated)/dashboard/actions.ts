'use server';

import { auth } from '@clerk/nextjs/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  let token: string | null = null;
  try {
    const session = await auth();
    if (session && typeof session.getToken === 'function') {
      token = await session.getToken();
    }
  } catch {
    // Gracefully handle environments without active Clerk tokens
  }

  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      console.warn(`API Error [${endpoint}]: ${response.status} ${response.statusText}`);
      return null;
    }

    return await response.json();
  } catch (err) {
    console.warn(`Fetch error for [${endpoint}]:`, err);
    return null;
  }
}

export async function getPolicies() {
  const data = await fetchWithAuth('/policies');
  return data?.data || [];
}

export async function createPolicy(regulation_version_id: string) {
  const data = await fetchWithAuth('/policies', {
    method: 'POST',
    body: JSON.stringify({ regulation_version_id })
  });
  return data?.data || null;
}

export async function getComplianceDashboard() {
  const data = await fetchWithAuth('/compliance/dashboard');
  return data?.data || null;
}

export async function getGapAnalysis() {
  const data = await fetchWithAuth('/compliance/gap-analysis');
  return data?.data || [];
}

export async function getComplianceChecklist() {
  const data = await fetchWithAuth('/compliance/checklist');
  return data?.data || [];
}

export async function remediateCompliance(compliance_check_id: string, requirement_id: string, remediation_payload: any) {
  const data = await fetchWithAuth('/compliance/remediate', {
    method: 'POST',
    body: JSON.stringify({ compliance_check_id, requirement_id, remediation_payload })
  });
  return data?.data || null;
}

export async function evaluateCompliance(policy_id: string, system_payload: any) {
  const data = await fetchWithAuth('/compliance/evaluate', {
    method: 'POST',
    body: JSON.stringify({ policy_id, system_payload })
  });
  return data?.data || null;
}

export async function getRegulations() {
  const data = await fetchWithAuth('/regulations');
  return Array.isArray(data) ? data : (data?.data || []);
}

export async function getComplianceActivity() {
  const data = await fetchWithAuth('/compliance/activity');
  return data?.data || [];
}

export async function getGlobalMonitoringData() {
  const data = await fetchWithAuth('/compliance/monitoring/global');
  return data?.data || null;
}

export async function getMonitoringFeed(limit: number = 25) {
  const data = await fetchWithAuth(`/compliance/monitoring/feed?limit=${limit}`);
  return data?.data || [];
}

export async function triggerSurveillanceProbe(jurisdiction: string = 'GLOBAL') {
  const data = await fetchWithAuth('/compliance/monitoring/probe', {
    method: 'POST',
    body: JSON.stringify({ jurisdiction })
  });
  return data;
}

