import { LandingScrollHUD } from '@/components/landing/landing-scroll-hud';
import { HeroSection } from '@/components/landing/sections/hero-section';
import { CapabilitySignal } from '@/components/landing/sections/capability-signal';
import { WebsiteAuditorSection } from '@/components/landing/sections/website-auditor-section';
import { ProblemSection } from '@/components/landing/sections/problem-section';
import { TransformationSection } from '@/components/landing/sections/transformation-section';
import { HowItWorksSection } from '@/components/landing/sections/how-it-works-section';
import { InteractiveCompilation } from '@/components/landing/sections/interactive-compilation';
import { ArchitectureSection } from '@/components/landing/sections/architecture-section';
import { SecurityTraceability } from '@/components/landing/sections/security-traceability';
import { UseCasesSection } from '@/components/landing/sections/use-cases-section';
import { FinalCTASection } from '@/components/landing/sections/final-cta-section';

export default function LandingPage() {
  return (
    <>
      {/* Precision Reading Progress & Return Indicator */}
      <LandingScrollHUD />

      {/* 12-Section Continuous Story Narrative Container (Dimension from Light, Typography & Materials) */}
      <div className="relative z-10 w-full min-h-[150vh] space-y-28 pb-24">
        {/* Section 02 — Hero Entry & Product Preview */}
        <HeroSection />

        {/* Section 03 — Slim Technical Capability Signal */}
        <CapabilitySignal />

        {/* Atmospheric Section Transition: Deep Sapphire Light Bridge */}
        <div className="w-full max-w-5xl mx-auto h-px bg-gradient-to-r from-transparent via-[rgba(77,120,160,0.35)] to-transparent pointer-events-none" />

        {/* Section 03B — Automated Website Compliance Auditor (Autonomous Statutory Agent) */}
        <WebsiteAuditorSection />

        {/* Atmospheric Section Transition: Dusky Plum & Graphite Depth Bridge */}
        <div className="w-full max-w-5xl mx-auto h-px bg-gradient-to-r from-transparent via-[rgba(48,35,47,0.40)] to-transparent pointer-events-none" />

        {/* Section 04 — The Regulation Problem */}
        <ProblemSection />

        {/* Atmospheric Section Transition: Warm Champagne Highlight Bridge */}
        <div className="w-full max-w-5xl mx-auto h-px bg-gradient-to-r from-transparent via-[rgba(188,167,123,0.35)] to-transparent pointer-events-none" />

        {/* Section 05 — Regulation → Structured Logic Transformation */}
        <TransformationSection />

        {/* Atmospheric Section Transition: Dark Graphite & Titanium Bridge */}
        <div className="w-full max-w-5xl mx-auto h-px bg-gradient-to-r from-transparent via-[rgba(77,120,160,0.25)] to-transparent pointer-events-none" />

        {/* Section 06 — How The Compiler Works (5 Stages) */}
        <HowItWorksSection />

        {/* Atmospheric Section Transition: Champagne Reflection Bridge */}
        <div className="w-full max-w-5xl mx-auto h-px bg-gradient-to-r from-transparent via-[rgba(188,167,123,0.30)] to-transparent pointer-events-none" />

        {/* Section 07 — Interactive Compilation Environment */}
        <InteractiveCompilation />

        {/* Atmospheric Section Transition: Deep Sapphire Control Bridge */}
        <div className="w-full max-w-5xl mx-auto h-px bg-gradient-to-r from-transparent via-[rgba(77,120,160,0.35)] to-transparent pointer-events-none" />

        {/* Section 08 — Enterprise Architecture Layer */}
        <ArchitectureSection />

        {/* Atmospheric Section Transition: Sage Cryptographic Vault Bridge */}
        <div className="w-full max-w-5xl mx-auto h-px bg-gradient-to-r from-transparent via-[rgba(118,147,127,0.30)] to-transparent pointer-events-none" />

        {/* Section 09 — Security & Cryptographic Traceability */}
        <SecurityTraceability />

        {/* Atmospheric Section Transition: Executive Bronze & Champagne Bridge */}
        <div className="w-full max-w-5xl mx-auto h-px bg-gradient-to-r from-transparent via-[rgba(188,167,123,0.30)] to-transparent pointer-events-none" />

        {/* Section 10 — High-Stakes Use Cases */}
        <UseCasesSection />

        {/* Atmospheric Section Transition: Dual Sapphire & Champagne Halo Bridge */}
        <div className="w-full max-w-5xl mx-auto h-px bg-gradient-to-r from-transparent via-[rgba(77,120,160,0.35)] to-transparent pointer-events-none" />

        {/* Section 11 — Final Calmer CTA */}
        <FinalCTASection />
      </div>
    </>
  );
}
