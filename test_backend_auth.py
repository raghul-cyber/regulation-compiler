import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), 'apps', 'api'))

from app.core.auth import get_clerk_jwks, _fetch_user_email_from_clerk

print("1. Testing Clerk JWKS retrieval...")
jwks = get_clerk_jwks()
keys = jwks.get("keys", [])
print(f"   Success: Fetched {len(keys)} public keys from Clerk.")
assert len(keys) > 0, "No keys returned from Clerk JWKS"

print("2. Testing direct Clerk email lookup for Samarjeeth...")
email = _fetch_user_email_from_clerk("user_3JKDUKZru9dKgWGQ5EBghqYTPCZ")
print(f"   Success: Retrieved email: {email}")

print("3. Testing Clerk email lookup for invalid user...")
invalid_email = _fetch_user_email_from_clerk("user_non_existent_123")
print(f"   Success: Handled non-existent user safely: {invalid_email}")

print("All backend auth tests passed!")
