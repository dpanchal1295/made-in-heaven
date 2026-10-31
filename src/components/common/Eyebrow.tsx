import React from 'react';

export interface EyebrowProps {
  children: React.ReactNode;
  align?: 'center' | 'left';
  className?: string;
  textColor?: string;
}

export function Eyebrow({
  children,
  align = 'center',
  className = '',
  textColor = 'text-[var(--accent-dark,#94512F)]',
}: EyebrowProps) {
  if (align === 'left') {
    return (
      <div className={`inline-flex items-center gap-3 ${className}`}>
        <span
          className="w-6 h-px bg-[var(--accent-primary,#A8603E)] shrink-0 opacity-80"
          aria-hidden="true"
        />
        <span
          className={`font-sans text-[11px] font-medium tracking-[0.2em] uppercase ${textColor}`}
        >
          {children}
        </span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center justify-center gap-2 sm:gap-3 ${className}`}>
      {/* Left wing: line + small diamond */}
      <span className="flex items-center gap-1.5 opacity-60" aria-hidden="true">
        <span className="w-5 sm:w-8 h-px bg-[var(--accent-primary,#A8603E)]" />
        <span className="text-[7px] text-[var(--accent-primary,#A8603E)] leading-none select-none">
          ◆
        </span>
      </span>

      {/* Label Text */}
      <span
        className={`font-sans text-[11px] font-medium tracking-[0.2em] uppercase px-1 ${textColor}`}
      >
        {children}
      </span>

      {/* Right wing: small diamond + line */}
      <span className="flex items-center gap-1.5 opacity-60" aria-hidden="true">
        <span className="text-[7px] text-[var(--accent-primary,#A8603E)] leading-none select-none">
          ◆
        </span>
        <span className="w-5 sm:w-8 h-px bg-[var(--accent-primary,#A8603E)]" />
      </span>
    </div>
  );
}

