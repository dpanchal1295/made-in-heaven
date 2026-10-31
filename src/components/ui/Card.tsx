'use client';

import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'beige' | 'cream' | 'hairline' | 'dark' | 'gold' | 'rose' | 'muted';
  interactive?: boolean;
}

export function Card({
  variant = 'default',
  interactive = false,
  className = '',
  children,
  ...props
}: CardProps) {
  const variantStyles: Record<string, string> = {
    default: 'bg-white border-[#E4DED6]',
    beige: 'bg-[#F1EDE8] border-[#E4DED6]',
    cream: 'bg-[#FCFBF8] border-[#E4DED6]',
    hairline: 'bg-transparent border-[#E4DED6]',
    dark: 'bg-[#2A2521] text-white border-[#2A2521]',
    gold: 'bg-white border-[#E4DED6]',
    rose: 'bg-white border-[#E4DED6]',
    muted: 'bg-[#F1EDE8] border-[#E4DED6]',
  };

  const interactiveStyles = interactive
    ? 'cursor-pointer hover:border-[#2A2521] transition-colors duration-200'
    : '';

  return (
    <div
      className={`rounded-none border p-5 sm:p-6 transition-colors duration-200 ${variantStyles[variant] || variantStyles.default} ${interactiveStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`space-y-1 pb-3 border-b border-[#E4DED6] ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={`font-serif text-lg sm:text-xl font-medium text-[#2A2521] tracking-normal leading-snug ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={`text-xs sm:text-sm text-[#6B645E] leading-relaxed ${className}`} {...props}>
      {children}
    </p>
  );
}

export function CardContent({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`pt-3 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`mt-4 pt-3 border-t border-[#E4DED6] flex items-center justify-between text-xs text-[#6B645E] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
