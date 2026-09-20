'use client';

import Link from 'next/link';
import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';

export default function BillingCancelPage() {
  return (
    <div className="w-full max-w-lg mx-auto py-16 px-4 text-center">
      <div className="p-8 sm:p-10 rounded-3xl bg-[#0B131D] border border-[#1E2C38] shadow-2xl relative overflow-hidden text-white">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-6">
          <AlertCircle className="w-8 h-8" />
        </div>

        <h2 className="text-2xl font-bold tracking-tight text-white">
          Checkout Cancelled
        </h2>

        <p className="mt-3 text-sm text-zinc-400 leading-relaxed max-w-sm mx-auto">
          No payment was completed. You can continue using your remaining free compilations or upgrade whenever you are ready.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto py-3 px-6 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors border border-zinc-700"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </Link>

          <Link
            href="/billing"
            className="w-full sm:w-auto py-3 px-6 rounded-xl bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 border border-blue-500/30 font-semibold text-xs transition-colors"
          >
            View Billing Plans
          </Link>
        </div>
      </div>
    </div>
  );
}
