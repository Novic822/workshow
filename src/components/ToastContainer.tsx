import React, { useEffect, useState } from 'react';
import { subscribeToast } from '../lib/toast';

type ToastItem = { id: string; type: 'success' | 'error' | 'info'; message: string };

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const unsub = subscribeToast((t) => {
      setToasts((prev) => [...prev, t]);
      // auto remove after 4s
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== t.id));
      }, 4000);
    });
    return unsub;
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed right-4 top-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`max-w-sm px-4 py-2 rounded shadow-md text-sm text-white ${
            t.type === 'success' ? 'bg-green-600' : t.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
