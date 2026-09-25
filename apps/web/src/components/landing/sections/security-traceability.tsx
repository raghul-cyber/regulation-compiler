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
    <section id="security" className="w-full max-w-6xl mx-auto px-4 md:px-6 pointer-events-auto scroll-mt-24 relative">
      {/* Secure Vault Atmosphere (Sage Cryptographic Glow & Sapphire Depth) */}
      <div 
        className="absolute top-1/3 left-1/4 w-[620px] h-[400px] rounded-full blur-[150px] pointer-events-none -z-10"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(118, 147, 127, 0.20) 0%, rgba(77, 120, 160, 0.12) 50%, transparent 80%)',
        }}
        aria-hidden="true"
      />

      {/* Title */}
      <div className="text-center max-w-3xl mx-auto mb-14">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#171C23] border border-[rgba(199,204,210,0.14)] text-[#BCA77B] text-xs font-mono font-medium uppercase tracking-wider mb-4 shadow-[0_4px_16px_rgba(9,11,15,0.5)] backdrop-blur-md">
          <ShieldCheck className="w-3.5 h-3.5 text-[#BCA77B]" />
          Traceability &amp; Integrity
        </div>
        <h2 className="text-3xl sm:text-5xl font-extrabold text-[#FAF9F5] tracking-tight leading-tight">
          Tamper-Evident Cryptographic Auditability
        </h2>
        <p className="mt-4 text-base md:text-lg text-[#C7CCD2] leading-relaxed">
          Every compliance check emits an immutable cryptographic hash, formal pass/fail outcome, and automated audit trail. Generate verifiable regulatory dossiers in milliseconds.
        </p>
      </div>

      {/* Grid: 5-Stage System Trace Graph (Left) & Audit Trail Ledger (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Trace Pipeline (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-xl rc-glass-smoked-elevated border border-[rgba(199,204,210,0.12)] text-left flex flex-col justify-between shadow-[0_24px_64px_rgba(9,11,15,0.8)]">
          <div>
            <div className="font-mono text-xs text-[#BCA77B] uppercase tracking-wider mb-4 font-bold">
              SYSTEM INTEGRITY GRAPH // VERIFICATION PIPELINE
            </div>
            
            <div className="space-y-3 font-mono">
              {TRACE_PIPELINE.map((p, idx) => (
                <div 
                  key={p.step} 
                  className="p-3.5 rounded-lg bg-[#0C0F14] border border-[rgba(199,204,210,0.08)] flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded bg-[#171C23] text-[#BCA77B] flex items-center justify-center text-[10px] font-bold border border-[rgba(199,204,210,0.10)]">
                      0{idx + 1}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-[#FAF9F5]">{p.label}</div>
                      <div className="text-[11px] text-[#C7CCD2]">{p.desc}</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-[#7299B4] bg-[#4D78A0]/25 px-2 py-0.5 rounded border border-[#4D78A0]/40 shrink-0 font-bold">
                    {p.step}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-[rgba(199,204,210,0.08)] flex items-center justify-between text-[11px] font-mono text-[#969DA6]">
            <span>HASH ALGORITHM: SHA-256</span>
            <span className="text-[#76937F]">IMMUTABLE AUDIT LOGS</span>
          </div>
        </div>

        {/* Right Column: Live Audit Proof Ledger (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-xl rc-glass-smoked-elevated border border-[rgba(199,204,210,0.12)] text-left flex flex-col justify-between font-mono shadow-[0_24px_64px_rgba(9,11,15,0.8)]">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[rgba(199,204,210,0.08)]">
              <span className="text-xs text-[#BCA77B] uppercase tracking-wider font-bold">
                CRYPTOGRAPHIC AUDIT TRAIL
              </span>
              <span className="text-[10px] text-[#76937F] bg-[#76937F]/15 px-2 py-0.5 rounded border border-[#76937F]/35 font-bold">
                PROVABLE
              </span>
            </div>

            <div className="space-y-3 text-xs">
              {AUDIT_LEDGER.map((item) => (
                <div 
                  key={item.id} 
                  className="p-3 rounded-lg bg-[#0C0F14] border border-[rgba(199,204,210,0.08)]"
                >
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-[#FAF9F5] font-bold">{item.citation}</span>
                    <span className="text-[#76937F] font-semibold">{item.status}</span>
                  </div>
                  <div className="text-[10px] text-[#969DA6] flex items-center justify-between">
                    <span>DIGEST: {item.hash}</span>
                    <span>{item.latency}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-[rgba(199,204,210,0.08)] text-[11px] font-mono text-[#969DA6] flex items-center justify-between">
            <span>EXPORT: JSON-LD &amp; PDF</span>
            <span className="text-[#BCA77B]">ZERO DRIFT TOLERANCE</span>
          </div>
        </div>
      </div>
    </section>
  );
}
