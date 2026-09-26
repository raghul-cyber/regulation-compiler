import { LandingScrollHUD } from '@/components/landing/landing-scroll-hud';
import { HeroSection } from '@/components/landing/sections/hero-section';
import { WhatItDoesSection } from '@/components/landing/sections/what-it-does-section';
import { WebsiteAuditorSection } from '@/components/landing/sections/website-auditor-section';
import { SimpleWorkflowSection } from '@/components/landing/sections/simple-workflow-section';
import { WhoItsForSection } from '@/components/landing/sections/who-its-for-section';
import { FinalCTASection } from '@/components/landing/sections/final-cta-section';

export default function LandingPage() {
  return (
    <>
      {/* Precision Reading Progress & Return Indicator */}
      <LandingScrollHUD />

      {/* Streamlined, User-First 6-Section Story Container */}
      <div className="relative z-10 w-full space-y-10 sm:space-y-16 md:space-y-20 lg:space-y-28 pb-10 sm:pb-20">
        {/* 01 — HERO: Value Proposition, Approved Copy, CTAs, Hero Compliance Preview */}
        <HeroSection />

        {/* Atmospheric Light Bridge */}
        <div className="w-full max-w-4xl mx-auto h-px bg-gradient-to-r from-transparent via-[rgba(168,135,82,0.25)] to-transparent pointer-events-none" />

        {/* 02 — WHAT YOU CAN DO: Compliance without paperwork (Understand, Check, Act) */}
        <WhatItDoesSection />

        {/* Atmospheric Light Bridge */}
        <div className="w-full max-w-4xl mx-auto h-px bg-gradient-to-r from-transparent via-[rgba(140,107,66,0.20)] to-transparent pointer-events-none" />

        {/* 03 — WEBSITE AUDIT: Check your website before someone else does (Real Interactive Audit) */}
        <WebsiteAuditorSection />

        {/* Atmospheric Light Bridge */}
        <div className="w-full max-w-4xl mx-auto h-px bg-gradient-to-r from-transparent via-[rgba(197,166,110,0.25)] to-transparent pointer-events-none" />

        {/* 04 — HOW IT HELPS: Simple 3-step workflow (Input -> Result -> Action) */}
        <SimpleWorkflowSection />

        {/* Atmospheric Light Bridge */}
        <div className="w-full max-w-4xl mx-auto h-px bg-gradient-to-r from-transparent via-[rgba(143,95,50,0.20)] to-transparent pointer-events-none" />

        {/* 05 — WHO IT'S FOR: Interactive tab switcher (Developers, Security, Compliance, Founders) */}
        <WhoItsForSection />

        {/* Atmospheric Light Bridge */}
        <div className="w-full max-w-4xl mx-auto h-px bg-gradient-to-r from-transparent via-[rgba(168,135,82,0.25)] to-transparent pointer-events-none" />

        {/* 06 — FINAL VALUE & CTA: From regulation to action */}
        <FinalCTASection />
      </div>
    </>
  );
}
