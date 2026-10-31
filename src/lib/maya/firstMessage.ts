import { EventProfile, PrivateBudget, Member } from '@/types/firestore';
import { MayaResponseEnvelope } from './schemas';

export function generateFirstMessage(
  homeName: string,
  profile: EventProfile,
  budget: PrivateBudget | null,
  speaker: Member
): MayaResponseEnvelope {
  const eventType = profile.eventType || 'wedding';
  const ownerName = speaker.name || 'there';
  const city = profile.city;
  const date = profile.date;

  // Track what we already have
  const hasDate = Boolean(date);
  const hasCity = Boolean(city);
  const hasGuestCount = Boolean(
    profile.guest_count?.planning_value || profile.guest_count?.estimate
  );
  const hasBudget = Boolean(budget?.planning_value || budget?.total);
  const hasCultureOrTradition = Boolean(profile.culture && profile.culture.length > 0);

  // Acknowledge saved details naturally
  let acknowledgedContext = '';
  if (hasCity && hasDate) {
    acknowledgedContext = ` I see we have ${city} in mind for ${date}.`;
  } else if (hasCity) {
    acknowledgedContext = ` I see we are planning this in ${city}.`;
  } else if (hasDate) {
    acknowledgedContext = ` I see we are looking at ${date}.`;
  }

  // Determine the one next missing question per event type
  if (eventType === 'birthday') {
    if (!hasDate) {
      return {
        reply: `Hi ${ownerName}! I'm Maya, your celebration planner. Celebrating ${homeName} is going to be so special.${acknowledgedContext}\n\nTo start shaping things, what date or weekend are you thinking of for the party?`,
        spoken_reply: `Hi ${ownerName}! What date or weekend are you thinking for ${homeName}?`,
        quick_replies: ['Next month', 'In 2 to 3 months', 'This weekend', 'Still deciding dates'],
        profile_updates: [],
        needs_confirmation: [],
        structured: { type: 'none', data: null },
      };
    }

    if (!hasGuestCount) {
      return {
        reply: `Hi ${ownerName}! I'm Maya, your celebration planner. Celebrating ${homeName} is going to be so much fun.${acknowledgedContext}\n\nRoughly how many guests are we expecting, and what's the mix like — mostly adults, kids, or family elders? Asking because that shapes the venue and food choices right away.`,
        spoken_reply: `Roughly how many guests are you expecting, and what's the mix?`,
        quick_replies: ['Around 30 to 50 close friends', 'About 75 to 100 family & friends', 'Under 25 intimate group', 'Not sure yet'],
        profile_updates: [],
        needs_confirmation: [],
        structured: { type: 'none', data: null },
      };
    }

    if (!hasBudget) {
      return {
        reply: `Hi ${ownerName}! I'm Maya. Everything is coming along nicely for ${homeName}.${acknowledgedContext}\n\nDo you have an overall budget or spending range in mind? Having a rough number helps us pick the right venue and entertainment without any surprises.`,
        spoken_reply: `Do you have an overall budget range in mind for the party?`,
        quick_replies: ['Under ₹1 lakh', 'Around ₹2 to 3 lakh', '₹5 lakh or more', 'Want your recommendation'],
        profile_updates: [],
        needs_confirmation: [],
        structured: { type: 'none', data: null },
      };
    }

    return {
      reply: `Hi ${ownerName}! I'm Maya. We have the essentials saved for ${homeName}.${acknowledgedContext}\n\nWhat kind of theme or vibe are you picturing — casual sundowner, elegant dinner, or high-energy party?`,
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
        reply: `Hello ${ownerName}! I'm Maya, your celebration planner. Bringing everyone together for ${homeName} is such a wonderful initiative.${acknowledgedContext}\n\nWhich dates or festive dates are you targeting?`,
        spoken_reply: `Hello ${ownerName}! Which dates are you targeting for ${homeName}?`,
        quick_replies: ['Upcoming festival weekend', 'Next month', 'In 3 to 6 months', 'Date still tentative'],
        profile_updates: [],
        needs_confirmation: [],
        structured: { type: 'none', data: null },
      };
    }

    if (!hasGuestCount) {
      return {
        reply: `Hello ${ownerName}! I'm Maya. Bringing people together for ${homeName} is going to be memorable.${acknowledgedContext}\n\nWhat kind of footfall or crowd size are you anticipating throughout the event? Asking so we can plan venue capacity and crowd flow early.`,
        spoken_reply: `What kind of footfall or crowd size are you expecting?`,
        quick_replies: ['About 200 to 500 people', '500 to 1,000 attendees', 'Over 1,000 gathering', 'Just our neighborhood society'],
        profile_updates: [],
        needs_confirmation: [],
        structured: { type: 'none', data: null },
      };
    }

    if (!hasBudget) {
      return {
        reply: `Hello ${ownerName}! I'm Maya. We have the foundation noted for ${homeName}.${acknowledgedContext}\n\nWhat is the estimated budget or contribution pool we are working with? It'll help balance sound, stage, prasad/food, and permits comfortably.`,
        spoken_reply: `What is the estimated budget or contribution pool?`,
        quick_replies: ['Community fund pool', 'Around ₹3 to 5 lakh', '₹10 lakh+ festival budget', 'Supported by sponsors'],
        profile_updates: [],
        needs_confirmation: [],
        structured: { type: 'none', data: null },
      };
    }

    return {
      reply: `Hello ${ownerName}! I'm Maya. Great to collaborate on ${homeName}.${acknowledgedContext}\n\nWhat are the main cultural programs or highlights planned — live performances, food stalls, or prayer rituals?`,
      spoken_reply: `What are the main cultural programs or highlights planned?`,
      quick_replies: ['Cultural performances & food', 'Pooja & community banquet', 'Music & dance evening', 'Exhibition & stalls'],
      profile_updates: [],
      needs_confirmation: [],
      structured: { type: 'none', data: null },
    };
  }

  // Default: Wedding
  if (!hasDate) {
    return {
      reply: `Namaste ${ownerName}! I'm Maya, your celebration planner. Congratulations on ${homeName} — I'm so excited to help bring this celebration to life.${acknowledgedContext}\n\nWhen are you thinking of having the celebration, or what month or season feels right to you?`,
      spoken_reply: `Namaste ${ownerName}! When are you thinking of having the celebration?`,
      quick_replies: ['Winter 2026 (Nov - Dec)', 'Early 2027 (Jan - Feb)', 'Summer 2027', 'Date still being finalized'],
      profile_updates: [],
      needs_confirmation: [],
      structured: { type: 'none', data: null },
    };
  }

  if (!hasCity) {
    return {
      reply: `Namaste ${ownerName}! I'm Maya. It's wonderful to begin planning ${homeName}.${acknowledgedContext}\n\nWhich city or destination are you picturing for the celebration? Asking because local venue availability sets the timeline.`,
      spoken_reply: `Which city or destination are you picturing?`,
      quick_replies: ['Our hometown', 'Mumbai', 'Delhi NCR', 'Destination celebration'],
      profile_updates: [],
      needs_confirmation: [],
      structured: { type: 'none', data: null },
    };
  }

  if (!hasGuestCount) {
    return {
      reply: `Namaste ${ownerName}! I'm Maya. Delighted to be planning ${homeName} with you.${acknowledgedContext}\n\nRoughly how many guests are you expecting across your main functions? Asking because guest count drives most of your venue and catering decisions.`,
      spoken_reply: `Roughly how many guests are you expecting across your functions?`,
      quick_replies: ['About 150 to 250 guests', 'Around 300 to 500 guests', '500+ grand celebration', 'Not sure yet'],
      profile_updates: [],
      needs_confirmation: [],
      structured: { type: 'none', data: null },
    };
  }

  if (!hasBudget) {
    return {
      reply: `Namaste ${ownerName}! I'm Maya. The picture for ${homeName} is starting to take shape.${acknowledgedContext}\n\nDo you and the family have a total budget range in mind? Knowing this helps me protect what matters to you without overspending.`,
      spoken_reply: `Do you have a total budget range in mind?`,
      quick_replies: ['Around ₹40 to 60 lakh', '₹60 to 80 lakh', '₹1 crore or more', 'Want to estimate together'],
      profile_updates: [],
      needs_confirmation: [],
      structured: { type: 'none', data: null },
    };
  }

  if (!hasCultureOrTradition) {
    return {
      reply: `Namaste ${ownerName}! We have the core dates and numbers in place for ${homeName}.${acknowledgedContext}\n\nWhich regional traditions or customs would you like woven in (for example Gujarati, Punjabi, South Indian, or a fusion)?`,
      spoken_reply: `Which regional traditions or customs would you like woven in?`,
      quick_replies: ['Fusion of both backgrounds', 'Traditional family customs', 'Modern contemporary style', 'A few core rituals only'],
      profile_updates: [],
      needs_confirmation: [],
      structured: { type: 'none', data: null },
    };
  }

  return {
    reply: `Namaste ${ownerName}! We have a solid foundation recorded for ${homeName}.${acknowledgedContext}\n\nWhat kind of overall vibe do you want guests to feel — royal and traditional, warm and intimate, or vibrant and high-energy?`,
    spoken_reply: `What kind of overall vibe do you want guests to feel?`,
    quick_replies: ['Warm and intimate', 'Royal and grand', 'Vibrant and festive', 'Minimal and elegant'],
    profile_updates: [],
    needs_confirmation: [],
    structured: { type: 'none', data: null },
  };
}
