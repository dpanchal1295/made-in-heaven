'use client';

import { useState } from 'react';
import { DecorItem } from '@/lib/maya/schemas';
import { PlanPartSource } from '@/types/firestore';
import { Card, Badge, EmptyState } from '@/components/ui';
import { Sparkles, ThumbsUp, ThumbsDown, Leaf, Lightbulb } from 'lucide-react';

interface DecorTabProps {
  decorData: DecorItem[] | null;
  source?: PlanPartSource;
  onGenerate: () => void;
  isLoading?: boolean;
}

export function DecorTab({
  decorData,
  source,
  onGenerate,
  isLoading = false,
}: DecorTabProps) {
  const [reactions, setReactions] = useState<Record<number, 'up' | 'down' | null>>({});

  if (!decorData || decorData.length === 0) {
    return (
      <EmptyState
        icon={<Sparkles className="w-5 h-5 text-[#A8603E]" strokeWidth={1.5} />}
        title="No Decor Concepts Generated Yet"
        description="Maya will generate decor styling for primary wedding zones with practical regional cost tiers and flower sourcing."
        buttonLabel="Generate Decor with Maya"
        onAction={onGenerate}
        isLoading={isLoading}
      />
    );
  }

  const handleReaction = (idx: number, type: 'up' | 'down') => {
    setReactions((prev) => ({
      ...prev,
      [idx]: prev[idx] === type ? null : type,
    }));
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <Card className="border border-[#E4DED6] bg-white p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-serif text-xl sm:text-2xl font-medium text-[#2A2521]">
                Wedding Decor Concepts
              </h3>
              {source === 'mock' && (
                <span className="px-2 py-0.5 bg-[#F2EDE4] border border-[#D5C7B5] text-[#94512F] text-[10px] font-mono tracking-wider uppercase font-bold">
                  Sample
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-[#6B645E]">
              Zoned concepts with local flower sourcing tips and realistic budget tiers.
            </p>
          </div>

          <Badge variant="outline" size="md" className="self-start sm:self-auto font-micro">
            Eco-conscious florals
          </Badge>
        </div>
      </Card>

      {/* Zoned Decor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {decorData.map((item, idx) => {
          const currentReaction = reactions[idx];

          return (
            <div
              key={idx}
              className="bg-white border border-[#E4DED6] flex flex-col justify-between p-6 space-y-5"
            >
              <div className="space-y-4">
                {/* Area & Cost Tier */}
                <div className="flex items-start justify-between gap-3 border-b border-[#E4DED6] pb-3">
                  <div>
                    <span className="font-micro text-[10px] text-[#94512F] tracking-[0.2em] uppercase block">
                      AREA
                    </span>
                    <h4 className="font-serif text-xl font-medium text-[#2A2521]">
                      {item.area}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" size="sm" className="font-micro uppercase">
                      {item.diy_rent_or_buy}
                    </Badge>
                    <Badge variant="outline" size="sm">
                      {item.cost_tier} Tier
                    </Badge>
                  </div>
                </div>

                {/* Concept / Idea Description */}
                <div className="space-y-1">
                  <span className="font-micro text-[10px] text-[#6B645E] tracking-[0.15em] uppercase block">
                    CONCEPT & STYLING
                  </span>
                  <p className="text-xs sm:text-sm text-[#2A2521] leading-relaxed">
                    {item.idea}
                  </p>
                </div>

                {/* Regional Saving Tip */}
                {item.saving_tip && (
                  <div className="p-3.5 bg-[#F1EDE8] border border-[#E4DED6] text-xs text-[#2A2521] space-y-1">
                    <div className="flex items-center gap-1.5 text-[#94512F]">
                      <Lightbulb className="w-3.5 h-3.5" strokeWidth={1.5} />
                      <span className="font-micro text-[10px] tracking-[0.15em] uppercase">
                        Maya's Sourcing Tip
                      </span>
                    </div>
                    <p className="text-[#6B645E] leading-relaxed">{item.saving_tip}</p>
                  </div>
                )}
              </div>

              {/* Family Reaction Voting */}
              <div className="pt-4 border-t border-[#E4DED6] flex items-center justify-between text-xs">
                <span className="font-micro text-[10px] text-[#6B645E] tracking-[0.15em] uppercase">
                  Family feedback
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleReaction(idx, 'up')}
                    aria-label="Approve decor concept"
                    className={`p-2 border transition-colors cursor-pointer rounded-none ${
                      currentReaction === 'up'
                        ? 'bg-[#2A2521] text-white border-[#2A2521]'
                        : 'bg-transparent text-[#6B645E] border-[#E4DED6] hover:border-[#2A2521]'
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReaction(idx, 'down')}
                    aria-label="Disapprove decor concept"
                    className={`p-2 border transition-colors cursor-pointer rounded-none ${
                      currentReaction === 'down'
                        ? 'bg-[#2A2521] text-white border-[#2A2521]'
                        : 'bg-transparent text-[#6B645E] border-[#E4DED6] hover:border-[#2A2521]'
                    }`}
                  >
                    <ThumbsDown className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
