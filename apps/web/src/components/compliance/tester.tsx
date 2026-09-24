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
        <div className="stitch-card bg-gradient-to-b from-[#080E16]/90 to-[#03060A]/95 border border-[#162A3B] rounded-2xl overflow-hidden shadow-[0_16px_50px_rgba(0,0,0,0.6)] focus-within:border-[#00F0FF]/50 transition-all duration-300">
          <div className="bg-[#05090F] px-5 py-3.5 border-b border-[#162A3B] flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
              <span className="ml-2 text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider">
                System Payload (JSON)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-zinc-500 uppercase">Target Policy:</span>
              <select 
                id="targetRegulation"
                name="targetRegulation"
                value={targetRegulation}
                onChange={(e) => setTargetRegulation(e.target.value)}
                className="bg-[#0A121C] text-xs font-mono text-[#00F0FF] border border-[#162A3B] rounded-lg px-2.5 py-1 outline-none cursor-pointer hover:border-[#00F0FF]/50 transition-colors"
              >
                {regulations.map(r => (
                  <option key={r.id} value={r.id} className="bg-[#05090F] text-zinc-300">{r.name}</option>
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
              className="w-full h-[420px] bg-transparent p-5 text-sm font-mono text-cyan-100/90 focus:outline-none resize-none transition-all placeholder:text-zinc-600 leading-relaxed selection:bg-[#00F0FF]/30"
              spellCheck="false"
            />
            <div className="absolute bottom-3 right-4 font-mono text-[10px] text-zinc-500 tracking-wider">
              JSON • UTF-8 • AST COMPLIANT
            </div>
          </div>
        </div>
        
        <button 
          onClick={runCheck}
          disabled={isLoading || regulations.length === 0}
          className="w-full relative group overflow-hidden bg-gradient-to-r from-[#00F0FF] via-[#00B4D8] to-[#0077B6] hover:brightness-110 active:scale-[0.99] disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-500 disabled:pointer-events-none text-[#020508] font-mono font-bold text-sm py-3.5 rounded-xl transition-all shadow-[0_0_25px_rgba(0,240,255,0.25)] hover:shadow-[0_0_35px_rgba(0,240,255,0.45)] flex justify-center items-center gap-2.5 cursor-pointer"
        >
          {isLoading ? (
            <><Loader2 className="w-4 h-4 animate-spin text-[#020508]" /> <span className="tracking-wider uppercase">Evaluating Statutory AST...</span></>
          ) : (
            <span className="tracking-wider uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#020508] animate-pulse" />
              Execute Compliance Verification
            </span>
          )}
        </button>
      </div>

      {/* Output Section */}
      <div className="stitch-card bg-gradient-to-b from-[#080E16]/90 to-[#03060A]/95 border border-[#162A3B] rounded-2xl p-6 shadow-[0_16px_50px_rgba(0,0,0,0.6)] relative overflow-hidden min-h-[480px] flex flex-col backdrop-blur-xl">
        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-xs font-mono mb-4 flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {result ? (
          <div className="space-y-6 flex-1 flex flex-col">
            <div className="flex items-center justify-between border-b border-[#162A3B] pb-4">
              <div>
                <h2 className="text-base font-extrabold text-zinc-100 flex items-center gap-2">
                  <span>Evaluation Diagnostic</span>
                  <span className="text-xs font-mono text-zinc-500 font-normal">| AST Engine v2.4</span>
                </h2>
              </div>
              <span className={`px-3.5 py-1 rounded-full text-xs font-mono font-bold border tracking-wider uppercase flex items-center gap-1.5 ${
                result.is_compliant 
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.25)]' 
                  : 'bg-red-500/15 border-red-500/40 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.25)]'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${result.is_compliant ? 'bg-emerald-400' : 'bg-red-400'} animate-ping`} />
                {result.is_compliant ? 'STATUS: COMPLIANT (PASS)' : 'STATUS: NON-COMPLIANT (FAIL)'}
              </span>
            </div>

            {!result.is_compliant && result.violations && result.violations.length > 0 ? (
              <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                <div className="flex items-center justify-between text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider">
                  <span>Violations Detected ({result.violations.length})</span>
                  <span className="text-[10px] text-red-400 font-normal">Immediate Remediation Required</span>
                </div>
                {result.violations.map((violation: any, i: number) => (
                  <div key={i} className="bg-red-500/[0.04] border border-red-500/20 hover:border-red-500/40 transition-colors p-4 rounded-xl">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-semibold text-red-200 line-clamp-1 mr-2" title={violation.title}>
                        {violation.title}
                      </span>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded font-bold bg-red-950/60 text-red-400 shrink-0 border border-red-500/30">
                        {violation.severity || 'CRITICAL'}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed font-sans mt-1">{violation.message}</p>
                  </div>
                ))}
              </div>
            ) : result.is_compliant ? (
              <div className="flex flex-col items-center justify-center flex-1 text-center py-8">
                <div className="w-20 h-20 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-5 border border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.3)]">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-zinc-100">Zero Statutory Infractions</h3>
                <p className="text-xs text-zinc-400 mt-1.5 max-w-sm leading-relaxed">
                  Payload satisfies all compiled AST constraints for active policy <span className="text-[#00F0FF] font-mono">[{targetRegulation || 'Selected'}]</span>.
                </p>
                <div className="mt-5 px-3 py-1.5 rounded-lg bg-[#050A10] border border-[#162A3B] text-[11px] font-mono text-zinc-500">
                  Verification Timestamp: {new Date().toISOString()}
                </div>
              </div>
            ) : null}
          </div>
        ) : !isLoading && !errorMsg ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600 pointer-events-none">
            <div className="w-16 h-16 rounded-full border border-dashed border-[#162A3B] flex items-center justify-center mb-3">
              <AlertCircle className="w-8 h-8 opacity-30 text-[#00F0FF]" />
            </div>
            <p className="text-xs font-mono tracking-wider uppercase text-zinc-500">Awaiting Payload Execution</p>
            <span className="text-[11px] text-zinc-600 mt-1">Select policy, specify JSON, and click Execute</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
