"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Users, Shield, Loader2, UserCheck, AlertCircle, MailPlus, Trash2, CheckCircle2 } from 'lucide-react';

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
    } catch (err: any) {
      alert(err.message);
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
      fetchTeamAndInvites();
    } catch (err: any) {
      alert(err.message);
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
    } catch (err: any) {
      alert(err.message);
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
            <p className="text-gray-400">Manage real organization members and their pipeline permissions.</p>
        </div>
        <button 
            onClick={() => { setIsInviteModalOpen(true); setInviteSuccessLink(null); }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-sm font-medium transition-colors"
        >
            <MailPlus className="h-4 w-4" />
            Invite Member
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="text-red-200">{error}</div>
        </div>
      )}

      {/* ACTIVE MEMBERS */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center gap-3">
          <Users className="h-5 w-5 text-emerald-500" />
          <h2 className="text-lg font-semibold text-white">Active Members ({members.length})</h2>
        </div>
        <div className="divide-y divide-gray-800">
          {members.map(member => (
            <div key={member.id} className="p-6 flex items-center justify-between hover:bg-gray-800/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-emerald-900/30 border border-emerald-500/30 flex items-center justify-center">
                  <UserCheck className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <div className="text-white font-medium">{member.email}</div>
                  <div className="text-xs text-gray-500 mt-1 font-mono">{member.clerk_user_id}</div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {updating === member.id && <Loader2 className="h-4 w-4 text-emerald-500 animate-spin" />}
                <select
                  value={member.role}
                  onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                  disabled={updating === member.id}
                  className="bg-gray-950 border border-gray-700 text-white text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-48 p-2.5 disabled:opacity-50"
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
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800 flex items-center gap-3">
              <MailPlus className="h-5 w-5 text-amber-500" />
              <h2 className="text-lg font-semibold text-white">Pending Invitations ({invites.length})</h2>
            </div>
            <div className="divide-y divide-gray-800">
              {invites.map(invite => (
                <div key={invite.id} className="p-6 flex items-center justify-between hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-amber-900/30 border border-amber-500/30 flex items-center justify-center">
                      <MailPlus className="h-5 w-5 text-amber-400" />
                    </div>
                    <div>
                      <div className="text-white font-medium">{invite.email}</div>
                      <div className="text-xs text-gray-500 mt-1">Invited as {ROLES.find(r => r.id === invite.role)?.label} on {new Date(invite.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
    
                  <div className="flex items-center gap-4">
                    {updating === invite.id && <Loader2 className="h-4 w-4 text-amber-500 animate-spin" />}
                    <button 
                        onClick={() => handleRevokeInvite(invite.id)}
                        disabled={updating === invite.id}
                        className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1 disabled:opacity-50"
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
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-md w-full shadow-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-white">Invite Team Member</h3>
                    <button onClick={() => setIsInviteModalOpen(false)} className="text-gray-400 hover:text-white">&times;</button>
                </div>
                <div className="p-6">
                    {inviteSuccessLink ? (
                        <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-4 text-center">
                            <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                            <h4 className="text-emerald-400 font-medium mb-4">Invite Sent!</h4>
                            <p className="text-sm text-gray-400 mb-4">An invitation email has been dispatched to your colleague.</p>
                            <button 
                                onClick={() => setIsInviteModalOpen(false)}
                                className="w-full bg-gray-800 hover:bg-gray-700 text-white rounded py-2 text-sm"
                            >
                                Close
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSendInvite} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
                                <input 
                                    type="email" 
                                    required 
                                    value={inviteEmail} 
                                    onChange={e => setInviteEmail(e.target.value)}
                                    className="w-full bg-black border border-gray-700 rounded p-2 text-white"
                                    placeholder="colleague@company.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Role</label>
                                <select 
                                    value={inviteRole} 
                                    onChange={e => setInviteRole(e.target.value)}
                                    className="w-full bg-black border border-gray-700 rounded p-2 text-white"
                                >
                                    {ROLES.map(r => (
                                        <option key={r.id} value={r.id}>{r.label} - {r.desc}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button 
                                    type="button" 
                                    onClick={() => setIsInviteModalOpen(false)}
                                    className="px-4 py-2 text-gray-400 hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={updating === "invite"}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded flex items-center gap-2"
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
