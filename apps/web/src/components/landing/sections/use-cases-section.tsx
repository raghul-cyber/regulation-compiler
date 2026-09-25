'use client';

import { Building2, Cpu, HeartPulse, ShieldCheck, ArrowRight } from 'lucide-react';

const USE_CASES = [
  {
    id: 'finance',
    tag: 'FINANCIAL SERVICES & BANKING',
    title: 'Continuous Operational Resilience & DORA Adherence',
    desc: 'Automate ICT third-party risk assessments, immutable backup validations, and critical incident reporting under DORA and SEC mandates without waiting for periodic manual audits.',
    frameworks: ['DORA Art. 9-16', 'SEC Item 106', 'MAS Notice 655'],
    metric: '<10ms Evaluation',
    colSpan: 'lg:col-span-7',
    icon: Building2,
  },
  {
    id: 'ai_cloud',
    tag: 'AI INFRASTRUCTURE & CLOUD',
    title: 'EU AI Act Risk Lifecycle & Model Guardrails',
    desc: 'Verify post-market monitoring, synthetic data lineage, and high-risk classification criteria directly in CI/CD pipeline admission controllers.',
    frameworks: ['EU AI Act OJ 2024/1689', 'NIST AI RMF 1.0', 'ISO 42001'],
    metric: 'Zero Deployment Delays',
    colSpan: 'lg:col-span-5',
    icon: Cpu,
  },
  {
    id: 'health',
    tag: 'HEALTHCARE & LIFE SCIENCES',
    title: 'Deterministic Protected Health Data Enforcement',
    desc: 'Map encryption at rest, access least-privilege, and audit logging simultaneously across HIPAA Security Rule §164 and HITRUST requirements.',
    frameworks: ['HIPAA §164.312', 'HITRUST CSF v11', 'GDPR Art. 9'],
    metric: '100% Cryptographic Trace',
    colSpan: 'lg:col-span-5',
    icon: HeartPulse,
  },
  {
    id: 'governance',
    tag: 'ENTERPRISE GOVERNANCE & GITOPS',
    title: 'GitOps Policy-as-Code Across Multi-Cloud Estates',
    desc: 'Export compiled statutory trees directly as Open Policy Agent (OPA) Rego handlers, Terraform policies, and admission gates stored directly in Git.',
    frameworks: ['ISO/IEC 27001:2022', 'NIST CSF 2.0', 'PCI DSS v4.0.1'],
    metric: 'Automated CI/CD Gates',
    colSpan: 'lg:col-span-7',
    icon: ShieldCheck,
  },
];

export function UseCasesSection() {
  return (
    <section id="use-cases" className="w-full max-w-6xl mx-auto px-4 md:px-6 pointer-events-auto scroll-mt-24">
      {/* Title */}
      <div className="text-center max-w-3xl mx-auto mb-14">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#080A0E] border border-[var(--rc-border-subtle)] text-[#93C5FD] text-xs font-mono font-medium uppercase tracking-wider mb-4">
          <ShieldCheck className="w-3.5 h-3.5 text-[#4D8FCC]" />
          Enterprise Scope
        </div>
        <h2 className="text-3xl sm:text-5xl font-extrabold text-[#F4F6F8] tracking-tight leading-tight">
          Built for High-Stakes Regulatory Environments
        </h2>
        <p className="mt-4 text-base md:text-lg text-[#94A3B8] leading-relaxed">
          Engineered for institutions and platforms that cannot afford regulatory ambiguity, audit failure, or compliance drift.
        </p>
      </div>

      {/* Asymmetric 4-Card Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 text-left">
        {USE_CASES.map((uc) => {
          const Icon = uc.icon;
          return (
            <div
              key={uc.id}
              className={`${uc.colSpan} p-6 rounded-xl bg-[#080A0E] border border-[var(--rc-border)] hover:border-[var(--rc-border-subtle)] hover:bg-[#0B0E14] flex flex-col justify-between transition-all duration-200 group`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-[#10141A] border border-[var(--rc-border)] text-[#4D8FCC]">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-mono text-[10px] text-[#4D8FCC] font-bold uppercase tracking-wider">
                      {uc.tag}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-[#10B981] bg-[#10B981]/15 px-2 py-0.5 rounded border border-[#10B981]/30 font-semibold">
                    {uc.metric}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-[#F4F6F8] mb-2 group-hover:text-[#93C5FD] transition-colors">
                  {uc.title}
                </h3>
                <p className="text-xs text-[#94A3B8] leading-relaxed">
                  {uc.desc}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-[var(--rc-border)] flex flex-wrap items-center gap-2">
                {uc.frameworks.map((fw) => (
                  <span 
                    key={fw} 
                    className="font-mono text-[10px] text-[#CBD5E1] bg-[#10141A] px-2 py-0.5 rounded border border-[var(--rc-border)]"
                  >
                    {fw}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
