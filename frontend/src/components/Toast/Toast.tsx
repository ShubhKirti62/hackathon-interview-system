import React, { useState, useEffect } from 'react';

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

interface ToastProps {
  message: ToastMessage;
  onRemove: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ message, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation
    setIsVisible(true);

    // Auto remove after duration
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onRemove(message.id), 300);
    }, message.duration || 4000);

    return () => clearTimeout(timer);
  }, [message.id, message.duration, onRemove]);

  const getToastStyles = () => {
    const baseStyles = {
      padding: '12px 16px',
      borderRadius: '8px',
      marginBottom: '8px',
      minWidth: '300px',
      maxWidth: '400px',
      fontSize: '14px',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
      opacity: isVisible ? 1 : 0,
      transition: 'all 0.3s ease-in-out',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      border: '1px solid',
    };

    const typeStyles = {
      success: {
        background: '#10b981',
        color: 'white',
        borderColor: '#059669',
      },
      error: {
        background: '#ef4444',
        color: 'white',
        borderColor: '#dc2626',
      },
      warning: {
        background: '#f59e0b',
        color: 'white',
        borderColor: '#d97706',
      },
      info: {
        background: '#3b82f6',
        color: 'white',
        borderColor: '#2563eb',
      },
    };

    return { ...baseStyles, ...typeStyles[message.type] };
  };

  const getIcon = () => {
    switch (message.type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return '';
    }
  };

  return (
    <div style={getToastStyles()}>
      <span style={{ fontSize: '16px' }}>{getIcon()}</span>
      <span>{message.message}</span>
    </div>
  );
};

export default Toast;
