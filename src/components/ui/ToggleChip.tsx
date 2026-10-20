import React from 'react';

export interface ToggleChipProps {
  label: string;
  active: boolean;
  onToggle: () => void;
  icon?: React.ReactNode;
  count?: number;
  className?: string;
}

export const ToggleChip: React.FC<ToggleChipProps> = ({
  label,
  active,
  onToggle,
  icon,
  count,
  className = '',
}) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      className={`h-[26px] px-2.5 rounded-md text-[11px] font-semibold whitespace-nowrap inline-flex items-center gap-1 active:scale-[0.98] transition-transform focus:outline-none ${
        active
          ? 'bg-brand-soft text-brand border border-brand/30'
          : 'bg-surface text-ink-soft border border-slate-200/80 hover:text-ink'
      } ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{label}</span>
      {typeof count === 'number' && (
        <span className={`text-[10px] tabular-nums ${active ? 'text-brand' : 'text-ink-muted'}`}>
          ({count})
        </span>
      )}
    </button>
  );
};
