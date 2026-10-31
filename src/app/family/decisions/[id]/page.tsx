'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { AppShell } from '@/components/layout/AppShell';
import { Button, Toast } from '@/components/ui';
import { ArrowLeft, CheckCircle2, Clock, AlertTriangle, ArrowRight, Check } from 'lucide-react';
import { Decision } from '@/types/firestore';

interface DecisionPageData {
  decision: Decision;
  tally: {
    counts: Record<string, number>;
    totalVotes: number;
    eligibleVotersCount: number;
  };
}

function DecisionContent() {
  const params = useParams();
  const decisionId = params.id as string;
  const router = useRouter();
  const { user } = useAuth();

  const [data, setData] = useState<DecisionPageData | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isChoosingTie, setIsChoosingTie] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const isCouple = user?.permission === 'couple';
  const isVoter = user?.permission === 'voter';
  const canVote = isCouple || isVoter;

  // 1. Fetch Decision & Live Tally
  const fetchDecision = useCallback(async () => {
    if (!decisionId) return;

    try {
      const res = await fetch(`/api/decisions/${decisionId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.decision) {
          setData({
            decision: json.decision,
            tally: json.tally,
          });

          // Check if current user has an active vote
          if (user?.uid && json.decision.votes && json.decision.votes[user.uid]) {
            setSelectedOptionId(json.decision.votes[user.uid]);
          }
        }
      }
    } catch (e) {
      console.error('Error fetching decision:', e);
    }
  }, [decisionId, user?.uid]);

  useEffect(() => {
    fetchDecision();
  }, [fetchDecision]);

  // 2. Poll every 3 seconds for live tally (paused if hidden or decision is closed)
  useEffect(() => {
    if (!decisionId) return;

    const interval = setInterval(() => {
      // Pause if browser tab is hidden
      if (typeof document !== 'undefined' && document.hidden) return;

      // Stop polling once decision is closed
      if (data?.decision?.status === 'closed') return;

      fetchDecision();
    }, 3000);

    return () => clearInterval(interval);
  }, [decisionId, data?.decision?.status, fetchDecision]);

  // Cast vote
  const handleVote = async (optionId: string) => {
    if (!canVote || isVoting || data?.decision?.status === 'closed') return;
    setIsVoting(true);

    try {
      const res = await fetch('/api/decisions/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decisionId, optionId }),
      });

      const resData = await res.json();
      if (resData.success) {
        setSelectedOptionId(optionId);
        setToast({ message: `Your vote for Option ${optionId} has been cast!`, type: 'success' });
        await fetchDecision();
      } else {
        setToast({ message: resData.error || 'Failed to submit vote', type: 'error' });
      }
    } catch {
      setToast({ message: 'Network error submitting vote', type: 'error' });
    } finally {
      setIsVoting(false);
    }
  };

  // Close voting (Couple only)
  const handleCloseVoting = async () => {
    if (!isCouple || isClosing) return;
    setIsClosing(true);

    try {
      const res = await fetch('/api/decisions/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decisionId }),
      });

      const resData = await res.json();
      if (resData.success) {
        setToast({ message: resData.message || 'Voting round finalized.', type: 'success' });
        await fetchDecision();
      } else {
        setToast({ message: resData.error || 'Could not close voting', type: 'error' });
      }
    } catch {
      setToast({ message: 'Network error closing vote', type: 'error' });
    } finally {
      setIsClosing(false);
    }
  };

  // Couple choice tie-break
  const handleCoupleChoice = async (optionId: string) => {
    if (!isCouple || isChoosingTie) return;
    setIsChoosingTie(true);

    try {
      const res = await fetch('/api/decisions/couple-choice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decisionId, optionId }),
      });

      const resData = await res.json();
      if (resData.success) {
        setToast({ message: `Decision finalized by couple choice! Winner: Option ${optionId}`, type: 'success' });
        await fetchDecision();
      } else {
        setToast({ message: resData.error || 'Could not record couple choice', type: 'error' });
      }
    } catch {
      setToast({ message: 'Network error recording couple choice', type: 'error' });
    } finally {
      setIsChoosingTie(false);
    }
  };

  if (!data) {
    return (
      <AppShell currentTab="family">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center text-xs text-[#6B645E]">
          Loading decision ballot...
        </div>
      </AppShell>
    );
  }

  const { decision, tally } = data;
  const isClosed = decision.status === 'closed';
  const isRunoff = decision.status === 'runoff';
  const isAwaitingCouple = decision.status === 'awaiting_couple';

  // Active option set (if runoff, only runoff options)
  const activeOptions =
    isRunoff && decision.runoffOptionIds
      ? decision.options.filter((o) => decision.runoffOptionIds!.includes(o.id))
      : decision.options;

  const totalVotes = tally?.totalVotes || 0;
  const eligibleVoters = tally?.eligibleVotersCount || 3;

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {/* Navigation */}
        <div>
          <Link
            href="/family"
            className="inline-flex items-center gap-1.5 text-xs font-micro uppercase tracking-wider text-[#6B645E] hover:text-[#2A2521] mb-3 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Back to Family Circle</span>
          </Link>

          <div className="pb-6 border-b border-[#E4DED6] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-micro text-[10px] text-[#94512F] uppercase tracking-[0.2em] font-semibold">
                  FAMILY BALLOT & DECISION
                </span>
                <span className="text-[#6B645E]">•</span>
                <span className="text-xs text-[#6B645E] font-mono capitalize">
                  Room: {decision.roomId}
                </span>
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#2A2521] tracking-tight">
                {decision.topic}
              </h1>
            </div>

            {/* Couple Close Voting Button */}
            {isCouple && !isClosed && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleCloseVoting}
                disabled={isClosing || totalVotes === 0}
                className="self-start sm:self-auto !bg-[#2A2521] hover:!bg-[#1C1917] !text-white text-xs shrink-0"
              >
                <span>{isClosing ? 'Tallying...' : 'Close voting'}</span>
                <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
              </Button>
            )}
          </div>
        </div>

        {/* 1. Winner / Outcome Banners */}
        {isClosed && (
          <div className="p-6 bg-[#FCFBF8] border-2 border-[#2A2521] space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#94512F]" strokeWidth={2} />
              <span className="font-micro text-[11px] uppercase tracking-[0.2em] text-[#94512F] font-bold">
                DECISION FINALIZED
              </span>
            </div>
            <h2 className="font-serif text-2xl font-medium text-[#2A2521]">
              Winning Option: Option {decision.result}
            </h2>
            <p className="text-xs sm:text-sm text-[#6B645E] leading-relaxed">
              Decided by{' '}
              <strong className="text-[#2A2521] font-medium">
                {decision.decidedBy === 'majority'
                  ? 'strict majority vote'
                  : decision.decidedBy === 'runoff_majority'
                  ? 'majority runoff round'
                  : 'couple decision tie-break'}
              </strong>
              . Your wedding plan has been updated with this selection.
            </p>
            <div className="pt-2">
              <Link
                href="/plan"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2A2521] text-white text-xs font-medium hover:bg-[#1C1917] transition-colors"
              >
                <span>View updated plan</span>
                <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
              </Link>
            </div>
          </div>
        )}

        {/* Runoff Banner */}
        {isRunoff && !isClosed && (
          <div className="p-5 bg-[#F1EDE8] border border-[#94512F] space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#94512F]" strokeWidth={1.5} />
              <span className="font-micro text-[10px] uppercase tracking-[0.15em] text-[#94512F] font-bold">
                RUNOFF BALLOT ACTIVE
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#2A2521] leading-relaxed">
              No option had more than half the votes, so voting reopens between the top two options.
            </p>
          </div>
        )}

        {/* Couple Decides Tie Banner */}
        {isAwaitingCouple && !isClosed && (
          <div className="p-6 bg-[#FCFBF8] border border-[#2A2521] space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#94512F]" strokeWidth={1.5} />
              <span className="font-micro text-[10px] uppercase tracking-[0.15em] text-[#94512F] font-bold">
                TIED BALLOT — COUPLE CHOICE
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#2A2521] leading-relaxed">
              The family vote resulted in a tie between candidates. As the couple, choose the final option below to complete the decision.
            </p>
            {isCouple && (
              <div className="flex items-center gap-3 pt-2">
                {decision.tiedOptionIds?.map((tiedId) => (
                  <Button
                    key={tiedId}
                    variant="primary"
                    size="sm"
                    onClick={() => handleCoupleChoice(tiedId)}
                    disabled={isChoosingTie}
                    className="!bg-[#94512F] hover:!bg-[#7D4326] !text-white text-xs"
                  >
                    <span>Choose Option {tiedId}</span>
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 2. Non-Voter Advisory Notice */}
        {!canVote && (
          <div className="p-4 bg-[#F1EDE8] border border-[#E4DED6] text-xs text-[#6B645E] flex items-center gap-2.5">
            <span className="font-micro text-[10px] uppercase tracking-wider text-[#94512F] font-semibold">
              ADVISORY PARTICIPATION:
            </span>
            <span>Advisors and viewers share ideas but do not vote.</span>
          </div>
        )}

        {/* 3. Live Majority Tally Progress */}
        <div
          className="p-5 bg-white border border-[#E4DED6] space-y-4"
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-micro uppercase text-[10px] tracking-wider text-[#6B645E]">
              LIVE PARTICIPATION
            </span>
            <span className="font-mono text-xs text-[#2A2521] font-semibold">
              {totalVotes} of {eligibleVoters} eligible voters have voted
            </span>
          </div>

          {/* Option Bars */}
          <div className="space-y-3">
            {activeOptions.map((opt) => {
              const count = tally?.counts ? tally.counts[opt.id] || 0 : 0;
              const percent = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
              const isSelected = selectedOptionId === opt.id;

              return (
                <div key={opt.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-serif font-medium text-[#2A2521]">
                      Option {opt.id}: {opt.name}
                    </span>
                    <span className="font-mono text-[11px] text-[#6B645E]">
                      {count} {count === 1 ? 'vote' : 'votes'} ({percent}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-[#F1EDE8] overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isSelected ? 'bg-[#94512F]' : 'bg-[#2A2521]'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Options List & Voting Actions */}
        <div className="space-y-4">
          <span className="font-micro text-[10px] uppercase text-[#6B645E] tracking-[0.15em] block">
            BALLOT CANDIDATES
          </span>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeOptions.map((opt) => {
              const isSelected = selectedOptionId === opt.id;

              return (
                <div
                  key={opt.id}
                  className={`p-5 bg-white border transition-all flex flex-col justify-between gap-4 ${
                    isSelected
                      ? 'border-[#94512F] ring-1 ring-[#94512F]/30 bg-[#FCFBF8]'
                      : 'border-[#E4DED6]'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-serif text-lg font-medium text-[#2A2521]">
                        Option {opt.id}: {opt.name}
                      </span>
                      <span className="font-mono text-xs text-[#94512F] font-semibold">
                        {opt.cost_tier}
                      </span>
                    </div>

                    <p className="text-xs text-[#6B645E] leading-relaxed">
                      {opt.what_it_includes}
                    </p>

                    {opt.who_gets_what && opt.who_gets_what.length > 0 && (
                      <div className="text-xs pt-2 border-t border-[#E4DED6]/60 space-y-1">
                        <strong className="font-micro text-[10px] uppercase text-[#6B645E] tracking-wider block">
                          Who gets what:
                        </strong>
                        {opt.who_gets_what.map((w, idx) => (
                          <div key={idx} className="text-[#6B645E]">
                            <span className="text-[#2A2521] font-medium">• {w.member}:</span> {w.gets}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Voting Button for Eligible Voters */}
                  {canVote && !isClosed && (
                    <div className="pt-2 border-t border-[#E4DED6]/70">
                      <Button
                        variant={isSelected ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => handleVote(opt.id)}
                        disabled={isVoting}
                        className={`w-full text-xs cursor-pointer ${
                          isSelected
                            ? '!bg-[#94512F] !text-white border-[#94512F]'
                            : 'border-[#2A2521] text-[#2A2521] hover:bg-[#F1EDE8]'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <Check className="w-3.5 h-3.5" strokeWidth={2} />
                            <span>Voted for Option {opt.id}</span>
                          </>
                        ) : (
                          <span>Vote for Option {opt.id}</span>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

export default function DecisionPage() {
  return (
    <AppShell currentTab="family">
      <Suspense
        fallback={
          <div className="max-w-4xl mx-auto px-4 py-16 text-center text-xs text-[#6B645E]">
            Loading decision ballot...
          </div>
        }
      >
        <DecisionContent />
      </Suspense>
    </AppShell>
  );
}

