'use client';

import React, { forwardRef } from 'react';
import Link from 'next/link';
import { RCIcon, RCIconName } from './rc-icon';

/* ==========================================================================
   RC BUTTON
   ========================================================================== */
export interface RCButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  icon?: RCIconName;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  href?: string;
}

export const RCButton = forwardRef<HTMLButtonElement, RCButtonProps>(function RCButton(
  {
    children,
    variant = 'primary',
    size = 'md',
    icon,
    iconPosition = 'left',
    loading = false,
    disabled = false,
    className = '',
    href,
    ...props
  },
  ref
) {
  const baseClasses =
    'inline-flex items-center justify-center font-medium select-none transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090B0E] disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed';

  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5 rounded-[5px] gap-1.5 h-8',
    md: 'text-xs sm:text-sm px-4 py-2 rounded-[6px] gap-2 h-9 sm:h-10',
    lg: 'text-sm sm:text-base px-6 py-2.5 rounded-[8px] gap-2.5 h-11 sm:h-12',
    icon: 'p-2 rounded-[6px] w-9 h-9',
  }[size];

  const variantClasses = {
    primary:
      'bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-[0_1px_2px_rgba(0,0,0,0.4)] border border-[#3B82F6]/30 active:scale-[0.98]',
    secondary:
      'bg-[#12161F] hover:bg-[#181E29] text-[#F1F5F9] border border-white/[0.08] hover:border-white/[0.14] active:scale-[0.98]',
    outline:
      'bg-transparent hover:bg-white/[0.04] text-[#F1F5F9] border border-white/[0.12] hover:border-white/[0.20] active:scale-[0.98]',
    ghost:
      'bg-transparent hover:bg-white/[0.05] text-[#94A3B8] hover:text-[#F1F5F9] active:scale-[0.98]',
    danger:
      'bg-[#EF4444]/10 hover:bg-[#EF4444]/20 text-[#F87171] border border-[#EF4444]/30 hover:border-[#EF4444]/50 active:scale-[0.98]',
  }[variant];

  const content = (
    <>
      {loading ? (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
      ) : icon && iconPosition === 'left' ? (
        <RCIcon name={icon} size={size === 'sm' ? 14 : 16} />
      ) : null}

      {children && <span>{children}</span>}

      {!loading && icon && iconPosition === 'right' ? (
        <RCIcon name={icon} size={size === 'sm' ? 14 : 16} />
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {content}
    </button>
  );
});

/* ==========================================================================
   RC INPUT
   ========================================================================== */
export interface RCInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: RCIconName;
  error?: string;
  label?: string;
  badge?: string;
}

export const RCInput = forwardRef<HTMLInputElement, RCInputProps>(function RCInput(
  { icon, error, label, badge, className = '', id, ...props },
  ref
) {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {(label || badge) && (
        <div className="flex items-center justify-between text-xs">
          {label && (
            <label htmlFor={id} className="text-[#94A3B8] font-medium tracking-wide">
              {label}
            </label>
          )}
          {badge && (
            <span className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider">
              {badge}
            </span>
          )}
        </div>
      )}
      <div className="relative flex items-center w-full">
        {icon && (
          <div className="absolute left-3 text-[#64748B] pointer-events-none flex items-center">
            <RCIcon name={icon} size={15} />
          </div>
        )}
        <input
          ref={ref}
          id={id}
          className={`w-full bg-[#0C0F14] text-[#F1F5F9] placeholder:text-[#475569] text-xs sm:text-sm rounded-[6px] border border-white/[0.08] hover:border-white/[0.14] focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all outline-none h-9 sm:h-10 ${
            icon ? 'pl-9 pr-3' : 'px-3'
          } ${error ? 'border-[#EF4444]/60 focus:border-[#EF4444]' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <span className="text-[11px] text-[#F87171]">{error}</span>}
    </div>
  );
});

/* ==========================================================================
   RC CARD & PANEL
   ========================================================================== */
export interface RCCardProps extends React.HTMLAttributes<HTMLDivElement> {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  variant?: 'default' | 'elevated' | 'subtle';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function RCCard({
  children,
  header,
  footer,
  variant = 'default',
  padding = 'md',
  className = '',
  ...props
}: RCCardProps) {
  const variantClasses = {
    default: 'bg-[#0E1218] border border-white/[0.07] shadow-[0_2px_8px_rgba(0,0,0,0.4)]',
    elevated: 'bg-[#131821] border border-white/[0.10] shadow-[0_4px_20px_rgba(0,0,0,0.6)]',
    subtle: 'bg-[#0A0D12] border border-white/[0.04]',
  }[variant];

  const paddingClasses = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-6 sm:p-8',
  }[padding];

  return (
    <div
      className={`rounded-[8px] overflow-hidden text-left ${variantClasses} ${className}`}
      {...props}
    >
      {header && (
        <div className="px-5 py-3.5 border-b border-white/[0.06] bg-white/[0.01]">
          {header}
        </div>
      )}
      <div className={paddingClasses}>{children}</div>
      {footer && (
        <div className="px-5 py-3 border-t border-white/[0.06] bg-white/[0.01]">
          {footer}
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
   RC STATUS BADGE
   ========================================================================== */
export type RCStatusType =
  | 'PASS'
  | 'FAIL'
  | 'WARNING'
  | 'INFO'
  | 'CRITICAL'
  | 'HIGH'
  | 'MEDIUM'
  | 'LOW'
  | 'NOT ASSESSED'
  | 'PENDING';

export function RCStatus({ status, className = '' }: { status: RCStatusType; className?: string }) {
  const styles: Record<RCStatusType, { bg: string; text: string; border: string; dot: string }> = {
    PASS: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/25',
      dot: 'bg-emerald-400',
    },
    FAIL: {
      bg: 'bg-rose-500/10',
      text: 'text-rose-400',
      border: 'border-rose-500/25',
      dot: 'bg-rose-400',
    },
    WARNING: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/25',
      dot: 'bg-amber-400',
    },
    INFO: {
      bg: 'bg-blue-500/10',
      text: 'text-blue-400',
      border: 'border-blue-500/25',
      dot: 'bg-blue-400',
    },
    CRITICAL: {
      bg: 'bg-rose-600/15',
      text: 'text-rose-300 font-semibold',
      border: 'border-rose-600/35',
      dot: 'bg-rose-500',
    },
    HIGH: {
      bg: 'bg-rose-500/10',
      text: 'text-rose-400',
      border: 'border-rose-500/25',
      dot: 'bg-rose-400',
    },
    MEDIUM: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/25',
      dot: 'bg-amber-400',
    },
    LOW: {
      bg: 'bg-blue-500/10',
      text: 'text-blue-400',
      border: 'border-blue-500/25',
      dot: 'bg-blue-400',
    },
    'NOT ASSESSED': {
      bg: 'bg-zinc-800/40',
      text: 'text-zinc-400',
      border: 'border-zinc-700/30',
      dot: 'bg-zinc-500',
    },
    PENDING: {
      bg: 'bg-blue-500/10',
      text: 'text-blue-300',
      border: 'border-blue-500/20',
      dot: 'bg-blue-400 animate-pulse',
    },
  };

  const s = styles[status] || styles['INFO'];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] text-[10px] font-mono tracking-wider uppercase border ${s.bg} ${s.text} ${s.border} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot} shrink-0`} />
      <span>{status}</span>
    </span>
  );
}

/* ==========================================================================
   RC BADGE (General semantic tag)
   ========================================================================== */
export function RCBadge({
  children,
  variant = 'default',
  className = '',
}: {
  children: React.ReactNode;
  variant?: 'default' | 'accent' | 'success' | 'warning' | 'mono';
  className?: string;
}) {
  const variantStyles = {
    default: 'bg-white/[0.05] text-[#94A3B8] border-white/[0.08]',
    accent: 'bg-[#2563EB]/15 text-[#60A5FA] border-[#2563EB]/30',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
    mono: 'bg-[#0A0D12] text-[#94A3B8] border-white/[0.08] font-mono text-[10px] uppercase tracking-wider',
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-xs border ${variantStyles} ${className}`}
    >
      {children}
    </span>
  );
}

/* ==========================================================================
   RC METRIC
   ========================================================================== */
export function RCMetric({
  label,
  value,
  unit,
  delta,
  deltaType = 'positive',
  subtext,
  icon,
}: {
  label: string;
  value: string | number;
  unit?: string;
  delta?: string;
  deltaType?: 'positive' | 'negative' | 'neutral';
  subtext?: string;
  icon?: RCIconName;
}) {
  const deltaColor = {
    positive: 'text-emerald-400',
    negative: 'text-rose-400',
    neutral: 'text-zinc-400',
  }[deltaType];

  return (
    <div className="flex flex-col gap-1 p-4 rounded-[8px] bg-[#0E1218] border border-white/[0.07]">
      <div className="flex items-center justify-between text-xs text-[#8B949E]">
        <span className="font-medium tracking-wide uppercase text-[10px]">{label}</span>
        {icon && <RCIcon name={icon} size={14} className="text-[#64748B]" />}
      </div>
      <div className="flex items-baseline gap-1.5 mt-1">
        <span className="text-2xl font-bold tracking-tight text-[#F1F5F9] font-mono">{value}</span>
        {unit && <span className="text-xs text-[#8B949E] font-mono">{unit}</span>}
        {delta && <span className={`text-[11px] font-mono ml-auto ${deltaColor}`}>{delta}</span>}
      </div>
      {subtext && <span className="text-[11px] text-[#64748B] mt-0.5">{subtext}</span>}
    </div>
  );
}

/* ==========================================================================
   RC DATA BLOCK (AST / Machine-readable property inspector)
   ========================================================================== */
export function RCDataBlock({
  properties,
  className = '',
}: {
  properties: { label: string; value: string | number | boolean; highlight?: boolean }[];
  className?: string;
}) {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-[6px] bg-[#0A0D12] border border-white/[0.06] font-mono text-xs ${className}`}>
      {properties.map((prop, idx) => (
        <div key={idx} className="flex flex-col gap-0.5">
          <span className="text-[10px] text-[#64748B] uppercase tracking-wider">{prop.label}</span>
          <span className={`font-semibold ${prop.highlight ? 'text-[#3B82F6]' : 'text-[#E2E8F0]'}`}>
            {String(prop.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ==========================================================================
   RC TABLE SYSTEM
   ========================================================================== */
export function RCTable({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`w-full overflow-x-auto rounded-[8px] border border-white/[0.07] bg-[#0E1218] ${className}`}>
      <table className="w-full text-left text-xs sm:text-sm text-[#94A3B8] border-collapse">
        {children}
      </table>
    </div>
  );
}

export function RCTableHeader({ children }: { children: React.ReactNode }) {
  return (
    <thead className="bg-[#0A0D12] text-[#64748B] font-mono text-[11px] uppercase tracking-wider border-b border-white/[0.07]">
      {children}
    </thead>
  );
}

export function RCTableRow({
  children,
  onClick,
  className = '',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <tr
      onClick={onClick}
      className={`border-b border-white/[0.04] transition-colors hover:bg-white/[0.02] ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </tr>
  );
}

export function RCTableCell({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-4 py-3 align-middle text-[#E2E8F0] ${className}`}>{children}</td>;
}

/* ==========================================================================
   RC LOADING PROGRESS BAR (Zero generic sparkles)
   ========================================================================== */
export function RCLoadingBar({
  progress,
  label,
  sublabel,
}: {
  progress: number;
  label?: string;
  sublabel?: string;
}) {
  return (
    <div className="w-full flex flex-col gap-1.5 font-mono">
      {(label || sublabel) && (
        <div className="flex items-center justify-between text-xs">
          {label && <span className="text-[#E2E8F0]">{label}</span>}
          {sublabel && <span className="text-[#64748B] text-[11px]">{sublabel}</span>}
        </div>
      )}
      <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className="h-full bg-[#2563EB] transition-all duration-300 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
}

/* ==========================================================================
   RC EMPTY STATE
   ========================================================================== */
export function RCEmptyState({
  title,
  description,
  action,
  icon = 'document',
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: RCIconName;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-[8px] border border-dashed border-white/[0.10] bg-[#0A0D12]">
      <div className="w-10 h-10 rounded-[6px] bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[#64748B] mb-3">
        <RCIcon name={icon} size={20} />
      </div>
      <h3 className="text-sm sm:text-base font-semibold text-[#F1F5F9]">{title}</h3>
      <p className="mt-1 text-xs text-[#8B949E] max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
