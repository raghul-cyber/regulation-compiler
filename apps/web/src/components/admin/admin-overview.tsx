'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { 
  Users, 
  ShieldAlert, 
  Activity, 
  RefreshCw, 
  Clock, 
  CheckCircle2, 
  Search, 
  LogIn, 
  FileCheck, 
  Radio, 
  Lock, 
  Shield, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Fingerprint
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { Button } from '@/components/ui/button';

interface ClerkUserRecord {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  role: string;
  is_verified: boolean;
  auth_strategy: string;
  created_at: string | null;
  last_sign_in_at: string | null;
  last_active_at: string | null;
  audit_actions_count: number;
  is_super_admin: boolean;
}

interface TimelinePoint {
  date: string;
  actions: number;
  evaluations: number;
  probes: number;
  total: number;
}

interface ActionCategory {
  name: string;
  category: string;
  count: number;
  color: string;
}

interface AuditItem {
  id: string;
  action: string;
  entity_type: string;
  actor: string;
  timestamp: string;
  metadata?: any;
}

interface AdminOverviewData {
  status: string;
  authorized_admin: string;
  metrics: {
    total_users: number;
    verified_users_count: number;
    active_users_today: number;
    total_audit_events: number;
    total_compliance_evaluations: number;
    total_active_policies: number;
    last_synced_at: string;
  };
  users: ClerkUserRecord[];
  activity_timeline: TimelinePoint[];
  action_breakdown: ActionCategory[];
  recent_audit_trail: AuditItem[];
}

export function AdminOverview() {
  const { getToken } = useAuth();
  const { user } = useUser();

  const [data, setData] = useState<AdminOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');

  const fetchOverview = useCallback(async () => {
    try {
      setError(null);
      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080/api/v1';

      // 1. Primary: Query via same-origin Next.js server-side proxy (guarantees zero CORS restrictions)
      let res: Response | null = null;
      try {
        res = await fetch('/api/admin/overview', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } catch (proxyErr) {
        console.warn("Proxy route unreachable, falling back to direct API:", proxyErr);
        res = null;
      }

      // 2. Fallback: Direct API fetch if proxy was unconfigured
      if (!res || !res.ok) {
        res = await fetch(`${apiUrl}/admin/overview`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || `HTTP Error ${res.status}: Failed to fetch admin overview.`);
      }

      const json = await res.json();
      setData(json);
    } catch (err: any) {
      console.error("Admin overview fetch error:", err);
      setError(err.message || "Failed to load admin telemetry.");
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const handleSyncUsers = async () => {
    setSyncing(true);
    try {
      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080/api/v1';

      let res: Response | null = null;
      try {
        res = await fetch('/api/admin/sync-users', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } catch {
        res = null;
      }

      if (!res || !res.ok) {
        await fetch(`${apiUrl}/admin/sync-users`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
      await fetchOverview();
    } catch (err: any) {
      console.error("User sync error:", err);
      setError("Failed to sync users with Clerk.");
      setSyncing(false);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!data?.users) return [];
    return data.users.filter(u => {
      const matchesSearch = 
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (filterRole === 'ALL') return matchesSearch;
      if (filterRole === 'ADMIN') return matchesSearch && (u.is_super_admin || u.role.toLowerCase().includes('admin'));
      return matchesSearch && u.role.toLowerCase() === filterRole.toLowerCase();
    });
  }, [data?.users, searchQuery, filterRole]);

  const formatTimestamp = (iso: string | null) => {
    if (!iso) return 'Never';
    try {
      const date = new Date(iso);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return iso;
    }
  };

  const formatRelativeTime = (iso: string | null) => {
    if (!iso) return 'Never logged in';
    try {
      const diffSec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
      if (diffSec < 60) return 'Just now';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return `${diffHr}h ago`;
      const diffDays = Math.floor(diffHr / 24);
      return `${diffDays}d ago`;
    } catch {
      return 'Recent';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-zinc-400">
        <RefreshCw className="w-8 h-8 animate-spin text-amber-400 mb-4" />
        <h3 className="text-lg font-bold text-white tracking-tight">Authenticating Super-Admin Clearance...</h3>
        <p className="text-xs text-zinc-500 mt-1">Retrieving live Clerk directory, user logins, and cryptographic audit records</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto my-12 p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-center">
        <ShieldAlert className="w-10 h-10 text-rose-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white">Administrative Access Restricted</h3>
        <p className="text-sm text-rose-300/90 mt-2">{error}</p>
        <div className="mt-6 flex justify-center gap-3">
          <Button onClick={fetchOverview} variant="outline" size="sm" className="border-zinc-700">
            Retry Connection
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 w-full max-w-7xl mx-auto pb-16">
      {/* Super-Admin Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-zinc-900 to-zinc-950 border border-amber-500/30 shadow-2xl">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 mt-0.5">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Super-Admin Control Panel
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold tracking-wide">
                RESTRICTED CLEARANCE
              </span>
            </div>
            <p className="text-sm text-zinc-400 mt-1">
              Active Session: <span className="font-mono text-amber-300 font-semibold">{data?.authorized_admin}</span> • Full tenant governance and authentic live user directory.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-center">
          <Button
            onClick={handleSyncUsers}
            disabled={syncing}
            className="bg-amber-600 hover:bg-amber-500 text-black font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-amber-600/20 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Reconciling...' : 'Sync Clerk Directory'}</span>
          </Button>
        </div>
      </div>

      {/* Top Telemetry KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-[#0c0d12] border border-zinc-800 shadow-md relative overflow-hidden group hover:border-zinc-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Registered Users</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{data?.metrics.total_users || 0}</span>
            <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {data?.metrics.verified_users_count || 0} Verified
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">Authentic accounts from Clerk API</p>
        </div>

        <div className="p-5 rounded-xl bg-[#0c0d12] border border-zinc-800 shadow-md relative overflow-hidden group hover:border-zinc-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Active Today</span>
            <LogIn className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{data?.metrics.active_users_today || 1}</span>
            <span className="text-xs text-zinc-400 font-mono">sessions</span>
          </div>
          <p className="text-[11px] text-emerald-400/90 mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live sign-in activity recorded
          </p>
        </div>

        <div className="p-5 rounded-xl bg-[#0c0d12] border border-zinc-800 shadow-md relative overflow-hidden group hover:border-zinc-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Security & Audit Logs</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{data?.metrics.total_audit_events || 0}</span>
            <span className="text-xs text-zinc-400 font-mono">traces</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">PostgreSQL tamper-proof ledger</p>
        </div>

        <div className="p-5 rounded-xl bg-[#0c0d12] border border-zinc-800 shadow-md relative overflow-hidden group hover:border-zinc-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Enforced Policies</span>
            <FileCheck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{data?.metrics.total_active_policies || 0}</span>
            <span className="text-xs text-zinc-400 font-mono">rulesets</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">Compiled AST policies in engine</p>
        </div>
      </div>

      {/* Interactive Activity & Login Graphics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Timeline AreaChart */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-[#0a0a0c] border border-zinc-800 shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                System Activity &amp; Login Velocity (14-Day Timeline)
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Aggregated daily volume across surveillance triggers, policy evaluations, and audit traces
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500" /> Probes &amp; Telemetry
              </span>
              <span className="flex items-center gap-1.5 text-blue-400">
                <span className="w-2.5 h-2.5 rounded bg-blue-500" /> Security Audits
              </span>
            </div>
          </div>

          <div className="h-[280px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.activity_timeline || []} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorProbes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="date" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#09090b', border: '1px solid #3f3f46', borderRadius: '10px', color: '#fff', fontSize: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" name="Total Events" />
                <Area type="monotone" dataKey="probes" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorProbes)" name="Surveillance Probes" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Action Category Breakdown BarChart */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-[#0a0a0c] border border-zinc-800 shadow-xl flex flex-col">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" />
            Action Distribution
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5 mb-4">
            Categorical breakdown of operations registered in PostgreSQL
          </p>

          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.action_breakdown || []} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                <XAxis type="number" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" stroke="#a1a1aa" fontSize={10} tickLine={false} axisLine={false} width={110} />
                <Tooltip
                  cursor={{ fill: '#27272a', opacity: 0.3 }}
                  contentStyle={{ backgroundColor: '#09090b', border: '1px solid #3f3f46', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {(data?.action_breakdown || []).map((entry, idx) => (
                    <Cell key={`bar-${idx}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-auto pt-3 border-t border-zinc-800/80 flex justify-between items-center text-xs text-zinc-400">
            <span>Total Logged Actions:</span>
            <span className="font-mono text-white font-bold">{data?.metrics.total_audit_events || 0}</span>
          </div>
        </div>
      </div>

      {/* Real Registered Users Directory Table (No Mocks) */}
      <div className="p-6 rounded-2xl bg-[#0a0a0c] border border-zinc-800 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                Authentic User Directory &amp; Logins
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/40">
                CLERK LIVE API
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Live user roster queried directly from Clerk authentication directory with verified emails, authentication method, and last sign-in dates.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Search user or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 rounded-lg bg-zinc-900/80 border border-zinc-700 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500 transition-colors w-48 sm:w-64"
              />
            </div>

            <div className="flex items-center rounded-lg bg-zinc-900 border border-zinc-800 p-0.5 text-xs">
              <button
                onClick={() => setFilterRole('ALL')}
                className={`px-2.5 py-1 rounded ${filterRole === 'ALL' ? 'bg-zinc-800 text-white font-semibold' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                All ({data?.users.length || 0})
              </button>
              <button
                onClick={() => setFilterRole('ADMIN')}
                className={`px-2.5 py-1 rounded ${filterRole === 'ADMIN' ? 'bg-zinc-800 text-amber-300 font-semibold' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                Super-Admin
              </button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto rounded-xl border border-zinc-800/80">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-950/80 text-[11px] uppercase tracking-wider text-zinc-400 border-b border-zinc-800">
              <tr>
                <th className="py-3.5 px-4">User &amp; Email ID</th>
                <th className="py-3.5 px-4">Role &amp; Clearance</th>
                <th className="py-3.5 px-4">Auth Method</th>
                <th className="py-3.5 px-4">Account Created</th>
                <th className="py-3.5 px-4">Last Login / Active</th>
                <th className="py-3.5 px-4 text-right">Audit Traces</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-sans">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-500 text-xs">
                    No users match the query "{searchQuery}".
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u, idx) => (
                  <tr 
                    key={`${u.id}-${idx}`}
                    className={`hover:bg-zinc-900/40 transition-colors ${u.is_super_admin ? 'bg-amber-500/[0.03]' : ''}`}
                  >
                    {/* User & Email */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${
                          u.is_super_admin 
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm shadow-amber-500/20' 
                            : 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                        }`}>
                          {u.name ? u.name.charAt(0).toUpperCase() : u.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white text-xs md:text-sm">
                              {u.name}
                            </span>
                            {u.is_super_admin && (
                              <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                OWNER
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-xs font-mono text-zinc-300 select-all">
                              {u.email}
                            </span>
                            {u.is_verified && (
                              <span title="Verified Email">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-zinc-500 font-mono tracking-tight">
                            {u.id}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Role & Clearance */}
                    <td className="py-3.5 px-4">
                      {u.is_super_admin ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          <Lock className="w-3 h-3" />
                          Super Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-800/80 text-zinc-300 border border-zinc-700/60 capitalize">
                          <Shield className="w-3 h-3 text-blue-400" />
                          {u.role.replace('_', ' ')}
                        </span>
                      )}
                    </td>

                    {/* Auth Method */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-300">
                        <Fingerprint className="w-3.5 h-3.5 text-zinc-400" />
                        {u.auth_strategy.replace('from_oauth_', 'OAuth: ').replace('email_code', 'Email OTP')}
                      </span>
                    </td>

                    {/* Account Created */}
                    <td className="py-3.5 px-4 text-xs text-zinc-400">
                      {formatTimestamp(u.created_at)}
                    </td>

                    {/* Last Login / Sign in */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className={`text-xs font-semibold ${
                          u.last_sign_in_at && (Date.now() - new Date(u.last_sign_in_at).getTime()) < 86400000 
                            ? 'text-emerald-400' 
                            : 'text-zinc-300'
                        }`}>
                          {formatRelativeTime(u.last_sign_in_at)}
                        </span>
                        <span className="text-[11px] font-mono text-zinc-500">
                          {formatTimestamp(u.last_sign_in_at)}
                        </span>
                      </div>
                    </td>

                    {/* Audit Traces */}
                    <td className="py-3.5 px-4 text-right">
                      <span className="inline-block px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 font-mono text-xs text-zinc-300">
                        {u.audit_actions_count} actions
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Real PostgreSQL Audit Trail Stream */}
      <div className="p-6 rounded-2xl bg-[#0a0a0c] border border-zinc-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" />
              Real-Time Security &amp; Audit Trail
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Cryptographic traces registered by automated engines and administrative actions
            </p>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-400">
            Last {data?.recent_audit_trail.length || 0} events
          </span>
        </div>

        <div className="divide-y divide-zinc-800/60">
          {(data?.recent_audit_trail || []).map((evt, idx) => (
            <div key={`${evt.id}-${idx}`} className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs">
              <div className="flex items-start md:items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-blue-400 mt-1 md:mt-0 shrink-0" />
                <div>
                  <span className="font-semibold text-white mr-2">{evt.action}</span>
                  <span className="text-zinc-500 font-mono text-[11px]">[{evt.entity_type}]</span>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    Actor: <span className="text-zinc-300 font-mono">{evt.actor}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end md:self-center">
                <span className="text-[11px] font-mono text-zinc-500">
                  {formatTimestamp(evt.timestamp)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
