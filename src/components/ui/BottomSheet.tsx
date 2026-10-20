import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { IconButton } from './IconButton';

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
}) => {
  const startYRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleTouchStart = (e: React.TouchEvent) => {
    startYRef.current = e.touches[0]?.clientY ?? null;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (startYRef.current === null) return;
    const endY = e.changedTouches[0]?.clientY ?? startYRef.current;
    if (endY - startYRef.current > 70) {
      onClose();
    }
    startYRef.current = null;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Painel de opções'}
    >
      <div
        className="w-full max-w-md bg-surface rounded-t-card shadow-float max-h-[88dvh] flex flex-col overflow-hidden pb-[env(safe-area-inset-bottom,0px)]"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle */}
        <div className="pt-3 pb-1 flex justify-center shrink-0">
          <div className="w-9 h-1 rounded-pill bg-slate-300" />
        </div>

        {/* Header */}
        {(title || subtitle) && (
          <div className="px-4 py-2.5 flex items-start justify-between gap-3 border-b border-slate-100 shrink-0">
            <div className="min-w-0">
              {title && <h2 className="text-[17px] font-bold text-ink">{title}</h2>}
              {subtitle && (
                <p className="text-[12px] font-medium text-ink-muted mt-0.5">{subtitle}</p>
              )}
            </div>
            <IconButton
              ariaLabel="Fechar"
              onClick={onClose}
              icon={<X className="w-5 h-5" />}
            />
          </div>
        )}

        {/* Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="p-4 border-t border-slate-100 bg-surface shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
