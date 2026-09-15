import os
from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address

def get_rate_limit_key(request: Request) -> str:
    """
    Keys rate limits by authenticated user/token if available,
    falling back to remote client IP.
    """
    auth_hdr = request.headers.get("Authorization", "")
    if auth_hdr.startswith("Bearer "):
        # Use token slice as key
        return f"tok:{auth_hdr[-16:]}"
    api_key = request.headers.get("X-API-Key", "")
    if api_key:
        return f"key:{api_key[-16:]}"
    return get_remote_address(request) or "127.0.0.1"


redis_url = os.getenv("REDIS_URL")
# Slowapi supports storage_uri; if redis is unreachable or not set, memory:// is used
storage_uri = redis_url if (redis_url and "redis://" in redis_url) else "memory://"

limiter = Limiter(
    key_func=get_rate_limit_key,
    default_limits=["120/minute"],
    storage_uri=storage_uri,
    strategy="moving-window"
)
