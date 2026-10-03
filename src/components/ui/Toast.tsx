'use client';

import React, { createContext, useContext, useState, useCallback, useId } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { triggerNotificationAlertOnce } from '@/lib/soundAlert';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (item: Omit<ToastItem, 'id'>) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  removeToast: (id: string) => void;
  toast: ToastContextValue;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type, message, title, duration = 3500 }: Omit<ToastItem, 'id'>) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const newToast: ToastItem = { id, type, message, title, duration };

      setToasts((prev) => [...prev.slice(-4), newToast]); // En fazla 5 toast göster

      if (type === 'error') {
        try {
          triggerNotificationAlertOnce();
        } catch {}
      }

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback(
    (message: string, title?: string) => showToast({ type: 'success', message, title }),
    [showToast]
  );
  const error = useCallback(
    (message: string, title?: string) => showToast({ type: 'error', message, title }),
    [showToast]
  );
  const warning = useCallback(
    (message: string, title?: string) => showToast({ type: 'warning', message, title }),
    [showToast]
  );
  const info = useCallback(
    (message: string, title?: string) => showToast({ type: 'info', message, title }),
    [showToast]
  );

  const value: ToastContextValue = {
    showToast,
    success,
    error,
    warning,
    info,
    removeToast,
    get toast() {
      return this;
    },
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast Viewport */}
      <div
        aria-live="polite"
        className="fixed z-50 pointer-events-none flex flex-col gap-2.5 top-4 left-3 right-3 sm:top-auto sm:bottom-6 sm:right-6 sm:left-auto sm:w-96 max-w-full"
      >
        {toasts.map((t) => {
          const isSuccess = t.type === 'success';
          const isError = t.type === 'error';
          const isWarning = t.type === 'warning';

          return (
            <div
              key={t.id}
              role="alert"
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-xl border backdrop-blur-md transition-all animate-in fade-in duration-200 ${
                isSuccess
                  ? 'bg-white/95 dark:bg-slate-900/95 border-emerald-500/30 text-slate-900 dark:text-slate-100 shadow-emerald-500/10'
                  : isError
                  ? 'bg-white/95 dark:bg-slate-900/95 border-rose-500/30 text-slate-900 dark:text-slate-100 shadow-rose-500/10'
                  : isWarning
                  ? 'bg-white/95 dark:bg-slate-900/95 border-amber-500/30 text-slate-900 dark:text-slate-100 shadow-amber-500/10'
                  : 'bg-white/95 dark:bg-slate-900/95 border-sky-500/30 text-slate-900 dark:text-slate-100 shadow-sky-500/10'
              }`}
            >
              <div
                className={`p-1.5 rounded-xl shrink-0 ${
                  isSuccess
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    : isError
                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                    : isWarning
                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                    : 'bg-sky-500/15 text-sky-600 dark:text-sky-400'
                }`}
              >
                {isSuccess && <CheckCircle2 className="w-5 h-5" />}
                {isError && <XCircle className="w-5 h-5" />}
                {isWarning && <AlertTriangle className="w-5 h-5" />}
                {!isSuccess && !isError && !isWarning && <Info className="w-5 h-5" />}
              </div>

              <div className="flex-1 min-w-0 pt-0.5">
                {t.title && (
                  <h4 className="text-xs font-black tracking-wide uppercase mb-0.5">
                    {t.title}
                  </h4>
                )}
                <p className="text-xs sm:text-sm font-semibold leading-snug break-words">
                  {t.message}
                </p>
              </div>

              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                aria-label="Kapat"
              >
                <X className="w-4 h-4" />
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
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}
