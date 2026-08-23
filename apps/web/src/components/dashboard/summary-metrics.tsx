'use client';

import { useEffect, useState } from 'react';

export function SummaryMetrics({ summary }: { summary: any }) {
  const [counts, setCounts] = useState({
    total: 0,
    obligations: 0,
    prohibitions: 0,
    highRisk: 0,
  });

  useEffect(() => {
    let startTime: number;
    const duration = 1000;
    
    const animate = (time: number) => {
      if (!startTime) startTime = time;
      const progress = Math.min((time - startTime) / duration, 1);
      
      setCounts({
        total: Math.floor(progress * (summary?.total_requirements || 0)),
        obligations: Math.floor(progress * (summary?.total_obligations || 0)),
        prohibitions: Math.floor(progress * (summary?.total_prohibitions || 0)),
        highRisk: Math.floor(progress * (summary?.high_risk_controls || 0)),
      });

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [summary]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="rounded-xl border border-zinc-800 bg-[#0a0a0c] p-6 flex flex-col items-center justify-center text-center shadow-md">
        <h3 className="text-zinc-400 text-sm font-medium uppercase tracking-wider mb-2">Total Requirements</h3>
        <p className="text-4xl font-bold text-white">{counts.total}</p>
      </div>
      <div className="rounded-xl border border-zinc-800 bg-[#0a0a0c] p-6 flex flex-col items-center justify-center text-center shadow-md">
        <h3 className="text-zinc-400 text-sm font-medium uppercase tracking-wider mb-2">Obligations</h3>
        <p className="text-4xl font-bold text-white">{counts.obligations}</p>
      </div>
      <div className="rounded-xl border border-zinc-800 bg-[#0a0a0c] p-6 flex flex-col items-center justify-center text-center shadow-md">
        <h3 className="text-zinc-400 text-sm font-medium uppercase tracking-wider mb-2">Prohibitions</h3>
        <p className="text-4xl font-bold text-white">{counts.prohibitions}</p>
      </div>
      <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-6 flex flex-col items-center justify-center text-center shadow-md">
        <h3 className="text-red-400/80 text-sm font-medium uppercase tracking-wider mb-2">High Risk Controls</h3>
        <p className="text-4xl font-bold text-red-500">{counts.highRisk}</p>
      </div>
    </div>
  );
}
