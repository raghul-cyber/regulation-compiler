import os

api_file = "src/lib/api.ts"

with open(api_file, "r", encoding="utf-8") as f:
    content = f.read()

new_functions = """
export async function getRequirements(regulationId: string, searchParams?: Record<string, string>) {
  const query = new URLSearchParams();
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value) query.append(key, value);
    });
  }
  const queryString = query.toString() ? `?${query.toString()}` : '';
  return fetchWithAuth(`/regulations/${regulationId}/requirements${queryString}`);
}

export async function updateRequirementStatus(requirementId: string, status: string, note?: string) {
  const { getToken } = await auth();
  const token = await getToken();
  
  if (!token) throw new Error("Unauthorized");

  const response = await fetch(`${API_BASE_URL}/requirements/${requirementId}/status`, {
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

  return response.json();
}
"""

if "getRequirements" not in content:
    with open(api_file, "a", encoding="utf-8") as f:
        f.write("\n" + new_functions)
    print("Updated api.ts")
else:
    print("Already updated")

