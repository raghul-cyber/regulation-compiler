import re
import html
from bs4 import BeautifulSoup
import sys, os

sys.path.insert(0, 'apps/api')
from app.db.session import SessionLocal
from app.models.regulations import Regulation
from app.models.requirements import Requirement

def clean_regulatory_text(val: str) -> str:
    if not val:
        return ""
    text = str(val)
    # Strip HTML tags
    text = re.sub(r'</?[a-zA-Z0-9_\-]+(?:\s+[^>]*)?/?>?', ' ', text)
    # Strip leading/trailing orphan HTML fragments like '/div>', '="4%"/>'
    text = re.sub(r'^\s*(?:/?(?:div|col|tbody|tr|td|p|span|table|body|html|thead)\b\s*>|="[^"]*"\s*/?>|\s*>\s*)+', '', text, flags=re.IGNORECASE)
    text = re.sub(r'\b[a-zA-Z0-9_\-]+="[^"]*"\s*/?>?', ' ', text)
    text = re.sub(r'="[^"]*"\s*/?>?', ' ', text)
    # Unescape HTML entities
    text = html.unescape(text)
    # Clean leftover prefixes like 'Obligation Control 1: /div>'
    text = re.sub(r'^Obligation Control \d+:\s*(?:/?(?:div|col|tbody|tr|td|p|span)\b\s*>|="[^"]*"\s*/?>|\s*>\s*)*', '', text, flags=re.IGNORECASE).strip()
    # Normalize whitespace & non-breaking spaces
    text = text.replace('\xa0', ' ')
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def format_condition_rule(rule_dict: dict) -> str:
    if not isinstance(rule_dict, dict):
        return str(rule_dict)
    field = rule_dict.get("field", "condition")
    op = rule_dict.get("operator", "EQUALS")
    val = rule_dict.get("value", True)
    
    clean_field = field.replace("statutory.", "").replace("control.", "").replace("system.", "").replace("_", " ").title()
    if op == "EQUALS":
        if val is True:
            return f"{clean_field}: Mandatory"
        elif val is False:
            return f"{clean_field}: Prohibited"
        else:
            return f"{clean_field} == {val}"
    return f"{clean_field} {op} {val}"

def extract_conditions_readable(conditions) -> list[str]:
    if not conditions:
        return []
    if isinstance(conditions, dict):
        if "rules" in conditions and isinstance(conditions["rules"], list):
            return [format_condition_rule(r) for r in conditions["rules"]]
        res = []
        for k, v in conditions.items():
            k_clean = k.replace("_", " ").title()
            if isinstance(v, bool):
                if v:
                    res.append(f"{k_clean}: Mandatory")
                else:
                    res.append(f"{k_clean}: Prohibited")
            elif isinstance(v, dict):
                res.append(f"{k_clean}: {format_condition_rule(v)}")
            elif isinstance(v, list):
                sub = ", ".join(str(x) for x in v)
                res.append(f"{k_clean} ({sub})")
            else:
                res.append(f"{k_clean}: {v}")
        return res
    if isinstance(conditions, list):
        res = []
        for item in conditions:
            if isinstance(item, dict):
                res.extend(extract_conditions_readable(item))
            else:
                res.append(str(item))
        return res
    return [str(conditions)]

db = SessionLocal()
reg = db.query(Regulation).filter(Regulation.name == 'Digital Operational Resilience Act').first()
reqs = []
for v in reg.versions:
    v_reqs = db.query(Requirement).filter(Requirement.regulation_version_id == v.id).all()
    if v_reqs:
        reqs = v_reqs
        break

print(f"Testing on {len(reqs)} requirements from {reg.name}:")
for r in reqs:
    print("\n--- BEFORE ---")
    print("Title:      ", repr(r.title))
    print("Description:", repr(r.description[:120]))
    print("Conditions: ", r.conditions)
    
    clean_t = clean_regulatory_text(r.title)
    if not clean_t or len(clean_t) < 3:
        clean_t = "Mandatory Operational Safeguard"
    clean_d = clean_regulatory_text(r.description)
    clean_c = extract_conditions_readable(r.conditions)
    
    print("--- AFTER SANITIZATION ---")
    print("Title:      ", repr(clean_t))
    print("Description:", repr(clean_d[:120]))
    print("Conditions: ", clean_c)

db.close()
