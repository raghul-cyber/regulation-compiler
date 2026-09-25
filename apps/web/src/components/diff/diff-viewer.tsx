'use client';

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
    return arr.map(item => `• ${item}`).join('\n');
  };

  return (
    <div className="flex flex-col h-[700px]">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-white/[0.06] pb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#F4F6F8] mb-1.5">Version Comparison (Diff Engine)</h1>
          <p className="text-xs text-[#9CA3AF]">
            Comparing <span className="font-mono text-[#F4F6F8] bg-[#0B0E14] border border-white/[0.08] px-1.5 py-0.5 rounded-[4px]">{diffData?.old_version?.slice(0, 8) || 'Previous'}</span> 
            {' '}with <span className="font-mono text-[#F4F6F8] bg-[#0B0E14] border border-white/[0.08] px-1.5 py-0.5 rounded-[4px]">{diffData?.new_version?.slice(0, 8) || 'Latest'}</span>
          </p>
        </div>
        
        {/* Tabs */}
        <div className="flex space-x-1 bg-[#080A0E] p-1 rounded-[6px] border border-white/[0.08]">
          <button 
            onClick={() => setActiveTab('added')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-[4px] transition-colors cursor-pointer ${activeTab === 'added' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'text-[#9CA3AF] hover:text-[#F4F6F8]'}`}
          >
            <FilePlus className="w-3.5 h-3.5" /> Added ({added.length})
          </button>
          <button 
            onClick={() => setActiveTab('modified')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-[4px] transition-colors cursor-pointer ${activeTab === 'modified' ? 'bg-[#C9B88A]/20 text-[#C9B88A] border border-[#C9B88A]/40' : 'text-[#9CA3AF] hover:text-[#F4F6F8]'}`}
          >
            <Edit3 className="w-3.5 h-3.5" /> Modified ({modified.length})
          </button>
          <button 
            onClick={() => setActiveTab('removed')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-[4px] transition-colors cursor-pointer ${activeTab === 'removed' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' : 'text-[#9CA3AF] hover:text-[#F4F6F8]'}`}
          >
            <FileMinus className="w-3.5 h-3.5" /> Removed ({removed.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 flex gap-6">
        {activeTab === 'modified' && (
          <>
            {/* Left Sidebar */}
            <div className="w-1/3 bg-[#080A0E] border border-white/[0.08] rounded-[8px] overflow-y-auto">
              <div className="p-3.5 border-b border-white/[0.06] sticky top-0 bg-[#080A0E]/95 backdrop-blur z-10">
                <h3 className="text-xs font-mono uppercase tracking-wider text-[#A0A6B1]">Changed Requirements</h3>
              </div>
              <div className="divide-y divide-white/[0.05]">
                {modified.map((item: any, i: number) => (
                  <div 
                    key={i}
                    onClick={() => setSelectedModifiedItem(item)}
                    className={`p-3.5 cursor-pointer transition-colors ${selectedModifiedItem?.requirement_id === item.requirement_id ? 'bg-[#C9B88A]/10 border-l-2 border-[#C9B88A]' : 'hover:bg-white/[0.02] border-l-2 border-transparent'}`}
                  >
                    <div className="text-sm font-semibold text-[#F4F6F8] mb-1">{item.title}</div>
                    <div className="text-xs text-[#9CA3AF] flex justify-between items-center mt-2 font-mono">
                      <span className="bg-[#050608] px-1.5 py-0.5 rounded-[4px] border border-white/[0.06]">
                        Match: <span className="text-[#4D8FCC]">{item.match_reason}</span>
                      </span>
                      <span className="text-[#C9B88A] font-medium">{Object.keys(item.field_diffs || {}).length} fields changed</span>
                    </div>
                  </div>
                ))}
                {modified.length === 0 && (
                  <div className="p-8 text-center text-[#64748B] text-xs font-mono">No modified requirements detected.</div>
                )}
              </div>
            </div>

            {/* Visual Diff Viewer */}
            <div className="w-2/3 bg-[#080A0E] border border-white/[0.08] rounded-[8px] overflow-y-auto flex flex-col">
              {selectedModifiedItem ? (
                <>
                  <div className="p-5 border-b border-white/[0.06] flex items-center justify-between bg-[#050608]">
                    <h2 className="text-base font-bold text-[#F4F6F8]">{selectedModifiedItem.title}</h2>
                    <span className="text-xs font-mono text-[#9CA3AF]">Comparing <span className="text-rose-400">Previous</span> to <span className="text-emerald-400">Latest</span></span>
                  </div>
                  
                  <div className="p-6 space-y-6">
                    {Object.entries(selectedModifiedItem.field_diffs || {}).map(([field, diff]: [string, any]) => (
                      <div key={field} className="space-y-2.5">
                        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#64748B]">{field.replace(/_/g, ' ')}</h4>
                        
                        <div className="grid grid-cols-2 gap-4">
                          {/* OLD VERSION */}
                          <div className="bg-rose-950/15 border border-rose-900/30 rounded-[6px] p-3.5">
                            <div className="text-[10px] uppercase font-mono font-bold text-rose-400/80 mb-1.5">Previous Version</div>
                            <div className="text-xs text-rose-200/90 whitespace-pre-wrap font-mono leading-relaxed">
                              {diff.old ? formatArray(diff.old) : 'None'}
                            </div>
                          </div>
                          
                          {/* NEW VERSION */}
                          <div className="bg-emerald-950/15 border border-emerald-900/30 rounded-[6px] p-3.5 relative">
                            <div className="text-[10px] uppercase font-mono font-bold text-emerald-400/80 mb-1.5">New Version</div>
                            
                            {/* Connection Arrow Graphic */}
                            <div className="absolute -left-[17px] top-1/2 -translate-y-1/2 w-[14px] h-[1px] bg-white/[0.12]"></div>
                            <div className="absolute -left-[3px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 border-t border-r border-white/[0.2] rotate-45"></div>

                            <div className="text-xs text-emerald-200/90 whitespace-pre-wrap font-mono leading-relaxed">
                              {diff.new ? formatArray(diff.new) : 'None'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="m-auto text-[#64748B] flex flex-col items-center p-8">
                  <AlertCircle className="w-10 h-10 mb-3 opacity-30 text-[#4D8FCC]" />
                  <p className="text-xs font-mono">Select a modified requirement to view field-level differences.</p>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'added' && (
          <div className="w-full bg-[#080A0E] border border-white/[0.08] rounded-[8px] overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-emerald-500/5 border-b border-emerald-500/20">
                  <th className="py-3.5 px-5 text-xs font-semibold font-mono uppercase tracking-wider text-emerald-400">New Requirement Title</th>
                  <th className="py-3.5 px-5 text-xs font-semibold font-mono uppercase tracking-wider text-emerald-400">Type</th>
                  <th className="py-3.5 px-5 text-xs font-semibold font-mono uppercase tracking-wider text-emerald-400">Severity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {added.map((item: any, i: number) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-5 text-sm font-medium text-[#F4F6F8]">{item.title}</td>
                    <td className="py-3.5 px-5 text-xs font-mono text-[#9CA3AF] capitalize">{item.new_data?.type}</td>
                    <td className="py-3.5 px-5 text-xs font-mono text-[#9CA3AF] capitalize">{item.new_data?.severity}</td>
                  </tr>
                ))}
                {added.length === 0 && (
                  <tr><td colSpan={3} className="py-12 text-center text-[#64748B] text-xs font-mono">No new requirements added in this version.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'removed' && (
          <div className="w-full bg-[#080A0E] border border-white/[0.08] rounded-[8px] overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-rose-500/5 border-b border-rose-500/20">
                  <th className="py-3.5 px-5 text-xs font-semibold font-mono uppercase tracking-wider text-rose-400">Removed Requirement Title</th>
                  <th className="py-3.5 px-5 text-xs font-semibold font-mono uppercase tracking-wider text-rose-400">Type</th>
                  <th className="py-3.5 px-5 text-xs font-semibold font-mono uppercase tracking-wider text-rose-400">Severity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {removed.map((item: any, i: number) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-5 text-sm font-medium text-[#9CA3AF] line-through decoration-rose-500/50">{item.title}</td>
                    <td className="py-3.5 px-5 text-xs font-mono text-[#64748B] capitalize">{item.old_data?.type}</td>
                    <td className="py-3.5 px-5 text-xs font-mono text-[#64748B] capitalize">{item.old_data?.severity}</td>
                  </tr>
                ))}
                {removed.length === 0 && (
                  <tr><td colSpan={3} className="py-12 text-center text-[#64748B] text-xs font-mono">No requirements were removed in this version.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
