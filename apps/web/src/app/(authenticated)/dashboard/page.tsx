'use client';
import { useState } from 'react';
import { PoliciesView } from '@/components/compliance/policies-view';
import { ComplianceDashboard } from '@/components/compliance/compliance-dashboard';
import { GapAnalysis } from '@/components/compliance/gap-analysis';
import { ComplianceChecklist } from '@/components/compliance/compliance-checklist';
import { CoverageView } from './coverage-view';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('coverage');

  const tabs = [
    { id: 'coverage', label: 'Global Monitoring' },
    { id: 'policies', label: 'Policies & Evaluation' },
    { id: 'dashboard', label: 'Compliance Dashboard' },
    { id: 'gaps', label: 'Gap Analysis' },
    { id: 'checklist', label: 'Compliance Checklist' },
  ];

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto py-8 px-4 sm:px-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Compliance Hub</h1>
        <p className="mt-1 text-zinc-500">
          Manage policies, evaluate compliance, and track remediation.
        </p>
      </div>

      <div className="flex gap-2 border-b border-zinc-800 pb-px">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="pt-4">
        {activeTab === 'coverage' && <CoverageView />}
        {activeTab === 'policies' && <PoliciesView />}
        {activeTab === 'dashboard' && <ComplianceDashboard />}
        {activeTab === 'gaps' && <GapAnalysis />}
        {activeTab === 'checklist' && <ComplianceChecklist />}
      </div>
    </div>
  );
}
