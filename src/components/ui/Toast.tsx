'use client';

import React, { useEffect } from 'react';
import { Check, AlertCircle, Info, X } from 'lucide-react';

export interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose?: () => void;
  durationMs?: number;
}

export function Toast({
  message,
  type = 'success',
  onClose,
  durationMs = 4000,
}: ToastProps) {
  useEffect(() => {
    if (!durationMs || !onClose) return;
    const timer = setTimeout(() => {
      onClose();
    }, durationMs);
    return () => clearTimeout(timer);
  }, [durationMs, onClose]);

  const typeConfig = {
    success: {
      bg: 'bg-[#2A2521] text-white border-[#2A2521]',
      icon: <Check className="w-4 h-4 text-[#A8603E]" strokeWidth={1.5} />,
      role: 'status',
    },
    error: {
      bg: 'bg-[#94512F] text-white border-[#94512F]',
      icon: <AlertCircle className="w-4 h-4 text-white" strokeWidth={1.5} />,
      role: 'alert',
    },
    info: {
      bg: 'bg-[#2A2521] text-white border-[#2A2521]',
      icon: <Info className="w-4 h-4 text-[#A8603E]" strokeWidth={1.5} />,
      role: 'status',
    },
  };

  const config = typeConfig[type];

  return (
    <div
      role={config.role}
      aria-live="polite"
      className={`fixed bottom-6 right-4 sm:right-6 z-50 max-w-sm w-full p-4 rounded-none border flex items-center justify-between gap-3 text-xs sm:text-sm font-medium ${config.bg}`}
    >
      <div className="flex items-center gap-2.5">
        <span className="shrink-0">{config.icon}</span>
        <span className="leading-snug">{message}</span>
      </div>

      {onClose && (
        <button
          onClick={onClose}
          aria-label="Dismiss notification"
          className="p-1 rounded-none text-white/70 hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-[#A8603E] cursor-pointer shrink-0"
        >
          <X className="w-3.5 h-3.5" strokeWidth={1.5} />
        </button>
      )}
    </div>
  );
}
