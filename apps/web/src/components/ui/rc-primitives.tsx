'use client';

import React, { forwardRef, useState } from 'react';
import Link from 'next/link';
import { RCIcon, RCIconName } from './rc-icon';

/* ==========================================================================
   RC BUTTON
   ========================================================================== */
export interface RCButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'champagne';
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
    'inline-flex items-center justify-center font-medium select-none transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4D8FCC]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050608] disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed';

  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5 rounded-[5px] gap-1.5 h-8',
    md: 'text-xs sm:text-sm px-4 py-2 rounded-[6px] gap-2 h-9 sm:h-10',
    lg: 'text-sm sm:text-base px-6 py-2.5 rounded-[8px] gap-2.5 h-11 sm:h-12',
    icon: 'p-2 rounded-[6px] w-9 h-9',
  }[size];

  const variantClasses = {
    primary:
      'bg-[#4D8FCC] hover:bg-[#3B72A8] text-white shadow-[0_1px_2px_rgba(0,0,0,0.4)] border border-[#79B5EC]/30 active:scale-[0.98]',
    secondary:
      'bg-[#0B0E14] hover:bg-[#141922] text-[#F4F6F8] border border-white/[0.06] hover:border-white/[0.12] active:scale-[0.98]',
    outline:
      'bg-transparent hover:bg-white/[0.03] text-[#F4F6F8] border border-white/[0.08] hover:border-white/[0.16] active:scale-[0.98]',
    ghost:
      'bg-transparent hover:bg-white/[0.04] text-[#9CA3AF] hover:text-[#F4F6F8] active:scale-[0.98]',
    danger:
      'bg-[#EF4444]/10 hover:bg-[#EF4444]/20 text-[#F87171] border border-[#EF4444]/30 hover:border-[#EF4444]/50 active:scale-[0.98]',
    champagne:
      'bg-[#C9B88A]/15 hover:bg-[#C9B88A]/25 text-[#E6DCBF] border border-[#C9B88A]/35 active:scale-[0.98]',
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
   RC INPUT & TEXTAREA
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
            <label htmlFor={id} className="text-[#9CA3AF] font-medium tracking-wide">
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
          className={`w-full bg-[#080A0E] text-[#F4F6F8] placeholder:text-[#475569] text-xs sm:text-sm rounded-[6px] border border-white/[0.06] hover:border-white/[0.12] focus:border-[#4D8FCC] focus:ring-1 focus:ring-[#4D8FCC] transition-all outline-none h-9 sm:h-10 ${
            icon ? 'pl-9 pr-3' : 'px-3'
          } ${error ? 'border-[#EF4444]/60 focus:border-[#EF4444]' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <span className="text-[11px] text-[#F87171]">{error}</span>}
    </div>
  );
});

export interface RCTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const RCTextarea = forwardRef<HTMLTextAreaElement, RCTextareaProps>(function RCTextarea(
  { label, error, className = '', id, ...props },
  ref
) {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-[#9CA3AF] text-xs font-medium tracking-wide">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={id}
        className={`w-full bg-[#080A0E] text-[#F4F6F8] placeholder:text-[#475569] text-xs sm:text-sm rounded-[6px] border border-white/[0.06] hover:border-white/[0.12] focus:border-[#4D8FCC] focus:ring-1 focus:ring-[#4D8FCC] p-3 transition-all outline-none resize-y min-h-[90px] ${
          error ? 'border-[#EF4444]/60 focus:border-[#EF4444]' : ''
        } ${className}`}
        {...props}
      />
      {error && <span className="text-[11px] text-[#F87171]">{error}</span>}
    </div>
  );
});

/* ==========================================================================
   RC SELECT
   ========================================================================== */
export interface RCSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options?: { value: string; label: string }[];
}

export const RCSelect = forwardRef<HTMLSelectElement, RCSelectProps>(function RCSelect(
  { label, error, options, children, className = '', id, ...props },
  ref
) {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-[#9CA3AF] text-xs font-medium tracking-wide">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={id}
        className={`w-full bg-[#080A0E] text-[#F4F6F8] text-xs sm:text-sm rounded-[6px] border border-white/[0.06] hover:border-white/[0.12] focus:border-[#4D8FCC] focus:ring-1 focus:ring-[#4D8FCC] px-3 h-9 sm:h-10 transition-all outline-none cursor-pointer ${
          error ? 'border-[#EF4444]/60' : ''
        } ${className}`}
        {...props}
      >
        {options ? options.map(opt => (
          <option key={opt.value} value={opt.value} className="bg-[#080A0E] text-[#F4F6F8]">
            {opt.label}
          </option>
        )) : children}
      </select>
      {error && <span className="text-[11px] text-[#F87171]">{error}</span>}
    </div>
  );
});

/* ==========================================================================
   RC CHECKBOX & SWITCH
   ========================================================================== */
export function RCCheckbox({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  className = '',
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <label className={`flex items-start gap-2.5 cursor-pointer select-none ${disabled ? 'opacity-50 pointer-events-none' : ''} ${className}`}>
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`w-4 h-4 rounded-[4px] border transition-all mt-0.5 flex items-center justify-center cursor-pointer ${
          checked
            ? 'bg-[#4D8FCC] border-[#4D8FCC] text-white'
            : 'bg-[#080A0E] border-white/[0.12] hover:border-white/[0.24]'
        }`}
      >
        {checked && (
          <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="2 6 5 9 10 3" />
          </svg>
        )}
      </button>
      {(label || description) && (
        <div className="flex flex-col text-left">
          {label && <span className="text-xs font-medium text-[#F4F6F8]">{label}</span>}
          {description && <span className="text-[11px] text-[#9CA3AF] mt-0.5">{description}</span>}
        </div>
      )}
    </label>
  );
}

export function RCSwitch({
  checked,
  onChange,
  label,
  disabled = false,
  className = '',
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <label className={`flex items-center gap-3 cursor-pointer select-none ${disabled ? 'opacity-50 pointer-events-none' : ''} ${className}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`w-9 h-5 rounded-full transition-colors relative p-0.5 cursor-pointer border ${
          checked ? 'bg-[#4D8FCC] border-[#4D8FCC]' : 'bg-[#0E1218] border-white/[0.08]'
        }`}
      >
        <div
          className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
      {label && <span className="text-xs font-medium text-[#F4F6F8]">{label}</span>}
    </label>
  );
}

/* ==========================================================================
   RC CARD & PANEL & SECTION
   ========================================================================== */
export interface RCCardProps extends React.HTMLAttributes<HTMLDivElement> {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  variant?: 'default' | 'elevated' | 'subtle' | 'glass';
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
    default: 'bg-[#080A0E] border border-white/[0.06] shadow-[0_2px_8px_rgba(0,0,0,0.4)]',
    elevated: 'bg-[#0B0E14] border border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.6)]',
    subtle: 'bg-[#050608] border border-white/[0.04]',
    glass: 'bg-[#080A0E]/80 backdrop-blur-md border border-white/[0.07] shadow-xl',
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
        <div className="px-5 py-3.5 border-b border-white/[0.05] bg-white/[0.01]">
          {header}
        </div>
      )}
      <div className={paddingClasses}>{children}</div>
      {footer && (
        <div className="px-5 py-3 border-t border-white/[0.05] bg-white/[0.01]">
          {footer}
        </div>
      )}
    </div>
  );
}

export function RCPanel({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`p-5 rounded-[8px] bg-[#080A0E] border border-white/[0.06] ${className}`}>
      {children}
    </div>
  );
}

export function RCSection({
  title,
  subtitle,
  action,
  children,
  className = '',
}: {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`w-full flex flex-col gap-4 ${className}`}>
      {(title || action) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-white/[0.05]">
          <div>
            {title && <h2 className="text-base sm:text-lg font-bold text-[#F4F6F8] tracking-tight">{title}</h2>}
            {subtitle && <p className="text-xs text-[#9CA3AF] mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="self-start sm:self-auto">{action}</div>}
        </div>
      )}
      {children}
    </section>
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
  | 'PENDING'
  | 'RUNNING'
  | 'COMPLETED'
  | 'ERROR';

export function RCStatus({ status, className = '' }: { status: RCStatusType; className?: string }) {
  const styles: Record<RCStatusType, { bg: string; text: string; border: string; dot: string }> = {
    PASS: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/25',
      dot: 'bg-emerald-400',
    },
    COMPLETED: {
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
    ERROR: {
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
      bg: 'bg-[#4D8FCC]/10',
      text: 'text-[#79B5EC]',
      border: 'border-[#4D8FCC]/25',
      dot: 'bg-[#4D8FCC]',
    },
    RUNNING: {
      bg: 'bg-[#4D8FCC]/10',
      text: 'text-[#79B5EC]',
      border: 'border-[#4D8FCC]/25',
      dot: 'bg-[#4D8FCC] animate-pulse',
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
      bg: 'bg-[#4D8FCC]/10',
      text: 'text-[#79B5EC]',
      border: 'border-[#4D8FCC]/25',
      dot: 'bg-[#4D8FCC]',
    },
    'NOT ASSESSED': {
      bg: 'bg-zinc-800/40',
      text: 'text-zinc-400',
      border: 'border-zinc-700/30',
      dot: 'bg-zinc-500',
    },
    PENDING: {
      bg: 'bg-[#4D8FCC]/10',
      text: 'text-[#79B5EC]',
      border: 'border-[#4D8FCC]/20',
      dot: 'bg-[#4D8FCC] animate-pulse',
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
   RC BADGE
   ========================================================================== */
export function RCBadge({
  children,
  variant = 'default',
  className = '',
}: {
  children: React.ReactNode;
  variant?: 'default' | 'accent' | 'success' | 'warning' | 'mono' | 'champagne';
  className?: string;
}) {
  const variantStyles = {
    default: 'bg-white/[0.04] text-[#9CA3AF] border-white/[0.06]',
    accent: 'bg-[#4D8FCC]/12 text-[#79B5EC] border-[#4D8FCC]/25',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    mono: 'bg-[#080A0E] text-[#9CA3AF] border-white/[0.06] font-mono text-[10px] uppercase tracking-wider',
    champagne: 'bg-[#C9B88A]/12 text-[#E6DCBF] border-[#C9B88A]/25',
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
    <div className="flex flex-col gap-1 p-4 rounded-[8px] bg-[#080A0E] border border-white/[0.06]">
      <div className="flex items-center justify-between text-xs text-[#9CA3AF]">
        <span className="font-medium tracking-wide uppercase text-[10px]">{label}</span>
        {icon && <RCIcon name={icon} size={14} className="text-[#64748B]" />}
      </div>
      <div className="flex items-baseline gap-1.5 mt-1">
        <span className="text-2xl font-bold tracking-tight text-[#F4F6F8] font-mono">{value}</span>
        {unit && <span className="text-xs text-[#9CA3AF] font-mono">{unit}</span>}
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
    <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-[6px] bg-[#050608] border border-white/[0.05] font-mono text-xs ${className}`}>
      {properties.map((prop, idx) => (
        <div key={idx} className="flex flex-col gap-0.5">
          <span className="text-[10px] text-[#64748B] uppercase tracking-wider">{prop.label}</span>
          <span className={`font-semibold ${prop.highlight ? 'text-[#4D8FCC]' : 'text-[#E2E8F0]'}`}>
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
    <div className={`w-full overflow-x-auto rounded-[8px] border border-white/[0.06] bg-[#080A0E] ${className}`}>
      <table className="w-full text-left text-xs sm:text-sm text-[#9CA3AF] border-collapse">
        {children}
      </table>
    </div>
  );
}

export function RCTableHeader({ children }: { children: React.ReactNode }) {
  return (
    <thead className="bg-[#050608] text-[#64748B] font-mono text-[11px] uppercase tracking-wider border-b border-white/[0.06]">
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
      className={`border-b border-white/[0.035] transition-colors hover:bg-white/[0.02] ${
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
  return <td className={`px-4 py-3 align-middle text-[#F4F6F8] ${className}`}>{children}</td>;
}

/* ==========================================================================
   RC TABS
   ========================================================================== */
export function RCTabs({
  tabs,
  activeTab,
  onChange,
  className = '',
}: {
  tabs: { id: string; label: string; badge?: string; count?: number }[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div className={`flex gap-1 p-1 rounded-[8px] bg-[#050608] border border-white/[0.06] overflow-x-auto ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-[5px] whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              isActive
                ? 'bg-[#0B0E14] text-[#F4F6F8] border border-white/[0.08] shadow-sm font-semibold'
                : 'text-[#9CA3AF] hover:text-[#F4F6F8] hover:bg-white/[0.02] border border-transparent'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                isActive ? 'bg-[#4D8FCC]/20 text-[#79B5EC]' : 'bg-white/[0.05] text-[#64748B]'
              }`}>
                {tab.count}
              </span>
            )}
            {tab.badge && (
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#4D8FCC]/15 text-[#79B5EC] border border-[#4D8FCC]/30">
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ==========================================================================
   RC LOADING PROGRESS BAR & SKELETON
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
          {label && <span className="text-[#F4F6F8]">{label}</span>}
          {sublabel && <span className="text-[#64748B] text-[11px]">{sublabel}</span>}
        </div>
      )}
      <div className="w-full h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
        <div
          className="h-full bg-[#4D8FCC] transition-all duration-300 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
}

export function RCSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-[6px] bg-white/[0.04] border border-white/[0.02] ${className}`} />
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
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-[8px] border border-dashed border-white/[0.08] bg-[#050608]">
      <div className="w-10 h-10 rounded-[6px] bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-[#64748B] mb-3">
        <RCIcon name={icon} size={20} />
      </div>
      <h3 className="text-sm sm:text-base font-semibold text-[#F4F6F8]">{title}</h3>
      <p className="mt-1 text-xs text-[#9CA3AF] max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ==========================================================================
   RC ERROR STATE
   ========================================================================== */
export function RCErrorState({
  title = 'Something went wrong',
  error,
  onRetry,
}: {
  title?: string;
  error?: string | Error;
  onRetry?: () => void;
}) {
  const message = typeof error === 'string' ? error : error?.message || 'An unexpected operational failure occurred.';

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-[8px] border border-[#EF4444]/25 bg-[#EF4444]/05 my-4">
      <div className="w-10 h-10 rounded-[6px] bg-[#EF4444]/15 border border-[#EF4444]/30 flex items-center justify-center text-[#F87171] mb-3">
        <RCIcon name="audit" size={20} />
      </div>
      <h3 className="text-sm sm:text-base font-semibold text-[#F4F6F8]">{title}</h3>
      <p className="mt-1 text-xs text-[#F87171] font-mono max-w-md">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 px-3 py-1.5 rounded-[5px] text-xs font-mono bg-white/[0.06] hover:bg-white/[0.12] text-white border border-white/[0.10] transition-colors cursor-pointer"
        >
          Retry Operation
        </button>
      )}
    </div>
  );
}

/* ==========================================================================
   RC DIVIDER
   ========================================================================== */
export function RCDivider({ className = '' }: { className?: string }) {
  return <div className={`w-full h-px bg-white/[0.06] my-4 ${className}`} />;
}
