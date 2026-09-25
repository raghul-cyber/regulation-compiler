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
import { ShieldAlert, Globe } from 'lucide-react';
import { RCIcon } from '@/components/ui/rc-icon';

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
      {/* Tactical Header with Enterprise Telemetry */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[rgba(199,204,210,0.10)]">
        <div>
          <div className="flex items-center gap-2 mb-1.5 font-mono text-[9px] tracking-widest text-[#969DA6] uppercase">
            <span className="text-[#BCA77B]">+</span>
            <span>STATUTORY MISSION CONTROL</span>
            <span className="text-[#656C74]">/</span>
            <span>NODE-SURVEILLANCE-01</span>
            <span className="text-[#BCA77B]">+</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#FAF9F5] flex items-center gap-3">
            <span>Compliance Hub</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#BCA77B]/15 text-[#BCA77B] border border-[#BCA77B]/30 hidden sm:inline-flex">
              Deterministic AST
            </span>
          </h1>
          <p className="mt-1 text-sm text-[#C7CCD2]">
            Autonomous statutory compilation, continuous surveillance telemetry, and algorithmic gap remediation.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <div className="px-3 py-1.5 rounded-lg rc-glass-smoked border border-[rgba(199,204,210,0.12)] flex items-center gap-2 text-[#C7CCD2] shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#76937F] inline-block animate-pulse" />
            <span className="text-[#76937F] font-semibold">10 Authorities Live</span>
          </div>
        </div>
      </div>

      {/* Elevated Enterprise Command Tabs */}
      <div className="flex gap-1.5 p-1.5 rounded-xl rc-glass-smoked border border-[rgba(199,204,210,0.12)] overflow-x-auto scrollbar-none shadow-[0_8px_32px_rgba(9,11,15,0.6)]">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 text-xs font-mono rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? 'bg-[#171C23] border border-[#BCA77B]/60 text-[#FAF9F5] font-medium shadow-[0_4px_16px_rgba(9,11,15,0.6)]'
                  : 'border border-transparent text-[#969DA6] hover:text-[#FAF9F5] hover:bg-[#171C23]/60'
              }`}
            >
              <span>{tab.label}</span>
              {'isNew' in tab && tab.isNew && (
                <span className="ml-1 px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-[#BCA77B]/20 text-[#BCA77B] border border-[#BCA77B]/35">
                  NEW
                </span>
              )}
              {'adminOnly' in tab && tab.adminOnly && (
                <span className="ml-1 px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-[#BCA77B]/20 text-[#BCA77B] border border-[#BCA77B]/35">
                  <ShieldAlert className="w-2.5 h-2.5 inline mr-0.5" />
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

