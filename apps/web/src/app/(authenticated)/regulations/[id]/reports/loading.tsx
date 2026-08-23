import { Skeleton } from '@/components/ui/skeleton';

export default function ReportsLoading() {
  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto animate-pulse">
      <div className="mb-4">
        <Skeleton className="h-4 w-32 bg-zinc-800" />
      </div>
      
      <div className="flex justify-between items-end mb-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 bg-zinc-800" />
          <Skeleton className="h-4 w-96 bg-zinc-800" />
        </div>
        <Skeleton className="h-10 w-40 bg-zinc-800 rounded-lg" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-48 w-full bg-zinc-800 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
