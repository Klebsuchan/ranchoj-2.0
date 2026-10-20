import React from 'react';

export interface ProgressBarProps {
  current: number;
  limit: number;
  showLabels?: boolean;
  labelLeft?: string;
  labelRight?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  limit,
  showLabels = true,
  labelLeft,
  labelRight,
}) => {
  const safeLimit = limit > 0 ? limit : 1;
  const rawPct = (current / safeLimit) * 100;
  const clampedPct = Math.min(100, Math.max(0, rawPct));

  const barColor =
    rawPct > 100
      ? 'bg-danger'
      : rawPct >= 90
      ? 'bg-warn'
      : 'bg-save';

  const statusTextColor =
    rawPct > 100
      ? 'text-danger'
      : rawPct >= 90
      ? 'text-warn'
      : 'text-save';

  return (
    <div className="space-y-1.5 w-full">
      {showLabels && (
        <div className="flex items-baseline justify-between gap-2 text-[12px] font-medium tabular-nums">
          <span className="text-ink-soft">
            {labelLeft ?? `R$ ${current.toFixed(2).replace('.', ',')} usados`}
          </span>
          <span className={`font-bold ${statusTextColor}`}>
            {labelRight ??
              (current <= limit
                ? `Falta R$ ${(limit - current).toFixed(2).replace('.', ',')} pro teto`
                : `Passou R$ ${(current - limit).toFixed(2).replace('.', ',')} do teto`)}
          </span>
        </div>
      )}
      <div className="w-full h-1.5 rounded-pill bg-field overflow-hidden">
        <div
          className={`h-full rounded-pill transition-all duration-200 ${barColor}`}
          style={{ width: `${clampedPct}%` }}
        />
      </div>
    </div>
  );
};
