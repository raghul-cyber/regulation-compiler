import os

filepath = r"apps\web\src\app\(authenticated)\dashboard\page.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "import { ComplianceChecklist } from '@/components/compliance/compliance-checklist';",
    "import { ComplianceChecklist } from '@/components/compliance/compliance-checklist';\nimport { CoverageView } from './coverage-view';"
)

old_tabs = """  const tabs = [
    { id: 'policies', label: 'Policies & Evaluation' },
    { id: 'dashboard', label: 'Compliance Dashboard' },
    { id: 'gaps', label: 'Gap Analysis' },
    { id: 'checklist', label: 'Compliance Checklist' },
  ];"""

new_tabs = """  const tabs = [
    { id: 'coverage', label: 'Coverage Map' },
    { id: 'policies', label: 'Policies & Evaluation' },
    { id: 'dashboard', label: 'Compliance Dashboard' },
    { id: 'gaps', label: 'Gap Analysis' },
    { id: 'checklist', label: 'Compliance Checklist' },
  ];"""

content = content.replace(old_tabs, new_tabs)

old_state = "const [activeTab, setActiveTab] = useState('policies');"
new_state = "const [activeTab, setActiveTab] = useState('coverage');"

content = content.replace(old_state, new_state)

content = content.replace(
    "{activeTab === 'policies' && <PoliciesView />}",
    "{activeTab === 'coverage' && <CoverageView />}\n        {activeTab === 'policies' && <PoliciesView />}"
)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Patched page.tsx successfully.")
