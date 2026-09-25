'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  Menu, 
  X, 
  ArrowRight, 
  LayoutDashboard, 
  BookOpen, 
  Cpu, 
  Zap, 
  ShieldCheck, 
  ChevronDown, 
  Globe, 
  ShieldAlert, 
  Search, 
  Activity, 
  CheckSquare2, 
  CreditCard 
} from 'lucide-react';
import { Show, SignInButton, useUser, UserButton } from '@clerk/nextjs';
import { UsageIndicator } from '@/components/billing/usage-indicator';

const DASHBOARD_VIEWS = [
  {
    title: 'Website Audits',
    description: 'Live URL scan & deterministic scorecard',
    href: '/dashboard?tab=website_auditor',
    icon: Search,
    badge: 'NEW',
  },
  {
    title: 'Global Monitoring',
    description: '10 authorities live surveillance & geospatial feed',
    href: '/dashboard?tab=coverage',
    icon: Globe,
  },
  {
    title: '24/7 Regulatory Actions',
    description: 'Continuous autonomous interventions & runbooks',
    href: '/dashboard?tab=actions_24_7',
    icon: Zap,
  },
  {
    title: 'Policies & Evaluation',
    description: 'Deterministic AST regulatory rule engines',
    href: '/dashboard?tab=policies',
    icon: ShieldCheck,
  },
  {
    title: 'Compliance Hub',
    description: 'Executive overview, metrics & operational health',
    href: '/dashboard?tab=dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Gap Analysis',
    description: 'Algorithmic statute divergence tracking',
    href: '/dashboard?tab=gaps',
    icon: Activity,
  },
  {
    title: 'Remediation Checklist',
    description: 'Actionable step-by-step compliance roadmap',
    href: '/dashboard?tab=checklist',
    icon: CheckSquare2,
  },
];

export function TopNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileDashboardExpanded, setMobileDashboardExpanded] = useState(true);
  const [dashboardDropdownOpen, setDashboardDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const { user } = useUser();
  const dashboardDropdownRef = useRef<HTMLDivElement>(null);
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const userEmails = (user?.emailAddresses || []).map((e) => e?.emailAddress?.toLowerCase()).filter(Boolean) as string[];
  const primaryEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase() || '';
  const isSuperAdmin = primaryEmail === 'rcraghul12@gmail.com' || Boolean(userEmails?.includes('rcraghul12@gmail.com'));

  const isLanding = pathname === '/';

  // Close dropdowns on route changes
  useEffect(() => {
    setDashboardDropdownOpen(false);
    setMobileMenuOpen(false);
  }, [pathname]);

  // Click outside listener for dashboard dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dashboardDropdownRef.current && !dashboardDropdownRef.current.contains(event.target as Node)) {
        setDashboardDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-[#050608]/85 backdrop-blur-md border-b border-white/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.6)]'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 h-14 sm:h-16">
          {/* Brand Wordmark */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-[6px] bg-[#080A0E] border border-white/[0.08] flex items-center justify-center p-1 shadow-sm shrink-0">
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
              <span className="font-sans font-bold text-sm tracking-tight text-[#F4F6F8]">
                RegCompiler
              </span>
              <span className="font-mono text-[9px] tracking-wider text-[#64748B] uppercase leading-none">
                REGULATION AS CODE
              </span>
            </div>
          </Link>

          {/* Center: Editorial Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-xs text-[#9CA3AF] font-medium tracking-wide">
            <a href="#product" className="hover:text-[#F4F6F8] transition-colors">
              Product
            </a>
            <a href="#problem" className="hover:text-[#F4F6F8] transition-colors">
              The Problem
            </a>
            <a href="#how-it-works" className="hover:text-[#F4F6F8] transition-colors">
              How It Works
            </a>
            <a href="#architecture" className="hover:text-[#F4F6F8] transition-colors">
              Architecture
            </a>
            <a href="#security" className="hover:text-[#F4F6F8] transition-colors">
              Security
            </a>
            <a href="#use-cases" className="hover:text-[#F4F6F8] transition-colors">
              Use Cases
            </a>
          </nav>

          {/* Right: Auth & CTA Buttons */}
          <div className="flex items-center gap-2.5">
            <Show when="signed-in">
              <UsageIndicator />
              <Link href="/dashboard">
                <button
                  className="bg-[#4D8FCC] hover:bg-[#3B72A8] text-white rounded-[6px] font-medium transition-all px-3.5 h-8 flex items-center gap-1.5 cursor-pointer text-xs active:scale-[0.98] shadow-sm border border-[#79B5EC]/20"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-blue-100" />
                  <span>Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </Link>
              <UserButton />
            </Show>

            <Show when="signed-out">
              <SignInButton mode="modal" fallbackRedirectUrl="/dashboard" signUpFallbackRedirectUrl="/dashboard">
                <button className="text-xs text-[#9CA3AF] hover:text-[#F4F6F8] px-2.5 py-1.5 transition-colors cursor-pointer font-medium hidden sm:inline-block">
                  Sign In
                </button>
              </SignInButton>
              <SignInButton mode="modal" fallbackRedirectUrl="/dashboard" signUpFallbackRedirectUrl="/dashboard">
                <button
                  className="bg-[#4D8FCC] hover:bg-[#3B72A8] text-white rounded-[6px] font-medium transition-all px-3.5 h-8 flex items-center gap-1.5 cursor-pointer text-xs shadow-sm border border-[#79B5EC]/20 active:scale-[0.98]"
                >
                  <span>Start Compiling</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </SignInButton>
            </Show>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 text-[#9CA3AF] hover:text-[#F4F6F8] rounded-[6px] hover:bg-white/[0.04] transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay for Landing */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-white/[0.06] bg-[#050608]/98 backdrop-blur-xl px-4 py-4 space-y-2 text-xs font-medium text-[#9CA3AF] shadow-2xl">
            <a
              href="#product"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 hover:text-[#F4F6F8]"
            >
              Product
            </a>
            <a
              href="#problem"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 hover:text-[#F4F6F8]"
            >
              The Problem
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 hover:text-[#F4F6F8]"
            >
              How It Works
            </a>
            <a
              href="#architecture"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 hover:text-[#F4F6F8]"
            >
              Architecture
            </a>
            <a
              href="#security"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 hover:text-[#F4F6F8]"
            >
              Security
            </a>
            <a
              href="#use-cases"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 hover:text-[#F4F6F8]"
            >
              Use Cases
            </a>

            <div className="pt-3 border-t border-white/[0.06] flex flex-col gap-2">
              <Show when="signed-in">
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 text-center rounded-[6px] bg-[#4D8FCC] text-white font-medium text-xs flex items-center justify-center gap-1.5"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-blue-100" />
                  <span>Open Dashboard</span>
                </Link>
              </Show>
              <Show when="signed-out">
                <SignInButton mode="modal" fallbackRedirectUrl="/dashboard" signUpFallbackRedirectUrl="/dashboard">
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-2.5 text-center rounded-[6px] bg-[#4D8FCC] text-white font-medium text-xs"
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
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-[#050608]/85 backdrop-blur-md">
      <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 flex h-14 items-center justify-between">
        {/* Left: Logo/Wordmark & Telemetry */}
        <div className="flex items-center gap-5">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-[6px] overflow-hidden flex items-center justify-center p-1 bg-[#080A0E] border border-white/[0.08] shrink-0">
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
              <span className="text-sm font-bold tracking-tight text-[#F4F6F8] leading-tight">
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
              {/* Dashboard Dropdown Item */}
              <div 
                ref={dashboardDropdownRef}
                className="relative"
                onMouseEnter={() => {
                  if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
                  setDashboardDropdownOpen(true);
                }}
                onMouseLeave={() => {
                  dropdownTimeoutRef.current = setTimeout(() => {
                    setDashboardDropdownOpen(false);
                  }, 180);
                }}
              >
                <div className="flex items-center">
                  <Link 
                    href="/dashboard" 
                    className={`px-3 py-1.5 rounded-l-[6px] font-medium transition-all flex items-center gap-1.5 ${
                      pathname.startsWith('/dashboard')
                        ? 'text-white bg-[#0B0E14] border-y border-l border-white/[0.10] font-semibold shadow-sm'
                        : 'text-[#9CA3AF] hover:text-[#F4F6F8] hover:bg-white/[0.02]'
                    }`}
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-[#79B5EC]" />
                    <span>Dashboard</span>
                  </Link>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setDashboardDropdownOpen(!dashboardDropdownOpen);
                    }}
                    className={`px-1.5 py-1.5 rounded-r-[6px] transition-all flex items-center justify-center cursor-pointer ${
                      pathname.startsWith('/dashboard')
                        ? 'text-white bg-[#0B0E14] border-y border-r border-white/[0.10]'
                        : 'text-[#9CA3AF] hover:text-[#F4F6F8] hover:bg-white/[0.02]'
                    }`}
                    aria-label="Toggle Dashboard navigation menu"
                    aria-expanded={dashboardDropdownOpen}
                  >
                    <ChevronDown className={`w-3 h-3 transition-transform duration-150 ${dashboardDropdownOpen ? 'rotate-180 text-[#79B5EC]' : ''}`} />
                  </button>
                </div>

                {/* Dashboard Flyout Menu */}
                {dashboardDropdownOpen && (
                  <div className="absolute left-0 top-full mt-1.5 w-80 p-2 rounded-xl bg-[#080A0E]/98 backdrop-blur-2xl border border-white/[0.08] shadow-[0_16px_40px_rgba(0,0,0,0.7)] z-50">
                    <div className="px-2.5 py-1.5 mb-1 border-b border-white/[0.05] flex items-center justify-between">
                      <span className="font-mono text-[9px] uppercase tracking-wider text-[#64748B] font-semibold">
                        Dashboard Navigation
                      </span>
                      <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                        10 Nodes Live
                      </span>
                    </div>

                    <div className="flex flex-col gap-0.5">
                      {DASHBOARD_VIEWS.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setDashboardDropdownOpen(false)}
                            className="group flex items-start gap-2.5 p-2 rounded-lg hover:bg-white/[0.03] transition-all text-left"
                          >
                            <div className="w-7 h-7 rounded-[6px] bg-[#0B0E14] border border-white/[0.06] flex items-center justify-center text-[#79B5EC] group-hover:text-white group-hover:border-[#4D8FCC]/30 group-hover:bg-[#4D8FCC]/10 shrink-0 mt-0.5 transition-all">
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-medium text-[#F4F6F8] group-hover:text-white truncate">
                                  {item.title}
                                </span>
                                {item.badge && (
                                  <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-bold bg-[#4D8FCC]/15 text-[#79B5EC] border border-[#4D8FCC]/25">
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-[#64748B] group-hover:text-[#9CA3AF] leading-tight mt-0.5 truncate">
                                {item.description}
                              </p>
                            </div>
                          </Link>
                        );
                      })}

                      {isSuperAdmin && (
                        <Link
                          href="/dashboard?tab=swarm"
                          onClick={() => setDashboardDropdownOpen(false)}
                          className="group flex items-start gap-2.5 p-2 rounded-lg hover:bg-white/[0.03] transition-all text-left border-t border-white/[0.05] mt-1 pt-2"
                        >
                          <div className="w-7 h-7 rounded-[6px] bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:text-amber-300 shrink-0 mt-0.5 transition-all">
                            <ShieldAlert className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-medium text-amber-300 group-hover:text-amber-200 truncate">
                                MiroFish Swarm Traffic
                              </span>
                              <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                ADMIN
                              </span>
                            </div>
                            <p className="text-[10px] text-[#64748B] group-hover:text-[#9CA3AF] leading-tight mt-0.5 truncate">
                              Adversarial high-throughput stress simulation
                            </p>
                          </div>
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Regulations */}
              <Link 
                href="/regulations" 
                className={`px-3 py-1.5 rounded-[6px] font-medium transition-all flex items-center gap-1.5 ${
                  pathname.startsWith('/regulations') && !pathname.includes('/new')
                    ? 'text-white bg-[#0B0E14] border border-white/[0.10] font-semibold'
                    : 'text-[#9CA3AF] hover:text-[#F4F6F8] hover:bg-white/[0.02]'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                <span>Regulations</span>
              </Link>

              {/* Simulator */}
              <Link 
                href="/compliance-check" 
                className={`px-3 py-1.5 rounded-[6px] font-medium transition-all flex items-center gap-1.5 ${
                  pathname.startsWith('/compliance-check')
                    ? 'text-white bg-[#0B0E14] border border-white/[0.10] font-semibold'
                    : 'text-[#9CA3AF] hover:text-[#F4F6F8] hover:bg-white/[0.02]'
                }`}
              >
                <Cpu className="w-3.5 h-3.5 text-slate-400" />
                <span>Simulator</span>
              </Link>

              {/* 24/7 Actions */}
              <Link 
                href="/dashboard?tab=actions_24_7" 
                className="px-3 py-1.5 rounded-[6px] font-medium transition-all flex items-center gap-1.5 text-[#9CA3AF] hover:text-[#F4F6F8] hover:bg-white/[0.02]"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>24/7 Actions</span>
              </Link>

              {/* Billing */}
              <Link 
                href="/billing" 
                className={`px-3 py-1.5 rounded-[6px] font-medium transition-all flex items-center gap-1.5 ${
                  pathname.startsWith('/billing')
                    ? 'text-white bg-[#0B0E14] border border-white/[0.10] font-semibold'
                    : 'text-[#9CA3AF] hover:text-[#F4F6F8] hover:bg-white/[0.02]'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                <span>Billing</span>
              </Link>

              {/* Super Admin */}
              {isSuperAdmin && (
                <Link 
                  href="/admin" 
                  className={`px-3 py-1.5 rounded-[6px] font-medium transition-all flex items-center gap-1.5 ${
                    pathname.startsWith('/admin')
                      ? 'text-white bg-[#0B0E14] border border-white/[0.10] font-semibold'
                      : 'text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/10'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  <span>Admin</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                </Link>
              )}
            </Show>

            {/* Signed-out Desktop Nav */}
            <Show when="signed-out">
              <SignInButton mode="modal" fallbackRedirectUrl="/dashboard" signUpFallbackRedirectUrl="/dashboard">
                <button className="px-3 py-1.5 rounded-[6px] font-medium text-[#9CA3AF] hover:text-[#F4F6F8] hover:bg-white/[0.02] transition-all flex items-center gap-1.5 cursor-pointer">
                  <LayoutDashboard className="w-3.5 h-3.5 text-[#79B5EC]" />
                  <span>Dashboard</span>
                </button>
              </SignInButton>

              <SignInButton mode="modal" fallbackRedirectUrl="/regulations" signUpFallbackRedirectUrl="/regulations">
                <button className="px-3 py-1.5 rounded-[6px] font-medium text-[#9CA3AF] hover:text-[#F4F6F8] hover:bg-white/[0.02] transition-all flex items-center gap-1.5 cursor-pointer">
                  <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                  <span>Regulations</span>
                </button>
              </SignInButton>

              <SignInButton mode="modal" fallbackRedirectUrl="/compliance-check" signUpFallbackRedirectUrl="/compliance-check">
                <button className="px-3 py-1.5 rounded-[6px] font-medium text-[#9CA3AF] hover:text-[#F4F6F8] hover:bg-white/[0.02] transition-all flex items-center gap-1.5 cursor-pointer">
                  <Cpu className="w-3.5 h-3.5 text-slate-400" />
                  <span>Simulator</span>
                </button>
              </SignInButton>
            </Show>
          </nav>
        </div>

        {/* Right Section: Usage Indicator, Upload CTA & Clerk Auth */}
        <div className="flex items-center gap-2.5">
          <Show when="signed-in">
            <UsageIndicator />
            <Link href="/regulations/new">
              <button 
                className="bg-[#4D8FCC] hover:bg-[#3B72A8] text-white rounded-[6px] font-medium text-xs px-3 py-1.5 h-8 flex items-center gap-1.5 cursor-pointer shadow-sm border border-[#79B5EC]/20 active:scale-[0.98]"
              >
                <span>Upload Regulation</span>
              </button>
            </Link>
            <UserButton />
          </Show>

          <Show when="signed-out">
            <SignInButton mode="modal" fallbackRedirectUrl="/dashboard" signUpFallbackRedirectUrl="/dashboard">
              <button className="text-xs text-[#9CA3AF] hover:text-[#F4F6F8] px-2.5 py-1.5 transition-colors cursor-pointer font-medium">
                Sign In
              </button>
            </SignInButton>
            <SignInButton mode="modal" fallbackRedirectUrl="/dashboard" signUpFallbackRedirectUrl="/dashboard">
              <button
                className="bg-[#4D8FCC] hover:bg-[#3B72A8] text-white rounded-[6px] font-medium text-xs px-3.5 h-8 flex items-center gap-1.5 cursor-pointer shadow-sm border border-[#79B5EC]/20 active:scale-[0.98]"
              >
                <span>Start Free</span>
              </button>
            </SignInButton>
          </Show>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 text-[#9CA3AF] hover:text-[#F4F6F8] rounded-[6px] hover:bg-white/[0.04] transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu for Authenticated App */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-white/[0.06] bg-[#050608]/98 backdrop-blur-xl px-4 py-3 space-y-2 text-xs font-medium text-[#9CA3AF]">
          <Show when="signed-in">
            {/* Dashboard Accordion in Mobile */}
            <div>
              <div className="flex items-center justify-between py-1.5">
                <Link 
                  href="/dashboard" 
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 transition-colors ${
                    pathname.startsWith('/dashboard') ? 'text-white font-semibold' : 'hover:text-[#F4F6F8]'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-[#79B5EC]" />
                  <span>Dashboard</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setMobileDashboardExpanded(!mobileDashboardExpanded)}
                  className="p-1 text-[#64748B] hover:text-white"
                  aria-label="Toggle Dashboard sub-navigation"
                >
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${mobileDashboardExpanded ? 'rotate-180 text-[#79B5EC]' : ''}`} />
                </button>
              </div>

              {mobileDashboardExpanded && (
                <div className="ml-3 pl-2 border-l border-white/[0.06] my-1 space-y-1">
                  {DASHBOARD_VIEWS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center justify-between py-1 px-2 rounded hover:bg-white/[0.03] hover:text-white transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="w-3.5 h-3.5 text-[#79B5EC]" />
                          <span>{item.title}</span>
                        </div>
                        {item.badge && (
                          <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-bold bg-[#4D8FCC]/20 text-[#79B5EC] border border-[#4D8FCC]/30">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                  {isSuperAdmin && (
                    <Link
                      href="/dashboard?tab=swarm"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between py-1 px-2 rounded hover:bg-white/[0.03] text-amber-400 hover:text-amber-300 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>MiroFish Swarm</span>
                      </div>
                      <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        ADMIN
                      </span>
                    </Link>
                  )}
                </div>
              )}
            </div>

            <Link 
              href="/regulations" 
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 py-2 hover:text-[#F4F6F8]"
            >
              <BookOpen className="w-4 h-4 text-slate-400" />
              <span>Regulations</span>
            </Link>

            <Link 
              href="/compliance-check" 
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 py-2 hover:text-[#F4F6F8]"
            >
              <Cpu className="w-4 h-4 text-slate-400" />
              <span>Simulator</span>
            </Link>

            <Link 
              href="/billing" 
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 py-2 hover:text-[#F4F6F8]"
            >
              <CreditCard className="w-4 h-4 text-slate-400" />
              <span>Billing</span>
            </Link>

            {isSuperAdmin && (
              <Link 
                href="/admin" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 py-2 text-amber-400 hover:text-amber-300"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Admin Control</span>
              </Link>
            )}

            <div className="pt-2 border-t border-white/[0.06]">
              <Link 
                href="/regulations/new" 
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full py-2 text-center rounded-[6px] bg-[#4D8FCC] text-white font-medium"
              >
                Upload Regulation
              </Link>
            </div>
          </Show>

          <Show when="signed-out">
            <SignInButton mode="modal" fallbackRedirectUrl="/dashboard" signUpFallbackRedirectUrl="/dashboard">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 w-full text-left py-2 hover:text-[#F4F6F8] cursor-pointer"
              >
                <LayoutDashboard className="w-4 h-4 text-[#79B5EC]" />
                <span>Dashboard</span>
              </button>
            </SignInButton>
            <SignInButton mode="modal" fallbackRedirectUrl="/regulations" signUpFallbackRedirectUrl="/regulations">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 w-full text-left py-2 hover:text-[#F4F6F8] cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-slate-400" />
                <span>Regulations</span>
              </button>
            </SignInButton>
            <SignInButton mode="modal" fallbackRedirectUrl="/compliance-check" signUpFallbackRedirectUrl="/compliance-check">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 w-full text-left py-2 hover:text-[#F4F6F8] cursor-pointer"
              >
                <Cpu className="w-4 h-4 text-slate-400" />
                <span>Simulator</span>
              </button>
            </SignInButton>
          </Show>
        </div>
      )}
    </header>
  );
}
