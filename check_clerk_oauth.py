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
    '/v1/oauth_applications',
    '/v1/instance/organization_settings',
    '/v1/redirect_urls',
]

# Also let's check Clerk's public environment configuration:
# Usually at https://<frontend-api>/.well-known/clerk or similar, or Clerk API /v1/environment if accessible
for ep in endpoints:
    url = f'https://api.clerk.com{ep}'
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, context=ctx) as resp:
            data = json.loads(resp.read().decode())
            print(f"=== {ep} ===")
            print(json.dumps(data, indent=2))
    except Exception as ex:
        print(f"=== {ep} (Error) ===", ex)
