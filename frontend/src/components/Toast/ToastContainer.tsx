import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import Toast from './Toast';

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: Omit<ToastMessage, 'id'>) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showToast = useCallback((message: Omit<ToastMessage, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newToast: ToastMessage = { ...message, id };
    setToasts(prev => [...prev, newToast]);
  }, []);

  const success = useCallback((message: string, duration?: number) => {
    showToast({ type: 'success', message, duration });
  }, [showToast]);

  const error = useCallback((message: string, duration?: number) => {
    showToast({ type: 'error', message, duration });
  }, [showToast]);

  const warning = useCallback((message: string, duration?: number) => {
    showToast({ type: 'warning', message, duration });
  }, [showToast]);

  const info = useCallback((message: string, duration?: number) => {
    showToast({ type: 'info', message, duration });
  }, [showToast]);

  // Listen for custom events from the showToast utility
  useEffect(() => {
    const handleShowToast = (event: CustomEvent) => {
      const { type, message, duration } = event.detail;
      showToast({ type, message, duration });
    };

    window.addEventListener('showToast', handleShowToast as EventListener);
    return () => window.removeEventListener('showToast', handleShowToast as EventListener);
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}
      <div
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
        }}
      >
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast}
            onRemove={removeToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
