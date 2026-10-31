'use client';

import React from 'react';
import { EventProfile, PrivateBudget } from '@/types/firestore';
import { formatINR, OnboardingStatus } from '@/lib/utils/format';
import { ProgressBar } from '@/components/ui';
import { Calendar, MapPin, Users, Wallet, Sparkles, Sliders, X, RotateCcw } from 'lucide-react';
import { COPY, getCelebrationTerms } from '@/config/copy';

interface ProfileSidePanelProps {
  profile: EventProfile | null;
  budget: PrivateBudget | null;
  status: OnboardingStatus;
  isOpen: boolean;
  onClose?: () => void;
  onReset: () => void;
  isResetting?: boolean;
}

export const ProfileSidePanel: React.FC<ProfileSidePanelProps> = ({
  profile,
  budget,
  status,
  isOpen,
  onClose,
  onReset,
  isResetting = false,
}) => {
  const terms = getCelebrationTerms(profile?.eventType);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          role="presentation"
          onClick={onClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-30 lg:hidden"
        />
      )}

      <aside
        className={`
          fixed lg:static top-0 right-0 z-40 h-full w-84 sm:w-96
          bg-[#FCFBF8] border-l border-[#E4DED6]
          flex flex-col transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none
          ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Notebook Cover / Header */}
        <div className="p-5 border-b border-[#E4DED6] flex items-center justify-between bg-[#FCFBF8]">
          <div>
            <span className="font-micro text-[10px] text-[#94512F] uppercase tracking-[0.2em] font-medium block">
              BLUEPRINT NOTEBOOK
            </span>
            <h2 className="font-serif font-normal text-[#2A2521] text-lg sm:text-xl mt-0.5">
              {COPY.profilePanel.title}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="lg:hidden p-1.5 text-[#6B645E] hover:text-[#2A2521] cursor-pointer"
                aria-label="Close notebook"
              >
                <X className="w-5 h-5" strokeWidth={1.5} />
              </button>
            )}
          </div>
        </div>

        {/* Progress Strip */}
        <div className="p-5 border-b border-[#E4DED6] bg-[#F1EDE8]">
          <div className="flex items-center justify-between mb-2">
            <span className="font-micro text-[10px] text-[#6B645E] uppercase tracking-[0.18em]">
              DETAILS GATHERED
            </span>
            <span className="font-serif text-sm font-medium text-[#2A2521]">
              {status.completedCount} of {status.totalRequired} {COPY.profilePanel.progressLabel}
            </span>
          </div>

          <ProgressBar
            value={status.percent}
            color="terracotta"
            showValue={false}
            size="sm"
            label="Profile onboarding completeness"
          />

          <div className="mt-3 flex items-center justify-between text-[11px] text-[#6B645E]">
            <span>
              {status.isCoreComplete
                ? '✓ Core blueprint complete'
                : `${status.totalRequired - status.completedCount} detail${
                    status.totalRequired - status.completedCount === 1 ? '' : 's'
                  } remaining`}
            </span>
            <span className="font-mono text-[10px] text-[#2A2521]">{status.percent}%</span>
          </div>
        </div>

        {/* Notebook Content List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 divide-y divide-[#E4DED6]">
          {/* Section: Vitals */}
          <div className="space-y-3 pt-2 first:pt-0">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-[#94512F]" />
              <span className="font-micro text-[10px] uppercase tracking-[0.16em] text-[#6B645E]">
                {terms.dateLabel}
              </span>
            </div>
            <p className="text-sm font-medium text-[#2A2521] pl-5.5">
              {profile?.date || <span className="text-[#6B645E]/60 italic font-normal">To be decided</span>}
            </p>
          </div>

          {/* Section: City */}
          <div className="space-y-3 pt-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-[#94512F]" />
              <span className="font-micro text-[10px] uppercase tracking-[0.16em] text-[#6B645E]">
                City / Location
              </span>
            </div>
            <p className="text-sm font-medium text-[#2A2521] pl-5.5">
              {profile?.city || <span className="text-[#6B645E]/60 italic font-normal">To be confirmed</span>}
            </p>
          </div>

          {/* Section: Guest Count */}
          <div className="space-y-3 pt-4">
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-[#94512F]" />
              <span className="font-micro text-[10px] uppercase tracking-[0.16em] text-[#6B645E]">
                Guest Estimate
              </span>
            </div>
            <p className="text-sm font-medium text-[#2A2521] pl-5.5">
              {profile?.guest_count ? (
                profile.guest_count.planning_value ? (
                  `${profile.guest_count.planning_value} guests`
                ) : profile.guest_count.estimate ? (
                  `${profile.guest_count.estimate} guests`
                ) : profile.guest_count.range ? (
                  `${profile.guest_count.range.low} - ${profile.guest_count.range.high} guests`
                ) : (
                  'Estimated'
                )
              ) : (
                <span className="text-[#6B645E]/60 italic font-normal">Not set yet</span>
              )}
            </p>
          </div>

          {/* Section: Budget (Private / Revealed) */}
          <div className="space-y-3 pt-4">
            <div className="flex items-center gap-2">
              <Wallet className="w-3.5 h-3.5 text-[#94512F]" />
              <span className="font-micro text-[10px] uppercase tracking-[0.16em] text-[#6B645E]">
                Planning Budget
              </span>
            </div>
            <div className="pl-5.5">
              {budget ? (
                budget.planning_value ? (
                  <div>
                    <p className="text-sm font-medium text-[#2A2521]">{formatINR(budget.planning_value)}</p>
                    {budget.range && (
                      <p className="text-xs text-[#6B645E] mt-0.5">
                        Range: {formatINR(budget.range.low)} - {formatINR(budget.range.high)}
                      </p>
                    )}
                  </div>
                ) : budget.total ? (
                  <p className="text-sm font-medium text-[#2A2521]">{formatINR(budget.total)}</p>
                ) : (
                  <p className="text-xs text-[#6B645E]/80">Budget set</p>
                )
              ) : (
                <p className="text-xs text-[#6B645E]/80 italic">Confidential / Not specified</p>
              )}
            </div>
          </div>

          {/* Section: Style & Vibe */}
          <div className="space-y-3 pt-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#94512F]" />
              <span className="font-micro text-[10px] uppercase tracking-[0.16em] text-[#6B645E]">
                Vibe & Traditions
              </span>
            </div>
            <div className="pl-5.5 space-y-1">
              <p className="text-sm font-medium text-[#2A2521]">
                {profile?.vibe || <span className="text-[#6B645E]/60 italic font-normal">Exploring aesthetic</span>}
              </p>
              {profile?.culture && (
                <p className="text-xs text-[#6B645E]">Tradition: {profile.culture}</p>
              )}
            </div>
          </div>

          {/* Section: Communication Style */}
          <div className="space-y-3 pt-4">
            <div className="flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-[#94512F]" />
              <span className="font-micro text-[10px] uppercase tracking-[0.16em] text-[#6B645E]">
                Maya&apos;s Advice Style
              </span>
            </div>
            <p className="text-sm font-medium text-[#2A2521] pl-5.5 capitalize">
              {profile?.communication_style?.honesty_preference || (
                <span className="text-[#6B645E]/60 italic font-normal">Balanced</span>
              )}
            </p>
          </div>
        </div>

        {/* Notebook Footer: Reset Button */}
        <div className="p-4 border-t border-[#E4DED6] bg-[#FCFBF8]">
          <button
            type="button"
            onClick={onReset}
            disabled={isResetting}
            className="w-full py-2.5 px-3 border border-[#E4DED6] hover:border-[#2A2521] bg-white text-xs text-[#6B645E] hover:text-[#2A2521] flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isResetting ? 'Resetting…' : 'Start Fresh with Maya'}</span>
          </button>
        </div>
      </aside>
    </>
  );
};
