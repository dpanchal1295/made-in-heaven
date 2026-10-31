'use client';

import React, { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { useReducedMotion } from 'framer-motion';
import { Play, Pause } from 'lucide-react';

export interface HeroVideoProps {
  videoSrc: string;
  posterSrc: string;
  alt?: string;
  className?: string;
}

export function HeroVideo({
  videoSrc,
  posterSrc,
  alt = 'Background video',
  className = '',
}: HeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion && videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else if (!prefersReducedMotion && videoRef.current) {
      // Ensure muted property is explicitly true for browser autoplay policy
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {
        // Autoplay may be deferred or blocked; user can tap toggle button
      });
    }
  }, [prefersReducedMotion]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  return (
    <div className={`relative w-full h-full overflow-hidden group ${className}`}>
      {prefersReducedMotion ? (
        <Image
          src={posterSrc}
          alt={alt}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={posterSrc}
            aria-hidden="true"
            className="w-full h-full object-cover"
          >
            <source src={videoSrc} type="video/mp4" />
          </video>

          {/* Pause / Play Toggle Button (WCAG 2.2.2: visually hidden until hover or keyboard focus) */}
          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause background video' : 'Play background video'}
            className="absolute bottom-6 right-6 z-20 flex items-center justify-center w-10 h-10 rounded-none bg-black/50 hover:bg-black/75 text-white border border-white/30 backdrop-blur-sm opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-300 focus:outline-none focus:ring-2 focus:ring-white focus-visible:opacity-100"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Play className="w-4 h-4 ml-0.5" aria-hidden="true" />
            )}
          </button>
        </>
      )}

      {/* Dark gradient overlay matching wedding hero for text contrast */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/30 pointer-events-none"
        aria-hidden="true"
      />
    </div>
  );
}

