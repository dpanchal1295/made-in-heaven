'use client';

import React from 'react';
import { EventProfile, PrivateBudget } from '@/types/firestore';
import { formatINR, OnboardingStatus } from '@/lib/utils/format';
import { Badge, ProgressBar } from '@/components/ui';
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
    <aside
      className={`
        fixed lg:static top-0 right-0 z-40 h-full w-84 sm:w-96
        bg-[#FCFBF8] border-l border-[#E4DED6]
        flex flex-col transition-transform duration-300 ease-in-out shadow-xl lg:shadow-none
        ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
      `}
    >
      {/* Header */}
      <div className="p-5 border-b border-[#E4DED6] flex items-center justify-between">
        <div>
          <h2 className="font-serif font-medium text-[#2A2521] text-lg">
            {COPY.profilePanel.title}
          </h2>
          <p className="font-micro text-[11px] text-[#6B645E] uppercase tracking-[0.15em] mt-0.5">
            LIVE NOTES FROM MAYA
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 text-[#6B645E] hover:text-[#2A2521] cursor-pointer focus-visible:ring-1 focus-visible:ring-[#94512F]"
              aria-label="Close panel"
            >
              <X className="w-5 h-5" strokeWidth={1.5} />
            </button>
          )}
        </div>
      </div>

      {/* Onboarding Progress Card */}
      <div className="p-5 border-b border-[#E4DED6] bg-[#F1EDE8]">
        <div className="flex items-center justify-between mb-2">
          <span className="font-micro text-[10px] text-[#6B645E] uppercase tracking-[0.2em]">
            DETAILS GATHERED
          </span>
          <span className="font-serif text-sm font-medium text-[#2A2521]">
            {status.completedCount} of {status.totalRequired} {COPY.profilePanel.progressLabel}
          </span>
        </div>

        {/* Hairline Progress Bar */}
        <ProgressBar
          value={status.percent}
          color="terracotta"
          showValue={false}
          size="sm"
          label="Profile onboarding completeness"
        />

        <div className="mt-2.5 flex items-center justify-between text-xs text-[#6B645E]">
          <span>{status.isCoreComplete ? 'Key foundation saved' : 'Collecting details'}</span>
          <span className="font-mono">{status.percent}%</span>
        </div>
      </div>

      {/* Profile Details List */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3">
        {/* 1. Date */}
        <div className="p-4 border border-[#E4DED6] bg-white">
          <div className="flex items-center justify-between">
            <span className="font-micro text-[11px] text-[#6B645E] uppercase tracking-[0.15em] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#94512F]" strokeWidth={1.5} />
              {terms.dateLabel}
            </span>
            {profile?.date ? (
              <Badge variant="outline" size="sm" className="font-micro text-[#2A2521]">Saved</Badge>
            ) : (
              <Badge variant="outline" size="sm" className="font-micro text-[#94512F]">Pending</Badge>
            )}
          </div>
          <div className="mt-2 font-serif text-base font-normal text-[#2A2521]">
            {profile?.date || COPY.profilePanel.notSet}
          </div>
        </div>

        {/* 2. City */}
        <div className="p-4 border border-[#E4DED6] bg-white">
          <div className="flex items-center justify-between">
            <span className="font-micro text-[11px] text-[#6B645E] uppercase tracking-[0.15em] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#94512F]" strokeWidth={1.5} />
              {COPY.profilePanel.city}
            </span>
            {profile?.city ? (
              <Badge variant="outline" size="sm" className="font-micro text-[#2A2521]">Saved</Badge>
            ) : (
              <Badge variant="outline" size="sm" className="font-micro text-[#94512F]">Pending</Badge>
            )}
          </div>
          <div className="mt-2 font-serif text-base font-normal text-[#2A2521]">
            {profile?.city || COPY.profilePanel.notSet}
          </div>
        </div>

        {/* 3. Guest Count */}
        <div className="p-4 border border-[#E4DED6] bg-white">
          <div className="flex items-center justify-between">
            <span className="font-micro text-[11px] text-[#6B645E] uppercase tracking-[0.15em] flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#94512F]" strokeWidth={1.5} />
              {terms.guestLabel}
            </span>
            {profile?.guest_count?.estimate || profile?.guest_count?.planning_value ? (
              <Badge variant="outline" size="sm" className="font-micro text-[#2A2521]">Saved</Badge>
            ) : (
              <Badge variant="outline" size="sm" className="font-micro text-[#94512F]">Pending</Badge>
            )}
          </div>
          <div className="mt-2">
            {profile?.guest_count?.range ? (
              <div className="space-y-1">
                <div className="text-xs text-[#6B645E]">
                  Range: <span className="font-medium text-[#2A2521]">{profile.guest_count.range.low.toLocaleString('en-IN')} – {profile.guest_count.range.high.toLocaleString('en-IN')}</span>
                </div>
                <div className="font-serif text-base font-normal text-[#2A2521]">
                  {(profile.guest_count.planning_value ?? profile.guest_count.estimate ?? 0).toLocaleString('en-IN')} guests
                </div>
              </div>
            ) : profile?.guest_count?.estimate ? (
              <div className="font-serif text-base font-normal text-[#2A2521]">
                {profile.guest_count.estimate.toLocaleString('en-IN')} guests
              </div>
            ) : (
              <div className="font-serif text-base text-[#6B645E]">
                {COPY.profilePanel.notSet}
              </div>
            )}
          </div>
        </div>

        {/* 4. Budget */}
        <div className="p-4 border border-[#E4DED6] bg-[#F1EDE8]">
          <div className="flex items-center justify-between">
            <span className="font-micro text-[11px] text-[#94512F] uppercase tracking-[0.15em] flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-[#94512F]" strokeWidth={1.5} />
              {COPY.profilePanel.budget}
            </span>
            {budget?.total || budget?.planning_value ? (
              <Badge variant="outline" size="sm" className="font-micro text-[#2A2521]">Saved</Badge>
            ) : (
              <Badge variant="outline" size="sm" className="font-micro text-[#94512F]">Pending</Badge>
            )}
          </div>
          <div className="mt-2">
            {budget?.range ? (
              <div className="space-y-1">
                <div className="text-xs text-[#6B645E]">
                  Range: <span className="font-medium text-[#2A2521]">{formatINR(budget.range.low)} – {formatINR(budget.range.high)}</span>
                </div>
                <div className="font-serif text-xl font-normal text-[#2A2521]">
                  {formatINR(budget.planning_value ?? budget.total)}
                </div>
              </div>
            ) : budget?.total ? (
              <div className="font-serif text-xl font-normal text-[#2A2521]">
                {formatINR(budget.total)}
              </div>
            ) : (
              <div className="font-serif text-base text-[#6B645E]">
                {COPY.profilePanel.notSet}
              </div>
            )}
          </div>
          <p className="text-[10px] text-[#6B645E] mt-1.5">
            Stored in private budget with host permissions.
          </p>
        </div>

        {/* 5. Theme / Culture */}
        <div className="p-4 border border-[#E4DED6] bg-white">
          <div className="flex items-center justify-between">
            <span className="font-micro text-[11px] text-[#6B645E] uppercase tracking-[0.15em] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#94512F]" strokeWidth={1.5} />
              {terms.themeOrCultureLabel}
            </span>
            {profile?.culture && profile.culture.length > 0 ? (
              <Badge variant="outline" size="sm" className="font-micro text-[#2A2521]">Saved</Badge>
            ) : (
              <Badge variant="outline" size="sm" className="font-micro text-[#94512F]">Pending</Badge>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {profile?.culture && profile.culture.length > 0 ? (
              profile.culture.map((c, i) => (
                <span key={i} className="px-2 py-0.5 text-xs bg-[#F1EDE8] border border-[#E4DED6] text-[#2A2521]">
                  {c}
                </span>
              ))
            ) : (
              <span className="text-xs text-[#6B645E] italic">{COPY.profilePanel.notSet}</span>
            )}
          </div>
        </div>

        {/* 6. Vibe */}
        <div className="p-4 border border-[#E4DED6] bg-white">
          <div className="flex items-center justify-between">
            <span className="font-micro text-[11px] text-[#6B645E] uppercase tracking-[0.15em] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#94512F]" strokeWidth={1.5} />
              {COPY.profilePanel.vibe}
            </span>
            {profile?.vibe ? (
              <Badge variant="outline" size="sm" className="font-micro text-[#2A2521]">Saved</Badge>
            ) : (
              <Badge variant="outline" size="sm" className="font-micro text-[#94512F]">Pending</Badge>
            )}
          </div>
          <div className="mt-2 font-serif text-base font-normal text-[#2A2521]">
            {profile?.vibe || COPY.profilePanel.notSet}
          </div>
        </div>

        {/* 7. Communication Style */}
        <div className="p-4 border border-[#E4DED6] bg-white">
          <div className="flex items-center justify-between">
            <span className="font-micro text-[11px] text-[#6B645E] uppercase tracking-[0.15em] flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-[#94512F]" strokeWidth={1.5} />
              Feedback Style
            </span>
            {profile?.communication_style?.honesty_preference ? (
              <Badge variant="outline" size="sm" className="font-micro text-[#2A2521]">Saved</Badge>
            ) : (
              <Badge variant="outline" size="sm" className="font-micro text-[#6B645E]">Optional</Badge>
            )}
          </div>
          <div className="mt-2 text-xs font-medium text-[#2A2521] capitalize">
            {profile?.communication_style?.honesty_preference || 'Balanced (default)'}
          </div>
        </div>

        {/* Locked Constraints */}
        {profile?.locked_constraints && profile.locked_constraints.length > 0 && (
          <div className="p-4 border border-[#94512F]/40 bg-[#F1EDE8]">
            <div className="font-micro text-[10px] font-semibold text-[#94512F] uppercase tracking-[0.15em]">
              Locked Non-Negotiables
            </div>
            <ul className="mt-2 space-y-1">
              {profile.locked_constraints.map((item, idx) => (
                <li
                  key={idx}
                  className="text-xs text-[#2A2521] font-medium flex items-center gap-1.5"
                >
                  <span className="text-[#94512F]">—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Footer / Reset Action */}
      <div className="p-4 border-t border-[#E4DED6] flex items-center justify-between bg-white">
        <button
          type="button"
          onClick={onReset}
          disabled={isResetting}
          className="flex items-center gap-1.5 text-xs text-[#6B645E] hover:text-[#94512F] cursor-pointer transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.5} />
          <span>{isResetting ? 'Restarting...' : 'Restart conversation'}</span>
        </button>
      </div>
    </aside>
  );
};
