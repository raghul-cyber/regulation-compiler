'use client';

import React from 'react';
import { 
  CheckCircle2, 
  ArrowRight, 
  BarChart3, 
  ShieldAlert, 
  X,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EvaluationResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToDashboard?: () => void;
  onNavigateToGaps?: () => void;
  policyTitle?: string;
}

export function EvaluationResultModal({
  isOpen,
  onClose,
  onNavigateToDashboard,
  onNavigateToGaps,
  policyTitle
}: EvaluationResultModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg bg-[#0c0c11] border border-emerald-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-emerald-950/50 overflow-hidden text-left animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-40 bg-emerald-500/15 blur-3xl pointer-events-none rounded-full" />

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800/60 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Success Icon & Badge */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-sm shadow-emerald-500/20">
            <CheckCircle2 className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-1">
              <Sparkles className="w-3 h-3" />
              <span>Assessment Completed</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Evaluation Complete!
            </h2>
          </div>
        </div>

        {/* Message */}
        <p className="text-sm text-zinc-300 mb-6 leading-relaxed">
          System payload successfully evaluated against active policy rules. Check the <span className="text-emerald-400 font-medium">Dashboard</span> and <span className="text-blue-400 font-medium">Gap Analysis</span> tabs to inspect updated compliance scores and rule outcomes.
        </p>

        {/* Interactive Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onNavigateToDashboard) onNavigateToDashboard();
            }}
            className="group flex flex-col p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 hover:border-blue-500/50 hover:bg-blue-950/20 transition-all text-left"
          >
            <div className="flex items-center justify-between w-full mb-2">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                <BarChart3 className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
            </div>
            <span className="text-sm font-semibold text-white group-hover:text-blue-300 transition-colors">
              Compliance Dashboard
            </span>
            <span className="text-xs text-zinc-400 mt-1">
              View real-time compliance score & breakdown
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              if (onNavigateToGaps) onNavigateToGaps();
            }}
            className="group flex flex-col p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 hover:border-emerald-500/50 hover:bg-emerald-950/20 transition-all text-left"
          >
            <div className="flex items-center justify-between w-full mb-2">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
            </div>
            <span className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors">
              Gap Analysis
            </span>
            <span className="text-xs text-zinc-400 mt-1">
              Inspect violations & trigger remediation
            </span>
          </button>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-800/80">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-zinc-400 hover:text-white hover:bg-zinc-800/60"
          >
            Stay on Policies
          </Button>
          <Button
            onClick={() => {
              onClose();
              if (onNavigateToDashboard) onNavigateToDashboard();
            }}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-md shadow-emerald-900/40"
          >
            Open Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
