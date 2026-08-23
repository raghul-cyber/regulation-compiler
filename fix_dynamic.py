import os

hero_lazy = """'use client';
import dynamic from 'next/dynamic';
export const HeroScene = dynamic(() => import('@/components/3d/hero-scene').then(mod => mod.HeroScene), { ssr: false });
"""

dashboard_lazy = """'use client';
import dynamic from 'next/dynamic';
export const DashboardCanvas = dynamic(() => import('@/components/dashboard/dashboard-canvas'), { ssr: false });
"""

with open("apps/web-next/src/components/3d/hero-scene-lazy.tsx", "w", encoding="utf-8") as f:
    f.write(hero_lazy)

with open("apps/web-next/src/components/dashboard/dashboard-canvas-lazy.tsx", "w", encoding="utf-8") as f:
    f.write(dashboard_lazy)

page_file = "apps/web-next/src/app/page.tsx"
with open(page_file, 'r', encoding='utf-8') as f:
    page_content = f.read()

page_content = page_content.replace(
    "import dynamic from 'next/dynamic';\nconst HeroScene = dynamic(() => import('@/components/3d/hero-scene').then(mod => mod.HeroScene), { ssr: false });",
    "import { HeroScene } from '@/components/3d/hero-scene-lazy';"
)
with open(page_file, 'w', encoding='utf-8') as f:
    f.write(page_content)


dashboard_file = "apps/web-next/src/app/(authenticated)/dashboard/page.tsx"
with open(dashboard_file, 'r', encoding='utf-8') as f:
    dashboard_content = f.read()

dashboard_content = dashboard_content.replace(
    "import dynamic from 'next/dynamic';\nconst DashboardCanvas = dynamic(() => import('@/components/dashboard/dashboard-canvas'), { ssr: false });",
    "import { DashboardCanvas } from '@/components/dashboard/dashboard-canvas-lazy';"
)
with open(dashboard_file, 'w', encoding='utf-8') as f:
    f.write(dashboard_content)

print("Fixed next/dynamic SSR false error")
