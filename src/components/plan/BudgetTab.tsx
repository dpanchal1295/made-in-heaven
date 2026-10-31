'use client';

import React from 'react';
import { BudgetItem } from '@/lib/maya/schemas';
import { CateringFunctionPlateEstimate } from '@/lib/maya/fixtures';
import { formatINR } from '@/lib/utils/format';
import { PlanPartSource } from '@/types/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, EmptyState } from '@/components/ui';
import { Wallet, Info, AlertCircle, UtensilsCrossed, Check } from 'lucide-react';

interface BudgetTabProps {
  budgetData: BudgetItem[] | null;
  cateringBreakdown: CateringFunctionPlateEstimate[];
  source?: PlanPartSource;
  totalBudget?: number;
  budgetRange?: { low: number; high: number };
  onGenerate: () => void;
  isLoading?: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Catering & Food Service': 'bg-[#2A2521]',
  'Venue & Banquets': 'bg-[#A8603E]',
  'Decor & Florals': 'bg-[#94512F]',
  'Photography & Video': 'bg-[#6B645E]',
  'Attire & Styling': 'bg-[#A8603E]/80',
  'Music & Sound': 'bg-[#2A2521]/70',
  'Logistics & Contingency': 'bg-[#E4DED6]',
};

export function BudgetTab({
  budgetData,
  cateringBreakdown,
  source,
  totalBudget = 1150000,
  budgetRange = { low: 800000, high: 1500000 },
  onGenerate,
  isLoading = false,
}: BudgetTabProps) {
  if (!budgetData || budgetData.length === 0) {
    return (
      <EmptyState
        icon={<Wallet className="w-5 h-5 text-[#A8603E]" strokeWidth={1.5} />}
        title="No Budget Plan Generated Yet"
        description="Maya will compute an itemized wedding budget across four functions and all service categories in INR, anchored to Pune rates."
        buttonLabel="Generate Budget with Maya"
        onAction={onGenerate}
        isLoading={isLoading}
      />
    );
  }

  // Calculate sum of category estimates
  const sumLow = budgetData.reduce((acc, item) => acc + (item.estimated_low_inr || 0), 0);
  const sumHigh = budgetData.reduce((acc, item) => acc + (item.estimated_high_inr || 0), 0);
  const estimatedPlanningMidpoint = Math.round((sumLow + sumHigh) / 2);

  // Check if planning value stretches target
  const budgetTarget = totalBudget || budgetRange.high;
  const isStretching = estimatedPlanningMidpoint > budgetTarget;
  const stretchAmount = isStretching ? estimatedPlanningMidpoint - budgetTarget : 0;

  return (
    <div className="space-y-8">
      {/* Top Header & Badges */}
      <Card className="border border-[#E4DED6] bg-white p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-serif text-xl sm:text-2xl font-medium text-[#2A2521]">
                Wedding Budget Breakdown
              </h3>
              {source === 'mock' && (
                <span className="px-2 py-0.5 bg-[#F2EDE4] border border-[#D5C7B5] text-[#94512F] text-[10px] font-mono tracking-wider uppercase font-bold">
                  Sample
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-[#6B645E]">
              Itemized INR allocation across all functions anchored to regional vendor rates.
            </p>
          </div>

          <Badge variant="outline" size="md" className="self-start sm:self-auto font-micro">
            Estimates, confirm with real quotes
          </Badge>
        </div>
      </Card>

      {/* Budget Stretch Note if Plan Exceeds Target */}
      {isStretching && (
        <div className="p-4 bg-[#F1EDE8] border border-[#E4DED6] text-[#2A2521] text-xs sm:text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[#94512F] shrink-0 mt-0.5" strokeWidth={1.5} />
          <div>
            <span className="font-semibold text-[#94512F]">Budget Reality Check: </span>
            <span>
              This plan stretches the target budget by about{' '}
              <strong className="font-bold underline">{formatINR(stretchAmount)}</strong>.
              Maya suggests opting for weekday venue booking or local marigold sourcing to keep within your target range.
            </span>
          </div>
        </div>
      )}

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-[#2A2521] text-white p-6 border border-[#2A2521]">
          <span className="font-micro text-[10px] text-white/60 tracking-[0.2em] uppercase block">
            TARGET PLANNING VALUE
          </span>
          <span className="font-serif text-3xl font-normal mt-1 block">
            {formatINR(totalBudget)}
          </span>
          <span className="text-xs text-white/70 mt-1 block">
            Working midpoint for local vendors
          </span>
        </div>

        <Card className="border border-[#E4DED6] bg-white p-6">
          <span className="font-micro text-[10px] text-[#6B645E] tracking-[0.2em] uppercase block">
            STATED RANGE
          </span>
          <span className="font-serif text-2xl font-normal text-[#2A2521] mt-1 block">
            {formatINR(budgetRange.low)} – {formatINR(budgetRange.high)}
          </span>
          <span className="text-xs text-[#6B645E] mt-1 block">
            Couple's approved range
          </span>
        </Card>

        <Card className="border border-[#E4DED6] bg-white p-6">
          <span className="font-micro text-[10px] text-[#94512F] tracking-[0.2em] uppercase block">
            CATEGORIES SUM
          </span>
          <span className="font-serif text-2xl font-normal text-[#94512F] mt-1 block">
            {formatINR(sumLow)} – {formatINR(sumHigh)}
          </span>
          <div className="flex items-center gap-1.5 text-xs text-[#2A2521] mt-1">
            <Check className="w-3.5 h-3.5 text-[#A8603E]" strokeWidth={2} />
            <span>100% itemized allocation</span>
          </div>
        </Card>
      </div>

      {/* Stacked Allocation Bar */}
      <Card className="border border-[#E4DED6] bg-white p-6 space-y-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Allocation by Category</CardTitle>
          <span className="font-micro text-[11px] text-[#6B645E] tracking-[0.15em] uppercase">
            100% Total
          </span>
        </div>

        <div className="w-full h-3 bg-[#E4DED6] flex overflow-hidden">
          {budgetData.map((item, idx) => (
            <div
              key={idx}
              style={{ width: `${item.percent}%` }}
              className={`h-full ${CATEGORY_COLORS[item.category] || 'bg-[#A8603E]'} transition-all`}
              title={`${item.category}: ${item.percent}% (${formatINR(item.estimated_low_inr)} – ${formatINR(item.estimated_high_inr)})`}
            />
          ))}
        </div>

        <div className="flex flex-wrap gap-4 pt-2">
          {budgetData.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs text-[#6B645E]">
              <div className={`w-2.5 h-2.5 ${CATEGORY_COLORS[item.category] || 'bg-[#A8603E]'}`} />
              <span className="text-[#2A2521] font-medium">{item.category}</span>
              <span className="font-mono text-[#6B645E]">{item.percent}%</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Catering Breakdown by Function */}
      {cateringBreakdown && cateringBreakdown.length > 0 && (
        <Card className="border border-[#E4DED6] bg-white p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-[#E4DED6] pb-3">
            <UtensilsCrossed className="w-4 h-4 text-[#A8603E]" strokeWidth={1.5} />
            <CardTitle className="text-lg">
              Catering by Function (Per-Plate Range × Guests)
            </CardTitle>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cateringBreakdown.map((fn, idx) => (
              <div
                key={idx}
                className="p-4 border border-[#E4DED6] bg-[#FCFBF8] space-y-2"
              >
                <div className="flex justify-between items-center">
                  <span className="font-serif text-base font-medium text-[#2A2521]">{fn.function_name}</span>
                  <Badge variant="outline" size="sm">{fn.guests} Guests</Badge>
                </div>
                <div className="space-y-1 text-xs">
                  <p className="text-[#6B645E]">
                    {formatINR(fn.per_plate_low_inr)} – {formatINR(fn.per_plate_high_inr)} / plate
                  </p>
                  <p className="font-semibold text-[#2A2521]">
                    Total: {formatINR(fn.total_low_inr)} – {formatINR(fn.total_high_inr)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Itemized Table */}
      <Card className="border border-[#E4DED6] bg-white p-0 overflow-hidden">
        <div className="p-6 border-b border-[#E4DED6] flex items-center justify-between">
          <CardTitle className="text-lg">Itemized Breakdown</CardTitle>
          <span className="font-micro text-[10px] text-[#6B645E] tracking-[0.2em] uppercase">
            AMOUNTS IN INR (₹)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F1EDE8] border-b border-[#E4DED6] font-micro text-[#6B645E] tracking-[0.15em] uppercase">
              <tr>
                <th className="py-3 px-6">Category</th>
                <th className="py-3 px-6 text-center">% Share</th>
                <th className="py-3 px-6 text-right">Estimated Range (INR)</th>
                <th className="py-3 px-6">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4DED6]">
              {budgetData.map((item, idx) => (
                <tr key={idx} className="hover:bg-[#FCFBF8] transition-colors">
                  <td className="py-3.5 px-6 font-medium text-[#2A2521]">
                    {item.category}
                  </td>
                  <td className="py-3.5 px-6 text-center font-mono text-[#6B645E]">
                    {item.percent}%
                  </td>
                  <td className="py-3.5 px-6 text-right font-medium text-[#2A2521]">
                    {formatINR(item.estimated_low_inr)} – {formatINR(item.estimated_high_inr)}
                  </td>
                  <td className="py-3.5 px-6 text-[#6B645E]">
                    {item.notes || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-[#F1EDE8] border-t border-[#E4DED6] font-medium text-[#2A2521]">
              <tr>
                <td className="py-3.5 px-6 font-semibold">Total Allocated</td>
                <td className="py-3.5 px-6 text-center font-mono">100%</td>
                <td className="py-3.5 px-6 text-right font-bold">
                  {formatINR(sumLow)} – {formatINR(sumHigh)}
                </td>
                <td className="py-3.5 px-6 text-[#6B645E]">Estimated midpoint: {formatINR(estimatedPlanningMidpoint)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
}
