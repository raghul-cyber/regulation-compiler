import { ComplianceField } from '@/components/landing/compliance-field/compliance-field-lazy';
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
      {/* 3D THE COMPLIANCE FIELD WebGL Computational Environment */}
      <ComplianceField />

      {/* Floating Scroll HUD & Reading Laser Line */}
      <LandingScrollHUD />

      {/* 12-Section Continuous Story Narrative Container */}
      <div className="relative z-10 w-full min-h-[150vh] pointer-events-none space-y-28 pb-24">
        {/* Section 02 — Hero Entry & Product Preview */}
        <HeroSection />

        {/* Section 03 — Slim Technical Capability Signal */}
        <CapabilitySignal />

        {/* Laser Section Divider */}
        <div className="w-full max-w-5xl mx-auto h-px bg-gradient-to-r from-transparent via-[#17222C] to-transparent pointer-events-none" />

        {/* Section 03B — Automated Website Compliance Auditor (Autonomous Statutory Agent) */}
        <WebsiteAuditorSection />

        {/* Laser Section Divider */}
        <div className="w-full max-w-5xl mx-auto h-px bg-gradient-to-r from-transparent via-[#17222C] to-transparent pointer-events-none" />

        {/* Section 04 — The Regulation Problem */}
        <ProblemSection />

        {/* Laser Section Divider */}
        <div className="w-full max-w-5xl mx-auto h-px bg-gradient-to-r from-transparent via-[#17222C] to-transparent pointer-events-none" />

        {/* Section 05 — Regulation → Structured Logic Transformation */}
        <TransformationSection />

        {/* Laser Section Divider */}
        <div className="w-full max-w-5xl mx-auto h-px bg-gradient-to-r from-transparent via-[#17222C] to-transparent pointer-events-none" />

        {/* Section 06 — How The Compiler Works (5 Stages) */}
        <HowItWorksSection />

        {/* Laser Section Divider */}
        <div className="w-full max-w-5xl mx-auto h-px bg-gradient-to-r from-transparent via-[#17222C] to-transparent pointer-events-none" />

        {/* Section 07 — Interactive Compilation Environment */}
        <InteractiveCompilation />

        {/* Laser Section Divider */}
        <div className="w-full max-w-5xl mx-auto h-px bg-gradient-to-r from-transparent via-[#17222C] to-transparent pointer-events-none" />

        {/* Section 08 — Enterprise Architecture Layer */}
        <ArchitectureSection />

        {/* Laser Section Divider */}
        <div className="w-full max-w-5xl mx-auto h-px bg-gradient-to-r from-transparent via-[#17222C] to-transparent pointer-events-none" />

        {/* Section 09 — Security & Cryptographic Traceability */}
        <SecurityTraceability />

        {/* Laser Section Divider */}
        <div className="w-full max-w-5xl mx-auto h-px bg-gradient-to-r from-transparent via-[#17222C] to-transparent pointer-events-none" />

        {/* Section 10 — High-Stakes Use Cases */}
        <UseCasesSection />

        {/* Laser Section Divider */}
        <div className="w-full max-w-5xl mx-auto h-px bg-gradient-to-r from-transparent via-[#17222C] to-transparent pointer-events-none" />

        {/* Section 11 — Final Calmer CTA */}
        <FinalCTASection />
      </div>
    </>
  );
}
