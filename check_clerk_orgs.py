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
        print(f"Error {endpoint}: {e.code} {e.reason} {e.read().decode()}")
        return None
    except Exception as e:
        print(f"Error {endpoint}: {e}")
        return None

orgs = query('/v1/organizations?limit=100')
if orgs:
    print(f"Total orgs: {orgs.get('total_count')}")
    for org in orgs.get('data', []):
        print(f"Org: {org.get('id')} - {org.get('name')} - Members: {org.get('members_count')}")
        # check members
        members = query(f"/v1/organizations/{org.get('id')}/memberships")
        if members:
            for m in members.get('data', []):
                pub_data = m.get('public_user_data', {})
                print(f"   Member: {pub_data.get('user_id')} - {pub_data.get('identifier')} - Role: {m.get('role')}")
