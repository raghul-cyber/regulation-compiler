'use client';

import Link from 'next/link';
import { Show, SignInButton } from '@clerk/nextjs';
import { ArrowRight, Terminal } from 'lucide-react';
import { useMagneticCTA } from '@/hooks/use-tactile-motion';

export function FinalCTASection() {
  const { ref: magneticRef, style: magneticStyle } = useMagneticCTA(3);

  return (
    <section id="cta" className="w-full max-w-4xl mx-auto px-4 text-center pointer-events-auto pt-10 relative">
      {/* Quiet Corridor / Vault Exit Atmosphere (Sapphire & Champagne Halo) */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[380px] rounded-full blur-[140px] pointer-events-none -z-10"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(77, 120, 160, 0.28) 0%, rgba(188, 167, 123, 0.12) 45%, transparent 80%)',
        }}
        aria-hidden="true"
      />

      <div className="p-8 sm:p-14 rounded-2xl rc-glass-smoked-elevated border border-[rgba(199,204,210,0.14)] shadow-[0_32px_80px_rgba(9,11,15,0.85)] relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#171C23] border border-[rgba(199,204,210,0.14)] text-[#BCA77B] text-xs font-mono font-medium uppercase tracking-wider mb-5 shadow-[0_4px_16px_rgba(9,11,15,0.5)] backdrop-blur-md">
            <Terminal className="w-3.5 h-3.5 text-[#BCA77B]" />
            Operational Readiness
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#FAF9F5] tracking-tight mb-4">
            Make Regulations Operational.
          </h2>

          <p className="text-[#C7CCD2] text-base md:text-lg max-w-xl mx-auto mb-8 font-normal leading-relaxed">
            Access the live 24/7 statutory surveillance dashboard or compile your first regulatory document into machine-executable enforcement code today.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Show when="signed-in">
              <Link href="/dashboard">
                <button 
                  ref={magneticRef as any}
                  style={magneticStyle}
                  className="rc-btn-sapphire-metal rounded-[6px] font-medium px-8 h-11 transition-all cursor-pointer flex items-center gap-2 text-sm shadow-[0_4px_20px_rgba(9,11,15,0.7)]"
                >
                  <span>Start Compiling</span>
                  <ArrowRight className="w-4 h-4 text-[#BCA77B]" />
                </button>
              </Link>
              <Link href="/regulations">
                <button 
                  className="rc-btn-graphite-metal rounded-[6px] font-medium px-8 h-11 cursor-pointer flex items-center gap-2 text-sm"
                >
                  Launch Compiler Studio
                </button>
              </Link>
            </Show>

            <Show when="signed-out">
              <SignInButton mode="modal" fallbackRedirectUrl="/dashboard">
                <button 
                  ref={magneticRef as any}
                  style={magneticStyle}
                  className="rc-btn-sapphire-metal rounded-[6px] font-medium px-8 h-11 transition-all cursor-pointer flex items-center gap-2 text-sm shadow-[0_4px_20px_rgba(9,11,15,0.7)]"
                >
                  <span>Start Compiling</span>
                  <ArrowRight className="w-4 h-4 text-[#BCA77B]" />
                </button>
              </SignInButton>
              <SignInButton mode="modal" fallbackRedirectUrl="/regulations">
                <button 
                  className="rc-btn-graphite-metal rounded-[6px] font-medium px-8 h-11 cursor-pointer flex items-center gap-2 text-sm"
                >
                  Launch Compiler Studio
                </button>
              </SignInButton>
            </Show>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-5 text-xs font-mono text-[#969DA6]">
            <Link href="/terms" className="hover:text-[#C7CCD2] transition-colors">
              Terms of Service
            </Link>
            <span>•</span>
            <Link href="/privacy" className="hover:text-[#C7CCD2] transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <span>Deterministic AST Engine v2.4</span>
            <span>•</span>
            <span className="text-[#76937F]">24/7 Surveillance Daemon Active</span>
          </div>
        </div>
      </div>
    </section>
  );
}
