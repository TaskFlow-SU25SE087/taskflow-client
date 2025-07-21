import React, { createContext, ReactNode, useContext, useState } from 'react'

type ToastType = {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  variant?: 'default' | 'destructive'
}

type ToastContextType = {
  toasts: ToastType[]
  showToast: (toast: Omit<ToastType, 'id'>) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastType[]>([])

  const showToast = (toast: Omit<ToastType, 'id'>) => {
    const id = Date.now().toString()
    setToasts((prev) => [...prev, { ...toast, id }])
    setTimeout(() => removeToast(id), 3000)
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
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
