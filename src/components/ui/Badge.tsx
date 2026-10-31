'use client';

import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | 'default'
    | 'terracotta'
    | 'charcoal'
    | 'outline'
    | 'beige'
    | 'rose'
    | 'saffron'
    | 'gold'
    | 'emerald'
    | 'urgent';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
}

export function Badge({
  variant = 'default',
  size = 'md',
  icon,
  className = '',
  children,
  ...props
}: BadgeProps) {
  const variantStyles: Record<string, string> = {
    default: 'bg-[#F1EDE8] text-[#2A2521] border-[#E4DED6]',
    terracotta: 'bg-[#A8603E] text-white border-[#A8603E]',
    charcoal: 'bg-[#2A2521] text-white border-[#2A2521]',
    outline: 'bg-transparent text-[#2A2521] border-[#E4DED6]',
    beige: 'bg-[#F1EDE8] text-[#94512F] border-[#E4DED6]',
    rose: 'bg-[#F1EDE8] text-[#94512F] border-[#E4DED6]',
    saffron: 'bg-[#F1EDE8] text-[#94512F] border-[#E4DED6]',
    gold: 'bg-[#F1EDE8] text-[#2A2521] border-[#E4DED6]',
    emerald: 'bg-[#F1EDE8] text-[#2A2521] border-[#E4DED6]',
    urgent: 'bg-[#2A2521] text-white border-[#2A2521]',
  };

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 gap-1 font-micro',
    md: 'text-[11px] px-2.5 py-1 gap-1.5 font-micro',
  };

  return (
    <span
      className={`inline-flex items-center rounded-none font-medium border leading-none select-none tracking-[0.2em] uppercase ${
        variantStyles[variant] || variantStyles.default
      } ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}
