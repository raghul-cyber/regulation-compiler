'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { getBillingStatusAction } from '@/app/actions';
import { PaywallModal } from './paywall-modal';

interface BillingStatus {
  authenticated: boolean;
  is_admin: boolean;
  plan: string;
  status: string;
  paid_access: boolean;
  free_usage: {
    limit: number;
    used: number;
    remaining: number;
  };
  paid_credits: number;
}

export function EntitlementGuard() {
  const { isSignedIn, isLoaded, user } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [billingStatus, setBillingStatus] = useState<BillingStatus | null>(null);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);

  // Check if limit query parameter is present in URL
  const limitQueryParam = searchParams?.get('limit_reached') === '1' || searchParams?.get('paywall') === '1';

  const checkEntitlement = useCallback(async () => {
    if (!isSignedIn) {
      setBillingStatus(null);
      setIsPaywallOpen(false);
      return;
    }

    try {
      const res = await getBillingStatusAction();
      if (res.success && res.data) {
        setBillingStatus(res.data);

        const isExhausted = (
          !res.data.is_admin &&
          !res.data.paid_access &&
          res.data.free_usage?.used >= res.data.free_usage?.limit
        );

        if (isExhausted) {
          // If on an internal product route, redirect to landing page
          const isLanding = pathname === '/';
          const isBilling = pathname === '/billing';

          if (!isLanding && !isBilling) {
            router.replace('/?limit_reached=1');
          } else if (isLanding) {
            setIsPaywallOpen(true);
          }
        } else {
          setIsPaywallOpen(false);
        }
      }
    } catch (err) {
      console.warn('Entitlement check failure:', err);
    }
  }, [isSignedIn, pathname, router]);

  useEffect(() => {
    if (isLoaded) {
      checkEntitlement();
    }
  }, [isLoaded, isSignedIn, pathname, checkEntitlement]);

  // Periodic polling every 30 seconds to keep live background state in sync
  useEffect(() => {
    if (!isSignedIn) return;
    const interval = setInterval(checkEntitlement, 30000);
    return () => clearInterval(interval);
  }, [isSignedIn, checkEntitlement]);

  // If query param ?limit_reached=1 is present on landing page
  useEffect(() => {
    if (limitQueryParam && pathname === '/') {
      setIsPaywallOpen(true);
    }
  }, [limitQueryParam, pathname]);

  const isExhausted = Boolean(
    billingStatus &&
    !billingStatus.is_admin &&
    !billingStatus.paid_access &&
    billingStatus.free_usage?.used >= billingStatus.free_usage?.limit
  );

  const shouldBlock = isExhausted && (pathname === '/' || limitQueryParam);

  if (!shouldBlock && !isPaywallOpen) {
    return null;
  }

  return (
    <PaywallModal
      isOpen={isPaywallOpen || shouldBlock}
      onClose={() => {
        if (!isExhausted) {
          setIsPaywallOpen(false);
        }
      }}
      freeUsesUsed={billingStatus?.free_usage?.used ?? 3}
      freeUsesLimit={billingStatus?.free_usage?.limit ?? 3}
      isBlocking={isExhausted}
      reason="You have used all 3 complimentary free actions across Regulation Compiler. To continue running compliance checks, compiling statutory regulations, and deploying audits, please upgrade to the Pro plan."
    />
  );
}
