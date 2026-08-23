import os

api_file = "src/lib/api.ts"

with open(api_file, "r", encoding="utf-8") as f:
    content = f.read()

new_functions = """
export async function getRegulationDiff(regulationId: string, oldVersionId?: string, newVersionId?: string) {
  const query = new URLSearchParams();
  if (oldVersionId) query.append('old_version_id', oldVersionId);
  if (newVersionId) query.append('new_version_id', newVersionId);
  
  const queryString = query.toString() ? `?${query.toString()}` : '';
  return fetchWithAuth(`/regulations/${regulationId}/diff${queryString}`);
}
"""

if "getRegulationDiff" not in content:
    with open(api_file, "a", encoding="utf-8") as f:
        f.write("\n" + new_functions)
    print("Updated api.ts")
else:
    print("Already updated")

