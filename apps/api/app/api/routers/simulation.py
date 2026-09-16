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
from app.models.organizations import User
from app.services.mirofish_simulator import mirofish_engine
from app.core.cache import ResponseCache

logger = logging.getLogger("api.simulation")

router = APIRouter(prefix="/simulation", tags=["simulation"])


class SwarmRunRequest(BaseModel):
    rounds: int = Field(default=3, ge=1, le=10, description="Number of simulation cycles to execute")
    target_policy_id: Optional[str] = Field(default=None, description="Optional target policy UUID to stress test")


@router.get("/swarm/agents")
def get_swarm_agents():
    """
    Returns the active roster of 10 MiroFish autonomous swarm personas
    and their technical operational baselines.
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
    current_user: Optional[User] = Depends(get_optional_current_user)
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
def get_recent_swarm_runs():
    """
    Returns the list of recent MiroFish swarm simulation runs.
    """
    recent_runs = ResponseCache.get("mirofish:recent_runs") or []
    return {
        "status": "success",
        "total_runs": len(recent_runs),
        "data": recent_runs,
        "runs": recent_runs
    }


@router.get("/swarm/report/{run_id}")
def get_swarm_run_report(run_id: str):
    """
    Retrieves the full synthesized ReportAgent output for a completed simulation run.
    """
    report = ResponseCache.get(f"mirofish:run:{run_id}")
    if not report:
        raise HTTPException(status_code=404, detail=f"Simulation run '{run_id}' not found or expired.")
    return {
        "status": "success",
        "data": report,
        "report": report
    }
