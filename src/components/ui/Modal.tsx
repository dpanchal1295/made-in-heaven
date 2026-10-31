'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg';
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  icon,
  children,
  footer,
  maxWidth = 'md',
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/40 transition-opacity"
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div
        className={`relative w-full ${widthStyles[maxWidth]} bg-[#FCFBF8] rounded-none border border-[#E4DED6] p-6 sm:p-7 space-y-4 z-10`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#E4DED6]">
          <div className="flex items-center gap-2.5">
            {icon && <span className="shrink-0 text-[#A8603E]">{icon}</span>}
            <div>
              <h3
                id="modal-title"
                className="font-serif text-lg sm:text-xl font-medium text-[#2A2521] tracking-normal leading-snug"
              >
                {title}
              </h3>
              {description && (
                <p className="text-xs text-[#6B645E] mt-0.5 leading-relaxed">{description}</p>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="text-[#6B645E] hover:text-[#2A2521] p-1 rounded-none hover:bg-[#F1EDE8] transition-colors focus-visible:outline-2 focus-visible:outline-[#A8603E] cursor-pointer"
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        {/* Content Body */}
        {children && <div className="text-xs sm:text-sm text-[#2A2521] leading-relaxed">{children}</div>}

        {/* Footer Actions */}
        {footer && <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-[#E4DED6]">{footer}</div>}
      </div>
    </div>
  );
}
