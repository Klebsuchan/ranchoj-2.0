import React from 'react';

export interface IconButtonProps {
  icon: React.ReactNode;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  ariaLabel: string;
  active?: boolean;
  variant?: 'ghost' | 'surface' | 'brand-soft';
  disabled?: boolean;
  id?: string;
  className?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onClick,
  ariaLabel,
  active = false,
  variant = 'ghost',
  disabled = false,
  id,
  className = '',
}) => {
  const variantClasses = active
    ? 'bg-brand-soft text-brand'
    : variant === 'surface'
    ? 'bg-surface text-ink shadow-card hover:bg-field'
    : variant === 'brand-soft'
    ? 'bg-brand-soft text-brand hover:bg-brand/15'
    : 'bg-transparent text-ink-soft hover:bg-field hover:text-ink';

  return (
    <button
      id={id}
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      title={ariaLabel}
      className={`w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center shrink-0 active:scale-[0.98] transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:opacity-40 disabled:pointer-events-none ${variantClasses} ${className}`}
    >
      {icon}
    </button>
  );
};
