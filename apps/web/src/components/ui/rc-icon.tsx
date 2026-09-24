'use client';

import React from 'react';

export type RCIconName =
  // Regulation & Legal concepts
  | 'regulation'
  | 'legal-clause'
  | 'policy-doc'
  | 'numbered-section'
  | 'document'
  
  // Compilation & AST concepts
  | 'compiler'
  | 'pipeline'
  | 'syntax-tree'
  | 'transform-arrows'
  | 'brackets'
  | 'code-ast'
  
  // Compliance & Validation
  | 'compliance'
  | 'verification-mark'
  | 'policy-shield'
  | 'shield'
  | 'validation'
  | 'validation-grid'
  | 'check-structured'
  
  // Audit & Diagnostic
  | 'audit'
  | 'inspection-frame'
  | 'scan-lines'
  | 'diagnostic-layers'
  | 'system-probe'
  
  // Security & Cryptographic
  | 'security'
  | 'cryptographic-lock'
  | 'verified-boundary'
  | 'perimeter'
  | 'key'
  
  // Traceability & Evidence
  | 'traceability'
  | 'evidence-chain'
  | 'linked-nodes'
  | 'audit-trail'
  
  // Infrastructure & Core
  | 'database'
  | 'api'
  | 'report'
  | 'settings'
  | 'billing'
  | 'workspace'
  | 'activity'
  | 'search'
  | 'filter'
  | 'expand'
  | 'collapse'
  | 'globe'
  | 'clock'
  | 'terminal'
  | 'copy'
  | 'download'
  | 'external-link';

interface RCIconProps extends React.SVGProps<SVGSVGElement> {
  name: RCIconName;
  size?: number | string;
  className?: string;
  strokeWidth?: number;
}

export function RCIcon({
  name,
  size = 16,
  className = '',
  strokeWidth = 1.75,
  ...props
}: RCIconProps) {
  const commonProps = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className: `shrink-0 ${className}`,
    ...props,
  };

  switch (name) {
    // ----------------------------------------------------
    // REGULATION & LEGAL CONCEPTS
    // ----------------------------------------------------
    case 'regulation':
    case 'document':
      return (
        <svg {...commonProps}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="8" y1="13" x2="16" y2="13" />
          <line x1="8" y1="17" x2="13" y2="17" />
        </svg>
      );

    case 'legal-clause':
    case 'numbered-section':
      return (
        <svg {...commonProps}>
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
          <path d="M6 6h10" />
          <path d="M6 10h10" />
          <path d="M6 14h7" />
          <circle cx="17" cy="14" r="1.5" />
        </svg>
      );

    case 'policy-doc':
      return (
        <svg {...commonProps}>
          <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
          <path d="M14 2v4a2 2 0 0 0 2 2h4" />
          <path d="m9 15 2 2 4-4" />
        </svg>
      );

    // ----------------------------------------------------
    // COMPILATION & AST CONCEPTS
    // ----------------------------------------------------
    case 'compiler':
    case 'code-ast':
      return (
        <svg {...commonProps}>
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
          <line x1="14" y1="4" x2="10" y2="20" />
        </svg>
      );

    case 'pipeline':
      return (
        <svg {...commonProps}>
          <rect x="3" y="3" width="6" height="6" rx="1" />
          <rect x="15" y="3" width="6" height="6" rx="1" />
          <rect x="9" y="15" width="6" height="6" rx="1" />
          <path d="M6 9v3a3 3 0 0 0 3 3h3" />
          <path d="M18 9v3a3 3 0 0 1-3 3" />
        </svg>
      );

    case 'syntax-tree':
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="5" r="2.5" />
          <circle cx="6" cy="19" r="2.5" />
          <circle cx="18" cy="19" r="2.5" />
          <path d="M12 7.5v5" />
          <path d="M12 12.5 6 16.5" />
          <path d="M12 12.5l6 4" />
        </svg>
      );

    case 'transform-arrows':
      return (
        <svg {...commonProps}>
          <path d="M4 12h14" />
          <path d="m14 8 4 4-4 4" />
          <path d="M20 6v12" />
        </svg>
      );

    case 'brackets':
      return (
        <svg {...commonProps}>
          <path d="M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3" />
          <path d="M16 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3" />
        </svg>
      );

    // ----------------------------------------------------
    // COMPLIANCE & VALIDATION CONCEPTS
    // ----------------------------------------------------
    case 'compliance':
    case 'policy-shield':
    case 'shield':
      return (
        <svg {...commonProps}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <polyline points="9 12 11 14 15 10" />
        </svg>
      );

    case 'verification-mark':
    case 'validation':
    case 'check-structured':
      return (
        <svg {...commonProps}>
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <path d="m8 12 3 3 5-6" />
        </svg>
      );

    case 'validation-grid':
      return (
        <svg {...commonProps}>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <path d="m5.5 6.5 1 1 2-2" />
          <path d="m16.5 6.5 1 1 2-2" />
          <path d="m16.5 17.5 1 1 2-2" />
        </svg>
      );

    // ----------------------------------------------------
    // AUDIT & SYSTEM INSPECTION
    // ----------------------------------------------------
    case 'audit':
    case 'inspection-frame':
      return (
        <svg {...commonProps}>
          <path d="M4 8V5a1 1 0 0 1 1-1h3" />
          <path d="M16 4h3a1 1 0 0 1 1 1v3" />
          <path d="M20 16v3a1 1 0 0 1-1 1h-3" />
          <path d="M8 20H5a1 1 0 0 1-1-1v-3" />
          <circle cx="12" cy="12" r="3" />
          <line x1="12" y1="7" x2="12" y2="9" />
          <line x1="12" y1="15" x2="12" y2="17" />
        </svg>
      );

    case 'scan-lines':
    case 'system-probe':
      return (
        <svg {...commonProps}>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <line x1="7" y1="9" x2="17" y2="9" />
          <line x1="7" y1="13" x2="14" y2="13" />
          <line x1="3" y1="11" x2="21" y2="11" strokeDasharray="2 2" />
        </svg>
      );

    case 'diagnostic-layers':
      return (
        <svg {...commonProps}>
          <path d="m12 2 9 4.5-9 4.5-9-4.5z" />
          <path d="m3 12 9 4.5 9-4.5" />
          <path d="m3 17 9 4.5 9-4.5" />
        </svg>
      );

    // ----------------------------------------------------
    // SECURITY & BOUNDARY
    // ----------------------------------------------------
    case 'security':
    case 'cryptographic-lock':
      return (
        <svg {...commonProps}>
          <rect x="4" y="11" width="16" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          <circle cx="12" cy="16" r="1.5" />
        </svg>
      );

    case 'verified-boundary':
    case 'perimeter':
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
          <path d="M9 3.5h6" />
        </svg>
      );

    case 'key':
      return (
        <svg {...commonProps}>
          <circle cx="7.5" cy="15.5" r="4.5" />
          <path d="m10.7 12.3 8.3-8.3" />
          <path d="m16 7 2 2" />
          <path d="m18 5 2 2" />
        </svg>
      );

    // ----------------------------------------------------
    // TRACEABILITY & EVIDENCE
    // ----------------------------------------------------
    case 'traceability':
    case 'evidence-chain':
      return (
        <svg {...commonProps}>
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      );

    case 'linked-nodes':
    case 'audit-trail':
      return (
        <svg {...commonProps}>
          <circle cx="5" cy="6" r="2.5" />
          <circle cx="19" cy="6" r="2.5" />
          <circle cx="12" cy="18" r="2.5" />
          <line x1="7.5" y1="6" x2="16.5" y2="6" />
          <line x1="6.5" y1="8" x2="10.5" y2="16" />
          <line x1="17.5" y1="8" x2="13.5" y2="16" />
        </svg>
      );

    // ----------------------------------------------------
    // INFRASTRUCTURE & UTILITY
    // ----------------------------------------------------
    case 'database':
      return (
        <svg {...commonProps}>
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
          <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
        </svg>
      );

    case 'api':
      return (
        <svg {...commonProps}>
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      );

    case 'report':
      return (
        <svg {...commonProps}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      );

    case 'settings':
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      );

    case 'billing':
      return (
        <svg {...commonProps}>
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
          <line x1="6" y1="15" x2="9" y2="15" />
        </svg>
      );

    case 'workspace':
      return (
        <svg {...commonProps}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="9" y1="21" x2="9" y2="9" />
        </svg>
      );

    case 'activity':
      return (
        <svg {...commonProps}>
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      );

    case 'search':
      return (
        <svg {...commonProps}>
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      );

    case 'filter':
      return (
        <svg {...commonProps}>
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
      );

    case 'expand':
      return (
        <svg {...commonProps}>
          <polyline points="15 3 21 3 21 9" />
          <polyline points="9 21 3 21 3 15" />
          <line x1="21" y1="3" x2="14" y2="10" />
          <line x1="3" y1="21" x2="10" y2="14" />
        </svg>
      );

    case 'collapse':
      return (
        <svg {...commonProps}>
          <polyline points="4 14 10 14 10 20" />
          <polyline points="20 10 14 10 14 4" />
          <line x1="14" y1="10" x2="21" y2="3" />
          <line x1="3" y1="21" x2="10" y2="14" />
        </svg>
      );

    case 'globe':
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      );

    case 'clock':
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      );

    case 'terminal':
      return (
        <svg {...commonProps}>
          <polyline points="4 17 10 11 4 5" />
          <line x1="12" y1="19" x2="20" y2="19" />
        </svg>
      );

    case 'copy':
      return (
        <svg {...commonProps}>
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      );

    case 'download':
      return (
        <svg {...commonProps}>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      );

    case 'external-link':
      return (
        <svg {...commonProps}>
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      );

    default:
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
  }
}
