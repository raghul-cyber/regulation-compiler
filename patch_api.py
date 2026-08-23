import os

file_path = "apps/web/src/lib/api.ts"
with open(file_path, "a", encoding="utf-8") as f:
    f.write("""

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
""")
print("Appended Compliance API functions to api.ts")
