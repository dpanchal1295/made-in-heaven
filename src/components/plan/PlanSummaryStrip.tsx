'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatINR } from '@/lib/utils/format';
import { WeddingPlan } from '@/types/firestore';
import { Badge, Button, Modal } from '@/components/ui';
import { Clock, Wallet, Users, AlertCircle, Trash2, Sparkles } from 'lucide-react';
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

function shortBookBy(bookBy: string | undefined): string {
  if (!bookBy) return 'Soon';
  return bookBy.split(' ').slice(0, 2).join(' ');
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

  // Identify 2 most urgent bookings
  const checklistData: any[] = plan?.checklist?.data?.checklist || plan?.checklist?.data || [];
  const bookedVendors = plan?.bookedVendors || {};

  const sortedVendors = [...checklistData].sort((a, b) => {
    const aBooked = bookedVendors[a.vendor_type] ? 1 : 0;
    const bBooked = bookedVendors[b.vendor_type] ? 1 : 0;
    return aBooked - bBooked;
  });

  const urgentBookings = sortedVendors.slice(0, 2);

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
    <div className="bg-white border-b border-[#E4DED6] px-4 sm:px-8 py-5">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Core Celebration Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1">
          {/* 1. Countdown */}
          <div className="bg-[#FCFBF8] rounded-none p-4 border border-[#E4DED6]">
            <div className="flex items-center gap-1.5 text-[#6B645E]">
              <Clock className="w-3.5 h-3.5 text-[#A8603E]" strokeWidth={1.5} />
              <span className="font-micro text-[10px] tracking-[0.2em] uppercase">COUNTDOWN</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="font-serif text-2xl sm:text-3xl font-normal text-[#2A2521]">
                {daysLeft !== null ? daysLeft : '—'}
              </span>
              <span className="font-micro text-[10px] text-[#6B645E] tracking-[0.1em] uppercase">days</span>
            </div>
            <div className="text-[11px] text-[#6B645E] truncate mt-0.5">
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

          {/* 2. Budget */}
          <div className="bg-[#FCFBF8] rounded-none p-4 border border-[#E4DED6]">
            <div className="flex items-center gap-1.5 text-[#6B645E]">
              <Wallet className="w-3.5 h-3.5 text-[#A8603E]" strokeWidth={1.5} />
              <span className="font-micro text-[10px] tracking-[0.2em] uppercase">BUDGET PLAN</span>
            </div>
            {canSeeBudget ? (
              totalBudget ? (
                <>
                  <div className="mt-1">
                    <span className="font-serif text-2xl sm:text-3xl font-normal text-[#2A2521]">
                      {formatINR(totalBudget)}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#6B645E] truncate mt-0.5">
                    {budgetRange ? `Range: ${formatINR(budgetRange.low)} – ${formatINR(budgetRange.high)}` : 'Estimated'}
                  </div>
                </>
              ) : (
                <div className="mt-1.5">
                  <span className="font-serif text-sm font-normal text-[#6B645E] block">
                    {COPY.plan.summaryStrip.notSet}
                  </span>
                  <Link href="/chat" className="text-[11px] text-[#94512F] hover:underline block mt-0.5">
                    Ask Maya to set budget →
                  </Link>
                </div>
              )
            ) : (
              <>
                <div className="mt-1">
                  <span className="font-serif text-base font-normal text-[#6B645E]">
                    Private to hosts
                  </span>
                </div>
                <div className="text-[11px] text-[#6B645E] truncate mt-0.5">
                  Figures restricted
                </div>
              </>
            )}
          </div>

          {/* 3. Guests & City */}
          <div className="bg-[#FCFBF8] rounded-none p-4 border border-[#E4DED6]">
            <div className="flex items-center gap-1.5 text-[#6B645E]">
              <Users className="w-3.5 h-3.5 text-[#A8603E]" strokeWidth={1.5} />
              <span className="font-micro text-[10px] tracking-[0.2em] uppercase">CELEBRATION</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="font-serif text-2xl sm:text-3xl font-normal text-[#2A2521]">
                {guestCount ?? '—'}
              </span>
              <span className="font-micro text-[10px] text-[#6B645E] tracking-[0.1em] uppercase">guests</span>
            </div>
            <div className="text-[11px] text-[#6B645E] truncate mt-0.5">
              {city ? `${city} • Estimated` : (
                <Link href="/chat" className="text-[#94512F] hover:underline">
                  City not set →
                </Link>
              )}
            </div>
          </div>

          {/* 4. Urgent Bookings */}
          <div className="bg-[#FCFBF8] rounded-none p-4 border border-[#E4DED6] col-span-2 sm:col-span-1">
            <div className="flex items-center gap-1.5 text-[#6B645E]">
              <AlertCircle className="w-3.5 h-3.5 text-[#A8603E]" strokeWidth={1.5} />
              <span className="font-micro text-[10px] tracking-[0.2em] uppercase">URGENT</span>
            </div>
            <div className="mt-1.5 space-y-1.5">
              {urgentBookings.length > 0 ? (
                urgentBookings.map((v, idx) => {
                  const isBooked = Boolean(bookedVendors[v.vendor_type]);
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs gap-1.5"
                    >
                      <span className="truncate text-[#2A2521] font-medium" title={v.vendor_type}>
                        {String(v.vendor_type || '').replace(/Service|Team|Venue/g, '').trim() || v.vendor_type}
                      </span>
                      <Badge
                        variant={isBooked ? 'default' : 'outline'}
                        size="sm"
                      >
                        {isBooked ? 'Booked' : shortBookBy(v.book_by)}
                      </Badge>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs text-[#6B645E] italic">
                  Checklist pending
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Global Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0 self-end lg:self-center flex-wrap">
          {isCouple && onOpenReplan && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenReplan}
              className="border-[#94512F] text-[#94512F] hover:bg-[#F1EDE8]"
            >
              Change something
            </Button>
          )}

          {onGenerateAll && (
            <Button
              variant="primary"
              size="sm"
              withArrow
              onClick={onGenerateAll}
              isLoading={isGeneratingAll}
              disabled={isGeneratingAll}
            >
              Generate All
            </Button>
          )}

          {hasAnyPlanData && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowClearConfirm(true)}
              className="border-[#E4DED6] text-[#6B645E] hover:border-[#94512F] hover:text-[#94512F]"
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Clear Confirmation Modal */}
      <Modal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        title="Clear Celebration Plan?"
      >
        <div className="space-y-4">
          <p className="text-sm text-[#6B645E] leading-relaxed">
            This will clear your generated timeline, checklist ticks, palette, and style sections so you can start fresh.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowClearConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isClearing}
              onClick={handleClear}
              className="bg-[#94512F] hover:bg-[#7D4224] text-white"
            >
              Yes, Clear Plan
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
