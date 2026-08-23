import os

api_file = "src/lib/api.ts"
actions_file = "src/app/actions.ts"

with open(api_file, 'r', encoding='utf-8') as f:
    api_content = f.read()

new_api_funcs = """
export async function getReports(regulationId: string) {
  return fetchWithAuth(`/reports/${regulationId}`);
}

export async function getApiKeys() {
  return fetchWithAuth(`/api-keys`);
}
"""

if "getApiKeys" not in api_content:
    with open(api_file, 'a', encoding='utf-8') as f:
        f.write("\n" + new_api_funcs)
    print("Updated api.ts")
else:
    print("api.ts already updated")

with open(actions_file, 'r', encoding='utf-8') as f:
    actions_content = f.read()

new_action_funcs = """
export async function generateReport(regulationId: string, reportType: string) {
  const { auth } = await import('@clerk/nextjs/server');
  const session = await auth();
  const token = await session.getToken();
  if (!token) throw new Error("Unauthorized");
  
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080/api/v1';
  
  const res = await fetch(`${API_BASE}/reports`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ regulation_id: regulationId, report_type: reportType })
  });

  if (!res.ok) {
    const text = await res.text();
    return { success: false, error: `Failed to generate report: ${text}` };
  }
  return { success: true };
}

export async function createApiKey(name: string, scopes: string[]) {
  const { auth } = await import('@clerk/nextjs/server');
  const session = await auth();
  const token = await session.getToken();
  if (!token) throw new Error("Unauthorized");
  
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080/api/v1';
  
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
  
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080/api/v1';
  
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
  return { success: true };
}
"""

if "createApiKey" not in actions_content:
    with open(actions_file, 'a', encoding='utf-8') as f:
        f.write("\n" + new_action_funcs)
    print("Updated actions.ts")
else:
    print("actions.ts already updated")

