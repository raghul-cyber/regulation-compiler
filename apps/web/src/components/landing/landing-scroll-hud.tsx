'use client';

import { useEffect, useState } from 'react';
import { ArrowUp, Activity, Compass } from 'lucide-react';

interface SectionInfo {
  id: string;
  label: string;
  code: string;
}

const SECTIONS: SectionInfo[] = [
  { id: 'hero', label: 'Core Engine', code: '01' },
  { id: 'about', label: 'Paradigm Shift', code: '02' },
  { id: 'pipeline', label: 'Architecture', code: '03' },
  { id: 'capabilities', label: 'Capabilities', code: '04' },
  { id: 'jurisdictions', label: 'Coverage', code: '05' },
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
      setZDepth(Math.round(winScroll * 0.15));

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
    onScroll(); // initial check

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
        className="fixed top-0 left-0 right-0 h-[2px] z-50 pointer-events-none bg-zinc-900/50"
      >
        <div 
          className="h-full bg-gradient-to-r from-blue-600 via-cyan-400 to-indigo-500 transition-[width] duration-75 ease-out shadow-[0_0_12px_rgba(56,189,248,0.8)]"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* 2. Floating Cybernetic HUD & Telemetry Capsule (Fixed bottom-right on desktop) */}
      <div className="fixed bottom-6 right-6 z-40 pointer-events-auto hidden md:flex flex-col items-end gap-2 font-mono">
        <div className="p-3 rounded-2xl bg-[#090b12]/90 border border-blue-500/20 backdrop-blur-xl shadow-2xl shadow-blue-500/10 text-xs flex flex-col gap-2.5 transition-all duration-300 hover:border-blue-500/40">
          {/* Status Header */}
          <div className="flex items-center justify-between gap-4 pb-2 border-b border-zinc-800/80">
            <div className="flex items-center gap-2 text-zinc-400 text-[11px]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="tracking-wider uppercase text-zinc-300 font-semibold">GRID COMPILER</span>
            </div>
            <div className="text-[10px] text-cyan-400 font-bold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
              DEPTH -{zDepth}m
            </div>
          </div>

          {/* Active Section Tracker */}
          <div className="flex items-center gap-1.5 pt-0.5">
            {SECTIONS.map((sec) => {
              const isActive = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => scrollTo(sec.id)}
                  title={`${sec.code} // ${sec.label}`}
                  className={`group relative px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all duration-200 cursor-pointer ${
                    isActive 
                      ? 'bg-blue-600/30 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(34,211,238,0.25)]' 
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 border border-transparent'
                  }`}
                >
                  <span>{sec.code}</span>
                  <span className="hidden group-hover:inline-block absolute bottom-full mb-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-[10px] text-zinc-200 whitespace-nowrap shadow-lg">
                    {sec.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Metrics Footer */}
          <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1 border-t border-zinc-800/60">
            <span className="flex items-center gap-1">
              <Compass className="w-3 h-3 text-blue-400" />
              {SECTIONS.find(s => s.id === activeSection)?.label.toUpperCase()}
            </span>
            <span className="text-zinc-400 font-semibold">{Math.round(scrollProgress)}% SCROLL</span>
          </div>
        </div>

        {/* Scroll To Top Quick Button */}
        {isScrolled && (
          <button
            onClick={scrollToTop}
            aria-label="Scroll to top"
            className="p-2 rounded-xl bg-zinc-900/80 hover:bg-blue-600 border border-zinc-800 hover:border-blue-500 text-zinc-400 hover:text-white transition-all duration-200 backdrop-blur-md shadow-lg cursor-pointer"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        )}
      </div>
    </>
  );
}
