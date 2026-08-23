'use client';
import dynamic from 'next/dynamic';
export const HeroScene = dynamic(() => import('@/components/3d/hero-scene').then(mod => mod.HeroScene), { ssr: false });
