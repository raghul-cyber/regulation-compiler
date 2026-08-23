'use client';
import dynamic from 'next/dynamic';
export const DashboardCanvas = dynamic(() => import('@/components/dashboard/dashboard-canvas'), { ssr: false });
