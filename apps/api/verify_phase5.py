import os
import sys
import uuid
import json

sys.path.append(os.path.abspath('.'))

from app.db.session import SessionLocal
from app.models.requirements import Policy, Requirement, ComplianceCheck
from app.models.regulations import RegulationVersion
from app.models.organizations import Organization
from app.services.compliance import evaluate_policy_compliance, remediate_violation

db = SessionLocal()
org = db.query(Organization).first()
if not org:
    print("Org not found")
    sys.exit(1)

org_id = org.id

# Ensure we have a policy. Let's find one or create one.
policy = db.query(Policy).filter(Policy.org_id == org_id).first()

if not policy:
    print("No policy found. Creating one from an existing RegulationVersion...")
    reg_ver = db.query(RegulationVersion).first()
    if not reg_ver:
        print("No RegulationVersion found. Cannot test.")
        sys.exit(1)
        
    reqs = db.query(Requirement).filter(Requirement.regulation_version_id == reg_ver.id).all()
    policy = Policy(
        org_id=org_id,
        regulation_version_id=reg_ver.id,
        requirement_ids=[r.id for r in reqs],
        status="deployed"
    )
    db.add(policy)
    db.commit()
    db.refresh(policy)
    print(f"Created Policy: {policy.id}")
else:
    print(f"Using existing Policy: {policy.id}")

reqs = db.query(Requirement).filter(Requirement.id.in_(policy.requirement_ids)).all()
print(f"Policy has {len(reqs)} requirements.")

print("\n--- 1. Submitting test payload to trigger failure ---")
# Submit a payload that will definitely fail some (e.g. empty or unrelated payload)
bad_payload = {"random_key": "nothing useful"}

check = evaluate_policy_compliance(db, policy.id, bad_payload, org_id)
print(f"Created ComplianceCheck: {check.id}")

pass_count = sum(1 for v in check.violations.values() if v['status'] == 'pass')
fail_count = sum(1 for v in check.violations.values() if v['status'] == 'fail')
missing_count = sum(1 for v in check.violations.values() if v['status'] == 'fail' and v['gap'] == 'Missing Control')

print(f"Dashboard metrics computed in memory:")
print(f"Compliant: {pass_count}")
print(f"Non-Compliant: {fail_count - missing_count}")
print(f"Missing: {missing_count}")

print("\n--- 2. Cross-checking against direct DB query ---")
db.refresh(check)
db_pass = 0
db_fail = 0
db_missing = 0
for v in check.violations.values():
    if v['status'] == 'pass': db_pass += 1
    elif v['gap'] == 'Missing Control': db_missing += 1
    else: db_fail += 1

print(f"DB Output:")
print(f"Compliant: {db_pass}  (Matches: {db_pass == pass_count})")
print(f"Non-Compliant: {db_fail}  (Matches: {db_fail == (fail_count - missing_count)})")
print(f"Missing: {db_missing}  (Matches: {db_missing == missing_count})")

print("\n--- 3/4. Triggering Remediation Action ---")
# Find a failing requirement
failed_req_id = None
for req_id_str, v in check.violations.items():
    if v['status'] == 'fail':
        failed_req_id = uuid.UUID(req_id_str)
        break

if failed_req_id:
    print(f"Remediating Requirement: {failed_req_id}")
    new_check = remediate_violation(db, check.id, failed_req_id, {"fix_applied": True}, org_id)
    
    new_pass_count = sum(1 for v in new_check.violations.values() if v['status'] == 'pass')
    print(f"After remediation, compliant count changed from {db_pass} to {new_pass_count}")
    print(f"Persisted successfully? {new_pass_count == db_pass + 1}")
    
    # Verify the specific requirement status in DB
    db.refresh(new_check)
    req_status = new_check.violations[str(failed_req_id)]['status']
    print(f"Requirement {failed_req_id} status in DB: {req_status}")

print("\n--- 5. Confirming Policies view counts ---")
pol = db.query(Policy).filter(Policy.id == policy.id).first()
total_db_reqs = len(pol.requirement_ids)
print(f"Policy View UI count vs DB count: {len(reqs)} == {total_db_reqs}")

print("\n--- DONE ---")
