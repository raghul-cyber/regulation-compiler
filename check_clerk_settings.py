import urllib.request
import urllib.error
import ssl
import json

ctx = ssl.create_default_context()
headers = {
    'Authorization': 'Bearer sk_test_ttNdUqagkuUukRLZ5PsFjXkxAkeG1Z6bLFoBxbpEB0',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}

endpoints = [
    '/v1/allowlist_identifiers',
    '/v1/blocklist_identifiers',
    '/v1/invitations',
    '/v1/oauth_applications',
    '/v1/instance',
    '/v1/instance/restrictions',
    '/v1/instance/organization_settings',
]

for ep in endpoints:
    url = f'https://api.clerk.com{ep}'
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, context=ctx) as resp:
            data = json.loads(resp.read().decode())
            print(f"=== {ep} (200 OK) ===")
            print(json.dumps(data, indent=2))
    except urllib.error.HTTPError as e:
        print(f"=== {ep} ({e.code} {e.reason}) ===")
        try:
            print(e.read().decode())
        except:
            pass
    except Exception as ex:
        print(f"=== {ep} (Error) ===", ex)
