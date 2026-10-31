import { z } from 'zod';

/**
 * Zod Schemas for Maya Response Envelope & Structured Data
 * Based on Part C and Structured Data Formats in maya_prompts_v4.md
 */

// Profile update item
export const ProfileUpdateSchema = z.object({
  path: z.string().describe('Dot notation path to update in profile or budget (e.g. "budget.total", "city")'),
  action: z
    .string()
    .optional()
    .default('set')
    .transform((a) => (a === 'add' || a === 'remove' ? a : 'set')),
  value: z.any().describe('The new value to set or append'),
  reason: z.string().optional().default('').describe('Short explanation of why this update is being made'),
});
export type ProfileUpdate = z.infer<typeof ProfileUpdateSchema>;

// Needs confirmation item (especially for Voice mode or critical inputs)
export const NeedsConfirmationSchema = z.object({
  id: z.string().optional().describe('Server-assigned unique identifier for the confirmation item'),
  path: z.string().describe('Target profile path pending user confirmation'),
  value: z.any().describe('The value awaiting confirmation'),
  question: z.string().describe('Prompt to read aloud or display to confirm (e.g. "So that\'s 300 guests, right?")'),
});
export type NeedsConfirmation = z.infer<typeof NeedsConfirmationSchema>;

// Cost tier type: ₹, ₹₹, ₹₹₹
export const CostTierSchema = z.union([
  z.literal('₹'),
  z.literal('₹₹'),
  z.literal('₹₹₹'),
  z.string(),
]);

// 1. Budget Structured Data
export const BudgetItemSchema = z.object({
  category: z.string(),
  function: z.string(),
  percent: z.number(),
  estimated_low_inr: z.number(),
  estimated_high_inr: z.number(),
  notes: z.string().optional(),
});
export const BudgetDataSchema = z.union([
  z.array(BudgetItemSchema),
  z.object({
    items: z.array(BudgetItemSchema),
  }).transform((val) => val.items),
  z.object({
    budget: z.array(BudgetItemSchema),
  }).transform((val) => val.budget),
]);
export type BudgetItem = z.infer<typeof BudgetItemSchema>;

// 2. Timeline Structured Data
export const TimelineItemSchema = z.object({
  when: z.string(),
  task: z.string(),
  why_it_matters: z.string(),
  category: z.string(),
});
export const TimelineDataSchema = z.union([
  z.array(TimelineItemSchema),
  z.object({
    items: z.array(TimelineItemSchema),
  }).transform((val) => val.items),
  z.object({
    timeline: z.array(TimelineItemSchema),
  }).transform((val) => val.timeline),
]);
export type TimelineItem = z.infer<typeof TimelineItemSchema>;

// 3. Checklist Structured Data
export const ChecklistItemSchema = z.object({
  vendor_type: z.string(),
  book_by: z.string(),
  questions_to_ask: z.union([z.array(z.string()), z.string()]),
  estimated_range: z.string(),
});
export const ChecklistDataSchema = z.array(ChecklistItemSchema);
export type ChecklistItem = z.infer<typeof ChecklistItemSchema>;

// 4. Ideas Structured Data
export const IdeaItemSchema = z.object({
  title: z.string(),
  pitch: z.string(),
  cost_tier: CostTierSchema,
  why_it_fits: z.string(),
});
export const IdeasDataSchema = z.array(IdeaItemSchema);
export type IdeaItem = z.infer<typeof IdeaItemSchema>;

// 5. Palette Structured Data
export const PaletteColorSchema = z.object({
  color_name: z.string(),
  hex: z.string(),
  used_for: z.string(),
  mood: z.string(),
});
export const PaletteDataSchema = z.union([
  z.object({
    colors: z.array(PaletteColorSchema),
    why_it_fits: z.string(),
  }),
  z.array(PaletteColorSchema).transform((arr) => ({
    colors: arr,
    why_it_fits: 'Curated color palette harmonizing cultural traditions with festive celebrations.',
  })),
  z.object({
    palette: z.array(PaletteColorSchema),
    why_it_fits: z.string().optional(),
  }).transform((val) => ({
    colors: val.palette,
    why_it_fits: val.why_it_fits || 'Curated color palette harmonizing cultural traditions with festive celebrations.',
  })),
]);
export type PaletteColor = z.infer<typeof PaletteColorSchema>;

// 6. Decor Structured Data
export const DecorItemSchema = z.object({
  area: z.string(),
  idea: z.string(),
  diy_rent_or_buy: z.string(),
  cost_tier: CostTierSchema,
  saving_tip: z.string().optional(),
});
export const DecorDataSchema = z.union([
  z.array(DecorItemSchema),
  z.object({
    items: z.array(DecorItemSchema),
  }).transform((val) => val.items),
  z.object({
    decor: z.array(DecorItemSchema),
  }).transform((val) => val.decor),
]);
export type DecorItem = z.infer<typeof DecorItemSchema>;

// 7. Attire Structured Data
export const AttireItemSchema = z.object({
  person_or_role: z.string(),
  idea: z.string(),
  buy_rent_or_custom: z.string(),
  cost_tier: CostTierSchema,
  lead_time: z.string(),
  tradition_note: z.string().optional(),
});
export const AttireDataSchema = z.union([
  z.array(AttireItemSchema),
  z.object({
    items: z.array(AttireItemSchema),
  }).transform((val) => val.items),
  z.object({
    attire: z.array(AttireItemSchema),
  }).transform((val) => val.attire),
]);
export type AttireItem = z.infer<typeof AttireItemSchema>;

// 8. Reality Check Structured Data
export const RealityCheckDataSchema = z.object({
  fits_budget: z.boolean(),
  realistic_low_inr: z.number(),
  realistic_high_inr: z.number(),
  cost_drivers: z.array(z.string()),
  ways_to_close_gap: z.array(z.string()),
});

// 9. Decision Brief Structured Data (Part B: Group synthesis)
export const DecisionBriefOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  what_it_includes: z.string(),
  who_gets_what: z.array(z.object({
    member: z.string(),
    gets: z.string(),
  })),
  cost_tier: CostTierSchema,
  fits_locked_constraints: z.boolean(),
  fits_budget: z.boolean(),
});

export const DecisionBriefDataSchema = z.object({
  topic: z.string(),
  member_ideas: z.array(z.object({
    member: z.string(),
    idea: z.string(),
  })),
  common_ground: z.array(z.string()),
  conflicts: z.array(z.object({
    issue: z.string(),
    sides: z.array(z.object({
      member: z.string(),
      position: z.string(),
    })),
  })),
  options: z.array(DecisionBriefOptionSchema),
  recommendation: z.object({
    option_id: z.string(),
    why: z.string(),
  }),
});

export const KNOWN_STRUCTURED_TYPES = [
  'none',
  'budget',
  'timeline',
  'checklist',
  'ideas',
  'palette',
  'decor',
  'attire',
  'reality_check',
  'decision_brief',
] as const;

export type KnownStructuredType = (typeof KNOWN_STRUCTURED_TYPES)[number];

// Individual schemas for each known structured type
export const NoneStructuredSchema = z.object({
  type: z.literal('none'),
  data: z.null().optional().default(null),
});

export const BudgetStructuredSchema = z.object({
  type: z.literal('budget'),
  data: BudgetDataSchema,
});

export const TimelineStructuredSchema = z.object({
  type: z.literal('timeline'),
  data: TimelineDataSchema,
});

export const ChecklistStructuredSchema = z.object({
  type: z.literal('checklist'),
  data: ChecklistDataSchema,
});

export const IdeasStructuredSchema = z.object({
  type: z.literal('ideas'),
  data: IdeasDataSchema,
});

export const PaletteStructuredSchema = z.object({
  type: z.literal('palette'),
  data: PaletteDataSchema,
});

export const DecorStructuredSchema = z.object({
  type: z.literal('decor'),
  data: DecorDataSchema,
});

export const AttireStructuredSchema = z.object({
  type: z.literal('attire'),
  data: AttireDataSchema,
});

export const RealityCheckStructuredSchema = z.object({
  type: z.literal('reality_check'),
  data: RealityCheckDataSchema,
});

export const DecisionBriefStructuredSchema = z.object({
  type: z.literal('decision_brief'),
  data: DecisionBriefDataSchema,
});

export const KnownStructuredDataSchema = z.discriminatedUnion('type', [
  NoneStructuredSchema,
  BudgetStructuredSchema,
  TimelineStructuredSchema,
  ChecklistStructuredSchema,
  IdeasStructuredSchema,
  PaletteStructuredSchema,
  DecorStructuredSchema,
  AttireStructuredSchema,
  RealityCheckStructuredSchema,
  DecisionBriefStructuredSchema,
]);

/**
 * StructuredDataSchema:
 * - Strictly validates every known structured type (budget, timeline, checklist, ideas, palette, decor, attire, reality_check, decision_brief, none).
 * - For an unknown type only, accepts it as a generic payload { type: string, data: any }.
 * - If a known type fails validation, validation fails so the caller can retry with errors.
 */
export const StructuredDataSchema = z
  .object({
    type: z.string().default('none'),
    data: z.any().nullable().optional().default(null),
  })
  .superRefine((val, ctx) => {
    if ((KNOWN_STRUCTURED_TYPES as readonly string[]).includes(val.type)) {
      const res = KnownStructuredDataSchema.safeParse(val);
      if (!res.success) {
        for (const issue of res.error.issues) {
          ctx.addIssue({
            code: 'custom',
            message: issue.message,
            path: issue.path,
          });
        }
      }
    }
  });

export type StructuredData = z.infer<typeof StructuredDataSchema>;

/**
 * Complete Part C Maya Response Envelope Schema
 */
export const MayaResponseEnvelopeSchema = z.object({
  reply: z.string().describe("Full reply for the screen, in the speaker's language."),
  spoken_reply: z.string().nullable().optional().describe('Short reply for text-to-speech, or null in text mode.'),
  quick_replies: z
    .preprocess((val) => (val === null || val === undefined ? [] : val), z.array(z.string()).default([]))
    .describe('Quick example answers and next actions.'),
  profile_updates: z
    .preprocess((val) => (val === null || val === undefined ? [] : val), z.array(ProfileUpdateSchema).default([])),
  needs_confirmation: z
    .preprocess((val) => (val === null || val === undefined ? [] : val), z.array(NeedsConfirmationSchema).default([])),
  structured: z.preprocess(
    (val) => (val === null || val === undefined ? { type: 'none', data: null } : val),
    StructuredDataSchema.default({ type: 'none', data: null })
  ),
});

export type MayaResponseEnvelope = z.infer<typeof MayaResponseEnvelopeSchema>;
