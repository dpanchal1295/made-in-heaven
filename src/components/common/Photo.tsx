'use client';

import React from 'react';
import Image from 'next/image';
import { APP_IMAGES, ImageKey } from '@/config/images';
import availableImagesList from '@/config/available-images.json';

const AVAILABLE_SET = new Set<string>(availableImagesList);

export interface PhotoProps {
  imageKey?: ImageKey;
  src?: string | null;
  hoverSrc?: string | null;
  focus?: string;
  alt?: string;
  aspectRatio?: 'square' | 'video' | 'portrait' | 'tall' | 'wide' | 'hero' | '4/3' | string;
  priority?: boolean;
  quality?: number;
  sizes?: string;
  className?: string;
  hoverZoom?: boolean;
  children?: React.ReactNode;
}

const ASPECT_CLASSES: Record<string, string> = {
  square: 'aspect-square',
  tall: 'aspect-[4/5]',
  '4/3': 'aspect-[4/3]',
  portrait: 'aspect-[3/4]',
  video: 'aspect-video',
  wide: 'aspect-[16/9]',
  hero: 'h-full w-full',
};

export function Photo({
  imageKey,
  src,
  hoverSrc,
  focus,
  alt,
  aspectRatio = 'portrait',
  priority = false,
  quality = 80,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  className = '',
  hoverZoom = false,
  children,
}: PhotoProps) {
  const [hasError, setHasError] = React.useState(false);
  const item = imageKey ? APP_IMAGES[imageKey] : null;
  const finalSrc = src !== undefined ? src : item?.src ?? null;
  const finalHoverSrc = hoverSrc !== undefined ? hoverSrc : item?.hoverSrc ?? null;
  const finalFocus = focus !== undefined ? focus : item?.focus || 'center';
  const finalAlt = alt || item?.alt || 'Editorial celebration photograph';
  const aspectClass = ASPECT_CLASSES[aspectRatio] || aspectRatio;

  // Check availability against build-time generated available-images.json
  const isAvailable = finalSrc ? AVAILABLE_SET.has(finalSrc) : false;

  // Plain blank beige block when src is missing, not in available list, or on error
  if (!finalSrc || !isAvailable || hasError) {
    return (
      <div
        className={`relative w-full overflow-hidden bg-[#E9E3DB] ${aspectClass} ${className}`}
        aria-hidden="true"
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className={`relative w-full overflow-hidden bg-[#E9E3DB] ${aspectClass} ${className} group`}
    >
      {/* Primary Image */}
      <Image
        src={finalSrc}
        alt={finalAlt}
        fill
        priority={priority}
        loading={priority ? undefined : 'lazy'}
        quality={quality}
        sizes={sizes}
        style={{ objectPosition: finalFocus }}
        onError={() => setHasError(true)}
        className={`object-cover transition-all duration-700 ease-out ${
          hoverZoom ? 'group-hover:scale-[1.04]' : ''
        } ${finalHoverSrc ? 'group-hover:opacity-0' : ''}`}
      />

      {/* Secondary Hover Image (mounted ONLY when hoverSrc exists) */}
      {finalHoverSrc && (
        <Image
          src={finalHoverSrc}
          alt={`${finalAlt} (alternate view)`}
          fill
          loading="lazy"
          quality={quality}
          sizes={sizes}
          style={{ objectPosition: finalFocus }}
          className={`object-cover opacity-0 group-hover:opacity-100 transition-all duration-700 ease-out ${
            hoverZoom ? 'group-hover:scale-[1.04]' : ''
          }`}
        />
      )}

      {children}
    </div>
  );
}
