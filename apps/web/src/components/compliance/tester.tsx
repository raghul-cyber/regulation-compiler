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
        <div className="bg-[#090a0f] border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl focus-within:border-blue-500/50 transition-all">
          <div className="bg-zinc-950/80 px-5 py-3.5 border-b border-zinc-800/80 flex justify-between items-center">
            <span className="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider">
              System Payload (JSON)
            </span>
            <select 
              id="targetRegulation"
              name="targetRegulation"
              value={targetRegulation}
              onChange={(e) => setTargetRegulation(e.target.value)}
              className="bg-zinc-900 border border-zinc-700/60 rounded-lg px-2.5 py-1 text-xs text-zinc-200 outline-none cursor-pointer hover:border-zinc-500 transition-colors"
            >
              {regulations.map(r => (
                <option key={r.id} value={r.id} className="bg-zinc-900 text-zinc-200">
                  {r.name}
                </option>
              ))}
              {regulations.length === 0 && <option value="" disabled>No regulations available</option>}
            </select>
          </div>
          <textarea 
            id="jsonPayload"
            name="jsonPayload"
            value={jsonPayload}
            onChange={(e) => setJsonPayload(e.target.value)}
            className="w-full h-[420px] bg-transparent p-5 text-sm font-mono text-zinc-200 focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500/40 resize-none transition-all leading-relaxed custom-scrollbar"
            spellCheck="false"
          />
        </div>
        
        <button 
          onClick={runCheck}
          disabled={isLoading || regulations.length === 0}
          className="w-full bg-blue-600 hover:bg-blue-500 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-blue-500/50 focus:outline-none disabled:bg-zinc-800 disabled:text-zinc-500 disabled:pointer-events-none text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/35 flex justify-center items-center gap-2 cursor-pointer btn-tactile"
        >
          {isLoading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Evaluating Policy Against AST Rules...</>
          ) : (
            'Run Compliance Verification Check'
          )}
        </button>
      </div>

      {/* Output Section */}
      <div className="bg-[#090a0f] border border-zinc-800/80 rounded-2xl p-6 shadow-xl relative overflow-hidden min-h-[480px] flex flex-col justify-between">
        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/25 text-red-300 p-4 rounded-xl text-sm mb-4">
            {errorMsg}
          </div>
        )}

        {result ? (
          <div className="space-y-6 flex-1 flex flex-col">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">Evaluation Result</h2>
                <p className="text-xs text-zinc-400 mt-0.5">Deterministic AST Verification Outcome</p>
              </div>
              <span className={`px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
                result.is_compliant 
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' 
                  : 'bg-red-500/15 border-red-500/30 text-red-400'
              }`}>
                {result.is_compliant ? '● COMPLIANT' : '▲ VIOLATIONS DETECTED'}
              </span>
            </div>

            {!result.is_compliant && result.violations && result.violations.length > 0 ? (
              <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <h3 className="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider">
                  Violations Detected ({result.violations.length})
                </h3>
                {result.violations.map((violation: any, i: number) => (
                  <div key={i} className="bg-red-950/20 border border-red-500/25 p-4 rounded-xl">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-semibold text-red-200 line-clamp-1 mr-2" title={violation.title}>
                        {violation.title}
                      </span>
                      <span className="text-[10px] uppercase px-2 py-0.5 rounded font-bold bg-red-900/30 text-red-400 shrink-0 border border-red-500/20">
                        {violation.severity}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">{violation.message}</p>
                  </div>
                ))}
              </div>
            ) : result.is_compliant ? (
              <div className="flex flex-col items-center justify-center flex-1 text-center py-12">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-4 border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-white">All Policy Checks Passed</h3>
                <p className="text-sm text-zinc-400 mt-1 max-w-sm">
                  System payload matches all statutory constraints and threshold assertions.
                </p>
              </div>
            ) : null}
          </div>
        ) : !isLoading && !errorMsg ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600 pointer-events-none p-6 text-center">
            <AlertCircle className="w-10 h-10 mb-3 opacity-25" />
            <p className="text-sm font-medium text-zinc-400">Awaiting payload evaluation...</p>
            <p className="text-xs text-zinc-600 mt-1">Select a regulation and click "Run Compliance Verification Check"</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
