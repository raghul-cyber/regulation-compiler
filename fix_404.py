import os

# 1. Update nav-auth.tsx
nav_path = r"apps\web\src\components\layout\nav-auth.tsx"
if os.path.exists(nav_path):
    with open(nav_path, 'r', encoding='utf-8') as f:
        nav_content = f.read()
    
    nav_content = nav_content.replace(
        '<Link href="/regulations">',
        '<Link href="/dashboard">'
    )
    
    with open(nav_path, 'w', encoding='utf-8') as f:
        f.write(nav_content)
    print("Fixed CTA link in nav-auth.tsx")
else:
    print(f"Could not find {nav_path}")

# 2. Create regulations/page.tsx
reg_dir = r"apps\web\src\app\(authenticated)\regulations"
os.makedirs(reg_dir, exist_ok=True)
reg_page_path = os.path.join(reg_dir, "page.tsx")

reg_page_content = """import { Suspense } from 'react';
import Link from 'next/link';
import { getRegulations } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: 'Regulations | Regulation Compiler',
};

async function RegulationsList() {
  const regulations = await getRegulations();

  if (!regulations || regulations.length === 0) {
    return (
      <div className="text-zinc-400">
        No regulations found. Upload a document to get started.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {regulations.map((reg: any) => (
        <Card key={reg.id} className="bg-zinc-950/50 border-zinc-800/50 flex flex-col h-full">
          <CardHeader>
            <CardTitle>{reg.title}</CardTitle>
            <CardDescription className="text-zinc-400 line-clamp-2">
              {reg.description || 'No description provided.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto pt-6">
            <Link href={`/regulations/${reg.id}/requirements`}>
              <Button size="sm" variant="secondary" className="w-full">
                View Requirements
              </Button>
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function RegulationsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Available Regulations</h1>
      <p className="text-zinc-400">
        Browse and analyze extracted requirements from uploaded regulatory documents.
      </p>
      
      <Suspense fallback={
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-[200px] rounded-xl bg-zinc-900/50" />
          <Skeleton className="h-[200px] rounded-xl bg-zinc-900/50" />
          <Skeleton className="h-[200px] rounded-xl bg-zinc-900/50" />
        </div>
      }>
        <RegulationsList />
      </Suspense>
    </div>
  );
}
"""

with open(reg_page_path, 'w', encoding='utf-8') as f:
    f.write(reg_page_content)
print("Created regulations/page.tsx")

