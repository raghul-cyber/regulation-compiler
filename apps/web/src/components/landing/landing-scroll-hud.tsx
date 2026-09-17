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
      {/* 1. Ultra-thin Top Glowing Scroll Progress Laser Line */}
      <div 
        className="fixed top-0 left-0 right-0 h-[2px] z-50 pointer-events-none bg-[#080D13]/60"
      >
        <div 
          className="h-full bg-gradient-to-r from-[#2D718F] via-[#5CC8FF] to-[#67D6A0] transition-[width] duration-75 ease-out shadow-[0_0_10px_rgba(92,200,255,0.7)]"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Scroll To Top Quick Button (Fixed bottom-6 right-6) */}
      {isScrolled && (
        <div className="fixed bottom-6 right-6 z-40 pointer-events-auto font-mono">
          <button
            onClick={scrollToTop}
            aria-label="Scroll to top"
            className="p-2.5 rounded-xl bg-[#080D13]/80 hover:bg-[#5CC8FF] border border-[#17222C] hover:border-[#5CC8FF] text-[#9AA9B5] hover:text-[#05070A] transition-all duration-200 backdrop-blur-md shadow-lg cursor-pointer"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  );
}
