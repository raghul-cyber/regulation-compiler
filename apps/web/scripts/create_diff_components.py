import os

files = {
    "src/components/diff/diff-viewer.tsx": """'use client';

import { useState } from 'react';
import { ArrowRight, AlertCircle, FilePlus, FileMinus, Edit3 } from 'lucide-react';

export function DiffViewer({ diffData }: { diffData: any }) {
  const [activeTab, setActiveTab] = useState<'added' | 'modified' | 'removed'>('modified');
  const [selectedModifiedItem, setSelectedModifiedItem] = useState<any>(null);

  const summary = diffData?.diff_summary || { added: [], modified: [], removed: [] };
  const { added, modified, removed } = summary;

  // Auto-select first modified item if none selected
  if (activeTab === 'modified' && !selectedModifiedItem && modified.length > 0) {
    setSelectedModifiedItem(modified[0]);
  }

  const formatArray = (arr: any) => {
    if (!Array.isArray(arr)) return arr;
    return arr.map(item => `• ${item}`).join('\\n');
  };

  return (
    <div className="flex flex-col h-[700px]">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-zinc-800 pb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Version Comparison (Diff Engine)</h1>
          <p className="text-sm text-zinc-400">
            Comparing <span className="font-mono text-zinc-300 bg-zinc-800 px-1.5 py-0.5 rounded">{diffData?.old_version?.slice(0, 8) || 'Previous'}</span> 
            {' '}with <span className="font-mono text-zinc-300 bg-zinc-800 px-1.5 py-0.5 rounded">{diffData?.new_version?.slice(0, 8) || 'Latest'}</span>
          </p>
        </div>
        
        {/* Tabs */}
        <div className="flex space-x-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
          <button 
            onClick={() => setActiveTab('added')}
            className={`flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'added' ? 'bg-emerald-500/20 text-emerald-400' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            <FilePlus className="w-4 h-4" /> Added ({added.length})
          </button>
          <button 
            onClick={() => setActiveTab('modified')}
            className={`flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'modified' ? 'bg-amber-500/20 text-amber-400' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            <Edit3 className="w-4 h-4" /> Modified ({modified.length})
          </button>
          <button 
            onClick={() => setActiveTab('removed')}
            className={`flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'removed' ? 'bg-red-500/20 text-red-400' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            <FileMinus className="w-4 h-4" /> Removed ({removed.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 flex gap-6">
        {activeTab === 'modified' && (
          <>
            {/* Left Sidebar */}
            <div className="w-1/3 bg-[#0a0a0c] border border-zinc-800 rounded-xl overflow-y-auto">
              <div className="p-4 border-b border-zinc-800 sticky top-0 bg-[#0a0a0c]/95 backdrop-blur z-10">
                <h3 className="text-sm font-bold text-zinc-200">Changed Requirements</h3>
              </div>
              <div className="divide-y divide-zinc-800/50">
                {modified.map((item: any, i: number) => (
                  <div 
                    key={i}
                    onClick={() => setSelectedModifiedItem(item)}
                    className={`p-4 cursor-pointer transition-colors ${selectedModifiedItem?.requirement_id === item.requirement_id ? 'bg-amber-500/10 border-l-2 border-amber-500' : 'hover:bg-zinc-800/30 border-l-2 border-transparent'}`}
                  >
                    <div className="text-sm font-medium text-white mb-1">{item.title}</div>
                    <div className="text-xs text-zinc-500 flex justify-between items-center mt-2">
                      <span className="bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                        Match: <span className="text-blue-400">{item.match_reason}</span>
                      </span>
                      <span className="text-amber-500 font-medium">{Object.keys(item.field_diffs || {}).length} fields changed</span>
                    </div>
                  </div>
                ))}
                {modified.length === 0 && (
                  <div className="p-8 text-center text-zinc-500 text-sm">No modified requirements detected.</div>
                )}
              </div>
            </div>

            {/* Visual Diff Viewer */}
            <div className="w-2/3 bg-[#0a0a0c] border border-zinc-800 rounded-xl overflow-y-auto flex flex-col">
              {selectedModifiedItem ? (
                <>
                  <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/50">
                    <h2 className="text-lg font-bold text-white">{selectedModifiedItem.title}</h2>
                    <span className="text-xs text-zinc-400">Comparing <span className="text-red-400">Old</span> to <span className="text-emerald-400">New</span></span>
                  </div>
                  
                  <div className="p-6 space-y-8">
                    {Object.entries(selectedModifiedItem.field_diffs || {}).map(([field, diff]: [string, any]) => (
                      <div key={field} className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">{field.replace(/_/g, ' ')}</h4>
                        
                        <div className="grid grid-cols-2 gap-4">
                          {/* OLD VERSION */}
                          <div className="bg-red-950/20 border border-red-900/30 rounded-lg p-4">
                            <div className="text-[10px] uppercase font-bold text-red-500/70 mb-2">Previous Version</div>
                            <div className="text-sm text-red-200/90 whitespace-pre-wrap font-mono leading-relaxed">
                              {diff.old ? formatArray(diff.old) : 'None'}
                            </div>
                          </div>
                          
                          {/* NEW VERSION */}
                          <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-lg p-4 relative">
                            <div className="text-[10px] uppercase font-bold text-emerald-500/70 mb-2">New Version</div>
                            
                            {/* Connection Arrow Graphic */}
                            <div className="absolute -left-[17px] top-1/2 -translate-y-1/2 w-[14px] h-[1px] bg-zinc-700"></div>
                            <div className="absolute -left-[3px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 border-t border-r border-zinc-700 rotate-45"></div>

                            <div className="text-sm text-emerald-200/90 whitespace-pre-wrap font-mono leading-relaxed">
                              {diff.new ? formatArray(diff.new) : 'None'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="m-auto text-zinc-500 flex flex-col items-center">
                  <AlertCircle className="w-12 h-12 mb-4 opacity-20" />
                  <p>Select a modified requirement to view field-level differences.</p>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'added' && (
          <div className="w-full bg-[#0a0a0c] border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-emerald-500/5 border-b border-emerald-500/20">
                  <th className="py-4 px-6 text-xs font-semibold uppercase text-emerald-500">New Requirement Title</th>
                  <th className="py-4 px-6 text-xs font-semibold uppercase text-emerald-500">Type</th>
                  <th className="py-4 px-6 text-xs font-semibold uppercase text-emerald-500">Severity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {added.map((item: any, i: number) => (
                  <tr key={i} className="hover:bg-zinc-800/20 transition-colors">
                    <td className="py-4 px-6 text-sm font-medium text-white">{item.title}</td>
                    <td className="py-4 px-6 text-sm text-zinc-400 capitalize">{item.new_data?.type}</td>
                    <td className="py-4 px-6 text-sm text-zinc-400 capitalize">{item.new_data?.severity}</td>
                  </tr>
                ))}
                {added.length === 0 && (
                  <tr><td colSpan={3} className="py-12 text-center text-zinc-500">No new requirements added in this version.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'removed' && (
          <div className="w-full bg-[#0a0a0c] border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-red-500/5 border-b border-red-500/20">
                  <th className="py-4 px-6 text-xs font-semibold uppercase text-red-500">Removed Requirement Title</th>
                  <th className="py-4 px-6 text-xs font-semibold uppercase text-red-500">Type</th>
                  <th className="py-4 px-6 text-xs font-semibold uppercase text-red-500">Severity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {removed.map((item: any, i: number) => (
                  <tr key={i} className="hover:bg-zinc-800/20 transition-colors">
                    <td className="py-4 px-6 text-sm font-medium text-zinc-400 line-through decoration-red-500/50">{item.title}</td>
                    <td className="py-4 px-6 text-sm text-zinc-500 capitalize">{item.old_data?.type}</td>
                    <td className="py-4 px-6 text-sm text-zinc-500 capitalize">{item.old_data?.severity}</td>
                  </tr>
                ))}
                {removed.length === 0 && (
                  <tr><td colSpan={3} className="py-12 text-center text-zinc-500">No requirements were removed in this version.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
"""
}

for path, content in files.items():
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Created {path}")

