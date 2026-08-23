export function Footer() {
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
