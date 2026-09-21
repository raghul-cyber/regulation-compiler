import { getRegulations } from '@/lib/api';
import { ComplianceTester } from '@/components/compliance/tester';

export const metadata = {
  title: 'Compliance Simulator | RegCompiler',
  description: 'Simulate, validate, and verify system compliance against compiled statutory rules.',
};

export default async function ComplianceCheckPage() {
  const regulations = await getRegulations().catch(() => []);

  return (
    <div className="flex flex-col gap-6 w-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Compliance Simulator</h1>
        <p className="mt-1 text-zinc-500">
          Test a system configuration payload against live regulatory policies.
        </p>
      </div>

      <div className="mt-4">
        <ComplianceTester regulations={regulations} />
      </div>
    </div>
  );
}
