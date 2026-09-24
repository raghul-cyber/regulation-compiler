'use client';
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { PoliciesView } from '@/components/compliance/policies-view';
import { ComplianceDashboard } from '@/components/compliance/compliance-dashboard';
import { GapAnalysis } from '@/components/compliance/gap-analysis';
import { ComplianceChecklist } from '@/components/compliance/compliance-checklist';
import { SwarmSimulationView } from '@/components/compliance/swarm-simulation-view';
import { Actions247View } from '@/components/compliance/actions-247-view';
import { WebsiteComplianceAuditor } from '@/components/compliance/website-compliance-auditor';
import { CoverageView } from './coverage-view';
import { ShieldAlert, Sparkles } from 'lucide-react';

const SUPER_ADMIN_EMAIL = 'rcraghul12@gmail.com';
const SUPER_ADMIN_CLERK_ID = 'user_3HpP6350OcHxY6bu77tdXEtihSE';

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('website_auditor');

  // Strict security gate: MiroFish Swarm Traffic is restricted exclusively to administrator logins (rcraghul12@gmail.com).
  // Non-admin accounts (and standard tenant organizations) must NEVER see or access swarm simulation.
  useEffect(() => {
    if (!isLoaded) return;

    if (user) {
      const userEmails = (user.emailAddresses || []).map(e => e?.emailAddress?.toLowerCase()).filter(Boolean) as string[];
      const primaryEmail = user.primaryEmailAddress?.emailAddress?.toLowerCase() || '';

      const isSuperAdmin = (
        primaryEmail === SUPER_ADMIN_EMAIL.toLowerCase() ||
        Boolean(userEmails.includes(SUPER_ADMIN_EMAIL.toLowerCase())) ||
        user.id === SUPER_ADMIN_CLERK_ID
      );
      setIsAdmin(isSuperAdmin);
    } else {
      setIsAdmin(false);
    }
  }, [user, isLoaded]);

  // Tab list includes Website Audits first (before Global Monitoring), 24/7 Actions and MiroFish Swarm Traffic
  const tabs = [
    { id: 'website_auditor', label: 'Website Audits', isNew: true },
    { id: 'coverage', label: 'Global Monitoring' },
    { id: 'actions_24_7', label: '24/7 Actions' },
    ...(isAdmin ? [{ id: 'swarm', label: 'MiroFish Swarm Traffic', adminOnly: true }] : []),
    { id: 'policies', label: 'Policies & Evaluation' },
    { id: 'dashboard', label: 'Compliance Dashboard' },
    { id: 'gaps', label: 'Gap Analysis' },
    { id: 'checklist', label: 'Compliance Checklist' },
  ];

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam) {
        if (tabParam === 'swarm' && !isAdmin) {
          // Non-admin attempted to navigate to swarm simulation: divert to default coverage
          setActiveTab('coverage');
        } else if (tabs.some(t => t.id === tabParam)) {
          setActiveTab(tabParam);
        }
      }
    }
  }, [isAdmin]);

  // If activeTab is currently swarm but user is not admin, revert immediately
  useEffect(() => {
    if (activeTab === 'swarm' && !isAdmin) {
      setActiveTab('coverage');
    }
  }, [isAdmin, activeTab]);

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto py-4 px-4 sm:px-6">
      {/* Tactical Header with Stitch Telemetry */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2 mb-1.5 font-mono text-[9px] tracking-widest text-zinc-500 uppercase">
            <span className="text-[#00F0FF]">+</span>
            <span>STATUTORY MISSION CONTROL</span>
            <span className="text-zinc-600">/</span>
            <span>NODE-SURVEILLANCE-01</span>
            <span className="text-[#00F0FF]">+</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <span>Compliance Hub</span>
            <span className="stitch-badge stitch-badge-cyan text-[10px] hidden sm:inline-flex">
              Deterministic AST
            </span>
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Autonomous statutory compilation, continuous surveillance telemetry, and algorithmic gap remediation.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <div className="stitch-badge stitch-badge-emerald">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>10 Authorities Live</span>
          </div>
        </div>
      </div>

      {/* Elevated Stitch Command Tabs */}
      <div className="flex gap-1.5 p-1.5 rounded-2xl bg-[#080D14]/85 backdrop-blur-2xl border border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.4)] overflow-x-auto scrollbar-none">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 text-xs font-mono rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-[#00F0FF]/15 to-[#3B82F6]/15 border border-[#00F0FF]/40 text-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.15)] font-semibold'
                  : 'border border-transparent text-zinc-400 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              <span>{tab.label}</span>
              {'isNew' in tab && tab.isNew && (
                <span className="ml-1 stitch-badge stitch-badge-cyan text-[9px] py-0 px-1.5">
                  <Sparkles className="w-2.5 h-2.5 text-[#00F0FF]" />
                  NEW
                </span>
              )}
              {'adminOnly' in tab && tab.adminOnly && (
                <span className="ml-1 stitch-badge stitch-badge-amber text-[9px] py-0 px-1.5">
                  <ShieldAlert className="w-2.5 h-2.5" />
                  ADMIN
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="pt-4">
        {activeTab === 'website_auditor' && <WebsiteComplianceAuditor />}
        {activeTab === 'coverage' && <CoverageView />}
        {activeTab === 'actions_24_7' && <Actions247View />}
        {activeTab === 'swarm' && isAdmin && <SwarmSimulationView />}
        {activeTab === 'policies' && <PoliciesView onNavigateTab={(tab) => setActiveTab(tab)} />}
        {activeTab === 'dashboard' && <ComplianceDashboard />}
        {activeTab === 'gaps' && <GapAnalysis />}
        {activeTab === 'checklist' && <ComplianceChecklist />}
      </div>
    </div>
  );
}

