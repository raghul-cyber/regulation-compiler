'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowRight, Code, Shield, Cpu, Binary, CheckCircle } from 'lucide-react';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';

const STAGES = [
  {
    id: 1,
    title: 'Raw Statutory Text',
    badge: 'UNSTRUCTURED NATURAL LANGUAGE',
    leftContent: {
      source: 'GDPR Article 32(1)(a)',
      text: 'Taking into account the state of the art, the costs of implementation and the nature, scope, context and purposes of processing as well as the risk... the controller and the processor shall implement appropriate technical and organisational measures to ensure a level of security appropriate to the risk, including inter alia the pseudonymisation and encryption of personal data;',
      highlight: 'pseudonymisation and encryption of personal data',
    },
    centerAction: 'Isolating ambiguous phrases from qualifying context',
    rightOutput: {
      type: 'Text Tokens',
      code: 'RAW_TOKENS = ["pseudonymisation", "encryption", "personal data", "appropriate"]',
    },
  },
  {
    id: 2,
    title: 'Clause Boundary Tokenization',
    badge: 'LEXICAL BOUNDARY IDENTIFICATION',
    leftContent: {
      source: 'Extracted Obligation Spans',
      text: '[OBLIGATION_MANDATORY]: Controller/Processor MUST ensure technical security controls.\n[CONTROL_PRIMARY]: Encryption at rest & in transit.\n[CONTROL_SECONDARY]: Cryptographic pseudonymisation.',
      highlight: 'CONTROL_PRIMARY',
    },
    centerAction: 'Mapping legal semantics into standard regulatory taxonomy',
    rightOutput: {
      type: 'Semantic Tags',
      code: '{\n  "target": "DATA_AT_REST",\n  "obligation": "MANDATORY",\n  "scope": ["PII", "SENSITIVE_RECORDS"]\n}',
    },
  },
  {
    id: 3,
    title: 'Condition Tree Construction',
    badge: 'BOOLEAN AST COMPILATION',
    leftContent: {
      source: 'Deterministic Thresholds',
      text: 'Rule evaluates against cloud configuration: AWS RDS, Azure Cosmos, GCP CloudSQL.\nCondition: Encryption Enabled == True AND Key Rotation <= 90 Days.',
      highlight: 'Key Rotation <= 90 Days',
    },
    centerAction: 'Compiling condition branches into Abstract Syntax Tree',
    rightOutput: {
      type: 'AST Branch',
      code: 'node(Op.AND, [\n  condition("datastore.encrypted", Eq, true),\n  condition("kms.rotation_days", Lte, 90)\n])',
    },
  },
  {
    id: 4,
    title: 'Executable Enforcement Rule',
    badge: 'RUNTIME POLICY SPECIFICATION',
    leftContent: {
      source: 'Compiled Artifacts',
      text: 'Native deployment artifact ready for Open Policy Agent (OPA), Kubernetes Gatekeeper, CI/CD pipelines, and cloud event streams.',
      highlight: 'OPA Rego Policy',
    },
    centerAction: 'Emitting tamper-evident cryptographic hash signature',
    rightOutput: {
      type: 'OPA Rego',
      code: 'package compliance.gdpr.art32\ndefault allow = false\nallow {\n  input.storage.encryption.enabled == true\n  input.storage.encryption.kms_managed == true\n}',
    },
  },
];

const AUTO_ADVANCE_MS = 8000;

export function TransformationSection() {
  const [currentStage, setCurrentStage] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progressKey, setProgressKey] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stage = STAGES[currentStage];
  const { ref: titleRef, isRevealed: titleRevealed } = useScrollReveal();
  const { ref: contentRef, isRevealed: contentRevealed } = useScrollReveal({ threshold: 0.1 });

  const advanceStage = useCallback(() => {
    setCurrentStage(prev => (prev + 1) % STAGES.length);
    setProgressKey(prev => prev + 1);
  }, []);

  // Auto-advance timer
  useEffect(() => {
    if (isPaused) return;
    timerRef.current = setInterval(advanceStage, AUTO_ADVANCE_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, advanceStage, currentStage]);

  const handleManualSwitch = (idx: number) => {
    setCurrentStage(idx);
    setProgressKey(prev => prev + 1);
    // Reset auto-advance timer
    if (timerRef.current) clearInterval(timerRef.current);
    if (!isPaused) {
      timerRef.current = setInterval(advanceStage, AUTO_ADVANCE_MS);
    }
  };

  return (
    <section 
      id="transformation" 
      className="w-full max-w-6xl mx-auto px-4 md:px-6 pointer-events-auto scroll-mt-24"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      {/* Eyebrow & Title */}
      <div ref={titleRef} className={`landing-reveal ${titleRevealed ? 'revealed' : ''} text-center max-w-3xl mx-auto mb-14`}>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#080A0E] border border-white/[0.06] text-[#79B5EC] text-xs font-mono font-medium uppercase tracking-wider mb-4">
          <Binary className="w-3.5 h-3.5 text-[#4D8FCC]" />
          The Translation Pipeline
        </div>
        <h2 className="text-3xl sm:text-5xl font-extrabold text-[#F4F6F8] tracking-tight leading-tight">
          Regulation <span className="text-[#4D8FCC]">→</span> Structured Logic.
        </h2>
        <p className="mt-4 text-base md:text-lg text-[#9CA3AF] leading-relaxed">
          Observe how the compiler dismantles complex legal prose, isolates statutory obligations, and generates deterministic boolean verification logic.
        </p>
      </div>

      {/* Stage Progression Stepper with Progress Bar */}
      <div ref={contentRef} className={`landing-reveal ${contentRevealed ? 'revealed' : ''}`}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-8">
          {STAGES.map((s, idx) => {
            const isActive = idx === currentStage;
            return (
              <button
                key={s.id}
                onClick={() => handleManualSwitch(idx)}
                className={`relative p-3 rounded-xl border text-left font-mono text-xs transition-all duration-200 cursor-pointer overflow-hidden ${
                  isActive
                    ? 'bg-[#0B0E14] border-[#4D8FCC]/50 text-[#F4F6F8] shadow-sm'
                    : 'bg-[#080A0E] border-white/[0.06] text-[#64748B] hover:text-[#9CA3AF] hover:border-white/[0.12]'
                }`}
              >
                <div className="text-[10px] text-[#4D8FCC] mb-1 font-bold">STAGE 0{s.id}</div>
                <div className="font-semibold truncate">{s.title}</div>
                {/* Auto-advance progress indicator */}
                {isActive && !isPaused && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#4D8FCC]" />
                )}
              </button>
            );
          })}
        </div>

        {/* 3-Column Visual Transformation Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch p-6 rounded-xl bg-[#080A0E] border border-white/[0.06] shadow-[0_16px_40px_rgba(0,0,0,0.6)]">
          {/* Left Column: Statutory Input */}
          <div className="lg:col-span-5 p-5 rounded-lg bg-[#050608] border border-white/[0.05] text-left flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-[10px] text-[#4D8FCC] uppercase tracking-wider font-bold">
                  INPUT // STATUTE
                </span>
                <span className="font-mono text-[10px] text-[#9CA3AF] bg-[#0B0E14] border border-white/[0.06] px-2 py-0.5 rounded">
                  {stage.leftContent.source}
                </span>
              </div>
              <div className="font-mono text-xs text-[#9CA3AF] leading-relaxed whitespace-pre-line">
                {stage.leftContent.text}
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-white/[0.05] text-[11px] font-mono text-[#64748B]">
              Target Span: <span className="text-[#4D8FCC] font-semibold">{stage.leftContent.highlight}</span>
            </div>
          </div>

          {/* Center Column: Transformation Engine */}
          <div className="lg:col-span-2 flex flex-col items-center justify-center p-3 text-center">
            <div className="w-10 h-10 rounded-lg bg-[#0B0E14] border border-white/[0.06] flex items-center justify-center text-[#4D8FCC] mb-2 shadow-sm">
              <Cpu className="w-5 h-5" />
            </div>
            <div className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider mb-1 font-semibold">
              COMPILER PASS
            </div>
            <div className="text-[11px] font-mono text-[#CBD5E1] max-w-[140px] leading-tight">
              {stage.centerAction}
            </div>
            <ArrowRight className="w-4 h-4 text-[#4D8FCC] mt-2 hidden lg:block" />
          </div>

          {/* Right Column: AST Output */}
          <div className="lg:col-span-5 p-5 rounded-lg bg-[#050608] border border-white/[0.05] text-left flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-[10px] text-emerald-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
                  <CheckCircle className="w-3 h-3 text-emerald-400" />
                  OUTPUT // {stage.rightOutput.type}
                </span>
                <span className="font-mono text-[9px] text-[#64748B] bg-[#0B0E14] px-1.5 py-0.5 rounded border border-white/[0.06]">
                  DETERMINISTIC
                </span>
              </div>
              <pre className="font-mono text-xs text-[#79B5EC] overflow-x-auto leading-relaxed bg-[#050608] p-3 rounded border border-white/[0.04]">
                <code>{stage.rightOutput.code}</code>
              </pre>
            </div>
            <div className="mt-4 pt-3 border-t border-white/[0.05] text-[11px] font-mono text-[#64748B] flex items-center justify-between">
              <span>AST VALIDATION: PASS</span>
              <span className="text-[#C9B88A]">ZERO DRIFT</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
