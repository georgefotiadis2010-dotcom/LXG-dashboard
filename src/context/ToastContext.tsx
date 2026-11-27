import React, { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastTone = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  tone: ToastTone;
  actionLabel?: string;
  onAction?: () => void;
}

interface ToastContextValue {
  showToast: (
    message: string,
    options?: { tone?: ToastTone; actionLabel?: string; onAction?: () => void; durationMs?: number },
  ) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (
      message: string,
      options?: { tone?: ToastTone; actionLabel?: string; onAction?: () => void; durationMs?: number },
    ) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const tone = options?.tone ?? 'info';
      const duration = options?.durationMs ?? (options?.onAction ? 5000 : 3200);

      setToasts((prev) => [...prev.slice(-2), { id, message, tone, actionLabel: options?.actionLabel, onAction: options?.onAction }]);

      window.setTimeout(() => {
        dismiss(id);
      }, duration);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2 px-4 md:bottom-6 md:items-end md:px-6"
      >
        {toasts.map((toast) => {
          const Icon =
            toast.tone === 'success'
              ? CheckCircle2
              : toast.tone === 'error'
              ? AlertCircle
              : Info;
          const iconColor =
            toast.tone === 'success'
              ? 'text-emerald-500 dark:text-emerald-400'
              : toast.tone === 'error'
              ? 'text-red-500 dark:text-red-400'
              : 'text-sky-500 dark:text-sky-400';

          return (
            <div
              key={toast.id}
              className="pointer-events-auto animate-sheet-up flex w-full max-w-sm items-center gap-2.5 rounded-2xl border border-slate-200/80 bg-white/95 px-3.5 py-2.5 text-sm font-medium text-slate-900 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-[#1B1E28]/95 dark:text-slate-100"
            >
              <Icon className={`h-4 w-4 shrink-0 ${iconColor}`} />
              <span className="flex-1 truncate text-[13px]">{toast.message}</span>
              {toast.actionLabel && toast.onAction && (
                <button
                  type="button"
                  onClick={() => {
                    toast.onAction?.();
                    dismiss(toast.id);
                  }}
                  className="rounded-lg bg-red-600/10 px-2.5 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-600/20 active:scale-95 dark:bg-red-500/15 dark:text-red-400"
                >
                  {toast.actionLabel}
                </button>
              )}
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss notification"
                className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-slate-200"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
