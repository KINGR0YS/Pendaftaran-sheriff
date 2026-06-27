'use client';
import { createContext, useContext, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Info, CheckCircle, AlertTriangle } from 'lucide-react';
import { sfx } from '@/lib/sfx';

const ToastContext = createContext({
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => {}
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<{ id: string; msg: string; type: string }[]>([]);

  const showToast = useCallback((msg: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, msg, type }]);
    
    // Play respective notification sound
    if (type === 'success') {
      sfx.playSuccess();
    } else if (type === 'error' || type === 'warning') {
      sfx.playWarning();
    } else {
      sfx.playClick();
    }

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {typeof document !== 'undefined' && toasts.length > 0 &&
        createPortal(
          <div className="toast-container">
            {toasts.map((t) => (
              <div key={t.id} className={`toast ${t.type}`}>
                {t.type === 'success' && <CheckCircle size={16} />}
                {t.type === 'error' && <AlertTriangle size={16} />}
                {t.type === 'info' && <Info size={16} />}
                {t.type === 'warning' && <AlertTriangle size={16} />}
                <div className="toast-message">{t.msg}</div>
              </div>
            ))}
          </div>,
          document.getElementById('toast-root') || document.body
        )}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
