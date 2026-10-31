import { EventType } from '@/types/firestore';

export interface CelebrationTerms {
  ownerLabel: string;
  celebrationTypeLabel: string;
  companionLabel: string;
  dateLabel: string;
  guestLabel: string;
  themeOrCultureLabel: string;
}

export const CELEBRATION_TERMS: Record<EventType, CelebrationTerms> = {
  wedding: {
    ownerLabel: 'Couple',
    celebrationTypeLabel: 'Wedding',
    companionLabel: 'Partner',
    dateLabel: 'Wedding Date',
    guestLabel: 'Guest Count',
    themeOrCultureLabel: 'Tradition & Culture',
  },
  birthday: {
    ownerLabel: 'Host',
    celebrationTypeLabel: 'Birthday',
    companionLabel: 'Celebrant',
    dateLabel: 'Party Date',
    guestLabel: 'Guest Count & Mix',
    themeOrCultureLabel: 'Theme & Style',
  },
  community: {
    ownerLabel: 'Organiser',
    celebrationTypeLabel: 'Community Gathering',
    companionLabel: 'Co-organiser',
    dateLabel: 'Event Date',
    guestLabel: 'Expected Footfall',
    themeOrCultureLabel: 'Purpose & Occasion',
  },
};

export function getCelebrationTerms(eventType?: EventType): CelebrationTerms {
  if (eventType && CELEBRATION_TERMS[eventType]) {
    return CELEBRATION_TERMS[eventType];
  }
  return {
    ownerLabel: 'Host',
    celebrationTypeLabel: 'Celebration',
    companionLabel: 'Partner / Co-host',
    dateLabel: 'Event Date',
    guestLabel: 'Guest Count',
    themeOrCultureLabel: 'Vibe & Theme',
  };
}

export const COPY = {
  brand: {
    name: 'Made in Heaven',
    tagline: 'Your celebration planner',
    shortTagline: 'Celebration Planner',
  },
  nav: {
    home: 'Home',
    chat: 'Maya',
    plan: 'Plan',
    family: 'Family & Group',
    settings: 'Settings',
  },
  header: {
    myCelebrations: 'My celebrations',
    planNew: '+ Plan a new celebration',
    noActive: 'No active celebration',
    signedInAs: 'Signed in as',
    signOut: 'Sign out',
  },
  homePage: {
    title: 'Celebration Overview',
    subtitle: 'Everything happening across your celebration in one place.',
    countdownLabel: 'Days to celebration',
    countdownPassed: 'Celebration day!',
    countdownNotSet: 'Date not set',
    quickStartMaya: 'Ask Maya to start your plan',
    recentActivityTitle: 'Recent ideas & updates',
    emptyActivity: 'No ideas shared yet. Add ideas in your discussion rooms or brainstorm with Maya.',
    openDecisionsTitle: 'Open group decisions',
    emptyDecisions: 'No active votes. Maya will help synthesize group ideas into clear options when you are ready.',
    planProgressTitle: 'Plan status',
    emptyPlan: 'Your celebration plan is waiting to be crafted. Chat with Maya to map your budget, timeline, and checklist.',
    budgetCardTitle: 'Budget overview',
    budgetNotSet: 'Budget not set yet',
    budgetHidden: 'Budget private to hosts',
  },
  maya: {
    title: 'Chat with Maya',
    subtitle: 'Your celebration planner — calm, thoughtful, and here whenever you need.',
    typingIndicator: 'Maya is typing…',
    placeholder: 'Ask Maya anything, or explore ideas together…',
    sendButton: 'Send message',
    voiceModeTooltip: 'Switch to voice conversation',
    quickRepliesHeading: 'Quick replies',
  },
  profilePanel: {
    title: 'What Maya knows so far',
    subtitle: 'Key details gathered to keep your plan grounded and realistic.',
    progressLabel: 'fields gathered',
    date: 'Date',
    city: 'City',
    guestCount: 'Guests',
    budget: 'Budget',
    vibe: 'Vibe & Theme',
    culture: 'Tradition / Background',
    notSet: 'Not set yet',
    askMayaToUpdate: 'Ask Maya to update this',
  },
  plan: {
    title: 'Your Plan',
    subtitle: 'Cohesive budget, timeline, checklist, and aesthetic details curated with Maya.',
    summaryStrip: {
      date: 'Date',
      city: 'City',
      guests: 'Guests',
      budget: 'Budget',
      notSet: 'Not set yet',
    },
    tabs: {
      overview: 'Overview',
      budget: 'Budget',
      timeline: 'Timeline',
      checklist: 'Checklist',
      palette: 'Colour Palette',
      decor: 'Decor & Mood',
      attire: 'Attire & Looks',
    },
    emptyState: {
      title: 'Plan not generated yet',
      description: 'Chat with Maya to create a personalized plan based on your date, venue, and guest preferences.',
      cta: 'Talk to Maya',
    },
  },
  family: {
    title: 'Family & Group Discussions',
    subtitle: 'Gather thoughts, explore options together, and vote smoothly without endless group chat clutter.',
    roomsTitle: 'Discussion Rooms',
    decisionsTitle: 'Group Decisions & Votes',
    inviteButton: 'Invite family & friends',
  },
  settings: {
    title: 'Settings & Preferences',
    subtitle: 'Manage your profile, celebration preferences, and notification style.',
    mayaStyleTitle: 'Maya Communication Style',
    mayaStyleDescription: 'Choose how direct or gentle you want Maya to be when sharing suggestions and budget checks.',
  },
} as const;

