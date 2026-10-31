'use client';

import React, { useState, useEffect } from 'react';
import { formatINR } from '@/lib/utils/format';
import { WeddingPlan } from '@/types/firestore';
import { Badge, Button, Modal } from '@/components/ui';
import { Clock, Wallet, Users, AlertCircle, Trash2 } from 'lucide-react';

/**
 * Reads a wedding date like "2026-12-18" as a LOCAL calendar day.
 * new Date("2026-12-18") treats it as midnight UTC, which shows as
 * 17 December in the Americas. This keeps it 18 December everywhere.
 */
function parseLocalDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const m = value.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/** "2026-12-18" -> "18 December 2026" */
function formatLocalDate(value: string | null | undefined): string {
  const d = parseLocalDate(value);
  if (!d) return value || '';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Whole days from today until the wedding (0 if it has passed) */
function daysUntil(value: string | null | undefined): number | null {
  const d = parseLocalDate(value);
  if (!d) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(0, Math.round((d.getTime() - today.getTime()) / 86400000));
}

/** Short "book by" label for the Urgent card, e.g. "8-10 months before venue" -> "8-10 months" */
function shortBookBy(bookBy: string | undefined): string {
  if (!bookBy) return 'Soon';
  return bookBy.split(' ').slice(0, 2).join(' ');
}

export interface PlanSummaryStripProps {
  weddingDate: string;
  totalBudget: number;
  budgetRange: { low: number; high: number };
  guestCount: number;
  city: string;
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

  // Computed in the browser only, so server and browser never disagree
  useEffect(() => {
    setDaysLeft(daysUntil(weddingDate));
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
        {/* Core Wedding Metrics Grid */}
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
              {formattedDate}
            </div>
          </div>

          {/* 2. Budget */}
          <div className="bg-[#FCFBF8] rounded-none p-4 border border-[#E4DED6]">
            <div className="flex items-center gap-1.5 text-[#6B645E]">
              <Wallet className="w-3.5 h-3.5 text-[#A8603E]" strokeWidth={1.5} />
              <span className="font-micro text-[10px] tracking-[0.2em] uppercase">BUDGET PLAN</span>
            </div>
            {canSeeBudget ? (
              <>
                <div className="mt-1">
                  <span className="font-serif text-2xl sm:text-3xl font-normal text-[#2A2521]">
                    {formatINR(totalBudget)}
                  </span>
                </div>
                <div className="text-[11px] text-[#6B645E] truncate mt-0.5">
                  Range: {formatINR(budgetRange.low)} – {formatINR(budgetRange.high)}
                </div>
              </>
            ) : (
              <>
                <div className="mt-1">
                  <span className="font-serif text-base font-normal text-[#6B645E]">
                    Private to couple
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
                {guestCount}
              </span>
              <span className="font-micro text-[10px] text-[#6B645E] tracking-[0.1em] uppercase">guests</span>
            </div>
            <div className="text-[11px] text-[#6B645E] truncate mt-0.5">
              {city} • Estimated
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
              leftIcon={<Trash2 className="w-3.5 h-3.5 text-[#6B645E]" strokeWidth={1.5} />}
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Confirmation Modal for Clearing Plan */}
      <Modal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        title="Clear Wedding Plan?"
        description="This will clear all 6 plan tabs (budget, timeline, checklist, attire, decor, palette) for this Home."
        icon={<AlertCircle className="w-5 h-5 text-[#94512F]" strokeWidth={1.5} />}
        footer={
          <div className="flex items-center gap-2.5">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowClearConfirm(false)}
              disabled={isClearing}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleClear}
              isLoading={isClearing}
              disabled={isClearing}
            >
              Yes, Clear Plan
            </Button>
          </div>
        }
      >
        <p className="text-xs text-[#6B645E] leading-relaxed">
          You can regenerate any section at any time by speaking to Maya in chat or pressing the generate buttons on each tab.
        </p>
      </Modal>
    </div>
  );
}