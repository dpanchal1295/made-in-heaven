import 'server-only';
import fs from 'fs/promises';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
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

let cachedSystemPrompt: string | null = null;
let cachedSynthesisPrompt: string | null = null;

export async function loadSystemPrompt(isGroupSynthesis = false): Promise<string> {
  if (isGroupSynthesis && cachedSynthesisPrompt) {
    return cachedSynthesisPrompt;
  }
  if (!isGroupSynthesis && cachedSystemPrompt) {
    return cachedSystemPrompt;
  }

  const promptsDir = path.join(process.cwd(), 'prompts');

  if (isGroupSynthesis) {
    try {
      const synthesisPath = path.join(promptsDir, 'maya_group_synthesis.txt');
      cachedSynthesisPrompt = await fs.readFile(synthesisPath, 'utf-8');
      return cachedSynthesisPrompt;
    } catch {
      console.warn('Could not read maya_group_synthesis.txt, falling back to default system prompt.');
    }
  }

  try {
    const mainPromptPath = path.join(promptsDir, 'maya_system_prompt.txt');
    const styleRulesPath = path.join(promptsDir, 'maya_style_rules.txt');
    const envelopePath = path.join(promptsDir, 'maya_envelope.txt');

    const [mainPrompt, styleRules, envelope] = await Promise.all([
      fs.readFile(mainPromptPath, 'utf-8'),
      fs.readFile(styleRulesPath, 'utf-8'),
      fs.readFile(envelopePath, 'utf-8'),
    ]);

    cachedSystemPrompt = `${mainPrompt}\n\n=== MAYA STYLE RULES ===\n${styleRules}\n\n=== OUTPUT ENVELOPE FORMAT ===\n${envelope}`;
    return cachedSystemPrompt;
  } catch (err) {
    console.error('Failed to load system prompts from disk:', err);
    return 'You are Maya, celebration planner for Made in Heaven. Always respond in valid JSON matching the Maya response envelope.';
  }
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
  isPlanGeneration?: boolean;
}

export function offersThreeCommunicationStyles(quickReplies: string[] | undefined | null): boolean {
  if (!quickReplies || !Array.isArray(quickReplies)) return false;
  const lower = quickReplies.map((r) => String(r).toLowerCase().trim());
  const hasGentle = lower.some((r) => r.includes('gentle'));
  const hasBalanced = lower.some((r) => r.includes('balanced'));
  const hasStraight = lower.some((r) => r.includes('straight') || r.includes('point') || r.includes('direct'));
  return hasGentle && hasBalanced && hasStraight;
}

function countWords(text: string): number {
  if (!text || typeof text !== 'string') return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function logReplyWordCount(reply: string) {
  if (process.env.NODE_ENV !== 'production') {
    const count = countWords(reply);
    console.log(`[Maya] Reply word count: ${count}`);
  }
}

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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cleanJsonString(str: string): string {
  const trimmed = str.trim();
  if (trimmed.startsWith('```')) {
    return trimmed.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```$/, '').trim();
  }
  return trimmed;
}

/**
 * Server-only helper executing a Maya chat turn with resilient retries,
 * fallback model support, and low thinking budget for low-latency responses.
 */
export async function callMaya(options: CallMayaOptions): Promise<MayaResponseEnvelope> {
  const startTime = Date.now();

  // 1. Mock Mode
  if (process.env.MAYA_MOCK === 'true') {
    const mockEnvelope = handleMockResponse(options);
    logReplyWordCount(mockEnvelope.reply);
    return mockEnvelope;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  // GEMINI_CHAT_MODEL for normal chat turns, GEMINI_MODEL for plan generation & synthesis
  const configuredChatModel = process.env.GEMINI_CHAT_MODEL || process.env.GEMINI_FALLBACK_MODEL || 'gemini-3.5-flash-lite';
  const configuredComplexModel = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

  const isComplexTask = Boolean(options.isPlanGeneration || options.groupSynthesis);
  const primaryModel = isComplexTask ? configuredComplexModel : configuredChatModel;
  const fallbackModel = isComplexTask ? configuredChatModel : configuredComplexModel;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not defined in environment variables. Please check your .env configuration.');
  }

  const systemInstruction = await loadSystemPrompt(Boolean(options.groupSynthesis));
  const ai = new GoogleGenAI({ apiKey });

  const { profile, budget } = sanitizeContextForSpeaker(options);
  const today = options.today || new Date().toISOString().split('T')[0];
  const monthsUntilWedding = options.monthsUntilWedding !== undefined
    ? options.monthsUntilWedding
    : computeMonthsUntilWedding(profile?.date);
  const onboardingComplete = options.onboardingComplete !== undefined
    ? options.onboardingComplete
    : getOnboardingStatus(profile as any, (options.budget || budget) as any).isFullyComplete;

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

  // Configure thinking level: low/minimal for chat turns to guarantee fast responses <5s
  const thinkingConfig = options.isPlanGeneration
    ? { thinkingBudget: 512 }
    : { thinkingBudget: 0 }; // 0 disables extra thinking delays for chat turns

  const modelsToAttempt = [
    { name: primaryModel, maxRetries: 2 }, // Up to 2 retries (3 attempts total) on primary
    { name: fallbackModel, maxRetries: 0 }, // 1 attempt on fallback model
  ];

  let totalAttempts = 0;
  let lastError: any = null;

  for (const modelPlan of modelsToAttempt) {
    let retriesLeft = modelPlan.maxRetries;

    while (retriesLeft >= 0) {
      totalAttempts++;
      // Guard: Keep total turn execution strictly under ~19 seconds
      if (Date.now() - startTime > 19000) {
        console.warn(`[Maya] Turn exceeded total deadline (19s). Aborting attempts.`);
        break;
      }

      try {
        const response = await ai.models.generateContent({
          model: modelPlan.name,
          contents: userContent,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            thinkingConfig,
          },
        });

        const rawText = response.text || '';
        const parsedJson = JSON.parse(cleanJsonString(rawText));
        const validated = MayaResponseEnvelopeSchema.parse(parsedJson);

        // Check communication style requirements
        if (options.mustAskCommunicationStyle && !offersThreeCommunicationStyles(validated.quick_replies)) {
          validated.quick_replies = ['Gentle', 'Balanced', 'Straight to the point'];
        }

        console.log(`[Maya] Success: Model=${modelPlan.name}, Attempts=${totalAttempts}, Duration=${Date.now() - startTime}ms`);
        logReplyWordCount(validated.reply);
        return validated;
      } catch (err: any) {
        lastError = err;
        const httpStatus = extractHttpStatusCode(err);
        console.warn(`[Maya] Attempt ${totalAttempts} failed on ${modelPlan.name} with HTTP ${httpStatus || 'unknown'}: ${err?.message || err}`);

        // Immediate unrecoverable errors (400 bad request, 401 unauth, 403 forbidden)
        if (httpStatus && [400, 401, 403, 404].includes(httpStatus)) {
          console.error(`[Maya] Non-retryable HTTP error ${httpStatus} received. Stopping.`);
          break;
        }

        // Retry logic for 503 / 500 / network failure: short backoff with jitter
        if (httpStatus === 503 || httpStatus === 500 || !httpStatus) {
          if (retriesLeft > 0) {
            const baseDelay = retriesLeft === 2 ? 800 : 1600;
            const jitter = Math.floor(Math.random() * 300);
            await sleep(baseDelay + jitter);
          }
        } else if (httpStatus === 429) {
          // Rate limit: retry at most once with 1.2s delay
          if (retriesLeft > 0) {
            retriesLeft = 0; // only 1 retry on 429
            await sleep(1200);
          } else {
            break;
          }
        }

        retriesLeft--;
      }
    }
  }

  // Friendly graceful fallback if all retries and fallback models failed
  console.error(`[Maya] All attempts exhausted. Final error:`, lastError?.message || lastError);
  return {
    reply: "I am having trouble connecting with the planning service right now. Please take a quick breath and message me again in just a moment.",
    spoken_reply: options.mode === 'voice' ? "Trouble connecting right now. Please try again in a moment." : null,
    quick_replies: ["Let's try again", "Show my plan"],
    profile_updates: [],
    needs_confirmation: [],
    structured: { type: 'none', data: null },
  };
}
