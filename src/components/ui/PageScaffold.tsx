import React from 'react';

export interface PageScaffoldProps {
  title?: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const PageScaffold: React.FC<PageScaffoldProps> = ({
  title,
  subtitle,
  rightSlot,
  children,
  className = '',
}) => {
  return (
    <div className={`px-3 pt-2 pb-24 space-y-4 w-full overflow-x-hidden ${className}`}>
      {(title || rightSlot) && (
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {title && <h1 className="text-[16px] font-bold text-ink">{title}</h1>}
            {subtitle && (
              <p className="text-[12px] text-ink-soft mt-0.5">{subtitle}</p>
            )}
          </div>
          {rightSlot && <div className="shrink-0">{rightSlot}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
