import uuid
import logging
from sqlalchemy.orm import Session
from app.models.requirements import ComplianceCheck, ComplianceResultEnum, Policy, Requirement
import json

logger = logging.getLogger(__name__)

def evaluate_policy_compliance(db: Session, policy_id: uuid.UUID, payload: dict, org_id: uuid.UUID) -> ComplianceCheck:
    policy = db.query(Policy).filter(
        Policy.id == policy_id,
        (Policy.org_id == org_id) | (Policy.org_id.is_(None))
    ).first()
    if not policy:
        raise ValueError("Policy not found")

    requirements = db.query(Requirement).filter(Requirement.id.in_(policy.requirement_ids)).all()
    if not requirements:
        raise ValueError("No requirements mapped to this policy")

    violations = {}
    pass_count = 0
    fail_count = 0

    def evaluate_ast(node: dict, payload: dict) -> tuple[str, list]:
        if not node:
            return ("pass", [])
            
        operator = node.get("operator", "LEAF").upper()
        if operator == "LEAF":
            field = str(node.get("field", ""))
            op = node.get("op", "==")
            expected = node.get("value")
            
            actual = payload.get(field)
            if actual is None:
                for k, v in payload.items():
                    if k.lower().replace(" ", "_") == field.lower().replace(" ", "_"):
                        actual = v
                        break
            
            if actual is None:
                return ("unknown", [{
                    "field": field, 
                    "expected": expected, 
                    "reason": "Missing evidence/data in customer profile"
                }])
            
            is_pass = False
            if op == "==":
                is_pass = (actual == expected)
            elif op == "!=":
                is_pass = (actual != expected)
            elif op == ">":
                is_pass = (actual is not None and expected is not None and actual > expected)
            elif op == "<":
                is_pass = (actual is not None and expected is not None and actual < expected)
            elif op == ">=":
                is_pass = (actual is not None and expected is not None and actual >= expected)
            elif op == "<=":
                is_pass = (actual is not None and expected is not None and actual <= expected)
            
            if is_pass:
                return ("pass", [])
            else:
                return ("fail", [{
                    "field": field,
                    "expected": expected,
                    "actual": actual,
                    "reason": f"Active control failure: {actual} {op} {expected} is false"
                }])
                
        elif operator == "AND":
            operands = node.get("operands", [])
            overall_status = "pass"
            all_failures = []
            
            for o in operands:
                o_status, o_fails = evaluate_ast(o, payload)
                if o_status != "pass":
                    if o_status == "unknown" and overall_status != "fail":
                        overall_status = "unknown"
                    elif o_status == "fail":
                        overall_status = "fail"
                    all_failures.extend(o_fails)
                    
            return (overall_status, all_failures)
            
        elif operator == "OR":
            operands = node.get("operands", [])
            if not operands:
                return ("pass", [])
                
            all_failures = []
            has_unknown = False
            
            for o in operands:
                o_status, o_fails = evaluate_ast(o, payload)
                if o_status == "pass":
                    return ("pass", []) 
                elif o_status == "unknown":
                    has_unknown = True
                all_failures.extend(o_fails)
                
            return ("unknown" if has_unknown else "fail", all_failures)
            
        elif operator == "NOT":
            operands = node.get("operands", [])
            if not operands:
                return ("pass", [])
                
            o_status, o_fails = evaluate_ast(operands[0], payload)
            if o_status == "pass":
                return ("fail", [{"reason": "NOT condition failed"}])
            elif o_status == "unknown":
                return ("unknown", o_fails)
            else:
                return ("pass", [])
            
        return ("fail", [{"reason": "Unknown operator"}])

    for req in requirements:
        conditions_ast = req.conditions if isinstance(req.conditions, dict) else {}
        
        status, failed_conditions = evaluate_ast(conditions_ast, payload)
        
        if status == "pass":
            pass_count += 1
            violations[str(req.id)] = {
                "status": "pass",
                "gap_id": None,
                "gap_type": None,
                "failed_conditions": [],
                "recommended_action": None
            }
        else:
            fail_count += 1
            gap_id = f"GAP-{uuid.uuid4().hex[:8].upper()}"
            
            actions_dict = req.actions if isinstance(req.actions, dict) else {}
            evidence_dict = req.evidence_required if isinstance(req.evidence_required, dict) else {}
            
            remediation = "Please review your system configuration and apply required controls."
            if actions_dict:
                remediation = f"Execute required actions: {actions_dict}"
            elif evidence_dict:
                remediation = f"Provide required evidence: {evidence_dict}"
                
            gap_type = "Missing Evidence/Data" if status == "unknown" else "Control Failure"
            
            violations[str(req.id)] = {
                "status": status,
                "gap_id": gap_id,
                "gap_type": gap_type,
                "failed_conditions": failed_conditions,
                "recommended_action": remediation
            }

    if fail_count == 0:
        overall_result = ComplianceResultEnum.pass_
    elif pass_count == 0:
        overall_result = ComplianceResultEnum.fail
    else:
        overall_result = ComplianceResultEnum.partial

    check = ComplianceCheck(
        org_id=org_id,
        policy_id=policy.id,
        input_payload_ref=json.dumps(payload),
        result=overall_result,
        violations=violations
    )
    db.add(check)
    db.commit()
    db.refresh(check)

    return check
def remediate_violation(db: Session, check_id: uuid.UUID, requirement_id: uuid.UUID, remediation_payload: dict, org_id: uuid.UUID) -> ComplianceCheck:
    check = db.query(ComplianceCheck).filter(ComplianceCheck.id == check_id, ComplianceCheck.org_id == org_id).first()
    if not check:
        raise ValueError("Compliance check not found")

    req = db.query(Requirement).filter(Requirement.id == requirement_id).first()
    if not req:
        raise ValueError("Requirement not found")

    # Update payload
    current_payload = json.loads(check.input_payload_ref) if check.input_payload_ref else {}
    current_payload.update(remediation_payload)
    check.input_payload_ref = json.dumps(current_payload)

    # Re-evaluate the specific requirement using AST engine
    conditions_ast = req.conditions if isinstance(req.conditions, dict) else {}
    
    # We must replicate evaluate_ast logic or just call evaluate_policy_compliance again.
    # W15 says: "when a real user marks a real gap as real remediated (with real updated customer data/evidence), this must real trigger a real re-run of W11 for real that specific requirement... and the real result must real propagate back into W12/W13/W14 real automatically"
    # Actually, the easiest way is to just call evaluate_policy_compliance again for the whole policy, or run evaluate_ast locally.
    # Since evaluate_ast is nested, let's just trigger a full re-evaluate of the policy to ensure everything is in sync.
    
    new_check = evaluate_policy_compliance(db, check.policy_id, current_payload, org_id)
    return new_check
