'use client';

import Link from 'next/link';
import { useAuth, UserButton, SignInButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export function NavAuth() {
  const { isLoaded, userId } = useAuth();

  // EXPLICIT LOADING STATE (Bug Fix: prevents layout shift/flash)
  if (!isLoaded) {
    return (
      <div className="flex items-center gap-4">
        {/* Skeleton for "Launch Compiler" / "Dashboard" CTA */}
        <Skeleton className="h-9 w-32 rounded-full" />
        {/* Skeleton for UserButton / SignInButton */}
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      {userId ? (
        <UserButton />
      ) : (
        <SignInButton mode="modal">
          <Button size="sm" variant="secondary">Sign In</Button>
        </SignInButton>
      )}
      
      {/* Global persistent CTA */}
      <Link href="/dashboard">
        <Button size="sm" className="bg-white text-black hover:bg-gray-200 rounded-full font-medium">
          {userId ? "Dashboard" : "Launch Compiler"}
        </Button>
      </Link>
    </div>
  );
}
