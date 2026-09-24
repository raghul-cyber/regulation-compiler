import { getRegulations } from '@/lib/api';
import { ComplianceTester } from '@/components/compliance/tester';

export const metadata = {
  title: 'Compliance Simulator | RegCompiler',
  description: 'Simulate, validate, and verify system compliance against compiled statutory rules.',
};

export default async function ComplianceCheckPage() {
  const regulations = await getRegulations().catch(() => []);

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      {/* Statutory Intelligence HUD Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#0A121E]/90 via-[#060A10]/95 to-[#0A121E]/90 border border-[#162A3B] backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.6)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-32 bg-radial from-[#00F0FF]/10 via-transparent to-transparent pointer-events-none" />
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 rounded font-mono text-[10px] tracking-wider uppercase bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30 font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(0,240,255,0.2)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] animate-pulse" />
              Runtime AST Engine
            </span>
            <span className="px-2 py-0.5 rounded font-mono text-[10px] tracking-wider uppercase bg-[#7928CA]/15 text-[#D498FF] border border-[#7928CA]/30 font-medium">
              Deterministic Statutory Eval
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <span>Compliance Simulator</span>
          </h1>
          <p className="mt-1 text-xs text-zinc-400 max-w-xl">
            Execute deterministic statutory logic against synthetic or production payloads. Direct AST rule-binding with zero latency.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="px-3.5 py-2 rounded-xl bg-[#03060A]/80 border border-[#162A3B] flex flex-col items-end font-mono">
            <span className="text-[10px] text-zinc-500 uppercase">Available Policies</span>
            <span className="text-sm font-bold text-[#00F0FF]">{regulations.length} Compiled</span>
          </div>
        </div>
      </div>

      <div>
        <ComplianceTester regulations={regulations} />
      </div>
    </div>
  );
}
