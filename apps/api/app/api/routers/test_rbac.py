from fastapi import APIRouter, Depends
from app.core.auth import require_role, get_current_user
from app.models.organizations import RoleEnum

router = APIRouter(prefix="/test", tags=["test"])

@router.get("/protected")
async def protected_route(current_user=Depends(get_current_user)):
    return {"message": "You are authenticated!"}

@router.get("/admin-only")
async def admin_only_route(current_user=Depends(require_role([RoleEnum.admin]))):
    return {"message": "Welcome Admin!"}

@router.get("/developer-only")
async def developer_only_route(current_user=Depends(require_role([RoleEnum.developer]))):
    return {"message": "Welcome Developer!"}
