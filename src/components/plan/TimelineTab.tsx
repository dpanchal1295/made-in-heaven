'use client';

import { useState, useEffect } from 'react';
import { TimelineItem } from '@/lib/maya/schemas';
import { PlanPartSource } from '@/types/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, EmptyState } from '@/components/ui';
import { Clock, ChevronDown, ChevronRight, Sparkles, AlertCircle } from 'lucide-react';

interface TimelineTabProps {
  timelineData: TimelineItem[] | null;
  source?: PlanPartSource;
  weddingDate?: string;
  onGenerate: () => void;
  isLoading?: boolean;
}

export function TimelineTab({
  timelineData,
  source,
  weddingDate = '2026-12-18',
  onGenerate,
  isLoading = false,
}: TimelineTabProps) {
  const [expandedIndices, setExpandedIndices] = useState<Record<number, boolean>>({});
  const [timeStats, setTimeStats] = useState<{ daysLeft: number; weeksLeft: number } | null>(null);

  useEffect(() => {
    if (!weddingDate) {
      setTimeStats({ daysLeft: 54, weeksLeft: 8 });
      return;
    }
    const today = new Date();
    const targetDate = new Date(weddingDate);
    if (!isNaN(targetDate.getTime())) {
      const diffTime = targetDate.getTime() - today.getTime();
      const days = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      const safeDays = Number.isFinite(days) ? days : 54;
      setTimeStats({ daysLeft: safeDays, weeksLeft: Math.max(1, Math.ceil(safeDays / 7)) });
    } else {
      setTimeStats({ daysLeft: 54, weeksLeft: 8 });
    }
  }, [weddingDate]);

  const daysLeft = timeStats ? timeStats.daysLeft : null;
  const weeksLeft = timeStats ? timeStats.weeksLeft : 12;

  if (!timelineData || timelineData.length === 0) {
    return (
      <EmptyState
        icon={<Clock className="w-5 h-5 text-[#A8603E]" strokeWidth={1.5} />}
        title="No Timeline Generated Yet"
        description="Maya will craft a chronological countdown from today until your wedding date, highlighting critical milestones."
        buttonLabel="Generate Timeline with Maya"
        onAction={onGenerate}
        isLoading={isLoading}
      />
    );
  }

  const toggleExpand = (index: number) => {
    setExpandedIndices((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const isCompressed = weeksLeft < 12;

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <Card className="border border-[#E4DED6] bg-white p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-serif text-xl sm:text-2xl font-medium text-[#2A2521]">
                Countdown Timeline
              </h3>
              {source === 'mock' && (
                <span className="px-2 py-0.5 bg-[#F2EDE4] border border-[#D5C7B5] text-[#94512F] text-[10px] font-mono tracking-wider uppercase font-bold">
                  Sample
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-[#6B645E]">
              Dynamically fitted to the {weeksLeft} weeks ({daysLeft !== null ? daysLeft : '—'} days) remaining until {weddingDate}.
            </p>
          </div>

          <Badge variant="outline" size="md" className="self-start sm:self-auto font-micro">
            {daysLeft !== null ? daysLeft : '—'} Days to Wedding Day
          </Badge>
        </div>

        {/* Compression Notice */}
        {isCompressed && (
          <div className="mt-4 p-3.5 bg-[#F1EDE8] border border-[#E4DED6] text-xs text-[#2A2521] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#A8603E] shrink-0" strokeWidth={1.5} />
            <span>
              <strong>Compressed Timeline:</strong> Since your wedding is in {weeksLeft} weeks, high-lead vendors have been prioritized in early phases.
            </span>
          </div>
        )}
      </Card>

      {/* Chronological Timeline Stream */}
      <div className="relative border-l border-[#E4DED6] ml-4 sm:ml-6 pl-6 sm:pl-8 space-y-8">
        {timelineData.map((item, idx) => {
          const isExpanded = Boolean(expandedIndices[idx]);

          return (
            <div key={idx} className="relative">
              {/* Timeline Marker Node */}
              <div
                className={`absolute -left-[31px] sm:-left-[39px] top-1.5 w-3.5 h-3.5 border border-[#2A2521] ${
                  idx === 0 ? 'bg-[#A8603E]' : 'bg-[#FCFBF8]'
                }`}
              />

              {/* Milestone Card */}
              <Card className="border border-[#E4DED6] bg-white">
                <CardHeader
                  onClick={() => toggleExpand(idx)}
                  className="cursor-pointer select-none hover:bg-[#FCFBF8] transition-colors p-5 border-b border-[#E4DED6]"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="font-micro text-[10px] text-[#94512F] tracking-[0.2em] uppercase">
                          {item.category}
                        </span>
                        <span className="font-micro text-[10px] text-[#6B645E]">
                          • {item.when}
                        </span>
                      </div>
                      <CardTitle className="text-base sm:text-lg text-[#2A2521]">
                        {item.task}
                      </CardTitle>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <Badge variant="outline" size="sm">
                        Milestone #{idx + 1}
                      </Badge>
                      <button
                        type="button"
                        className="text-[#6B645E] p-1 hover:text-[#2A2521]"
                        aria-label={isExpanded ? 'Collapse' : 'Expand'}
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" strokeWidth={1.5} />
                        ) : (
                          <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
                        )}
                      </button>
                    </div>
                  </div>
                </CardHeader>

                {/* Why it matters / details */}
                <CardContent className="p-5 space-y-3">
                  <div className="p-4 bg-[#F1EDE8] border border-[#E4DED6] text-xs text-[#2A2521] space-y-1">
                    <span className="font-micro text-[10px] text-[#94512F] tracking-[0.2em] uppercase block">
                      WHY THIS MATTERS
                    </span>
                    <p className="leading-relaxed text-[#6B645E]">{item.why_it_matters}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}
