"""
MiroFish Swarm Simulation API Router
Exposes multi-agent swarm intelligence simulation endpoints for regulatory traffic generation.
"""

import uuid
import logging
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.auth import get_optional_current_user
from app.models.organizations import User, RoleEnum
from app.services.mirofish_simulator import mirofish_engine
from app.core.cache import ResponseCache

logger = logging.getLogger("api.simulation")

router = APIRouter(prefix="/simulation", tags=["simulation"])

SUPER_ADMIN_EMAIL = "rcraghul12@gmail.com"
SUPER_ADMIN_CLERK_ID = "user_3HpP6350OcHxY6bu77tdXEtihSE"


def verify_simulation_admin(
    current_user: Optional[User] = Depends(get_optional_current_user)
) -> Optional[User]:
    """
    Ensures that only system administrators can access MiroFish Swarm simulation endpoints.
    If authenticated, non-admin accounts receive HTTP 403 Forbidden.
    """
    if current_user:
        email = (current_user.email or "").strip().lower()
        is_super = (
            email == SUPER_ADMIN_EMAIL.lower()
            or current_user.clerk_user_id == SUPER_ADMIN_CLERK_ID
        )
        if not is_super:
            logger.warning(f"MiroFish Swarm simulation access denied for non-admin user {current_user.id} ({email})")
            raise HTTPException(
                status_code=403,
                detail=f"Administrative clearance required. MiroFish Swarm simulation is restricted exclusively to system administrator ({SUPER_ADMIN_EMAIL})."
            )
    return current_user


class SwarmRunRequest(BaseModel):
    rounds: int = Field(default=3, ge=1, le=10, description="Number of simulation cycles to execute")
    target_policy_id: Optional[str] = Field(default=None, description="Optional target policy UUID to stress test")


@router.get("/swarm/agents")
def get_swarm_agents(
    current_user: Optional[User] = Depends(verify_simulation_admin)
):
    """
    Returns the active roster of 10 MiroFish autonomous swarm personas
    and their technical operational baselines. Restricted to administrators.
    """
    personas = mirofish_engine.get_personas()
    return {
        "status": "success",
        "total_agents": len(personas),
        "agents": personas,
        "data": personas
    }


@router.post("/swarm/run")
def run_swarm_simulation_endpoint(
    body: Optional[SwarmRunRequest] = None,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(verify_simulation_admin)
):
    """
    Launches a real MiroFish multi-agent swarm simulation (NO MOCKS).
    Executes real compliance evaluations, rule checks, and database audits across 10 agents.
    """
    rounds = body.rounds if body else 3
    policy_uuid = None
    if body and body.target_policy_id:
        try:
            policy_uuid = uuid.UUID(body.target_policy_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid target_policy_id UUID format")

    org_id = current_user.org_id if current_user else None

    try:
        report = mirofish_engine.run_swarm_simulation(
            db=db,
            rounds=rounds,
            target_policy_id=policy_uuid,
            org_id=org_id
        )
        return {
            "status": "success",
            "message": f"MiroFish Swarm simulation successfully executed across {report['total_agents']} agents.",
            "data": report,
            "report": report
        }
    except Exception as e:
        logger.error(f"MiroFish simulation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Simulation error: {str(e)}")


@router.get("/swarm/runs")
def get_recent_swarm_runs(
    current_user: Optional[User] = Depends(verify_simulation_admin)
):
    """
    Returns the list of recent MiroFish swarm simulation runs. Restricted to administrators.
    """
    recent_runs = ResponseCache.get("mirofish:recent_runs") or []
    return {
        "status": "success",
        "total_runs": len(recent_runs),
        "data": recent_runs,
        "runs": recent_runs
    }


@router.get("/swarm/report/{run_id}")
def get_swarm_run_report(
    run_id: str,
    current_user: Optional[User] = Depends(verify_simulation_admin)
):
    """
    Retrieves the full synthesized ReportAgent output for a completed simulation run. Restricted to administrators.
    """
    report = ResponseCache.get(f"mirofish:run:{run_id}")
    if not report:
        raise HTTPException(status_code=404, detail=f"Simulation run '{run_id}' not found or expired.")
    return {
        "status": "success",
        "data": report,
        "report": report
    }
