'use client';

import React, { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Critical Global Error:', error);
  }, [error]);

  return (
    <html>
      <body className="bg-slate-950 text-white min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-4 p-8 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-md">
          <div className="w-12 h-12 mx-auto rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 font-bold text-xl">
            !
          </div>
          <h2 className="text-xl font-bold">Critical Application Error</h2>
          <p className="text-sm text-slate-400">
            A critical server or client exception occurred. We have safely intercepted it to protect your session.
          </p>
          <button
            onClick={() => reset()}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all"
          >
            Reload Application
          </button>
        </div>
      </body>
    </html>
  );
}
