import httpx
import time
import json

urls = [
    'https://regulation-compiler.onrender.com/health',
    'https://regulation-compiler.onrender.com/api/v1/regulations',
    'https://regulation-compiler.onrender.com/api/v1/compliance/monitoring/feed',
    'https://regulation-compiler.onrender.com/api/v1/compliance/monitoring/global',
]

client = httpx.Client(timeout=90.0)

for url in urls:
    try:
        t0 = time.time()
        print(f"Connecting to {url}...")
        r = client.get(url)
        print(f"Status: {r.status_code} (took {time.time()-t0:.2f}s)")
        if r.status_code == 200:
            data = r.json()
            if isinstance(data, list):
                print(f"  Count: {len(data)}")
                for item in data[:3]:
                    name = item.get("name") or item.get("title") or item.get("id")
                    print(f"   - {name}")
            elif isinstance(data, dict):
                print(f"  Dict keys: {list(data.keys())}")
                if "events" in data:
                    print(f"  Events count: {len(data['events'])}")
                if "regulations" in data:
                    print(f"  Regulations count: {len(data['regulations'])}")
        else:
            print(f"  Body: {r.text[:300]}")
    except Exception as exc:
        print(f"  Error: {type(exc).__name__}: {exc}")
    print("-" * 50)
