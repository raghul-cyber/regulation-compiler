'use client';

import { useState } from 'react';
import { 
  Globe2, 
  Cpu, 
  Binary, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  FileText, 
  Zap, 
  Terminal, 
  Code2, 
  Layers,
  Database,
  Radio,
  FileCheck
} from 'lucide-react';

interface Stage {
  id: string;
  step: string;
  title: string;
  subtitle: string;
  badge: string;
  icon: any;
  color: string;
  borderColor: string;
  bgGlow: string;
  description: string;
  highlights: string[];
  codeTitle: string;
  codeSnippet: string;
}

const STAGES: Stage[] = [
  {
    id: 'ingest',
    step: '01',
    title: 'Statutory Ingestion',
    subtitle: 'Continuous 24/7 Government Scraping',
    badge: 'Real-Time Telemetry',
    icon: Globe2,
    color: 'text-blue-400',
    borderColor: 'border-blue-500/40',
    bgGlow: 'bg-blue-500/10',
    description: 'Autonomous daemons scrape official government gazettes, regulatory portals, and public APIs (US Federal Register, UK FCA, Eur-Lex, Canada Open Gov, MAS) to ingest legal amendments in real time.',
    highlights: [
      'Sub-minute government gazette polling',
      'Multi-format OCR & native PDF/XML parsing',
      'Automatic version diffing & hash verification'
    ],
    codeTitle: 'RAW STATUTORY FEED (US FEDERAL REGISTER / EUR-LEX)',
    codeSnippet: `// Ingested Gazette Notice [FR Doc. 2026-18749]
{
  "source": "US Office of the Federal Register",
  "authority": "Securities and Exchange Commission (SEC)",
  "title": "Cybersecurity Risk Management, Strategy & Governance",
  "citation": "17 CFR Part 229, 232, 240",
  "effective_date": "2026-10-01",
  "mandate_clause": "Each registrant shall disclose material cybersecurity incidents within four business days of determination..."
}`
  },
  {
    id: 'parse',
    step: '02',
    title: 'Semantic Parsing',
    subtitle: 'Legal LLM & AST Decomposition',
    badge: 'Deterministic NLP',
    icon: Cpu,
    color: 'text-purple-400',
    borderColor: 'border-purple-500/40',
    bgGlow: 'bg-purple-500/10',
    description: 'The semantic engine breaks legal text into atomic statutory obligations, identifying binding keywords ("shall", "must", "prohibited") and cross-referencing global legal knowledge graphs.',
    highlights: [
      'Entity recognition for compliance thresholds',
      'Article, paragraph, and citation tokenization',
      'Autonomous requirement hierarchy building'
    ],
    codeTitle: 'DECOMPOSED REQUIREMENT TOKENS',
    codeSnippet: `// Semantic Legal Tokenization
{
  "requirement_id": "req-sec-cyber-04d",
  "statutory_scope": "INCIDENT_DISCLOSURE",
  "modal_operator": "MANDATORY_SHALL",
  "threshold_constraints": {
    "reporting_window_hours": 96,
    "materiality_trigger": "CRITICAL_OR_HIGH",
    "affected_assets": ["PII", "CORE_INFRASTRUCTURE", "PAYMENT_GATEWAYS"]
  },
  "exceptions": ["NATIONAL_SECURITY_DELAY_AUTHORIZED"]
}`
  },
  {
    id: 'compile',
    step: '03',
    title: 'Rule Compilation',
    subtitle: 'Abstract Syntax Tree Synthesis',
    badge: 'Code Synthesis',
    icon: Binary,
    color: 'text-amber-400',
    borderColor: 'border-amber-500/40',
    bgGlow: 'bg-amber-500/10',
    description: 'Decomposed legal requirements are compiled into formal Abstract Syntax Trees (AST). Ambiguous legal prose is replaced with deterministic, machine-verifiable boolean condition trees.',
    highlights: [
      'Formal Abstract Syntax Tree (AST) generation',
      'Boolean logic & boundary constraint compilation',
      'Exportable to OPA Rego, JSON Schema, and Python'
    ],
    codeTitle: 'COMPILED AST POLICY (DETERMINISTIC EVALUATOR)',
    codeSnippet: `// Compiled Abstract Syntax Tree Rule
{
  "policy_name": "SEC_4_DAY_INCIDENT_DISCLOSURE",
  "version": "2.4.0",
  "ast_root": {
    "operator": "AND",
    "conditions": [
      { "field": "incident.severity", "op": "IN", "value": ["CRITICAL", "HIGH"] },
      { "field": "incident.disclosure_elapsed_hours", "op": "LTE", "value": 96 },
      { "field": "incident.sec_form_8k_filed", "op": "EQUALS", "value": true }
    ]
  },
  "remediation_ref": "SEC_FORM_8K_EMERGENCY_PLAYBOOK"
}`
  },
  {
    id: 'enforce',
    step: '04',
    title: 'Continuous Enforcement',
    subtitle: 'Real-Time Telemetry & Verification',
    badge: 'Zero-Downtime Audit',
    icon: ShieldCheck,
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/40',
    bgGlow: 'bg-emerald-500/10',
    description: 'Active policies continuously verify your cloud infrastructure, databases, and CI/CD pipelines in sub-50ms evaluations, generating cryptographic audit trails and executive compliance dossiers.',
    highlights: [
      'Sub-50ms low-latency evaluation endpoint',
      'Automated gap detection and fix playbooks',
      'Cryptographic tamper-proof audit trails'
    ],
    codeTitle: 'REAL-TIME VERIFICATION OUTCOME & AUDIT LOG',
    codeSnippet: `// Verification Check Response (200 OK • 18ms)
{
  "check_id": "chk-981f4a-2026",
  "policy": "SEC_4_DAY_INCIDENT_DISCLOSURE",
  "result": "PASS",
  "evaluated_at": "2026-09-13T19:20:41.108Z",
  "assertions": {
    "incident_severity_checked": "HIGH",
    "elapsed_time_hours": 36.4,
    "sec_form_8k_status": "FILED_AND_CONFIRMED"
  },
  "cryptographic_hash": "sha256:d8c2e9184a491bb08018e6...",
  "audit_status": "VERIFIED_COMPLIANT"
}`
  }
];

export function HowItWorksDiagram() {
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const activeStage = STAGES[activeStageIndex];

  return (
    <div className="w-full">
      {/* Interactive Stage Step Indicator */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-8">
        {STAGES.map((stage, idx) => {
          const Icon = stage.icon;
          const isActive = idx === activeStageIndex;

          return (
            <button
              key={stage.id}
              onClick={() => setActiveStageIndex(idx)}
              className={`text-left p-4 rounded-xl border transition-all duration-300 relative group cursor-pointer ${
                isActive
                  ? `bg-zinc-900/90 ${stage.borderColor} shadow-lg shadow-black/40 ring-1 ${stage.color.replace('text-', 'ring-')}`
                  : 'bg-[#0b0c10]/60 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/40'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${isActive ? stage.bgGlow : 'bg-zinc-900'} ${stage.color} transition-colors`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="font-mono text-xs font-bold text-zinc-500 group-hover:text-zinc-400">
                  {stage.step}
                </span>
              </div>

              <h4 className="text-sm font-bold text-white mb-1 group-hover:text-blue-300 transition-colors">
                {stage.title}
              </h4>
              <p className="text-xs text-zinc-400 line-clamp-1">
                {stage.subtitle}
              </p>

              {isActive && (
                <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
              )}
            </button>
          );
        })}
      </div>

      {/* Visual Workflow Diagram Box */}
      <div className="rounded-2xl border border-zinc-800/90 bg-[#08090d] p-6 md:p-8 shadow-2xl relative overflow-hidden">
        {/* Subtle Ambient Background Gradients */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header of Active Stage */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-zinc-800/80">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold tracking-wider uppercase border ${activeStage.borderColor} ${activeStage.bgGlow} ${activeStage.color}`}>
                Stage {activeStage.step}: {activeStage.badge}
              </span>
              <span className="text-xs text-zinc-500 font-mono flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" />
                Autonomous Execution
              </span>
            </div>
            <h3 className="text-2xl font-extrabold text-white tracking-tight">
              {activeStage.title} — {activeStage.subtitle}
            </h3>
          </div>

          {/* Quick Stage Switchers */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveStageIndex(prev => (prev > 0 ? prev - 1 : STAGES.length - 1))}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white transition-all cursor-pointer"
            >
              Previous
            </button>
            <button
              onClick={() => setActiveStageIndex(prev => (prev < STAGES.length - 1 ? prev + 1 : 0))}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all flex items-center gap-1 cursor-pointer shadow-sm shadow-blue-500/20"
            >
              <span>Next Stage</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Two-Column Showcase: Description & Highlights (Left) vs Interactive Code (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Stage Explanation & Highlights */}
          <div className="lg:col-span-5 space-y-6">
            <p className="text-zinc-300 text-sm md:text-base leading-relaxed">
              {activeStage.description}
            </p>

            <div className="space-y-3 pt-2">
              <h5 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Key Operational Milestones
              </h5>
              <div className="space-y-2">
                {activeStage.highlights.map((h, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-zinc-300 bg-zinc-900/60 border border-zinc-800/80 p-2.5 rounded-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pipeline Step Flow Mini-Bar */}
            <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500 font-mono">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Pipeline Health: 100% OPERATIONAL
              </span>
              <span>Stage {activeStageIndex + 1} of {STAGES.length}</span>
            </div>
          </div>

          {/* Right Column: Code & AST Inspector */}
          <div className="lg:col-span-7">
            <div className="rounded-xl border border-zinc-800 bg-[#050608] overflow-hidden shadow-xl">
              <div className="px-4 py-2.5 bg-zinc-900/80 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="text-[11px] font-mono text-zinc-400 ml-2 font-medium">
                    {activeStage.codeTitle}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-zinc-500 uppercase bg-zinc-800 px-2 py-0.5 rounded">
                  SYNTACTIC AST
                </span>
              </div>
              <div className="p-4 overflow-x-auto max-h-[340px] custom-scrollbar">
                <pre className="text-xs font-mono text-zinc-300 leading-relaxed">
                  <code>{activeStage.codeSnippet}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
