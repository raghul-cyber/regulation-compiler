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
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 w-full w-full mx-auto">
      {/* Input Section */}
      <div className="space-y-4">
        <div className="bg-[#0a0a0c] border border-zinc-800 rounded-xl overflow-hidden shadow-lg focus-within:border-blue-500/50 transition-colors">
          <div className="bg-zinc-950 px-4 py-3 border-b border-zinc-800 flex justify-between items-center">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">System Payload (JSON)</span>
            <select 
              id="targetRegulation"
              name="targetRegulation"
              value={targetRegulation}
              onChange={(e) => setTargetRegulation(e.target.value)}
              className="bg-transparent text-sm text-zinc-300 outline-none cursor-pointer hover:text-white"
            >
              {regulations.map(r => (
                <option key={r.id} value={r.id} className="bg-zinc-900">{r.name}</option>
              ))}
              {regulations.length === 0 && <option value="" disabled>No regulations available</option>}
            </select>
          </div>
          <textarea 
            id="jsonPayload"
            name="jsonPayload"
            value={jsonPayload}
            onChange={(e) => setJsonPayload(e.target.value)}
            className="w-full h-[400px] bg-transparent p-4 text-sm font-mono text-zinc-300 focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500/50 resize-none transition-all"
            spellCheck="false"
          />
        </div>
        
        <button 
          onClick={runCheck}
          disabled={isLoading || regulations.length === 0}
          className="w-full bg-blue-600 hover:bg-blue-500 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-blue-500/50 focus:outline-none disabled:bg-zinc-800 disabled:text-zinc-500 disabled:pointer-events-none text-white font-semibold py-2.5 rounded-lg transition-all shadow-[0_0_15px_rgba(37,99,235,0.2)] flex justify-center items-center gap-2"
        >
          {isLoading ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Evaluating Policy...</>
          ) : (
            'Run Compliance Check'
          )}
        </button>
      </div>

      {/* Output Section */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 shadow-inner relative overflow-hidden min-h-[400px] flex flex-col">
        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg text-sm mb-4">
            {errorMsg}
          </div>
        )}

        {result ? (
          <div className="space-y-6 flex-1 flex flex-col">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h2 className="text-lg font-bold text-zinc-200">Evaluation Result</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-bold border ${result.is_compliant ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                {result.is_compliant ? 'PASS' : 'FAIL'}
              </span>
            </div>

            {!result.is_compliant && result.violations && result.violations.length > 0 ? (
              <div className="space-y-3 flex-1 overflow-y-auto pr-2">
                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Violations Detected</h3>
                {result.violations.map((violation: any, i: number) => (
                  <div key={i} className="bg-red-500/5 border border-red-500/10 p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-red-300 line-clamp-1 mr-2" title={violation.title}>{violation.title}</span>
                      <span className="text-[10px] uppercase px-2 py-0.5 rounded font-bold bg-red-900/30 text-red-400 shrink-0 border border-red-500/20">
                        {violation.severity}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-2">{violation.message}</p>
                  </div>
                ))}
              </div>
            ) : result.is_compliant ? (
              <div className="flex flex-col items-center justify-center flex-1 text-center">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-zinc-200 font-medium">All Checks Passed</h3>
                <p className="text-sm text-zinc-500 mt-1">System payload complies with the active policy.</p>
              </div>
            ) : null}
          </div>
        ) : !isLoading && !errorMsg ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600 pointer-events-none">
            <AlertCircle className="w-12 h-12 mb-3 opacity-20" />
            <p className="text-sm">Awaiting payload evaluation...</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
