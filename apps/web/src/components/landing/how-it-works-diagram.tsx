'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Globe2, 
  Cpu, 
  Binary, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Zap,
} from 'lucide-react';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';

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
    color: 'text-[#607D96]',
    borderColor: 'border-[#3F5C74]/40',
    bgGlow: 'bg-[#3F5C74]/10',
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
    color: 'text-[#AD956C]',
    borderColor: 'border-[#AD956C]/40',
    bgGlow: 'bg-[#AD956C]/10',
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
    color: 'text-[#C5B38B]',
    borderColor: 'border-[#AD956C]/40',
    bgGlow: 'bg-[#AD956C]/10',
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
    color: 'text-[#718A79]',
    borderColor: 'border-[#718A79]/40',
    bgGlow: 'bg-[#718A79]/10',
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

const AUTO_ROTATE_MS = 10000;

/** Simple JSON syntax highlighter with luxury enterprise palette */
function HighlightedJSON({ code }: { code: string }) {
  const lines = code.split('\n');
  return (
    <>
      {lines.map((line, i) => {
        // Highlight JSON keys, string values, numbers, booleans, and comments with muted luxury tones
        const highlighted = line
          // Comments
          .replace(/(\/\/.*)$/g, '<span style="color:#64748B">$1</span>')
          // JSON keys  
          .replace(/"([^"]+)"(?=\s*:)/g, '<span style="color:#93C5FD">"$1"</span>')
          // String values (after colon)
          .replace(/:\s*"([^"]+)"/g, ': <span style="color:#A7F3D0">"$1"</span>')
          // Array string values
          .replace(/\[\s*"([^"]+)"/g, '[<span style="color:#A7F3D0">"$1"</span>')
          .replace(/,\s*"([^"]+)"/g, ', <span style="color:#A7F3D0">"$1"</span>')
          // Numbers
          .replace(/:\s*(\d+\.?\d*)/g, ': <span style="color:#E2B170">$1</span>')
          // Booleans
          .replace(/:\s*(true|false)/g, ': <span style="color:#A7F3D0">$1</span>');
        
        return (
          <div key={i} dangerouslySetInnerHTML={{ __html: highlighted || '&nbsp;' }} />
        );
      })}
    </>
  );
}

export function HowItWorksDiagram() {
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progressKey, setProgressKey] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeStage = STAGES[activeStageIndex];
  const { ref, isRevealed } = useScrollReveal({ threshold: 0.08 });

  const advanceStage = useCallback(() => {
    setActiveStageIndex(prev => (prev + 1) % STAGES.length);
    setProgressKey(prev => prev + 1);
  }, []);

  // Auto-rotate timer
  useEffect(() => {
    if (isPaused) return;
    timerRef.current = setInterval(advanceStage, AUTO_ROTATE_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, advanceStage, activeStageIndex]);

  const handleManualSwitch = (idx: number) => {
    setActiveStageIndex(idx);
    setProgressKey(prev => prev + 1);
    if (timerRef.current) clearInterval(timerRef.current);
    if (!isPaused) {
      timerRef.current = setInterval(advanceStage, AUTO_ROTATE_MS);
    }
  };

  return (
    <div 
      ref={ref} 
      className={`landing-reveal ${isRevealed ? 'revealed' : ''} w-full`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      {/* Interactive Stage Step Indicator */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-8">
        {STAGES.map((stage, idx) => {
          const Icon = stage.icon;
          const isActive = idx === activeStageIndex;

          return (
            <button
              key={stage.id}
              onClick={() => handleManualSwitch(idx)}
              className={`text-left p-4 rounded-xl border transition-all duration-200 relative group cursor-pointer overflow-hidden ${
                isActive
                  ? 'bg-[#1B1815] border-[#AD956C]/50 shadow-[0_4px_16px_rgba(0,0,0,0.6)]'
                  : 'bg-[#151311] border-[rgba(201,196,186,0.08)] hover:border-[rgba(201,196,186,0.18)] hover:bg-[#1B1815]'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${isActive ? 'bg-[#AD956C]/15 text-[#C5B38B]' : 'bg-[#1B1815] text-[#8D8982]'} transition-colors`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="font-mono text-xs font-bold text-[#8D8982] group-hover:text-[#C9C4BA]">
                  {stage.step}
                </span>
              </div>

              <h4 className="text-sm font-bold text-[#F7F4EC] mb-1 group-hover:text-[#C5B38B] transition-colors">
                {stage.title}
              </h4>
              <p className="text-xs text-[#8D8982] line-clamp-1">
                {stage.subtitle}
              </p>

              {/* Auto-rotate progress bar */}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#AD956C]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Visual Workflow Diagram Box */}
      <div className="rounded-2xl border border-[rgba(201,196,186,0.12)] bg-[#151311] p-6 md:p-8 shadow-[0_24px_64px_rgba(0,0,0,0.8)] relative overflow-hidden">
        {/* Top Header of Active Stage */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-[rgba(201,196,186,0.08)]">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold tracking-wider uppercase border border-[#AD956C]/30 bg-[#AD956C]/10 text-[#C5B38B]">
                Stage {activeStage.step}: {activeStage.badge}
              </span>
              <span className="text-xs text-[#8D8982] font-mono flex items-center gap-1">
                <Zap className="w-3 h-3 text-[#AD956C]" />
                Autonomous Execution
              </span>
            </div>
            <h3 className="text-2xl font-extrabold text-[#F7F4EC] tracking-tight">
              {activeStage.title} — {activeStage.subtitle}
            </h3>
          </div>

          {/* Quick Stage Switchers */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleManualSwitch((activeStageIndex > 0 ? activeStageIndex - 1 : STAGES.length - 1))}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#1B1815] border border-[rgba(201,196,186,0.10)] hover:border-[rgba(201,196,186,0.20)] text-[#C9C4BA] hover:text-[#F7F4EC] transition-all cursor-pointer"
            >
              Previous
            </button>
            <button
              onClick={() => handleManualSwitch((activeStageIndex < STAGES.length - 1 ? activeStageIndex + 1 : 0))}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#3F5C74] hover:bg-[#344D63] text-[#F7F4EC] transition-all flex items-center gap-1 cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.5)] border border-[#AD956C]/25"
            >
              <span>Next Stage</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#AD956C]" />
            </button>
          </div>
        </div>

        {/* Two-Column Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Stage Explanation & Highlights */}
          <div className="lg:col-span-5 space-y-6">
            <p className="text-[#C9C4BA] text-sm md:text-base leading-relaxed">
              {activeStage.description}
            </p>

            <div className="space-y-3 pt-2">
              <h5 className="text-xs font-mono uppercase tracking-wider text-[#8D8982] font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#718A79]" />
                Key Operational Milestones
              </h5>
              <div className="space-y-2">
                {activeStage.highlights.map((h, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-[#C9C4BA] bg-[#100E0D] border border-[rgba(201,196,186,0.08)] p-2.5 rounded-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#AD956C] mt-1.5 shrink-0" />
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pipeline Step Flow Mini-Bar */}
            <div className="pt-4 border-t border-[rgba(201,196,186,0.08)] flex items-center justify-between text-xs text-[#8D8982] font-mono">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#718A79]" />
                Pipeline Health: 100% OPERATIONAL
              </span>
              <span>Stage {activeStageIndex + 1} of {STAGES.length}</span>
            </div>
          </div>

          {/* Right Column: Code & AST Inspector with Syntax Highlighting */}
          <div className="lg:col-span-7">
            <div className="rounded-xl border border-[rgba(201,196,186,0.08)] bg-[#100E0D] overflow-hidden shadow-xl">
              <div className="px-4 py-2.5 bg-[#0D0B0A] border-b border-[rgba(201,196,186,0.08)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[rgba(201,196,186,0.14)]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[rgba(201,196,186,0.14)]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[rgba(201,196,186,0.14)]" />
                  </div>
                  <span className="text-[11px] font-mono text-[#8D8982] ml-2 font-medium">
                    {activeStage.codeTitle}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[#8D8982] uppercase bg-[#151311] px-2 py-0.5 rounded border border-[rgba(201,196,186,0.08)]">
                  SYNTACTIC AST
                </span>
              </div>
              <div className="p-4 overflow-x-auto max-h-[340px] custom-scrollbar">
                <pre className="text-xs font-mono text-[#F1EEE7] leading-relaxed">
                  <code>
                    <HighlightedJSON code={activeStage.codeSnippet} />
                    <span className="landing-cursor" aria-hidden="true" />
                  </code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
