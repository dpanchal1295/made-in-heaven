'use client';

import React from 'react';
import Link from 'next/link';

export interface LogoProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  markOnly?: boolean;
  href?: string;
  className?: string;
}

export function DiyaFlameMark({
  size = 22,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={`shrink-0 transition-transform duration-300 group-hover:scale-105 ${className}`}
    >
      {/* Diya Base / Oil Lamp */}
      <path
        d="M3 13.5C3.8 17.5 7.5 20 12 20C16.5 20 20.2 17.5 21 13.5C18 14.8 14 15.2 12 15.2C10 15.2 6 14.8 3 13.5Z"
        fill="currentColor"
        opacity="0.85"
      />
      {/* Outer Flame (Warm Golden / Primary Accent Glow) */}
      <path
        d="M12 3C12 3 7.8 8.4 8.2 11.2C8.6 13.8 10.3 14.8 12 14.8C13.7 14.8 15.4 13.8 15.8 11.2C16.2 8.4 12 3 12 3Z"
        fill="currentColor"
      />
      {/* Inner Flame Core (Brighter Radiance) */}
      <path
        d="M12 6.5C12 6.5 9.8 9.8 10.1 11.4C10.3 12.8 11.1 13.4 12 13.4C12.9 13.4 13.7 12.8 13.9 11.4C14.2 9.8 12 6.5 12 6.5Z"
        fill="#FFFFFF"
        opacity="0.45"
      />
    </svg>
  );
}

export function Logo({
  variant = 'dark',
  size = 'md',
  markOnly = false,
  href,
  className = '',
}: LogoProps) {
  const markSize = size === 'sm' ? 18 : size === 'lg' ? 26 : 22;

  const textClass =
    size === 'sm'
      ? 'text-lg tracking-wide'
      : size === 'lg'
      ? 'text-2xl sm:text-3xl tracking-wide'
      : 'text-xl sm:text-2xl tracking-wide';

  const markColor =
    variant === 'light'
      ? 'text-white'
      : 'text-[var(--accent-primary,#A8603E)]';

  const wordmarkColor = variant === 'light' ? 'text-white' : 'text-[#2A2521]';
  const italicInColor =
    variant === 'light' ? 'text-white/80' : 'text-[var(--accent-dark,#94512F)]';

  const content = (
    <div
      className={`inline-flex items-center gap-2.5 group select-none ${className}`}
      role={href ? undefined : 'img'}
      aria-label={href ? undefined : 'Made in Heaven'}
    >
      <DiyaFlameMark size={markSize} className={markColor} />
      {!markOnly && (
        <span
          className={`font-serif font-[500] leading-none transition-colors duration-200 ${wordmarkColor} ${textClass}`}
        >
          Made <span className={`text-[0.88em] italic font-[400] mx-0.5 ${italicInColor}`}>in</span> Heaven
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        aria-label="Made in Heaven, home"
        className="inline-block focus-visible:outline-2 focus-visible:outline-[#A8603E] focus-visible:outline-offset-4"
      >
        {content}
      </Link>
    );
  }

  return content;
}

