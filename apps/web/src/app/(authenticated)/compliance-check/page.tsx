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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-[10px] bg-[#080A0E] border border-white/[0.08] shadow-md relative overflow-hidden">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 rounded-[4px] font-mono text-[10px] tracking-wider uppercase bg-[#4D8FCC]/15 text-[#79B5EC] border border-[#4D8FCC]/30 font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4D8FCC]" />
              Runtime AST Engine
            </span>
            <span className="px-2 py-0.5 rounded-[4px] font-mono text-[10px] tracking-wider uppercase bg-[#0B0E14] text-[#CBD5E1] border border-white/[0.06] font-medium">
              Deterministic Statutory Eval
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F4F6F8] flex items-center gap-3">
            <span>Compliance Simulator</span>
          </h1>
          <p className="mt-1 text-xs text-[#9CA3AF] max-w-xl">
            Execute deterministic statutory logic against synthetic or production payloads. Direct AST rule-binding with zero latency.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="px-3.5 py-2 rounded-[6px] bg-[#050608] border border-white/[0.06] flex flex-col items-end font-mono">
            <span className="text-[10px] text-[#64748B] uppercase tracking-wider">Available Policies</span>
            <span className="text-sm font-bold text-[#4D8FCC]">{regulations.length} Compiled</span>
          </div>
        </div>
      </div>

      <div>
        <ComplianceTester regulations={regulations} />
      </div>
    </div>
  );
}
