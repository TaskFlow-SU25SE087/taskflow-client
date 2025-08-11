import { AlertTriangle, CheckCircle, Info, X, XCircle } from 'lucide-react';
import { useToastContext } from './ToastContext';

const variantStyles = {
  success: {
    border: 'border-l-8 border-green-500',
    icon: <CheckCircle className="text-green-500 w-8 h-8" />,
  },
  error: {
    border: 'border-l-8 border-red-500',
    icon: <XCircle className="text-red-500 w-8 h-8" />,
  },
  info: {
    border: 'border-l-8 border-blue-500',
    icon: <Info className="text-blue-500 w-8 h-8" />,
  },
  warning: {
    border: 'border-l-8 border-yellow-400',
    icon: <AlertTriangle className="text-yellow-400 w-8 h-8" />,
  },
}

type VariantKey = 'success' | 'error' | 'info' | 'warning';

export const ToastContainer = () => {
  const { toasts, removeToast } = useToastContext()
  return (
    <div className="fixed z-[9999] top-6 right-6 flex flex-col items-end gap-4 max-w-sm">
      {toasts.map((toast) => {
        let variant = typeof toast.variant === 'string' ? toast.variant : 'info';
        if (variant === 'default') variant = 'info';
        if (variant === 'destructive') variant = 'error';
        if (variant === 'success') variant = 'success';
        const style = variantStyles[variant as VariantKey] || variantStyles.info;
        return (
          <div
            key={toast.id}
            className={`relative flex items-start gap-4 bg-white shadow-lg rounded-xl p-5 w-[400px] ${style.border}`}
          >
            <div className="mt-1">{style.icon}</div>
            <div className="flex-1">
              {toast.title && <div className="font-bold text-lg">{toast.title}</div>}
              {toast.description && <div className="text-gray-600 text-sm mt-1">{toast.description}</div>}
            </div>
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"
              onClick={() => removeToast(toast.id)}
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )
      })}
    </div>
  )
} 