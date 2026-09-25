"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Users, Shield, Loader2, UserCheck, AlertCircle, MailPlus, Trash2, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/components/ui/intra-app-toast';

interface TeamMember {
  id: string;
  email: string;
  role: string;
  clerk_user_id: string;
}

interface PendingInvite {
  id: string;
  email: string;
  role: string;
  created_at: string;
  link: string;
}

const ROLES = [
  { id: 'admin', label: 'Admin', desc: 'Full access to all settings and policies' },
  { id: 'compliance_officer', label: 'Compliance Officer', desc: 'Can approve and manage gaps' },
  { id: 'developer', label: 'Developer', desc: 'Can trigger pipelines and view technical reports' },
  { id: 'legal_counsel', label: 'Legal Counsel', desc: 'Read-only access with manual override ability' },
  { id: 'auditor', label: 'Auditor', desc: 'Strict read-only access to historical data' },
];

export default function TeamSettingsPage() {
  const { getToken } = useAuth();
  const toast = useToast();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("developer");
  const [inviteSuccessLink, setInviteSuccessLink] = useState<string | null>(null);

  useEffect(() => {
    fetchTeamAndInvites();
  }, []);

  const fetchTeamAndInvites = async () => {
    try {
      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080/api/v1';
      
      const [membersRes, invitesRes] = await Promise.all([
        fetch(`${apiUrl}/team/`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${apiUrl}/team/invites`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      if (!membersRes.ok) throw new Error("Failed to load team data");
      
      const membersData = await membersRes.json();
      setMembers(membersData.data || []);
      
      if (invitesRes.ok) {
        const invitesData = await invitesRes.json();
        setInvites(invitesData.data || []);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      setUpdating(userId);
      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080/api/v1';
      const res = await fetch(`${apiUrl}/team/${userId}/role`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
      });
      if (!res.ok) throw new Error("Failed to update role");
      
      setMembers(members.map(m => m.id === userId ? { ...m, role: newRole } : m));
      toast.success("Role Updated", "Member permissions have been updated.");
    } catch (err: any) {
      toast.error("Role Update Failed", err?.message || "Could not update user role.");
    } finally {
      setUpdating(null);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setUpdating("invite");
      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080/api/v1';
      const res = await fetch(`${apiUrl}/team/invite`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole })
      });
      if (!res.ok) throw new Error("Failed to send invite");
      const data = await res.json();
      
      setInviteSuccessLink("sent");
      setInviteEmail("");
      toast.success("Invite Sent", `An invitation has been dispatched to ${inviteEmail}.`);
      fetchTeamAndInvites();
    } catch (err: any) {
      toast.error("Invite Failed", err?.message || "Could not send team invitation.");
    } finally {
      setUpdating(null);
    }
  };
  
  const handleRevokeInvite = async (inviteId: string) => {
    try {
      setUpdating(inviteId);
      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080/api/v1';
      const res = await fetch(`${apiUrl}/team/invite/${inviteId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to revoke invite");
      
      setInvites(invites.filter(i => i.id !== inviteId));
      toast.success("Invite Revoked", "The invitation has been cancelled.");
    } catch (err: any) {
      toast.error("Revoke Failed", err?.message || "Could not revoke invitation.");
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-400">
        <Loader2 className="h-8 w-8 animate-spin mb-4 text-emerald-500" />
        <p>Loading real team data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-2xl font-bold text-white mb-2">Team & RBAC Settings</h1>
            <p className="text-[#94A3B8] text-sm">Manage organization members and their pipeline permissions.</p>
        </div>
        <button 
            onClick={() => { setIsInviteModalOpen(true); setInviteSuccessLink(null); }}
            className="flex items-center gap-2 px-4 py-2 bg-[#4D8FCC] hover:bg-[#3B72A8] text-white rounded-[6px] text-xs font-semibold uppercase tracking-wider transition-all shadow-sm cursor-pointer"
        >
            <MailPlus className="h-4 w-4" />
            Invite Member
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-950/20 border border-red-900/50 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="text-red-200 text-sm">{error}</div>
        </div>
      )}

      {/* ACTIVE MEMBERS */}
      <div className="bg-[#080A0E] border border-white/[0.08] rounded-[8px] overflow-hidden mb-8 shadow-sm">
        <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-3">
          <Users className="h-4 w-4 text-[#4D8FCC]" />
          <h2 className="text-sm font-bold text-[#F4F6F8]">Active Members ({members.length})</h2>
        </div>
        <div className="divide-y divide-white/[0.05]">
          {members.map(member => (
            <div key={member.id} className="p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center gap-4">
                <div className="h-9 w-9 rounded-full bg-[#0B0E14] border border-white/[0.08] flex items-center justify-center">
                  <UserCheck className="h-4 w-4 text-[#4D8FCC]" />
                </div>
                <div>
                  <div className="text-[#F4F6F8] font-medium text-sm">{member.email}</div>
                  <div className="text-xs text-[#64748B] mt-0.5 font-mono">{member.clerk_user_id}</div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {updating === member.id && <Loader2 className="h-4 w-4 text-[#4D8FCC] animate-spin" />}
                <select
                  value={member.role}
                  onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                  disabled={updating === member.id}
                  className="bg-[#050608] border border-white/[0.08] text-[#F4F6F8] text-xs font-mono rounded-[6px] focus:border-[#4D8FCC] focus:outline-none block w-48 p-2 disabled:opacity-50 cursor-pointer"
                >
                  {ROLES.map(r => (
                    <option key={r.id} value={r.id}>{r.label}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* PENDING INVITES */}
      {invites.length > 0 && (
          <div className="bg-[#0E1218] border border-[var(--rc-border)] rounded-xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-[var(--rc-border)] flex items-center gap-3">
              <MailPlus className="h-5 w-5 text-amber-400" />
              <h2 className="text-base font-semibold text-white">Pending Invitations ({invites.length})</h2>
            </div>
            <div className="divide-y divide-[var(--rc-border)]">
              {invites.map(invite => (
                <div key={invite.id} className="p-6 flex items-center justify-between hover:bg-[#141922]/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                      <MailPlus className="h-5 w-5 text-amber-400" />
                    </div>
                    <div>
                      <div className="text-white font-medium text-sm">{invite.email}</div>
                      <div className="text-xs text-[#64748B] mt-0.5">Invited as {ROLES.find(r => r.id === invite.role)?.label} on {new Date(invite.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
    
                  <div className="flex items-center gap-4">
                    {updating === invite.id && <Loader2 className="h-4 w-4 text-amber-400 animate-spin" />}
                    <button 
                        onClick={() => handleRevokeInvite(invite.id)}
                        disabled={updating === invite.id}
                        className="text-red-400 hover:text-red-300 text-xs font-mono font-medium flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                    >
                        <Trash2 className="h-4 w-4" />
                        Revoke
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
      )}

      {/* INVITE MODAL */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-[#0E1218] border border-[var(--rc-border)] rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-[var(--rc-border)] flex justify-between items-center">
                    <h3 className="text-base font-bold text-white">Invite Team Member</h3>
                    <button onClick={() => setIsInviteModalOpen(false)} className="text-zinc-500 hover:text-white cursor-pointer">&times;</button>
                </div>
                <div className="p-6">
                    {inviteSuccessLink ? (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
                            <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                            <h4 className="text-emerald-400 font-semibold mb-2 text-sm">Invite Sent!</h4>
                            <p className="text-xs text-[#94A3B8] mb-4">An invitation email has been dispatched to your colleague.</p>
                            <button 
                                onClick={() => setIsInviteModalOpen(false)}
                                className="w-full bg-[#141922] hover:bg-[#1A2230] text-white rounded-lg py-2 text-xs font-medium border border-[var(--rc-border)] transition-colors cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSendInvite} className="space-y-4">
                            <div>
                                <label className="block text-xs font-mono uppercase tracking-wider text-[#9CA3AF] mb-1.5 font-medium">Email Address</label>
                                <input 
                                    type="email" 
                                    required 
                                    value={inviteEmail} 
                                    onChange={e => setInviteEmail(e.target.value)}
                                    className="w-full bg-[#050608] border border-white/[0.08] rounded-[6px] p-2.5 text-[#F4F6F8] text-xs font-mono focus:border-[#4D8FCC] focus:outline-none"
                                    placeholder="colleague@company.com"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-mono uppercase tracking-wider text-[#9CA3AF] mb-1.5 font-medium">Role</label>
                                <select 
                                    value={inviteRole} 
                                    onChange={e => setInviteRole(e.target.value)}
                                    className="w-full bg-[#050608] border border-white/[0.08] rounded-[6px] p-2.5 text-[#F4F6F8] text-xs font-mono focus:border-[#4D8FCC] focus:outline-none cursor-pointer"
                                >
                                    {ROLES.map(r => (
                                         <option key={r.id} value={r.id}>{r.label} - {r.desc}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="pt-4 flex justify-end gap-3 border-t border-white/[0.06]">
                                <button 
                                    type="button" 
                                    onClick={() => setIsInviteModalOpen(false)}
                                    className="px-3.5 py-2 text-[#9CA3AF] hover:text-[#F4F6F8] text-xs font-medium transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={updating === "invite"}
                                    className="px-4 py-2 bg-[#4D8FCC] hover:bg-[#3B72A8] text-white rounded-[6px] text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all shadow-sm cursor-pointer"
                                >
                                    {updating === "invite" ? <Loader2 className="h-4 w-4 animate-spin" /> : <MailPlus className="h-4 w-4" />}
                                    Send Invite
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
