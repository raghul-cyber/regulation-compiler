import os

filepath = "src/app/actions.ts"
with open(filepath, 'r') as f:
    content = f.read()

new_action = """
export async function runComplianceCheck(regulationId: string, payload: any) {
  const { auth } = await import('@clerk/nextjs/server');
  const session = await auth();
  const token = await session.getToken();
  
  if (!token) throw new Error("Unauthorized");

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080/api/v1';

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
      console.error("Failed to revoke temporary key", e);
    }
  }
}
"""

if "runComplianceCheck" not in content:
    with open(filepath, "a", encoding="utf-8") as f:
        f.write("\n" + new_action)
    print("Added runComplianceCheck to actions.ts")
else:
    print("runComplianceCheck already exists")

