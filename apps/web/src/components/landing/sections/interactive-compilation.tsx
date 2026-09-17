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
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#17222C]/70 border border-[#1E2C38] text-[#5CC8FF] text-xs font-mono font-medium uppercase tracking-wider mb-4">
          <Compass className="w-3.5 h-3.5" />
          Live Interactive Field
        </div>
        <h2 className="text-3xl sm:text-5xl font-extrabold text-[#F2F6F8] tracking-tight leading-tight">
          See regulation become structure.
        </h2>
        <p className="mt-4 text-base md:text-lg text-[#9AA9B5] leading-relaxed">
          Hover or select any regulatory node in the compliance field to inspect clause obligations, cross-framework dependencies, and deterministic validation outputs.
        </p>
      </div>

      {/* Main Interactive Field Canvas Container */}
      <div ref={contentRef} className={`landing-reveal ${contentRevealed ? 'revealed' : ''} relative w-full rounded-2xl bg-[#080D13]/90 border border-[#17222C] backdrop-blur-xl p-6 md:p-8 overflow-hidden shadow-2xl`}>
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#17222C08_1px,transparent_1px),linear-gradient(to_bottom,#17222C08_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
          {/* Interactive Topology Graph Area (7 Cols) */}
          <div className="lg:col-span-7 relative h-[380px] rounded-xl bg-[#0C131B]/60 border border-[#17222C] p-4 flex items-center justify-center">
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
                      stroke={isEdgeActive ? '#5CC8FF' : '#17222C'}
                      strokeWidth={isEdgeActive ? 1.5 : 1}
                      className={`transition-all duration-300 ${isEdgeActive ? 'landing-edge-active' : ''}`}
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
                      ? 'bg-[#080D13] border-[#5CC8FF] shadow-[0_0_25px_rgba(92,200,255,0.3)] text-[#F2F6F8] scale-110 z-20'
                      : isConnected
                      ? 'bg-[#0C131B] border-[#2D718F] text-[#5CC8FF] z-10'
                      : 'bg-[#080D13]/70 border-[#17222C] text-[#62717C] hover:text-[#9AA9B5] hover:border-[#1E2C38]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 whitespace-nowrap">
                    <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-[#5CC8FF] shadow-[0_0_8px_rgba(92,200,255,0.6)]' : 'bg-[#2D718F]'} transition-all`} />
                    <span className="font-semibold">{node.label}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Node Inspector Tooltip Card (5 Cols) */}
          <div className="lg:col-span-5 p-6 rounded-xl bg-[#0C131B] border border-[#17222C] text-left flex flex-col justify-between font-mono">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#17222C]">
                <div>
                  <span className="text-[10px] text-[#5CC8FF] uppercase tracking-wider block">
                    {activeNode.framework}
                  </span>
                  <h3 className="text-base font-bold text-[#F2F6F8] mt-0.5">
                    {activeNode.label}
                  </h3>
                </div>
                <span className="text-[10px] text-[#67D6A0] bg-[#67D6A015] px-2.5 py-1 rounded border border-[#67D6A030] font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-[#67D6A0]" />
                  {activeNode.validation}
                </span>
              </div>

              {/* Node Inspector Details */}
              <div className="space-y-3 text-xs">
                <div>
                  <div className="text-[10px] text-[#62717C] uppercase tracking-wide">
                    CLAUSE CITATION
                  </div>
                  <div className="text-[#F2F6F8] mt-0.5">{activeNode.clause}</div>
                </div>

                <div>
                  <div className="text-[10px] text-[#62717C] uppercase tracking-wide">
                    CROSS-FRAMEWORK DEPENDENCY
                  </div>
                  <div className="text-[#5CC8FF] mt-0.5 flex items-center gap-1.5">
                    <Link2 className="w-3 h-3" />
                    {activeNode.dependency}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-[#62717C] uppercase tracking-wide">
                    DETERMINISTIC EVALUATION RULE
                  </div>
                  <pre className="text-[11px] text-[#9AA9B5] bg-[#080D13] p-2.5 rounded-lg border border-[#17222C] mt-1 overflow-x-auto">
                    <code>{activeNode.rule}</code>
                    <span className="landing-cursor" aria-hidden="true" />
                  </pre>
                </div>
              </div>
            </div>

            {/* Bottom Status */}
            <div className="mt-5 pt-3 border-t border-[#17222C] flex items-center justify-between text-[11px] text-[#62717C]">
              <span>ACTIVE CONNECTIONS: {activeNode.connections.length}</span>
              <span className="text-[#5CC8FF]">ZERO DRIFT</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
