import os

os.makedirs("src/components/layout", exist_ok=True)

page_container = """import React from 'react';
import { cn } from '@/lib/utils';

interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function PageContainer({ children, className, ...props }: PageContainerProps) {
  return (
    <div 
      className={cn("w-full max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8", className)}
      {...props}
    >
      {children}
    </div>
  );
}
"""

with open("src/components/layout/page-container.tsx", "w", encoding="utf-8") as f:
    f.write(page_container)

top_nav = """import Link from 'next/link';
import { UserButton, SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';

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
        <div className="flex items-center gap-4">
          <SignedIn>
            <UserButton />
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <Button size="sm" variant="secondary">Sign In</Button>
            </SignInButton>
          </SignedOut>
        </div>
      </div>
    </header>
  );
}
"""

with open("src/components/layout/top-nav.tsx", "w", encoding="utf-8") as f:
    f.write(top_nav)

footer = """export function Footer() {
  return (
    <footer className="w-full border-t border-zinc-800 bg-[#0a0a0c] py-6 md:py-0">
      <div className="w-full max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between md:h-16 gap-4">
        <p className="text-sm text-zinc-500">
          &copy; {new Date().getFullYear()} Regulation Compiler. All rights reserved.
        </p>
        <div className="flex items-center gap-4 text-sm text-zinc-500">
          <a href="#" className="hover:text-zinc-300">Terms</a>
          <a href="#" className="hover:text-zinc-300">Privacy</a>
        </div>
      </div>
    </footer>
  );
}
"""

with open("src/components/layout/footer.tsx", "w", encoding="utf-8") as f:
    f.write(footer)

