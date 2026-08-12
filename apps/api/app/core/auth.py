import os
import httpx
from typing import List, Optional
from fastapi import Request, HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from cachetools import cached, TTLCache

from app.db.session import get_db
from app.models.organizations import User, RoleEnum

CLERK_SECRET_KEY = os.environ.get("CLERK_SECRET_KEY")
CLERK_JWKS_URL = "https://api.clerk.com/v1/jwks"

security = HTTPBearer()

# Cache JWKS for 1 hour to prevent constant network requests
cache = TTLCache(maxsize=1, ttl=3600)

@cached(cache)
def get_clerk_jwks():
    if not CLERK_SECRET_KEY:
        raise ValueError("CLERK_SECRET_KEY is not set")
    
    response = httpx.get(
        CLERK_JWKS_URL,
        headers={"Authorization": f"Bearer {CLERK_SECRET_KEY}"},
        timeout=10.0
    )
    if response.status_code != 200:
        raise RuntimeError("Failed to fetch Clerk JWKS")
    return response.json()

async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db)
) -> User:
    token = credentials.credentials
    try:
        jwks = get_clerk_jwks()
        
        # Get the unverified header to extract the kid
        unverified_header = jwt.get_unverified_header(token)
        rsa_key = {}
        for key in jwks.get("keys", []):
            if key["kid"] == unverified_header["kid"]:
                rsa_key = {
                    "kty": key["kty"],
                    "kid": key["kid"],
                    "use": key["use"],
                    "n": key["n"],
                    "e": key["e"]
                }
                break
        
        if not rsa_key:
            raise HTTPException(status_code=401, detail="Invalid token kid")

        # Verify the token
        payload = jwt.decode(
            token,
            rsa_key,
            algorithms=["RS256"],
            options={"verify_aud": False}  # Adjust audience verification as needed
        )
        
        clerk_user_id = payload.get("sub")
        if not clerk_user_id:
            raise HTTPException(status_code=401, detail="Token missing subject")
            
        # Fetch the user from the database
        user = db.query(User).filter(User.clerk_user_id == clerk_user_id).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found in local database")
            
        # Optional: In a multi-tenant app, we might set a DB context/GUC here for RLS
        db.execute(
            "SELECT set_config('app.current_tenant', :tenant_id, true)",
            {"tenant_id": str(user.org_id)}
        )
        
        return user
        
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Could not validate credentials: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication error: {str(e)}")

def require_role(allowed_roles: List[RoleEnum]):
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=403, 
                detail=f"User role {current_user.role} is not permitted to access this resource"
            )
        return current_user
    return role_checker

from fastapi.security import APIKeyHeader
import hashlib

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

def require_scope(allowed_scopes: List[str]):
    async def scope_checker(
        request: Request,
        api_key: str = Security(api_key_header),
        db: Session = Depends(get_db)
    ):
        if not api_key:
            raise HTTPException(status_code=401, detail="Missing API Key")
        
        # Hash the incoming key
        key_hash = hashlib.sha256(api_key.encode()).hexdigest()
        
        from app.models.audit import ApiKey
        db_key = db.query(ApiKey).filter(ApiKey.key_hash == key_hash).first()
        if not db_key or db_key.revoked_at:
            raise HTTPException(status_code=401, detail="Invalid or revoked API Key")
            
        # Scope check
        has_scope = False
        for scope in allowed_scopes:
            if scope in db_key.scopes or "admin" in db_key.scopes:
                has_scope = True
                break
                
        if not has_scope:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
            
        # Optional: In a multi-tenant app, we might set a DB context/GUC here for RLS
        db.execute(
            "SELECT set_config('app.current_tenant', :tenant_id, true)",
            {"tenant_id": str(db_key.org_id)}
        )
        
        return db_key
        
    return scope_checker

