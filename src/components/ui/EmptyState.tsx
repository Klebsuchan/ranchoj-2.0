import React from 'react';
import { PrimaryButton } from './PrimaryButton';

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}) => {
  return (
    <div className="bg-surface rounded-card shadow-card p-6 text-center flex flex-col items-center gap-4">
      <div className="w-16 h-16 rounded-full bg-brand-soft text-brand flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="space-y-1 max-w-xs">
        <h3 className="text-[17px] font-bold text-ink">{title}</h3>
        <p className="text-[14px] text-ink-soft leading-relaxed">{description}</p>
      </div>
      {actionLabel && onAction && (
        <div className="w-full pt-1 space-y-2">
          <PrimaryButton onClick={onAction}>{actionLabel}</PrimaryButton>
          {secondaryActionLabel && onSecondaryAction && (
            <button
              type="button"
              onClick={onSecondaryAction}
              className="w-full min-h-[44px] text-[14px] font-semibold text-ink-soft hover:text-ink active:scale-[0.98] transition-transform"
            >
              {secondaryActionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
