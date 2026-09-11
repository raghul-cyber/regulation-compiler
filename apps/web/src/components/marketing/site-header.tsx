'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Show, SignInButton, UserButton } from '@clerk/nextjs';
import { Menu, X } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Overview' },
  { href: '/platform', label: 'Product' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/contact', label: 'Contact' },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="border-b border-rule bg-paper sticky top-0 z-50">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-4">
        <Link href="/" className="font-serif text-base font-bold tracking-tight text-[var(--saas-foreground)]">
          Regulation-as-Code
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="label transition-colors"
                style={isActive ? { color: 'var(--saas-accent)', fontWeight: 600 } : undefined}
              >
                {item.label}
              </Link>
            );
          })}

          <Show when="signed-in">
            <Link href="/dashboard" className="label transition-colors hover:text-[var(--saas-accent)]">
              Dashboard
            </Link>
            <Link href="/regulations" className="btn-outline py-2 px-4 text-xs">
              Launch Compiler
            </Link>
            <div className="ml-2 flex items-center">
              <UserButton />
            </div>
          </Show>

          <Show when="signed-out">
            <SignInButton mode="modal" fallbackRedirectUrl="/dashboard">
              <button className="label transition-colors cursor-pointer hover:text-[var(--saas-accent)]">
                Sign In
              </button>
            </SignInButton>
            <SignInButton mode="modal" fallbackRedirectUrl="/regulations">
              <button className="btn-outline py-2 px-4 text-xs cursor-pointer">
                Launch Compiler
              </button>
            </SignInButton>
            <Link href="/pricing#plans" className="btn-primary py-2 px-4 text-xs">
              Subscribe
            </Link>
          </Show>
        </nav>

        {/* Mobile Toggle Button */}
        <div className="flex md:hidden items-center gap-2">
          <Show when="signed-in">
            <UserButton />
          </Show>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1 text-[var(--saas-foreground)] hover:opacity-75 focus:outline-none cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-paper px-5 py-5 space-y-4">
          <nav className="flex flex-col space-y-3">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="label py-1 transition-colors"
                  style={isActive ? { color: 'var(--saas-accent)', fontWeight: 600 } : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="pt-3 border-t border-border flex flex-col gap-2">
            <Show when="signed-in">
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="btn-outline text-center py-2 text-xs"
              >
                Go to Dashboard
              </Link>
              <Link
                href="/regulations"
                onClick={() => setMobileMenuOpen(false)}
                className="btn-primary text-center py-2 text-xs"
              >
                Launch Compiler
              </Link>
            </Show>

            <Show when="signed-out">
              <SignInButton mode="modal" fallbackRedirectUrl="/dashboard">
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn-outline w-full text-center py-2 text-xs cursor-pointer"
                >
                  Sign In
                </button>
              </SignInButton>
              <Link
                href="/pricing#plans"
                onClick={() => setMobileMenuOpen(false)}
                className="btn-primary text-center py-2 text-xs"
              >
                Subscribe
              </Link>
            </Show>
          </div>
        </div>
      )}
    </header>
  );
}
