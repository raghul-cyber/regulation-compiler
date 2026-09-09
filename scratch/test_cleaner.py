import re
import html
from bs4 import BeautifulSoup

def clean_regulatory_text(val: str) -> str:
    if not val:
        return ""
    text = str(val)
    # 1. Strip HTML tags via BeautifulSoup or regex
    try:
        soup = BeautifulSoup(text, "html.parser")
        text = soup.get_text(" ")
    except Exception:
        text = re.sub(r'<[^>]+>', ' ', text)
    
    # 2. Unescape HTML entities (&nbsp;, &gt;, etc.)
    text = html.unescape(text)
    
    # 3. Clean up broken HTML attribute residue like '="4%"/>', '/div>', etc.
    text = re.sub(r'="[^"]*"\s*/?>?', ' ', text)
    text = re.sub(r'/[a-zA-Z0-9]+>', ' ', text)
    text = re.sub(r'col width="[^"]*"\s*/?>?', ' ', text)
    
    # 4. Remove leftover prefixes from bad chunking
    text = re.sub(r'^Obligation Control \d+:\s*(?:/?[a-z0-9]+>|="[^"]*"|>\s*)*', '', text, flags=re.IGNORECASE).strip()
    
    # 5. Clean whitespace & non-breaking spaces
    text = text.replace('\xa0', ' ')
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def format_condition_rule(rule_dict: dict) -> str:
    if not isinstance(rule_dict, dict):
        return str(rule_dict)
    field = rule_dict.get("field", "condition")
    op = rule_dict.get("operator", "EQUALS")
    val = rule_dict.get("value", True)
    
    field_name = field.split(".")[-1].replace("_", " ").title()
    if op == "EQUALS":
        if val is True:
            return f"{field_name}: Verified"
        elif val is False:
            return f"{field_name}: Prohibited"
        else:
            return f"{field_name} must equal {val}"
    return f"{field_name} {op} {val}"

def extract_conditions_readable(conditions) -> list[str]:
    if not conditions:
        return []
    if isinstance(conditions, dict):
        # Check if it's AST condition structure: {"operator": "AND", "rules": [...]}
        if "rules" in conditions and isinstance(conditions["rules"], list):
            res = []
            for r in conditions["rules"]:
                res.append(format_condition_rule(r))
            return res
        res = []
        for k, v in conditions.items():
            k_clean = k.replace("_", " ").title()
            if isinstance(v, bool):
                if v:
                    res.append(f"{k_clean}: Mandatory")
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

sample1 = 'Article\xa0114 thereof,</p> </div> <div class="eli-subdivision" id="cit_2"> <p class="oj-normal">Having regard to the proposal from the European Commission,</p> </div>'
sample2 = 'Obligation Control 1: ="4%"/>\n<col width="96%"/>\n<tbody>\n<tr>\n<td valign="top">\n<p class="oj-normal">(3)</p>\n</t'
sample3 = 'Obligation Control 1: /div>\n<div class="eli-subdivision" id="cit_5">\n<p class="oj-normal">Having regard to the o'
sample4 = 'The European Systemic Risk Board (ESRB) reaffirmed in a\xa02020 report addressing systemic cyber risk how the existing high level of interconnectedness across financial entities, financial markets and financial market infrastructures, and particularly the interdependencies of their ICT systems, could constitute a system'

for idx, s in enumerate([sample1, sample2, sample3, sample4], 1):
    print(f"Sample {idx}:")
    print("  RAW:  ", repr(s))
    print("  CLEAN:", repr(clean_regulatory_text(s)))

cond_sample = {
    "operator": "AND",
    "rules": [
        {"field": "statutory.clause_1.verified", "operator": "EQUALS", "value": True},
        {"field": "system.audit.active", "operator": "EQUALS", "value": True}
    ]
}
print("\nCondition Format:")
print(extract_conditions_readable(cond_sample))
