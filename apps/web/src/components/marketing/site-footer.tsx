import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="rule-top bg-paper border-t border-rule mt-auto">
      <div className="mx-auto flex max-w-5xl flex-wrap items-start justify-between gap-10 px-5 py-12">
        <div className="max-w-sm">
          <p className="font-serif text-sm font-bold text-[var(--saas-foreground)]">
            Regulation-as-Code Compiler
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Compliance software for teams that have to prove what they do, not just describe it.
            Output is reviewed by your own people before it counts as authoritative, and it does not
            replace legal counsel.
          </p>
        </div>
        <nav className="flex flex-wrap gap-10">
          <div className="flex flex-col gap-2">
            <span className="label">Product</span>
            <Link href="/platform" className="text-sm hover:underline">
              Product
            </Link>
            <Link href="/pricing" className="text-sm hover:underline">
              Pricing
            </Link>
            <Link href="/contact" className="text-sm hover:underline">
              Book a walkthrough
            </Link>
            <Link href="/regulations" className="text-sm hover:underline">
              Launch Compiler
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            <span className="label">Company</span>
            <Link href="/contact" className="text-sm hover:underline">
              Contact
            </Link>
            <Link href="/terms" className="text-sm hover:underline">
              Terms of service
            </Link>
            <Link href="/privacy" className="text-sm hover:underline">
              Privacy policy
            </Link>
          </div>
        </nav>
      </div>
      <div className="rule-top border-t border-rule">
        <p className="mx-auto max-w-5xl px-5 py-4 label text-xs text-muted-foreground">
          Copyright 2026 Regulation-as-Code Compiler. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
