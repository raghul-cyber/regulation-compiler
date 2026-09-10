'use client';

import { useState } from 'react';
import Link from 'next/link';
import { NavAuth } from './nav-auth';
import { UploadCloud, Menu, X } from 'lucide-react';
import { Show, SignInButton } from '@clerk/nextjs';

export function TopNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-[#0a0a0c]/80 backdrop-blur-md">
      <div className="w-full max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8 flex h-16 items-center justify-between">
        
        {/* Left: Logo/Wordmark */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold tracking-tight text-white">RegCompiler</span>
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
