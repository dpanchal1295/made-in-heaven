'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';

export interface CurtainHeroProps {
  media: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function CurtainHero({ media, children, className = '' }: CurtainHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  // Track the scroll of the hero container as it reaches the top and gets covered
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  // Scale down slightly as user scrolls down, mimicking card receding into background
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.94]);
  // Border radius rounds into a card as it recedes
  const borderRadius = useTransform(scrollYProgress, [0, 1], ['0px', '28px']);
  // Dimming overlay darkens as the card recedes behind the rising sheet
  const dimOpacity = useTransform(scrollYProgress, [0, 0.8], [0, 0.35]);
  // Fade content gently while receding
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0.3]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[100svh] ${className}`}
      style={{ zIndex: 0 }}
    >
      {/* Pinned Hero Viewport Container */}
      <div className="sticky top-0 left-0 w-full h-[100svh] overflow-hidden flex items-center justify-center pointer-events-none">
        {/* Receding Card Wrapper */}
        {prefersReducedMotion ? (
          <div className="relative w-full h-full overflow-hidden flex flex-col justify-end pb-16 sm:pb-20 px-6 sm:px-12 md:px-20 lg:px-24 pointer-events-auto">
            {/* Background Media */}
            <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
              {media}
            </div>

            {/* Hero Content */}
            <div className="relative max-w-4xl text-white pointer-events-auto" style={{ zIndex: 2 }}>
              {children}
            </div>
          </div>
        ) : (
          <motion.div
            style={{
              scale,
              borderRadius,
              transformOrigin: 'center 20%',
            }}
            className="relative w-full h-full overflow-hidden flex flex-col justify-end pb-16 sm:pb-20 px-6 sm:px-12 md:px-20 lg:px-24 pointer-events-auto shadow-2xl will-change-transform"
          >
            {/* Background Media */}
            <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
              {media}
            </div>

            {/* Receding Dimming Scrim */}
            <motion.div
              style={{ opacity: dimOpacity, zIndex: 1 }}
              className="absolute inset-0 bg-black pointer-events-none"
            />

            {/* Hero Content */}
            <motion.div
              style={{ opacity: contentOpacity, zIndex: 2 }}
              className="relative max-w-4xl text-white pointer-events-auto will-change-[opacity]"
            >
              {children}
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
