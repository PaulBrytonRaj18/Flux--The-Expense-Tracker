import { useState, useEffect, useCallback } from 'react';
import { onToast } from '../api/client';

interface ToastItem {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

let nextId = 0;

export function Toast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  useEffect(() => {
    onToast(addToast);
  }, [addToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast-${toast.type}`}
          onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
        >
          <span className="toast-icon">
            {toast.type === 'success' && '✅'}
            {toast.type === 'error' && '❌'}
            {toast.type === 'info' && 'ℹ️'}
          </span>
          <span className="toast-msg">{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
