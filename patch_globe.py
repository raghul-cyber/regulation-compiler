import os

filepath = r"apps\web\src\components\compliance\coverage-globe.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add Global and useRouter
content = content.replace("import { useRef, useMemo, useState, useEffect } from 'react';", "import { useRef, useMemo, useState, useEffect } from 'react';\nimport { useRouter } from 'next/navigation';")

old_coords = """const JURISDICTION_COORDS: Record<string, [number, number]> = {
  'EU': [48.8566, 2.3522],      // Paris
  'US': [38.8951, -77.0364],    // Washington DC
  'UK': [51.5074, -0.1278],     // London
  'CA': [45.4215, -75.6972],    // Ottawa
  'AU': [-35.2809, 149.1300],   // Canberra
  'JP': [35.6762, 139.6503],    // Tokyo
  'SG': [1.3521, 103.8198],     // Singapore
};"""

new_coords = """const JURISDICTION_COORDS: Record<string, [number, number]> = {
  'EU': [48.8566, 2.3522],      // Paris
  'US': [38.8951, -77.0364],    // Washington DC
  'UK': [51.5074, -0.1278],     // London
  'CA': [45.4215, -75.6972],    // Ottawa
  'AU': [-35.2809, 149.1300],   // Canberra
  'JP': [35.6762, 139.6503],    // Tokyo
  'SG': [1.3521, 103.8198],     // Singapore
  'GLOBAL': [46.2044, 6.1432],  // Geneva (UN HQ)
};"""

content = content.replace(old_coords, new_coords)

# 2. Add useRouter to GlobeScene and change onClick
content = content.replace("function GlobeScene({ regulations }: { regulations: any[] }) {", "function GlobeScene({ regulations }: { regulations: any[] }) {\n  const router = useRouter();")

old_marker = "onClick={() => console.log(`Navigating to regulations for ${marker.jurisdiction}...`)}"
new_marker = "onClick={() => router.push(`/regulations`)}"
content = content.replace(old_marker, new_marker)

# 3. Ensure uppercase matching for mapping
content = content.replace("const coords = JURISDICTION_COORDS[jurisdiction];", "const coords = JURISDICTION_COORDS[jurisdiction.toUpperCase()];")

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Patched coverage-globe.tsx successfully.")
