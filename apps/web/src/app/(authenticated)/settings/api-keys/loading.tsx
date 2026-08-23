import { Skeleton } from '@/components/ui/skeleton';

export default function ApiKeysLoading() {
  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto animate-pulse">
      <div className="flex justify-between items-end mb-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 bg-zinc-800" />
          <Skeleton className="h-4 w-96 bg-zinc-800" />
        </div>
        <Skeleton className="h-10 w-40 bg-zinc-800 rounded-lg" />
      </div>

      <Skeleton className="h-64 w-full bg-zinc-800 rounded-xl" />
    </div>
  );
}
