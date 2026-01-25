import { useToast } from '../components/Toast/ToastContainer';

export const showToast = {
  success: (message: string, duration?: number) => {
    // This will be called from components, so we need to handle it differently
    // We'll create a global toast manager
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('showToast', {
        detail: { type: 'success', message, duration }
      });
      window.dispatchEvent(event);
    }
  },
  
  error: (message: string, duration?: number) => {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('showToast', {
        detail: { type: 'error', message, duration }
      });
      window.dispatchEvent(event);
    }
  },
  
  warning: (message: string, duration?: number) => {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('showToast', {
        detail: { type: 'warning', message, duration }
      });
      window.dispatchEvent(event);
    }
  },
  
  info: (message: string, duration?: number) => {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('showToast', {
        detail: { type: 'info', message, duration }
      });
      window.dispatchEvent(event);
    }
  },
};

export { useToast };
export default showToast;
