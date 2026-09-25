'use client';

import Link from 'next/link';
import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';

export default function BillingCancelPage() {
  return (
    <div className="w-full max-w-lg mx-auto py-16 px-4 text-center">
      <div className="p-8 sm:p-10 rounded-xl bg-[#100E0D] border border-[#211D19] shadow-2xl relative overflow-hidden text-[#F7F4EC]">
        <div className="w-16 h-16 mx-auto rounded-lg bg-[#A48A5C]/15 border border-[#A48A5C]/30 flex items-center justify-center text-[#A48A5C] mb-6">
          <AlertCircle className="w-8 h-8" />
        </div>

        <h2 className="text-2xl font-semibold tracking-tight text-[#F7F4EC]">
          Checkout Cancelled
        </h2>

        <p className="mt-3 text-sm text-[#8D8982] leading-relaxed max-w-sm mx-auto font-sans">
          No payment was completed. You can continue using your remaining free compilations or upgrade whenever you are ready.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto py-3 px-6 rounded-lg bg-[#151311] hover:bg-[#1B1815] text-[#C9C4BA] hover:text-[#F7F4EC] font-medium text-xs flex items-center justify-center gap-2 transition-colors border border-[#211D19]"
          >
            <ArrowLeft className="w-4 h-4 text-[#AD956C]" />
            <span>Return to Dashboard</span>
          </Link>

          <Link
            href="/billing"
            className="w-full sm:w-auto py-3 px-6 rounded-lg bg-[#344D63]/20 text-[#607D96] hover:bg-[#344D63]/35 border border-[#344D63]/40 font-medium text-xs transition-colors"
          >
            View Billing Plans
          </Link>
        </div>
      </div>
    </div>
  );
}
