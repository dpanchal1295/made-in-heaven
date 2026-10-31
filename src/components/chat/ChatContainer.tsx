'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Message, EventProfile, PrivateBudget, Member } from '@/types/firestore';
import { OnboardingStatus, getOnboardingStatus } from '@/lib/utils/format';
import { NeedsConfirmation } from '@/lib/maya/schemas';
import { useAuth } from '@/lib/auth/AuthContext';
import { ChatMessageItem } from './ChatMessageItem';
import { ProfileSidePanel } from './ProfileSidePanel';
import { Button, Badge } from '@/components/ui';
import { ArrowRight, Sliders, AlertCircle, X } from 'lucide-react';

export const ChatContainer: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [profile, setProfile] = useState<EventProfile | null>(null);
  const [budget, setBudget] = useState<PrivateBudget | null>(null);
  const [speaker, setSpeaker] = useState<Member | null>(null);
  const [pendingConfirmations, setPendingConfirmations] = useState<NeedsConfirmation[]>([]);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [status, setStatus] = useState<OnboardingStatus>({
    completedCount: 0,
    totalRequired: 6,
    percent: 0,
    isCoreComplete: false,
    isFullyComplete: false,
    missingFields: [],
    fields: {
      date: false,
      city: false,
      guestCount: false,
      budget: false,
      culture: false,
      vibe: false,
      communicationStyle: false,
    },
  });

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastSentText, setLastSentText] = useState<string | null>(null);
  const [showTimeoutRetry, setShowTimeoutRetry] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutTimerRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, pendingConfirmations]);

  // Load initial chat state on mount
  useEffect(() => {
    async function loadInitialState() {
      try {
        setIsInitializing(true);
        if (!user?.homeId) {
          setIsInitializing(false);
          return;
        }
        const homeId = user.homeId;
        const uid = user.uid;
        const res = await fetch(`/api/maya?homeId=${homeId}&uid=${uid}`, {
          headers: {
            'x-member-uid': uid,
            'x-home-id': homeId,
          },
        });
        const data = await res.json();

        if (data && data.success) {
          setMessages(data.messages || []);
          if (data.profile) setProfile(data.profile);
          if (data.budget) setBudget(data.budget);
          if (data.speaker) setSpeaker(data.speaker);
          if (data.pendingConfirmations) setPendingConfirmations(data.pendingConfirmations);
          if (data.onboardingStatus) {
            setStatus(data.onboardingStatus);
          } else {
            setStatus(getOnboardingStatus(data.profile || null, data.budget || null));
          }

          const latestMaya = [...(data.messages || [])]
            .reverse()
            .find((m: Message) => m.authorType === 'maya');
          if (latestMaya?.structured?.quick_replies) {
            setQuickReplies(latestMaya.structured.quick_replies);
          }
        } else {
          setErrorMessage(data?.error || 'Could not load chat session.');
          if (data?.onboardingStatus) {
            setStatus(data.onboardingStatus);
          }
        }
      } catch (err) {
        console.error('Failed to load initial chat state:', err);
        setErrorMessage('Failed to connect to wedding planner service.');
      } finally {
        setIsInitializing(false);
      }
    }

    loadInitialState();
  }, [user]);

  // Send a message to Maya
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend ?? inputMessage).trim();
    if (!text || isLoading) return;

    setInputMessage('');
    setErrorMessage(null);
    setShowTimeoutRetry(false);
    setLastSentText(text);

    const tempUserMsg: Message = {
      id: `temp_${Date.now()}`,
      authorType: 'member',
      authorUid: user?.uid || 'user-aarav',
      text,
      lang: 'en',
      createdAt: Date.now(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setIsLoading(true);

    if (timeoutTimerRef.current) {
      clearTimeout(timeoutTimerRef.current);
    }
    // After 25 seconds of waiting, show a friendly message with a "Try again" button
    timeoutTimerRef.current = setTimeout(() => {
      setShowTimeoutRetry(true);
    }, 25000);

    try {
      const homeId = user?.homeId;
      const uid = user?.uid;
      if (!homeId || !uid) return;
      const res = await fetch('/api/maya', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-member-uid': uid,
          'x-home-id': homeId,
        },
        body: JSON.stringify({ message: text, homeId, uid }),
      });

      const data = await res.json();

      if (data.success) {
        setShowTimeoutRetry(false);
        const mayaReply = data.reply || data.envelope?.reply || data.message?.text || '';
        const mayaStructured = data.structured || data.envelope?.structured || data.message?.structured;
        const mayaQuickReplies = data.quick_replies || data.envelope?.quick_replies || mayaStructured?.quick_replies;
        const savedPart = data.planPartSaved || (data.structured?.type && ['budget', 'timeline', 'checklist', 'palette', 'decor', 'attire'].includes(data.structured.type) ? data.structured.type : null);

        const mayaMsg: Message = {
          id: data.message?.id || `maya_${Date.now()}`,
          authorType: 'maya',
          authorUid: 'maya-ai',
          text: mayaReply,
          structured: mayaStructured,
          planPartSaved: savedPart,
          lang: 'en',
          createdAt: Date.now(),
        };

        setMessages((prev) => [...prev, mayaMsg]);

        if (data.profile) setProfile(data.profile);
        if (data.budget) setBudget(data.budget);
        if (data.onboardingStatus) setStatus(data.onboardingStatus);
        if (data.pendingConfirmations) {
          setPendingConfirmations(data.pendingConfirmations);
        } else if (data.envelope?.needs_confirmation) {
          setPendingConfirmations(data.envelope.needs_confirmation);
        }

        if (mayaQuickReplies && mayaQuickReplies.length > 0) {
          setQuickReplies(mayaQuickReplies);
        } else {
          setQuickReplies([]);
        }
      } else {
        const errorText = data?.error || 'Maya could not respond at this time.';
        setErrorMessage(errorText);
        // Also show a friendly message bubble in the chat
        const errorMsg: Message = {
          id: `err_${Date.now()}`,
          authorType: 'maya',
          authorUid: 'maya-ai',
          text: errorText,
          lang: 'en',
          createdAt: Date.now(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      const networkError = 'Maya is taking a short break, please try again in a minute.';
      setErrorMessage(networkError);
      const errorMsg: Message = {
        id: `err_${Date.now()}`,
        authorType: 'maya',
        authorUid: 'maya-ai',
        text: networkError,
        lang: 'en',
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      if (timeoutTimerRef.current) {
        clearTimeout(timeoutTimerRef.current);
        timeoutTimerRef.current = null;
      }
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  // Confirm a detail
  const handleConfirm = async (confirmationId: string) => {
    if (!confirmationId || isLoading) return;
    setIsLoading(true);
    try {
      const homeId = user?.homeId;
      const uid = user?.uid;
      if (!homeId || !uid) return;
      const res = await fetch('/api/maya/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-member-uid': uid,
          'x-home-id': homeId,
        },
        body: JSON.stringify({ confirmationId, homeId, uid }),
      });

      const data = await res.json();
      if (data.success) {
        setProfile(data.profile || null);
        setBudget(data.budget || null);
        setPendingConfirmations((prev) => prev.filter((c) => c.id !== confirmationId));
        if (data.onboardingStatus) {
          setStatus(data.onboardingStatus);
        }

        const noteMessage: Message = {
          id: `sys_${Date.now()}`,
          authorType: 'maya',
          authorUid: 'maya-ai',
          text: '✓ Confirmed and saved to your wedding profile.',
          lang: 'en',
          createdAt: Date.now(),
        };
        setMessages((prev) => [...prev, noteMessage]);
      } else {
        setErrorMessage(data.error || 'Failed to confirm detail.');
      }
    } catch (err) {
      console.error('Error confirming:', err);
      setErrorMessage('Network error confirming item.');
    } finally {
      setIsLoading(false);
    }
  };

  // Reject a confirmation
  const handleReject = async (confirmationId: string) => {
    if (!confirmationId || isLoading) return;
    try {
      await fetch('/api/maya/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmationId }),
      });

      setPendingConfirmations((prev) => prev.filter((c) => c.id !== confirmationId));

      const noteMessage: Message = {
        id: `sys_${Date.now()}`,
        authorType: 'maya',
        authorUid: 'maya-ai',
        text: 'Noted. What would you like to set it to instead?',
        lang: 'en',
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, noteMessage]);
    } catch (err) {
      console.error('Error rejecting:', err);
    }
  };

  // Reset wedding onboarding
  const handleReset = async () => {
    if (!confirm('Are you sure you want to restart onboarding from scratch?')) return;
    setIsResetting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/maya/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success) {
        setProfile(data.profile);
        setBudget(data.budget);
        if (data.onboardingStatus) {
          setStatus(data.onboardingStatus);
        } else {
          setStatus(getOnboardingStatus(data.profile, data.budget));
        }
        setPendingConfirmations([]);

        const getRes = await fetch('/api/maya');
        const getData = await getRes.json();
        if (getData.success) {
          setMessages(getData.messages || []);
          const latestMaya = [...(getData.messages || [])]
            .reverse()
            .find((m: Message) => m.authorType === 'maya');
          if (latestMaya?.structured?.quick_replies) {
            setQuickReplies(latestMaya.structured.quick_replies);
          }
        }
      }
    } catch (err) {
      console.error('Failed to reset:', err);
      setErrorMessage('Could not reset demo data.');
    } finally {
      setIsResetting(false);
    }
  };

  const latestMayaIndex = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].authorType === 'maya') return i;
    }
    return -1;
  })();

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden relative">
      {/* Main Chat Column */}
      <div className="flex-1 flex flex-col h-full bg-[#FCFBF8] overflow-hidden">
        {/* Chat Sub-Header */}
        <div className="px-6 py-4 border-b border-[#E4DED6] bg-[#FCFBF8] flex items-center justify-between shrink-0">
          <div>
            <h2 className="font-serif text-lg font-medium text-[#2A2521]">
              Planning with Maya
            </h2>
            <p className="font-micro text-[11px] text-[#6B645E] uppercase tracking-[0.15em] mt-0.5">
              YOUR CELEBRATION PLANNER
            </p>
          </div>

          {/* Side Panel Toggle */}
          <button
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            className="flex items-center gap-2 px-3 py-1.5 border border-[#E4DED6] bg-white hover:bg-[#F1EDE8] text-xs font-medium text-[#2A2521] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#94512F]"
            aria-label="Toggle celebration profile details"
          >
            <Sliders className="w-3.5 h-3.5 text-[#94512F]" strokeWidth={1.5} />
            <span className="hidden sm:inline">Details:</span>
            <span className="font-mono text-xs">{status?.completedCount ?? 0}/{status?.totalRequired ?? 6}</span>
          </button>
        </div>

        {/* Error notification banner */}
        {errorMessage && (
          <div className="px-4 py-2.5 bg-[#F1EDE8] border-b border-[#E4DED6] text-xs text-[#94512F] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#94512F]" strokeWidth={1.5} />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-[#94512F] p-1 cursor-pointer"
              aria-label="Dismiss error"
            >
              <X className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
          </div>
        )}

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-4">
          {isInitializing ? (
            <div className="h-full flex flex-col items-center justify-center space-y-3 text-[#6B645E]">
              <div className="w-6 h-6 border border-[#2A2521] border-t-transparent animate-spin" />
              <p className="font-micro text-xs uppercase tracking-[0.15em]">
                Connecting to Maya...
              </p>
            </div>
          ) : (
            <>
              {messages.map((msg, idx) => (
                <ChatMessageItem
                  key={msg.id || idx}
                  message={msg}
                  isLatestMayaMessage={idx === latestMayaIndex}
                  quickReplies={quickReplies}
                  pendingConfirmations={pendingConfirmations}
                  onSelectQuickReply={(reply) => handleSendMessage(reply)}
                  onConfirm={handleConfirm}
                  onReject={handleReject}
                  isActionLoading={isLoading}
                />
              ))}

              {/* Typing / Thinking Indicator */}
              {isLoading && (
                <div className="space-y-2 mb-4 max-w-md">
                  <div
                    className="flex items-center gap-3"
                    role="status"
                    aria-live="polite"
                  >
                    <div className="bg-[#FCFBF8] border border-[#E4DED6] px-4 py-2.5 flex items-center gap-2.5 shadow-xs">
                      <span className="font-serif italic text-xs text-[#2A2521]">
                        Maya is typing…
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#94512F] animate-bounce" />
                        <span className="w-1.5 h-1.5 rounded-full bg-[#94512F] animate-bounce [animation-delay:0.2s]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-[#94512F] animate-bounce [animation-delay:0.4s]" />
                      </span>
                    </div>
                  </div>

                  {showTimeoutRetry && (
                    <div className="bg-[#FCFBF8] border border-[#94512F]/30 p-3 text-xs text-[#2A2521] flex items-center justify-between gap-3 shadow-xs">
                      <span className="text-[#6B645E]">
                        Maya is taking longer than usual to think through the details.
                      </span>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          if (lastSentText) {
                            handleSendMessage(lastSentText);
                          }
                        }}
                        className="shrink-0 text-xs py-1 px-3 border border-[#2A2521]"
                      >
                        Try again
                      </Button>
                    </div>
                  )}
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 sm:p-5 border-t border-[#E4DED6] bg-[#FCFBF8] shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="max-w-4xl mx-auto flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Reply to Maya... (e.g. 'We are thinking around 150 guests' or 'Suggest some themes')"
              disabled={isLoading || isInitializing}
              className="flex-1 bg-white border border-[#E4DED6] focus:border-[#2A2521] px-4 py-3 text-sm text-[#2A2521] placeholder-[#6B645E]/60 focus:outline-none focus:ring-1 focus:ring-[#2A2521] transition-all disabled:opacity-50"
              aria-label="Message to Maya"
            />
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading || !inputMessage.trim() || isInitializing}
              className="!py-3 shrink-0"
            >
              <span>SEND</span>
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
            </Button>
          </form>
          <div className="max-w-4xl mx-auto mt-2 text-center font-micro text-[11px] text-[#6B645E] uppercase tracking-[0.15em]">
            Tap a suggestion or type your reply
          </div>
        </div>
      </div>

      {/* Side Panel: "Your Wedding Profile" */}
      <ProfileSidePanel
        profile={profile}
        budget={budget}
        status={status}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onReset={handleReset}
        isResetting={isResetting}
      />
    </div>
  );
};
