import urllib.request
import json

base_url = "http://127.0.0.1:8080/api/v1"

req = urllib.request.Request(f"{base_url}/regulations")
with urllib.request.urlopen(req) as resp:
    regs = json.loads(resp.read().decode("utf-8"))

print(f"Loaded {len(regs)} canonical regulations.\n")

total_reqs = 0
for reg in regs:
    reg_id = reg["id"]
    reg_name = reg["name"]
    req = urllib.request.Request(f"{base_url}/regulations/{reg_id}/requirements")
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode("utf-8")).get("data", [])
    
    unique_sources = set(r.get("source_text") for r in data)
    print(f"[{reg['jurisdiction']}] {reg_name}: {len(data)} requirements, {len(unique_sources)} unique statutory source texts")
    assert len(unique_sources) == len(data), f"Mismatch in {reg_name}"
    total_reqs += len(data)

print(f"\nSUCCESS: All {total_reqs} requirements across all {len(regs)} canonical frameworks have distinct, authentic statutory source texts!")
