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
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 reveal-nav ${
          isScrolled
            ? 'rc-glass-smoked border-b border-[rgba(199,204,210,0.10)] shadow-[0_8px_32px_rgba(9,11,15,0.7)]'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 h-14 sm:h-16">
          {/* Brand Wordmark */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-[6px] bg-[#171C23] border border-[rgba(199,204,210,0.14)] flex items-center justify-center p-1 shadow-sm shrink-0 group-hover:border-[rgba(188,167,123,0.4)] transition-colors">
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
              <span className="font-sans font-bold text-sm tracking-tight text-[#FAF9F5] group-hover:text-white transition-colors">
                RegCompiler
              </span>
              <span className="font-mono text-[9px] tracking-wider text-[#AAB1BA] uppercase leading-none">
                REGULATION AS CODE
              </span>
            </div>
          </Link>

          {/* Center: Editorial Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-xs text-[#C7CCD2] font-medium tracking-wide">
            <a href="#product" className="hover:text-[#FAF9F5] transition-colors relative py-1">
              Product
            </a>
            <a href="#problem" className="hover:text-[#FAF9F5] transition-colors relative py-1">
              The Problem
            </a>
            <a href="#how-it-works" className="hover:text-[#FAF9F5] transition-colors relative py-1">
              How It Works
            </a>
            <a href="#architecture" className="hover:text-[#FAF9F5] transition-colors relative py-1">
              Architecture
            </a>
            <a href="#security" className="hover:text-[#FAF9F5] transition-colors relative py-1">
              Security
            </a>
            <a href="#use-cases" className="hover:text-[#FAF9F5] transition-colors relative py-1">
              Use Cases
            </a>
          </nav>

          {/* Right: Auth & CTA Buttons */}
          <div className="flex items-center gap-2.5">
            <Show when="signed-in">
              <UsageIndicator />
              <Link href="/dashboard">
                <button
                  className="rc-btn-sapphire-metal rounded-[6px] font-medium px-3.5 h-8 flex items-center gap-1.5 cursor-pointer text-xs"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-[#BCA77B]" />
                  <span>Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#C7CCD2]" />
                </button>
              </Link>
              <UserButton />
            </Show>

            <Show when="signed-out">
              <SignInButton mode="modal" fallbackRedirectUrl="/dashboard" signUpFallbackRedirectUrl="/dashboard">
                <button className="text-xs text-[#C7CCD2] hover:text-[#FAF9F5] px-2.5 py-1.5 transition-colors cursor-pointer font-medium hidden sm:inline-block">
                  Sign In
                </button>
              </SignInButton>
              <SignInButton mode="modal" fallbackRedirectUrl="/dashboard" signUpFallbackRedirectUrl="/dashboard">
                <button
                  className="rc-btn-sapphire-metal rounded-[6px] font-medium px-3.5 h-8 flex items-center gap-1.5 cursor-pointer text-xs"
                >
                  <span>Start Compiling</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#BCA77B]" />
                </button>
              </SignInButton>
            </Show>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 text-[#C7CCD2] hover:text-[#FAF9F5] rounded-[6px] hover:bg-white/[0.04] transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay for Landing */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-[rgba(200,180,135,0.12)] bg-[#12161C]/98 backdrop-blur-xl px-4 py-4 space-y-2 text-xs font-medium text-[#C7CCD2] shadow-2xl">
            <a
              href="#product"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 hover:text-[#FAF9F5]"
            >
              Product
            </a>
            <a
              href="#problem"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 hover:text-[#FAF9F5]"
            >
              The Problem
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 hover:text-[#FAF9F5]"
            >
              How It Works
            </a>
            <a
              href="#architecture"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 hover:text-[#FAF9F5]"
            >
              Architecture
            </a>
            <a
              href="#security"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 hover:text-[#FAF9F5]"
            >
              Security
            </a>
            <a
              href="#use-cases"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 hover:text-[#FAF9F5]"
            >
              Use Cases
            </a>

            <div className="pt-3 border-t border-[rgba(200,180,135,0.12)] flex flex-col gap-2">
              <Show when="signed-in">
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 text-center rounded-[6px] rc-btn-sapphire-metal text-[#FAF9F5] font-medium text-xs flex items-center justify-center gap-1.5"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-[#BCA77B]" />
                  <span>Open Dashboard</span>
                </Link>
              </Show>
              <Show when="signed-out">
                <SignInButton mode="modal" fallbackRedirectUrl="/dashboard" signUpFallbackRedirectUrl="/dashboard">
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-2.5 text-center rounded-[6px] rc-btn-sapphire-metal text-[#FAF9F5] font-medium text-xs"
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
    <header className="sticky top-0 z-50 w-full border-b border-[rgba(199,204,210,0.10)] rc-glass-smoked shadow-[0_4px_24px_rgba(9,11,15,0.6)]">
      <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 flex h-14 items-center justify-between">
        {/* Left: Logo/Wordmark & Telemetry */}
        <div className="flex items-center gap-5">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-[6px] overflow-hidden flex items-center justify-center p-1 bg-[#171C23] border border-[rgba(199,204,210,0.14)] shrink-0 group-hover:border-[rgba(188,167,123,0.4)] transition-colors">
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
              <span className="text-sm font-bold tracking-tight text-[#FAF9F5] leading-tight">
                RegCompiler
              </span>
              <span className="text-[9px] text-[#969DA6] font-mono tracking-wider uppercase leading-none hidden sm:inline-block">
                REGULATION AS CODE
              </span>
            </div>
          </Link>

          {/* Live Surveillance Status Beacon */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-0.5 rounded-[4px] bg-[#76937F]/15 border border-[#76937F]/30 text-[#76937F] font-mono text-[10px] tracking-wider font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#76937F] inline-block animate-pulse" />
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
                        ? 'text-[#FAF9F5] bg-[#171C23] border-y border-l border-[rgba(199,204,210,0.14)] font-semibold shadow-sm'
                        : 'text-[#C7CCD2] hover:text-[#FAF9F5] hover:bg-[#171C23]/60'
                    }`}
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-[#BCA77B]" />
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
                        ? 'text-[#FAF9F5] bg-[#171C23] border-y border-r border-[rgba(199,204,210,0.14)]'
                        : 'text-[#C7CCD2] hover:text-[#FAF9F5] hover:bg-[#171C23]/60'
                    }`}
                    aria-label="Toggle Dashboard navigation menu"
                    aria-expanded={dashboardDropdownOpen}
                  >
                    <ChevronDown className={`w-3 h-3 transition-transform duration-150 ${dashboardDropdownOpen ? 'rotate-180 text-[#BCA77B]' : ''}`} />
                  </button>
                </div>

                {/* Dashboard Flyout Menu */}
                {dashboardDropdownOpen && (
                  <div className="absolute left-0 top-full mt-1.5 w-80 p-2 rounded-xl bg-[#12161C]/98 backdrop-blur-2xl border border-[rgba(199,204,210,0.12)] shadow-[0_16px_40px_rgba(9,11,15,0.85)] z-50">
                    <div className="px-2.5 py-1.5 mb-1 border-b border-[rgba(199,204,210,0.08)] flex items-center justify-between">
                      <span className="font-mono text-[9px] uppercase tracking-wider text-[#969DA6] font-semibold">
                        Dashboard Navigation
                      </span>
                      <span className="text-[9px] font-mono text-[#76937F] bg-[#76937F]/15 px-1.5 py-0.5 rounded border border-[#76937F]/30">
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
                            className="group flex items-start gap-2.5 p-2 rounded-lg hover:bg-[#1B1815] transition-all text-left"
                          >
                            <div className="w-7 h-7 rounded-[6px] bg-[#1B1815] border border-[rgba(201,196,186,0.08)] flex items-center justify-center text-[#AD956C] group-hover:text-[#F7F4EC] group-hover:border-[#AD956C]/30 shrink-0 mt-0.5 transition-all">
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-medium text-[#F1EEE7] group-hover:text-white truncate">
                                  {item.title}
                                </span>
                                {item.badge && (
                                  <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-bold bg-[#3F5C74]/20 text-[#7A9FBE] border border-[#3F5C74]/30">
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-[#8D8982] group-hover:text-[#C9C4BA] leading-tight mt-0.5 truncate">
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
                    ? 'text-[#F7F4EC] bg-[#1B1815] border border-[rgba(201,196,186,0.12)] font-semibold'
                    : 'text-[#C9C4BA] hover:text-[#F7F4EC] hover:bg-[#1B1815]/50'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-[#AD956C]" />
                <span>Regulations</span>
              </Link>

              {/* Simulator */}
              <Link 
                href="/compliance-check" 
                className={`px-3 py-1.5 rounded-[6px] font-medium transition-all flex items-center gap-1.5 ${
                  pathname.startsWith('/compliance-check')
                    ? 'text-[#F7F4EC] bg-[#1B1815] border border-[rgba(201,196,186,0.12)] font-semibold'
                    : 'text-[#C9C4BA] hover:text-[#F7F4EC] hover:bg-[#1B1815]/50'
                }`}
              >
                <Cpu className="w-3.5 h-3.5 text-[#AD956C]" />
                <span>Simulator</span>
              </Link>

              {/* 24/7 Actions */}
              <Link 
                href="/dashboard?tab=actions_24_7" 
                className="px-3 py-1.5 rounded-[6px] font-medium transition-all flex items-center gap-1.5 text-[#C9C4BA] hover:text-[#F7F4EC] hover:bg-[#1B1815]/50"
              >
                <Zap className="w-3.5 h-3.5 text-[#C5B38B]" />
                <span>24/7 Actions</span>
              </Link>

              {/* Billing */}
              <Link 
                href="/billing" 
                className={`px-3 py-1.5 rounded-[6px] font-medium transition-all flex items-center gap-1.5 ${
                  pathname.startsWith('/billing')
                    ? 'text-[#F7F4EC] bg-[#1B1815] border border-[rgba(201,196,186,0.12)] font-semibold'
                    : 'text-[#C9C4BA] hover:text-[#F7F4EC] hover:bg-[#1B1815]/50'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5 text-[#AD956C]" />
                <span>Billing</span>
              </Link>

              {/* Super Admin */}
              {isSuperAdmin && (
                <Link 
                  href="/admin" 
                  className={`px-3 py-1.5 rounded-[6px] font-medium transition-all flex items-center gap-1.5 ${
                    pathname.startsWith('/admin')
                      ? 'text-[#F7F4EC] bg-[#1B1815] border border-[rgba(201,196,186,0.12)] font-semibold'
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
                <button className="px-3 py-1.5 rounded-[6px] font-medium text-[#C9C4BA] hover:text-[#F7F4EC] hover:bg-[#1B1815]/50 transition-all flex items-center gap-1.5 cursor-pointer">
                  <LayoutDashboard className="w-3.5 h-3.5 text-[#AD956C]" />
                  <span>Dashboard</span>
                </button>
              </SignInButton>

              <SignInButton mode="modal" fallbackRedirectUrl="/regulations" signUpFallbackRedirectUrl="/regulations">
                <button className="px-3 py-1.5 rounded-[6px] font-medium text-[#C9C4BA] hover:text-[#F7F4EC] hover:bg-[#1B1815]/50 transition-all flex items-center gap-1.5 cursor-pointer">
                  <BookOpen className="w-3.5 h-3.5 text-[#AD956C]" />
                  <span>Regulations</span>
                </button>
              </SignInButton>

              <SignInButton mode="modal" fallbackRedirectUrl="/compliance-check" signUpFallbackRedirectUrl="/compliance-check">
                <button className="px-3 py-1.5 rounded-[6px] font-medium text-[#C9C4BA] hover:text-[#F7F4EC] hover:bg-[#1B1815]/50 transition-all flex items-center gap-1.5 cursor-pointer">
                  <Cpu className="w-3.5 h-3.5 text-[#AD956C]" />
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
                className="rc-btn-sapphire-metal rounded-[6px] font-medium text-xs px-3 py-1.5 h-8 flex items-center gap-1.5 cursor-pointer"
              >
                <span>Upload Regulation</span>
              </button>
            </Link>
            <UserButton />
          </Show>

          <Show when="signed-out">
            <SignInButton mode="modal" fallbackRedirectUrl="/dashboard" signUpFallbackRedirectUrl="/dashboard">
              <button className="text-xs text-[#C9C4BA] hover:text-[#F4F0E8] px-2.5 py-1.5 transition-colors cursor-pointer font-medium">
                Sign In
              </button>
            </SignInButton>
            <SignInButton mode="modal" fallbackRedirectUrl="/dashboard" signUpFallbackRedirectUrl="/dashboard">
              <button
                className="rc-btn-sapphire-metal rounded-[6px] font-medium text-xs px-3.5 h-8 flex items-center gap-1.5 cursor-pointer"
              >
                <span>Start Free</span>
              </button>
            </SignInButton>
          </Show>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 text-[#C9C4BA] hover:text-[#F7F4EC] rounded-[6px] hover:bg-[#1B1815] transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu for Authenticated App */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[rgba(200,180,135,0.12)] bg-[#12161C]/98 backdrop-blur-xl px-4 py-3 space-y-2 text-xs font-medium text-[#C7CCD2]">
          <Show when="signed-in">
            {/* Dashboard Accordion in Mobile */}
            <div>
              <div className="flex items-center justify-between py-1.5">
                <Link 
                  href="/dashboard" 
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 transition-colors ${
                    pathname.startsWith('/dashboard') ? 'text-[#FAF9F5] font-semibold' : 'hover:text-[#FAF9F5]'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-[#BCA77B]" />
                  <span>Dashboard</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setMobileDashboardExpanded(!mobileDashboardExpanded)}
                  className="p-1 text-[#969DA6] hover:text-[#FAF9F5]"
                  aria-label="Toggle Dashboard sub-navigation"
                >
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${mobileDashboardExpanded ? 'rotate-180 text-[#BCA77B]' : ''}`} />
                </button>
              </div>

              {mobileDashboardExpanded && (
                <div className="ml-3 pl-2 border-l border-[rgba(200,180,135,0.12)] my-1 space-y-1">
                  {DASHBOARD_VIEWS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center justify-between py-1 px-2 rounded hover:bg-[#171C23] hover:text-[#FAF9F5] transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="w-3.5 h-3.5 text-[#BCA77B]" />
                          <span>{item.title}</span>
                        </div>
                        {item.badge && (
                          <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-bold bg-[#4D78A0]/15 text-[#7299B4] border border-[#4D78A0]/35">
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
                      className="flex items-center justify-between py-1 px-2 rounded hover:bg-[#171C23] text-amber-400 hover:text-amber-300 transition-colors"
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
              className="flex items-center gap-2 py-2 hover:text-[#FAF9F5]"
            >
              <BookOpen className="w-4 h-4 text-[#BCA77B]" />
              <span>Regulations</span>
            </Link>

            <Link 
              href="/compliance-check" 
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 py-2 hover:text-[#FAF9F5]"
            >
              <Cpu className="w-4 h-4 text-[#BCA77B]" />
              <span>Simulator</span>
            </Link>

            <Link 
              href="/billing" 
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 py-2 hover:text-[#F7F4EC]"
            >
              <CreditCard className="w-4 h-4 text-[#AD956C]" />
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

            <div className="pt-2 border-t border-[rgba(201,196,186,0.08)]">
              <Link 
                href="/regulations/new" 
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full py-2 text-center rounded-[6px] bg-[#3F5C74] hover:bg-[#344D63] text-[#F7F4EC] font-medium"
              >
                Upload Regulation
              </Link>
            </div>
          </Show>

          <Show when="signed-out">
            <SignInButton mode="modal" fallbackRedirectUrl="/dashboard" signUpFallbackRedirectUrl="/dashboard">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 w-full text-left py-2 hover:text-[#F7F4EC] cursor-pointer"
              >
                <LayoutDashboard className="w-4 h-4 text-[#AD956C]" />
                <span>Dashboard</span>
              </button>
            </SignInButton>
            <SignInButton mode="modal" fallbackRedirectUrl="/regulations" signUpFallbackRedirectUrl="/regulations">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 w-full text-left py-2 hover:text-[#F7F4EC] cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-[#AD956C]" />
                <span>Regulations</span>
              </button>
            </SignInButton>
            <SignInButton mode="modal" fallbackRedirectUrl="/compliance-check" signUpFallbackRedirectUrl="/compliance-check">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 w-full text-left py-2 hover:text-[#F7F4EC] cursor-pointer"
              >
                <Cpu className="w-4 h-4 text-[#AD956C]" />
                <span>Simulator</span>
              </button>
            </SignInButton>
          </Show>
        </div>
      )}
    </header>
  );
}
