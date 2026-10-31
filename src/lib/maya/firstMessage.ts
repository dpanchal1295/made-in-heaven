import { EventProfile, PrivateBudget, Member } from '@/types/firestore';
import { MayaResponseEnvelope } from './schemas';
import { GoogleGenAI } from '@google/genai';

function formatDisplayDate(val: string | undefined): string {
  if (!val) return '';
  const m = val.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) {
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    }
  }
  return val;
}

/**
 * Fallback template message if live Gemini fails or in mock mode.
 */
export function generateFirstMessageTemplate(
  homeName: string,
  profile: EventProfile,
  budget: PrivateBudget | null,
  speaker: Member
): MayaResponseEnvelope {
  const eventType = profile.eventType || 'wedding';
  const rawName = speaker?.name?.trim();
  const isGuestWord = !rawName || rawName.toLowerCase() === 'guest' || rawName.toLowerCase() === 'guest planner';
  const greeting = isGuestWord ? 'Hello!' : `Hello ${rawName}!`;

  const city = profile.city;
  const formattedDate = formatDisplayDate(profile.date);

  let acknowledgedContext = '';
  if (city && formattedDate) {
    acknowledgedContext = ` I see we have ${city} in mind for ${formattedDate}.`;
  } else if (city) {
    acknowledgedContext = ` I see we are planning this in ${city}.`;
  } else if (formattedDate) {
    acknowledgedContext = ` I see we are looking at ${formattedDate}.`;
  }

  const hasDate = Boolean(profile.date);
  const hasGuestCount = Boolean(profile.guest_count?.planning_value || profile.guest_count?.estimate);
  const hasBudget = Boolean(budget?.planning_value || budget?.total);

  if (eventType === 'birthday') {
    if (!hasDate) {
      return {
        reply: `${greeting} I'm Maya, your celebration planner. Planning ${homeName} is going to be so special.${acknowledgedContext}\n\nTo start shaping things, what date or weekend are you thinking of for the party?`,
        spoken_reply: `${greeting} What date or weekend are you thinking for the party?`,
        quick_replies: ['Next month', 'In 2 to 3 months', 'This weekend', 'Still deciding dates'],
        profile_updates: [],
        needs_confirmation: [],
        structured: { type: 'none', data: null },
      };
    }
    if (!hasGuestCount) {
      return {
        reply: `${greeting} I'm Maya, your celebration planner. Planning ${homeName} is going to be so much fun.${acknowledgedContext}\n\nRoughly how many guests are we expecting, and what's the mix like — mostly adults, kids, or family elders? Asking because that shapes the venue and food choices right away.`,
        spoken_reply: `Roughly how many guests are you expecting, and what's the mix?`,
        quick_replies: ['Around 30 to 50 close friends', 'About 75 to 100 family & friends', 'Under 25 intimate group', 'Not sure yet'],
        profile_updates: [],
        needs_confirmation: [],
        structured: { type: 'none', data: null },
      };
    }
    if (!hasBudget) {
      return {
        reply: `${greeting} I'm Maya. Everything is coming along nicely for ${homeName}.${acknowledgedContext}\n\nDo you have an overall budget or spending range in mind? Having a rough number helps us pick the right venue and entertainment without any surprises.`,
        spoken_reply: `Do you have an overall budget range in mind for the party?`,
        quick_replies: ['Under ₹1 lakh', 'Around ₹2 to 3 lakh', '₹5 lakh or more', 'Want your recommendation'],
        profile_updates: [],
        needs_confirmation: [],
        structured: { type: 'none', data: null },
      };
    }
    return {
      reply: `${greeting} I'm Maya. We have the essentials saved for ${homeName}.${acknowledgedContext}\n\nWhat kind of theme or vibe are you picturing — casual sundowner, elegant dinner, or high-energy party?`,
      spoken_reply: `What kind of theme or vibe are you picturing?`,
      quick_replies: ['Cozy dinner party', 'High-energy celebration', 'Outdoor sundowner', 'Traditional family gathering'],
      profile_updates: [],
      needs_confirmation: [],
      structured: { type: 'none', data: null },
    };
  }

  if (eventType === 'community') {
    if (!hasDate) {
      return {
        reply: `${greeting} I'm Maya, your celebration planner. Bringing everyone together for ${homeName} is such a wonderful initiative.${acknowledgedContext}\n\nWhich dates or festival weekend are you targeting?`,
        spoken_reply: `${greeting} Which dates are you targeting?`,
        quick_replies: ['Upcoming festival weekend', 'Next month', 'In 3 to 6 months', 'Date still tentative'],
        profile_updates: [],
        needs_confirmation: [],
        structured: { type: 'none', data: null },
      };
    }
    if (!hasGuestCount) {
      return {
        reply: `${greeting} I'm Maya. Bringing people together for ${homeName} is going to be memorable.${acknowledgedContext}\n\nWhat kind of footfall or crowd size are you anticipating throughout the event? Asking so we can plan venue capacity and crowd flow early.`,
        spoken_reply: `What kind of footfall or crowd size are you expecting?`,
        quick_replies: ['About 200 to 500 people', '500 to 1,000 attendees', 'Over 1,000 gathering', 'Just our neighborhood society'],
        profile_updates: [],
        needs_confirmation: [],
        structured: { type: 'none', data: null },
      };
    }
    return {
      reply: `${greeting} I'm Maya. Great to collaborate on ${homeName}.${acknowledgedContext}\n\nWhat are the main cultural programs or highlights planned — live performances, food stalls, or prayer rituals?`,
      spoken_reply: `What are the main cultural programs or highlights planned?`,
      quick_replies: ['Cultural performances & food', 'Pooja & community banquet', 'Music & dance evening', 'Exhibition & stalls'],
      profile_updates: [],
      needs_confirmation: [],
      structured: { type: 'none', data: null },
    };
  }

  // Wedding default
  if (!hasDate) {
    return {
      reply: `${greeting} I'm Maya, your celebration planner. Congratulations on ${homeName} — I'm so excited to help bring this celebration to life.${acknowledgedContext}\n\nWhen are you thinking of having the celebration, or what month or season feels right to you?`,
      spoken_reply: `${greeting} When are you thinking of having the celebration?`,
      quick_replies: ['Winter 2026 (Nov - Dec)', 'Early 2027 (Jan - Feb)', 'Summer 2027', 'Date still being finalized'],
      profile_updates: [],
      needs_confirmation: [],
      structured: { type: 'none', data: null },
    };
  }
  if (!city) {
    return {
      reply: `${greeting} I'm Maya. It's wonderful to begin planning ${homeName}.${acknowledgedContext}\n\nWhich city or destination are you picturing for the celebration? Asking because local venue availability sets the timeline.`,
      spoken_reply: `Which city or destination are you picturing?`,
      quick_replies: ['Our hometown', 'Mumbai', 'Delhi NCR', 'Destination celebration'],
      profile_updates: [],
      needs_confirmation: [],
      structured: { type: 'none', data: null },
    };
  }
  if (!hasGuestCount) {
    return {
      reply: `${greeting} I'm Maya. Delighted to be planning ${homeName} with you.${acknowledgedContext}\n\nRoughly how many guests are you expecting across your main functions? Asking because guest count drives most of your venue and catering decisions.`,
      spoken_reply: `Roughly how many guests are you expecting across your functions?`,
      quick_replies: ['About 150 to 250 guests', 'Around 300 to 500 guests', '500+ grand celebration', 'Not sure yet'],
      profile_updates: [],
      needs_confirmation: [],
      structured: { type: 'none', data: null },
    };
  }
  return {
    reply: `${greeting} I'm Maya. We have a solid foundation recorded for ${homeName}.${acknowledgedContext}\n\nWhat kind of overall vibe do you want guests to feel — royal and traditional, warm and intimate, or vibrant and festive?`,
    spoken_reply: `What kind of overall vibe do you want guests to feel?`,
    quick_replies: ['Warm and intimate', 'Royal and grand', 'Vibrant and festive', 'Minimal and elegant'],
    profile_updates: [],
    needs_confirmation: [],
    structured: { type: 'none', data: null },
  };
}

/**
 * Generates Maya's first message dynamically via Gemini with voice rules,
 * falling back gracefully to the template.
 */
export async function generateFirstMessageLive(
  homeName: string,
  profile: EventProfile,
  budget: PrivateBudget | null,
  speaker: Member
): Promise<MayaResponseEnvelope> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || process.env.MAYA_MOCK === 'true') {
    return generateFirstMessageTemplate(homeName, profile, budget, speaker);
  }

  const modelName = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
  const rawName = speaker?.name?.trim();
  const isGuestWord = !rawName || rawName.toLowerCase() === 'guest' || rawName.toLowerCase() === 'guest planner';
  const personName = isGuestWord ? null : rawName;
  const eventType = profile.eventType || 'wedding';
  const formattedDate = formatDisplayDate(profile.date);

  const prompt = `You are Maya, a warm, experienced celebration planner for Made in Heaven.
Generate the very first opening greeting for a user who just created a celebration Home.

VOICE RULES:
- Sound like a warm, experienced friend texting naturally.
- 2 to 4 crisp sentences total. Plain words, contractions, no robotic phrases.
- ${personName ? `Address the user by their name: "${personName}".` : 'Do NOT call them "Guest" or "Guest Planner". Greet them warmly without a name.'}
- React warmly to the occasion: ${homeName} (Celebration type: ${eventType}${profile.eventSubtype ? `, Subtype/Milestone: ${profile.eventSubtype}` : ''}).
- Mention any details already saved so they feel heard (e.g. City: ${profile.city || 'not set'}, Date: ${formattedDate || 'not set'}). If date is set, format it like "18 December 2026".
- Ask ONE next missing question for this event type:
  - wedding: if missing, ask guest count (explain briefly why: "drives most of the venue and catering costs")
  - birthday: if missing, ask guest count & mix (adults, kids, elders) or theme
  - community: if missing, ask expected footfall
- Never ask again for anything already saved.
- Provide 3 to 4 quick_replies that read like natural things a person would say.

Return ONLY a JSON envelope in this exact shape:
{
  "reply": string,
  "spoken_reply": string or null,
  "quick_replies": string[],
  "profile_updates": [],
  "needs_confirmation": [],
  "structured": { "type": "none", "data": null }
}`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    const raw = response.text || '';
    const parsed = JSON.parse(raw);
    if (parsed.reply && Array.isArray(parsed.quick_replies)) {
      return {
        reply: parsed.reply,
        spoken_reply: parsed.spoken_reply || null,
        quick_replies: parsed.quick_replies,
        profile_updates: [],
        needs_confirmation: [],
        structured: { type: 'none', data: null },
      };
    }
  } catch (err) {
    console.warn('[Maya] First message Gemini generation failed, falling back to template:', err);
  }

  return generateFirstMessageTemplate(homeName, profile, budget, speaker);
}

export const generateFirstMessage = generateFirstMessageTemplate;
