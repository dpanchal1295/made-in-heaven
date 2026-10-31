'use client';

import React from 'react';
import { Message } from '@/types/firestore';
import { SafeMarkdown } from './SafeMarkdown';
import { NeedsConfirmation } from '@/lib/maya/schemas';
import { StructuredCard } from './StructuredCard';
import { Chip, Button } from '@/components/ui';
import { AlertCircle, Check, X } from 'lucide-react';

interface ChatMessageItemProps {
  message: Message;
  isLatestMayaMessage: boolean;
  quickReplies?: string[];
  pendingConfirmations?: NeedsConfirmation[];
  onSelectQuickReply: (text: string) => void;
  onConfirm: (confirmationId: string) => void;
  onReject: (confirmationId: string) => void;
  isActionLoading?: boolean;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
  isLatestMayaMessage,
  quickReplies = [],
  pendingConfirmations = [],
  onSelectQuickReply,
  onConfirm,
  onReject,
  isActionLoading = false,
}) => {
  const isMaya = message.authorType === 'maya';

  const timeStr = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (isMaya) {
    return (
      <div className="flex flex-col space-y-2 mb-6 max-w-2xl">
        <div className="flex-1">
          {/* Header Label: Small terracotta label "MAYA" (no avatar bubble, no robot icon) */}
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-micro text-[11px] text-[#94512F] tracking-[0.2em] uppercase font-semibold">
              MAYA
            </span>
            <span className="text-[11px] text-[#6B645E]">{timeStr}</span>
          </div>

          {/* Message Bubble: Cream card (#FCFBF8) with hairline border #E4DED6 */}
          <div className="bg-[#FCFBF8] border border-[#E4DED6] p-5 text-sm text-[#2A2521] leading-relaxed">
            <SafeMarkdown content={message.text} />
            {message.planPartSaved && (
              <div className="mt-3 pt-3 border-t border-[#E4DED6] flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#A8603E]" />
                <span className="text-xs text-[#6B645E]">
                  Saved to your plan —{' '}
                  <a
                    href={`/plan?tab=${message.planPartSaved}`}
                    className="text-[#94512F] underline hover:text-[#2A2521] font-medium"
                  >
                    View {message.planPartSaved} tab
                  </a>
                </span>
              </div>
            )}
          </div>

          {/* Structured Card */}
          <StructuredCard structured={message.structured} />

          {/* Pending Confirmations (Yes / No prompts) */}
          {isLatestMayaMessage && pendingConfirmations && pendingConfirmations.length > 0 && (
            <div className="mt-3 space-y-2">
              {pendingConfirmations.map((item) => (
                <div
                  key={item.id || item.path}
                  className="p-4 bg-[#F1EDE8] border border-[#E4DED6] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-[#94512F] shrink-0 mt-0.5" strokeWidth={1.5} />
                    <div>
                      <div className="font-micro text-[10px] text-[#94512F] uppercase tracking-[0.2em]">
                        Confirmation Needed
                      </div>
                      <div className="text-sm font-medium text-[#2A2521] mt-0.5">
                        {item.question}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => item.id && onConfirm(item.id)}
                      disabled={isActionLoading || !item.id}
                      className="!bg-[#2A2521] hover:!bg-[#1C1917] !text-white text-xs"
                    >
                      <Check className="w-3.5 h-3.5" strokeWidth={1.5} />
                      <span>Confirm</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => item.id && onReject(item.id)}
                      disabled={isActionLoading || !item.id}
                      className="border-[#E4DED6] text-xs hover:bg-white"
                    >
                      <X className="w-3.5 h-3.5" strokeWidth={1.5} />
                      <span>Change</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick Replies: hairline outline chips, square, charcoal text, soft beige hover */}
          {isLatestMayaMessage && quickReplies && quickReplies.length > 0 && (
            <div className="mt-4">
              <div className="font-micro text-[10px] text-[#6B645E] tracking-[0.2em] uppercase mb-2">
                SUGGESTED REPLIES
              </div>
              <div className="flex flex-wrap gap-2">
                {quickReplies.map((reply, idx) => (
                  <Chip
                    key={idx}
                    label={reply}
                    onClick={() => onSelectQuickReply(reply)}
                    disabled={isActionLoading}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Member (User) Message Bubble: Solid charcoal #2A2521 card with white text
  return (
    <div className="flex flex-col items-end mb-6 ml-auto max-w-xl">
      <div className="flex items-center gap-2 mb-1.5 mr-1">
        <span className="text-[11px] text-[#6B645E]">{timeStr}</span>
        <span className="font-micro text-[10px] text-[#2A2521] uppercase tracking-[0.15em]">
          YOU
        </span>
      </div>
      <div className="bg-[#2A2521] text-white px-5 py-3.5 text-sm leading-relaxed border border-[#2A2521]">
        {message.text}
      </div>
    </div>
  );
};
