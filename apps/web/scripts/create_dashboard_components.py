import os

files = {
    "src/components/dashboard/summary-metrics.tsx": """'use client';

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
""",

    "src/components/dashboard/severity-chart.tsx": """'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export function SeverityChart({ distribution }: { distribution: Record<string, number> | undefined }) {
  const dist = distribution || {};
  const data = [
    { name: 'Critical', value: dist['critical'] || 0, color: '#ef4444' },
    { name: 'High', value: dist['high'] || 0, color: '#f97316' },
    { name: 'Medium', value: dist['medium'] || 0, color: '#eab308' },
    { name: 'Low', value: dist['low'] || 0, color: '#22c55e' },
  ];

  return (
    <div className="rounded-xl border border-zinc-800 bg-[#0a0a0c] p-6 shadow-md flex flex-col h-[350px]">
      <h3 className="text-zinc-100 font-semibold mb-6">Severity Distribution</h3>
      <div className="flex-1 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip 
              cursor={{ fill: '#27272a', opacity: 0.4 }}
              contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px', color: '#fff' }}
              itemStyle={{ color: '#fff' }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
""",

    "src/components/dashboard/activity-feed.tsx": """'use client';

export function ActivityFeed({ activities }: { activities: any[] }) {
  if (!activities || activities.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-[#0a0a0c] p-6 shadow-md h-[350px] flex flex-col items-center justify-center text-center">
        <h3 className="text-zinc-100 font-semibold mb-2">Recent Activity</h3>
        <p className="text-zinc-500 text-sm">No recent activity found for this regulation.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-[#0a0a0c] p-6 shadow-md h-[350px] flex flex-col">
      <h3 className="text-zinc-100 font-semibold mb-6 flex-none">Recent Activity</h3>
      <div className="flex-1 overflow-y-auto pr-2 space-y-6">
        {activities.map((log: any) => (
          <div key={log.id} className="relative pl-6 before:absolute before:left-[11px] before:top-2 before:h-full before:w-[2px] before:bg-zinc-800 last:before:hidden">
            <div className="absolute left-0 top-1.5 h-6 w-6 rounded-full border-2 border-[#0a0a0c] bg-zinc-700"></div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-zinc-200">
                {log.action.replace(/_/g, ' ')}
              </span>
              <span className="text-xs text-zinc-500 mt-0.5">
                by {log.actor_email} • {new Date(log.timestamp).toLocaleString()}
              </span>
            </div>
          </div>
        ))}
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

