'use client';

import Link from 'next/link';
import { useAuth, UserButton, SignInButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export function NavAuth({ showDashboardButton = false }: { showDashboardButton?: boolean }) {
  const { isLoaded, userId } = useAuth();

  // EXPLICIT LOADING STATE (Bug Fix: prevents layout shift/flash)
  if (!isLoaded) {
    return (
      <div className="flex items-center gap-3">
        {showDashboardButton && <Skeleton className="h-9 w-28 rounded-full" />}
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {userId ? (
        <UserButton />
      ) : (
        <SignInButton mode="modal">
          <Button size="sm" variant="secondary">Sign In</Button>
        </SignInButton>
      )}
      
      {/* Global persistent CTA */}
      {userId ? (
        showDashboardButton && (
          <Link href="/dashboard">
            <Button size="sm" className="bg-white text-black hover:bg-gray-200 rounded-full font-medium">
              Dashboard
            </Button>
          </Link>
        )
      ) : (
        <SignInButton mode="modal" fallbackRedirectUrl="/dashboard">
          <Button size="sm" className="bg-white text-black hover:bg-gray-200 rounded-full font-medium cursor-pointer">
            Launch Compiler
          </Button>
        </SignInButton>
      )}
    </div>
  );
}
