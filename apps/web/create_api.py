import sys
import os

api_code = """import { auth } from '@clerk/nextjs/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080/api/v1';

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

export async function getRegulations() {
  return fetchWithAuth('/regulations');
}

export async function getDashboardSummary(regulationId: string) {
  return fetchWithAuth(`/regulations/${regulationId}/dashboard-summary`);
}

export async function getRecentActivity(regulationId: string) {
  return fetchWithAuth(`/regulations/${regulationId}/activity`);
}
"""

os.makedirs("src/lib", exist_ok=True)
with open("src/lib/api.ts", "w", encoding="utf-8") as f:
    f.write(api_code)
