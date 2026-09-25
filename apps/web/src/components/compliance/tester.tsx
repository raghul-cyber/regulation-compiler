'use client';

import { useState } from 'react';
import { runComplianceCheck } from '@/app/actions';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const defaultPayload = `{
  "data_retention_days": 30,
  "encryption": "AES-256",
  "mfa_enabled": true
}`;

export function ComplianceTester({ regulations }: { regulations: any[] }) {
  const [targetRegulation, setTargetRegulation] = useState(regulations[0]?.id || '');
  const [jsonPayload, setJsonPayload] = useState(defaultPayload);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const runCheck = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setResult(null);

    try {
      let parsed;
      try {
        parsed = JSON.parse(jsonPayload);
      } catch (e) {
        throw new Error("Invalid JSON payload");
      }

      if (!targetRegulation) {
        throw new Error("No regulation selected");
      }

      const res = await runComplianceCheck(targetRegulation, parsed);

      if (!res.success) {
        throw new Error(res.error || "Unknown error occurred");
      }

      setResult(res.data);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 w-full mx-auto">
      {/* Input Section */}
      <div className="space-y-4">
        <div className="bg-[#080A0E] border border-[var(--rc-border)] rounded-2xl overflow-hidden shadow-xl focus-within:border-[#4D8FCC]/50 transition-all duration-200">
          <div className="bg-[#0B0E14] px-5 py-3.5 border-b border-[var(--rc-border)] flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
              <span className="ml-2 text-xs font-mono font-semibold text-[#94A3B8] uppercase tracking-wider">
                System Payload (JSON)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[#64748B] uppercase">Target Policy:</span>
              <select 
                id="targetRegulation"
                name="targetRegulation"
                value={targetRegulation}
                onChange={(e) => setTargetRegulation(e.target.value)}
                className="bg-[#10141A] text-xs font-mono text-[#F4F6F8] border border-[var(--rc-border)] rounded-lg px-2.5 py-1 outline-none cursor-pointer hover:border-[#4D8FCC]/50 transition-colors"
              >
                {regulations.map(r => (
                  <option key={r.id} value={r.id} className="bg-[#080A0E] text-[#CBD5E1]">{r.name}</option>
                ))}
                {regulations.length === 0 && <option value="" disabled>No regulations available</option>}
              </select>
            </div>
          </div>
          <div className="relative">
            <textarea 
              id="jsonPayload"
              name="jsonPayload"
              value={jsonPayload}
              onChange={(e) => setJsonPayload(e.target.value)}
              className="w-full h-[420px] bg-transparent p-5 text-sm font-mono text-[#CBD5E1] focus:outline-none resize-none transition-all placeholder:text-[#64748B] leading-relaxed selection:bg-[#4D8FCC]/30"
              spellCheck="false"
            />
            <div className="absolute bottom-3 right-4 font-mono text-[10px] text-[#64748B] tracking-wider">
              JSON • UTF-8 • AST COMPLIANT
            </div>
          </div>
        </div>
        
        <button 
          onClick={runCheck}
          disabled={isLoading || regulations.length === 0}
          className="w-full bg-[#4D8FCC] hover:bg-[#3D7BBB] disabled:bg-[#10141A] disabled:text-[#64748B] disabled:pointer-events-none text-white font-mono font-medium text-sm py-3.5 rounded-xl transition-all shadow-sm flex justify-center items-center gap-2.5 cursor-pointer"
        >
          {isLoading ? (
            <><Loader2 className="w-4 h-4 animate-spin text-white" /> <span className="tracking-wider uppercase">Evaluating Statutory AST...</span></>
          ) : (
            <span className="tracking-wider uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white" />
              Execute Compliance Verification
            </span>
          )}
        </button>
      </div>

      {/* Output Section */}
      <div className="bg-[#080A0E] border border-[var(--rc-border)] rounded-2xl p-6 shadow-xl relative overflow-hidden min-h-[480px] flex flex-col">
        {errorMsg && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-4 rounded-xl text-xs font-mono mb-4 flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {result ? (
          <div className="space-y-6 flex-1 flex flex-col">
            <div className="flex items-center justify-between border-b border-[var(--rc-border)] pb-4">
              <div>
                <h2 className="text-base font-bold text-[#F4F6F8] flex items-center gap-2">
                  <span>Evaluation Diagnostic</span>
                  <span className="text-xs font-mono text-[#64748B] font-normal">| AST Engine v2.4</span>
                </h2>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border tracking-wider uppercase flex items-center gap-1.5 ${
                result.is_compliant 
                  ? 'bg-[#10B981]/15 border-[#10B981]/30 text-[#10B981]' 
                  : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${result.is_compliant ? 'bg-[#10B981]' : 'bg-rose-400'}`} />
                {result.is_compliant ? 'STATUS: COMPLIANT (PASS)' : 'STATUS: NON-COMPLIANT (FAIL)'}
              </span>
            </div>

            {!result.is_compliant && result.violations && result.violations.length > 0 ? (
              <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                <div className="flex items-center justify-between text-xs font-mono font-semibold text-[#94A3B8] uppercase tracking-wider">
                  <span>Violations Detected ({result.violations.length})</span>
                  <span className="text-[10px] text-rose-400 font-normal">Immediate Remediation Required</span>
                </div>
                {result.violations.map((violation: any, i: number) => (
                  <div key={i} className="bg-rose-500/[0.04] border border-rose-500/20 hover:border-rose-500/40 transition-colors p-4 rounded-xl">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-semibold text-rose-200 line-clamp-1 mr-2" title={violation.title}>
                        {violation.title}
                      </span>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded font-bold bg-[#10141A] text-rose-400 shrink-0 border border-rose-500/30">
                        {violation.severity || 'CRITICAL'}
                      </span>
                    </div>
                    <p className="text-xs text-[#94A3B8] leading-relaxed font-sans mt-1">{violation.message}</p>
                  </div>
                ))}
              </div>
            ) : result.is_compliant ? (
              <div className="flex flex-col items-center justify-center flex-1 text-center py-8">
                <div className="w-16 h-16 bg-[#10B981]/10 rounded-2xl flex items-center justify-center mb-5 border border-[#10B981]/30">
                  <CheckCircle2 className="w-8 h-8 text-[#10B981]" />
                </div>
                <h3 className="text-lg font-bold text-[#F4F6F8]">Zero Statutory Infractions</h3>
                <p className="text-xs text-[#94A3B8] mt-1.5 max-w-sm leading-relaxed">
                  Payload satisfies all compiled AST constraints for active policy <span className="text-[#4D8FCC] font-mono">[{targetRegulation || 'Selected'}]</span>.
                </p>
                <div className="mt-5 px-3 py-1.5 rounded-lg bg-[#050608] border border-[var(--rc-border)] text-[11px] font-mono text-[#64748B]">
                  Verification Timestamp: {new Date().toISOString()}
                </div>
              </div>
            ) : null}
          </div>
        ) : !isLoading && !errorMsg ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-[#64748B] pointer-events-none">
            <div className="w-14 h-14 rounded-full border border-dashed border-[var(--rc-border)] flex items-center justify-center mb-3">
              <AlertCircle className="w-6 h-6 opacity-30 text-[#4D8FCC]" />
            </div>
            <p className="text-xs font-mono tracking-wider uppercase text-[#94A3B8]">Awaiting Payload Execution</p>
            <span className="text-[11px] text-[#64748B] mt-1">Select policy, specify JSON, and click Execute</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
