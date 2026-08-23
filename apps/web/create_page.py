import sys

content = """import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

export default async function Home() {
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8080/api";
  let backendStatus = "Checking...";
  let backendData = null;

  try {
    const res = await fetch(`${apiUrl}/v1/regulations`, {
      cache: "no-store",
    });
    backendStatus = res.ok ? "Connected" : `Connected (HTTP ${res.status})`;
    if (res.ok) {
        backendData = await res.json();
    }
  } catch (error: any) {
    backendStatus = `Error: ${error.message}`;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 p-8 font-[family-name:var(--font-geist-sans)]">
      <header className="flex justify-between items-center mb-16 border-b border-zinc-800 pb-4">
        <h1 className="text-2xl font-bold tracking-tight">RegCompiler Next.js Migration</h1>
        <div className="flex items-center gap-4">
          <Link href="/r3f-test">
            <Button variant="outline" className="text-zinc-900 cursor-pointer">Test R3F WebGL</Button>
          </Link>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto space-y-8">
        <section className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-zinc-100">Backend Connection Status</h2>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${backendStatus.includes("Connected") ? "bg-green-500" : "bg-red-500"}`}></div>
            <p className="text-zinc-300 font-mono text-sm">{backendStatus}</p>
          </div>
          <p className="mt-4 text-zinc-400 text-sm">
            API Base URL: <code className="bg-zinc-800 px-1 py-0.5 rounded text-zinc-200">{apiUrl}</code>
          </p>
        </section>

        <section className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-zinc-100">Phase 1 Components Checklist</h2>
          <ul className="space-y-3 text-zinc-300">
            <li className="flex items-center gap-2">✅ Next.js 14+ App Router (TypeScript, Tailwind v4)</li>
            <li className="flex items-center gap-2">✅ Shadcn UI Configured (Zinc theme)</li>
            <li className="flex items-center gap-2">✅ React Three Fiber (R3F pipeline test page)</li>
            <li className="flex items-center gap-2">✅ Clerk Authentication (Middleware + Provider)</li>
            <li className="flex items-center gap-2">✅ FastAPI Backend Connection</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
"""

with open("src/app/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
