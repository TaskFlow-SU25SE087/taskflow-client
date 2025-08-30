import React, { createContext, ReactNode, useContext, useRef, useState } from 'react'

type ToastType = {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  variant?: 'default' | 'destructive' | 'success' | 'warning' | 'error' | 'info'
}

type ToastContextType = {
  toasts: ToastType[]
  showToast: (toast: Omit<ToastType, 'id'>) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastType[]>([])
  const isProcessing = useRef(false)

  const showToast = async (toast: Omit<ToastType, 'id'>) => {
    // Prevent rapid successive calls
    if (isProcessing.current) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    isProcessing.current = true
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    setToasts((prev) => {
      const newToasts = [...prev, { ...toast, id }]
      return newToasts
    })
    
    // Auto-remove toast after 3 seconds
    setTimeout(() => {
      removeToast(id)
    }, 3000)
    
    // Reset processing flag after a short delay
    setTimeout(() => {
      isProcessing.current = false
    }, 150)
  }

  const removeToast = (id: string) => {
    setToasts((prev) => {
      const newToasts = prev.filter((t) => t.id !== id)
      return newToasts
    })
  }

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  )
}

export const useToastContext = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToastContext must be used within ToastProvider')
  return ctx
} 