import React from 'react';

export interface SectionTitleProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({
  title,
  subtitle,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-[17px] font-bold text-ink leading-snug">{title}</h2>
        {subtitle && (
          <p className="text-[12px] font-medium text-ink-muted mt-0.5">{subtitle}</p>
        )}
      </div>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="min-h-[44px] px-2 -mr-2 text-brand text-[13px] font-semibold whitespace-nowrap shrink-0 active:scale-[0.98] transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 rounded-pill flex items-center"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
