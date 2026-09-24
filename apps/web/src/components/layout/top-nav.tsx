'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X, ArrowRight } from 'lucide-react';
import { Show, SignInButton, useUser, UserButton } from '@clerk/nextjs';
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
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isLanding]);

  // =========================================================================
  // 1. REFINED ENTERPRISE NAVIGATION (Landing Page)
  // =========================================================================
  if (isLanding) {
    return (
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
          isScrolled
            ? 'bg-[#090B0E]/95 backdrop-blur-md border-b border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.5)]'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 h-14 sm:h-16">
          {/* Brand Wordmark */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-[6px] bg-[#0E1218] border border-white/[0.10] flex items-center justify-center p-1 shadow-sm shrink-0">
              <Image
                src="/icon.png"
                alt="RegCompiler Logo"
                width={18}
                height={18}
                className="w-4.5 h-4.5 object-contain"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="font-sans font-bold text-sm tracking-tight text-[#F1F5F9]">
                RegCompiler
              </span>
              <span className="font-mono text-[9px] tracking-wider text-[#64748B] uppercase leading-none">
                REGULATION AS CODE
              </span>
            </div>
          </Link>

          {/* Center: Editorial Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-xs text-[#8B949E] font-medium tracking-wide">
            <a href="#product" className="hover:text-[#F1F5F9] transition-colors">
              Product
            </a>
            <a href="#problem" className="hover:text-[#F1F5F9] transition-colors">
              The Problem
            </a>
            <a href="#how-it-works" className="hover:text-[#F1F5F9] transition-colors">
              How It Works
            </a>
            <a href="#architecture" className="hover:text-[#F1F5F9] transition-colors">
              Architecture
            </a>
            <a href="#security" className="hover:text-[#F1F5F9] transition-colors">
              Security
            </a>
            <a href="#use-cases" className="hover:text-[#F1F5F9] transition-colors">
              Use Cases
            </a>
          </nav>

          {/* Right: Auth & CTA Buttons */}
          <div className="flex items-center gap-2.5">
            <Show when="signed-in">
              <UsageIndicator />
              <Link href="/dashboard">
                <button
                  className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-[6px] font-medium transition-all px-3.5 h-8 flex items-center gap-1.5 cursor-pointer text-xs active:scale-[0.98]"
                >
                  <span>Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </Link>
              <UserButton />
            </Show>

            <Show when="signed-out">
              <SignInButton mode="modal" fallbackRedirectUrl="/dashboard" signUpFallbackRedirectUrl="/dashboard">
                <button className="text-xs text-[#8B949E] hover:text-[#F1F5F9] px-2.5 py-1.5 transition-colors cursor-pointer font-medium hidden sm:inline-block">
                  Sign In
                </button>
              </SignInButton>
              <SignInButton mode="modal" fallbackRedirectUrl="/dashboard" signUpFallbackRedirectUrl="/dashboard">
                <button
                  className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-[6px] font-medium transition-all px-3.5 h-8 flex items-center gap-1.5 cursor-pointer text-xs shadow-sm active:scale-[0.98]"
                >
                  <span>Start Compiling</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </SignInButton>
            </Show>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 text-[#8B949E] hover:text-[#F1F5F9] rounded-[6px] hover:bg-white/[0.05] transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay for Landing */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-white/[0.08] bg-[#090B0E]/98 backdrop-blur-xl px-4 py-4 space-y-2 text-xs font-medium text-[#8B949E] shadow-2xl">
            <a
              href="#product"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 hover:text-[#F1F5F9]"
            >
              Product
            </a>
            <a
              href="#problem"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 hover:text-[#F1F5F9]"
            >
              The Problem
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 hover:text-[#F1F5F9]"
            >
              How It Works
            </a>
            <a
              href="#architecture"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 hover:text-[#F1F5F9]"
            >
              Architecture
            </a>
            <a
              href="#security"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 hover:text-[#F1F5F9]"
            >
              Security
            </a>
            <a
              href="#use-cases"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 hover:text-[#F1F5F9]"
            >
              Use Cases
            </a>

            <div className="pt-3 border-t border-white/[0.08] flex flex-col gap-2">
              <Show when="signed-in">
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 text-center rounded-[6px] bg-[#2563EB] text-white font-medium text-xs"
                >
                  Open Dashboard
                </Link>
              </Show>
              <Show when="signed-out">
                <SignInButton mode="modal" fallbackRedirectUrl="/dashboard" signUpFallbackRedirectUrl="/dashboard">
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-2.5 text-center rounded-[6px] bg-[#2563EB] text-white font-medium text-xs"
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
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#090B0E]/90 backdrop-blur-md">
      <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 flex h-14 items-center justify-between">
        {/* Left: Logo/Wordmark & Telemetry */}
        <div className="flex items-center gap-5">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-[6px] overflow-hidden flex items-center justify-center p-1 bg-[#0E1218] border border-white/[0.10] shrink-0">
              <Image
                src="/logo-icon.png"
                alt="RegCompiler Logo"
                width={20}
                height={20}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-[#F1F5F9] leading-tight">
                RegCompiler
              </span>
              <span className="text-[9px] text-[#64748B] font-mono tracking-wider uppercase leading-none hidden sm:inline-block">
                STATUTORY COMPILER
              </span>
            </div>
          </Link>

          {/* Live Surveillance Status Beacon */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-0.5 rounded-[4px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[10px] tracking-wider font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
            <span>10 AUTHORITIES LIVE</span>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1 text-xs">
            <Show when="signed-in">
              <Link 
                href="/billing" 
                className={`px-3 py-1.5 rounded-[6px] font-medium transition-all ${
                  pathname.startsWith('/billing')
                    ? 'text-white bg-[#151A22] border border-white/[0.12] font-semibold'
                    : 'text-[#8B949E] hover:text-[#F1F5F9] hover:bg-white/[0.03]'
                }`}
              >
                Billing
              </Link>

              {isSuperAdmin && (
                <Link 
                  href="/admin" 
                  className={`px-3 py-1.5 rounded-[6px] font-medium transition-all flex items-center gap-1.5 ${
                    pathname.startsWith('/admin')
                      ? 'text-white bg-[#151A22] border border-white/[0.12] font-semibold'
                      : 'text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/10'
                  }`}
                >
                  <span>Admin</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                </Link>
              )}
            </Show>
          </nav>
        </div>

        {/* Right Section: Usage Indicator, Upload CTA & Clerk Auth */}
        <div className="flex items-center gap-2.5">
          <Show when="signed-in">
            <UsageIndicator />
            <Link href="/regulations/new">
              <button 
                className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-[6px] font-medium text-xs px-3 py-1.5 h-8 flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-[0.98]"
              >
                <span>Upload Regulation</span>
              </button>
            </Link>
            <UserButton />
          </Show>

          <Show when="signed-out">
            <SignInButton mode="modal" fallbackRedirectUrl="/dashboard" signUpFallbackRedirectUrl="/dashboard">
              <button className="text-xs text-[#8B949E] hover:text-[#F1F5F9] px-2.5 py-1.5 transition-colors cursor-pointer font-medium">
                Sign In
              </button>
            </SignInButton>
            <SignInButton mode="modal" fallbackRedirectUrl="/dashboard" signUpFallbackRedirectUrl="/dashboard">
              <button
                className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-[6px] font-medium text-xs px-3.5 h-8 flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-[0.98]"
              >
                <span>Start Free</span>
              </button>
            </SignInButton>
          </Show>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 text-[#8B949E] hover:text-[#F1F5F9] rounded-[6px] hover:bg-white/[0.05] transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu for Authenticated App */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-white/[0.08] bg-[#090B0E]/98 backdrop-blur-xl px-4 py-3 space-y-1.5 text-xs font-medium text-[#8B949E]">
          <Show when="signed-in">
            <Link 
              href="/billing" 
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 hover:text-[#F1F5F9]"
            >
              Billing
            </Link>
            {isSuperAdmin && (
              <Link 
                href="/admin" 
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-amber-400 hover:text-amber-300"
              >
                Admin Control
              </Link>
            )}
            <div className="pt-2 border-t border-white/[0.08]">
              <Link 
                href="/regulations/new" 
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full py-2 text-center rounded-[6px] bg-[#2563EB] text-white font-medium"
              >
                Upload Regulation
              </Link>
            </div>
          </Show>
        </div>
      )}
    </header>
  );
}
