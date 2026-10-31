import { Metadata } from 'next';
import { THEMED_LANDING_CONFIGS } from '@/config/content';
import { ThemedLandingView } from '@/components/landing/ThemedLandingView';

export const metadata: Metadata = {
  title: 'Milestone Birthdays Planned Together | Made in Heaven',
  description: 'Plan milestone birthdays (1st, 18th, 50th, 60th) with Maya. Morning puja, evening party, themes, cake, entertainment, and return gifts.',
};

export default function BirthdaysPage() {
  return <ThemedLandingView config={THEMED_LANDING_CONFIGS.birthday} />;
}

