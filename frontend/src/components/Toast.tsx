import React, { useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 4000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const bgColors = {
    success: 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200',
    error: 'bg-rose-950/90 border-rose-500/50 text-rose-200',
    info: 'bg-brand-950/90 border-brand-500/50 text-brand-200',
  };

  const Icons = {
    success: <CheckCircle className="h-5 w-5 text-emerald-400" />,
    error: <AlertTriangle className="h-5 w-5 text-rose-400" />,
    info: <Info className="h-5 w-5 text-brand-400" />,
  };

  return (
    <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-xl backdrop-blur-md animate-slide-in ${bgColors[type]}`}>
      {Icons[type]}
      <p className="text-sm font-medium pr-4">{message}</p>
      <button onClick={onClose} className="hover:opacity-80 transition-opacity">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
