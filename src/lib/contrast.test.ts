import assert from 'node:assert/strict';
import { test } from 'node:test';

function getLuminance(hex: string): number {
  const cleanHex = hex.replace('#', '');
  const rgb = [0, 2, 4].map((i) => parseInt(cleanHex.substring(i, i + 2), 16) / 255);
  const a = rgb.map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = getLuminance(hex1);
  const l2 = getLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

const CREAM = '#FCFBF8';
const BEIGE = '#F1EDE8';
const WHITE = '#FFFFFF';

// Tokens from globals.css
export const ACCENT_TOKENS = {
  wedding: {
    primary: '#A8603E',
    dark: '#94512F',
  },
  birthday: {
    primary: '#9B4A6A',
    dark: '#863A57',
  },
  community: {
    primary: '#A35700',
    dark: '#8E4A00',
  },
};

test('WCAG AA contrast: dark accent tokens must exceed 4.5:1 on cream and beige for small text and labels', () => {
  for (const [type, tokens] of Object.entries(ACCENT_TOKENS)) {
    const onCream = getContrastRatio(tokens.dark, CREAM);
    const onBeige = getContrastRatio(tokens.dark, BEIGE);
    assert.ok(
      onCream >= 4.5,
      `${type} dark token ${tokens.dark} on cream (${CREAM}) is ${onCream.toFixed(2)}, expected >= 4.5:1`
    );
    assert.ok(
      onBeige >= 4.5,
      `${type} dark token ${tokens.dark} on beige (${BEIGE}) is ${onBeige.toFixed(2)}, expected >= 4.5:1`
    );
  }
});

test('WCAG AA contrast: primary accent tokens with white text must exceed 4.5:1 for button backgrounds', () => {
  for (const [type, tokens] of Object.entries(ACCENT_TOKENS)) {
    const whiteOnPrimary = getContrastRatio(WHITE, tokens.primary);
    assert.ok(
      whiteOnPrimary >= 4.5,
      `${type} primary token ${tokens.primary} with white text (${WHITE}) is ${whiteOnPrimary.toFixed(2)}, expected >= 4.5:1`
    );
  }
});

