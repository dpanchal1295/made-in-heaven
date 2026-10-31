import React from 'react';
import { Button, Badge } from '@/components/ui';
import { Sparkles, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';

export interface DecisionBriefOption {
  id: string;
  name: string;
  what_it_includes: string;
  who_gets_what: Array<{ member: string; gets: string }>;
  cost_tier: string;
  fits_locked_constraints: boolean;
  fits_budget?: boolean;
}

export interface DecisionBriefData {
  topic: string;
  source?: 'live' | 'mock';
  member_ideas: Array<{ member: string; idea: string }>;
  common_ground: string[];
  conflicts: Array<{
    issue: string;
    sides: Array<{ member: string; position: string }>;
  }>;
  options: DecisionBriefOption[];
  recommendation: {
    option_id: string;
    why: string;
  };
}

interface DecisionBriefViewProps {
  brief: DecisionBriefData;
  isCouple: boolean;
  canSeeBudget: boolean;
  onStartVote: () => void;
  isStartingVote?: boolean;
}

export const DecisionBriefView: React.FC<DecisionBriefViewProps> = ({
  brief,
  isCouple,
  canSeeBudget,
  onStartVote,
  isStartingVote = false,
}) => {
  return (
    <div className="p-6 bg-[#FCFBF8] border border-[#E4DED6] space-y-6">
      {/* Brief Header */}
      <div className="border-b border-[#E4DED6] pb-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-[#94512F]" strokeWidth={1.5} />
            <span className="font-micro text-[11px] uppercase tracking-[0.2em] text-[#94512F] font-semibold">
              {brief.source === 'mock' ? 'SAMPLE BRIEF' : 'MAYA SYNTHESIS BRIEF'}
            </span>
          </div>
          <h3 className="font-serif text-2xl font-normal text-[#2A2521]">
            {brief.topic}
          </h3>
        </div>

        {isCouple && (
          <Button
            variant="primary"
            size="sm"
            onClick={onStartVote}
            disabled={isStartingVote}
            className="self-start sm:self-auto !bg-[#2A2521] hover:!bg-[#1C1917] !text-white text-xs shrink-0"
          >
            <span>Start a family vote</span>
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
          </Button>
        )}
      </div>

      {/* 1. Member Ideas Credited by Name */}
      <div className="space-y-2">
        <span className="font-micro text-[10px] uppercase text-[#6B645E] tracking-[0.15em] block">
          MEMBER IDEAS CONTRIBUTED
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {brief.member_ideas.map((item, idx) => (
            <div key={idx} className="p-3 bg-white border border-[#E4DED6] text-xs">
              <span className="font-serif font-medium text-[#2A2521] block mb-1">
                {item.member}
              </span>
              <p className="text-[#6B645E] leading-relaxed">
                "{item.idea}"
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Common Ground & Conflicts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Common Ground */}
        <div className="p-4 bg-white border border-[#E4DED6] space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#A8603E]" strokeWidth={2} />
            <span className="font-micro text-[10px] uppercase tracking-[0.15em] text-[#2A2521] font-semibold">
              COMMON GROUND
            </span>
          </div>
          <ul className="text-xs text-[#6B645E] space-y-1.5 list-disc list-inside">
            {brief.common_ground.map((cg, i) => (
              <li key={i} className="leading-relaxed">{cg}</li>
            ))}
          </ul>
        </div>

        {/* Conflicts & Contrasting Positions */}
        <div className="p-4 bg-white border border-[#E4DED6] space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-[#94512F]" strokeWidth={1.5} />
            <span className="font-micro text-[10px] uppercase tracking-[0.15em] text-[#94512F] font-semibold">
              DIFFERING PREFERENCES
            </span>
          </div>
          {brief.conflicts.map((conflict, i) => (
            <div key={i} className="text-xs space-y-1">
              <div className="font-medium text-[#2A2521]">{conflict.issue}</div>
              <div className="space-y-0.5 pl-2 border-l border-[#E4DED6] text-[#6B645E]">
                {conflict.sides.map((side, sIdx) => (
                  <div key={sIdx}>
                    <strong className="text-[#2A2521] font-normal">{side.member}:</strong> {side.position}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Synthesized Options */}
      <div className="space-y-3">
        <span className="font-micro text-[10px] uppercase text-[#6B645E] tracking-[0.15em] block">
          SYNTHESIZED COMPROMISE OPTIONS
        </span>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {brief.options.map((opt) => (
            <div
              key={opt.id}
              className={`p-4 bg-white border ${
                brief.recommendation.option_id === opt.id
                  ? 'border-[#94512F] ring-1 ring-[#94512F]/20'
                  : 'border-[#E4DED6]'
              } space-y-3`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-serif text-lg font-medium text-[#2A2521]">
                      {opt.name}
                    </span>
                    {brief.recommendation.option_id === opt.id && (
                      <Badge variant="outline" size="sm" className="font-micro text-[9px] uppercase border-[#94512F] text-[#94512F]">
                        Maya's Pick
                      </Badge>
                    )}
                  </div>
                  <span className="font-mono text-xs text-[#94512F] font-semibold">
                    Cost Tier: {opt.cost_tier}
                  </span>
                </div>
              </div>

              <div className="text-xs text-[#6B645E] leading-relaxed">
                <strong className="text-[#2A2521] font-medium block mb-0.5">What it includes:</strong>
                {opt.what_it_includes}
              </div>

              {opt.who_gets_what && opt.who_gets_what.length > 0 && (
                <div className="text-xs space-y-1 pt-2 border-t border-[#E4DED6]/60">
                  <strong className="text-[#2A2521] font-medium block font-micro text-[10px] uppercase tracking-wider text-[#6B645E]">
                    Who gets what:
                  </strong>
                  {opt.who_gets_what.map((w, wIdx) => (
                    <div key={wIdx} className="text-[#6B645E]">
                      <span className="text-[#2A2521] font-medium">• {w.member}:</span> {w.gets}
                    </div>
                  ))}
                </div>
              )}

              {/* Constraint & Budget Alignment */}
              <div className="flex items-center gap-2 text-[11px] pt-2 border-t border-[#E4DED6]/60 flex-wrap">
                <span className="px-2 py-0.5 bg-[#F1EDE8] text-[#2A2521] border border-[#E4DED6]">
                  {opt.fits_locked_constraints ? '✓ Locked constraints met' : '⚠ Modifies locked constraint'}
                </span>

                {/* Privacy rule: only show fits_budget if user has budget access */}
                {canSeeBudget && opt.fits_budget !== undefined && (
                  <span className={`px-2 py-0.5 border ${
                    opt.fits_budget ? 'bg-[#FCFBF8] text-[#2A2521] border-[#E4DED6]' : 'bg-[#F1EDE8] text-[#94512F] border-[#94512F]'
                  }`}>
                    {opt.fits_budget ? '✓ Within budget' : '⚠ Exceeds budget'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Recommendation & Democratic Reminder */}
      <div className="p-4 bg-[#F1EDE8] border border-[#E4DED6] space-y-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#94512F]" strokeWidth={1.5} />
          <span className="font-micro text-[10px] uppercase tracking-[0.15em] text-[#94512F] font-semibold">
            MAYA'S RECOMMENDATION
          </span>
        </div>
        <p className="text-xs sm:text-sm text-[#2A2521] leading-relaxed">
          {brief.recommendation.why}
        </p>
        <div className="pt-2 text-xs font-serif italic text-[#6B645E] border-t border-[#E4DED6]/70">
          Maya recommends, but your family voters decide through majority ballot.
        </div>
      </div>
    </div>
  );
};

