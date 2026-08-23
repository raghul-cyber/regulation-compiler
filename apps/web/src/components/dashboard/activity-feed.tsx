'use client';

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
