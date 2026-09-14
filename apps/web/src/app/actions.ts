'use server';

import { revalidatePath } from 'next/cache';

function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    return 'https://regulation-compiler.onrender.com/api/v1';
  }
  return 'http://127.0.0.1:8080/api/v1';
}

export async function setRequirementStatus(reqId: string, status: string, note?: string) {
  try {
    const { auth } = await import('@clerk/nextjs/server');
    const session = await auth();
    const token = await session.getToken();
    if (!token) throw new Error("Unauthorized");

    const API_BASE = getApiBaseUrl();
    const response = await fetch(`${API_BASE}/requirements/${reqId}/status`, {
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

    const data = await response.json();
    
    // Force Next.js to re-fetch the requirements so the status update is immediately visible
    revalidatePath('/(authenticated)/regulations/[id]/requirements', 'page');
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function runComplianceCheck(regulationId: string, payload: any) {
  const { auth } = await import('@clerk/nextjs/server');
  const session = await auth();
  const token = await session.getToken();
  
  if (!token) throw new Error("Unauthorized");

  const API_BASE = getApiBaseUrl();

  // 1. Generate a temporary API key using the user's Clerk Token
  const keyRes = await fetch(`${API_BASE}/api-keys`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: 'Temp Compliance Check Key', scopes: ['check-compliance'] })
  });

  if (!keyRes.ok) {
    throw new Error("Failed to generate temporary API key for Developer API access.");
  }

  const keyData = await keyRes.json();
  const rawKey = keyData.raw_key;
  const keyId = keyData.id;

  try {
    // 2. Reshape payload to match FastAPI ComplianceCheckPayload
    // FastAPI expects: { system_name: str, regulation_ids: uuid[], controls_implemented: {} }
    // The UI passes arbitrary JSON in `payload`. We wrap it correctly:
    const backendPayload = {
      system_name: "Compliance Simulator",
      regulation_ids: [regulationId],
      controls_implemented: payload
    };

    // 3. Hit the Developer API using the temporary API Key
    const checkRes = await fetch(`${API_BASE}/check-compliance`, {
      method: 'POST',
      headers: {
        'X-API-Key': rawKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(backendPayload)
    });

    if (!checkRes.ok) {
      throw new Error(`API Error: ${checkRes.status} ${checkRes.statusText}`);
    }

    const result = await checkRes.json();
    return { success: true, data: result };

  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    // 4. Cleanup: Revoke the temporary API key so we don't litter the DB
    try {
      await fetch(`${API_BASE}/api-keys/${keyId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (e) {
      console.error("Cleanup failed:", e);
    }
  }
}

export async function generateReport(regulationId: string, typeOrTypes: string | string[]) {
  let token: string | null = null;
  try {
    const { auth } = await import('@clerk/nextjs/server');
    const session = await auth();
    token = await session.getToken();
  } catch (e) {
    console.warn("generateReport session auth fallback:", e);
  }
  
  const API_BASE = getApiBaseUrl();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const selectedTypes = Array.isArray(typeOrTypes) ? typeOrTypes : [typeOrTypes];
  const primaryType = selectedTypes.length === 1 ? selectedTypes[0] : (selectedTypes[0] || 'executive_summary');
  const isMulti = selectedTypes.length > 1;

  const res = await fetch(`${API_BASE}/reports`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      regulation_id: regulationId,
      report_type: isMulti ? 'composite' : primaryType,
      report_types: selectedTypes
    })
  });

  if (!res.ok) {
    let errorDetail = "Failed to generate report";
    try {
      const errJson = await res.json();
      errorDetail = errJson.detail || errorDetail;
    } catch (e) {
      const text = await res.text();
      errorDetail = text || `Server returned ${res.status}`;
    }
    return { success: false, error: errorDetail };
  }
  const data = await res.json();
  return { success: true, data };
}


export async function createApiKey(name: string, scopes: string[]) {
  const { auth } = await import('@clerk/nextjs/server');
  const session = await auth();
  const token = await session.getToken();
  if (!token) throw new Error("Unauthorized");
  
  const API_BASE = getApiBaseUrl();
  
  const res = await fetch(`${API_BASE}/api-keys`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, scopes })
  });

  if (!res.ok) {
    const text = await res.text();
    return { success: false, error: `Failed to create API key: ${text}` };
  }
  const data = await res.json();
  return { success: true, data };
}

export async function revokeApiKey(keyId: string) {
  const { auth } = await import('@clerk/nextjs/server');
  const session = await auth();
  const token = await session.getToken();
  if (!token) throw new Error("Unauthorized");
  
  const API_BASE = getApiBaseUrl();
  
  const res = await fetch(`${API_BASE}/api-keys/${keyId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  });

  if (!res.ok) {
    const text = await res.text();
    return { success: false, error: `Failed to revoke API key: ${text}` };
  }
  const data = await res.json();
  return { success: true, data };
}

export async function uploadRegulationServerAction(formData: FormData) {
  let token: string | null = null;
  try {
    const { auth } = await import('@clerk/nextjs/server');
    const session = await auth();
    token = await session.getToken();
  } catch (e) {
    console.warn("uploadRegulationServerAction auth fallback:", e);
  }

  const API_BASE = getApiBaseUrl();

  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}/regulations/upload`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!res.ok) {
    let errorDetail = "Failed to upload regulation";
    try {
      const errJson = await res.json();
      errorDetail = errJson.detail || errorDetail;
    } catch (e) {
      errorDetail = `Server returned ${res.status} ${res.statusText}`;
    }
    return { success: false, error: errorDetail };
  }

  const data = await res.json();
  return { success: true, data };
}

export async function pollReports(regulationId: string) {
  let token: string | null = null;
  try {
    const { auth } = await import('@clerk/nextjs/server');
    const session = await auth();
    token = await session.getToken();
  } catch (e) {
    console.warn("pollReports auth fallback:", e);
  }
  
  const API_BASE = getApiBaseUrl();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const res = await fetch(`${API_BASE}/reports/${regulationId}`, { headers });
  if (!res.ok) return { success: false, error: "Failed to fetch reports" };
  
  const data = await res.json();
  return { success: true, data: data.data };
}

export async function getJobEventsAction(jobId: string) {
  let token: string | null = null;
  try {
    const { auth } = await import('@clerk/nextjs/server');
    const session = await auth();
    token = await session.getToken();
  } catch (e) {}

  const API_BASE = getApiBaseUrl();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE}/jobs/${jobId}`, {
      headers,
      signal: AbortSignal.timeout(4000),
      cache: 'no-store'
    });
    if (!res.ok) return { success: false, error: `Job status ${res.status}` };
    const data = await res.json();
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

