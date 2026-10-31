/**
 * Realistic Mock Fixtures for Made in Heaven (Workstream 2)
 * Demo Couple: Pune, 300 guests, ₹8 Lakh – ₹15 Lakh, four functions, fusion style, December.
 * All data strictly conforms to Zod schemas in schemas.ts.
 */

import {
  MayaResponseEnvelope,
  BudgetItem,
  TimelineItem,
  ChecklistItem,
  PaletteDataSchema,
  DecorItem,
  AttireItem,
} from './schemas';

export interface CateringFunctionPlateEstimate {
  function_name: string;
  per_plate_low_inr: number;
  per_plate_high_inr: number;
  guests: number;
  total_low_inr: number;
  total_high_inr: number;
  style_description: string;
}

/**
 * Extracts HTTP status code from an API error if present.
 */
export function extractHttpStatusCode(error: unknown): number | null {
  if (!error) return null;
  const anyErr = error as any;
  if (typeof anyErr.status === 'number') return anyErr.status;
  if (typeof anyErr.statusCode === 'number') return anyErr.statusCode;
  if (anyErr.response && typeof anyErr.response.status === 'number') return anyErr.response.status;
  if (typeof anyErr.message === 'string') {
    const match = anyErr.message.match(/\b(429|503|401|403|404)\b/);
    if (match) return parseInt(match[1], 10);
    if (anyErr.message.includes('RESOURCE_EXHAUSTED')) return 429;
    if (anyErr.message.includes('UNAVAILABLE')) return 503;
    if (anyErr.message.includes('UNAUTHENTICATED')) return 401;
    if (anyErr.message.includes('PERMISSION_DENIED')) return 403;
    if (anyErr.message.includes('NOT_FOUND')) return 404;
  }
  return null;
}

export const DEMO_COUPLE_PROFILE = {
  city: 'Pune',
  date: '2026-12-18',
  guest_count: {
    estimate: 300,
    range: { low: 280, high: 320 },
    planning_value: 300,
    per_function: {
      Mehendi: 150,
      Sangeet: 250,
      Wedding: 300,
      Reception: 300,
    },
  },
  culture: ['Maharashtrian', 'North Indian Fusion'],
  vibe: 'Heritage Elegance & Joyful Fusion',
  functions: ['Mehendi', 'Sangeet', 'Wedding (Pheras)', 'Reception'],
  locked_constraints: ['300 guests for Wedding & Reception', 'Pune location', 'Traditional Pheras rituals'],
};

export const DEMO_PRIVATE_BUDGET = {
  total: 1150000,
  range: { low: 800000, high: 1500000 },
  planning_value: 1150000,
  updatedAt: Date.now(),
};

/**
 * 1. Budget Fixture:
 * Total range: ₹8,00,000 (low) to ₹15,00,000 (high)
 * Category estimates sum precisely to ₹8,00,000 (low) and ₹15,00,000 (high)
 * Percentages sum strictly to 100%
 */
export const MOCK_BUDGET_DATA: BudgetItem[] = [
  {
    category: 'Catering & Food Service',
    function: 'All Functions',
    percent: 35,
    estimated_low_inr: 280000,
    estimated_high_inr: 525000,
    notes: 'Covers buffet spreads across four events for 300 guests; see per-function plate breakdown',
  },
  {
    category: 'Venue & Banquets',
    function: 'Wedding & Reception',
    percent: 25,
    estimated_low_inr: 200000,
    estimated_high_inr: 375000,
    notes: 'Pune heritage lawn and AC banquet hall combo for evening functions',
  },
  {
    category: 'Decor & Florals',
    function: 'All Functions',
    percent: 15,
    estimated_low_inr: 120000,
    estimated_high_inr: 225000,
    notes: 'Local Pune marigold styling, mandap setup, fairy light canopies, and table centerpieces',
  },
  {
    category: 'Photography & Video',
    function: 'All Functions',
    percent: 10,
    estimated_low_inr: 80000,
    estimated_high_inr: 150000,
    notes: '2 candid photographers, 1 traditional videographer, 1 teaser highlight video, and drone',
  },
  {
    category: 'Attire & Styling',
    function: 'Couple & Parents',
    percent: 8,
    estimated_low_inr: 64000,
    estimated_high_inr: 120000,
    notes: 'Bridal Paithani/lehenga, groom bandhgala, makeup artist for 2 days, and family styling',
  },
  {
    category: 'Music & Sound',
    function: 'Sangeet & Baraat',
    percent: 4,
    estimated_low_inr: 32000,
    estimated_high_inr: 60000,
    notes: 'Pune Dhol Tasha troupe for Baraat, sound console & DJ setup for Sangeet',
  },
  {
    category: 'Logistics & Contingency',
    function: 'General',
    percent: 3,
    estimated_low_inr: 24000,
    estimated_high_inr: 45000,
    notes: 'Event permissions, transportation for elders, safas, and unforeseen buffer expenses',
  },
];

/**
 * Per-function plate ranges for 300 guests in Pune:
 * Mehendi: ₹500 – ₹800/plate (lighter snack & chaat counters)
 * Sangeet: ₹800 – ₹1,200/plate (appetizers, live counters, mocktails)
 * Wedding: ₹1,200 – ₹1,800/plate (traditional Maharashtrian feast)
 * Reception: ₹1,500 – ₹2,200/plate (multi-cuisine celebratory banquet)
 */
export const MOCK_CATERING_BREAKDOWN: CateringFunctionPlateEstimate[] = [
  {
    function_name: 'Mehendi',
    per_plate_low_inr: 500,
    per_plate_high_inr: 800,
    guests: 150,
    total_low_inr: 75000,
    total_high_inr: 120000,
    style_description: 'Street chaat counters, artisanal chai, and light afternoon finger food',
  },
  {
    function_name: 'Sangeet',
    per_plate_low_inr: 800,
    per_plate_high_inr: 1200,
    guests: 250,
    total_low_inr: 200000,
    total_high_inr: 300000,
    style_description: 'Live pasta & sizzler counters, kebabs, mocktails, and decadent dessert bar',
  },
  {
    function_name: 'Wedding (Pheras)',
    per_plate_low_inr: 1200,
    per_plate_high_inr: 1800,
    guests: 300,
    total_low_inr: 360000,
    total_high_inr: 540000,
    style_description: 'Traditional satvik feast with Ukdiche Modak, Puran Poli, and authentic regional delicacies',
  },
  {
    function_name: 'Reception',
    per_plate_low_inr: 1500,
    per_plate_high_inr: 2200,
    guests: 300,
    total_low_inr: 450000,
    total_high_inr: 660000,
    style_description: 'Grand multi-cuisine buffet featuring North Indian, Continental, and live dessert counters',
  },
];

/**
 * 2. Dynamic Timeline Generator:
 * Starts from today's date and fits the weeks actually left until the wedding date (Dec 18, 2026).
 * If fewer than 12 weeks remain, compresses tasks and marks urgent/overdue milestones.
 */
export function generateTimelineFixture(
  todayStr: string = new Date().toISOString().split('T')[0],
  weddingDateStr: string = '2026-12-18'
): TimelineItem[] {
  const today = new Date(todayStr);
  const wedding = new Date(weddingDateStr);
  const diffMs = wedding.getTime() - today.getTime();
  const diffDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const weeksLeft = Math.ceil(diffDays / 7);

  // Milestone tasks template
  const milestones = [
    {
      category: 'Venue & Legal',
      task: 'Finalize Pune lawn & banquet agreement with deposit',
      why_it_matters: 'Prime Pune wedding dates sell out 6-9 months ahead; locks your base budget',
      idealWeek: 12,
    },
    {
      category: 'Attire',
      task: 'Select bridal Paithani/lehenga & groom sherwani fabrics for tailoring',
      why_it_matters: 'Bespoke wedding embroidery and custom fits require 6-8 weeks minimum',
      idealWeek: 11,
    },
    {
      category: 'Catering',
      task: 'Book Pune regional catering team & schedule tasting session',
      why_it_matters: 'Allows menu refinement and guarantees chef availability for 300 guests',
      idealWeek: 10,
    },
    {
      category: 'Photography',
      task: 'Confirm candid wedding photographer & videographer contracts',
      why_it_matters: 'Top visual storytellers only take one wedding per date',
      idealWeek: 9,
    },
    {
      category: 'Decor',
      task: 'Review 3D mandap sketch, entrance toran, and fairy light plan',
      why_it_matters: 'Prevents day-of surprises and locks in flower market pre-orders',
      idealWeek: 8,
    },
    {
      category: 'Invites & RSVPs',
      task: 'Send digital save-the-dates & coordinate hotel room blocks',
      why_it_matters: 'Ensures out-of-town guests secure affordable travel to Pune',
      idealWeek: 6,
    },
    {
      category: 'Entertainment',
      task: 'Lock Sangeet DJ tracklist & book Puneri Dhol Tasha troupe',
      why_it_matters: 'Sets the high-energy festive tone for the Baraat and dance floor',
      idealWeek: 4,
    },
    {
      category: 'Attire & Beauty',
      task: 'First outfit fittings & schedule bridal hair/makeup trial',
      why_it_matters: 'Gives tailors sufficient time for micro-adjustments and blouse alterations',
      idealWeek: 3,
    },
    {
      category: 'Logistics',
      task: 'Finalize function day master run-of-show & assign family coordinators',
      why_it_matters: 'Clarifies who welcomes VIPs, holds wedding rings, and directs guests',
      idealWeek: 2,
    },
    {
      category: 'Ceremony & Florals',
      task: 'Reconfirm fresh marigold arrivals & check sound system at venue',
      why_it_matters: 'Ensures crystal-clear audio during pheras and vibrant fresh florals',
      idealWeek: 1,
    },
    {
      category: 'Celebration',
      task: 'Wedding Week: Mehendi, Sangeet, Pheras & Grand Reception',
      why_it_matters: 'Time to let go of spreadsheets, cherish your loved ones, and celebrate!',
      idealWeek: 0,
    },
  ];

  if (weeksLeft >= 12) {
    return milestones.map((m) => ({
      when: m.idealWeek === 0 ? 'Wedding Week' : `${m.idealWeek} weeks before`,
      task: m.task,
      why_it_matters: m.why_it_matters,
      category: m.category,
    }));
  }

  // If fewer than 12 weeks remain, compress into available weeks
  return milestones.map((m) => {
    let whenLabel = '';
    let taskName = m.task;

    if (m.idealWeek > weeksLeft) {
      whenLabel = 'Immediate / Overdue';
      taskName = `[URGENT] ${m.task}`;
    } else if (m.idealWeek === 0) {
      whenLabel = 'Wedding Week';
    } else if (m.idealWeek === 1) {
      whenLabel = '1 week before';
    } else {
      const scheduledWeek = Math.max(1, Math.min(weeksLeft, Math.round((m.idealWeek / 12) * weeksLeft)));
      whenLabel = `${scheduledWeek} weeks before`;
      if (scheduledWeek <= 2) {
        taskName = `[Priority] ${m.task}`;
      }
    }

    return {
      when: whenLabel,
      task: taskName,
      why_it_matters: m.why_it_matters,
      category: m.category,
    };
  });
}

/**
 * 3. Vendor Checklist Fixture:
 * Vendor TYPES only (never real business names)
 * Includes book_by, tailored questions to ask, and estimate range in ₹
 */
export const MOCK_CHECKLIST_DATA: ChecklistItem[] = [
  {
    vendor_type: 'Heritage Garden & Banquet Venue',
    book_by: '8-10 weeks before',
    questions_to_ask: [
      'What are the municipal sound cutoff times for outdoor Sangeet music in Pune?',
      'Is there an in-house generator backup for the mandap and sound system?',
      'Are outside decor teams and caterers permitted without royalty charges?',
    ],
    estimated_range: '₹2,00,000 – ₹3,75,000',
  },
  {
    vendor_type: 'Puneri & Fusion Catering Service',
    book_by: '6-8 weeks before',
    questions_to_ask: [
      'Do you provide separate Jain and purely vegetarian live prep stations?',
      'What is the staff-to-guest ratio for a 300-guest buffet layout?',
      'Are mineral water bottles and cutlery included in the per-plate pricing?',
    ],
    estimated_range: '₹2,80,000 – ₹5,25,000',
  },
  {
    vendor_type: 'Candid Documentary Photographer',
    book_by: '6-8 weeks before',
    questions_to_ask: [
      'Do we receive uncompressed high-res raw images alongside edited color-graded albums?',
      'What is the expected delivery turnaround time for the 3-minute teaser film?',
      'Does your quote cover travel and stay for both Sangeet and Pheras days?',
    ],
    estimated_range: '₹80,000 – ₹1,50,000',
  },
  {
    vendor_type: 'Bridal Mehendi Artist & Team',
    book_by: '4-6 weeks before',
    questions_to_ask: [
      'Is the mehendi paste 100% natural and organic with no chemical darkeners?',
      'How many assistants are included to apply mehendi for 30-40 female guests?',
      'Do you customize figure drawings of the couple into the bridal design?',
    ],
    estimated_range: '₹15,000 – ₹30,000',
  },
  {
    vendor_type: 'Sound, DJ & Dhol Tasha Troupe',
    book_by: '4-6 weeks before',
    questions_to_ask: [
      'How many instruments in the Puneri Dhol Tasha pathak for the 45-minute Baraat?',
      'Does the DJ package include ambient LED par-cans and moving beam heads?',
      'Will you accommodate a tailored Marathi, Bollywood, and Punjabi crossover playlist?',
    ],
    estimated_range: '₹32,00,0 – ₹60,000',
  },
  {
    vendor_type: 'Mandap & Floral Production Decorator',
    book_by: '4-6 weeks before',
    questions_to_ask: [
      'Are fresh flowers sourced from Pune flower markets on the morning of each event?',
      'Can the floral mandap structure be repurposed for the evening reception stage?',
      'What happens in case of sudden evening weather changes or wind?',
    ],
    estimated_range: '₹1,20,000 – ₹2,25,000',
  },
];

/**
 * 4. Palette Fixture:
 * 4 curated colors with hex codes, where each is used, and mood
 */
export const MOCK_PALETTE_DATA = {
  colors: [
    {
      color_name: 'Marigold Saffron',
      hex: '#F59E0B',
      used_for: 'Mehendi drapes, floral torans, and guest welcoming marigold garlands',
      mood: 'Auspicious, joyful, and radiant daytime celebration',
    },
    {
      color_name: 'Royal Rani Pink',
      hex: '#BE185D',
      used_for: 'Bridal Paithani dupatta, Sangeet stage drapes, and banquet table runners',
      mood: 'Festive, spirited, and regal romance',
    },
    {
      color_name: 'Peshwai Warm Ivory',
      hex: '#FFFBEB',
      used_for: 'Mandap linen canopies, sherwani silk base, and dining table overlays',
      mood: 'Serene, sophisticated, and peaceful sanctuary',
    },
    {
      color_name: 'Antique Temple Gold',
      hex: '#D97706',
      used_for: 'Brass urlis, fairy light canopies, stage borders, and floral backdrops',
      mood: 'Timeless, heritage warmth, and celebratory grandeur',
    },
  ],
  why_it_fits:
    'Honors Pune cultural heritage by blending classic Peshwai ivory and marigold saffron with contemporary Rani pink and antique temple gold.',
};

/**
 * 5. Decor Fixture:
 * 5 distinct wedding areas with DIY/Rent/Buy badges and cost tiers
 */
export const MOCK_DECOR_DATA: DecorItem[] = [
  {
    area: 'Entrance Archway & Welcome Walkway',
    idea: 'Traditional entrance toran crafted with fresh Pune marigolds, green mango leaves, and suspended brass bells',
    diy_rent_or_buy: 'Rent',
    cost_tier: '₹₹',
    saving_tip: 'Source seasonal local marigolds from Pune Market Yard at wholesale dawn rates rather than imported flowers.',
  },
  {
    area: 'Mandap / Sacred Ceremony Stage',
    idea: 'Four-pillar open wooden carved mandap draped with Peshwai ivory georgette and cascading mogra / tuberose strings',
    diy_rent_or_buy: 'Rent',
    cost_tier: '₹₹₹',
    saving_tip: 'Repurpose the ceremony floral canopy backdrop directly for the evening reception photo stage.',
  },
  {
    area: 'Guest Dining & Banquet Tables',
    idea: 'Khadi cotton ivory table runners paired with hand-cast brass urlis holding floating tea lights and fresh marigold petals',
    diy_rent_or_buy: 'DIY',
    cost_tier: '₹',
    saving_tip: 'Rent urlis from a local Pune utensil bank and have family members arrange tea lights in under an hour.',
  },
  {
    area: 'Interactive Photo Booth & Memories Corner',
    idea: 'Rustic wooden swing frame adorned with fairy lights, floral vines, and a custom neon quote sign ("Aarav & Diya")',
    diy_rent_or_buy: 'Rent',
    cost_tier: '₹₹',
    saving_tip: 'Keep the neon sign battery-powered so it can be brought home after the wedding as a keepsake.',
  },
  {
    area: 'Lawn Walkway & Ambient Lighting',
    idea: 'Warm amber fairy light canopy across lawn trees accented by earthen terracotta diyas lining pathways',
    diy_rent_or_buy: 'Buy',
    cost_tier: '₹',
    saving_tip: 'Purchase terracotta lamps directly from Pune Kumbharwada potters in bulk at a fraction of decorator markups.',
  },
];

/**
 * 6. Attire Fixture:
 * 4 people / roles with Buy/Rent/Custom, cost tier, lead time, and tradition notes
 */
export const MOCK_ATTIRE_DATA: AttireItem[] = [
  {
    person_or_role: 'Bride (Pheras & Reception)',
    idea: 'Contemporary Paithani weave lehenga in Royal Rani Pink with antique zardosi border and pure silk dupatta',
    buy_rent_or_custom: 'Custom',
    cost_tier: '₹₹₹',
    lead_time: '6-8 weeks',
    tradition_note: 'Blends classic Maharashtra Paithani peacock motifs with a lightweight contemporary lehenga silhouette.',
  },
  {
    person_or_role: 'Groom (Baraat & Wedding)',
    idea: 'Raw silk ivory bandhgala with subtle tonal embroidery, antique gold stole, and Peshwai pagdi with brooch',
    buy_rent_or_custom: 'Custom',
    cost_tier: '₹₹',
    lead_time: '4-6 weeks',
    tradition_note: 'Traditional Pune royal groom attire paired with tailored comfort for long Vedic rituals.',
  },
  {
    person_or_role: "Bride's Mother",
    idea: 'Pure mulberry silk Nauvari or 9-yard Kanjeevaram saree in bottle green with temple gold zari border',
    buy_rent_or_custom: 'Buy',
    cost_tier: '₹₹',
    lead_time: '2-3 weeks',
    tradition_note: 'Green is deeply auspicious in Maharashtrian ceremonies representing marital prosperity and blessing.',
  },
  {
    person_or_role: "Groom's Brother / Best Man",
    idea: 'Mustard saffron raw silk kurta paired with an embroidered Nehru jacket and churidar',
    buy_rent_or_custom: 'Rent',
    cost_tier: '₹',
    lead_time: '1-2 weeks',
    tradition_note: 'Vibrant and festive color perfect for energetic Sangeet dancing and leading the Baraat procession.',
  },
];

/**
 * Complete Canned Envelopes for Maya Chat Onboarding & Re-Plan
 */
export const MOCK_CHAT_ENVELOPES: Record<string, MayaResponseEnvelope> = {
  initial: {
    reply: "Namaste! I'm Maya, your personal wedding manager at Made in Heaven. I am thrilled to help plan your celebration in Pune!\n\nLet's begin by building your dream wedding foundation. **When are you thinking of having the wedding?**",
    spoken_reply: "Namaste! I'm Maya, your wedding manager. When are you thinking of getting married?",
    quick_replies: ['December 2026', 'January 2027', 'February 2027', 'November 2026'],
    profile_updates: [],
    needs_confirmation: [],
    structured: { type: 'none', data: null },
  },
  date_selected: {
    reply: "December 2026 in Pune is simply magical! The winter evenings are crisp and delightful for outdoor garden lawns.\n\nNext, **which vibrant city will host your festivities?**",
    spoken_reply: "December in Pune is wonderful. Which city will host the wedding?",
    quick_replies: ['Pune', 'Around Pune (Lonavala/Mulshi)', 'Other'],
    profile_updates: [{ path: 'date', action: 'set', value: 'December 2026', reason: 'User selected December 2026' }],
    needs_confirmation: [],
    structured: { type: 'none', data: null },
  },
  city_selected: {
    reply: "Pune is fantastic for heritage culture, incredible food, and beautiful lawns!\n\n**Roughly how many guests are you expecting to celebrate with?**",
    spoken_reply: "Roughly how many guests are you expecting?",
    quick_replies: ['300 guests', '200 to 250 guests', '300 to 400 guests', '500+ guests'],
    profile_updates: [{ path: 'city', action: 'set', value: 'Pune', reason: 'User selected Pune' }],
    needs_confirmation: [],
    structured: { type: 'none', data: null },
  },
  guests_selected: {
    reply: "Got it! I will plan with **300 guests** for now—tell me if that changes. For 300 guests, catering and venue capacity will be our main planning anchors.\n\n**What overall budget range are you comfortable allocating in INR?**",
    spoken_reply: "I will plan with 300 guests. What overall budget range are you picturing?",
    quick_replies: ['₹8 to 15 Lakh', '₹15 to 25 Lakh', '₹25 to 40 Lakh', '₹8 Lakh maximum'],
    profile_updates: [
      { path: 'guest_count.estimate', action: 'set', value: 300, reason: 'Stored 300 guests estimate' },
      { path: 'guest_count.planning_value', action: 'set', value: 300, reason: 'Set 300 guests planning value' },
    ],
    needs_confirmation: [],
    structured: { type: 'none', data: null },
  },
  budget_selected: {
    reply: "A budget of **₹8 Lakh to ₹15 Lakh** (with a planning midpoint of **₹11,50,000**) provides ample flexibility for four thoughtfully planned events in Pune!\n\n**Which cultural traditions and ceremonies will you be embracing?**",
    spoken_reply: "₹8 to 15 Lakh is a realistic range. Which cultural traditions will you celebrate?",
    quick_replies: ['Maharashtrian & North Indian Fusion', 'Traditional Maharashtrian', 'North Indian (Punjabi)', 'Contemporary Fusion'],
    profile_updates: [
      { path: 'budget.range', action: 'set', value: { low: 800000, high: 1500000 }, reason: 'Stored budget range' },
      { path: 'budget.planning_value', action: 'set', value: 1150000, reason: 'Stored budget planning value' },
      { path: 'budget.total', action: 'set', value: 1150000, reason: 'Stored budget total' },
    ],
    needs_confirmation: [],
    structured: { type: 'none', data: null },
  },
  culture_selected: {
    reply: "A Maharashtrian & North Indian fusion celebration is the best of both worlds—joyful music, vibrant Baraat, heartfelt Vedic rituals, and delicious food.\n\n**What overall vibe or atmosphere do you picture?**",
    spoken_reply: "What overall vibe or aesthetic are you dreaming of?",
    quick_replies: ['Heritage Elegance & Joyful Fusion', 'Royal & Candlelit', 'Lively Festive Carnival', 'Simple & Intimate Sanctuary'],
    profile_updates: [{ path: 'culture', action: 'set', value: ['Maharashtrian', 'North Indian Fusion'], reason: 'Culture set' }],
    needs_confirmation: [],
    structured: { type: 'none', data: null },
  },
  vibe_selected: {
    reply: "Your foundation is complete! When something doesn't fit the plan, **how do you prefer to hear about problems—gentle, balanced, or straight to the point?**",
    spoken_reply: "How do you prefer to hear about problems—gentle, balanced, or straight to the point?",
    quick_replies: ['Gentle', 'Balanced', 'Straight to the point'],
    profile_updates: [{ path: 'vibe', action: 'set', value: 'Heritage Elegance & Joyful Fusion', reason: 'Vibe set' }],
    needs_confirmation: [],
    structured: { type: 'none', data: null },
  },
  style_selected: {
    reply: "Wonderful! I have saved your communication preference. Your entire wedding foundation is locked in! Head over to the **Plan** tab to explore your personalized budget, timeline, vendor checklist, palette, decor, and attire.",
    spoken_reply: "All set! You can now check your full plan in the Plan tab.",
    quick_replies: ['Open Wedding Plan', 'Review Budget', 'Review Timeline', 'Review Checklist'],
    profile_updates: [
      {
        path: 'communication_style.honesty_preference',
        action: 'set',
        value: 'balanced',
        reason: 'Honesty preference set',
      },
    ],
    needs_confirmation: [],
    structured: { type: 'none', data: null },
  },
};

/**
 * Returns canned structured data envelope for each plan part.
 */
export function getMockPlanEnvelope(part: 'budget' | 'timeline' | 'checklist' | 'palette' | 'decor' | 'attire'): MayaResponseEnvelope {
  switch (part) {
    case 'budget':
      return {
        reply: 'Here is your balanced wedding budget for 300 guests across four functions in Pune. Total estimated range is ₹8,00,000 to ₹15,00,000 with an initial planning target of ₹11,50,000.',
        spoken_reply: 'Here is your wedding budget breakdown in INR.',
        quick_replies: ['Looks good', 'Stretches budget?', 'Show catering details'],
        profile_updates: [],
        needs_confirmation: [],
        structured: {
          type: 'budget',
          data: MOCK_BUDGET_DATA,
        },
      };

    case 'timeline':
      return {
        reply: 'Here is your countdown timeline leading up to your December 18, 2026 wedding date in Pune, organized by milestone weeks.',
        spoken_reply: 'Here is your countdown timeline leading to December.',
        quick_replies: ['Mark urgent items', 'Show checklist', 'Looks good'],
        profile_updates: [],
        needs_confirmation: [],
        structured: {
          type: 'timeline',
          data: generateTimelineFixture(),
        },
      };

    case 'checklist':
      return {
        reply: 'Here is your prioritized vendor checklist tailored for Pune. Book high-demand services first and use our curated question guide.',
        spoken_reply: 'Here is your vendor checklist with booking deadlines.',
        quick_replies: ['Mark venue as booked', 'Check questions', 'Looks good'],
        profile_updates: [],
        needs_confirmation: [],
        structured: {
          type: 'checklist',
          data: MOCK_CHECKLIST_DATA,
        },
      };

    case 'palette':
      return {
        reply: 'Here is your 4-color palette inspired by Pune Peshwai heritage and modern celebratory warmth.',
        spoken_reply: 'Here is your curated 4-color wedding palette.',
        quick_replies: ['Love the colors', 'Swap an accent', 'Show decor ideas'],
        profile_updates: [],
        needs_confirmation: [],
        structured: {
          type: 'palette',
          data: MOCK_PALETTE_DATA,
        },
      };

    case 'decor':
      return {
        reply: 'Here are 5 key area decor recommendations emphasizing local Pune marigold sourcing, fairy lights, and reusable Mandap elements.',
        spoken_reply: 'Here are decor concepts for your 5 primary areas.',
        quick_replies: ['Love these', 'More DIY tips', 'Check budget fit'],
        profile_updates: [],
        needs_confirmation: [],
        structured: {
          type: 'decor',
          data: MOCK_DECOR_DATA,
        },
      };

    case 'attire':
      return {
        reply: 'Here are attire styling plans for the couple and immediate family, featuring traditional Paithani and bandhgala cuts.',
        spoken_reply: 'Here are outfit ideas for the couple and family.',
        quick_replies: ['Looks regal', 'Tailoring lead times', 'Show palette fit'],
        profile_updates: [],
        needs_confirmation: [],
        structured: {
          type: 'attire',
          data: MOCK_ATTIRE_DATA,
        },
      };
  }
}
