'use server';

import { auth } from '@clerk/nextjs/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';

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

export async function getPolicies() {
  const data = await fetchWithAuth('/policies');
  return data.data;
}

export async function createPolicy(regulation_version_id: string) {
  const data = await fetchWithAuth('/policies', {
    method: 'POST',
    body: JSON.stringify({ regulation_version_id })
  });
  return data.data;
}

export async function getComplianceDashboard() {
  const data = await fetchWithAuth('/compliance/dashboard');
  return data.data;
}

export async function getGapAnalysis() {
  const data = await fetchWithAuth('/compliance/gap-analysis');
  return data.data;
}

export async function getComplianceChecklist() {
  const data = await fetchWithAuth('/compliance/checklist');
  return data.data;
}

export async function remediateCompliance(compliance_check_id: string, requirement_id: string, remediation_payload: any) {
  const data = await fetchWithAuth('/compliance/remediate', {
    method: 'POST',
    body: JSON.stringify({ compliance_check_id, requirement_id, remediation_payload })
  });
  return data.data;
}

export async function evaluateCompliance(policy_id: string, system_payload: any) {
  const data = await fetchWithAuth('/compliance/evaluate', {
    method: 'POST',
    body: JSON.stringify({ policy_id, system_payload })
  });
  return data.data;
}

export async function getRegulations() {
  const data = await fetchWithAuth('/regulations');
  return data.data;
}
