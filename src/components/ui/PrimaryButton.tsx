import React from 'react';

export interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  children,
  icon,
  fullWidth = true,
  className = '',
  disabled,
  ...rest
}) => {
  return (
    <button
      type="button"
      disabled={disabled}
      className={`${
        fullWidth ? 'w-full' : ''
      } min-h-[52px] px-5 rounded-pill bg-brand hover:bg-brand-hover text-white font-bold text-[15px] whitespace-nowrap flex items-center justify-center gap-2 active:scale-[0.98] transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:opacity-45 disabled:pointer-events-none ${className}`}
      {...rest}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
};
