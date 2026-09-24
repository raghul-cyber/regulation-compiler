import urllib.request
import urllib.error
import ssl
import json

ctx = ssl.create_default_context()
headers = {
    'Authorization': 'Bearer sk_test_ttNdUqagkuUukRLZ5PsFjXkxAkeG1Z6bLFoBxbpEB0',
    'User-Agent': 'Mozilla/5.0',
    'Content-Type': 'application/json'
}

def query(endpoint, method='GET', data=None):
    url = f'https://api.clerk.com{endpoint}'
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, headers=headers, method=method, data=body)
    try:
        with urllib.request.urlopen(req, context=ctx) as resp:
            return json.loads(resp.read().decode())
    except Exception as e:
        print(f"Error {method} {endpoint}: {e}")
        return None

users = query('/v1/users?limit=100')
orgs = query('/v1/organizations?limit=100')
existing_org_creators = set()
if orgs and 'data' in orgs:
    for o in orgs['data']:
        if o.get('created_by'):
            existing_org_creators.add(o.get('created_by'))

print(f"Total users: {len(users)}, Orgs count: {len(existing_org_creators)}")

for u in users:
    uid = u['id']
    if uid not in existing_org_creators:
        email = u.get('email_addresses', [{}])[0].get('email_address', 'User')
        name = u.get('first_name') or email.split('@')[0]
        org_name = f"{name}'s Organization"
        print(f"Creating org for {uid} ({email}) -> {org_name}")
        res = query('/v1/organizations', method='POST', data={
            'name': org_name,
            'created_by': uid
        })
        print("Result:", res.get('id') if res else "Failed")

print("All users now have organizations!")
