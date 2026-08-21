import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertTriangle, X, CheckCircle, Info } from 'lucide-react';

type ToastType = 'error' | 'success' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  addToast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextValue>({ addToast: () => {} });

export const useToast = () => useContext(ToastContext);

const ICONS: Record<ToastType, typeof AlertTriangle> = {
  error: AlertTriangle,
  success: CheckCircle,
  info: Info,
};

const STYLES: Record<ToastType, string> = {
  error: 'bg-red-50 border-red-200 text-red-800',
  success: 'bg-green-50 border-green-200 text-green-800',
  info: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
};

const ICON_COLORS: Record<ToastType, string> = {
  error: 'text-red-500',
  success: 'text-green-500',
  info: 'text-amber-500',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 6000);
  }, []);

  const dismiss = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none" style={{ maxWidth: '380px' }}>
        {toasts.map(toast => {
          const Icon = ICONS[toast.type];
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto border rounded-xl px-4 py-3 shadow-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${STYLES[toast.type]}`}
            >
              <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${ICON_COLORS[toast.type]}`} />
              <p className="text-sm flex-1">{toast.message}</p>
              <button onClick={() => dismiss(toast.id)} className="shrink-0 opacity-60 hover:opacity-100">
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
