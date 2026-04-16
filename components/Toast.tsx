'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

type Toast = { id: string; message: string; sub?: string; type?: 'default' | 'success' | 'error' }
type ToastContextType = { showToast: (message: string, sub?: string, type?: Toast['type']) => void }

const ToastContext = createContext<ToastContextType>({ showToast: () => {} })

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, sub?: string, type: Toast['type'] = 'default') => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, message, sub, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])

  const borderColor = (type?: Toast['type']) => {
    if (type === 'success') return '#4ade80'
    if (type === 'error') return '#f87171'
    return '#c95a2a'
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[300] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className="pointer-events-auto flex items-start gap-3 px-4 py-3 rounded min-w-[240px] max-w-[320px]"
              style={{
                background: '#1a1208',
                border: '1px solid #2e1e0e',
                borderLeft: `3px solid ${borderColor(t.type)}`,
                boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
              }}
            >
              <div className="flex-1">
                <p className="text-sm font-bold" style={{ color: '#f5ede3', fontFamily: "'Barlow Condensed', sans-serif" }}>{t.message}</p>
                {t.sub && <p className="text-[11px] font-mono mt-0.5" style={{ color: '#7a6654', fontFamily: "'IBM Plex Mono', monospace" }}>{t.sub}</p>}
              </div>
              <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))} className="flex-shrink-0 opacity-40 hover:opacity-100 transition-opacity mt-0.5">
                <X size={12} style={{ color: '#f5ede3' }} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
