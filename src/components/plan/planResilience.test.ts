import { describe, it } from 'node:test';
import assert from 'node:assert';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { BudgetTab } from '@/components/plan/BudgetTab';
import { TimelineTab } from '@/components/plan/TimelineTab';
import { ChecklistTab } from '@/components/plan/ChecklistTab';
import { PaletteTab } from '@/components/plan/PaletteTab';
import { DecorTab } from '@/components/plan/DecorTab';
import { AttireTab } from '@/components/plan/AttireTab';
import { PlanSummaryStrip } from '@/components/plan/PlanSummaryStrip';
import { ReplanPanel } from '@/components/plan/ReplanPanel';
import { WeddingPlan } from '@/types/firestore';

describe('Plan Resilience: Missing, Partial, and Legacy Data', () => {
  const dummyFn = () => {};
  const dummyAsyncFn = async () => {};

  it('renders BudgetTab when budgetRange is null and totalBudget is null without throwing', () => {
    // This exact condition crashed production when a Home had budgetData but no range
    assert.doesNotThrow(() => {
      const html = renderToString(
        React.createElement(BudgetTab, {
          budgetData: [
            {
              category: 'Decor & Florals',
              function: 'Main Event',
              percent: 100,
              estimated_low_inr: 50000,
              estimated_high_inr: 80000,
              notes: 'Stage florals',
            },
          ],
          cateringBreakdown: [],
          totalBudget: undefined,
          budgetRange: undefined,
          onGenerate: dummyFn,
          isLoading: false,
        })
      );
      assert.ok(html.includes('Budget Breakdown'));
      assert.ok(html.includes('Flexible / Not set'));
    });
  });

  it('renders BudgetTab with empty plan data', () => {
    assert.doesNotThrow(() => {
      const html = renderToString(
        React.createElement(BudgetTab, {
          budgetData: null,
          cateringBreakdown: [],
          totalBudget: undefined,
          budgetRange: undefined,
          onGenerate: dummyFn,
          isLoading: false,
        })
      );
      assert.ok(html.includes('No Budget Plan Generated Yet'));
    });
  });

  it('renders TimelineTab with completely missing dates (undefined / null / invalid strings)', () => {
    assert.doesNotThrow(() => {
      const html = renderToString(
        React.createElement(TimelineTab, {
          timelineData: null,
          weddingDate: undefined,
          onGenerate: dummyFn,
        })
      );
      assert.ok(html.includes('No Timeline Generated Yet'));
    });

    assert.doesNotThrow(() => {
      const html = renderToString(
        React.createElement(TimelineTab, {
          timelineData: [
            {
              when: 'Month 1',
              task: 'Initial booking',
              why_it_matters: 'Lead times',
              category: 'Venue',
            },
          ],
          weddingDate: 'invalid-date-string-1234',
          onGenerate: dummyFn,
        })
      );
      assert.ok(html.includes('Initial booking'));
    });
  });

  it('renders ChecklistTab with empty bookedVendors and string questions_to_ask', () => {
    assert.doesNotThrow(() => {
      const html = renderToString(
        React.createElement(ChecklistTab, {
          checklistData: [
            {
              vendor_type: 'Florist',
              book_by: '2 months out',
              questions_to_ask: 'Single question string instead of array' as any,
              estimated_range: '₹20,000',
            },
          ],
          bookedVendors: {} as any,
          onToggleBooked: dummyAsyncFn,
          onGenerate: dummyFn,
        })
      );
      assert.ok(html.includes('Florist'));
      assert.ok(html.includes('Single question string'));
    });
  });

  it('renders PaletteTab, DecorTab, and AttireTab with null or partial data', () => {
    assert.doesNotThrow(() => {
      renderToString(React.createElement(PaletteTab, { paletteData: null, onGenerate: dummyFn }));
      renderToString(React.createElement(DecorTab, { decorData: null, onGenerate: dummyFn }));
      renderToString(React.createElement(AttireTab, { attireData: null, onGenerate: dummyFn }));
    });

    assert.doesNotThrow(() => {
      const palHtml = renderToString(
        React.createElement(PaletteTab, {
          paletteData: { colors: [], why_it_fits: 'Test' },
          onGenerate: dummyFn,
        })
      );
      assert.ok(palHtml.includes('No Color Palette Generated Yet'));

      const decHtml = renderToString(
        React.createElement(DecorTab, {
          decorData: [
            {
              area: 'Stage',
              idea: 'Marigolds',
              diy_rent_or_buy: 'Rent',
              cost_tier: '₹',
              saving_tip: 'Local sourcing',
            },
          ],
          onGenerate: dummyFn,
        })
      );
      assert.ok(decHtml.includes('Marigolds'));

      const attHtml = renderToString(
        React.createElement(AttireTab, {
          attireData: [
            {
              person_or_role: 'Host',
              idea: 'Silk Kurta',
              buy_rent_or_custom: 'Buy',
              cost_tier: '₹₹',
              lead_time: '2 weeks',
              tradition_note: '',
            },
          ],
          onGenerate: dummyFn,
        })
      );
      assert.ok(attHtml.includes('Silk Kurta'));
    });
  });

  it('renders PlanSummaryStrip for brand-new Home, legacy Home without eventType, and partial plan', () => {
    // Brand new home: all nulls
    assert.doesNotThrow(() => {
      const html = renderToString(
        React.createElement(PlanSummaryStrip, {
          weddingDate: null,
          totalBudget: null,
          budgetRange: null,
          guestCount: null,
          city: null,
          plan: null,
          onClearPlan: dummyAsyncFn,
        })
      );
      assert.ok(html.includes('COUNTDOWN'));
    });

    // Partial plan with non-ISO date string (e.g., '31 october 2026')
    assert.doesNotThrow(() => {
      const partialPlan: WeddingPlan = {
        budget: null,
        timeline: null,
        checklist: null,
        palette: null,
        decor: null,
        attire: null,
        bookedVendors: {},
        version: 1,
        updatedAt: Date.now(),
      };
      const html = renderToString(
        React.createElement(PlanSummaryStrip, {
          weddingDate: '31 october 2026',
          totalBudget: 0,
          budgetRange: null,
          guestCount: 40,
          city: 'hyderabad',
          plan: partialPlan,
          onClearPlan: dummyAsyncFn,
        })
      );
      assert.ok(html.includes('October'));
      assert.ok(html.includes('40'));
    });
  });

  it('renders ReplanPanel safely with null or zero initialBudget and initialGuests', () => {
    assert.doesNotThrow(() => {
      const html = renderToString(
        React.createElement(ReplanPanel, {
          initialGuests: 0 as any,
          initialBudget: 0 as any,
          isOpen: true,
          onClose: dummyFn,
          onApplyReplan: dummyAsyncFn,
          isApplying: false,
        })
      );
      assert.ok(html.includes('COUPLE RE-PLAN CONTROLS'));
    });
  });
});
