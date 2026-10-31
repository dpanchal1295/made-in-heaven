'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { Photo } from '@/components/common/Photo';
import { Button } from '@/components/ui';
import { Sparkles, HeartHandshake, ShieldCheck, Scale, ArrowRight } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

export default function AboutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const prefersReducedMotion = useReducedMotion();

  const handleStartPlanning = () => {
    if (user) {
      router.push('/home');
    } else {
      router.push('/signin');
    }
  };

  return (
    <div className="w-full bg-[#FCFBF8] text-[#2A2521] min-h-screen">
      {/* ============================================================ */}
      {/* 1. HERO SECTION (~70vh with photo and two-line headline)     */}
      {/* ============================================================ */}
      <section className="relative w-full h-[65vh] sm:h-[70vh] min-h-[460px] flex items-end pb-16 sm:pb-20 px-6 sm:px-12 lg:px-16 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Photo
            imageKey="hero"
            aspectRatio="hero"
            priority
            className="w-full h-full"
          />
          {/* Editorial dark gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#2A2521]/90 via-[#2A2521]/50 to-[#2A2521]/30" />
        </div>

        <div className="relative z-10 max-w-4xl space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="font-micro text-[11px] text-[#E4DED6] tracking-[0.2em] uppercase block">
              OUR APPROACH & PRINCIPLES
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.8, delay: 0.1 }}
            className="font-serif text-5xl sm:text-6xl md:text-7xl font-normal leading-[1.05] text-white"
          >
            <span className="block font-normal">Weddings, Planned</span>
            <span className="block italic font-normal">Together</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.8, delay: 0.2 }}
            className="text-sm sm:text-base text-white/90 max-w-xl font-light leading-relaxed pt-2"
          >
            A calm, honest space for Indian families to align budgets, schedules, and rituals without chaotic friction.
          </motion.p>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 2. TWO-COLUMN SPLIT: WHAT MADE IN HEAVEN IS & HOW MAYA WORKS */}
      {/* ============================================================ */}
      <section className="max-w-7xl mx-auto py-20 sm:py-28 px-6 sm:px-12 lg:px-16 space-y-24">
        {/* Split 1: What Made in Heaven Is */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="space-y-6">
            <span className="font-micro text-[11px] text-[#94512F] tracking-[0.2em] uppercase block">
              WHAT MADE IN HEAVEN IS
            </span>

            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium text-[#2A2521] leading-tight">
              Quiet clarity for one of life’s most multifaceted celebrations.
            </h2>

            <div className="space-y-4 text-sm sm:text-base text-[#6B645E] leading-relaxed">
              <p>
                An Indian wedding is rarely just an event; it is an intimate confluence of two families, generations of customs, intricate regional rituals, and heartfelt hospitality.
              </p>
              <p>
                Made in Heaven replaces fragmented spreadsheets, conflicting WhatsApp group chats, and anxiety with a thoughtful, structured planning companion designed specifically for multi-day Indian festivities.
              </p>
            </div>
          </div>

          <div className="w-full">
            <Photo
              imageKey="about"
              aspectRatio="tall"
              hoverZoom
              className="border border-[#E4DED6]"
            />
          </div>
        </div>

        {/* Split 2: How Maya Works */}
        <div id="how-maya-works" className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center scroll-mt-24">
          <div className="w-full order-2 lg:order-1">
            <Photo
              imageKey="maya"
              aspectRatio="tall"
              hoverZoom
              className="border border-[#E4DED6]"
            />
          </div>

          <div className="space-y-8 order-1 lg:order-2">
            <div>
              <span className="font-micro text-[11px] text-[#94512F] tracking-[0.2em] uppercase block mb-2">
                HOW MAYA WORKS
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-medium text-[#2A2521]">
                Thoughtful, transparent assistance at every milestone.
              </h2>
            </div>

            <div className="space-y-6">
              {/* Pillar 1: Asks First */}
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 shrink-0 bg-[#F1EDE8] border border-[#E4DED6] flex items-center justify-center text-[#94512F]">
                  <Sparkles className="w-4 h-4" strokeWidth={1.5} />
                </div>
                <div className="space-y-1">
                  <h3 className="font-serif text-xl font-medium text-[#2A2521]">
                    Asks first
                  </h3>
                  <p className="text-xs sm:text-sm text-[#6B645E] leading-relaxed">
                    Maya never pushes pre-made templates. She listens to your family’s traditions, regional preferences, and aesthetic vision first before calculating a single estimate.
                  </p>
                </div>
              </div>

              {/* Pillar 2: Honest in the Way You Like */}
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 shrink-0 bg-[#F1EDE8] border border-[#E4DED6] flex items-center justify-center text-[#94512F]">
                  <Scale className="w-4 h-4" strokeWidth={1.5} />
                </div>
                <div className="space-y-1">
                  <h3 className="font-serif text-xl font-medium text-[#2A2521]">
                    Honest in the way you like
                  </h3>
                  <p className="text-xs sm:text-sm text-[#6B645E] leading-relaxed">
                    Provides grounded per-function INR budget allocations, flags unrealistic expectations gently, and does not push hidden commercial vendor sponsorships.
                  </p>
                </div>
              </div>

              {/* Pillar 3: Plans with the Whole Family */}
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 shrink-0 bg-[#F1EDE8] border border-[#E4DED6] flex items-center justify-center text-[#94512F]">
                  <HeartHandshake className="w-4 h-4" strokeWidth={1.5} />
                </div>
                <div className="space-y-1">
                  <h3 className="font-serif text-xl font-medium text-[#2A2521]">
                    Plans with the whole family
                  </h3>
                  <p className="text-xs sm:text-sm text-[#6B645E] leading-relaxed">
                    Dedicated discussion rooms with role-based permissions (couples, parents as voters, advisors, and viewers). Maya synthesizes consensus and enables majority voting when opinions differ.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Clear Notice on Estimates & Hack2Skills Acknowledgement */}
        <div className="bg-[#F1EDE8] border border-[#E4DED6] p-8 sm:p-10 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#94512F]" strokeWidth={1.5} />
            <span className="font-micro text-[11px] text-[#94512F] tracking-[0.2em] uppercase font-semibold">
              ESTIMATES & SCOPE NOTICE
            </span>
          </div>

          <p className="text-xs sm:text-sm text-[#6B645E] leading-relaxed max-w-3xl">
            All budgets, plate rates, and cost tiers generated by Maya are rough planning ranges intended to help families benchmark realistic allocations. Final contracts and exact fees must always be confirmed directly with real vendors and venues.
          </p>

          <div className="pt-2 border-t border-[#E4DED6] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-[#6B645E]">
            <span className="font-micro tracking-[0.15em] uppercase">
              Built for the Hack2Skills AI Prompt War
            </span>
            <span className="italic">
              Zero fake vendor listings • Realtime family rooms • Native regional script support
            </span>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center py-10 space-y-6">
          <h2 className="font-serif text-3xl sm:text-4xl font-medium text-[#2A2521]">
            Ready to plan with clarity?
          </h2>
          <p className="text-sm text-[#6B645E] max-w-md mx-auto">
            Start your family wedding home in less than a minute and experience Maya’s guidance.
          </p>
          <div className="pt-2">
            <Button
              variant="primary"
              size="lg"
              withArrow
              onClick={handleStartPlanning}
              className="px-8 shadow-sm"
            >
              START PLANNING
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
