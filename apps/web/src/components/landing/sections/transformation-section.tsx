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
    if (timerRef.current) clearInterval(timerRef.current);
    if (!isPaused) {
      timerRef.current = setInterval(advanceStage, AUTO_ADVANCE_MS);
    }
  };

  return (
    <section 
      id="transformation" 
      className="w-full max-w-6xl mx-auto px-4 md:px-6 pointer-events-auto scroll-mt-24 relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      {/* Transformation Room Atmosphere (Warm Champagne & Titanium Glow) */}
      <div 
        className="absolute top-1/3 right-0 w-[580px] h-[360px] rounded-full blur-[140px] pointer-events-none -z-10"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(188, 167, 123, 0.18) 0%, rgba(77, 120, 160, 0.10) 50%, transparent 80%)',
        }}
        aria-hidden="true"
      />

      {/* Eyebrow & Title */}
      <div ref={titleRef} className={`landing-reveal ${titleRevealed ? 'revealed' : ''} text-center max-w-3xl mx-auto mb-14`}>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#171C23] border border-[rgba(199,204,210,0.14)] text-[#BCA77B] text-xs font-mono font-medium uppercase tracking-wider mb-4 shadow-[0_4px_16px_rgba(9,11,15,0.5)] backdrop-blur-md">
          <Binary className="w-3.5 h-3.5 text-[#BCA77B]" />
          The Translation Pipeline
        </div>
        <h2 className="text-3xl sm:text-5xl font-extrabold text-[#FAF9F5] tracking-tight leading-tight">
          Regulation <span className="text-[#BCA77B]">→</span> Structured Logic.
        </h2>
        <p className="mt-4 text-base md:text-lg text-[#C7CCD2] leading-relaxed">
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
                    ? 'bg-[#171C23] border-[#BCA77B]/60 text-[#FAF9F5] shadow-[0_8px_24px_rgba(9,11,15,0.65)]'
                    : 'rc-glass-smoked border-[rgba(199,204,210,0.08)] text-[#969DA6] hover:text-[#C7CCD2] hover:border-[rgba(188,167,123,0.25)]'
                }`}
              >
                <div className="text-[10px] text-[#BCA77B] mb-1 font-bold">STAGE 0{s.id}</div>
                <div className="font-semibold truncate">{s.title}</div>
                {/* Auto-advance progress indicator */}
                {isActive && !isPaused && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#BCA77B]" />
                )}
              </button>
            );
          })}
        </div>

        {/* 3-Column Visual Transformation Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch p-6 rounded-xl rc-glass-smoked-elevated border border-[rgba(199,204,210,0.14)] shadow-[0_32px_80px_rgba(9,11,15,0.85)]">
          {/* Left Column: Statutory Input */}
          <div className="lg:col-span-5 p-5 rounded-lg bg-[#0C0F14] border border-[rgba(199,204,210,0.08)] text-left flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-[10px] text-[#BCA77B] uppercase tracking-wider font-bold">
                  INPUT // STATUTE
                </span>
                <span className="font-mono text-[10px] text-[#C7CCD2] bg-[#12161C] border border-[rgba(199,204,210,0.08)] px-2 py-0.5 rounded">
                  {stage.leftContent.source}
                </span>
              </div>
              <div className="font-mono text-xs text-[#C7CCD2] leading-relaxed whitespace-pre-line">
                {stage.leftContent.text}
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[rgba(199,204,210,0.08)] text-[11px] font-mono text-[#969DA6]">
              Target Span: <span className="text-[#BCA77B] font-semibold">{stage.leftContent.highlight}</span>
            </div>
          </div>

          {/* Center Column: Transformation Engine */}
          <div className="lg:col-span-2 flex flex-col items-center justify-center p-3 text-center">
            <div className="w-10 h-10 rounded-lg bg-[#171C23] border border-[rgba(199,204,210,0.12)] flex items-center justify-center text-[#BCA77B] mb-2 shadow-sm">
              <Cpu className="w-5 h-5" />
            </div>
            <div className="text-[10px] font-mono text-[#969DA6] uppercase tracking-wider mb-1 font-semibold">
              COMPILER PASS
            </div>
            <div className="text-[11px] font-mono text-[#C7CCD2] max-w-[140px] leading-tight">
              {stage.centerAction}
            </div>
            <ArrowRight className="w-4 h-4 text-[#BCA77B] mt-2 hidden lg:block" />
          </div>

          {/* Right Column: AST Output */}
          <div className="lg:col-span-5 p-5 rounded-lg bg-[#0C0F14] border border-[rgba(199,204,210,0.08)] text-left flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-[10px] text-[#76937F] uppercase tracking-wider font-bold flex items-center gap-1.5">
                  <CheckCircle className="w-3 h-3 text-[#76937F]" />
                  OUTPUT // {stage.rightOutput.type}
                </span>
                <span className="font-mono text-[9px] text-[#969DA6] bg-[#12161C] px-1.5 py-0.5 rounded border border-[rgba(199,204,210,0.08)]">
                  DETERMINISTIC
                </span>
              </div>
              <pre className="font-mono text-xs text-[#FAF9F5] overflow-x-auto leading-relaxed bg-[#12161C] p-3 rounded border border-[rgba(199,204,210,0.08)]">
                <code>{stage.rightOutput.code}</code>
              </pre>
            </div>
            <div className="mt-4 pt-3 border-t border-[rgba(199,204,210,0.08)] text-[11px] font-mono text-[#969DA6] flex items-center justify-between">
              <span>AST VALIDATION: <b className="text-[#76937F]">PASS</b></span>
              <span className="text-[#BCA77B]">ZERO DRIFT</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
