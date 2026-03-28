/**
 * Toast Notification Utilities
 * Wrapper for consistent toast notifications across the platform
 * Uses react-hot-toast if available, falls back to console
 */

type ToastType = 'success' | 'error' | 'info' | 'warning' | 'loading';

interface ToastOptions {
  duration?: number;
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  icon?: string | any; // Use 'any' to avoid React dependency in shared utils
}

let toastInstance: any = null;

/**
 * Initialize toast instance
 * Should be called in app root with react-hot-toast Toaster
 */
export function initToast(instance: any) {
  toastInstance = instance;
}

/**
 * Show toast notification
 */
export function showToast(
  message: string,
  type: ToastType = 'info',
  options: ToastOptions = {}
) {
  if (!toastInstance) {
    // Fallback to console if toast not initialized
    console.log(`[${type.toUpperCase()}] ${message}`);
    return;
  }

  const { duration = 4000, position = 'top-right', icon } = options;

  switch (type) {
    case 'success':
      return toastInstance.success(message, { duration, position, icon });
    case 'error':
      return toastInstance.error(message, { duration, position, icon });
    case 'warning':
      return toastInstance.warning(message, { duration, position, icon });
    case 'loading':
      return toastInstance.loading(message, { duration, position, icon });
    default:
      return toastInstance(message, { duration, position, icon });
  }
}

/**
 * Success toast
 */
export function toastSuccess(message: string, options?: ToastOptions) {
  return showToast(message, 'success', options);
}

/**
 * Error toast
 */
export function toastError(message: string, options?: ToastOptions) {
  return showToast(message, 'error', { ...options, duration: options?.duration || 6000 });
}

/**
 * Info toast
 */
export function toastInfo(message: string, options?: ToastOptions) {
  return showToast(message, 'info', options);
}

/**
 * Warning toast
 */
export function toastWarning(message: string, options?: ToastOptions) {
  return showToast(message, 'warning', options);
}

/**
 * Loading toast (returns dismiss function)
 */
export function toastLoading(message: string, options?: ToastOptions) {
  return showToast(message, 'loading', { ...options, duration: Infinity });
}

/**
 * Dismiss toast
 */
export function dismissToast(toastId: string) {
  if (toastInstance && toastInstance.dismiss) {
    toastInstance.dismiss(toastId);
  }
}

/**
 * Dismiss all toasts
 */
export function dismissAllToasts() {
  if (toastInstance && toastInstance.dismissAll) {
    toastInstance.dismissAll();
  }
}

