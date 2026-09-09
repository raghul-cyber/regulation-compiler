import json
import re

ACRONYMS = {
    'ict': 'ICT', 'cmdb': 'CMDB', 'eol': 'EOL', 'mfa': 'MFA',
    'cve': 'CVE', 'cves': 'CVEs', 'sla': 'SLA', 'tlpt': 'TLPT',
    'ai': 'AI', 'gdpr': 'GDPR', 'dora': 'DORA', 'ast': 'AST',
    'api': 'API', 'id': 'ID', 'rbac': 'RBAC', 'tls': 'TLS',
    'pci': 'PCI', 'dss': 'DSS', 'soc': 'SOC', 'nist': 'NIST',
    'eu': 'EU', 'iso': 'ISO', 'grc': 'GRC'
}

def format_human_label(text: str) -> str:
    if not text:
        return ""
    text = str(text).strip()
    words = re.split(r'[\s_\-]+', text)
    formatted = []
    for i, w in enumerate(words):
        lw = w.lower()
        if lw in ACRONYMS:
            formatted.append(ACRONYMS[lw])
        elif i == 0:
            formatted.append(w.capitalize())
        else:
            formatted.append(w)
    return " ".join(formatted)

def extract_clean_list(val) -> list[str]:
    if not val:
        return []
    if isinstance(val, dict):
        res = []
        for k, v in val.items():
            k_fmt = format_human_label(k)
            if isinstance(v, bool):
                if v:
                    res.append(k_fmt)
            elif isinstance(v, (int, float, str)):
                res.append(f"{k_fmt}: {v}")
            elif isinstance(v, list):
                sub_items = ", ".join(format_human_label(x) for x in v)
                res.append(f"{k_fmt} ({sub_items})")
            else:
                res.append(k_fmt)
        return res
    if isinstance(val, list):
        res = []
        for item in val:
            if isinstance(item, dict):
                res.extend(extract_clean_list(item))
            else:
                res.append(format_human_label(str(item)))
        return res
    if isinstance(val, str):
        val_s = val.strip()
        if (val_s.startswith('{') and val_s.endswith('}')) or (val_s.startswith('[') and val_s.endswith(']')):
            try:
                parsed = json.loads(val_s)
                return extract_clean_list(parsed)
            except Exception:
                try:
                    import ast
                    parsed = ast.literal_eval(val_s)
                    return extract_clean_list(parsed)
                except Exception:
                    pass
        if ";" in val_s:
            return [format_human_label(x) for x in val_s.split(";") if x.strip()]
        if "," in val_s and not val_s.startswith("http"):
            return [format_human_label(x) for x in val_s.split(",") if x.strip()]
        return [format_human_label(val_s)]
    return [format_human_label(str(val))]

def extract_citation(r_dict: dict) -> str:
    # 1. Check references dict
    refs = r_dict.get("references")
    if isinstance(refs, dict):
        for key in ["article", "clause", "section", "paragraph", "recital"]:
            if refs.get(key):
                return str(refs[key]).strip()
    
    # 2. Check meta_data dict
    meta = r_dict.get("meta_data")
    if isinstance(meta, dict):
        for key in ["clause_ref", "article", "clause", "section"]:
            if meta.get(key):
                return str(meta[key]).strip()

    # 3. Check title / description regex
    title = r_dict.get("title", "")
    desc = r_dict.get("description", "")
    m = re.search(r'\b(Article\s+\d+(\([a-z0-9]+\))*|Section\s+\d+(\.\d+)*|Art\.\s+\d+)\b', f"{title} {desc}", re.IGNORECASE)
    if m:
        return m.group(1).title()

    return "Mandatory Directive"

if __name__ == "__main__":
    actions = {'define_ict_risk_tolerances': True, 'assign_three_lines_of_defense': True}
    evidence = {'risk_appetite_statement': True, 'board_minutes_ict_signoff': True}
    cond = {'annual_review': True, 'management_body_approval': True}
    r_dict = {
        "title": "ICT Risk Management Framework Governance",
        "description": "Financial entities shall have in place an internal governance and control framework that ensures effective and prudent management of ICT risk (Article 5).",
        "references": {'article': 'Article 5', 'dora_chapter': 'II'},
        "actions": actions,
        "evidence_required": evidence,
        "conditions": cond
    }
    print("Citation:", extract_citation(r_dict))
    print("Actions:", extract_clean_list(actions))
    print("Evidence:", extract_clean_list(evidence))
    print("Conditions:", extract_clean_list(cond))
