'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Show, SignInButton } from '@clerk/nextjs';
import { ArrowRight, Terminal } from 'lucide-react';

export function FinalCTASection() {
  return (
    <section id="cta" className="w-full max-w-4xl mx-auto px-4 text-center pointer-events-auto pt-10">
      <div className="p-8 sm:p-14 rounded-2xl bg-[#151311] border border-[rgba(201,196,186,0.12)] shadow-[0_24px_64px_rgba(0,0,0,0.8)] relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#100E0D] border border-[rgba(201,196,186,0.12)] text-[#AD956C] text-xs font-mono font-medium uppercase tracking-wider mb-5 shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
            <Terminal className="w-3.5 h-3.5 text-[#AD956C]" />
            Operational Readiness
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#F7F4EC] tracking-tight mb-4">
            Make Regulations Operational.
          </h2>

          <p className="text-[#C9C4BA] text-base md:text-lg max-w-xl mx-auto mb-8 font-normal leading-relaxed">
            Access the live 24/7 statutory surveillance dashboard or compile your first regulatory document into machine-executable enforcement code today.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Show when="signed-in">
              <Link href="/dashboard">
                <Button 
                  size="lg" 
                  className="bg-[#3F5C74] hover:bg-[#344D63] text-[#F7F4EC] rounded-lg font-medium px-8 h-11 transition-all cursor-pointer flex items-center gap-2 shadow-[0_2px_8px_rgba(0,0,0,0.5)] border border-[#AD956C]/25 active:scale-[0.98]"
                >
                  <span>Start Compiling</span>
                  <ArrowRight className="w-4 h-4 text-[#AD956C]" />
                </Button>
              </Link>
              <Link href="/regulations">
                <Button 
                  size="lg" 
                  variant="secondary" 
                  className="rounded-lg font-medium px-8 h-11 bg-[#1B1815] text-[#F1EEE7] border border-[rgba(201,196,186,0.12)] hover:border-[rgba(201,196,186,0.22)] hover:bg-[#211D19] cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
                >
                  Launch Compiler Studio
                </Button>
              </Link>
            </Show>

            <Show when="signed-out">
              <SignInButton mode="modal" fallbackRedirectUrl="/dashboard">
                <Button 
                  size="lg" 
                  className="bg-[#3F5C74] hover:bg-[#344D63] text-[#F7F4EC] rounded-lg font-medium px-8 h-11 transition-all cursor-pointer flex items-center gap-2 shadow-[0_2px_8px_rgba(0,0,0,0.5)] border border-[#AD956C]/25 active:scale-[0.98]"
                >
                  <span>Start Compiling</span>
                  <ArrowRight className="w-4 h-4 text-[#AD956C]" />
                </Button>
              </SignInButton>
              <SignInButton mode="modal" fallbackRedirectUrl="/regulations">
                <Button 
                  size="lg" 
                  variant="secondary" 
                  className="rounded-lg font-medium px-8 h-11 bg-[#1B1815] text-[#F1EEE7] border border-[rgba(201,196,186,0.12)] hover:border-[rgba(201,196,186,0.22)] hover:bg-[#211D19] cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
                >
                  Launch Compiler Studio
                </Button>
              </SignInButton>
            </Show>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-5 text-xs font-mono text-[#8D8982]">
            <Link href="/terms" className="hover:text-[#C9C4BA] transition-colors">
              Terms of Service
            </Link>
            <span>•</span>
            <Link href="/privacy" className="hover:text-[#C9C4BA] transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <span>Deterministic AST Engine v2.4</span>
            <span>•</span>
            <span className="text-[#718A79]">24/7 Surveillance Daemon Active</span>
          </div>
        </div>
      </div>
    </section>
  );
}
