import os
import re

files_to_fix = [
    r"apps\web\src\app\(authenticated)\regulations\[id]\requirements\page.tsx",
    r"apps\web\src\app\(authenticated)\regulations\[id]\reports\page.tsx",
    r"apps\web\src\app\(authenticated)\regulations\[id]\diff\page.tsx",
]

for file_path in files_to_fix:
    if not os.path.exists(file_path):
        print(f"Skipping {file_path}, does not exist")
        continue

    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # We want to find the export default function and replace it.
    # Because Next.js 15+ needs await, we change it to:
    # export default async function Page(props: { params: Promise<{ id: string }>, searchParams?: Promise<any> }) {
    #   const params = await props.params;
    #   const searchParams = props.searchParams ? await props.searchParams : undefined;
    #   ...
    
    # Let's extract the Component name and the inner JSX
    # Match: export default function XPage({ params, searchParams }: ...) { return ( <XContent ... /> ); }
    match = re.search(r'export default function (\w+)\s*\(\s*\{\s*params,\s*(?:searchParams,)?\s*\}\s*:\s*\{[^}]*\}\s*\)\s*\{([\s\S]*?)\}', content)
    if not match:
        print(f"Regex didn't match in {file_path}")
        continue
    
    component_name = match.group(1)
    inner_body = match.group(2)
    
    # We replace `params.id` with `resolvedParams.id` inside inner_body
    inner_body = inner_body.replace("params.id", "resolvedParams.id")
    # We replace `searchParams as` with `resolvedSearchParams as` inside inner_body
    inner_body = inner_body.replace("searchParams as", "resolvedSearchParams as")
    inner_body = inner_body.replace("searchParams}", "resolvedSearchParams}")
    
    new_export = f"""type Props = {{
  params: Promise<{{ id: string }}>;
  searchParams?: Promise<{{ [key: string]: string | string[] | undefined }}>;
}};

export default async function {component_name}(props: Props) {{
  const resolvedParams = await props.params;
  const resolvedSearchParams = props.searchParams ? await props.searchParams : undefined;
{inner_body}}}
"""
    
    new_content = content[:match.start()] + new_export
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(new_content)
        
    print(f"Successfully patched {file_path}")

