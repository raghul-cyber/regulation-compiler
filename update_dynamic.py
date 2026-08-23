import os

page_file = "apps/web-next/src/app/page.tsx"
dashboard_file = "apps/web-next/src/app/(authenticated)/dashboard/page.tsx"

with open(page_file, 'r', encoding='utf-8') as f:
    page_content = f.read()

if "import { HeroScene } from '@/components/3d/hero-scene';" in page_content:
    page_content = page_content.replace(
        "import { HeroScene } from '@/components/3d/hero-scene';",
        "import dynamic from 'next/dynamic';\nconst HeroScene = dynamic(() => import('@/components/3d/hero-scene').then(mod => mod.HeroScene), { ssr: false });"
    )
    with open(page_file, 'w', encoding='utf-8') as f:
        f.write(page_content)
    print("Updated app/page.tsx with next/dynamic")
else:
    print("app/page.tsx already using next/dynamic or import not found")

with open(dashboard_file, 'r', encoding='utf-8') as f:
    dashboard_content = f.read()

if "import { DashboardCanvas } from '@/components/dashboard/dashboard-canvas';" in dashboard_content:
    dashboard_content = dashboard_content.replace(
        "import { DashboardCanvas } from '@/components/dashboard/dashboard-canvas';",
        "import dynamic from 'next/dynamic';\nconst DashboardCanvas = dynamic(() => import('@/components/dashboard/dashboard-canvas'), { ssr: false });"
    )
    with open(dashboard_file, 'w', encoding='utf-8') as f:
        f.write(dashboard_content)
    print("Updated app/dashboard/page.tsx with next/dynamic")
else:
    print("app/dashboard/page.tsx already using next/dynamic or import not found")

