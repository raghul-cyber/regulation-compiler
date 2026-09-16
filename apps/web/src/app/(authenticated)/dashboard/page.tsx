'use client';
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { PoliciesView } from '@/components/compliance/policies-view';
import { ComplianceDashboard } from '@/components/compliance/compliance-dashboard';
import { GapAnalysis } from '@/components/compliance/gap-analysis';
import { ComplianceChecklist } from '@/components/compliance/compliance-checklist';
import { SwarmSimulationView } from '@/components/compliance/swarm-simulation-view';
import { CoverageView } from './coverage-view';
import { ShieldAlert } from 'lucide-react';

const SUPER_ADMIN_EMAIL = 'rcraghul12@gmail.com';
const SUPER_ADMIN_CLERK_ID = 'user_3HpP6350OcHxY6bu77tdXEtihSE';

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('coverage');

  // Strict security gate: MiroFish Swarm Traffic is restricted exclusively to administrator logins (rcraghul12@gmail.com).
  // Non-admin accounts (and standard tenant organizations) must NEVER see or access swarm simulation.
  useEffect(() => {
    if (!isLoaded) return;

    if (user) {
      const userEmails = user.emailAddresses?.map(e => e.emailAddress.toLowerCase()) || [];
      const primaryEmail = user.primaryEmailAddress?.emailAddress?.toLowerCase() || '';

      const isSuperAdmin = (
        primaryEmail === SUPER_ADMIN_EMAIL.toLowerCase() ||
        userEmails.includes(SUPER_ADMIN_EMAIL.toLowerCase()) ||
        user.id === SUPER_ADMIN_CLERK_ID
      );
      setIsAdmin(isSuperAdmin);
    } else {
      setIsAdmin(false);
    }
  }, [user, isLoaded]);

  // Tab list dynamically includes MiroFish Swarm Traffic ONLY for administrative logins
  const tabs = [
    { id: 'coverage', label: 'Global Monitoring' },
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
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto py-8 px-4 sm:px-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Compliance Hub</h1>
        <p className="mt-1 text-zinc-500">
          Manage policies, evaluate compliance, and track remediation.
        </p>
      </div>

      <div className="flex gap-2 border-b border-zinc-800 pb-px overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
            }`}
          >
            {tab.label}
            {'adminOnly' in tab && tab.adminOnly && (
              <span className="ml-1 inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                <ShieldAlert className="w-2.5 h-2.5" />
                Admin
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="pt-4">
        {activeTab === 'coverage' && <CoverageView />}
        {activeTab === 'swarm' && isAdmin && <SwarmSimulationView />}
        {activeTab === 'policies' && <PoliciesView onNavigateTab={(tab) => setActiveTab(tab)} />}
        {activeTab === 'dashboard' && <ComplianceDashboard />}
        {activeTab === 'gaps' && <GapAnalysis />}
        {activeTab === 'checklist' && <ComplianceChecklist />}
      </div>
    </div>
  );
}

