import os
import jwt
import time
import requests
from dotenv import load_dotenv

load_dotenv("apps/api/.env")

clerk_secret = os.getenv("CLERK_SECRET_KEY")
if not clerk_secret:
    print("CLERK_SECRET_KEY not found")
    exit(1)

# Generate a fake token using the secret (if it's RS256, we need private key, if it's test mode it might accept something else).
# Wait, Clerk uses RS256 and the CLERK_SECRET_KEY is just for API calls to clerk.com, not for signing JWTs.
# The backend verifies JWTs by fetching the JWKS from clerk.com.
print("Clerk Secret:", clerk_secret[:10] + "...")
