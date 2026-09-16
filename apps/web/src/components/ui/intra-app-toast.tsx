'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
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

  return (
    <IntraAppToastContext.Provider value={{ showToast, dismissToast, success, error, warning, info }}>
      {children}
      {/* Intra-App Floating Notification Container */}
      <div 
        aria-live="polite" 
        className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 max-w-md w-[calc(100vw-2.5rem)] sm:w-96 pointer-events-none"
      >
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={() => dismissToast(toast.id)} />
        ))}
      </div>
    </IntraAppToastContext.Provider>
  );
}

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const duration = toast.duration ?? 5000;

  useEffect(() => {
    if (duration <= 0 || isPaused) return;

    const interval = 50;
    const step = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= step) {
          clearInterval(timer);
          onDismiss();
          return 0;
        }
        return prev - step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [duration, isPaused, onDismiss]);

  const styleConfig = {
    success: {
      border: 'border-emerald-500/40 hover:border-emerald-500/60',
      glow: 'shadow-emerald-500/10',
      bgBadge: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
      progressBar: 'bg-emerald-500',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />,
    },
    error: {
      border: 'border-rose-500/40 hover:border-rose-500/60',
      glow: 'shadow-rose-500/10',
      bgBadge: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
      progressBar: 'bg-rose-500',
      icon: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />,
    },
    warning: {
      border: 'border-amber-500/40 hover:border-amber-500/60',
      glow: 'shadow-amber-500/10',
      bgBadge: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
      progressBar: 'bg-amber-500',
      icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />,
    },
    info: {
      border: 'border-blue-500/40 hover:border-blue-500/60',
      glow: 'shadow-blue-500/10',
      bgBadge: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
      progressBar: 'bg-blue-500',
      icon: <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />,
    },
  }[toast.type];

  return (
    <div
      role="alert"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`pointer-events-auto relative overflow-hidden rounded-xl border bg-[#0d0d11]/95 backdrop-blur-xl p-4 shadow-2xl transition-all duration-300 ${styleConfig.border} ${styleConfig.glow} animate-in fade-in slide-in-from-bottom-3`}
    >
      <div className="flex items-start gap-3">
        <div className="p-1 rounded-lg">
          {styleConfig.icon}
        </div>
        
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-white tracking-tight leading-snug">
              {toast.title}
            </h4>
          </div>

          {toast.message && (
            <p className="mt-1 text-xs text-zinc-400 leading-relaxed break-words">
              {toast.message}
            </p>
          )}

          {(toast.action || toast.secondaryAction) && (
            <div className="mt-3 flex items-center gap-2 pt-1 border-t border-zinc-800/60">
              {toast.action && (
                <button
                  type="button"
                  onClick={() => {
                    toast.action?.onClick();
                    onDismiss();
                  }}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    toast.action.primary !== false
                      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-xs'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
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
                    onDismiss();
                  }}
                  className="px-2.5 py-1 text-xs font-medium rounded-md bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                >
                  {toast.secondaryAction.label}
                </button>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="text-zinc-500 hover:text-zinc-300 p-1 rounded-md hover:bg-zinc-800/60 transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-800/50">
          <div
            className={`h-full ${styleConfig.progressBar} transition-all duration-75`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

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
