'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatINR } from '@/lib/utils/format';
import { WeddingPlan } from '@/types/firestore';
import { Button, Modal } from '@/components/ui';
import { Clock, Wallet, Users, AlertCircle, Trash2, Sparkles, MapPin } from 'lucide-react';
import { COPY } from '@/config/copy';

function parseLocalDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const m = value.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function formatLocalDate(value: string | null | undefined): string {
  const d = parseLocalDate(value);
  if (!d) return COPY.plan.summaryStrip.notSet;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function daysUntil(value: string | null | undefined): number | null {
  const d = parseLocalDate(value);
  if (!d) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(0, Math.round((d.getTime() - today.getTime()) / 86400000));
}

export interface PlanSummaryStripProps {
  weddingDate: string | null;
  totalBudget: number | null;
  budgetRange: { low: number; high: number } | null;
  guestCount: number | null;
  city: string | null;
  plan: WeddingPlan | null;
  canSeeBudget?: boolean;
  onClearPlan: () => Promise<void>;
  onGenerateAll?: () => Promise<void>;
  isGeneratingAll?: boolean;
  onOpenReplan?: () => void;
  isCouple?: boolean;
}

export function PlanSummaryStrip({
  weddingDate,
  totalBudget,
  budgetRange,
  guestCount,
  city,
  plan,
  canSeeBudget = true,
  onClearPlan,
  onGenerateAll,
  isGeneratingAll = false,
  onOpenReplan,
  isCouple = false,
}: PlanSummaryStripProps) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [daysLeft, setDaysLeft] = useState<number | null>(null);

  useEffect(() => {
    if (weddingDate) {
      setDaysLeft(daysUntil(weddingDate));
    } else {
      setDaysLeft(null);
    }
  }, [weddingDate]);

  const formattedDate = formatLocalDate(weddingDate);

  const handleClear = async () => {
    setIsClearing(true);
    try {
      await onClearPlan();
      setShowClearConfirm(false);
    } finally {
      setIsClearing(false);
    }
  };

  const hasAnyPlanData = Boolean(
    plan?.budget ||
    plan?.timeline ||
    plan?.checklist ||
    plan?.palette ||
    plan?.decor ||
    plan?.attire
  );

  return (
    <div className="bg-white border-b border-[#E4DED6] px-4 sm:px-8 py-6">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Top Header Row with Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-micro text-[10px] uppercase tracking-[0.2em] text-[#94512F] font-medium">
                MASTER BLUEPRINT
              </span>
              <span className="text-[#E4DED6]">·</span>
              <span className="font-micro text-[10px] uppercase tracking-[0.16em] text-[#6B645E]">
                {hasAnyPlanData ? 'LIVING PLAN' : 'DRAFT'}
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-normal text-[#2A2521] mt-0.5">
              Celebration Overview
            </h1>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {isCouple && hasAnyPlanData && onOpenReplan && (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenReplan}
                className="border-[#2A2521] text-[#2A2521] hover:bg-[#F1EDE8] text-xs min-h-[38px]"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5 text-[#94512F]" />
                <span>Adapt with Maya</span>
              </Button>
            )}

            {isCouple && onGenerateAll && (
              <Button
                variant="primary"
                size="sm"
                onClick={onGenerateAll}
                disabled={isGeneratingAll}
                className="bg-[#2A2521] hover:bg-black text-white text-xs min-h-[38px]"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                <span>{isGeneratingAll ? 'Synthesizing Blueprint…' : 'Generate Full Plan'}</span>
              </Button>
            )}

            {isCouple && hasAnyPlanData && (
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                title="Clear blueprint"
                aria-label="Clear entire celebration blueprint"
                className="p-2 border border-[#E4DED6] hover:border-[#2A2521] text-[#6B645E] hover:text-[#94512F] transition-colors cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* 4 Clean Editorial Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Countdown Card */}
          <div className="bg-[#FCFBF8] p-4.5 border border-[#E4DED6] flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#6B645E]">
              <span className="font-micro text-[10px] tracking-[0.2em] uppercase">COUNTDOWN</span>
              <Clock className="w-3.5 h-3.5 text-[#94512F]" strokeWidth={1.5} />
            </div>
            <div className="my-2 flex items-baseline gap-1.5">
              <span className="font-serif text-3xl sm:text-4xl font-normal text-[#2A2521]">
                {daysLeft !== null ? daysLeft : '—'}
              </span>
              <span className="font-micro text-[11px] text-[#6B645E] tracking-[0.1em] uppercase">days</span>
            </div>
            <div className="text-[11px] text-[#6B645E] truncate">
              {weddingDate ? (
                formattedDate
              ) : (
                <Link href="/chat" className="text-[#94512F] hover:underline flex items-center gap-1">
                  <span>{COPY.plan.summaryStrip.notSet}</span>
                  <Sparkles className="w-2.5 h-2.5" />
                </Link>
              )}
            </div>
          </div>

          {/* 2. Budget Card */}
          <div className="bg-[#FCFBF8] p-4.5 border border-[#E4DED6] flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#6B645E]">
              <span className="font-micro text-[10px] tracking-[0.2em] uppercase">BUDGET ALLOCATION</span>
              <Wallet className="w-3.5 h-3.5 text-[#94512F]" strokeWidth={1.5} />
            </div>
            <div className="my-2">
              {canSeeBudget ? (
                totalBudget ? (
                  <span className="font-serif text-2xl sm:text-3xl font-normal text-[#2A2521]">
                    {formatINR(totalBudget)}
                  </span>
                ) : (
                  <span className="font-serif text-xl sm:text-2xl font-normal text-[#6B645E]">Not fixed</span>
                )
              ) : (
                <span className="font-serif text-lg font-normal text-[#6B645E]">Confidential</span>
              )}
            </div>
            <div className="text-[11px] text-[#6B645E] truncate">
              {canSeeBudget ? (
                budgetRange ? (
                  `Range: ${formatINR(budgetRange.low)} – ${formatINR(budgetRange.high)}`
                ) : (
                  'Target planning figure'
                )
              ) : (
                'Visible to hosts'
              )}
            </div>
          </div>

          {/* 3. Guest Capacity Card */}
          <div className="bg-[#FCFBF8] p-4.5 border border-[#E4DED6] flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#6B645E]">
              <span className="font-micro text-[10px] tracking-[0.2em] uppercase">GUEST CAPACITY</span>
              <Users className="w-3.5 h-3.5 text-[#94512F]" strokeWidth={1.5} />
            </div>
            <div className="my-2 flex items-baseline gap-1.5">
              <span className="font-serif text-3xl sm:text-4xl font-normal text-[#2A2521]">
                {guestCount !== null ? guestCount : '—'}
              </span>
              <span className="font-micro text-[11px] text-[#6B645E] tracking-[0.1em] uppercase">guests</span>
            </div>
            <div className="text-[11px] text-[#6B645E] truncate">
              {guestCount ? 'Planning headcount' : 'To be estimated'}
            </div>
          </div>

          {/* 4. Host City Card */}
          <div className="bg-[#FCFBF8] p-4.5 border border-[#E4DED6] flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#6B645E]">
              <span className="font-micro text-[10px] tracking-[0.2em] uppercase">CELEBRATION CITY</span>
              <MapPin className="w-3.5 h-3.5 text-[#94512F]" strokeWidth={1.5} />
            </div>
            <div className="my-2">
              <span className="font-serif text-2xl sm:text-3xl font-normal text-[#2A2521] truncate block">
                {city || 'To be decided'}
              </span>
            </div>
            <div className="text-[11px] text-[#6B645E] truncate">
              Regional vendor benchmarks
            </div>
          </div>
        </div>
      </div>

      {/* Clear Blueprint Modal */}
      <Modal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        title="Clear Celebration Blueprint"
      >
        <div className="space-y-4 pt-2">
          <div className="flex items-start gap-3 p-3 bg-[#F1EDE8] border border-[#E4DED6] text-xs text-[#2A2521]">
            <AlertCircle className="w-4 h-4 text-[#94512F] shrink-0 mt-0.5" />
            <p>
              This will reset all 6 blueprint tabs (budget, timeline, checklist, palette, decor, attire). Your profile answers and room chats will be kept.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowClearConfirm(false)}
              className="border-[#E4DED6]"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleClear}
              disabled={isClearing}
              className="bg-[#94512F] text-white hover:bg-[#863A57]"
            >
              {isClearing ? 'Clearing…' : 'Clear Blueprint'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
