'use client';

import { useState } from 'react';
import { Compass, CheckCircle2, Link2 } from 'lucide-react';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';

interface InteractiveNode {
  id: string;
  label: string;
  framework: string;
  clause: string;
  dependency: string;
  rule: string;
  validation: 'PASS' | 'ACTIVE' | 'EVALUATING';
  connections: string[];
  x: number;
  y: number;
}

const NODES: InteractiveNode[] = [
  {
    id: 'node_ai_act',
    label: 'EU AI Act Art. 9',
    framework: 'Regulation (EU) 2024/1689',
    clause: 'Risk Management System §9(2)',
    dependency: 'ISO 42001:2023 §6.1',
    rule: 'assert(ai_system.lifecycle_monitoring == true)',
    validation: 'PASS',
    connections: ['node_dora', 'node_nist'],
    x: 22,
    y: 35,
  },
  {
    id: 'node_dora',
    label: 'DORA Article 12',
    framework: 'Digital Operational Resilience Act',
    clause: 'Backup & Recovery §12(1)',
    dependency: 'RPO <= 1h, RTO <= 4h',
    rule: 'assert(datastore.backup.immutable == true)',
    validation: 'PASS',
    connections: ['node_ai_act', 'node_gdpr', 'node_sec'],
    x: 48,
    y: 25,
  },
  {
    id: 'node_gdpr',
    label: 'GDPR Article 32',
    framework: 'General Data Protection Regulation',
    clause: 'Technical Security Controls §32(1)(a)',
    dependency: 'NIST SP 800-57 KMS',
    rule: 'assert(storage.encryption.algorithm == "AES_256")',
    validation: 'PASS',
    connections: ['node_dora', 'node_mas'],
    x: 75,
    y: 35,
  },
  {
    id: 'node_nist',
    label: 'NIST CSF 2.0 PR.AC',
    framework: 'NIST Cybersecurity Framework',
    clause: 'Access Enforcement PR.AC-01',
    dependency: 'Zero Trust Architecture (SP 800-207)',
    rule: 'assert(identity.mfa.hardware_token == true)',
    validation: 'PASS',
    connections: ['node_ai_act', 'node_sec'],
    x: 28,
    y: 70,
  },
  {
    id: 'node_sec',
    label: 'SEC Item 106',
    framework: 'US Securities & Exchange Commission',
    clause: 'Material Incident Governance §229.106',
    dependency: 'Board Cybersecurity Committee',
    rule: 'assert(incident.disclosure_window_hours <= 96)',
    validation: 'PASS',
    connections: ['node_dora', 'node_nist', 'node_mas'],
    x: 52,
    y: 75,
  },
  {
    id: 'node_mas',
    label: 'MAS Notice 655',
    framework: 'Monetary Authority of Singapore',
    clause: 'Cyber Hygiene Security §4.1',
    dependency: 'Administrative Interface Isolation',
    rule: 'assert(perimeter.bastion_ssh.ip_restricted == true)',
    validation: 'PASS',
    connections: ['node_gdpr', 'node_sec'],
    x: 78,
    y: 68,
  },
];

export function InteractiveCompilation() {
  const [activeNodeId, setActiveNodeId] = useState<string>('node_ai_act');
  const activeNode = NODES.find((n) => n.id === activeNodeId) || NODES[0];
  const { ref: titleRef, isRevealed: titleRevealed } = useScrollReveal();
  const { ref: contentRef, isRevealed: contentRevealed } = useScrollReveal({ threshold: 0.1 });

  return (
    <section id="interactive" className="w-full max-w-6xl mx-auto px-4 md:px-6 pointer-events-auto scroll-mt-24">
      {/* Title */}
      <div ref={titleRef} className={`landing-reveal ${titleRevealed ? 'revealed' : ''} text-center max-w-3xl mx-auto mb-14`}>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#151311] border border-[rgba(201,196,186,0.12)] text-[#AD956C] text-xs font-mono font-medium uppercase tracking-wider mb-4 shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
          <Compass className="w-3.5 h-3.5 text-[#AD956C]" />
          Live Interactive Field
        </div>
        <h2 className="text-3xl sm:text-5xl font-extrabold text-[#F7F4EC] tracking-tight leading-tight">
          See regulation become structure.
        </h2>
        <p className="mt-4 text-base md:text-lg text-[#C9C4BA] leading-relaxed">
          Hover or select any regulatory node in the compliance field to inspect clause obligations, cross-framework dependencies, and deterministic validation outputs.
        </p>
      </div>

      {/* Main Interactive Field Canvas Container */}
      <div ref={contentRef} className={`landing-reveal ${contentRevealed ? 'revealed' : ''} relative w-full rounded-2xl bg-[#151311] border border-[rgba(201,196,186,0.12)] p-6 md:p-8 overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.8)]`}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
          {/* Interactive Topology Graph Area (7 Cols) */}
          <div className="lg:col-span-7 relative h-[380px] rounded-xl bg-[#100E0D] border border-[rgba(201,196,186,0.08)] p-4 flex items-center justify-center">
            {/* SVG Connecting Edges with animated dash flow */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {NODES.map((n1) =>
                n1.connections.map((targetId) => {
                  const n2 = NODES.find((t) => t.id === targetId);
                  if (!n2 || n1.id > n2.id) return null;

                  const isEdgeActive = activeNode.id === n1.id || activeNode.id === n2.id;
                  return (
                    <line
                      key={`${n1.id}-${n2.id}`}
                      x1={`${n1.x}%`}
                      y1={`${n1.y}%`}
                      x2={`${n2.x}%`}
                      y2={`${n2.y}%`}
                      stroke={isEdgeActive ? '#AD956C' : 'rgba(201,196,186,0.08)'}
                      strokeWidth={isEdgeActive ? 1.5 : 1}
                      className="transition-all duration-300"
                      strokeDasharray={isEdgeActive ? '6 6' : '4 4'}
                    />
                  );
                })
              )}
            </svg>

            {/* Render Nodes */}
            {NODES.map((node) => {
              const isSelected = activeNode.id === node.id;
              const isConnected = activeNode.connections.includes(node.id);

              return (
                <button
                  key={node.id}
                  onClick={() => setActiveNodeId(node.id)}
                  onMouseEnter={() => setActiveNodeId(node.id)}
                  style={{ left: `${node.x}%`, top: `${node.y}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 p-2.5 rounded-xl border font-mono text-xs transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'bg-[#1B1815] border-[#AD956C] text-[#F7F4EC] scale-105 z-20 shadow-md shadow-[#AD956C]/10'
                      : isConnected
                      ? 'bg-[#151311] border-[#AD956C]/40 text-[#C9C4BA] z-10'
                      : 'bg-[#151311] border-[rgba(201,196,186,0.08)] text-[#8D8982] hover:text-[#C9C4BA] hover:border-[rgba(201,196,186,0.18)]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 whitespace-nowrap">
                    <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-[#AD956C]' : 'bg-[#625F5A]'} transition-all`} />
                    <span className="font-semibold">{node.label}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Node Inspector Tooltip Card (5 Cols) */}
          <div className="lg:col-span-5 p-6 rounded-xl bg-[#100E0D] border border-[rgba(201,196,186,0.08)] text-left flex flex-col justify-between font-mono">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[rgba(201,196,186,0.08)]">
                <div>
                  <span className="text-[10px] text-[#AD956C] uppercase tracking-wider block font-bold">
                    {activeNode.framework}
                  </span>
                  <h3 className="text-base font-bold text-[#F7F4EC] mt-0.5">
                    {activeNode.label}
                  </h3>
                </div>
                <span className="text-[10px] text-[#718A79] bg-[#718A79]/15 px-2.5 py-1 rounded border border-[#718A79]/30 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-[#718A79]" />
                  {activeNode.validation}
                </span>
              </div>

              {/* Node Inspector Details */}
              <div className="space-y-3 text-xs">
                <div>
                  <div className="text-[10px] text-[#8D8982] uppercase tracking-wide">
                    CLAUSE CITATION
                  </div>
                  <div className="text-[#F7F4EC] mt-0.5">{activeNode.clause}</div>
                </div>

                <div>
                  <div className="text-[10px] text-[#8D8982] uppercase tracking-wide">
                    CROSS-FRAMEWORK DEPENDENCY
                  </div>
                  <div className="text-[#C9C4BA] mt-0.5 flex items-center gap-1.5">
                    <Link2 className="w-3 h-3 text-[#AD956C]" />
                    {activeNode.dependency}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-[#8D8982] uppercase tracking-wide">
                    DETERMINISTIC EVALUATION RULE
                  </div>
                  <pre className="text-[11px] text-[#F1EEE7] bg-[#151311] p-2.5 rounded-lg border border-[rgba(201,196,186,0.08)] mt-1 overflow-x-auto">
                    <code>{activeNode.rule}</code>
                    <span className="landing-cursor" aria-hidden="true" />
                  </pre>
                </div>
              </div>
            </div>

            {/* Bottom Status */}
            <div className="mt-5 pt-3 border-t border-[rgba(201,196,186,0.08)] flex items-center justify-between text-[11px] text-[#8D8982]">
              <span>ACTIVE CONNECTIONS: {activeNode.connections.length}</span>
              <span className="text-[#718A79] font-semibold">ZERO DRIFT</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
