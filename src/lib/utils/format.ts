import { EventProfile, PrivateBudget } from '@/types/firestore';

/**
 * Formats a number in Indian Rupees (INR) using Indian grouping:
 * e.g. 1500000 -> "₹15,00,000"
 */
export function formatINR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount) || amount === 0) {
    return '₹0';
  }

  const rounded = Math.round(amount);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(rounded);
}

/**
 * Formats an amount in INR with Indian descriptive units (Lakhs / Crores)
 * e.g. 1500000 -> "₹15 Lakhs", 25000000 -> "₹2.5 Crores"
 */
export function formatINRLakhs(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount) || amount === 0) {
    return '₹0';
  }

  const abs = Math.abs(amount);
  if (abs >= 10000000) {
    const cr = (amount / 10000000).toFixed(1).replace(/\.0$/, '');
    return `₹${cr} Crore${Number(cr) > 1 ? 's' : ''}`;
  }
  if (abs >= 100000) {
    const lk = (amount / 100000).toFixed(1).replace(/\.0$/, '');
    return `₹${lk} Lakh${Number(lk) > 1 ? 's' : ''}`;
  }

  return formatINR(amount);
}

export interface OnboardingStatus {
  completedCount: number;
  totalRequired: number;
  percent: number;
  isCoreComplete: boolean; // All 6 required fields filled
  isFullyComplete: boolean; // All 6 + communication style
  missingFields: string[];
  fields: {
    date: boolean;
    city: boolean;
    guestCount: boolean;
    budget: boolean;
    culture: boolean;
    vibe: boolean;
    communicationStyle: boolean;
  };
}

/**
 * Evaluates the wedding profile against the 6 required onboarding fields + communication style
 */
export function getOnboardingStatus(
  profile: EventProfile | null | undefined,
  budget: PrivateBudget | null | undefined
): OnboardingStatus {
  const fields = {
    date: Boolean(profile?.date && profile.date.trim().length > 0),
    city: Boolean(profile?.city && profile.city.trim().length > 0),
    guestCount: Boolean(
      (profile?.guest_count?.estimate && profile.guest_count.estimate > 0) ||
      (profile?.guest_count?.planning_value && profile.guest_count.planning_value > 0) ||
      (profile?.guest_count?.range?.high && profile.guest_count.range.high > 0)
    ),
    budget: Boolean(
      (budget && budget.total && budget.total > 0) ||
      (budget && budget.planning_value && budget.planning_value > 0) ||
      (budget && budget.range?.high && budget.range.high > 0)
    ),
    culture: Boolean(profile?.culture && profile.culture.length > 0),
    vibe: Boolean(profile?.vibe && profile.vibe.trim().length > 0),
    communicationStyle: Boolean(profile?.communication_style?.honesty_preference),
  };

  const eventType = profile?.eventType || 'wedding';
  const dateLabel = eventType === 'birthday' ? 'Birthday Date' : eventType === 'community' ? 'Event Date' : 'Wedding Date / Season';
  const cityLabel = eventType === 'community' ? 'Location / Society Grounds' : 'City';
  const guestLabel = eventType === 'community' ? 'Expected Footfall' : 'Guest Count';
  const vibeLabel = eventType === 'birthday' ? 'Birthday Theme & Milestone' : eventType === 'community' ? 'Occasion & Setup Style' : 'Wedding Vibe & Aesthetic';

  const coreFields = [
    { key: 'date', label: dateLabel, done: fields.date },
    { key: 'city', label: cityLabel, done: fields.city },
    { key: 'guest_count', label: guestLabel, done: fields.guestCount },
    { key: 'budget', label: 'Budget (in INR)', done: fields.budget },
    { key: 'culture', label: 'Culture & Traditions', done: fields.culture },
    { key: 'vibe', label: vibeLabel, done: fields.vibe },
  ];

  const missingFields = coreFields.filter((f) => !f.done).map((f) => f.label);
  const completedCount = coreFields.filter((f) => f.done).length;
  const isCoreComplete = completedCount === coreFields.length;
  const isFullyComplete = isCoreComplete && fields.communicationStyle;

  return {
    completedCount,
    totalRequired: coreFields.length,
    percent: Math.round((completedCount / coreFields.length) * 100),
    isCoreComplete,
    isFullyComplete,
    missingFields,
    fields,
  };
}

/**
 * Computes months until the wedding based on profile date.
 * If only a month and year is known, uses the 1st of that month and marks it approximate.
 * Returns:
 *   - number (e.g. 5.8 or 6) if exact date is known
 *   - string (e.g. "1.4 (approximate)" or "6 (approximate)") if approximate
 *   - null if date is not specified or unparseable
 */
export function computeMonthsUntilWedding(
  profileDate: string | null | undefined,
  today: Date = new Date()
): string | number | null {
  if (!profileDate || typeof profileDate !== 'string') return null;
  const trimmed = profileDate.trim();
  if (!trimmed) return null;

  const monthMap: Record<string, number> = {
    jan: 0, january: 0,
    feb: 1, february: 1,
    mar: 2, march: 2,
    apr: 3, april: 3,
    may: 4,
    jun: 5, june: 5,
    jul: 6, july: 6,
    aug: 7, august: 7,
    sep: 8, sept: 8, september: 8,
    oct: 9, october: 9,
    nov: 10, november: 10,
    dec: 11, december: 11,
  };

  const seasonMap: Record<string, number> = {
    spring: 2,   // March
    summer: 4,   // May
    monsoon: 6,  // July
    autumn: 8,   // September
    fall: 8,     // September
    winter: 11,  // December
    early: 0,    // January
    mid: 5,      // June
    late: 10,    // November
  };

  let targetYear: number | null = null;
  let targetMonth: number | null = null;
  let targetDay: number | null = null;
  let isApproximate = false;

  // 1. Standard ISO YYYY-MM-DD
  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    targetYear = parseInt(isoMatch[1], 10);
    targetMonth = parseInt(isoMatch[2], 10) - 1;
    targetDay = parseInt(isoMatch[3], 10);
    isApproximate = false;
  }

  // 2. YYYY-MM
  const yearMonthMatch = !targetYear && trimmed.match(/^(\d{4})-(\d{1,2})$/);
  if (yearMonthMatch) {
    targetYear = parseInt(yearMonthMatch[1], 10);
    targetMonth = parseInt(yearMonthMatch[2], 10) - 1;
    targetDay = 1;
    isApproximate = true;
  }

  // 3. MM/YYYY
  const slashMonthYearMatch = !targetYear && trimmed.match(/^(\d{1,2})\/(\d{4})$/);
  if (slashMonthYearMatch) {
    targetMonth = parseInt(slashMonthYearMatch[1], 10) - 1;
    targetYear = parseInt(slashMonthYearMatch[2], 10);
    targetDay = 1;
    isApproximate = true;
  }

  // 4. DD/MM/YYYY or MM/DD/YYYY
  const fullSlashMatch = !targetYear && trimmed.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (fullSlashMatch) {
    targetYear = parseInt(fullSlashMatch[3], 10);
    let d = parseInt(fullSlashMatch[1], 10);
    let m = parseInt(fullSlashMatch[2], 10) - 1;
    if (d <= 12 && m > 11) {
      const temp = d;
      d = m + 1;
      m = temp - 1;
    }
    targetDay = d;
    targetMonth = m;
    isApproximate = false;
  }

  // 5. Natural language dates (month names, seasons, year, optional day)
  if (targetYear === null) {
    const yearMatch = trimmed.match(/\b(20\d{2})\b/);
    if (yearMatch) {
      targetYear = parseInt(yearMatch[1], 10);
    }

    const dayMatch = trimmed.match(/\b(\d{1,2})(?:st|nd|rd|th)?\b/);
    if (dayMatch && parseInt(dayMatch[1], 10) <= 31 && (!yearMatch || dayMatch[0] !== yearMatch[1])) {
      targetDay = parseInt(dayMatch[1], 10);
    }

    const lower = trimmed.toLowerCase();
    for (const [mName, mIdx] of Object.entries(monthMap)) {
      const regex = new RegExp(`\\b${mName}\\b`, 'i');
      if (regex.test(lower)) {
        targetMonth = mIdx;
        break;
      }
    }

    if (targetMonth === null) {
      for (const [sName, sMonth] of Object.entries(seasonMap)) {
        const regex = new RegExp(`\\b${sName}\\b`, 'i');
        if (regex.test(lower)) {
          targetMonth = sMonth;
          isApproximate = true;
          break;
        }
      }
    }

    if (targetDay === null && targetMonth !== null && targetYear !== null) {
      targetDay = 1;
      isApproximate = true;
    } else if (targetDay !== null && targetMonth !== null && targetYear !== null) {
      isApproximate = false;
    }
  }

  // Fallback: Date.parse
  if (targetYear === null || targetMonth === null || targetDay === null) {
    const parsed = Date.parse(trimmed);
    if (!isNaN(parsed)) {
      const d = new Date(parsed);
      targetYear = d.getFullYear();
      targetMonth = d.getMonth();
      targetDay = d.getDate();
      isApproximate = false;
    }
  }

  if (targetYear === null || targetMonth === null || targetDay === null) {
    return null;
  }

  const targetDate = new Date(targetYear, targetMonth, targetDay);
  const diffMs = targetDate.getTime() - today.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  const rawMonths = diffDays / 30.4375;
  const months = rawMonths <= 0 ? 0 : Math.round(rawMonths * 10) / 10;

  return isApproximate ? `${months} (approximate)` : months;
}

/**
 * Parses ranges like "400-500 guests" or "Rs 60-80 lakh" or { low: 400, high: 500 }
 * into low, high, and planning_value (the midpoint).
 */
export function parseRangeAndPlanningValue(
  value: any,
  isCurrency: boolean = false
): { low: number; high: number; planning_value: number } | null {
  if (value === null || value === undefined) return null;

  // 1. Direct object { low, high, planning_value? }
  if (typeof value === 'object') {
    const rawLow = value.low ?? value.min ?? value.range?.low ?? value.range?.min;
    const rawHigh = value.high ?? value.max ?? value.range?.high ?? value.range?.max;
    if (rawLow !== undefined && rawHigh !== undefined) {
      const low = Number(rawLow);
      const high = Number(rawHigh);
      if (!isNaN(low) && !isNaN(high) && low > 0 && high >= low) {
        const planning_value = typeof value.planning_value === 'number'
          ? value.planning_value
          : Math.round((low + high) / 2);
        return { low, high, planning_value };
      }
    }
    return null;
  }

  // 2. String representation
  if (typeof value === 'string') {
    const str = value.trim();
    if (!str) return null;

    const hasGuestKeywords = /\b(guest|guests|people|pax|attendee|attendees|invitee|invitees|person|persons)\b/i.test(str);
    const hasRupeeSymbols = /(?:rs\.?|inr|₹)/i.test(str);
    const hasRupeeWords = /\b(lakh|lakhs|lac|lacs|crore|crores|cr)\b/i.test(str);
    const hasCurrencyIndicators = hasRupeeSymbols || hasRupeeWords;

    // Currency parsing requires rupee units/symbols and must NOT contain guest keywords
    if (isCurrency) {
      if (!hasCurrencyIndicators || hasGuestKeywords) {
        return null;
      }
    } else {
      // Guest count parsing must NOT be an explicit currency expression without guest context
      if (hasCurrencyIndicators && !hasGuestKeywords) {
        return null;
      }
    }

    // Clean out grouping commas within numbers (e.g. "50,00,000")
    const cleanStr = str.replace(/(\d),(\d)/g, '$1$2');

    // Match "between NUM1 [unit1] (- or to) NUM2 [unit2]"
    const match = cleanStr.match(
      /(?:between\s+)?(?:rs\.?|inr|₹)?\s*(\d+(?:\.\d+)?)\s*(lakh|lakhs|lac|lacs|crore|crores|cr|k)?\s*(?:-|–|—|to)\s*(?:rs\.?|inr|₹)?\s*(\d+(?:\.\d+)?)\s*(lakh|lakhs|lac|lacs|crore|crores|cr|k)?\b/i
    );

    if (match) {
      const rawLow = parseFloat(match[1]);
      const rawHigh = parseFloat(match[3]);
      let unit1 = (match[2] || '').toLowerCase();
      const unit2 = (match[4] || '').toLowerCase();

      // If unit2 is provided but unit1 is not, unit1 inherits unit2 (e.g. "60-80 lakh")
      if (!unit1 && unit2) {
        unit1 = unit2;
      }

      const getMultiplier = (unit: string): number => {
        if (unit.startsWith('lakh') || unit.startsWith('lac')) return 100000;
        if (unit.startsWith('cr') || unit.startsWith('crore')) return 10000000;
        if (unit === 'k') return 1000;
        return 1;
      };

      let mult1 = getMultiplier(unit1);
      let mult2 = getMultiplier(unit2);

      // If isCurrency is true and neither number had explicit lakh/crore units, check full string
      if (isCurrency && mult1 === 1 && mult2 === 1) {
        if (/\b(lakh|lakhs|lac|lacs)\b/i.test(str)) {
          mult1 = 100000;
          mult2 = 100000;
        } else if (/\b(crore|crores|cr)\b/i.test(str)) {
          mult1 = 10000000;
          mult2 = 10000000;
        } else if (!hasRupeeSymbols) {
          // If neither unit words nor rupee symbols exist, reject for currency
          return null;
        }
      }

      const low = Math.round(rawLow * mult1);
      const high = Math.round(rawHigh * mult2);

      if (!isNaN(low) && !isNaN(high) && low > 0 && high >= low) {
        const planning_value = Math.round((low + high) / 2);
        return { low, high, planning_value };
      }
    }
  }

  return null;
}
/**
 * Reads a wedding date like "2026-12-18" as a LOCAL calendar day.
 * new Date("2026-12-18") treats it as midnight UTC, which shows as
 * 17 December in the Americas. This keeps it 18 December everywhere.
 */
export function parseWeddingDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const m = value.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/** "2026-12-18" -> "18 December 2026" */
export function formatWeddingDate(value: string | null | undefined): string {
  const d = parseWeddingDate(value);
  if (!d) return value || '';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Whole days from today until the wedding (0 if it has passed) */
export function daysUntilWedding(
  value: string | null | undefined,
  today: Date = new Date()
): number | null {
  const d = parseWeddingDate(value);
  if (!d) return null;
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.max(0, Math.round((d.getTime() - start.getTime()) / 86400000));
}

