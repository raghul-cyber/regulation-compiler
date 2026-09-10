'use client';

import Link from 'next/link';
import { NavAuth } from './nav-auth';
import { UploadCloud } from 'lucide-react';
import { Show, SignInButton } from '@clerk/nextjs';

export function TopNav() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-[#0a0a0c]/80 backdrop-blur-md">
      <div className="w-full max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8 flex h-16 items-center justify-between">
        
        {/* Left: Logo/Wordmark */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold tracking-tight text-white">RegCompiler</span>
          </Link>
          
          {/* Center: Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Show when="signed-in">
              <Link href="/dashboard" className="text-zinc-400 hover:text-white transition-colors">
                Dashboard
              </Link>
              <Link href="/regulations" className="text-zinc-400 hover:text-white transition-colors">
                Regulations
              </Link>
              <Link href="/compliance-check" className="text-zinc-400 hover:text-white transition-colors">
                Compliance
              </Link>
              <Link href="/regulations/new" className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-md transition-colors ml-4">
                <UploadCloud className="w-4 h-4" />
                Upload
              </Link>
            </Show>
            <Show when="signed-out">
              <SignInButton mode="modal" fallbackRedirectUrl="/dashboard">
                <button className="text-zinc-400 hover:text-white transition-colors cursor-pointer">
                  Dashboard
                </button>
              </SignInButton>
              <SignInButton mode="modal" fallbackRedirectUrl="/regulations">
                <button className="text-zinc-400 hover:text-white transition-colors cursor-pointer">
                  Regulations
                </button>
              </SignInButton>
              <SignInButton mode="modal" fallbackRedirectUrl="/compliance-check">
                <button className="text-zinc-400 hover:text-white transition-colors cursor-pointer">
                  Compliance
                </button>
              </SignInButton>
              <SignInButton mode="modal" fallbackRedirectUrl="/regulations/new">
                <button className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-md transition-colors ml-4 cursor-pointer">
                  <UploadCloud className="w-4 h-4" />
                  Upload
                </button>
              </SignInButton>
            </Show>
          </nav>
        </div>

        {/* Right: Actions */}
        <NavAuth />
      </div>
    </header>
  );
}
