import os

filepath = r"apps\web\src\app\(authenticated)\dashboard\coverage-view.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Change static import to dynamic import
content = content.replace(
    "import { CoverageGlobe } from '@/components/compliance/coverage-globe';",
    "import dynamic from 'next/dynamic';\n\nconst CoverageGlobe = dynamic(() => import('@/components/compliance/coverage-globe').then(mod => mod.CoverageGlobe), { \n  ssr: false, \n  loading: () => <div className=\"w-full h-full min-h-[600px] flex items-center justify-center bg-zinc-950/50 rounded-xl border border-zinc-800 text-zinc-500\"><Loader2 className=\"w-6 h-6 animate-spin mr-2\"/> Initializing 3D Engine...</div> \n});"
)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Patched coverage-view.tsx for dynamic lazy-loading.")
