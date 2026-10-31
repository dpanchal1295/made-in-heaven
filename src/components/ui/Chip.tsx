'use client';

import React from 'react';

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
  selected?: boolean;
  active?: boolean;
  variant?: 'default' | 'terracotta' | 'outline' | 'rose' | 'gold';
  icon?: React.ReactNode;
}

export function Chip({
  label,
  selected = false,
  active = false,
  variant = 'default',
  icon,
  className = '',
  children,
  ...props
}: ChipProps) {
  const isSelected = selected || active;
  const baseStyles =
    'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-nav select-none cursor-pointer ' +
    'rounded-none border transition-colors duration-150 uppercase tracking-[0.15em] ' +
    'focus-visible:outline-2 focus-visible:outline-[#A8603E] focus-visible:outline-offset-2 ' +
    'disabled:opacity-40 disabled:cursor-not-allowed';

  const variantStyles = {
    default: isSelected
      ? 'bg-[#2A2521] text-white border-[#2A2521]'
      : 'bg-white hover:bg-[#F1EDE8] text-[#2A2521] border-[#E4DED6] hover:border-[#2A2521]',
    terracotta: isSelected
      ? 'bg-[#A8603E] text-white border-[#A8603E]'
      : 'bg-transparent hover:bg-[#F1EDE8] text-[#94512F] border-[#E4DED6] hover:border-[#A8603E]',
    outline: isSelected
      ? 'bg-[#2A2521] text-white border-[#2A2521]'
      : 'bg-transparent hover:bg-[#F1EDE8] text-[#2A2521] border-[#E4DED6] hover:border-[#2A2521]',
    rose: isSelected
      ? 'bg-[#A8603E] text-white border-[#A8603E]'
      : 'bg-transparent hover:bg-[#F1EDE8] text-[#2A2521] border-[#E4DED6]',
    gold: isSelected
      ? 'bg-[#2A2521] text-white border-[#2A2521]'
      : 'bg-transparent hover:bg-[#F1EDE8] text-[#2A2521] border-[#E4DED6]',
  };

  return (
    <button
      type="button"
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="truncate">{children ?? label}</span>
    </button>
  );
}
