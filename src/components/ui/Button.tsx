'use client';

import React, { forwardRef } from 'react';
import { ArrowRight } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  withArrow?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      withArrow = false,
      leftIcon,
      rightIcon,
      children,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-nav select-none cursor-pointer transition-colors duration-200 ' +
      'rounded-none focus-visible:outline-2 focus-visible:outline-[#A8603E] focus-visible:outline-offset-2 ' +
      'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none';

    const variantStyles = {
      primary:
        'bg-[#A8603E] hover:bg-[#94512F] text-white border border-[#A8603E] hover:border-[#94512F]',
      secondary:
        'bg-transparent hover:bg-[#F1EDE8] text-[#2A2521] border border-[#2A2521]',
      outline:
        'bg-transparent hover:bg-[#F1EDE8] text-[#2A2521] border border-[#E4DED6] hover:border-[#2A2521]',
      ghost:
        'bg-transparent hover:bg-[#F1EDE8] text-[#6B645E] hover:text-[#2A2521] border border-transparent',
      danger:
        'bg-transparent hover:bg-[#2A2521] text-[#94512F] hover:text-white border border-[#94512F]',
    };

    const sizeStyles = {
      sm: 'text-[11px] px-3 py-1.5 gap-1.5 min-h-[36px]',
      md: 'text-[12px] sm:text-[13px] px-5 py-2.5 gap-2 min-h-[44px]',
      lg: 'text-[13px] px-7 py-3.5 gap-2.5 min-h-[48px]',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin h-3.5 w-3.5 text-current shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
        )}
        {!isLoading && leftIcon && <span className="shrink-0">{leftIcon}</span>}
        <span className="truncate">{children}</span>
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
        {!isLoading && !rightIcon && withArrow && (
          <ArrowRight className="w-3.5 h-3.5 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={1.5} />
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
