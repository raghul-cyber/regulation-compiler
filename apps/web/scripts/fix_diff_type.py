import os

filepath = "src/app/(authenticated)/regulations/[id]/diff/page.tsx"
with open(filepath, 'r') as f:
    content = f.read()

content = content.replace("searchParams: Record<string, string | string[]> | undefined", "searchParams: Record<string, string | string[] | undefined> | undefined")

with open(filepath, 'w') as f:
    f.write(content)

print("Fixed typing in page.tsx")
