'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { NavAuth } from './nav-auth';
import { UploadCloud, Menu, X, ShieldAlert, ArrowRight } from 'lucide-react';
import { Show, SignInButton, useUser, UserButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { UsageIndicator } from '@/components/billing/usage-indicator';

export function TopNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const { user } = useUser();

  const userEmails = (user?.emailAddresses || []).map((e) => e?.emailAddress?.toLowerCase()).filter(Boolean) as string[];
  const primaryEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase() || '';
  const isSuperAdmin = primaryEmail === 'rcraghul12@gmail.com' || Boolean(userEmails?.includes('rcraghul12@gmail.com'));

  const isLanding = pathname === '/';

  useEffect(() => {
    if (!isLanding) return;
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isLanding]);

  // =========================================================================
  // 1. ULTRA-PREMIUM FLOATING NAVIGATION (Landing Page Only)
  // =========================================================================
  if (isLanding) {
    return (
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-4 sm:px-6 lg:px-8 pt-4 pb-2 pointer-events-none`}
      >
        <div
          className={`max-w-7xl mx-auto flex items-center justify-between px-5 py-2.5 rounded-2xl transition-all duration-300 pointer-events-auto ${
            isScrolled
              ? 'bg-[#080D13]/95 backdrop-blur-2xl border border-[#17222C] shadow-[0_8px_32px_rgba(0,0,0,0.6)]'
              : 'bg-[#080D13]/80 backdrop-blur-xl border border-[#17222C]/70 shadow-[0_4px_24px_rgba(0,0,0,0.35)]'
          }`}
        >
          {/* Brand Wordmark & Tactical Monogram */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-[#0E151D] border border-[#22313E] flex items-center justify-center p-1.5 shadow-inner transition-transform group-hover:scale-105">
              <Image
                src="/icon.png"
                alt="RegCompiler Monogram"
                width={20}
                height={20}
                className="w-5 h-5 object-contain"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="font-serif font-bold text-sm tracking-tight text-[#F2F6F8]">
                RegCompiler
              </span>
              <span className="font-mono text-[9px] tracking-widest text-[#9AA9B5] uppercase">
                REGULATION AS CODE
              </span>
            </div>
          </Link>

          {/* Center: Tactical Editorial Links */}
          <nav className="hidden lg:flex items-center gap-7 font-mono text-xs text-[#9AA9B5]">
            <a href="#product" className="hover:text-[#F2F6F8] transition-colors">
              Product
            </a>
            <a href="#problem" className="hover:text-[#F2F6F8] transition-colors">
              The Problem
            </a>
            <a href="#how-it-works" className="hover:text-[#F2F6F8] transition-colors">
              How It Works
            </a>
            <a href="#architecture" className="hover:text-[#F2F6F8] transition-colors">
              Architecture
            </a>
            <a href="#security" className="hover:text-[#F2F6F8] transition-colors">
              Security
            </a>
            <a href="#use-cases" className="hover:text-[#F2F6F8] transition-colors">
              Use Cases
            </a>
          </nav>

          {/* Right: Auth CTA Buttons */}
          <div className="flex items-center gap-3">
            <Show when="signed-in">
              <UsageIndicator />
              <Link href="/dashboard">
                <Button
                  size="sm"
                  className="bg-[#5CC8FF] hover:bg-[#4bb3e6] text-[#05070A] rounded-xl font-semibold shadow-[0_0_20px_rgba(92,200,255,0.25)] transition-all px-4 h-9 flex items-center gap-1.5 cursor-pointer text-xs"
                >
                  <span>Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
              <UserButton />
            </Show>

            <Show when="signed-out">
              <SignInButton mode="modal" fallbackRedirectUrl="/dashboard" signUpFallbackRedirectUrl="/dashboard">
                <button className="text-xs font-mono text-[#9AA9B5] hover:text-[#F2F6F8] px-3 py-1.5 transition-colors cursor-pointer hidden sm:inline-block">
                  Sign In
                </button>
              </SignInButton>
              <SignInButton mode="modal" fallbackRedirectUrl="/dashboard" signUpFallbackRedirectUrl="/dashboard">
                <Button
                  size="sm"
                  className="bg-[#5CC8FF] hover:bg-[#4bb3e6] text-[#05070A] rounded-xl font-semibold shadow-[0_0_20px_rgba(92,200,255,0.25)] transition-all px-4 h-9 flex items-center gap-1.5 cursor-pointer text-xs"
                >
                  <span>Start Compiling</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </SignInButton>
            </Show>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-[#9AA9B5] hover:text-[#F2F6F8] rounded-lg hover:bg-[#17222C] transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay for Landing */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-2 max-w-6xl mx-auto rounded-2xl border border-[#17222C] bg-[#080D13]/95 backdrop-blur-xl p-4 space-y-3 pointer-events-auto font-mono text-xs shadow-2xl">
            <a
              href="#product"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-[#9AA9B5] hover:text-[#F2F6F8]"
            >
              Product
            </a>
            <a
              href="#problem"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-[#9AA9B5] hover:text-[#F2F6F8]"
            >
              The Problem
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-[#9AA9B5] hover:text-[#F2F6F8]"
            >
              How It Works
            </a>
            <a
              href="#architecture"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-[#9AA9B5] hover:text-[#F2F6F8]"
            >
              Architecture
            </a>
            <a
              href="#security"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-[#9AA9B5] hover:text-[#F2F6F8]"
            >
              Security
            </a>
            <a
              href="#use-cases"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-[#9AA9B5] hover:text-[#F2F6F8]"
            >
              Use Cases
            </a>

            <div className="pt-2 border-t border-[#17222C] flex flex-col gap-2">
              <Show when="signed-in">
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 text-center rounded-xl bg-[#5CC8FF] text-[#05070A] font-semibold"
                >
                  Open Dashboard
                </Link>
              </Show>
              <Show when="signed-out">
                <SignInButton mode="modal" fallbackRedirectUrl="/dashboard" signUpFallbackRedirectUrl="/dashboard">
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-2 text-center rounded-xl bg-[#5CC8FF] text-[#05070A] font-semibold"
                  >
                    Start Compiling
                  </button>
                </SignInButton>
              </Show>
            </div>
          </div>
        )}
      </header>
    );
  }

  // =========================================================================
  // 2. STANDARD APPLICATION NAVIGATION (Dashboard, Regulations, Admin, etc.)
  // =========================================================================
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#080D14]/85 backdrop-blur-2xl shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
      <div className="w-full max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8 flex h-16 items-center justify-between">
        {/* Left: Logo/Wordmark & Telemetry */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="relative w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center p-1 bg-[#0E1520] border border-white/[0.12] group-hover:border-[#00F0FF]/50 transition-all shadow-[0_0_15px_rgba(0,240,255,0.1)] shrink-0">
              <Image
                src="/logo-icon.png"
                alt="RegCompiler Logo"
                width={28}
                height={28}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-white group-hover:text-[#00F0FF] transition-colors leading-tight">
                RegCompiler
              </span>
              <span className="text-[9px] text-[#9AA9B5] font-mono font-medium tracking-widest uppercase leading-none hidden sm:inline-block">
                STATUTORY COMPILER
              </span>
            </div>
          </Link>

          {/* Live Surveillance Status Telemetry */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-mono text-[10px] tracking-wider font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>SURVEILLANCE: ACTIVE • 10 AUTHORITIES</span>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1.5 text-xs font-mono">
            <Show when="signed-in">
              <Link 
                href="/dashboard" 
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  pathname.startsWith('/dashboard')
                    ? 'text-[#00F0FF] bg-[#00F0FF]/10 border border-[#00F0FF]/30 font-semibold shadow-[0_0_12px_rgba(0,240,255,0.15)]'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                Dashboard
              </Link>
              <Link 
                href="/regulations" 
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  pathname.startsWith('/regulations') && !pathname.includes('/new')
                    ? 'text-[#00F0FF] bg-[#00F0FF]/10 border border-[#00F0FF]/30 font-semibold shadow-[0_0_12px_rgba(0,240,255,0.15)]'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                Regulations
              </Link>
              <Link 
                href="/compliance-check" 
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  pathname.startsWith('/compliance-check')
                    ? 'text-[#00F0FF] bg-[#00F0FF]/10 border border-[#00F0FF]/30 font-semibold shadow-[0_0_12px_rgba(0,240,255,0.15)]'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                Simulator
              </Link>
              <Link 
                href="/billing" 
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  pathname.startsWith('/billing')
                    ? 'text-[#00F0FF] bg-[#00F0FF]/10 border border-[#00F0FF]/30 font-semibold shadow-[0_0_12px_rgba(0,240,255,0.15)]'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                Entitlements
              </Link>
              {isSuperAdmin && (
                <Link
                  href="/admin"
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide transition-all ${
                    pathname.startsWith('/admin')
                      ? 'bg-amber-500/25 border border-amber-500/50 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                      : 'bg-amber-500/15 border border-amber-500/30 text-amber-400 hover:text-amber-300 hover:bg-amber-500/25'
                  }`}
                  title="Super-Admin Control Panel"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </Link>
              )}
              <Link
                href="/regulations/new"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#00F0FF]/15 to-[#3B82F6]/15 hover:from-[#00F0FF]/25 hover:to-[#3B82F6]/25 border border-[#00F0FF]/35 text-[#00F0FF] text-xs font-semibold rounded-lg shadow-[0_0_15px_rgba(0,240,255,0.15)] transition-all ml-2"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload</span>
              </Link>
            </Show>
            <Show when="signed-out">
              <SignInButton mode="modal" fallbackRedirectUrl="/dashboard" signUpFallbackRedirectUrl="/dashboard">
                <button className="px-3 py-1.5 text-zinc-400 hover:text-white transition-colors cursor-pointer rounded-lg hover:bg-white/[0.05]">
                  Dashboard
                </button>
              </SignInButton>
              <SignInButton mode="modal" fallbackRedirectUrl="/regulations" signUpFallbackRedirectUrl="/regulations">
                <button className="px-3 py-1.5 text-zinc-400 hover:text-white transition-colors cursor-pointer rounded-lg hover:bg-white/[0.05]">
                  Regulations
                </button>
              </SignInButton>
              <SignInButton mode="modal" fallbackRedirectUrl="/compliance-check" signUpFallbackRedirectUrl="/compliance-check">
                <button className="px-3 py-1.5 text-zinc-400 hover:text-white transition-colors cursor-pointer rounded-lg hover:bg-white/[0.05]">
                  Simulator
                </button>
              </SignInButton>
              <SignInButton mode="modal" fallbackRedirectUrl="/regulations/new" signUpFallbackRedirectUrl="/regulations/new">
                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#00F0FF]/15 to-[#3B82F6]/15 hover:from-[#00F0FF]/25 hover:to-[#3B82F6]/25 border border-[#00F0FF]/35 text-[#00F0FF] text-xs font-semibold rounded-lg shadow-[0_0_15px_rgba(0,240,255,0.15)] transition-all ml-4 cursor-pointer">
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload</span>
                </button>
              </SignInButton>
            </Show>
          </nav>
        </div>

        {/* Right: Actions & Mobile Toggle */}
        <div className="flex items-center gap-3">
          <Show when="signed-in">
            <UsageIndicator />
          </Show>
          <NavAuth />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/[0.05] transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/[0.08] bg-[#080D14]/95 backdrop-blur-2xl px-4 py-4 space-y-2 font-mono text-xs shadow-2xl">
          <Show when="signed-in">
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 px-3 rounded-lg text-zinc-300 hover:text-[#00F0FF] hover:bg-white/[0.05] transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/regulations"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 px-3 rounded-lg text-zinc-300 hover:text-[#00F0FF] hover:bg-white/[0.05] transition-colors"
            >
              Regulations
            </Link>
            <Link
              href="/compliance-check"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 px-3 rounded-lg text-zinc-300 hover:text-[#00F0FF] hover:bg-white/[0.05] transition-colors"
            >
              Simulator
            </Link>
            <Link
              href="/billing"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 px-3 rounded-lg text-zinc-300 hover:text-[#00F0FF] hover:bg-white/[0.05] transition-colors"
            >
              Entitlements
            </Link>
            {isSuperAdmin && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 py-2 px-3 rounded-lg text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 font-semibold"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Super-Admin Panel</span>
              </Link>
            )}
            <Link
              href="/regulations/new"
              onClick={() => setMobileMenuOpen(false)}
              className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-[#00F0FF]/20 to-[#3B82F6]/20 border border-[#00F0FF]/40 text-[#00F0FF] font-semibold rounded-lg w-full justify-center mt-2 shadow-[0_0_15px_rgba(0,240,255,0.15)]"
            >
              <UploadCloud className="w-4 h-4" />
              Upload Regulation
            </Link>
          </Show>
          <Show when="signed-out">
            <SignInButton mode="modal" fallbackRedirectUrl="/dashboard">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-left py-2 px-3 rounded-lg text-zinc-300 hover:text-white hover:bg-white/[0.05] cursor-pointer"
              >
                Dashboard
              </button>
            </SignInButton>
            <SignInButton mode="modal" fallbackRedirectUrl="/regulations">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-left py-2 px-3 rounded-lg text-zinc-300 hover:text-white hover:bg-white/[0.05] cursor-pointer"
              >
                Regulations
              </button>
            </SignInButton>
            <SignInButton mode="modal" fallbackRedirectUrl="/compliance-check">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-left py-2 px-3 rounded-lg text-zinc-300 hover:text-white hover:bg-white/[0.05] cursor-pointer"
              >
                Simulator
              </button>
            </SignInButton>
            <SignInButton mode="modal" fallbackRedirectUrl="/regulations/new">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-[#00F0FF]/20 to-[#3B82F6]/20 border border-[#00F0FF]/40 text-[#00F0FF] font-semibold rounded-lg w-full justify-center mt-2 cursor-pointer shadow-[0_0_15px_rgba(0,240,255,0.15)]"
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
