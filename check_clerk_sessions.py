import urllib.request
import urllib.error
import ssl
import json

ctx = ssl.create_default_context()
headers = {
    'Authorization': 'Bearer sk_test_ttNdUqagkuUukRLZ5PsFjXkxAkeG1Z6bLFoBxbpEB0',
    'User-Agent': 'Mozilla/5.0'
}

def query(endpoint):
    url = f'https://api.clerk.com{endpoint}'
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, context=ctx) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        return f"HTTP {e.code}: {e.read().decode()}"
    except Exception as e:
        return str(e)

for ep in ['/v1/sessions?limit=20', '/v1/clients?limit=20', '/v1/users?email_address=samarjeeth06@gmail.com', '/v1/invitations?email_address=samarjeeth06@gmail.com']:
    res = query(ep)
    print(f"=== {ep} ===")
    print(json.dumps(res, indent=2) if isinstance(res, (dict, list)) else res)
