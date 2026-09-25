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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[rgba(201,196,186,0.08)]">
        <div>
          <div className="flex items-center gap-2 mb-1.5 font-mono text-[9px] tracking-widest text-[#8D8982] uppercase">
            <span className="text-[#AD956C]">+</span>
            <span>STATUTORY MISSION CONTROL</span>
            <span className="text-[#625F5A]">/</span>
            <span>NODE-SURVEILLANCE-01</span>
            <span className="text-[#AD956C]">+</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F7F4EC] flex items-center gap-3">
            <span>Compliance Hub</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#AD956C]/15 text-[#C5B38B] border border-[#AD956C]/30 hidden sm:inline-flex">
              Deterministic AST
            </span>
          </h1>
          <p className="mt-1 text-sm text-[#C9C4BA]">
            Autonomous statutory compilation, continuous surveillance telemetry, and algorithmic gap remediation.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <div className="px-3 py-1.5 rounded-lg bg-[#151311] border border-[rgba(201,196,186,0.08)] flex items-center gap-2 text-[#C9C4BA] shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#718A79]" />
            <span>10 Authorities Live</span>
          </div>
        </div>
      </div>

      {/* Elevated Enterprise Command Tabs */}
      <div className="flex gap-1.5 p-1.5 rounded-xl bg-[#151311] border border-[rgba(201,196,186,0.10)] overflow-x-auto scrollbar-none shadow-[0_4px_16px_rgba(0,0,0,0.5)]">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 text-xs font-mono rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? 'bg-[#1B1815] border border-[#AD956C]/50 text-[#F7F4EC] font-medium shadow-[0_2px_8px_rgba(0,0,0,0.5)]'
                  : 'border border-transparent text-[#8D8982] hover:text-[#F1EEE7] hover:bg-[#1B1815]/50'
              }`}
            >
              <span>{tab.label}</span>
              {'isNew' in tab && tab.isNew && (
                <span className="ml-1 px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-[#AD956C]/20 text-[#C5B38B] border border-[#AD956C]/30">
                  NEW
                </span>
              )}
              {'adminOnly' in tab && tab.adminOnly && (
                <span className="ml-1 px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-[#AD956C]/20 text-[#C5B38B] border border-[#AD956C]/30">
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

