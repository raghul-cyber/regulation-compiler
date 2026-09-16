import sys
import os

# Ensure app is in path
sys.path.insert(0, os.path.abspath("."))

from app.services.mirofish_simulator import mirofish_engine
from app.db.session import SessionLocal
from app.models.requirements import ComplianceCheck
from app.models.audit import AuditLog

def verify():
    print("1. Verifying Persona count...")
    personas = mirofish_engine.get_personas()
    assert len(personas) == 10, f"Expected 10 personas, got {len(personas)}"
    print(f"   Success: {len(personas)} MiroFish swarm personas loaded.")
    for p in personas:
        print(f"   - Agent {p['agent_id']}: {p['name']} ({p['archetype']})")

    print("\n2. Executing Real Multi-Agent Swarm Simulation (NO MOCKS)...")
    db = SessionLocal()
    try:
        # Run 2 rounds with 10 agents = 20 evaluations + remediations + audits
        report = mirofish_engine.run_swarm_simulation(db=db, rounds=2)
        assert report is not None
        run_id = report["run_id"]
        total_evals = report["total_traffic_requests"]
        print(f"   Run ID: {run_id}")
        print(f"   Total evaluations executed: {total_evals}")
        print(f"   Initial compliance: {report['round_summaries'][0]['round_compliance_rate']}%")
        print(f"   Final compliance: {report['round_summaries'][-1]['round_compliance_rate']}%")
        print(f"   Convergence delta: {report['convergence_delta']}%")
        
        # Verify real database records
        checks_count = db.query(ComplianceCheck).count()
        audits_count = db.query(AuditLog).filter(AuditLog.action.like("swarm_sim_%")).count()
        print(f"   DB ComplianceCheck total records: {checks_count}")
        print(f"   DB Swarm AuditLog records created: {audits_count}")
        assert audits_count > 0, "Expected swarm audit logs to be saved in PostgreSQL"

        # Verify ReportAgent synthesis
        print("\n3. Verifying ReportAgent Synthesis...")
        print(f"   Executive Summary: {report.get('executive_summary')}")
        print(f"   Convergence Trajectory: {len(report.get('trajectory', []))} points")
        print(f"   Vulnerability Hotspots: {len(report.get('vulnerability_hotspots', []))} hotspots found")
        print(f"   Resilience Rankings: {len(report.get('resilience_rankings', []))} agents ranked")

        print("\nALL BACKEND MIROFISH SWARM CHECKS PASSED!")
    finally:
        db.close()

if __name__ == "__main__":
    verify()
