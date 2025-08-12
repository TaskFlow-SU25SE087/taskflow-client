import { AlertTriangle, CheckCircle, Info, X, XCircle } from 'lucide-react';
import { useToastContext } from './ToastContext';

const variantStyles = {
  success: {
    border: 'border-l-8 border-green-500',
    icon: <CheckCircle className="text-green-500 w-8 h-8" />,
    bg: 'bg-green-50',
    titleColor: 'text-green-800',
    descriptionColor: 'text-green-700'
  },
  error: {
    border: 'border-l-8 border-red-500',
    icon: <XCircle className="text-red-500 w-8 h-8" />,
    bg: 'bg-red-50',
    titleColor: 'text-red-800',
    descriptionColor: 'text-red-700'
  },
  info: {
    border: 'border-l-8 border-blue-500',
    icon: <Info className="text-blue-500 w-8 h-8" />,
    bg: 'bg-blue-50',
    titleColor: 'text-blue-800',
    descriptionColor: 'text-blue-700'
  },
  warning: {
    border: 'border-l-8 border-yellow-500',
    icon: <AlertTriangle className="text-yellow-500 w-8 h-8" />,
    bg: 'bg-yellow-50',
    titleColor: 'text-yellow-800',
    descriptionColor: 'text-yellow-700'
  },
  default: {
    border: 'border-l-8 border-gray-500',
    icon: <Info className="text-gray-500 w-8 h-8" />,
    bg: 'bg-gray-50',
    titleColor: 'text-gray-800',
    descriptionColor: 'text-gray-700'
  },
  destructive: {
    border: 'border-l-8 border-red-600',
    icon: <XCircle className="text-red-600 w-8 h-8" />,
    bg: 'bg-red-50',
    titleColor: 'text-red-800',
    descriptionColor: 'text-red-700'
  }
}

type VariantKey = 'success' | 'error' | 'info' | 'warning' | 'default' | 'destructive';

export const ToastContainer = () => {
  const { toasts, removeToast } = useToastContext()
  
  return (
    <div className="fixed z-[10002] top-6 right-6 flex flex-col items-end gap-4 max-w-sm">
      {toasts.map((toast) => {
        // Map variant names to the correct style
        let variant: VariantKey = 'default';
        switch (toast.variant) {
          case 'success':
            variant = 'success';
            break;
          case 'error':
            variant = 'error';
            break;
          case 'warning':
            variant = 'warning';
            break;
          case 'info':
            variant = 'info';
            break;
          case 'destructive':
            variant = 'destructive';
            break;
          default:
            variant = 'default';
        }
        
        const style = variantStyles[variant];
        return (
          <div
            key={toast.id}
            className={`relative flex items-start gap-4 ${style.bg} shadow-lg rounded-xl p-5 w-[400px] ${style.border}`}
          >
            <div className="mt-1">{style.icon}</div>
            <div className="flex-1">
              {toast.title && <div className={`font-bold text-lg ${style.titleColor}`}>{toast.title}</div>}
              {toast.description && <div className={`text-sm mt-1 ${style.descriptionColor}`}>{toast.description}</div>}
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