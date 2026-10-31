'use client';

import { useState } from 'react';
import { ChecklistItem } from '@/lib/maya/schemas';
import { PlanPartSource } from '@/types/firestore';
import { Card, Badge, ProgressBar, EmptyState } from '@/components/ui';
import { CheckSquare, Calendar, MessageSquare, Check, HelpCircle } from 'lucide-react';

interface ChecklistTabProps {
  checklistData: ChecklistItem[] | null;
  bookedVendors: Record<string, boolean>;
  source?: PlanPartSource;
  onToggleBooked: (vendorType: string, booked: boolean) => Promise<void>;
  onGenerate: () => void;
  isLoading?: boolean;
}

export function ChecklistTab({
  checklistData,
  bookedVendors = {},
  source,
  onToggleBooked,
  onGenerate,
  isLoading = false,
}: ChecklistTabProps) {
  const [togglingVendors, setTogglingVendors] = useState<Record<string, boolean>>({});

  if (!checklistData || checklistData.length === 0) {
    return (
      <EmptyState
        icon={<CheckSquare className="w-5 h-5 text-[#A8603E]" strokeWidth={1.5} />}
        title="No Checklist Generated Yet"
        description="Maya will structure an actionable vendor booking checklist with recommended lead times and critical contract questions."
        buttonLabel="Generate Checklist with Maya"
        onAction={onGenerate}
        isLoading={isLoading}
      />
    );
  }

  // Calculate progress
  const totalCount = checklistData.length;
  const bookedCount = checklistData.filter((item) => bookedVendors[item.vendor_type]).length;
  const progressPercent = totalCount > 0 ? Math.round((bookedCount / totalCount) * 100) : 0;

  const handleCheckboxChange = async (vendorType: string, currentStatus: boolean) => {
    setTogglingVendors((prev) => ({ ...prev, [vendorType]: true }));
    try {
      await onToggleBooked(vendorType, !currentStatus);
    } finally {
      setTogglingVendors((prev) => ({ ...prev, [vendorType]: false }));
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header & Progress */}
      <Card className="border border-[#E4DED6] bg-white p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-serif text-xl sm:text-2xl font-medium text-[#2A2521]">
                Vendor Booking Checklist
              </h3>
              {source === 'mock' && (
                <span className="px-2 py-0.5 bg-[#F2EDE4] border border-[#D5C7B5] text-[#94512F] text-[10px] font-mono tracking-wider uppercase font-bold">
                  Sample
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-[#6B645E]">
              Check off vendors as contracts are finalized. Ticks are saved automatically to your Home.
            </p>
          </div>

          <div className="text-right">
            <span className="font-micro text-[11px] text-[#2A2521] tracking-[0.15em] uppercase">
              {bookedCount} of {totalCount} Booked ({progressPercent}%)
            </span>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <ProgressBar
          value={progressPercent}
          variant="terracotta"
          size="sm"
          label="Booking Completion"
          showValue
        />
      </Card>

      {/* Vendor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {checklistData.map((item, idx) => {
          const isBooked = Boolean(bookedVendors[item.vendor_type]);
          const isToggling = Boolean(togglingVendors[item.vendor_type]);

          return (
            <div
              key={idx}
              className={`border transition-colors duration-200 p-5 sm:p-6 flex flex-col justify-between ${
                isBooked
                  ? 'bg-[#F1EDE8]/50 border-[#E4DED6]'
                  : 'bg-white border-[#E4DED6] hover:border-[#2A2521]'
              }`}
            >
              <div className="space-y-4">
                {/* Header row with vendor name & checkbox */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="font-micro text-[10px] text-[#94512F] tracking-[0.2em] uppercase block">
                      VENDOR CATEGORY
                    </span>
                    <h4
                      className={`font-serif text-lg sm:text-xl font-medium ${
                        isBooked ? 'line-through text-[#6B645E]' : 'text-[#2A2521]'
                      }`}
                    >
                      {item.vendor_type}
                    </h4>
                  </div>

                  {/* Interactive square checkbox button */}
                  <button
                    type="button"
                    onClick={() => handleCheckboxChange(item.vendor_type, isBooked)}
                    disabled={isToggling}
                    className={`flex items-center gap-1.5 px-3 py-1.5 border text-xs font-nav uppercase tracking-[0.15em] transition-colors cursor-pointer select-none rounded-none focus-visible:outline-2 focus-visible:outline-[#A8603E] ${
                      isBooked
                        ? 'bg-[#2A2521] text-white border-[#2A2521]'
                        : 'bg-transparent text-[#2A2521] border-[#E4DED6] hover:border-[#2A2521]'
                    }`}
                  >
                    {isBooked ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#A8603E]" strokeWidth={2} />
                        <span>Booked</span>
                      </>
                    ) : (
                      <span>Pending</span>
                    )}
                  </button>
                </div>

                {/* Lead time & timing */}
                <div className="flex items-center gap-1.5 text-xs text-[#6B645E] pt-2 border-t border-[#E4DED6]">
                  <Calendar className="w-3.5 h-3.5 text-[#A8603E]" strokeWidth={1.5} />
                  <span>Book by: {item.book_by}</span>
                </div>

                {/* Questions to ask vendor */}
                {item.questions_to_ask && (
                  <div className="pt-3 space-y-2 border-t border-[#E4DED6]">
                    <div className="flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-[#94512F]" strokeWidth={1.5} />
                      <span className="font-micro text-[10px] text-[#94512F] tracking-[0.15em] uppercase">
                        Questions before signing:
                      </span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-[#6B645E]">
                      {(Array.isArray(item.questions_to_ask)
                        ? item.questions_to_ask
                        : [item.questions_to_ask]
                      ).map((q: string, qIdx: number) => (
                        <li key={qIdx} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-[#A8603E] mt-1 shrink-0" />
                          <span className="leading-relaxed">{q}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
