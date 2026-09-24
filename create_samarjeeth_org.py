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

req = urllib.request.Request(
    'https://api.clerk.com/v1/organizations',
    headers=headers,
    method='POST',
    data=json.dumps({
        'name': "Samarjeeth's Organization",
        'created_by': 'user_3JKDUKZru9dKgWGQ5EBghqYTPCZ'
    }).encode()
)
try:
    with urllib.request.urlopen(req, context=ctx) as resp:
        print('Success:', resp.read().decode())
except urllib.error.HTTPError as e:
    print('HTTPError:', e.code, e.reason, e.read().decode())
except Exception as e:
    print('Error:', e)
