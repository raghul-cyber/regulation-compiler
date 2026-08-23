'use server';

import { revalidatePath } from 'next/cache';

export async function setRequirementStatus(reqId: string, status: string, note?: string) {
  try {
    const { auth } = await import('@clerk/nextjs/server');
    const session = await auth();
    const token = await session.getToken();
    if (!token) throw new Error("Unauthorized");

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';
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

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';

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

export async function generateReport(regulationId: string, type: string) {
  const { auth } = await import('@clerk/nextjs/server');
  const session = await auth();
  const token = await session.getToken();
  if (!token) throw new Error("Unauthorized");
  
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';
  
  const res = await fetch(`${API_BASE}/reports`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ regulation_id: regulationId, report_type: type })
  });

  if (!res.ok) {
    const text = await res.text();
    return { success: false, error: `Failed to generate report: ${text}` };
  }
  const data = await res.json();
  return { success: true, data };
}


export async function createApiKey(name: string, scopes: string[]) {
  const { auth } = await import('@clerk/nextjs/server');
  const session = await auth();
  const token = await session.getToken();
  if (!token) throw new Error("Unauthorized");
  
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';
  
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
  
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';
  
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
  const { auth } = await import('@clerk/nextjs/server');
  const session = await auth();
  const token = await session.getToken();
  
  if (!token) throw new Error("Unauthorized");

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';

  const res = await fetch(`${API_BASE}/regulations/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
      // Note: We strictly omit Content-Type so Node/fetch automatically sets multipart/form-data with the correct boundary
    },
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
  const { auth } = await import('@clerk/nextjs/server');
  const session = await auth();
  const token = await session.getToken();
  if (!token) return { success: false, error: "Unauthorized" };
  
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';
  
  const res = await fetch(`${API_BASE}/reports/${regulationId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) return { success: false, error: "Failed to fetch reports" };
  
  const data = await res.json();
  return { success: true, data: data.data };
}

