import React from 'react';

export interface EconomyBadgeProps {
  label: string;
  className?: string;
}

export const EconomyBadge: React.FC<EconomyBadgeProps> = ({ label, className = '' }) => {
  return (
    <span
      className={`inline-flex items-center bg-save-soft text-save text-[11px] font-bold px-2 py-1 rounded-pill tabular-nums whitespace-nowrap shrink-0 ${className}`}
    >
      {label}
    </span>
  );
};
