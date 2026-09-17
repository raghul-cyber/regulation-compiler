'use client';

import { ShieldCheck, Hash, Lock, CheckCircle2, FileText, ArrowRight } from 'lucide-react';

const TRACE_PIPELINE = [
  { step: 'INPUT', label: 'Gazette Signal', desc: 'Immutable PDF/XML capture with SHA-256 source digest' },
  { step: 'TRANSFORM', label: 'AST Mapping', desc: 'Deterministic syntactic reduction to boolean condition tree' },
  { step: 'VALIDATE', label: 'Runtime Check', desc: 'In-memory telemetry evaluation with sub-50ms latency' },
  { step: 'DECISION', label: 'Binary Assertion', desc: 'Strict Pass/Fail gate with zero subjective override' },
  { step: 'TRACE', label: 'Cryptographic Proof', desc: 'Tamper-evident audit dossier emitted to cold storage' },
];

const AUDIT_LEDGER = [
  { id: 'TRACE_01', citation: 'EU AI Act Art. 9 §2', hash: '0x89e2f4a1c0d', status: 'PASS', latency: '38ms' },
  { id: 'TRACE_02', citation: 'DORA Art. 12 Backup', hash: '0x34b7e199fa2', status: 'PASS', latency: '42ms' },
  { id: 'TRACE_03', citation: 'GDPR Art. 32 KMS', hash: '0x99a12c44e88', status: 'PASS', latency: '29ms' },
  { id: 'TRACE_04', citation: 'NIST CSF PR.AC-01', hash: '0x12d490ab7fe', status: 'PASS', latency: '34ms' },
];

export function SecurityTraceability() {
  return (
    <section id="security" className="w-full max-w-6xl mx-auto px-4 md:px-6 pointer-events-auto scroll-mt-24">
      {/* Title */}
      <div className="text-center max-w-3xl mx-auto mb-14">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#17222C]/70 border border-[#1E2C38] text-[#5CC8FF] text-xs font-mono font-medium uppercase tracking-wider mb-4">
          <ShieldCheck className="w-3.5 h-3.5" />
          Traceability &amp; Integrity
        </div>
        <h2 className="text-3xl sm:text-5xl font-extrabold text-[#F2F6F8] tracking-tight leading-tight">
          Tamper-Evident Cryptographic Auditability
        </h2>
        <p className="mt-4 text-base md:text-lg text-[#9AA9B5] leading-relaxed">
          Every compliance check emits an immutable cryptographic hash, formal pass/fail outcome, and automated audit trail. Generate verifiable regulatory dossiers in milliseconds.
        </p>
      </div>

      {/* Grid: 5-Stage System Trace Graph (Left) & Audit Trail Ledger (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Trace Pipeline (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-[#080D13]/90 border border-[#17222C] text-left flex flex-col justify-between">
          <div>
            <div className="font-mono text-xs text-[#5CC8FF] uppercase tracking-wider mb-4">
              SYSTEM INTEGRITY GRAPH // VERIFICATION PIPELINE
            </div>
            
            <div className="space-y-3 font-mono">
              {TRACE_PIPELINE.map((p, idx) => (
                <div 
                  key={p.step} 
                  className="p-3.5 rounded-xl bg-[#0C131B] border border-[#17222C] flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded bg-[#17222C] text-[#5CC8FF] flex items-center justify-center text-[10px] font-bold">
                      0{idx + 1}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-[#F2F6F8]">{p.label}</div>
                      <div className="text-[11px] text-[#9AA9B5]">{p.desc}</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-[#5CC8FF] bg-[#5CC8FF15] px-2 py-0.5 rounded border border-[#5CC8FF30] shrink-0">
                    {p.step}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-[#17222C] flex items-center justify-between text-[11px] font-mono text-[#62717C]">
            <span>HASH ALGORITHM: SHA-256</span>
            <span className="text-[#67D6A0]">IMMUTABLE AUDIT LOGS</span>
          </div>
        </div>

        {/* Right Column: Live Audit Proof Ledger (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-[#080D13]/90 border border-[#17222C] text-left flex flex-col justify-between font-mono">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#17222C]">
              <span className="text-xs text-[#5CC8FF] uppercase tracking-wider">
                CRYPTOGRAPHIC AUDIT TRAIL
              </span>
              <span className="text-[10px] text-[#67D6A0] bg-[#67D6A015] px-2 py-0.5 rounded border border-[#67D6A030] font-bold">
                PROVABLE
              </span>
            </div>

            <div className="space-y-3 text-xs">
              {AUDIT_LEDGER.map((item) => (
                <div 
                  key={item.id} 
                  className="p-3 rounded-lg bg-[#0C131B] border border-[#17222C]"
                >
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-[#F2F6F8] font-bold">{item.citation}</span>
                    <span className="text-[#67D6A0] font-semibold">{item.status}</span>
                  </div>
                  <div className="text-[10px] text-[#62717C] flex items-center justify-between">
                    <span>DIGEST: {item.hash}</span>
                    <span>{item.latency}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-[#17222C] text-[11px] text-[#62717C] flex items-center justify-between">
            <span>EXPORT: JSON-LD &amp; PDF</span>
            <span className="text-[#5CC8FF]">ZERO DRIFT TOLERANCE</span>
          </div>
        </div>
      </div>
    </section>
  );
}
