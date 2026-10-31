import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

describe('Plan tabs celebration-neutral wording verification', () => {
  const planComponents = [
    'src/components/plan/AttireTab.tsx',
    'src/components/plan/BudgetTab.tsx',
    'src/components/plan/ChecklistTab.tsx',
    'src/components/plan/DecorTab.tsx',
    'src/components/plan/PaletteTab.tsx',
    'src/components/plan/TimelineTab.tsx',
    'src/components/plan/EmptyStateCard.tsx',
    'src/components/plan/ReplanPanel.tsx',
  ];

  it('contains no hardcoded "wedding", "bride", "groom", "mandap", or "baraat" in visible text of plan components', () => {
    for (const file of planComponents) {
      const fullPath = path.resolve(process.cwd(), file);
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');

      lines.forEach((line, idx) => {
        // Strip TS imports and variable/prop names
        if (
          line.includes('import ') ||
          line.includes('weddingDate?:') ||
          line.includes('weddingDate =') ||
          line.includes('weddingDate,') ||
          line.includes('if (!weddingDate)') ||
          line.includes('new Date(weddingDate)') ||
          line.includes('[weddingDate]') ||
          line.includes('{weddingDate}') ||
          line.includes('plan: WeddingPlan') ||
          line.includes('as WeddingPlan')
        ) {
          return;
        }

        // Test user-facing text
        const hasBannedWord = /(wedding|bride|groom|mandap|baraat)/i.test(line);
        assert.strictEqual(
          hasBannedWord,
          false,
          `Found celebration-biased word on line ${idx + 1} of ${file}: "${line.trim()}"`
        );
      });
    }
  });

  it('verifies PlanPage user-facing strings are celebration-neutral', () => {
    const fullPath = path.resolve(process.cwd(), 'src/app/plan/page.tsx');
    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, idx) => {
      if (
        line.includes('import ') ||
        line.includes('weddingDate=') ||
        line.includes('WeddingPlan')
      ) {
        return;
      }
      const hasBannedWord = /(wedding|bride|groom|mandap|baraat)/i.test(line);
      assert.strictEqual(
        hasBannedWord,
        false,
        `Found celebration-biased word on line ${idx + 1} of src/app/plan/page.tsx: "${line.trim()}"`
      );
    });
  });
});
