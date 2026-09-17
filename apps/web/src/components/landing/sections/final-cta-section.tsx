'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Show, SignInButton } from '@clerk/nextjs';
import { ArrowRight, Terminal } from 'lucide-react';

export function FinalCTASection() {
  return (
    <section id="cta" className="w-full max-w-4xl mx-auto px-4 text-center pointer-events-auto pt-10">
      <div className="p-8 sm:p-14 rounded-3xl bg-gradient-to-b from-[#080D13]/90 to-[#05070A]/95 border border-[#17222C] shadow-2xl backdrop-blur-xl relative overflow-hidden">
        {/* Subtle radial glow */}
        <div className="absolute inset-0 bg-radial-[at_50%_0%] from-[#5CC8FF12] via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#17222C]/70 border border-[#1E2C38] text-[#5CC8FF] text-xs font-mono font-medium uppercase tracking-wider mb-5">
            <Terminal className="w-3.5 h-3.5" />
            Operational Readiness
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#F2F6F8] tracking-tight mb-4">
            Make Regulations Operational.
          </h2>

          <p className="text-[#9AA9B5] text-base md:text-lg max-w-xl mx-auto mb-8 font-normal leading-relaxed">
            Access the live 24/7 statutory surveillance dashboard or compile your first regulatory document into machine-executable enforcement code today.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Show when="signed-in">
              <Link href="/dashboard">
                <Button 
                  size="lg" 
                  className="bg-[#5CC8FF] hover:bg-[#4bb3e6] text-[#05070A] rounded-xl font-semibold px-8 h-12 shadow-[0_0_25px_rgba(92,200,255,0.25)] hover:shadow-[0_0_35px_rgba(92,200,255,0.45)] transition-all cursor-pointer flex items-center gap-2"
                >
                  <span>Start Compiling</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/regulations">
                <Button 
                  size="lg" 
                  variant="secondary" 
                  className="rounded-xl font-semibold px-8 h-12 bg-[#0C131B] text-[#F2F6F8] border border-[#17222C] hover:border-[#1E2C38] hover:bg-[#17222C]/60 cursor-pointer"
                >
                  Launch Compiler Studio
                </Button>
              </Link>
            </Show>

            <Show when="signed-out">
              <SignInButton mode="modal" fallbackRedirectUrl="/dashboard">
                <Button 
                  size="lg" 
                  className="bg-[#5CC8FF] hover:bg-[#4bb3e6] text-[#05070A] rounded-xl font-semibold px-8 h-12 shadow-[0_0_25px_rgba(92,200,255,0.25)] hover:shadow-[0_0_35px_rgba(92,200,255,0.45)] transition-all cursor-pointer flex items-center gap-2"
                >
                  <span>Start Compiling</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </SignInButton>
              <SignInButton mode="modal" fallbackRedirectUrl="/regulations">
                <Button 
                  size="lg" 
                  variant="secondary" 
                  className="rounded-xl font-semibold px-8 h-12 bg-[#0C131B] text-[#F2F6F8] border border-[#17222C] hover:border-[#1E2C38] hover:bg-[#17222C]/60 cursor-pointer"
                >
                  Launch Compiler Studio
                </Button>
              </SignInButton>
            </Show>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-5 text-xs font-mono text-[#62717C]">
            <Link href="/terms" className="hover:text-[#9AA9B5] transition-colors">
              Terms of Service
            </Link>
            <span>•</span>
            <Link href="/privacy" className="hover:text-[#9AA9B5] transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <span>Deterministic AST Engine v2.4</span>
            <span>•</span>
            <span className="text-[#67D6A0]">24/7 Surveillance Daemon Active</span>
          </div>
        </div>
      </div>
    </section>
  );
}
