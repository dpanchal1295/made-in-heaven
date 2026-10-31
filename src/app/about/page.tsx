'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { Photo } from '@/components/common/Photo';
import { CurtainHero } from '@/components/landing/CurtainHero';
import { Eyebrow } from '@/components/common/Eyebrow';
import { Button } from '@/components/ui';
import {
  Sparkles,
  HeartHandshake,
  ShieldCheck,
  Scale,
  Languages,
  Lock,
  ListChecks,
} from 'lucide-react';
import { useReducedMotion } from 'framer-motion';

export default function AboutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const prefersReducedMotion = useReducedMotion();

  const handleStartPlanning = () => {
    if (user) {
      router.push('/start');
    } else {
      router.push('/signin?redirect=/start');
    }
  };

  return (
    <div className="w-full bg-[#FCFBF8] text-[#2A2521] min-h-screen selection:bg-[#F1EDE8]">
      {/* ============================================================ */}
      {/* 1. HERO SECTION: Full-screen pinned curtain hero (like /weddings) */}
      {/* ============================================================ */}
      <CurtainHero
        media={
          <Photo
            imageKey="hero"
            aspectRatio="hero"
            priority
            quality={85}
            className="w-full h-full object-cover"
          >
            <div
              className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/25"
              aria-hidden="true"
            />
          </Photo>
        }
      >
        <span className="font-micro text-[11px] sm:text-xs text-[#E4DED6] tracking-[0.2em] uppercase block mb-3 font-medium">
          MEET YOUR CELEBRATION PLANNER
        </span>

        <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl lg:text-[76px] font-normal leading-[1.05] tracking-tight mb-6">
          Every celebration, <span className="italic">understood deeply</span>
        </h1>

        <p className="font-sans text-base sm:text-lg md:text-xl text-white/90 font-light max-w-2xl leading-relaxed mb-8 sm:mb-10">
          Maya is an empathetic AI celebration planner designed for Indian families, bringing honest budgets, calm countdowns, and united family consensus to weddings, milestone birthdays, and community festivals.
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <Button
            size="lg"
            onClick={handleStartPlanning}
            className="bg-[#94512F] hover:bg-[#7D3F22] text-white border-0 px-8 py-4 font-sans tracking-widest text-xs font-medium uppercase shadow-lg transition-all"
          >
            START PLANNING
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => {
              const el = document.getElementById('how-maya-plans');
              if (el) {
                el.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
              }
            }}
            className="border-white/50 text-white hover:bg-white hover:text-[#2A2521] px-8 py-4 font-sans tracking-widest text-xs font-medium uppercase backdrop-blur-sm transition-all"
          >
            HOW MAYA PLANS
          </Button>
        </div>
      </CurtainHero>

      {/* ============================================================ */}
      {/* 2. RISING SHEET: WHO MAYA IS & HOW SHE PLANS                 */}
      {/* ============================================================ */}
      <section className="relative z-10 py-20 sm:py-28 px-6 sm:px-12 md:px-20 lg:px-24 bg-[#FCFBF8] rounded-t-[28px] sm:rounded-t-[36px] shadow-[0_-16px_40px_rgba(42,37,33,0.18)]">
        <div className="max-w-7xl mx-auto space-y-24">
          {/* Split 1: What Made in Heaven Is (Rebalanced full-width editorial without empty photo block) */}
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <Eyebrow className="mb-2">
              OUR PHILOSOPHY
            </Eyebrow>

            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-medium text-[#2A2521] leading-tight">
              Quiet clarity for life’s most multifaceted celebrations.
            </h2>

            <div className="space-y-4 text-base sm:text-lg text-[#6B645E] leading-relaxed font-light">
              <p>
                An Indian celebration is never just an event on a calendar. It is a heartfelt confluence of family generations, regional customs, hospitality, and shared pride — whether you are welcoming 300 guests for a sacred wedding, gathering cousins for a 60th birthday Shashti Poorthi, or coordinating 1,000 residents for a society festival.
              </p>
              <p>
                Made in Heaven replaces overwhelming spreadsheets, scattered WhatsApp groups, and second-guessing with a thoughtful, structured planning companion who listens first, organizes every detail transparently, and helps everyone feel heard.
              </p>
            </div>
          </div>

          {/* Split 2: How Maya Plans */}
          <div id="how-maya-plans" className="scroll-mt-24 pt-8 border-t border-[#E4DED6]">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <Eyebrow className="mb-4">
                HOW MAYA PLANS
              </Eyebrow>
              <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal text-[#2A2521]">
                Principles behind every conversation
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Pillar 1: Asks First */}
              <div className="bg-[#FCFBF8] p-8 border border-[#E4DED6] flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-10 h-10 bg-[#F1EDE8] border border-[#E4DED6] flex items-center justify-center text-[#94512F]">
                    <Sparkles className="w-5 h-5" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-serif text-2xl font-normal text-[#2A2521]">
                    Asks first, one question at a time
                  </h3>
                  <p className="font-sans text-sm text-[#6B645E] leading-relaxed">
                    Maya never pushes pre-made packages or overwhelming forms. She texts like an experienced friend, asking one question at a time so you can build your plan at your own pace.
                  </p>
                </div>
              </div>

              {/* Pillar 2: Honest Budgets & Estimates */}
              <div className="bg-[#FCFBF8] p-8 border border-[#E4DED6] flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-10 h-10 bg-[#F1EDE8] border border-[#E4DED6] flex items-center justify-center text-[#94512F]">
                    <Scale className="w-5 h-5" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-serif text-2xl font-normal text-[#2A2521]">
                    Honest budgets, estimates not vendors
                  </h3>
                  <p className="font-sans text-sm text-[#6B645E] leading-relaxed">
                    Every figure is an objective planning estimate in rupees broken down by function. Maya never takes vendor kickbacks, hides commercial sponsorships, or locks you into proprietary contracts.
                  </p>
                </div>
              </div>

              {/* Pillar 3: Families Decide Together */}
              <div className="bg-[#FCFBF8] p-8 border border-[#E4DED6] flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-10 h-10 bg-[#F1EDE8] border border-[#E4DED6] flex items-center justify-center text-[#94512F]">
                    <HeartHandshake className="w-5 h-5" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-serif text-2xl font-normal text-[#2A2521]">
                    Families decide together
                  </h3>
                  <p className="font-sans text-sm text-[#6B645E] leading-relaxed">
                    Invite parents, siblings, or committee members into shared rooms. When opinions diverge, Maya synthesizes options and runs democratic voting with automatic majority tallies.
                  </p>
                </div>
              </div>

              {/* Pillar 4: Languages & Voice */}
              <div className="bg-[#FCFBF8] p-8 border border-[#E4DED6] flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-10 h-10 bg-[#F1EDE8] border border-[#E4DED6] flex items-center justify-center text-[#94512F]">
                    <Languages className="w-5 h-5" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-serif text-2xl font-normal text-[#2A2521]">
                    Languages & voice mode
                  </h3>
                  <p className="font-sans text-sm text-[#6B645E] leading-relaxed">
                    Speak or chat naturally in English or your native language. Maya supports spoken audio and localized script typography across Hindi, Gujarati, Punjabi, and Marathi.
                  </p>
                </div>
              </div>

              {/* Pillar 5: Privacy & Budget Protection */}
              <div className="bg-[#FCFBF8] p-8 border border-[#E4DED6] flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-10 h-10 bg-[#F1EDE8] border border-[#E4DED6] flex items-center justify-center text-[#94512F]">
                    <Lock className="w-5 h-5" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-serif text-2xl font-normal text-[#2A2521]">
                    Private budgets & safety
                  </h3>
                  <p className="font-sans text-sm text-[#6B645E] leading-relaxed">
                    Sensitive total spending numbers remain strictly hidden from advisors or guest viewers. Roles and permissions are enforced at the server level, never left to client state.
                  </p>
                </div>
              </div>

              {/* Pillar 6: Complete Living Plan */}
              <div className="bg-[#FCFBF8] p-8 border border-[#E4DED6] flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-10 h-10 bg-[#F1EDE8] border border-[#E4DED6] flex items-center justify-center text-[#94512F]">
                    <ListChecks className="w-5 h-5" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-serif text-2xl font-normal text-[#2A2521]">
                    Living celebration blueprint
                  </h3>
                  <p className="font-sans text-sm text-[#6B645E] leading-relaxed">
                    Six synchronized tabs covering your itemized budget, preparation timeline countdown, vendor checklist, colour palette, decor concepts, and attire inspirations that update as plans evolve.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Estimates & Fair Notice */}
          <div className="bg-[#F1EDE8] border border-[#E4DED6] p-8 sm:p-10 space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#94512F]" strokeWidth={1.5} />
              <span className="font-micro text-[11px] text-[#94512F] tracking-[0.2em] uppercase font-semibold">
                ESTIMATES & SCOPE NOTICE
              </span>
            </div>

            <p className="text-xs sm:text-sm text-[#6B645E] leading-relaxed max-w-3xl">
              All budgets, catering plate ranges, and decor tiers generated by Maya are benchmark estimates intended to help families organize realistic expectations. Final contracts, prices, and agreements are always finalized directly with real local service providers.
            </p>

            <div className="pt-2 border-t border-[#E4DED6] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-[#6B645E]">
              <span className="font-micro tracking-[0.15em] uppercase font-medium">
                Made in Heaven — Built for Indian Celebrations
              </span>
              <span className="italic">
                Transparent guidance • Role-based family collaboration • Zero vendor kickbacks
              </span>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center py-10 space-y-6">
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-medium text-[#2A2521]">
              Ready to plan your celebration?
            </h2>
            <p className="text-sm sm:text-base text-[#6B645E] max-w-md mx-auto">
              Create your celebration Home in under a minute with Maya.
            </p>
            <div className="pt-2">
              <Button
                variant="primary"
                size="lg"
                onClick={handleStartPlanning}
                className="px-8 shadow-sm bg-[#94512F] hover:bg-[#7D3F22] text-white"
              >
                START PLANNING
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
