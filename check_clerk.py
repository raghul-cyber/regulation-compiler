import urllib.request
import urllib.error
import ssl
import json

ctx = ssl.create_default_context()
req = urllib.request.Request(
    'https://api.clerk.com/v1/users?limit=100',
    headers={
        'Authorization': 'Bearer sk_test_ttNdUqagkuUukRLZ5PsFjXkxAkeG1Z6bLFoBxbpEB0',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
)
try:
    with urllib.request.urlopen(req, context=ctx) as resp:
        users = json.loads(resp.read().decode())
        print(f"Total users found: {len(users)}")
        for u in users:
            uid = u.get("id")
            emails = [e["email_address"] for e in u.get("email_addresses", [])]
            banned = u.get("banned")
            locked = u.get("locked")
            status = u.get("status")
            print(f"ID: {uid} | Emails: {emails} | Banned: {banned} | Locked: {locked}")
except urllib.error.HTTPError as e:
    print("HTTPError:", e.code, e.reason, e.read().decode())
except Exception as e:
    print("Error:", e)
