import React, { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ToastType = 'success' | 'error' | 'info'

export interface Toast {
  id: string
  message: string
  type: ToastType
  title?: string
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, title?: string) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback((message: string, type: ToastType = 'success', title?: string) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, message, type, title }])

    setTimeout(() => {
      removeToast(id)
    }, 4000)
  }, [removeToast])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      <div
        aria-live="assertive"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4 sm:px-0"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={cn(
              'pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl shadow-lg border transition-all duration-300 transform translate-y-0',
              'bg-white text-slate-900',
              toast.type === 'success' && 'border-emerald-200 bg-white ring-1 ring-emerald-500/20',
              toast.type === 'error' && 'border-red-200 bg-white ring-1 ring-red-500/20',
              toast.type === 'info' && 'border-sky-200 bg-white ring-1 ring-sky-500/20',
            )}
          >
            <div className="flex-shrink-0 mt-0.5">
              {toast.type === 'success' && <CheckCircle2 size={18} className="text-emerald-500" />}
              {toast.type === 'error' && <AlertCircle size={18} className="text-red-500" />}
              {toast.type === 'info' && <Info size={18} className="text-sky-500" />}
            </div>
            <div className="flex-1 min-w-0">
              {toast.title && (
                <p className="text-xs font-bold text-slate-900 mb-0.5">{toast.title}</p>
              )}
              <p className="text-xs text-slate-700 leading-relaxed">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
              aria-label="Fermer la notification"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
