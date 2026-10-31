import 'server-only';
import fs from 'fs/promises';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { MayaResponseEnvelopeSchema, MayaResponseEnvelope } from './schemas';
import { computeMonthsUntilWedding, getOnboardingStatus } from '@/lib/utils/format';
import {
  MOCK_CHAT_ENVELOPES,
  getMockPlanEnvelope,
  extractHttpStatusCode,
} from './fixtures';

/**
 * Handles canned mock responses when MAYA_MOCK=true
 */
function handleMockResponse(options: CallMayaOptions): MayaResponseEnvelope {
  const msgLower = (options.userMessage || '').toLowerCase();
  const topicLower = (options.topic || '').toLowerCase();

  // Plan part generation requests
  if (topicLower.includes('budget') || msgLower.includes('generate budget') || msgLower.includes('budget tab')) {
    return getMockPlanEnvelope('budget');
  }
  if (topicLower.includes('timeline') || msgLower.includes('generate timeline') || msgLower.includes('timeline tab')) {
    return getMockPlanEnvelope('timeline');
  }
  if (topicLower.includes('checklist') || msgLower.includes('generate checklist') || msgLower.includes('checklist tab')) {
    return getMockPlanEnvelope('checklist');
  }
  if (topicLower.includes('palette') || msgLower.includes('generate palette') || msgLower.includes('palette tab')) {
    return getMockPlanEnvelope('palette');
  }
  if (topicLower.includes('decor') || msgLower.includes('generate decor') || msgLower.includes('decor tab')) {
    return getMockPlanEnvelope('decor');
  }
  if (topicLower.includes('attire') || msgLower.includes('generate attire') || msgLower.includes('attire tab')) {
    return getMockPlanEnvelope('attire');
  }

  // Communication style question or answer
  if (options.mustAskCommunicationStyle || topicLower.includes('communication_style')) {
    if (msgLower.includes('gentle') || msgLower.includes('balanced') || msgLower.includes('straight') || msgLower.includes('point')) {
      return MOCK_CHAT_ENVELOPES.style_selected;
    }
    return MOCK_CHAT_ENVELOPES.vibe_selected;
  }

  // Match based on user input content
  if (msgLower.includes('december') || msgLower.includes('2026') || msgLower.includes('nov') || msgLower.includes('jan')) {
    return MOCK_CHAT_ENVELOPES.date_selected;
  }
  if (msgLower.includes('pune') || msgLower.includes('udaipur') || msgLower.includes('mumbai')) {
    return MOCK_CHAT_ENVELOPES.city_selected;
  }
  if (msgLower.includes('300') || msgLower.includes('guest') || msgLower.includes('250') || msgLower.includes('400')) {
    return MOCK_CHAT_ENVELOPES.guests_selected;
  }
  if (msgLower.includes('lakh') || msgLower.includes('crore') || msgLower.includes('₹') || msgLower.includes('budget')) {
    return MOCK_CHAT_ENVELOPES.budget_selected;
  }
  if (msgLower.includes('maharashtrian') || msgLower.includes('fusion') || msgLower.includes('punjabi') || msgLower.includes('gujarati')) {
    return MOCK_CHAT_ENVELOPES.culture_selected;
  }
  if (msgLower.includes('heritage') || msgLower.includes('royal') || msgLower.includes('vibe') || msgLower.includes('elegance')) {
    return MOCK_CHAT_ENVELOPES.vibe_selected;
  }

  // Fallback to onboarding missing fields
  const currentStatus = getOnboardingStatus(options.eventProfile as any, options.budget as any);
  if (!currentStatus.fields.date) return MOCK_CHAT_ENVELOPES.initial;
  if (!currentStatus.fields.city) return MOCK_CHAT_ENVELOPES.date_selected;
  if (!currentStatus.fields.guestCount) return MOCK_CHAT_ENVELOPES.city_selected;
  if (!currentStatus.fields.budget) return MOCK_CHAT_ENVELOPES.guests_selected;
  if (!currentStatus.fields.culture) return MOCK_CHAT_ENVELOPES.budget_selected;
  if (!currentStatus.fields.vibe) return MOCK_CHAT_ENVELOPES.culture_selected;
  if (!currentStatus.fields.communicationStyle) return MOCK_CHAT_ENVELOPES.vibe_selected;

  return MOCK_CHAT_ENVELOPES.style_selected;
}

// In-memory cache for prompt templates read at runtime
let cachedSystemPrompt: string | null = null;
let cachedSynthesisPrompt: string | null = null;
let cachedEnvelopePrompt: string | null = null;
let cachedStyleRulesPrompt: string | null = null;

/**
 * Loads the Maya system prompt from prompts/maya_system_prompt.txt at runtime,
 * appending Part C envelope instructions from prompts/maya_envelope.txt and
 * style rules from prompts/maya_style_rules.txt.
 */
export async function loadSystemPrompt(includeSynthesis: boolean = false): Promise<string> {
  const promptsDir = path.join(process.cwd(), 'prompts');

  if (!cachedSystemPrompt) {
    const systemPromptPath = path.join(promptsDir, 'maya_system_prompt.txt');
    try {
      cachedSystemPrompt = await fs.readFile(systemPromptPath, 'utf-8');
    } catch (err) {
      throw new Error(`Failed to load system prompt from ${systemPromptPath}: ${err}`);
    }
  }

  if (!cachedEnvelopePrompt) {
    const envelopePromptPath = path.join(promptsDir, 'maya_envelope.txt');
    try {
      cachedEnvelopePrompt = await fs.readFile(envelopePromptPath, 'utf-8');
    } catch (err) {
      console.warn(`Could not load envelope prompt from ${envelopePromptPath}: ${err}`);
      cachedEnvelopePrompt = '';
    }
  }

  if (!cachedStyleRulesPrompt) {
    const styleRulesPath = path.join(promptsDir, 'maya_style_rules.txt');
    try {
      cachedStyleRulesPrompt = await fs.readFile(styleRulesPath, 'utf-8');
    } catch (err) {
      console.warn(`Could not load style rules prompt from ${styleRulesPath}: ${err}`);
      cachedStyleRulesPrompt = '';
    }
  }

  // System prompt followed by envelope, then style rules
  let fullPrompt = cachedEnvelopePrompt
    ? `${cachedSystemPrompt}\n\n---\n\n${cachedEnvelopePrompt}`
    : cachedSystemPrompt;

  if (cachedStyleRulesPrompt) {
    fullPrompt = `${fullPrompt}\n\n---\n\n${cachedStyleRulesPrompt}`;
  }

  if (includeSynthesis) {
    if (!cachedSynthesisPrompt) {
      const synthesisPromptPath = path.join(promptsDir, 'maya_group_synthesis.txt');
      try {
        cachedSynthesisPrompt = await fs.readFile(synthesisPromptPath, 'utf-8');
      } catch (err) {
        throw new Error(`Failed to load group synthesis prompt from ${synthesisPromptPath}: ${err}`);
      }
    }
    fullPrompt = `${fullPrompt}\n\n---\n\n${cachedSynthesisPrompt}`;
  }

  return fullPrompt;
}

export interface SpeakerContext {
  name: string;
  relationship: string;
  permission: 'couple' | 'voter' | 'advisor' | 'viewer' | string;
  preferred_language: string;
  can_see_budget: boolean;
}

export interface CallMayaOptions {
  userMessage: string;
  speaker: SpeakerContext;
  mode?: 'text' | 'voice';
  room?: string;
  eventProfile?: Record<string, any>;
  budget?: Record<string, any> | null;
  recentMessages?: Array<{
    authorType: 'member' | 'maya';
    authorName?: string;
    text: string;
  }>;
  ideas?: Array<{
    authorName: string;
    text: string;
  }>;
  topic?: string;
  groupSynthesis?: boolean;
  today?: string;
  monthsUntilWedding?: number | string | null;
  onboardingComplete?: boolean;
  mustAskCommunicationStyle?: boolean;
  onboardingGuidance?: string;
}

/**
 * Checks whether quick_replies array offers the three honesty communication styles:
 * gentle, balanced, straight to the point.
 */
export function offersThreeCommunicationStyles(quickReplies: string[] | undefined | null): boolean {
  if (!quickReplies || !Array.isArray(quickReplies)) return false;
  const lower = quickReplies.map((r) => String(r).toLowerCase().trim());
  const hasGentle = lower.some((r) => r.includes('gentle'));
  const hasBalanced = lower.some((r) => r.includes('balanced'));
  const hasStraight = lower.some((r) => r.includes('straight') || r.includes('point') || r.includes('direct'));
  return hasGentle && hasBalanced && hasStraight;
}

/**
 * Counts words in a string.
 */
function countWords(text: string): number {
  if (!text || typeof text !== 'string') return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Logs reply word count in non-production environments.
 */
function logReplyWordCount(reply: string) {
  if (process.env.NODE_ENV !== 'production') {
    const count = countWords(reply);
    console.log(`[Maya] Reply word count: ${count}`);
  }
}

/**
 * Sanitize context by removing budget details if speaker cannot see budget
 * (Section 5 Step 3 of build brief: do not rely on the prompt alone).
 */
function sanitizeContextForSpeaker(options: CallMayaOptions) {
  const profileCopy = options.eventProfile ? JSON.parse(JSON.stringify(options.eventProfile)) : {};
  let budgetData = options.budget ? JSON.parse(JSON.stringify(options.budget)) : null;

  if (!options.speaker.can_see_budget) {
    budgetData = null;
    delete profileCopy.budget;
    delete profileCopy.target_budget;
    delete profileCopy.allocated_budget;
  }

  return {
    profile: profileCopy,
    budget: budgetData,
  };
}

/**
 * Server-only helper that executes a Maya chat turn using Gemini API.
 * Validates output with Zod and retries once on invalid JSON format.
 */
export async function callMaya(options: CallMayaOptions): Promise<MayaResponseEnvelope> {
  // 1. Mock Mode: Return realistic canned envelopes without calling Gemini SDK
  if (process.env.MAYA_MOCK === 'true') {
    const mockEnvelope = handleMockResponse(options);
    logReplyWordCount(mockEnvelope.reply);
    return mockEnvelope;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not defined in environment variables. Please check your .env configuration.');
  }

  if (!modelName || modelName.includes('your_model_name')) {
    throw new Error('GEMINI_MODEL is not properly configured. Please set a valid Gemini model in your .env (e.g. gemini-2.5-flash).');
  }

  const systemInstruction = await loadSystemPrompt(Boolean(options.groupSynthesis));
  const ai = new GoogleGenAI({ apiKey });

  // Sanitize context based on speaker permission
  const { profile, budget } = sanitizeContextForSpeaker(options);

  // Compute context additions: TODAY, MONTHS_UNTIL_WEDDING, and ONBOARDING_COMPLETE
  const today = options.today || new Date().toISOString().split('T')[0];
  const monthsUntilWedding = options.monthsUntilWedding !== undefined
    ? options.monthsUntilWedding
    : computeMonthsUntilWedding(profile?.date);
  const onboardingComplete = options.onboardingComplete !== undefined
    ? options.onboardingComplete
    : getOnboardingStatus(profile as any, (options.budget || budget) as any).isFullyComplete;

  // Construct structured prompt inputs per Part A + style rules
  const promptContext = {
    TODAY: today,
    MONTHS_UNTIL_WEDDING: monthsUntilWedding,
    ONBOARDING_COMPLETE: onboardingComplete,
    MUST_ASK_COMMUNICATION_STYLE: Boolean(options.mustAskCommunicationStyle),
    EVENT_PROFILE: profile,
    ...(budget ? { PRIVATE_BUDGET: budget } : {}),
    SPEAKER: {
      name: options.speaker.name,
      relationship: options.speaker.relationship,
      permission: options.speaker.permission,
      preferred_language: options.speaker.preferred_language,
      can_see_budget: options.speaker.can_see_budget,
    },
    MODE: options.mode || 'text',
    ROOM: options.room || 'General',
    RECENT_MESSAGES: options.recentMessages || [],
    ...(options.ideas ? { IDEAS: options.ideas } : {}),
    ...(options.topic ? { TOPIC: options.topic } : {}),
    LATEST_USER_MESSAGE: options.userMessage,
  };

  const eventType = profile?.eventType || 'wedding';
  const userContent = `Here is the current celebration context (Celebration Type: ${eventType}):\n${JSON.stringify(promptContext, null, 2)}\n\nRespond to the speaker's latest message in accordance with your celebration instructions. Return ONLY the JSON envelope.`;

  // First attempt
  let rawText = '';
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: userContent,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    rawText = response.text || '';
    const parsedJson = JSON.parse(cleanJsonString(rawText));
    const validated = MayaResponseEnvelopeSchema.parse(parsedJson);

    // If MUST_ASK_COMMUNICATION_STYLE is true, check if quick_replies offer those three styles
    if (options.mustAskCommunicationStyle && !offersThreeCommunicationStyles(validated.quick_replies)) {
      console.warn('[Maya] MUST_ASK_COMMUNICATION_STYLE is true but quick_replies do not offer all 3 styles. Retrying once with correction...');
      try {
        const retryResponse = await ai.models.generateContent({
          model: modelName,
          contents: [
            { role: 'user', parts: [{ text: userContent }] },
            { role: 'model', parts: [{ text: rawText }] },
            {
              role: 'user',
              parts: [{
                text: `Correction: MUST_ASK_COMMUNICATION_STYLE is true. You must ask how they prefer to hear about problems (e.g. gentle, balanced, straight to the point) before offering any other options, and your quick_replies MUST include all three styles: "Gentle", "Balanced", and "Straight to the point".
Your previous quick_replies (${JSON.stringify(validated.quick_replies)}) did not offer these three styles.
Please return ONLY the corrected JSON envelope asking this question and offering quick_replies: ["Gentle", "Balanced", "Straight to the point"].`
              }],
            },
          ],
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
          },
        });

        const retryRawText = retryResponse.text || '';
        const retryParsedJson = JSON.parse(cleanJsonString(retryRawText));
        const retryValidated = MayaResponseEnvelopeSchema.parse(retryParsedJson);
        if (!offersThreeCommunicationStyles(retryValidated.quick_replies)) {
          retryValidated.quick_replies = ['Gentle', 'Balanced', 'Straight to the point'];
        }
        logReplyWordCount(retryValidated.reply);
        return retryValidated;
      } catch (styleRetryErr) {
        console.warn('Style correction retry failed, applying quick replies fallback:', styleRetryErr);
        validated.quick_replies = ['Gentle', 'Balanced', 'Straight to the point'];
        return validated;
      }
    }

    logReplyWordCount(validated.reply);
    return validated;
  } catch (firstError) {
    const httpStatus = extractHttpStatusCode(firstError);

    // Never retry on 429: return friendly message and clean envelope
    if (httpStatus === 429) {
      console.warn('[Maya] Rate limit (429) hit. Returning friendly message without retry.');
      return {
        reply: "Maya is catching her breath from high demand right now! Please take a quick moment and try again shortly.",
        spoken_reply: options.mode === 'voice' ? "Maya is currently experiencing high demand. Please try again shortly." : null,
        quick_replies: ["Try again in a moment", "View wedding plan"],
        profile_updates: [],
        needs_confirmation: [],
        structured: { type: 'none', data: null },
      };
    }

    // Never retry on 503, 401, 403, 404
    if (httpStatus && [503, 401, 403, 404].includes(httpStatus)) {
      console.warn(`[Maya] HTTP ${httpStatus} received. Returning friendly message without retry.`);
      return {
        reply: "I am having trouble connecting with the planning service right now. Please try again in just a moment.",
        spoken_reply: options.mode === 'voice' ? "Trouble connecting right now. Please try again in a moment." : null,
        quick_replies: ["Let's try again", "Show wedding plan"],
        profile_updates: [],
        needs_confirmation: [],
        structured: { type: 'none', data: null },
      };
    }

    // Only retry on JSON parse or Zod validation errors, once
    const isParseOrZodError =
      firstError instanceof SyntaxError ||
      firstError instanceof z.ZodError ||
      (firstError as any)?.name === 'SyntaxError' ||
      (firstError as any)?.name === 'ZodError';

    if (!isParseOrZodError) {
      console.error('[Maya] Non-retryable error encountered:', firstError);
      return {
        reply: "I encountered a brief hiccup while processing that. Could you please share that with me once more?",
        spoken_reply: options.mode === 'voice' ? "Could you please share that once more?" : null,
        quick_replies: ["Let's try again"],
        profile_updates: [],
        needs_confirmation: [],
        structured: { type: 'none', data: null },
      };
    }

    if (process.env.NODE_ENV !== 'production') {
      console.warn('[Maya Dev] Initial JSON parse/Zod validation failed. Retrying once with error guidance...', firstError);
    }

    let retryRawText = '';
    try {
      const retryResponse = await ai.models.generateContent({
        model: modelName,
        contents: [
          { role: 'user', parts: [{ text: userContent }] },
          { role: 'model', parts: [{ text: rawText || '{}' }] },
          {
            role: 'user',
            parts: [{
              text: `Your previous response was not valid JSON conforming to the expected Maya envelope schema.
Error details: ${firstError instanceof Error ? firstError.message : String(firstError)}
Please output ONLY a valid JSON object matching the Part C envelope:
{
  "reply": string,
  "spoken_reply": string or null,
  "quick_replies": string[],
  "profile_updates": [{"path": string, "action": "set", "value": any, "reason": string}],
  "needs_confirmation": [{"path": string, "value": any, "question": string}],
  "structured": {"type": string, "data": any}
}`
            }],
          },
        ],
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
        },
      });

      retryRawText = retryResponse.text || '';
      const retryParsedJson = JSON.parse(cleanJsonString(retryRawText));
      const retryValidated = MayaResponseEnvelopeSchema.parse(retryParsedJson);
      if (options.mustAskCommunicationStyle && !offersThreeCommunicationStyles(retryValidated.quick_replies)) {
        retryValidated.quick_replies = ['Gentle', 'Balanced', 'Straight to the point'];
      }
      logReplyWordCount(retryValidated.reply);
      return retryValidated;
    } catch (retryError) {
      console.error('[Maya] Retry also failed. Returning friendly fallback without exposing internal error.', retryError);
      const fallbackEnvelope: MayaResponseEnvelope = {
        reply: options.mustAskCommunicationStyle
          ? "When something doesn't fit the plan, how do you prefer to hear about problems — gentle, balanced, or straight to the point?"
          : "I'm having a little trouble putting my thoughts together right now. Could you please share that with me once more?",
        spoken_reply: options.mode === 'voice' ? "Could you please repeat that?" : null,
        quick_replies: options.mustAskCommunicationStyle
          ? ['Gentle', 'Balanced', 'Straight to the point']
          : ["Let's try again", "Show plan summary"],
        profile_updates: [],
        needs_confirmation: [],
        structured: { type: 'none', data: null },
      };
      logReplyWordCount(fallbackEnvelope.reply);
      return fallbackEnvelope;
    }
  }
}

/**
 * Utility to strip markdown fences (```json ... ```) if returned despite JSON mode.
 */
function cleanJsonString(str: string): string {
  const trimmed = str.trim();
  if (trimmed.startsWith('```')) {
    return trimmed.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```$/, '').trim();
  }
  return trimmed;
}
