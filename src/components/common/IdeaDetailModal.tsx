'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { ExampleIdea } from '@/data/exampleIdeas';
import { Button } from '@/components/ui';
import { X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface IdeaDetailModalProps {
  idea: ExampleIdea | null;
  isOpen: boolean;
  onClose: () => void;
}

export function IdeaDetailModal({ idea, isOpen, onClose }: IdeaDetailModalProps) {
  const router = useRouter();
  const { user } = useAuth();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!idea) return null;

  const handleAskMaya = () => {
    onClose();
    if (user) {
      router.push(`/chat?idea=${encodeURIComponent(idea.name)}`);
    } else {
      router.push('/signin');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-idea-title"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#2A2521]/70 backdrop-blur-xs"
          />

          {/* Square Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-[480px] bg-[#FCFBF8] border border-[#E4DED6] shadow-xl p-6 sm:p-8 flex flex-col justify-between aspect-square"
          >
            {/* Top Bar with Category, Celebration Badge, Cost Tier, and Close Button */}
            <div>
              <div className="flex items-center justify-between gap-3 border-b border-[#E4DED6] pb-3 mb-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-micro text-[10px] text-[#94512F] tracking-[0.2em] uppercase font-semibold">
                    {idea.category}
                  </span>
                  <span className="text-[#E4DED6]">•</span>
                  <span className="font-micro text-[10px] text-[#2A2521] tracking-[0.15em] uppercase px-1.5 py-0.5 border border-[#E4DED6] bg-[#F1EDE8]">
                    {idea.celebration}
                  </span>
                  <span className="text-[#E4DED6]">•</span>
                  <span className="font-micro text-[10px] text-[#6B645E] tracking-[0.15em] font-semibold">
                    {idea.costTier}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close details"
                  className="p-1 text-[#6B645E] hover:text-[#2A2521] transition-colors focus-visible:outline-2 focus-visible:outline-[#A8603E] cursor-pointer"
                >
                  <X className="w-5 h-5" strokeWidth={1.5} />
                </button>
              </div>

              {/* Title & One-Line */}
              <h2
                id="modal-idea-title"
                className="font-serif text-2xl sm:text-3xl font-medium text-[#2A2521] leading-tight mb-2"
              >
                {idea.name}
              </h2>

              <p className="text-xs sm:text-sm text-[#94512F] font-medium mb-4 italic">
                {idea.oneLine}
              </p>

              {/* One-Paragraph Description */}
              <p className="text-xs sm:text-sm text-[#6B645E] leading-relaxed line-clamp-6">
                {idea.description}
              </p>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-[#E4DED6] flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="font-micro text-[10px] text-[#6B645E] tracking-[0.15em] uppercase">
                ESTIMATE CONCEPT ONLY
              </span>

              <Button
                variant="primary"
                size="md"
                withArrow
                leftIcon={<Sparkles className="w-3.5 h-3.5 text-white/80" strokeWidth={1.5} />}
                onClick={handleAskMaya}
                className="w-full sm:w-auto"
              >
                Ask Maya about this idea
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
