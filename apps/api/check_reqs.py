import sys
import os
sys.path.append(os.path.abspath('.'))

from app.db.session import SessionLocal
from app.models.regulations import Regulation, RegulationVersion
from app.models.requirements import Requirement

db = SessionLocal()
regs = db.query(Regulation).all()
for r in regs:
    print(f"Regulation: {r.name} ({r.id})")
    versions = db.query(RegulationVersion).filter(RegulationVersion.regulation_id == r.id).all()
    for v in versions:
        reqs = db.query(Requirement).filter(Requirement.regulation_version_id == v.id).count()
        print(f"  Version: {v.version_tag} ({v.id}) - Requirements: {reqs} - Status: {v.processing_status}")
