import os

path = r"apps\web\src\app\actions.ts"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

new_action = """
export async function uploadRegulationServerAction(formData: FormData) {
  const { auth } = await import('@clerk/nextjs/server');
  const session = await auth();
  const token = await session.getToken();
  
  if (!token) throw new Error("Unauthorized");

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080/api/v1';

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
"""

if "uploadRegulationServerAction" not in content:
    with open(path, "a", encoding="utf-8") as f:
        f.write(new_action)
    print("Action appended.")
else:
    print("Action already exists.")
