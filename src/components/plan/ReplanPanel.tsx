import React, { useState } from 'react';
import { Button } from '@/components/ui';
import { Sliders, RefreshCw, X, ArrowRight } from 'lucide-react';
import { formatINR } from '@/lib/utils/format';

interface ReplanPanelProps {
  initialGuests: number;
  initialBudget: number;
  isOpen: boolean;
  onClose: () => void;
  onApplyReplan: (change: { path: string; value: any }) => Promise<void>;
  isApplying: boolean;
}

export function parseRupeeInput(input: string): number | null {
  const str = input.trim().toLowerCase();
  if (!str) return null;

  // Check if string contains lakh / lac
  const lakhMatch = str.match(/^([0-9]+(?:\.[0-9]+)?)\s*(?:lakh|lakhs|lac|lacs|lk)$/);
  if (lakhMatch) {
    const val = parseFloat(lakhMatch[1]);
    if (!isNaN(val)) return Math.round(val * 100000);
  }

  // Check if string contains crore / cr
  const crMatch = str.match(/^([0-9]+(?:\.[0-9]+)?)\s*(?:crore|crores|cr)$/);
  if (crMatch) {
    const val = parseFloat(crMatch[1]);
    if (!isNaN(val)) return Math.round(val * 10000000);
  }

  // Plain numeric string or commas: e.g. "1000000" or "10,00,000" or "₹10,00,000"
  const cleanNum = str.replace(/[₹,\s]/g, '');
  const parsed = parseFloat(cleanNum);
  if (!isNaN(parsed) && parsed > 0) {
    return Math.round(parsed);
  }

  return null;
}

export const ReplanPanel: React.FC<ReplanPanelProps> = ({
  initialGuests,
  initialBudget,
  isOpen,
  onClose,
  onApplyReplan,
  isApplying,
}) => {
  const [guestCount, setGuestCount] = useState<number>(initialGuests || 300);
  const [budgetText, setBudgetText] = useState<string>(
    initialBudget ? `${(initialBudget / 100000).toFixed(0)} Lakh` : '10 Lakh'
  );
  const [activeParam, setActiveParam] = useState<'guests' | 'budget'>('guests');

  if (!isOpen) return null;

  const parsedBudgetAmount = parseRupeeInput(budgetText);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeParam === 'guests') {
      await onApplyReplan({
        path: 'locked_constraints.guest_count',
        value: guestCount,
      });
    } else {
      if (parsedBudgetAmount && parsedBudgetAmount > 0) {
        await onApplyReplan({
          path: 'budget.total',
          value: parsedBudgetAmount,
        });
      }
    }
  };

  return (
    <div className="p-6 bg-[#FCFBF8] border border-[#2A2521] space-y-6">
      <div className="flex items-center justify-between border-b border-[#E4DED6] pb-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-[#94512F]" strokeWidth={1.5} />
          <span className="font-micro text-[11px] uppercase tracking-[0.2em] text-[#94512F] font-semibold">
            COUPLE RE-PLAN CONTROLS
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-[#6B645E] hover:text-[#2A2521] p-1 cursor-pointer"
          aria-label="Close replan panel"
        >
          <X className="w-4 h-4" strokeWidth={1.5} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Selector: Choose parameter to update */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveParam('guests')}
            className={`px-3 py-1.5 font-micro text-xs uppercase tracking-wider border cursor-pointer ${
              activeParam === 'guests'
                ? 'bg-[#2A2521] text-white border-[#2A2521]'
                : 'bg-white text-[#6B645E] border-[#E4DED6]'
            }`}
          >
            Adjust Guest Count
          </button>
          <button
            type="button"
            onClick={() => setActiveParam('budget')}
            className={`px-3 py-1.5 font-micro text-xs uppercase tracking-wider border cursor-pointer ${
              activeParam === 'budget'
                ? 'bg-[#2A2521] text-white border-[#2A2521]'
                : 'bg-white text-[#6B645E] border-[#E4DED6]'
            }`}
          >
            Adjust Total Budget
          </button>
        </div>

        {/* 1. Guest Count Slider: 50 to 1,000 in steps of 10 */}
        {activeParam === 'guests' && (
          <div className="space-y-3 bg-white p-5 border border-[#E4DED6]">
            <div className="flex items-center justify-between">
              <label htmlFor="guest-slider" className="font-serif text-base font-medium text-[#2A2521]">
                Guest Count Slider
              </label>
              <span className="font-mono text-lg font-bold text-[#94512F]">
                {guestCount} guests
              </span>
            </div>

            <input
              id="guest-slider"
              type="range"
              min={50}
              max={1000}
              step={10}
              value={guestCount}
              onChange={(e) => setGuestCount(Number(e.target.value))}
              className="w-full accent-[#94512F] cursor-pointer"
            />

            <div className="flex justify-between text-[11px] text-[#6B645E] font-mono">
              <span>50 guests</span>
              <span>500 guests</span>
              <span>1,000 guests</span>
            </div>
            <p className="text-xs text-[#6B645E] pt-1">
              Maya will scale catering plate estimates, per-function seating, and budget allocation proportionally.
            </p>
          </div>
        )}

        {/* 2. Budget Input Field with Indian formatting preview */}
        {activeParam === 'budget' && (
          <div className="space-y-3 bg-white p-5 border border-[#E4DED6]">
            <div className="flex items-center justify-between">
              <label htmlFor="budget-input" className="font-serif text-base font-medium text-[#2A2521]">
                Total Celebration Budget
              </label>
              {parsedBudgetAmount ? (
                <span className="font-mono text-base font-bold text-[#94512F]">
                  Preview: {formatINR(parsedBudgetAmount)}
                </span>
              ) : (
                <span className="text-xs text-red-600">Enter valid rupees (e.g. 10 Lakh or 1000000)</span>
              )}
            </div>

            <input
              id="budget-input"
              type="text"
              value={budgetText}
              onChange={(e) => setBudgetText(e.target.value)}
              placeholder="e.g. 10 Lakh, 25 Lakh, or 1000000"
              className="w-full bg-[#FCFBF8] border border-[#E4DED6] px-4 py-2.5 text-sm font-mono text-[#2A2521] focus:border-[#2A2521] focus:outline-none"
            />

            <div className="flex gap-2 flex-wrap text-xs pt-1">
              {['10 Lakh', '15 Lakh', '25 Lakh', '50 Lakh', '1 Crore'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setBudgetText(preset)}
                  className="px-2 py-0.5 bg-[#F1EDE8] hover:bg-[#E4DED6] text-[#2A2521] font-mono text-[11px] border border-[#E4DED6]"
                >
                  {preset}
                </button>
              ))}
            </div>
            <p className="text-xs text-[#6B645E]">
              Updates will regenerate category allocations and align vendor cost tiers.
            </p>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isApplying}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isApplying || (activeParam === 'budget' && !parsedBudgetAmount)}
            className="!bg-[#2A2521] hover:!bg-[#1C1917] !text-white text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isApplying ? 'animate-spin' : ''}`} strokeWidth={1.5} />
            <span>{isApplying ? 'Applying replan...' : 'Apply changes'}</span>
          </Button>
        </div>
      </form>
    </div>
  );
};

