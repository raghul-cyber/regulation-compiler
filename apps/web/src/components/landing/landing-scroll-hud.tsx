'use client';

import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

export function LandingScrollHUD() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
      
      setScrollProgress(Math.min(Math.max(scrolled, 0), 100));
      setIsScrolled(winScroll > 250);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* 1. Ultra-thin Restrained Top Reading Indicator */}
      <div 
        className="fixed top-0 left-0 right-0 h-[2px] z-50 pointer-events-none bg-white/[0.04]"
      >
        <div 
          className="h-full bg-[#4D8FCC] transition-[width] duration-100 ease-out shadow-[0_0_8px_rgba(77,143,204,0.4)]"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Scroll To Top Quick Button (Fixed bottom-6 right-6) */}
      {isScrolled && (
        <div className="fixed bottom-6 right-6 z-40 pointer-events-auto font-mono">
          <button
            onClick={scrollToTop}
            aria-label="Scroll to top"
            className="p-2.5 rounded-[8px] bg-[#080A0E]/85 hover:bg-[#141922] border border-white/[0.08] hover:border-white/[0.16] text-[#9CA3AF] hover:text-[#F4F6F8] transition-all duration-200 backdrop-blur-md shadow-xl cursor-pointer"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  );
}
