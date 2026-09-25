'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  X, 
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastAction {
  label: string;
  onClick: () => void;
  primary?: boolean;
}

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: ToastAction;
  secondaryAction?: ToastAction;
}

interface IntraAppToastContextValue {
  showToast: (options: Omit<ToastItem, 'id'>) => string;
  dismissToast: (id: string) => void;
  success: (title: string, message?: string, options?: Partial<Omit<ToastItem, 'id' | 'type' | 'title' | 'message'>>) => string;
  error: (title: string, message?: string, options?: Partial<Omit<ToastItem, 'id' | 'type' | 'title' | 'message'>>) => string;
  warning: (title: string, message?: string, options?: Partial<Omit<ToastItem, 'id' | 'type' | 'title' | 'message'>>) => string;
  info: (title: string, message?: string, options?: Partial<Omit<ToastItem, 'id' | 'type' | 'title' | 'message'>>) => string;
}

const IntraAppToastContext = createContext<IntraAppToastContextValue | null>(null);

export function IntraAppToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((options: Omit<ToastItem, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newToast: ToastItem = {
      id,
      duration: options.duration ?? 5000,
      ...options,
    };

    setToasts((prev) => [newToast, ...prev].slice(0, 5));
    return id;
  }, []);

  const success = useCallback(
    (title: string, message?: string, options?: Partial<Omit<ToastItem, 'id' | 'type' | 'title' | 'message'>>) => {
      return showToast({ type: 'success', title, message, ...options });
    },
    [showToast]
  );

  const error = useCallback(
    (title: string, message?: string, options?: Partial<Omit<ToastItem, 'id' | 'type' | 'title' | 'message'>>) => {
      return showToast({ type: 'error', title, message, duration: options?.duration ?? 7000, ...options });
    },
    [showToast]
  );

  const warning = useCallback(
    (title: string, message?: string, options?: Partial<Omit<ToastItem, 'id' | 'type' | 'title' | 'message'>>) => {
      return showToast({ type: 'warning', title, message, ...options });
    },
    [showToast]
  );

  const info = useCallback(
    (title: string, message?: string, options?: Partial<Omit<ToastItem, 'id' | 'type' | 'title' | 'message'>>) => {
      return showToast({ type: 'info', title, message, ...options });
    },
    [showToast]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleWindowAlertEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ message: string }>;
      const msg = customEvent.detail?.message || '';
      if (!msg) return;

      // Defer toast creation outside of the event dispatch cycle to avoid render conflicts
      setTimeout(() => {
        if (
          msg.toLowerCase().includes('complete') || 
          msg.toLowerCase().includes('success') || 
          msg.toLowerCase().includes('copied')
        ) {
          success('Notice', msg);
        } else if (
          msg.toLowerCase().includes('fail') || 
          msg.toLowerCase().includes('error')
        ) {
          error('Notice', msg);
        } else {
          info('Notice', msg);
        }
      }, 0);
    };

    window.addEventListener('intra-app-alert', handleWindowAlertEvent);
    return () => {
      window.removeEventListener('intra-app-alert', handleWindowAlertEvent);
    };
  }, [success, error, info]);

  return (
    <IntraAppToastContext.Provider value={{ showToast, dismissToast, success, error, warning, info }}>
      {children}
      {/* Intra-App Floating Notification Container */}
      <div 
        aria-live="polite" 
        className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 max-w-md w-[calc(100vw-2.5rem)] sm:w-96 pointer-events-none"
      >
        {toasts.map((toast) => (
          <ToastCard 
            key={toast.id} 
            toast={toast} 
            onDismiss={dismissToast} 
          />
        ))}
      </div>
    </IntraAppToastContext.Provider>
  );
}

interface ToastCardProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

const ToastCard = React.memo(function ToastCard({ toast, onDismiss }: ToastCardProps) {
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const totalDuration = toast.duration ?? 5000;

  // Track remaining milliseconds accurately for pause/resume support
  const remainingMsRef = useRef(totalDuration);
  const lastTickRef = useRef(Date.now());
  const hasDismissedRef = useRef(false);
  const onDismissRef = useRef(onDismiss);

  // Keep latest onDismiss ref without triggering timer recreation
  useEffect(() => {
    onDismissRef.current = onDismiss;
  });

  // Single safe dismissal trigger: runs as a clean macrotask outside of any React render/state updater phase
  const handleDismiss = useCallback(() => {
    if (hasDismissedRef.current) return;
    hasDismissedRef.current = true;
    setTimeout(() => {
      onDismissRef.current(toast.id);
    }, 0);
  }, [toast.id]);

  useEffect(() => {
    if (totalDuration <= 0) return;

    if (isPaused) {
      lastTickRef.current = Date.now();
      return;
    }

    lastTickRef.current = Date.now();
    const intervalMs = 30;

    const timer = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastTickRef.current;
      lastTickRef.current = now;

      remainingMsRef.current = Math.max(0, remainingMsRef.current - elapsed);
      const pct = Math.max(0, (remainingMsRef.current / totalDuration) * 100);

      // Pure state update: strictly sets percentage number, zero external side effects
      setProgress(pct);

      if (remainingMsRef.current <= 0) {
        clearInterval(timer);
        handleDismiss();
      }
    }, intervalMs);

    return () => {
      clearInterval(timer);
    };
  }, [totalDuration, isPaused, handleDismiss]);

  const styleConfig = {
    success: {
      border: 'border-emerald-500/25 hover:border-emerald-500/40',
      glow: 'shadow-[0_12px_40px_rgba(16,185,129,0.12)]',
      bgBadge: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      progressBar: 'bg-gradient-to-r from-emerald-500 to-teal-400',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
    },
    error: {
      border: 'border-rose-500/25 hover:border-rose-500/40',
      glow: 'shadow-[0_12px_40px_rgba(244,63,94,0.14)]',
      bgBadge: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
      progressBar: 'bg-gradient-to-r from-rose-500 to-pink-500',
      icon: <AlertCircle className="w-4 h-4 text-rose-400" />,
    },
    warning: {
      border: 'border-amber-500/25 hover:border-amber-500/40',
      glow: 'shadow-[0_12px_40px_rgba(245,158,11,0.12)]',
      bgBadge: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      progressBar: 'bg-gradient-to-r from-amber-500 to-amber-300',
      icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
    },
    info: {
      border: 'border-sky-500/25 hover:border-sky-500/40',
      glow: 'shadow-[0_12px_40px_rgba(14,165,233,0.12)]',
      bgBadge: 'bg-sky-500/10 text-sky-400 border border-sky-500/20',
      progressBar: 'bg-gradient-to-r from-sky-500 to-indigo-400',
      icon: <Info className="w-4 h-4 text-sky-400" />,
    },
  }[toast.type];

  return (
    <div
      role="alert"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`pointer-events-auto relative overflow-hidden rounded-xl border bg-[#0B0A09]/95 backdrop-blur-2xl p-4 shadow-2xl transition-all duration-300 ${styleConfig.border} ${styleConfig.glow} animate-in fade-in slide-in-from-bottom-3`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-1.5 rounded-lg shrink-0 ${styleConfig.bgBadge}`}>
          {styleConfig.icon}
        </div>
        
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-[#F7F4EC] tracking-tight leading-snug">
              {toast.title}
            </h4>
          </div>

          {toast.message && (
            <p className="mt-1 text-xs text-[#A8A196] leading-relaxed break-words font-normal">
              {toast.message}
            </p>
          )}

          {(toast.action || toast.secondaryAction) && (
            <div className="mt-3 flex items-center gap-2 pt-2 border-t border-white/[0.06]">
              {toast.action && (
                <button
                  type="button"
                  onClick={() => {
                    toast.action?.onClick();
                    handleDismiss();
                  }}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                    toast.action.primary !== false
                      ? 'bg-[#AD956C] hover:bg-[#C2AA7F] text-[#080706] font-semibold shadow-xs'
                      : 'bg-white/[0.06] hover:bg-white/[0.12] text-[#F1EEE7] border border-white/[0.08]'
                  }`}
                >
                  {toast.action.label}
                </button>
              )}

              {toast.secondaryAction && (
                <button
                  type="button"
                  onClick={() => {
                    toast.secondaryAction?.onClick();
                    handleDismiss();
                  }}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[#A8A196] hover:text-[#F7F4EC] transition-all border border-white/[0.06]"
                >
                  {toast.secondaryAction.label}
                </button>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss notification"
          className="text-[#7D7567] hover:text-[#F1EEE7] p-1 rounded-lg hover:bg-white/[0.06] transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {totalDuration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/[0.06]">
          <div
            className={`h-full ${styleConfig.progressBar} transition-all duration-75`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
});

export function useToast() {
  const context = useContext(IntraAppToastContext);
  if (!context) {
    // Fallback if used outside provider during initial render/tests
    return {
      showToast: () => '',
      dismissToast: () => {},
      success: (t: string, m?: string) => { console.log(`[Toast Success]: ${t}`, m); return ''; },
      error: (t: string, m?: string) => { console.error(`[Toast Error]: ${t}`, m); return ''; },
      warning: (t: string, m?: string) => { console.warn(`[Toast Warning]: ${t}`, m); return ''; },
      info: (t: string, m?: string) => { console.info(`[Toast Info]: ${t}`, m); return ''; },
    };
  }
  return context;
}
