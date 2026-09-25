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
    <section id="use-cases" className="w-full max-w-6xl mx-auto px-4 md:px-6 pointer-events-auto scroll-mt-24 relative">
      {/* Executive Suite Room Atmosphere (Champagne & Graphite Reflection) */}
      <div 
        className="absolute top-1/3 right-10 w-[620px] h-[400px] rounded-full blur-[150px] pointer-events-none -z-10"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(188, 167, 123, 0.18) 0%, rgba(36, 43, 51, 0.12) 50%, transparent 80%)',
        }}
        aria-hidden="true"
      />

      {/* Title */}
      <div className="text-center max-w-3xl mx-auto mb-14">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#171C23] border border-[rgba(199,204,210,0.14)] text-[#BCA77B] text-xs font-mono font-medium uppercase tracking-wider mb-4 shadow-[0_4px_16px_rgba(9,11,15,0.5)] backdrop-blur-md">
          <ShieldCheck className="w-3.5 h-3.5 text-[#BCA77B]" />
          Enterprise Scope
        </div>
        <h2 className="text-3xl sm:text-5xl font-extrabold text-[#FAF9F5] tracking-tight leading-tight">
          Built for High-Stakes Regulatory Environments
        </h2>
        <p className="mt-4 text-base md:text-lg text-[#C7CCD2] leading-relaxed">
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
              className={`${uc.colSpan} p-6 rounded-xl rc-glass-smoked border border-[rgba(199,204,210,0.12)] hover:border-[rgba(188,167,123,0.35)] hover:bg-[#171C23]/90 flex flex-col justify-between transition-all duration-200 group shadow-[0_8px_24px_rgba(9,11,15,0.65)]`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-[#171C23] border border-[rgba(199,204,210,0.10)] text-[#BCA77B]">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-mono text-[10px] text-[#BCA77B] font-bold uppercase tracking-wider">
                      {uc.tag}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-[#76937F] bg-[#76937F]/15 px-2 py-0.5 rounded border border-[#76937F]/35 font-semibold">
                    {uc.metric}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-[#FAF9F5] mb-2 group-hover:text-[#BCA77B] transition-colors">
                  {uc.title}
                </h3>
                <p className="text-xs text-[#C7CCD2] leading-relaxed">
                  {uc.desc}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-[rgba(199,204,210,0.08)] flex flex-wrap items-center gap-2">
                {uc.frameworks.map((fw) => (
                  <span 
                    key={fw} 
                    className="font-mono text-[10px] text-[#AAB1BA] bg-[#0C0F14] px-2 py-0.5 rounded border border-[rgba(199,204,210,0.08)]"
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
