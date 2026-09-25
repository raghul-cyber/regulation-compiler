'use client';

import React from 'react';
import { 
  CheckCircle2, 
  ArrowRight, 
  BarChart3, 
  ShieldAlert, 
  X,
  ShieldCheck
} from 'lucide-react';
import { RCIcon } from '@/components/ui/rc-icon';
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
        className="relative w-full max-w-lg bg-[#080A0E] border border-[var(--rc-border)] rounded-2xl p-6 sm:p-8 shadow-2xl text-left animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 text-[#94A3B8] hover:text-[#F4F6F8] p-1 rounded-lg hover:bg-[#10141A] transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Success Icon & Badge */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] shadow-sm">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/25 mb-1">
              <RCIcon name="validation" size={12} className="text-[#10B981]" />
              <span>Assessment Completed</span>
            </div>
            <h2 className="text-xl font-bold text-[#F4F6F8] tracking-tight">
              Evaluation Complete!
            </h2>
          </div>
        </div>

        {/* Message */}
        <p className="text-sm text-[#94A3B8] mb-6 leading-relaxed">
          System payload successfully evaluated against active policy rules. Check the <span className="text-[#10B981] font-medium">Dashboard</span> and <span className="text-[#4D8FCC] font-medium">Gap Analysis</span> tabs to inspect updated compliance scores and rule outcomes.
        </p>

        {/* Interactive Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onNavigateToDashboard) onNavigateToDashboard();
            }}
            className="group flex flex-col p-4 rounded-xl bg-[#0B0E14] border border-[var(--rc-border)] hover:border-[#4D8FCC]/50 hover:bg-[#10141A] transition-all text-left cursor-pointer"
          >
            <div className="flex items-center justify-between w-full mb-2">
              <div className="p-2 rounded-lg bg-[#4D8FCC]/10 text-[#93C5FD] group-hover:bg-[#4D8FCC]/20 transition-colors">
                <BarChart3 className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-[#64748B] group-hover:text-[#93C5FD] group-hover:translate-x-1 transition-all" />
            </div>
            <span className="text-sm font-semibold text-[#F4F6F8] group-hover:text-[#93C5FD] transition-colors">
              Compliance Dashboard
            </span>
            <span className="text-xs text-[#94A3B8] mt-1">
              View real-time compliance score & breakdown
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              if (onNavigateToGaps) onNavigateToGaps();
            }}
            className="group flex flex-col p-4 rounded-xl bg-[#0B0E14] border border-[var(--rc-border)] hover:border-amber-500/50 hover:bg-[#10141A] transition-all text-left cursor-pointer"
          >
            <div className="flex items-center justify-between w-full mb-2">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 transition-colors">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-[#64748B] group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
            </div>
            <span className="text-sm font-semibold text-[#F4F6F8] group-hover:text-amber-300 transition-colors">
              Gap Analysis
            </span>
            <span className="text-xs text-[#94A3B8] mt-1">
              Inspect identified control violations & fixes
            </span>
          </button>
        </div>

        {/* Footer info & close */}
        <div className="flex items-center justify-between pt-4 border-t border-[var(--rc-border)] text-xs text-[#64748B] font-mono">
          <span>{policyTitle ? `Target: ${policyTitle}` : 'Policy Engine Ready'}</span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="text-xs text-[#94A3B8] hover:text-white cursor-pointer"
          >
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
}
