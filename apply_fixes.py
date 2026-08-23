import os
import re

# 1. Remove max-w-6xl from pages
pages_to_fix = [
    "apps/web-next/src/app/(authenticated)/regulations/[id]/reports/page.tsx",
    "apps/web-next/src/app/(authenticated)/settings/api-keys/page.tsx",
    "apps/web-next/src/app/(authenticated)/compliance-check/page.tsx",
    "apps/web-next/src/app/(authenticated)/regulations/[id]/requirements/page.tsx",
    "apps/web-next/src/components/compliance/tester.tsx"
]

for p in pages_to_fix:
    if os.path.exists(p):
        with open(p, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Replace max-w-6xl with w-full
        new_content = content.replace("max-w-6xl", "w-full")
        
        if content != new_content:
            with open(p, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Removed max-w-6xl in {p}")

# 2. Fix Reports Grid (h-full flex flex-col) & Buttons
reports_grid = "apps/web-next/src/components/reports/reports-grid.tsx"
if os.path.exists(reports_grid):
    with open(reports_grid, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Button standard
    content = content.replace(
        "bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-[0_0_15px_rgba(37,99,235,0.4)] flex items-center gap-2 whitespace-nowrap",
        "bg-blue-600 hover:bg-blue-500 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-blue-500/50 focus:outline-none text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)] flex items-center gap-2 whitespace-nowrap"
    )
    content = content.replace(
        "px-5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2",
        "px-5 py-2.5 text-sm font-medium bg-blue-600 hover:bg-blue-500 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-blue-500/50 focus:outline-none text-white rounded-lg transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
    )
    
    # Card height
    content = content.replace(
        "className=\"bg-[#0a0a0c] border border-zinc-800 rounded-xl p-5 flex flex-col hover:border-zinc-700 transition-colors shadow-sm\"",
        "className=\"bg-[#0a0a0c] border border-zinc-800 rounded-xl p-5 h-full flex flex-col hover:border-zinc-700 transition-colors shadow-sm\""
    )
    
    with open(reports_grid, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Updated reports-grid.tsx")

# 3. Fix API Keys List Buttons & Modal Overflow
api_keys = "apps/web-next/src/components/settings/api-keys-list.tsx"
if os.path.exists(api_keys):
    with open(api_keys, 'r', encoding='utf-8') as f:
        content = f.read()

    # Buttons
    content = content.replace(
        "bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-[0_0_15px_rgba(37,99,235,0.4)] flex items-center gap-2 whitespace-nowrap",
        "bg-blue-600 hover:bg-blue-500 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-blue-500/50 focus:outline-none text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)] flex items-center gap-2 whitespace-nowrap"
    )
    content = content.replace(
        "px-5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2",
        "px-5 py-2.5 text-sm font-medium bg-blue-600 hover:bg-blue-500 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-blue-500/50 focus:outline-none text-white rounded-lg transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
    )
    
    # Inputs
    content = content.replace(
        "focus:outline-none focus:border-blue-500 transition-colors",
        "focus:outline-none focus-visible:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500/50 transition-all"
    )
    
    # Modals
    content = content.replace(
        "shadow-2xl w-full max-w-lg overflow-hidden flex flex-col",
        "shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]"
    )
    content = content.replace(
        "p-6 space-y-6",
        "p-6 space-y-6 overflow-y-auto"
    )

    with open(api_keys, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Updated api-keys-list.tsx")

# 4. Fix Tester Buttons and Textarea
tester = "apps/web-next/src/components/compliance/tester.tsx"
if os.path.exists(tester):
    with open(tester, 'r', encoding='utf-8') as f:
        content = f.read()

    # Button
    content = content.replace(
        "w-full bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-semibold py-3 rounded-lg transition-all shadow-[0_0_15px_rgba(37,99,235,0.2)] flex justify-center items-center gap-2",
        "w-full bg-blue-600 hover:bg-blue-500 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-blue-500/50 focus:outline-none disabled:bg-zinc-800 disabled:text-zinc-500 disabled:pointer-events-none text-white font-semibold py-2.5 rounded-lg transition-all shadow-[0_0_15px_rgba(37,99,235,0.2)] flex justify-center items-center gap-2"
    )
    
    # Textarea focus
    content = content.replace(
        "w-full h-[400px] bg-transparent p-4 text-sm font-mono text-zinc-300 focus:outline-none resize-none",
        "w-full h-[400px] bg-transparent p-4 text-sm font-mono text-zinc-300 focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500/50 resize-none transition-all"
    )
    
    with open(tester, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Updated tester.tsx")

