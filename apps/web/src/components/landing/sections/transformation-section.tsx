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
          background: 'radial-gradient(ellipse at center, rgba(199, 175, 123, 0.16) 0%, rgba(33, 25, 21, 0.08) 50%, transparent 80%)',
        }}
        aria-hidden="true"
      />

      {/* Eyebrow & Title */}
      <div ref={titleRef} className={`landing-reveal ${titleRevealed ? 'revealed' : ''} text-center max-w-3xl mx-auto mb-14`}>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#171716] border border-[rgba(220,210,190,0.12)] text-[#C7AF7B] text-xs font-mono font-medium uppercase tracking-wider mb-4 shadow-[0_4px_16px_rgba(8,7,6,0.5)] backdrop-blur-md">
          <Binary className="w-3.5 h-3.5 text-[#C7AF7B]" />
          The Translation Pipeline
        </div>
        <h2 className="text-3xl sm:text-5xl font-extrabold text-[#F4F0E8] tracking-tight leading-tight">
          Regulation <span className="text-[#C7AF7B]">→</span> Structured Logic.
        </h2>
        <p className="mt-4 text-base md:text-lg text-[#C9C4BA] leading-relaxed">
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
                    ? 'bg-[#171716] border-[#C7AF7B]/60 text-[#F4F0E8] shadow-[0_8px_24px_rgba(8,7,6,0.65)]'
                    : 'rc-glass-smoked border-[rgba(220,210,190,0.08)] text-[#8D8982] hover:text-[#C9C4BA] hover:border-[rgba(185,164,122,0.25)]'
                }`}
              >
                <div className="text-[10px] text-[#C7AF7B] mb-1 font-bold">STAGE 0{s.id}</div>
                <div className="font-semibold truncate">{s.title}</div>
                {/* Auto-advance progress indicator */}
                {isActive && !isPaused && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C7AF7B]" />
                )}
              </button>
            );
          })}
        </div>

        {/* 3-Column Visual Transformation Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch p-6 rounded-xl rc-glass-smoked-elevated border border-[rgba(220,210,190,0.14)] shadow-[0_32px_80px_rgba(8,7,6,0.85)]">
          {/* Left Column: Statutory Input */}
          <div className="lg:col-span-5 p-5 rounded-lg bg-[#10100F] border border-[rgba(220,210,190,0.08)] text-left flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-[10px] text-[#AD956C] uppercase tracking-wider font-bold">
                  INPUT // STATUTE
                </span>
                <span className="font-mono text-[10px] text-[#C9C4BA] bg-[#151311] border border-[rgba(201,196,186,0.08)] px-2 py-0.5 rounded">
                  {stage.leftContent.source}
                </span>
              </div>
              <div className="font-mono text-xs text-[#C9C4BA] leading-relaxed whitespace-pre-line">
                {stage.leftContent.text}
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[rgba(201,196,186,0.08)] text-[11px] font-mono text-[#8D8982]">
              Target Span: <span className="text-[#AD956C] font-semibold">{stage.leftContent.highlight}</span>
            </div>
          </div>

          {/* Center Column: Transformation Engine */}
          <div className="lg:col-span-2 flex flex-col items-center justify-center p-3 text-center">
            <div className="w-10 h-10 rounded-lg bg-[#1B1815] border border-[rgba(201,196,186,0.10)] flex items-center justify-center text-[#AD956C] mb-2 shadow-sm">
              <Cpu className="w-5 h-5" />
            </div>
            <div className="text-[10px] font-mono text-[#8D8982] uppercase tracking-wider mb-1 font-semibold">
              COMPILER PASS
            </div>
            <div className="text-[11px] font-mono text-[#C9C4BA] max-w-[140px] leading-tight">
              {stage.centerAction}
            </div>
            <ArrowRight className="w-4 h-4 text-[#AD956C] mt-2 hidden lg:block" />
          </div>

          {/* Right Column: AST Output */}
          <div className="lg:col-span-5 p-5 rounded-lg bg-[#100E0D] border border-[rgba(201,196,186,0.08)] text-left flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-[10px] text-[#718A79] uppercase tracking-wider font-bold flex items-center gap-1.5">
                  <CheckCircle className="w-3 h-3 text-[#718A79]" />
                  OUTPUT // {stage.rightOutput.type}
                </span>
                <span className="font-mono text-[9px] text-[#8D8982] bg-[#151311] px-1.5 py-0.5 rounded border border-[rgba(201,196,186,0.08)]">
                  DETERMINISTIC
                </span>
              </div>
              <pre className="font-mono text-xs text-[#F1EEE7] overflow-x-auto leading-relaxed bg-[#151311] p-3 rounded border border-[rgba(201,196,186,0.06)]">
                <code>{stage.rightOutput.code}</code>
              </pre>
            </div>
            <div className="mt-4 pt-3 border-t border-[rgba(201,196,186,0.08)] text-[11px] font-mono text-[#8D8982] flex items-center justify-between">
              <span>AST VALIDATION: <b className="text-[#718A79]">PASS</b></span>
              <span className="text-[#AD956C]">ZERO DRIFT</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
