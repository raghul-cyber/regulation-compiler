import Link from 'next/link';

export function Footer() {
  return (
    <footer className="w-full border-t border-zinc-800/80 bg-[#070709] py-8 md:py-0 transition-colors">
      <div className="w-full max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between md:h-16 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <p className="text-sm text-zinc-500">
            &copy; {new Date().getFullYear()} Regulation Compiler. Deterministic Statutory Enforcement.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-6 text-sm text-zinc-400">
          <Link href="/dashboard" className="hover:text-blue-400 transition-colors">
            Surveillance
          </Link>
          <Link href="/regulations" className="hover:text-blue-400 transition-colors">
            Compiler Studio
          </Link>
          <Link href="/terms" className="hover:text-white transition-colors">
            Terms of Service
          </Link>
          <Link href="/privacy" className="hover:text-white transition-colors">
            Privacy Policy
          </Link>
        </div>
      </div>
    </footer>
  );
}
