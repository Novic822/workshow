export type ToastType = 'success' | 'error' | 'info';

type Toast = { id: string; type: ToastType; message: string };

const listeners: Array<(t: Toast) => void> = [];

export function subscribeToast(fn: (t: Toast) => void) {
  listeners.push(fn);
  return () => {
    const idx = listeners.indexOf(fn);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

export function showToast(type: ToastType, message: string) {
  const t: Toast = { id: String(Date.now()) + Math.random().toString(36).slice(2), type, message };
  listeners.forEach((fn) => fn(t));
}

export default showToast;
