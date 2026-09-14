'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { NavAuth } from './nav-auth';
import { UploadCloud, Menu, X, ShieldAlert } from 'lucide-react';
import { Show, SignInButton, useUser } from '@clerk/nextjs';

export function TopNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useUser();

  const userEmails = user?.emailAddresses?.map(e => e.emailAddress.toLowerCase()) || [];
  const primaryEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase() || '';
  const isSuperAdmin = primaryEmail === 'rcraghul12@gmail.com' || userEmails.includes('rcraghul12@gmail.com');

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-[#0a0a0c]/80 backdrop-blur-md">
      <div className="w-full max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8 flex h-16 items-center justify-between">
        
        {/* Left: Logo/Wordmark */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="relative w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center p-0.5 bg-zinc-900/90 border border-zinc-800 group-hover:border-blue-500/50 transition-colors shadow-sm shadow-blue-500/10 shrink-0">
              <Image 
                src="/logo-icon.png" 
                alt="Regulation Compiler Logo" 
                width={32} 
                height={32}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-white group-hover:text-blue-400 transition-colors leading-tight">
                RegCompiler
              </span>
              <span className="text-[10px] text-zinc-500 font-medium tracking-wide uppercase leading-none hidden sm:inline-block">
                Regulation as Code
              </span>
            </div>
          </Link>
          
          {/* Desktop Nav Links */}
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
              {isSuperAdmin && (
                <Link 
                  href="/admin" 
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 hover:text-amber-300 hover:bg-amber-500/25 text-xs font-semibold tracking-wide transition-all shadow-sm shadow-amber-500/20"
                  title="Super-Admin Control Panel"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </Link>
              )}
              <Link href="/regulations/new" className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-md transition-colors ml-2">
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

        {/* Right: Actions & Mobile Toggle */}
        <div className="flex items-center gap-3">
          <NavAuth />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-800 bg-[#0a0a0c] px-4 py-4 space-y-3">
          <Show when="signed-in">
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-zinc-300 hover:text-white text-sm font-medium"
            >
              Dashboard
            </Link>
            <Link
              href="/regulations"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-zinc-300 hover:text-white text-sm font-medium"
            >
              Regulations
            </Link>
            <Link
              href="/compliance-check"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-zinc-300 hover:text-white text-sm font-medium"
            >
              Compliance
            </Link>
            {isSuperAdmin && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 py-2 text-amber-400 hover:text-amber-300 text-sm font-semibold"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Super-Admin Panel</span>
              </Link>
            )}
            <Link
              href="/regulations/new"
              onClick={() => setMobileMenuOpen(false)}
              className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-md w-full justify-center mt-2"
            >
              <UploadCloud className="w-4 h-4" />
              Upload Regulation
            </Link>
          </Show>
          <Show when="signed-out">
            <SignInButton mode="modal" fallbackRedirectUrl="/dashboard">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-left py-2 text-zinc-300 hover:text-white text-sm font-medium cursor-pointer"
              >
                Dashboard
              </button>
            </SignInButton>
            <SignInButton mode="modal" fallbackRedirectUrl="/regulations">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-left py-2 text-zinc-300 hover:text-white text-sm font-medium cursor-pointer"
              >
                Regulations
              </button>
            </SignInButton>
            <SignInButton mode="modal" fallbackRedirectUrl="/compliance-check">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-left py-2 text-zinc-300 hover:text-white text-sm font-medium cursor-pointer"
              >
                Compliance
              </button>
            </SignInButton>
            <SignInButton mode="modal" fallbackRedirectUrl="/regulations/new">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-md w-full justify-center mt-2 cursor-pointer"
              >
                <UploadCloud className="w-4 h-4" />
                Upload Regulation
              </button>
            </SignInButton>
          </Show>
        </div>
      )}
    </header>
  );
}
