import urllib.request
import json
import time

base_url = "http://127.0.0.1:8080/api/v1"

print("--- 1. Testing GET /compliance/monitoring/global ---")
req = urllib.request.Request(f"{base_url}/compliance/monitoring/global")
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode("utf-8"))["data"]

jurisdictions = data["jurisdictions"]
print(f"Total monitored jurisdictions: {len(jurisdictions)}")
print(f"Active jurisdictions: {data['active_jurisdictions_count']}")
print(f"Overall compliance score: {data['overall_compliance_score']}%")
print(f"Telemetry latency: {data['telemetry']['network_latency_ms']} ms")

for j in jurisdictions:
    print(f"  [{j['code']}] {j['name']} -> Status: {j['status']}, Rules: {j['ruleset_count']}, Score: {j['compliance_score']}%")

print("\n--- 2. Testing GET /compliance/monitoring/feed ---")
req = urllib.request.Request(f"{base_url}/compliance/monitoring/feed?limit=15")
with urllib.request.urlopen(req) as resp:
    feed = json.loads(resp.read().decode("utf-8"))

feed_data = feed["data"]
print(f"Feed returned {len(feed_data)} live events.")
print(f"Telemetry status: {feed['telemetry']['stream_status']}")

for i, ev in enumerate(feed_data[:5]):
    print(f"  Event {i+1}: [{ev['jurisdiction']}] {ev['title']} ({ev['severity']}) - {ev['authority']}")

first_event_id = feed_data[0]["id"]

print("\n--- 3. Testing POST /compliance/monitoring/probe (On-demand Live Probe) ---")
probe_payload = json.dumps({"jurisdiction": "EU"}).encode("utf-8")
probe_req = urllib.request.Request(
    f"{base_url}/compliance/monitoring/probe",
    data=probe_payload,
    headers={"Content-Type": "application/json"}
)
with urllib.request.urlopen(probe_req) as resp:
    probe_res = json.loads(resp.read().decode("utf-8"))

print(f"Probe response: {probe_res['message']}")
print(f"New probe event ID: {probe_res['event']['id']}")

print("\n--- 4. Verifying Probe appears in Live Feed ---")
req = urllib.request.Request(f"{base_url}/compliance/monitoring/feed?limit=10")
with urllib.request.urlopen(req) as resp:
    fresh_feed = json.loads(resp.read().decode("utf-8"))["data"]

probe_in_feed = next((e for e in fresh_feed if e["id"] == probe_res["event"]["id"]), None)
assert probe_in_feed is not None, "Triggered probe event must be present in live feed!"
print(f"Found triggered probe in feed: [{probe_in_feed['jurisdiction']}] {probe_in_feed['title']} (ID: {probe_in_feed['id']})")
print("\nSUCCESS: Live Global Surveillance Engine is 100% active, dynamic, and verifiable!")
