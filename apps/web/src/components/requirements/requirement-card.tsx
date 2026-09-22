'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { setRequirementStatus } from '@/app/actions';

export function RequirementCard({ req }: { req: any }) {
  const [sourceOpen, setSourceOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const getSeverityColor = (sev: string) => {
    switch(sev) {
      case 'critical': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'high': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default: return 'bg-green-500/10 text-green-500 border-green-500/20';
    }
  };

  const handleApprove = async () => {
    setIsUpdating(true);
    await setRequirementStatus(req.id, 'approved');
    setIsUpdating(false);
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-[#0a0a0c] p-6 shadow-md transition-all hover:border-zinc-700">
      <div className="flex items-start justify-between mb-4">
        <div className="flex gap-3 items-center">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getSeverityColor(req.severity)}`}>
            {req.severity ? req.severity.charAt(0).toUpperCase() + req.severity.slice(1) : 'Unknown'}
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-400 uppercase tracking-wider">
            {req.type}
          </span>
          {req.confidence_score && (
            <span className="text-xs text-zinc-500">
              {Math.round(req.confidence_score * 100)}% AI Match
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {req.validation_status === 'approved' ? (
            <span className="flex items-center gap-1 text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md">
              <CheckCircle2 className="w-3.5 h-3.5" /> Approved
            </span>
          ) : (
            <button 
              onClick={handleApprove}
              disabled={isUpdating}
              className="flex items-center gap-1 text-xs font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-md transition-colors disabled:opacity-50"
            >
              <AlertCircle className="w-3.5 h-3.5" /> 
              {isUpdating ? 'Approving...' : 'Approve'}
            </button>
          )}
        </div>
      </div>

      <h3 className="text-lg font-semibold text-zinc-100 mb-2">{req.title}</h3>
      <p className="text-sm text-zinc-400 mb-6">{req.description}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Required Actions / Enforcement Controls */}
        <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800/50">
          <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 flex items-center justify-between">
            <span>Required Actions & Enforcement</span>
            {req.evidence_required?.enforced && (
              <span className="text-[10px] text-emerald-400 font-mono uppercase bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                Enforced Control
              </span>
            )}
          </h4>
          {req.actions?.items && req.actions.items.length > 0 ? (
            <ul className="list-disc list-inside text-sm text-zinc-300 space-y-1.5">
              {req.actions.items.map((action: string, i: number) => (
                <li key={i}>{action}</li>
              ))}
            </ul>
          ) : req.actions?.action ? (
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-zinc-500">Action Type:</span>
                <span className="px-2 py-0.5 rounded bg-blue-500/15 border border-blue-500/30 text-blue-300 font-mono font-bold text-[11px]">
                  {req.actions.action}
                </span>
              </div>
              {req.actions.authority && (
                <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                  <span className="text-zinc-500">Authority:</span>
                  <span className="text-zinc-300">{req.actions.authority}</span>
                </div>
              )}
              {req.evidence_required?.type && (
                <div className="flex items-center gap-2 text-[11px] text-zinc-400 pt-1 border-t border-zinc-800/60">
                  <span className="text-zinc-500">Evidence Required:</span>
                  <span className="text-emerald-400 font-mono text-[10px]">{req.evidence_required.type}</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-zinc-500">Statutory verification and compliance logging required.</p>
          )}
        </div>

        {/* Trigger Conditions / Machine-Executable AST Rules */}
        <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800/50">
          <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 flex items-center justify-between">
            <span>Trigger Conditions (AST Logic)</span>
            {req.conditions?.operator && (
              <span className="text-[10px] text-purple-400 font-mono font-bold uppercase bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                OP: {req.conditions.operator}
              </span>
            )}
          </h4>
          {req.conditions?.items && req.conditions.items.length > 0 ? (
            <ul className="list-disc list-inside text-sm text-zinc-300 space-y-1.5">
              {req.conditions.items.map((cond: string, i: number) => (
                <li key={i}>{cond}</li>
              ))}
            </ul>
          ) : req.conditions?.rules && Array.isArray(req.conditions.rules) && req.conditions.rules.length > 0 ? (
            <div className="space-y-2">
              {req.conditions.rules.map((rule: any, i: number) => (
                <div key={i} className="p-2 rounded bg-zinc-950/70 border border-zinc-800/70 text-xs font-mono flex flex-wrap items-center gap-1.5">
                  <span className="text-cyan-300">{rule.field || 'target'}</span>
                  <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-bold">
                    {rule.operator || 'EQUALS'}
                  </span>
                  <span className="text-emerald-400 font-bold">{String(rule.value !== undefined ? rule.value : true)}</span>
                </div>
              ))}
            </div>
          ) : typeof req.conditions === 'object' && Object.keys(req.conditions).length > 0 ? (
            <pre className="p-2 rounded bg-zinc-950/70 border border-zinc-800/70 text-[11px] font-mono text-zinc-300 overflow-x-auto max-h-24">
              {JSON.stringify(req.conditions, null, 2)}
            </pre>
          ) : (
            <p className="text-xs text-zinc-500">Autonomous evaluation active on statutory events.</p>
          )}
        </div>
      </div>

      <div className="border-t border-zinc-800 pt-4 mt-2">
        <button 
          onClick={() => setSourceOpen(!sourceOpen)}
          className="flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
        >
          {sourceOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          Cross-Reference Original Source Text
        </button>
        
        {sourceOpen && (
          <div className="mt-3 p-4 bg-zinc-950/90 rounded-lg border border-zinc-800/90 shadow-inner">
            {req.section_label && (
              <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-zinc-800/80">
                <span className="text-xs font-semibold text-blue-400 font-sans tracking-wide">
                  Statutory Citation: {req.section_label}
                </span>
                {req.references?.article && (
                  <span className="text-[11px] text-zinc-500 font-mono">
                    {req.references.article}
                  </span>
                )}
              </div>
            )}
            <div className="text-xs font-mono text-zinc-300 whitespace-pre-wrap leading-relaxed">
              {req.source_text || "No source text mapped to this requirement."}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
