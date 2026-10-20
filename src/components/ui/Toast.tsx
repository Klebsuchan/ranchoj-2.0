import React from 'react';
import { X } from 'lucide-react';

export interface ToastProps {
  message: {
    text: string;
    type: 'info' | 'warning' | 'success';
  } | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-sm pointer-events-auto"
    >
      <div className="bg-ink text-white text-[13px] font-medium px-4 py-3 rounded-pill shadow-float flex items-center justify-between gap-3">
        <span className="leading-snug">{message.text}</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar aviso"
          className="w-7 h-7 rounded-full flex items-center justify-center text-white/75 hover:text-white shrink-0 active:scale-[0.98] transition-transform"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
