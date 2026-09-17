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
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#17222C]/70 border border-[#1E2C38] text-[#5CC8FF] text-xs font-mono font-medium uppercase tracking-wider mb-4">
          <Binary className="w-3.5 h-3.5" />
          The Translation Pipeline
        </div>
        <h2 className="text-3xl sm:text-5xl font-extrabold text-[#F2F6F8] tracking-tight leading-tight">
          Regulation <span className="text-[#5CC8FF]">→</span> Structured Logic.
        </h2>
        <p className="mt-4 text-base md:text-lg text-[#9AA9B5] leading-relaxed">
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
                    ? 'bg-[#0C131B] border-[#5CC8FF] shadow-[0_0_20px_rgba(92,200,255,0.15)] text-[#F2F6F8]'
                    : 'bg-[#080D13]/60 border-[#17222C] text-[#62717C] hover:text-[#9AA9B5] hover:border-[#1E2C38]'
                }`}
              >
                <div className="text-[10px] text-[#5CC8FF] mb-1">STAGE 0{s.id}</div>
                <div className="font-semibold truncate">{s.title}</div>
                {/* Auto-advance progress indicator */}
                {isActive && !isPaused && (
                  <div className="absolute bottom-0 left-0 right-0">
                    <div key={progressKey} className="landing-tab-progress-bar" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* 3-Column Visual Transformation Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch p-6 rounded-2xl bg-[#080D13]/90 border border-[#17222C] backdrop-blur-xl shadow-2xl">
          {/* Left Column: Statutory Input */}
          <div className="lg:col-span-5 p-5 rounded-xl bg-[#0C131B] border border-[#17222C] text-left flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-[10px] text-[#5CC8FF] uppercase tracking-wider">
                  INPUT // STATUTE
                </span>
                <span className="font-mono text-[10px] text-[#9AA9B5] bg-[#17222C] px-2 py-0.5 rounded">
                  {stage.leftContent.source}
                </span>
              </div>
              <div className="font-mono text-xs text-[#9AA9B5] leading-relaxed whitespace-pre-line">
                {stage.leftContent.text}
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[#17222C] text-[11px] font-mono text-[#62717C]">
              Target Span: <span className="text-[#5CC8FF] font-semibold">{stage.leftContent.highlight}</span>
            </div>
          </div>

          {/* Center Column: Transformation Engine */}
          <div className="lg:col-span-2 flex flex-col items-center justify-center p-3 text-center">
            <div className="w-10 h-10 rounded-full bg-[#17222C] border border-[#1E2C38] flex items-center justify-center text-[#5CC8FF] mb-2 shadow-lg">
              <Cpu className="w-5 h-5 animate-pulse" />
            </div>
            <span className="font-mono text-[11px] text-[#9AA9B5] font-semibold mb-1">
              AST PARSER
            </span>
            <p className="font-mono text-[10px] text-[#62717C] leading-snug">
              {stage.centerAction}
            </p>
            <div className="hidden lg:flex items-center gap-1 text-[#5CC8FF] mt-2">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Right Column: Compiled Structured Logic */}
          <div className="lg:col-span-5 p-5 rounded-xl bg-[#0C131B] border border-[#17222C] text-left flex flex-col justify-between font-mono">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-[10px] text-[#67D6A0] uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle className="w-3 h-3 text-[#67D6A0]" />
                  COMPILED LOGIC
                </span>
                <span className="font-mono text-[10px] text-[#9AA9B5] bg-[#17222C] px-2 py-0.5 rounded">
                  {stage.rightOutput.type}
                </span>
              </div>
              <pre className="text-xs text-[#5CC8FF] bg-[#080D13] p-3.5 rounded-lg border border-[#17222C] overflow-x-auto leading-relaxed">
                <code>{stage.rightOutput.code}</code>
              </pre>
            </div>
            <div className="mt-4 pt-3 border-t border-[#17222C] text-[11px] text-[#62717C] flex items-center justify-between">
              <span>DETERMINISTIC: TRUE</span>
              <span className="text-[#67D6A0]">EVALUATION: PASS</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
