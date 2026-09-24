'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Show, SignInButton } from '@clerk/nextjs';
import { ArrowRight, Terminal } from 'lucide-react';

export function FinalCTASection() {
  return (
    <section id="cta" className="w-full max-w-4xl mx-auto px-4 text-center pointer-events-auto pt-10">
      <div className="p-8 sm:p-14 rounded-2xl bg-[#0E1218] border border-[var(--rc-border)] shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#090D13] border border-[var(--rc-border-subtle)] text-[#93C5FD] text-xs font-mono font-medium uppercase tracking-wider mb-5">
            <Terminal className="w-3.5 h-3.5 text-[#3B82F6]" />
            Operational Readiness
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#F1F5F9] tracking-tight mb-4">
            Make Regulations Operational.
          </h2>

          <p className="text-[#94A3B8] text-base md:text-lg max-w-xl mx-auto mb-8 font-normal leading-relaxed">
            Access the live 24/7 statutory surveillance dashboard or compile your first regulatory document into machine-executable enforcement code today.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Show when="signed-in">
              <Link href="/dashboard">
                <Button 
                  size="lg" 
                  className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg font-medium px-8 h-11 transition-all cursor-pointer flex items-center gap-2 shadow-sm"
                >
                  <span>Start Compiling</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/regulations">
                <Button 
                  size="lg" 
                  variant="secondary" 
                  className="rounded-lg font-medium px-8 h-11 bg-[#141922] text-[#F1F5F9] border border-[var(--rc-border)] hover:border-[var(--rc-border-subtle)] hover:bg-[#141922]/80 cursor-pointer"
                >
                  Launch Compiler Studio
                </Button>
              </Link>
            </Show>

            <Show when="signed-out">
              <SignInButton mode="modal" fallbackRedirectUrl="/dashboard">
                <Button 
                  size="lg" 
                  className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg font-medium px-8 h-11 transition-all cursor-pointer flex items-center gap-2 shadow-sm"
                >
                  <span>Start Compiling</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </SignInButton>
              <SignInButton mode="modal" fallbackRedirectUrl="/regulations">
                <Button 
                  size="lg" 
                  variant="secondary" 
                  className="rounded-lg font-medium px-8 h-11 bg-[#141922] text-[#F1F5F9] border border-[var(--rc-border)] hover:border-[var(--rc-border-subtle)] hover:bg-[#141922]/80 cursor-pointer"
                >
                  Launch Compiler Studio
                </Button>
              </SignInButton>
            </Show>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-5 text-xs font-mono text-[#64748B]">
            <Link href="/terms" className="hover:text-[#94A3B8] transition-colors">
              Terms of Service
            </Link>
            <span>•</span>
            <Link href="/privacy" className="hover:text-[#94A3B8] transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <span>Deterministic AST Engine v2.4</span>
            <span>•</span>
            <span className="text-[#10B981]">24/7 Surveillance Daemon Active</span>
          </div>
        </div>
      </div>
    </section>
  );
}
