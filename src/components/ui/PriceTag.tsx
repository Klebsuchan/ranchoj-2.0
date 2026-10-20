import React from 'react';

export interface PriceTagProps {
  value: number;
  size?: 'lg' | 'md' | 'sm';
  isLowest?: boolean;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export const PriceTag: React.FC<PriceTagProps> = ({
  value,
  size = 'lg',
  isLowest = false,
  prefix = 'R$',
  suffix,
  className = '',
}) => {
  const sizeClass =
    size === 'lg'
      ? 'text-[22px] leading-tight font-extrabold'
      : size === 'md'
      ? 'text-[17px] leading-tight font-extrabold'
      : 'text-[14px] leading-tight font-bold';

  const colorClass = isLowest ? 'text-save' : 'text-ink';

  return (
    <span className={`tabular-nums inline-flex items-baseline gap-0.5 ${sizeClass} ${colorClass} ${className}`}>
      <span>
        {prefix} {value.toFixed(2).replace('.', ',')}
      </span>
      {suffix && (
        <span className="text-[12px] font-medium text-ink-muted ml-0.5">{suffix}</span>
      )}
    </span>
  );
};
