import React from 'react';

export interface StatPillProps {
  label: string;
  value: string;
  tone?: 'default' | 'save' | 'warn' | 'danger' | 'brand';
  className?: string;
}

export const StatPill: React.FC<StatPillProps> = ({
  label,
  value,
  tone = 'default',
  className = '',
}) => {
  const valueToneClass =
    tone === 'save'
      ? 'text-save'
      : tone === 'warn'
      ? 'text-warn'
      : tone === 'danger'
      ? 'text-danger'
      : tone === 'brand'
      ? 'text-brand'
      : 'text-ink';

  return (
    <div className={`rounded-field bg-surface shadow-card px-3 py-2.5 flex flex-col justify-between ${className}`}>
      <span className="text-[11px] font-medium text-ink-muted truncate">{label}</span>
      <span className={`text-[15px] font-bold tabular-nums mt-0.5 truncate ${valueToneClass}`}>
        {value}
      </span>
    </div>
  );
};
