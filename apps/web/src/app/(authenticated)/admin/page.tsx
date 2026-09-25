'use client';

import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { ShieldAlert, Lock, ArrowLeft, RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdminOverview } from '@/components/admin/admin-overview';

const SUPER_ADMIN_EMAIL = 'rcraghul12@gmail.com';
const SUPER_ADMIN_CLERK_ID = 'user_3HpP6350OcHxY6bu77tdXEtihSE';

export default function AdminPage() {
  const { user, isLoaded, isSignedIn } = useUser();

  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-[#8D8982]">
        <RefreshCw className="w-8 h-8 animate-spin text-[#AD956C] mb-4" />
        <h3 className="text-base font-semibold text-[#F7F4EC] tracking-tight">Verifying Administrative Clearance...</h3>
        <p className="text-xs text-[#625F5A] mt-1 font-sans">Checking cryptographic session signature against administrative registry</p>
      </div>
    );
  }

  // Extract user email and Clerk user ID
  const userEmails = (user?.emailAddresses || []).map(e => e?.emailAddress?.toLowerCase()).filter(Boolean) as string[];
  const primaryEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase() || (userEmails[0] || '');

  const isSuperAdmin = 
    primaryEmail === SUPER_ADMIN_EMAIL.toLowerCase() || 
    Boolean(userEmails.includes(SUPER_ADMIN_EMAIL.toLowerCase())) ||
    user?.id === SUPER_ADMIN_CLERK_ID;

  // If not super-admin, display strict security-grade 403 Access Denied
  if (!isSignedIn || !isSuperAdmin) {
    return (
      <div className="w-full max-w-2xl mx-auto my-16 p-8 rounded-xl bg-[#100E0D] border border-[#9A5D62]/40 text-center relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-[#9A5D62]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-[#AD956C]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="w-16 h-16 rounded-lg bg-[#9A5D62]/15 border border-[#9A5D62]/30 flex items-center justify-center text-[#9A5D62] mx-auto mb-6">
          <Lock className="w-8 h-8" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#9A5D62]/10 border border-[#9A5D62]/30 text-[#9A5D62] text-xs font-mono font-medium uppercase tracking-wider mb-4">
          <AlertTriangle className="w-3.5 h-3.5" />
          HTTP 403 Forbidden
        </div>

        <h1 className="text-2xl md:text-3xl font-semibold text-[#F7F4EC] tracking-tight">
          Super-Admin Clearance Required
        </h1>

        <p className="mt-3 text-sm text-[#8D8982] leading-relaxed max-w-lg mx-auto font-sans">
          This control panel provides root supervisory governance over user authentication directories, system telemetry, and audit ledgers. Access is strictly restricted to designated personnel:
        </p>

        <div className="mt-4 p-3 rounded-lg bg-[#0B0A09] border border-[#211D19] inline-block font-mono text-xs text-[#AD956C]">
          Authorized Super-Admin: <span className="font-semibold text-[#F7F4EC]">{SUPER_ADMIN_EMAIL}</span>
        </div>

        <div className="mt-3 text-xs text-[#625F5A]">
          Your active authenticated identity: <span className="font-mono text-[#C9C4BA] font-medium">{primaryEmail || 'Anonymous'}</span>
        </div>

        <div className="mt-8 pt-6 border-t border-[#211D19] flex justify-center gap-4">
          <Link href="/dashboard">
            <Button className="bg-[#151311] hover:bg-[#1B1815] text-[#C9C4BA] hover:text-[#F7F4EC] border border-[#211D19] rounded-lg flex items-center gap-2 font-mono text-xs cursor-pointer">
              <ArrowLeft className="w-4 h-4 text-[#AD956C]" />
              <span>Return to Compliance Hub</span>
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Super-admin verified: render full live overview
  return <AdminOverview />;
}
