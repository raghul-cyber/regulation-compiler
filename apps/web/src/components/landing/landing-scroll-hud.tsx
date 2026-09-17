'use client';

import { useEffect, useState } from 'react';
import { ArrowUp, Compass } from 'lucide-react';

interface SectionInfo {
  id: string;
  label: string;
  code: string;
}

const SECTIONS: SectionInfo[] = [
  { id: 'hero', label: 'Core', code: '01' },
  { id: 'problem', label: 'Problem', code: '02' },
  { id: 'transformation', label: 'Transform', code: '03' },
  { id: 'how-it-works', label: 'Pipeline', code: '04' },
  { id: 'interactive', label: 'Field', code: '05' },
  { id: 'architecture', label: 'Arch', code: '06' },
  { id: 'security', label: 'Security', code: '07' },
  { id: 'use-cases', label: 'Scope', code: '08' },
];

export function LandingScrollHUD() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSection, setActiveSection] = useState('hero');
  const [isScrolled, setIsScrolled] = useState(false);
  const [zDepth, setZDepth] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
      
      setScrollProgress(Math.min(Math.max(scrolled, 0), 100));
      setIsScrolled(winScroll > 250);
      setZDepth(Math.round(winScroll * 0.12));

      // Calculate active section based on element positions
      const sectionElements = SECTIONS.map(s => document.getElementById(s.id));
      const scrollMiddle = winScroll + window.innerHeight * 0.35;

      for (let i = sectionElements.length - 1; i >= 0; i--) {
        const el = sectionElements[i];
        if (el && el.offsetTop <= scrollMiddle) {
          setActiveSection(SECTIONS[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

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

      {/* 2. Floating Cybernetic HUD & Telemetry Capsule (Fixed bottom-6 right-6) */}
      <div className="fixed bottom-6 right-6 z-40 pointer-events-auto hidden md:flex flex-col items-end gap-2 font-mono">
        <div className="p-3 rounded-2xl bg-[#080D13]/90 border border-[#17222C] backdrop-blur-xl shadow-2xl shadow-black/90 text-xs flex flex-col gap-2.5 transition-all duration-300 hover:border-[#1E2C38]">
          {/* Status Header */}
          <div className="flex items-center justify-between gap-4 pb-2 border-b border-[#17222C]">
            <div className="flex items-center gap-2 text-[#9AA9B5] text-[11px]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#67D6A0] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#67D6A0]" />
              </span>
              <span className="tracking-wider uppercase text-[#F2F6F8] font-semibold text-[10px]">
                COMPLIANCE FIELD
              </span>
            </div>
            <div className="text-[10px] text-[#5CC8FF] font-bold bg-[#5CC8FF15] px-2 py-0.5 rounded border border-[#5CC8FF30]">
              Z-DEPTH -{zDepth}m
            </div>
          </div>

          {/* Active Section Tracker */}
          <div className="flex items-center gap-1 pt-0.5">
            {SECTIONS.map((sec) => {
              const isActive = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => scrollTo(sec.id)}
                  title={`${sec.code} // ${sec.label}`}
                  className={`group relative px-2 py-1 rounded-lg text-[10px] font-semibold transition-all duration-200 cursor-pointer ${
                    isActive 
                      ? 'bg-[#5CC8FF20] text-[#5CC8FF] border border-[#5CC8FF40] shadow-[0_0_10px_rgba(92,200,255,0.2)]' 
                      : 'text-[#62717C] hover:text-[#9AA9B5] hover:bg-[#17222C]/50 border border-transparent'
                  }`}
                >
                  <span>{sec.code}</span>
                  <span className="hidden group-hover:inline-block absolute bottom-full mb-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-[#080D13] border border-[#17222C] text-[10px] text-[#F2F6F8] whitespace-nowrap shadow-lg">
                    {sec.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Metrics Footer */}
          <div className="flex items-center justify-between text-[10px] text-[#62717C] pt-1 border-t border-[#17222C]">
            <span className="flex items-center gap-1">
              <Compass className="w-3 h-3 text-[#5CC8FF]" />
              {SECTIONS.find(s => s.id === activeSection)?.label.toUpperCase()}
            </span>
            <span className="text-[#9AA9B5] font-semibold">{Math.round(scrollProgress)}% SCROLL</span>
          </div>
        </div>

        {/* Scroll To Top Quick Button */}
        {isScrolled && (
          <button
            onClick={scrollToTop}
            aria-label="Scroll to top"
            className="p-2 rounded-xl bg-[#080D13]/80 hover:bg-[#5CC8FF] border border-[#17222C] hover:border-[#5CC8FF] text-[#9AA9B5] hover:text-[#05070A] transition-all duration-200 backdrop-blur-md shadow-lg cursor-pointer"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        )}
      </div>
    </>
  );
}
