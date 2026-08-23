'use client';

import { useState } from 'react';
import { createApiKey, revokeApiKey } from '@/app/actions';
import { Key, Plus, Copy, AlertCircle, Loader2, X, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

const AVAILABLE_SCOPES = [
  { id: 'read-only', label: 'Read Only', desc: 'Can read regulations, requirements, and compliance statuses.' },
  { id: 'check-compliance', label: 'Check Compliance', desc: 'Can execute the Compliance Simulator checks.' },
  { id: 'admin', label: 'Administrator', desc: 'Full access to all endpoints, including mutations and settings.' }
];

export function ApiKeysList({ initialKeys }: { initialKeys: any[] }) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Create state
  const [keyName, setKeyName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [generatedRawKey, setGeneratedRawKey] = useState<string | null>(null);

  const toggleScope = (id: string) => {
    setSelectedScopes(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const res = await createApiKey(keyName, selectedScopes);
      if (!res.success) {
        alert(res.error);
        return;
      }
      setGeneratedRawKey(res.data.raw_key);
      router.refresh(); // Refresh list behind modal
    } catch (e) {
      alert("Failed to create API key");
    } finally {
      setIsCreating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this key? Any systems using it will immediately lose access.')) return;
    
    try {
      const res = await revokeApiKey(id);
      if (!res.success) {
        alert(res.error);
        return;
      }
      router.refresh();
    } catch(e) {
      alert("Failed to revoke API key");
    }
  };

  const copyToClipboard = () => {
    if (generatedRawKey) {
      navigator.clipboard.writeText(generatedRawKey);
      alert('Copied to clipboard!');
    }
  };

  const closeModals = () => {
    setIsModalOpen(false);
    setGeneratedRawKey(null);
    setKeyName('');
    setSelectedScopes([]);
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Developer API Keys</h1>
          <p className="text-zinc-400 text-sm">Manage authentication keys for CI/CD pipelines, custom integrations, and the Compliance Engine.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-500 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-blue-500/50 focus:outline-none text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)] flex items-center gap-2 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" /> Generate New Key
        </button>
      </div>

      {/* API Keys List */}
      <div className="bg-[#0a0a0c] border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-zinc-950 border-b border-zinc-800">
                <th className="py-4 px-6 text-xs font-semibold uppercase text-zinc-500">Name</th>
                <th className="py-4 px-6 text-xs font-semibold uppercase text-zinc-500">Prefix</th>
                <th className="py-4 px-6 text-xs font-semibold uppercase text-zinc-500">Scopes</th>
                <th className="py-4 px-6 text-xs font-semibold uppercase text-zinc-500">Created</th>
                <th className="py-4 px-6 text-xs font-semibold uppercase text-zinc-500">Status</th>
                <th className="py-4 px-6 text-right text-xs font-semibold uppercase text-zinc-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {initialKeys.map(key => (
                <tr key={key.id} className="hover:bg-zinc-800/20 transition-colors">
                  <td className="py-4 px-6">
                    <span className="text-sm font-medium text-zinc-200">{key.name}</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-sm font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-1 rounded">rac_...</span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex flex-wrap gap-2">
                      {key.scopes.map((scope: string) => (
                        <span key={scope} className="text-[10px] uppercase px-1.5 py-0.5 rounded border border-zinc-700 text-zinc-400 bg-zinc-800/50">
                          {scope}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-sm text-zinc-500">{new Date(key.created_at).toLocaleDateString()}</span>
                  </td>
                  <td className="py-4 px-6">
                    {key.revoked_at ? (
                      <span className="text-[10px] font-bold uppercase px-2 py-1 rounded border border-red-500/30 text-red-400 bg-red-900/30">Revoked</span>
                    ) : (
                      <span className="text-[10px] font-bold uppercase px-2 py-1 rounded border border-emerald-500/30 text-emerald-400 bg-emerald-900/30">Active</span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-right">
                    {!key.revoked_at && (
                      <button 
                        onClick={() => handleRevoke(key.id)}
                        className="text-sm text-red-500 hover:text-red-400 font-medium"
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {initialKeys.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500">
                    <Key className="w-8 h-8 mx-auto mb-3 opacity-20" />
                    No API keys found. Generate one to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {isModalOpen && !generatedRawKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0a0a0c]/80 backdrop-blur-sm" onClick={() => !isCreating && setIsModalOpen(false)}></div>
          
          <div className="relative bg-[#0a0a0c] border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
              <h2 className="text-lg font-bold text-white">Generate API Key</h2>
              <button disabled={isCreating} onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-zinc-300 mb-2">Key Name</label>
                <input 
                  id="name"
                  type="text" 
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder="e.g. Production CI/CD Runner" 
                  className="w-full bg-zinc-900 text-sm text-zinc-200 p-3 rounded-lg border border-zinc-800 focus:outline-none focus-visible:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Select Scopes</label>
                <div className="space-y-2">
                  {AVAILABLE_SCOPES.map(scope => (
                    <button 
                      key={scope.id}
                      onClick={() => toggleScope(scope.id)}
                      className={`w-full flex items-center text-left p-3 rounded-lg border transition-colors ${selectedScopes.includes(scope.id) ? 'bg-blue-500/10 border-blue-500/50' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'}`}
                    >
                      <div className={`w-5 h-5 rounded flex items-center justify-center mr-3 shrink-0 ${selectedScopes.includes(scope.id) ? 'bg-blue-500' : 'border border-zinc-600'}`}>
                        {selectedScopes.includes(scope.id) && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </div>
                      <div>
                        <span className="text-sm font-medium text-zinc-200 block mb-0.5">{scope.label}</span>
                        <span className="text-xs text-zinc-500 block">{scope.desc}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="p-5 border-t border-zinc-800 bg-zinc-950 flex justify-end space-x-3">
              <button disabled={isCreating} onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors">Cancel</button>
              <button 
                onClick={handleCreate}
                disabled={isCreating || !keyName.trim() || selectedScopes.length === 0}
                className="px-5 py-2.5 text-sm font-medium bg-blue-600 hover:bg-blue-500 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-blue-500/50 focus:outline-none text-white rounded-lg transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
              >
                {isCreating ? <><Loader2 className="w-4 h-4 animate-spin"/> Generating...</> : 'Generate Key'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal (Show Raw Key Once) */}
      {generatedRawKey && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0a0a0c]/90 backdrop-blur-md"></div>
          
          <div className="relative bg-[#0a0a0c] border border-blue-500/30 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-8 text-center border-b border-zinc-800">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                <CheckCircle2 className="w-8 h-8 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Key Generated Successfully</h2>
              <p className="text-sm text-amber-500 bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg">
                Copy your new API key now. You won't be able to see it again!
              </p>
            </div>
            
            <div className="p-8 bg-zinc-950">
              <div className="flex items-center space-x-2 bg-[#0a0a0c] border border-zinc-800 rounded-lg p-2 mb-6">
                <input 
                  type="text" 
                  readOnly 
                  value={generatedRawKey}
                  className="flex-1 bg-transparent text-zinc-200 font-mono text-sm px-2 focus:outline-none"
                />
                <button 
                  onClick={copyToClipboard}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 p-2 rounded transition-colors"
                  title="Copy to clipboard"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              
              <button 
                onClick={closeModals}
                className="w-full px-5 py-3 text-sm font-medium bg-zinc-200 hover:bg-white text-zinc-950 rounded-lg transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)]"
              >
                I've copied my key safely
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
