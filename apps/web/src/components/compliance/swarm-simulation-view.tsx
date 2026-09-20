'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import {
  getSwarmAgents,
  runSwarmSimulation,
  getSwarmRuns,
  getSwarmReport
} from '@/app/(authenticated)/dashboard/actions';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/intra-app-toast';
import {
  ShieldAlert,
  Zap,
  Play,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Users,
  Server,
  Layers,
  Terminal,
  TrendingUp,
  Cpu,
  Lock,
  Flame,
  FileCheck,
  ChevronRight,
  Database
} from 'lucide-react';

const SUPER_ADMIN_EMAIL = 'rcraghul12@gmail.com';
const SUPER_ADMIN_CLERK_ID = 'user_3HpP6350OcHxY6bu77tdXEtihSE';

export function SwarmSimulationView() {
  const { user, isLoaded } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [agents, setAgents] = useState<any[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [rounds, setRounds] = useState<number>(2);
  const [currentReport, setCurrentReport] = useState<any | null>(null);
  const [recentRuns, setRecentRuns] = useState<any[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'roster' | 'live_feed' | 'report_agent' | 'history'>('roster');
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const toast = useToast();

  // Strict administrator clearance check: Only rcraghul12@gmail.com can view or operate MiroFish swarm
  useEffect(() => {
    if (!isLoaded) return;

    if (user) {
      const userEmails = (user.emailAddresses || []).map(e => e?.emailAddress?.toLowerCase()).filter(Boolean) as string[];
      const primaryEmail = user.primaryEmailAddress?.emailAddress?.toLowerCase() || '';

      const isSuper = (
        primaryEmail === SUPER_ADMIN_EMAIL.toLowerCase() ||
        Boolean(userEmails.includes(SUPER_ADMIN_EMAIL.toLowerCase())) ||
        user.id === SUPER_ADMIN_CLERK_ID
      );
      setIsAdmin(isSuper);
    } else {
      setIsAdmin(false);
    }
    setAuthChecking(false);
  }, [user, isLoaded]);

  useEffect(() => {
    if (isAdmin) {
      loadInitialData();
    }
  }, [isAdmin]);

  async function loadInitialData() {
    setLoadingAgents(true);
    try {
      const [agentList, runsList] = await Promise.all([
        getSwarmAgents(),
        getSwarmRuns()
      ]);
      if (Array.isArray(agentList) && agentList.length > 0) {
        setAgents(agentList);
      }
      if (Array.isArray(runsList) && runsList.length > 0) {
        setRecentRuns(runsList);
        // Load the latest report if available
        if (!currentReport && runsList[0]?.run_id) {
          loadReportDetails(runsList[0].run_id);
        }
      }
    } catch (err) {
      console.error('Failed to load initial swarm data:', err);
    } finally {
      setLoadingAgents(false);
    }
  }

  async function loadReportDetails(runId: string) {
    try {
      const report = await getSwarmReport(runId);
      if (report) {
        setCurrentReport(report);
        setSelectedRunId(runId);
      }
    } catch (err) {
      console.error(`Failed to load report ${runId}:`, err);
    }
  }

  async function handleLaunchSimulation() {
    setSimulating(true);
    toast.showToast({
      type: 'info',
      title: 'MiroFish Swarm Launching',
      message: `Deploying 10 autonomous agents for ${rounds} simulation cycles against live statutory policies...`
    });

    try {
      const result = await runSwarmSimulation(rounds);
      if (result && result.run_id) {
        setCurrentReport(result);
        setSelectedRunId(result.run_id);
        setActiveSubTab('live_feed');
        toast.showToast({
          type: 'success',
          title: 'Swarm Traffic Generated',
          message: `Completed ${result.total_traffic_requests} real compliance evaluations across 10 agents with NO mocks.`
        });
        // Refresh runs list
        const updatedRuns = await getSwarmRuns();
        if (Array.isArray(updatedRuns)) {
          setRecentRuns(updatedRuns);
        }
      } else {
        toast.showToast({
          type: 'error',
          title: 'Simulation Notice',
          message: 'Simulation completed but returned empty report.'
        });
      }
    } catch (err: any) {
      console.error('Simulation execution error:', err);
      toast.showToast({
        type: 'error',
        title: 'Simulation Error',
        message: err?.message || 'Failed to execute multi-agent swarm simulation.'
      });
    } finally {
      setSimulating(false);
    }
  }

  if (!isLoaded || authChecking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-zinc-400">
        <RefreshCw className="w-8 h-8 animate-spin text-amber-400 mb-3" />
        <p className="text-sm font-medium text-zinc-300">Verifying Administrative Clearance...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="w-full max-w-xl mx-auto my-12 p-8 rounded-2xl bg-zinc-950 border border-amber-500/30 text-center relative overflow-hidden shadow-2xl">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto mb-5">
          <Lock className="w-7 h-7" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold uppercase tracking-wider mb-3">
          <ShieldAlert className="w-3.5 h-3.5" />
          Admin Clearance Required
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          MiroFish Swarm Simulation Restricted
        </h2>
        <p className="mt-2 text-sm text-zinc-400 leading-relaxed max-w-md mx-auto">
          Autonomous multi-agent swarm traffic generation and live policy stress tests are restricted to organization administrators. Please sign in with an administrative account to access this console.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 text-zinc-100">
      {/* Top Banner: MiroFish Swarm Header */}
      <div className="relative overflow-hidden rounded-xl border border-zinc-800 bg-gradient-to-r from-zinc-950 via-zinc-900 to-blue-950/40 p-6 shadow-2xl">
        <div className="absolute right-0 top-0 h-full w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600/10 via-transparent to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400 ring-1 ring-inset ring-blue-500/30">
                <Cpu className="h-3.5 w-3.5 animate-pulse text-blue-400" />
                MiroFish Multi-Agent Swarm Intelligence
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 ring-1 ring-inset ring-emerald-500/30">
                <Database className="h-3.5 w-3.5 text-emerald-400" />
                Strictly NO Mocks • Real DB Traffic
              </span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              10-Agent Autonomous Traffic Simulator
            </h2>
            <p className="max-w-2xl text-sm text-zinc-400 leading-relaxed">
              Based on the <strong>666ghj/MiroFish</strong> predictive swarm architecture. Deploys 10 heterogeneous organizational
              personas executing real policy compliance evaluations, automated remediations, and predictive risk synthesis in PostgreSQL.
            </p>
          </div>

          {/* Controls: Round selector & Launch button */}
          <div className="flex flex-col sm:flex-row items-center gap-3 bg-zinc-900/80 p-3 rounded-xl border border-zinc-800/80 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <label htmlFor="rounds-select" className="text-xs font-medium text-zinc-400">Cycles:</label>
              <select
                id="rounds-select"
                value={rounds}
                onChange={(e) => setRounds(Number(e.target.value))}
                disabled={simulating}
                className="rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value={1}>1 Cycle (10 Requests)</option>
                <option value={2}>2 Cycles (20 Requests)</option>
                <option value={3}>3 Cycles (30 Requests)</option>
                <option value={5}>5 Cycles (50 Requests)</option>
              </select>
            </div>

            <Button
              onClick={handleLaunchSimulation}
              disabled={simulating}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-xs px-4 py-2 shadow-lg shadow-blue-600/20 gap-2 transition-all disabled:opacity-50"
            >
              {simulating ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Swarm Simulating ({rounds * 10} Evals)...
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-current" />
                  Launch MiroFish Swarm
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Live Metrics Row if report available */}
        {currentReport && (
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-zinc-800/80 pt-5">
            <div className="bg-zinc-900/40 rounded-lg p-3 border border-zinc-800/60">
              <div className="text-xs text-zinc-400 font-medium">Total Real Traffic</div>
              <div className="text-xl font-bold text-white mt-1">
                {currentReport.total_traffic_requests || 0}
                <span className="text-xs font-normal text-zinc-500 ml-1">requests</span>
              </div>
            </div>
            <div className="bg-zinc-900/40 rounded-lg p-3 border border-zinc-800/60">
              <div className="text-xs text-zinc-400 font-medium">Fleet Compliance Rate</div>
              <div className="text-xl font-bold text-emerald-400 mt-1">
                {currentReport.overall_compliance_score || 0}%
              </div>
            </div>
            <div className="bg-zinc-900/40 rounded-lg p-3 border border-zinc-800/60">
              <div className="text-xs text-zinc-400 font-medium">Convergence Delta</div>
              <div className="text-xl font-bold text-blue-400 mt-1">
                {currentReport.convergence_delta > 0 ? `+${currentReport.convergence_delta}%` : `${currentReport.convergence_delta || 0}%`}
              </div>
            </div>
            <div className="bg-zinc-900/40 rounded-lg p-3 border border-zinc-800/60">
              <div className="text-xs text-zinc-400 font-medium">Fleet Resilience Tier</div>
              <div className="text-xs font-bold uppercase tracking-wider text-amber-400 mt-2">
                {currentReport.resilience_rating || 'TIER_1'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-zinc-800 gap-2">
        <button
          onClick={() => setActiveSubTab('roster')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
            activeSubTab === 'roster'
              ? 'border-blue-500 text-blue-400 bg-blue-500/5'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Users className="h-4 w-4" />
          Autonomous Swarm Fleet (10 Personas)
        </button>
        <button
          onClick={() => setActiveSubTab('live_feed')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
            activeSubTab === 'live_feed'
              ? 'border-blue-500 text-blue-400 bg-blue-500/5'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Activity className="h-4 w-4" />
          Live Round Activity Feed
          {currentReport && (
            <span className="ml-1 rounded-full bg-blue-500/20 px-2 py-0.2 text-[10px] text-blue-300 font-mono">
              {currentReport.total_traffic_requests}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveSubTab('report_agent')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
            activeSubTab === 'report_agent'
              ? 'border-blue-500 text-blue-400 bg-blue-500/5'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          MiroFish ReportAgent Synthesis
        </button>
        <button
          onClick={() => setActiveSubTab('history')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
            activeSubTab === 'history'
              ? 'border-blue-500 text-blue-400 bg-blue-500/5'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Layers className="h-4 w-4" />
          Simulation Run History ({recentRuns.length})
        </button>
      </div>

      {/* SubTab 1: Swarm Roster */}
      {activeSubTab === 'roster' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loadingAgents ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 rounded-xl border border-zinc-800 bg-zinc-900/50 animate-pulse p-4" />
            ))
          ) : agents.length === 0 ? (
            <div className="col-span-full py-12 text-center text-zinc-500">
              No swarm personas initialized.
            </div>
          ) : (
            agents.map((agent) => (
              <div
                key={agent.agent_id}
                className="flex flex-col justify-between rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-4 transition-all hover:border-zinc-700 hover:bg-zinc-900"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/20 text-[10px] font-bold text-blue-400">
                          {agent.agent_id}
                        </span>
                        <h3 className="font-semibold text-sm text-white">{agent.name}</h3>
                      </div>
                      <p className="text-xs text-blue-400/80 mt-0.5 font-mono">{agent.archetype}</p>
                    </div>
                    <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                      {agent.jurisdictions?.join(', ')}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed">
                    {agent.bio}
                  </p>

                  <div className="flex flex-wrap gap-1">
                    {agent.target_frameworks?.map((fw: string) => (
                      <span
                        key={fw}
                        className="rounded-md bg-zinc-800/80 px-2 py-0.5 text-[10px] font-mono text-zinc-300 border border-zinc-700/50"
                      >
                        {fw}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-800/60 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Risk Tolerance</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${agent.risk_tolerance > 0.6 ? 'bg-red-500' : agent.risk_tolerance > 0.3 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${agent.risk_tolerance * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-zinc-400">{(agent.risk_tolerance * 100).toFixed(0)}%</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Remediation Bias</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${agent.compliance_tendency * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-zinc-400">{(agent.compliance_tendency * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* SubTab 2: Live Round Activity Feed */}
      {activeSubTab === 'live_feed' && (
        <div className="space-y-6">
          {!currentReport ? (
            <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 p-12 text-center">
              <Activity className="h-8 w-8 mx-auto text-zinc-600 mb-3" />
              <h3 className="text-sm font-semibold text-zinc-300">No Active Simulation Run Selected</h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1 mb-4">
                Click &quot;Launch MiroFish Swarm&quot; to execute real multi-agent compliance evaluation cycles in PostgreSQL.
              </p>
              <Button
                onClick={handleLaunchSimulation}
                disabled={simulating}
                className="bg-blue-600 hover:bg-blue-500 text-xs px-4 py-2"
              >
                Launch Now
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Round Accordion / Breakdown */}
              {currentReport.round_summaries?.map((rnd: any) => (
                <div
                  key={rnd.round_num}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/70 overflow-hidden"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-800/40 px-5 py-3.5 border-b border-zinc-800">
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/20 text-xs font-bold text-blue-400">
                        R{rnd.round_num}
                      </span>
                      <h4 className="font-semibold text-sm text-white">Simulation Cycle {rnd.round_num}</h4>
                    </div>

                    <div className="flex items-center gap-4 text-xs">
                      <div>
                        <span className="text-zinc-500">Evaluations:</span>{' '}
                        <span className="font-bold text-zinc-200">{rnd.total_evaluations}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500">Passing:</span>{' '}
                        <span className="font-bold text-emerald-400">{rnd.passing_evaluations}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500">Violations:</span>{' '}
                        <span className="font-bold text-rose-400">{rnd.failing_evaluations}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500">Remediations:</span>{' '}
                        <span className="font-bold text-blue-400">{rnd.remediations_triggered}</span>
                      </div>
                      <div className="rounded-md bg-zinc-800 px-2.5 py-1 text-zinc-300 font-mono text-[11px]">
                        {rnd.round_compliance_rate}% Pass Rate
                      </div>
                    </div>
                  </div>

                  <div className="divide-y divide-zinc-800/60">
                    {rnd.actions?.map((action: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 hover:bg-zinc-800/20 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            {action.check_result === 'pass' ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            ) : action.remediation_applied ? (
                              <RefreshCw className="h-4 w-4 text-blue-400" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-amber-400" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-xs text-white">{action.agent_name}</span>
                              <span className={`rounded-full px-2 py-0.2 text-[10px] font-mono font-medium ${
                                action.check_result === 'pass'
                                  ? 'bg-emerald-500/10 text-emerald-400'
                                  : 'bg-rose-500/10 text-rose-400'
                              }`}>
                                {action.check_result.toUpperCase()}
                              </span>
                              {action.remediation_applied && (
                                <span className="rounded-full bg-blue-500/10 px-2 py-0.2 text-[10px] font-mono font-medium text-blue-400">
                                  AUTO-REMEDIATED
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-zinc-400 mt-1">
                              Policy: <span className="text-zinc-300">{action.regulation_name}</span>
                            </p>
                            {action.violations_summary?.length > 0 && (
                              <p className="text-[11px] text-rose-400/90 mt-1 font-mono">
                                ⚠ {action.violations_summary[0]}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col sm:items-end text-[11px] text-zinc-500 font-mono">
                          <span>Check ID: {action.compliance_check_id?.slice(0, 13) || 'N/A'}...</span>
                          <span className="text-[10px] text-zinc-600">
                            {action.timestamp ? new Date(action.timestamp).toLocaleTimeString() : ''}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SubTab 3: MiroFish ReportAgent Synthesis */}
      {activeSubTab === 'report_agent' && (
        <div className="space-y-6">
          {!currentReport ? (
            <div className="rounded-xl border border-dashed border-zinc-800 p-12 text-center text-zinc-500">
              Run a simulation first to generate ReportAgent intelligence.
            </div>
          ) : (
            <>
              {/* Executive Summary Card */}
              <div className="rounded-xl border border-blue-500/30 bg-blue-950/10 p-6 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-3 text-blue-400">
                  <TrendingUp className="h-5 w-5" />
                  <h3 className="font-semibold text-sm">ReportAgent Executive Narrative</h3>
                </div>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  {currentReport.executive_summary}
                </p>
              </div>

              {/* Trajectory & Hotspots Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Vulnerability Hotspots */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Flame className="h-4 w-4 text-rose-400" />
                    <h4 className="font-semibold text-xs text-white uppercase tracking-wider">
                      Control Vulnerability Hotspots
                    </h4>
                  </div>
                  <div className="space-y-3">
                    {currentReport.vulnerability_hotspots?.length === 0 ? (
                      <p className="text-xs text-zinc-500">No persistent control failures detected.</p>
                    ) : (
                      currentReport.vulnerability_hotspots?.map((spot: any, i: number) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/40 border border-zinc-700/40 text-xs"
                        >
                          <div className="font-medium text-zinc-200 truncate pr-3">{spot.control}</div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-mono text-zinc-400">{spot.failure_frequency} failures</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              spot.severity === 'high' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                            }`}>
                              {spot.severity}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Fleet Resilience Leaderboard */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <ShieldAlert className="h-4 w-4 text-emerald-400" />
                    <h4 className="font-semibold text-xs text-white uppercase tracking-wider">
                      Agent Resilience Rankings
                    </h4>
                  </div>
                  <div className="space-y-2.5">
                    {currentReport.resilience_rankings?.map((r: any) => (
                      <div
                        key={r.agent_id}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-800/30 border border-zinc-800/80 text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-700 text-[10px] font-bold text-zinc-300">
                            {r.agent_id}
                          </span>
                          <div>
                            <div className="font-medium text-white">{r.name}</div>
                            <div className="text-[10px] text-zinc-500">{r.archetype}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="font-mono font-bold text-zinc-200">{r.score}%</div>
                            <div className="text-[10px] text-zinc-500">{r.remediations_applied} patches</div>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            r.status === 'RESILIENT'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : r.status === 'ADAPTIVE'
                              ? 'bg-blue-500/10 text-blue-400'
                              : 'bg-rose-500/10 text-rose-400'
                          }`}>
                            {r.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* SubTab 4: History */}
      {activeSubTab === 'history' && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
              Historical Swarm Executions
            </h4>
            <span className="text-xs text-zinc-500">{recentRuns.length} total logged</span>
          </div>

          <div className="divide-y divide-zinc-800">
            {recentRuns.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500">
                No past simulation records logged yet.
              </div>
            ) : (
              recentRuns.map((run: any) => (
                <div
                  key={run.run_id}
                  onClick={() => {
                    loadReportDetails(run.run_id);
                    setActiveSubTab('live_feed');
                  }}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 hover:bg-zinc-800/30 cursor-pointer transition-colors ${
                    selectedRunId === run.run_id ? 'bg-blue-950/20 border-l-2 border-blue-500' : ''
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-blue-400">{run.run_id}</span>
                      <span className="rounded bg-zinc-800 px-2 py-0.2 text-[10px] text-zinc-400">
                        {run.rounds} Cycles • {run.agents} Agents
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500">
                      Executed: {run.timestamp ? new Date(run.timestamp).toLocaleString() : 'N/A'}
                    </p>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-xs font-bold text-zinc-200">
                        {run.total_requests} Requests
                      </div>
                      <div className="text-[11px] text-emerald-400 font-mono">
                        {run.final_compliance_score}% Score
                      </div>
                    </div>

                    <ChevronRight className="h-4 w-4 text-zinc-500" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
