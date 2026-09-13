'use client';

import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { ShieldAlert, Lock, ArrowLeft, RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdminOverview } from '@/components/admin/admin-overview';

const SUPER_ADMIN_EMAIL = 'rcraghul12@gmail.com';

export default function AdminPage() {
  const { user, isLoaded, isSignedIn } = useUser();

  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-zinc-400">
        <RefreshCw className="w-8 h-8 animate-spin text-amber-400 mb-4" />
        <h3 className="text-base font-bold text-white tracking-tight">Verifying Administrative Clearance...</h3>
        <p className="text-xs text-zinc-500 mt-1">Checking cryptographic session signature against administrative registry</p>
      </div>
    );
  }

  // Extract user email
  const userEmails = user?.emailAddresses?.map(e => e.emailAddress.toLowerCase()) || [];
  const primaryEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase() || (userEmails[0] || '');

  const isSuperAdmin = primaryEmail === SUPER_ADMIN_EMAIL.toLowerCase() || userEmails.includes(SUPER_ADMIN_EMAIL.toLowerCase());

  // If not super-admin, display strict security-grade 403 Access Denied
  if (!isSignedIn || !isSuperAdmin) {
    return (
      <div className="w-full max-w-2xl mx-auto my-16 p-8 rounded-2xl bg-zinc-950 border border-rose-500/40 shadow-[0_0_50px_rgba(244,63,94,0.15)] text-center relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto mb-6 shadow-lg shadow-rose-950">
          <Lock className="w-8 h-8" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono font-bold uppercase tracking-wider mb-4">
          <AlertTriangle className="w-3.5 h-3.5" />
          HTTP 403 Forbidden
        </div>

        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
          Super-Admin Clearance Required
        </h1>

        <p className="mt-3 text-sm text-zinc-400 leading-relaxed max-w-lg mx-auto">
          This control panel provides root supervisory governance over user authentication directories, system telemetry, and audit ledgers. Access is strictly restricted to designated personnel:
        </p>

        <div className="mt-4 p-3 rounded-xl bg-zinc-900 border border-zinc-800 inline-block font-mono text-xs text-amber-300">
          Authorized Super-Admin: <span className="font-bold text-white">{SUPER_ADMIN_EMAIL}</span>
        </div>

        <div className="mt-3 text-xs text-zinc-500">
          Your active authenticated identity: <span className="font-mono text-zinc-300 font-semibold">{primaryEmail || 'Anonymous'}</span>
        </div>

        <div className="mt-8 pt-6 border-t border-zinc-800/80 flex justify-center gap-4">
          <Link href="/dashboard">
            <Button className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
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
