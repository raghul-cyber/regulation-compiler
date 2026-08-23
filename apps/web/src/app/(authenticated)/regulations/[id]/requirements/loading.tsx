import { Skeleton } from '@/components/ui/skeleton';

export default function RequirementsLoading() {
  return (
    <div className="flex flex-col gap-6 w-full animate-pulse">
      <div className="flex justify-between items-center mb-4">
        <Skeleton className="h-8 w-[300px] bg-zinc-800" />
      </div>
      
      <Skeleton className="h-16 w-full bg-zinc-800 rounded-xl mb-6" />
      
      <div className="flex flex-col gap-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-48 w-full bg-zinc-800 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
