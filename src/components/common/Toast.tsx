import {
    createContext, useContext, useState,
    useCallback, type ReactNode
  } from 'react';
  import {
    CheckCircle, AlertCircle,
    Info, X, AlertTriangle
  } from 'lucide-react';
  
  // ── Types ────────────────────────────────────────────────────
  type ToastType = 'success' | 'error' | 'info' | 'warning';
  
  interface Toast {
    id:      string;
    type:    ToastType;
    title:   string;
    message?: string;
  }
  
  interface ToastContextType {
    showToast: (
      type: ToastType,
      title: string,
      message?: string
    ) => void;
    success: (title: string, message?: string) => void;
    error:   (title: string, message?: string) => void;
    info:    (title: string, message?: string) => void;
    warning: (title: string, message?: string) => void;
  }
  
  // ── Context ──────────────────────────────────────────────────
  const ToastContext = createContext<ToastContextType | null>(null);
  
  // ── Config visuelle par type ──────────────────────────────────
  const toastConfig: Record<ToastType, {
    icon:    React.ElementType;
    bg:      string;
    border:  string;
    icon_color: string;
    title_color: string;
  }> = {
    success: {
      icon:        CheckCircle,
      bg:          'bg-green-50',
      border:      'border-green-200',
      icon_color:  'text-green-500',
      title_color: 'text-green-800',
    },
    error: {
      icon:        AlertCircle,
      bg:          'bg-red-50',
      border:      'border-red-200',
      icon_color:  'text-red-500',
      title_color: 'text-red-800',
    },
    info: {
      icon:        Info,
      bg:          'bg-blue-50',
      border:      'border-blue-200',
      icon_color:  'text-blue-500',
      title_color: 'text-blue-800',
    },
    warning: {
      icon:        AlertTriangle,
      bg:          'bg-orange-50',
      border:      'border-orange-200',
      icon_color:  'text-orange-500',
      title_color: 'text-orange-800',
    },
  };
  
  // ── Provider ─────────────────────────────────────────────────
  export const ToastProvider = ({ children }: { children: ReactNode }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);
  
    const removeToast = useCallback((id: string) => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, []);
  
    const showToast = useCallback((
      type: ToastType,
      title: string,
      message?: string
    ) => {
      const id = Date.now().toString();
      const newToast: Toast = { id, type, title, message };
      setToasts(prev => [...prev, newToast]);
      // Auto-suppression après 4 secondes
      setTimeout(() => removeToast(id), 4000);
    }, [removeToast]);
  
    const success = useCallback(
      (title: string, msg?: string) => showToast('success', title, msg),
      [showToast]
    );
    const error = useCallback(
      (title: string, msg?: string) => showToast('error', title, msg),
      [showToast]
    );
    const info = useCallback(
      (title: string, msg?: string) => showToast('info', title, msg),
      [showToast]
    );
    const warning = useCallback(
      (title: string, msg?: string) => showToast('warning', title, msg),
      [showToast]
    );
  
    return (
      <ToastContext.Provider value={{
        showToast, success, error, info, warning
      }}>
        {children}
  
        {/* Conteneur des toasts */}
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 max-w-sm w-full">
          {toasts.map(toast => {
            const config = toastConfig[toast.type];
            const Icon   = config.icon;
  
            return (
              <div
                key={toast.id}
                className={`
                  flex items-start gap-3 p-4 rounded-2xl border shadow-lg
                  ${config.bg} ${config.border}
                  animate-in slide-in-from-right-5 duration-300
                `}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${config.icon_color}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${config.title_color}`}>
                    {toast.title}
                  </p>
                  {toast.message && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {toast.message}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </ToastContext.Provider>
    );
  };
  
  // ── Hook ─────────────────────────────────────────────────────
  export const useToast = (): ToastContextType => {
    const context = useContext(ToastContext);
    if (!context) {
      throw new Error('useToast doit être utilisé dans ToastProvider');
    }
    return context;
  };