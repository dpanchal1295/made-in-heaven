'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { AppShell } from '@/components/layout/AppShell';
import { Button, Toast } from '@/components/ui';
import { ArrowLeft, Send, Lightbulb, Sparkles } from 'lucide-react';
import { Room, Message, Idea } from '@/types/firestore';
import { DecisionBriefView, DecisionBriefData } from '@/components/family/DecisionBriefView';

function RoomContent() {
  const params = useParams();
  const roomId = (params.roomId as string) || 'venue';
  const router = useRouter();
  const { user } = useAuth();

  const [room, setRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [activeTab, setActiveTab] = useState<'discussion' | 'ideas'>('discussion');

  const [messageInput, setMessageInput] = useState('');
  const [ideaInput, setIdeaInput] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isSubmittingIdea, setIsSubmittingIdea] = useState(false);

  const [brief, setBrief] = useState<DecisionBriefData | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isStartingVote, setIsStartingVote] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isCouple = user?.permission === 'couple';
  const canSeeBudget = user?.canSeeBudget ?? false;

  // Track latest timestamps for efficient polling
  const lastMsgTimeRef = useRef<number>(0);
  const lastIdeaTimeRef = useRef<number>(0);

  // 1. Initial Load: Room details, messages, ideas
  useEffect(() => {
    if (!user?.homeId) return;

    async function loadRoomData() {
      try {
        // Fetch Room info
        const roomRes = await fetch(`/api/homes/${user?.homeId}/rooms`);
        if (roomRes.ok) {
          const roomData = await roomRes.json();
          if (roomData.success && roomData.rooms) {
            const current = roomData.rooms.find(
              (r: Room) => r.id.toLowerCase() === roomId.toLowerCase()
            );
            if (current) setRoom(current);
          }
        }

        // Fetch Messages
        const msgRes = await fetch(`/api/homes/${user?.homeId}/rooms/${roomId}/messages?limit=50`);
        if (msgRes.ok) {
          const msgData = await msgRes.json();
          if (msgData.success && msgData.messages) {
            setMessages(msgData.messages);
            if (msgData.messages.length > 0) {
              lastMsgTimeRef.current = Math.max(...msgData.messages.map((m: Message) => m.createdAt));
            }
          }
        }

        // Fetch Ideas
        const ideaRes = await fetch(`/api/homes/${user?.homeId}/rooms/${roomId}/ideas`);
        if (ideaRes.ok) {
          const ideaData = await ideaRes.json();
          if (ideaData.success && ideaData.ideas) {
            setIdeas(ideaData.ideas);
            if (ideaData.ideas.length > 0) {
              lastIdeaTimeRef.current = Math.max(...ideaData.ideas.map((i: Idea) => i.createdAt));
            }
          }
        }
      } catch (err) {
        console.error('Failed to load room details:', err);
      }
    }

    loadRoomData();
  }, [user?.homeId, roomId]);

  // 2. Efficient Polling every 5 seconds (paused if browser tab is hidden)
  useEffect(() => {
    if (!user?.homeId) return;

    const interval = setInterval(async () => {
      // Pause polling when tab is hidden
      if (typeof document !== 'undefined' && document.hidden) return;

      try {
        // Poll messages since lastMsgTime
        if (lastMsgTimeRef.current > 0) {
          const mRes = await fetch(
            `/api/homes/${user.homeId}/rooms/${roomId}/messages?since=${lastMsgTimeRef.current}`
          );
          if (mRes.ok) {
            const mData = await mRes.json();
            if (mData.success && mData.messages && mData.messages.length > 0) {
              setMessages((prev) => {
                const existingIds = new Set(prev.map((m) => m.id));
                const newItems = mData.messages.filter((m: Message) => !existingIds.has(m.id));
                if (newItems.length === 0) return prev;
                lastMsgTimeRef.current = Math.max(...mData.messages.map((m: Message) => m.createdAt));
                return [...prev, ...newItems];
              });
            }
          }
        }

        // Poll ideas since lastIdeaTime
        if (lastIdeaTimeRef.current > 0) {
          const iRes = await fetch(
            `/api/homes/${user.homeId}/rooms/${roomId}/ideas?since=${lastIdeaTimeRef.current}`
          );
          if (iRes.ok) {
            const iData = await iRes.json();
            if (iData.success && iData.ideas && iData.ideas.length > 0) {
              setIdeas((prev) => {
                const existingIds = new Set(prev.map((i) => i.id));
                const newItems = iData.ideas.filter((i: Idea) => !existingIds.has(i.id));
                if (newItems.length === 0) return prev;
                lastIdeaTimeRef.current = Math.max(...iData.ideas.map((i: Idea) => i.createdAt));
                return [...prev, ...newItems];
              });
            }
          }
        }
      } catch (e) {
        // silent polling error
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [user?.homeId, roomId]);

  // Send message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = messageInput.trim();
    if (!text || isSendingMessage || !user?.homeId) return;

    setIsSendingMessage(true);
    setMessageInput('');

    try {
      const res = await fetch(`/api/homes/${user.homeId}/rooms/${roomId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, lang: user.preferredLanguage || 'en' }),
      });
      const data = await res.json();
      if (data.success && data.message) {
        setMessages((prev) => [...prev, data.message]);
        lastMsgTimeRef.current = Math.max(lastMsgTimeRef.current, data.message.createdAt);
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      } else {
        setToast({ message: data.error || 'Failed to post message', type: 'error' });
      }
    } catch {
      setToast({ message: 'Network error posting message', type: 'error' });
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Submit idea
  const handleAddIdea = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = ideaInput.trim();
    if (!text || isSubmittingIdea || !user?.homeId) return;

    setIsSubmittingIdea(true);
    setIdeaInput('');

    try {
      const res = await fetch(`/api/homes/${user.homeId}/rooms/${roomId}/ideas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (data.success && data.idea) {
        setIdeas((prev) => [...prev, data.idea]);
        lastIdeaTimeRef.current = Math.max(lastIdeaTimeRef.current, data.idea.createdAt);
        setToast({ message: 'Your idea has been added to the room!', type: 'success' });
      } else {
        setToast({ message: data.error || 'Could not submit idea', type: 'error' });
      }
    } catch {
      setToast({ message: 'Network error adding idea', type: 'error' });
    } finally {
      setIsSubmittingIdea(false);
    }
  };

  // Ask Maya to synthesize
  const handleAskMayaToSynthesize = async () => {
    if (isSynthesizing || !user?.homeId) return;
    setIsSynthesizing(true);

    try {
      const res = await fetch('/api/maya/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId }),
      });
      const data = await res.json();
      if (data.success && data.brief) {
        setBrief(data.brief);
        setToast({ message: 'Maya has synthesized a decision brief for this room.', type: 'success' });
      } else {
        setToast({ message: data.error || 'Could not synthesize brief', type: 'error' });
      }
    } catch {
      setToast({ message: 'Network error synthesizing brief', type: 'error' });
    } finally {
      setIsSynthesizing(false);
    }
  };

  // Start family vote from brief
  const handleStartVote = async () => {
    if (!brief || !isCouple || isStartingVote) return;
    setIsStartingVote(true);

    try {
      const res = await fetch('/api/decisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          topic: brief.topic,
          options: brief.options,
        }),
      });

      const data = await res.json();
      if (data.success && data.decision) {
        router.push(`/family/decisions/${data.decision.id}`);
      } else {
        setToast({ message: data.error || 'Could not create decision ballot', type: 'error' });
        setIsStartingVote(false);
      }
    } catch {
      setToast({ message: 'Network error creating decision ballot', type: 'error' });
      setIsStartingVote(false);
    }
  };

  const roomTitle = room?.name || roomId.charAt(0).toUpperCase() + roomId.slice(1);

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {/* Navigation & Header */}
        <div>
          <Link
            href="/family"
            className="inline-flex items-center gap-1.5 text-xs font-micro uppercase tracking-wider text-[#6B645E] hover:text-[#2A2521] mb-3 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Back to Family Circle</span>
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E4DED6]">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-micro text-[10px] text-[#94512F] uppercase tracking-[0.2em] font-semibold">
                  ROOM DISCUSSION & IDEAS
                </span>
                <span className="text-[#6B645E]">•</span>
                <span className="text-xs text-[#6B645E] font-mono">
                  {ideas.length} {ideas.length === 1 ? 'idea' : 'ideas'}
                </span>
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#2A2521] tracking-tight">
                {roomTitle} Room
              </h1>
            </div>

            {/* Maya Synthesize Trigger */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleAskMayaToSynthesize}
              disabled={isSynthesizing}
              className="self-start sm:self-auto border-[#94512F] text-[#94512F] hover:bg-[#F1EDE8] text-xs shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>{isSynthesizing ? 'Maya is synthesizing...' : 'Ask Maya to summarize'}</span>
            </Button>
          </div>
        </div>

        {/* Maya Decision Brief View (if synthesized) */}
        {brief && (
          <DecisionBriefView
            brief={brief}
            isCouple={isCouple}
            canSeeBudget={canSeeBudget}
            onStartVote={handleStartVote}
            isStartingVote={isStartingVote}
          />
        )}

        {/* Tab switcher: Discussion vs Ideas */}
        <div className="flex items-center border-b border-[#E4DED6]">
          <button
            type="button"
            onClick={() => setActiveTab('discussion')}
            className={`px-4 py-2.5 font-micro text-xs uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
              activeTab === 'discussion'
                ? 'border-[#2A2521] text-[#2A2521] font-semibold'
                : 'border-transparent text-[#6B645E] hover:text-[#2A2521]'
            }`}
          >
            Discussion ({messages.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ideas')}
            className={`px-4 py-2.5 font-micro text-xs uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
              activeTab === 'ideas'
                ? 'border-[#2A2521] text-[#2A2521] font-semibold'
                : 'border-transparent text-[#6B645E] hover:text-[#2A2521]'
            }`}
          >
            Ideas Pool ({ideas.length})
          </button>
        </div>

        {/* Tab 1: Discussion Thread */}
        {activeTab === 'discussion' && (
          <div className="space-y-6">
            <div className="p-4 sm:p-6 bg-white border border-[#E4DED6] space-y-4 max-h-[500px] overflow-y-auto">
              {messages.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#6B645E]">
                  No messages in this room yet. Start the conversation below!
                </div>
              ) : (
                messages.map((m) => {
                  const isUser = m.authorUid === user?.uid;
                  const time = new Date(m.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-2 mb-1 text-[11px] text-[#6B645E]">
                        <span className="font-serif font-medium text-[#2A2521]">
                          {isUser ? 'You' : m.authorType === 'maya' ? 'Maya' : m.authorUid}
                        </span>
                        <span>{time}</span>
                      </div>
                      <div
                        className={`p-3.5 text-xs sm:text-sm leading-relaxed max-w-lg border ${
                          isUser
                            ? 'bg-[#2A2521] text-white border-[#2A2521]'
                            : m.authorType === 'maya'
                            ? 'bg-[#FCFBF8] text-[#2A2521] border-[#94512F]'
                            : 'bg-[#FCFBF8] text-[#2A2521] border-[#E4DED6]'
                        }`}
                      >
                        {m.text}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message input */}
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder={`Share a thought with family in ${roomTitle}...`}
                disabled={isSendingMessage}
                className="flex-1 bg-white border border-[#E4DED6] px-4 py-3 text-xs sm:text-sm text-[#2A2521] placeholder-[#6B645E]/60 focus:border-[#2A2521] focus:outline-none"
              />
              <Button
                type="submit"
                variant="primary"
                disabled={isSendingMessage || !messageInput.trim()}
                className="!py-3 shrink-0"
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" strokeWidth={1.5} />
              </Button>
            </form>
          </div>
        )}

        {/* Tab 2: Ideas Pool */}
        {activeTab === 'ideas' && (
          <div className="space-y-6">
            {/* Add Idea Box (Open to every member) */}
            <form onSubmit={handleAddIdea} className="p-5 bg-[#FCFBF8] border border-[#E4DED6] space-y-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-[#94512F]" strokeWidth={1.5} />
                <span className="font-micro text-[10px] uppercase tracking-[0.15em] text-[#94512F] font-semibold">
                  PROPOSE AN IDEA
                </span>
              </div>
              <textarea
                value={ideaInput}
                onChange={(e) => setIdeaInput(e.target.value)}
                placeholder={`What would you love for ${roomTitle}? (e.g. 'Handmade brass lanterns with marigold garland cascades')`}
                rows={3}
                disabled={isSubmittingIdea}
                className="w-full bg-white border border-[#E4DED6] p-3 text-xs sm:text-sm text-[#2A2521] placeholder-[#6B645E]/60 focus:border-[#2A2521] focus:outline-none resize-none"
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmittingIdea || !ideaInput.trim()}
                  className="text-xs"
                >
                  <Lightbulb className="w-3.5 h-3.5" strokeWidth={1.5} />
                  <span>Add my idea</span>
                </Button>
              </div>
            </form>

            {/* Ideas List */}
            <div className="space-y-3">
              {ideas.length === 0 ? (
                <div className="p-8 bg-white border border-[#E4DED6] text-center text-xs text-[#6B645E]">
                  No ideas suggested for {roomTitle} yet. Be the first to add one above!
                </div>
              ) : (
                ideas.map((idea) => {
                  const time = new Date(idea.createdAt).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={idea.id}
                      className="p-5 bg-white border border-[#E4DED6] space-y-2 hover:border-[#2A2521]/60 transition-colors"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-serif font-medium text-[#2A2521] text-sm">
                            {idea.authorName || idea.authorUid}
                          </span>
                          {idea.authorUid === user?.uid && (
                            <span className="font-micro text-[9px] uppercase px-1.5 py-0.2 bg-[#F1EDE8] border border-[#E4DED6] text-[#94512F]">
                              You
                            </span>
                          )}
                        </div>
                        <span className="text-[#6B645E] text-[11px]">{time}</span>
                      </div>
                      <p className="text-xs sm:text-sm text-[#2A2521] leading-relaxed">
                        {idea.text}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default function RoomPage() {
  return (
    <AppShell currentTab="family">
      <Suspense
        fallback={
          <div className="max-w-5xl mx-auto px-4 py-16 text-center text-xs text-[#6B645E]">
            Loading discussion room...
          </div>
        }
      >
        <RoomContent />
      </Suspense>
    </AppShell>
  );
}

