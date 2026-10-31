'use client';

import { useState } from 'react';
import { AttireItem } from '@/lib/maya/schemas';
import { PlanPartSource } from '@/types/firestore';
import { Card, Badge, EmptyState } from '@/components/ui';
import { Shirt, Clock, Sparkles, ThumbsUp, ThumbsDown } from 'lucide-react';

interface AttireTabProps {
  attireData: AttireItem[] | null;
  source?: PlanPartSource;
  onGenerate: () => void;
  isLoading?: boolean;
}

export function AttireTab({
  attireData,
  source,
  onGenerate,
  isLoading = false,
}: AttireTabProps) {
  // Local state for UI thumbs up / thumbs down interaction
  const [reactions, setReactions] = useState<Record<number, 'up' | 'down' | null>>({});

  if (!attireData || attireData.length === 0) {
    return (
      <EmptyState
        icon={<Shirt className="w-5 h-5 text-[#A8603E]" strokeWidth={1.5} />}
        title="No Attire & Styling Plan Generated Yet"
        description="Maya will recommend bespoke, rental, or purchase outfit ideas for the couple and immediate family, with tailoring lead times and heritage notes."
        buttonLabel="Generate Attire with Maya"
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
    <div className="space-y-6">
      {/* Top Header */}
      <Card className="border border-[#E4DED6] bg-white p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-serif text-xl sm:text-2xl font-medium text-[#2A2521]">
                Attire & Styling
              </h3>
              {source === 'mock' && (
                <span className="px-2 py-0.5 bg-[#F2EDE4] border border-[#D5C7B5] text-[#94512F] text-[10px] font-mono tracking-wider uppercase font-bold">
                  Sample
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-[#6B645E]">
              Styling recommendations for key roles with lead times and cultural traditions.
            </p>
          </div>

          <Badge variant="outline" size="md" className="self-start sm:self-auto font-micro">
            Curated styling concept
          </Badge>
        </div>
      </Card>

      {/* Attire Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {attireData.map((item, idx) => {
          const currentReaction = reactions[idx];

          return (
            <Card
              key={idx}
              className="border border-[#E4DED6] bg-white p-6 flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Person / Role & Badges */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-serif text-lg font-medium text-[#2A2521]">
                      {item.person_or_role}
                    </h4>
                    <span className="text-xs text-[#94512F] font-medium flex items-center gap-1.5 mt-1">
                      <Clock className="w-3.5 h-3.5 text-[#94512F]" strokeWidth={1.5} />
                      Lead time: {item.lead_time}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge variant="outline" size="sm" className="font-micro uppercase">
                      {item.buy_rent_or_custom}
                    </Badge>
                    <Badge variant="outline" size="sm" className="font-micro font-medium">
                      {item.cost_tier}
                    </Badge>
                  </div>
                </div>

                {/* Outfit Concept */}
                <p className="text-xs sm:text-sm text-[#6B645E] leading-relaxed font-sans">
                  {item.idea}
                </p>

                {/* Cultural Tradition Note */}
                {item.tradition_note && (
                  <div className="p-4 bg-[#F1EDE8] border border-[#E4DED6] text-xs space-y-1.5">
                    <span className="text-[11px] font-medium text-[#94512F] uppercase tracking-[0.15em] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#94512F]" strokeWidth={1.5} />
                      Tradition & Significance
                    </span>
                    <p className="text-[#2A2521] leading-relaxed">{item.tradition_note}</p>
                  </div>
                )}
              </div>

              {/* Bottom Interactive Thumbs Up & Down */}
              <div className="mt-6 pt-4 border-t border-[#E4DED6] flex items-center justify-between text-xs">
                <span className="font-micro text-[11px] text-[#6B645E] tracking-[0.15em] uppercase">
                  Role #{idx + 1}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleReaction(idx, 'up')}
                    aria-label={`Like attire concept for ${item.person_or_role}`}
                    className={`flex items-center gap-1.5 px-3 py-1.5 border text-xs font-medium transition-all cursor-pointer focus-visible:ring-1 focus-visible:ring-[#94512F] outline-hidden ${
                      currentReaction === 'up'
                        ? 'bg-[#2A2521] text-white border-[#2A2521]'
                        : 'bg-white hover:bg-[#F1EDE8] border-[#E4DED6] text-[#6B645E]'
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" strokeWidth={1.5} />
                    <span>Selected</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleReaction(idx, 'down')}
                    aria-label={`Dislike attire concept for ${item.person_or_role}`}
                    className={`flex items-center gap-1.5 px-3 py-1.5 border text-xs font-medium transition-all cursor-pointer focus-visible:ring-1 focus-visible:ring-[#94512F] outline-hidden ${
                      currentReaction === 'down'
                        ? 'bg-[#2A2521] text-white border-[#2A2521]'
                        : 'bg-white hover:bg-[#F1EDE8] border-[#E4DED6] text-[#6B645E]'
                    }`}
                  >
                    <ThumbsDown className="w-3.5 h-3.5" strokeWidth={1.5} />
                    <span>Skip</span>
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
