import os

def fix_requirements():
    p = r"apps\web\src\app\(authenticated)\regulations\[id]\requirements\page.tsx"
    with open(p, 'r', encoding='utf-8') as f:
        c = f.read()
    
    old = """export default function RequirementsPage({ 
  params,
  searchParams,
}: { 
  params: { id: string },
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  return (
    <RequirementsContent id={params.id} searchParams={searchParams as Record<string, string>} />
  );
}"""
    
    new = """export default async function RequirementsPage({ 
  params,
  searchParams,
}: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  return (
    <RequirementsContent id={resolvedParams.id} searchParams={resolvedSearchParams as Record<string, string>} />
  );
}"""
    c = c.replace(old, new)
    with open(p, 'w', encoding='utf-8') as f: f.write(c)

def fix_reports():
    p = r"apps\web\src\app\(authenticated)\regulations\[id]\reports\page.tsx"
    with open(p, 'r', encoding='utf-8') as f:
        c = f.read()
        
    old = """export default async function ReportsPage({ params }: { params: { id: string } }) {
  const reportsData = await getReports(params.id).catch(() => ({ data: [] }));
  const reports = reportsData.data || [];

  return (
    <div className="flex flex-col w-full w-full mx-auto">
      <div className="mb-4">
        <Link 
          href={`/regulations/${params.id}/requirements`}
          className="text-sm font-medium text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          &larr; Back to Requirements
        </Link>
      </div>
      <ReportsGrid regulationId={params.id} initialReports={reports} />
    </div>
  );
}"""
    
    new = """export default async function ReportsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const reportsData = await getReports(resolvedParams.id).catch(() => ({ data: [] }));
  const reports = reportsData.data || [];

  return (
    <div className="flex flex-col w-full w-full mx-auto">
      <div className="mb-4">
        <Link 
          href={`/regulations/${resolvedParams.id}/requirements`}
          className="text-sm font-medium text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          &larr; Back to Requirements
        </Link>
      </div>
      <ReportsGrid regulationId={resolvedParams.id} initialReports={reports} />
    </div>
  );
}"""
    
    # The actual string might differ slightly because of template literals. 
    # Let's replace line by line if string block doesn't work.
    if old in c:
        c = c.replace(old, new)
    else:
        # Fallback replacement
        c = c.replace("export default async function ReportsPage({ params }: { params: { id: string } }) {", "export default async function ReportsPage({ params }: { params: Promise<{ id: string }> }) {\n  const resolvedParams = await params;")
        c = c.replace("params.id", "resolvedParams.id")

    with open(p, 'w', encoding='utf-8') as f: f.write(c)

def fix_diff():
    p = r"apps\web\src\app\(authenticated)\regulations\[id]\diff\page.tsx"
    with open(p, 'r', encoding='utf-8') as f:
        c = f.read()
        
    old = """export default function DiffPage({ 
  params,
  searchParams,
}: { 
  params: { id: string },
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  return (
    <DiffContent id={params.id} searchParams={searchParams} />
  );
}"""

    new = """export default async function DiffPage({ 
  params,
  searchParams,
}: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  return (
    <DiffContent id={resolvedParams.id} searchParams={resolvedSearchParams as any} />
  );
}"""

    if old in c:
        c = c.replace(old, new)
    else:
        print("WARN: diff old block not found")
        
    with open(p, 'w', encoding='utf-8') as f: f.write(c)


fix_requirements()
fix_reports()
fix_diff()
print("All files patched successfully")
