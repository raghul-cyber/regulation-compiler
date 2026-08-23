import { Skeleton } from '@/components/ui/skeleton';

export default function DiffLoading() {
  return (
    <div className="flex flex-col gap-6 w-full animate-pulse h-[700px]">
      <div className="flex justify-between items-end border-b border-zinc-800 pb-6 mb-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-[400px] bg-zinc-800" />
          <Skeleton className="h-4 w-[250px] bg-zinc-800" />
        </div>
        <Skeleton className="h-8 w-[300px] bg-zinc-800 rounded-lg" />
      </div>
      
      <div className="flex-1 flex gap-6">
        <div className="w-1/3 space-y-4">
          <Skeleton className="h-full w-full bg-zinc-800 rounded-xl" />
        </div>
        <div className="w-2/3 space-y-4">
          <Skeleton className="h-full w-full bg-zinc-800 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
