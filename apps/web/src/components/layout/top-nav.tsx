'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { NavAuth } from './nav-auth';
import { UploadCloud, Menu, X, ShieldAlert, ArrowRight } from 'lucide-react';
import { Show, SignInButton, useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';

export function TopNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const { user } = useUser();

  const userEmails = user?.emailAddresses?.map((e) => e.emailAddress.toLowerCase()) || [];
  const primaryEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase() || '';
  const isSuperAdmin = primaryEmail === 'rcraghul12@gmail.com' || userEmails.includes('rcraghul12@gmail.com');

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
      <header className="sticky top-0 z-50 w-full pt-3 px-4 pointer-events-none transition-all duration-300">
        <div
          className={`w-full max-w-6xl mx-auto h-[68px] rounded-2xl flex items-center justify-between px-5 sm:px-6 pointer-events-auto transition-all duration-300 ${
            isScrolled
              ? 'bg-[#080D13]/85 backdrop-blur-xl border border-[#17222C] shadow-2xl shadow-black/80'
              : 'bg-transparent border border-transparent'
          }`}
        >
          {/* Left: Brand Logo & Wordmark */}
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="relative w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center p-0.5 bg-[#0C131B] border border-[#17222C] group-hover:border-[#5CC8FF50] transition-colors shadow-sm shrink-0">
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
              <span className="text-base font-bold tracking-tight text-[#F2F6F8] group-hover:text-[#5CC8FF] transition-colors leading-tight font-sans">
                RegCompiler
              </span>
              <span className="text-[10px] text-[#62717C] font-mono tracking-wider uppercase leading-none hidden sm:inline-block">
                Regulation as Code
              </span>
            </div>
          </Link>

          {/* Center: Nav Anchors */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-mono font-medium text-[#9AA9B5]">
            <a href="#hero" className="hover:text-[#F2F6F8] transition-colors">
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
              <Link href="/dashboard">
                <Button
                  size="sm"
                  className="bg-[#5CC8FF] hover:bg-[#4bb3e6] text-[#05070A] rounded-xl font-semibold shadow-[0_0_20px_rgba(92,200,255,0.25)] transition-all px-4 h-9 flex items-center gap-1.5 cursor-pointer text-xs"
                >
                  <span>Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
              <NavAuth />
            </Show>

            <Show when="signed-out">
              <SignInButton mode="modal" fallbackRedirectUrl="/dashboard">
                <button className="text-xs font-mono text-[#9AA9B5] hover:text-[#F2F6F8] px-3 py-1.5 transition-colors cursor-pointer hidden sm:inline-block">
                  Sign In
                </button>
              </SignInButton>
              <SignInButton mode="modal" fallbackRedirectUrl="/dashboard">
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
              href="#hero"
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
                <SignInButton mode="modal" fallbackRedirectUrl="/dashboard">
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
              <Link
                href="/regulations/new"
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-md transition-colors ml-2"
              >
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
