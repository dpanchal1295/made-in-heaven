'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Message, EventProfile, PrivateBudget } from '@/types/firestore';
import { OnboardingStatus } from '@/lib/utils/format';
import { NeedsConfirmation } from '@/lib/maya/schemas';
import { useAuth } from '@/lib/auth/AuthContext';
import { ChatMessageItem } from './ChatMessageItem';
import { ProfileSidePanel } from './ProfileSidePanel';
import { Button } from '@/components/ui';
import {
  ArrowRight,
  Sliders,
  AlertCircle,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  RotateCcw,
} from 'lucide-react';
import { Logo } from '@/components/common/Logo';

// Map user language to Web Speech recognition & synthesis BCP-47 tags
const LANG_MAP: Record<string, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  gu: 'gu-IN',
  pa: 'pa-IN',
  mr: 'mr-IN',
};

export const ChatContainer: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [profile, setProfile] = useState<EventProfile | null>(null);
  const [budget, setBudget] = useState<PrivateBudget | null>(null);
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

  // VOICE INTEGRATION STATE
  const [isListening, setIsListening] = useState(false);
  const [hasSpeechRecognition, setHasSpeechRecognition] = useState(true);
  const [voiceSpeakerEnabled, setVoiceSpeakerEnabled] = useState(true);
  const [isSpeakingAudio, setIsSpeakingAudio] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);

  const userLangCode = user?.preferredLanguage || 'en';
  const speechLang = LANG_MAP[userLangCode] || 'en-IN';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, pendingConfirmations]);

  // Load voice speaker preference from localStorage
  useEffect(() => {
    try {
      const savedSpeaker = localStorage.getItem('mih_voice_speaker');
      if (savedSpeaker !== null) {
        setVoiceSpeakerEnabled(savedSpeaker === 'true');
      }
    } catch {}
  }, []);

  const toggleVoiceSpeaker = () => {
    const nextVal = !voiceSpeakerEnabled;
    setVoiceSpeakerEnabled(nextVal);
    try {
      localStorage.setItem('mih_voice_speaker', String(nextVal));
    } catch {}
    if (!nextVal && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeakingAudio(false);
    }
  };

  // Feature detect SpeechRecognition API
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setHasSpeechRecognition(false);
      }
    }
  }, []);

  // Speak text with SpeechSynthesis in the chosen language
  const speakText = useCallback(
    (textToSpeak: string) => {
      if (!voiceSpeakerEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) {
        return;
      }
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = speechLang;
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        utterance.onstart = () => setIsSpeakingAudio(true);
        utterance.onend = () => setIsSpeakingAudio(false);
        utterance.onerror = () => setIsSpeakingAudio(false);

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('Speech synthesis error:', err);
        setIsSpeakingAudio(false);
      }
    },
    [voiceSpeakerEnabled, speechLang]
  );

  // Stop recognition helper
  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
  };

  // Start speech recognition
  const startListening = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setHasSpeechRecognition(false);
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.lang = speechLang;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setInputMessage(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        inputRef.current?.focus();
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
    }
  };

  const handleMicToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

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
          if (data.onboardingStatus) setStatus(data.onboardingStatus);
          if (data.pendingConfirmations) setPendingConfirmations(data.pendingConfirmations);

          if (data.quickReplies && data.quickReplies.length > 0) {
            setQuickReplies(data.quickReplies);
          } else if (data.messages && data.messages.length > 0) {
            const lastMaya = [...data.messages].reverse().find((m: Message) => m.authorType === 'maya');
            if (lastMaya?.structured?.quick_replies) {
              setQuickReplies(lastMaya.structured.quick_replies);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load Maya chat state:', err);
      } finally {
        setIsInitializing(false);
      }
    }

    loadInitialState();
  }, [user?.homeId, user?.uid]);

  // Send message
  const handleSendMessage = async (textToSend?: string, sendMode: 'text' | 'voice' = 'text') => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    if (isListening) {
      stopListening();
    }

    const homeId = user?.homeId;
    const uid = user?.uid;
    if (!homeId || !uid) return;

    const userMsg: Message = {
      id: `usr_${Date.now()}`,
      authorType: 'member',
      authorUid: uid,
      text,
      lang: userLangCode,
      createdAt: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLastSentText(text);
    setIsLoading(true);
    setErrorMessage(null);
    setShowTimeoutRetry(false);

    timeoutTimerRef.current = setTimeout(() => {
      setShowTimeoutRetry(true);
    }, 25000);

    try {
      const res = await fetch('/api/maya', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-member-uid': uid,
          'x-home-id': homeId,
        },
        body: JSON.stringify({ message: text, homeId, uid, mode: sendMode }),
      });

      const data = await res.json();

      if (data.success) {
        setShowTimeoutRetry(false);
        const mayaReply = data.reply || data.envelope?.reply || data.message?.text || '';
        const mayaStructured = data.structured || data.envelope?.structured || data.message?.structured;
        const mayaQuickReplies = data.quick_replies || data.envelope?.quick_replies || mayaStructured?.quick_replies;
        const savedPart =
          data.planPartSaved ||
          (data.structured?.type &&
          ['budget', 'timeline', 'checklist', 'palette', 'decor', 'attire'].includes(data.structured.type)
            ? data.structured.type
            : null);

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
        
        const newConfirmations = data.pendingConfirmations || data.envelope?.needs_confirmation || [];
        setPendingConfirmations(newConfirmations);

        if (mayaQuickReplies && mayaQuickReplies.length > 0) {
          setQuickReplies(mayaQuickReplies);
        } else {
          setQuickReplies([]);
        }

        // Voice output: Speak Maya's response aloud if voice mode or speaker is active
        const textToRead = data.spoken_reply || mayaReply;
        if (textToRead && voiceSpeakerEnabled) {
          speakText(textToRead);
        }

        // If there is a confirmation question, read it aloud too
        if (newConfirmations.length > 0 && voiceSpeakerEnabled) {
          setTimeout(() => {
            speakText(newConfirmations[0].question);
          }, 1500);
        }
      } else {
        const errorText = data?.error || 'Maya could not respond at this time.';
        setErrorMessage(errorText);
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

  // Confirm a detail (Yes)
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
        setStatus(data.onboardingStatus);
        setPendingConfirmations((prev) => prev.filter((c) => c.id !== confirmationId));

        const confirmAckMsg: Message = {
          id: `ack_${Date.now()}`,
          authorType: 'maya',
          authorUid: 'maya-ai',
          text: '✓ Confirmed and saved to your celebration plan.',
          lang: 'en',
          createdAt: Date.now(),
        };
        setMessages((prev) => [...prev, confirmAckMsg]);
        if (voiceSpeakerEnabled) {
          speakText('Confirmed and saved to your plan.');
        }
      }
    } catch (err) {
      console.error('Confirmation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Reject a detail (No / Change)
  const handleReject = async (confirmationId: string) => {
    if (!confirmationId || isLoading) return;
    setIsLoading(true);
    try {
      const homeId = user?.homeId;
      const uid = user?.uid;
      if (!homeId || !uid) return;
      const res = await fetch('/api/maya/reject', {
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
        setPendingConfirmations((prev) => prev.filter((c) => c.id !== confirmationId));
        const rejectAckMsg: Message = {
          id: `rej_${Date.now()}`,
          authorType: 'maya',
          authorUid: 'maya-ai',
          text: 'Understood. Please let me know what you would prefer instead.',
          lang: 'en',
          createdAt: Date.now(),
        };
        setMessages((prev) => [...prev, rejectAckMsg]);
        if (voiceSpeakerEnabled) {
          speakText('Understood. What would you prefer instead?');
        }
      }
    } catch (err) {
      console.error('Rejection error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Restart onboarding
  const handleReset = async () => {
    if (!user?.homeId || !user?.uid || isResetting) return;
    if (!window.confirm('Reset this conversation with Maya? All gathered answers and chat history will be restarted.')) {
      return;
    }

    setIsResetting(true);
    try {
      const res = await fetch('/api/maya/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-member-uid': user.uid,
          'x-home-id': user.homeId,
        },
        body: JSON.stringify({ homeId: user.homeId, uid: user.uid }),
      });

      const data = await res.json();
      if (data.success) {
        setMessages([]);
        setProfile(null);
        setBudget(null);
        setPendingConfirmations([]);
        setQuickReplies([]);
        setStatus({
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

        // Refetch fresh greeting
        const refetchRes = await fetch(`/api/maya?homeId=${user.homeId}&uid=${user.uid}`, {
          headers: {
            'x-member-uid': user.uid,
            'x-home-id': user.homeId,
          },
        });
        const refetchData = await refetchRes.json();
        if (refetchData.success) {
          setMessages(refetchData.messages || []);
          if (refetchData.quickReplies) setQuickReplies(refetchData.quickReplies);
        }
      }
    } catch (err) {
      console.error('Reset error:', err);
    } finally {
      setIsResetting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleResendLast = () => {
    if (lastSentText) {
      handleSendMessage(lastSentText);
    }
  };

  return (
    <div
      className="flex h-full w-full bg-[#FCFBF8] text-[#2A2521] overflow-hidden relative"
      data-event-type={profile?.eventType || 'wedding'}
    >
      {/* ============================================================ */}
      {/* MAIN CONVERSATION SALON                                      */}
      {/* ============================================================ */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#FCFBF8] relative">
        {/* Salon Header Bar */}
        <header className="px-6 py-4 border-b border-[#E4DED6] bg-[#FCFBF8]/95 backdrop-blur-xs flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center border border-[#E4DED6] bg-[#F1EDE8]">
              <Logo size="sm" markOnly variant="dark" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-lg font-normal text-[#2A2521] leading-none">
                  Conversation with Maya
                </h1>
                {isSpeakingAudio && (
                  <span className="inline-flex items-center gap-1 font-micro text-[10px] uppercase text-[#94512F] tracking-wider animate-pulse">
                    <Volume2 className="w-3 h-3" /> Speaking…
                  </span>
                )}
              </div>
              <p className="font-micro text-[10px] text-[#6B645E] uppercase tracking-[0.18em] mt-0.5">
                {profile?.eventType ? `${profile.eventType} planner` : 'Your celebration manager'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Speaker Audio Toggle */}
            <button
              type="button"
              onClick={toggleVoiceSpeaker}
              title={voiceSpeakerEnabled ? 'Mute spoken replies' : 'Unmute spoken replies'}
              aria-label={voiceSpeakerEnabled ? 'Disable spoken replies' : 'Enable spoken replies'}
              className={`p-2 border transition-colors cursor-pointer ${
                voiceSpeakerEnabled
                  ? 'border-[#2A2521] bg-[#F1EDE8] text-[#2A2521]'
                  : 'border-[#E4DED6] text-[#6B645E] hover:text-[#2A2521]'
              }`}
            >
              {voiceSpeakerEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Mobile Sheet Toggle */}
            <button
              type="button"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 border border-[#E4DED6] text-[#2A2521] hover:bg-[#F1EDE8] flex items-center gap-1.5 font-micro text-xs uppercase tracking-wider cursor-pointer"
              aria-label="Toggle notebook"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Notes</span>
            </button>
          </div>
        </header>

        {/* Scrollable Message History Area */}
        <div
          className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-2 relative"
          role="log"
          aria-live="polite"
        >
          {isInitializing ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-3">
                <div className="w-10 h-10 mx-auto flex items-center justify-center border border-[#E4DED6] bg-[#F1EDE8] animate-pulse">
                  <Logo size="sm" markOnly variant="dark" />
                </div>
                <p className="font-micro text-xs text-[#6B645E] uppercase tracking-[0.2em]">
                  Connecting with Maya…
                </p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto space-y-4">
              <div className="w-12 h-12 flex items-center justify-center border border-[#E4DED6] bg-[#F1EDE8]">
                <Logo size="md" markOnly variant="dark" />
              </div>
              <h2 className="font-serif text-2xl font-normal text-[#2A2521]">
                Welcome to your planning room
              </h2>
              <p className="font-sans text-xs sm:text-sm text-[#6B645E] leading-relaxed">
                Maya is here to help you coordinate dates, guest counts, itemized budgets, and family consensus. Say hello or answer any prompt below to get started.
              </p>
            </div>
          ) : (
            <>
              {messages.map((msg, index) => (
                <ChatMessageItem
                  key={msg.id || index}
                  message={msg}
                  isLatestMayaMessage={
                    msg.authorType === 'maya' && index === messages.map((m) => m.authorType).lastIndexOf('maya')
                  }
                  quickReplies={quickReplies}
                  pendingConfirmations={pendingConfirmations}
                  onSelectQuickReply={(replyText) => handleSendMessage(replyText, 'text')}
                  onConfirm={handleConfirm}
                  onReject={handleReject}
                  isActionLoading={isLoading}
                />
              ))}

              {/* Typing indicator */}
              {isLoading && (
                <div className="flex items-center gap-3 py-3 px-4 max-w-xs bg-[#FCFBF8] border border-[#E4DED6] mb-4">
                  <div className="w-4 h-4 flex items-center justify-center">
                    <Logo size="xs" markOnly variant="dark" />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[#6B645E] font-sans">
                    <span>Maya is thinking</span>
                    <span className="inline-flex gap-1 items-center">
                      <span className="w-1 h-1 bg-[#94512F] rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1 h-1 bg-[#94512F] rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1 h-1 bg-[#94512F] rounded-full animate-bounce" />
                    </span>
                  </div>
                </div>
              )}

              {/* 25-second Timeout Friendly Prompt */}
              {showTimeoutRetry && (
                <div
                  role="alert"
                  className="p-4 bg-[#F1EDE8] border border-[var(--accent-dark)]/40 max-w-lg mx-auto flex items-center justify-between gap-4 text-xs"
                >
                  <div className="flex items-center gap-2.5 text-[#2A2521]">
                    <AlertCircle className="w-4 h-4 text-[var(--accent-dark)] shrink-0" />
                    <span>Maya is taking a little longer than usual to compose her response.</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleResendLast}
                    className="shrink-0 border-[#2A2521] text-[#2A2521] hover:bg-white text-xs"
                  >
                    <RotateCcw className="w-3 h-3 mr-1.5" />
                    Try again
                  </Button>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* ============================================================ */}
        {/* FIXED BOTTOM INPUT BAR                                       */}
        {/* ============================================================ */}
        <div className="p-4 sm:p-5 border-t border-[#E4DED6] bg-white/95 backdrop-blur-xs shrink-0 space-y-2">
          {/* Active Listening indicator */}
          {isListening && (
            <div
              role="status"
              aria-live="assertive"
              className="flex items-center justify-between bg-[#F1EDE8] border border-[#94512F] px-4 py-2 text-xs text-[#94512F]"
            >
              <div className="flex items-center gap-2 font-medium">
                <span className="w-2 h-2 rounded-full bg-[#94512F] animate-ping" />
                <span>Listening in {speechLang}… speak clearly</span>
              </div>
              <button
                type="button"
                onClick={stopListening}
                className="font-micro uppercase tracking-wider text-[10px] text-[#2A2521] hover:underline cursor-pointer"
              >
                Stop mic
              </button>
            </div>
          )}

          {/* Browser Unsupported Voice Note */}
          {!hasSpeechRecognition && (
            <div className="text-[11px] text-[#6B645E] flex items-center justify-between px-1">
              <span>Voice recognition works best in Chrome. Text messaging is fully active.</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            {/* Microphone Button (SpeechRecognition) */}
            {hasSpeechRecognition && (
              <button
                type="button"
                onClick={handleMicToggle}
                disabled={isLoading}
                aria-label={isListening ? 'Stop microphone' : 'Start speaking to Maya'}
                className={`min-h-[46px] min-w-[46px] flex items-center justify-center border transition-all cursor-pointer ${
                  isListening
                    ? 'bg-[#94512F] text-white border-[#94512F] shadow-sm animate-pulse'
                    : 'bg-[#FCFBF8] border-[#E4DED6] text-[#2A2521] hover:border-[#2A2521] hover:bg-white'
                }`}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            )}

            {/* Main Input Text Field */}
            <div className="flex-1 relative">
              <label htmlFor="maya-chat-input" className="sr-only">
                Reply to Maya
              </label>
              <input
                ref={inputRef}
                id="maya-chat-input"
                type="text"
                placeholder={isListening ? 'Listening… speak your thoughts' : 'Reply to Maya or ask a question…'}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                className="w-full px-4 py-3 bg-[#FCFBF8] border border-[#E4DED6] text-sm text-[#2A2521] placeholder:text-[#6B645E]/60 focus:outline-hidden focus:border-[#2A2521] focus:ring-1 focus:ring-[#2A2521] min-h-[46px]"
              />
            </div>

            {/* Send Button */}
            <Button
              type="button"
              onClick={() => handleSendMessage(undefined, isListening ? 'voice' : 'text')}
              disabled={isLoading || !inputMessage.trim()}
              className="min-h-[46px] px-5 bg-[#2A2521] hover:bg-black text-white flex items-center gap-2"
              aria-label="Send message"
            >
              <span className="hidden sm:inline font-micro uppercase tracking-wider text-xs">Send</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </main>

      {/* ============================================================ */}
      {/* SIDE NOTEBOOK CARD ("WHAT MAYA KNOWS SO FAR")                */}
      {/* ============================================================ */}
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
