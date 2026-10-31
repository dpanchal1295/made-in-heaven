import React from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Clock, Users } from 'lucide-react';
import { Decision } from '@/types/firestore';
import { Badge } from '@/components/ui';

interface DecisionsLogProps {
  decisions: Decision[];
}

export const DecisionsLog: React.FC<DecisionsLogProps> = ({ decisions }) => {
  if (!decisions || decisions.length === 0) {
    return (
      <div className="p-6 bg-white border border-[#E4DED6] text-center">
        <span className="font-micro text-[10px] text-[#6B645E] uppercase tracking-[0.2em] block mb-1">
          NO FORMAL VOTES YET
        </span>
        <p className="text-xs text-[#6B645E]">
          When the couple initiates a family vote from a synthesized room brief, active and past ballots appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-micro text-[10px] text-[#94512F] uppercase tracking-[0.2em] font-semibold block">
            DEMOCRATIC CONSENSUS
          </span>
          <h2 className="font-serif text-2xl font-normal text-[#2A2521]">
            Decisions Log
          </h2>
        </div>
        <span className="text-xs text-[#6B645E]">
          {decisions.length} recorded {decisions.length === 1 ? 'vote' : 'votes'}
        </span>
      </div>

      <div className="divide-y divide-[#E4DED6] border border-[#E4DED6] bg-white">
        {decisions.map((decision) => {
          const isClosed = decision.status === 'closed';
          const isRunoff = decision.status === 'runoff';
          const isCoupleAwaiting = decision.status === 'awaiting_couple';
          const voteCount = decision.votes ? Object.keys(decision.votes).length : 0;

          let statusBadge = (
            <Badge variant="outline" size="sm" className="font-micro text-[10px] uppercase text-[#94512F] border-[#94512F]">
              Active Vote
            </Badge>
          );

          if (isClosed) {
            statusBadge = (
              <Badge variant="charcoal" size="sm" className="font-micro text-[10px] uppercase bg-[#2A2521] text-white">
                Decided
              </Badge>
            );
          } else if (isRunoff) {
            statusBadge = (
              <Badge variant="outline" size="sm" className="font-micro text-[10px] uppercase bg-[#F1EDE8] text-[#94512F] border-[#94512F]">
                Runoff Round
              </Badge>
            );
          } else if (isCoupleAwaiting) {
            statusBadge = (
              <Badge variant="outline" size="sm" className="font-micro text-[10px] uppercase text-[#2A2521] border-[#2A2521]">
                Couple Deciding
              </Badge>
            );
          }

          return (
            <Link
              key={decision.id}
              href={`/family/decisions/${decision.id}`}
              className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FCFBF8] transition-colors block group focus-visible:outline-2 focus-visible:outline-[#A8603E]"
            >
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-serif text-base font-medium text-[#2A2521] group-hover:text-[#94512F] transition-colors">
                    {decision.topic}
                  </span>
                  {statusBadge}
                </div>
                <div className="flex items-center gap-3 text-xs text-[#6B645E] flex-wrap">
                  <span>Room: <strong className="text-[#2A2521] font-normal capitalize">{decision.roomId}</strong></span>
                  <span>•</span>
                  <span>{decision.options.length} options</span>
                  <span>•</span>
                  <span>{voteCount} {voteCount === 1 ? 'vote cast' : 'votes cast'}</span>
                  {decision.result && (
                    <>
                      <span>•</span>
                      <span className="text-[#94512F] font-medium">Winner: Option {decision.result}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-micro uppercase tracking-wider text-[#6B645E] group-hover:text-[#2A2521] shrink-0 self-end sm:self-center">
                <span>View Ballot & Tally</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" strokeWidth={1.5} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

