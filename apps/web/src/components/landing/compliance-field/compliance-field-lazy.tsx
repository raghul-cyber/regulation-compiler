'use client';

import dynamic from 'next/dynamic';

export const ComplianceField = dynamic(
  () => import('./compliance-field').then((mod) => mod.ComplianceField),
  { ssr: false }
);
