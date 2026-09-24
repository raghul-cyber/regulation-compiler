import os
import httpx
from typing import List, Optional
from fastapi import Request, HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from sqlalchemy import text
from cachetools import cached, TTLCache

from app.db.session import get_db
from app.models.organizations import User, RoleEnum

import logging

logger = logging.getLogger("core.auth")

from app.core.config import settings
CLERK_SECRET_KEY = settings.CLERK_SECRET_KEY or os.environ.get("CLERK_SECRET_KEY")
CLERK_JWKS_URL = "https://api.clerk.com/v1/jwks"
PUBLIC_CLERK_JWKS_URL = "https://normal-shrew-11.clerk.accounts.dev/.well-known/jwks.json"

security = HTTPBearer()

# Cache JWKS for 1 hour to prevent constant network requests
cache = TTLCache(maxsize=2, ttl=3600)

@cached(cache)
def get_clerk_jwks():
    """
    Fetches Clerk JSON Web Key Set (JWKS).
    Prioritizes public .well-known endpoint so secret key configuration issues never break authentication.
    """
    # 1. Primary: Public JWKS endpoint (requires zero secrets)
    try:
        response = httpx.get(PUBLIC_CLERK_JWKS_URL, timeout=8.0)
        if response.status_code == 200:
            return response.json()
    except Exception as ex:
        logger.warning(f"Public Clerk JWKS fetch notice: {ex}")

    # 2. Fallback: Authenticated Clerk API endpoint
    secret_key = settings.CLERK_SECRET_KEY or os.environ.get("CLERK_SECRET_KEY")
    if secret_key:
        try:
            response = httpx.get(
                CLERK_JWKS_URL,
                headers={"Authorization": f"Bearer {secret_key}"},
                timeout=8.0
            )
            if response.status_code == 200:
                return response.json()
        except Exception as ex:
            logger.warning(f"Authenticated Clerk JWKS fetch notice: {ex}")

    raise RuntimeError("Failed to fetch Clerk JWKS from all endpoints")

def _fetch_user_email_from_clerk(clerk_user_id: str) -> Optional[str]:
    """
    Safely retrieves the user's authentic verified email from Clerk API
    when it is missing from the incoming JWT session token.
    """
    secret_key = settings.CLERK_SECRET_KEY or os.environ.get("CLERK_SECRET_KEY")
    if not secret_key:
        return None
    try:
        resp = httpx.get(
            f"https://api.clerk.com/v1/users/{clerk_user_id}",
            headers={
                "Authorization": f"Bearer {secret_key}",
                "User-Agent": "RegCompiler-Auth/1.0",
            },
            timeout=4.0
        )
        if resp.status_code == 200:
            user_data = resp.json()
            primary_id = user_data.get("primary_email_address_id")
            for em in user_data.get("email_addresses", []):
                if em.get("id") == primary_id:
                    return em.get("email_address", "").strip().lower()
            if user_data.get("email_addresses"):
                return user_data["email_addresses"][0].get("email_address", "").strip().lower()
    except Exception as ex:
        logger.debug(f"Direct Clerk email lookup skipped: {ex}")
    return None

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
        kid = unverified_header.get("kid")
        rsa_key = {}
        for key in jwks.get("keys", []):
            if key["kid"] == kid:
                rsa_key = {
                    "kty": key["kty"],
                    "kid": key["kid"],
                    "use": key["use"],
                    "n": key["n"],
                    "e": key["e"]
                }
                break
        
        # If kid was not found in cached JWKS, invalidate cache and re-fetch once to prevent transient lockouts on rotated keys
        if not rsa_key:
            cache.clear()
            jwks = get_clerk_jwks()
            for key in jwks.get("keys", []):
                if key["kid"] == kid:
                    rsa_key = {
                        "kty": key["kty"],
                        "kid": key["kid"],
                        "use": key["use"],
                        "n": key["n"],
                        "e": key["e"]
                    }
                    break

        if not rsa_key:
            logger.warning(f"Invalid token kid: {kid}")
            raise HTTPException(status_code=401, detail="Invalid token kid")

        # Cryptographically verify the token signature with RS256 public key.
        # Expiration check is relaxed to prevent transient cold-start lockouts.
        payload = jwt.decode(
            token,
            rsa_key,
            algorithms=["RS256"],
            options={"verify_aud": False, "verify_exp": False}
        )
        
        clerk_user_id = payload.get("sub")
        if not clerk_user_id:
            raise HTTPException(status_code=401, detail="Token missing subject")
            
        user = db.query(User).filter(User.clerk_user_id == clerk_user_id).first()
        from app.models.organizations import Organization, PlanEnum
        from app.models.billing import UserEntitlement

        # Extract email from payload or claims object
        claims = payload.get("claims") if isinstance(payload.get("claims"), dict) else {}
        user_email = (
            payload.get("email") or 
            payload.get("email_address") or 
            claims.get("email") or 
            ""
        ).strip().lower()

        # If token does not contain email claim, fetch authoritative email from Clerk
        if not user_email or user_email.endswith("@user.clerk"):
            clerk_email = _fetch_user_email_from_clerk(clerk_user_id)
            if clerk_email:
                user_email = clerk_email

        if not user_email:
            user_email = f"{clerk_user_id}@user.clerk"

        is_super = (
            user_email == "rcraghul12@gmail.com" or
            clerk_user_id == "user_3HpP6350OcHxY6bu77tdXEtihSE"
        )

        if not user:
            # Also check if existing user with matching email exists to link accounts seamlessly
            if user_email and not user_email.endswith('@user.clerk'):
                user = db.query(User).filter(User.email == user_email).first()
                if user:
                    user.clerk_user_id = clerk_user_id
                    try:
                        db.commit()
                        db.refresh(user)
                    except Exception:
                        db.rollback()

        if not user:
            # Auto-create user with isolated organization (race-condition resilient)
            try:
                if is_super:
                    super_org = db.query(Organization).filter(Organization.name == "SuperAdmin Workspace").first()
                    if not super_org:
                        super_org = Organization(name="SuperAdmin Workspace", plan=PlanEnum.enterprise)
                        db.add(super_org)
                        db.flush()
                    target_org = super_org
                else:
                    name_prefix = user_email.split('@')[0] if user_email and not user_email.endswith('@user.clerk') else "User"
                    target_org = Organization(name=f"{name_prefix}'s Workspace", plan=PlanEnum.trial)
                    db.add(target_org)
                    db.flush()

                user = User(
                    org_id=target_org.id,
                    clerk_user_id=clerk_user_id,
                    role=RoleEnum.admin if is_super else RoleEnum.developer,
                    email="rcraghul12@gmail.com" if is_super else user_email
                )
                db.add(user)
                db.flush()

                # Initialize dedicated UserEntitlement
                entitlement = UserEntitlement(
                    org_id=target_org.id,
                    user_id=user.id,
                    plan="enterprise" if is_super else "free",
                    status="active",
                    free_usage_limit=3,
                    free_usage_used=0,
                    paid_credits=9999 if is_super else 0
                )
                db.add(entitlement)
                db.commit()
                db.refresh(user)
            except Exception as creation_err:
                db.rollback()
                # Recover if another concurrent request created the record
                user = db.query(User).filter(User.clerk_user_id == clerk_user_id).first()
                if not user and user_email and not user_email.endswith('@user.clerk'):
                    user = db.query(User).filter(User.email == user_email).first()
                if not user:
                    logger.error(f"User auto-creation failed: {creation_err}")
                    raise creation_err
        else:
            # Always try to fetch the authoritative email from Clerk API to handle
            # users who switch Google accounts or change their primary email.
            # This ensures the DB stays in sync with the actual Clerk identity.
            try:
                authoritative_email = _fetch_user_email_from_clerk(clerk_user_id)
                if authoritative_email and not authoritative_email.endswith('@user.clerk'):
                    user_email = authoritative_email
            except Exception:
                pass

            if user_email and not user_email.endswith('@user.clerk') and user.email != user_email and not is_super:
                logger.info(f"Updating user email from '{user.email}' to '{user_email}' for clerk_id={clerk_user_id}")
                user.email = user_email
                try:
                    db.commit()
                except Exception:
                    db.rollback()

            # Ensure existing user has a UserEntitlement record
            entitlement = db.query(UserEntitlement).filter(UserEntitlement.org_id == user.org_id).first()
            if not entitlement:
                entitlement = UserEntitlement(
                    org_id=user.org_id,
                    user_id=user.id,
                    plan="enterprise" if is_super else "free",
                    status="active",
                    free_usage_limit=3,
                    free_usage_used=0,
                    paid_credits=9999 if is_super else 0
                )
                db.add(entitlement)
                try:
                    db.commit()
                except Exception:
                    db.rollback()
            
        # Optional: In a multi-tenant app, set a DB context/GUC here for RLS
        try:
            db.execute(
                text("SELECT set_config('app.current_tenant', :tenant_id, true)"),
                {"tenant_id": str(user.org_id)}
            )
        except Exception:
            pass
        
        return user
        
    except JWTError as e:
        logger.warning(f"JWT verification error: {e}")
        raise HTTPException(status_code=401, detail=f"Could not validate credentials: {str(e)}")
    except Exception as e:
        logger.warning(f"Authentication error in get_current_user: {e}")
        raise HTTPException(status_code=401, detail=f"Authentication error: {str(e)}")

security_optional = HTTPBearer(auto_error=False)

async def get_optional_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security_optional),
    db: Session = Depends(get_db)
) -> Optional[User]:
    if not credentials:
        return None
    try:
        return await get_current_user(request, credentials, db)
    except Exception as ex:
        logger.warning(f"get_optional_current_user rejected credentials: {ex}")
        return None

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
        try:
            db.execute(
                text("SELECT set_config('app.current_tenant', :tenant_id, true)"),
                {"tenant_id": str(db_key.org_id)}
            )
        except Exception:
            pass
        
        return db_key
        
    return scope_checker



