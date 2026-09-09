import httpx
import json

base_url = "https://regulation-compiler.onrender.com/api/v1"
client = httpx.Client(timeout=30.0)

print("Fetching regulations...")
r = client.get(f"{base_url}/regulations")
print("Status:", r.status_code)
regs = r.json()
print(f"Total regulations: {len(regs)}")

for reg in regs:
    reg_id = reg["id"]
    reg_name = reg["name"]
    jur = reg["jurisdiction"]
    print(f"\nTesting Regulation: {reg_name} ({jur}) [ID: {reg_id}]")
    
    # Test GET single regulation
    r_single = client.get(f"{base_url}/regulations/{reg_id}")
    print(f"  GET /regulations/{reg_id}: {r_single.status_code}")
    if r_single.status_code == 200:
        single_data = r_single.json()
        print(f"    Name: {single_data.get('name')}, Current Version: {single_data.get('current_version_id')}")
    else:
        print(f"    Error: {r_single.text[:200]}")

    # Test GET requirements
    r_reqs = client.get(f"{base_url}/regulations/{reg_id}/requirements")
    print(f"  GET /regulations/{reg_id}/requirements: {r_reqs.status_code}")
    if r_reqs.status_code == 200:
        reqs_data = r_reqs.json()
        items = reqs_data.get("data", []) if isinstance(reqs_data, dict) else reqs_data
        print(f"    Requirements count: {len(items)}")
        if items:
            sample = items[0]
            print(f"    Sample: [{sample.get('reference_id')}] {sample.get('title') or sample.get('text', '')[:60]}")
    else:
        print(f"    Error: {r_reqs.text[:200]}")
