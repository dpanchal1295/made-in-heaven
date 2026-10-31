'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  buttonLabel?: string;
  onAction?: () => void;
  isLoading?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  buttonLabel,
  onAction,
  isLoading = false,
  className = '',
  children,
}: EmptyStateProps) {
  return (
    <div
      className={`bg-white rounded-none border border-[#E4DED6] p-8 sm:p-12 text-center max-w-xl mx-auto my-6 ${className}`}
    >
      <div className="w-12 h-12 rounded-none bg-[#F1EDE8] border border-[#E4DED6] mx-auto flex items-center justify-center text-[#A8603E] mb-4">
        {icon || <Sparkles className="w-5 h-5" strokeWidth={1.5} />}
      </div>

      <h3 className="font-serif text-xl sm:text-2xl font-medium text-[#2A2521] mb-2 tracking-normal">
        {title}
      </h3>

      <p className="text-xs sm:text-sm text-[#6B645E] mb-6 leading-relaxed max-w-md mx-auto">
        {description}
      </p>

      {buttonLabel && onAction && (
        <Button
          variant="primary"
          size="md"
          onClick={onAction}
          isLoading={isLoading}
          withArrow
        >
          {buttonLabel}
        </Button>
      )}

      {children}
    </div>
  );
}
