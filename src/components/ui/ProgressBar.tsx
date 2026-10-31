'use client';

import React from 'react';

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  max?: number;
  label?: string;
  showValue?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'terracotta' | 'charcoal' | 'gradient' | 'rose' | 'emerald';
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  label,
  showValue = false,
  size = 'sm',
  variant = 'terracotta',
  className = '',
  ...props
}: ProgressBarProps) {
  const safeValue = Number.isFinite(value) ? value : 0;
  const safeMax = Number.isFinite(max) && max > 0 ? max : 100;
  const clamped = Math.min(Math.max(safeValue, 0), safeMax);
  const percent = Math.round((clamped / safeMax) * 100);

  const heightStyles = {
    xs: 'h-[1px]',
    sm: 'h-1',
    md: 'h-1.5',
    lg: 'h-2',
  };

  const fillStyles: Record<string, string> = {
    terracotta: 'bg-[#A8603E]',
    charcoal: 'bg-[#2A2521]',
    gradient: 'bg-[#A8603E]',
    rose: 'bg-[#A8603E]',
    emerald: 'bg-[#2A2521]',
  };

  return (
    <div className={`space-y-1.5 w-full ${className}`} {...props}>
      {(label || showValue) && (
        <div className="flex items-center justify-between font-micro text-[#6B645E]">
          {label && <span className="text-[#2A2521] tracking-[0.2em]">{label}</span>}
          {showValue && <span className="font-mono">{percent}%</span>}
        </div>
      )}

      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-label={label || 'Progress'}
        className={`w-full bg-[#E4DED6] overflow-hidden ${heightStyles[size]}`}
      >
        <div
          style={{ width: `${percent}%` }}
          className={`h-full transition-all duration-300 ease-out ${fillStyles[variant] || 'bg-[#A8603E]'}`}
        />
      </div>
    </div>
  );
}
