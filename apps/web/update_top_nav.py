import sys

top_nav_code = """import Link from 'next/link';
import { NavAuth } from './nav-auth';

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
            <Link href="/dashboard" className="text-zinc-400 hover:text-white transition-colors">
              Dashboard
            </Link>
            <Link href="/regulations" className="text-zinc-400 hover:text-white transition-colors">
              Regulations
            </Link>
            <Link href="/compliance-check" className="text-zinc-400 hover:text-white transition-colors">
              Compliance
            </Link>
          </nav>
        </div>

        {/* Right: Actions */}
        <NavAuth />
      </div>
    </header>
  );
}
"""

with open("src/components/layout/top-nav.tsx", "w", encoding="utf-8") as f:
    f.write(top_nav_code)
