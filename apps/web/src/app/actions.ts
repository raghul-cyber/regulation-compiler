'use server';

import { revalidatePath } from 'next/cache';
import { apiClient } from '@/lib/api-client';

function getApiBaseUrl(): string {
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    if (process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes('127.0.0.1') && !process.env.NEXT_PUBLIC_API_URL.includes('localhost')) {
      return process.env.NEXT_PUBLIC_API_URL;
    }
    return 'https://regulation-compiler.onrender.com/api/v1';
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080/api/v1';
}

export async function setRequirementStatus(reqId: string, status: string, note?: string) {
  try {
    const { auth } = await import('@clerk/nextjs/server');
    const session = await auth();
    const token = await session.getToken();
    if (!token) {
      return { success: false, error: "Authentication session expired or not ready. Please refresh or sign in." };
    }

    const API_BASE = getApiBaseUrl();
    const data = await apiClient(`${API_BASE}/requirements/${reqId}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status, reviewer_note: note }),
      timeoutMs: 15000,
      retries: 2
    });
    
    // Force Next.js to re-fetch the requirements so the status update is immediately visible
    revalidatePath('/(authenticated)/regulations/[id]/requirements', 'page');
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update requirement status" };
  }
}

export async function runComplianceCheck(regulationId: string, payload: any) {
  try {
    const { auth } = await import('@clerk/nextjs/server');
    const session = await auth();
    const token = await session.getToken();
    
    if (!token) {
      return {
        success: false,
        error: "Authentication session expired or not ready. Please refresh or sign in."
      };
    }

    // 0. Enforce 3 free actions quota before spinning up developer API key
    const reserve = await reserveUsageAction('compliance_simulation', { regulation_id: regulationId });
    if (!reserve.success && reserve.isPaymentRequired) {
      return {
        success: false,
        isPaymentRequired: true,
        error: "Your 3 free uses have been used. Upgrade to continue.",
        freeUsesUsed: reserve.freeUsesUsed ?? 3,
        freeUsesLimit: reserve.freeUsesLimit ?? 3
      };
    }

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
      let errMsg = "Failed to generate temporary API key for Developer API access.";
      try {
        const errJson = await keyRes.json();
        errMsg = errJson.detail || errJson.message || errMsg;
      } catch {}
      return { success: false, error: errMsg };
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
      const result = await apiClient(`${API_BASE}/check-compliance`, {
        method: 'POST',
        headers: {
          'X-API-Key': rawKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backendPayload),
        timeoutMs: 25000,
        retries: 2
      });

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
        console.warn("Failed to cleanup temp API key:", e);
      }
    }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to execute compliance check" };
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
  try {
    const { auth } = await import('@clerk/nextjs/server');
    const session = await auth();
    const token = await session.getToken();
    if (!token) {
      return { success: false, error: "Authentication session expired or not ready. Please refresh or sign in." };
    }
    
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
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create API key" };
  }
}

export async function revokeApiKey(keyId: string) {
  try {
    const { auth } = await import('@clerk/nextjs/server');
    const session = await auth();
    const token = await session.getToken();
    if (!token) {
      return { success: false, error: "Authentication session expired or not ready. Please refresh or sign in." };
    }
    
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
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to revoke API key" };
  }
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
    let isPaymentRequired = res.status === 402;
    let freeUsesUsed = 3;
    let freeUsesLimit = 3;
    try {
      const errJson = await res.json();
      errorDetail = errJson.detail || errJson.message || errorDetail;
      if (errJson.code === 'PAYMENT_REQUIRED' || res.status === 402) {
        isPaymentRequired = true;
        freeUsesUsed = errJson.free_uses_used ?? 3;
        freeUsesLimit = errJson.free_uses_limit ?? 3;
      }
    } catch (e) {
      errorDetail = `Server returned ${res.status} ${res.statusText}`;
    }
    return { success: false, error: errorDetail, isPaymentRequired, freeUsesUsed, freeUsesLimit };
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

export async function ingestFrameworkAction(acronym: string) {
  let token: string | null = null;
  try {
    const { auth } = await import('@clerk/nextjs/server');
    const session = await auth();
    token = await session.getToken();
  } catch (e) {}

  const API_BASE = getApiBaseUrl();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE}/regulations/frameworks/${acronym}/ingest`, {
      method: 'POST',
      headers,
      signal: AbortSignal.timeout(10000),
      cache: 'no-store'
    });
    if (!res.ok) {
      let errText = "Failed to ingest framework";
      let isPaymentRequired = res.status === 402;
      let freeUsesUsed = 3;
      let freeUsesLimit = 3;
      try {
        const errJson = await res.json();
        errText = errJson.detail || errJson.message || errText;
        if (errJson.code === 'PAYMENT_REQUIRED' || res.status === 402) {
          isPaymentRequired = true;
          freeUsesUsed = errJson.free_uses_used ?? 3;
          freeUsesLimit = errJson.free_uses_limit ?? 3;
        }
      } catch {
        errText = await res.text().catch(() => 'Failed to ingest framework');
      }
      return { success: false, error: errText, isPaymentRequired, freeUsesUsed, freeUsesLimit };
    }
    const data = await res.json();
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getFrameworksAction() {
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
    const res = await fetch(`${API_BASE}/regulations/frameworks`, {
      headers,
      signal: AbortSignal.timeout(6000),
      cache: 'no-store'
    });
    if (!res.ok) {
      return { success: false, error: `Status ${res.status}` };
    }
    const data = await res.json();
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getBillingStatusAction() {
  let token: string | null = null;
  try {
    const { auth } = await import('@clerk/nextjs/server');
    const session = await auth();
    token = await session.getToken();
  } catch (e) {}

  const API_BASE = getApiBaseUrl();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE}/billing/status`, {
      headers,
      signal: AbortSignal.timeout(6000),
      cache: 'no-store'
    });
    if (!res.ok) {
      return { success: false, error: `Status ${res.status}` };
    }
    const data = await res.json();
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function createCheckoutAction(productId?: string, returnUrl?: string) {
  let token: string | null = null;
  try {
    const { auth } = await import('@clerk/nextjs/server');
    const session = await auth();
    token = await session.getToken();
  } catch (e) {}

  if (!token) {
    return { success: false, error: "Authentication required" };
  }

  const API_BASE = getApiBaseUrl();
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  try {
    const res = await fetch(`${API_BASE}/billing/checkout`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ product_id: productId, return_url: returnUrl }),
      signal: AbortSignal.timeout(12000),
      cache: 'no-store'
    });
    if (!res.ok) {
      let errorMessage = 'Failed to initialize secure checkout';
      try {
        const errJson = await res.json();
        errorMessage = errJson.error?.message || errJson.message || errJson.detail || errorMessage;
      } catch {
        const text = await res.text().catch(() => '');
        if (text) errorMessage = text;
      }
      return { success: false, error: errorMessage };
    }
    const data = await res.json();
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getCustomerPortalAction() {
  let token: string | null = null;
  try {
    const { auth } = await import('@clerk/nextjs/server');
    const session = await auth();
    token = await session.getToken();
  } catch (e) {}

  if (!token) {
    return { success: false, error: "Authentication required" };
  }

  const API_BASE = getApiBaseUrl();
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  try {
    const res = await fetch(`${API_BASE}/billing/portal`, {
      headers,
      signal: AbortSignal.timeout(8000),
      cache: 'no-store'
    });
    if (!res.ok) {
      return { success: false, error: `Status ${res.status}` };
    }
    const data = await res.json();
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function reserveUsageAction(
  operationType = 'website_audit',
  metadata: Record<string, any> = {}
) {
  let token: string | null = null;
  try {
    const { auth } = await import('@clerk/nextjs/server');
    const session = await auth();
    token = await session.getToken();
  } catch (e) {}

  if (!token) {
    return { success: false, error: "Authentication required" };
  }

  const API_BASE = getApiBaseUrl();
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  try {
    const res = await fetch(`${API_BASE}/billing/reserve-usage`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        operation_type: operationType,
        operation_id: `op-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        source: 'client_action',
        metadata
      }),
      signal: AbortSignal.timeout(6000),
      cache: 'no-store'
    });

    if (!res.ok) {
      let isPaymentRequired = res.status === 402;
      let freeUsesUsed = 3;
      let freeUsesLimit = 3;
      let errorDetail = `Operation reservation failed (${res.status})`;
      try {
        const errJson = await res.json();
        const detail = errJson.detail || errJson;
        errorDetail = detail.message || (typeof detail === 'string' ? detail : errorDetail);
        if (detail.code === 'PAYMENT_REQUIRED' || res.status === 402) {
          isPaymentRequired = true;
          freeUsesUsed = detail.free_uses_used ?? 3;
          freeUsesLimit = detail.free_uses_limit ?? 3;
        }
      } catch (e) {}
      return { success: false, error: errorDetail, isPaymentRequired, freeUsesUsed, freeUsesLimit };
    }

    const data = await res.json();
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getBillingUsageAction() {
  let token: string | null = null;
  try {
    const { auth } = await import('@clerk/nextjs/server');
    const session = await auth();
    token = await session.getToken();
  } catch (e) {}

  if (!token) {
    return { success: false, error: "Authentication required", data: { events: [] } };
  }

  const API_BASE = getApiBaseUrl();
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  try {
    const res = await fetch(`${API_BASE}/billing/usage`, {
      headers,
      signal: AbortSignal.timeout(8000),
      cache: 'no-store'
    });
    if (!res.ok) {
      return { success: false, error: `Status ${res.status}`, data: { events: [] } };
    }
    const data = await res.json();
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message, data: { events: [] } };
  }
}




